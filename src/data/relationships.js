// ── Bond model (shared across crew / friends / fixers) ──────────────────────
// Mirror of factions.js tier system. Pure; Node-safe; no RN imports.

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export const BOND_MIN = 0;
export const BOND_MAX = 100;

export const BOND_TIERS = ['STRANGER', 'ACQUAINTANCE', 'TRUSTED', 'LOYAL', 'BONDED'];

export const BOND_TIER_RANK = {
  STRANGER: 0, ACQUAINTANCE: 1, TRUSTED: 2, LOYAL: 3, BONDED: 4,
};

export function bondTierFromValue(v) {
  if (v < 20) return 'STRANGER';
  if (v < 40) return 'ACQUAINTANCE';
  if (v < 60) return 'TRUSTED';
  if (v < 80) return 'LOYAL';
  return 'BONDED';
}

export function getBond(entity) {
  return entity?.bond ?? 0;
}

// ── Gift / taste system ──────────────────────────────────────────────────────

export const GIFT_CATEGORIES = ['tech', 'luxury', 'street'];

export const FACTION_GIFT_TASTE = {
  fac_lexicon:  'tech',
  fac_signal:   'tech',
  fac_referent: 'luxury',
  fac_grammaton:'luxury',
  fac_undertow: 'street',
  fac_static:   'street',
};

// ── Path modifiers (mirrors ORIGIN_MODIFIERS) ────────────────────────────────

export const PATH_RELATIONSHIP_MODIFIERS = {
  corpo: {
    interactBonus: 2,
    decayPer: 1,
    giftEdge: 'luxury',
    factionBondBias: { fac_grammaton: 5, fac_referent: 5, fac_static: -5 },
  },
  street_kid: {
    interactBonus: 1,
    decayPer: 1,
    giftEdge: 'street',
    factionBondBias: { fac_undertow: 5, fac_static: 5 },
  },
  nomad: {
    interactBonus: 0,
    decayPer: 0.5,
    giftEdge: 'tech',
    factionBondBias: { fac_signal: 5, fac_lexicon: 3 },
  },
};

// ── Interaction definitions ──────────────────────────────────────────────────

export const INTERACTIONS = [
  {
    id: 'int_talk',
    label: '[TALK]',
    baseBond: 3,
    creditCost: 0,
    cooldown: 1,
    stat: 'face',
    minTier: null,
    factionBleed: 1,
    moraleDelta: 0,
  },
  {
    id: 'int_compliment',
    label: '[COMPLIMENT]',
    baseBond: 4,
    creditCost: 0,
    cooldown: 2,
    stat: 'face',
    minTier: null,
    factionBleed: 1,
    moraleDelta: 0,
  },
  {
    id: 'int_gift',
    label: '[SEND_GIFT]',
    baseBond: 8,
    creditCost: 250,
    cooldown: 3,
    stat: null,
    minTier: null,
    factionBleed: 2,
    moraleDelta: 0,
  },
  {
    id: 'int_drink',
    label: '[SHARE_DRINK]',
    baseBond: 5,
    creditCost: 50,
    cooldown: 4,
    stat: 'grit',
    minTier: null,
    factionBleed: 1,
    moraleDelta: 3,
  },
  {
    id: 'int_confide',
    label: '[CONFIDE]',
    baseBond: 6,
    creditCost: 0,
    cooldown: 6,
    stat: 'face',
    minTier: 'TRUSTED',
    factionBleed: 1,
    moraleDelta: 2,
  },
];

export function getInteraction(id) {
  return INTERACTIONS.find((ix) => ix.id === id) ?? null;
}

// ── Bond perks (descriptive; derived, NOT stored) ────────────────────────────

export function getBondPerks(tierRank) {
  if (typeof tierRank !== 'number' || tierRank < 0) return [];
  const perks = [];
  if (tierRank >= 1) perks.push({ tag: '[RAPPORT]', desc: '+5% combat XP share while in party' });
  if (tierRank >= 2) perks.push({ tag: '[SYNC]',    desc: 'class passive active in combat' });
  if (tierRank >= 3) perks.push({ tag: '[LOYAL]',   desc: 'never leaves; -15% recharge cost; reduced morale loss' });
  if (tierRank >= 4) perks.push({ tag: '[BONDED]',  desc: 'signature: +15% faction rep gains via this contact' });
  return perks;
}

// ── Fixer tier helpers (compressed scale — fixerRep grows +1/contract) ──────

export const FIXER_BOND_THRESHOLDS = {
  STRANGER: 0, ACQUAINTANCE: 2, TRUSTED: 5, LOYAL: 9, BONDED: 14,
};

export function fixerTierFromRep(rep) {
  const r = rep ?? 0;
  if (r >= 14) return 'BONDED';
  if (r >= 9)  return 'LOYAL';
  if (r >= 5)  return 'TRUSTED';
  if (r >= 2)  return 'ACQUAINTANCE';
  return 'STRANGER';
}

// ── Pure resolver ────────────────────────────────────────────────────────────
// ctx = { interactionId, entityBond, entityFaction, entityLastTurn,
//         playerFace, playerGrit, playerCredits, path, turnNumber,
//         recentSameInteractions, giftCategory, rng? }

export function resolveInteraction(ctx) {
  const ix = getInteraction(ctx.interactionId);
  if (!ix) return { ok: false, reason: 'unknown' };

  // Cooldown gate
  if (ctx.turnNumber - ctx.entityLastTurn < ix.cooldown) {
    return { ok: false, reason: 'cooldown' };
  }

  // Tier gate
  if (ix.minTier) {
    const curRank = BOND_TIER_RANK[bondTierFromValue(ctx.entityBond)] ?? 0;
    const reqRank = BOND_TIER_RANK[ix.minTier] ?? 0;
    if (curRank < reqRank) return { ok: false, reason: 'locked' };
  }

  // Affordability
  if (ctx.playerCredits < ix.creditCost) {
    return { ok: false, reason: 'credits' };
  }

  const rng = ctx.rng || Math.random;
  const pathMod = PATH_RELATIONSHIP_MODIFIERS[ctx.path] || {};
  const interactBonus = pathMod.interactBonus ?? 0;

  let success = true;
  if (ix.stat) {
    const playerStat = ix.stat === 'face' ? (ctx.playerFace ?? 10) : (ctx.playerGrit ?? 10);
    const roll = playerStat + interactBonus + Math.floor(rng() * 6);
    success = roll >= 12;
  }

  // Magnitude
  let mult = success ? 1 : 0.4;
  let intensity = 'success';
  let moraleDelta = ix.moraleDelta ?? 0;

  // Compliment diminishing returns
  if (ix.id === 'int_compliment') {
    const rec = ctx.recentSameInteractions ?? 0;
    mult *= Math.max(0.25, 1 - 0.25 * rec);
    if (rec >= 3) {
      intensity = 'insincere';
      moraleDelta = -1;
    }
  }

  // Gift taste match
  if (ix.id === 'int_gift' && ctx.entityFaction) {
    const taste = FACTION_GIFT_TASTE[ctx.entityFaction];
    mult *= (ctx.giftCategory === taste ? 1.5 : 0.75);
  }

  if (!ix.stat) intensity = 'success';
  else if (!success) intensity = 'partial';
  // intensity already set to 'insincere' above when applicable

  const bondDelta = Math.round(ix.baseBond * mult);
  const newBond = clamp(ctx.entityBond + bondDelta, BOND_MIN, BOND_MAX);
  const tierBefore = bondTierFromValue(ctx.entityBond);
  const tierAfter = bondTierFromValue(newBond);

  const factionBleed = ctx.entityFaction
    ? Math.max(0, Math.round((ix.factionBleed ?? 0) * mult))
    : 0;

  return {
    ok: true,
    reason: null,
    bondDelta,
    newBond,
    tierBefore,
    tierAfter,
    factionId: ctx.entityFaction || null,
    factionBleed,
    moraleDelta,
    creditDelta: -ix.creditCost,
    success,
    intensity,
  };
}
