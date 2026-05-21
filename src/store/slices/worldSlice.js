export const createWorldSlice = (set) => ({
  world: {
    flags: new Set(),
    factionPower: {},
    turnNumber: 0,
    pendingLevelUp: null, // { target, memberName, from, to } — drives LevelUpBanner
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
});
