// McLaren — modern UK-series model generations.
const car = ({ model, gen, years, priceNew, used, accel, power, top, mpg, boot, len, kg, fuels = ['petrol'], ev = null, halo = true }) => ({
  model, gen, years, bodies: ['coupe'], segment: 'super-coupe', priceNew, used, accel, power, top, fuels, mpg, ev, seats: 2, doors: 2, boot, len, kg, mpy: 2500, ncap: null, onSale: years[1] === 0, halo,
  // Pace, age and real-world ownership cost create useful model-generation distinction.
  g: { build: Math.round(70 + (kg < 1350 ? 5 : 0) + (years[0] >= 2020 ? 3 : 0)), drive: Math.round(88 + Math.min(9, (700 - accel * 100) / 40)), practicality: Math.round(24 + Math.min(10, boot / 55)), value: Math.round(47 + Math.min(20, used[0] / 5000) + (years[0] < 2015 ? 4 : 0)), design: Math.round(89 + Math.min(8, power[1] / 180)), running: Math.round(20 + (mpg >= 30 ? 7 : mpg >= 24 ? 4 : 0) + (years[0] >= 2020 ? 2 : 0)) }, verdict: `${model} ${gen} is a distinct Woking generation: carbon-tub pace and drama with a serious specialist-maintenance commitment.`,
  issues: ['Hydraulic, electrical and bodywork repairs require a McLaren specialist', 'Extended warranty and precise servicing history are valuable'], buy: 'Buy only after a marque-specialist inspection and evidence of regular preventive maintenance.',
  tags: ['track-day', 'head-turner', 'drivers-car', 'tech-fest', 'money-pit-risk'], rivals: ['porsche-911-992', 'ferrari-488-gtb']
});
export default { make: 'McLaren', cars: [
  car({ model: 'MP4-12C', gen: 'P11', years: [2011, 2014], priceNew: [170000, 200000], used: [65000, 100000], accel: 3.1, power: [592, 625], top: 204, mpg: 24, boot: 144, len: 4507, kg: 1336, halo: false }),
  car({ model: '650S', gen: 'P11', years: [2014, 2017], priceNew: [195000, 240000], used: [90000, 140000], accel: 3.0, power: [650, 675], top: 207, mpg: 24, boot: 144, len: 4512, kg: 1330, halo: false }),
  car({ model: '570S', gen: 'P13', years: [2015, 2021], priceNew: [145000, 185000], used: [85000, 145000], accel: 3.2, power: [570, 570], top: 204, mpg: 26, boot: 150, len: 4530, kg: 1313, halo: false }),
  car({ model: '600LT', gen: 'P13', years: [2018, 2020], priceNew: [185000, 220000], used: [140000, 200000], accel: 2.9, power: [600, 600], top: 204, mpg: 23, boot: 150, len: 4604, kg: 1247 }),
  car({ model: '720S', gen: 'P14', years: [2017, 2023], priceNew: [210000, 280000], used: [145000, 220000], accel: 2.9, power: [720, 720], top: 212, mpg: 23, boot: 150, len: 4543, kg: 1283 }),
  car({ model: '750S', gen: 'P14', years: [2023, 0], priceNew: [260000, 340000], used: [220000, 300000], accel: 2.8, power: [750, 750], top: 206, mpg: 23, boot: 150, len: 4569, kg: 1277 }),
  car({ model: 'Artura', gen: 'P18', years: [2022, 0], priceNew: [190000, 250000], used: [130000, 210000], accel: 3.0, power: [680, 700], top: 205, mpg: 35, boot: 160, len: 4539, kg: 1498, fuels: ['petrol', 'phev'], ev: 19 }),
  car({ model: 'GT', gen: 'P23', years: [2019, 2024], priceNew: [165000, 200000], used: [105000, 165000], accel: 3.2, power: [620, 620], top: 203, mpg: 23, boot: 420, len: 4683, kg: 1530 }),
  car({ model: 'GTS', gen: 'P23', years: [2024, 0], priceNew: [205000, 240000], used: [175000, 215000], accel: 3.2, power: [635, 635], top: 203, mpg: 23, boot: 420, len: 4683, kg: 1520 }),
  car({ model: 'P1', gen: 'P12', years: [2013, 2015], priceNew: [866000, 900000], used: [950000, 1000000], accel: 2.8, power: [916, 916], top: 217, mpg: 20, boot: 120, len: 4588, kg: 1490 })
] };
