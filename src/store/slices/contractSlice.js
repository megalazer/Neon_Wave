import { ALL_CONTRACTS, getContract, contractCrewGateMet } from '../../data/contracts/index';
import { applyXPToCrewMember } from '../../data/leveling';
import { applyRepToDraft } from './factionSlice';
import { repTierFromValue, tierMeetsRequirement } from '../../data/factions';
import { CYBERWARE_ITEMS, getEffectiveStat } from '../../data/cyberware';
import { CYBERWARE_REWARD_POOLS, rollCyberwareReward } from '../../data/contractRewards';


const FEED_SIZE = 6;
// Whether the player's rep with a contract's faction meets its minFactionRep gate.
// minFactionRep is a tier label (e.g. 'FRIENDLY'); default '' / 'NEUTRAL' = no gate.
export function contractRepGateMet(state, contract) {
  const req = contract?.minFactionRep;
  if (!req || req === 'NEUTRAL') return true;
  if (!contract.faction) return true;
  const rep = state.faction?.rep?.[contract.faction] ?? 0;
  return tierMeetsRequirement(repTierFromValue(rep), req);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function _playerLevel(state) {
  return state.crew.members.find((m) => m.isPlayer)?.level ?? 1;
}

function _canAccept(state, contract, pLevel, credits) {
  if (!contract) return false;
  if (pLevel < contract.teamLevelRequired) return false;
  if (!contractCrewGateMet(state.crew.members, contract)) return false;
  if (!contractRepGateMet(state, contract)) return false;
  if (contract.deposit > 0 && credits < contract.deposit) return false;
  return true;
}


function _pickFeedContracts(state) {
  const completed  = new Set(state.contract.completedContracts);
  const inFeed     = new Set(state.contract.feedItems.map((i) => i.id));
  const pLevel     = _playerLevel(state);
  const credits    = state.character.credits;

  const eligible = ALL_CONTRACTS.filter(
    (c) => !completed.has(c.id) && !inFeed.has(c.id) && pLevel >= c.teamLevelRequired,
  );

  // Partition: acceptable, locked (rep-gated / unaffordable), neutral
  const neutral    = [];
  const acceptable = [];
  const locked     = [];
  for (const c of eligible) {
    if (_canAccept(state, c, pLevel, credits)) {
      if (c.faction) {
        acceptable.push(c);
      } else {
        neutral.push(c);
      }
    } else {
      locked.push(c);
    }
  }

  const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);
  const shuffledNeutral    = shuffle(neutral);
  const shuffledAcceptable = shuffle(acceptable);
  const shuffledLocked     = shuffle(locked);

  const picks = [];

  // ── Questline continuity priority ──
  // Find questlines the player has started: completed contracts with a questline field.
  const questlineProgress = new Map(); // questline → highest completed stage
  for (const cid of completed) {
    const c = ALL_CONTRACTS.find((x) => x.id === cid);
    if (c?.questline && c.questlineStage != null) {
      const best = questlineProgress.get(c.questline) ?? 0;
      if (c.questlineStage > best) questlineProgress.set(c.questline, c.questlineStage);
    }
  }

  // For each active questline, find eligible contracts at the next stage.
  if (questlineProgress.size > 0) {
    const continuations = [];
    for (const [ql, highestStage] of questlineProgress) {
      const next = eligible.filter(
        (c) => c.questline === ql && c.questlineStage === highestStage + 1,
      );
      continuations.push(...next);
    }
    // Sort by questlineStage ascending, pick up to 2.
    continuations.sort((a, b) => (a.questlineStage ?? 99) - (b.questlineStage ?? 99));
    for (const c of continuations) {
      if (picks.length >= 2) break;
      if (!picks.some((p) => p.id === c.id)) picks.push(c);
    }
  }

  // Always include at least one neutral contract if available — prevents soft-locks
  if (shuffledNeutral.length > 0 && !picks.some((p) => !ALL_CONTRACTS.find((c) => c.id === p.id)?.faction)) {
    picks.push(shuffledNeutral[0]);
  }

  // Tier-diversity pass over faction acceptable
  for (const tier of ['LOW', 'MID', 'HIGH']) {
    if (picks.length >= FEED_SIZE) break;
    const found = shuffledAcceptable.find((c) => c.tier === tier && !picks.some((p) => p.id === c.id));
    if (found) picks.push(found);
  }

  // Backfill with any acceptable (neutral or faction, but preference neutral second)
  for (const c of [...shuffledNeutral, ...shuffledAcceptable]) {
    if (picks.length >= FEED_SIZE) break;
    if (!picks.some((p) => p.id === c.id)) picks.push(c);
  }

  // Backfill with locked teasers so the player sees progression targets
  for (const c of shuffledLocked) {
    if (picks.length >= FEED_SIZE) break;
    if (!picks.some((p) => p.id === c.id)) picks.push(c);
  }

  return picks.map((c) => ({ id: c.id, expiresIn: 10 }));
}

function _feedHasAcceptable(state) {
  const pLevel  = _playerLevel(state);
  const credits = state.character.credits;
  return state.contract.feedItems.some((fi) => {
    const c = getContract(fi.id);
    return _canAccept(state, c, pLevel, credits);
  });
}

function _ensureAcceptableInFeed(state) {
  if (_feedHasAcceptable(state)) return;
  // Merge fresh picks, sort acceptable-first
  const newItems = _pickFeedContracts(state);
  const existing = state.contract.feedItems;
  const toAdd = newItems.filter((n) => !existing.some((e) => e.id === n.id));
  const merged = [...existing, ...toAdd];
  // Sort: acceptable first, locked last
  const pLevel  = _playerLevel(state);
  const credits = state.character.credits;
  merged.sort((a, b) => {
    const aOk = _canAccept(state, getContract(a.id), pLevel, credits) ? 1 : 0;
    const bOk = _canAccept(state, getContract(b.id), pLevel, credits) ? 1 : 0;
    return bOk - aOk;
  });
  state.contract.feedItems = merged.slice(0, FEED_SIZE);
}

// ── Failure consequences by tier ────────────────────────────────────────────────
// HP/neural are fractions of the operative's MAX pool so they scale with level.
// morale is a flat 0–100 delta (already a percentage-like scale).
const STAGE_FAIL_EFFECTS = {
  LOW:  { hpDamagePct: 0.04, morale: -2 },
  MID:  { hpDamagePct: 0.07, neuralDamagePct: 0.10, morale: -5 },
  HIGH: { hpDamagePct: 0.10, neuralDamagePct: 0.15, morale: -8 },
};

const CONTRACT_FAIL_EFFECTS = {
  LOW:  { hpDamagePct: 0.08, morale: -5 },
  MID:  { hpDamagePct: 0.14, neuralDamagePct: 0.15, morale: -10 },
  HIGH: { hpDamagePct: 0.20, neuralDamagePct: 0.25, morale: -15 },
};

// Applies an effects bag to the draft. Returns the absolute amounts actually
// applied ({ hp, neural, morale, credits }) so callers can surface feedback.
// Contracts never kill — death is combat-only — so player HP floors at 1.
function _applyOutcomeEffects(state, effects) {
  const applied = { hp: 0, neural: 0, morale: 0, credits: 0 };
  if (!effects) return applied;
  const player = state.crew.members.find((m) => m.isPlayer);

  if (effects.credits !== undefined) {
    const before = state.character.credits;
    state.character.credits = Math.max(0, state.character.credits + effects.credits);
    applied.credits = state.character.credits - before;
  }

  if (player) {
    const hpLoss =
      (effects.hpDamage ?? 0) +
      (effects.hpDamagePct ? Math.round(player.vitals.max * effects.hpDamagePct) : 0);
    if (hpLoss > 0) {
      const before = player.vitals.current;
      player.vitals.current = Math.max(1, player.vitals.current - hpLoss);
      applied.hp = before - player.vitals.current;
    }
    const neuralLoss =
      (effects.neuralDamage ?? 0) +
      (effects.neuralDamagePct ? Math.round(player.neural.max * effects.neuralDamagePct) : 0);
    if (neuralLoss > 0) {
      const before = player.neural.current;
      player.neural.current = Math.max(0, player.neural.current - neuralLoss);
      applied.neural = before - player.neural.current;
    }
  }

  if (effects.morale !== undefined) {
    const before = state.character.morale;
    state.character.morale = Math.max(0, Math.min(100, state.character.morale + effects.morale));
    applied.morale = state.character.morale - before;
  }
  if (effects.rewardModifier !== undefined) {
    state.contract.activeContractModifiers += effects.rewardModifier;
  }
  if (effects.fixerRep !== undefined) {
    const contract = getContract(state.contract.activeContractId);
    if (contract?.fixerId) {
      state.contract.fixerRep[contract.fixerId] =
        (state.contract.fixerRep[contract.fixerId] ?? 0) + effects.fixerRep;
    }
  }
  if (effects.addFlags) {
    for (const flag of effects.addFlags) state.world.flags.add(flag);
  }
  return applied;
}

// Builds a terse "−8 HP · −3 NEU · −5 MORALE" string from applied amounts, or '' if none.
function _consequenceText(applied) {
  if (!applied) return '';
  const parts = [];
  if (applied.hp)     parts.push(`-${applied.hp} HP`);
  if (applied.neural) parts.push(`-${applied.neural} NEU`);
  if (applied.morale) parts.push(`${applied.morale} MORALE`);
  return parts.join(' · ');
}

// Pushes a SUSTAINED log entry for the damage taken on a failed stage/combat.
function _logConsequences(state, applied, idPrefix) {
  const summary = _consequenceText(applied);
  if (!summary) return;
  state.log.entries.push({
    id: `${idPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    turn: state.character.turnNumber,
    text: `SUSTAINED: ${summary}.`,
    timestamp: new Date().toISOString(),
    type: 'narration',
  });
}

function _setResolution(state, contract, outcome) {
  let modifier  = state.contract.activeContractModifiers ?? 0;

  // Vehicle logistics bonus: +5% payout per vehicle, cap +25%
  const vehicles = state.character.vehicles ?? [];
  const vehicleBonus = vehicles.length > 0 ? Math.min(vehicles.length * 0.05, 0.25) : 0;
  if (vehicleBonus > 0) modifier += vehicleBonus;

  const basePayout =
    outcome === 'success' ? contract.payout :
    outcome === 'failure' ? Math.floor(contract.payout / 4) : 0;
  const creditsEarned =
    outcome === 'success' ? Math.round(basePayout * (1 + modifier)) : basePayout;

  // Apply contract-outcome consequences. A blown job wrecks you (HP/neural/morale);
  // a voluntary abort only stings morale — you pull out before taking real damage.
  let consequences = null;
  if (outcome === 'failure') {
    const failFx = CONTRACT_FAIL_EFFECTS[contract.tier] || CONTRACT_FAIL_EFFECTS.LOW;
    consequences = _applyOutcomeEffects(state, failFx);
  } else if (outcome === 'aborted') {
    const failFx = CONTRACT_FAIL_EFFECTS[contract.tier] || CONTRACT_FAIL_EFFECTS.LOW;
    consequences = _applyOutcomeEffects(state, { morale: failFx.morale });
  }

  state.contract.resolution = {
    outcome,
    creditsEarned,
    expEarned: outcome === 'success' ? contract.exp : 0,
    narration:
      outcome === 'success'
        ? contract.successNarration
        : outcome === 'failure'
        ? contract.failureNarration
        : contract.abortNarration || 'Contract terminated.',
    modifierApplied: outcome === 'success' && modifier !== 0 ? modifier : null,
    baseCredits:     outcome === 'success' && modifier !== 0 ? basePayout : null,
    vehicleBonusApplied: outcome === 'success' && vehicleBonus > 0 ? vehicleBonus : null,
    consequences: consequences && (consequences.hp || consequences.neural || consequences.morale)
      ? consequences : null,
  };
  state.contract.phase = 'resolving';
}

function _advanceOrResolve(state, contract, nextStageIndex) {
  if (nextStageIndex >= contract.stages.length) {
    const passes   = state.contract.stageResults.filter((r) => r.passed).length;
    const threshold = Math.ceil(contract.stages.length / 2);
    _setResolution(state, contract, passes >= threshold ? 'success' : 'failure');
  } else {
    state.contract.activeStageIndex = nextStageIndex;
  }
}

// ── Slice ──────────────────────────────────────────────────────────────────────

export const createContractSlice = (set, get) => ({
  contract: {
    // Feed
    feedItems: [],        // [{ id, expiresIn }]
    feedRefreshIn: 0,     // turns until forced feed refresh; 0 = refresh immediately
    rerollCooldown: 0,     // turns until manual reroll is available again

    // Active run
    phase: 'feed',        // 'feed' | 'active' | 'combat' | 'resolving'
    activeContractId: null,
    activeStageIndex: 0,
    stageResults: [],     // [{ stageId, stageLabel, choiceId, choiceLabel, passed, narration }]
    resolution: null,     // { outcome, creditsEarned, expEarned, narration }

    // Reward modifier accumulated across stages; applied as multiplier at resolution
    activeContractModifiers: 0,

    // Combat bridge
    pendingCombatResult: null, // { stageId, stageLabel, choiceId, choiceLabel, stageIndex, onVictory, onDefeat, setupText, encounterId }
    hadCombatThisContract: false, // true if any stage triggered a battle — used for pacifist check

    // History
    completedContracts: [],
    failedContracts: [],

    // Fixer reputation (cosmetic)
    fixerRep: {},         // { fixerId: number }
  },

  // ── Feed management ────────────────────────────────────────────────────────

  refreshContractFeed: () =>
    set((state) => {
      const newItems = _pickFeedContracts(state);
      state.contract.feedItems = newItems;
      state.contract.feedRefreshIn = 10;
    }),

  rerollContractFeed: () =>
    set((state) => {
      if (state.contract.rerollCooldown > 0) return;
      if (state.contract.phase !== 'feed') return;
      const newItems = _pickFeedContracts(state);
      state.contract.feedItems = newItems;
      state.contract.rerollCooldown = 3;
    }),

  tickFeed: () =>
    set((state) => {
      // Don't tick the feed mid-run
      if (state.contract.phase !== 'feed') return;
      // Decrement reroll cooldown
      if (state.contract.rerollCooldown > 0) {
        state.contract.rerollCooldown -= 1;
      }
      // Decrement expiry on each item
      state.contract.feedItems = state.contract.feedItems
        .map((item) => ({ ...item, expiresIn: item.expiresIn - 1 }))
        .filter((item) => item.expiresIn > 0);
      // Decrement refresh counter
      if (state.contract.feedRefreshIn > 0) {
        state.contract.feedRefreshIn -= 1;
      }
      // Refresh if counter hit zero, feed empty, or feed has no acceptable contract
      if (
        state.contract.feedRefreshIn <= 0 ||
        state.contract.feedItems.length === 0 ||
        !_feedHasAcceptable(state)
      ) {
        const newItems = _pickFeedContracts(state);
        const existing = state.contract.feedItems;
        const toAdd = newItems.filter((n) => !existing.some((e) => e.id === n.id));
        // Merge and sort: acceptable first, locked last
        const merged = [...existing, ...toAdd];
        const pLevel  = _playerLevel(state);
        const credits = state.character.credits;
        merged.sort((a, b) => {
          const aOk = _canAccept(state, getContract(a.id), pLevel, credits) ? 1 : 0;
          const bOk = _canAccept(state, getContract(b.id), pLevel, credits) ? 1 : 0;
          return bOk - aOk;
        });
        state.contract.feedItems = merged.slice(0, FEED_SIZE);
        state.contract.feedRefreshIn = 10;
      }
      // Ensure invariant: feed has an acceptable contract if pool contains one
      _ensureAcceptableInFeed(state);
    }),

  // ── Contract acceptance ────────────────────────────────────────────────────

  acceptContract: (contractId) =>
    set((state) => {
      if (state.contract.phase !== 'feed') return;

      const contract = getContract(contractId);
      if (!contract) return;

      const playerLevel = state.crew.members.find((m) => m.isPlayer)?.level ?? 1;
      if (playerLevel < contract.teamLevelRequired) return;
      if (!contractCrewGateMet(state.crew.members, contract)) return;

      // Faction reputation gate (e.g. requires UNDERTOW_FRIENDLY)
      if (!contractRepGateMet(state, contract)) return;

      if (contract.deposit > 0) {
        if (state.character.credits < contract.deposit) return;
        state.character.credits -= contract.deposit;
      }

      state.contract.feedItems = state.contract.feedItems.filter((i) => i.id !== contractId);
      state.contract.phase = 'active';
      state.contract.activeContractId = contractId;
      state.contract.activeStageIndex = 0;
      state.contract.stageResults = [];
      state.contract.resolution = null;
      state.contract.activeContractModifiers = 0;
      state.contract.hadCombatThisContract = false;
    }),

  // ── Stage resolution ───────────────────────────────────────────────────────

  resolveStageChoice: (choiceId) =>
    set((state) => {
      if (state.contract.phase !== 'active') return;

      const contract = getContract(state.contract.activeContractId);
      if (!contract) return;

      const { activeStageIndex } = state.contract;
      const stage = contract.stages[activeStageIndex];
      if (!stage) return;

      const choice = stage.choices.find((c) => c.id === choiceId);
      if (!choice) return;

      // Credit gate — silently block unaffordable choices
      if (choice.requires?.credits && state.character.credits < choice.requires.credits) return;

      // Resolve the choice outcome
      let branchData;
      let passed = true;

      if (choice.statCheck) {
        const player = state.crew.members.find((m) => m.isPlayer);
        const statVal = getEffectiveStat(player, choice.statCheck.stat);
        const roll = statVal + Math.floor(Math.random() * 6);
        passed        = roll >= choice.statCheck.threshold;
        branchData    = passed ? choice.pass : choice.fail;
      } else {
        branchData = choice.outcome;
      }

      const { branch, text, onVictory, onDefeat } = branchData;

      if (branch === 'triggersBattle') {
        state.contract.pendingCombatResult = {
          stageId:      stage.id,
          stageLabel:   stage.label,
          choiceId,
          choiceLabel:  choice.label,
          stageIndex:   activeStageIndex,
          onVictory:    onVictory || { branch: 'advance', text: 'Battle won. Pressing forward.' },
          onDefeat:     onDefeat  || { branch: 'fail',    text: 'Overwhelmed. Contract failed.' },
          setupText:    text,
          encounterId:  branchData.encounterId || null,
        };
        state.contract.hadCombatThisContract = true;
        state.contract.phase = 'combat';
        return;
      }

      _applyOutcomeEffects(state, branchData.effects);

      // Apply tier-based consequences for stage failure — HP/neural damage, morale loss
      if (!passed) {
        const failFx = STAGE_FAIL_EFFECTS[contract.tier] || STAGE_FAIL_EFFECTS.LOW;
        const applied = _applyOutcomeEffects(state, failFx);
        _logConsequences(state, applied, `con_dmg_${stage.id}`);
      }

      state.contract.stageResults.push({
        stageId:     stage.id,
        stageLabel:  stage.label,
        choiceId,
        choiceLabel: choice.label,
        passed,
        narration: text,
      });

      state.log.entries.push({
        id: `con_stg_${stage.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text,
        timestamp: new Date().toISOString(),
        type: 'narration',
      });

      if (branch === 'complete') {
        _setResolution(state, contract, 'success');
        return;
      }

      if (branch === 'fail') {
        _setResolution(state, contract, 'failure');
        return;
      }

      // branch === 'advance'
      _advanceOrResolve(state, contract, activeStageIndex + 1);
    }),

  // ── Combat integration ─────────────────────────────────────────────────────

  handleCombatResolution: (combatOutcome) =>
    set((state) => {
      const pending = state.contract.pendingCombatResult;
      if (!pending) return;

      const victorData = combatOutcome === 'victory' ? pending.onVictory : pending.onDefeat;
      const { branch, text } = victorData;

      _applyOutcomeEffects(state, victorData.effects);

      // Apply tier-based consequences for a lost fight — HP/neural damage, morale loss
      if (combatOutcome !== 'victory') {
        const contract = getContract(state.contract.activeContractId);
        if (contract) {
          const failFx = STAGE_FAIL_EFFECTS[contract.tier] || STAGE_FAIL_EFFECTS.LOW;
          const applied = _applyOutcomeEffects(state, failFx);
          _logConsequences(state, applied, `con_dmg_${pending.stageId}`);
        }
      }

      state.contract.stageResults.push({
        stageId:     pending.stageId,
        stageLabel:  pending.stageLabel,
        choiceId:    pending.choiceId,
        choiceLabel: pending.choiceLabel,
        passed:      combatOutcome === 'victory',
        narration:   text,
      });

      state.log.entries.push({
        id: `con_bat_${pending.stageId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text,
        timestamp: new Date().toISOString(),
        type: 'narration',
      });

      state.contract.pendingCombatResult = null;

      const contract = getContract(state.contract.activeContractId);
      if (!contract) return;

      if (branch === 'complete') {
        _setResolution(state, contract, 'success');
        return;
      }

      if (branch === 'fail') {
        _setResolution(state, contract, 'failure');
        return;
      }

      // branch === 'advance'
      _advanceOrResolve(state, contract, pending.stageIndex + 1);

      // If we advanced to a new stage (not resolving), re-open the modal
      if (state.contract.phase !== 'resolving') {
        state.contract.phase = 'active';
      }
    }),

  // ── Abort ──────────────────────────────────────────────────────────────────

  abortContract: () =>
    set((state) => {
      if (state.contract.phase !== 'active') return;
      const contract = getContract(state.contract.activeContractId);
      _setResolution(state, contract, 'aborted');
    }),

  // ── Dismiss resolution (apply rewards, return to feed) ────────────────────

  dismissResolution: () => {
    const preState = get();
    const { resolution, activeContractId, hadCombatThisContract } = preState.contract;
    if (!resolution || preState.contract.phase !== 'resolving') return;

    const wasSuccess      = resolution.outcome === 'success';
    const creditsEarned   = resolution.creditsEarned;
    const noCombat        = !hadCombatThisContract;

    set((state) => {
      const contract = getContract(activeContractId);
      if (!contract) return;

      if (resolution.creditsEarned > 0) {
        state.character.credits += resolution.creditsEarned;
      }

      // Rep tier payout bonus
      const factionRep = contract.faction ? (state.faction?.rep?.[contract.faction] ?? 0) : 0;
      const tierMultiplier = factionRep >= 150 ? 1.30 : factionRep >= 75 ? 1.20 : factionRep >= 25 ? 1.10 : 1.0;
      const bonusCredits = Math.round(resolution.creditsEarned * (tierMultiplier - 1));
      if (bonusCredits > 0) {
        state.character.credits += bonusCredits;
      }
      if (resolution.expEarned > 0) {
        const player = state.crew.members.find((m) => m.isPlayer);
        if (player) applyXPToCrewMember(state, player, resolution.expEarned);
      }

      // Cyberware quest reward — tiered pool drop on success. Quest rewards bypass vendor faction gates.
      if (resolution.outcome === 'success' && contract.cyberwareReward) {
        const { pool, chance = 0.4 } = contract.cyberwareReward;
        if (pool && CYBERWARE_REWARD_POOLS[pool] && Math.random() < chance) {
          const itemId = rollCyberwareReward(pool);
          if (itemId) {
            const item = CYBERWARE_ITEMS.find((c) => c.id === itemId);
            if (item) {
              state.character.cyberwareInventory.push(item.id);
              state.log.entries.push({
                id: `rew_${itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                turn: state.character.turnNumber,
                text: `REWARD: ${contract.name} — ${item.name} added to cyberware inventory.`,
                timestamp: new Date().toISOString(),
                type: 'acquisition',
              });
            }
          }
        }
      }

      if (resolution.outcome === 'success') {
        if (!state.contract.completedContracts.includes(activeContractId)) {
          state.contract.completedContracts.push(activeContractId);
        }
        const fixer = contract.fixerId;
        state.contract.fixerRep[fixer] = (state.contract.fixerRep[fixer] ?? 0) + 1;
        // Faction rep gain on success (rivalry bleed applied automatically)
        if (contract.faction && contract.factionRepReward) {
          applyRepToDraft(state, contract.faction, contract.factionRepReward);
        }
      } else if (resolution.outcome === 'failure') {
        state.contract.failedContracts.push(activeContractId);
        if (contract.faction && contract.factionRepPenalty) {
          applyRepToDraft(state, contract.faction, -contract.factionRepPenalty);
        }
      } else if (resolution.outcome === 'aborted') {
        // Abandoning a job costs standing with its faction too
        if (contract.faction && contract.factionRepPenalty) {
          applyRepToDraft(state, contract.faction, -contract.factionRepPenalty);
        }
      }

      const tierLabel = factionRep >= 150 ? 'EXALTED' : factionRep >= 75 ? 'ALLIED' : factionRep >= 25 ? 'FRIENDLY' : null;
      const tierSuffix = tierLabel ? ` (${tierLabel} bonus: +${bonusCredits} CR)` : '';
      const vehicleSuffix = resolution.vehicleBonusApplied
        ? ` (Logistics +${Math.round(resolution.vehicleBonusApplied * 100)}%)` : '';
      const logText =
        resolution.outcome === 'success'
          ? `ACQUISITION: ${contract.name} complete. +${resolution.creditsEarned.toLocaleString()} CR, +${resolution.expEarned} EXP.${tierSuffix}${vehicleSuffix}`
          : resolution.outcome === 'failure'
          ? `CRITICAL: ${contract.name} went sideways. Salvaged ${resolution.creditsEarned.toLocaleString()} CR.`
          : `ABORT: ${contract.name} terminated. No payout.`;

      state.log.entries.push({
        id: `con_res_${activeContractId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text: logText,
        timestamp: new Date().toISOString(),
        type: resolution.outcome === 'success' ? 'acquisition' : 'narration',
      });
      state.world.flags.add('flag_recent_contract');

      if (resolution.outcome === 'success' && resolution.vehicleBonusApplied) {
        const vehicles = state.character.vehicles ?? [];
        const fleetSize = vehicles.length;
        const flavorPhrases = [
          `FLEET_LOGISTICS: Secure drop-points cleared. Transit optimized.`,
          `FLEET_LOGISTICS: Fleet logistics network utilized. Delivery expedited.`,
          `FLEET_LOGISTICS: High-speed transport routes secured. Payout extraction enhanced.`,
          `FLEET_LOGISTICS: Assets deployed to decoy routes. Heat signature minimized.`
        ];
        const flavorText = flavorPhrases[Math.floor(Math.random() * flavorPhrases.length)];
        state.log.entries.push({
          id: `con_veh_flav_${activeContractId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          turn: state.character.turnNumber,
          text: `${flavorText} (Logistics fleet size: ${fleetSize})`,
          timestamp: new Date().toISOString(),
          type: 'narration',
        });
      }

      state.character.turnNumber += 1;

      state.contract.phase = 'feed';
      state.contract.activeContractId = null;
      state.contract.activeStageIndex = 0;
      state.contract.stageResults = [];
      state.contract.resolution = null;
      state.contract.activeContractModifiers = 0;
      state.contract.hadCombatThisContract = false;
      // Rolling backfill: remove completed id, refill to FEED_SIZE
      state.contract.feedItems = state.contract.feedItems.filter(
        (fi) => fi.id !== activeContractId,
      );
      const freshPicks = _pickFeedContracts(state);
      const existing = state.contract.feedItems;
      const toAdd = freshPicks.filter((n) => !existing.some((e) => e.id === n.id));
      const merged = [...existing, ...toAdd];
      // Sort: acceptable first, locked last
      const pLevel  = _playerLevel(state);
      const credits2 = state.character.credits;
      merged.sort((a, b) => {
        const aOk = _canAccept(state, getContract(a.id), pLevel, credits2) ? 1 : 0;
        const bOk = _canAccept(state, getContract(b.id), pLevel, credits2) ? 1 : 0;
        return bOk - aOk;
      });
      state.contract.feedItems = merged.slice(0, FEED_SIZE);
    });

    // Achievement hooks (after set)
    if (wasSuccess) {
      get().incrementLifetime?.('contractsCompleted');
      if (creditsEarned > 0) get().incrementLifetime?.('totalCreditsEarned', creditsEarned);
      if (noCombat) get().triggerAchievement?.('run_pacifist');
    }
  },

  // ── Dev overrides ──────────────────────────────────────────────────────────

  devForceRefreshFeed: () =>
    set((state) => {
      state.contract.feedItems = [];
      state.contract.feedRefreshIn = 0;
      const newItems = _pickFeedContracts(state);
      state.contract.feedItems = newItems;
      state.contract.feedRefreshIn = 10;
    }),

  devForceStartContract: (contractId) =>
    set((state) => {
      const contract = getContract(contractId);
      if (!contract) return;
      state.contract.phase = 'active';
      state.contract.activeContractId = contractId;
      state.contract.activeStageIndex = 0;
      state.contract.stageResults = [];
      state.contract.resolution = null;
      state.contract.pendingCombatResult = null;
      state.contract.activeContractModifiers = 0;
    }),

  devForceContractResolution: (outcome) =>
    set((state) => {
      if (state.contract.phase !== 'active') return;
      const contract = getContract(state.contract.activeContractId);
      if (!contract) return;
      _setResolution(state, contract, outcome);
    }),

  devClearActiveContract: () =>
    set((state) => {
      state.contract.phase = 'feed';
      state.contract.activeContractId = null;
      state.contract.activeStageIndex = 0;
      state.contract.stageResults = [];
      state.contract.resolution = null;
      state.contract.pendingCombatResult = null;
      state.contract.activeContractModifiers = 0;
      state.contract.hadCombatThisContract = false;
    }),

  devSetFixerRep: (fixerId, value) =>
    set((state) => {
      state.contract.fixerRep[fixerId] = Math.max(0, Number(value) || 0);
    }),

  devSetContractsCompleted: (n) =>
    set((state) => {
      const count = Math.max(0, Math.floor(Number(n) || 0));
      state.contract.completedContracts = Array.from({ length: count }, (_, i) => `dev_contract_${i}`);
    }),
});
