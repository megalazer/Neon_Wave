import { ALL_CONTRACTS, getContract } from '../../data/contracts/index';
import { applyXPToCrewMember } from '../../data/leveling';

// ── Helpers ────────────────────────────────────────────────────────────────────

function _pickFeedContracts(state) {
  const completed  = new Set(state.contract.completedContracts);
  const inFeed     = new Set(state.contract.feedItems.map((i) => i.id));
  const playerLevel = state.crew.members.find((m) => m.isPlayer)?.level ?? 1;

  const pool = ALL_CONTRACTS.filter(
    (c) => !completed.has(c.id) && !inFeed.has(c.id) && playerLevel >= c.teamLevelRequired,
  );

  // Shuffle pool
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);

  // Try to keep tier diversity: prefer one of each available tier
  const picks = [];
  for (const tier of ['LOW', 'MID', 'HIGH']) {
    const found = shuffled.find((c) => c.tier === tier && !picks.some((p) => p.id === c.id));
    if (found) picks.push(found);
    if (picks.length === 3) break;
  }
  // Backfill with any remaining if under 3
  for (const c of shuffled) {
    if (picks.length >= 3) break;
    if (!picks.some((p) => p.id === c.id)) picks.push(c);
  }

  return picks.map((c) => ({ id: c.id, expiresIn: 10 }));
}

function _setResolution(state, contract, outcome) {
  state.contract.resolution = {
    outcome,
    creditsEarned:
      outcome === 'success'
        ? contract.payout
        : outcome === 'failure'
        ? Math.floor(contract.payout / 4)
        : 0,
    expEarned: outcome === 'success' ? contract.exp : 0,
    narration:
      outcome === 'success'
        ? contract.successNarration
        : outcome === 'failure'
        ? contract.failureNarration
        : contract.abortNarration || 'Contract terminated.',
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

export const createContractSlice = (set) => ({
  contract: {
    // Feed
    feedItems: [],        // [{ id, expiresIn }]
    feedRefreshIn: 0,     // turns until forced feed refresh; 0 = refresh immediately

    // Active run
    phase: 'feed',        // 'feed' | 'active' | 'combat' | 'resolving'
    activeContractId: null,
    activeStageIndex: 0,
    stageResults: [],     // [{ stageId, stageLabel, choiceId, choiceLabel, passed, narration }]
    resolution: null,     // { outcome, creditsEarned, expEarned, narration }

    // Combat bridge
    pendingCombatResult: null, // { stageId, stageLabel, choiceId, choiceLabel, stageIndex, onVictory, onDefeat, setupText }

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

  tickFeed: () =>
    set((state) => {
      // Don't tick the feed mid-run
      if (state.contract.phase !== 'feed') return;

      // Decrement expiry on each item
      state.contract.feedItems = state.contract.feedItems
        .map((item) => ({ ...item, expiresIn: item.expiresIn - 1 }))
        .filter((item) => item.expiresIn > 0);

      // Decrement refresh counter
      if (state.contract.feedRefreshIn > 0) {
        state.contract.feedRefreshIn -= 1;
      }

      // Refresh if counter hit zero or feed is now empty
      if (state.contract.feedRefreshIn <= 0 || state.contract.feedItems.length === 0) {
        const newItems = _pickFeedContracts(state);
        // Merge: keep existing non-expired items, fill up to 3
        const existing = state.contract.feedItems;
        const toAdd = newItems.filter((n) => !existing.some((e) => e.id === n.id));
        state.contract.feedItems = [...existing, ...toAdd].slice(0, 3);
        state.contract.feedRefreshIn = 10;
      }
    }),

  // ── Contract acceptance ────────────────────────────────────────────────────

  acceptContract: (contractId) =>
    set((state) => {
      if (state.contract.phase !== 'feed') return;

      const contract = getContract(contractId);
      if (!contract) return;

      const playerLevel = state.crew.members.find((m) => m.isPlayer)?.level ?? 1;
      if (playerLevel < contract.teamLevelRequired) return;

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

      // Resolve the choice outcome
      let branchData;
      let passed = true;

      if (choice.statCheck) {
        const player  = state.crew.members.find((m) => m.isPlayer);
        const statVal = player?.stats?.[choice.statCheck.stat] ?? 10;
        const roll    = statVal + Math.floor(Math.random() * 6);
        passed        = roll >= choice.statCheck.threshold;
        branchData    = passed ? choice.pass : choice.fail;
      } else {
        branchData = choice.outcome;
      }

      const { branch, text, onVictory, onDefeat } = branchData;

      if (branch === 'triggersBattle') {
        state.contract.pendingCombatResult = {
          stageId:     stage.id,
          stageLabel:  stage.label,
          choiceId,
          choiceLabel: choice.label,
          stageIndex:  activeStageIndex,
          onVictory:   onVictory || { branch: 'advance', text: 'Battle won. Pressing forward.' },
          onDefeat:    onDefeat  || { branch: 'fail',    text: 'Overwhelmed. Contract failed.' },
          setupText:   text,
        };
        state.contract.phase = 'combat';
        return;
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
        id: `con_stg_${stage.id}_${Date.now()}`,
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

      state.contract.stageResults.push({
        stageId:     pending.stageId,
        stageLabel:  pending.stageLabel,
        choiceId:    pending.choiceId,
        choiceLabel: pending.choiceLabel,
        passed:      combatOutcome === 'victory',
        narration:   text,
      });

      state.log.entries.push({
        id: `con_bat_${pending.stageId}_${Date.now()}`,
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

  dismissResolution: () =>
    set((state) => {
      const { resolution, activeContractId } = state.contract;
      if (!resolution || state.contract.phase !== 'resolving') return;

      const contract = getContract(activeContractId);
      if (!contract) return;

      if (resolution.creditsEarned > 0) {
        state.character.credits += resolution.creditsEarned;
      }
      if (resolution.expEarned > 0) {
        const player = state.crew.members.find((m) => m.isPlayer);
        if (player) applyXPToCrewMember(state, player, resolution.expEarned);
      }

      if (resolution.outcome === 'success') {
        if (!state.contract.completedContracts.includes(activeContractId)) {
          state.contract.completedContracts.push(activeContractId);
        }
        const fixer = contract.fixerId;
        state.contract.fixerRep[fixer] = (state.contract.fixerRep[fixer] ?? 0) + 1;
      } else if (resolution.outcome === 'failure') {
        state.contract.failedContracts.push(activeContractId);
      }

      const logText =
        resolution.outcome === 'success'
          ? `ACQUISITION: ${contract.name} complete. +${resolution.creditsEarned.toLocaleString()} CR, +${resolution.expEarned} EXP.`
          : resolution.outcome === 'failure'
          ? `CRITICAL: ${contract.name} went sideways. Salvaged ${resolution.creditsEarned.toLocaleString()} CR.`
          : `ABORT: ${contract.name} terminated. No payout.`;

      state.log.entries.push({
        id: `con_res_${activeContractId}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: logText,
        timestamp: new Date().toISOString(),
        type: resolution.outcome === 'success' ? 'acquisition' : 'narration',
      });

      state.character.turnNumber += 1;

      state.contract.phase = 'feed';
      state.contract.activeContractId = null;
      state.contract.activeStageIndex = 0;
      state.contract.stageResults = [];
      state.contract.resolution = null;
    }),

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
