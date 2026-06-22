export const ORIGIN_MODIFIERS = {
  corpo:      { credits: 800 },
  street_kid: { credits: 200 },
  nomad:      { credits: 400 },
};

export const BASE_STATS = {
  chrome: 10,
  edge: 10,
  ghost: 10,
  face: 10,
  grit: 10,
  wire: 10,
};

// Returns the 6 derived stats for a given origin path.
export function deriveStats(path) {
  const mods = ORIGIN_MODIFIERS[path] || {};
  return {
    chrome: BASE_STATS.chrome + (mods.chrome || 0),
    edge:   BASE_STATS.edge   + (mods.edge   || 0),
    ghost:  BASE_STATS.ghost  + (mods.ghost  || 0),
    face:   BASE_STATS.face   + (mods.face   || 0),
    grit:   BASE_STATS.grit   + (mods.grit   || 0),
    wire:   BASE_STATS.wire   + (mods.wire   || 0),
  };
}

// tappable tooltip descriptions for the FinalizeScreen stats grid
export const STAT_DESCRIPTIONS = {
  chrome: 'Physical augments / melee capability. Determines success in brute-force encounters and combat damage scaling.',
  edge:   'Reflexes / street instincts. Used in combat initiative, underworld deals, and split-second judgment checks.',
  ghost:  'Stealth / infiltration. Determines success in silent movement, bypassing detection, and covert operations.',
  face:   'Charisma / persuasion. Used in social checks: bluffing, negotiating, commanding authority.',
  grit:   'Endurance / toughness. Determines physical resilience, survival checks, and withstanding harsh conditions.',
  wire:   'Netrunning / tech aptitude. Used in hacking, decryption, drone-jacking, and all deck-based checks.',
};

export const ORIGINS = [
  {
    id: 'corpo',
    label: 'CORPO',
    badge: 'DATA_ENCLAVE',
    desc: 'High-tier privilege access. Initialization at Corporate Plaza. No innate stat bias.',
    color: '#00f3ff',
    onColor: '#00373a',
    icon: 'business',
    bonusLine: 'BASE_STATS_10  +800 CR',
    lockedBy: 'acc_corpo_run',
  },
  {
    id: 'street_kid',
    label: 'STREET_KID',
    badge: 'HUB_CONNECTED',
    desc: 'Grid-native status. Initialization at Saltgate Market. No innate stat bias.',
    color: '#fe00fe',
    onColor: '#380038',
    icon: 'person',
    bonusLine: 'BASE_STATS_10  +200 CR',
  },
  {
    id: 'nomad',
    label: 'NOMAD',
    badge: 'SIGNAL_VOID',
    desc: 'Off-grid survivalist. Initialization at Periphery Wasteland. No innate stat bias.',
    color: '#2ae500',
    onColor: '#053900',
    icon: 'terrain',
    bonusLine: 'BASE_STATS_10  +400 CR',
  },
];

export const OPENING_NARRATION = {
  street_kid: 'LOG: You step out of the Saltgate market underpass. Rain. Neon. The smell of synth-noodles and ozone. The grid hums around you.',
  corpo: "LOG: Corporate plaza spits you out into the rain. Your old credentials are dust. The city doesn't remember you.",
  nomad: 'LOG: The badlands shrink behind you as the city swallows the horizon. Your truck is two days gone. You only brought what fit on your back.',
};
