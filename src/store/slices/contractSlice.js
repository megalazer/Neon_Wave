import { CONTRACTS } from '../../data/contracts';
import { applyXPToCharacter } from '../../data/leveling';

// Look up contract fresh from CONTRACTS every time — never store the object in
// Immer state, because Immer auto-freezes any object assigned to state, which
// causes subtle proxy issues when reading `.stages.length` in subsequent actions.
function getContract(id) {
  return CONTRACTS.find((c) => c.id === id) ?? null;
}

export const createContractSlice = (set) => ({
  contract: {
    phase: 'feed',            // 'feed' | 'active' | 'resolving'
    activeContractId: null,   // string ID — look up via getContract()
    activeStageIndex: 0,
    stageResults: [],         // [{ stageId, stageLabel, choiceId, choiceLabel, passed, narration }]
    resolution: null,         // { outcome, creditsEarned, expEarned, narration }
    completedContracts: [],
    failedContracts: [],
  },

  startContract: (contractId) =>
    set((state) => {
      const contract = getContract(contractId);
      if (!contract || contract.locked) return;
      if (state.character.renown < (contract.renownRequired || 0)) return;
      if (state.contract.phase !== 'feed') return;
      state.contract.activeContractId = contract.id;
      state.contract.activeStageIndex = 0;
      state.contract.stageResults = [];
      state.contract.resolution = null;
      state.contract.phase = 'active';
    }),

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

      let passed = true;
      if (choice.statCheck) {
        const statVal = state.character.stats[choice.statCheck.stat] || 10;
        const roll = statVal + Math.floor(Math.random() * 6);
        passed = roll >= choice.statCheck.threshold;
      }

      state.contract.stageResults.push({
        stageId: stage.id,
        stageLabel: stage.label,
        choiceId,
        choiceLabel: choice.label,
        passed,
        narration: passed ? choice.successNarration : choice.failNarration,
      });

      const nextIndex = activeStageIndex + 1;

      if (nextIndex >= contract.stages.length) {
        const passes = state.contract.stageResults.filter((r) => r.passed).length;
        const outcome = passes >= 2 ? 'success' : 'failure';
        state.contract.resolution = {
          outcome,
          creditsEarned: outcome === 'success' ? contract.payout : Math.floor(contract.payout / 2),
          expEarned: outcome === 'success' ? contract.exp : 0,
          narration: outcome === 'success' ? contract.successNarration : contract.failureNarration,
        };
        state.contract.phase = 'resolving';
      } else {
        state.contract.activeStageIndex = nextIndex;
      }
    }),

  abortContract: () =>
    set((state) => {
      if (state.contract.phase !== 'active') return;
      const contract = getContract(state.contract.activeContractId);
      state.contract.resolution = {
        outcome: 'aborted',
        creditsEarned: 0,
        expEarned: 0,
        narration: contract?.abortNarration || 'Contract terminated.',
      };
      state.contract.phase = 'resolving';
    }),

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
        applyXPToCharacter(state, resolution.expEarned);
      }

      if (resolution.outcome === 'success') {
        if (!state.contract.completedContracts.includes(activeContractId)) {
          state.contract.completedContracts.push(activeContractId);
        }
      } else if (resolution.outcome === 'failure') {
        state.contract.failedContracts.push(activeContractId);
      }

      const logText =
        resolution.outcome === 'success'
          ? `ACQUISITION: ${contract.name} complete. +${resolution.creditsEarned.toLocaleString()} CR, +${resolution.expEarned} EXP.`
          : resolution.outcome === 'failure'
          ? `CRITICAL: ${contract.name} went sideways. Salvaged ${resolution.creditsEarned.toLocaleString()} CR.`
          : `ABORT: ${contract.name} contract terminated. No payout.`;

      state.log.entries.push({
        id: `con_${activeContractId}_${Date.now()}`,
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

  // ── Dev overrides ─────────────────────────────────────────────────────────

  devForceStartContract: (contractId) =>
    set((state) => {
      const contract = getContract(contractId);
      if (!contract || contract.locked) return;
      state.contract.activeContractId = contract.id;
      state.contract.activeStageIndex = 0;
      state.contract.stageResults = [];
      state.contract.resolution = null;
      state.contract.phase = 'active';
    }),

  devForceContractResolution: (outcome) =>
    set((state) => {
      const contract = getContract(state.contract.activeContractId);
      if (!contract) return;
      state.contract.resolution = {
        outcome,
        creditsEarned:
          outcome === 'success'
            ? contract.payout
            : outcome === 'failure'
            ? Math.floor(contract.payout / 2)
            : 0,
        expEarned: outcome === 'success' ? contract.exp : 0,
        narration: `[DEV_OVERRIDE: RESOLUTION_${outcome.toUpperCase()}]`,
      };
      state.contract.phase = 'resolving';
    }),
});
