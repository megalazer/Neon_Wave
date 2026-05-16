// Stub — legacy persistence via AsyncStorage implemented in a later phase.
// Architecture supports it: world state persists, character state resets on death.
export const createLegacySlice = () => ({
  legacy: {
    runs: 0,
    highestTurn: 0,
    unlockedFlags: [],
  },
});
