export const createCharacterSlice = (set) => ({
  character: {
    name: 'GHOST',
    class: 'NETRUNNER',
    credits: 999999, // testing mode — lower later
    district: 'SECTOR_7',
    turnNumber: 0,
    renownLabel: 'GHOST',
    renown: 0,
    exp: 0,
    cyberwareInventory: ['cyb_bio_monitor_x10', 'cyb_gorilla_arms_v1', 'cyb_skill_chip_crawl'],
  },
  incrementTurn: () =>
    set((state) => {
      state.character.turnNumber += 1;
    }),
});
