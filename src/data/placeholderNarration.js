const GENERIC = [
  'Rain hits the synthglass like static. Nothing moves in Sector 7.',
  'A drone passes overhead, scanner blinking red, then gone.',
  'Someone left a half-eaten noodle pack on the bar. Cold by now.',
  'The neon sign across the street flickers, then steadies.',
  'You hear gunfire two blocks over. Not your problem tonight.',
  'Helix billboards cycle through their evening propaganda loop.',
  'A fixer you don\'t recognize nods at you from the corner booth.',
  'Power flickers across the district. Back online in three seconds.',
  'The bartender slides a drink toward you without asking what.',
  'Somewhere in the distance, the mag-rail screams past.',
  'Acid rain. Again. Your coat sheds it but the smell lingers.',
  'Onyx Bureau patrol checkpoint went up on 4th Street.',
  'An anonymous credit transfer hits your account. 12 CR. Suspicious.',
  'Your subdermal pings: temperature regulating, all systems nominal.',
  'Static on the wire. Someone\'s running a scrambler nearby.',
];

// ─── PATH-SPECIFIC NARRATION POOLS ──────────────────────────────────────────────

const PATH_POOLS = {
  corpo: [
    'Your old access credentials still ping valid in three data enclaves. The board hasn\'t purged you yet. That\'s useful.',
    'A Lexicon mid-manager clocks your corpo stance from across the bar. He pays for your drink. "You and I speak the same language."',
    'The quarterly earnings projection scrolls across a Helix billboard. You read between the numbers without thinking. The merger is going to fail.',
    'Your subdermal pings a familiar encrypted channel. The old network is still active. Someone forgot to revoke your keys.',
    'A junior analyst from your old division spots you in Saltgate. He looks away first. That tells you everything.',
  ],
  street_kid: [
    'A grid-tag on the wall marks this alley as Static crew territory. You recognize the hand. The artist is dead. The tag lives.',
    'Saltgate Market is moving tonight. You can feel it: the stalls, the whispers, the deals that close in shadow. Home.',
    'A street vendor you don\'t know nods like you\'ve been buying from him for years. "You got that look, choom. Survivor look."',
    'Someone left a data-shard wedged in a drainpipe. Old-school dead drop. You know the code. The contents are worth more than the shard.',
    'An Undertow courier slips past a Grammaton checkpoint two blocks ahead. Smooth. You used to run that route. Still could.',
  ],
  nomad: [
    'The badlands skyline flickers on the horizon. You can feel the open road even through sixty floors of concrete. It never leaves.',
    'A convoy rig rumbles past, engine tuned to a frequency you know in your bones. The driver flashes a light. Clan sign.',
    'Someone\'s patched a solar cell into a dead streetlamp. Resourceful. That\'s badlands thinking. The city forgets; nomads remember.',
    'Your hands remember the weight of a steering column. The city grid won\'t let you drive, but at night you map escape routes anyway.',
    'A static-scarred nav beacon chirps on a frequency no one monitors anymore. You still have the decoder. You still listen.',
  ],
};

const HIGH_CHROME = [
  'Your chrome hums beneath the skin. You feel like you could punch through a wall. You probably could.',
  'Every implant thrums in sync. For once, the metal feels like it belongs.',
  'You catch your reflection in a window. More machine than the person who started this run.',
  'The chrome responds before you think. Reflexes aren\'t yours anymore. That was the point.',
  'Someone bumps your shoulder on the street. They apologize immediately. Smart.',
];

const LOW_CHROME = [
  'Your grip strength isn\'t what it was. You notice. Nobody else needs to.',
  'A door sticks. You lean into it. Your shoulder complains. You ignore it.',
  'The city feels heavier when the chrome is thin. Everything is harder to move.',
];

const HIGH_EDGE = [
  'Your hand twitches toward a weapon that isn\'t there. Old reflex. Still sharp.',
  'You clock three exits before you finish walking into the room. The fourth is a window. Good enough.',
  'Someone watches you from across the street. You let them. You\'ve been watching them for two blocks.',
];

const LOW_EDGE = [
  'You miss the signal. The handoff happens without you. Next time.',
  'Something feels off but you can\'t place it. Gut says move. Head says stay. You stay.',
];

const HIGH_GHOST = [
  'You move through the crowd like water. Nobody looks twice. Nobody ever does.',
  'Shadows wrap around you like an old coat. Familiar. Comfortable. Invisible.',
  'A patrol passes. Their scanner sweeps right through where you were standing. You aren\'t there anymore.',
];

const LOW_GHOST = [
  'Your footsteps echo louder than they should. Or maybe you\'re just hearing things.',
  'Every camera feels like it\'s pointing at you. Most of them probably aren\'t. Probably.',
  'You knock over a bottle in the dark. The sound carries. Everyone in the alley turns.',
  'The floor creaks. You freeze. The floor creaks again. You are standing still.',
];

const HIGH_FACE = [
  'The vendor gives you a discount without asking. Some faces just work like that.',
  'You talk your way past a checkpoint. The guard thanks you for the conversation.',
  'A stranger buys you a drink. You didn\'t ask. They wanted to.',
];

const LOW_FACE = [
  'You say the wrong thing. The room goes quiet. You pretend you meant it.',
  'A joke lands flat. The silence is louder than the punchline.',
  'Someone asks your name. You hesitate. The hesitation says more than the name would.',
];

const HIGH_GRIT = [
  'You\'ve taken worse hits than what this city can throw. The scars prove it.',
  'Pain is old news. You register it, file it, keep moving.',
  'Three days without real sleep. You feel fine. Probably fine.',
];

const LOW_GRIT = [
  'Your knees ache. The rain doesn\'t help. Nothing helps.',
  'You\'re tired in a way that sleep doesn\'t fix. You keep going anyway.',
];

const HIGH_WIRE = [
  'The local grid topology unfolds in your head like a map. Every node, every weakness.',
  'Your deck pings a nearby access point. Old encryption. Crackable in under a minute.',
  'Data flows past you in streams. You skim it all. Most of it is noise. Some of it isn\'t.',
];

const LOW_WIRE = [
  'Your deck lags. Three seconds to open a file. It feels like an hour.',
  'An ICE warning flashes on your HUD. You don\'t recognize the variant. That scares you more than the warning.',
  'The interface glitches. You smack the deck. It works. This time.',
];

const HIGH_POOLS = {
  chrome: HIGH_CHROME,
  edge: HIGH_EDGE,
  ghost: HIGH_GHOST,
  face: HIGH_FACE,
  grit: HIGH_GRIT,
  wire: HIGH_WIRE,
};

const LOW_POOLS = {
  chrome: LOW_CHROME,
  edge: LOW_EDGE,
  ghost: LOW_GHOST,
  face: LOW_FACE,
  grit: LOW_GRIT,
  wire: LOW_WIRE,
};

// ─── REACTION NARRATION POOLS ────────────────────────────────────────────────────
// Triggered by temporary world flags set during the player's last action.

const RECENT_EQUIP_POOL = [
  'Your new chrome settles under the skin. The diagnostic pings are still calibrating. Feels like potential.',
  'The implant\'s firmware sync completes. For a moment your HUD flares with data you don\'t recognize. Then it quiets.',
  'You flex your hand. The chrome responds. No latency. Whoever did the install knew their trade.',
  'A phantom sensation runs through the new implant — your nerves mapping unfamiliar metal. It passes.',
];

const RECENT_PURCHASE_POOL = [
  'You review the acquisition. The numbers balance. A rare feeling in this city.',
  'The purchase settles in your inventory. Solid. Real. More than most people in Sector 7 can claim.',
  'You check the deed. Everything is in order. For now. This is Night City; nothing stays orderly.',
  'Your cred balance is lighter but your position is heavier. You traded liquidity for leverage. Good trade.',
];

const RECENT_LEVEL_UP_POOL = [
  'Something clicks. Muscle memory you didn\'t train. Reflexes you didn\'t earn. But they\'re yours now.',
  'You feel the threshold: sharper senses, faster calculations, deeper reserves. The grind pays in inches.',
  'The city feels different at this tier. Smaller. More navigable. Or maybe you\'re just getting better at reading it.',
  'Your HUD pings an updated threat assessment. Your own threat rating went up. Good.',
];

const RECENT_CONTRACT_POOL = [
  'The fixer\'s payment hits your account. Clean transfer. The kind that doesn\'t attract Grammaton\'s attention.',
  'Another job done. The creds are warm. The heat isn\'t. You call that a win.',
  'You file the completion code. Your rep ticks up a fraction. Fixers talk. They\'ll know by morning.',
  'The contract\'s done. You exhale. Didn\'t realize you were holding that breath.',
  'Payment confirmed. The client leaves a five-star rating. You didn\'t know fixers had ratings.',
];

const RECENT_COMBAT_POOL = [
  'Adrenaline fades. Your hands stop shaking. The street goes quiet again. You\'re still standing.',
  'You check your vitals. Bruised but functional. The other guys can\'t say the same.',
  'The brass casings cool on the pavement. Someone will clean them up. Not you.',
  'Your ears are still ringing. The tinnitus is almost musical now. Almost.',
  'You reload out of habit. The fight is over. Your body hasn\'t gotten the memo.',
];

// ─── REPETITION GUARD ───────────────────────────────────────────────────────────

let recent = [];
const RECENT_WINDOW = 6;
const MAX_TRIES = 6;

export function resetNarrationHistory() {
  recent = [];
}

// Try to pick a line from a pool that isn't already in recent.
function _tryPick(pool) {
  for (let i = 0; i < MAX_TRIES; i++) {
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    if (!recent.includes(candidate)) {
      recent.push(candidate);
      if (recent.length > RECENT_WINDOW) recent.shift();
      return candidate;
    }
  }
  // Exhausted retries — take the next random and record anyway.
  const candidate = pool[Math.floor(Math.random() * pool.length)];
  recent.push(candidate);
  if (recent.length > RECENT_WINDOW) recent.shift();
  return candidate;
}
export function pickNarration(stats, path, flags) {
  // ── Reaction gate: if the player just took a significant action, reflect it ──
  if (flags) {
    if (flags.has('flag_recent_combat')  && Math.random() < 0.7) return _tryPick(RECENT_COMBAT_POOL);
    if (flags.has('flag_recent_contract') && Math.random() < 0.7) return _tryPick(RECENT_CONTRACT_POOL);
    if (flags.has('flag_recent_level_up') && Math.random() < 0.7) return _tryPick(RECENT_LEVEL_UP_POOL);
    if (flags.has('flag_recent_equip')    && Math.random() < 0.7) return _tryPick(RECENT_EQUIP_POOL);
    if (flags.has('flag_recent_purchase') && Math.random() < 0.7) return _tryPick(RECENT_PURCHASE_POOL);
  }

  const entries = Object.entries(stats);
  entries.sort((a, b) => b[1] - a[1]);
  const highest = entries[0];
  const lowest = entries[entries.length - 1];

  // ~30% chance: draw from the current path pool first
  if (path && PATH_POOLS[path] && Math.random() < 0.3) {
    return _tryPick(PATH_POOLS[path]);
  }

  // 40% chance: reflect highest stat
  if (Math.random() < 0.4) {
    const pool = HIGH_POOLS[highest[0]];
    if (pool && pool.length > 0) return _tryPick(pool);
  }

  // 30% chance: reflect lowest stat
  if (Math.random() < 0.5) { // 0.5 of remaining 0.6 = 0.3
    const pool = LOW_POOLS[lowest[0]];
    if (pool && pool.length > 0) return _tryPick(pool);
  }

  // Fallback: generic
  return _tryPick(GENERIC);
}
