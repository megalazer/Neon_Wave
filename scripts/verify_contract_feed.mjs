// Contract feed invariant verification.
// Simulates a playthrough with REAL contract data, rep rules, and XP thresholds
// to prove: whenever the eligible pool contains ≥1 acceptable contract,
// the feed contains ≥1 acceptable contract.
//
// Also runs the OLD _pickFeedContracts over the same states to demonstrate
// the regression (all-locked feed) that the new logic fixes.

import { LOW_CONTRACTS } from '../src/data/contracts/low.js';
import { MID_CONTRACTS } from '../src/data/contracts/mid.js';
import { HIGH_CONTRACTS } from '../src/data/contracts/high.js';
import { FACTION_CONTRACTS } from '../src/data/contracts/faction.js';
import { NEUTRAL_CONTRACTS } from '../src/data/contracts/neutral.js';
import { repTierFromValue, tierMeetsRequirement } from '../src/data/factions.js';
import { XP_THRESHOLDS, MAX_LEVEL } from '../src/data/leveling.js';
import { ADVANCED_CONTRACT_CREW_REQUIRED, getContractCrewRequirement } from '../src/data/contracts/index.js';

// ── Real data ────────────────────────────────────────────────────────────────

const ALL_CONTRACTS = [...LOW_CONTRACTS, ...MID_CONTRACTS, ...HIGH_CONTRACTS, ...FACTION_CONTRACTS, ...NEUTRAL_CONTRACTS];
const FEED_SIZE = 6;
function getContract(id) {
  return ALL_CONTRACTS.find((c) => c.id === id) ?? null;
}

// ── Rep gate (mirrors contractSlice contractRepGateMet) ──────────────────────

function contractRepGateMet(rep, contract) {
  const req = contract?.minFactionRep;
  if (!req || req === 'NEUTRAL') return true;
  if (!contract.faction) return true;
  const val = rep[contract.faction] ?? 0;
  return tierMeetsRequirement(repTierFromValue(val), req);
}

// ── Acceptable predicate (mirrors _canAccept) ────────────────────────────────

function canAccept(rep, credits, pLevel, crewCount, contract) {
  if (!contract) return false;
  if (pLevel < contract.teamLevelRequired) return false;
  if (crewCount < getContractCrewRequirement(contract)) return false;
  if (!contractRepGateMet(rep, contract)) return false;
  if (contract.deposit > 0 && credits < contract.deposit) return false;
  return true;
}

// ── NEW _pickFeedContracts (acceptable-first, neutral fallback) ───────────────

function pickFeedContracts(completed, feedItems, pLevel, credits, rep, crewCount) {
  const completedSet = new Set(completed);
  const inFeedSet    = new Set(feedItems.map((i) => i.id));

  const eligible = ALL_CONTRACTS.filter(
    (c) => !completedSet.has(c.id) && !inFeedSet.has(c.id) && pLevel >= c.teamLevelRequired,
  );

  const neutral = [];
  const acceptable = [];
  const locked = [];
  for (const c of eligible) {
    if (canAccept(rep, credits, pLevel, crewCount, c)) {
      if (c.faction) {
        acceptable.push(c);
      } else {
        neutral.push(c);
      }
    } else {
      locked.push(c);
    }
  }

  const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);
  const shuffledNeutral    = shuffle(neutral);
  const shuffledAcceptable = shuffle(acceptable);
  const shuffledLocked     = shuffle(locked);

  const picks = [];

  if (shuffledNeutral.length > 0) {
    picks.push(shuffledNeutral[0]);
  }

  for (const tier of ['LOW', 'MID', 'HIGH']) {
    if (picks.length >= FEED_SIZE) break;
    const found = shuffledAcceptable.find((c) => c.tier === tier && !picks.some((p) => p.id === c.id));
    if (found) picks.push(found);
  }

  for (const c of [...shuffledNeutral, ...shuffledAcceptable]) {
    if (picks.length >= FEED_SIZE) break;
    if (!picks.some((p) => p.id === c.id)) picks.push(c);
  }

  for (const c of shuffledLocked) {
    if (picks.length >= FEED_SIZE) break;
    if (!picks.some((p) => p.id === c.id)) picks.push(c);
  }

  return picks.map((c) => ({ id: c.id, expiresIn: 10 }));
}

// ── OLD _pickFeedContracts (baseline, for regression proof) ──────────────────

function oldPickFeedContracts(completed, feedItems, pLevel) {
  const completedSet = new Set(completed);
  const inFeedSet    = new Set(feedItems.map((i) => i.id));

  const pool = ALL_CONTRACTS.filter(
    (c) => !completedSet.has(c.id) && !inFeedSet.has(c.id) && pLevel >= c.teamLevelRequired,
  );

  const shuffled = pool.slice().sort(() => Math.random() - 0.5);

  const picks = [];
  for (const tier of ['LOW', 'MID', 'HIGH']) {
    const found = shuffled.find((c) => c.tier === tier && !picks.some((p) => p.id === c.id));
    if (found) picks.push(found);
    if (picks.length === 3) break;
  }
  for (const c of shuffled) {
    if (picks.length >= 3) break;
    if (!picks.some((p) => p.id === c.id)) picks.push(c);
  }

  return picks.map((c) => ({ id: c.id, expiresIn: 10 }));
}

// ── Feed helpers ─────────────────────────────────────────────────────────────

function feedHasAcceptable(feedItems, rep, credits, pLevel, crewCount) {
  return feedItems.some((fi) => {
    const c = getContract(fi.id);
    return canAccept(rep, credits, pLevel, crewCount, c);
  });
}

function ensureAcceptableInFeed(state) {
  if (feedHasAcceptable(state.feed, state.rep, state.credits, state.pLevel, state.crewCount)) return;
  const newItems = pickFeedContracts(state.completed, state.feed, state.pLevel, state.credits, state.rep, state.crewCount);
  const existing = state.feed;
  const toAdd = newItems.filter((n) => !existing.some((e) => e.id === n.id));
  const merged = [...existing, ...toAdd];
  merged.sort((a, b) => {
    const aOk = canAccept(state.rep, state.credits, state.pLevel, state.crewCount, getContract(a.id)) ? 1 : 0;
    const bOk = canAccept(state.rep, state.credits, state.pLevel, state.crewCount, getContract(b.id)) ? 1 : 0;
    return bOk - aOk;
  });
  state.feed = merged.slice(0, FEED_SIZE);
}

// ── XP / Level ───────────────────────────────────────────────────────────────

function getLevelFromXP(xp) {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function verifyCrewGate() {
  const low = ALL_CONTRACTS.find((c) => c.tier === 'LOW');
  const mid = ALL_CONTRACTS.find((c) => c.tier === 'MID' && !c.minFactionRep);
  const high = ALL_CONTRACTS.find((c) => c.tier === 'HIGH');
  const credits = 999999;
  const highRep = high?.faction ? { [high.faction]: 300 } : {};

  if (!low || !mid || !high) {
    console.error('BUG: Missing tier fixture for crew gate verification');
    process.exit(1);
  }
  if (getContractCrewRequirement(low) !== 1) {
    console.error(`BUG: LOW crew requirement was ${getContractCrewRequirement(low)}, expected 1`);
    process.exit(1);
  }
  if (getContractCrewRequirement(mid) !== ADVANCED_CONTRACT_CREW_REQUIRED) {
    console.error(`BUG: MID crew requirement was ${getContractCrewRequirement(mid)}, expected ${ADVANCED_CONTRACT_CREW_REQUIRED}`);
    process.exit(1);
  }
  if (getContractCrewRequirement(high) !== ADVANCED_CONTRACT_CREW_REQUIRED) {
    console.error(`BUG: HIGH crew requirement was ${getContractCrewRequirement(high)}, expected ${ADVANCED_CONTRACT_CREW_REQUIRED}`);
    process.exit(1);
  }
  if (canAccept({}, credits, MAX_LEVEL, ADVANCED_CONTRACT_CREW_REQUIRED - 1, mid)) {
    console.error('BUG: MID contract accepted below crew gate');
    process.exit(1);
  }
  if (canAccept(highRep, credits, MAX_LEVEL, ADVANCED_CONTRACT_CREW_REQUIRED - 1, high)) {
    console.error('BUG: HIGH contract accepted below crew gate');
    process.exit(1);
  }
  if (!canAccept({}, credits, MAX_LEVEL, ADVANCED_CONTRACT_CREW_REQUIRED, mid)) {
    console.error('BUG: MID contract rejected at crew gate');
    process.exit(1);
  }
  if (!canAccept(highRep, credits, MAX_LEVEL, ADVANCED_CONTRACT_CREW_REQUIRED, high)) {
    console.error('BUG: HIGH contract rejected at crew gate');
    process.exit(1);
  }
}

// ── Simulation ───────────────────────────────────────────────────────────────

function runSimulation() {
  const state = {
    completed: [],
    feed: [],
    pLevel: 1,
    credits: 0,
    crewCount: 4,
    rep: {},        // { factionId: number }
    totalXP: 0,
  };

  let actions = 0;
  let invariantsChecked = 0;
  let invariantsPassed = 0;

  // Track regression: how many times the old picker produced all-locked
  let oldRegressionCount = 0;
  const OLD_TRIALS = 100;

  while (true) {
    // Populate feed
    state.feed = pickFeedContracts(state.completed, state.feed, state.pLevel, state.credits, state.rep, state.crewCount);
    ensureAcceptableInFeed(state);

    // Check eligible pool for acceptable contracts
    const completedSet = new Set(state.completed);
    const inFeedSet    = new Set(state.feed.map((i) => i.id));
    const eligible = ALL_CONTRACTS.filter(
      (c) => !completedSet.has(c.id) && !inFeedSet.has(c.id) && state.pLevel >= c.teamLevelRequired,
    );

    const eligibleAcceptable = eligible.filter((c) =>
      canAccept(state.rep, state.credits, state.pLevel, state.crewCount, c),
    );

    // INVARIANT: if eligible pool has acceptable → feed has acceptable
    invariantsChecked++;
    const feedHasAcc = feedHasAcceptable(state.feed, state.rep, state.credits, state.pLevel, state.crewCount);

    if (eligibleAcceptable.length > 0 && !feedHasAcc) {
      console.error(`INVARIANT VIOLATION at action ${actions + 1}!`);
      console.error(`  Eligible acceptable: ${eligibleAcceptable.map(c => c.id).join(', ')}`);
      console.error(`  Feed: ${state.feed.map(f => f.id).join(', ')}`);
      console.error(`  State: L${state.pLevel} credits=${state.credits} rep=${JSON.stringify(state.rep)}`);
      process.exit(1);
    }

    if (eligibleAcceptable.length === 0 || feedHasAcc) invariantsPassed++;

    // Regression check: run OLD picker N times on this state, see if any yields all-locked
    let oldAllLocked = 0;
    for (let t = 0; t < OLD_TRIALS; t++) {
      const oldFeed = oldPickFeedContracts(state.completed, [], state.pLevel);
      const oldHasAcc = oldFeed.some((fi) => {
        const c = getContract(fi.id);
        return canAccept(state.rep, state.credits, state.pLevel, state.crewCount, c);
      });
      if (!oldHasAcc) oldAllLocked++;
    }
    if (oldAllLocked > 0) {
      oldRegressionCount++;
      if (oldRegressionCount <= 3) {
        console.log(`  [REGRESSION] OLD picker all-locked ${oldAllLocked}/${OLD_TRIALS} trials at L${state.pLevel} (action ${actions + 1})`);
      }
    }

    // Find first acceptable contract in feed to accept
    const acceptedFi = state.feed.find((fi) => {
      const c = getContract(fi.id);
      return canAccept(state.rep, state.credits, state.pLevel, state.crewCount, c);
    });

    if (!acceptedFi) {
      // No acceptable contract in feed and none in eligible pool — content exhausted
      if (eligibleAcceptable.length === 0) {
        console.log(`Content exhausted at L${state.pLevel} after ${actions} actions.`);
        break;
      }
      // Should never happen due to invariant
      console.error(`BUG: No acceptable in feed but ${eligibleAcceptable.length} in eligible pool`);
      process.exit(1);
    }

    const contract = getContract(acceptedFi.id);
    if (!contract) {
      console.error(`BUG: Feed item ${acceptedFi.id} not found`);
      process.exit(1);
    }

    // Simulate successful completion
    state.completed.push(contract.id);
    state.feed = state.feed.filter((fi) => fi.id !== contract.id);
    actions++;

    // Apply rewards
    state.credits += contract.payout;
    if (contract.deposit > 0) {
      // Deposit was paid on accept; simulate getting it back on success
      // (In reality the deposit is paid upfront, payout is net above it)
      // For simplicity we just add payout as net
    }
    state.totalXP += contract.exp;
    const newLevel = getLevelFromXP(state.totalXP);
    if (newLevel > state.pLevel) {
      state.pLevel = newLevel;
    }

    // Apply faction rep
    if (contract.faction && contract.factionRepReward) {
      state.rep[contract.faction] = (state.rep[contract.faction] ?? 0) + contract.factionRepReward;
    }

    if (actions % 20 === 0) {
      console.log(`  ... action ${actions}: L${state.pLevel} | ${state.completed.length} completed | rep ${JSON.stringify(state.rep)}`);
    }
  }

  return { actions, invariantsChecked, invariantsPassed, oldRegressionCount };
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('=== Contract Feed Invariant Verification ===\n');
console.log(`Contracts loaded: ${ALL_CONTRACTS.length} total`);
console.log(`XP thresholds: ${XP_THRESHOLDS.join(', ')}`);
console.log(`Advanced crew gate: ${ADVANCED_CONTRACT_CREW_REQUIRED} members for MID/HIGH`);
verifyCrewGate();

const result = runSimulation();

console.log(`\n=== Results ===`);
console.log(`Actions completed:        ${result.actions}`);
console.log(`Invariants checked:       ${result.invariantsChecked}`);
console.log(`Invariants passed:        ${result.invariantsPassed}`);
console.log(`Old-regression states:    ${result.oldRegressionCount}`);
console.log(`VERDICT: INVARIANT HOLDS (${result.invariantsPassed}/${result.invariantsChecked})`);
if (result.oldRegressionCount > 0) {
  console.log(`REGRESSION CONFIRMED: OLD picker produced all-locked feeds in ${result.oldRegressionCount} states.`);
}
