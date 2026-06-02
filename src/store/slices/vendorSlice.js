import { CYBERWARE_ITEMS } from '../../data/cyberware';
import { QUICKHACKS } from '../../data/quickhacks';
import { getUnlockedTiers } from '../../data/vendor';
import { calculateTeamLevel } from '../../data/leveling';

function buildRotatingStock(teamLevel) {
  const tiers      = getUnlockedTiers(teamLevel);
  const cyberPool  = CYBERWARE_ITEMS.filter(
    (c) => c.vendorCategory === 'rotating' && tiers.includes(c.vendorTier),
  );
  // Basic-tier quickhacks are staples; only non-basic rotate
  const hackPool   = Object.values(QUICKHACKS).filter(
    (qh) => qh.vendorTier !== 'basic' && tiers.includes(qh.vendorTier),
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
      state.vendor.rotatingStock       = buildRotatingStock(teamLevel ?? calculateTeamLevel(state.crew.members));
      state.vendor.refreshCountdown    = 8;
      state.vendor.purchasedThisRotation = [];
    }),

  tickVendor: () =>
    set((state) => {
      state.vendor.refreshCountdown -= 1;
      if (state.vendor.refreshCountdown <= 0) {
        const tl = calculateTeamLevel(state.crew.members);
        state.vendor.rotatingStock         = buildRotatingStock(tl);
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
        id: `vend_cyber_${itemId}_${Date.now()}`,
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
        id: `vend_hack_${quickhackId}_${Date.now()}`,
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
        id: `qhmod_${quickhackId}_${Date.now()}`,
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
      state.vendor.rotatingStock         = buildRotatingStock(tl);
      state.vendor.refreshCountdown      = 8;
      state.vendor.purchasedThisRotation = [];
    }),

  devForceVendorAllTiers: () =>
    set((state) => {
      state.vendor.rotatingStock         = buildRotatingStock(10); // TL10 unlocks all tiers
      state.vendor.refreshCountdown      = 8;
      state.vendor.purchasedThisRotation = [];
    }),

  devClearQuickhackModules: () =>
    set((state) => {
      state.vendor.quickhackModules = [];
    }),
});
