// Ferrari — meaningful UK-market model-generations.
const car = ({ model, gen, years, bodies = ['coupe'], priceNew, used, accel, power, top, mpg, seats = 2, doors = 2, boot = 200, len, kg, halo = true }) => ({
  model, gen, years, bodies, segment: 'super-coupe', priceNew, used, accel, power, top, fuels: ['petrol'], mpg, ev: null, seats, doors, boot, len, kg, mpy: 2200, ncap: null, onSale: years[1] === 0, halo,
  g: { build: Math.round(72 + (years[0] >= 2015 ? 6 : 0) + (kg < 1500 ? 2 : 0)), drive: Math.round(84 + Math.min(14, (700 - accel * 100) / 18)), practicality: Math.round(20 + seats * 5 + Math.min(10, boot / 80)), value: Math.round(45 + Math.min(20, used[0] / 11000) + (years[0] < 2010 ? 5 : 0)), design: Math.round(89 + Math.min(9, power[1] / 100)), running: Math.round(20 + (mpg >= 22 ? 5 : 0) + (years[0] >= 2020 ? 2 : 0)) }, verdict: `${model} ${gen} is a proper Ferrari generation, with an unmistakable drivetrain and a specialist ownership case rather than trim-level padding.`,
  issues: ['Annual servicing and consumables are specialist-priced', 'Clutch, gearbox and suspension evidence are essential on used examples'], buy: 'Prioritise a complete dealer-or-specialist history and a current independent inspection.',
  tags: ['head-turner', 'drivers-car', 'future-classic', 'v8-soundtrack', 'money-pit-risk'], rivals: ['porsche-911-992', 'mclaren-720s-p14']
});
export default { make: 'Ferrari', cars: [
  car({ model: '360', gen: 'F131', years: [1999, 2005], priceNew: [110000, 135000], used: [65000, 110000], accel: 4.5, power: [400, 400], top: 183, mpg: 19, boot: 220, len: 4477, kg: 1290, halo: false }),
  car({ model: 'F430', gen: 'F136', years: [2004, 2009], priceNew: [135000, 170000], used: [95000, 150000], accel: 4.0, power: [490, 510], top: 196, mpg: 18, boot: 250, len: 4512, kg: 1450, halo: false }),
  car({ model: '458', gen: 'F136', years: [2009, 2015], priceNew: [175000, 230000], used: [170000, 280000], accel: 3.4, power: [570, 605], top: 202, mpg: 20, boot: 230, len: 4527, kg: 1485 }),
  car({ model: '488', gen: 'F154', years: [2015, 2019], priceNew: [190000, 250000], used: [160000, 250000], accel: 3.0, power: [670, 720], top: 205, mpg: 22, boot: 230, len: 4568, kg: 1475 }),
  car({ model: 'F8 Tributo', gen: 'F142M', years: [2019, 2023], priceNew: [230000, 290000], used: [230000, 330000], accel: 2.9, power: [720, 720], top: 211, mpg: 22, boot: 200, len: 4611, kg: 1435 }),
  car({ model: '296 GTB', gen: 'F171', years: [2022, 0], priceNew: [245000, 340000], used: [220000, 300000], accel: 2.9, power: [830, 830], top: 205, mpg: 36, boot: 113, len: 4565, kg: 1470 }),
  car({ model: 'Roma', gen: 'F169', years: [2020, 2024], priceNew: [175000, 230000], used: [150000, 200000], accel: 3.4, power: [620, 620], top: 199, mpg: 24, seats: 4, boot: 272, len: 4656, kg: 1570 }),
  car({ model: 'California', gen: 'F149', years: [2008, 2014], bodies: ['convertible'], priceNew: [145000, 180000], used: [70000, 120000], accel: 3.8, power: [460, 490], top: 194, mpg: 21, seats: 4, boot: 340, len: 4563, kg: 1735, halo: false }),
  car({ model: 'Portofino', gen: 'F164', years: [2017, 2023], bodies: ['convertible'], priceNew: [170000, 215000], used: [130000, 185000], accel: 3.5, power: [600, 620], top: 200, mpg: 23, seats: 4, boot: 292, len: 4586, kg: 1664 }),
  car({ model: 'FF', gen: 'F151', years: [2011, 2016], bodies: ['estate'], priceNew: [230000, 260000], used: [90000, 145000], accel: 3.7, power: [660, 660], top: 208, mpg: 18, seats: 4, doors: 3, boot: 450, len: 4907, kg: 1880, halo: false }),
  car({ model: 'GTC4Lusso', gen: 'F151M', years: [2016, 2020], bodies: ['estate'], priceNew: [230000, 300000], used: [125000, 210000], accel: 3.4, power: [610, 690], top: 208, mpg: 19, seats: 4, doors: 3, boot: 450, len: 4922, kg: 1865 }),
  car({ model: '812 Superfast', gen: 'F152M', years: [2017, 2024], priceNew: [260000, 360000], used: [250000, 400000], accel: 2.9, power: [800, 830], top: 211, mpg: 17, boot: 320, len: 4657, kg: 1630 })
] };
