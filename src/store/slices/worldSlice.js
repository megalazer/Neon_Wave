export const createWorldSlice = (set) => ({
  world: {
    flags: new Set(),
    factionPower: {},
    turnNumber: 0,
  },
  tickTurn: () =>
    set((state) => {
      state.world.turnNumber += 1;
    }),
});
