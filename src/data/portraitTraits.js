// Layered portrait asset pools. Phrases feed a single Gemini text-to-image prompt.
// Rarity weights + tiers are the reference's 4-tier visual system, independent of
// recruit `quality` (src/data/recruitQuality.js).

export const PORTRAIT_RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, legendary: 5 };
export const RARITY_RANK = { common: 0, uncommon: 1, rare: 2, legendary: 3 };

// back-to-front composite order
export const LAYER_ORDER = ['background', 'base', 'clothing', 'cybernetics', 'headwear'];
export const SHARED_LAYER_KEYS = ['background', 'base'];
export const CLASS_LAYER_KEYS  = ['clothing', 'cybernetics', 'headwear'];

// class-agnostic layers
export const SHARED_LAYERS = {
  background: {
    common:    ['flat charcoal-black void', 'dim grey concrete wall'],
    uncommon:  ['faint neon alley haze with magenta spill', 'dark room lit by a single cyan monitor'],
    rare:      ['rain-streaked neon cityscape bokeh', 'holographic billboard glow behind the subject'],
    legendary: ['cascading green data-stream matrix', 'fractured holographic city skyline'],
  },
  base: {
    common:    ['weathered organic face, neutral skin tone, light stubble', 'clean organic face, tired eyes'],
    uncommon:  ['pale skin with a faint subdermal port scar at the temple', 'sharp organic features with a thin cheek scar'],
    rare:      ['skin with visible panel-line seams along the jaw', 'partial chrome cheek plate over scarred skin'],
    legendary: ['flawless synthetic skin with a faintly inhuman sheen', 'face half-replaced with seamless chrome'],
  },
};

// class-specific layers; cue text transcribed into clothing/cybernetics/headwear
export const CLASS_LAYERS = {
  chrome_doc: { // Ripperdoc
    clothing:    { common: ['stained surgical scrubs and basic latex gloves'], uncommon: ['sterile white synthetic medical jacket'], rare: ['armored medical coat with a tool harness'], legendary: ['gold-trimmed pristine surgical coat'] },
    cybernetics: { common: ['tired organic eyes, no augments'], uncommon: ['magnifying optical loupe over one eye'], rare: ['multi-lens optical array and chrome jaw replacement'], legendary: ['full mechanical spider-eye array, gold-plated surgical chrome'] },
    headwear:    { common: ['flat surgical cap over matted hair'], uncommon: ['surgical headlamp band'], rare: ['neon-lit respirator mask'], legendary: ['blood-spatter holographic overlay around the head'] },
  },
  netrunner: { // Netrunner (digital/stealth)
    clothing:    { common: ['dark hoodie with a neural-link cable at the neck'], uncommon: ['cooling suit with vent panels'], rare: ['deep-dive suit with liquid-cooling tubes'], legendary: ['full haptic-feedback cowl, no visible body'] },
    cybernetics: { common: ['pale skin, single neural port behind the ear'], uncommon: ['glowing cranial jack, faint optic glow'], rare: ['glowing cranial jacks and an optic blackout band'], legendary: ['zero organic facial features, data-stream hologram over the face'] },
    headwear:    { common: ['plain dark hair'], uncommon: ['colorful VR goggles and neon-dyed hair'], rare: ['optic blackout visor'], legendary: ['floating data-stream hologram masking the face'] },
  },
  street_samurai: { // Solo (combat/tactical)
    clothing:    { common: ['faded combat jacket'], uncommon: ['visible subdermal ballistic plating panels'], rare: ['Trauma-Team-style armored collar'], legendary: ['heavy military-grade chrome chassis torso'] },
    cybernetics: { common: ['organic scars across the face'], uncommon: ['basic targeting optic over one eye'], rare: ['glowing red targeting optics and heavy jaw plating'], legendary: ['active-camo visual glitch over heavy chrome'] },
    headwear:    { common: ['military buzzcut'], uncommon: ['low-profile tactical earpiece'], rare: ['half-face armored mask'], legendary: ['full tactical sensory-deprivation hood'] },
  },
  fixer: { // Fixer (social/economy)
    clothing:    { common: ['cheap synthetic suit'], uncommon: ['flashy neon-lapel jacket'], rare: ['high-collar corporate coat'], legendary: ['pristine immaculate designer coat'] },
    cybernetics: { common: ['basic comms earpiece, organic eyes'], uncommon: ['gold-plated neural ports and mirrored shades'], rare: ['subtle gold-lined subdermal plating and a designer cyber-eye'], legendary: ['organic-looking synthetic skin, floating neon market-ticker holograms around the head'] },
    headwear:    { common: ['slicked-back hair'], uncommon: ['mirrored aviator shades'], rare: ['sculpted designer haircut'], legendary: ['halo of floating neon market-ticker holograms'] },
  },
  ghost: { // authored: stealth/blackout infiltrator (not in cue)
    clothing:    { common: ['matte-black low-profile jacket'], uncommon: ['light stealth harness with muted panels'], rare: ['optic-camo-lined infiltration suit'], legendary: ['shimmering active-camo shroud, body barely visible'] },
    cybernetics: { common: ['organic eyes, faint scar, no glow'], uncommon: ['matte ocular implant with a dim grey glow'], rare: ['blackout sensor band across the eyes'], legendary: ['featureless smooth faceplate, no organic features'] },
    headwear:    { common: ['short dark hair, neutral'], uncommon: ['low hood shadowing the face'], rare: ['sensor-deprivation half-hood'], legendary: ['full blackout hood with an active-camo glitch'] },
  },
};

// class key -> evocative label for the image prompt
export const CLASS_PROMPT_LABEL = {
  chrome_doc: 'ripperdoc', netrunner: 'netrunner', street_samurai: 'solo street-samurai',
  fixer: 'fixer', ghost: 'ghost infiltrator',
};

// ── Canonical piece-id contract ───────────────────────────────────────────────
// Single source of truth for piece keys, shared by gen_portrait_pieces.mjs, the
// generated portraitAssets.js manifest, and the Haven PORTRAIT_LAB renderer.

// scope = 'shared' for class-agnostic layers, else the class key.
export function pieceScopeFor(cls, layer) {
  return SHARED_LAYER_KEYS.includes(layer) ? 'shared' : cls;
}

// Filesystem-safe, valid object key. Matches PNG basename (no extension).
// e.g. shared__background__common__0, netrunner__clothing__legendary__0
export function pieceId(scope, layer, rarity, index) {
  return `${scope}__${layer}__${rarity}__${index}`;
}
