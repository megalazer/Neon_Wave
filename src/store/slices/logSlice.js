export const createLogSlice = (set) => ({
  log: {
    entries: [],
  },
  addEntry: (entry) =>
    set((state) => {
      state.log.entries.push(entry);
    }),
});
