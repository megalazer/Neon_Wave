// Flat pools kept for any legacy callers
export const RECRUIT_NAMES = [
  'Ghost_7',    'Lyra_Flux',   'Kira_Syn',    'Dex_Nomad',   'Vex_Zero',
  'Ash_Chrome', 'Jade_Null',   'Kaito_Edge',  'Sable_Nine',  'Cruz_Static',
  'Zaid_Phase', 'Nova_Glitch', 'Petra_Null',  'Jiro_Sync',   'Mira_Zero',
  'Blaze_Hex',  'Kenji_Void',  'Lyric_Syn',   'Dusk_Static', 'Chrome_Rex',
  'Raven_Wire', 'Solo_Ghost',  'Forge_Null',  'Pixel_Nine',  'Wade_Null',
  'Ara_Sync',   'Monk_Seven',  'Rei_Ghost',   'Frost_Edge',  'Flint_Zero',
  'Dace_Echo',  'Wren_Null',   'Axe_Static',  'Nari_Phase',  'Tec_Chrome',
  'Lex_Void',   'Vira_Null',   'Hex_Zero',    'Cade_Wire',   'Storm_Null',
];

export const RECRUIT_HANDLES = [
  'GHOST_PROTOCOL', 'SIGNAL_ZERO',  'CHROME_BLADE',  'NULL_POINTER', 'EDGE_RUNNER',
  'VOID_WALKER',    'NEON_SHADE',   'DARK_SIGNAL',   'ICE_PICK',     'SHADOW_NET',
  'RED_GHOST',      'WIRE_CUTTER',  'STEEL_NULL',    'DEEP_GHOST',   'STATIC_8',
  'CHROME_NULL',    'PHASE_ZERO',   'VENOM_SYNC',    'BLADE_9',      'CORE_RUNNER',
];

export const RECRUIT_CLASSES = [
  'netrunner',
  'street_samurai',
  'fixer',
  'ghost',
  'chrome_doc',
];

// ── Quality-split name pools ──────────────────────────────────────────────────

const COMMON_NAMES = [
  'Ghost_7',    'Lyra_Flux',  'Kira_Syn',   'Dex_Nomad',  'Vex_Zero',
  'Ash_Chrome', 'Jade_Null',  'Kaito_Edge', 'Cruz_Static','Zaid_Phase',
  'Petra_Null', 'Jiro_Sync',  'Mira_Zero',  'Blaze_Hex',  'Kenji_Void',
  'Lyric_Syn',  'Chrome_Rex', 'Raven_Wire', 'Solo_Ghost', 'Forge_Null',
  'Pixel_Nine', 'Wade_Null',  'Ara_Sync',   'Wren_Null',  'Axe_Static',
];

const RARE_NAMES = [
  'Xyra_Vex',   'Nyx_Phantom', 'Kalos_Glitch', 'Sorel_Wire',  'Dael_Null',
  'Vanta_Syn',  'Cipher_9',    'Lykan_Phase',  'Helix_Null',  'Torq_Static',
  'Nisha_Edge', 'Orlan_Ghost', 'Pyra_Chrome',  'Vespa_Null',  'Raxx_Sync',
  'Drex_Wire',  'Solen_Zero',  'Harko_Phase',  'Zira_Null',   'Axen_Ghost',
];

const LEGENDARY_NAMES = [
  'Mantis_Zero',   'Hex_Reaper',    'Void_Sovereign', 'Neon_Spectre',  'Iron_Phantom',
  'Chrome_Wraith', 'Signal_Null',   'The_Iceman',     'Darkwire',      'Glitch_Absolute',
  'Razorwire',     'Null_Protocol', 'Circuit_Breaker','Ghost_Absolute', 'Deadlink',
  'Blackout',      'Zero_Code',     'The_Anomaly',    'Voidborn',      'Chromekill',
];

const COMMON_HANDLES = [
  'GHOST_PROTOCOL', 'SIGNAL_ZERO',  'CHROME_BLADE',  'NULL_POINTER', 'EDGE_RUNNER',
  'VOID_WALKER',    'NEON_SHADE',   'DARK_SIGNAL',   'ICE_PICK',     'SHADOW_NET',
  'RED_GHOST',      'WIRE_CUTTER',  'STEEL_NULL',    'DEEP_GHOST',   'STATIC_8',
  'PHASE_ZERO',     'VENOM_SYNC',   'BLADE_9',       'CORE_RUNNER',  'CHROME_NULL',
];

const RARE_HANDLES = [
  'PHANTOM_SIGNAL', 'NEON_REAPER',   'CIRCUIT_NULL',  'VOID_PROTOCOL', 'CHROME_GHOST',
  'ICE_SOVEREIGN',  'ZERO_TRACE',    'DARK_PROTOCOL', 'PHANTOM_EDGE',  'SIGNAL_NULL',
  'WIRE_GHOST',     'STATIC_ZERO',   'NULL_BLADE',    'EDGE_PROTOCOL', 'VOID_TRACE',
  'GHOST_WIRE',     'CHROME_SIGNAL', 'NULL_PHASE',    'DARK_EDGE',     'IRON_GHOST',
];

const LEGENDARY_HANDLES = [
  'ABSOLUTE_ZERO',  'GHOST_ABSOLUTE', 'NULL_SOVEREIGN', 'IRON_PROTOCOL', 'VOID_ETERNAL',
  'CHROME_REAPER',  'SIGNAL_DEATH',   'CIRCUIT_WRAITH', 'DARK_ABSOLUTE', 'ICE_ETERNAL',
  'PHANTOM_NULL',   'WIRE_SOVEREIGN', 'EDGE_ABSOLUTE',  'NEON_VOID',     'GHOST_ETERNAL',
  'NULL_ABSOLUTE',  'DEATH_PROTOCOL', 'VOID_WRAITH',    'IRON_ABSOLUTE', 'CHROME_ETERNAL',
];

export function pickRandomName(quality) {
  const pools = { common: COMMON_NAMES, rare: RARE_NAMES, legendary: LEGENDARY_NAMES };
  const pool  = pools[quality] ?? COMMON_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickRandomHandle(quality) {
  const pools = { common: COMMON_HANDLES, rare: RARE_HANDLES, legendary: LEGENDARY_HANDLES };
  const pool  = pools[quality] ?? COMMON_HANDLES;
  return pool[Math.floor(Math.random() * pool.length)];
}
