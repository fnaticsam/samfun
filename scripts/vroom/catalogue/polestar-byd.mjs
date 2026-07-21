// Polestar — model-generations, UK market. Curated for Vroom. (BYD in byd.mjs)
export default {
  make: 'Polestar',
  cars: [
    { model: '1', gen: 'P1', years: [2019, 2021], bodies: ['coupe'], segment: 'super-coupe',
      priceNew: [139000, 139000], used: [70000, 100000], accel: 4.2, power: [609, 609], top: 155,
      fuels: ['phev'], mpg: 45, ev: 77, seats: 4, doors: 2, boot: 143, len: 4586, kg: 2350,
      mpy: 4000, ncap: null, onSale: false, halo: true,
      g: { build: 90, drive: 78, practicality: 38, value: 60, design: 92, running: 56 },
      verdict: 'A carbon-bodied 609bhp hybrid GT built in tiny numbers — the beautiful, doomed manifesto. Collectors, form a queue.',
      issues: ['1,500 made — parts and specialists rare', 'Heavy'],
      buy: 'Any of the ~150 UK cars, kept immaculate.',
      tags: ['future-classic', 'head-turner', 'grand-tourer', 'left-field', 'sleek', 'tech-fest'],
      rivals: ['bmw-8-series-g15', 'porsche-panamera-971', 'lexus-lc-z100'] },

    { model: '2', gen: 'P2', years: [2020, 0], bodies: ['saloon'], segment: 'ev-native',
      priceNew: [40000, 58000], used: [16000, 38000], accel: 4.2, power: [231, 476], top: 127,
      fuels: ['ev'], mpg: null, ev: 406, seats: 5, doors: 5, boot: 405, len: 4606, kg: 2010,
      mpy: 10000, ncap: [5, 2021], onSale: true, halo: false,
      g: { build: 86, drive: 78, practicality: 74, value: 82, design: 86, running: 86 },
      verdict: 'The Scandi-minimal Tesla alternative that got better every year — 2024-on RWD cars do 400 miles. Used = superb.',
      issues: ['Pre-2024 cars ride firmly', 'Rear seat headroom'],
      buy: 'Long Range Single Motor 2024-on — the refined one.',
      tags: ['minimalist', 'sleek', 'silent-cruiser', 'tech-fest', 'cheap-to-run', 'discreet'],
      rivals: ['tesla-model-3-highland', 'bmw-i4-g26', 'hyundai-ioniq-6-ce'] },

    { model: '3', gen: 'P3', years: [2024, 0], bodies: ['suv'], segment: 'ev-native',
      priceNew: [70000, 85000], used: [50000, 70000], accel: 4.7, power: [489, 517], top: 130,
      fuels: ['ev'], mpg: null, ev: 390, seats: 5, doors: 5, boot: 484, len: 4900, kg: 2584,
      mpy: 9000, ncap: [5, 2024], onSale: true, halo: true,
      g: { build: 88, drive: 76, practicality: 82, value: 68, design: 88, running: 80 },
      verdict: 'The design-literate big EV SUV — glass, restraint, 390 miles. A quieter statement than the German alternatives.',
      issues: ['2.6 tonnes', 'Software still maturing'],
      buy: 'Long Range Dual Motor with Plus pack, used from year one.',
      tags: ['minimalist', 'sleek', 'silent-cruiser', 'posh-interior', 'tech-fest', 'head-turner'],
      rivals: ['volvo-ex90-p3', 'bmw-ix-i20', 'audi-q8-e-tron-ge'] },

    { model: '4', gen: 'P4', years: [2024, 0], bodies: ['coupe'], segment: 'ev-native',
      priceNew: [60000, 73000], used: [42000, 60000], accel: 3.8, power: [272, 544], top: 124,
      fuels: ['ev'], mpg: null, ev: 385, seats: 5, doors: 5, boot: 526, len: 4839, kg: 2230,
      mpy: 9000, ncap: null, onSale: true, halo: false,
      g: { build: 86, drive: 78, practicality: 76, value: 70, design: 84, running: 82 },
      verdict: 'The coupé-SUV with no rear window and total conviction. Fast, plush, deeply Instagram — surprisingly resolved.',
      issues: ['No rear window (camera mirror only)', 'Badge still explains itself at parties'],
      buy: 'Long Range Single Motor — 385 miles of minimalism.',
      tags: ['sleek', 'head-turner', 'tech-fest', 'silent-cruiser', 'left-field'],
      rivals: ['porsche-macan-electric-xab', 'audi-q6-e-tron-f5', 'tesla-model-y-juniper'] }
  ]
};
