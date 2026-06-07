// ── Crew Interaction Pools ──────────────────────────────────────────────────
// Template-driven inter-crew moments.
// Templates use {name} and {other} as placeholders, filled at runtime.
//
// Export: pickInteraction(memberA, memberB, contractsTogether, turnNumber)
//   → { text: string, lines: string[] } | null

// ── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES = {
  // ── Solo moments (20+) ──────────────────────────────────────────────────
  solo: [
    { text: '{name} stares at the rain for ten minutes. Doesnt say why.',
      lines: ['Stares at the rain.', 'For ten minutes. Doesnt say why.'] },
    { text: '{name} sharpens a blade that isnt theirs.',
      lines: ['Sharpens a blade.', 'It isnt theirs.'] },
    { text: '{name} mutters something in a language nobody else speaks.',
      lines: ['Mutters something.', 'Nobody else speaks that language.'] },
    { text: '{name} checks the same wire three times. It hasnt moved.',
      lines: ['Checks the same wire.', 'Three times.', 'It hasnt moved.'] },
    { text: '{name} laughs at nothing. Or at something you cant see.',
      lines: ['Laughs.', 'At nothing.', 'Or at something you cant see.'] },
    { text: '{name} cleans their optics with a cloth thats seen better days.',
      lines: ['Cleans their optics.', 'The cloth has seen better days.'] },
    { text: '{name} hums a tune from a corpo ad. Stops mid-note. Doesnt finish.',
      lines: ['Hums a corpo ad jingle.', 'Stops mid-note.', 'Doesnt finish.'] },
    { text: '{name} counts credits in the dark. Twice.',
      lines: ['Counts credits.', 'In the dark.', 'Twice.'] },
    { text: '{name} writes something on a scrap of paper. Then burns it.',
      lines: ['Writes on a scrap of paper.', 'Reads it once.', 'Burns it.'] },
    { text: '{name} stares at their own reflection in a puddle. Spits in it.',
      lines: ['Stares at a puddle reflection.', 'Spits in it.'] },
    { text: '{name} taps a finger against their temple. Counting something.',
      lines: ['Taps a finger against their temple.', 'Counting something.'] },
    { text: '{name} rewinds a recording. Listens again. Still nothing.',
      lines: ['Rewinds a recording.', 'Listens again.', 'Still nothing.'] },
    { text: '{name} adjusts a strap that didnt need adjusting.',
      lines: ['Adjusts a strap.', 'It didnt need adjusting.'] },
    { text: '{name} stares at the ceiling. The ceiling stares back.',
      lines: ['Stares at the ceiling.', 'The ceiling stares back.'] },
    { text: '{name} traces a circuit pattern on their palm. Old habit.',
      lines: ['Traces a circuit pattern on their palm.', 'Old habit.'] },
    { text: '{name} cracks open a can of something. Doesnt drink it.',
      lines: ['Cracks open a can.', 'Doesnt drink it.'] },
    { text: '{name} flips a cred-chip between their knuckles. Never drops it.',
      lines: ['Flips a cred-chip between their knuckles.', 'Never drops it.'] },
    { text: '{name} watches a news feed with no sound. Lips move. Translating.',
      lines: ['Watches a muted news feed.', 'Lips move.', 'Translating.'] },
    { text: '{name} pulls out a photo. Looks at it for exactly three seconds. Puts it away.',
      lines: ['Pulls out a photo.', 'Three seconds.', 'Puts it away.'] },
    { text: '{name} breathes out slow. Steam. The room isnt cold.',
      lines: ['Breathes out slow.', 'Steam.', 'The room isnt cold.'] },
    { text: '{name} scratches a tally mark into the wall. One more.',
      lines: ['Scratches a tally mark into the wall.', 'One more.'] },
    { text: '{name} closes their eyes. Opens them. Nothing changed.',
      lines: ['Closes their eyes.', 'Opens them.', 'Nothing changed.'] },
    { text: '{name} smells the air. Nods once. Doesnt explain.',
      lines: ['Smells the air.', 'Nods once.', 'Doesnt explain.'] },
    { text: '{name} pulls a thread from their sleeve. Wraps it around a finger. Unties it.',
      lines: ['Pulls a thread from their sleeve.', 'Wraps it around a finger.', 'Unties it.'] },
    { text: '{name} checks a dead drop location. It isnt there. It was never there.',
      lines: ['Checks a dead drop.', 'It isnt there.', 'It was never there.'] },
  ],

  // ── Class pairs (15 combos × 3 each = 45) ────────────────────────────
  classPair: {
    'netrunner_street_samurai': [
      { text: '{name} patches {other}\'s neural interface. {other} pretends not to notice.',
        lines: ['{name} patches {other}\'s neural interface.', '{other} pretends not to notice.'] },
      { text: '{other} asks if {name} can hack a bullet mid-flight. {name} will get back to them.',
        lines: ['"{name}, can you hack a bullet mid-flight?"', '{name} says they\'ll get back to them.'] },
      { text: '{name} winces at the sound of {other}\'s chrome recalibrating. {other} grins.',
        lines: ['{name} winces at the chrome noise.', '{other} grins. "Sensitive ears."'] },
    ],
    'street_samurai_netrunner': [
      { text: '{name} stands guard while {other} jacks in. Neither speaks. Both listening.',
        lines: ['{name} stands guard.', '{other} jacks in.', 'Neither speaks. Both listening.'] },
      { text: '{name} claps {other} on the shoulder. {other} flinches. "Easy, killer."',
        lines: ['{name} claps {other} on the shoulder.', '{other} flinches.', '"Easy, killer."'] },
      { text: '{name} asks {other} if the NET has a gym. {other} doesnt dignify that.',
        lines: ['"Does the NET have a gym?"', '{other} doesn\'t dignify that.'] },
    ],
    'netrunner_fixer': [
      { text: '{name} runs a background check on {other}\'s new contact. Already scrubbed.',
        lines: ['{name} runs a background check.', 'Already scrubbed.', '{other} smiles faintly.'] },
      { text: '{other} slides a datachip across. {name} plugs it in without asking what it cost.',
        lines: ['{other} slides a datachip across.', '{name} plugs it in without asking.'] },
      { text: '{name} decrypts {other}\'s ledger. "You paid HOW much?"',
        lines: ['{name} decrypts the ledger.', '"You paid HOW much?"', '{other}: "You weren\'t supposed to see that."'] },
    ],
    'fixer_netrunner': [
      { text: '{name} needs a backdoor into a subnet. {other} already has one.',
        lines: ['{name} needs a backdoor.', '{other} already has one.', '"Which subnet?"'] },
      { text: '{name} tells {other} to stop reading their mail. {other} says it\'s research.',
        lines: ['"Stop reading my mail."', '{other}: "It\'s research."'] },
      { text: '{name} mentions a payday. {other} perks up for the first time all day.',
        lines: ['{name} mentions a payday.', '{other} perks up.'] },
    ],
    'netrunner_ghost': [
      { text: '{name} tracks a signal. {other} is already standing there.',
        lines: ['{name} tracks a signal.', '{other} is already standing there.'] },
      { text: '{other} vanishes mid-sentence. {name} sighs. "Very mature."',
        lines: ['{other} vanishes mid-sentence.', '{name} sighs.', '"Very mature."'] },
      { text: '{name} leaves a data trail for {other} to follow. {other} follows it backwards.',
        lines: ['{name} leaves a data trail.', '{other} follows it backwards.', '"You started here."'] },
    ],
    'ghost_netrunner': [
      { text: '{name} appears behind {other}\'s chair. {other} doesn\'t turn around. "I know."',
        lines: ['{name} appears behind {other}\'s chair.', '{other} doesn\'t turn around.', '"I know."'] },
      { text: '{name} asks {other} to scrub their heat signature. {other} names a price. {name} laughs.',
        lines: ['{name} asks for a heat sig scrub.', '{other} names a price.', '{name} laughs.'] },
      { text: '{name} hands {other} a datastick. "Found this inside a vault." {other}: "Which vault?"',
        lines: ['{name} hands over a datastick.', '"Found this inside a vault."', '{other}: "Which vault?"'] },
    ],
    'netrunner_chrome_doc': [
      { text: '{name} asks {other} to check their neural port for a weird tingle. {other} finds nothing. {name} is not reassured.',
        lines: ['{name} asks about a weird tingle.', '{other} finds nothing.', '{name} is not reassured.'] },
      { text: '{other} tells {name} their neural latency is off by 3ms. {name} stares. "How do you HEAR that?"',
        lines: ['{other} diagnoses a 3ms latency.', '{name} stares.', '"How do you HEAR that?"'] },
      { text: '{name} fried a circuit. {other} holds up the scorched chip. "This was expensive."',
        lines: ['{name} fried a circuit.', '{other} holds up the scorched chip.', '"This was expensive."'] },
    ],
    'chrome_doc_netrunner': [
      { text: '{name} offers to upgrade {other}\'s deck cooling. {other} asks if it\'ll void the warranty. Silence.',
        lines: ['{name} offers to upgrade the deck.', '{other}: "Will it void the warranty?"', 'Silence.'] },
      { text: '{name} taps {other}\'s datajack. "Loose contact. Want me to fix it?"',
        lines: ['{name} taps the datajack.', '"Loose contact. Want me to fix it?"'] },
      { text: '{name} monitors {other}\'s vitals during a deep dive. Heart rate spikes. {name} doesnt wake them.',
        lines: ['{name} monitors the deep dive vitals.', 'Heart rate spikes.', '{name} doesn\'t wake them.'] },
    ],
    'fixer_ghost': [
      { text: '{name} slides a dossier across the table. {other} doesnt look up. Already read it.',
        lines: ['{name} slides a dossier across the table.', '{other} doesn\'t look up.', 'Already read it.'] },
      { text: '{name} asks {other} to tail a client. {other} is already gone.',
        lines: ['{name} asks {other} to tail a client.', '{other} is already gone.'] },
      { text: '{name} negotiates. {other} watches the exit. Both knowing the real play.',
        lines: ['{name} negotiates.', '{other} watches the exit.', 'Both knowing the real play.'] },
    ],
    'ghost_fixer': [
      { text: '{name} slips {other} a name. {other} smiles. "That one costs extra."',
        lines: ['{name} slips a name.', '{other} smiles.', '"That one costs extra."'] },
      { text: '{name} materializes in {other}\'s blind spot. {other}: "One day I\'ll catch you."',
        lines: ['{name} materializes in a blind spot.', '{other}: "One day I\'ll catch you."'] },
      { text: '{name} leaves intel on {other}\'s desk. No note. No source. {other} knows better than to ask.',
        lines: ['{name} leaves intel on the desk.', 'No note. No source.', '{other} knows better than to ask.'] },
    ],
    'street_samurai_fixer': [
      { text: '{name} cracks knuckles. {other} raises an eyebrow. "That\'s plan B."',
        lines: ['{name} cracks knuckles.', '{other} raises an eyebrow.', '"That\'s plan B."'] },
      { text: '{name} asks {other} why every job has a catch. {other} says catches are the job.',
        lines: ['"Why does every job have a catch?"', '{other}: "Catches ARE the job."'] },
      { text: '{name} hands {other} a receipt for property damage. {other} files it under "inevitable."',
        lines: ['{name} hands over a receipt.', '{other} files it under "inevitable."'] },
    ],
    'street_samurai_ghost': [
      { text: '{name} stomps down the hallway. {other} appears from a shadow {name} swears was empty.',
        lines: ['{name} stomps down the hallway.', '{other} appears from a shadow.', '{name} swears it was empty.'] },
      { text: '{name} practices blade forms. {other} watches from the rafters. {name} pretends not to notice.',
        lines: ['{name} practices blade forms.', '{other} watches from the rafters.', '{name} pretends not to notice.'] },
      { text: '{name} says stealth is overrated. {other} appears behind them. "You were saying?"',
        lines: ['"Stealth is overrated."', '{other} appears behind them.', '"You were saying?"'] },
    ],
    'ghost_street_samurai': [
      { text: '{name} oils a door hinge without being asked. {other} nods. The loudest crew member, grateful.',
        lines: ['{name} oils a door hinge.', '{other} nods.', 'The loudest crew member, grateful.'] },
      { text: '{name} leaves a footprint on purpose. {other} follows it. Finds a note: "Gotcha."',
        lines: ['{name} leaves a footprint on purpose.', '{other} follows it.', 'Finds a note: "Gotcha."'] },
      { text: '{name} asks {other} how much that chrome weighs. {other} flexes. "Enough."',
        lines: ['"How much does that chrome weigh?"', '{other} flexes.', '"Enough."'] },
    ],
    'chrome_doc_street_samurai': [
      { text: '{other} holds out a bloody knuckle. {name} sighs. Again.',
        lines: ['{other} holds out a bloody knuckle.', '{name} sighs.', '"Again."'] },
      { text: '{name} lectures {other} about tendon stress. {other} does push-ups through the lecture.',
        lines: ['{name} lectures about tendon stress.', '{other} does push-ups through the lecture.'] },
      { text: '{name} replaces {other}\'s synth-muscle fiber. {other}: "Tighter this time." {name}: "No."',
        lines: ['{name} replaces synth-muscle fiber.', '{other}: "Tighter this time."', '{name}: "No."'] },
    ],
    'street_samurai_chrome_doc': [
      { text: '{name} cracks a knuckle. {other} diagnoses the sound. "Third metacarpal. Loose."',
        lines: ['{name} cracks a knuckle.', '{other} diagnoses the sound.', '"Third metacarpal. Loose."'] },
      { text: '{name} offers to test {other}\'s new surgical laser. {other} declines. Firmly.',
        lines: ['{name} offers to test the surgical laser.', '{other} declines.', 'Firmly.'] },
      { text: '{name} limps in. {other} is already prepping the suture kit. No words needed.',
        lines: ['{name} limps in.', '{other} preps the suture kit.', 'No words needed.'] },
    ],
  },

  // ── Shared faction (6 factions × 3 each = 18) ────────────────────────
  sharedFaction: {
    fac_signal: [
      { text: '{name} and {other} exchange a look when the comms crackle. They both know what that frequency means.',
        lines: ['The comms crackle.', '{name} and {other} exchange a look.', 'They both know what that frequency means.'] },
      { text: '{name} taps the antenna. {other} adjusts the gain. Perfect sync.',
        lines: ['{name} taps the antenna.', '{other} adjusts the gain.', 'Perfect sync.'] },
      { text: '{name} mentions a carrier wave from last cycle. {other} heard it too. Neither slept that night.',
        lines: ['{name} mentions a carrier wave.', '{other} heard it too.', 'Neither slept that night.'] },
    ],
    fac_grammaton: [
      { text: '{name} recites a regulation. {other} finishes it. Perfect sync. Old habits.',
        lines: ['{name} recites a regulation.', '{other} finishes it.', 'Perfect sync. Old habits.'] },
      { text: '{name} and {other} stand at attention when a certain tone plays. Nobody else heard it.',
        lines: ['A tone plays.', '{name} and {other} stand at attention.', 'Nobody else heard it.'] },
      { text: '{name} corrects {other}\'s report formatting. {other} corrects {name}\'s citation. Protocol is protocol.',
        lines: ['{name} corrects the report formatting.', '{other} corrects the citation.', 'Protocol is protocol.'] },
    ],
    fac_lexicon: [
      { text: '{name} and {other} trade words nobody else recognizes. An old lexicon. A private one.',
        lines: ['{name} and {other} trade words.', 'Nobody else recognizes them.', 'An old lexicon. A private one.'] },
      { text: '{name} says a word. {other} writes it down. The collection grows.',
        lines: ['{name} says a word.', '{other} writes it down.', 'The collection grows.'] },
      { text: '{name} and {other} debate a translation for an hour. Neither is right. Both know it.',
        lines: ['They debate a translation for an hour.', 'Neither is right.', 'Both know it.'] },
    ],
    fac_referent: [
      { text: '{name} mentions a name. {other} nods. That name means something. It always does.',
        lines: ['{name} mentions a name.', '{other} nods.', 'That name means something. It always does.'] },
      { text: '{name} and {other} exchange packages without a word. The labels are blank. The contents are understood.',
        lines: ['They exchange packages without a word.', 'Labels are blank.', 'Contents are understood.'] },
      { text: '{name} points at a symbol on the wall. {other} already saw it. Old network. Still active.',
        lines: ['{name} points at a symbol on the wall.', '{other} already saw it.', 'Old network. Still active.'] },
    ],
    fac_undertow: [
      { text: '{name} and {other} sit in the silence beneath the noise. The undertow. They prefer it here.',
        lines: ['{name} and {other} sit in silence.', 'Beneath the noise.', 'The undertow. They prefer it here.'] },
      { text: '{name} surfaces a piece of intel. {other} already knew. Of course they did. Undertow currents.',
        lines: ['{name} surfaces intel.', '{other} already knew.', 'Of course they did. Undertow currents.'] },
      { text: '{name} says nothing. {other} says nothing. An entire conversation, passed.',
        lines: ['{name} says nothing.', '{other} says nothing.', 'An entire conversation, passed.'] },
    ],
    fac_static: [
      { text: '{name} and {other} share a cigarette in silence. The silence says everything.',
        lines: ['{name} and {other} share a cigarette.', 'In silence.', 'The silence says everything.'] },
      { text: '{name} turns up the white noise. {other} turns it up more. The static is home.',
        lines: ['{name} turns up the white noise.', '{other} turns it up more.', 'The static is home.'] },
      { text: '{name} and {other} stare into the interference pattern. Something stares back. They\'re used to it.',
        lines: ['They stare into the interference pattern.', 'Something stares back.', 'They\'re used to it.'] },
    ],
  },

  // ── Quality gap (5+) ────────────────────────────────────────────────────
  qualityGap: [
    { qualA: 'legendary', qualB: 'common',
      text: '{name} watches {other} check their gear. You\'re doing it wrong. Shows them how.',
      lines: ['{name} watches {other} check their gear.', '"You\'re doing it wrong."', 'Shows them how.'] },
    { qualA: 'legendary', qualB: 'common',
      text: '{other} asks {name} what their first kill was. {name} says they dont remember. {other} doesnt believe them.',
      lines: ['{other} asks about their first kill.', '{name} says they don\'t remember.', '{other} doesn\'t believe them.'] },
    { qualA: 'legendary', qualB: 'common',
      text: '{name} says nothing during the briefing. {other} fills the silence. {name} lets them.',
      lines: ['{name} says nothing during the briefing.', '{other} fills the silence.', '{name} lets them.'] },
    { qualA: 'rare', qualB: 'common',
      text: '{name} double-checks {other}\'s rig. {other} bristles. {name}: "You\'ll thank me later."',
      lines: ['{name} double-checks the rig.', '{other} bristles.', '{name}: "You\'ll thank me later."'] },
    { qualA: 'rare', qualB: 'common',
      text: '{name} tells a war story. {other} listens. Hungry. Taking notes without writing.',
      lines: ['{name} tells a war story.', '{other} listens.', 'Hungry. Taking notes without writing.'] },
    { qualA: 'legendary', qualB: 'rare',
      text: '{name} skims {other}\'s after-action report. Circles one line. "This. This was the real move."',
      lines: ['{name} skims the after-action report.', 'Circles one line.', '"This. This was the real move."'] },
  ],

  // ── Trait collisions (10+) ─────────────────────────────────────────────
  traitCollision: [
    { traitA: 'Chain-smoker', traitB: 'Medical school dropout. Knows exactly where it hurts.',
      text: '{other} tells {name} those cigarettes will kill them. {name} exhales slowly. Counting on it.',
      lines: ['{other} points at the cigarette.', '"Those will kill you."', '{name} exhales slowly. "Counting on it."'] },
    { traitA: 'Prays to the signal', traitB: 'Former priest of the Signal. Lost faith. Kept the voice.',
      text: '{name} prays to the signal. {other} watches. Doesnt join. Doesnt stop them.',
      lines: ['{name} prays to the signal.', '{other} watches.', 'Doesn\'t join. Doesn\'t stop them.'] },
    { traitA: 'Never blinks', traitB: 'Black-ops survivor. Wont say which op.',
      text: '{other} tries to have a staring contest. Gives up after two minutes. {name}, what the hell.',
      lines: ['{other} tries a staring contest.', 'Gives up after two minutes.', '"{name}, what the hell."'] },
    { traitA: 'Has a pet roach named Dividend', traitB: 'Gene-sculpted. The designer left a watermark.',
      text: '{name} shows {other} Dividend the roach. {other} examines its carapace. "Good stock."',
      lines: ['{name} shows Dividend the roach.', '{other} examines the carapace.', '"Good stock."'] },
    { traitA: 'Always pays in exact change', traitB: 'Debt runner. The interest is personal.',
      text: '{name} counts out exact change for coffee. {other} stares at the stack. "That\'s not how money works."',
      lines: ['{name} counts out exact change.', '{other} stares.', '"That\'s not how money works."'] },
    { traitA: 'Recites corpo ad copy from memory', traitB: 'Ex-corporate. Still uses the old buzzwords.',
      text: '{name} recites a jingle. {other} finishes it. They stare at each other. Mutual shame.',
      lines: ['{name} recites a jingle.', '{other} finishes it.', 'Mutual shame.'] },
    { traitA: 'Sleeps with optics open', traitB: 'Undercity folk hero. The bars know the songs.',
      text: '{other} wakes up to find {name} staring at the ceiling. "You do that every night?" "Every night."',
      lines: ['{other} wakes up.', '{name} is staring at the ceiling.', '"You do that every night?" "Every night."'] },
    { traitA: 'Collects antique bullets', traitB: 'Keeps a kill count. Updates it daily.',
      text: '{name} shows {other} a pre-war round. {other} asks if it works. {name} says they hope they never find out.',
      lines: ['{name} shows a pre-war round.', '{other} asks if it works.', '{name} hopes they never find out.'] },
    { traitA: 'Chain-smoker', traitB: 'Can taste lies. Metallic, she says.',
      text: '{name} blows smoke toward {other}. {other}: "That\'s your third today. And you\'re lying about something."',
      lines: ['{name} blows smoke toward {other}.', '"{other}: That\'s your third today."', '"And you\'re lying about something."'] },
    { traitA: 'Died once. Came back. Doesnt talk about it.', traitB: 'Ghost of the old net. The old net remembers back.',
      text: '{name} and {other} sit in silence. Both have been somewhere the others can\'t follow.',
      lines: ['{name} and {other} sit in silence.', 'Both have been somewhere.', 'The others can\'t follow.'] },
    { traitA: 'Underground fight circuit. Won more than lost.', traitB: 'Smiles before a fight. Never after.',
      text: '{name} sizes {other} up. {other} smiles. {name}: "You\'d be trouble." {other}: "I know."',
      lines: ['{name} sizes {other} up.', '{other} smiles.', '{name}: "You\'d be trouble." {other}: "I know."'] },
    { traitA: 'The real deal.', traitB: 'Only takes jobs that matter. Defines matter loosely.',
      text: '{name} and {other} glance at the job brief. Exchange a look. "This one matters." "They all matter."',
      lines: ['They glance at the job brief.', 'Exchange a look.', '"This one matters." "They all matter."'] },
  ],

  // ── Milestones (at 5, 10, 20 contracts together) ──────────────────────
  milestone: [
    { at: 5,
      text: 'Fifth job together. {name} slides a drink across the table to {other}. No words. The drink is terrible. They finish it anyway.',
      lines: ['Fifth job together.', '{name} slides a drink across to {other}.', 'The drink is terrible. They finish it anyway.'] },
    { at: 10,
      text: 'Tenth job. {name} and {other} dont need to speak anymore. A nod is a full conversation.',
      lines: ['Tenth job.', '{name} and {other} don\'t need to speak.', 'A nod is a full conversation.'] },
    { at: 20,
      text: 'Twentieth job. {name} finally asks {other} where they\'re from. {other} says Here. {name} understands.',
      lines: ['Twentieth job.', '{name} finally asks where {other} is from.', '{other} says "Here." {name} understands.'] },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(tmpl, name, other) {
  const text = tmpl.text.replace(/\{name\}/g, name).replace(/\{other\}/g, other);
  const lines = tmpl.lines.map((l) =>
    l.replace(/\{name\}/g, name).replace(/\{other\}/g, other),
  );
  return { text, lines };
}

// ── Picker ────────────────────────────────────────────────────────────────────

/**
 * Pick a crew interaction.
 *
 * @param {object} memberA — the first (or only) crew member
 *   Must have: .name, .class, .faction, .quality, .trait
 * @param {object|null} memberB — second crew member, or null for solo moment
 * @param {number} contractsTogether — contracts completed together
 * @param {number} _turnNumber — current turn (reserved for future use)
 * @returns {{ text: string, lines: string[] } | null}
 */
export function pickInteraction(memberA, memberB, contractsTogether, _turnNumber) {
  // ── 1. Solo ───────────────────────────────────────────────────────────
  if (!memberB) {
    const tmpl = pickRandom(TEMPLATES.solo);
    return fillTemplate(tmpl, memberA.name, '');
  }

  const nameA = memberA.name;
  const nameB = memberB.name;

  // ── 2. Milestone ──────────────────────────────────────────────────────
  if (contractsTogether === 5 || contractsTogether === 10 || contractsTogether === 20) {
    const milestone = TEMPLATES.milestone.find((m) => m.at === contractsTogether);
    if (milestone) {
      return fillTemplate(milestone, nameA, nameB);
    }
  }

  // ── 3. Shared faction (30% chance) ────────────────────────────────────
  if (memberA.faction && memberB.faction && memberA.faction === memberB.faction) {
    if (Math.random() < 0.3) {
      const pool = TEMPLATES.sharedFaction[memberA.faction];
      if (pool && pool.length > 0) {
        return fillTemplate(pickRandom(pool), nameA, nameB);
      }
    }
  }

  // ── 4. Trait collision ────────────────────────────────────────────────
  const traitA = memberA.trait;
  const traitB = memberB.trait;
  if (traitA && traitB) {
    const collision = TEMPLATES.traitCollision.find(
      (c) =>
        (c.traitA === traitA && c.traitB === traitB) ||
        (c.traitA === traitB && c.traitB === traitA),
    );
    if (collision) {
      // Determine which member gets which role based on trait order
      if (collision.traitA === traitA) {
        return fillTemplate(collision, nameA, nameB);
      }
      return fillTemplate(collision, nameB, nameA);
    }
  }

  // ── 5. Fallback: class-pair template ──────────────────────────────────
  const key = `${memberA.class}_${memberB.class}`;
  let pool = TEMPLATES.classPair[key];

  // Try reversed order if no match
  if (!pool) {
    const revKey = `${memberB.class}_${memberA.class}`;
    pool = TEMPLATES.classPair[revKey];
  }

  // If no class-pair match at all, pick a random class pair (graceful fallback)
  if (!pool) {
    const allPairs = Object.values(TEMPLATES.classPair).flat();
    if (allPairs.length === 0) return null;
    return fillTemplate(pickRandom(allPairs), nameA, nameB);
  }

  return fillTemplate(pickRandom(pool), nameA, nameB);
}
