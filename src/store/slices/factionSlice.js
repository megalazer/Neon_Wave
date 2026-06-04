import {
  FACTIONS, FACTION_IDS, repTierFromValue, resolveLegacyFaction, REP_MIN, REP_MAX,
} from '../../data/factions';

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function freshRep() {
  const rep = {};
  for (const id of FACTION_IDS) rep[id] = 0;
  return rep;
}

// Draft-mutating rep apply with rivalry bleed. Call inside any slice's set()
// callback (e.g. event/contract resolution) so rep moves stay consistent.
// Accepts legacy labels and resolves them to canonical ids.
export function applyRepToDraft(state, factionLabel, amount) {
  const factionId = resolveLegacyFaction(factionLabel);
  if (!FACTIONS[factionId] || !amount) return;
  if (!state.faction || !state.faction.rep) return;

  const cur = state.faction.rep[factionId] ?? 0;
  state.faction.rep[factionId] = clamp(cur + amount, REP_MIN, REP_MAX);

  if (amount > 0) {
    const rivals = FACTIONS[factionId]?.rivals || [];
    for (const rid of rivals) {
      const rcur = state.faction.rep[rid] ?? 0;
      state.faction.rep[rid] = clamp(rcur - Math.ceil(amount * 0.5), REP_MIN, REP_MAX);
    }
  }
}

export const createFactionSlice = (set, get) => ({
  // Run-scoped: resets on flatline (handled in devSoftReset/devHardReset).
  faction: {
    rep: freshRep(),
  },

  adjustFactionRep: (factionId, amount) =>
    set((state) => { applyRepToDraft(state, factionId, amount); }),

  // Pure read — returns the tier label for a faction's current rep.
  getRepTier: (factionId) => {
    const val = get().faction.rep[factionId] ?? 0;
    return repTierFromValue(val);
  },

  resetFactionRep: () =>
    set((state) => { state.faction.rep = freshRep(); }),

  // ── Dev ────────────────────────────────────────────────────────────────────

  devSetFactionRep: (factionId, value) =>
    set((state) => {
      if (!FACTIONS[factionId]) return;
      state.faction.rep[factionId] = clamp(Math.round(Number(value) || 0), REP_MIN, REP_MAX);
    }),
});
