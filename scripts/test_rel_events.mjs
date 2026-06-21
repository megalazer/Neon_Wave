// test_rel_events.mjs — unit tests for relationship event pools.
// Run: node scripts/test_rel_events.mjs
import { strict as assert } from 'node:assert';
import { REL_FLAVOR_EVENTS, REL_CHOICE_EVENTS } from '../src/data/events/relationships.js';
import { bondTierFromValue } from '../src/data/relationships.js';

let pass = 0, fail = 0;
function check(label, fn) {
  try { fn(); pass++; console.log(`  PASS: ${label}`); }
  catch (e) { fail++; console.error(`  FAIL: ${label} — ${e.message}`); }
}

// ── Shared isEligible logic (mirrors eventSlice, only the gates we test) ────
function mockState(overrides = {}) {
  return {
    character: { turnNumber: 10, credits: 1000, path: 'street_kid' },
    crew: { members: [] },
    world: { flags: new Set() },
    event: { firedEventIds: new Set() },
    relationship: { friends: {} },
    faction: { rep: {} },
    ...overrides,
  };
}

function isEligibleLocal(event, state) {
  const t = event.triggers || event;

  // Exclude flags
  for (const f of (t.excludeFlags || [])) {
    if (state.world.flags.has(f)) return false;
  }
  // Required flags
  for (const f of (t.requiredFlags || [])) {
    if (!state.world.flags.has(f)) return false;
  }
  // Min turn
  if (t.minTurn && state.character.turnNumber < t.minTurn) return false;

  // requiresClass
  if (t.requiresClass) {
    const classes = Array.isArray(t.requiresClass) ? t.requiresClass : [t.requiresClass];
    const lower = classes.map((c) => c.toLowerCase());
    const has = state.crew.members.some(
      (m) => m.alive !== false && (m.vitals?.current ?? 1) > 0 && lower.includes((m.class || '').toLowerCase()),
    );
    if (!has) return false;
  }

  // crewBondAtMost / crewBondAtLeast
  if (t.crewBondAtMost != null || t.crewBondAtLeast != null) {
    const living = state.crew.members.filter(
      (m) => m.alive !== false && (m.vitals?.current ?? 1) > 0,
    );
    const anyMatch = living.some((m) => {
      const b = m.bond ?? 0;
      if (t.crewBondAtMost != null && b > t.crewBondAtMost) return false;
      if (t.crewBondAtLeast != null && b < t.crewBondAtLeast) return false;
      return true;
    });
    if (!anyMatch) return false;
  }

  // Friend gates
  if (t.requiresFriendMet) {
    const f = state.relationship?.friends?.[t.requiresFriendMet];
    if (!f?.met) return false;
    const fb = f.bond ?? 0;
    if (t.friendBondAtLeast != null && fb < t.friendBondAtLeast) return false;
    if (t.friendBondAtMost != null && fb > t.friendBondAtMost) return false;
  }

  // Already fired
  if (state.event.firedEventIds.has(event.id)) return false;
  return true;
}

// ── Tests ────────────────────────────────────────────────────────────────────

// 1. chc_rel_portforward eligible with Netrunner + flag_recent_equip + low bond
check('portforward eligible with Netrunner and recent equip', () => {
  const event = REL_CHOICE_EVENTS.find(e => e.id === 'chc_rel_portforward');
  const state = mockState({
    character: { turnNumber: 10 },
    crew: { members: [
      { isPlayer: true, class: 'Fixer', vitals: { current: 50, max: 50 }, alive: true },
      { class: 'Netrunner', vitals: { current: 50, max: 50 }, alive: true, bond: 30 },
    ]},
    world: { flags: new Set(['flag_recent_equip']) },
  });
  assert.ok(isEligibleLocal(event, state));
});

// 2. portforward ineligible: no flag_recent_equip
check('portforward ineligible without equip flag', () => {
  const event = REL_CHOICE_EVENTS.find(e => e.id === 'chc_rel_portforward');
  const state = mockState({
    character: { turnNumber: 10 },
    crew: { members: [
      { class: 'Netrunner', vitals: { current: 50, max: 50 }, alive: true, bond: 30 },
    ]},
    world: { flags: new Set() },
  });
  assert.equal(isEligibleLocal(event, state), false);
});

// 3. portforward ineligible: bond too high (>59)
check('portforward ineligible when bond > 59', () => {
  const event = REL_CHOICE_EVENTS.find(e => e.id === 'chc_rel_portforward');
  const state = mockState({
    character: { turnNumber: 10 },
    crew: { members: [
      { class: 'Netrunner', vitals: { current: 50, max: 50 }, alive: true, bond: 70 },
    ]},
    world: { flags: new Set(['flag_recent_equip']) },
  });
  assert.equal(isEligibleLocal(event, state), false);
});

// 4. portforward ineligible: no Netrunner
check('portforward ineligible without Netrunner', () => {
  const event = REL_CHOICE_EVENTS.find(e => e.id === 'chc_rel_portforward');
  const state = mockState({
    character: { turnNumber: 10 },
    crew: { members: [
      { class: 'Street Samurai', vitals: { current: 50, max: 50 }, alive: true, bond: 30 },
    ]},
    world: { flags: new Set(['flag_recent_equip']) },
  });
  assert.equal(isEligibleLocal(event, state), false);
});

// 5. portforward ineligible: turn < minTurn
check('portforward ineligible before minTurn', () => {
  const event = REL_CHOICE_EVENTS.find(e => e.id === 'chc_rel_portforward');
  const state = mockState({
    character: { turnNumber: 3 },
    crew: { members: [
      { class: 'Netrunner', vitals: { current: 50, max: 50 }, alive: true, bond: 30 },
    ]},
    world: { flags: new Set(['flag_recent_equip']) },
  });
  assert.equal(isEligibleLocal(event, state), false);
});

// 6. flv_rel_rico_choom eligible when friend met
check('rico choom eligible when friend met', () => {
  const event = REL_FLAVOR_EVENTS.find(e => e.id === 'flv_rel_rico_choom');
  const state = mockState({
    character: { turnNumber: 10 },
    relationship: { friends: { frn_rico: { met: true, bond: 30 } } },
  });
  assert.ok(isEligibleLocal(event, state));
});

// 7. flv_rel_rico_choom ineligible when friend not met
check('rico choom ineligible when friend not met', () => {
  const event = REL_FLAVOR_EVENTS.find(e => e.id === 'flv_rel_rico_choom');
  const state = mockState({
    character: { turnNumber: 10 },
    relationship: { friends: {} },
  });
  assert.equal(isEligibleLocal(event, state), false);
});

// 8. all flavor events have unique ids
check('all rel flavor events have unique ids', () => {
  const ids = REL_FLAVOR_EVENTS.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

// 9. all choice events have unique ids
check('all rel choice events have unique ids', () => {
  const ids = REL_CHOICE_EVENTS.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

// 10. every choice event choice has outcome or pass/fail
check('every choice has outcome or pass/fail', () => {
  for (const event of REL_CHOICE_EVENTS) {
    assert.equal(event.type, 'choice');
    assert.ok(event.choices.length > 0);
    for (const ch of event.choices) {
      const hasOutcome = !!ch.outcome;
      const hasStatCheck = !!(ch.statCheck && ch.pass && ch.fail);
      assert.ok(hasOutcome || hasStatCheck, `${event.id}/${ch.id} missing outcome or pass/fail`);
    }
  }
});

// 11. applying bondDelta effect changes tier
check('applying bondDelta changes bondTierFromValue', () => {
  const before = 18;
  const amount = 6;
  const after = before + amount;
  assert.equal(bondTierFromValue(before), 'STRANGER');
  assert.equal(bondTierFromValue(after), 'ACQUAINTANCE');
});

// 12. chc_rel_favor_rico eligible with high friend bond
check('favor rico eligible with bond≥60', () => {
  const event = REL_CHOICE_EVENTS.find(e => e.id === 'chc_rel_favor_rico');
  const state = mockState({
    character: { turnNumber: 12 },
    relationship: { friends: { frn_rico: { met: true, bond: 65 } } },
  });
  assert.ok(isEligibleLocal(event, state));
});

// 13. chc_rel_favor_rico ineligible when bond<60
check('favor rico ineligible with bond<60', () => {
  const event = REL_CHOICE_EVENTS.find(e => e.id === 'chc_rel_favor_rico');
  const state = mockState({
    character: { turnNumber: 12 },
    relationship: { friends: { frn_rico: { met: true, bond: 50 } } },
  });
  assert.equal(isEligibleLocal(event, state), false);
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
