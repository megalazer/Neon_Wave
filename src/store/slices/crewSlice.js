import { current } from 'immer';
import { OPERATIVES } from '../../data/operatives';

export const createCrewSlice = (set) => ({
  crew: {
    members: [],
    availableOperatives: [],
  },

  initializeOperatives: () =>
    set((state) => {
      state.crew.availableOperatives = OPERATIVES.map((op) => ({
        ...op,
        hp: { ...op.hp },
        mp: { ...op.mp },
        stats: { ...op.stats },
      }));
    }),

  recruitOperative: (operativeId) =>
    set((state) => {
      const idx = state.crew.availableOperatives.findIndex((op) => op.id === operativeId);
      if (idx === -1 || state.crew.members.length >= 3) return;
      const op = current(state.crew.availableOperatives[idx]);
      if (state.character.credits < op.cost) return;
      state.character.credits -= op.cost;
      state.crew.members.push(op);
      state.crew.availableOperatives.splice(idx, 1);
      state.log.entries.push({
        id: `recruit_${operativeId}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `ACQUISITION: ${op.name} has joined the crew. -${op.cost.toLocaleString()} CR.`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    }),

  dismissMember: (memberId) =>
    set((state) => {
      const idx = state.crew.members.findIndex((m) => m.id === memberId);
      if (idx === -1) return;
      const member = current(state.crew.members[idx]);
      state.crew.members.splice(idx, 1);
      state.crew.availableOperatives.push(member);
      state.log.entries.push({
        id: `dismiss_${memberId}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `LOG: ${member.name} has been dismissed from the crew. No credit refund.`,
        timestamp: new Date().toISOString(),
        type: 'narration',
      });
    }),
});
