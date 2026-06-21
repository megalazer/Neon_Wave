// Explicit/boss fights only (template ids; the store scales them via buildUnits).
// Generic tiered fights are produced at runtime by encounterGenerator.
export const ENCOUNTERS = {
  enc_gang_enforcer_solo: { id: 'enc_gang_enforcer_solo', enemies: ['enemy_gang_enforcer'] }, // back-compat
  enc_grammaton_cordon_mid: { id: 'enc_grammaton_cordon_mid', enemies: ['enemy_grammaton_security', 'enemy_grammaton_patrol'] },
  // Boss: a chrome husk flanked by two adds — a real multi-target threat.
  enc_cyberpsycho: { id: 'enc_cyberpsycho', enemies: ['enemy_static_cyberpsycho', 'enemy_static_berserker', 'enemy_static_scrapper'] },
};
