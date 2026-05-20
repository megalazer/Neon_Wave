import { TEST_FRIENDLY_UNITS, TEST_HOSTILE_UNITS, TEST_BATTLE_CONFIG } from '../../data/testBattle';
import { CYBER_ABILITIES } from '../../data/cyberAbilities';

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
    spent: false,
    assignedTo: null,
  }));
}

export const createTestCombatSlice = (set, get) => ({
  combat: {
    active: false,
    phase: 'roll',
    friendly: [],
    hostile: [],
    dice: [],
    rerollsRemaining: 2,
    rolling: false,
    selectedFriendlyId: null,
    cyberPool: TEST_BATTLE_CONFIG.startingCyberPool,
    maxCyberPool: TEST_BATTLE_CONFIG.maxCyberPool,
    pendingAbility: null,       // { classId } while player is picking a target
    abilityHistory: [],         // [ { round, classId, targetId, timestamp } ]
    squadBuffs: [],             // [ { type, value, duration, sourceClassId } ]
    enemyAssignments: [],
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
      state.combat.selectedFriendlyId = null;
      state.combat.cyberPool = TEST_BATTLE_CONFIG.startingCyberPool;
      state.combat.maxCyberPool = TEST_BATTLE_CONFIG.maxCyberPool;
      state.combat.pendingAbility = null;
      state.combat.abilityHistory = [];
      state.combat.squadBuffs = [];
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
      state.combat.selectedFriendlyId = null;
    }),

  rerollDice: () =>
    set((state) => {
      if (state.combat.phase !== 'targeting') return;
      if (state.combat.rerollsRemaining <= 0) return;
      state.combat.dice.forEach((d) => {
        if (d.alive && !d.spent) d.value = rollD10();
      });
      state.combat.rerollsRemaining -= 1;
      state.combat.rolling = true;
      state.combat.selectedFriendlyId = null;
    }),

  finishRolling: () =>
    set((state) => {
      state.combat.rolling = false;
      if (state.combat.phase === 'roll') {
        state.combat.phase = 'targeting';
      }
    }),

  selectFriendly: (friendlyId) =>
    set((state) => {
      if (state.combat.phase !== 'targeting') return;
      const die = state.combat.dice.find((d) => d.ownerId === friendlyId);
      if (!die?.alive || die.spent) return;
      state.combat.selectedFriendlyId =
        state.combat.selectedFriendlyId === friendlyId ? null : friendlyId;
    }),

  assignAttack: (enemyId) =>
    set((state) => {
      if (state.combat.phase !== 'targeting') return;
      const { selectedFriendlyId } = state.combat;
      if (!selectedFriendlyId) return;
      const die = state.combat.dice.find((d) => d.ownerId === selectedFriendlyId);
      if (!die?.alive || die.spent) return;
      die.spent = true;
      die.assignedTo = enemyId;
      state.combat.selectedFriendlyId = null;
    }),

  clearAttack: (friendlyId) =>
    set((state) => {
      if (state.combat.phase !== 'targeting') return;
      const die = state.combat.dice.find((d) => d.ownerId === friendlyId);
      if (!die) return;
      die.spent = false;
      die.assignedTo = null;
      if (state.combat.selectedFriendlyId === friendlyId) {
        state.combat.selectedFriendlyId = null;
      }
    }),

  lockInAttacks: () =>
    set((state) => {
      if (state.combat.phase !== 'targeting') return;
      const assigned = state.combat.dice.filter((d) => d.alive && d.spent);
      if (assigned.length === 0) return;
      if (state.combat.cyberPool < assigned.length) return;
      state.combat.phase = 'executing';
      state.combat.selectedFriendlyId = null;
      state.combat.pendingAbility = null;
    }),

  applyPlayerHit: (friendlyId) =>
    set((state) => {
      const die = state.combat.dice.find((d) => d.ownerId === friendlyId);
      if (!die?.assignedTo) return;
      const target = state.combat.hostile.find((u) => u.id === die.assignedTo);
      if (!target) return;
      const hit = Math.min(die.value, target.hp.current);
      target.hp.current -= hit;
      state.combat.damageDealt += hit;
      if (hit > 0) state.combat.attacksLanded += 1;
      state.combat.cyberPool = Math.max(0, state.combat.cyberPool - 1);
    }),

  // ── Cyber Ability Actions ────────────────────────────────────────────────

  selectAbility: (classId) =>
    set((state) => {
      const ability = CYBER_ABILITIES[classId];
      if (!ability) return;
      if (state.combat.cyberPool < ability.cyberCost) return;
      const activeTurn = state.combat.phase === 'roll' || state.combat.phase === 'targeting';
      if (!activeTurn) return;
      // Toggle off if already selected
      if (state.combat.pendingAbility?.classId === classId) {
        state.combat.pendingAbility = null;
        return;
      }
      state.combat.pendingAbility = { classId };
      state.combat.selectedFriendlyId = null; // clear die selection while ability pending
    }),

  clearAbility: () =>
    set((state) => {
      state.combat.pendingAbility = null;
    }),

  executeAbility: (targetId) =>
    set((state) => {
      if (!state.combat.pendingAbility) return;
      const { classId } = state.combat.pendingAbility;
      const ability = CYBER_ABILITIES[classId];
      if (!ability) return;
      if (state.combat.cyberPool < ability.cyberCost) return;

      state.combat.cyberPool -= ability.cyberCost;

      const { type } = ability.effect;
      if (type === 'single_target_damage') {
        if (!targetId) return;
        const target = state.combat.hostile.find((e) => e.id === targetId);
        if (target && target.hp.current > 0) {
          const dmg = Math.min(ability.effect.damage, target.hp.current);
          target.hp.current -= dmg;
          state.combat.damageDealt += dmg;
        }
      } else if (type === 'aoe_damage') {
        state.combat.hostile
          .filter((e) => e.hp.current > 0)
          .forEach((e) => {
            const dmg = Math.min(ability.effect.damage, e.hp.current);
            e.hp.current -= dmg;
            state.combat.damageDealt += dmg;
          });
      } else if (type === 'squad_heal') {
        state.combat.friendly
          .filter((u) => u.hp.current > 0)
          .forEach((u) => {
            u.hp.current = Math.min(u.hp.max, u.hp.current + ability.effect.amount);
          });
      } else if (type === 'squad_buff') {
        // Refresh rather than stack
        state.combat.squadBuffs = state.combat.squadBuffs.filter(
          (b) => b.sourceClassId !== classId,
        );
        state.combat.squadBuffs.push({
          type: ability.effect.buffType,
          value: ability.effect.value,
          duration: ability.effect.duration,
          sourceClassId: classId,
        });
      }

      state.combat.abilityHistory.push({
        round: state.combat.round,
        classId,
        targetId: targetId ?? null,
        timestamp: Date.now(),
      });

      state.combat.pendingAbility = null;

      // Abilities can win the battle outright
      if (state.combat.hostile.every((u) => u.hp.current === 0)) {
        state.combat.outcome = 'victory';
        state.combat.phase = 'victory';
      }
    }),

  // ── Enemy Turn ───────────────────────────────────────────────────────────

  beginEnemyTurn: () =>
    set((state) => {
      const liveEnemies  = state.combat.hostile.filter((u) => u.hp.current > 0);
      const liveFriendly = state.combat.friendly.filter((u) => u.hp.current > 0);
      const assignments  = [];
      for (const enemy of liveEnemies) {
        if (!liveFriendly.length) break;
        const target = liveFriendly[Math.floor(Math.random() * liveFriendly.length)];
        const damage = 6 + Math.floor(Math.random() * 8);
        assignments.push({ enemyId: enemy.id, targetId: target.id, damage });
      }
      state.combat.enemyAssignments = assignments;
      state.combat.phase = 'enemy_turn';
      state.combat.pendingAbility = null;
    }),

  applyEnemyHit: (enemyId) =>
    set((state) => {
      const a = state.combat.enemyAssignments.find((x) => x.enemyId === enemyId);
      if (!a) return;
      const target = state.combat.friendly.find((u) => u.id === a.targetId);
      if (!target) return;

      // Apply damage_reduction buff if active
      const reductionBuff = state.combat.squadBuffs.find((b) => b.type === 'damage_reduction');
      const multiplier = reductionBuff ? 1 - reductionBuff.value : 1;
      const finalDamage = Math.max(1, Math.round(a.damage * multiplier));

      target.hp.current = Math.max(0, target.hp.current - finalDamage);
      if (target.hp.current === 0) {
        const die = state.combat.dice.find((d) => d.ownerId === a.targetId);
        if (die) die.alive = false;
      }
    }),

  checkAndSetOutcome: () =>
    set((state) => {
      if (state.combat.hostile.every((u) => u.hp.current === 0)) {
        state.combat.outcome = 'victory';
        state.combat.phase = 'victory';
      }
    }),

  endRound: () =>
    set((state) => {
      if (state.combat.friendly.every((u) => u.hp.current === 0)) {
        state.combat.outcome = 'defeat';
        state.combat.phase = 'defeat';
        return;
      }

      // Tick squad buffs — decrement duration, remove expired
      state.combat.squadBuffs = state.combat.squadBuffs
        .map((b) => ({ ...b, duration: b.duration - 1 }))
        .filter((b) => b.duration > 0);

      state.combat.cyberPool = Math.min(state.combat.maxCyberPool, state.combat.cyberPool + 1);
      state.combat.round += 1;
      state.combat.rerollsRemaining = 2;
      state.combat.phase = 'roll';
      state.combat.rolling = false;
      state.combat.selectedFriendlyId = null;
      state.combat.pendingAbility = null;
      state.combat.enemyAssignments = [];
      state.combat.dice = state.combat.friendly.map((u) => ({
        value: 0,
        ownerId: u.id,
        alive: u.hp.current > 0,
        spent: false,
        assignedTo: null,
      }));
    }),

  exitBattle: () =>
    set((state) => {
      state.combat.active = false;
      state.combat.outcome = null;
      state.combat.phase = 'roll';
      state.combat.rolling = false;
      state.combat.pendingAbility = null;
    }),
});
