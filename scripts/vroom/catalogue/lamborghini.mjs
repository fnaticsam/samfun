// Lamborghini — distinct road-car generations with a credible UK collector market.
const car = ({ model, gen, years, bodies, priceNew, used, accel, power, top, mpg, fuels = ['petrol'], ev = null, seats = 2, doors = 2, boot = 110, len, kg, halo = true }) => ({
  model, gen, years, bodies, segment: bodies.includes('suv') ? 'large-suv' : 'super-coupe', priceNew, used, accel, power, top, fuels, mpg, ev, seats, doors, boot, len, kg, mpy: 2000, ncap: null, onSale: years[1] === 0, halo,
  g: { build: Math.round(72 + (years[0] >= 2015 ? 6 : 0) + (kg < 1700 ? 2 : 0)), drive: Math.round(82 + Math.min(15, (700 - accel * 100) / 18)), practicality: Math.round(20 + seats * 5 + Math.min(10, boot / 90)), value: Math.round(42 + Math.min(22, used[0] / 12000) + (years[0] < 2010 ? 5 : 0)), design: Math.round(90 + Math.min(8, power[1] / 160)), running: Math.round(20 + (mpg >= 20 ? 4 : 0) + (fuels.includes('phev') ? 2 : 0)) }, verdict: `${model} ${gen} is a genuine Lamborghini generation: overt theatre, a specific engine era and very specialist running costs.`,
  issues: ['Clutch, suspension and carbonfibre repairs require marque expertise', 'Service history and unmodified provenance are critical'], buy: 'Use a marque specialist for inspection; condition and history outrank headline specification.',
  tags: ['head-turner', 'v8-soundtrack', 'future-classic', 'track-day', 'money-pit-risk'], rivals: ['ferrari-488-f154', 'mclaren-720s-p14']
});
export default { make: 'Lamborghini', cars: [
  car({ model: 'Gallardo', gen: 'L140', years: [2003, 2014], bodies: ['coupe', 'convertible'], priceNew: [130000, 180000], used: [75000, 150000], accel: 3.9, power: [500, 570], top: 202, mpg: 17, len: 4300, kg: 1500, halo: false }),
  car({ model: 'Huracan', gen: 'LB724', years: [2014, 2024], bodies: ['coupe', 'convertible'], priceNew: [180000, 300000], used: [160000, 280000], accel: 2.9, power: [610, 640], top: 202, mpg: 20, len: 4520, kg: 1422 }),
  car({ model: 'Temerario', gen: '634', years: [2025, 0], bodies: ['coupe'], priceNew: [260000, 340000], used: [230000, 300000], accel: 2.7, power: [920, 920], top: 211, mpg: 25, fuels: ['petrol', 'phev'], ev: 6, len: 4706, kg: 1690 }),
  car({ model: 'Aventador', gen: 'LB834', years: [2011, 2022], bodies: ['coupe', 'convertible'], priceNew: [270000, 450000], used: [250000, 500000], accel: 2.9, power: [700, 780], top: 217, mpg: 15, len: 4780, kg: 1575 }),
  car({ model: 'Revuelto', gen: 'LB744', years: [2023, 0], bodies: ['coupe'], priceNew: [450000, 600000], used: [480000, 700000], accel: 2.5, power: [1015, 1015], top: 217, mpg: 22, fuels: ['petrol', 'phev'], ev: 6, len: 4947, kg: 1772 }),
  car({ model: 'Urus', gen: '636', years: [2018, 0], bodies: ['suv'], priceNew: [170000, 300000], used: [130000, 260000], accel: 3.3, power: [650, 800], top: 190, mpg: 20, fuels: ['petrol', 'phev'], ev: 37, seats: 5, doors: 5, boot: 616, len: 5112, kg: 2200 }),
  car({ model: 'Murcielago', gen: 'LP640', years: [2001, 2010], bodies: ['coupe', 'convertible'], priceNew: [190000, 270000], used: [220000, 450000], accel: 3.4, power: [580, 670], top: 211, mpg: 14, len: 4580, kg: 1665 }),
  car({ model: 'Diablo', gen: 'VT', years: [1993, 2001], bodies: ['coupe', 'convertible'], priceNew: [170000, 220000], used: [220000, 500000], accel: 4.1, power: [492, 575], top: 202, mpg: 13, len: 4460, kg: 1625 })
] };
