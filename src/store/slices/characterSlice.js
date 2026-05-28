import { ORIGIN_MODIFIERS, OPENING_NARRATION, deriveStats } from '../../data/origins';
import { CYBERWARE_ITEMS } from '../../data/cyberware';

export const createCharacterSlice = (set) => ({
  character: {
    name: null,
    gender: null,
    path: null,
    credits: 0,
    district: 'SECTOR_7',
    turnNumber: 0,
    renownLabel: 'GHOST',
    renown: 0,
    morale: 50,
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

  initCharacter: (draft) =>
    set((state) => {
      const mods = ORIGIN_MODIFIERS[draft.path] || {};

      state.character.name    = draft.name;
      state.character.gender  = draft.gender;
      state.character.path    = draft.path;
      state.character.credits = mods.credits ?? 400;
      state.character.cyberwareInventory = [];

      // Build player as crew member[0]; starter cyberware is equipped, not in inventory.
      const starterItem = CYBERWARE_ITEMS.find((c) => c.id === draft.starterCyberware);
      const humanityLoss = starterItem?.humanityCost ?? 4;
      const classMap = { corpo: 'FIXER', street_kid: 'STREET_SAMURAI', nomad: 'GHOST' };

      state.crew.members = [
        {
          id: 'player',
          name: draft.name,
          isPlayer: true,
          class: classMap[draft.path] || 'STREET_SAMURAI',
          level: 1,
          exp: 0,
          vitals:   { current: 100, max: 100 },
          neural:   { current: 100, max: 100 },
          humanity: { current: 80 - humanityLoss, max: 80 },
          stats: { ...deriveStats(draft.path) },
          equippedCyberware: [draft.starterCyberware],
          maxCyberwareSlots: 3,
        },
      ];

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
