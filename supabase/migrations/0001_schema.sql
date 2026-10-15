-- Wattle Health schema v0.1 (DATA-MODEL.md, PRD section 7 and R11).
-- FHIR AU Provider Directory shape: Organization -> Location, Practitioner -> PractitionerRole.
-- Every attribute is an observation {value, tier, source, observed_at, expires_at}; nothing is stored without a source.
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- sources (adapter registry)
create table if not exists sources (
  id            text primary key,                       -- e.g. 'ahpra_extract', 'abr_bulk', 'claim'
  name          text not null,
  url           text,
  kind          text not null check (kind in ('register','open_data','api','licensed','scrape','declared','platform')),
  legal_basis   text not null check (length(trim(legal_basis)) > 0),  -- an adapter without one does not run
  cadence       text,
  terms_url     text,
  robots_ok     boolean,
  contact       text,
  last_run_at   timestamptz,
  record_count  integer,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- organisations (keyed by ABN)
create table if not exists organisations (
  id            uuid primary key default gen_random_uuid(),
  abn           text unique check (abn ~ '^[0-9]{11}$'),
  legal_name    text,
  trading_names text[] not null default '{}',
  org_type      text check (org_type in ('practice','hospital_operator','accho','ngo','pharmacy_chain','corporate_gp','government','sole_trader')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- locations (a place a service is delivered)
create table if not exists locations (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid references organisations(id),
  nhsd_id          text unique,
  hpio             text,
  google_place_id  text unique,                          -- join key only; never stored content
  gnaf_pid         text,
  name             text,
  address_line     text,
  suburb           text,
  state            text check (state in ('NSW','VIC','QLD','WA','SA','TAS','ACT','NT')),
  postcode         text check (postcode ~ '^[0-9]{4}$'),
  geo              geography(point, 4326),
  sa2              text,
  lga              text,
  phn              text,
  mmm              smallint check (mmm between 1 and 7),
  location_type    text check (location_type in ('general_practice','hospital_public','hospital_private','day_hospital','accho',
                     'community_health','pharmacy','pathology_collection','imaging','headspace','mmh_centre','ucc','aged_care',
                     'ndis_provider','other')),
  telehealth_only  boolean not null default false,       -- excluded from distance sort
  status           text not null default 'unverified' check (status in ('open','closed','unverified')),
  closed_at        date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists locations_geo_idx on locations using gist (geo);
create index if not exists locations_state_mmm_idx on locations (state, mmm);
create index if not exists locations_postcode_idx on locations (postcode);
create index if not exists locations_org_idx on locations (organisation_id);

-- ---------------------------------------------------------------- practitioners (exist because a register says so)
create table if not exists practitioners (
  id                       uuid primary key default gen_random_uuid(),
  ahpra_number             text unique check (ahpra_number ~ '^[A-Z]{3}[0-9]{10}$'),
  nasrhp_id                text unique,                  -- namespaced, e.g. 'essa:12345'
  given_name               text,
  family_name              text,
  display_name             text,
  profession               text not null,
  specialties              text[] not null default '{}', -- Ahpra-recognised specialties only
  endorsements             text[] not null default '{}',
  registration_status      text check (registration_status in ('registered','suspended','cancelled','non-practising','limited','provisional')),
  registration_conditions  boolean,                      -- true/false only; the text is never stored
  register_url             text,
  register_checked_at      timestamptz,
  synthetic                boolean not null default false,
  claimed_by               uuid,
  claimed_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  check (ahpra_number is not null or nasrhp_id is not null or synthetic)
);
create index if not exists practitioners_family_profession_idx on practitioners (lower(family_name), profession);
create index if not exists practitioners_specialties_idx on practitioners using gin (specialties);

-- ---------------------------------------------------------------- practitioner roles (practitioner x location)
create table if not exists practitioner_roles (
  id                        uuid primary key default gen_random_uuid(),
  practitioner_id           uuid not null references practitioners(id) on delete cascade,
  location_id               uuid not null references locations(id) on delete cascade,
  medicare_provider_number  text,                        -- only if provider-declared or practice-published
  fee_policy                text check (fee_policy in ('bulk_bills_all','bulk_bills_concession','gap','private','ndis','unknown')),
  referral_required         boolean,
  "primary"                 boolean not null default false,
  booking                   jsonb,                       -- {via, url?, phone?, platform_id?, note?}
  created_at                timestamptz not null default now(),
  unique (practitioner_id, location_id)
);
create index if not exists practitioner_roles_location_idx on practitioner_roles (location_id);

-- ---------------------------------------------------------------- observations (the attribute envelope)
create table if not exists observations (
  id           bigint generated always as identity primary key,
  entity_type  text not null check (entity_type in ('practitioner','practitioner_role','location','organisation')),
  entity_id    uuid not null,
  field        text not null,                            -- e.g. 'languages', 'capacity', 'fees', 'telehealth', 'phone'
  value        jsonb not null,
  tier         text not null check (tier in ('register','declared','found')),
  source_id    text not null references sources(id),
  source_url   text,
  observed_at  timestamptz not null,
  expires_at   timestamptz,                              -- capacity/fees 90 d, hours/phone 365 d
  created_at   timestamptz not null default now()
);
create index if not exists observations_entity_field_idx on observations (entity_type, entity_id, field, observed_at desc);
create index if not exists observations_source_idx on observations (source_id, observed_at desc);

-- Display picks the highest unexpired tier, ties to the most recent.
create or replace view observations_current as
select distinct on (entity_type, entity_id, field)
       entity_type, entity_id, field, value, tier, source_id, source_url, observed_at, expires_at
from observations
where expires_at is null or expires_at > now()
order by entity_type, entity_id, field,
         case tier when 'register' then 0 when 'declared' then 1 else 2 end, observed_at desc;

-- ---------------------------------------------------------------- claims (provider side; PRD section 9)
create table if not exists claims (
  id               uuid primary key default gen_random_uuid(),
  practitioner_id  uuid not null references practitioners(id) on delete cascade,
  user_id          uuid,
  method           text not null check (method in ('practice_email','posted_code','pca')),
  status           text not null default 'pending' check (status in ('pending','verified','rejected','revoked')),
  evidence         jsonb,                                -- never the register text; the lookup is a single personal-use query
  created_at       timestamptz not null default now(),
  verified_at      timestamptz
);
create index if not exists claims_practitioner_idx on claims (practitioner_id, status);

-- ---------------------------------------------------------------- coverage (R11; public honesty report, refreshed nightly)
create materialized view if not exists coverage as
with p as (
  select pr.id, unnest(pr.specialties) as specialty
  from practitioners pr
  where pr.registration_status = 'registered' and not pr.synthetic
),
loc as (
  select r.practitioner_id, l.state, l.mmm
  from practitioner_roles r join locations l on l.id = r.location_id
  where r."primary" or not exists (select 1 from practitioner_roles r2 where r2.practitioner_id = r.practitioner_id and r2."primary")
),
obs as (
  select entity_id,
         bool_or(field = 'phone')                                                  as has_phone,
         bool_or(field = 'hours')                                                  as has_hours,
         bool_or(field in ('fee_policy','fees'))                                   as has_fee_tier,
         bool_or(field = 'capacity' and observed_at > now() - interval '90 days')  as has_capacity_fresh_90d
  from observations_current where entity_type = 'practitioner' group by entity_id
)
select p.specialty,
       coalesce(loc.state, 'unresolved') as state,
       loc.mmm,
       count(*)                                                       as on_register,
       count(loc.practitioner_id)                                     as resolved_to_location,
       count(*) filter (where obs.has_phone)                          as with_phone,
       count(*) filter (where obs.has_hours)                          as with_hours,
       count(*) filter (where obs.has_fee_tier)                       as with_fee_tier,
       count(*) filter (where obs.has_capacity_fresh_90d)             as with_capacity_fresh_90d,
       count(*) filter (where c.id is not null)                       as claimed,
       now()                                                          as computed_at
from p
left join loc on loc.practitioner_id = p.id
left join obs on obs.entity_id = p.id
left join claims c on c.practitioner_id = p.id and c.status = 'verified'
group by p.specialty, coalesce(loc.state, 'unresolved'), loc.mmm;
create unique index if not exists coverage_key_idx on coverage (specialty, state, mmm);

-- ---------------------------------------------------------------- row level security
alter table sources            enable row level security;
alter table organisations      enable row level security;
alter table locations          enable row level security;
alter table practitioners      enable row level security;
alter table practitioner_roles enable row level security;
alter table observations       enable row level security;
alter table claims             enable row level security;
-- No table policies: base tables are reachable only through the service role (pipeline) and the
-- published views below. The anon/authenticated roles read the views only.
revoke all on sources, organisations, locations, practitioners, practitioner_roles, observations, claims from anon, authenticated;

create or replace view published_practitioners with (security_invoker = false) as
select pr.id, pr.ahpra_number, pr.display_name, pr.profession, pr.specialties, pr.endorsements,
       pr.registration_status, pr.registration_conditions, pr.register_url, pr.register_checked_at, pr.synthetic,
       (pr.claimed_at is not null) as claimed
from practitioners pr
where pr.registration_status = 'registered' or pr.synthetic;

create or replace view published_observations with (security_invoker = false) as
select o.* from observations_current o
where o.entity_type <> 'practitioner' or exists (select 1 from published_practitioners p where p.id = o.entity_id);

grant select on published_practitioners, published_observations, coverage, sources to anon, authenticated;
