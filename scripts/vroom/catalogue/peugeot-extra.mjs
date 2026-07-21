// Peugeot — further UK-market model generations.
const make = 'Peugeot';
const grades = (years, bodies, segment, used, fuels, seats, tags) => ({
  build: years[0] < 1995 ? 68 : years[0] < 2005 ? 70 : years[0] < 2015 ? 72 : 75,
  drive: tags.includes('pocket-rocket') ? 84 : tags.includes('analogue-joy') ? 81 : tags.includes('drivers-car') ? 78 : 64,
  practicality: seats >= 7 ? 91 : bodies.includes('estate') || segment === 'mpv-van' ? 85 : seats >= 5 ? 70 : 46,
  value: used[1] <= 7000 ? 86 : used[0] >= 15000 ? 72 : 79,
  design: tags.includes('head-turner') ? 91 : tags.includes('sleek') ? 82 : tags.includes('modern-classic') ? 80 : 74,
  running: fuels.includes('ev') ? 82 : fuels.includes('diesel') ? 73 : years[0] < 1995 ? 65 : 75
});
const car = ([model, gen, years, bodies, segment, priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg, tags, rivals]) => ({
  model, gen, years, bodies, segment, priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg,
  mpy: segment === 'sports' || segment === 'hot-hatch' ? 6000 : 8500, ncap: null, onSale: years[1] === 0, halo: false,
  g: grades(years, bodies, segment, used, fuels, seats, tags),
  verdict: `${model} ${gen} was a meaningful UK Peugeot generation, with a separate shape, price band and character from its successor.`,
  issues: ['Check service history and recalls', 'Engine and gearbox choice matters'],
  buy: `Buy the best-maintained ${model} with a clear history and appropriate engine.`, tags, rivals
});
export default { make, cars: [
  ['106', 'S2', [1996, 2003], ['hatch'], 'supermini', [8000, 13000], [1500, 7000], 7.8, [60, 120], 127, ['petrol', 'diesel'], 45, null, 5, 3, 215, 3564, 870, ['analogue-joy', 'pocket-rocket', 'modern-classic', 'lightweight'], ['renault-clio-ii', 'citroen-saxo-s2']],
  ['206', 'T1', [1998, 2009], ['hatch', 'estate', 'convertible'], 'supermini', [9000, 19000], [1200, 5500], 7.4, [60, 177], 137, ['petrol', 'diesel'], 45, null, 5, 3, 245, 3835, 1020, ['bargain-hero', 'pocket-rocket', 'city-darling'], ['renault-clio-ii', 'ford-fiesta-mk5']],
  ['207', 'A7', [2006, 2014], ['hatch', 'estate', 'convertible'], 'supermini', [10000, 20000], [1800, 7000], 7.1, [75, 175], 136, ['petrol', 'diesel'], 45, null, 5, 5, 270, 4030, 1200, ['bargain-hero', 'city-darling', 'pocket-rocket'], ['renault-clio-iii', 'ford-fiesta-mk6']],
  ['208', 'A9', [2012, 2019], ['hatch'], 'supermini', [11000, 21000], [3500, 10000], 7.0, [68, 208], 143, ['petrol', 'diesel'], 55, null, 5, 5, 285, 3973, 975, ['city-darling', 'pocket-rocket', 'bargain-hero'], ['renault-clio-iv', 'volkswagen-polo-mk5']],
  ['107', 'B0', [2005, 2014], ['hatch'], 'city', [7000, 11000], [1500, 5000], 14.2, [68, 68], 98, ['petrol'], 59, null, 4, 5, 139, 3430, 800, ['city-darling', 'cheap-to-run', 'first-car-friendly'], ['citroen-c1-b4', 'toyota-aygo-ab10']],
  ['108', 'B3', [2014, 2022], ['hatch'], 'city', [9000, 14000], [3500, 9000], 13.0, [72, 82], 106, ['petrol'], 58, null, 4, 5, 196, 3475, 840, ['city-darling', 'cheap-to-run', 'first-car-friendly'], ['citroen-c1-b4', 'toyota-aygo-ab40']],
  ['301', 'M31', [2012, 2017], ['saloon'], 'family-hatch', [12000, 17000], [3000, 6500], 9.4, [72, 115], 117, ['petrol', 'diesel'], 55, null, 5, 4, 506, 4442, 1080, ['discreet', 'bargain-hero', 'cheap-to-run'], ['renault-fluence-l3', 'skoda-rapid-nh']],
  ['306', 'N3', [1993, 2002], ['hatch', 'estate', 'convertible'], 'family-hatch', [11000, 22000], [1500, 9000], 7.4, [75, 167], 137, ['petrol', 'diesel'], 38, null, 5, 3, 338, 4030, 1070, ['analogue-joy', 'modern-classic', 'bargain-hero'], ['renault-megane-i', 'volkswagen-golf-mk3']],
  ['307', 'T5', [2001, 2008], ['hatch', 'estate', 'convertible'], 'family-hatch', [13000, 25000], [1200, 5000], 7.8, [75, 180], 139, ['petrol', 'diesel'], 43, null, 5, 5, 341, 4202, 1230, ['bargain-hero', 'left-field', 'family-bus'], ['renault-megane-ii', 'ford-focus-mk2']],
  ['308', 'T7', [2007, 2013], ['hatch', 'estate', 'convertible'], 'family-hatch', [14000, 27000], [1800, 7000], 7.4, [90, 200], 147, ['petrol', 'diesel'], 47, null, 5, 5, 348, 4276, 1250, ['bargain-hero', 'drivers-car', 'family-bus'], ['renault-megane-iii', 'volkswagen-golf-mk6']],
  ['308', 'T9', [2013, 2021], ['hatch', 'estate'], 'family-hatch', [16000, 30000], [4500, 14000], 6.0, [82, 270], 155, ['petrol', 'diesel'], 58, null, 5, 5, 420, 4253, 1090, ['sleek', 'bargain-hero', 'drivers-car'], ['renault-megane-iv', 'volkswagen-golf-mk7']],
  ['309', 'C28', [1985, 1993], ['hatch'], 'family-hatch', [8000, 13000], [2500, 9000], 8.0, [60, 130], 127, ['petrol', 'diesel'], 35, null, 5, 5, 300, 4050, 900, ['modern-classic', 'analogue-joy', 'left-field'], ['volkswagen-golf-mk2', 'renault-11-b37']],
  ['405', 'D60', [1987, 1997], ['saloon', 'estate'], 'family-hatch', [11000, 23000], [1800, 12000], 7.8, [65, 200], 146, ['petrol', 'diesel'], 38, null, 5, 4, 470, 4408, 1070, ['modern-classic', 'analogue-joy', 'bargain-hero'], ['renault-21-x48', 'ford-sierra-mk3']],
  ['406', 'D8', [1995, 2004], ['saloon', 'estate', 'coupe'], 'family-hatch', [16000, 30000], [1500, 6500], 8.1, [90, 210], 146, ['petrol', 'diesel'], 40, null, 5, 4, 430, 4602, 1350, ['grand-tourer', 'modern-classic', 'bargain-hero'], ['renault-laguna-ii', 'citroen-c5-x4']],
  ['407', 'D2', [2004, 2011], ['saloon', 'estate', 'coupe'], 'family-hatch', [18000, 32000], [1500, 6000], 8.1, [110, 241], 146, ['petrol', 'diesel'], 42, null, 5, 4, 407, 4676, 1470, ['left-field', 'grand-tourer', 'bargain-hero'], ['renault-laguna-iii', 'citroen-c5-x7']],
  ['408', 'P54', [2023, 0], ['hatch'], 'family-hatch', [31000, 44000], [21000, 34000], 7.9, [130, 225], 145, ['petrol', 'phev'], 50, 39, 5, 5, 536, 4687, 1396, ['sleek', 'left-field', 'school-run'], ['renault-arkana-ljl', 'citroen-c4-c41']],
  ['5008', 'T87', [2009, 2017], ['mpv'], 'seven-seater', [20000, 31000], [3500, 11000], 9.6, [115, 165], 124, ['petrol', 'diesel'], 50, null, 7, 5, 679, 4529, 1500, ['seven-seats', 'family-bus', 'tardis'], ['citroen-grand-c4-spacetourer-b78', 'renault-grand-scenic-iii']],
  ['4007', 'I3', [2007, 2012], ['suv'], 'family-suv', [23000, 30000], [2500, 8000], 9.9, [140, 170], 124, ['petrol', 'diesel'], 42, null, 7, 5, 510, 4635, 1690, ['seven-seats', 'bargain-hero', 'discreet'], ['mitsubishi-outlander-cw0', 'citroen-c-crosser-ep']],
  ['4008', 'A88', [2012, 2017], ['suv'], 'small-suv', [20000, 27000], [4500, 9500], 9.9, [115, 150], 124, ['petrol', 'diesel'], 48, null, 5, 5, 416, 4340, 1365, ['left-field', 'bargain-hero', 'school-run'], ['mitsubishi-asx-ga0', 'citroen-c4-aircross-ga']],
  ['406 Coupe', 'D8C', [1997, 2004], ['coupe'], 'roadster-classic', [26000, 36000], [3500, 12000], 7.7, [135, 210], 146, ['petrol'], 30, null, 4, 2, 390, 4615, 1400, ['grand-tourer', 'modern-classic', 'head-turner'], ['renault-laguna-coupe-x91', 'alfa-romeo-gt-937']],
  ['607', 'Z8', [2000, 2010], ['saloon'], 'exec', [30000, 45000], [1500, 7000], 8.6, [136, 211], 146, ['petrol', 'diesel'], 40, null, 5, 4, 481, 4902, 1600, ['wafty', 'left-field', 'bargain-hero'], ['citroen-c6-td', 'renault-vel-satis-bj0']],
  ['807', '807', [2002, 2014], ['mpv'], 'mpv-van', [25000, 36000], [1800, 7000], 10.7, [120, 170], 124, ['petrol', 'diesel'], 40, null, 7, 5, 830, 4727, 1740, ['family-bus', 'seven-seats', 'tardis'], ['citroen-c8-ea', 'renault-espace-iv']],
  ['Rifter', 'K9', [2018, 0], ['mpv'], 'mpv-van', [22000, 35000], [12000, 26000], 10.4, [102, 136], 115, ['petrol', 'diesel', 'ev'], 52, 174, 7, 5, 775, 4403, 1450, ['van-with-windows', 'tardis', 'family-bus', 'dog-friendly'], ['citroen-berlingo-k9', 'vauxhall-combo-e-k9']]
].map(car) };
