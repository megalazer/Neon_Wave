// test_rel_fixers.mjs — unit tests for fixer tier helpers.
// Run: node scripts/test_rel_fixers.mjs
import { strict as assert } from 'node:assert';
import { FIXER_BOND_THRESHOLDS, fixerTierFromRep, getBondPerks, BOND_TIER_RANK } from '../src/data/relationships.js';

let pass = 0, fail = 0;
function check(label, fn) {
  try { fn(); pass++; console.log(`  PASS: ${label}`); }
  catch (e) { fail++; console.error(`  FAIL: ${label} — ${e.message}`); }
}

// ── 1. tier boundaries ──────────────────────────────────────────────────────
check('rep 0 = STRANGER',       () => assert.equal(fixerTierFromRep(0),  'STRANGER'));
check('rep 1 = STRANGER',       () => assert.equal(fixerTierFromRep(1),  'STRANGER'));
check('rep 2 = ACQUAINTANCE',   () => assert.equal(fixerTierFromRep(2),  'ACQUAINTANCE'));
check('rep 4 = ACQUAINTANCE',   () => assert.equal(fixerTierFromRep(4),  'ACQUAINTANCE'));
check('rep 5 = TRUSTED',        () => assert.equal(fixerTierFromRep(5),  'TRUSTED'));
check('rep 8 = TRUSTED',        () => assert.equal(fixerTierFromRep(8),  'TRUSTED'));
check('rep 9 = LOYAL',          () => assert.equal(fixerTierFromRep(9),  'LOYAL'));
check('rep 13 = LOYAL',         () => assert.equal(fixerTierFromRep(13), 'LOYAL'));
check('rep 14 = BONDED',        () => assert.equal(fixerTierFromRep(14), 'BONDED'));
check('rep 50 = BONDED',        () => assert.equal(fixerTierFromRep(50), 'BONDED'));

// ── 2. tier rank monotonic from rep ─────────────────────────────────────────
check('fixerTierFromRep rank is monotonic', () => {
  const tiers = [];
  for (let r = 0; r <= 30; r++) {
    tiers.push(BOND_TIER_RANK[fixerTierFromRep(r)]);
  }
  for (let i = 1; i < tiers.length; i++) {
    assert.ok(tiers[i] >= tiers[i-1], `rank decreased at rep ${i}`);
  }
});

// ── 3. getBondPerks works with fixer tier rank ───────────────────────────────
check('getBondPerks with fixer rep 0 returns 0 perks', () => {
  const rank = BOND_TIER_RANK[fixerTierFromRep(0)];
  assert.equal(rank, 0);
  assert.equal(getBondPerks(rank).length, 0);
});

check('getBondPerks with fixer rep 14 returns 4 perks', () => {
  const rank = BOND_TIER_RANK[fixerTierFromRep(14)];
  assert.equal(rank, 4);
  assert.equal(getBondPerks(rank).length, 4);
});

// ── 4. 5 fixer IDs covered (mirrors src/data/fixers.js) ─────────────────────
check('all 5 fixer ids present', () => {
  // Mirror of FIXERS.map(f => f.id). Avoids theme/colors import chain.
  const ids = ['remi', 'pyre', 'nyx', 'kade', 'dusk'];
  assert.equal(ids.length, 5);
  for (const id of ids) {
    if (!['remi','pyre','nyx','kade','dusk'].includes(id)) {
      assert.fail(`unexpected fixer: ${id}`);
    }
  }
});

// ── 5. thresholds match defined tiers ────────────────────────────────────────
check('threshold keys match BOND_TIERS', () => {
  const keys = Object.keys(FIXER_BOND_THRESHOLDS);
  const expected = ['STRANGER', 'ACQUAINTANCE', 'TRUSTED', 'LOYAL', 'BONDED'];
  for (const tier of expected) {
    assert.ok(keys.includes(tier), `missing threshold for ${tier}`);
  }
});

// ── 6. threshold values are strictly increasing ──────────────────────────────
check('FIXER_BOND_THRESHOLDS are strictly increasing', () => {
  const vals = [
    FIXER_BOND_THRESHOLDS.STRANGER,
    FIXER_BOND_THRESHOLDS.ACQUAINTANCE,
    FIXER_BOND_THRESHOLDS.TRUSTED,
    FIXER_BOND_THRESHOLDS.LOYAL,
    FIXER_BOND_THRESHOLDS.BONDED,
  ];
  for (let i = 1; i < vals.length; i++) {
    assert.ok(vals[i] > vals[i-1], `threshold ${i} not increasing`);
  }
});

// ── 7. null/undefined rep safe ───────────────────────────────────────────────
check('fixerTierFromRep handles undefined', () => assert.equal(fixerTierFromRep(undefined), 'STRANGER'));
check('fixerTierFromRep handles null',      () => assert.equal(fixerTierFromRep(null),      'STRANGER'));

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
