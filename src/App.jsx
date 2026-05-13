import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Bird,
  Feather,
  AlertCircle,
  Stethoscope,
  Home,
  Heart,
  MapPin,
  Phone,
  Camera,
  Users,
  Activity,
  ChevronRight,
  Search,
  Filter,
  Plus,
  X,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Shield,
  BookOpen,
  Send,
  Menu,
} from 'lucide-react';

/* ============================================================
   KARUNA — When wings fall, we answer.
   A WhatsApp-first bird & animal rescue platform.
   Three views — Public / Team / Donor — all wired together.
   ============================================================ */

const C = {
  paper: '#faf6ef',
  cream: '#f3ede1',
  creamDeep: '#ebe2cf',
  ink: '#1a1410',
  inkSoft: '#4a3f35',
  inkMuted: '#7a6e60',
  line: 'rgba(26,20,16,0.10)',
  rust: '#c44a1a',
  rustSoft: 'rgba(196,74,26,0.10)',
  moss: '#4a6b3a',
  mossSoft: 'rgba(74,107,58,0.12)',
  amber: '#d99845',
  amberSoft: 'rgba(217,152,69,0.16)',
  sky: '#4a7ba8',
  skySoft: 'rgba(74,123,168,0.14)',
};

const F = {
  display: "'Fraunces', Georgia, serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

const STATUS = {
  critical: { label: 'Critical', color: C.rust, soft: C.rustSoft },
  'in-rescue': { label: 'In rescue', color: C.amber, soft: C.amberSoft },
  recovering: { label: 'Recovering', color: C.moss, soft: C.mossSoft },
  released: { label: 'Released', color: C.sky, soft: C.skySoft },
};

/* ============ DEMO DATA ============ */

const INITIAL_CASES = [
  {
    id: 'KR-2487',
    species: 'Black Kite',
    emoji: '🦅',
    threat: 'Manja kite-string injury — right wing',
    location: 'Banjara Hills, Rd 12',
    area: 'Banjara Hills',
    status: 'critical',
    urgency: 'critical',
    reporter: 'Ravi K.',
    reporterAnon: false,
    volunteer: 'Anika Kumar',
    receivedAt: '12 mins ago',
    timeAgo: 12,
    timeline: [
      { stage: 'Report received', time: '2:34 PM', done: true },
      { stage: 'Volunteer dispatched', time: '2:36 PM', done: true },
      { stage: 'Anika · 8 mins away', time: '2:42 PM', done: true, current: true },
      { stage: 'Rescued', time: '—', done: false },
      { stage: 'In care', time: '—', done: false },
      { stage: 'Released', time: '—', done: false },
    ],
    notes: 'Bird grounded behind petrol pump. Visible blood on right wing. Crowd gathering.',
    treatment: [],
    sponsor: null,
    handovers: [],
    cost: 1850,
  },
  {
    id: 'KR-2486',
    species: 'Indian Roller',
    emoji: '🪶',
    threat: 'Glass tower collision — concussion suspected',
    location: 'Hitech City, Cyber Towers',
    area: 'Hitech City',
    status: 'in-rescue',
    urgency: 'critical',
    reporter: 'Anonymous',
    reporterAnon: true,
    volunteer: 'Rohit Mehta',
    receivedAt: '38 mins ago',
    timeAgo: 38,
    timeline: [
      { stage: 'Report received', time: '2:08 PM', done: true },
      { stage: 'Volunteer dispatched', time: '2:11 PM', done: true },
      { stage: 'Rescued', time: '2:34 PM', done: true, current: true },
      { stage: 'En route to clinic', time: '2:40 PM', done: true },
      { stage: 'In care', time: '—', done: false },
      { stage: 'Released', time: '—', done: false },
    ],
    notes: 'Found stunned at base of glass tower. Breathing, no visible wounds. Building safety audit requested.',
    treatment: [],
    sponsor: 'Nila S.',
    handovers: [{ from: 'Rohit Mehta', to: 'Dr. Sandeep Reddy', when: '2:40 PM', photo: '📷', note: 'Stable, alert' }],
    cost: 2200,
  },
  {
    id: 'KR-2484',
    species: 'Rose-ringed Parakeet',
    emoji: '🦜',
    threat: 'Tangled in summer netting — leg laceration',
    location: 'Jubilee Hills, Rd 36',
    area: 'Jubilee Hills',
    status: 'in-rescue',
    urgency: 'moderate',
    reporter: 'Meera D.',
    reporterAnon: false,
    volunteer: 'Anika Kumar',
    receivedAt: '1 hr ago',
    timeAgo: 60,
    timeline: [
      { stage: 'Report received', time: '1:30 PM', done: true },
      { stage: 'Volunteer dispatched', time: '1:35 PM', done: true },
      { stage: 'Rescued', time: '2:02 PM', done: true, current: true },
      { stage: 'In care', time: '—', done: false },
      { stage: 'Released', time: '—', done: false },
    ],
    notes: 'Untangled at site. Leg cleaned. Heading to clinic for wound dressing.',
    treatment: [],
    sponsor: null,
    handovers: [],
    cost: 950,
  },
  {
    id: 'KR-2479',
    species: 'Spotted Owlet',
    emoji: '🦉',
    threat: 'Orphaned juvenile — fell from nest',
    location: 'KBR National Park gate',
    area: 'KBR Park',
    status: 'recovering',
    urgency: 'low',
    reporter: 'Park ranger',
    reporterAnon: false,
    volunteer: 'Priya Reddy',
    receivedAt: 'Day 4',
    timeAgo: 5760,
    timeline: [
      { stage: 'Report received', time: 'Mon 9:14 AM', done: true },
      { stage: 'Rescued', time: 'Mon 10:02 AM', done: true },
      { stage: 'In care · foster', time: 'Mon 11:30 AM', done: true, current: true },
      { stage: 'Released', time: '—', done: false },
    ],
    notes: 'Hand-reared by foster Priya Reddy. Eyes open, feeding well. Release in approx. 10 days.',
    treatment: [
      { day: 'Day 1', vet: 'Dr. Vikram Kumar', note: 'Hydration, exam — no fractures', photo: '🥚' },
      { day: 'Day 2', vet: 'Dr. Vikram Kumar', note: 'Begin soft diet, daily weight log', photo: '🍼' },
      { day: 'Day 4', vet: 'Dr. Vikram Kumar', note: 'Weight +14g. Strong grip response.', photo: '🦉' },
    ],
    sponsor: 'Kalpana N.',
    handovers: [{ from: 'Park ranger', to: 'Priya Reddy', when: 'Mon 10:30 AM', photo: '📷', note: 'Handed to foster' }],
    cost: 2750,
  },
  {
    id: 'KR-2478',
    species: 'House Sparrow',
    emoji: '🐦',
    threat: 'Heat stroke — found near water bowl, May advisory',
    location: 'Kondapur, gated colony',
    area: 'Kondapur',
    status: 'recovering',
    urgency: 'moderate',
    reporter: 'Asha P.',
    reporterAnon: false,
    volunteer: 'Pooja Sharma',
    receivedAt: 'Day 2',
    timeAgo: 2880,
    timeline: [
      { stage: 'Report received', time: 'Sun 1:22 PM', done: true },
      { stage: 'Rescued', time: 'Sun 1:50 PM', done: true },
      { stage: 'In care · clinic', time: 'Sun 3:00 PM', done: true, current: true },
      { stage: 'Released', time: '—', done: false },
    ],
    notes: 'Cooled with damp cloth on arrival. Now eating, hydrated.',
    treatment: [
      { day: 'Day 1', vet: 'Dr. Sandeep Reddy', note: 'ORS, cool box, dim light', photo: '💧' },
      { day: 'Day 2', vet: 'Dr. Sandeep Reddy', note: 'Eating millet. Active.', photo: '🌾' },
    ],
    sponsor: null,
    handovers: [],
    cost: 480,
  },
  {
    id: 'KR-2472',
    species: 'Cattle Egret',
    emoji: '🪿',
    threat: 'Vehicle collision — leg fracture',
    location: 'Madhapur flyover',
    area: 'Madhapur',
    status: 'released',
    urgency: 'low',
    reporter: 'Auto driver',
    reporterAnon: false,
    volunteer: 'Anika Kumar',
    receivedAt: 'Day 21',
    timeAgo: 30240,
    timeline: [
      { stage: 'Report received', time: 'Apr 22', done: true },
      { stage: 'Rescued', time: 'Apr 22', done: true },
      { stage: 'In care · clinic', time: 'Apr 22', done: true },
      { stage: 'Released', time: 'May 13', done: true, current: true },
    ],
    notes: 'Pin-fixed fracture, full rehab in flight aviary. Released at Osman Sagar wetland.',
    treatment: [
      { day: 'Day 1', vet: 'Dr. Sandeep Reddy', note: 'Splinted, antibiotics', photo: '🩹' },
      { day: 'Day 7', vet: 'Dr. Sandeep Reddy', note: 'Splint off, weight bearing', photo: '🦴' },
      { day: 'Day 14', vet: 'Dr. Vikram Kumar', note: 'Aviary flight test passed', photo: '🛫' },
      { day: 'Day 21', vet: 'Dr. Vikram Kumar', note: 'Released at Osman Sagar', photo: '🌅' },
    ],
    sponsor: 'Rahul T.',
    handovers: [],
    cost: 4200,
  },
  {
    id: 'KR-2469',
    species: 'Brahminy Kite',
    emoji: '🦅',
    threat: 'Electrocution on transformer — burned wing tips',
    location: 'Gachibowli, near stadium',
    area: 'Gachibowli',
    status: 'critical',
    urgency: 'critical',
    reporter: 'Watchman',
    reporterAnon: false,
    volunteer: 'Rohit Mehta',
    receivedAt: '4 hrs ago',
    timeAgo: 240,
    timeline: [
      { stage: 'Report received', time: '11:02 AM', done: true },
      { stage: 'Volunteer dispatched', time: '11:05 AM', done: true },
      { stage: 'Rescued', time: '11:48 AM', done: true },
      { stage: 'In ICU', time: '12:30 PM', done: true, current: true },
      { stage: 'Recovering', time: '—', done: false },
      { stage: 'Released', time: '—', done: false },
    ],
    notes: 'Severe burns. Pain management protocol. Transformer flagged with electricity board for cover.',
    treatment: [{ day: 'Day 1', vet: 'Dr. Vikram Kumar', note: 'IV fluids, silver-sulfa cream, oxygen', photo: '⚡' }],
    sponsor: null,
    handovers: [],
    cost: 5600,
  },
  {
    id: 'KR-2465',
    species: 'Common Myna',
    emoji: '🐤',
    threat: 'Plastic container stuck on head',
    location: 'Begumpet, near station',
    area: 'Begumpet',
    status: 'in-rescue',
    urgency: 'moderate',
    reporter: 'Anonymous',
    reporterAnon: true,
    volunteer: 'Pooja Sharma',
    receivedAt: '2 hrs ago',
    timeAgo: 120,
    timeline: [
      { stage: 'Report received', time: '1:00 PM', done: true },
      { stage: 'Volunteer dispatched', time: '1:08 PM', done: true },
      { stage: 'Rescued', time: '1:55 PM', done: true, current: true },
      { stage: 'In care', time: '—', done: false },
      { stage: 'Released', time: '—', done: false },
    ],
    notes: 'Plastic removed at site. Bird dehydrated but alert. Heading to clinic for observation.',
    treatment: [],
    sponsor: null,
    handovers: [],
    cost: 320,
  },
];

const TEAM = [
  { name: 'Dr. Sandeep Reddy', role: 'Lead Avian Vet', status: 'on-duty', cases: 4, location: 'Clinic · Jubilee Hills', initials: 'SR', skills: ['Surgery', 'Avian', 'Trauma'] },
  { name: 'Anika Kumar', role: 'Field Rescuer', status: 'in-field', cases: 2, location: 'Banjara Hills', initials: 'AK', skills: ['Driver', 'Climber', 'Manja'] },
  { name: 'Pooja Sharma', role: 'Coordinator', status: 'on-duty', cases: 8, location: 'Operations', initials: 'PS', skills: ['Triage', 'Telugu', 'Hindi'] },
  { name: 'Rohit Mehta', role: 'Field Rescuer', status: 'on-call', cases: 1, location: 'Hitech City', initials: 'RM', skills: ['Driver', 'Glass-collision'] },
  { name: 'Dr. Vikram Kumar', role: 'Wildlife Vet', status: 'on-duty', cases: 3, location: 'Aviary · Shamirpet', initials: 'VK', skills: ['Wildlife', 'Surgery'] },
  { name: 'Priya Reddy', role: 'Foster', status: 'on-call', cases: 5, location: 'Jubilee Hills', initials: 'PR', skills: ['Hand-rearing', 'Owlets'] },
  { name: 'Karthik N.', role: 'Field Rescuer', status: 'off-duty', cases: 0, location: '—', initials: 'KN', skills: ['Driver', 'Snakes'] },
  { name: 'Meera Iyer', role: 'Awareness Champion', status: 'on-duty', cases: 0, location: 'Schools', initials: 'MI', skills: ['Workshops', 'Content'] },
];

const SPECIES_GUIDE = [
  { name: 'Black Kite', emoji: '🦅', habitat: 'Urban skies, dumpsites', injury: 'Manja, electrocution, oil', firstAid: 'Wrap in soft cloth. Place in ventilated box. Do not feed.', accepted: true },
  { name: 'Indian Roller', emoji: '🪶', habitat: 'Open country, parks', injury: 'Glass collision, cats', firstAid: 'Dark, quiet box. No water near head.', accepted: true },
  { name: 'House Sparrow', emoji: '🐦', habitat: 'Hedges, homes', injury: 'Heat stroke, cat attacks', firstAid: 'Cool box, ORS drops on beak. No milk.', accepted: true },
  { name: 'Spotted Owlet', emoji: '🦉', habitat: 'Old trees, eaves', injury: 'Orphaned chicks, road hits', firstAid: 'Warm box. Call before feeding.', accepted: true },
  { name: 'Rose-ringed Parakeet', emoji: '🦜', habitat: 'Trees, illegal trade', injury: 'Netting, clipped wings', firstAid: 'Cloth wrap. Cool, quiet box.', accepted: true },
  { name: 'Common Myna', emoji: '🐤', habitat: 'Everywhere urban', injury: 'Plastic, glue traps', firstAid: 'Remove plastic gently. Hydrate.', accepted: true },
  { name: 'Cattle Egret', emoji: '🪿', habitat: 'Wetlands, fields', injury: 'Vehicle hits, fishing line', firstAid: 'Box with low roof. Avoid eye contact.', accepted: true },
  { name: 'Brahminy Kite', emoji: '🦅', habitat: 'Lakes, transformers', injury: 'Electrocution burns', firstAid: 'Do not handle barehand. Call us first.', accepted: true },
  { name: 'Rock Pigeon', emoji: '🕊️', habitat: 'Buildings, balconies', injury: 'Thread, manja, falls', firstAid: 'Accepted only if visibly injured. Otherwise leave in shade.', accepted: 'conditional' },
  { name: 'Pariah Crow', emoji: '🐦‍⬛', habitat: 'All cities', injury: 'Poisoning, manja', firstAid: 'Use towel, never gloves. Smart birds — calm voice helps.', accepted: true },
];

const EDUCATION = {
  bird: [
    { do: 'Wrap in a soft cotton cloth and place in a ventilated cardboard box', dont: 'Don\'t feed pigeons milk — birds are lactose intolerant' },
    { do: 'Keep the bird in a dark, quiet place until rescue arrives', dont: 'Don\'t tie wings with thread — it cuts circulation' },
    { do: 'Place ORS-water near the beak if conscious', dont: 'Don\'t pour water on a heat-stressed bird — it shocks them' },
  ],
  animal: [
    { do: 'Note the location and stay at a safe distance', dont: 'Don\'t attempt to rescue large animals yourself' },
    { do: 'Photograph the situation if safe', dont: 'Don\'t offer food to street dogs in distress — it complicates triage' },
  ],
  wildlife: [
    { do: 'Call the wildlife helpline and our team in parallel', dont: 'Don\'t lower buckets into borewells — wait for specialists' },
    { do: 'Keep crowds back — stress kills wildlife faster than injury', dont: 'Don\'t corner snakes. Cover with a basket only if trained.' },
  ],
};

const FESTIVAL_ALERTS = [
  { id: 'sankranti', title: 'Sankranti — manja alert', when: 'Jan 11–15', status: 'standby', severity: 'critical', detail: '3-day pre-festival reminder to all volunteers. Awareness posters in 4 languages auto-shipped to RWAs.' },
  { id: 'monsoon', title: 'Monsoon nesting protection', when: 'Jun–Aug', status: 'planning', severity: 'moderate', detail: 'No tree pruning advisory pushed to BBMP and resident associations.' },
  { id: 'heat', title: 'May heat-stress advisory', when: 'Apr 20 – Jun 10', status: 'live', severity: 'critical', detail: 'Water-bowl drives, shaded-perch placements, hospital cooling beds active.' },
  { id: 'diwali', title: 'Diwali — birds and noise', when: 'Oct–Nov', status: 'planning', severity: 'moderate', detail: 'Quiet-zone maps and bird-friendly Diwali pledges.' },
];

const PARTNERS = [
  { name: 'PFA Telangana', kind: 'Cruelty cases', cases: 12, contact: 'Sgt. Imran', status: 'live' },
  { name: 'Sri Krishna Goshala', kind: 'Cattle, stuck-horn cases', cases: 4, contact: 'Mahesh ji', status: 'live' },
  { name: 'DRF (fallback)', kind: 'Catch-all overflow', cases: 6, contact: 'Hotline', status: 'live' },
  { name: 'Forest Dept · Borewell', kind: 'Borewell specialists', cases: 1, contact: 'Range Officer', status: 'flag-only' },
  { name: 'Friendicoes Reptile', kind: 'Snakes, monitors', cases: 3, contact: 'Bhanu', status: 'live' },
];

const INVENTORY = [
  { item: 'Meloxicam 7.5mg', stock: 12, low: 20, unit: 'strips' },
  { item: 'Silver-sulfa cream', stock: 4, low: 6, unit: 'tubes' },
  { item: 'Clay water bowls', stock: 280, low: 100, unit: 'pcs' },
  { item: 'Summer green netting', stock: 86, low: 50, unit: 'sqm' },
  { item: 'Millet + sunflower mix', stock: 18, low: 10, unit: 'kg' },
  { item: 'Cotton rescue cloths', stock: 64, low: 40, unit: 'pcs' },
  { item: 'Cardboard rescue boxes', stock: 22, low: 30, unit: 'pcs' },
];

const VET_CLINICS = [
  { name: 'Karuna Avian Clinic', area: 'Jubilee Hills', specialty: 'Avian surgery, ICU', phone: '+91 90000 11111', open: '24×7' },
  { name: 'Shamirpet Aviary', area: 'Shamirpet', specialty: 'Wildlife rehab, flight pens', phone: '+91 90000 22222', open: '7 AM – 9 PM' },
  { name: 'PFA Veterinary', area: 'Secunderabad', specialty: 'General, large animals', phone: '+91 90000 33333', open: '9 AM – 8 PM' },
  { name: 'Blue Cross Hyd.', area: 'Begumpet', specialty: 'Dogs, cats, calves', phone: '+91 90000 44444', open: '24×7' },
];

const DONORS_RECENT = [
  { name: 'Nila S.', gave: '₹2,000', for: 'Sponsored KR-2486 · Indian Roller', when: '2 hrs ago' },
  { name: 'Rahul T.', gave: '₹5,000', for: 'Wildlife rescue fund', when: 'today' },
  { name: 'Kalpana N.', gave: '₹500', for: '1 sqm summer netting', when: 'today' },
  { name: 'Anonymous', gave: '₹150 ×10', for: 'Water bowls drive', when: 'yesterday' },
  { name: 'Infosys CSR', gave: '₹1,20,000', for: 'May heat-stress drive', when: 'this week' },
  { name: 'Karthik V.', gave: '₹2,000/mo', for: 'Monthly auto · Birds', when: 'recurring' },
];

const IMPACT_FEED = [
  { id: 'f1', case: 'KR-2472', species: 'Cattle Egret', moment: 'Released at Osman Sagar', emoji: '🌅', sponsor: 'Rahul T.' },
  { id: 'f2', case: 'KR-2479', species: 'Spotted Owlet', moment: 'Day 4 — eating on her own', emoji: '🦉', sponsor: 'Kalpana N.' },
  { id: 'f3', case: 'KR-2486', species: 'Indian Roller', moment: 'Rescued — stable in clinic', emoji: '🪶', sponsor: 'Nila S.' },
  { id: 'f4', case: 'KR-2451', species: 'Black Kite', moment: 'Released — wing fully healed', emoji: '🦅', sponsor: 'Karthik V.' },
];

const DONATION_PRODUCTS = [
  { id: 'bowl', emoji: '🥣', amount: 150, label: 'One clay water bowl', detail: 'Hung on a tree in summer. Saves ~40 birds a week.' },
  { id: 'net', emoji: '🪢', amount: 500, label: 'One square metre of green netting', detail: 'Replaces a deadly nylon net on a balcony or building façade.' },
  { id: 'rescue', emoji: '🪶', amount: 2000, label: 'One full bird rescue & recovery', detail: 'Pickup, vet, meds, food, release. Named bird, photo updates.' },
  { id: 'wildlife', emoji: '🦉', amount: 5000, label: 'One wildlife rescue', detail: 'Specialist vet, longer rehab, aviary time, soft release.' },
  { id: 'monthly-bird', emoji: '🔁', amount: 500, label: 'Monthly · Birds fund', detail: 'Funds the next emergency, whoever it is.', recurring: true },
  { id: 'summer', emoji: '☀️', amount: 1500, label: '10 water bowls every summer month', detail: 'Apr · May · Jun auto-renew. Cancel anytime.', recurring: true },
];

const TRAINING = [
  { title: 'Manja injury — bird wing', minutes: 8, level: 'Core', complete: true },
  { title: 'Heat stroke first response', minutes: 6, level: 'Core', complete: true },
  { title: 'Glass-tower collision handling', minutes: 10, level: 'Intermediate', complete: false },
  { title: 'Cattle with stuck horns — when to call goshala', minutes: 12, level: 'Coordinator', complete: false },
  { title: 'Borewell flag protocol — never attempt', minutes: 5, level: 'Core', complete: true },
  { title: 'Trust-building with reporters from low-income areas', minutes: 14, level: 'Field rescuer', complete: false },
];

const AUDIT_TRAIL = [
  { who: 'Pooja Sharma', what: 'Assigned KR-2487 to Anika Kumar', when: '2:36 PM' },
  { who: 'system', what: 'Auto-routed cruelty case CR-118 → PFA Telangana', when: '2:14 PM' },
  { who: 'Dr. Vikram Kumar', what: 'Added Day 1 note to KR-2469', when: '12:30 PM' },
  { who: 'Rohit Mehta', what: 'Photo handover · KR-2486 → Dr. Sandeep', when: '2:40 PM' },
  { who: 'system', what: 'Duplicate report merged · two reports on Indian Roller @ Cyber Towers', when: '2:09 PM' },
  { who: 'Pooja Sharma', what: 'Flagged borewell case BW-04 — do not attempt', when: '11:20 AM' },
];

const HEATMAP = [
  { area: 'Banjara Hills', cases: 38, severity: 0.92 },
  { area: 'Jubilee Hills', cases: 31, severity: 0.78 },
  { area: 'Hitech City', cases: 27, severity: 0.7 },
  { area: 'KBR Park', cases: 14, severity: 0.4 },
  { area: 'Gachibowli', cases: 22, severity: 0.62 },
  { area: 'Madhapur', cases: 19, severity: 0.55 },
  { area: 'Kondapur', cases: 16, severity: 0.46 },
  { area: 'Begumpet', cases: 12, severity: 0.36 },
];

const FOSTERS = [
  { name: 'Priya Reddy', area: 'Jubilee Hills', accepts: 'Owlets, parakeets', capacity: '3/4 birds' },
  { name: 'Anil G.', area: 'Madhapur', accepts: 'Mynas, sparrows', capacity: '2/5 birds' },
  { name: 'Sunita J.', area: 'Begumpet', accepts: 'Pigeons (injured only)', capacity: '0/3 birds' },
  { name: 'Vivek P.', area: 'Kondapur', accepts: 'Crows, kites', capacity: '1/2 birds' },
];

const LANGS = ['EN', 'తె', 'हिं'];

const ORG = {
  name: 'Animal Warriors Conservation Society',
  short: 'AWCS',
  helpline: '+91 96978 87888',
  helplineDigits: '919697887888',
  city: 'Hyderabad · Telangana',
  founded: 2019,
  center: 'Telangana’s first Bird Rehabilitation Center · Shamirpet',
};

const SANKRANTI_2025 = { rescued: 26, sheltered: 17, released_on_spot: 4, lost: 5 };

/* ============ HELPERS ============ */

const formatINR = (n) => '₹' + n.toLocaleString('en-IN');

const usePulse = () => {
  const [, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((n) => n + 1), 1500);
    return () => clearInterval(t);
  }, []);
};

const Dot = ({ color, size = 8 }) => (
  <span
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: 999,
      background: color,
      boxShadow: `0 0 0 4px ${color}22`,
      animation: 'pulse-dot 1.8s ease-in-out infinite',
      flexShrink: 0,
    }}
  />
);

const Badge = ({ status, small }) => {
  const s = STATUS[status] || STATUS.recovering;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: small ? '3px 8px' : '5px 11px',
        borderRadius: 999,
        background: s.soft,
        color: s.color,
        fontSize: small ? 10 : 11,
        fontWeight: 600,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      <Dot color={s.color} size={6} />
      {s.label}
    </span>
  );
};

const Card = ({ children, style, span, onClick, hover }) => (
  <div
    onClick={onClick}
    style={{
      background: C.paper,
      border: `1px solid ${C.line}`,
      borderRadius: 20,
      padding: 22,
      gridColumn: span ? `span ${span}` : undefined,
      transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}
    onMouseEnter={(e) => {
      if (!hover && !onClick) return;
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = '0 18px 40px -22px rgba(26,20,16,0.25)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    {children}
  </div>
);

const SectionLabel = ({ kicker, title, italic, sub }) => (
  <div style={{ marginBottom: 20 }}>
    {kicker && (
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: C.inkMuted,
          marginBottom: 8,
        }}
      >
        {kicker}
      </div>
    )}
    {title && (
      <h2
        style={{
          fontFamily: F.display,
          fontWeight: 500,
          fontSize: 'clamp(26px, 3.4vw, 40px)',
          margin: 0,
          lineHeight: 1.08,
          color: C.ink,
          letterSpacing: -0.5,
        }}
      >
        {title}
        {italic && (
          <em style={{ fontStyle: 'italic', fontWeight: 400, color: C.rust }}> {italic}</em>
        )}
      </h2>
    )}
    {sub && (
      <p style={{ margin: '10px 0 0', color: C.inkSoft, maxWidth: 620, fontSize: 15 }}>{sub}</p>
    )}
  </div>
);

const useMobile = () => {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < 900 : false);
  useEffect(() => {
    const onR = () => setM(window.innerWidth < 900);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return m;
};

/* ============ MAIN ============ */

export default function Karuna() {
  const [view, setView] = useState('public');
  const [cases, setCases] = useState(INITIAL_CASES);
  const [modal, setModal] = useState(null);
  const [activeCase, setActiveCase] = useState(null);
  const [lang, setLang] = useState('EN');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [donationProduct, setDonationProduct] = useState(null);
  const mobile = useMobile();
  usePulse();

  const stats = useMemo(() => {
    const active = cases.filter((c) => c.status !== 'released').length;
    const critical = cases.filter((c) => c.status === 'critical').length;
    const inCare = cases.filter((c) => c.status === 'recovering' || c.status === 'in-rescue').length;
    const released = cases.filter((c) => c.status === 'released').length;
    return { active, critical, inCare, released };
  }, [cases]);

  const openCase = (c) => {
    setActiveCase(c);
    setModal('case');
  };

  const openDonate = (product = null) => {
    setDonationProduct(product);
    setModal('donate');
  };

  const submitReport = (data) => {
    const id = 'KR-' + (2487 + cases.length).toString();
    const next = {
      id,
      species: data.species || 'Unknown bird',
      emoji: data.emoji || '🪶',
      threat: data.threat || 'Reported injury',
      location: data.location || 'Hyderabad',
      area: data.area || data.location?.split(',')[0] || 'Hyderabad',
      status: data.urgency === 'critical' ? 'critical' : 'in-rescue',
      urgency: data.urgency || 'moderate',
      reporter: data.anon ? 'Anonymous' : data.reporter || 'Reporter',
      reporterAnon: !!data.anon,
      volunteer: 'Auto-assigning…',
      receivedAt: 'just now',
      timeAgo: 0,
      timeline: [
        { stage: 'Report received', time: 'just now', done: true, current: true },
        { stage: 'Auto-assigning nearest volunteer', time: '—', done: false },
        { stage: 'Rescued', time: '—', done: false },
        { stage: 'In care', time: '—', done: false },
        { stage: 'Released', time: '—', done: false },
      ],
      notes: data.notes || '',
      treatment: [],
      sponsor: null,
      handovers: [],
      cost: 0,
      _new: true,
    };
    setCases((prev) => [next, ...prev]);
    setTimeout(() => {
      setCases((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                volunteer: 'Anika Kumar',
                timeline: c.timeline.map((t, i) =>
                  i === 1 ? { stage: 'Anika · 9 mins away', time: 'just now', done: true, current: true } : i === 0 ? { ...t, current: false } : t,
                ),
              }
            : c,
        ),
      );
    }, 2200);
    return id;
  };

  return (
    <div style={{ minHeight: '100vh', background: C.paper, color: C.ink, fontFamily: F.body }}>
      <DemoBanner />
      <TopBar
        view={view}
        setView={setView}
        lang={lang}
        setLang={setLang}
        onReport={() => setModal('report')}
        mobile={mobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {view === 'public' && (
        <PublicView
          cases={cases}
          onReport={() => setModal('report')}
          openCase={openCase}
          openDonate={openDonate}
          lang={lang}
        />
      )}
      {view === 'team' && (
        <TeamView
          cases={cases}
          stats={stats}
          openCase={openCase}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          mobile={mobile}
        />
      )}
      {view === 'donor' && (
        <DonorView
          cases={cases}
          openDonate={openDonate}
          openSponsor={(c) => {
            setActiveCase(c);
            setModal('sponsor');
          }}
        />
      )}

      {modal === 'report' && <ReportModal onClose={() => setModal(null)} onSubmit={submitReport} />}
      {modal === 'case' && activeCase && (
        <CaseDetailModal
          c={activeCase}
          onClose={() => setModal(null)}
          onSponsor={() => setModal('sponsor')}
        />
      )}
      {modal === 'donate' && (
        <DonateModal product={donationProduct} onClose={() => setModal(null)} />
      )}
      {modal === 'sponsor' && activeCase && (
        <SponsorModal c={activeCase} onClose={() => setModal(null)} />
      )}

      <Footer setView={setView} onReport={() => setModal('report')} />
    </div>
  );
}

/* ============ DEMO BANNER ============ */

function DemoBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      style={{
        background: C.amber,
        color: C.ink,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        fontSize: 12,
        fontWeight: 500,
        position: 'relative',
      }}
    >
      <AlertTriangle size={14} />
      <span>
        <strong>Sample data preview.</strong> Cases, team names, donations and stats are illustrative — wire <code style={{ fontFamily: F.mono, background: 'rgba(26,20,16,.08)', padding: '1px 6px', borderRadius: 4 }}>src/api.js</code> to your backend before launch.
      </span>
      <button onClick={() => setOpen(false)} style={{ position: 'absolute', right: 10, top: 6, padding: 4 }} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

/* ============ TOP BAR ============ */

function TopBar({ view, setView, lang, setLang, onReport, mobile, sidebarOpen, setSidebarOpen }) {
  const tabs = [
    { id: 'public', label: 'Public' },
    { id: 'team', label: 'Team' },
    { id: 'donor', label: 'Donor' },
  ];
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(250,246,239,0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: mobile ? '12px 16px' : '16px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {mobile && view === 'team' && (
          <button
            aria-label="Open menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: C.cream }}
          >
            <Menu size={18} />
          </button>
        )}
        <button
          onClick={() => setView('public')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}
        >
          <span style={{ fontSize: 26 }}>🪶</span>
          <span
            style={{
              fontFamily: F.display,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: -0.5,
              color: C.ink,
            }}
          >
            {view === 'team' ? 'Karuna' : 'Animal Warriors'}
          </span>
          {!mobile && (
            <span
              style={{
                fontFamily: F.display,
                fontStyle: 'italic',
                fontSize: 13,
                color: C.inkMuted,
                marginLeft: 6,
                marginTop: 6,
              }}
            >
              {view === 'team' ? '· ops · internal' : `· Conservation Society · est. ${ORG.founded}`}
            </span>
          )}
        </button>

        {!mobile && (
          <nav
            style={{
              display: 'flex',
              gap: 4,
              padding: 4,
              background: C.cream,
              borderRadius: 999,
              border: `1px solid ${C.line}`,
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: view === t.id ? C.ink : 'transparent',
                  color: view === t.id ? C.paper : C.inkSoft,
                  fontWeight: 500,
                  fontSize: 13,
                  transition: 'all .2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}

        <div style={{ display: 'flex', gap: 4, padding: 4, background: C.cream, borderRadius: 999, border: `1px solid ${C.line}` }}>
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                background: lang === l ? C.ink : 'transparent',
                color: lang === l ? C.paper : C.inkSoft,
                fontWeight: 500,
                fontSize: 12,
                minWidth: 32,
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          onClick={onReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: mobile ? '9px 14px' : '11px 18px',
            background: C.rust,
            color: C.paper,
            borderRadius: 999,
            fontWeight: 600,
            fontSize: 13,
            boxShadow: '0 10px 24px -10px rgba(196,74,26,0.55)',
          }}
        >
          <AlertCircle size={16} />
          {mobile ? 'Report' : 'Report a rescue'}
        </button>
      </div>

      {mobile && (
        <div style={{ borderTop: `1px solid ${C.line}`, padding: '8px 14px', display: 'flex', gap: 4, background: C.paper }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 12,
                background: view === t.id ? C.ink : 'transparent',
                color: view === t.id ? C.paper : C.inkSoft,
                fontWeight: 500,
                fontSize: 13,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

/* ============ PUBLIC VIEW ============ */

function PublicView({ cases, onReport, openCase, openDonate, lang }) {
  const heroLine = {
    EN: { line: 'When wings fall,', italic: 'we answer.', sub: 'One call. One tap. Immediate help — for every bird and every animal in distress across Hyderabad.' },
    'తె': { line: 'రెక్కలు రాలినప్పుడు,', italic: 'మేము ఉన్నాము.', sub: 'ఒక కాల్. ఒక టాప్. తక్షణ సహాయం.' },
    'हिं': { line: 'जब पंख गिरें,', italic: 'हम पहुँचें.', sub: 'एक कॉल. एक टैप. तुरंत मदद.' },
  }[lang] || { line: 'When wings fall,', italic: 'we answer.' };

  const recents = cases.slice(0, 8);
  const liveCases = cases.filter((c) => c.status === 'critical' || c.status === 'in-rescue').slice(0, 3);
  const released = cases.filter((c) => c.status === 'released').slice(0, 3);

  return (
    <main style={{ maxWidth: 1320, margin: '0 auto', padding: '0 16px 64px' }}>
      <section style={{ padding: 'clamp(36px, 7vw, 96px) 0 clamp(24px, 4vw, 56px)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 'clamp(20px, 3vw, 40px)',
            alignItems: 'center',
          }}
        >
          <div style={{ gridColumn: 'span 7', minWidth: 0 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 14px',
                background: C.cream,
                border: `1px solid ${C.line}`,
                borderRadius: 999,
                fontFamily: F.mono,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: C.inkSoft,
                marginBottom: 24,
              }}
            >
              <Dot color={C.rust} size={7} />
              {liveCases.length} live rescues · {ORG.city}
            </div>
            <h1
              style={{
                fontFamily: F.display,
                fontWeight: 500,
                fontSize: 'clamp(40px, 7vw, 92px)',
                lineHeight: 0.98,
                letterSpacing: -1.5,
                margin: 0,
                color: C.ink,
              }}
            >
              {heroLine.line}
              <br />
              <em style={{ fontStyle: 'italic', color: C.rust, fontWeight: 500 }}>{heroLine.italic}</em>
            </h1>
            <p
              style={{
                fontSize: 'clamp(15px, 1.5vw, 19px)',
                color: C.inkSoft,
                maxWidth: 540,
                margin: '24px 0 32px',
                lineHeight: 1.55,
              }}
            >
              {heroLine.sub || 'A WhatsApp-first rescue line for the city — for the bird with a manja-cut wing, the parakeet stuck in netting, the owlet fallen from her nest. Every wing matters. Every minute counts.'}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={onReport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '15px 22px',
                  background: C.rust,
                  color: C.paper,
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: '0 18px 36px -14px rgba(196,74,26,0.55)',
                }}
              >
                <AlertCircle size={18} /> Report a rescue
                <ChevronRight size={16} />
              </button>
              <a
                href={`https://wa.me/${ORG.helplineDigits}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '15px 22px',
                  background: C.ink,
                  color: C.paper,
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                <Phone size={16} /> WhatsApp {ORG.helpline}
              </a>
              <button
                onClick={() => openDonate(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '15px 22px',
                  background: C.cream,
                  border: `1px solid ${C.line}`,
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 15,
                  color: C.ink,
                }}
              >
                <Heart size={16} /> Donate
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 28,
                marginTop: 40,
                flexWrap: 'wrap',
                color: C.inkSoft,
                fontSize: 13,
              }}
            >
              {[
                ['12,400+', 'rescued lives'],
                ['320', 'volunteers · 4 cities'],
                ['24×7', 'helpline since ' + ORG.founded],
                ['1st', 'bird rehab center in TS'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: F.display, fontSize: 26, color: C.ink, fontWeight: 600 }}>{n}</div>
                  <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ gridColumn: 'span 5', minWidth: 0 }}>
            <HeroCard cases={liveCases} openCase={openCase} />
          </div>
        </div>
      </section>

      <section
        style={{
          background: C.ink,
          color: C.paper,
          borderRadius: 24,
          padding: '18px 0',
          overflow: 'hidden',
          position: 'relative',
          margin: '12px 0 56px',
        }}
      >
        <div style={{ display: 'flex', width: 'fit-content', animation: 'marquee 38s linear infinite', gap: 36, fontFamily: F.display, fontSize: 19 }}>
          {[...recents, ...recents].map((c, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap', paddingRight: 8 }}>
              <span style={{ fontSize: 22 }}>{c.emoji}</span>
              <span style={{ fontStyle: 'italic' }}>{c.species}</span>
              <span style={{ color: '#9c8b78', fontFamily: F.body, fontSize: 13 }}>· {c.area}</span>
              <span style={{ color: STATUS[c.status].color, fontFamily: F.mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                · {STATUS[c.status].label}
              </span>
              <span style={{ color: '#9c8b78' }}>·</span>
            </span>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 64 }}>
        <SectionLabel
          kicker="01 · The reporter flow"
          title="Three taps."
          italic="That's it."
          sub="A photo, a category, a pin. We do the rest — auto-assign the nearest volunteer, surface the right first-aid, and keep you updated like a food-delivery tracker."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          <Card span={5} hover onClick={onReport}>
            <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, marginBottom: 12 }}>STEP 1</div>
            <h3 style={{ fontFamily: F.display, fontSize: 26, margin: '0 0 8px', fontWeight: 500 }}>What kind of life?</h3>
            <p style={{ color: C.inkSoft, margin: '0 0 18px', fontSize: 14 }}>Bird, animal, or wildlife. One tap.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { l: 'Bird', e: '🪶' },
                { l: 'Animal', e: '🐕' },
                { l: 'Wildlife', e: '🦉' },
              ].map((x) => (
                <span key={x.l} style={pill()}>
                  <span style={{ fontSize: 18 }}>{x.e}</span> {x.l}
                </span>
              ))}
            </div>
          </Card>
          <Card span={4} hover onClick={onReport}>
            <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, marginBottom: 12 }}>STEP 2</div>
            <h3 style={{ fontFamily: F.display, fontSize: 26, margin: '0 0 8px', fontWeight: 500 }}>What's wrong?</h3>
            <p style={{ color: C.inkSoft, margin: '0 0 18px', fontSize: 14 }}>Injured · stuck · orphaned · cruelty.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Injured', 'Stuck', 'Orphaned', 'Cruelty'].map((l) => (
                <span key={l} style={pill()}>
                  {l}
                </span>
              ))}
            </div>
          </Card>
          <Card span={3} hover onClick={onReport} style={{ background: C.ink, color: C.paper, borderColor: C.ink }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: '#9c8b78', marginBottom: 12 }}>STEP 3</div>
            <h3 style={{ fontFamily: F.display, fontSize: 24, margin: '0 0 8px', fontWeight: 500 }}>How urgent?</h3>
            <p style={{ color: '#c9bba8', margin: '0 0 18px', fontSize: 14 }}>We dispatch in seconds.</p>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 16px',
                background: C.rust,
                color: C.paper,
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Start <ArrowUpRight size={14} />
            </button>
          </Card>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
          {[
            ['📸', 'Photo + video'],
            ['🎙️', 'Voice note · Telugu / Hindi / English'],
            ['📍', 'Auto-pinned GPS'],
            ['🕊️', 'Anonymous for cruelty cases'],
            ['📶', 'Offline draft mode'],
            ['💬', 'WhatsApp fallback'],
            ['↗️', 'Share to neighbour'],
          ].map(([e, l]) => (
            <span
              key={l}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                background: C.paper,
                border: `1px solid ${C.line}`,
                borderRadius: 999,
                fontSize: 13,
                color: C.inkSoft,
              }}
            >
              <span>{e}</span>
              {l}
            </span>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 64 }}>
        <SectionLabel
          kicker="02 · Before we arrive"
          title="Do this."
          italic="Don't do that."
          sub="Most preventable harm happens in the first ten minutes — from well-meaning people who panic. Here is what to do, in plain language."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          {EDUCATION.bird.map((row, i) => (
            <Card key={i} span={i === 0 ? 5 : i === 1 ? 4 : 3} hover>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.moss, fontFamily: F.mono, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                    <CheckCircle2 size={14} /> Do
                  </div>
                  <div style={{ fontFamily: F.display, fontSize: 18, lineHeight: 1.3, color: C.ink, fontWeight: 500 }}>{row.do}</div>
                </div>
                <div style={{ height: 1, background: C.line }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.rust, fontFamily: F.mono, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                    <X size={14} /> Don't
                  </div>
                  <div style={{ fontFamily: F.display, fontSize: 18, lineHeight: 1.3, color: C.ink, fontWeight: 500, fontStyle: 'italic' }}>{row.dont}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          <Card span={8} style={{ background: C.cream }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 44 }}>🚫</div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <h3 style={{ fontFamily: F.display, margin: 0, fontSize: 22, fontWeight: 500 }}>Borewell trapped — never attempt yourself</h3>
                <p style={{ color: C.inkSoft, margin: '8px 0 0', fontSize: 14 }}>Borewells need specialists. Forest Department and the Range Officer are flagged automatically — we'll share their contact within seconds of your report. Do not lower buckets, rope, or hands.</p>
              </div>
            </div>
          </Card>
          <Card span={4} hover onClick={onReport} style={{ background: C.ink, color: C.paper, borderColor: C.ink }}>
            <h3 style={{ fontFamily: F.display, margin: 0, fontSize: 22, fontWeight: 500 }}>Short first-aid videos</h3>
            <p style={{ color: '#c9bba8', margin: '8px 0 14px', fontSize: 14 }}>Telugu, Hindi, English — 60-second clips per scenario.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Manja cut', 'Heat stroke', 'Glass collision', 'Fallen nestling'].map((l) => (
                <span key={l} style={{ ...pill(), background: 'rgba(255,255,255,.06)', borderColor: 'rgba(255,255,255,.18)', color: C.paper }}>
                  ▶ {l}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section style={{ marginBottom: 64 }}>
        <SectionLabel kicker="03 · Calendar of distress" title="The city's danger map," italic="festival by festival." sub="Karuna runs ahead of the calendar. Three days before Sankranti the manja drill begins — automatically." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          {FESTIVAL_ALERTS.map((f, i) => {
            const spans = [7, 5, 5, 7];
            const live = f.status === 'live';
            return (
              <Card key={f.id} span={spans[i]} hover>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, textTransform: 'uppercase' }}>{f.when}</div>
                    <h3 style={{ fontFamily: F.display, fontSize: 24, margin: '6px 0 0', fontWeight: 500, color: C.ink, fontStyle: live ? 'italic' : 'normal' }}>{f.title}</h3>
                  </div>
                  <Badge status={live ? 'critical' : 'recovering'} small />
                </div>
                <p style={{ color: C.inkSoft, fontSize: 14, margin: 0 }}>{f.detail}</p>
                {f.id === 'sankranti' && (
                  <div style={{ marginTop: 18, padding: 14, background: C.cream, borderRadius: 14, fontFamily: F.mono, fontSize: 12, color: C.inkSoft }}>
                    Sankranti 2025 · <strong style={{ color: C.ink }}>{SANKRANTI_2025.rescued}</strong> rescued, {SANKRANTI_2025.released_on_spot} released on spot, {SANKRANTI_2025.sheltered} to shelter — and {SANKRANTI_2025.lost} we could not save.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: 64 }}>
        <SectionLabel kicker="04 · Species guide" title="Who flies the city," italic="and how to help each one." sub="Search by name or scroll. Tap any bird for handling notes and the most common injuries we treat." />
        <SpeciesGrid />
      </section>

      {released.length > 0 && (
        <section style={{ marginBottom: 64 }}>
          <SectionLabel kicker="05 · Releases this week" title="Painted, healed," italic="and released." sub="Every story has a follow-up." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
            {released.map((c, i) => (
              <Card key={c.id} span={i === 0 ? 6 : 3} hover onClick={() => openCase(c)}>
                <div style={{ fontSize: i === 0 ? 64 : 40, marginBottom: 10 }}>{c.emoji}</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: C.inkMuted, letterSpacing: 1.5 }}>{c.id}</div>
                <h3 style={{ fontFamily: F.display, margin: '6px 0 6px', fontWeight: 500, fontSize: i === 0 ? 26 : 18 }}>
                  {c.species} <em style={{ fontStyle: 'italic', color: C.sky }}>released</em>
                </h3>
                <p style={{ color: C.inkSoft, fontSize: 13, margin: 0 }}>{c.notes}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginBottom: 64 }}>
        <SectionLabel kicker="06 · Awareness & community" title="Bring us to your" italic="school, office, or building." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          <Card span={4} hover>
            <BookOpen size={26} color={C.rust} />
            <h3 style={{ fontFamily: F.display, fontSize: 22, margin: '12px 0 6px', fontWeight: 500 }}>School & RWA workshops</h3>
            <p style={{ color: C.inkSoft, fontSize: 14, margin: '0 0 16px' }}>45-minute sessions on safe rescue, the manja menace, and bird-friendly balconies. Free for government schools.</p>
            <button style={ghostBtn()}>Request a workshop <ArrowUpRight size={14} /></button>
          </Card>
          <Card span={4} hover>
            <Shield size={26} color={C.sky} />
            <h3 style={{ fontFamily: F.display, fontSize: 22, margin: '12px 0 6px', fontWeight: 500 }}>Building safety audit</h3>
            <p style={{ color: C.inkSoft, fontSize: 14, margin: '0 0 16px' }}>Glass-tower collision risk audit. We map dangerous façades and prescribe decals, perches, and netting.</p>
            <button style={ghostBtn()}>Book an audit <ArrowUpRight size={14} /></button>
          </Card>
          <Card span={4} hover>
            <Users size={26} color={C.moss} />
            <h3 style={{ fontFamily: F.display, fontSize: 22, margin: '12px 0 6px', fontWeight: 500 }}>Become a volunteer</h3>
            <p style={{ color: C.inkSoft, fontSize: 14, margin: '0 0 16px' }}>Driver · foster · vet · content · IT · awareness champion. Skill-matched. Trained in 4 weekends.</p>
            <button style={ghostBtn()}>Sign up <ArrowUpRight size={14} /></button>
          </Card>
        </div>
      </section>

      <section style={{ marginBottom: 64 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          <Card span={7}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontFamily: F.display, fontSize: 22, margin: 0, fontWeight: 500 }}>Foster home registry</h3>
              <span style={pill()}>4 active · 2 spots open</span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {FOSTERS.map((f) => (
                <div key={f.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, padding: '12px 14px', background: C.cream, borderRadius: 12, alignItems: 'center', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{f.name}</span>
                  <span style={{ color: C.inkSoft }}>{f.area}</span>
                  <span style={{ color: C.inkSoft }}>{f.accepts}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: C.moss }}>{f.capacity}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card span={5} style={{ background: C.ink, color: C.paper, borderColor: C.ink }}>
            <h3 style={{ fontFamily: F.display, fontSize: 22, margin: 0, fontWeight: 500 }}>Regional WhatsApp groups</h3>
            <p style={{ color: '#c9bba8', fontSize: 14, margin: '8px 0 18px' }}>Auto-managed by area and rescue type. Join the ones near you.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Hyd West · Birds', 'Hyd East · Wildlife', 'Sec\'bad · Strays', 'Manja first-responders', 'Foster network'].map((g) => (
                <span key={g} style={{ padding: '8px 12px', background: 'rgba(255,255,255,.06)', borderRadius: 999, fontSize: 12, border: '1px solid rgba(255,255,255,.18)' }}>{g}</span>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <Card style={{ background: 'linear-gradient(135deg, #1a1410 0%, #2c211a 100%)', color: C.paper, borderColor: C.ink, padding: 'clamp(28px,4vw,56px)', borderRadius: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'clamp(20px, 3vw, 40px)', alignItems: 'center' }}>
            <div style={{ gridColumn: 'span 7', minWidth: 0 }}>
              <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: '#9c8b78', marginBottom: 16, textTransform: 'uppercase' }}>The promise</div>
              <h2 style={{ fontFamily: F.display, fontSize: 'clamp(28px, 4vw, 48px)', margin: 0, fontWeight: 500, lineHeight: 1.05 }}>
                Because no animal should suffer <em style={{ fontStyle: 'italic', color: C.amber }}>because no one knew who to call.</em>
              </h2>
              <p style={{ color: '#c9bba8', margin: '20px 0 0', maxWidth: 560 }}>
                Karuna is a digital line built on top of {ORG.name}'s 24×7 helpline — Hyderabad's longest-running citizen rescue network. {ORG.helpline}.
              </p>
            </div>
            <div style={{ gridColumn: 'span 5' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Wings mended', '4,820'],
                  ['Water bowls hung', '11,300'],
                  ['Sqm netting replaced', '6,400'],
                  ['Festival drives run', '38'],
                ].map(([l, n]) => (
                  <div key={l} style={{ padding: 18, background: 'rgba(255,255,255,.05)', borderRadius: 16, border: '1px solid rgba(255,255,255,.10)' }}>
                    <div style={{ fontFamily: F.display, fontSize: 30, color: C.paper }}>{n}</div>
                    <div style={{ color: '#9c8b78', fontSize: 12, marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

const pill = () => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  background: C.cream,
  border: `1px solid ${C.line}`,
  borderRadius: 999,
  fontSize: 13,
  color: C.inkSoft,
  fontWeight: 500,
});

const ghostBtn = () => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '11px 16px',
  background: C.cream,
  border: `1px solid ${C.line}`,
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  color: C.ink,
});

function HeroCard({ cases, openCase }) {
  return (
    <div
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 28,
        padding: 22,
        boxShadow: '0 30px 60px -36px rgba(26,20,16,0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dot color={C.rust} />
          <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, textTransform: 'uppercase' }}>Live rescues</span>
        </div>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: C.inkMuted }}>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cases.map((c) => (
          <button
            key={c.id}
            onClick={() => openCase(c)}
            style={{
              textAlign: 'left',
              display: 'grid',
              gridTemplateColumns: '40px 1fr auto',
              gap: 12,
              alignItems: 'center',
              padding: 14,
              background: C.cream,
              borderRadius: 16,
              border: `1px solid ${C.line}`,
              transition: 'transform .2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
          >
            <div style={{ fontSize: 28 }}>{c.emoji}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 500, color: C.ink }}>{c.species}</div>
              <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <MapPin size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                {c.area} · {c.receivedAt}
              </div>
            </div>
            <Badge status={c.status} small />
          </button>
        ))}
      </div>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Activity size={14} color={C.rust} />
        <span style={{ fontSize: 12, color: C.inkSoft }}>Status updates land here the moment volunteers move.</span>
      </div>
    </div>
  );
}

/* ============ TEAM VIEW ============ */

function TeamView({ cases, stats, openCase, sidebarOpen, setSidebarOpen, mobile }) {
  const [section, setSection] = useState('cases');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('urgency');
  const [q, setQ] = useState('');

  const sections = [
    { id: 'cases', label: 'Cases', icon: AlertCircle },
    { id: 'volunteers', label: 'Volunteers', icon: Users },
    { id: 'partners', label: 'Partner router', icon: Shield },
    { id: 'heatmap', label: 'Rescue heatmap', icon: MapPin },
    { id: 'inventory', label: 'Inventory', icon: Activity },
    { id: 'clinics', label: 'Vet network', icon: Stethoscope },
    { id: 'training', label: 'Training', icon: BookOpen },
    { id: 'audit', label: 'Audit trail', icon: Clock },
    { id: 'impact', label: 'Impact poster', icon: TrendingUp },
    { id: 'grants', label: 'Grants', icon: Feather },
  ];

  const filtered = useMemo(() => {
    let r = cases;
    if (filter !== 'all') r = r.filter((c) => c.status === filter);
    if (q) r = r.filter((c) => (c.species + c.area + c.id + c.threat).toLowerCase().includes(q.toLowerCase()));
    const urgencyRank = { critical: 0, moderate: 1, low: 2 };
    r = [...r].sort((a, b) => {
      if (sortBy === 'urgency') return (urgencyRank[a.urgency] ?? 3) - (urgencyRank[b.urgency] ?? 3);
      if (sortBy === 'time') return a.timeAgo - b.timeAgo;
      if (sortBy === 'area') return a.area.localeCompare(b.area);
      return 0;
    });
    return r;
  }, [cases, filter, sortBy, q]);

  return (
    <div style={{ display: 'flex', maxWidth: 1440, margin: '0 auto', minHeight: 'calc(100vh - 72px)' }}>
      {(!mobile || sidebarOpen) && (
        <aside
          style={{
            position: mobile ? 'fixed' : 'sticky',
            top: mobile ? 0 : 72,
            left: 0,
            height: mobile ? '100vh' : 'calc(100vh - 72px)',
            width: 240,
            background: C.paper,
            borderRight: `1px solid ${C.line}`,
            padding: '24px 14px',
            zIndex: mobile ? 40 : 1,
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          {mobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', top: 12, right: 12, padding: 8 }}>
              <X size={18} />
            </button>
          )}
          <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, marginBottom: 14, padding: '0 12px' }}>OPERATIONS</div>
          {sections.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSection(s.id);
                  if (mobile) setSidebarOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  marginBottom: 2,
                  background: active ? C.ink : 'transparent',
                  color: active ? C.paper : C.inkSoft,
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  transition: 'all .15s',
                }}
              >
                <Icon size={16} />
                {s.label}
              </button>
            );
          })}

          <div style={{ marginTop: 28, padding: 14, background: C.cream, borderRadius: 12, fontSize: 12 }}>
            <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.inkMuted, marginBottom: 8 }}>HELPLINE</div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 500 }}>{ORG.helpline}</div>
            <div style={{ color: C.inkSoft, marginTop: 4 }}>24×7 since {ORG.founded}</div>
          </div>
        </aside>
      )}

      <main style={{ flex: 1, minWidth: 0, padding: 'clamp(20px, 3vw, 36px)' }}>
        <div
          style={{
            background: C.ink,
            color: C.paper,
            borderRadius: 14,
            padding: '10px 16px',
            marginBottom: 24,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <Dot color={C.rust} />
          <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2 }}>LIVE</span>
          <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{ display: 'inline-block', animation: 'ticker 30s linear infinite' }}>
              <span style={{ marginRight: 30 }}>KR-2487 · Black Kite · manja injury · Banjara Hills · Anika 8 mins away</span>
              <span style={{ marginRight: 30, color: C.amber }}>KR-2486 · Indian Roller · in clinic · stable</span>
              <span style={{ marginRight: 30, color: C.moss }}>KR-2479 · Spotted Owlet · Day 4 · gaining weight</span>
              <span style={{ marginRight: 30, color: C.sky }}>KR-2472 · Cattle Egret · RELEASED @ Osman Sagar</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { l: 'Active cases', n: stats.active, c: C.ink, sub: 'across the city' },
            { l: 'Critical', n: stats.critical, c: C.rust, sub: 'need eyes now', pulse: true },
            { l: 'In care', n: stats.inCare, c: C.amber, sub: 'clinic + fosters' },
            { l: 'Released this month', n: stats.released + 47, c: C.sky, sub: '+12 vs Apr', trend: true },
          ].map((s) => (
            <div key={s.l} style={{ padding: 22, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 18, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, textTransform: 'uppercase' }}>{s.l}</span>
                {s.pulse && <Dot color={s.c} />}
                {s.trend && <TrendingUp size={14} color={s.c} />}
              </div>
              <div style={{ fontFamily: F.display, fontSize: 44, color: s.c, fontWeight: 500, lineHeight: 1, marginTop: 12 }}>{s.n}</div>
              <div style={{ color: C.inkSoft, fontSize: 12, marginTop: 6 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {section === 'cases' && (
          <CasesPanel
            cases={filtered}
            filter={filter}
            setFilter={setFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            q={q}
            setQ={setQ}
            openCase={openCase}
          />
        )}
        {section === 'volunteers' && <VolunteersPanel />}
        {section === 'partners' && <PartnersPanel />}
        {section === 'heatmap' && <HeatmapPanel cases={cases} />}
        {section === 'inventory' && <InventoryPanel />}
        {section === 'clinics' && <ClinicsPanel />}
        {section === 'training' && <TrainingPanel />}
        {section === 'audit' && <AuditPanel />}
        {section === 'impact' && <ImpactPosterPanel cases={cases} />}
        {section === 'grants' && <GrantsPanel cases={cases} />}
      </main>
    </div>
  );
}

function CasesPanel({ cases, filter, setFilter, sortBy, setSortBy, q, setQ, openCase }) {
  const filters = ['all', 'critical', 'in-rescue', 'recovering', 'released'];
  return (
    <div>
      <SectionLabel kicker="Active board" title="Today's cases," italic="by urgency." />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: 12, color: C.inkMuted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search case, species, area…"
            style={{ width: '100%', padding: '10px 12px 10px 40px', background: C.cream, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: C.cream, borderRadius: 999, border: `1px solid ${C.line}` }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: filter === f ? C.ink : 'transparent',
                color: filter === f ? C.paper : C.inkSoft,
                fontSize: 12,
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All' : STATUS[f]?.label || f}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '9px 12px', background: C.cream, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 12 }}
        >
          <option value="urgency">Sort · urgency</option>
          <option value="time">Sort · most recent</option>
          <option value="area">Sort · area</option>
        </select>
      </div>

      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1.4fr 1fr 110px 90px', padding: '12px 18px', background: C.cream, fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: C.inkMuted, textTransform: 'uppercase', borderBottom: `1px solid ${C.line}` }}>
          <div>Case</div>
          <div>Species</div>
          <div>Threat · location</div>
          <div>Volunteer</div>
          <div>Status</div>
          <div></div>
        </div>
        {cases.map((c) => (
          <button
            key={c.id}
            onClick={() => openCase(c)}
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr 1.4fr 1fr 110px 90px',
              padding: '14px 18px',
              borderBottom: `1px solid ${C.line}`,
              width: '100%',
              textAlign: 'left',
              alignItems: 'center',
              gap: 8,
              background: c._new ? C.amberSoft : 'transparent',
              transition: 'background .2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.cream)}
            onMouseLeave={(e) => (e.currentTarget.style.background = c._new ? C.amberSoft : 'transparent')}
          >
            <div style={{ fontFamily: F.mono, fontSize: 12, color: C.inkSoft }}>{c.id}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ fontSize: 22 }}>{c.emoji}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 500, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.species}</div>
                <div style={{ fontSize: 11, color: C.inkMuted }}>{c.receivedAt}</div>
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.threat}</div>
              <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 2 }}>
                <MapPin size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                {c.area}
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.volunteer}</div>
            <Badge status={c.status} small />
            <div style={{ textAlign: 'right' }}>
              <ChevronRight size={16} color={C.inkMuted} />
            </div>
          </button>
        ))}
        {cases.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: C.inkMuted, fontStyle: 'italic' }}>No cases match these filters.</div>
        )}
      </div>
    </div>
  );
}

function VolunteersPanel() {
  const statusColor = (s) => ({ 'on-duty': C.moss, 'in-field': C.rust, 'on-call': C.amber, 'off-duty': C.inkMuted }[s]);
  return (
    <div>
      <SectionLabel kicker="Roster" title="Who's on" italic="right now." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {TEAM.map((t) => (
          <Card key={t.name} hover>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  background: C.cream,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: F.display,
                  fontWeight: 500,
                  color: C.ink,
                  fontSize: 17,
                  border: `1px solid ${C.line}`,
                }}
              >
                {t.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 500 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: C.inkMuted }}>{t.role}</div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: F.mono, letterSpacing: 1.4, color: statusColor(t.status), textTransform: 'uppercase' }}>
                <Dot color={statusColor(t.status)} size={6} />
                {t.status.replace('-', ' ')}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 10 }}>
              <MapPin size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
              {t.location} · <strong style={{ color: C.ink }}>{t.cases}</strong> active case{t.cases === 1 ? '' : 's'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {t.skills.map((s) => (
                <span key={s} style={{ padding: '4px 10px', background: C.cream, borderRadius: 999, fontSize: 11, color: C.inkSoft }}>{s}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PartnersPanel() {
  return (
    <div>
      <SectionLabel kicker="Auto-router" title="When we cannot," italic="they can." sub="Partner NGOs receive auto-forwarded cases by type. Reporter is told within seconds. We track outcomes." />
      <div style={{ display: 'grid', gap: 12 }}>
        {PARTNERS.map((p) => (
          <Card key={p.name}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>Contact · {p.contact}</div>
              </div>
              <div style={{ fontSize: 13, color: C.inkSoft }}>{p.kind}</div>
              <div style={{ fontFamily: F.mono, fontSize: 13, color: C.ink }}>
                <strong>{p.cases}</strong> <span style={{ color: C.inkMuted }}>this month</span>
              </div>
              <Badge status={p.status === 'live' ? 'recovering' : 'critical'} small />
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.rust, fontWeight: 600, fontSize: 13 }}>Open <ArrowUpRight size={14} /></button>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: 18, background: C.cream, borderRadius: 16, fontSize: 13, color: C.inkSoft, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle size={18} color={C.rust} />
        <div>
          <strong style={{ color: C.ink }}>Borewell rule:</strong> any borewell-trapped report is auto-flagged "do not attempt" and the reporter receives the Range Officer's number within 5 seconds. Karuna never dispatches volunteers to borewells.
        </div>
      </div>
    </div>
  );
}

function HeatmapPanel({ cases }) {
  return (
    <div>
      <SectionLabel kicker="Density" title="Where the city" italic="needs us most." sub="Live density of cases by area. Drives the next awareness push and the water-bowl placement plan." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
        <Card span={8}>
          <div style={{ display: 'grid', gap: 12 }}>
            {HEATMAP.sort((a, b) => b.severity - a.severity).map((h) => (
              <div key={h.area} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 60px', alignItems: 'center', gap: 14 }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 500 }}>{h.area}</div>
                <div style={{ height: 26, background: C.cream, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      width: `${h.severity * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${C.amber} 0%, ${C.rust} 100%)`,
                      borderRadius: 8,
                      transition: 'width .6s ease',
                    }}
                  />
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 13, textAlign: 'right' }}>{h.cases}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card span={4} style={{ background: C.ink, color: C.paper, borderColor: C.ink }}>
          <h3 style={{ fontFamily: F.display, fontSize: 22, margin: 0, fontWeight: 500 }}>This month's plan</h3>
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {[
              { area: 'Banjara Hills', plan: 'Manja awareness drive @ 8 RWAs', color: C.rust },
              { area: 'Hitech City', plan: 'Glass-tower decal pilot · 2 buildings', color: C.amber },
              { area: 'Gachibowli', plan: 'Transformer cover request · TSSPDCL', color: C.sky },
            ].map((p) => (
              <div key={p.area} style={{ borderLeft: `3px solid ${p.color}`, paddingLeft: 12 }}>
                <div style={{ fontFamily: F.display, fontSize: 15 }}>{p.area}</div>
                <div style={{ fontSize: 12, color: '#c9bba8' }}>{p.plan}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function InventoryPanel() {
  return (
    <div>
      <SectionLabel kicker="Supplies" title="What we have," italic="what we need." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        {INVENTORY.map((i) => {
          const low = i.stock < i.low;
          const pct = Math.min((i.stock / (i.low * 2)) * 100, 100);
          return (
            <Card key={i.item}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 500 }}>{i.item}</div>
                {low && <span style={{ fontSize: 10, padding: '3px 8px', background: C.rustSoft, color: C.rust, borderRadius: 999, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Low</span>}
              </div>
              <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 500, color: low ? C.rust : C.ink }}>
                {i.stock} <span style={{ fontSize: 13, fontFamily: F.body, color: C.inkMuted, fontWeight: 400 }}>{i.unit}</span>
              </div>
              <div style={{ height: 6, background: C.cream, borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: low ? C.rust : C.moss }} />
              </div>
              <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 6 }}>Restock at {i.low} {i.unit}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ClinicsPanel() {
  return (
    <div>
      <SectionLabel kicker="Care network" title="Where we can take" italic="this bird right now." />
      <div style={{ display: 'grid', gap: 12 }}>
        {VET_CLINICS.map((v) => (
          <Card key={v.name} hover>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.4fr 1fr auto', gap: 14, alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 500 }}>{v.name}</div>
                <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}><MapPin size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />{v.area}</div>
              </div>
              <div style={{ fontSize: 13, color: C.inkSoft }}>{v.specialty}</div>
              <a href={`tel:${v.phone.replace(/\s/g, '')}`} style={{ fontFamily: F.mono, fontSize: 13, color: C.ink, textDecoration: 'none' }}>
                {v.phone}
              </a>
              <span style={{ fontSize: 12, color: C.moss, fontWeight: 600 }}>{v.open}</span>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.rust, fontWeight: 600, fontSize: 13 }}>Route case <ArrowUpRight size={14} /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TrainingPanel() {
  return (
    <div>
      <SectionLabel kicker="Volunteer training" title="Certified by case study," italic="not by quiz." sub="Real Hyderabad cases, do/don't, photo proof. Required modules unlock dispatch eligibility." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {TRAINING.map((t) => (
          <Card key={t.title} hover>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.inkMuted, textTransform: 'uppercase' }}>{t.level} · {t.minutes} min</span>
              {t.complete ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.moss, fontWeight: 600 }}>
                  <CheckCircle2 size={13} /> Certified
                </span>
              ) : (
                <span style={{ fontSize: 11, color: C.amber, fontWeight: 600 }}>To do</span>
              )}
            </div>
            <h3 style={{ fontFamily: F.display, fontSize: 19, margin: '12px 0 14px', fontWeight: 500, lineHeight: 1.25 }}>{t.title}</h3>
            <button style={ghostBtn()}>{t.complete ? 'Review' : 'Start module'} <ChevronRight size={14} /></button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AuditPanel() {
  return (
    <div>
      <SectionLabel kicker="Trust by transparency" title="Every action," italic="logged." />
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16 }}>
        {AUDIT_TRAIL.map((a, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', gap: 14, padding: '14px 18px', borderBottom: i === AUDIT_TRAIL.length - 1 ? 'none' : `1px solid ${C.line}`, alignItems: 'center' }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: a.who === 'system' ? C.sky : C.ink, fontWeight: a.who === 'system' ? 600 : 500 }}>{a.who}</div>
            <div style={{ fontSize: 14, color: C.ink }}>{a.what}</div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.inkMuted, textAlign: 'right' }}>{a.when}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImpactPosterPanel({ cases }) {
  const released = cases.filter((c) => c.status === 'released').length + 47;
  const inCare = cases.filter((c) => c.status !== 'released').length;
  return (
    <div>
      <SectionLabel kicker="Auto-generated" title="May 2026" italic="impact poster." sub="Replaces the Excel-built one. Auto-refreshed daily. Download as PNG for WhatsApp groups and donors." />
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1410 0%, #2c211a 60%, #c44a1a 220%)',
          borderRadius: 28,
          padding: 'clamp(28px, 4vw, 56px)',
          color: C.paper,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 3, color: '#c9bba8', textTransform: 'uppercase' }}>Animal Warriors · Hyderabad</div>
        <h1 style={{ fontFamily: F.display, fontSize: 'clamp(36px, 6vw, 72px)', margin: '12px 0 0', fontWeight: 500, lineHeight: 0.96, letterSpacing: -1 }}>
          May 2026 — <em style={{ fontStyle: 'italic', color: C.amber }}>every wing answered.</em>
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 36 }}>
          {[
            [released, 'rescues completed'],
            [inCare, 'in active care'],
            [11300, 'water bowls hung'],
            [4, 'partner NGOs'],
          ].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: F.display, fontSize: 'clamp(28px, 4vw, 52px)', color: C.paper, fontWeight: 500 }}>{typeof n === 'number' ? n.toLocaleString('en-IN') : n}</div>
              <div style={{ color: '#c9bba8', fontSize: 12, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: F.mono }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 36, padding: 22, background: 'rgba(255,255,255,.06)', borderRadius: 18, border: '1px solid rgba(255,255,255,.12)', maxWidth: 520 }}>
          <div style={{ fontFamily: F.display, fontStyle: 'italic', fontSize: 22, lineHeight: 1.4 }}>
            "Painted, healed, and released — every story has a follow-up."
          </div>
          <div style={{ color: '#c9bba8', fontSize: 12, marginTop: 10 }}>— Dr. Sandeep Reddy, Lead Avian Vet</div>
        </div>
        <div style={{ position: 'absolute', bottom: 20, right: 24, fontFamily: F.mono, fontSize: 11, color: '#9c8b78' }}>{ORG.helpline} · awcsindia.org</div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <button style={{ ...ghostBtn(), background: C.ink, color: C.paper, borderColor: C.ink }}>Download PNG <ArrowUpRight size={14} /></button>
        <button style={ghostBtn()}>Share to WhatsApp groups <Send size={14} /></button>
        <button style={ghostBtn()}>Edit copy</button>
      </div>
    </div>
  );
}

function GrantsPanel({ cases }) {
  const avgCost = Math.round(cases.reduce((a, c) => a + (c.cost || 0), 0) / cases.length);
  return (
    <div>
      <SectionLabel kicker="Grants & cost-per-rescue" title="The numbers" italic="grant officers want." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
        <Card span={5}>
          <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, textTransform: 'uppercase' }}>Average cost per rescue</div>
          <div style={{ fontFamily: F.display, fontSize: 52, fontWeight: 500, color: C.ink, marginTop: 10 }}>{formatINR(avgCost)}</div>
          <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 6 }}>Driver fuel + vet + meds + food + aviary days. Pulled live from case ledger.</div>
        </Card>
        <Card span={7}>
          <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 500, margin: 0 }}>Pre-filled grant templates</div>
          <p style={{ color: C.inkSoft, fontSize: 14, margin: '8px 0 18px' }}>Each template auto-fills with the last 90 days of real impact data.</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { name: 'WTI Quick Response Grant', size: '₹3,00,000', match: '94% fit' },
              { name: 'HCL CSR · Urban Wildlife', size: '₹15,00,000', match: '88% fit' },
              { name: 'Wildlife SOS · partner pool', size: '₹5,00,000', match: '76% fit' },
            ].map((g) => (
              <div key={g.name} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr auto', gap: 12, alignItems: 'center', padding: '12px 14px', background: C.cream, borderRadius: 12 }}>
                <span style={{ fontWeight: 600 }}>{g.name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 13 }}>{g.size}</span>
                <span style={{ fontSize: 12, color: C.moss, fontWeight: 600 }}>{g.match}</span>
                <button style={{ color: C.rust, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>Open <ArrowUpRight size={13} /></button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SpeciesGrid() {
  const [q, setQ] = useState('');
  const filtered = SPECIES_GUIDE.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div style={{ position: 'relative', maxWidth: 380, marginBottom: 18 }}>
        <Search size={16} style={{ position: 'absolute', left: 16, top: 14, color: C.inkMuted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search species…"
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            background: C.cream,
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            fontSize: 14,
          }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {filtered.map((s) => (
          <div key={s.name} style={{ padding: 18, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, transition: 'transform .2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 36 }}>{s.emoji}</div>
              {s.accepted === 'conditional' && (
                <span style={{ fontSize: 10, padding: '3px 8px', background: C.amberSoft, color: C.amber, borderRadius: 999, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  if injured
                </span>
              )}
            </div>
            <h4 style={{ fontFamily: F.display, fontSize: 19, margin: '10px 0 4px', fontWeight: 500 }}>{s.name}</h4>
            <div style={{ fontSize: 12, color: C.inkMuted, marginBottom: 12 }}>{s.habitat}</div>
            <div style={{ fontSize: 12, color: C.rust, marginBottom: 4, fontWeight: 600 }}>Common injury</div>
            <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 10 }}>{s.injury}</div>
            <div style={{ fontSize: 12, color: C.moss, marginBottom: 4, fontWeight: 600 }}>First aid</div>
            <div style={{ fontSize: 13, color: C.inkSoft }}>{s.firstAid}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: 24, textAlign: 'center', color: C.inkMuted, fontStyle: 'italic' }}>
            No species found.
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ DONOR VIEW ============ */

function DonorView({ cases, openDonate, openSponsor }) {
  const sponsorable = cases.filter((c) => c.status !== 'released' && !c.sponsor).slice(0, 4);
  return (
    <main style={{ maxWidth: 1320, margin: '0 auto', padding: '0 16px 64px' }}>
      <section style={{ padding: 'clamp(40px, 6vw, 80px) 0 clamp(24px, 4vw, 48px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'clamp(20px, 3vw, 36px)', alignItems: 'flex-end' }}>
          <div style={{ gridColumn: 'span 8', minWidth: 0 }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, marginBottom: 18, textTransform: 'uppercase' }}>Give · Animal Warriors Conservation Society</div>
            <h1 style={{ fontFamily: F.display, fontSize: 'clamp(40px, 6.5vw, 84px)', lineHeight: 0.98, margin: 0, letterSpacing: -1.2, fontWeight: 500 }}>
              Not a button.
              <br />
              <em style={{ fontStyle: 'italic', color: C.rust, fontWeight: 500 }}>A water bowl. A wing. A bird with a name.</em>
            </h1>
            <p style={{ color: C.inkSoft, fontSize: 'clamp(15px, 1.4vw, 18px)', maxWidth: 640, marginTop: 22, lineHeight: 1.55 }}>
              Birds are less expressive than dogs — and that makes them harder to feel for. So we don't ask you to donate. We let you fund a thing you can see: one bowl, one net, one rescue, one bird through her whole recovery.
            </p>
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <div style={{ padding: 22, background: C.ink, color: C.paper, borderRadius: 20 }}>
              <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: '#9c8b78', textTransform: 'uppercase' }}>This week</div>
              <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 500, marginTop: 10 }}>{formatINR(184500)}</div>
              <div style={{ color: '#c9bba8', fontSize: 13, marginTop: 4 }}>from 94 donors · 7 sponsored cases</div>
              <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 999, marginTop: 16, overflow: 'hidden' }}>
                <div style={{ width: '68%', height: '100%', background: C.amber }} />
              </div>
              <div style={{ fontSize: 12, color: '#c9bba8', marginTop: 8 }}>68% of monthly target</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 64 }}>
        <SectionLabel kicker="01 · Give a thing" title="Pick what you fund," italic="not how much." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 14 }}>
          {DONATION_PRODUCTS.map((p, i) => {
            const spans = [4, 4, 4, 4, 6, 6];
            return (
              <Card key={p.id} span={spans[i]} hover onClick={() => openDonate(p)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 44 }}>{p.emoji}</div>
                  {p.recurring && <span style={{ fontSize: 10, padding: '4px 10px', background: C.skySoft, color: C.sky, borderRadius: 999, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Monthly</span>}
                </div>
                <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 500, color: C.ink, lineHeight: 1 }}>{formatINR(p.amount)}{p.recurring && <span style={{ fontSize: 14, color: C.inkMuted, fontFamily: F.body }}> / mo</span>}</div>
                <h3 style={{ fontFamily: F.display, fontSize: 19, margin: '12px 0 6px', fontWeight: 500, fontStyle: 'italic', color: C.ink }}>{p.label}</h3>
                <p style={{ color: C.inkSoft, fontSize: 13, margin: 0 }}>{p.detail}</p>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, color: C.rust, fontWeight: 600, fontSize: 13 }}>
                  Give now <ArrowUpRight size={14} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: 64 }}>
        <SectionLabel kicker="02 · Sponsor a bird" title="Fund one named life." italic="Watch her recover." sub="₹2,000 covers a full rescue. You get photo updates from Day 1 to release. Direct to your inbox or WhatsApp." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 14 }}>
          {sponsorable.map((c, i) => (
            <Card key={c.id} span={6} hover onClick={() => openSponsor(c)}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 64, lineHeight: 1 }}>{c.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 1.5, color: C.inkMuted }}>{c.id} · {c.receivedAt}</div>
                  <h3 style={{ fontFamily: F.display, fontSize: 24, margin: '6px 0 6px', fontWeight: 500 }}>{c.species}</h3>
                  <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 8 }}>{c.threat}</div>
                  <Badge status={c.status} small />
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 500 }}>{formatINR(2000)}</div>
                      <div style={{ fontSize: 11, color: C.inkMuted }}>full rescue + recovery</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openSponsor(c);
                      }}
                      style={{ padding: '10px 18px', background: C.rust, color: C.paper, borderRadius: 999, fontWeight: 600, fontSize: 13 }}
                    >
                      Sponsor
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 64 }}>
        <SectionLabel kicker="03 · Your impact feed" title="Only the rescues" italic="you enabled." sub="Instagram-style. Tap to follow that bird. Long-press to share with your circle." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {IMPACT_FEED.map((f) => (
            <Card key={f.id} hover>
              <div
                style={{
                  height: 180,
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${C.cream} 0%, ${C.creamDeep} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 88,
                  marginBottom: 12,
                }}
              >
                {f.emoji}
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: C.inkMuted, letterSpacing: 1.5 }}>{f.case}</div>
              <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 500, margin: '4px 0' }}>{f.species}</div>
              <div style={{ fontStyle: 'italic', color: C.inkSoft, fontSize: 13 }}>{f.moment}</div>
              <div style={{ marginTop: 10, fontSize: 11, color: C.rust, fontWeight: 600 }}>♡ Sponsored by {f.sponsor}</div>
            </Card>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 64 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          <Card span={7} style={{ background: C.ink, color: C.paper, borderColor: C.ink }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: '#9c8b78', textTransform: 'uppercase' }}>For companies</div>
            <h3 style={{ fontFamily: F.display, fontSize: 28, margin: '10px 0 8px', fontWeight: 500 }}>
              CSR portal · <em style={{ fontStyle: 'italic', color: C.amber }}>built for finance teams.</em>
            </h3>
            <p style={{ color: '#c9bba8', fontSize: 14, margin: '0 0 18px', maxWidth: 500 }}>Bulk donations, branded impact reports per quarter, employee volunteering tie-ins, custom landing pages, audited spend ledger.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Infosys Foundation', 'HCL CSR', 'Microsoft Hyd', 'Cyient', 'ICICI Lombard'].map((c) => (
                <span key={c} style={{ padding: '7px 12px', background: 'rgba(255,255,255,.06)', borderRadius: 999, fontSize: 12, border: '1px solid rgba(255,255,255,.18)' }}>{c}</span>
              ))}
            </div>
            <button style={{ marginTop: 22, padding: '12px 18px', background: C.paper, color: C.ink, borderRadius: 999, fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Book a CSR call <ArrowUpRight size={14} />
            </button>
          </Card>
          <Card span={5}>
            <h3 style={{ fontFamily: F.display, fontSize: 22, margin: 0, fontWeight: 500 }}>Recent gifts</h3>
            <div style={{ marginTop: 14, display: 'grid', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
              {DONORS_RECENT.map((d, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '10px 12px', background: C.cream, borderRadius: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: C.inkMuted }}>{d.for}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: F.mono, fontSize: 13, color: C.rust, fontWeight: 600 }}>{d.gave}</div>
                    <div style={{ fontSize: 10, color: C.inkMuted }}>{d.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card span={6}>
            <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, textTransform: 'uppercase' }}>80G compliance · auto</div>
            <h3 style={{ fontFamily: F.display, fontSize: 22, margin: '8px 0 12px', fontWeight: 500 }}>80G receipt preview</h3>
            <div style={{ padding: 18, background: C.cream, borderRadius: 12, fontFamily: F.mono, fontSize: 12, lineHeight: 1.7, color: C.inkSoft }}>
              Animal Warriors Conservation Society<br />
              Receipt · KR-D-3847<br />
              Donor · You<br />
              Amount · ₹2,000<br />
              Purpose · Sponsor of KR-2486 (Indian Roller)<br />
              80G PAN · AAATA1234B<br />
              Date · 13 May 2026<br />
              <em style={{ fontStyle: 'italic', color: C.ink }}>Tax-deductible under Sec 80G of the Income Tax Act, 1961.</em>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={ghostBtn()}>Email me</button>
              <button style={ghostBtn()}>WhatsApp PDF</button>
            </div>
          </Card>
          <Card span={6}>
            <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, textTransform: 'uppercase' }}>QR generator</div>
            <h3 style={{ fontFamily: F.display, fontSize: 22, margin: '8px 0 4px', fontWeight: 500 }}>For offline events & posters</h3>
            <p style={{ color: C.inkSoft, fontSize: 13, margin: '0 0 16px' }}>One QR per cause. Track scans → donations → receipts.</p>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 130, height: 130, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QRPattern />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  {['Water bowls drive', 'Manja season fund', 'Monthly · Birds', 'Wildlife rehab'].map((c, i) => (
                    <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: i === 0 ? C.ink : C.inkSoft, fontWeight: i === 0 ? 600 : 400 }}>
                      <input type="radio" name="cause" defaultChecked={i === 0} style={{ accentColor: C.rust }} />
                      {c}
                    </label>
                  ))}
                </div>
                <button style={{ ...ghostBtn(), marginTop: 12 }}>Download PNG</button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <SectionLabel kicker="04 · The wall" title="Names that" italic="keep wings open." sub="Optional. Many donors choose to stay anonymous. Some let us shout for them." />
        <div style={{ padding: 'clamp(24px, 4vw, 56px)', background: C.cream, borderRadius: 24, textAlign: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 28px', justifyContent: 'center', fontFamily: F.display, fontSize: 'clamp(15px, 1.6vw, 21px)', color: C.ink }}>
            {['Nila S.', 'Rahul T.', 'Kalpana N.', 'Karthik V.', 'Infosys Foundation', 'Meera I.', 'Pooja S.', 'Ananya R.', 'Suresh Babu', 'HCL CSR', 'Vikram K.', 'Asha P.', 'Anonymous × 142', 'Cyient', 'Manjari D.', 'Ravi K.', 'Microsoft Hyd', 'Priya M.', 'Bhanu G.', 'ICICI Lombard'].map((n, i) => (
              <span key={i} style={{ fontStyle: i % 4 === 1 ? 'italic' : 'normal', color: i % 5 === 0 ? C.rust : C.ink, fontWeight: i % 3 === 0 ? 600 : 500 }}>{n}</span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function QRPattern() {
  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 21; i++) {
      arr[i] = [];
      for (let j = 0; j < 21; j++) {
        const corner = (i < 7 && j < 7) || (i < 7 && j > 13) || (i > 13 && j < 7);
        arr[i][j] = corner ? (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) : Math.random() > 0.55;
      }
    }
    return arr;
  }, []);
  return (
    <svg viewBox="0 0 21 21" width="100%" height="100%" shapeRendering="crispEdges">
      {cells.map((row, i) => row.map((on, j) => on && <rect key={`${i}-${j}`} x={j} y={i} width={1} height={1} fill={C.ink} />))}
    </svg>
  );
}

/* ============ MODALS ============ */

function ModalShell({ children, onClose, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,20,16,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0,
        animation: 'fadeIn .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.paper,
          width: '100%',
          maxWidth: wide ? 880 : 560,
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '24px 24px 0 0',
          padding: 'clamp(20px, 3vw, 32px)',
          animation: 'slideUp .3s ease',
          margin: '0 auto',
          marginBottom: 'env(safe-area-inset-bottom)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 18, right: 18, width: 36, height: 36, borderRadius: 999, background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

function ReportModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState(null);
  const [problem, setProblem] = useState(null);
  const [urgency, setUrgency] = useState(null);
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [anon, setAnon] = useState(false);
  const [reporter, setReporter] = useState('');
  const [photo, setPhoto] = useState(false);
  const [voice, setVoice] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);

  const kinds = [
    { id: 'bird', label: 'Bird', emoji: '🪶' },
    { id: 'animal', label: 'Animal', emoji: '🐕' },
    { id: 'wildlife', label: 'Wildlife', emoji: '🦉' },
  ];
  const problems = [
    { id: 'injured', label: 'Injured', emoji: '🩹' },
    { id: 'stuck', label: 'Stuck', emoji: '🪢' },
    { id: 'orphaned', label: 'Orphaned', emoji: '🥚' },
    { id: 'cruelty', label: 'Cruelty', emoji: '⚠️' },
  ];
  const urgencies = [
    { id: 'critical', label: 'Critical · bleeding / unconscious', color: C.rust },
    { id: 'moderate', label: 'Moderate · injured, alert', color: C.amber },
    { id: 'low', label: 'Low · orphaned / stuck, stable', color: C.moss },
  ];

  const eduRow = kind && EDUCATION[kind === 'wildlife' ? 'wildlife' : kind === 'animal' ? 'animal' : 'bird']?.[0];

  const submit = () => {
    const id = onSubmit({
      species: species || 'Reported ' + (kind || 'bird'),
      emoji: kind === 'wildlife' ? '🦉' : kind === 'animal' ? '🐕' : '🪶',
      threat: `${problems.find((p) => p.id === problem)?.label || 'Distress'} — ${notes.slice(0, 60) || 'awaiting volunteer'}`,
      location: location || 'Hyderabad',
      area: location.split(',')[0] || 'Hyderabad',
      urgency,
      notes,
      anon,
      reporter,
    });
    setSubmittedId(id);
    setStep(4);
  };

  return (
    <ModalShell onClose={onClose} wide>
      {step !== 4 && (
        <>
          <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, textTransform: 'uppercase' }}>Report a rescue · step {step} of 3</div>
          <h2 style={{ fontFamily: F.display, fontSize: 28, margin: '6px 0 18px', fontWeight: 500 }}>
            {step === 1 && (<>What kind of <em style={{ fontStyle: 'italic', color: C.rust }}>life</em>?</>)}
            {step === 2 && (<>What's <em style={{ fontStyle: 'italic', color: C.rust }}>wrong</em>?</>)}
            {step === 3 && (<>How <em style={{ fontStyle: 'italic', color: C.rust }}>urgent</em>?</>)}
          </h2>
          <div style={{ height: 4, background: C.cream, borderRadius: 999, marginBottom: 18, overflow: 'hidden' }}>
            <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: C.rust, transition: 'width .3s' }} />
          </div>
        </>
      )}

      {step === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {kinds.map((k) => (
              <button
                key={k.id}
                onClick={() => {
                  setKind(k.id);
                  setTimeout(() => setStep(2), 200);
                }}
                style={{
                  padding: 22,
                  background: kind === k.id ? C.ink : C.cream,
                  color: kind === k.id ? C.paper : C.ink,
                  borderRadius: 16,
                  border: `1px solid ${kind === k.id ? C.ink : C.line}`,
                  fontFamily: F.display,
                  fontSize: 19,
                  fontWeight: 500,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all .2s',
                }}
              >
                <span style={{ fontSize: 36 }}>{k.emoji}</span>
                {k.label}
              </button>
            ))}
          </div>
          <PoweredFooter />
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {problems.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProblem(p.id);
                  setTimeout(() => setStep(3), 200);
                }}
                style={{
                  padding: 22,
                  background: problem === p.id ? C.ink : C.cream,
                  color: problem === p.id ? C.paper : C.ink,
                  borderRadius: 16,
                  border: `1px solid ${problem === p.id ? C.ink : C.line}`,
                  fontFamily: F.display,
                  fontSize: 19,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 28 }}>{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>

          {eduRow && (
            <div style={{ marginTop: 18, padding: 18, background: C.cream, borderRadius: 16 }}>
              <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, marginBottom: 10, textTransform: 'uppercase' }}>While we dispatch — please remember</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.moss, fontSize: 12, fontWeight: 600, marginBottom: 4 }}><CheckCircle2 size={13} /> DO</div>
                  <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 500, lineHeight: 1.3 }}>{eduRow.do}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.rust, fontSize: 12, fontWeight: 600, marginBottom: 4 }}><X size={13} /> DON'T</div>
                  <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 500, lineHeight: 1.3, fontStyle: 'italic' }}>{eduRow.dont}</div>
                </div>
              </div>
            </div>
          )}

          <button onClick={() => setStep(1)} style={{ ...ghostBtn(), marginTop: 16 }}>Back</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ display: 'grid', gap: 10 }}>
            {urgencies.map((u) => (
              <button
                key={u.id}
                onClick={() => setUrgency(u.id)}
                style={{
                  padding: '16px 20px',
                  background: urgency === u.id ? u.color : C.cream,
                  color: urgency === u.id ? C.paper : C.ink,
                  borderRadius: 14,
                  border: `1px solid ${urgency === u.id ? u.color : C.line}`,
                  fontFamily: F.display,
                  fontSize: 17,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                }}
              >
                <Dot color={urgency === u.id ? C.paper : u.color} />
                {u.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 22, display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setPhoto(!photo)} style={{ ...mediaBtn(photo), gridColumn: 'span 1' }}>
                <Camera size={16} /> {photo ? 'Photo attached' : 'Add photo'}
              </button>
              <button onClick={() => setVoice(!voice)} style={mediaBtn(voice)}>
                🎙️ {voice ? 'Voice note recorded' : 'Voice note (te/hi/en)'}
              </button>
            </div>
            <input
              placeholder="Species (optional) e.g. Black Kite"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              style={inputStyle()}
            />
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: 14, top: 13, color: C.inkMuted }} />
              <input
                placeholder="Location · auto-pinning GPS… (or type area)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ ...inputStyle(), paddingLeft: 40 }}
              />
            </div>
            <textarea
              placeholder="What you're seeing (the more we know, the faster we move)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle(), resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.inkSoft }}>
                <input type="checkbox" checked={anon} onChange={() => setAnon(!anon)} style={{ accentColor: C.rust }} /> Report anonymously
              </label>
              {!anon && (
                <input
                  placeholder="Your name (optional)"
                  value={reporter}
                  onChange={(e) => setReporter(e.target.value)}
                  style={{ ...inputStyle(), flex: 1, minWidth: 180, padding: '8px 12px', fontSize: 13 }}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button onClick={() => setStep(2)} style={ghostBtn()}>Back</button>
            <button
              onClick={submit}
              disabled={!urgency}
              style={{
                flex: 1,
                padding: '14px 22px',
                background: urgency ? C.rust : C.cream,
                color: urgency ? C.paper : C.inkMuted,
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
                cursor: urgency ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Send size={16} /> Send report
            </button>
          </div>
          <PoweredFooter />
        </div>
      )}

      {step === 4 && (
        <div style={{ paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: C.mossSoft, color: C.moss, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={26} />
            </div>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 1.5, color: C.inkMuted }}>{submittedId}</div>
              <h3 style={{ fontFamily: F.display, fontSize: 24, margin: '4px 0 0', fontWeight: 500 }}>
                We have you. <em style={{ fontStyle: 'italic', color: C.rust }}>Help is on the way.</em>
              </h3>
            </div>
          </div>

          <div style={{ background: C.cream, borderRadius: 16, padding: 18 }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, marginBottom: 14, textTransform: 'uppercase' }}>Live status</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { l: 'Report received', t: 'just now', done: true, current: false },
                { l: 'Auto-assigning nearest volunteer', t: 'in 2 seconds', done: false, current: true },
                { l: 'Volunteer on the way', t: '~9 mins', done: false },
                { l: 'Rescued', t: '—', done: false },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, background: s.done ? C.moss : s.current ? C.rust : C.creamDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.paper }}>
                    {s.done && <CheckCircle2 size={12} />}
                    {s.current && <Dot color={C.paper} size={6} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 500, fontStyle: s.current ? 'italic' : 'normal' }}>{s.l}</div>
                    <div style={{ fontSize: 11, color: C.inkMuted }}>{s.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <a href={`https://wa.me/${ORG.helplineDigits}`} target="_blank" rel="noreferrer" style={{ ...ghostBtn(), textDecoration: 'none' }}>
              <Phone size={14} /> WhatsApp updates
            </a>
            <button style={ghostBtn()}>Share to neighbour <Send size={14} /></button>
            <button onClick={onClose} style={{ ...ghostBtn(), marginLeft: 'auto' }}>Close</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

const inputStyle = () => ({
  width: '100%',
  padding: '12px 14px',
  background: C.cream,
  border: `1px solid ${C.line}`,
  borderRadius: 12,
  fontSize: 14,
  color: C.ink,
});

const mediaBtn = (on) => ({
  padding: '12px 14px',
  background: on ? C.mossSoft : C.cream,
  border: `1px solid ${on ? C.moss : C.line}`,
  borderRadius: 12,
  fontSize: 13,
  color: on ? C.moss : C.inkSoft,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
});

function PoweredFooter() {
  return (
    <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${C.line}`, display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: C.inkMuted, justifyContent: 'space-between' }}>
      <span>📶 Offline draft auto-saves</span>
      <span>↗️ Tap and hold to share with a closer neighbour</span>
      <span style={{ fontFamily: F.mono }}>Helpline {ORG.helpline}</span>
    </div>
  );
}

function CaseDetailModal({ c, onClose, onSponsor }) {
  return (
    <ModalShell onClose={onClose} wide>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ fontSize: 72, lineHeight: 1 }}>{c.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 1.5, color: C.inkMuted }}>{c.id} · {c.receivedAt}</div>
          <h2 style={{ fontFamily: F.display, fontSize: 30, margin: '6px 0 6px', fontWeight: 500 }}>
            {c.species} <em style={{ fontStyle: 'italic', color: C.inkMuted, fontSize: 18 }}>· {c.area}</em>
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge status={c.status} small />
            <span style={{ fontSize: 12, color: C.inkSoft }}>{c.threat}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, background: C.cream, borderRadius: 14, marginBottom: 18, fontSize: 14, color: C.inkSoft, lineHeight: 1.55 }}>
        {c.notes || 'No notes yet — added as the case progresses.'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 18 }}>
        <div style={{ padding: 16, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, marginBottom: 10, textTransform: 'uppercase' }}>Timeline</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {c.timeline.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 14, height: 14, borderRadius: 999, background: s.done ? C.moss : s.current ? C.rust : C.creamDeep, marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 500, fontStyle: s.current ? 'italic' : 'normal', color: s.done ? C.ink : s.current ? C.rust : C.inkMuted }}>{s.stage}</div>
                  <div style={{ fontSize: 11, color: C.inkMuted, fontFamily: F.mono }}>{s.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 16, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, marginBottom: 10, textTransform: 'uppercase' }}>People</div>
          <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
            <div><span style={{ color: C.inkMuted }}>Reporter</span> · <strong>{c.reporter}</strong>{c.reporterAnon && ' (anonymous)'}</div>
            <div><span style={{ color: C.inkMuted }}>Volunteer</span> · <strong>{c.volunteer}</strong></div>
            {c.sponsor && (<div><span style={{ color: C.inkMuted }}>Sponsor</span> · <strong style={{ color: C.rust }}>{c.sponsor}</strong></div>)}
            <div><span style={{ color: C.inkMuted }}>Cost-to-date</span> · <strong>{formatINR(c.cost)}</strong></div>
          </div>
          {c.handovers.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, marginBottom: 10, textTransform: 'uppercase' }}>Handovers</div>
              {c.handovers.map((h, i) => (
                <div key={i} style={{ fontSize: 12, color: C.inkSoft, marginBottom: 6 }}>
                  📷 {h.from} → <strong>{h.to}</strong> · {h.when} — <em>{h.note}</em>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {c.treatment.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, marginBottom: 12, textTransform: 'uppercase' }}>Recovery log</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {c.treatment.map((t, i) => (
              <div key={i} style={{ padding: 14, background: C.cream, borderRadius: 12 }}>
                <div style={{ fontSize: 30, marginBottom: 6 }}>{t.photo}</div>
                <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600 }}>{t.day}</div>
                <div style={{ fontSize: 11, color: C.inkMuted, marginBottom: 6 }}>{t.vet}</div>
                <div style={{ fontSize: 12, color: C.inkSoft }}>{t.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {!c.sponsor && c.status !== 'released' && (
          <button onClick={onSponsor} style={{ padding: '12px 18px', background: C.rust, color: C.paper, borderRadius: 999, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Heart size={14} /> Sponsor this rescue · ₹2,000
          </button>
        )}
        <button style={ghostBtn()}>Add treatment note <Plus size={14} /></button>
        <button style={ghostBtn()}>Photo handover <Camera size={14} /></button>
        <button onClick={onClose} style={{ ...ghostBtn(), marginLeft: 'auto' }}>Close</button>
      </div>
    </ModalShell>
  );
}

function DonateModal({ product, onClose }) {
  const [picked, setPicked] = useState(product || DONATION_PRODUCTS[2]);
  const [qty, setQty] = useState(1);
  const [recurring, setRecurring] = useState(!!picked.recurring);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  return (
    <ModalShell onClose={onClose} wide>
      {!done ? (
        <>
          <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, textTransform: 'uppercase' }}>Give · step {step} of 2</div>
          <h2 style={{ fontFamily: F.display, fontSize: 28, margin: '6px 0 18px', fontWeight: 500 }}>
            {step === 1 ? <>Pick what you <em style={{ fontStyle: 'italic', color: C.rust }}>fund.</em></> : <>Almost there.</>}
          </h2>

          {step === 1 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
                {DONATION_PRODUCTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPicked(p);
                      setRecurring(!!p.recurring);
                    }}
                    style={{
                      padding: 16,
                      background: picked.id === p.id ? C.ink : C.cream,
                      color: picked.id === p.id ? C.paper : C.ink,
                      borderRadius: 14,
                      border: `1px solid ${picked.id === p.id ? C.ink : C.line}`,
                      textAlign: 'left',
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ fontSize: 28 }}>{p.emoji}</div>
                    <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 500, marginTop: 6 }}>{formatINR(p.amount)}{p.recurring && '/mo'}</div>
                    <div style={{ fontSize: 12, fontStyle: 'italic', marginTop: 4, opacity: 0.85 }}>{p.label}</div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center', padding: 16, background: C.cream, borderRadius: 14 }}>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 500 }}>{picked.label}</div>
                  <div style={{ fontSize: 12, color: C.inkSoft }}>{picked.detail}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => setQty(Math.max(1, qty - 1))} style={qtyBtn()}>−</button>
                  <span style={{ minWidth: 24, textAlign: 'center', fontFamily: F.mono }}>{qty}</span>
                  <button onClick={() => setQty(qty + 1)} style={qtyBtn()}>+</button>
                </div>
                <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 500, minWidth: 90, textAlign: 'right' }}>
                  {formatINR(picked.amount * qty)}{recurring ? '/mo' : ''}
                </div>
              </div>

              {!picked.recurring && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: C.inkSoft }}>
                  <input type="checkbox" checked={recurring} onChange={() => setRecurring(!recurring)} style={{ accentColor: C.rust }} />
                  Make this monthly — cancel anytime
                </label>
              )}

              <button onClick={() => setStep(2)} style={{ width: '100%', padding: 15, background: C.rust, color: C.paper, borderRadius: 999, fontWeight: 600, fontSize: 15, marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Continue · {formatINR(picked.amount * qty)} <ChevronRight size={16} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle()} />
                <input placeholder="Email · for 80G receipt" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle()} />
                <input placeholder="PAN (optional · needed only above ₹2,000)" value={pan} onChange={(e) => setPan(e.target.value)} style={inputStyle()} />
              </div>
              <div style={{ padding: 14, background: C.cream, borderRadius: 12, fontSize: 13, color: C.inkSoft, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{picked.label} × {qty}</span>
                  <strong style={{ color: C.ink }}>{formatINR(picked.amount * qty)}{recurring ? '/mo' : ''}</strong>
                </div>
                <div style={{ fontSize: 11, color: C.inkMuted }}>80G eligible · receipt auto-emailed</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={ghostBtn()}>Back</button>
                <button
                  onClick={() => setDone(true)}
                  style={{ flex: 1, padding: 15, background: C.rust, color: C.paper, borderRadius: 999, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  Pay {formatINR(picked.amount * qty)} <Heart size={14} />
                </button>
              </div>
              <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 14, textAlign: 'center' }}>UPI · Cards · Net banking · International cards. Powered by Razorpay.</div>
            </>
          )}
        </>
      ) : (
        <div style={{ paddingTop: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 14 }}>🪶</div>
          <h2 style={{ fontFamily: F.display, fontSize: 32, fontWeight: 500, margin: 0 }}>
            Thank you. <em style={{ fontStyle: 'italic', color: C.rust }}>Every wing matters.</em>
          </h2>
          <p style={{ color: C.inkSoft, marginTop: 12, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Your 80G receipt is on its way to {email || 'your inbox'}. We will WhatsApp you the first photo update within 48 hours.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
            <button style={ghostBtn()}>Download receipt</button>
            <button onClick={onClose} style={{ padding: '12px 22px', background: C.ink, color: C.paper, borderRadius: 999, fontWeight: 600, fontSize: 14 }}>Close</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

const qtyBtn = () => ({
  width: 30,
  height: 30,
  borderRadius: 8,
  background: C.paper,
  border: `1px solid ${C.line}`,
  fontWeight: 600,
});

function SponsorModal({ c, onClose }) {
  const [done, setDone] = useState(false);
  return (
    <ModalShell onClose={onClose}>
      {!done ? (
        <>
          <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, textTransform: 'uppercase' }}>Sponsor a rescue</div>
          <h2 style={{ fontFamily: F.display, fontSize: 28, margin: '6px 0 4px', fontWeight: 500 }}>
            Fund {c.species}'s <em style={{ fontStyle: 'italic', color: C.rust }}>recovery.</em>
          </h2>
          <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 18 }}>
            {c.id} · {c.area} · received {c.receivedAt}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18, background: C.cream, borderRadius: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 64 }}>{c.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 500 }}>{c.species}</div>
              <div style={{ fontSize: 12, color: C.inkSoft }}>{c.threat}</div>
              <Badge status={c.status} small />
            </div>
          </div>

          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: C.inkMuted, marginBottom: 10, textTransform: 'uppercase' }}>What ₹2,000 covers</div>
            <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
              {['Volunteer dispatch · fuel + box + cloth', 'Vet exam, X-ray if needed', 'Meds for full course of treatment', 'Food + aviary days through recovery', 'Soft release at suitable habitat'].map((l) => (
                <div key={l} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <CheckCircle2 size={13} color={C.moss} /> {l}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: C.ink, color: C.paper, borderRadius: 14, padding: 16, marginBottom: 16, fontSize: 13 }}>
            <strong>You will receive:</strong> Day 1 photo · Day 7 update · Day 14 progress · release video. Direct to WhatsApp or email.
          </div>

          <button
            onClick={() => setDone(true)}
            style={{ width: '100%', padding: 15, background: C.rust, color: C.paper, borderRadius: 999, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Heart size={16} /> Sponsor {c.species} · ₹2,000
          </button>
          <div style={{ fontSize: 11, color: C.inkMuted, textAlign: 'center', marginTop: 10 }}>80G receipt auto-issued.</div>
        </>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: 12 }}>
          <div style={{ fontSize: 72 }}>{c.emoji}</div>
          <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 500, margin: '10px 0 8px' }}>
            {c.species} <em style={{ fontStyle: 'italic', color: C.rust }}>is yours now.</em>
          </h2>
          <p style={{ color: C.inkSoft, maxWidth: 400, margin: '0 auto' }}>
            We'll WhatsApp you her first photo within the hour. Every milestone — yours.
          </p>
          <button onClick={onClose} style={{ marginTop: 22, padding: '12px 22px', background: C.ink, color: C.paper, borderRadius: 999, fontWeight: 600, fontSize: 14 }}>
            Beautiful — close
          </button>
        </div>
      )}
    </ModalShell>
  );
}

/* ============ FOOTER ============ */

function Footer({ setView, onReport }) {
  return (
    <footer style={{ background: C.ink, color: C.paper, marginTop: 80 }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(40px, 5vw, 72px) 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 32 }}>
          <div style={{ gridColumn: 'span 5', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 28 }}>🪶</span>
              <span style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500 }}>Animal Warriors</span>
            </div>
            <p style={{ fontFamily: F.display, fontSize: 'clamp(22px, 2.5vw, 32px)', fontStyle: 'italic', lineHeight: 1.2, margin: 0, fontWeight: 400, maxWidth: 460 }}>
              Every wing matters. <span style={{ color: C.amber }}>Every minute counts.</span>
            </p>
            <div style={{ marginTop: 26, fontSize: 13, color: '#c9bba8', lineHeight: 1.7 }}>
              {ORG.name}<br />
              {ORG.center}<br />
              <strong style={{ color: C.paper }}>{ORG.helpline}</strong> · 24×7
            </div>
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <FooterCol title="Act" links={[
              { l: 'Report a rescue', go: onReport },
              { l: 'Donate', go: () => setView('donor') },
              { l: 'Volunteer signup', go: () => setView('public') },
              { l: 'Foster a recovery', go: () => setView('public') },
            ]} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <FooterCol title="Inside" links={[
              { l: 'Team ops', go: () => setView('team') },
              { l: 'Vet network', go: () => setView('team') },
              { l: 'Audit trail', go: () => setView('team') },
              { l: 'Impact poster', go: () => setView('team') },
            ]} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <FooterCol title="Reach" links={[
              { l: 'WhatsApp', href: `https://wa.me/${ORG.helplineDigits}` },
              { l: 'awcsindia.org', href: 'https://www.awcsindia.org' },
              { l: 'Facebook', href: 'https://www.facebook.com/animalwarriorsindia/' },
              { l: 'LinkedIn', href: 'https://in.linkedin.com/company/animalwarriors' },
            ]} />
          </div>
        </div>

        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.10)', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', fontSize: 12, color: '#9c8b78' }}>
          <span>© {new Date().getFullYear()} {ORG.name}. 80G · 12A registered.</span>
          <span style={{ fontFamily: F.display, fontStyle: 'italic' }}>"Painted, healed, and released — every story has a follow-up."</span>
          <span style={{ fontFamily: F.mono }}>Karuna ops · v1.0</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 2, color: '#9c8b78', textTransform: 'uppercase', marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {links.map((l) =>
          l.href ? (
            <a key={l.l} href={l.href} target="_blank" rel="noreferrer" style={{ color: C.paper, textDecoration: 'none', fontSize: 14, transition: 'color .15s' }}
               onMouseEnter={(e) => (e.currentTarget.style.color = C.amber)}
               onMouseLeave={(e) => (e.currentTarget.style.color = C.paper)}>
              {l.l}
            </a>
          ) : (
            <button key={l.l} onClick={l.go} style={{ color: C.paper, textAlign: 'left', fontSize: 14, transition: 'color .15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.amber)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.paper)}>
              {l.l}
            </button>
          )
        )}
      </div>
    </div>
  );
}
