import {
  resolveInteraction, getInteraction, bondTierFromValue, pickDialogue,
  BOND_TIER_RANK, BOND_MIN, BOND_MAX, PATH_RELATIONSHIP_MODIFIERS,
} from '../../data/relationships';
import { applyRepToDraft } from './factionSlice';
import { FACTIONS } from '../../data/factions';
import { colors } from '../../theme/colors';

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// ── Internal apply helper ────────────────────────────────────────────────────
// Mutates the immer draft: bond, morale, credits, faction bleed, toast, log.

function _applyResult(state, target, descriptor, displayName, accent, interactionId, entityId) {
  if (!descriptor.ok) return;

  target.bond = descriptor.newBond;
  target.lastBondTurn = state.character.turnNumber;

  // Morale
  const moraleDelta = descriptor.moraleDelta ?? 0;
  state.character.morale = clamp(
    (state.character.morale ?? 50) + moraleDelta,
    0,
    100,
  );

  // Credits
  const creditDelta = descriptor.creditDelta ?? 0;
  state.character.credits = Math.max(0, state.character.credits + creditDelta);

  // Faction bleed through existing rivalry system
  if (descriptor.factionId && descriptor.factionBleed > 0) {
    applyRepToDraft(state, descriptor.factionId, descriptor.factionBleed);
  }

  // Toast (reuse crewInteraction toast channel)
  const line = pickDialogue(interactionId, descriptor.intensity).replace(/\{name\}/g, displayName);
  state.world.crewInteraction.activeToast = {
    nameA: displayName,
    nameB: null,
    lines: [line],
    accent: accent || colors.primary,
  };
  state.world.crewInteraction.lastInteractionTurn = state.world.turnNumber;
  state.world.crewInteraction.cooldownTurns = 1; // short — toast auto-dismisses in 4s

  // Log
  const tag = descriptor.intensity === 'insincere'
    ? 'TENSION'
    : descriptor.intensity === 'partial'
      ? 'AWKWARD'
      : descriptor.intensity === 'rejected'
        ? 'REJECTED'
        : 'BOND';
  const deltaStr = descriptor.bondDelta >= 0
    ? `+${descriptor.bondDelta}`
    : String(descriptor.bondDelta);
  state.log.entries.push({
    id: `rel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    turn: state.character.turnNumber,
    text: `${tag}: ${displayName} — ${line} (${deltaStr} bond)`,
    timestamp: new Date().toISOString(),
    type: 'ambient',
    accent: (descriptor.intensity === 'insincere' || descriptor.intensity === 'rejected') ? 'error' : 'tertiary',
  });

  // Tier-up line
  if (descriptor.tierBefore !== descriptor.tierAfter) {
    state.log.entries.push({
      id: `rel_tier_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      turn: state.character.turnNumber,
      text: `BOND_UP: ${displayName} standing now ${descriptor.tierAfter}.`,
      timestamp: new Date().toISOString(),
      type: 'acquisition',
      accent: 'tertiary',
    });
  }

  state.relationship.lastOutcome = {
    id: entityId,
    interactionId,
    text: line,
    intensity: descriptor.intensity,
    bondDelta: descriptor.bondDelta,
    ts: Date.now(),
  };
}

// ── Slice factory ────────────────────────────────────────────────────────────

export const createRelationshipSlice = (set, get) => ({
  relationship: {
    friends: {},   // { [friendId]: { bond, lastBondTurn, met, favorUsed } }
    lastOutcome: null,
  },

  // ── Crew interactions ──────────────────────────────────────────────────────

  interactWithCrew: (memberId, interactionId, giftCategory) =>
    set((state) => {
      const member = state.crew.members.find(
        (m) => m.id === memberId && m.alive !== false && (m.vitals?.current ?? 1) > 0,
      );
      if (!member) return;

      const player = state.crew.members.find((m) => m.isPlayer);
      if (!player) return;

      // Track recent same-interaction count for diminishing returns
      if (!member.recentInteractions) member.recentInteractions = {};
      const recentSame = member.recentInteractions[interactionId] ?? 0;

      const descriptor = resolveInteraction({
        interactionId,
        entityBond: member.bond ?? 0,
        entityFaction: member.faction,
        entityLastTurn: member.lastBondTurn ?? 0,
        playerFace: player.stats?.face ?? 10,
        playerGrit: player.stats?.grit ?? 10,
        playerCredits: state.character.credits,
        path: state.character.path,
        turnNumber: state.character.turnNumber,
        recentSameInteractions: recentSame,
        giftCategory,
      });

      if (!descriptor.ok) return;

      _applyResult(state, member, descriptor, member.name, member.classColor || colors.primary, interactionId, member.id);

      // Increment recent counter on success
      member.recentInteractions[interactionId] = recentSame + 1;
    }),

  // ── Friend interactions ────────────────────────────────────────────────────

  interactWithFriend: (friendId, interactionId, giftCategory) =>
    set((state) => {
      const friend = state.relationship.friends[friendId];
      if (!friend?.met) return;

      // Friends data lives in src/data/friends.js — import at call-site
      // to avoid circular deps; resolve faction at runtime.
      const FRIENDS_DATA = require('../../data/friends').FRIENDS;
      const friendDef = FRIENDS_DATA.find((f) => f.id === friendId);
      if (!friendDef) return;

      const player = state.crew.members.find((m) => m.isPlayer);
      if (!player) return;

      if (!friend.recentInteractions) friend.recentInteractions = {};
      const recentSame = friend.recentInteractions[interactionId] ?? 0;

      const descriptor = resolveInteraction({
        interactionId,
        entityBond: friend.bond ?? 0,
        entityFaction: friendDef.faction,
        entityLastTurn: friend.lastBondTurn ?? 0,
        playerFace: player.stats?.face ?? 10,
        playerGrit: player.stats?.grit ?? 10,
        playerCredits: state.character.credits,
        path: state.character.path,
        turnNumber: state.character.turnNumber,
        recentSameInteractions: recentSame,
        giftCategory,
      });

      if (!descriptor.ok) return;

      _applyResult(state, friend, descriptor, friendDef.display || friendDef.name, friendDef.accent || colors.primary, interactionId, friendId);

      friend.recentInteractions[interactionId] = recentSame + 1;
    }),

  // ── Fixer interactions (talk + gift only; compressed scale) ────────────────

  interactWithFixer: (fixerId, interactionId, giftCategory) =>
    set((state) => {
      if (!['int_talk', 'int_gift'].includes(interactionId)) return;
      const ix = getInteraction(interactionId);
      if (!ix) return;

      if (state.character.credits < ix.creditCost) return;

      const player = state.crew.members.find((m) => m.isPlayer);
      if (!player) return;

      // Resolve outcome using the same resolver for consistency
      const curRep = state.contract.fixerRep[fixerId] ?? 0;
      const descriptor = resolveInteraction({
        interactionId,
        entityBond: curRep,            // compress: use fixerRep as bond value
        entityFaction: null,           // fixers have no faction affiliation
        entityLastTurn: 0,             // fixers have no per-turn cooldown (gate differently)
        playerFace: player.stats?.face ?? 10,
        playerGrit: player.stats?.grit ?? 10,
        playerCredits: state.character.credits,
        path: state.character.path,
        turnNumber: state.character.turnNumber,
        recentSameInteractions: 0,
        giftCategory,
      });

      if (!descriptor.ok) return;

      // Apply credits cost
      state.character.credits = Math.max(0, state.character.credits + descriptor.creditDelta);

      // Fixer rep gain: scaled down (talk=+1, gift=+2 matched)
      const gain = interactionId === 'int_gift'
        ? (descriptor.intensity === 'success' ? 2 : 1)
        : 1;
      state.contract.fixerRep[fixerId] = (curRep + gain);

      // Log
      const FIXERS_DATA = require('../../data/fixers').FIXERS;
      const fixerDef = FIXERS_DATA.find((f) => f.id === fixerId);
      const display = fixerDef?.handle || fixerId;
      const line = pickDialogue(interactionId, descriptor.intensity).replace(/\{name\}/g, display);
      state.log.entries.push({
        id: `rel_fixer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text: `FIXER: ${display} — ${line} (+${gain} fixer standing)`,
        timestamp: new Date().toISOString(),
        type: 'ambient',
        accent: fixerDef?.color || colors.outline,
      });
      state.relationship.lastOutcome = {
        id: fixerId,
        interactionId,
        text: line,
        intensity: descriptor.intensity,
        bondDelta: gain,
        ts: Date.now(),
      };
    }),

  // ── Friend favors ──────────────────────────────────────────────────────────

  useFriendFavor: (friendId) =>
    set((state) => {
      const friend = state.relationship.friends[friendId];
      if (!friend?.met || friend.favorUsed) return;
      const tier = bondTierFromValue(friend.bond ?? 0);
      const rank = BOND_TIER_RANK[tier] ?? 0;
      if (rank < 3) return; // LOYAL+

      const FRIENDS_DATA = require('../../data/friends').FRIENDS;
      const friendDef = FRIENDS_DATA.find((f) => f.id === friendId);
      if (!friendDef?.favor) return;

      const eff = friendDef.favor.effect;
      if (eff.credits) {
        state.character.credits += eff.credits;
      }
      if (eff.morale) {
        state.character.morale = clamp((state.character.morale ?? 50) + eff.morale, 0, 100);
      }
      friend.favorUsed = true;

      state.log.entries.push({
        id: `fav_${friendId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text: `FAVOR: ${friendDef.handle} — ${friendDef.favor.desc}`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
        accent: 'tertiary',
      });
    }),

  // ── Tick (decay + cooldown cleanup) ────────────────────────────────────────

  tickRelationships: () =>
    set((state) => {
      const path = state.character.path;
      const mods = PATH_RELATIONSHIP_MODIFIERS[path] || {};
      const decayAmt = mods.decayPer ?? 1;
      const turn = state.character.turnNumber;

      // Crew members
      for (const member of state.crew.members) {
        if (member.isPlayer) continue;
        if (member.alive === false || (member.vitals?.current ?? 0) <= 0) continue;
        if (!member.bond && member.bond !== 0) member.bond = 0;
        if (!member.lastBondTurn) member.lastBondTurn = 0;

        // Decay: every 5 turns of inactivity, lose decayAmt
        if (turn - member.lastBondTurn >= 5) {
          member.bond = clamp((member.bond ?? 0) - Math.ceil(decayAmt), BOND_MIN, BOND_MAX);
          member.lastBondTurn += 5; // rate-limit
        }

        // Decay recentInteraction counters
        if (member.recentInteractions) {
          for (const key of Object.keys(member.recentInteractions)) {
            member.recentInteractions[key] = Math.max(0, (member.recentInteractions[key] ?? 0) - 1);
          }
        }
      }

      // Friends
      for (const [fid, friend] of Object.entries(state.relationship.friends)) {
        if (!friend?.met) continue;
        if (!friend.bond && friend.bond !== 0) friend.bond = 0;
        if (!friend.lastBondTurn) friend.lastBondTurn = 0;

        if (turn - friend.lastBondTurn >= 5) {
          friend.bond = clamp((friend.bond ?? 0) - Math.ceil(decayAmt), BOND_MIN, BOND_MAX);
          friend.lastBondTurn += 5;
        }

        if (friend.recentInteractions) {
          for (const key of Object.keys(friend.recentInteractions)) {
            friend.recentInteractions[key] = Math.max(0, (friend.recentInteractions[key] ?? 0) - 1);
          }
        }
      }
    }),

  // ── Reset ──────────────────────────────────────────────────────────────────

  resetRelationships: () =>
    set((state) => {
      state.relationship.friends = {};
      state.relationship.lastOutcome = null;
    }),

  // ── Dev ────────────────────────────────────────────────────────────────────

  devSetCrewBond: (memberId, value) =>
    set((state) => {
      const member = state.crew.members.find((m) => m.id === memberId);
      if (!member) return;
      member.bond = clamp(Math.round(Number(value) || 0), BOND_MIN, BOND_MAX);
    }),

  devSetFriendBond: (friendId, value) =>
    set((state) => {
      if (!state.relationship.friends[friendId]) return;
      state.relationship.friends[friendId].bond = clamp(Math.round(Number(value) || 0), BOND_MIN, BOND_MAX);
    }),
});
