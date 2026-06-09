import { CYBERWARE_ITEMS } from '../../data/cyberware';
import { QUICKHACKS } from '../../data/quickhacks';
import { getUnlockedTiers } from '../../data/vendor';
import { calculateTeamLevel } from '../../data/leveling';
import { getActiveAccountPerks } from '../../data/achievements';
import { repTierFromValue, tierMeetsRequirement } from '../../data/factions';

// Reads account-perk vendor unlocks off the shared draft/state.
function perkUnlockedVendorIds(state) {
  const perks = getActiveAccountPerks(state);
  return {
    cyber: perks.filter((p) => p.type === 'unlock_vendor_cyberware').map((p) => p.value),
    hack:  perks.filter((p) => p.type === 'unlock_vendor_quickhack').map((p) => p.value),
  };
}

// An item with a factionReq only enters the pool if the player's rep tier with that
// faction meets/exceeds the requirement. Items without factionReq are unrestricted.
function factionReqMet(item, factionRep) {
  if (!item.factionReq) return true;
  const { faction, tier } = item.factionReq;
  const rep = factionRep?.[faction] ?? 0;
  return tierMeetsRequirement(repTierFromValue(rep), tier);
}

function buildRotatingStock(teamLevel, unlocked = { cyber: [], hack: [] }, factionRep = {}) {
  const tiers = getUnlockedTiers(teamLevel);
  // Eligible if tier is team-level-unlocked OR perk-unlocked, AND any factionReq is met.
  const cyberPool  = CYBERWARE_ITEMS.filter(
    (c) => c.vendorCategory === 'rotating' &&
      (tiers.includes(c.vendorTier) || unlocked.cyber.includes(c.id)) &&
      factionReqMet(c, factionRep),
  );
  // Basic-tier quickhacks are staples; non-basic rotate (or are perk-unlocked).
  const hackPool   = Object.values(QUICKHACKS).filter(
    (qh) => qh.vendorTier !== 'basic' &&
      (tiers.includes(qh.vendorTier) || unlocked.hack.includes(qh.id)) &&
      factionReqMet(qh, factionRep),
  );

  const shuffledCyber = [...cyberPool].sort(() => 0.5 - Math.random());
  const shuffledHacks = [...hackPool].sort(() => 0.5 - Math.random());

  return [
    ...shuffledCyber.slice(0, 3).map((c) => ({ type: 'cyberware', id: c.id })),
    ...shuffledHacks.slice(0, 1).map((qh) => ({ type: 'quickhack', id: qh.id })),
  ];
}

export const createVendorSlice = (set) => ({
  vendor: {
    rotatingStock: [],           // [{ type: 'cyberware'|'quickhack', id }]
    refreshCountdown: 8,         // turns until next rotation
    purchasedThisRotation: [],   // item ids bought this cycle (sold-out flag)
    quickhackModules: [],        // owned quickhack module ids
  },

  refreshVendorStock: (teamLevel) =>
    set((state) => {
      const tl = teamLevel ?? calculateTeamLevel(state.crew.members);
      state.vendor.rotatingStock         = buildRotatingStock(tl, perkUnlockedVendorIds(state), state.faction?.rep);
      state.vendor.refreshCountdown      = 8;
      state.vendor.purchasedThisRotation = [];
    }),

  tickVendor: () =>
    set((state) => {
      state.vendor.refreshCountdown -= 1;
      if (state.vendor.refreshCountdown <= 0) {
        const tl = calculateTeamLevel(state.crew.members);
        state.vendor.rotatingStock         = buildRotatingStock(tl, perkUnlockedVendorIds(state), state.faction?.rep);
        state.vendor.refreshCountdown      = 8;
        state.vendor.purchasedThisRotation = [];
      }
    }),

  purchaseCyberware: (itemId) =>
    set((state) => {
      const item = CYBERWARE_ITEMS.find((c) => c.id === itemId);
      if (!item) return;
      if (state.character.credits < item.cost) return;
      if (
        item.vendorCategory === 'rotating' &&
        state.vendor.purchasedThisRotation.includes(itemId)
      ) return;

      state.character.credits -= item.cost;
      state.character.cyberwareInventory.push(itemId);

      if (item.vendorCategory === 'rotating') {
        state.vendor.purchasedThisRotation.push(itemId);
      }

      const costStr = item.cost > 0 ? ` -${item.cost.toLocaleString()} CR.` : '';
      state.log.entries.push({
        id: `vend_cyber_${itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text: `ACQUISITION: ${item.name} purchased.${costStr} Added to inventory.`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    }),

  purchaseQuickhackModule: (quickhackId) =>
    set((state) => {
      const hack = QUICKHACKS[quickhackId];
      if (!hack) return;
      if (state.character.credits < hack.moduleCost) return;
      if (
        hack.vendorTier !== 'basic' &&
        state.vendor.purchasedThisRotation.includes(quickhackId)
      ) return;

      state.character.credits -= hack.moduleCost;
      state.vendor.quickhackModules.push(quickhackId);

      if (hack.vendorTier !== 'basic') {
        state.vendor.purchasedThisRotation.push(quickhackId);
      }

      state.log.entries.push({
        id: `vend_hack_${quickhackId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text: `ACQUISITION: Quickhack module ${hack.name} acquired. -${hack.moduleCost.toLocaleString()} CR.`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    }),

  installQuickhackModule: (memberId, quickhackId) =>
    set((state) => {
      const member = state.crew.members.find((m) => m.id === memberId);
      if (!member || member.class !== 'netrunner') return;

      const hack = QUICKHACKS[quickhackId];
      if (!hack) return;

      const moduleIdx = state.vendor.quickhackModules.indexOf(quickhackId);
      if (moduleIdx === -1) return;

      const slotKey = hack.tier === 'low' ? 'slot1'
                    : hack.tier === 'mid' ? 'slot2'
                    : 'slot3';

      if (!member.quickhacks) member.quickhacks = { slot1: null, slot2: null, slot3: null };
      member.quickhacks[slotKey] = quickhackId;
      state.vendor.quickhackModules.splice(moduleIdx, 1);

      state.log.entries.push({
        id: `qhmod_${quickhackId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text: `MODULE_INSTALLED: ${hack.name} → ${member.name} [${slotKey.toUpperCase()}].`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    }),

  // ── Dev overrides ──────────────────────────────────────────────────────────

  devForceVendorRefresh: () =>
    set((state) => {
      const tl = calculateTeamLevel(state.crew.members);
      state.vendor.rotatingStock         = buildRotatingStock(tl, perkUnlockedVendorIds(state), state.faction?.rep);
      state.vendor.refreshCountdown      = 8;
      state.vendor.purchasedThisRotation = [];
    }),

  devForceVendorAllTiers: () =>
    set((state) => {
      // TL10 + max rep so faction-locked items also surface for testing
      const allRep = {};
      for (const fid of Object.keys(state.faction?.rep ?? {})) allRep[fid] = 300;
      state.vendor.rotatingStock         = buildRotatingStock(10, perkUnlockedVendorIds(state), allRep);
      state.vendor.refreshCountdown      = 8;
      state.vendor.purchasedThisRotation = [];
    }),

  devClearQuickhackModules: () =>
    set((state) => {
      state.vendor.quickhackModules = [];
    }),
});
