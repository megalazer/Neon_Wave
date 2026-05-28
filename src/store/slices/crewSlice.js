import { current } from 'immer';
import { OPERATIVES } from '../../data/operatives';
import { RECHARGE_ITEMS } from '../../data/rechargeItems';
import { CYBERWARE_ITEMS } from '../../data/cyberware';
import { applyXPToCrewMember, distributeCombatXP as _distribute } from '../../data/leveling';
import { generateRecruit } from '../../engine/recruitGenerator';

export const createCrewSlice = (set) => ({
  crew: {
    members: [],
    availableOperatives: [],
    turnsSinceLastSpawn: 0,
    spawnEnabled: true,
  },

  initializeOperatives: () =>
    set((state) => {
      state.crew.availableOperatives = OPERATIVES.map((op) => ({
        ...op,
        vitals: { ...op.vitals },
        neural: { ...op.neural },
        humanity: { ...op.humanity },
        equippedCyberware: [...op.equippedCyberware],
        stats: { ...op.stats },
      }));
    }),

  recruitOperative: (operativeId) =>
    set((state) => {
      const idx = state.crew.availableOperatives.findIndex((op) => op.id === operativeId);
      if (idx === -1 || state.crew.members.length >= 4) return;
      const op = current(state.crew.availableOperatives[idx]);
      if (state.character.credits < op.cost) return;
      state.character.credits -= op.cost;
      state.crew.members.push(op);
      state.crew.availableOperatives.splice(idx, 1);
      state.log.entries.push({
        id: `recruit_${operativeId}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `ACQUISITION: ${op.name} has joined the crew. -${op.cost.toLocaleString()} CR.`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    }),

  // Try to spawn a generated recruit each turn — gates itself on minGap and probability.
  trySpawnRecruit: () =>
    set((state) => {
      state.crew.turnsSinceLastSpawn += 1;
      if (!state.crew.spawnEnabled) return;
      const tss = state.crew.turnsSinceLastSpawn;
      if (tss < 6) return;
      const generatedCount = state.crew.availableOperatives.filter((r) => r.quality !== undefined).length;
      if (generatedCount >= 5) return;
      const beyondGap = tss - 6;
      const chance = Math.min(0.7, 0.2 + beyondGap * 0.1);
      if (Math.random() >= chance) return;
      const contractsCompleted = state.contract.completedContracts.length;
      const currentTurn = state.character.turnNumber;
      const recruit = generateRecruit(contractsCompleted, currentTurn);
      state.crew.availableOperatives.push(recruit);
      state.crew.turnsSinceLastSpawn = 0;
      const accentMap = { common: 'outline', rare: 'secondary', legendary: 'tertiary' };
      state.log.entries.push({
        id: `spawn_${recruit.id}_${Date.now()}`,
        turn: currentTurn,
        text: recruit.arrivalNarration,
        timestamp: new Date().toISOString(),
        type: 'ambient',
        accent: accentMap[recruit.quality] || 'outline',
      });
    }),

  // Expire generated recruits whose timer has run out.
  tickAvailableOperatives: () =>
    set((state) => {
      const currentTurn = state.character.turnNumber;
      for (let i = state.crew.availableOperatives.length - 1; i >= 0; i--) {
        const r = state.crew.availableOperatives[i];
        if (r.expiresAtTurn !== undefined && r.expiresAtTurn <= currentTurn) {
          state.crew.availableOperatives.splice(i, 1);
        }
      }
    }),

  // Force-spawn a recruit of a specific quality, bypassing probability.
  forceSpawnRecruit: (quality) =>
    set((state) => {
      const contractsCompleted = state.contract.completedContracts.length;
      const currentTurn = state.character.turnNumber;
      const recruit = generateRecruit(contractsCompleted, currentTurn, quality);
      state.crew.availableOperatives.push(recruit);
      state.crew.turnsSinceLastSpawn = 0;
      state.log.entries.push({
        id: `spawn_force_${recruit.id}_${Date.now()}`,
        turn: currentTurn,
        text: `[DEV] Force-spawned ${quality.toUpperCase()} recruit: ${recruit.name} (${recruit.handle}).`,
        timestamp: new Date().toISOString(),
        type: 'system',
      });
    }),

  // Dismiss a generated recruit from the available pool without recruiting.
  dismissFromAvailable: (recruitId) =>
    set((state) => {
      const idx = state.crew.availableOperatives.findIndex(
        (r) => r.id === recruitId && r.quality !== undefined,
      );
      if (idx !== -1) state.crew.availableOperatives.splice(idx, 1);
    }),

  addCrewXP: (memberId, amount) =>
    set((state) => {
      const member = state.crew.members.find((m) => m.id === memberId);
      if (!member) return;
      applyXPToCrewMember(state, member, amount);
    }),

  distributeCombatXP: (totalXP) =>
    set((state) => {
      _distribute(state, totalXP);
    }),

  equipCyberware: (memberId, cyberwareId) =>
    set((state) => {
      const item = CYBERWARE_ITEMS.find((c) => c.id === cyberwareId);
      const memberIdx = state.crew.members.findIndex((m) => m.id === memberId);
      if (!item || memberIdx === -1) return;

      const inventoryIdx = state.character.cyberwareInventory.indexOf(cyberwareId);
      if (inventoryIdx === -1) return;

      const member = state.crew.members[memberIdx];
      if (member.humanity.current < item.humanityCost) return;

      const conflictId = member.equippedCyberware.find((id) => {
        const existing = CYBERWARE_ITEMS.find((c) => c.id === id);
        return existing?.slot === item.slot;
      });
      if (conflictId) {
        const conflictItem = CYBERWARE_ITEMS.find((c) => c.id === conflictId);
        const conflictIdx = member.equippedCyberware.indexOf(conflictId);
        member.equippedCyberware.splice(conflictIdx, 1);
        state.character.cyberwareInventory.push(conflictId);
        member.humanity.current = Math.min(
          member.humanity.max,
          member.humanity.current + (conflictItem?.humanityCost || 0),
        );
      } else if (member.equippedCyberware.length >= member.maxCyberwareSlots) {
        return;
      }

      state.character.cyberwareInventory.splice(inventoryIdx, 1);
      member.equippedCyberware.push(cyberwareId);
      member.humanity.current -= item.humanityCost;
      state.log.entries.push({
        id: `equip_${cyberwareId}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `ACQUISITION: ${member.name} installed ${item.name}. -${item.humanityCost} HUMANITY.`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    }),

  unequipCyberware: (memberId, cyberwareId) =>
    set((state) => {
      const item = CYBERWARE_ITEMS.find((c) => c.id === cyberwareId);
      const memberIdx = state.crew.members.findIndex((m) => m.id === memberId);
      if (!item || memberIdx === -1) return;

      const member = state.crew.members[memberIdx];
      const equippedIdx = member.equippedCyberware.indexOf(cyberwareId);
      if (equippedIdx === -1) return;

      member.equippedCyberware.splice(equippedIdx, 1);
      state.character.cyberwareInventory.push(cyberwareId);
      member.humanity.current = Math.min(member.humanity.max, member.humanity.current + item.humanityCost);
      state.log.entries.push({
        id: `unequip_${cyberwareId}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `LOG: ${member.name} removed ${item.name}. +${item.humanityCost} HUMANITY.`,
        timestamp: new Date().toISOString(),
        type: 'narration',
      });
    }),

  purchaseRecharge: (itemId, recipientId) =>
    set((state) => {
      const item = RECHARGE_ITEMS.find((i) => i.id === itemId);
      const memberIdx = state.crew.members.findIndex((m) => m.id === recipientId);
      if (!item || memberIdx === -1) return;
      if (state.character.credits < item.cost) return;
      const member = state.crew.members[memberIdx];
      const stat = item.restores;
      const newVal = Math.min(member[stat].current + item.amount, member[stat].max);
      if (newVal === member[stat].current) return;
      state.character.credits -= item.cost;
      state.crew.members[memberIdx][stat].current = newVal;
      const statLabel = stat === 'vitals' ? 'VIT' : 'NEU';
      state.log.entries.push({
        id: `recharge_${itemId}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `SUPPLY: ${member.name} consumed ${item.name}. +${item.amount} ${statLabel}. -${item.cost.toLocaleString()} CR.`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    }),

  dismissMember: (memberId) =>
    set((state) => {
      const idx = state.crew.members.findIndex((m) => m.id === memberId);
      if (idx === -1) return;
      const member = current(state.crew.members[idx]);
      if (member.isPlayer) return;
      state.crew.members.splice(idx, 1);
      // Only hardcoded operatives return to the available pool on dismiss.
      if (!member.quality) {
        state.crew.availableOperatives.push(member);
      }
      state.log.entries.push({
        id: `dismiss_${memberId}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `LOG: ${member.name} has been dismissed from the crew. No credit refund.`,
        timestamp: new Date().toISOString(),
        type: 'narration',
      });
    }),

  // ── Dev overrides ──────────────────────────────────────────────────────────

  devToggleSpawn: () =>
    set((state) => {
      state.crew.spawnEnabled = !state.crew.spawnEnabled;
    }),

  devClearGeneratedPool: () =>
    set((state) => {
      for (let i = state.crew.availableOperatives.length - 1; i >= 0; i--) {
        if (state.crew.availableOperatives[i].quality !== undefined) {
          state.crew.availableOperatives.splice(i, 1);
        }
      }
    }),
});
