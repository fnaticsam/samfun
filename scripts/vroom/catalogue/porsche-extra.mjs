// Porsche — older and extra UK-market model-generations.
const car = ({ model, gen, years, bodies, segment = 'sports', priceNew, used, accel, power, top, mpg, seats = 2, doors = 2, boot = 150, len, kg, halo = false }) => ({
  model, gen, years, bodies, segment, priceNew, used, accel, power, top, fuels: ['petrol'], mpg, ev: null, seats, doors, boot, len, kg, mpy: 4000, ncap: null, onSale: false, halo,
  g: { build: Math.round(79 + (years[0] >= 2010 ? 6 : 0) + (kg < 1400 ? 2 : 0)), drive: Math.round(77 + Math.min(16, (700 - accel * 100) / 20)), practicality: Math.round(25 + seats * 5 + Math.min(10, boot / 70)), value: Math.round(58 + Math.min(18, used[0] / 7000) + (years[0] < 2000 ? 3 : 0)), design: Math.round(80 + Math.min(10, power[1] / 70)), running: Math.round(29 + (mpg >= 30 ? 8 : mpg >= 25 ? 4 : 0) + (years[0] >= 2010 ? 2 : 0)) },
  verdict: `${model} ${gen} is a distinct Porsche generation with the engineering character and ownership reality collectors actually buy into.`,
  issues: ['Specialist inspection and service history matter more than mileage', 'Tyres, suspension and cooling costs rise quickly on neglected cars'],
  buy: 'Buy the best documented standard example, with a specialist pre-purchase inspection.',
  tags: ['drivers-car', 'future-classic', 'head-turner', 'analogue-joy', 'b-road-hero'], rivals: ['porsche-911-997', 'bmw-m3-e92']
});

export default { make: 'Porsche', cars: [
  car({ model: 'Boxster', gen: '986', years: [1996, 2004], bodies: ['convertible'], segment: 'roadster-classic', priceNew: [28000, 38000], used: [7000, 18000], accel: 5.7, power: [204, 260], top: 164, mpg: 29, boot: 260, len: 4320, kg: 1250 }),
  car({ model: 'Boxster', gen: '981', years: [2012, 2016], bodies: ['convertible'], segment: 'roadster-classic', priceNew: [38000, 55000], used: [23000, 42000], accel: 4.8, power: [265, 375], top: 180, mpg: 32, boot: 280, len: 4374, kg: 1350 }),
  car({ model: 'Cayman', gen: '981C', years: [2013, 2016], bodies: ['coupe'], segment: 'sports', priceNew: [40000, 60000], used: [25000, 48000], accel: 4.6, power: [275, 385], top: 183, mpg: 31, boot: 425, len: 4380, kg: 1340 }),
  car({ model: '911', gen: '964', years: [1989, 1994], bodies: ['coupe', 'convertible'], segment: 'super-coupe', priceNew: [42000, 65000], used: [45000, 120000], accel: 5.0, power: [250, 360], top: 168, mpg: 23, seats: 4, boot: 135, len: 4250, kg: 1350, halo: false }),
  car({ model: '911', gen: '993', years: [1993, 1998], bodies: ['coupe', 'convertible'], segment: 'super-coupe', priceNew: [52000, 85000], used: [55000, 150000], accel: 4.5, power: [272, 430], top: 185, mpg: 24, seats: 4, boot: 135, len: 4245, kg: 1370, halo: false }),
  car({ model: '911', gen: '996', years: [1997, 2005], bodies: ['coupe', 'convertible'], segment: 'super-coupe', priceNew: [55000, 105000], used: [18000, 65000], accel: 4.2, power: [300, 450], top: 189, mpg: 25, seats: 4, boot: 130, len: 4435, kg: 1400 }),
  car({ model: '928', gen: 'GTS', years: [1992, 1995], bodies: ['coupe'], segment: 'super-coupe', priceNew: [65000, 70000], used: [30000, 90000], accel: 5.4, power: [350, 350], top: 171, mpg: 20, seats: 4, boot: 160, len: 4520, kg: 1620, halo: false }),
  car({ model: '944', gen: 'S2', years: [1989, 1991], bodies: ['coupe', 'convertible'], segment: 'roadster-classic', priceNew: [29000, 36000], used: [12000, 30000], accel: 6.2, power: [211, 211], top: 149, mpg: 27, seats: 4, boot: 211, len: 4290, kg: 1350 }),
  car({ model: '968', gen: '944S3', years: [1992, 1995], bodies: ['coupe', 'convertible'], segment: 'roadster-classic', priceNew: [35000, 42000], used: [18000, 45000], accel: 6.5, power: [240, 240], top: 157, mpg: 27, seats: 4, boot: 211, len: 4320, kg: 1370 }),
  car({ model: '924', gen: 'Turbo', years: [1979, 1988], bodies: ['coupe'], segment: 'roadster-classic', priceNew: [16000, 24000], used: [10000, 30000], accel: 7.8, power: [170, 177], top: 140, mpg: 26, seats: 4, boot: 250, len: 4210, kg: 1180 }),
  car({ model: 'Cayenne', gen: '955', years: [2003, 2010], bodies: ['suv'], segment: 'large-suv', priceNew: [44000, 90000], used: [5000, 18000], accel: 5.0, power: [250, 550], top: 168, mpg: 22, seats: 5, doors: 5, boot: 540, len: 4798, kg: 2240 }),
  car({ model: 'Panamera', gen: '970', years: [2010, 2016], bodies: ['saloon', 'estate'], segment: 'luxury', priceNew: [65000, 140000], used: [18000, 55000], accel: 3.8, power: [300, 570], top: 190, mpg: 27, seats: 4, doors: 5, boot: 445, len: 4970, kg: 1920 })
] };
