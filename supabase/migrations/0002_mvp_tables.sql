-- Wattle Health schema v0.2: MVP additions (writing-block Task 1, DATA-MODEL.md "MVP additions").
-- Builds on 0001: practitioners/practitioner_roles are the "provider" and "provider role" entities,
-- sources is the adapter registry, every attribute still carries a source and a tier.
-- RLS pattern as in 0001: RLS on, no table policies, anon/authenticated read published_* views only.
create extension if not exists vector;

-- ---------------------------------------------------------------- specialties (Ahpra specialties and fields; tree via parent_id)
create table if not exists specialties (
  id               text primary key,                       -- slug, e.g. 'physician', 'physician/neurology'
  label            text not null,
  parent_id        text references specialties(id),        -- null = specialty, set = field / subspecialty
  ahpra_recognised boolean not null default true,          -- false = college/RANZCP-style area, never shown as "specialist"
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------- conditions (patient-need vocabulary; three MVP categories)
create table if not exists conditions (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  category    text not null check (category in ('womens-health','mental-health','chronic-overlooked','other')),
  synonyms    text[] not null default '{}',               -- lexical matcher input; lower-case
  created_at  timestamptz not null default now()
);
create index if not exists conditions_category_idx on conditions (category);
create index if not exists conditions_synonyms_idx on conditions using gin (synonyms);

-- ---------------------------------------------------------------- provider_clinical_focus (practitioner x condition, with evidence)
create table if not exists provider_clinical_focus (
  id               uuid primary key default gen_random_uuid(),
  practitioner_id  uuid not null references practitioners(id) on delete cascade,
  condition_id     uuid not null references conditions(id) on delete cascade,
  strength         text not null default 'primary' check (strength in ('primary','secondary','sometimes')),  -- sometimes = half weight
  tier             text not null check (tier in ('register','declared','found')),
  source_id        text not null references sources(id),
  source_url       text,
  observed_at      timestamptz not null default now(),
  unique (practitioner_id, condition_id)
);
create index if not exists provider_clinical_focus_condition_idx on provider_clinical_focus (condition_id, strength);

-- ---------------------------------------------------------------- provider_services (practitioner_role x service facts)
create table if not exists provider_services (
  id                      uuid primary key default gen_random_uuid(),
  practitioner_role_id    uuid not null unique references practitioner_roles(id) on delete cascade,
  telehealth              text check (telehealth in ('none','some','first-appointment','only')),
  bulk_billing            text check (bulk_billing in ('all','concession','none','unknown')),
  referral_required       boolean,
  languages               text[] not null default '{}',   -- ISO 639-1
  age_groups              text[] not null default '{}',   -- 'children','adolescents','adults','older-adults'
  wait_time_text          text,                           -- verbatim, e.g. "4 to 6 weeks"; never parsed into a promise
  accepting_new_patients  text not null default 'unknown' check (accepting_new_patients in ('yes','waitlist','no','unknown')),
  declared_at             timestamptz,                    -- when accepting_new_patients was last declared; 90 d expiry at display
  tier                    text not null default 'found' check (tier in ('register','declared','found')),
  source_id               text not null references sources(id),
  source_url              text,
  updated_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------- publications (research output; never a quality signal)
create table if not exists publications (
  id                   uuid primary key default gen_random_uuid(),
  practitioner_id      uuid not null references practitioners(id) on delete cascade,
  title                text not null,
  doi                  text unique check (doi ~ '^10\.[0-9]{4,9}/\S+$'),
  year                 smallint check (year between 1900 and 2100),
  venue                text,
  openalex_id          text,                              -- e.g. 'W2741809807'
  pubmed_id            text,
  topics               text[] not null default '{}',
  authorship_verified  text not null default 'unverified' check (authorship_verified in ('unverified','identifier-matched','doctor-confirmed')),
  source_url           text,
  created_at           timestamptz not null default now()
);
create index if not exists publications_practitioner_idx on publications (practitioner_id, year desc);

-- ---------------------------------------------------------------- personal_profiles (human fit; opt-in, doctor-owned text)
create table if not exists personal_profiles (
  practitioner_id            uuid primary key references practitioners(id) on delete cascade,
  philosophy_of_care         text,
  why_medicine               text,
  professional_purpose       text,
  enjoys_serving             text,
  communication_approach     text,
  lived_experience           text,                        -- opt-in only; null renders nothing, never "not declared"
  lived_experience_opt_in    boolean not null default false,
  hobbies                    text[] not null default '{}',
  favourite_book             text,
  favourite_book_why         text,
  favourite_film             text,
  favourite_podcast_or_music text,
  outside_medicine           text,
  intro_video_url            text,
  status                     text not null default 'draft' check (status in ('draft','doctor-approved','illustrative')),
  consent_at                 timestamptz,
  approved_at                timestamptz,
  updated_at                 timestamptz not null default now(),
  check (status <> 'doctor-approved' or (consent_at is not null and approved_at is not null)),
  check (lived_experience is null or lived_experience_opt_in)
);

-- ---------------------------------------------------------------- field_evidence (per-field provenance and freshness)
create table if not exists field_evidence (
  id               bigint generated always as identity primary key,
  entity_type      text not null check (entity_type in ('practitioner','practitioner_role','location','organisation',
                     'provider_clinical_focus','provider_services','publication','personal_profile')),
  entity_id        uuid not null,
  field            text not null,
  source_id        text not null references sources(id),
  source_url       text,
  evidence_status  text not null check (evidence_status in ('verified','documented','inferred','illustrative')),
  verified_at      timestamptz,
  freshness_at     timestamptz not null default now(),   -- when the source was last seen to say this
  created_at       timestamptz not null default now()
);
create index if not exists field_evidence_entity_idx on field_evidence (entity_type, entity_id, field, freshness_at desc);

-- ---------------------------------------------------------------- provider_claims (profile ownership; MVP methods)
create table if not exists provider_claims (
  id                     uuid primary key default gen_random_uuid(),
  practitioner_id        uuid not null references practitioners(id) on delete cascade,
  user_id                uuid,
  claimant_email_domain  text check (claimant_email_domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),  -- domain only; the address is never stored
  method                 text not null check (method in ('ahpra+domain-email','posted-code')),
  status                 text not null default 'pending' check (status in ('pending','verified','rejected','revoked')),
  created_at             timestamptz not null default now(),
  verified_at            timestamptz
);
create index if not exists provider_claims_practitioner_idx on provider_claims (practitioner_id, status);

-- ---------------------------------------------------------------- match_evaluations (quality loop; query text is hashed, never kept)
create table if not exists match_evaluations (
  id                    uuid primary key default gen_random_uuid(),
  query_text_hash       text not null check (query_text_hash ~ '^[a-f0-9]{64}$'),  -- sha256 of the normalised query
  extracted_intent      jsonb not null,
  category              text check (category in ('womens-health','mental-health','chronic-overlooked','other')),
  results               jsonb not null,                   -- [{practitioner_id, rank, rationale}]
  rater                 text,
  relevance_top3        smallint check (relevance_top3 between 0 and 3),
  unsupported_claims    integer not null default 0 check (unsupported_claims >= 0),
  hard_filter_failures  integer not null default 0 check (hard_filter_failures >= 0),
  notes                 text,
  created_at            timestamptz not null default now()
);
create index if not exists match_evaluations_category_idx on match_evaluations (category, created_at desc);

-- ---------------------------------------------------------------- provider_embeddings (pgvector; built offline, never in the request path)
create table if not exists provider_embeddings (
  id               uuid primary key default gen_random_uuid(),
  practitioner_id  uuid not null references practitioners(id) on delete cascade,
  kind             text not null check (kind in ('clinical','personal')),
  model            text not null,                         -- e.g. 'bge-small-en-v1.5'
  dims             smallint not null default 384 check (dims = 384),
  embedding        vector(384) not null,
  built_at         timestamptz not null default now(),
  unique (practitioner_id, kind, model)
);
create index if not exists provider_embeddings_hnsw_idx on provider_embeddings using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------- row level security (same pattern as 0001)
alter table specialties             enable row level security;
alter table conditions              enable row level security;
alter table provider_clinical_focus enable row level security;
alter table provider_services       enable row level security;
alter table publications            enable row level security;
alter table personal_profiles       enable row level security;
alter table field_evidence          enable row level security;
alter table provider_claims         enable row level security;
alter table match_evaluations       enable row level security;
alter table provider_embeddings     enable row level security;
revoke all on specialties, conditions, provider_clinical_focus, provider_services, publications, personal_profiles,
              field_evidence, provider_claims, match_evaluations, provider_embeddings from anon, authenticated;

-- Published views: vocabularies are public; practitioner-linked rows only for published practitioners.
create or replace view published_specialties with (security_invoker = false) as
select id, label, parent_id, ahpra_recognised from specialties;

create or replace view published_conditions with (security_invoker = false) as
select id, slug, label, category, synonyms from conditions;

create or replace view published_clinical_focus with (security_invoker = false) as
select f.practitioner_id, f.condition_id, c.slug, c.label, c.category, f.strength, f.tier, f.source_id, f.source_url, f.observed_at
from provider_clinical_focus f join conditions c on c.id = f.condition_id
where exists (select 1 from published_practitioners p where p.id = f.practitioner_id);

create or replace view published_services with (security_invoker = false) as
select s.practitioner_role_id, r.practitioner_id, r.location_id, s.telehealth, s.bulk_billing, s.referral_required, s.languages,
       s.age_groups, s.wait_time_text,
       case when s.declared_at is null or s.declared_at > now() - interval '90 days' then s.accepting_new_patients else 'unknown' end
         as accepting_new_patients,
       s.declared_at, s.tier, s.source_id, s.source_url
from provider_services s join practitioner_roles r on r.id = s.practitioner_role_id
where exists (select 1 from published_practitioners p where p.id = r.practitioner_id);

create or replace view published_publications with (security_invoker = false) as
select id, practitioner_id, title, doi, year, venue, openalex_id, pubmed_id, topics, authorship_verified, source_url
from publications pu
where exists (select 1 from published_practitioners p where p.id = pu.practitioner_id);

-- Drafts are never readable by anon: the base table is revoked above and this view excludes status = 'draft'.
create or replace view published_personal_profiles with (security_invoker = false) as
select practitioner_id, philosophy_of_care, why_medicine, professional_purpose, enjoys_serving, communication_approach,
       case when lived_experience_opt_in then lived_experience end as lived_experience,
       hobbies, favourite_book, favourite_book_why, favourite_film, favourite_podcast_or_music, outside_medicine,
       intro_video_url, status, approved_at
from personal_profiles pp
where status in ('doctor-approved','illustrative')
  and exists (select 1 from published_practitioners p where p.id = pp.practitioner_id);

create or replace view published_field_evidence with (security_invoker = false) as
select entity_type, entity_id, field, source_id, source_url, evidence_status, verified_at, freshness_at from field_evidence;

grant select on published_specialties, published_conditions, published_clinical_focus, published_services,
                published_publications, published_personal_profiles, published_field_evidence to anon, authenticated;

-- Guard: fail the migration if a draft profile could ever be read by anon.
do $$
begin
  if has_table_privilege('anon', 'personal_profiles', 'select') then
    raise exception 'personal_profiles must not be readable by anon (draft profiles would leak)';
  end if;
  if position('draft' in pg_get_viewdef('published_personal_profiles')) = 0 then
    raise exception 'published_personal_profiles must exclude status = draft';
  end if;
end $$;

-- ---------------------------------------------------------------- seed: Ahpra medical specialties (Medical Board specialist registration list)
insert into specialties (id, label, parent_id, ahpra_recognised) values
  ('addiction-medicine','Addiction medicine',null,true), ('anaesthesia','Anaesthesia',null,true),
  ('dermatology','Dermatology',null,true), ('emergency-medicine','Emergency medicine',null,true),
  ('general-practice','General practice',null,true), ('intensive-care-medicine','Intensive care medicine',null,true),
  ('medical-administration','Medical administration',null,true), ('obstetrics-gynaecology','Obstetrics and gynaecology',null,true),
  ('occupational-environmental-medicine','Occupational and environmental medicine',null,true), ('ophthalmology','Ophthalmology',null,true),
  ('paediatrics','Paediatrics and child health',null,true), ('pain-medicine','Pain medicine',null,true),
  ('palliative-medicine','Palliative medicine',null,true), ('pathology','Pathology',null,true),
  ('physician','Physician',null,true), ('psychiatry','Psychiatry',null,true),
  ('public-health-medicine','Public health medicine',null,true), ('radiation-oncology','Radiation oncology',null,true),
  ('radiology','Radiology',null,true), ('rehabilitation-medicine','Rehabilitation medicine',null,true),
  ('sexual-health-medicine','Sexual health medicine',null,true), ('sport-exercise-medicine','Sport and exercise medicine',null,true),
  ('surgery','Surgery',null,true)
on conflict (id) do nothing;

-- Ahpra-recognised fields of specialty practice (parent = specialty).
insert into specialties (id, label, parent_id, ahpra_recognised) values
  ('physician/cardiology','Cardiology','physician',true), ('physician/clinical-genetics','Clinical genetics','physician',true),
  ('physician/clinical-pharmacology','Clinical pharmacology','physician',true), ('physician/endocrinology','Endocrinology','physician',true),
  ('physician/gastroenterology-hepatology','Gastroenterology and hepatology','physician',true), ('physician/general-medicine','General medicine','physician',true),
  ('physician/geriatric-medicine','Geriatric medicine','physician',true), ('physician/haematology','Haematology','physician',true),
  ('physician/immunology-allergy','Immunology and allergy','physician',true), ('physician/infectious-diseases','Infectious diseases','physician',true),
  ('physician/medical-oncology','Medical oncology','physician',true), ('physician/nephrology','Nephrology','physician',true),
  ('physician/neurology','Neurology','physician',true), ('physician/nuclear-medicine','Nuclear medicine','physician',true),
  ('physician/respiratory-sleep-medicine','Respiratory and sleep medicine','physician',true), ('physician/rheumatology','Rheumatology','physician',true),
  ('obstetrics-gynaecology/gynaecological-oncology','Gynaecological oncology','obstetrics-gynaecology',true),
  ('obstetrics-gynaecology/maternal-fetal-medicine','Maternal-fetal medicine','obstetrics-gynaecology',true),
  ('obstetrics-gynaecology/og-ultrasound','Obstetrics and gynaecological ultrasound','obstetrics-gynaecology',true),
  ('obstetrics-gynaecology/reproductive-endocrinology-infertility','Reproductive endocrinology and infertility','obstetrics-gynaecology',true),
  ('obstetrics-gynaecology/urogynaecology','Urogynaecology','obstetrics-gynaecology',true),
  ('paediatrics/clinical-genetics','Clinical genetics','paediatrics',true), ('paediatrics/community-child-health','Community child health','paediatrics',true),
  ('paediatrics/general-paediatrics','General paediatrics','paediatrics',true), ('paediatrics/neonatal-perinatal-medicine','Neonatal and perinatal medicine','paediatrics',true),
  ('paediatrics/cardiology','Paediatric cardiology','paediatrics',true), ('paediatrics/clinical-pharmacology','Paediatric clinical pharmacology','paediatrics',true),
  ('paediatrics/emergency-medicine','Paediatric emergency medicine','paediatrics',true), ('paediatrics/endocrinology','Paediatric endocrinology','paediatrics',true),
  ('paediatrics/gastroenterology-hepatology','Paediatric gastroenterology and hepatology','paediatrics',true), ('paediatrics/haematology','Paediatric haematology','paediatrics',true),
  ('paediatrics/immunology-allergy','Paediatric immunology and allergy','paediatrics',true), ('paediatrics/infectious-diseases','Paediatric infectious diseases','paediatrics',true),
  ('paediatrics/intensive-care-medicine','Paediatric intensive care medicine','paediatrics',true), ('paediatrics/medical-oncology','Paediatric medical oncology','paediatrics',true),
  ('paediatrics/nephrology','Paediatric nephrology','paediatrics',true), ('paediatrics/neurology','Paediatric neurology','paediatrics',true),
  ('paediatrics/nuclear-medicine','Paediatric nuclear medicine','paediatrics',true), ('paediatrics/palliative-medicine','Paediatric palliative medicine','paediatrics',true),
  ('paediatrics/rehabilitation-medicine','Paediatric rehabilitation medicine','paediatrics',true), ('paediatrics/respiratory-sleep-medicine','Paediatric respiratory and sleep medicine','paediatrics',true),
  ('paediatrics/rheumatology','Paediatric rheumatology','paediatrics',true),
  ('emergency-medicine/paediatric-emergency-medicine','Paediatric emergency medicine','emergency-medicine',true),
  ('pathology/anatomical','Anatomical pathology','pathology',true), ('pathology/chemical','Chemical pathology','pathology',true),
  ('pathology/forensic','Forensic pathology','pathology',true), ('pathology/general','General pathology','pathology',true),
  ('pathology/haematology','Haematology','pathology',true), ('pathology/immunology','Immunology','pathology',true),
  ('pathology/microbiology','Microbiology','pathology',true),
  ('radiology/diagnostic-radiology','Diagnostic radiology','radiology',true), ('radiology/diagnostic-ultrasound','Diagnostic ultrasound','radiology',true),
  ('radiology/nuclear-medicine','Nuclear medicine','radiology',true),
  ('surgery/cardio-thoracic','Cardio-thoracic surgery','surgery',true), ('surgery/general','General surgery','surgery',true),
  ('surgery/neurosurgery','Neurosurgery','surgery',true), ('surgery/orthopaedic','Orthopaedic surgery','surgery',true),
  ('surgery/otolaryngology-head-neck','Otolaryngology - head and neck surgery','surgery',true), ('surgery/oral-maxillofacial','Oral and maxillofacial surgery','surgery',true),
  ('surgery/paediatric','Paediatric surgery','surgery',true), ('surgery/plastic','Plastic surgery','surgery',true),
  ('surgery/urology','Urology','surgery',true), ('surgery/vascular','Vascular surgery','surgery',true)
on conflict (id) do nothing;

-- College areas of practice with NO Ahpra field (ahpra_recognised = false): shown as "area of practice", never "specialist in".
insert into specialties (id, label, parent_id, ahpra_recognised) values
  ('psychiatry/child-adolescent','Child and adolescent psychiatry','psychiatry',false), ('psychiatry/perinatal-infant','Perinatal and infant psychiatry','psychiatry',false),
  ('psychiatry/adult','Adult psychiatry','psychiatry',false), ('psychiatry/old-age','Psychiatry of old age','psychiatry',false),
  ('psychiatry/addiction','Addiction psychiatry','psychiatry',false), ('psychiatry/forensic','Forensic psychiatry','psychiatry',false),
  ('psychiatry/consultation-liaison','Consultation-liaison psychiatry','psychiatry',false), ('psychiatry/psychotherapy','Psychotherapy','psychiatry',false),
  ('psychiatry/neurodevelopmental','Neurodevelopmental psychiatry (ADHD, autism)','psychiatry',false),
  ('pain-medicine/chronic-pain','Chronic and persistent pain','pain-medicine',false), ('pain-medicine/pelvic-pain','Pelvic pain','pain-medicine',false),
  ('pain-medicine/paediatric','Paediatric pain medicine','pain-medicine',false),
  ('general-practice/rural-generalist','Rural generalist','general-practice',false), ('general-practice/womens-health','Women''s health','general-practice',false),
  ('general-practice/mental-health','Mental health (FPS-accredited)','general-practice',false), ('general-practice/chronic-disease','Chronic and complex care','general-practice',false),
  ('rehabilitation-medicine/spinal-cord-injury','Spinal cord injury','rehabilitation-medicine',false),
  ('rehabilitation-medicine/brain-injury','Acquired brain injury','rehabilitation-medicine',false),
  ('rehabilitation-medicine/musculoskeletal','Musculoskeletal and chronic pain rehabilitation','rehabilitation-medicine',false),
  ('physician/rheumatology/hypermobility','Hypermobility and connective tissue','physician/rheumatology',false),
  ('physician/immunology-allergy/mcas','Mast cell and allergic disorders','physician/immunology-allergy',false),
  ('physician/endocrinology/reproductive','Reproductive endocrinology (PCOS, menopause)','physician/endocrinology',false),
  ('physician/gastroenterology-hepatology/neurogastroenterology','Neurogastroenterology (IBS, gut-brain)','physician/gastroenterology-hepatology',false),
  ('physician/neurology/functional','Functional neurological disorder','physician/neurology',false),
  ('physician/neurology/autonomic','Autonomic disorders (POTS)','physician/neurology',false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------- seed: MVP conditions (three categories from the plan)
insert into conditions (slug, label, category, synonyms) values
  ('endometriosis','Endometriosis','womens-health','{endo,endometriosis,adenomyosis,painful periods,period pain}'),
  ('pcos','Polycystic ovary syndrome','womens-health','{pcos,polycystic ovary,polycystic ovarian syndrome,irregular periods}'),
  ('postpartum-mental-health','Postpartum mental health','womens-health','{postnatal depression,postpartum depression,pnd,perinatal anxiety,perinatal depression,postpartum anxiety,baby blues}'),
  ('pelvic-pain','Pelvic pain','womens-health','{pelvic pain,chronic pelvic pain,vulvodynia,painful sex,dyspareunia,pelvic floor pain}'),
  ('menopause','Menopause','womens-health','{menopause,perimenopause,hot flushes,hrt,mht,hormone therapy}'),
  ('adhd','ADHD','mental-health','{adhd,add,attention deficit,attention deficit hyperactivity disorder,adult adhd,adhd assessment}'),
  ('depression','Depression','mental-health','{depression,low mood,major depressive disorder,mdd,treatment resistant depression}'),
  ('anxiety','Anxiety','mental-health','{anxiety,panic attacks,panic disorder,gad,generalised anxiety,social anxiety,ocd}'),
  ('complex-psychiatric','Complex psychiatric needs','mental-health','{bipolar,schizophrenia,psychosis,borderline personality,bpd,complex ptsd,cptsd,eating disorder,complex mental health}'),
  ('persistent-pain','Persistent pain','chronic-overlooked','{chronic pain,persistent pain,long term pain,pain management,neuropathic pain,back pain}'),
  ('me-cfs','Chronic fatigue syndrome / ME','chronic-overlooked','{chronic fatigue,cfs,me/cfs,me cfs,myalgic encephalomyelitis,post exertional malaise,pem}'),
  ('fibromyalgia','Fibromyalgia','chronic-overlooked','{fibromyalgia,fibro,widespread pain}'),
  ('long-covid','Long COVID','chronic-overlooked','{long covid,post covid,post-covid condition,pasc,post acute covid}'),
  ('pots-dysautonomia','POTS / dysautonomia','chronic-overlooked','{pots,postural orthostatic tachycardia,dysautonomia,autonomic dysfunction,orthostatic intolerance}'),
  ('fnd','Functional neurological disorder','chronic-overlooked','{fnd,functional neurological disorder,functional seizures,non-epileptic seizures,conversion disorder}'),
  ('hypermobility-eds','Hypermobility / Ehlers-Danlos','chronic-overlooked','{eds,ehlers danlos,ehlers-danlos,hypermobility,hsd,hypermobile,joint hypermobility}'),
  ('ibs','Irritable bowel syndrome','chronic-overlooked','{ibs,irritable bowel,gut-brain,functional gut disorder,bloating}')
on conflict (slug) do nothing;
