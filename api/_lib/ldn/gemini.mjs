// Minimal Gemini client with Google Search grounding.
// Uses the Generative Language REST API (v1beta) so it runs with a plain
// GEMINI_API_KEY and no SDK / build step — matching the TBB.ceo house style.
//
// Grounding note: the google_search tool cannot be combined with a JSON
// responseSchema, so we ask for JSON in the prompt and extract it robustly.

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
export const DEFAULT_MODEL = 'gemini-3.5-flash';

export function getApiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return key;
}

/**
 * Grounded generation. Returns { text, sources, queries, raw }.
 * sources: [{ title, uri }] deduped from groundingChunks.
 */
export async function groundedGenerate({
  prompt,
  model = DEFAULT_MODEL,
  temperature = 0.4,
  systemInstruction,
  grounded = true,
  maxRetries = 3,
  signal
} = {}) {
  if (!prompt) throw new Error('groundedGenerate: prompt required');
  const key = getApiKey();
  const url = `${API_BASE}/models/${model}:generateContent?key=${key}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: 32768 }
  };
  if (grounded) body.tools = [{ google_search: {} }];
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };

  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        // 429 / 5xx are retryable
        if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
          await sleep(backoff(attempt));
          continue;
        }
        throw new Error(`Gemini ${res.status}: ${errText.slice(0, 500)}`);
      }
      const data = await res.json();
      const cand = data.candidates?.[0];
      const text = (cand?.content?.parts || [])
        .map(p => p.text || '')
        .join('')
        .trim();
      const gm = cand?.groundingMetadata || {};
      const sources = dedupeSources(
        (gm.groundingChunks || [])
          .map(c => c.web && { title: c.web.title || c.web.uri, uri: c.web.uri })
          .filter(Boolean)
      );
      return { text, sources, queries: gm.webSearchQueries || [], raw: data };
    } catch (err) {
      lastErr = err;
      if (err.name === 'AbortError') throw err;
      if (attempt < maxRetries) {
        await sleep(backoff(attempt));
        continue;
      }
    }
  }
  throw lastErr || new Error('Gemini request failed');
}

/** Pull the first well-formed JSON object/array out of a model response. */
export function extractJson(text) {
  if (!text) throw new Error('extractJson: empty text');
  // Strip code fences if present.
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // Fast path.
  try { return JSON.parse(t); } catch { /* fall through */ }
  // Find the outermost { } or [ ] span.
  const start = t.search(/[[{]/);
  if (start === -1) throw new Error('extractJson: no JSON found');
  const open = t[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        const slice = t.slice(start, i + 1);
        return JSON.parse(slice);
      }
    }
  }
  throw new Error('extractJson: unbalanced JSON');
}

function dedupeSources(sources) {
  const seen = new Set();
  const out = [];
  for (const s of sources) {
    const k = s.uri;
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out.slice(0, 8);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const backoff = (attempt) => Math.min(1500 * 2 ** attempt, 8000);
