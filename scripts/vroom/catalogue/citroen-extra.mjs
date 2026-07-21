// Citroën — further UK-market model generations.
const make = 'Citroen';
const grades = (years, bodies, segment, used, fuels, seats, tags) => ({
  build: years[0] < 2000 ? 67 : years[0] < 2010 ? 69 : years[0] < 2020 ? 72 : 75,
  drive: tags.includes('pocket-rocket') ? 83 : tags.includes('analogue-joy') ? 80 : tags.includes('wafty') ? 68 : 61,
  practicality: seats >= 7 ? 91 : segment === 'mpv-van' ? 86 : bodies.includes('estate') ? 80 : seats >= 5 ? 71 : 44,
  value: used[1] <= 7000 ? 86 : used[0] >= 15000 ? 72 : 79,
  design: tags.includes('left-field') ? 86 : tags.includes('modern-classic') ? 82 : tags.includes('city-darling') ? 76 : 72,
  running: fuels.includes('ev') ? 80 : fuels.includes('diesel') ? 73 : years[0] < 2000 ? 66 : 75
});
const car = ([model, gen, years, bodies, segment, priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg, tags, rivals]) => ({
  model, gen, years, bodies, segment, priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg,
  mpy: segment === 'sports' ? 6000 : 8500, ncap: null, onSale: years[1] === 0, halo: false,
  g: grades(years, bodies, segment, used, fuels, seats, tags),
  verdict: `${model} ${gen} captures Citroën's distinctive UK-market approach: comfort, ingenuity or properly left-field design.`,
  issues: ['Check service history and recalls', 'Age and engine choice affect ownership costs'],
  buy: `Seek a cared-for ${model} with documented maintenance and a sensible specification.`, tags, rivals
});
export default { make, cars: [
  ['AX', 'ZA', [1986, 1998], ['hatch'], 'city', [6000, 11000], [1200, 7000], 8.7, [45, 100], 116, ['petrol', 'diesel'], 52, null, 5, 3, 273, 3522, 720, ['lightweight', 'analogue-joy', 'modern-classic', 'cheap-to-run'], ['peugeot-106-s2', 'renault-clio-i']],
  ['Saxo', 'S2', [1996, 2003], ['hatch'], 'supermini', [8000, 14000], [1600, 8500], 7.8, [60, 120], 127, ['petrol', 'diesel'], 45, null, 5, 3, 280, 3718, 935, ['pocket-rocket', 'analogue-joy', 'modern-classic'], ['peugeot-106-s2', 'renault-clio-ii']],
  ['C2', 'JM', [2003, 2009], ['hatch'], 'supermini', [10000, 16000], [1800, 6500], 8.3, [73, 125], 126, ['petrol', 'diesel'], 48, null, 4, 3, 166, 3666, 1055, ['pocket-rocket', 'city-darling', 'bargain-hero'], ['peugeot-206-t1', 'renault-clio-iii']],
  ['C3', 'FC', [2002, 2010], ['hatch'], 'supermini', [10000, 17000], [1300, 4500], 9.4, [60, 110], 114, ['petrol', 'diesel'], 50, null, 5, 5, 305, 3850, 1050, ['city-darling', 'wafty', 'bargain-hero'], ['peugeot-206-t1', 'renault-clio-ii']],
  ['C3', 'SC', [2010, 2016], ['hatch'], 'supermini', [11000, 19000], [2200, 7000], 8.9, [68, 120], 118, ['petrol', 'diesel'], 55, null, 5, 5, 300, 3941, 1080, ['city-darling', 'wafty', 'cheap-to-run'], ['peugeot-208-a9', 'renault-clio-iv']],
  ['C3 Aircross', 'A88', [2017, 2024], ['suv'], 'small-suv', [17000, 27000], [7000, 15000], 9.3, [82, 130], 124, ['petrol', 'diesel'], 52, null, 5, 5, 410, 4154, 1203, ['city-darling', 'school-run', 'wafty'], ['peugeot-2008-p24', 'renault-captur-ii']],
  ['C3 Picasso', 'A58', [2009, 2017], ['mpv'], 'small-suv', [14000, 21000], [3000, 9000], 10.0, [90, 120], 116, ['petrol', 'diesel'], 50, null, 5, 5, 500, 4078, 1280, ['tardis', 'city-darling', 'bargain-hero'], ['nissan-note-e11', 'renault-modus-jp']],
  ['C4', 'LC', [2004, 2010], ['hatch', 'coupe'], 'family-hatch', [14000, 24000], [1500, 6000], 8.3, [90, 180], 137, ['petrol', 'diesel'], 46, null, 5, 5, 320, 4260, 1250, ['left-field', 'bargain-hero', 'sleek'], ['peugeot-307-t5', 'renault-megane-ii']],
  ['C4', 'B7', [2010, 2018], ['hatch'], 'family-hatch', [16000, 26000], [3500, 10000], 8.7, [92, 156], 130, ['petrol', 'diesel'], 52, null, 5, 5, 408, 4329, 1205, ['wafty', 'discreet', 'bargain-hero'], ['peugeot-308-t9', 'renault-megane-iii']],
  ['C4 Cactus', 'E3', [2014, 2020], ['hatch'], 'family-hatch', [13000, 23000], [5000, 12000], 9.3, [75, 110], 117, ['petrol', 'diesel'], 58, null, 5, 5, 358, 4160, 1050, ['left-field', 'wafty', 'bargain-hero'], ['renault-captur-i', 'peugeot-2008-a94']],
  ['C4 Picasso', 'B78', [2013, 2022], ['mpv'], 'mpv-van', [20000, 30000], [5000, 14000], 9.7, [100, 165], 129, ['petrol', 'diesel'], 52, null, 5, 5, 537, 4428, 1350, ['family-bus', 'tardis', 'wafty'], ['renault-scenic-iv', 'peugeot-3008-p84']],
  ['Xantia', 'X1', [1993, 2001], ['hatch', 'estate'], 'family-hatch', [15000, 26000], [1300, 7500], 8.4, [75, 200], 146, ['petrol', 'diesel'], 42, null, 5, 5, 471, 4444, 1300, ['wafty', 'left-field', 'modern-classic', 'bargain-hero'], ['peugeot-406-d8', 'renault-laguna-ii']],
  ['C5', 'X4', [2001, 2008], ['hatch', 'estate'], 'family-hatch', [18000, 30000], [1500, 6500], 8.6, [110, 210], 146, ['petrol', 'diesel'], 43, null, 5, 5, 456, 4618, 1450, ['wafty', 'left-field', 'bargain-hero'], ['peugeot-406-d8', 'renault-laguna-ii']],
  ['C5', 'X7', [2008, 2017], ['saloon', 'estate'], 'exec', [22000, 37000], [3000, 10000], 8.3, [120, 240], 151, ['petrol', 'diesel'], 46, null, 5, 4, 439, 4779, 1550, ['wafty', 'left-field', 'grand-tourer'], ['peugeot-508-w2', 'renault-laguna-iii']],
  ['C5 X', 'E43', [2022, 0], ['estate'], 'exec', [30000, 44000], [19000, 34000], 7.9, [130, 225], 145, ['petrol', 'phev'], 48, 38, 5, 5, 545, 4805, 1490, ['wafty', 'left-field', 'grand-tourer'], ['peugeot-508-r8', 'renault-talisman-lfd']],
  ['C-Crosser', 'EP', [2007, 2012], ['suv'], 'family-suv', [23000, 30000], [2500, 8000], 9.9, [156, 170], 124, ['petrol', 'diesel'], 42, null, 7, 5, 510, 4646, 1690, ['seven-seats', 'bargain-hero', 'discreet'], ['peugeot-4007-i3', 'mitsubishi-outlander-cw0']],
  ['C4 Aircross', 'GA', [2012, 2017], ['suv'], 'small-suv', [20000, 27000], [4500, 9500], 9.9, [115, 150], 124, ['petrol', 'diesel'], 48, null, 5, 5, 416, 4341, 1365, ['left-field', 'bargain-hero', 'school-run'], ['peugeot-4008-a88', 'mitsubishi-asx-ga0']],
  ['C8', 'EA', [2002, 2014], ['mpv'], 'mpv-van', [25000, 36000], [1800, 7000], 10.7, [120, 170], 124, ['petrol', 'diesel'], 40, null, 7, 5, 830, 4727, 1740, ['family-bus', 'seven-seats', 'tardis'], ['peugeot-807-807', 'renault-espace-iv']],
  ['Nemo', 'A8', [2008, 2018], ['van'], 'mpv-van', [12000, 17000], [2500, 7500], 13.0, [75, 95], 98, ['petrol', 'diesel'], 55, null, 5, 5, 356, 3959, 1200, ['van-with-windows', 'tardis', 'cheap-to-run'], ['fiat-qubo-225', 'peugeot-bipper-a8']],
  ['C-Zero', 'ZC', [2011, 2020], ['hatch'], 'ev-native', [21000, 28000], [3500, 8500], 15.9, [67, 67], 81, ['ev'], null, 93, 4, 5, 166, 3475, 1110, ['city-darling', 'cheap-to-run', 'left-field'], ['mitsubishi-i-miev-ha', 'peugeot-ion-zc']]
].map(car) };
