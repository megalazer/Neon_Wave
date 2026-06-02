function _pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const QUICKHACKS = {
  qh_short_circuit: {
    id: 'qh_short_circuit',
    name: 'SHORT_CIRCUIT',
    tier: 'low',          // install slot key: low→slot1, mid→slot2, high→slot3
    vendorTier: 'basic',  // vendor unlock / staple flag
    ramCost: 1,
    icon: 'flash-on',
    description: 'Arcs current through the target. Low-cost reliable damage, scales with WIRE.',
    targetType: 'single_enemy',
    effect: {
      type: 'damage_scaling',
      baseDamage: 9,
      scalingStat: 'wire',
      scalingDivisor: 4,
    },
    moduleCost: 3000,
  },
  qh_weapon_glitch: {
    id: 'qh_weapon_glitch',
    name: 'WEAPON_GLITCH',
    tier: 'low',
    vendorTier: 'basic',
    ramCost: 2,
    icon: 'gavel',
    description: "Corrupts target's targeting firmware. Disrupts their attack for one round.",
    moduleCost: 3500,
  },
  qh_overheat: {
    id: 'qh_overheat',
    name: 'OVERHEAT',
    tier: 'mid',
    vendorTier: 'intermediate',
    ramCost: 3,
    icon: 'bolt',
    description: 'Triggers thermal overload in a single target. Heavy damage, scales with WIRE.',
    moduleCost: 8000,
  },
  qh_contagion: {
    id: 'qh_contagion',
    name: 'CONTAGION',
    tier: 'mid',
    vendorTier: 'intermediate',
    ramCost: 3,
    icon: 'share',
    description: 'Viral payload spreads across the enemy network. Damage-over-time effect.',
    moduleCost: 9000,
  },
  qh_system_collapse: {
    id: 'qh_system_collapse',
    name: 'SYSTEM_COLLAPSE',
    tier: 'high',
    vendorTier: 'elite',
    ramCost: 5,
    icon: 'power-settings-new',
    description: 'Full ICE breach. Disables all enemy cyberware for two rounds.',
    moduleCost: 18000,
  },
  qh_cyberpsychosis: {
    id: 'qh_cyberpsychosis',
    name: 'CYBERPSYCHOSIS',
    tier: 'high',
    vendorTier: 'elite',
    ramCost: 6,
    icon: 'psychology',
    description: "Induces cascade failure in target's neural implants. Turns their augments against them.",
    moduleCost: 20000,
  },
};

// Returns a random quickhack id whose vendorTier matches (for vendor rotation logic).
export function getRandomQuickhackByTier(vendorTier) {
  const pool = Object.values(QUICKHACKS).filter((qh) => qh.vendorTier === vendorTier);
  return pool.length > 0 ? _pickRandom(pool).id : null;
}

// Generates a starting quickhack loadout for a freshly-spawned Netrunner.
// slot1 = low-tier, slot2 = mid-tier, slot3 = high-tier.
// Only slot1 is pre-filled; higher slots open for purchased module installs.
export function generateNetrunnerQuickhacks() {
  const slot1Pool = Object.values(QUICKHACKS).filter((qh) => qh.tier === 'low');
  return {
    slot1: slot1Pool.length > 0 ? _pickRandom(slot1Pool).id : null,
    slot2: null,
    slot3: null,
  };
}
