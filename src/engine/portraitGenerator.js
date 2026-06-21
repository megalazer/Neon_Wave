// Pure, store-free portrait roller. Mirrors src/engine/recruitGenerator.js style:
// default rng = Math.random so callers can inject a seeded PRNG. Imports only the
// trait data with an explicit .js extension so it runs under plain `node` (no shim).
import {
  PORTRAIT_RARITY_WEIGHTS,
  RARITY_RANK,
  LAYER_ORDER,
  SHARED_LAYER_KEYS,
  SHARED_LAYERS,
  CLASS_LAYERS,
  CLASS_PROMPT_LABEL,
} from '../data/portraitTraits.js';

export function portraitClassKey(cls) {
  return String(cls || 'fixer').toLowerCase().replace(/\s+/g, '_');
}

export function seededPortraitRng(seed) {
  let h = 2166136261;
  const input = String(seed || 'portrait');
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function rng() {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Style preamble grounded in docs/designs/cyperpunkReference.jpg (pixel-art busts on black).
export const STYLE = '16-bit pixel-art character portrait, head-and-shoulders bust, front-facing, solid black background, cyberpunk, neon cyan (#00f3ff) and magenta (#fe00fe) rim lighting, sharp detailed pixels, single character.';

// Weighted pick over PORTRAIT_RARITY_WEIGHTS (sum = 100).
export function rollRarity(rng = Math.random) {
  const roll = rng() * 100;
  let cumulative = 0;
  for (const rarity of Object.keys(PORTRAIT_RARITY_WEIGHTS)) {
    cumulative += PORTRAIT_RARITY_WEIGHTS[rarity];
    if (cumulative > roll) return rarity;
  }
  return 'legendary';
}

export function pickAsset(pool, rng = Math.random) {
  return pool[Math.floor(rng() * pool.length)];
}

// Resolve the asset array for (layer, rarity) with a common/class fallback chain.
export function poolFor(cls, layer, rarity) {
  const source = SHARED_LAYER_KEYS.includes(layer)
    ? SHARED_LAYERS[layer]
    : (CLASS_LAYERS[cls] ?? CLASS_LAYERS.fixer)[layer];
  if (!source) return [];
  const pool = source[rarity];
  if (Array.isArray(pool) && pool.length > 0) return pool;
  const fallback = source.common;
  return Array.isArray(fallback) ? fallback : [];
}

// For each layer in LAYER_ORDER: roll a rarity, pick an asset; skip empty pools.
// tier = the rarity with the max RARITY_RANK across the rolled layers.
export function rollPortraitLayers(cls, rng = Math.random) {
  const layers = [];
  for (const layer of LAYER_ORDER) {
    const rarity = rollRarity(rng);
    const pool = poolFor(cls, layer, rarity);
    if (pool.length === 0) continue;
    const index = Math.floor(rng() * pool.length);
    layers.push({ layer, rarity, asset: pool[index], index });
  }
  let tier = 'common';
  for (const { rarity } of layers) {
    if (RARITY_RANK[rarity] > RARITY_RANK[tier]) tier = rarity;
  }
  return { layers, tier };
}

// Single text prompt: style + identity sentence + per-layer phrases.
export function buildPortraitPrompt(character, rolled) {
  const cls = portraitClassKey(character.class);
  const label = CLASS_PROMPT_LABEL[cls] ?? cls;
  const quality = character.quality ?? 'operator';
  const name = character.name ?? character.handle ?? 'UNKNOWN';
  const head = `${STYLE} A ${quality} ${label} called ${name}. `;
  const body = rolled.layers.map(({ layer, asset }) => `${layer}: ${asset}`).join('; ');
  return `${head}${body}.`;
}

export function generatePortrait(character, rng = Math.random) {
  const normalized = { ...character, class: portraitClassKey(character.class) };
  const rolled = rollPortraitLayers(normalized.class, rng);
  return { ...rolled, prompt: buildPortraitPrompt(normalized, rolled) };
}

export function withPortrait(character, rng = Math.random) {
  if (character?.portrait?.layers?.length) return character;
  return { ...character, portrait: generatePortrait(character, rng) };
}
