// Canonical faction set — language / meaning / signal themed.
// Six factions. Rivalries are sparse and zero-sum (only rivals bleed on positive gains).

export const FACTIONS = {
  fac_lexicon: {
    id: 'fac_lexicon',
    name: 'The Lexicon',
    tag: 'LEXICON',
    domain: 'biotech / data-pharma',
    accent: '#fe00fe',                 // magenta
    icon: 'biotech',
    blurb: 'They believe meaning lives in the body. Gene-scribes and wetware linguists who edit people like sentences.',
    rivals: ['fac_static'],
  },
  fac_grammaton: {
    id: 'fac_grammaton',
    name: 'Grammaton',
    tag: 'GRAMMATON',
    domain: 'corporate security / order',
    accent: '#00f3ff',                 // cyan
    icon: 'security',
    blurb: 'Rules are the only real things. The corporate-security order that enforces the grammar of the city.',
    rivals: ['fac_undertow'],
  },
  fac_signal: {
    id: 'fac_signal',
    name: 'The Signal',
    tag: 'SIGNAL',
    domain: 'infrastructure / networks',
    accent: '#79ff5b',                 // green
    icon: 'cell-tower',
    blurb: 'Owns the pipes. If a packet moved, The Signal saw it. Infrastructure as theology.',
    rivals: [],
  },
  fac_referent: {
    id: 'fac_referent',
    name: 'Referent Capital',
    tag: 'REFERENT',
    domain: 'finance / markets',
    accent: '#ffd700',                 // gold
    icon: 'account-balance',
    blurb: 'Value is whatever they say points to value. The finance bloc that trades in meaning itself.',
    rivals: [],
  },
  fac_undertow: {
    id: 'fac_undertow',
    name: 'Undertow',
    tag: 'UNDERTOW',
    domain: 'underworld / black market',
    accent: '#b388ff',                 // violet
    icon: 'waves',
    blurb: 'The meaning under the meaning. Smugglers, fixers, and the gray economy beneath the Undercity.',
    rivals: ['fac_grammaton'],
  },
  fac_static: {
    id: 'fac_static',
    name: 'Static',
    tag: 'STATIC',
    domain: 'scavengers / anti-signal',
    accent: '#ffb4ab',                 // error red
    icon: 'blur-on',
    blurb: 'Noise as a creed. Scrap-runners and signal-jammers who believe the only honest message is no message.',
    rivals: ['fac_lexicon'],
  },
};

export const FACTION_LIST = Object.values(FACTIONS);
export const FACTION_IDS  = Object.keys(FACTIONS);

// Migration map: old labels (operatives.js, legacy events) → canonical faction ids.
export const LEGACY_FACTION_MAP = {
  medtech:     'fac_lexicon',
  mercenary:   'fac_grammaton',
  voidwalkers: 'fac_signal',
  syndicate:   'fac_undertow',
  undercity:   'fac_undertow',
  scavengers:  'fac_static',
  novalith:    'fac_signal',
  // legacy event-only labels
  helix:       'fac_grammaton',
  onyx:        'fac_undertow',
  sable:       'fac_referent',
};

export function getFaction(id) {
  return FACTIONS[id] || null;
}

export function resolveLegacyFaction(label) {
  if (!label) return label;
  return LEGACY_FACTION_MAP[label] || label; // pass through if already canonical
}

export function areRivals(a, b) {
  return !!(FACTIONS[a]?.rivals.includes(b) || FACTIONS[b]?.rivals.includes(a));
}

// ── Rep tiers ────────────────────────────────────────────────────────────────
// HOSTILE < -50, COLD -50..-1, NEUTRAL 0..24, FRIENDLY 25..74, ALLIED 75..149, EXALTED 150+

export const REP_TIERS = ['HOSTILE', 'COLD', 'NEUTRAL', 'FRIENDLY', 'ALLIED', 'EXALTED'];

// Numeric rank for tier comparisons (gating: playerTier >= requiredTier).
export const REP_TIER_RANK = {
  HOSTILE: 0, COLD: 1, NEUTRAL: 2, FRIENDLY: 3, ALLIED: 4, EXALTED: 5,
};

export function repTierFromValue(value) {
  if (value < -50) return 'HOSTILE';
  if (value < 0)   return 'COLD';
  if (value < 25)  return 'NEUTRAL';
  if (value < 75)  return 'FRIENDLY';
  if (value < 150) return 'ALLIED';
  return 'EXALTED';
}

export function tierMeetsRequirement(currentTier, requiredTier) {
  return (REP_TIER_RANK[currentTier] ?? 0) >= (REP_TIER_RANK[requiredTier] ?? 0);
}

// Rep clamp bounds.
export const REP_MIN = -100;
export const REP_MAX = 300;
