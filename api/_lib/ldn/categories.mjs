// Single source of truth for the nine cultural categories.
// The research pipeline, the dataset, and the map UI all read from here
// (the UI reads the copy embedded in the served dataset, so this stays authoritative).

export const CATEGORIES = [
  {
    id: 'listening-bars',
    label: 'Listening Bars',
    short: 'Listening',
    color: '#6C4AB6',
    blurb: 'Hi-fi rooms built around the record, not the crowd.',
    // guidance steers the grounded prompt toward the right kind of place
    guidance: 'Audiophile / hi-fi "listening bars" and vinyl-focused rooms where the sound system is the point (e.g. Spiritland-style). Not generic cocktail bars.'
  },
  {
    id: 'music-venues',
    label: 'Live-Music Venues',
    short: 'Live Music',
    color: '#E0245E',
    blurb: 'Rooms with a stage and a reputation.',
    guidance: 'Live-music venues with a strong programme and reputation across jazz, indie, classical or electronic (e.g. Ronnie Scott\'s, Village Underground, Wigmore Hall). Prefer venues, not one-off festivals.'
  },
  {
    id: 'comedy-clubs',
    label: 'Comedy Clubs',
    short: 'Comedy',
    color: '#F2A900',
    blurb: 'Where the city goes to laugh.',
    guidance: 'Dedicated comedy clubs and rooms with regular stand-up / improv programming (e.g. Comedy Store, Soho Theatre, Angel Comedy at The Bill Murray).'
  },
  {
    id: 'art-museums',
    label: 'Art Museums & Galleries',
    short: 'Art',
    color: '#1B998B',
    blurb: 'Permanent collections and the shows worth queuing for.',
    guidance: 'Major art museums and public galleries (e.g. Tate Modern, National Gallery, Hayward, Whitechapel, Serpentine). Evergreen institution + its notable current exhibition when known.'
  },
  {
    id: 'theatre',
    label: 'Theatre & Plays',
    short: 'Theatre',
    color: '#C1272D',
    blurb: 'What is actually on the boards this month.',
    guidance: 'Theatre — prioritise specific productions currently running or opening this month across the West End and major houses (National, Old Vic, Bridge, Royal Court, Donmar). Name the production and the theatre.'
  },
  {
    id: 'cocktail-bars',
    label: 'Cocktail & Speakeasy Bars',
    short: 'Cocktails',
    color: '#B5179E',
    blurb: 'The rooms behind the unmarked doors.',
    guidance: 'Acclaimed cocktail bars and speakeasies, ideally World\'s 50 Best Bars calibre (e.g. Tayer + Elementary, Swift, A Bar with Shapes for a Name, Silverleaf).'
  },
  {
    id: 'immersive',
    label: 'Immersive & One-Off',
    short: 'Immersive',
    color: '#4361EE',
    blurb: 'Time-bound experiences you plan a night around.',
    guidance: 'Immersive theatre, installations, secret cinema and limited-run experiences currently open or opening this month (e.g. Punchdrunk, Secret Cinema, ABBA Voyage, teamLab-style installs, Frameless).'
  },
  {
    id: 'cinemas',
    label: 'Independent Cinemas',
    short: 'Cinema',
    color: '#2D6A4F',
    blurb: 'Repertory and arthouse screens with a point of view.',
    guidance: 'Independent / repertory / arthouse cinemas with distinctive programming (e.g. Prince Charles Cinema, Close-Up, BFI Southbank, The Garden Cinema, Rio Dalston, Genesis).'
  },
  {
    id: 'supper-clubs',
    label: 'Supper Clubs & Tables',
    short: 'Supper',
    color: '#E76F51',
    blurb: 'Dinners worth building an evening around.',
    guidance: 'Standout dining as an evening out — chef\'s counters, supper clubs and destination tasting tables with cultural cachet (e.g. Kiln, Brat, St. JOHN, Trivet, a notable supper club). Focus on the experience, not fast-casual.'
  }
];

export const CATEGORY_IDS = CATEGORIES.map(c => c.id);

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// Greater London bounding box — used to sanity-clamp/validate coordinates.
export const LONDON_BBOX = { minLat: 51.28, maxLat: 51.70, minLng: -0.52, maxLng: 0.30 };
export const LONDON_CENTER = { lat: 51.5085, lng: -0.1257 };

export function inLondon(lat, lng) {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    lat >= LONDON_BBOX.minLat && lat <= LONDON_BBOX.maxLat &&
    lng >= LONDON_BBOX.minLng && lng <= LONDON_BBOX.maxLng
  );
}
