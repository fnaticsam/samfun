// Automated safety gate for the unattended monthly refresh.
// This is NOT the full 49-agent adversarial workflow (that runs interactively
// when a human refreshes) — it is a structural gate that refuses to replace
// good live data with a broken refresh. Combined with: grounded research,
// month archives, and the bundled seed fallback.
import { inLondon, TOP_N } from './categories.mjs';

export function sanityGate(ds) {
  const issues = [];
  if (!ds || !Array.isArray(ds.places) || !Array.isArray(ds.categories)) {
    return { ok: false, issues: ['dataset malformed'] };
  }
  const minPerCat = Math.max(3, Math.ceil(TOP_N * 0.6)); // e.g. 6 when TOP_N=9
  const catIds = ds.categories.map(c => c.id);
  for (const cid of catIds) {
    const ps = ds.places.filter(p => p.category === cid);
    if (ps.length < minPerCat) issues.push(`${cid}: only ${ps.length} places (<${minPerCat})`);
  }
  const badCoords = ds.places.filter(p => p.lat == null || p.lng == null || !inLondon(p.lat, p.lng)).length;
  if (badCoords > Math.ceil(ds.places.length * 0.15)) issues.push(`${badCoords} places with bad/missing coords`);
  const names = ds.places.map(p => String(p.name || '').toLowerCase().trim());
  const dupes = names.filter((n, i) => n && names.indexOf(n) !== i);
  if (dupes.length) issues.push(`duplicate names: ${[...new Set(dupes)].slice(0, 5).join(', ')}`);
  const minTotal = catIds.length * minPerCat;
  if (ds.places.length < minTotal) issues.push(`only ${ds.places.length} places total (<${minTotal})`);
  return { ok: issues.length === 0, issues };
}
