// Maserati — generations with meaningful UK used-market identities.
const car = ({ model, gen, years, bodies, priceNew, used, accel, power, top, mpg, fuels = ['petrol'], ev = null, seats = 4, doors = 2, boot = 250, len, kg, halo = false }) => ({
  model, gen, years, bodies, segment: bodies.includes('suv') ? 'large-suv' : 'super-coupe', priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg, mpy: 3000, ncap: null, onSale: years[1] === 0, halo,
  g: { build: Math.round(65 + (years[0] >= 2016 ? 7 : 0) + (kg < 1800 ? 3 : 0)), drive: Math.round(76 + Math.min(14, (700 - accel * 100) / 22)), practicality: Math.round(26 + seats * 5 + Math.min(10, boot / 90)), value: Math.round(49 + Math.min(18, used[0] / 4000) + (years[0] < 2010 ? 4 : 0)), design: Math.round(85 + Math.min(10, power[1] / 85)), running: Math.round(22 + (mpg >= 27 ? 8 : mpg >= 22 ? 4 : 0) + (fuels.includes('ev') ? 3 : 0)) }, verdict: `${model} ${gen} is a clear Maserati generation with Italian character, compelling used values and a specialist-service caveat.`,
  issues: ['Deferred maintenance is costly, especially electronics and transmission work', 'Full specialist history matters more than low mileage alone'], buy: 'Buy a specialist-inspected example with comprehensive records and reserve for remedial work.',
  tags: ['grand-tourer', 'head-turner', 'v8-soundtrack', 'depreciation-king', 'money-pit-risk'], rivals: ['porsche-panamera-971', 'jaguar-xf-x260']
});
export default { make: 'Maserati', cars: [
  car({ model: '3200 GT', gen: 'Tipo 338', years: [1998, 2002], bodies: ['coupe'], priceNew: [60000, 75000], used: [15000, 40000], accel: 5.1, power: [370, 370], top: 177, mpg: 18, len: 4510, kg: 1590 }),
  car({ model: 'Coupe', gen: 'Tipo 4200', years: [2002, 2007], bodies: ['coupe', 'convertible'], priceNew: [65000, 85000], used: [18000, 40000], accel: 4.9, power: [390, 420], top: 177, mpg: 18, len: 4523, kg: 1675 }),
  car({ model: 'GranTurismo', gen: 'M145', years: [2007, 2019], bodies: ['coupe', 'convertible'], priceNew: [85000, 140000], used: [25000, 80000], accel: 4.7, power: [405, 460], top: 186, mpg: 18, len: 4881, kg: 1880 }),
  // M189 spans the petrol Modena/Trofeo and the dedicated Folgore EV; show both honestly.
  car({ model: 'GranTurismo', gen: 'M189', years: [2023, 0], bodies: ['coupe', 'convertible'], priceNew: [150000, 250000], used: [120000, 210000], accel: 3.5, power: [490, 760], top: 199, mpg: 22, fuels: ['petrol', 'ev'], ev: 280, len: 4966, kg: 1795, halo: true }),
  car({ model: 'Quattroporte', gen: 'M139', years: [2004, 2013], bodies: ['saloon'], priceNew: [75000, 120000], used: [12000, 35000], accel: 4.7, power: [400, 440], top: 174, mpg: 18, seats: 5, doors: 4, boot: 450, len: 5052, kg: 1860 }),
  car({ model: 'Quattroporte', gen: 'M156', years: [2013, 2023], bodies: ['saloon'], priceNew: [80000, 150000], used: [20000, 70000], accel: 4.7, power: [275, 580], top: 191, mpg: 25, seats: 5, doors: 4, boot: 530, len: 5262, kg: 1900 }),
  car({ model: 'Ghibli', gen: 'M157', years: [2013, 2023], bodies: ['saloon'], priceNew: [50000, 95000], used: [15000, 45000], accel: 4.7, power: [275, 580], top: 178, mpg: 29, seats: 5, doors: 4, boot: 500, len: 4971, kg: 1810 }),
  car({ model: 'Levante', gen: 'M161', years: [2016, 2024], bodies: ['suv'], priceNew: [60000, 150000], used: [25000, 85000], accel: 3.9, power: [350, 590], top: 188, mpg: 24, seats: 5, doors: 5, boot: 580, len: 5003, kg: 2109 }),
  car({ model: 'Grecale', gen: 'M182', years: [2022, 0], bodies: ['suv'], priceNew: [60000, 115000], used: [45000, 95000], accel: 3.8, power: [300, 530], top: 177, mpg: 27, seats: 5, doors: 5, boot: 535, len: 4846, kg: 1870 }),
  car({ model: 'MC20', gen: 'M240', years: [2021, 0], bodies: ['coupe', 'convertible'], priceNew: [190000, 270000], used: [155000, 240000], accel: 2.9, power: [630, 630], top: 202, mpg: 23, seats: 2, boot: 100, len: 4669, kg: 1475, halo: true })
] };
