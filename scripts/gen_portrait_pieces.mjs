// gen_portrait_pieces.mjs — offline portrait *piece* baker.
// Enumerates every (scope, layer, rarity, index) piece declared in
// src/data/portraitTraits.js, asks gemini-2.5-flash-image for a transparent-
// background PNG of that single isolated piece, writes each under
// assets/portraits/pieces/<layer>/<pieceId>.png, then regenerates the
// require()-based manifest src/data/portraitAssets.js by scanning the FS so
// partial/filtered bakes accumulate.
//
//   GEMINI_API_KEY=<key> node scripts/gen_portrait_pieces.mjs
//   GEMINI_API_KEY=<key> node scripts/gen_portrait_pieces.mjs --class=netrunner --layer=clothing
//   node scripts/gen_portrait_pieces.mjs            # dry-run: print prompts only
//
// Without GEMINI_API_KEY the script runs dry: lists piece ids + prompts, writes
// no files, and does not touch the manifest. Imports only the extension-clean,
// dependency-free trait data, so it runs under plain `node` (no loader shim).
import fs from 'node:fs';
import path from 'node:path';
import { normalizePortraitLayerScalePng, sanitizeTransparentLayerPng } from './portrait_png_tools.mjs';
import {
  SHARED_LAYERS,
  CLASS_LAYERS,
  SHARED_LAYER_KEYS,
  CLASS_LAYER_KEYS,
  PORTRAIT_RARITY_WEIGHTS,
  pieceId,
  pieceScopeFor,
} from '../src/data/portraitTraits.js';

// ── CLI args (simple --k=v plus bare flags) ───────────────────────────────────
function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    const withValue = /^--([^=]+)=(.*)$/.exec(arg);
    if (withValue) {
      out[withValue[1]] = withValue[2];
      continue;
    }
    const bareFlag = /^--([^=]+)$/.exec(arg);
    if (bareFlag) out[bareFlag[1]] = true;
  }
  return out;
}
const args = parseArgs(process.argv);
const limit = args.limit != null ? Number.parseInt(args.limit, 10) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Enumerate pieces ──────────────────────────────────────────────────────────
// Flat list of every declared piece: shared (class-agnostic) + per-class layers.
function enumeratePieces() {
  const pieces = [];
  const rarities = Object.keys(PORTRAIT_RARITY_WEIGHTS);
  for (const layer of SHARED_LAYER_KEYS) {
    for (const rarity of rarities) {
      const pool = SHARED_LAYERS[layer]?.[rarity] ?? [];
      pool.forEach((asset, index) => {
        const scope = pieceScopeFor(null, layer); // 'shared'
        pieces.push({ scope, layer, rarity, index, asset, id: pieceId(scope, layer, rarity, index) });
      });
    }
  }
  for (const cls of Object.keys(CLASS_LAYERS)) {
    for (const layer of CLASS_LAYER_KEYS) {
      for (const rarity of rarities) {
        const pool = CLASS_LAYERS[cls]?.[layer]?.[rarity] ?? [];
        pool.forEach((asset, index) => {
          const scope = pieceScopeFor(cls, layer); // cls
          pieces.push({ scope, layer, rarity, index, asset, id: pieceId(scope, layer, rarity, index) });
        });
      }
    }
  }
  return pieces;
}

// ── Per-layer prompts ─────────────────────────────────────────────────────────
const PREAMBLE = '16-bit pixel-art, sharp detailed pixels, cyberpunk, neon cyan (#00f3ff) and magenta (#fe00fe) rim lighting. Centered front-facing head-and-shoulders bust framing, subject occupying the central 80% of a square canvas, head in the upper-center, shoulders along the bottom edge.';

const LAYER_PROMPTS = {
  background:  (asset) => ` Full-frame backdrop only, NO character, NO person: ${asset}. Opaque, fills the entire square.`,
  base:        (asset) => ` ONLY the bare head, face and shoulders — no clothing, no implants, no headwear: ${asset}. Transparent background (PNG alpha); nothing opaque outside the head-and-shoulders silhouette.`,
  clothing:    (asset) => ` ONLY the garment over the shoulders and upper chest, shaped to a head-and-shoulders bust, no head, no face: ${asset}. Transparent background (PNG alpha); only the garment is opaque.`,
  cybernetics: (asset) => ` ONLY the facial cybernetic implants/augments positioned on a centered face, no head base, no clothing: ${asset}. Transparent background (PNG alpha); only the implants are opaque.`,
  headwear:    (asset) => ` ONLY the hair/headwear on the top and sides of a centered head, no face, no body: ${asset}. Transparent background (PNG alpha); only the headwear is opaque.`,
};

function buildPrompt(layer, asset) {
  return PREAMBLE + LAYER_PROMPTS[layer](asset);
}

// ── Gemini call (copied verbatim from scripts/gen_portraits.mjs) ──────────────
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

// ── Manifest regeneration (scans FS so partial bakes accumulate) ──────────────
function scanImageAssets(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...scanImageAssets(full));
    else if (entry.isFile() && /\.(png|webp|jpe?g)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function writeManifest() {
  const piecesDir = path.resolve('assets/portraits/pieces');
  const dataDir = path.resolve('src/data');
  const entries = scanImageAssets(piecesDir).map((file) => {
    const key = path.basename(file, path.extname(file));
    let rel = path.relative(dataDir, file).split(path.sep).join('/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return [key, rel];
  });
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const lines = entries.map(([k, rel]) => `  '${k}': require('${rel}'),`);
  const body = `// AUTO-GENERATED by scripts/gen_portrait_pieces.mjs — do not edit by hand.
// Maps pieceId -> require()'d static image. Empty until pieces are baked.
export const PORTRAIT_PIECES = {${entries.length ? `\n${lines.join('\n')}\n` : ''}};
`;
  fs.writeFileSync(path.join(dataDir, 'portraitAssets.js'), body);
  return entries.length;
}

function sanitizeExistingPieces() {
  const files = scanImageAssets(path.resolve('assets/portraits/pieces'));
  let scanned = 0;
  let changedFiles = 0;
  let changedPixels = 0;
  let scaledFiles = 0;

  for (const file of files) {
    const layer = path.basename(path.dirname(file));
    if (layer === 'background') continue;

    scanned++;
    try {
      const bytes = fs.readFileSync(file);
      const sanitized = sanitizeTransparentLayerPng(bytes);
      const normalized = normalizePortraitLayerScalePng(sanitized.buffer);
      changedPixels += sanitized.changedPixels;
      if (normalized.changed) scaledFiles++;
      if (sanitized.changedPixels > 0 || normalized.changed) {
        fs.writeFileSync(file, normalized.buffer);
        changedFiles++;
      }
    } catch (err) {
      if (err.message === 'Only RGBA8 PNG portrait pieces are supported') {
        console.log(`warn ${path.relative(process.cwd(), file)} sanitize skipped: ${err.message}`);
        continue;
      }
      throw err;
    }
  }

  return { scanned, changedFiles, changedPixels, scaledFiles };
}

// ── Main ──────────────────────────────────────────────────────────────────────
let pieces = enumeratePieces();
if (args.layer) pieces = pieces.filter((p) => p.layer === args.layer);
if (args.class) pieces = pieces.filter((p) => SHARED_LAYER_KEYS.includes(p.layer) || p.scope === args.class);
if (Number.isFinite(limit)) pieces = pieces.slice(0, limit);

const apiKey = process.env.GEMINI_API_KEY;

if (args['sanitize-existing']) {
  const { scanned, changedFiles, changedPixels, scaledFiles } = sanitizeExistingPieces();
  writeManifest();
  console.log(`Sanitized ${changedFiles}/${scanned} portrait pieces; ${changedPixels} pixels cleared; scaled ${scaledFiles} files. Manifest: src/data/portraitAssets.js`);
  process.exit(0);
}

if (!apiKey) {
  console.log('[dry-run] GEMINI_API_KEY not set — listing piece prompts only');
  for (const p of pieces) {
    console.log(`\n${p.id}`);
    console.log(buildPrompt(p.layer, p.asset));
  }
  console.log(`\n[dry-run] ${pieces.length} pieces enumerated; no files written, manifest untouched.`);
  process.exit(0);
}

let generated = 0;
for (const p of pieces) {
  const prompt = buildPrompt(p.layer, p.asset);
  const outPath = path.resolve(`assets/portraits/pieces/${p.layer}/${p.id}.png`);
  try {
    const { b64 } = await callGemini(prompt, apiKey);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    let bytes = Buffer.from(b64, 'base64');
    if (p.layer !== 'background') {
      try {
        const sanitized = sanitizeTransparentLayerPng(bytes);
        const normalized = normalizePortraitLayerScalePng(sanitized.buffer);
        bytes = normalized.buffer;
        fs.writeFileSync(outPath, bytes);
        generated++;
        console.log(`ok   ${p.id} sanitized=${sanitized.changedPixels} scaled=${normalized.changed ? normalized.scale.toFixed(3) : 'no'}`);
      } catch (err) {
        if (err.message === 'Only RGBA8 PNG portrait pieces are supported') {
          fs.writeFileSync(outPath, bytes);
          generated++;
          console.log(`warn ${p.id} sanitize skipped: ${err.message}`);
        } else {
          throw err;
        }
      }
    } else {
      fs.writeFileSync(outPath, bytes);
      generated++;
      console.log(`ok   ${p.id}`);
    }
  } catch (err) {
    console.error(p.id, err.message);
  }
  await sleep(350);
}

const total = writeManifest();
console.log(`\nGenerated ${generated} this run; ${total} pieces on disk.`);
console.log('Manifest: src/data/portraitAssets.js');
