import { ORIGIN_MODIFIERS, OPENING_NARRATION, deriveStats } from '../../data/origins';
import { resetNarrationHistory } from '../../data/placeholderNarration';
import { CYBERWARE_ITEMS } from '../../data/cyberware';
import { getActiveAccountPerks } from '../../data/achievements';
import { XP_THRESHOLDS, MAX_LEVEL, VITALITY_BASE, VITALITY_PER_GRIT_BASE, syncRenown } from '../../data/leveling';
import { getFriendForPath } from '../../data/friends';
import { PATH_RELATIONSHIP_MODIFIERS } from '../../data/relationships';

// Applies all active account perks to a freshly-built run. Reads unlocked account
// achievements off the shared draft. Called exactly once per run init, after the
// base player exists. Idempotent per run — perks are derived, never stacked.
// Vendor + cosmetic perks are NOT applied here; they're read where relevant.
function applyAccountPerks(state) {
  const perks = getActiveAccountPerks(state);
  const player = state.crew.members.find((m) => m.isPlayer);

  for (const perk of perks) {
    switch (perk.type) {
      case 'start_credits':
        state.character.credits += perk.value;
        break;
      case 'start_neural':
        if (player) {
          player.neural.max += perk.value;
          player.neural.current += perk.value;
        }
        break;
      case 'start_stat':
        if (player) {
          player.stats[perk.stat] = (player.stats[perk.stat] || 0) + perk.value;
        }
        break;
      case 'start_level':
        if (player) {
          // Simple level bump; sync exp to the new level's floor so the XP bar
          // stays consistent. TODO: per-level stat grants are intentionally skipped
          // here to keep run-start deterministic (no random stat rolls / banner).
          player.level = Math.min(MAX_LEVEL, (player.level || 1) + perk.value);
          player.exp = XP_THRESHOLDS[player.level - 1] ?? player.exp;
        }
        break;
      case 'start_cyberware':
        state.character.cyberwareInventory.push(perk.value);
        break;
      // Vendor + cosmetic perks are read at their point of use, not applied here.
      case 'unlock_vendor_cyberware':
      case 'unlock_vendor_quickhack':
      case 'cosmetic_hud_theme':
      case 'cosmetic_title':
      default:
        break;
    }
  }
}

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
      state.world.flags.add('flag_recent_purchase');
      state.log.entries.push({
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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

  collectAssetIncome: () =>
    set((state) => {
      const ownedRE = state.character.realEstate || [];
      if (ownedRE.length === 0) return;
      const { REAL_ESTATE } = require('../../data/lifestyle');
      let totalIncome = 0;
      for (const id of ownedRE) {
        const re = REAL_ESTATE.find((r) => r.id === id);
        if (re?.incomePerTurn) totalIncome += re.incomePerTurn;
      }
      if (totalIncome > 0) {
        state.character.credits += totalIncome;
        state.log.entries.push({
          id: `rent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          turn: state.character.turnNumber,
          text: `RENT_COLLECTED: +${totalIncome.toLocaleString()} CR (${ownedRE.length} properties)`,
          timestamp: new Date().toISOString(),
          type: 'acquisition',
        });
      }
    }),

  initCharacter: (draft) => {
    resetNarrationHistory();
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
      const baseStats = deriveStats(draft.path);
      const maxVitality = VITALITY_BASE + Math.round(baseStats.grit * VITALITY_PER_GRIT_BASE);

      state.crew.members = [
        {
          id: 'player',
          name: draft.name,
          isPlayer: true,
          class: classMap[draft.path] || 'STREET_SAMURAI',
          level: 1,
          exp: 0,
          bond: 0,
          lastBondTurn: 0,
          vitals:   { current: maxVitality, max: maxVitality },
          neural:   { current: 100, max: 100 },
          humanity: { current: 80 - humanityLoss, max: 80 },
          stats: { ...baseStats },
          equippedCyberware: [draft.starterCyberware],
          maxCyberwareSlots: 3,
        },
      ];

      state.log.entries = [
        {
          id: `init_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          turn: 0,
          text: OPENING_NARRATION[draft.path] || OPENING_NARRATION.street_kid,
          timestamp: new Date().toISOString(),
          type: 'narration',
        },
      ];

      // Apply permanent account perks fresh for this run (after base player exists).
      applyAccountPerks(state);
      syncRenown(state);

      // ── Seed life-path friend ────────────────────────────────────────────
      const pathFriend = getFriendForPath(state.character.path);
      if (pathFriend) {
        const bonuses = PATH_RELATIONSHIP_MODIFIERS[state.character.path]?.factionBondBias || {};
        const startBond = Math.max(10, bonuses[pathFriend.faction] ?? 10);
        if (!state.relationship) state.relationship = { friends: {} };
        state.relationship.friends[pathFriend.id] = {
          bond: startBond,
          lastBondTurn: 0,
          met: true,
          favorUsed: false,
        };
        state.log.entries.push({
          id: `friend_intro_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          turn: 0,
          text: pathFriend.introNarration,
          timestamp: new Date().toISOString(),
          type: 'narration',
        });
      }
    });
  },
});
