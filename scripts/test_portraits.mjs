// test_portraits.mjs — unit tests for the layered portrait roller.
// Run: node scripts/test_portraits.mjs
// Imports portraitGenerator.js directly (extension-clean → no shim needed).
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  rollRarity, rollPortraitLayers, buildPortraitPrompt, STYLE, poolFor,
  generatePortrait, portraitClassKey, seededPortraitRng, withPortrait,
} from '../src/engine/portraitGenerator.js';
import { LAYER_ORDER, RARITY_RANK, pieceId, pieceScopeFor } from '../src/data/portraitTraits.js';
import { measurePngAlpha, measurePngContentBounds } from './portrait_png_tools.mjs';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetPath = (rel) => path.resolve(__dirname, '..', rel);
let pass = 0, fail = 0;
function check(label, fn) {
  try { fn(); pass++; console.log(`  ok   ${label}`); }
  catch (err) { fail++; console.log(`  FAIL ${label}\n       ${err.message}`); }
}

// Deterministic-ish rng helpers.
const rngLow = () => 0.0;   // always first rarity (common) + first asset

// ── 1. all layers present & ordered ──────────────────────────────────────────
check('rollPortraitLayers returns ordered subsequence of LAYER_ORDER, full length 5', () => {
  const { layers } = rollPortraitLayers('netrunner', rngLow);
  assert.equal(layers.length, 5, 'expected all 5 layers with full pools');
  const got = layers.map((l) => l.layer);
  // subsequence check against LAYER_ORDER
  let idx = -1;
  for (const layer of got) {
    const next = LAYER_ORDER.indexOf(layer);
    assert.ok(next > idx, `layer ${layer} out of order`);
    idx = next;
  }
});

// ── 2. tier = max rarity across rolled layers ────────────────────────────────
check('tier equals max RARITY_RANK across layers', () => {
  // mixed rng to exercise multiple rarities
  let i = 0;
  const seq = [0.0, 0.0, 0.99, 0.0, 0.5, 0.0, 0.85, 0.0, 0.0, 0.0];
  const rng = () => seq[(i++) % seq.length];
  const { layers, tier } = rollPortraitLayers('street_samurai', rng);
  const maxRank = Math.max(...layers.map((l) => RARITY_RANK[l.rarity]));
  assert.equal(RARITY_RANK[tier], maxRank);
});

// ── 3. class fallback (unknown class → fixer) does not throw ──────────────────
check('unknown class falls back to fixer, non-empty layers', () => {
  const { layers } = rollPortraitLayers('not_a_class', rngLow);
  assert.ok(layers.length > 0, 'expected non-empty layers from fallback');
});

// ── 4. rollRarity distribution within ±3pp of 60/25/10/5 ─────────────────────
check('rollRarity distribution ≈ 60/25/10/5 (±3pp)', () => {
  const N = 20000;
  const counts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
  for (let n = 0; n < N; n++) counts[rollRarity(Math.random)]++;
  const pct = (k) => (counts[k] / N) * 100;
  const within = (k, target) => assert.ok(
    Math.abs(pct(k) - target) <= 3,
    `${k} = ${pct(k).toFixed(2)}% off target ${target}%`,
  );
  within('common', 60);
  within('uncommon', 25);
  within('rare', 10);
  within('legendary', 5);
});

// ── 5. prompt assembly ───────────────────────────────────────────────────────
check('buildPortraitPrompt starts with STYLE, contains label + every asset', () => {
  const rolled = rollPortraitLayers('chrome_doc', rngLow);
  const prompt = buildPortraitPrompt({ class: 'chrome_doc', quality: 'rare', name: 'X' }, rolled);
  assert.ok(prompt.startsWith(STYLE), 'prompt must start with STYLE');
  assert.ok(prompt.includes('ripperdoc'), 'prompt must contain class label');
  for (const { asset } of rolled.layers) {
    assert.ok(prompt.includes(asset), `prompt missing asset: ${asset}`);
  }
});

// ── 6. rolled layers carry an in-range integer index ─────────────────────────
check('rolled layers carry an in-range integer asset index', () => {
  const cls = 'netrunner';
  const { layers } = rollPortraitLayers(cls, () => 0);
  for (const l of layers) {
    assert.ok(Number.isInteger(l.index) && l.index >= 0, `bad index for ${l.layer}: ${l.index}`);
    assert.ok(l.index < poolFor(cls, l.layer, l.rarity).length, `index out of range for ${l.layer}`);
  }
});

// ── 7. pieceScopeFor / pieceId round-trip per layer scope ────────────────────
check('pieceScopeFor / pieceId round-trip to scope', () => {
  const { layers } = rollPortraitLayers('chrome_doc');
  const re = /^(shared|chrome_doc)__[a-z]+__(common|uncommon|rare|legendary)__\d+$/;
  for (const l of layers) {
    const scope = pieceScopeFor('chrome_doc', l.layer);
    const expected = (l.layer === 'background' || l.layer === 'base') ? 'shared' : 'chrome_doc';
    assert.equal(scope, expected, `scope mismatch for ${l.layer}`);
    assert.match(pieceId(scope, l.layer, l.rarity, l.index), re, `bad pieceId for ${l.layer}`);
  }
});


// ── 8. class normalization keeps title/uppercase classes on correct pools ─────
check('generatePortrait normalizes display class names before rolling layers', () => {
  const portrait = generatePortrait({ class: 'Street Samurai', quality: 'rare', name: 'Case' }, rngLow);
  const classLayers = portrait.layers.filter((l) => !['background', 'base'].includes(l.layer));
  assert.equal(portraitClassKey('STREET SAMURAI'), 'street_samurai');
  assert.ok(classLayers.some((l) => l.asset.includes('combat') || l.asset.includes('scars') || l.asset.includes('buzzcut')));
  assert.ok(portrait.prompt.includes('solo street-samurai'), 'prompt should use normalized class label');
});

// ── 9. cached portraits are preserved instead of re-rolled ────────────────────
check('withPortrait preserves cached portrait and seeds deterministic new portraits', () => {
  const first = withPortrait(
    { id: 'op_test', name: 'Cache_Test', class: 'Netrunner' },
    seededPortraitRng('op_test'),
  );
  const second = withPortrait(
    { id: 'op_test', name: 'Cache_Test', class: 'Netrunner' },
    seededPortraitRng('op_test'),
  );
  assert.deepEqual(first.portrait.layers, second.portrait.layers);
  assert.strictEqual(withPortrait(first), first);
});

// ── 10. baked portrait layers use alpha, not fake transparency ─────────────────
check('portrait layer assets have real transparent alpha, not baked checkerboard', () => {
  const base = measurePngAlpha(fs.readFileSync(assetPath('assets/portraits/pieces/base/shared__base__common__0.png')));
  const clothing = measurePngAlpha(fs.readFileSync(assetPath('assets/portraits/pieces/clothing/netrunner__clothing__common__0.png')));

  for (const [label, measured] of [['base', base], ['clothing', clothing]]) {
    assert.ok(measured.transparentRatio >= 0.15, `${label} transparentRatio ${measured.transparentRatio}`);
    assert.ok(measured.checkerOpaqueRatio <= 0.02, `${label} checkerOpaqueRatio ${measured.checkerOpaqueRatio}`);
  }
});

// ── 11. baked backgrounds stay full-frame opaque ───────────────────────────────
check('portrait background assets remain opaque', () => {
  const background = measurePngAlpha(fs.readFileSync(assetPath('assets/portraits/pieces/background/shared__background__common__0.png')));
  assert.ok(background.transparentRatio <= 0.01, `background transparentRatio ${background.transparentRatio}`);
});

// ── 12. baked portrait layers keep preview-safe content bounds ─────────────────
check('portrait layer assets fit inside preview-safe content bounds', () => {
  const dirs = [
    'assets/portraits/pieces/base',
    'assets/portraits/pieces/clothing',
    'assets/portraits/pieces/cybernetics',
    'assets/portraits/pieces/headwear',
  ];

  for (const dir of dirs) {
    const fullDir = assetPath(dir);
    for (const name of fs.readdirSync(fullDir)) {
      if (!/\.png$/i.test(name)) continue;
      const file = path.join(fullDir, name);
      const rel = path.relative(assetPath(''), file).split(path.sep).join('/');
      const measured = measurePngContentBounds(fs.readFileSync(file));
      assert.ok(measured.maxContentRatio <= 0.82, `${rel} maxContentRatio ${measured.maxContentRatio}`);
    }
  }
});
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
