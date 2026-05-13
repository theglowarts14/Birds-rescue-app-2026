-- =============================================================================
-- Karuna · 0002 · global seed (species, festival alerts, global training)
-- =============================================================================
-- Not org-scoped. Same data every NGO sees.
-- =============================================================================

insert into species (common_name, emoji, habitat, common_injury, first_aid, accepted_status, is_wildlife) values
  ('Black Kite',           '🦅',   'Urban skies, dumpsites',  'Manja, electrocution, oil',     'Wrap in soft cloth. Place in ventilated box. Do not feed.', 'always',      false),
  ('Indian Roller',        '🪶',   'Open country, parks',     'Glass collision, cats',         'Dark, quiet box. No water near head.',                       'always',      false),
  ('House Sparrow',        '🐦',   'Hedges, homes',           'Heat stroke, cat attacks',      'Cool box, ORS drops on beak. No milk.',                      'always',      false),
  ('Spotted Owlet',        '🦉',   'Old trees, eaves',        'Orphaned chicks, road hits',    'Warm box. Call before feeding.',                             'always',      true),
  ('Rose-ringed Parakeet', '🦜',   'Trees, illegal trade',    'Netting, clipped wings',        'Cloth wrap. Cool, quiet box.',                               'always',      false),
  ('Common Myna',          '🐤',   'Everywhere urban',        'Plastic, glue traps',           'Remove plastic gently. Hydrate.',                            'always',      false),
  ('Cattle Egret',         '🪿',   'Wetlands, fields',        'Vehicle hits, fishing line',    'Box with low roof. Avoid eye contact.',                      'always',      false),
  ('Brahminy Kite',        '🦅',   'Lakes, transformers',     'Electrocution burns',           'Do not handle barehand. Call us first.',                     'always',      true),
  ('Rock Pigeon',          '🕊️',  'Buildings, balconies',     'Thread, manja, falls',          'Accepted only if visibly injured. Otherwise leave in shade.', 'conditional', false),
  ('Pariah Crow',          '🐦‍⬛', 'All cities',              'Poisoning, manja',              'Use towel, never gloves. Smart birds — calm voice helps.',   'always',      false);

insert into festival_alerts (code, title, starts_on, ends_on, severity, detail) values
  ('sankranti', 'Sankranti — manja alert',          '2026-01-11', '2026-01-15', 'critical', '3-day pre-festival reminder to all volunteers. Awareness posters in 4 languages auto-shipped to RWAs.'),
  ('monsoon',   'Monsoon nesting protection',       '2026-06-01', '2026-08-31', 'moderate', 'No tree pruning advisory pushed to BBMP and resident associations.'),
  ('heat',      'May heat-stress advisory',         '2026-04-20', '2026-06-10', 'critical', 'Water-bowl drives, shaded-perch placements, hospital cooling beds active.'),
  ('diwali',    'Diwali — birds and noise',         '2026-10-15', '2026-11-15', 'moderate', 'Quiet-zone maps and bird-friendly Diwali pledges.');

insert into training_modules (org_id, title, level, minutes, body_md, unlocks_dispatch) values
  (null, 'Manja injury — bird wing',                          'Core',          8,  '# Manja injury\nWhat it is. How to handle it. ...', true),
  (null, 'Heat stroke first response',                        'Core',          6,  '# Heat stroke\nRecognize. Cool. Hydrate. ...',     true),
  (null, 'Glass-tower collision handling',                    'Intermediate',  10, '# Glass collisions\nShock. Concussion. ...',       false),
  (null, 'Cattle with stuck horns — when to call goshala',    'Coordinator',   12, '# Cattle horns\nWhen to escalate. ...',            false),
  (null, 'Borewell flag protocol — never attempt',            'Core',          5,  '# Borewell\nNever attempt yourself. ...',          true),
  (null, 'Trust-building with reporters from low-income areas','Field rescuer',14, '# Trust\nLanguage. Posture. ...',                  false);
