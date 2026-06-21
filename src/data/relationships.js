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
    icon: 'chat-bubble-outline',
    desc: 'Small talk. Low risk, steady.',
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
    icon: 'thumb-up-off-alt',
    desc: 'Flatter them. Loses value if overused.',
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
    icon: 'card-giftcard',
    desc: 'A gift. Costs credits; match their taste.',
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
    icon: 'local-bar',
    desc: 'Share a round. Lifts morale.',
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
    icon: 'lock-open',
    desc: 'Open up. Requires TRUSTED+.',
    baseBond: 6,
    creditCost: 0,
    cooldown: 6,
    stat: 'face',
    minTier: 'TRUSTED',
    factionBleed: 1,
    moraleDelta: 2,
  },
  {
    id: 'int_insult',
    label: '[INSULT]',
    icon: 'sentiment-very-dissatisfied',
    desc: 'A hostile jab. Lands as banter or backfires.',
    baseBond: 0, creditCost: 0, cooldown: 2, stat: 'face', minTier: null,
    factionBleed: 0, moraleDelta: 0,
    successBond: 2, failBond: -6, successMorale: 1, failMorale: -2,
  },
  {
    id: 'int_seduce',
    label: '[SEDUCE]',
    icon: 'favorite-border',
    desc: 'A romantic gambit. High reward, high risk.',
    baseBond: 0, creditCost: 0, cooldown: 5, stat: 'face', minTier: 'ACQUAINTANCE',
    factionBleed: 0, moraleDelta: 0,
    successBond: 10, failBond: -5, successMorale: 3, failMorale: -2,
  },
];

export function getInteraction(id) {
  return INTERACTIONS.find((ix) => ix.id === id) ?? null;
}

// ── Interaction dialogue ──────────────────────────────────────────────────────

export const INTERACTION_DIALOGUE = {
  int_talk: {
    success: ['{name} nods along, easy and open.', '{name} actually laughs at your story.'],
    partial: ['{name} half-listens, eyes on the door.', '{name} grunts. Not in the mood.'],
  },
  int_compliment: {
    success: ['{name} fights down a grin.', '{name} pretends not to care, but stands taller.'],
    partial: ['{name} shrugs it off.', '{name} side-eyes you. Lay it on thinner.'],
    insincere: ["{name} doesn't think that was funny. Heard it too many times.", '{name} rolls their eyes. "Sure."'],
  },
  int_gift: {
    success: ['{name} turns the gift over, genuinely pleased.', '{name} smirks. "You remembered."'],
  },
  int_drink: {
    success: ['{name} clinks your glass. The night gets easier.', '{name} downs it and waves for another round.'],
    partial: ['{name} appreciates the drink but still throws it in your face.', '{name} sips, unimpressed, and changes the subject.'],
  },
  int_confide: {
    success: ['{name} opens up. Something real passes between you.', '{name} trusts you with a piece of the truth.'],
    partial: ['{name} clams up halfway through. Too soon.', '{name} deflects with a joke.'],
  },
  int_insult: {
    success: ['{name} barks a laugh. "Yeah, screw you too." The banter lands.', '{name} grins — they give as good as they get.'],
    rejected: ["{name} doesn't think that was funny.", "{name}'s jaw tightens. That one cut."],
  },
  int_seduce: {
    success: ['{name} holds your gaze a beat too long. Something shifts.', '{name} leans in. "...Go on."'],
    rejected: ['{name} steps back. "Not like that." It gets awkward.', '{name} laughs it off, but the air goes cold.'],
  },
};

const GENERIC_DIALOGUE = {
  success: 'The gesture lands.',
  partial: 'They appreciate the attempt, barely.',
  insincere: "They see right through it. Doesn't land.",
  rejected: 'That backfired.',
};

export function pickDialogue(interactionId, intensity, rng = Math.random) {
  const byId = INTERACTION_DIALOGUE[interactionId];
  const pool = byId && (byId[intensity] || byId.success);
  if (!pool || pool.length === 0) return GENERIC_DIALOGUE[intensity] || GENERIC_DIALOGUE.success;
  return pool[Math.floor(rng() * pool.length)];
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

  let bondDelta;
  if (ix.successBond !== undefined || ix.failBond !== undefined) {
    // Bidirectional (insult / seduce): explicit win/lose outcomes
    if (success) {
      bondDelta = ix.successBond ?? 0;
      moraleDelta = ix.successMorale ?? moraleDelta;
      intensity = 'success';
    } else {
      bondDelta = ix.failBond ?? 0;
      moraleDelta = ix.failMorale ?? moraleDelta;
      intensity = 'rejected';
    }
  } else {
    if (!ix.stat) intensity = 'success';
    else if (!success) intensity = 'partial';
    bondDelta = Math.round(ix.baseBond * mult);
  }
  const newBond = clamp(ctx.entityBond + bondDelta, BOND_MIN, BOND_MAX);
  const tierBefore = bondTierFromValue(ctx.entityBond);
  const tierAfter = bondTierFromValue(newBond);

  const factionBleed = (ctx.entityFaction && bondDelta > 0)
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
