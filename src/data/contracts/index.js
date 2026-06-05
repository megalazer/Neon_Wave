import { LOW_CONTRACTS } from './low';
import { MID_CONTRACTS } from './mid';
import { HIGH_CONTRACTS } from './high';
import { FACTION_CONTRACTS } from './faction';

export { LOW_CONTRACTS, MID_CONTRACTS, HIGH_CONTRACTS, FACTION_CONTRACTS };

export const ALL_CONTRACTS = [...LOW_CONTRACTS, ...MID_CONTRACTS, ...HIGH_CONTRACTS, ...FACTION_CONTRACTS];

export function getContract(id) {
  return ALL_CONTRACTS.find((c) => c.id === id) ?? null;
}
