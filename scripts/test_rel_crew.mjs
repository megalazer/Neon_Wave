// test_rel_crew.mjs — unit tests for resolveInteraction, bondTierFromValue, getBondPerks.
// Run: node scripts/test_rel_crew.mjs
import { strict as assert } from 'node:assert';
import {
  resolveInteraction, bondTierFromValue, getBondPerks, pickDialogue,
  INTERACTIONS, PATH_RELATIONSHIP_MODIFIERS, BOND_TIER_RANK, BOND_MIN, BOND_MAX,
} from '../src/data/relationships.js';

let pass = 0, fail = 0;
function check(label, fn) {
  try { fn(); pass++; console.log(`  PASS: ${label}`); }
  catch (e) { fail++; console.error(`  FAIL: ${label} — ${e.message}`); }
}

// ── Deterministic rng ──
const rngMid  = () => 0.5;   // floor(3.0) = 3
const rngLow  = () => 0.0;   // floor(0.0) = 0
const rngHigh = () => 0.99;  // floor(5.94) = 5

function ctx(overrides = {}) {
  return {
    interactionId: 'int_talk',
    entityBond: 0,
    entityFaction: 'fac_undertow',
    entityLastTurn: 0,
    playerFace: 13,
    playerGrit: 12,
    playerCredits: 5000,
    path: 'street_kid',
    turnNumber: 5,
    recentSameInteractions: 0,
    giftCategory: null,
    rng: rngMid,
    ...overrides,
  };
}

// ── 1. talk on STRANGER succeeds ─────────────────────────────────────────────
check('talk on STRANGER succeeds', () => {
  const res = resolveInteraction(ctx());
  assert.ok(res.ok);
  assert.ok(res.bondDelta >= 3);
  assert.equal(res.tierBefore, 'STRANGER');
  assert.equal(res.tierAfter, 'STRANGER');
  assert.equal(res.intensity, 'success');
});

// ── 2. cooldown blocks repeat same turn ──────────────────────────────────────
check('cooldown blocks repeat', () => {
  const res = resolveInteraction(ctx({ turnNumber: 5, entityLastTurn: 5 }));
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'cooldown');
});

// ── 3. matched gift → 1.5x = 12 bond ────────────────────────────────────────
check('matched gift gives 12 bond (8×1.5)', () => {
  const res = resolveInteraction(ctx({
    interactionId: 'int_gift',
    entityFaction: 'fac_undertow',
    giftCategory: 'street',
    playerCredits: 500,
  }));
  assert.ok(res.ok);
  assert.equal(res.bondDelta, 12);
  assert.equal(res.creditDelta, -250);
});

// ── 4. mismatched gift → 0.75x = 6 bond ─────────────────────────────────────
check('mismatched gift gives 6 bond (8×0.75)', () => {
  const res = resolveInteraction(ctx({
    interactionId: 'int_gift',
    entityFaction: 'fac_undertow',
    giftCategory: 'tech',
    playerCredits: 500,
  }));
  assert.ok(res.ok);
  assert.equal(res.bondDelta, 6);
});

// ── 5. gift blocked by low credits ───────────────────────────────────────────
check('gift blocked by low credits', () => {
  const res = resolveInteraction(ctx({
    interactionId: 'int_gift',
    playerCredits: 100,
    giftCategory: 'street',
  }));
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'credits');
});

// ── 6. compliment ×4 → insincere ─────────────────────────────────────────────
check('compliment spam → insincere', () => {
  const res = resolveInteraction(ctx({
    interactionId: 'int_compliment',
    recentSameInteractions: 3,
  }));
  assert.ok(res.ok);
  assert.equal(res.intensity, 'insincere');
  assert.ok(res.moraleDelta < 0);
  assert.ok(res.bondDelta <= 1); // 4 * 0.25 = 1
});

// ── 7. confide at bond 30 (STRANGER) → locked ────────────────────────────────
check('confide locked below TRUSTED', () => {
  const res = resolveInteraction(ctx({
    interactionId: 'int_confide',
    entityBond: 30,
    turnNumber: 20,
    entityLastTurn: 0,
  }));
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'locked');
});

// ── 8. confide at bond 40 (TRUSTED) → ok ─────────────────────────────────────
check('confide ok at TRUSTED', () => {
  const res = resolveInteraction(ctx({
    interactionId: 'int_confide',
    entityBond: 40,
    turnNumber: 20,
    entityLastTurn: 0,
  }));
  assert.ok(res.ok);
});

// ── 9. tier transition STRANGER→ACQUAINTANCE ─────────────────────────────────
check('tier transition STRANGER→ACQUAINTANCE', () => {
  const res = resolveInteraction(ctx({
    entityBond: 18,
    rng: rngHigh,
  }));
  assert.ok(res.ok);
  assert.equal(res.tierBefore, 'STRANGER');
  assert.ok(res.newBond >= 20);
  assert.equal(res.tierAfter, 'ACQUAINTANCE');
});

// ── 10. getBondPerks monotonic ───────────────────────────────────────────────
check('getBondPerks monotonic growth', () => {
  assert.equal(getBondPerks(0).length, 0);
  assert.equal(getBondPerks(1).length, 1);
  assert.equal(getBondPerks(2).length, 2);
  assert.equal(getBondPerks(3).length, 3);
  assert.equal(getBondPerks(4).length, 4);
  assert.ok(getBondPerks(4).find(p => p.tag === '[BONDED]'));
  assert.equal(getBondPerks(-1).length, 0);
});

// ── 11. bond clamps at 100 ───────────────────────────────────────────────────
check('bond clamps at 100', () => {
  const res = resolveInteraction(ctx({
    interactionId: 'int_gift',
    entityBond: 95,
    entityFaction: 'fac_undertow',
    giftCategory: 'street',
    playerCredits: 500,
  }));
  assert.ok(res.ok);
  assert.equal(res.newBond, 100);
});

// ── 12. bond floors at 0 ─────────────────────────────────────────────────────
check('bond floors at 0', () => {
  const res = resolveInteraction(ctx({
    interactionId: 'int_compliment',
    entityBond: 1,
    recentSameInteractions: 3,
    rng: rngLow,
  }));
  assert.ok(res.ok);
  assert.ok(res.newBond >= 0);
});

// ── 13. low face + bad roll → partial ────────────────────────────────────────
check('low face stat + bad roll → partial', () => {
  const res = resolveInteraction(ctx({
    playerFace: 5,
    rng: rngLow,
  }));
  assert.ok(res.ok);
  assert.equal(res.intensity, 'partial');
  assert.ok(res.bondDelta < 3);
});

// ── 14. corpo interactBonus helps ────────────────────────────────────────────
check('corpo interactBonus improves roll', () => {
  const res = resolveInteraction(ctx({
    path: 'corpo',
    playerFace: 7,
  }));
  assert.ok(res.ok);
  assert.equal(res.intensity, 'success');
});

// ── 15. share drink applies morale ───────────────────────────────────────────
check('share drink boosts morale', () => {
  const res = resolveInteraction(ctx({
    interactionId: 'int_drink',
    playerCredits: 200,
    rng: rngHigh,
  }));
  assert.ok(res.ok);
  assert.equal(res.moraleDelta, 3);
  assert.equal(res.creditDelta, -50);
});

// ── 16. resolver never returns negative bondDelta ─────────────────────────────
check('resolver never returns negative bondDelta', () => {
  const res = resolveInteraction(ctx({ rng: rngLow }));
  assert.ok(res.ok);
  assert.ok(res.bondDelta >= 0);
});

// ── 17. unknown interaction → fail ───────────────────────────────────────────
check('unknown interaction returns not ok', () => {
  const res = resolveInteraction(ctx({ interactionId: 'nonexistent' }));
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'unknown');
});

// ── 18. insult success → bondDelta 2, intensity success ───────────────────────
check('insult success → bondDelta 2, intensity success', () => {
  const res = resolveInteraction(ctx({ interactionId: 'int_insult', rng: rngHigh }));
  assert.ok(res.ok);
  assert.equal(res.bondDelta, 2);
  assert.equal(res.intensity, 'success');
  assert.equal(res.moraleDelta, 1);
});

// ── 19. insult fail → bondDelta -6, intensity rejected ────────────────────────
check('insult fail → bondDelta -6, intensity rejected', () => {
  const res = resolveInteraction(ctx({ interactionId: 'int_insult', playerFace: 1, rng: rngLow }));
  assert.ok(res.ok);
  assert.equal(res.bondDelta, -6);
  assert.equal(res.intensity, 'rejected');
  assert.equal(res.moraleDelta, -2);
});

// ── 20. insult fail floors bond at 0 ──────────────────────────────────────────
check('insult fail floors bond at 0', () => {
  const res = resolveInteraction(ctx({ interactionId: 'int_insult', entityBond: 3, playerFace: 1, rng: rngLow }));
  assert.ok(res.ok);
  assert.equal(res.newBond, 0);
});

// ── 21. seduce locked below ACQUAINTANCE ──────────────────────────────────────
check('seduce locked below ACQUAINTANCE', () => {
  const res = resolveInteraction(ctx({ interactionId: 'int_seduce', entityBond: 10, turnNumber: 20, entityLastTurn: 0 }));
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'locked');
});

// ── 22. seduce success → bondDelta 10, intensity success, moraleDelta 3 ───────
check('seduce success → bondDelta 10, intensity success', () => {
  const res = resolveInteraction(ctx({ interactionId: 'int_seduce', entityBond: 25, turnNumber: 20, entityLastTurn: 0, rng: rngHigh }));
  assert.ok(res.ok);
  assert.equal(res.bondDelta, 10);
  assert.equal(res.intensity, 'success');
  assert.equal(res.moraleDelta, 3);
});

// ── 23. seduce fail → bondDelta -5, intensity rejected ────────────────────────
check('seduce fail → bondDelta -5, intensity rejected', () => {
  const res = resolveInteraction(ctx({ interactionId: 'int_seduce', entityBond: 25, turnNumber: 20, entityLastTurn: 0, playerFace: 1, rng: rngLow }));
  assert.ok(res.ok);
  assert.equal(res.bondDelta, -5);
  assert.equal(res.intensity, 'rejected');
});

// ── 24. insult grants no faction rep on fail ──────────────────────────────────
check('insult fail grants no faction rep', () => {
  const res = resolveInteraction(ctx({ interactionId: 'int_insult', playerFace: 1, rng: rngLow }));
  assert.ok(res.ok);
  assert.equal(res.factionBleed, 0);
});

// ── 25. insult success grants no faction rep (field is 0) ─────────────────────
check('insult success grants no faction rep', () => {
  const res = resolveInteraction(ctx({ interactionId: 'int_insult', rng: rngHigh }));
  assert.ok(res.ok);
  assert.equal(res.factionBleed, 0);
});

// ── 26. pickDialogue returns {name} template ──────────────────────────────────
check("pickDialogue returns {name} template", () => {
  const line = pickDialogue('int_insult', 'rejected', () => 0);
  assert.ok(line.includes('{name}'));
});

// ── 27. pickDialogue falls back to success pool ───────────────────────────────
check('pickDialogue falls back to success pool', () => {
  const line = pickDialogue('int_gift', 'partial', () => 0);
  assert.equal(typeof line, 'string');
  assert.ok(line.length > 0);
});

// ── 28. pickDialogue unknown → GENERIC_DIALOGUE ──────────────────────────────
check('pickDialogue unknown → GENERIC_DIALOGUE', () => {
  const line = pickDialogue('nope', 'success', () => 0);
  assert.equal(line, 'The gesture lands.');
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
