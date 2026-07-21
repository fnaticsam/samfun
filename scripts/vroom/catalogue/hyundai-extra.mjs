// Hyundai — older and additional UK-market model-generations.
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const grade = d => ({
  build: d.years[0] >= 2015 ? 78 : d.years[0] >= 2008 ? 74 : 70,
  drive: clamp(Math.round(61 + (10 - d.accel) * 2), 56, 78),
  practicality: clamp(Math.round(61 + (d.boot - 225) / 22 + ((d.seats || 5) - 5) * 5), 62, 92),
  value: d.used[1] <= 6000 ? 84 : d.used[1] <= 12000 ? 81 : 76,
  design: d.segment === 'seven-seater' ? 72 : d.segment === 'city' ? 66 : 69,
  running: d.fuels?.includes('ev') && d.fuels.length === 1 ? 80 : clamp(Math.round(54 + (d.mpg || 30) / 2), 58, 79)
});
const c = d => ({ seats: 5, doors: 5, mpy: 8000, ncap: null, onSale: false, halo: false,
  g: grade(d),
  issues: ['Check service history and recall work', 'Condition matters on older examples'],
  buy: 'A well-maintained mid-spec car with documented servicing.',
  tags: ['bargain-hero', 'cheap-to-run', 'crowd-pleaser'], rivals: ['kia-picanto-ja', 'ford-fiesta-mk8'], ...d,
  verdict: d.verdict || `${d.model} ${d.gen} was a credible UK-market Hyundai generation: sensible, warrantied when new and now worth buying on condition.` });
export default { make: 'Hyundai', cars: [
  c({model:'i10',gen:'PA',years:[2008,2013],bodies:['hatch'],segment:'city',priceNew:[7500,12000],used:[1500,5000],accel:11.4,power:[66,86],top:106,fuels:['petrol'],mpg:55,ev:null,boot:225,len:3565,kg:930,ncap:[4,2008]}),
  c({model:'i10',gen:'IA',years:[2014,2020],bodies:['hatch'],segment:'city',priceNew:[8500,15000],used:[3500,9500],accel:10.5,power:[66,100],top:115,fuels:['petrol'],mpg:54,ev:null,boot:252,len:3665,kg:950,ncap:[4,2014]}),
  c({model:'i20',gen:'PB',years:[2008,2014],bodies:['hatch'],segment:'supermini',priceNew:[9000,15000],used:[1500,5500],accel:10.8,power:[75,126],top:118,fuels:['petrol','diesel'],mpg:55,ev:null,boot:295,len:3940,kg:1100,ncap:[5,2009]}),
  c({model:'i20',gen:'GB',years:[2014,2020],bodies:['hatch','coupe'],segment:'supermini',priceNew:[10500,19000],used:[4500,12000],accel:7.7,power:[75,204],top:143,fuels:['petrol','diesel'],mpg:54,ev:null,boot:326,len:4035,kg:1080,ncap:[4,2015],rivals:['kia-rio-yb','ford-fiesta-mk8']}),
  c({model:'i30',gen:'FD',years:[2007,2012],bodies:['hatch','estate'],segment:'family-hatch',priceNew:[12000,21000],used:[1500,6000],accel:9.6,power:[90,143],top:127,fuels:['petrol','diesel'],mpg:48,ev:null,boot:340,len:4245,kg:1250,ncap:[5,2008]}),
  c({model:'i30',gen:'GD',years:[2012,2017],bodies:['hatch','estate','coupe'],segment:'family-hatch',priceNew:[14500,24000],used:[4000,10500],accel:8.9,power:[90,186],top:130,fuels:['petrol','diesel'],mpg:52,ev:null,boot:378,len:4300,kg:1280,ncap:[5,2012]}),
  c({model:'i40',gen:'VF',years:[2012,2019],bodies:['saloon','estate'],segment:'exec',priceNew:[19000,31000],used:[4000,12000],accel:8.5,power:[115,201],top:132,fuels:['petrol','diesel'],mpg:50,ev:null,boot:553,len:4745,kg:1510,ncap:[5,2011],tags:['bargain-hero','motorway-muncher','dog-friendly']}),
  c({model:'Ioniq',gen:'AE',years:[2016,2022],bodies:['hatch'],segment:'family-hatch',priceNew:[20000,30000],used:[8000,19000],accel:10.8,power:[105,141],top:115,fuels:['hybrid','phev','ev'],mpg:70,ev:193,boot:443,len:4470,kg:1400,ncap:[5,2016],tags:['cheap-to-run','bargain-hero','silent-cruiser']}),
  c({model:'Ioniq 9',gen:'ME',years:[2025,0],bodies:['suv'],segment:'seven-seater',priceNew:[65000,78000],used:[55000,70000],accel:5.2,power:[218,428],top:124,fuels:['ev'],mpg:null,ev:385,seats:7,boot:620,len:5060,kg:2550,mpy:9500,ncap:[5,2025],onSale:true,halo:false,g:{build:84,drive:72,practicality:92,value:68,design:79,running:78},tags:['seven-seats','silent-cruiser','tech-fest','family-bus']}),
  c({model:'Kona',gen:'OS',years:[2017,2023],bodies:['suv'],segment:'small-suv',priceNew:[17000,37000],used:[8000,22000],accel:7.6,power:[120,204],top:127,fuels:['petrol','diesel','hybrid','ev'],mpg:48,ev:300,boot:374,len:4165,kg:1350,ncap:[5,2017]}),
  c({model:'Kona Electric',gen:'OS',years:[2018,2023],bodies:['suv'],segment:'ev-native',priceNew:[28000,39000],used:[10000,22000],accel:7.9,power:[136,204],top:104,fuels:['ev'],mpg:null,ev:300,boot:332,len:4180,kg:1685,ncap:[5,2017],tags:['cheap-to-run','silent-cruiser','bargain-hero','school-run']}),
  c({model:'Tucson',gen:'LM',years:[2010,2015],bodies:['suv'],segment:'family-suv',priceNew:[18000,30000],used:[3500,9500],accel:9.8,power:[115,184],top:120,fuels:['petrol','diesel'],mpg:43,ev:null,boot:513,len:4410,kg:1570,ncap:[5,2009]}),
  c({model:'Tucson',gen:'TL',years:[2015,2021],bodies:['suv'],segment:'family-suv',priceNew:[21000,36000],used:[7500,19000],accel:8.0,power:[116,185],top:126,fuels:['petrol','diesel'],mpg:46,ev:null,boot:513,len:4475,kg:1580,ncap:[5,2015]}),
  c({model:'Santa Fe',gen:'CM',years:[2006,2012],bodies:['suv'],segment:'seven-seater',priceNew:[24000,35000],used:[2500,8500],accel:9.8,power:[155,197],top:118,fuels:['diesel'],mpg:37,ev:null,seats:7,boot:528,len:4675,kg:1840,ncap:[4,2006],tags:['seven-seats','family-bus','tow-car','bargain-hero']}),
  c({model:'Santa Fe',gen:'DM',years:[2012,2018],bodies:['suv'],segment:'seven-seater',priceNew:[29000,43000],used:[7000,18000],accel:9.0,power:[150,200],top:125,fuels:['diesel'],mpg:42,ev:null,seats:7,boot:516,len:4690,kg:1880,ncap:[5,2012],tags:['seven-seats','family-bus','tow-car','dog-friendly']})
]};
