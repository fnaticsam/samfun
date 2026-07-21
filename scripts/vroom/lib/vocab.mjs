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

// Segment-aware Vroom Score profiles. A sports car should not lose to a family
// crossover simply because it has a tiny boot; a workhorse should not be sunk
// by ordinary handling or styling. The explicit calibration then uses more of
// the /100 scale so "best" and "avoid" are meaningful rather than a wall of 70s.
export const WEIGHT_PROFILES = {
  default: { build: 0.22, drive: 0.20, value: 0.20, practicality: 0.15, design: 0.13, running: 0.10 },
  performance: { build: 0.10, drive: 0.40, value: 0.16, practicality: 0.05, design: 0.20, running: 0.09 },
  utility: { build: 0.18, drive: 0.08, value: 0.22, practicality: 0.30, design: 0.07, running: 0.15 }
};

export const WEIGHTS = WEIGHT_PROFILES.default;

const PERFORMANCE_SEGMENTS = new Set(['sports', 'super-coupe', 'hot-hatch', 'roadster-classic']);
const UTILITY_SEGMENTS = new Set(['mpv-van', 'seven-seater', 'pickup', 'off-roader']);

export function scoreProfile(car = {}) {
  const segment = typeof car === 'string' ? car : car.segment;
  if (PERFORMANCE_SEGMENTS.has(segment)) return 'performance';
  if (UTILITY_SEGMENTS.has(segment)) return 'utility';
  return 'default';
}

export function vroomScore(g, car = {}) {
  const weights = WEIGHT_PROFILES[scoreProfile(car)];
  const raw = Object.entries(weights).reduce((sum, [key, weight]) => sum + weight * g[key], 0);
  const spread = raw < 75 ? 4 : 2.4;
  return Math.max(42, Math.min(96, Math.round(75 + (raw - 75) * spread)));
}

export function slug(make, model, gen) {
  return [make, model, gen].join(' ').toLowerCase()
    .replace(/[''.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
