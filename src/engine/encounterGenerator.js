import { ENEMIES } from '../data/enemies.js';

// Tunable scaling/spawn knobs. Bands map combat tiers to enemy.threat tokens;
// boss-tier units are intentionally excluded from generated pools.
const TIER_TO_BAND = { LOW: 'low', MID: 'medium', HIGH: 'high' };
const TIER_COUNTS = { LOW: [1, 2], MID: [2, 3], HIGH: [2, 3] }; // inclusive [min,max] enemy count
const HP_BASE = 0.78, HP_PER_LEVEL = 0.032; // hp multiplier = HP_BASE + level*HP_PER_LEVEL (early-soft, L10≈1.10)
const DMG_BASE = 0.68, DMG_PER_LEVEL = 0.022; // damage multiplier = DMG_BASE + level*DMG_PER_LEVEL

// Party level drives scaling; clamp keeps factors bounded and predictable.
export function clampLevel(level) {
  const n = Math.floor(level ?? 1);
  if (Number.isNaN(n)) return 1;
  return Math.min(10, Math.max(1, n));
}

// Produce a fresh combat-ready unit; never mutate the source template.
export function scaleEnemy(template, partyLevel = 1, instanceId) {
  const lvl = clampLevel(partyLevel);
  const hpFactor = HP_BASE + lvl * HP_PER_LEVEL;
  const dmgFactor = DMG_BASE + lvl * DMG_PER_LEVEL;
  const hpMax = Math.max(1, Math.round(template.hp.max * hpFactor));
  return {
    id: instanceId ?? template.id,
    name: template.name,
    faction: template.faction ?? null,
    threat: template.threat,
    hp: { current: hpMax, max: hpMax },
    move: {
      ...template.move,
      damage: [
        Math.max(1, Math.round(template.move.damage[0] * dmgFactor)),
        Math.max(1, Math.round(template.move.damage[1] * dmgFactor)),
      ],
    },
    rampStacks: 0,
    ...(template.block ? { block: { ...template.block } } : {}),
  };
}

// Map template ids to scaled units with unique instance ids; skip unknown ids.
export function buildUnits(templateIds, partyLevel = 1) {
  const units = [];
  for (let i = 0; i < templateIds.length; i++) {
    const id = templateIds[i];
    const template = ENEMIES[id];
    if (!template) continue; // silently skip ids not in roster
    units.push(scaleEnemy(template, partyLevel, `${id}_${i}`));
  }
  return units;
}

// Generate a generic (non-boss) encounter for a tier, optionally biased to a faction.
export function generateEncounter({ faction = null, tier = 'LOW', partyLevel = 1, rng = Math.random } = {}) {
  const band = TIER_TO_BAND[tier] || 'low';
  let pool = Object.values(ENEMIES).filter((e) => e.threat === band);
  if (pool.length === 0) pool = Object.values(ENEMIES).filter((e) => e.threat !== 'boss');

  // Prefer faction-matched templates, but fall back to the whole band if none match.
  let prefer = faction ? pool.filter((e) => e.faction === faction) : [];
  if (prefer.length === 0) prefer = pool;

  const [lo, hi] = TIER_COUNTS[tier] || [1, 1];
  const count = lo + Math.floor(rng() * (hi - lo + 1));

  const enemies = [];
  for (let i = 0; i < count; i++) {
    const t = prefer[Math.floor(rng() * prefer.length)];
    enemies.push(scaleEnemy(t, partyLevel, `${t.id}_${i}`));
  }

  const id = `enc_gen_${faction || 'any'}_${tier}`;
  return { id, enemies };
}
