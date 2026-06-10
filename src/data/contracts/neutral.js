// Neutral contracts — no faction affiliation, no rep impact.
// Pure money/XP jobs for when you need quick creds without playing politics.
// Always acceptable (no rep gate, zero deposit). Good for breaking soft-locks.

export const NEUTRAL_CONTRACTS = [
  // ── LOW tier: courier / data-retrieval / pest-control ──────────────────────
  {
    id: 'con_neutral_low_envelope',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'remi',
    moduleNumber: 'N-L01',
    questline: 'Odd Jobs',
    questlineStage: 1,
    name: 'ENVELOPE_DROP',
    description: 'Pick up a sealed envelope at a Lowport noodle bar. Deliver it to a contact three blocks over. Don\'t open it. Don\'t ask what\'s inside. Don\'t get followed.',
    payout: 800,
    deposit: 0,
    exp: 40,
    stages: [
      {
        title: 'THE PICKUP',
        prompt: 'The noodle bar is busy. You spot the contact — a chrome-addict fidgeting by the jukebox. Two Scavvers are watching the entrance. You need the envelope without making a scene.',
        choices: [
          {
            id: 'nl_env_blend',
            label: 'Blend in with the lunch crowd',
            statCheck: { stat: 'ghost', threshold: 10 },
            pass: {
              text: 'You slide through the lunch crowd like you belong there. The Scavvers don\'t even glance your way. The chrome-addict slips you the envelope between sips of synth-broth.',
              branch: 'advance',
            },
            fail: {
              text: 'The Scavvers clock you as not belonging. One blocks the door while the other reaches for their piece. You grab the envelope anyway — it gets loud.',
              branch: 'advance',
              effects: { rewardModifier: -0.15 },
            },
          },
          {
            id: 'nl_env_bribe',
            label: 'Slip the Scavvers 100 CR to look away',
            cost: 100,
            pass: {
              text: 'You palm a hundred to the bigger one. He grunts, turns his back. The exchange happens smooth as silk. Professional courtesy buys a lot in Lowport.',
              branch: 'advance',
            },
            fail: {
              text: 'They take your money and laugh. "That covers us NOT looking." The pickup still works, but you paid a tax on the privilege.',
              branch: 'advance',
            },
          },
          {
            id: 'nl_env_rush',
            label: 'Rush in and out before anyone reacts',
            statCheck: { stat: 'grit', threshold: 10 },
            pass: {
              text: 'You move like a freight train through the tables. Grab, spin, gone. The Scavvers are still deciding whether to stand when you\'re three blocks away.',
              branch: 'advance',
            },
            fail: {
              text: 'You knock over a bowl of noodles and attract exactly the attention you didn\'t want. You get the envelope but three people are now staring at your back as you leave.',
              branch: 'advance',
              effects: { rewardModifier: -0.1 },
            },
          },
        ],
      },
      {
        title: 'THE DROP',
        prompt: 'The delivery address is a dead-drop in a public locker bay. But there\'s a Grammaton patrol sweeping the block — someone reported a "suspicious package" in the bay.',
        choices: [
          {
            id: 'nl_env_wait',
            label: 'Wait out the patrol, drop when clear',
            statCheck: { stat: 'ghost', threshold: 11 },
            pass: {
              text: 'You post up in an overhang and wait. Twenty minutes later the patrol moves on. Clean drop. No one saw your face.',
              branch: 'advance',
            },
            fail: {
              text: 'The patrol doesn\'t move. You wait forty minutes, then slip in during their shift change. The drop happens but you\'re late. The contact marks it.',
              branch: 'advance',
              effects: { rewardModifier: -0.1 },
            },
          },
          {
            id: 'nl_env_distract',
            label: 'Create a diversion two blocks over',
            statCheck: { stat: 'edge', threshold: 11 },
            pass: {
              text: 'A trash fire, a tripped alarm, and a very confused patrol later — the locker bay is empty. You make the drop in peace.',
              branch: 'advance',
            },
            fail: {
              text: 'The diversion works but the patrol splits up instead of all responding. One guard stays. You talk your way past with a story about a lost keycard.',
              branch: 'advance',
            },
          },
          {
            id: 'nl_env_talk',
            label: 'Approach the patrol and redirect them',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: '"False alarm on that package — my neighbor\'s synth-cat got loose." The sergeant rolls her eyes and waves the squad on. You drop the envelope and walk away like you own the block.',
              branch: 'complete',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'The sergeant doesn\'t buy it. "Then what are YOU doing here?" You talk your way out of a citation but the drop gets delayed.',
              branch: 'complete',
            },
          },
        ],
      },
    ],
    successNarration: 'Envelope delivered. Remi sends the credits with a terse note: "Clean. More where that came from."',
    failureNarration: 'Drop was compromised or pickup was blown. Remi pays a fraction. No questions asked — that\'s the deal.',
    abortNarration: 'You bailed. The envelope stays with you. Remi doesn\'t ask for it back. The silence is louder than a complaint.',
  },

  {
    id: 'con_neutral_low_data_scrub',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'remi',
    moduleNumber: 'N-L02',
    questline: 'Odd Jobs',
    questlineStage: 2,
    name: 'DATA_SCRUB',
    description: 'A mid-tier exec at Helix Corp wants their browsing history deleted — not from their own machine, from the company\'s backup vault. Low risk. Low pay. Zero questions.',
    payout: 1000,
    deposit: 0,
    exp: 55,
    stages: [
      {
        title: 'VAULT ENTRY',
        prompt: 'The backup vault is on sublevel three. You\'ve got a maintenance keycard that\'ll get you through the first two doors. The third door has a live guard.',
        choices: [
          {
            id: 'nl_ds_ghost',
            label: 'Ghost past when the guard does rounds',
            statCheck: { stat: 'ghost', threshold: 11 },
            pass: {
              text: 'You time his route, slip through the door during his two-minute walk to the east corridor. Clean. Silent. Professional.',
              branch: 'advance',
            },
            fail: {
              text: 'He doubles back early. You press into a service alcove and wait. Ten minutes of breathing shallow. Then you\'re through.',
              branch: 'advance',
            },
          },
          {
            id: 'nl_ds_face',
            label: 'Pose as a Helix IT contractor',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: '"Scheduled maintenance on the backup array." You flash the card, sign the log like you\'ve done it a hundred times. The guard waves you through.',
              branch: 'advance',
            },
            fail: {
              text: '"IT doesn\'t come through this entrance." You improvise: wrong floor, new contractor, bad directions. He buys it. Barely.',
              branch: 'advance',
            },
          },
          {
            id: 'nl_ds_rush',
            label: 'Wait for shift change and slip through',
            statCheck: { stat: 'grit', threshold: 10 },
            pass: {
              text: 'Shift change is chaos — two guards, a supervisor, coffee being handed around. You walk through the gap between "good night" and "good morning."',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'Shift change runs long. You wait an extra hour, then another guard shows up for overtime. You eventually find a gap but the clock is running.',
              branch: 'advance',
              effects: { rewardModifier: -0.05 },
            },
          },
        ],
      },
      {
        title: 'IN THE VAULT',
        prompt: 'You\'re at the terminal. The exec\'s browsing history is buried under three layers of indexing. You need to pull the right records without tripping the audit log.',
        choices: [
          {
            id: 'nl_ds_wire',
            label: 'Navigate the indexing with surgical precision',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'Three queries, two joins, one delete. The records vanish without a ripple. No audit trail. The exec owes Remi a very expensive drink.',
              branch: 'complete',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'You get the records deleted but the audit log catches a fingerprint. Harmless — it points to a ghost account — but not perfect.',
              branch: 'complete',
              effects: { rewardModifier: 0.05 },
            },
          },
          {
            id: 'nl_ds_delete',
            label: 'Just nuke the whole index and claim ignorance',
            statCheck: { stat: 'wire', threshold: 10 },
            pass: {
              text: 'DELETE * WHERE user_id = EXEC-774. Confirm. Done. The index has a hole the size of a fist but no one\'s auditing backup vaults this week.',
              branch: 'complete',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'The delete cascades. Three other execs lose their backup records. Helix IT will have a bad Monday but no one traces it to you.',
              branch: 'complete',
            },
          },
        ],
      },
    ],
    successNarration: 'Records scrubbed. Remi sends payment. "Exec-774 sends their thanks. They\'d say it in person but they can\'t be seen with people like us."',
    failureNarration: 'Partial scrub — some records remain. Remi pays a fraction. "Better than nothing. The exec can explain the rest."',
    abortNarration: 'You walked. Remi pockets the job deposit. The exec will have to live with their search history.',
  },

  {
    id: 'con_neutral_low_rat_catcher',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'pyre',
    moduleNumber: 'N-L03',
    questline: 'Odd Jobs',
    questlineStage: 3,
    name: 'RAT_CATCHER',
    description: 'A community block in Lowport has a nest. Not rats — synth-drones. Someone\'s been reprogramming cleaning drones to steal from apartments. Find the nest. Smash it. Simple.',
    payout: 1200,
    deposit: 0,
    exp: 70,
    stages: [
      {
        title: 'LOCATE THE NEST',
        prompt: 'The drones hit three buildings on the block. You need to trace their return path. There\'s a maintenance access that runs behind all three — probably where they\'re staging.',
        choices: [
          {
            id: 'nl_rc_trace',
            label: 'Hack a drone\'s nav log to trace the control signal',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'You snag a drone mid-route, pull its nav log. The return signal points to a maintenance closet in Building C. Textbook.',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'The drone\'s log is encrypted. You get a general direction but it takes an extra hour of physical searching to find the nest.',
              branch: 'advance',
            },
          },
          {
            id: 'nl_rc_follow',
            label: 'Follow a drone during its next run',
            statCheck: { stat: 'ghost', threshold: 10 },
            pass: {
              text: 'You tail a drone at rooftop level, parkouring between buildings. It leads you straight to the maintenance closet. The operator never saw you coming.',
              branch: 'advance',
              effects: { rewardModifier: 0.05 },
            },
            fail: {
              text: 'You lose the drone in a crosswind. But the general direction narrows the search and you find the nest twenty minutes later.',
              branch: 'advance',
            },
          },
          {
            id: 'nl_rc_network',
            label: 'Poll the building\'s network for unauthorized devices',
            statCheck: { stat: 'wire', threshold: 10 },
            pass: {
              text: 'Building C\'s network is a sieve. You spot the rogue control box in thirty seconds. Amateur hour.',
              branch: 'advance',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'The network is too noisy — too many authorized devices. You eventually narrow it down to Building C but it costs you time.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        title: 'SMASH THE NEST',
        prompt: 'The maintenance closet is rigged. Deadbolts, a motion sensor, and someone inside — probably the drone operator. They know someone\'s been poking around.',
        choices: [
          {
            id: 'nl_rc_breach',
            label: 'Breach and clear — kick in the door',
            statCheck: { stat: 'grit', threshold: 11 },
            pass: {
              text: 'You put your shoulder through the door. The operator — a teenage netrunner with more talent than sense — is too surprised to react. You smash the control box. Nest neutralized.',
              branch: 'complete',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'The deadbolt holds on the first hit. You lose the element of surprise. By the time you\'re in, the operator has fled and wiped half the evidence.',
              branch: 'complete',
            },
          },
          {
            id: 'nl_rc_talk',
            label: 'Talk them down — they\'re just a kid',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: '"I know you\'re in there. You\'re good — but you\'re going to get caught by someone less friendly than me. Shut it down and walk away." Silence. Then the lock clicks open. The closet is empty. The control box has a sticky note: "thanks."',
              branch: 'complete',
              effects: { rewardModifier: 0.2 },
            },
            fail: {
              text: '"Go away," a voice says through the door. "I\'ll stop. Just don\'t — don\'t tell my mom." You smash the control box from outside via a junction panel. Close enough.',
              branch: 'complete',
            },
          },
          {
            id: 'nl_rc_remote',
            label: 'Overload the control box remotely',
            statCheck: { stat: 'wire', threshold: 11 },
            pass: {
              text: 'You send a voltage spike through the junction panel. The control box fries with a satisfying POP. The drones drop from the sky. Nest neutralized, no drama.',
              branch: 'complete',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'The spike overloads wrong. The control box reboots instead of frying. You have to go in physically anyway. The operator is gone but the box is still there to smash.',
              branch: 'complete',
            },
          },
        ],
      },
    ],
    successNarration: 'Drones terminated. The community block pools together a bonus. Pyre forwards it with a note: "Not my usual thing. But the neighborhood liked it."',
    failureNarration: 'Some drones are still active. The community pays half — they\'ll hire someone else to finish the job.',
    abortNarration: 'You left the nest intact. Pyre marks the contract "abandoned." The neighborhood will find someone else.',
  },

  // ── MID tier: extraction / retrieval / infiltration (no politics) ───────────
  {
    id: 'con_neutral_mid_extraction',
    tier: 'MID',
    teamLevelRequired: 4,
    fixerId: 'nyx',
    moduleNumber: 'N-M01',
    questline: 'Grey Market',
    questlineStage: 1,
    name: 'CLEAN_EXTRACTION',
    description: 'A corpo scientist wants out. No corporate espionage, no stolen data — just a person who wants to disappear. Extract them from Helix Tower during a maintenance window. They\'ll be waiting on the 14th floor.',
    payout: 5000,
    deposit: 0,
    exp: 250,
    stages: [
      {
        title: 'THE APPROACH',
        prompt: 'Helix Tower\'s maintenance window is 0200-0400. You have a cloned badge for the service elevator. The 14th floor is restricted — but the scientist says the night guard takes a thirty-minute break at 0230.',
        choices: [
          {
            id: 'nce_ghost_elevator',
            label: 'Take the service elevator during guard break',
            statCheck: { stat: 'ghost', threshold: 12 },
            pass: {
              text: '0231. The guard\'s chair is empty. You ride the service elevator to 14 without a single camera catching your face. The scientist is waiting with a go-bag.',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'The guard comes back early. You hear footsteps as the door opens. You duck into a supply closet. The scientist slips you a keycard for the stairwell instead.',
              branch: 'advance',
            },
          },
          {
            id: 'nce_stair_climb',
            label: 'Take the stairs — fourteen floors, no cameras',
            statCheck: { stat: 'grit', threshold: 12 },
            pass: {
              text: 'Fourteen flights. Your legs burn but you\'re invisible the whole way. No cameras in the stairwell. No guards. The scientist is impressed: "Most people take the elevator."',
              branch: 'advance',
              effects: { rewardModifier: 0.05 },
            },
            fail: {
              text: 'Ten floors in, you trip a motion sensor. A sub-patrol is dispatched. You have to wait them out in a stairwell alcove. The scientist texts: "Still here. Hurry."',
              branch: 'advance',
              effects: { rewardModifier: -0.1 },
            },
          },
          {
            id: 'nce_disguise',
            label: 'Disguise as a maintenance worker',
            statCheck: { stat: 'face', threshold: 12 },
            pass: {
              text: '"HVAC inspection." You flash the badge and a clipboard. The guard barely looks up. The scientist walks out with you in a maintenance jumpsuit, head down, just another worker on a graveyard shift.',
              branch: 'advance',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: '"HVAC doesn\'t run inspections at 2 AM." You improvise: emergency call, system failure, overtime pay. The guard squints but lets you through.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        title: 'THE EXIT',
        prompt: 'You\'ve got the scientist. But the lobby has a Grammaton security detail — someone tipped them that an extraction was happening tonight. They don\'t know which floor, but they\'re checking IDs at every exit.',
        choices: [
          {
            id: 'nce_exit_roof',
            label: 'Exit via the roof and zipline to the parking structure',
            statCheck: { stat: 'edge', threshold: 13 },
            pass: {
              text: 'You clip the scientist to your harness. Zip. Forty meters across open air. They scream in your ear the whole way, but you land on the parking structure clean.',
              branch: 'complete',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'The scientist panics at the edge. You talk them through it — slowly, one step at a time. The zipline works but you lost precious minutes.',
              branch: 'complete',
            },
          },
          {
            id: 'nce_exit_underground',
            label: 'Go down — through the subbasement loading dock',
            statCheck: { stat: 'ghost', threshold: 12 },
            pass: {
              text: 'Subbasement four. Loading dock for chemical shipments. No one checks IDs here — they\'re too worried about the hazmat labels. You and the scientist walk out between two tankers.',
              branch: 'complete',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'The dock has a skeleton crew. You time their movements and slip through during a forklift pass. Close call, but clean exit.',
              branch: 'complete',
            },
          },
          {
            id: 'nce_exit_front',
            label: 'Walk out the front door with forged credentials',
            statCheck: { stat: 'face', threshold: 13 },
            pass: {
              text: '"Dr. Chen, night consultation." You hand over the forged badge. The Grammaton guard checks her list — Chen isn\'t on it. You hold eye contact. She waves you through.',
              branch: 'complete',
              effects: { rewardModifier: 0.2 },
            },
            fail: {
              text: 'The guard hesitates. You launch into a monologue about HIPAA compliance and patient confidentiality until her eyes glaze over. She waves you through to shut you up.',
              branch: 'complete',
              effects: { rewardModifier: 0.05 },
            },
          },
        ],
      },
    ],
    successNarration: 'The scientist is free. Nyx transfers the full payment. "They\'ll be on a transport to the outer territories by morning. You gave someone a second life tonight."',
    failureNarration: 'Extraction was messy. The scientist made it out but Grammaton has a partial description. Nyx pays half.',
    abortNarration: 'You abandoned the extraction. The scientist is still on the 14th floor, waiting. Nyx doesn\'t charge you — but she doesn\'t call for a month.',
  },

  {
    id: 'con_neutral_mid_salvage',
    tier: 'MID',
    teamLevelRequired: 5,
    fixerId: 'dusk',
    moduleNumber: 'N-M02',
    questline: 'Grey Market',
    questlineStage: 2,
    name: 'DEEP_SALVAGE',
    description: 'A cargo hauler crashed into the Undercity two weeks ago. The salvage rights are tied up in litigation. Dusk wants you to grab the manifest computer before the legal teams sort it out. The crash site is unstable — and you\'re not the only crew looking.',
    payout: 6500,
    deposit: 0,
    exp: 350,
    stages: [
      {
        title: 'NIGHT DIVE',
        prompt: 'The crash site is four levels down, past active utility conduits and a collapsed transit tunnel. You have two routes: the maintenance spine (faster, louder) or the old aqueduct (slower, safer).',
        choices: [
          {
            id: 'nds_spine',
            label: 'Take the maintenance spine — fastest route',
            statCheck: { stat: 'grit', threshold: 13 },
            pass: {
              text: 'You move through the spine at speed, vaulting conduits and squeezing through collapsed sections. The noise echoes off metal — but no one\'s down here to hear it. You reach the crash site first.',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'A conduit blows two junctions ahead. You have to backtrack and take the long way. The other crew has a head start.',
              branch: 'advance',
              effects: { rewardModifier: -0.1 },
            },
          },
          {
            id: 'nds_aqueduct',
            label: 'Navigate the old aqueduct — quiet approach',
            statCheck: { stat: 'ghost', threshold: 12 },
            pass: {
              text: 'The aqueduct is dry now — just echoes and rat bones. You move silently through the dark, emerging at the crash site from an angle no one was watching.',
              branch: 'advance',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'The aqueduct takes longer than expected — three collapsed sections you have to climb around. You arrive at the crash site to find the other crew already there.',
              branch: 'advance',
            },
          },
          {
            id: 'nds_transit',
            label: 'Cut through the collapsed transit tunnel',
            statCheck: { stat: 'wire', threshold: 13 },
            pass: {
              text: 'The transit tunnel\'s still semi-powered. You reroute a junction box, cut through a maintenance hatch, and emerge practically on top of the crash site. Efficiency.',
              branch: 'advance',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'The junction box sparks. You zap yourself — not serious, but it slows you down. The other crew\'s lights are already visible at the crash site when you arrive.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        title: 'THE OTHER CREW',
        prompt: 'Rival salvagers — three of them. They\'ve got the manifest computer\'s casing open already. They haven\'t seen you yet.',
        choices: [
          {
            id: 'nds_crew_intimidate',
            label: 'Intimidate them into backing off',
            statCheck: { stat: 'face', threshold: 13 },
            pass: {
              text: '"That\'s Dusk\'s salvage." The name lands like a punch. Two of them step back. The third hesitates, then nods. "Tell Dusk we didn\'t know." They leave the computer and walk.',
              branch: 'complete',
              effects: { rewardModifier: 0.2 },
            },
            fail: {
              text: '"Dusk\'s not here." The lead salvager doesn\'t flinch. You negotiate a split — you get the data core, they get the rest. Not what Dusk wanted, but nobody bleeds.',
              branch: 'complete',
              effects: { rewardModifier: 0.05 },
            },
          },
          {
            id: 'nds_crew_ghost',
            label: 'Snatch the drive while they argue about the casing',
            statCheck: { stat: 'ghost', threshold: 13 },
            pass: {
              text: 'They\'re arguing about the casing — someone stripped a bolt. You ghost up behind them, pop the drive, and disappear into the dark before they even notice the weight change in the chassis.',
              branch: 'complete',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'You get the drive but one of them spots your reflection in the chassis panel. They shout. You run. They chase for a block and give up. You keep the drive.',
              branch: 'complete',
            },
          },
          {
            id: 'nds_crew_talk',
            label: 'Propose a temporary alliance — split the haul',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: '"Dusk wants the data. You want the hardware. We can both walk away happy." The lead salvager thinks about it, then grins. "Smart. Tell Dusk we said hello." Everyone wins.',
              branch: 'complete',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: '"Trust a stranger at a crash site? Nah." It gets tense for a moment, but cooler heads prevail. You make a deal where everyone walks.',
              branch: 'complete',
            },
          },
        ],
      },
    ],
    successNarration: 'The manifest is in Dusk\'s hands. "Good work. The data\'s worth more than the hauler was." Full payment plus a note: "You work clean. That\'s rare down here."',
    failureNarration: 'Partial salvage. The other crew got some of the data. Dusk pays a fraction.',
    abortNarration: 'You left the site. Dusk marks the contract void. Someone else will pick the bones.',
  },
];
