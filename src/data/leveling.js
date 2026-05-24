export const MAX_LEVEL = 10;

// Total XP required to BE at level N (index = level - 1)
export const XP_THRESHOLDS = [
  0,     // Level 1 — starting, no XP needed
  100,   // Level 2
  250,   // Level 3
  450,   // Level 4
  700,   // Level 5
  1050,  // Level 6  (+350)
  1500,  // Level 7  (+450)
  2100,  // Level 8  (+600)
  2900,  // Level 9  (+800)
  4000,  // Level 10 (+1100 — steepest climb)
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

export function calculateTeamLevel(playerLevel, crewMembers) {
  const aliveCrew = crewMembers.filter((m) => m.vitals?.current > 0 || m.alive !== false);
  const allLevels = [playerLevel, ...aliveCrew.map((m) => m.level || 1)];
  const sum = allLevels.reduce((s, l) => s + l, 0);
  return Math.floor(sum / allLevels.length);
}

// ── Draft-mutating helpers (call inside Zustand immer set()) ─────────────────

const PLAYER_STAT_KEYS = ['chrome', 'edge', 'ghost', 'face', 'grit', 'wire'];

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
      id: `levelup_player_${Date.now()}`,
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
    // Stat bump
    const statKeys = Object.keys(member.stats || {});
    if (statKeys.length) {
      for (let i = 0; i < newLevel - oldLevel; i++) {
        const k = statKeys[Math.floor(Math.random() * statKeys.length)];
        member.stats[k] = Math.min(20, (member.stats[k] || 0) + 1);
      }
    }

    state.log.entries.push({
      id: `levelup_crew_${member.id}_${Date.now()}`,
      turn: state.character.turnNumber || 0,
      text: `LEVEL_UP: ${member.name} reached Lvl_${String(newLevel).padStart(2, '0')}. Combat protocols enhanced.`,
      timestamp: new Date().toISOString(),
      type: 'system',
    });

    if (!state.world.pendingLevelUp) {
      state.world.pendingLevelUp = { target: 'crew', memberName: member.name, from: oldLevel, to: newLevel };
    }
  }
}

// Splits totalXP among alive crew members; remainder goes to player
export function distributeCombatXP(state, totalXP) {
  if (totalXP <= 0) return;
  const alive = state.crew.members.filter((m) => (m.vitals?.current ?? 1) > 0);
  if (alive.length === 0) {
    applyXPToCharacter(state, totalXP);
    return;
  }
  const xpPer    = Math.floor(totalXP / alive.length);
  const remainder = totalXP - xpPer * alive.length;
  alive.forEach((m) => applyXPToCrewMember(state, m, xpPer));
  if (remainder > 0) applyXPToCharacter(state, remainder);
}
