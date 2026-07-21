// Vroom controlled vocabularies. Everything in the dataset validates against these.

export const BODIES = [
  'hatch', 'saloon', 'estate', 'suv', 'coupe', 'convertible', 'mpv', 'pickup', 'van'
];

export const SEGMENTS = [
  'city',           // Aygo, Up!, Panda
  'supermini',      // Fiesta, Polo, Clio
  'family-hatch',   // Golf, Focus, Astra
  'compact-exec',   // 3 Series, A4, C-Class
  'exec',           // 5 Series, E-Class, XF
  'luxury',         // S-Class, LS, Panamera
  'small-suv',      // Juke, Kamiq, Puma
  'family-suv',     // Qashqai, Tiguan, RAV4
  'large-suv',      // X5, Discovery, GLE
  'off-roader',     // G-Class, Defender, Jimny, Wrangler
  'mpv-van',        // Multivan, Berlingo, V-Class
  'seven-seater',   // Kodiaq, Sorento, XC90 (car-shaped 7-seat)
  'sports',         // MX-5, Cayman, Supra
  'super-coupe',    // M4, C63, R8-adjacent fast GTs
  'hot-hatch',      // GTI, Type R, i30 N
  'ev-native',      // Model 3, ID.3, Ioniq 5 (EV-only platforms)
  'pickup',         // Hilux, Ranger
  'roadster-classic'// modern classics: 987 Boxster, Z4, TT
];

export const FUELS = ['petrol', 'diesel', 'hybrid', 'phev', 'ev'];

// Character tags — the twin-finder's vocabulary. Keep to ~44; every car picks 3–8.
export const TAGS = [
  // shape & presence
  'boxy-icon', 'sleek', 'retro-charm', 'muscular', 'discreet', 'head-turner', 'chunky-4x4',
  // character
  'wafty', 'sporty', 'pocket-rocket', 'grand-tourer', 'go-anywhere', 'city-darling',
  'autobahn-stormer', 'analogue-joy', 'tech-fest', 'minimalist',
  // ownership story
  'bulletproof', 'bargain-hero', 'future-classic', 'modern-classic', 'depreciation-king',
  'money-pit-risk', 'cheap-to-run', 'company-car-hero', 'first-car-friendly',
  // family & practicality
  'family-bus', 'seven-seats', 'dog-friendly', 'tardis', 'school-run', 'tow-car',
  'van-with-windows', 'adventure-ready',
  // driving flavour
  'drivers-car', 'track-day', 'b-road-hero', 'motorway-muncher', 'off-grid',
  'silent-cruiser', 'v8-soundtrack', 'rev-happy', 'lightweight',
  // market position
  'badge-value', 'left-field', 'crowd-pleaser', 'posh-interior'
];

// Vroom Score weights (sum = 1)
export const WEIGHTS = { build: 0.22, drive: 0.20, value: 0.20, practicality: 0.15, design: 0.13, running: 0.10 };

export function vroomScore(g) {
  const s = WEIGHTS.build * g.build + WEIGHTS.drive * g.drive + WEIGHTS.value * g.value +
    WEIGHTS.practicality * g.practicality + WEIGHTS.design * g.design + WEIGHTS.running * g.running;
  return Math.round(s);
}

export function slug(make, model, gen) {
  return [make, model, gen].join(' ').toLowerCase()
    .replace(/[''.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
