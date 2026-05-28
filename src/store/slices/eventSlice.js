import { ACTIVITIES } from '../../data/activities';
import { applyXPToCrewMember, distributeCombatXP } from '../../data/leveling';
import { ALL_FLAVOR_EVENTS, ALL_CHOICE_EVENTS } from '../../data/events/index';
import { EVENT_COOLDOWN, FLAVOR_MIN_GAP, FLAVOR_MAX_GAP, FLAVOR_CHANCE } from '../../data/eventPacing';

const SUCCESS_RATES = { low: 0.9, moderate: 0.7, high: 0.5 };

function rollOutcome(set, item, idPrefix) {
  set((state) => {
    if (!item || item.locked) return;
    if (state.character.renown < item.renownRequired) return;

    const rate = SUCCESS_RATES[item.risk] ?? 0.7;
    const success = Math.random() < rate;

    if (success) {
      state.character.credits += item.payout;
      const player = state.crew.members.find((m) => m.isPlayer);
      if (player) applyXPToCrewMember(state, player, item.exp);
      const crewXP = Math.floor(item.exp / 2);
      if (crewXP > 0) distributeCombatXP(state, crewXP);
      state.log.entries.push({
        id: `${idPrefix}_${item.id}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `ACQUISITION: ${item.name} complete. +${item.payout.toLocaleString()} CR, +${item.exp} EXP.`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    } else {
      const halfPayout = Math.floor(item.payout / 2);
      state.character.credits += halfPayout;
      if (state.crew.members.length > 0) {
        const idx = Math.floor(Math.random() * state.crew.members.length);
        state.crew.members[idx].vitals.current = Math.max(
          0,
          state.crew.members[idx].vitals.current - 10,
        );
      }
      state.log.entries.push({
        id: `${idPrefix}_fail_${item.id}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: `CRITICAL: ${item.name} went sideways. Salvaged ${halfPayout.toLocaleString()} CR. No EXP gained.`,
        timestamp: new Date().toISOString(),
        type: 'narration',
      });
    }
  });
}

// Apply an event's effects object to state — called inside Immer set callbacks.
function applyEffects(state, effects) {
  if (!effects) return;
  if (effects.credits) {
    state.character.credits = Math.max(0, state.character.credits + effects.credits);
  }
  if (effects.morale) {
    state.character.morale = Math.min(100, Math.max(0, (state.character.morale ?? 50) + effects.morale));
  }
  if (effects.addFlags) {
    for (const flag of effects.addFlags) state.world.flags.add(flag);
  }
  if (effects.factionDelta) {
    for (const [fid, delta] of Object.entries(effects.factionDelta)) {
      state.world.factionPower[fid] = (state.world.factionPower[fid] ?? 0) + delta;
    }
  }
}

// Checks whether an event's trigger conditions are met.
function isEligible(event, state) {
  // Flavor events use top-level fields; choice events use a triggers object.
  const t = event.triggers || event;
  const requiredFlags = t.requiredFlags || [];
  const excludeFlags  = t.excludeFlags  || [];
  const minTurn       = t.minTurn       || 0;
  const requiresCrew  = t.requiresCrew  || false;

  for (const flag of requiredFlags) {
    if (!state.world.flags.has(flag)) return false;
  }
  for (const flag of excludeFlags) {
    if (state.world.flags.has(flag)) return false;
  }
  if (minTurn && state.character.turnNumber < minTurn) return false;
  if (requiresCrew && state.crew.members.length === 0) return false;
  if (state.event.firedEventIds.has(event.id)) return false;
  return true;
}

// Weighted random pick from an eligible pool.
function pickWeighted(pool, state) {
  const eligible = pool.filter((e) => isEligible(e, state));
  if (eligible.length === 0) return null;
  const total = eligible.reduce((s, e) => s + (e.weight || 1), 0);
  let roll = Math.random() * total;
  for (const e of eligible) {
    roll -= (e.weight || 1);
    if (roll <= 0) return e;
  }
  return eligible[eligible.length - 1];
}

// Look up a choice event by ID without touching Immer state.
function getChoiceEvent(id) {
  return ALL_CHOICE_EVENTS.find((e) => e.id === id) ?? null;
}

export const createEventSlice = (set) => ({
  event: {
    pending: null,
    cooldown: 0,
    activeChoiceEventId: null,      // ID of choice event currently awaiting player input
    pendingChoiceOutcome: null,      // { text, accent } — shown briefly after resolve, then cleared
    turnsSinceLastChoice: 0,
    turnsSinceLastFlavor: 0,
    firedEventIds: new Set(),
  },

  // ── Activity + contract execution (existing) ──────────────────────────────

  executeActivity: (activityId) => {
    const activity = ACTIVITIES.find((a) => a.id === activityId);
    rollOutcome(set, activity, 'act');
  },

  // ── Random event selection — called once per turn from turnPipeline ────────

  selectAndFireRandomEvent: () =>
    set((state) => {
      state.event.turnsSinceLastChoice += 1;
      state.event.turnsSinceLastFlavor += 1;

      const tsc = state.event.turnsSinceLastChoice;
      const tsf = state.event.turnsSinceLastFlavor;

      let selected = null;

      // Choice events: escalating probability after cooldown expires
      if (tsc >= EVENT_COOLDOWN) {
        const beyondCooldown = tsc - EVENT_COOLDOWN;
        const chance = Math.min(0.85, beyondCooldown * 0.2);
        if (Math.random() < chance) {
          selected = pickWeighted(ALL_CHOICE_EVENTS, state);
        }
      }

      // Flavor events: 40% chance per turn inside the min–max window
      if (!selected && tsf >= FLAVOR_MIN_GAP && tsf <= FLAVOR_MAX_GAP) {
        if (Math.random() < FLAVOR_CHANCE) {
          selected = pickWeighted(ALL_FLAVOR_EVENTS, state);
        }
      }

      // Force a flavor event if the player has gone too long without one
      if (!selected && tsf >= FLAVOR_MAX_GAP) {
        selected = pickWeighted(ALL_FLAVOR_EVENTS, state);
      }

      if (!selected) return;

      state.event.firedEventIds.add(selected.id);

      if (selected.type === 'flavor') {
        applyEffects(state, selected.effects || {});
        state.log.entries.push({
          id: `flv_${selected.id}_${Date.now()}`,
          turn: state.character.turnNumber,
          text: selected.narration,
          timestamp: new Date().toISOString(),
          type: 'ambient',
          accent: selected.accent || 'outline',
        });
        state.event.turnsSinceLastFlavor = 0;
      } else if (selected.type === 'choice') {
        // Store only the ID — never store the full event object in Immer state
        state.event.activeChoiceEventId = selected.id;
        state.event.turnsSinceLastChoice = 0;
      }
    }),

  // ── Choice event resolution ────────────────────────────────────────────────

  resolveChoiceEvent: (choiceId) =>
    set((state) => {
      const event = getChoiceEvent(state.event.activeChoiceEventId);
      if (!event) return;

      const choice = event.choices.find((c) => c.id === choiceId);
      if (!choice) return;

      let outcomeText;
      let outcomeEffects;
      let passed = true;

      if (choice.statCheck) {
        const player  = state.crew.members.find((m) => m.isPlayer);
        const statVal = player?.stats?.[choice.statCheck.stat] ?? 10;
        const roll = statVal + Math.floor(Math.random() * 6);
        passed = roll >= choice.statCheck.threshold;
        const branch = passed ? choice.pass : choice.fail;
        outcomeText    = branch.text;
        outcomeEffects = branch.effects || {};
      } else {
        outcomeText    = choice.outcome.text;
        outcomeEffects = choice.outcome.effects || {};
      }

      applyEffects(state, outcomeEffects);

      const accent = passed ? 'tertiary' : 'error';

      state.log.entries.push({
        id: `chc_${event.id}_${choiceId}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: outcomeText,
        timestamp: new Date().toISOString(),
        type: 'choice_outcome',
        accent,
      });

      // Clear the active event immediately; show a brief outcome in the modal
      state.event.activeChoiceEventId = null;
      state.event.pendingChoiceOutcome = { text: outcomeText, accent };
    }),

  dismissChoiceOutcome: () =>
    set((state) => {
      state.event.pendingChoiceOutcome = null;
    }),

  // ── Dev overrides ──────────────────────────────────────────────────────────

  devForceFlavorEvent: () =>
    set((state) => {
      const all = ALL_FLAVOR_EVENTS.filter((e) => !state.event.firedEventIds.has(e.id));
      if (all.length === 0) return;
      const event = all[Math.floor(Math.random() * all.length)];
      state.event.firedEventIds.add(event.id);
      applyEffects(state, event.effects || {});
      state.log.entries.push({
        id: `flv_dev_${event.id}_${Date.now()}`,
        turn: state.character.turnNumber,
        text: event.narration,
        timestamp: new Date().toISOString(),
        type: 'ambient',
        accent: event.accent || 'outline',
      });
      state.event.turnsSinceLastFlavor = 0;
    }),

  devForceChoiceEvent: () =>
    set((state) => {
      const all = ALL_CHOICE_EVENTS.filter((e) => !state.event.firedEventIds.has(e.id));
      if (all.length === 0) return;
      const event = all[Math.floor(Math.random() * all.length)];
      state.event.firedEventIds.add(event.id);
      state.event.activeChoiceEventId = event.id;
      state.event.turnsSinceLastChoice = 0;
    }),

  devForceEventById: (eventId) =>
    set((state) => {
      const flavor = ALL_FLAVOR_EVENTS.find((e) => e.id === eventId);
      if (flavor) {
        applyEffects(state, flavor.effects || {});
        state.log.entries.push({
          id: `flv_dev_${flavor.id}_${Date.now()}`,
          turn: state.character.turnNumber,
          text: flavor.narration,
          timestamp: new Date().toISOString(),
          type: 'ambient',
          accent: flavor.accent || 'outline',
        });
        state.event.firedEventIds.add(flavor.id);
        state.event.turnsSinceLastFlavor = 0;
        return;
      }
      const choice = ALL_CHOICE_EVENTS.find((e) => e.id === eventId);
      if (choice) {
        state.event.activeChoiceEventId = choice.id;
        state.event.firedEventIds.add(choice.id);
        state.event.turnsSinceLastChoice = 0;
      }
    }),

  devResetEventHistory: () =>
    set((state) => {
      state.event.firedEventIds = new Set();
    }),

  devSetMorale: (value) =>
    set((state) => {
      state.character.morale = Math.min(100, Math.max(0, Number(value) || 0));
    }),

  devAddMorale: (delta) =>
    set((state) => {
      state.character.morale = Math.min(100, Math.max(0, (state.character.morale ?? 50) + Number(delta)));
    }),
});
