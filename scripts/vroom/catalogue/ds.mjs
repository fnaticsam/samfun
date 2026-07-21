// DS Automobiles — separate premium marque, UK-market generations.
const make = 'DS';
const car = ([model, gen, years, bodies, segment, priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg, tags, rivals]) => ({
  model, gen, years, bodies, segment, priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg,
  mpy: 8000, ncap: null, onSale: years[1] === 0, halo: false,
  g: {
    build: years[0] < 2015 ? 72 : years[0] < 2020 ? 74 : 78,
    drive: segment === 'ev-native' ? 76 : segment === 'exec' ? 72 : 68,
    practicality: segment === 'exec' ? 78 : segment === 'family-suv' ? 76 : 70,
    value: years[0] < 2015 ? 76 : segment === 'ev-native' ? 70 : 72,
    design: model === 'N°8' ? 90 : model === '3' ? 84 : 86,
    running: years[0] < 2015 ? 66 : fuels.includes('ev') && fuels.length === 1 ? 78 : 72
  },
  verdict: `${model} ${gen} is DS's distinctively upholstered, design-led alternative to the familiar German premium choices.`,
  issues: ['Electronics and option packs need checking', 'Small dealer network can affect convenience'],
  buy: `Look for a well-specified ${model} with complete DS service history.`, tags, rivals
});
export default { make, cars: [
  ['3', 'A55', [2016, 2019], ['hatch', 'convertible'], 'supermini', [15000, 27000], [4500, 13000], 6.5, [82, 208], 143, ['petrol', 'diesel'], 50, null, 5, 3, 285, 3948, 1090, ['head-turner', 'pocket-rocket', 'bargain-hero'], ['citroen-ds3-a55', 'mini-hatch-f56']],
  ['3 Crossback', 'D34', [2019, 2023], ['suv'], 'small-suv', [25000, 38000], [11000, 23000], 8.2, [100, 155], 130, ['petrol', 'diesel', 'ev'], 48, 206, 5, 5, 350, 4118, 1270, ['head-turner', 'city-darling', 'posh-interior'], ['peugeot-2008-p24', 'audi-q2-ga']],
  ['N°3', 'D34', [2024, 0], ['suv'], 'small-suv', [29000, 42000], [22000, 36000], 7.5, [145, 156], 93, ['petrol', 'ev'], 50, 250, 5, 5, 350, 4118, 1415, ['head-turner', 'city-darling', 'tech-fest'], ['peugeot-e-2008-p24', 'mini-aceman-j05']],
  ['4', 'D41', [2011, 2018], ['hatch'], 'family-hatch', [20000, 33000], [5000, 13000], 7.9, [110, 200], 146, ['petrol', 'diesel'], 50, null, 5, 5, 385, 4275, 1200, ['sleek', 'bargain-hero', 'left-field'], ['citroen-c4-b7', 'audi-a3-8v']],
  ['4', 'D41 II', [2021, 0], ['hatch'], 'family-hatch', [27000, 42000], [16000, 32000], 7.7, [130, 225], 145, ['petrol', 'diesel', 'phev'], 50, 34, 5, 5, 430, 4400, 1350, ['sleek', 'posh-interior', 'left-field'], ['citroen-c4-c41', 'peugeot-308-p52']],
  ['5', 'B81', [2011, 2018], ['hatch'], 'family-hatch', [22000, 34000], [4500, 12000], 8.3, [110, 200], 146, ['petrol', 'diesel'], 50, null, 5, 5, 465, 4530, 1300, ['sleek', 'left-field', 'bargain-hero'], ['citroen-c4-b7', 'volkswagen-golf-mk7']],
  ['7 Crossback', 'X74', [2018, 2025], ['suv'], 'family-suv', [30000, 52000], [13000, 30000], 5.9, [130, 360], 146, ['petrol', 'diesel', 'phev'], 45, 36, 5, 5, 555, 4573, 1500, ['posh-interior', 'head-turner', 'wafty'], ['peugeot-3008-p84', 'volvo-xc40-xb']],
  ['9', 'X83', [2021, 2024], ['saloon'], 'exec', [48000, 65000], [21000, 38000], 5.6, [225, 360], 155, ['petrol', 'phev'], 40, 39, 5, 4, 510, 4934, 1750, ['wafty', 'left-field', 'posh-interior'], ['peugeot-508-r8', 'volvo-s90-236']],
  ['N°8', 'D85', [2025, 0], ['hatch'], 'ev-native', [50000, 68000], [43000, 62000], 5.4, [230, 350], 118, ['ev'], null, 466, 5, 5, 621, 4820, 2100, ['silent-cruiser', 'sleek', 'tech-fest', 'head-turner'], ['peugeot-e-3008-p64', 'audi-a6-e-tron-c9']]
].map(car) };
