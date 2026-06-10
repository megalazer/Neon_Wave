// ── Contract Quest Reward Pools ─────────────────────────────────────────────────
// These pools are used for quest-driven cyberware drops when a contract
// carries a `cyberwareReward` field. Quest rewards bypass vendor faction gates
// — even faction-gated items (Slipstream Apex, Piston Arms, Razor Arms)
// can drop here regardless of the player's current standing.

export const CYBERWARE_REWARD_POOLS = {
  LOW: [
    { id: 'cyb_bio_monitor_x10',  weight: 4 },
    { id: 'cyb_skill_chip_crawl', weight: 4 },
    { id: 'starter_neural_link',  weight: 2 },
    { id: 'starter_optic_basic',  weight: 2 },
  ],
  MID: [
    { id: 'cyb_kiroshi_optic_v3',  weight: 3 },
    { id: 'cyb_reflex_booster',   weight: 3 },
    { id: 'cyb_neural_link_mk4',  weight: 2 },
    { id: 'cyb_bio_monitor_x10',  weight: 1 },
    { id: 'cyb_skill_chip_crawl', weight: 1 },
  ],
  HIGH: [
    { id: 'cyb_sandevistan_apex', weight: 2 },
    { id: 'cyb_gorilla_arms_v1',  weight: 2 },
    { id: 'cyb_mantis_blades',    weight: 2 },
    { id: 'cyb_neural_link_mk4',  weight: 3 },
    { id: 'cyb_kiroshi_optic_v3', weight: 3 },
    { id: 'cyb_reflex_booster',   weight: 3 },
  ],
};

/** Select an item from a tier's pool using weighted random selection.
 *  Returns the cyberware ID string, or null if the tier pool is missing/empty.
 *  Does NOT import CYBERWARE_ITEMS — operates only on pool entries. */
export function rollCyberwareReward(tier, rng = Math.random) {
  const pool = CYBERWARE_REWARD_POOLS[tier];
  if (!pool || pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * totalWeight;

  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }

  // Floating-point safety fallback — return the last item.
  return pool[pool.length - 1].id;
}
