import { TEST_FRIENDLY_UNITS, TEST_HOSTILE_UNITS } from '../../data/testBattle';

function cloneUnits(units) {
  return units.map((u) => ({ ...u, hp: { ...u.hp } }));
}

function rollD10() {
  return Math.floor(Math.random() * 10) + 1;
}

function buildDice(friendly) {
  return friendly.map((u) => ({
    value: 0,
    ownerId: u.id,
    alive: u.hp.current > 0,
    assigned: null,
  }));
}

export const createTestCombatSlice = (set, get) => ({
  combat: {
    active: false,
    phase: 'roll', // 'roll'|'targeting'|'executing'|'enemy_turn'|'victory'|'defeat'
    friendly: [],
    hostile: [],
    dice: [],
    rerollsRemaining: 2,
    rolling: false,
    selectedDieIndex: null,
    playerAssignments: [], // [{ dieIndex, targetId, damage }]
    enemyAssignments: [],  // [{ enemyId, targetId, damage }]
    round: 1,
    outcome: null,
    damageDealt: 0,
    attacksLanded: 0,
  },

  startTestBattle: () =>
    set((state) => {
      const friendly = cloneUnits(TEST_FRIENDLY_UNITS);
      state.combat.active = true;
      state.combat.phase = 'roll';
      state.combat.friendly = friendly;
      state.combat.hostile = cloneUnits(TEST_HOSTILE_UNITS);
      state.combat.dice = buildDice(friendly);
      state.combat.rerollsRemaining = 2;
      state.combat.rolling = false;
      state.combat.selectedDieIndex = null;
      state.combat.playerAssignments = [];
      state.combat.enemyAssignments = [];
      state.combat.round = 1;
      state.combat.outcome = null;
      state.combat.damageDealt = 0;
      state.combat.attacksLanded = 0;
    }),

  rollDice: () =>
    set((state) => {
      if (state.combat.phase !== 'roll') return;
      state.combat.dice.forEach((d) => {
        if (d.alive) d.value = rollD10();
      });
      state.combat.rolling = true;
      state.combat.selectedDieIndex = null;
      state.combat.playerAssignments = [];
    }),

  rerollDice: () =>
    set((state) => {
      if (state.combat.phase !== 'targeting') return;
      if (state.combat.rerollsRemaining <= 0) return;
      state.combat.dice.forEach((d) => {
        if (d.alive && d.assigned === null) d.value = rollD10();
      });
      state.combat.rerollsRemaining -= 1;
      state.combat.rolling = true;
      state.combat.selectedDieIndex = null;
      // Clear assignments for re-rolled dice (assigned dice keep their assignment)
    }),

  finishRolling: () =>
    set((state) => {
      state.combat.rolling = false;
      if (state.combat.phase === 'roll') {
        state.combat.phase = 'targeting';
      }
    }),

  selectDie: (index) =>
    set((state) => {
      if (state.combat.phase !== 'targeting') return;
      const die = state.combat.dice[index];
      if (!die?.alive) return;
      state.combat.selectedDieIndex = state.combat.selectedDieIndex === index ? null : index;
    }),

  assignDie: (dieIndex, enemyId) =>
    set((state) => {
      if (state.combat.phase !== 'targeting') return;
      const die = state.combat.dice[dieIndex];
      if (!die?.alive) return;

      die.assigned = enemyId;
      state.combat.selectedDieIndex = null;

      const existing = state.combat.playerAssignments.findIndex((a) => a.dieIndex === dieIndex);
      const entry = { dieIndex, targetId: enemyId, damage: die.value };
      if (existing >= 0) {
        state.combat.playerAssignments[existing] = entry;
      } else {
        state.combat.playerAssignments.push(entry);
      }
    }),

  clearAssignment: (dieIndex) =>
    set((state) => {
      if (state.combat.phase !== 'targeting') return;
      const die = state.combat.dice[dieIndex];
      if (!die) return;
      die.assigned = null;
      state.combat.playerAssignments = state.combat.playerAssignments.filter(
        (a) => a.dieIndex !== dieIndex,
      );
    }),

  lockInAttacks: () =>
    set((state) => {
      if (state.combat.phase !== 'targeting') return;
      if (state.combat.playerAssignments.length === 0) return;
      state.combat.phase = 'executing';
      state.combat.selectedDieIndex = null;
    }),

  applyPlayerHit: (dieIndex) =>
    set((state) => {
      const a = state.combat.playerAssignments.find((x) => x.dieIndex === dieIndex);
      if (!a) return;
      const target = state.combat.hostile.find((u) => u.id === a.targetId);
      if (!target) return;
      const hit = Math.min(a.damage, target.hp.current);
      target.hp.current -= hit;
      state.combat.damageDealt += hit;
      if (hit > 0) state.combat.attacksLanded += 1;
    }),

  // Pre-compute all enemy retaliations so we can draw lines before animating
  beginEnemyTurn: () =>
    set((state) => {
      const liveEnemies = state.combat.hostile.filter((u) => u.hp.current > 0);
      const liveFriendly = state.combat.friendly.filter((u) => u.hp.current > 0);
      const assignments = [];
      for (const enemy of liveEnemies) {
        if (!liveFriendly.length) break;
        const target = liveFriendly[Math.floor(Math.random() * liveFriendly.length)];
        const damage = 6 + Math.floor(Math.random() * 8); // 6–13
        assignments.push({ enemyId: enemy.id, targetId: target.id, damage });
      }
      state.combat.enemyAssignments = assignments;
      state.combat.phase = 'enemy_turn';
    }),

  applyEnemyHit: (enemyId) =>
    set((state) => {
      const a = state.combat.enemyAssignments.find((x) => x.enemyId === enemyId);
      if (!a) return;
      const target = state.combat.friendly.find((u) => u.id === a.targetId);
      if (!target) return;
      target.hp.current = Math.max(0, target.hp.current - a.damage);
      // Mark die dead if its owner just died
      if (target.hp.current === 0) {
        const die = state.combat.dice.find((d) => d.ownerId === a.targetId);
        if (die) die.alive = false;
      }
    }),

  // Called after all player hits — checks for victory only
  checkAndSetOutcome: () =>
    set((state) => {
      if (state.combat.hostile.every((u) => u.hp.current === 0)) {
        state.combat.outcome = 'victory';
        state.combat.phase = 'victory';
      }
    }),

  // Called after all enemy hits — handles defeat or round transition
  endEnemyTurn: () =>
    set((state) => {
      if (state.combat.friendly.every((u) => u.hp.current === 0)) {
        state.combat.outcome = 'defeat';
        state.combat.phase = 'defeat';
        return;
      }
      state.combat.round += 1;
      state.combat.rerollsRemaining = 2;
      state.combat.phase = 'roll';
      state.combat.rolling = false;
      state.combat.selectedDieIndex = null;
      state.combat.playerAssignments = [];
      state.combat.enemyAssignments = [];
      state.combat.dice = state.combat.friendly.map((u) => ({
        value: 0,
        ownerId: u.id,
        alive: u.hp.current > 0,
        assigned: null,
      }));
    }),

  exitBattle: () =>
    set((state) => {
      state.combat.active = false;
      state.combat.outcome = null;
      state.combat.phase = 'roll';
      state.combat.rolling = false;
    }),
});
