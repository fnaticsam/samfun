// Renault — further UK-market model generations. One row is one generation, not a trim.
const make = 'Renault';
const car = ([model, gen, years, bodies, segment, priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg, tags, rivals]) => ({
  model, gen, years, bodies, segment, priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg,
  mpy: segment === 'sports' || segment === 'hot-hatch' ? 6000 : 8500, ncap: null, onSale: years[1] === 0, halo: false,
  g: {
    build: years[0] < 2005 ? 66 : years[0] < 2015 ? 70 : 76,
    drive: segment === 'sports' || segment === 'hot-hatch' ? 88 : segment === 'roadster-classic' ? 82 : 66,
    practicality: seats > 5 ? 88 : segment === 'mpv-van' ? 86 : seats < 4 ? 34 : 70,
    value: years[0] < 2005 ? 76 : segment === 'sports' ? 82 : 80,
    design: segment === 'roadster-classic' ? 84 : segment === 'mpv-van' ? 68 : 74,
    running: years[0] < 2005 ? 62 : segment === 'sports' ? 66 : 76
  },
  verdict: `${model} ${gen} is a credible UK-market Renault generation with a distinct ownership story, useful price band and character.`,
  issues: ['Check service history and recalls', 'Condition and specification vary widely by age'],
  buy: `Choose a documented, well-maintained ${model} rather than the cheapest example.`, tags, rivals
});
export default { make, cars: [
  ['Clio', 'II', [1998, 2012], ['hatch'], 'supermini', [8000, 17000], [1500, 7000], 6.9, [60, 182], 134, ['petrol', 'diesel'], 45, null, 5, 3, 255, 3773, 980, ['bargain-hero', 'modern-classic', 'city-darling', 'pocket-rocket'], ['peugeot-206-t1', 'ford-fiesta-mk5']],
  ['Clio', 'III', [2005, 2012], ['hatch'], 'supermini', [9000, 18000], [1800, 8000], 6.9, [75, 203], 134, ['petrol', 'diesel'], 48, null, 5, 5, 288, 3986, 1090, ['bargain-hero', 'city-darling', 'pocket-rocket'], ['peugeot-207-a7', 'ford-fiesta-mk6']],
  ['Clio', 'VI', [2026, 0], ['hatch'], 'supermini', [19000, 27000], [18000, 26000], 8.3, [115, 145], 112, ['petrol', 'hybrid'], 62, null, 5, 5, 391, 4116, 1170, ['city-darling', 'cheap-to-run', 'crowd-pleaser'], ['peugeot-208-p21', 'toyota-yaris-xp210']],
  ['Captur', 'I', [2013, 2019], ['suv'], 'small-suv', [13000, 22000], [4500, 11000], 9.3, [90, 120], 119, ['petrol', 'diesel'], 52, null, 5, 5, 455, 4122, 1180, ['city-darling', 'school-run', 'bargain-hero'], ['nissan-juke-f15', 'peugeot-2008-a94']],
  ['Kadjar', 'HZ', [2015, 2022], ['suv'], 'family-suv', [20000, 31000], [7000, 16000], 9.4, [110, 165], 124, ['petrol', 'diesel'], 50, null, 5, 5, 472, 4489, 1420, ['school-run', 'bargain-hero', 'discreet'], ['nissan-qashqai-j11', 'peugeot-3008-p84']],
  ['Austral', 'HHN', [2023, 0], ['suv'], 'family-suv', [34000, 44000], [23000, 36000], 8.4, [160, 200], 109, ['hybrid'], 60, null, 5, 5, 500, 4510, 1518, ['school-run', 'tech-fest', 'cheap-to-run'], ['nissan-qashqai-j12', 'peugeot-3008-p64']],
  ['Arkana', 'LJL', [2021, 0], ['suv'], 'family-suv', [25000, 34000], [14000, 25000], 9.1, [140, 145], 107, ['petrol', 'hybrid'], 55, null, 5, 5, 513, 4568, 1336, ['sleek', 'school-run', 'cheap-to-run'], ['peugeot-408-p54', 'toyota-c-hr-ax10']],
  ['Megane', 'II', [2002, 2009], ['hatch', 'estate'], 'family-hatch', [13000, 24000], [1500, 6000], 8.7, [80, 225], 147, ['petrol', 'diesel'], 45, null, 5, 5, 330, 4209, 1240, ['bargain-hero', 'left-field', 'modern-classic'], ['peugeot-307-t5', 'ford-focus-mk2']],
  ['Megane', 'III', [2008, 2016], ['hatch', 'estate', 'coupe'], 'family-hatch', [15000, 28000], [3000, 10000], 8.0, [90, 275], 158, ['petrol', 'diesel'], 52, null, 5, 5, 405, 4295, 1205, ['bargain-hero', 'drivers-car', 'sleek'], ['peugeot-308-t9', 'volkswagen-golf-mk6']],
  ['Megane', 'IV', [2016, 2022], ['hatch', 'estate'], 'family-hatch', [18000, 31000], [7000, 17000], 5.7, [90, 300], 158, ['petrol', 'diesel'], 50, null, 5, 5, 434, 4359, 1205, ['sleek', 'bargain-hero', 'drivers-car'], ['peugeot-308-t9', 'volkswagen-golf-mk7']],
  ['Scenic', 'III', [2009, 2016], ['mpv'], 'mpv-van', [19000, 29000], [3500, 9000], 9.6, [110, 160], 121, ['petrol', 'diesel'], 50, null, 5, 5, 437, 4366, 1450, ['family-bus', 'tardis', 'bargain-hero'], ['citroen-c4-picasso-b78', 'ford-c-max-mk2']],
  ['Scenic', 'IV', [2016, 2023], ['mpv'], 'mpv-van', [22000, 34000], [7000, 17000], 9.3, [110, 160], 124, ['petrol', 'diesel'], 52, null, 5, 5, 572, 4406, 1430, ['family-bus', 'tardis', 'left-field'], ['citroen-c4-spacetourer-b78', 'peugeot-3008-p84']],
  ['Koleos', 'II', [2017, 2023], ['suv'], 'large-suv', [28000, 40000], [11000, 22000], 9.5, [150, 190], 125, ['diesel'], 45, null, 5, 5, 498, 4672, 1700, ['school-run', 'discreet', 'bargain-hero'], ['nissan-x-trail-t32', 'skoda-kodiaq-ns7']],
  ['Laguna', 'II', [2001, 2007], ['hatch', 'estate'], 'family-hatch', [17000, 30000], [1200, 4500], 7.2, [110, 205], 146, ['petrol', 'diesel'], 40, null, 5, 5, 430, 4576, 1380, ['bargain-hero', 'money-pit-risk', 'left-field'], ['peugeot-407-d2', 'ford-mondeo-mk3']],
  ['Laguna', 'III', [2007, 2015], ['hatch', 'estate', 'coupe'], 'family-hatch', [19000, 35000], [2500, 8500], 7.5, [110, 240], 153, ['petrol', 'diesel'], 48, null, 5, 5, 462, 4695, 1450, ['bargain-hero', 'grand-tourer', 'left-field'], ['peugeot-508-w2', 'ford-mondeo-mk4']],
  ['Talisman', 'LFD', [2016, 2022], ['saloon', 'estate'], 'exec', [25000, 38000], [7000, 15000], 7.6, [110, 225], 146, ['petrol', 'diesel'], 50, null, 5, 4, 608, 4848, 1450, ['grand-tourer', 'bargain-hero', 'left-field'], ['peugeot-508-r8', 'skoda-superb-3v']],
  ['Wind', 'E33', [2010, 2013], ['convertible'], 'roadster-classic', [15000, 18000], [3500, 7500], 10.5, [100, 133], 124, ['petrol'], 44, null, 2, 2, 270, 3828, 1173, ['left-field', 'modern-classic', 'city-darling'], ['mazda-mx-5-nc', 'fiat-124-spider-nf']],
  ['Sport Spider', 'R21', [1996, 1999], ['convertible'], 'roadster-classic', [38000, 45000], [30000, 55000], 4.9, [150, 150], 134, ['petrol'], 32, null, 2, 2, 60, 3792, 930, ['analogue-joy', 'future-classic', 'head-turner', 'lightweight'], ['lotus-elise-s1', 'mazda-mx-5-na']],
  ['Avantime', 'DE0', [2001, 2003], ['mpv'], 'mpv-van', [30000, 35000], [5000, 14000], 8.6, [165, 210], 137, ['petrol', 'diesel'], 32, null, 4, 3, 530, 4640, 1730, ['left-field', 'future-classic', 'wafty', 'money-pit-risk'], ['citroen-c6-td', 'peugeot-807-807']],
  ['Modus', 'JP', [2004, 2012], ['mpv'], 'city', [10000, 16000], [1200, 4500], 10.4, [75, 110], 114, ['petrol', 'diesel'], 52, null, 5, 5, 274, 3874, 1130, ['city-darling', 'tardis', 'bargain-hero'], ['nissan-note-e11', 'honda-jazz-ge']],
  ['Fluence', 'L3', [2010, 2016], ['saloon'], 'family-hatch', [18000, 24000], [2500, 6500], 9.9, [110, 140], 124, ['petrol', 'diesel'], 52, null, 5, 4, 530, 4618, 1250, ['discreet', 'bargain-hero', 'left-field'], ['peugeot-301-m31', 'skoda-rapid-nh']]
].map(car) };
