// GET/POST /api/ldn-refresh — monthly grounded refresh of the /ldn dataset.
// Invoked by Vercel Cron (Authorization: Bearer $CRON_SECRET) on the 1st, or
// manually with ?key=$REFRESH_SECRET (&dryRun=1 to preview without persisting).
//
// Pipeline: Gemini 3.5 grounded research (9 categories) -> normalise -> sanity
// gate -> persist to Blob (archive per month). If the sanity gate fails, the
// previous live dataset is KEPT — a broken refresh never replaces good data.
import { researchAll, buildDataset } from './_lib/ldn/research.mjs';
import { sanityGate } from './_lib/ldn/verify.mjs';
import { writeDataset } from './_lib/ldn/store.mjs';

function monthTag() {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit' });
  return fmt.format(new Date());
}

export default async function handler(req, res) {
  const q = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
  const auth = req.headers['authorization'] || '';
  const isCron = process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  const key = q.key || req.headers['x-refresh-secret'];
  const isManual = process.env.REFRESH_SECRET && key === process.env.REFRESH_SECRET;
  if (!isCron && !isManual) { res.status(401).json({ error: 'unauthorized' }); return; }

  const dryRun = q.dryRun === '1' || q.dryRun === 'true';
  const month = /^\d{4}-\d{2}$/.test(q.month || '') ? q.month : monthTag();

  try {
    const results = await researchAll({ month, concurrency: 3 });
    const dataset = buildDataset(results, { month, generatedAt: new Date().toISOString() });
    dataset.verified = false; // automated pipeline — lighter than the interactive adversarial pass
    const gate = sanityGate(dataset);
    const summary = {
      month,
      totalPlaces: dataset.places.length,
      perCategory: results.map(r => ({ category: r.category, count: r.places?.length || 0, error: r.error || null })),
      gate
    };

    if (dryRun) { res.status(200).json({ ok: true, dryRun: true, summary }); return; }
    if (!gate.ok) { res.status(200).json({ ok: false, persisted: false, reason: 'sanity gate failed — kept previous data', summary }); return; }

    const blobUrl = await writeDataset(dataset);
    res.status(200).json({ ok: true, persisted: true, blobUrl, summary });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
}
