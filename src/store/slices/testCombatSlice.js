import { TEST_FRIENDLY_UNITS, TEST_HOSTILE_UNITS, TEST_BATTLE_CONFIG } from '../../data/testBattle';
import { CYBER_ABILITIES } from '../../data/cyberAbilities';
import { applyXPToCharacter, distributeCombatXP } from '../../data/leveling';

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

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
    pendingAbility: null,
    pendingAttacks: [],   // queued attacks for both dice and abilities
    abilityHistory: [],
    squadBuffs: [],
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
      state.combat.pendingAttacks = [];
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

      // Queue dice attack — dice are FREE (cyberCost: 0)
      state.combat.pendingAttacks.push({
        id: `dice_${selectedFriendlyId}_${uid()}`,
        source: 'dice',
        sourceId: selectedFriendlyId,
        targetIds: [enemyId],
        damage: die.value,
        effectType: 'damage',
        cyberCost: 0,
      });
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
      state.combat.pendingAttacks = state.combat.pendingAttacks.filter(
        (a) => !(a.source === 'dice' && a.sourceId === friendlyId),
      );
    }),

  // ── Cyber Ability Actions ────────────────────────────────────────────────

  selectAbility: (classId) =>
    set((state) => {
      const ability = CYBER_ABILITIES[classId];
      if (!ability) return;
      const activeTurn = state.combat.phase === 'roll' || state.combat.phase === 'targeting';
      if (!activeTurn) return;

      // Available cyber = total pool minus already queued ability costs
      const reservedCyber = state.combat.pendingAttacks
        .filter((a) => a.source === 'ability')
        .reduce((s, a) => s + a.cyberCost, 0);
      if (state.combat.cyberPool - reservedCyber < ability.cyberCost) return;

      // Toggle off if already pending
      if (state.combat.pendingAbility?.classId === classId) {
        state.combat.pendingAbility = null;
        return;
      }
      state.combat.pendingAbility = { classId };
      state.combat.selectedFriendlyId = null;
    }),

  clearAbility: () =>
    set((state) => {
      state.combat.pendingAbility = null;
    }),

  // Queue the pending ability (replaces old executeAbility / immediate fire)
  queueAbility: (targetId) =>
    set((state) => {
      if (!state.combat.pendingAbility) return;
      const { classId } = state.combat.pendingAbility;
      const ability = CYBER_ABILITIES[classId];
      if (!ability) return;

      const reservedCyber = state.combat.pendingAttacks
        .filter((a) => a.source === 'ability')
        .reduce((s, a) => s + a.cyberCost, 0);
      if (state.combat.cyberPool - reservedCyber < ability.cyberCost) return;

      const { type } = ability.effect;
      let targetIds = [];
      let effectType = 'damage';

      if (type === 'single_target_damage') {
        if (!targetId) return;
        targetIds = [targetId];
        effectType = 'damage';
      } else if (type === 'aoe_damage') {
        targetIds = state.combat.hostile.filter((e) => e.hp.current > 0).map((e) => e.id);
        effectType = 'damage';
      } else if (type === 'squad_heal') {
        targetIds = state.combat.friendly.filter((u) => u.hp.current > 0).map((u) => u.id);
        effectType = 'heal';
      } else if (type === 'squad_buff') {
        targetIds = [];
        effectType = 'buff';
      }

      state.combat.pendingAttacks.push({
        id: `ability_${classId}_${uid()}`,
        source: 'ability',
        sourceId: classId,
        targetIds,
        damage: ability.effect.damage ?? 0,
        healAmount: ability.effect.amount ?? 0,
        buffType: ability.effect.buffType ?? null,
        buffValue: ability.effect.value ?? 0,
        buffDuration: ability.effect.duration ?? 0,
        effectType,
        cyberCost: ability.cyberCost,
      });

      state.combat.pendingAbility = null;
    }),

  cancelQueuedAbility: (classId) =>
    set((state) => {
      state.combat.pendingAttacks = state.combat.pendingAttacks.filter(
        (a) => !(a.source === 'ability' && a.sourceId === classId),
      );
    }),

  // Commit everything: deduct all ability cyber, transition to executing
  confirmAllAttacks: () =>
    set((state) => {
      const activeTurn = state.combat.phase === 'roll' || state.combat.phase === 'targeting';
      if (!activeTurn) return;
      if (state.combat.pendingAttacks.length === 0) return;

      const totalCyber = state.combat.pendingAttacks.reduce((s, a) => s + a.cyberCost, 0);
      if (state.combat.cyberPool < totalCyber) return;

      state.combat.cyberPool -= totalCyber;
      state.combat.phase = 'executing';
      state.combat.selectedFriendlyId = null;
      state.combat.pendingAbility = null;
    }),

  // Apply one entry from the queue by id
  applyPendingAttack: (attackId) =>
    set((state) => {
      const attack = state.combat.pendingAttacks.find((a) => a.id === attackId);
      if (!attack) return;

      if (attack.source === 'dice') {
        const targetId = attack.targetIds[0];
        const target = state.combat.hostile.find((u) => u.id === targetId);
        if (target && target.hp.current > 0) {
          const hit = Math.min(attack.damage, target.hp.current);
          target.hp.current -= hit;
          state.combat.damageDealt += hit;
          if (hit > 0) state.combat.attacksLanded += 1;
        }
      } else if (attack.source === 'ability') {
        if (attack.effectType === 'damage') {
          for (const targetId of attack.targetIds) {
            const target = state.combat.hostile.find((u) => u.id === targetId);
            if (target && target.hp.current > 0) {
              const dmg = Math.min(attack.damage, target.hp.current);
              target.hp.current -= dmg;
              state.combat.damageDealt += dmg;
            }
          }
        } else if (attack.effectType === 'heal') {
          for (const targetId of attack.targetIds) {
            const target = state.combat.friendly.find((u) => u.id === targetId);
            if (target && target.hp.current > 0) {
              target.hp.current = Math.min(target.hp.max, target.hp.current + attack.healAmount);
            }
          }
        } else if (attack.effectType === 'buff') {
          state.combat.squadBuffs = state.combat.squadBuffs.filter(
            (b) => b.sourceClassId !== attack.sourceId,
          );
          state.combat.squadBuffs.push({
            type: attack.buffType,
            value: attack.buffValue,
            duration: attack.buffDuration,
            sourceClassId: attack.sourceId,
          });
        }

        state.combat.abilityHistory.push({
          round: state.combat.round,
          classId: attack.sourceId,
          targetIds: attack.targetIds,
          timestamp: Date.now(),
        });
      }

      // Victory check after every applied attack
      if (state.combat.hostile.every((u) => u.hp.current === 0)) {
        state.combat.outcome = 'victory';
        state.combat.phase = 'victory';
      }
    }),

  clearPendingQueue: () =>
    set((state) => {
      state.combat.pendingAttacks = [];
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

      // Tick squad buffs
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
      state.combat.pendingAttacks = [];
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
      // Award XP before resetting outcome
      if (state.combat.outcome === 'victory') {
        const totalXP  = 100;
        const playerXP = Math.floor(totalXP / 2);
        const crewXP   = totalXP - playerXP;
        applyXPToCharacter(state, playerXP);
        distributeCombatXP(state, crewXP);
      }

      state.combat.active = false;
      state.combat.outcome = null;
      state.combat.phase = 'roll';
      state.combat.rolling = false;
      state.combat.pendingAbility = null;
      state.combat.pendingAttacks = [];
    }),
});
