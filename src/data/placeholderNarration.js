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

export function pickNarration(stats) {
  const entries = Object.entries(stats);
  entries.sort((a, b) => b[1] - a[1]);
  const highest = entries[0];
  const lowest = entries[entries.length - 1];

  // 40% chance: reflect highest stat
  if (Math.random() < 0.4) {
    const pool = HIGH_POOLS[highest[0]];
    if (pool && pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  }

  // 30% chance: reflect lowest stat
  if (Math.random() < 0.5) { // 0.5 of remaining 0.6 = 0.3
    const pool = LOW_POOLS[lowest[0]];
    if (pool && pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  }

  // Fallback: generic
  return GENERIC[Math.floor(Math.random() * GENERIC.length)];
}
