import { LOW_CONTRACTS } from './low.js';
import { MID_CONTRACTS } from './mid.js';
import { HIGH_CONTRACTS } from './high.js';
import { FACTION_CONTRACTS } from './faction.js';
import { NEUTRAL_CONTRACTS } from './neutral.js';

export { LOW_CONTRACTS, MID_CONTRACTS, HIGH_CONTRACTS, FACTION_CONTRACTS, NEUTRAL_CONTRACTS };

export const ADVANCED_CONTRACT_CREW_REQUIRED = 4;

export function getContractCrewRequirement(contract) {
  return contract?.tier === 'MID' || contract?.tier === 'HIGH'
    ? ADVANCED_CONTRACT_CREW_REQUIRED
    : 1;
}

export function contractCrewGateMet(members, contract) {
  return (members?.length ?? 0) >= getContractCrewRequirement(contract);
}

export const ALL_CONTRACTS = [
  ...LOW_CONTRACTS,
  ...MID_CONTRACTS,
  ...HIGH_CONTRACTS,
  ...FACTION_CONTRACTS,
  ...NEUTRAL_CONTRACTS,
];

export function getContract(id) {
  return ALL_CONTRACTS.find((c) => c.id === id) ?? null;
}
