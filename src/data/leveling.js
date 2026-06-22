export const MAX_LEVEL = 10;

// Total XP required to BE at level N (index = level - 1).
// Pacing follows contract volume: low jobs cover early levels, mid jobs unlock
// late-game access, and high jobs carry the final climb to max level.
export const XP_THRESHOLDS = [
  0,      // Level 1 — starting, no XP needed
  300,    // Level 2
  800,    // Level 3
  1600,   // Level 4 — requires a deep low-tier run
  2000,   // Level 5 — first mid-tier jobs unlock the full mid board
  2900,   // Level 6
  3800,   // Level 7
  4700,   // Level 8
  5400,   // Level 9 — mid-tier completion unlocks high-tier work
  7000,   // Level 10 — first high-tier success opens apex contracts
];

export function getLevelFromXP(xp) {
  for (let lvl = MAX_LEVEL; lvl >= 1; lvl--) {
    if (xp >= XP_THRESHOLDS[lvl - 1]) return lvl;
  }
  return 1;
}

export function getLevelProgress(xp) {
  const level = getLevelFromXP(xp);
  if (level >= MAX_LEVEL) {
    return { current: 0, needed: 0, percent: 100, maxed: true };
  }
  const currentFloor = XP_THRESHOLDS[level - 1];
  const nextFloor    = XP_THRESHOLDS[level];
  const xpInLevel    = xp - currentFloor;
  const xpNeeded     = nextFloor - currentFloor;
  return {
    current: xpInLevel,
    needed:  xpNeeded,
    percent: Math.min(100, (xpInLevel / xpNeeded) * 100),
    maxed:   false,
  };
}

export function calculateTeamLevel(members) {
  const alive = members.filter((m) => (m.vitals?.current ?? 1) > 0);
  if (alive.length === 0) return 1;
  return Math.floor(alive.reduce((s, m) => s + (m.level || 1), 0) / alive.length);
}

// ── Draft-mutating helpers (call inside Zustand immer set()) ─────────────────

const PLAYER_STAT_KEYS = ['chrome', 'edge', 'ghost', 'face', 'grit', 'wire'];

// Vitality (max HP) growth. Flat base + grit-scaled bonus, so tougher (high-grit)
// operatives gain more HP per level. Also drives the player's grit-derived starting
// HP (VITALITY_BASE + grit * VITALITY_PER_GRIT_BASE).
export const VITALITY_BASE = 85;            // floor of starting max HP
export const VITALITY_PER_GRIT_BASE = 4;    // starting HP per point of grit
export const VITALITY_PER_LEVEL_BASE = 4;   // flat max HP gained per level
export const VITALITY_PER_GRIT_LEVEL = 0.5; // extra max HP per level per point of grit

export function vitalityGainPerLevel(grit) {
  return VITALITY_PER_LEVEL_BASE + Math.round((grit || 0) * VITALITY_PER_GRIT_LEVEL);
}

export function applyXPToCharacter(state, amount) {
  if (amount <= 0) return;
  const maxXP = XP_THRESHOLDS[MAX_LEVEL - 1];
  const oldExp   = state.character.exp;
  const oldLevel = state.character.level || 1;
  if (oldExp >= maxXP) return; // already maxed

  state.character.exp = Math.min(oldExp + amount, maxXP);
  const newLevel = getLevelFromXP(state.character.exp);
  state.character.level = newLevel;

  if (newLevel > oldLevel) {
    // Stat bump: +1 to a random stat per level gained
    for (let i = 0; i < newLevel - oldLevel; i++) {
      const k = PLAYER_STAT_KEYS[Math.floor(Math.random() * PLAYER_STAT_KEYS.length)];
      state.character.stats[k] = Math.min(20, (state.character.stats[k] || 0) + 1);
    }

    // Log entry
    const name = state.character.name || 'OPERATIVE';
    state.log.entries.push({
      id: `levelup_player_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      turn: state.character.turnNumber || 0,
      text: `LEVEL_UP: ${name} reached Lvl_${String(newLevel).padStart(2, '0')}. Neural calibration updated. Stats refined.`,
      timestamp: new Date().toISOString(),
      type: 'system',
    });

    // Banner (first level-up per tick wins)
    if (!state.world.pendingLevelUp) {
      state.world.pendingLevelUp = { target: 'player', memberName: name, from: oldLevel, to: newLevel };
    }
  }
}

export function applyXPToCrewMember(state, member, amount) {
  if (amount <= 0) return;
  const maxXP = XP_THRESHOLDS[MAX_LEVEL - 1];
  const oldExp   = member.exp || 0;
  const oldLevel = member.level || 1;
  if (oldExp >= maxXP) return;

  member.exp = Math.min(oldExp + amount, maxXP);
  const newLevel = getLevelFromXP(member.exp);
  member.level = newLevel;

  if (newLevel > oldLevel) {
    if (member.isPlayer) {
      syncRenown(state);
      state.world.flags.add('flag_recent_level_up');
    }
    // Stat bump
    const statKeys = Object.keys(member.stats || {});
    if (statKeys.length) {
      for (let i = 0; i < newLevel - oldLevel; i++) {
        const k = statKeys[Math.floor(Math.random() * statKeys.length)];
        member.stats[k] = Math.min(20, (member.stats[k] || 0) + 1);
      }
    }

    // Vitality growth: flat + grit-scaled per level gained; heal by the gain too.
    const grit = member.stats?.grit ?? 0;
    const hpGain = vitalityGainPerLevel(grit) * (newLevel - oldLevel);
    if (member.vitals) {
      member.vitals.max += hpGain;
      member.vitals.current = Math.min(member.vitals.max, member.vitals.current + hpGain);
    }

    state.log.entries.push({
      id: `levelup_crew_${member.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      turn: state.character.turnNumber || 0,
      text: `LEVEL_UP: ${member.name} reached Lvl_${String(newLevel).padStart(2, '0')}. +${hpGain} MAX_VITALITY. Combat protocols enhanced.`,
      timestamp: new Date().toISOString(),
      type: 'system',
    });

    if (!state.world.pendingLevelUp) {
      state.world.pendingLevelUp = { target: 'crew', memberName: member.name, from: oldLevel, to: newLevel };
    }
  }
}

// Splits totalXP equally among alive crew members (player is a crew member too).
export function distributeCombatXP(state, totalXP) {
  if (totalXP <= 0) return;
  const alive = state.crew.members.filter((m) => (m.vitals?.current ?? 1) > 0);
  if (alive.length === 0) return;
  const xpPer = Math.floor(totalXP / alive.length);
  if (xpPer > 0) alive.forEach((m) => applyXPToCrewMember(state, m, xpPer));
}

const RENOWN_LABELS = [
  'GHOST',       // Renown 0 (Level 1)
  'RUNNER',      // Renown 1 (Level 2)
  'OPERATIVE',   // Renown 2 (Level 3)
  'SPECIALIST',  // Renown 3 (Level 4)
  'EXALTED_I',   // Renown 4 (Level 5)
  'EXALTED_II',  // Renown 5 (Level 6)
  'LEGEND_I',    // Renown 6 (Level 7)
  'LEGEND_II',   // Renown 7 (Level 8)
  'LEGEND_III',  // Renown 8 (Level 9)
  'APEX_RUNNER'  // Renown 9 (Level 10)
];

export function getRenownLabel(renown) {
  return RENOWN_LABELS[Math.min(RENOWN_LABELS.length - 1, Math.max(0, renown))] || 'GHOST';
}

export function syncRenown(state) {
  if (!state.crew || !state.crew.members) return;
  const player = state.crew.members.find((m) => m.isPlayer);
  if (!player) return;

  const level = player.level || 1;
  const renownValue = Math.max(0, level - 1);
  state.character.renown = renownValue;
  state.character.renownLabel = getRenownLabel(renownValue);
}
