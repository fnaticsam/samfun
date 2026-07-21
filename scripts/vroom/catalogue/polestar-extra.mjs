// Polestar — new dedicated model lines, not facelifts or motor variants.
const car = ({ model, gen, years, bodies, priceNew, used, accel, power, top, ev, seats, doors, boot, len, kg, halo = false }) => ({
  model, gen, years, bodies, segment: 'ev-native', priceNew, used, accel, power, top, fuels: ['ev'], mpg: null, ev, seats, doors, boot, len, kg, mpy: 8000, ncap: null, onSale: years[1] === 0, halo,
  g: { build: 78, drive: 82, practicality: 68, value: 67, design: 88, running: 79 }, verdict: `Polestar ${model} ${gen} is a separate Scandinavian EV model line with its own platform, design and UK-market positioning.`,
  issues: ['Early software updates and charging history should be checked', 'Large wheels and performance tyres are expensive'], buy: 'Prefer a well-updated car with the desired battery and driver-assistance packs already fitted.',
  tags: ['sleek', 'tech-fest', 'silent-cruiser', 'drivers-car', 'posh-interior'], rivals: ['tesla-model-3-highland', 'porsche-taycan-y1a']
});
export default { make: 'Polestar', cars: [
  car({ model: '5', gen: 'P5', years: [2025, 0], bodies: ['saloon'], priceNew: [90000, 150000], used: [75000, 125000], accel: 3.2, power: [748, 884], top: 155, ev: 415, seats: 5, doors: 5, boot: 365, len: 5080, kg: 2350, halo: true }),
  car({ model: '6', gen: 'P6', years: [2026, 0], bodies: ['convertible'], priceNew: [180000, 240000], used: [150000, 210000], accel: 3.2, power: [884, 884], top: 155, ev: 370, seats: 2, doors: 2, boot: 120, len: 4700, kg: 2300, halo: true })
] };
