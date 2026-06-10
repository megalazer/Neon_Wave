import { TEST_HOSTILE_UNITS, TEST_BATTLE_CONFIG } from '../../data/testBattle';
import { ENCOUNTERS } from '../../data/encounters';
import { generateEncounter, buildUnits } from '../../engine/encounterGenerator';
import { planEnemyTurn } from '../../engine/enemyTurn';
import { getContract } from '../../data/contracts/index';
import { CYBER_ABILITIES } from '../../data/cyberAbilities';
import { distributeCombatXP, calculateTeamLevel } from '../../data/leveling';
import { FRIENDLY_LINE_COLORS } from '../../data/combatColors';

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_CYBER_POOL = 10; // TUNABLE — absolute ceiling regardless of neural

// ── Pure helpers ─────────────────────────────────────────────────────────────

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

// Derives the starting cyber pool from living party members' combined neural.
// DIVISOR is the main tuning knob: lower → bigger pool per neural point.
// At DIVISOR 40: a fully-rested 4-member party with ~400 total neural → pool 10.
// At 50% neural (~200 total) → pool 5. At 20% neural (~80 total) → pool 2.
function calculateStartingCyberPool(party) {
  const DIVISOR = 40; // TUNABLE — scale factor from total neural to cyber pool
  const totalNeural = party.reduce((sum, m) => sum + (m.neural?.current ?? 0), 0);
  return Math.max(0, Math.min(MAX_CYBER_POOL, Math.floor(totalNeural / DIVISOR)));
}

// Depletes each living crew member's neural after a battle.
// Called on both victory and defeat — escaping a fight still costs neural.
function depleteNeuralAfterBattle(state) {
  const spentByMember = state.combat.cyberSpentByMember ?? {};
  const BASELINE_PER_MEMBER = 3; // TUNABLE — base neural cost of being jacked in
  const NEURAL_PER_CYBER    = 4; // TUNABLE — 1 cyber spent ≈ N neural drained

  const living = state.crew.members.filter((m) => (m.vitals?.current ?? 1) > 0);
  if (living.length === 0) return;

  const targets = living.filter(m => m.quickhacks && Object.values(m.quickhacks).some(id => id !== null));
  if (targets.length === 0) return;

  let anyDrained = false;
  for (const m of targets) {
    const attributed = (spentByMember[m.id] ?? 0) * NEURAL_PER_CYBER;
    const drain      = BASELINE_PER_MEMBER + attributed;
    const prev       = m.neural.current;
    m.neural.current = Math.max(0, m.neural.current - drain);
    if (m.neural.current < prev) anyDrained = true;
  }

  if (anyDrained) {
    state.log.entries.push({
      id: `neural_drain_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      turn: state.character.turnNumber,
      text: 'NEURAL_DRAIN: Crew reserves depleted. Rest at Haven to recover.',
      timestamp: new Date().toISOString(),
      type: 'narration',
    });
  }
}

// Maps a party level to a contract tier for context-free battles (e.g. the dev/test battle).
function tierFromLevel(level) {
  if (level <= 3) return 'LOW';
  if (level <= 7) return 'MID';
  return 'HIGH';
}

// ── Slice ─────────────────────────────────────────────────────────────────────

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
    cyberSpentByMember: {},   // { [memberId]: totalCyberCost } — reset each fight
    damageTakenThisFight: false, // true if any friendly took damage — used for flawless check
    pendingAbility: null,
    pendingAttacks: [],
    abilityHistory: [],
    squadBuffs: [],
    enemyAssignments: [],
    executingPreviews: {},
    targetLines: {},
    round: 1,
    outcome: null,
    damageDealt: 0,
    attacksLanded: 0,
  },

  startTestBattle: () =>
    set((state) => {
      const friendly = state.crew.members
        .filter((m) => (m.vitals?.current ?? 1) > 0)
        .map((m) => ({ ...m, hp: { current: m.vitals.current, max: m.vitals.max } }));

      const pending = state.contract.pendingCombatResult;
      const partyLevel =
        state.crew.members.find((m) => m.isPlayer)?.level
        ?? calculateTeamLevel(state.crew.members)
        ?? 1;

      let hostile;
      if (pending?.encounterId && ENCOUNTERS[pending.encounterId]) {
        // Explicit/boss encounter — build + scale its template list.
        hostile = buildUnits(ENCOUNTERS[pending.encounterId].enemies, partyLevel);
      } else {
        // Generic fight — derive a faction-appropriate, level-scaled group from the active contract.
        const contract = getContract(state.contract.activeContractId);
        const tier = contract?.tier || tierFromLevel(partyLevel);
        hostile = generateEncounter({ faction: contract?.faction ?? null, tier, partyLevel }).enemies;
      }

      // Roll each block enemy's defensive charge for the opening round (re-rolled each round in endRound).
      for (const e of hostile) {
        e.rampStacks = e.rampStacks ?? 0;
        e.blockCharges = e.block && Math.random() < e.block.chance ? 1 : 0;
      }

      const startingPool = calculateStartingCyberPool(friendly);

      state.combat.active             = true;
      state.combat.phase              = 'roll';
      state.combat.friendly           = friendly;
      state.combat.hostile            = hostile;
      state.combat.dice               = buildDice(friendly);
      state.combat.rerollsRemaining   = 2;
      state.combat.rolling            = false;
      state.combat.selectedFriendlyId = null;
      state.combat.cyberPool             = startingPool;
      state.combat.maxCyberPool          = startingPool;
      state.combat.cyberSpentByMember    = {};
      state.combat.damageTakenThisFight  = false;
      state.combat.pendingAbility     = null;
      state.combat.pendingAttacks     = [];
      state.combat.abilityHistory     = [];
      state.combat.squadBuffs         = [];
      state.combat.enemyAssignments   = [];
      state.combat.executingPreviews  = {};
      state.combat.targetLines        = {};
      state.combat.round              = 1;
      state.combat.outcome            = null;
      state.combat.damageDealt        = 0;
      state.combat.attacksLanded      = 0;

      state.log.entries.push({
        id: `neural_sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text: `NEURAL_SYNC: Cyber capacity ${startingPool}/${MAX_CYBER_POOL} (team neural reserves).`,
        timestamp: new Date().toISOString(),
        type: 'ambient',
      });
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

      const friendlyIndex = state.combat.friendly.findIndex((u) => u.id === selectedFriendlyId);
      state.combat.targetLines[selectedFriendlyId] = {
        targetId: enemyId,
        color: FRIENDLY_LINE_COLORS[friendlyIndex] ?? FRIENDLY_LINE_COLORS[0],
        justFiredAt: Date.now(),
      };

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
      delete state.combat.targetLines[friendlyId];
    }),

  // ── Cyber Ability Actions ────────────────────────────────────────────────

  selectAbility: (classId) =>
    set((state) => {
      const ability = CYBER_ABILITIES[classId];
      if (!ability) return;
      const activeTurn = state.combat.phase === 'roll' || state.combat.phase === 'targeting';
      if (!activeTurn) return;

      const reservedCyber = state.combat.pendingAttacks
        .filter((a) => a.source === 'ability')
        .reduce((s, a) => s + a.cyberCost, 0);
      if (state.combat.cyberPool - reservedCyber < ability.cyberCost) return;

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

  confirmAllAttacks: () =>
    set((state) => {
      const activeTurn = state.combat.phase === 'roll' || state.combat.phase === 'targeting';
      if (!activeTurn) return;
      if (state.combat.pendingAttacks.length === 0) return;

      const totalCyber = state.combat.pendingAttacks.reduce((s, a) => s + a.cyberCost, 0);
      if (state.combat.cyberPool < totalCyber) return;

      // Attribute each ability's cyber cost to the responsible member.
      // Abilities are class-keyed (sourceId = classId); find the highest-neural
      // living member of that class — they "ran" the ability this round.
      for (const attack of state.combat.pendingAttacks) {
        if (attack.cyberCost <= 0) continue;
        let attributedId = null;

        if (attack.source === 'ability') {
          const leads = state.combat.friendly
            .filter((u) => u.class === attack.sourceId && u.hp.current > 0)
            .sort((a, b) => (b.neural?.current ?? 0) - (a.neural?.current ?? 0));
          if (leads.length > 0) attributedId = leads[0].id;
        } else if (attack.source === 'quickhack') {
          // quickhack sourceId is already the member id (highest-WIRE Netrunner)
          attributedId = attack.sourceId;
        }

        if (attributedId) {
          state.combat.cyberSpentByMember[attributedId] =
            (state.combat.cyberSpentByMember[attributedId] ?? 0) + attack.cyberCost;
        }
      }

      // Snapshot HP previews
      const previews = {};
      for (const attack of state.combat.pendingAttacks) {
        if (attack.effectType !== 'damage') continue;
        for (const targetId of attack.targetIds) {
          const target =
            state.combat.hostile.find((u) => u.id === targetId) ||
            state.combat.friendly.find((u) => u.id === targetId);
          if (!target) continue;
          if (!previews[targetId]) {
            previews[targetId] = { totalDamage: 0, hpAtCommit: target.hp.current, maxHp: target.hp.max };
          }
          previews[targetId].totalDamage += attack.damage;
        }
      }

      state.combat.executingPreviews = previews;
      state.combat.targetLines = {};
      state.combat.cyberPool -= totalCyber;
      state.combat.phase = 'executing';
      state.combat.selectedFriendlyId = null;
      state.combat.pendingAbility = null;
    }),

  applyPendingAttack: (attackId) =>
    set((state) => {
      const attack = state.combat.pendingAttacks.find((a) => a.id === attackId);
      if (!attack) return;

      if (attack.source === 'dice') {
        const targetId = attack.targetIds[0];
        const target = state.combat.hostile.find((u) => u.id === targetId);
        if (target && target.hp.current > 0) {
          if (target.blockCharges > 0) {
            target.blockCharges -= 1; // shielded: this hit is negated
          } else {
            const hit = Math.min(attack.damage, target.hp.current);
            target.hp.current -= hit;
            state.combat.damageDealt += hit;
            if (hit > 0) state.combat.attacksLanded += 1;
          }
        }
      } else if (attack.source === 'ability') {
        if (attack.effectType === 'damage') {
          for (const targetId of attack.targetIds) {
            const target = state.combat.hostile.find((u) => u.id === targetId);
            if (target && target.hp.current > 0) {
              if (target.blockCharges > 0) {
                target.blockCharges -= 1;
              } else {
                const dmg = Math.min(attack.damage, target.hp.current);
                target.hp.current -= dmg;
                state.combat.damageDealt += dmg;
              }
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

      if (state.combat.hostile.every((u) => u.hp.current === 0)) {
        state.combat.outcome = 'victory';
        state.combat.phase = 'victory';
      }
    }),

  clearPendingQueue: () =>
    set((state) => {
      state.combat.pendingAttacks = [];
      state.combat.executingPreviews = {};
    }),

  // ── Enemy Turn ───────────────────────────────────────────────────────────

  beginEnemyTurn: () =>
    set((state) => {
      const { assignments, patches } = planEnemyTurn({
        hostile: state.combat.hostile,
        friendly: state.combat.friendly,
        round: state.combat.round,
      });

      // Apply ramp progression reported by the planner.
      for (const enemyId of Object.keys(patches)) {
        const enemy = state.combat.hostile.find((u) => u.id === enemyId);
        if (enemy) enemy.rampStacks = patches[enemyId].rampStacks;
      }

      state.combat.enemyAssignments = assignments;
      state.combat.phase = 'enemy_turn';
      state.combat.pendingAbility = null;

      // Preview = sum of incoming raw damage per friendly (pre-reduction, matches prior UX).
      const previews = {};
      for (const a of assignments) {
        const target = state.combat.friendly.find((u) => u.id === a.targetId);
        if (!target) continue;
        if (!previews[a.targetId]) {
          previews[a.targetId] = { totalDamage: 0, hpAtCommit: target.hp.current, maxHp: target.hp.max };
        }
        previews[a.targetId].totalDamage += a.damage;
      }
      state.combat.executingPreviews = previews;
    }),

  applyEnemyHit: (assignmentId) =>
    set((state) => {
      const a = state.combat.enemyAssignments.find((x) => x.id === assignmentId);
      if (!a) return;
      const target = state.combat.friendly.find((u) => u.id === a.targetId);
      if (!target || target.hp.current <= 0) return; // target may have dropped earlier this enemy turn

      const reductionBuff = state.combat.squadBuffs.find((b) => b.type === 'damage_reduction');
      const multiplier = reductionBuff ? 1 - reductionBuff.value : 1;
      const finalDamage = Math.max(1, Math.round(a.damage * multiplier));

      target.hp.current = Math.max(0, target.hp.current - finalDamage);
      if (finalDamage > 0) state.combat.damageTakenThisFight = true;
      if (target.hp.current === 0) {
        const die = state.combat.dice.find((d) => d.ownerId === a.targetId);
        if (die) die.alive = false;
        if (target.isPlayer) {
          state.world.gameOver = true;
          state.world.gameOverReason = 'FLATLINE';
          state.combat.outcome = 'defeat';
          state.combat.phase = 'defeat';
        }
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

      state.combat.squadBuffs = state.combat.squadBuffs
        .map((b) => ({ ...b, duration: b.duration - 1 }))
        .filter((b) => b.duration > 0);

      // Re-roll defensive shields for surviving block enemies at the top of each round.
      for (const enemy of state.combat.hostile) {
        if (enemy.hp.current > 0 && enemy.block) {
          enemy.blockCharges = Math.random() < enemy.block.chance ? 1 : 0;
        }
      }

      // Regen is capped at maxCyberPool (the neural-derived ceiling for this fight)
      state.combat.cyberPool = Math.min(state.combat.maxCyberPool, state.combat.cyberPool + 1);
      state.combat.round += 1;
      state.combat.rerollsRemaining = 2;
      state.combat.phase = 'roll';
      state.combat.rolling = false;
      state.combat.selectedFriendlyId = null;
      state.combat.pendingAbility = null;
      state.combat.pendingAttacks = [];
      state.combat.enemyAssignments = [];
      state.combat.executingPreviews = {};
      state.combat.targetLines = {};
      state.combat.dice = state.combat.friendly.map((u) => ({
        value: 0,
        ownerId: u.id,
        alive: u.hp.current > 0,
        spent: false,
        assignedTo: null,
      }));
    }),

  exitBattle: () => {
    // Capture pre-set state for achievement checks
    const pre = get().combat;
    const outcome              = pre.outcome;
    const friendly             = pre.friendly;
    const hostile              = pre.hostile;
    const damageTakenThisFight = pre.damageTakenThisFight;

    set((state) => {
      if (state.combat.outcome === 'victory') {
        distributeCombatXP(state, 100);
        for (const fighter of state.combat.friendly) {
          const member = state.crew.members.find((m) => m.id === fighter.id);
          if (member) member.vitals.current = fighter.hp.current;
        }
      }
      state.world.flags.add('flag_recent_combat');

      // Drain neural on both victory and defeat — being in the fight costs reserves
      depleteNeuralAfterBattle(state);

      state.combat.active = false;
      state.combat.outcome = null;
      state.combat.phase = 'roll';
      state.combat.rolling = false;
      state.combat.pendingAbility = null;
      state.combat.pendingAttacks = [];
      state.combat.executingPreviews = {};
      state.combat.targetLines = {};
    });

    // Achievement triggers — run after set so store is settled
    if (outcome === 'victory') {
      get().triggerAchievement?.('run_baptism');

      if (!damageTakenThisFight) {
        get().triggerAchievement?.('run_flawless');
        // Lifetime flawless-win counter feeds acc_untouchable_streak (10 = +2 GHOST)
        get().incrementLifetime?.('flawlessWins');
      }

      // Near-death: any living friendly ended at exactly 1 HP
      if (friendly.some((u) => u.hp.current === 1)) {
        get().triggerAchievement?.('run_near_death');
      }

      // High-tier enemy defeated
      const highTierDown = hostile.some((u) =>
        ['high', 'boss'].includes(u.threat),
      );
      if (highTierDown) get().triggerAchievement?.('acc_boss_down');
    }
  },
});
