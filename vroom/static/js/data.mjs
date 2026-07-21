const DEFAULT_DATA_URL = new URL('../../data/cars.json', import.meta.url);
const DEFAULT_META_URL = new URL('../../data/meta.json', import.meta.url);

function numberBand(value, fallback = [0, 0]) {
  if (!Array.isArray(value) || value.length < 2) return [...fallback];
  return [Number(value[0]) || 0, Number(value[1]) || 0];
}
export function normalizeCar(raw) {
  const car = raw && typeof raw === 'object' ? raw : {};
  return {
    ...car,
    id: String(car.id || ''),
    make: String(car.make || ''),
    model: String(car.model || ''),
    gen: String(car.gen || ''),
    years: numberBand(car.years),
    bodies: Array.isArray(car.bodies) ? car.bodies.filter(Boolean) : [],
    fuels: Array.isArray(car.fuels) ? car.fuels.filter(Boolean) : [],
    tags: Array.isArray(car.tags) ? car.tags.filter(Boolean) : [],
    rivals: Array.isArray(car.rivals) ? car.rivals.filter(Boolean) : [],
    usedGBP: numberBand(car.usedGBP ?? car.used),
    priceNewGBP: numberBand(car.priceNewGBP ?? car.priceNew),
    accel062: Number(car.accel062 ?? car.accel) || 0,
    powerBHP: numberBand(car.powerBHP ?? car.power),
    topMph: Number(car.topMph ?? car.top) || 0,
    bootL: Number(car.bootL ?? car.boot) || 0,
    lenMM: Number(car.lenMM ?? car.len) || 0,
    kgKerb: Number(car.kgKerb ?? car.kg) || 0,
    milesPerYear: Number(car.milesPerYear ?? car.mpy) || 8000,
    mpg: car.mpg == null ? null : Number(car.mpg),
    evMiles: car.evMiles == null ? (car.ev == null ? null : Number(car.ev)) : Number(car.evMiles),
    vroom: Number(car.vroom) || 0,
    grades: car.grades ?? car.g ?? {},
    halo: Boolean(car.halo),
    img: car.img && typeof car.img === 'object' ? car.img : null,
  };
}

async function fetchJSON(url, fetcher) {
  const response = await fetcher(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Could not load ${url}: HTTP ${response.status}`);
  return response.json();
}

export async function loadCatalogue({
  carsURL = DEFAULT_DATA_URL,
  metaURL = DEFAULT_META_URL,
  fetcher = globalThis.fetch,
} = {}) {
  if (typeof fetcher !== 'function') throw new Error('This browser cannot load the Vroom catalogue.');
  const [carsPayload, metaPayload] = await Promise.all([
    fetchJSON(carsURL, fetcher), fetchJSON(metaURL, fetcher),
  ]);
  const source = Array.isArray(carsPayload) ? carsPayload : carsPayload?.cars;
  if (!Array.isArray(source)) throw new TypeError('cars.json must contain an array of cars.');
  const cars = source.map(normalizeCar).filter(car => car.id && car.make && car.model);
  const byId = new Map(cars.map(car => [car.id, car]));
  return { cars, byId, meta: metaPayload && typeof metaPayload === 'object' ? metaPayload : {} };
}
