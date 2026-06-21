// Contract stat-check tier verification.
// Ensures contract thresholds preserve the intended low/mid/high specialization gaps.

import { LOW_CONTRACTS } from '../src/data/contracts/low.js';
import { MID_CONTRACTS } from '../src/data/contracts/mid.js';
import { HIGH_CONTRACTS } from '../src/data/contracts/high.js';
import { FACTION_CONTRACTS } from '../src/data/contracts/faction.js';
import { NEUTRAL_CONTRACTS } from '../src/data/contracts/neutral.js';
import { getEffectiveStat } from '../src/data/cyberware.js';

const ALL_CONTRACTS = [
  ...LOW_CONTRACTS,
  ...MID_CONTRACTS,
  ...HIGH_CONTRACTS,
  ...FACTION_CONTRACTS,
  ...NEUTRAL_CONTRACTS,
];

const TIER_BANDS = {
  LOW:  { min: 10, max: 12 },
  MID:  { min: 14, max: 16 },
  HIGH: { min: 18, max: 20 },
};

function passChance(stat, threshold) {
  const winningRolls = Math.max(0, Math.min(6, stat + 6 - threshold));
  return winningRolls / 6;
}

function collectChecks() {
  const checks = [];
  for (const contract of ALL_CONTRACTS) {
    for (const stage of contract.stages || []) {
      for (const choice of stage.choices || []) {
        if (!choice.statCheck) continue;
        checks.push({
          contractId: contract.id,
          tier: contract.tier,
          stage: stage.title || stage.label || stage.id,
          choiceId: choice.id,
          stat: choice.statCheck.stat,
          threshold: choice.statCheck.threshold,
        });
      }
    }
  }
  return checks;
}

const checks = collectChecks();
const failures = [];
const distribution = {};

for (const check of checks) {
  const band = TIER_BANDS[check.tier];
  if (!band) {
    failures.push(`${check.contractId}/${check.choiceId}: unknown tier ${check.tier}`);
    continue;
  }

  distribution[check.tier] ||= {};
  distribution[check.tier][check.threshold] = (distribution[check.tier][check.threshold] || 0) + 1;

  if (check.threshold < band.min || check.threshold > band.max) {
    failures.push(
      `${check.contractId}/${check.choiceId}: ${check.tier} ${check.stat} threshold ${check.threshold} outside ${band.min}-${band.max}`,
    );
  }
}

const gearedSpecialist = {
  stats: { wire: 15 },
  equippedCyberware: ['cyb_neural_link_mk4'],
};
const cappedSpecialist = {
  stats: { edge: 15 },
  equippedCyberware: ['cyb_sandevistan_apex'],
};

if (getEffectiveStat(gearedSpecialist, 'wire') !== 18) {
  failures.push('effective stat helper failed to include equipped cyberware bonuses');
}
if (getEffectiveStat(cappedSpecialist, 'edge') !== 20) {
  failures.push('effective stat helper failed to cap effective stats at 20');
}

console.log('=== Contract Threshold Verification ===\n');
console.log(`Contracts loaded: ${ALL_CONTRACTS.length}`);
console.log(`Stat checks:       ${checks.length}`);
console.log('Distribution:', JSON.stringify(distribution));
console.log('\nRepresentative pass chances:');
console.log(`  LOW  threshold 12, stat 10: ${(passChance(10, 12) * 100).toFixed(1)}%`);
console.log(`  MID  threshold 14, stat 10: ${(passChance(10, 14) * 100).toFixed(1)}%`);
console.log(`  MID  threshold 14, stat 13: ${(passChance(13, 14) * 100).toFixed(1)}%`);
console.log(`  HIGH threshold 18, stat 15: ${(passChance(15, 18) * 100).toFixed(1)}%`);
console.log(`  HIGH threshold 18, stat 18: ${(passChance(18, 18) * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.error('\nFAILURES:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('\nVERDICT: CONTRACT STAT THRESHOLDS HOLD');
