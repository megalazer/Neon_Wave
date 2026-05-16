export const createCharacterSlice = (set) => ({
  character: {
    name: 'GHOST',
    class: 'NETRUNNER',
    credits: 999999, // testing mode — lower later
    district: 'SECTOR_7',
    turnNumber: 0,
    renown: 'GHOST',
  },
  incrementTurn: () =>
    set((state) => {
      state.character.turnNumber += 1;
    }),
});
