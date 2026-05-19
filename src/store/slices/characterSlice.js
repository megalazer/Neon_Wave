import { ORIGIN_MODIFIERS, OPENING_NARRATION } from '../../data/origins';

export const createCharacterSlice = (set) => ({
  character: {
    name: null,
    gender: null,
    path: null,
    class: 'NETRUNNER',
    credits: 0,
    district: 'SECTOR_7',
    turnNumber: 0,
    renownLabel: 'GHOST',
    renown: 0,
    exp: 0,
    stats: { chrome: 10, edge: 10, ghost: 10, face: 10, grit: 10, wire: 10 },
    cyberwareInventory: [],
    realEstate: [],
    vehicles: [],
    luxuryItems: [],
  },

  purchaseAsset: (assetType, assetId, cost, assetName) =>
    set((state) => {
      if (state.character.credits < cost) return;
      state.character.credits -= cost;
      state.character[assetType].push(assetId);
      state.log.entries.push({
        id: `asset_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `ACQUISITION: Acquired ${assetName}. -${cost.toLocaleString()} CR.`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    }),

  incrementTurn: () =>
    set((state) => {
      state.character.turnNumber += 1;
    }),

  // Finalises character creation and seeds the initial log + crew state.
  // draft: { path, gender, name, starterCyberware }
  initCharacter: (draft) =>
    set((state) => {
      const mods = ORIGIN_MODIFIERS[draft.path] || {};

      state.character.name   = draft.name;
      state.character.gender = draft.gender;
      state.character.path   = draft.path;

      state.character.credits = mods.credits ?? 400;

      state.character.stats = {
        chrome: 10 + (mods.chrome || 0),
        edge:   10 + (mods.edge   || 0),
        ghost:  10 + (mods.ghost  || 0),
        face:   10 + (mods.face   || 0),
        grit:   10 + (mods.grit   || 0),
        wire:   10 + (mods.wire   || 0),
      };

      state.character.cyberwareInventory = [draft.starterCyberware];

      state.crew.members = [];

      state.log.entries = [
        {
          id: `init_${Date.now()}`,
          turn: 0,
          text: OPENING_NARRATION[draft.path] || OPENING_NARRATION.street_kid,
          timestamp: new Date().toISOString(),
          type: 'narration',
        },
      ];
    }),
});
