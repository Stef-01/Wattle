-- Wattle Health schema v0.3: "found" practitioners (pipeline/load/load_providers.py).
-- The merged college / hospital-group directories (data/providers/*.jsonl) carry no Ahpra number yet.
-- They enter practitioners keyed by source_key (the merged record id, e.g. 'psychiatry:jane-smith') with
-- registration_status left null until the register extract (A3) confirms them. Every surface still shows
-- them as tier 'found'; published_practitioners exposes that as verification = 'found'.

alter table practitioners add column if not exists source_key text unique;

alter table practitioners drop constraint if exists practitioners_check;
alter table practitioners add constraint practitioners_check
  check (ahpra_number is not null or nasrhp_id is not null or synthetic or source_key is not null);

-- published_practitioners: add found rows and say how each row is verified.
-- create or replace view only appends columns, so verification and source_key go at the end.
create or replace view published_practitioners with (security_invoker = false) as
select pr.id, pr.ahpra_number, pr.display_name, pr.profession, pr.specialties, pr.endorsements,
       pr.registration_status, pr.registration_conditions, pr.register_url, pr.register_checked_at, pr.synthetic,
       (pr.claimed_at is not null) as claimed,
       case when pr.registration_status = 'registered' then 'register'
            when pr.synthetic then 'synthetic'
            else 'found' end as verification,
       pr.source_key
from practitioners pr
where pr.registration_status = 'registered' or pr.synthetic or pr.source_key is not null;

-- coverage: count found practitioners too, split by verification, and treat a phone or website observed on
-- any of the practitioner's locations as coverage for that practitioner.
drop materialized view if exists coverage;
create materialized view coverage as
with p as (
  select pr.id, unnest(pr.specialties) as specialty,
         case when pr.registration_status = 'registered' then 'register' else 'found' end as verification
  from practitioners pr
  where (pr.registration_status = 'registered' or pr.source_key is not null) and not pr.synthetic
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
),
loc_obs as (
  select r.practitioner_id,
         bool_or(o.field = 'phone') as has_phone,
         bool_or(o.field = 'hours') as has_hours
  from practitioner_roles r
  join observations_current o on o.entity_type = 'location' and o.entity_id = r.location_id
  group by r.practitioner_id
)
select p.specialty,
       coalesce(loc.state, 'unresolved') as state,
       loc.mmm,
       p.verification,
       count(*)                                                                  as on_register,
       count(loc.practitioner_id)                                                as resolved_to_location,
       count(*) filter (where obs.has_phone or loc_obs.has_phone)                as with_phone,
       count(*) filter (where obs.has_hours or loc_obs.has_hours)                as with_hours,
       count(*) filter (where obs.has_fee_tier)                                  as with_fee_tier,
       count(*) filter (where obs.has_capacity_fresh_90d)                        as with_capacity_fresh_90d,
       count(*) filter (where c.id is not null)                                  as claimed,
       now()                                                                     as computed_at
from p
left join loc on loc.practitioner_id = p.id
left join obs on obs.entity_id = p.id
left join loc_obs on loc_obs.practitioner_id = p.id
left join claims c on c.practitioner_id = p.id and c.status = 'verified'
group by p.specialty, coalesce(loc.state, 'unresolved'), loc.mmm, p.verification;
create unique index if not exists coverage_key_idx on coverage (specialty, state, mmm, verification);
grant select on coverage to anon, authenticated;
