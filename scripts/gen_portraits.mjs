// gen_portraits.mjs — standalone portrait generation harness.
// Generates a batch of in-game characters via the REAL generateRecruit, rolls each a
// layered portrait (background → base → clothing → cybernetics → headwear) with the
// reference's 4-tier rarity system, composes one Gemini text-to-image prompt per
// character, optionally calls gemini-2.5-flash-image, and writes a dark cyberpunk
// HTML gallery to scripts/out/portraits.html for eyeballing.
//
//   node scripts/gen_portraits.mjs --count=8 --seed=7
//   GEMINI_API_KEY=<key> node scripts/gen_portraits.mjs --count=8
//
// Without GEMINI_API_KEY the harness runs dry (prompts + gallery, no images).
import { register } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

// Activate the extensionless-import resolve hook BEFORE importing app modules.
register('./loaderShim.mjs', import.meta.url);

// Dynamic imports so the hook is active first (static imports evaluate too early).
const { generateRecruit } = await import('../src/engine/recruitGenerator.js');
const { generatePortrait } = await import('../src/engine/portraitGenerator.js');

// ── CLI args (simple --k=v) ───────────────────────────────────────────────────
function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    const m = /^--([^=]+)=(.*)$/.exec(arg);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const args = parseArgs(process.argv);
const count        = Number.parseInt(args.count ?? '8', 10);
const classOverride = args.class || undefined;
const qualityOverride = args.quality || undefined;
const contracts    = Number.parseInt(args.contracts ?? '20', 10);
const seed         = args.seed != null ? Number.parseInt(args.seed, 10) : undefined;

// ── Determinism: seeded PRNG replaces Math.random for both recruit + portrait ──
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
if (seed != null) {
  const prng = mulberry32(seed);
  Math.random = prng;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Gemini call ───────────────────────────────────────────────────────────────
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

async function callGeminiOnce(prompt, apiKey, withModalities) {
  const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  if (withModalities) body.generationConfig = { responseModalities: ['IMAGE', 'TEXT'] };
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${text}`);
    err.status = res.status;
    err.bodyText = text;
    throw err;
  }
  const json = JSON.parse(text);
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p.inlineData?.data);
  if (!imgPart) throw new Error('no inlineData in response');
  return { b64: imgPart.inlineData.data, mime: imgPart.inlineData.mimeType ?? 'image/png' };
}

async function callGemini(prompt, apiKey) {
  try {
    return await callGeminiOnce(prompt, apiKey, false);
  } catch (err) {
    const msg = String(err.message || '');
    const modalityIssue = (err.status === 400 && /modalit|responseModalities/i.test(msg))
      || /no inlineData/.test(msg);
    if (modalityIssue) {
      return await callGeminiOnce(prompt, apiKey, true);
    }
    throw err;
  }
}

// ── HTML gallery ────────────────────────────────────────────────────────────
const TIER_COLORS = { common: '#849495', uncommon: '#00f3ff', rare: '#fe00fe', legendary: '#ffb400' };
const QUALITY_COLORS = { common: '#849495', rare: '#fe00fe', legendary: '#ffb400' };
const STAT_KEYS = ['chrome', 'edge', 'ghost', 'face', 'grit', 'wire'];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function card(item) {
  const { character: c, portrait: p, image } = item;
  const tierColor = TIER_COLORS[p.tier] ?? '#849495';
  const qColor = QUALITY_COLORS[c.quality] ?? '#849495';
  const media = image
    ? `<img class="portrait" src="portraits/${esc(image)}" alt="${esc(c.name)}">`
    : `<div class="portrait placeholder">${esc(p.prompt)}</div>`;
  const layerRows = p.layers.map((l) => `
        <div class="layer">
          <span class="lname">${esc(l.layer)}</span>
          <span class="lrarity" style="color:${TIER_COLORS[l.rarity] ?? '#849495'}">${esc(l.rarity)}</span>
          <span class="lasset">${esc(l.asset)}</span>
        </div>`).join('');
  const statRows = STAT_KEYS.map((k) => `
          <span class="stat"><b>${k.toUpperCase()}</b> ${esc(c.stats[k])}</span>`).join('');
  return `
      <div class="card">
        ${media}
        <div class="name">${esc(c.name)}</div>
        <div class="handle">${esc(c.handle)}</div>
        <div class="cls">${esc(String(c.class).toUpperCase())}</div>
        <div class="chips">
          <span class="chip" style="border-color:${qColor};color:${qColor}">RECRUIT ${esc(String(c.quality).toUpperCase())}</span>
          <span class="chip" style="border-color:${tierColor};color:${tierColor}">PORTRAIT ${esc(String(p.tier).toUpperCase())}</span>
        </div>
        <div class="layers">${layerRows}
        </div>
        <div class="stats">${statRows}
        </div>
      </div>`;
}

function writeGallery(items, htmlPath) {
  const cards = items.map(card).join('\n');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NEON TERMINUS // PORTRAIT GALLERY</title>
<style>
  :root { --bg:#0e0e10; --fg:#e5e1e4; --cyan:#00f3ff; --magenta:#fe00fe; --line:#3a494b; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 24px; background: var(--bg); color: var(--fg);
    font-family: 'Kode Mono', ui-monospace, monospace;
  }
  h1 {
    font-size: 18px; letter-spacing: 4px; text-transform: uppercase;
    color: var(--cyan); margin: 0 0 4px 0;
  }
  .sub { color: #849495; font-size: 12px; letter-spacing: 2px; margin-bottom: 24px; }
  .grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  }
  @media (max-width: 1100px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px)  { .grid { grid-template-columns: 1fr; } }
  .card {
    border: 1px solid var(--line); border-radius: 0; background: #131315;
    padding: 12px; display: flex; flex-direction: column; gap: 8px;
  }
  .portrait {
    width: 100%; aspect-ratio: 1 / 1; object-fit: cover; border: 1px solid var(--line);
    image-rendering: pixelated; background: #000;
  }
  .portrait.placeholder {
    display: flex; align-items: center; padding: 10px; font-size: 10px;
    line-height: 1.4; color: #849495; overflow: auto;
  }
  .name { font-size: 15px; color: var(--fg); letter-spacing: 1px; }
  .handle { font-size: 11px; color: var(--magenta); letter-spacing: 2px; }
  .cls { font-size: 11px; color: var(--cyan); letter-spacing: 3px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    font-size: 9px; letter-spacing: 1px; padding: 3px 6px; border: 1px solid;
    border-radius: 0;
  }
  .layers { display: flex; flex-direction: column; gap: 3px; border-top: 1px solid var(--line); padding-top: 8px; }
  .layer { display: grid; grid-template-columns: 78px 64px 1fr; gap: 6px; font-size: 9px; line-height: 1.3; }
  .lname { color: #849495; text-transform: uppercase; letter-spacing: 1px; }
  .lrarity { text-transform: uppercase; letter-spacing: 1px; }
  .lasset { color: var(--fg); }
  .stats { display: flex; flex-wrap: wrap; gap: 6px; border-top: 1px solid var(--line); padding-top: 8px; }
  .stat { font-size: 9px; color: #b9cacb; letter-spacing: 1px; }
  .stat b { color: var(--cyan); }
</style>
</head>
<body>
  <h1>Neon Terminus // Portrait Gallery</h1>
  <div class="sub">${items.length} PORTRAITS &middot; ${items.some((i) => i.image) ? 'LIVE' : 'DRY-RUN (NO API KEY)'}</div>
  <div class="grid">
${cards}
  </div>
</body>
</html>
`;
  fs.writeFileSync(htmlPath, html);
}

// ── Main ──────────────────────────────────────────────────────────────────────
const outDir = path.resolve('scripts/out');
const imgDir = path.join(outDir, 'portraits');
fs.mkdirSync(imgDir, { recursive: true });

const apiKey = process.env.GEMINI_API_KEY;
const dryRun = !apiKey;
if (dryRun) console.log('[dry-run] GEMINI_API_KEY not set — emitting prompts only');

const items = [];
for (let i = 0; i < count; i++) {
  const c = generateRecruit(contracts, 1, qualityOverride, classOverride);
  const p = generatePortrait(c);
  items.push({ character: c, portrait: p, image: null });
  console.log(`[${String(i).padStart(2, '0')}] ${c.name} <${c.handle}>  class=${c.class}  recruit=${c.quality}  portrait-tier=${p.tier}`);
  console.log(`     ${p.prompt}`);
}

const mimeExt = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
if (!dryRun) {
  for (let i = 0; i < items.length; i++) {
    const { character: c, portrait: p } = items[i];
    try {
      const { b64, mime } = await callGemini(p.prompt, apiKey);
      const ext = mimeExt[mime] ?? 'png';
      const file = `${String(i).padStart(2, '0')}_${c.class}_${p.tier}.${ext}`;
      fs.writeFileSync(path.join(imgDir, file), Buffer.from(b64, 'base64'));
      items[i].image = file;
      console.log(`  -> saved ${file}`);
    } catch (err) {
      console.error(`  [${i}] image failed: ${err.message}`);
      items[i].image = null;
    }
    if (i < items.length - 1) await sleep(350);
  }
}

const htmlPath = path.join(outDir, 'portraits.html');
writeGallery(items, htmlPath);

// Per-tier counts of generated portraits.
const tierCounts = {};
for (const it of items) tierCounts[it.portrait.tier] = (tierCounts[it.portrait.tier] ?? 0) + 1;
console.log(`\nGallery: ${htmlPath}`);
console.log(`Portrait tiers: ${JSON.stringify(tierCounts)}`);
if (!dryRun) {
  const ok = items.filter((i) => i.image).length;
  console.log(`Images: ${ok}/${items.length} generated`);
}
