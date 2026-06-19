// test_rel_friends.mjs — unit tests for friends data and helpers.
// Run: node scripts/test_rel_friends.mjs
import { strict as assert } from 'node:assert';
import { FRIENDS, getFriend, getFriendForPath } from '../src/data/friends.js';
import { GIFT_CATEGORIES } from '../src/data/relationships.js';
import { FACTION_IDS } from '../src/data/factions.js';

let pass = 0, fail = 0;
function check(label, fn) {
  try { fn(); pass++; console.log(`  PASS: ${label}`); }
  catch (e) { fail++; console.error(`  FAIL: ${label} — ${e.message}`); }
}

// ── 1. exactly 3 friends ────────────────────────────────────────────────────
check('exactly 3 friends', () => {
  assert.equal(FRIENDS.length, 3);
});

// ── 2. one per path ─────────────────────────────────────────────────────────
check('one friend per life path', () => {
  for (const path of ['corpo', 'street_kid', 'nomad']) {
    const friends = FRIENDS.filter(f => f.path === path);
    assert.equal(friends.length, 1, `${path} has ${friends.length} friends, expected 1`);
  }
});

// ── 3. getFriendForPath returns correct friend ───────────────────────────────
check('getFriendForPath returns correct friend', () => {
  assert.equal(getFriendForPath('corpo').id, 'frn_viv');
  assert.equal(getFriendForPath('street_kid').id, 'frn_rico');
  assert.equal(getFriendForPath('nomad').id, 'frn_sol');
  assert.equal(getFriendForPath('unknown'), null);
});

// ── 4. all friends have favor with credits>0 ─────────────────────────────────
check('all favors grant credits > 0', () => {
  for (const f of FRIENDS) {
    assert.ok(f.favor, `${f.id} missing favor`);
    assert.ok(f.favor.effect.credits > 0, `${f.id} favor credits <= 0`);
  }
});

// ── 5. all friends have non-empty intro narration ────────────────────────────
check('all friends have introNarration', () => {
  for (const f of FRIENDS) {
    assert.ok(f.introNarration.length > 10, `${f.id} intro too short`);
  }
});

// ── 6. all friends have valid giftTaste ──────────────────────────────────────
check('all giftTastes are valid categories', () => {
  for (const f of FRIENDS) {
    assert.ok(GIFT_CATEGORIES.includes(f.giftTaste), `${f.id} has invalid taste: ${f.giftTaste}`);
  }
});

// ── 7. all friends have valid faction ────────────────────────────────────────
check('all friends have valid faction id', () => {
  for (const f of FRIENDS) {
    assert.ok(FACTION_IDS.includes(f.faction), `${f.id} has invalid faction: ${f.faction}`);
  }
});

// ── 8. all friends have unique ids ───────────────────────────────────────────
check('all friend ids are unique', () => {
  const ids = FRIENDS.map(f => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

// ── 9. getFriend returns correct friend ──────────────────────────────────────
check('getFriend returns correct friend', () => {
  assert.equal(getFriend('frn_rico').name, 'Rico_Calavera');
  assert.equal(getFriend('frn_viv').name, 'Vivienne_Osei');
  assert.equal(getFriend('frn_sol').name, 'Sol_Mbeki');
  assert.equal(getFriend('nonexistent'), null);
});

// ── 10. all id prefixes are frn_ ─────────────────────────────────────────────
check('all friend ids have frn_ prefix', () => {
  for (const f of FRIENDS) {
    assert.ok(f.id.startsWith('frn_'), `${f.id} missing frn_ prefix`);
  }
});

// ── 11. all handles are UPPERCASE_SNAKE ──────────────────────────────────────
check('all handles are UPPERCASE', () => {
  for (const f of FRIENDS) {
    assert.ok(/^[A-Z_]+$/.test(f.handle), `${f.handle} not UPPERCASE_SNAKE`);
  }
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
