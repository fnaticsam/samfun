// Tesla — genuinely separate UK model generations omitted from the core file.
const car = ({ model, gen, years, bodies, priceNew, used, accel, power, top, ev, seats, doors, boot, len, kg, halo = false }) => ({
  model, gen, years, bodies, segment: 'ev-native', priceNew, used, accel, power, top, fuels: ['ev'], mpg: null, ev, seats, doors, boot, len, kg, mpy: 7000, ncap: null, onSale: years[1] === 0, halo,
  g: { build: 63, drive: 78, practicality: 70, value: 72, design: 80, running: 80 }, verdict: `${model} ${gen} is a materially different Tesla generation with a distinct battery, platform and UK ownership proposition.`,
  issues: ['Battery condition and warranty status deserve independent checking', 'Parts lead times and body repairs can be expensive'], buy: 'Buy with a battery-health report, clean accident history and working charging equipment.',
  tags: ['tech-fest', 'silent-cruiser', 'future-classic', 'left-field', 'depreciation-king'], rivals: ['tesla-model-3-pre-facelift', 'porsche-taycan-y1a']
});
export default { make: 'Tesla', cars: [
  car({ model: 'Roadster', gen: 'Sport', years: [2008, 2012], bodies: ['convertible'], priceNew: [87000, 100000], used: [70000, 140000], accel: 3.7, power: [248, 288], top: 125, ev: 245, seats: 2, doors: 2, boot: 100, len: 3946, kg: 1305, halo: true }),
  car({ model: 'Model X', gen: 'Classic', years: [2016, 2021], bodies: ['suv'], priceNew: [80000, 130000], used: [30000, 65000], accel: 3.1, power: [332, 795], top: 155, ev: 315, seats: 7, doors: 5, boot: 357, len: 5037, kg: 2440, halo: false })
] };
