// Alpine — the UK-market Renault-owned sports-car marque.
const make = 'Alpine';
const car = ([model, gen, years, bodies, segment, priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg, tags, rivals]) => ({
  model, gen, years, bodies, segment, priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg,
  mpy: 5000, ncap: null, onSale: years[1] === 0, halo: false,
  // These are model-generation judgements, not a single trim's score. Older
  // Alpines trade modern build/running costs for rarity; current cars gain a
  // little polish without losing the marque's focused character.
  g: {
    build: years[0] < 1990 ? 66 : years[0] < 2010 ? 70 : 78,
    drive: model === 'A290' ? 86 : 94,
    practicality: seats > 2 ? 48 : model === 'A290' ? 68 : 32,
    value: model === 'A290' ? 74 : years[0] < 2000 ? 78 : 80,
    design: model === 'A290' ? 84 : 91,
    running: years[0] < 2000 ? 48 : model === 'A290' ? 76 : 64
  },
  verdict: `${model} ${gen} is a properly focused Alpine: light, characterful and a rare alternative to the usual sports-car default.`,
  issues: ['Specialist servicing is wise', 'Low-volume parts and insurance need budgeting'],
  buy: `Prioritise provenance, original specification and specialist history on any ${model}.`, tags, rivals
});
export default { make, cars: [
  ['A110', 'Berlinette', [1962, 1977], ['coupe'], 'roadster-classic', [2500, 6000], [55000, 110000], 9.0, [95, 140], 130, ['petrol'], 30, null, 2, 2, 100, 3850, 620, ['analogue-joy', 'lightweight', 'modern-classic', 'head-turner'], ['lotus-elan-s4', 'porsche-911-g-series']],
  ['GTA', 'A310', [1985, 1991], ['coupe'], 'sports', [25000, 32000], [18000, 35000], 7.3, [160, 200], 146, ['petrol'], 28, null, 4, 3, 180, 4330, 1180, ['modern-classic', 'left-field', 'grand-tourer'], ['porsche-911-964', 'alpine-a610-a610']],
  ['A610', 'A610', [1991, 1995], ['coupe'], 'sports', [42000, 50000], [30000, 55000], 5.7, [250, 250], 165, ['petrol'], 27, null, 4, 3, 180, 4435, 1420, ['modern-classic', 'left-field', 'grand-tourer', 'money-pit-risk'], ['porsche-911-964', 'lotus-esprit-v8']],
  ['A110', 'A110', [2017, 2024], ['coupe'], 'sports', [46000, 105000], [35000, 100000], 3.9, [252, 300], 177, ['petrol'], 39, null, 2, 2, 196, 4256, 1103, ['drivers-car', 'lightweight', 'analogue-joy', 'track-day', 'future-classic'], ['porsche-cayman-982', 'lotus-emira-e13']],
  ['A290', 'GTS', [2024, 0], ['hatch'], 'hot-hatch', [35000, 42000], [28000, 37000], 6.4, [180, 220], 106, ['ev'], null, 236, 5, 5, 326, 3990, 1479, ['pocket-rocket', 'head-turner', 'tech-fest', 'city-darling'], ['renault-5-e-tech-bfb', 'mini-cooper-electric-j01']]
].map(car) };
