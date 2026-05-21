import { ACTIVITIES } from '../../data/activities';
import { CONTRACTS } from '../../data/contracts';
import { applyXPToCharacter, distributeCombatXP } from '../../data/leveling';

const SUCCESS_RATES = { low: 0.9, moderate: 0.7, high: 0.5 };

function rollOutcome(set, item, idPrefix) {
  set((state) => {
    if (!item || item.locked) return;
    if (state.character.renown < item.renownRequired) return;

    const rate = SUCCESS_RATES[item.risk] ?? 0.7;
    const success = Math.random() < rate;

    if (success) {
      state.character.credits += item.payout;

      // Award player XP then split half to crew
      applyXPToCharacter(state, item.exp);
      const crewXP = Math.floor(item.exp / 2);
      if (crewXP > 0) distributeCombatXP(state, crewXP);

      state.log.entries.push({
        id: `${idPrefix}_${item.id}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `ACQUISITION: ${item.name} complete. +${item.payout.toLocaleString()} CR, +${item.exp} EXP.`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    } else {
      const halfPayout = Math.floor(item.payout / 2);
      state.character.credits += halfPayout;
      if (state.crew.members.length > 0) {
        const idx = Math.floor(Math.random() * state.crew.members.length);
        state.crew.members[idx].vitals.current = Math.max(
          0,
          state.crew.members[idx].vitals.current - 10,
        );
      }
      state.log.entries.push({
        id: `${idPrefix}_fail_${item.id}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `CRITICAL: ${item.name} went sideways. Salvaged ${halfPayout.toLocaleString()} CR. No EXP gained.`,
        timestamp: new Date().toISOString(),
        type: 'narration',
      });
    }
  });
}

export const createEventSlice = (set) => ({
  event: {
    pending: null,
    cooldown: 0,
  },

  executeActivity: (activityId) => {
    const activity = ACTIVITIES.find((a) => a.id === activityId);
    rollOutcome(set, activity, 'act');
  },

  acceptContract: (contractId) => {
    const contract = CONTRACTS.find((c) => c.id === contractId);
    rollOutcome(set, contract, 'con');
  },
});
