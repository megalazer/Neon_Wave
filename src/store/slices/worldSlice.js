export const createWorldSlice = (set) => ({
  world: {
    flags: new Set(),
    turnNumber: 0,
    pendingLevelUp: null, // { target, memberName, from, to } — drives LevelUpBanner
    gameOver: false,
    gameOverReason: null,
    crewInteraction: {
      activeToast: null,  // { nameA, nameB, lines: string[], accent: string } | null
      lastInteractionTurn: 0,
      cooldownTurns: 0,
    },
  },

  tickTurn: () =>
    set((state) => {
      state.world.turnNumber += 1;
    }),

  showLevelUpBanner: (payload) =>
    set((state) => {
      state.world.pendingLevelUp = payload;
    }),

  clearLevelUpBanner: () =>
    set((state) => {
      state.world.pendingLevelUp = null;
    }),

  triggerGameOver: (reason) =>
    set((state) => {
      state.world.gameOver = true;
      state.world.gameOverReason = reason ?? 'FLATLINE';
    }),

  dismissCrewToast: () =>
    set((state) => {
      state.world.crewInteraction.activeToast = null;
    }),
});
