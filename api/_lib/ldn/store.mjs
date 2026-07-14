// Dataset persistence for /ldn. Vercel Blob is the live store; the bundled
// seed (last hand-verified month) is the fallback so the endpoint never fails.
import { put, list } from '@vercel/blob';
import seed from './seed.mjs';

const KEY = 'ldn/current.json';
export { seed };

export async function readDataset() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return { dataset: seed, source: 'seed' };
  try {
    const { blobs } = await list({ prefix: KEY, token });
    const hit = blobs.find(b => b.pathname === KEY) || blobs[0];
    if (!hit) return { dataset: seed, source: 'seed' };
    const r = await fetch(hit.url, { cache: 'no-store' });
    if (!r.ok) return { dataset: seed, source: 'seed' };
    return { dataset: await r.json(), source: 'blob' };
  } catch (e) {
    return { dataset: seed, source: 'seed', error: String(e.message || e) };
  }
}

export async function writeDataset(ds) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN not set');
  const body = JSON.stringify(ds);
  const opts = { access: 'public', contentType: 'application/json', token, addRandomSuffix: false, allowOverwrite: true };
  const cur = await put(KEY, body, opts);
  if (ds.month) await put(`ldn/archive/${ds.month}.json`, body, opts).catch(() => {});
  return cur.url;
}
