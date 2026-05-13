-- =============================================================================
-- Karuna · 0003 · AWCS seed
-- =============================================================================
-- Animal Warriors Conservation Society — the reference org for Karuna.
-- Reset & re-run safe: deletes only org rows, not auth/profiles.
-- =============================================================================

delete from organizations where slug = 'awcs';

with org as (
  insert into organizations (slug, name, public_name, tagline, helpline_e164, city, founded_year, brand_primary)
  values ('awcs', 'Animal Warriors Conservation Society', 'Animal Warriors',
          'When wings fall, we answer.', '+919697887888', 'Hyderabad, Telangana', 2019, '#c44a1a')
  returning id
)
insert into donation_products (org_id, code, emoji, label, detail, amount_inr, is_recurring)
select id, c.code, c.emoji, c.label, c.detail, c.amount, c.recurring from org, (values
  ('bowl',         '🥣', 'One clay water bowl',                 'Hung on a tree in summer. Saves ~40 birds a week.',                 150,  false),
  ('net',          '🪢', 'One square metre of green netting',    'Replaces a deadly nylon net on a balcony or building façade.',      500,  false),
  ('rescue',       '🪶', 'One full bird rescue & recovery',     'Pickup, vet, meds, food, release. Named bird, photo updates.',      2000, false),
  ('wildlife',     '🦉', 'One wildlife rescue',                  'Specialist vet, longer rehab, aviary time, soft release.',          5000, false),
  ('monthly-bird', '🔁', 'Monthly · Birds fund',                 'Funds the next emergency, whoever it is.',                          500,  true),
  ('summer',       '☀️', '10 water bowls every summer month',    'Apr · May · Jun auto-renew. Cancel anytime.',                       1500, true)
) as c(code, emoji, label, detail, amount, recurring);

-- Partners
insert into partners (org_id, name, kind, contact_name, is_flag_only, notes)
select id, p.name, p.kind::partner_kind, p.contact, p.flag_only, p.notes from organizations o, (values
  ('PFA Telangana',          'cruelty',  'Sgt. Imran',  false, null),
  ('Sri Krishna Goshala',    'cattle',   'Mahesh ji',   false, 'Stuck-horn cases'),
  ('DRF (fallback)',         'overflow', 'Hotline',     false, 'Catch-all'),
  ('Forest Dept · Borewell', 'borewell', 'Range Officer', true, 'Never dispatch volunteers to borewells'),
  ('Friendicoes Reptile',    'snakes',   'Bhanu',       false, 'Monitors, snakes')
) as p(name, kind, contact, flag_only, notes)
where o.slug = 'awcs';

-- Vet clinics
insert into vet_clinics (org_id, name, area, specialty, phone_e164, hours, is_24x7)
select id, v.name, v.area, v.spec, v.phone, v.hours, v.x247 from organizations o, (values
  ('AWCS Bird Rehab Center', 'Shamirpet',     'Avian surgery, ICU, flight pens', '+919697887888', '24x7', true),
  ('Blue Cross Hyderabad',   'Begumpet',      'Dogs, cats, calves',              '+919000044444', '24x7', true),
  ('PFA Veterinary',         'Secunderabad',  'General, large animals',          '+919000033333', '9 AM – 8 PM', false)
) as v(name, area, spec, phone, hours, x247)
where o.slug = 'awcs';

-- Starter inventory
insert into inventory (org_id, item, unit, stock, low_threshold)
select id, i.item, i.unit, i.stock, i.lo from organizations o, (values
  ('Meloxicam 7.5mg',       'strips', 12,  20),
  ('Silver-sulfa cream',    'tubes',  4,   6),
  ('Clay water bowls',      'pcs',    280, 100),
  ('Summer green netting',  'sqm',    86,  50),
  ('Millet + sunflower mix','kg',     18,  10),
  ('Cotton rescue cloths',  'pcs',    64,  40),
  ('Cardboard rescue boxes','pcs',    22,  30)
) as i(item, unit, stock, lo)
where o.slug = 'awcs';
