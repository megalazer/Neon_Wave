export const LOW_CONTRACTS = [
  {
    id: 'con_low_signal_tap',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'remi',
    moduleNumber: 'C-L01',
    questline: "Remi's Net",
    questlineStage: 1,
    cyberwareReward: { pool: 'LOW', chance: 0.5 },
    name: 'SIGNAL_TAP',
    faction: 'fac_signal',
    factionRepReward: 10,
    factionRepPenalty: 6,
    description: 'Intercept a corporate data stream relay in Lowport. Plant the tap, pull the feed, disappear.',
    payout: 1400,
    deposit: 0,
    exp: 90,
    stages: [
      {
        id: 'sl_approach',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'LOCATE RELAY',
        prompt: 'The relay node is in a maintenance tunnel under Lowport. You have partial coordinates. Breach the access grid to pinpoint it, or move blind and trust instinct.',
        choices: [
          {
            id: 'sl_hack',
            label: 'Breach access grid',
            statCheck: { stat: 'wire', threshold: 11 },
            pass: {
              text: 'Your deck slips through the grid\'s soft spots. Relay confirmed. You\'re in the tunnel before anyone notices the ping.',
              branch: 'advance',
            },
            fail: {
              text: 'Grid pings you. You disconnect in time but navigate blind. Costs twenty minutes.',
              branch: 'advance',
            },
          },
          {
            id: 'sl_instinct',
            label: 'Move blind, trust instincts',
            outcome: {
              text: 'Old-fashioned. Follow the cable runs, listen for hum. Longer, no footprint.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'sl_plant',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'PLANT THE TAP',
        prompt: 'Relay node is live. Planting the tap takes sixty seconds. A maintenance worker is two corridors away. Work fast and noisy, or slow and clean.',
        choices: [
          {
            id: 'sl_fast',
            label: 'Work fast, accept traces',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'Tap\'s in before the worker finishes their smoke break. Clean install.',
              branch: 'advance',
            },
            fail: {
              text: 'You fumble the splice. Tap connects but the data quality is degraded. Partial feed only.',
              branch: 'advance',
            },
          },
          {
            id: 'sl_slow',
            label: 'Work clean, take the risk',
            statCheck: { stat: 'wire', threshold: 10 },
            pass: {
              text: 'Perfect install. Tap will run for weeks before anyone finds it.',
              branch: 'advance',
            },
            fail: {
              text: 'Worker doubles back early. You freeze, duck into a side duct. Close.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'sl_exfil',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'EXFIL CLEAN',
        prompt: 'Job\'s done. Exit: back through the access tunnel, empty but long, or service entrance that puts you on the main street. Faster, visible.',
        choices: [
          {
            id: 'sl_tunnel',
            label: 'Back through the tunnel',
            outcome: {
              text: "Quiet exit. Nobody sees you. Remi confirms the tap is transmitting. Credits inbound. Remi's Net tightens \u2014 this is the first node.",
              branch: 'advance',
            },
          },
          {
            id: 'sl_street',
            label: 'Street exit, blend in',
            statCheck: { stat: 'face', threshold: 10 },
            pass: {
              text: 'You blend into foot traffic like you belong. Clean.',
              branch: 'advance',
            },
            fail: {
              text: 'Patrol scanner flags your ID. You bluff through, but your face is in their log.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'Signal tap operational. Data stream intercepted. Remi transfers full payout, minus commission.',
    failureNarration: 'Tap was found and burned. Remi pays a fraction. More than nothing, less than agreed.',
    abortNarration: 'You pulled the job mid-run. Remi marks the abort in the ledger. No payout.',
  },

  {
    id: 'con_low_package_run',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'nyx',
    moduleNumber: 'C-L02',
    questline: "Nyx's Underground",
    questlineStage: 1,
    cyberwareReward: { pool: 'LOW', chance: 0.4 },
    name: 'PACKAGE_RUN',
    faction: 'fac_undertow',
    factionRepReward: 10,
    factionRepPenalty: 6,
    description: 'Three-stop courier run. Package origin unspecified. Delivery windows tight. No questions.',
    payout: 1000,
    deposit: 0,
    exp: 60,
    stages: [
      {
        id: 'pr_pickup',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'PICKUP',
        prompt: 'Package is in a locker at Saltgate transit hub. The key code Nyx sent is a single-use cipher. Decode it on the fly, or talk your way in.',
        choices: [
          {
            id: 'pr_cipher',
            label: 'Decode the cipher',
            statCheck: { stat: 'wire', threshold: 10 },
            pass: {
              text: 'Cipher decodes in under a minute. Black case, no markings. You don\'t ask.',
              branch: 'advance',
            },
            fail: {
              text: 'Misread a character. Second attempt works. Two minutes behind schedule.',
              branch: 'advance',
            },
          },
          {
            id: 'pr_bluff',
            label: 'Talk the hub attendant into it',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: 'Attendant opens the locker without blinking. You can be charming when it matters.',
              branch: 'advance',
            },
            fail: {
              text: 'Attendant asks for verification you don\'t have. You bail and use the cipher after all.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'pr_checkpoint',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'CHECKPOINT',
        prompt: 'Second stop runs through an Onyx Bureau patrol corridor. Vehicle scans running. Reroute through back streets, longer, invisible, or push straight through.',
        choices: [
          {
            id: 'pr_reroute',
            label: 'Reroute through back streets',
            outcome: {
              text: 'Longer route, zero contact. Package arrives at second drop intact. Clock is tighter now.',
              branch: 'advance',
            },
          },
          {
            id: 'pr_straight',
            label: 'Push straight through',
            statCheck: { stat: 'grit', threshold: 12 },
            pass: {
              text: 'Scanner pings the case. You meet the patrol officer\'s eyes and don\'t blink. Waved through.',
              branch: 'advance',
            },
            fail: {
              text: 'Scanner flags an anomaly. You ditch the case in a trash chute, recover it two blocks later. Patrol logged your face.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'pr_delivery',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'FINAL DELIVERY',
        prompt: 'Last stop is a Lantern Row teahouse. Contact has a silver cochlear implant. She\'ll ask for a code word. Nyx gave you three options; only one is right. Read her, or ping Nyx.',
        choices: [
          {
            id: 'pr_read',
            label: 'Read her, pick the word',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: 'You catch the micro-tension in her jaw. Wrong word would have gotten you shot. Correct.',
              branch: 'advance',
            },
            fail: {
              text: 'Wrong word. You correct yourself fast. "Testing response time." She doesn\'t smile, but she takes the package.',
              branch: 'advance',
            },
          },
          {
            id: 'pr_signal',
            label: 'Ping Nyx for the code',
            statCheck: { stat: 'wire', threshold: 10 },
            pass: {
              text: 'Nyx sends back the word in three seconds. Clean.',
              branch: 'advance',
            },
            fail: {
              text: 'Signal bounces in Lantern Row\'s mesh fog. You guess. You guess right.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'Package delivered. Three stops, no casualties. Nyx sends the full transfer and a note: "Solid run." Solid run. Nyx adds you to a private channel. \'Package Run\' is entry-level \u2014 the real jobs come after you prove yourself.',
    failureNarration: 'Delivery chain broke. Nyx pays partial. No note.',
    abortNarration: 'You left the package. Nyx doesn\'t say anything. That\'s worse.',
  },

  {
    id: 'con_low_ghost_entry',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'remi',
    moduleNumber: 'C-L03',
    questline: "Remi's Net",
    questlineStage: 2,
    cyberwareReward: { pool: 'LOW', chance: 0.4 },
    name: 'GHOST_ENTRY',
    faction: 'fac_undertow',
    factionRepReward: 10,
    factionRepPenalty: 6,
    description: 'After-hours breach of a low-sec Referent energy office. Extract three files. No alarms.',
    payout: 1600,
    deposit: 0,
    exp: 100,
    stages: [
      {
        id: 'ge_entry',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'BREACH ENTRY',
        prompt: "Remi's data from the signal tap pointed here. The building runs Grammaton Gen-2 keypad auth. Hard-bypass the hardware, or use the janitor's badge credentials Remi pulled.",
        choices: [
          {
            id: 'ge_bypass',
            label: 'Hard-bypass the keypad',
            statCheck: { stat: 'wire', threshold: 11 },
            pass: {
              text: 'Clean bypass. Door opens like you work there.',
              branch: 'advance',
            },
            fail: {
              text: 'You trip a secondary check. Door locks out ninety seconds. You wait, exposed on the street.',
              branch: 'advance',
            },
          },
          {
            id: 'ge_spoof',
            label: 'Spoof the janitor\'s badge',
            outcome: {
              text: 'Badge scan clears. Janitor\'s shift ended four hours ago; their access is still live.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'ge_navigate',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'NAVIGATE FLOORS',
        prompt: 'Target files are on the third floor. A security drone runs a slow circuit between floors two and three. Time your movement, or jack the drone.',
        choices: [
          {
            id: 'ge_timing',
            label: 'Time the movement',
            statCheck: { stat: 'grit', threshold: 11 },
            pass: {
              text: 'You read the pattern and move on the drone\'s blind pass. Third floor, clean.',
              branch: 'advance',
            },
            fail: {
              text: 'You mistime. Drone pings you but doesn\'t flag. Faulty sensor array. You clear the floor anyway.',
              branch: 'advance',
            },
          },
          {
            id: 'ge_jack',
            label: 'Jack the drone',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'Drone is yours for six minutes. You walk to the elevator, casual.',
              branch: 'advance',
            },
            fail: {
              text: 'Jack attempt trips an intrusion flag. Drone goes offline, maintenance alert fires. You move fast.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'ge_extract',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'EXTRACT FILES',
        prompt: 'Terminal is behind a corporate encryption suite. Fast crack leaves traces. Clean crack takes time you might not have.',
        choices: [
          {
            id: 'ge_fast',
            label: 'Fast crack, accept traces',
            statCheck: { stat: 'wire', threshold: 10 },
            pass: {
              text: 'Files out in forty seconds. Traces found eventually. You\'ll be long gone.',
              branch: 'advance',
            },
            fail: {
              text: 'Crack tool errors twice. Files retrieved but terminal logs the attempt. Remi notes it.',
              branch: 'advance',
            },
          },
          {
            id: 'ge_clean',
            label: 'Clean crack, take the time',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'Three minutes. Zero traces. Like you were never there.',
              branch: 'advance',
            },
            fail: {
              text: 'Encryption suite wakes up halfway through. You pull what you can and run. Partial data.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'Three files extracted, no alarm. Remi marks it clean. Two nodes in the net. One more and the picture sharpens.',
    failureNarration: 'Files were incomplete or corrupt. Remi pays half. "Better luck on the clean crack."',
    abortNarration: 'Extraction aborted. You left empty. Remi refunds nothing.',
  },

  {
    id: 'con_low_debt_collection',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'pyre',
    moduleNumber: 'C-L04',
    questline: "Nyx's Underground",
    questlineStage: 2,
    cyberwareReward: { pool: 'LOW', chance: 0.5 },
    name: 'DEBT_COLLECTION',
    faction: 'fac_undertow',
    factionRepReward: 10,
    factionRepPenalty: 6,
    description: 'Rustline loan shark wants his eddies back. Mark is hiding. Pyre wants results, not reports.',
    payout: 1200,
    deposit: 0,
    exp: 80,
    stages: [
      {
        id: 'dc_locate',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'LOCATE THE MARK',
        prompt: "Nyx called in a marker. Your courier work earned trust \u2014 now she needs muscle. The mark, who calls himself Ticho, dropped off the grid three days ago. Last seen at a Rustline bar. Burn a local contact or trace his last comm ping.",
        choices: [
          {
            id: 'dc_contacts',
            label: 'Burn a local contact',
            statCheck: { stat: 'face', threshold: 10 },
            pass: {
              text: 'A barkeep points you to a maintenance squat under Overpass 7. Ticho\'s been there two days.',
              branch: 'advance',
            },
            fail: {
              text: 'Nobody\'s talking. You trace a comm ping instead. Takes longer, works.',
              branch: 'advance',
            },
          },
          {
            id: 'dc_trace',
            label: 'Trace his last comm ping',
            statCheck: { stat: 'wire', threshold: 11 },
            pass: {
              text: 'Ping triangulates to a squat under Overpass 7. Mark confirmed.',
              branch: 'advance',
            },
            fail: {
              text: 'Ping bounces through a relay. Close enough. Southeast Rustline, maintenance area.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'dc_confront',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'CONFRONTATION',
        prompt: 'Ticho\'s cornered in the squat with two small-time runners. Talk him down or go loud.',
        choices: [
          {
            id: 'dc_talk',
            label: 'Talk him down',
            statCheck: { stat: 'face', threshold: 12 },
            pass: {
              text: 'Ticho folds fast. You walk out with a partial payment and a promise. His crew is relieved.',
              branch: 'advance',
            },
            fail: {
              text: 'Ticho doesn\'t believe you won\'t hurt him. His crew gets jumpy.',
              branch: 'advance',
            },
          },
          {
            id: 'dc_fight',
            label: 'Make an example',
            outcome: {
              text: 'You go in hard. What happens next decides the rest.',
              branch: 'triggersBattle',
              onVictory: {
                branch: 'advance',
                text: 'Ticho\'s crew is down. He\'s extremely cooperative now.',
              },
              onDefeat: {
                branch: 'fail',
                text: 'His crew was better than they looked. You retreat. Pyre writes the contract off.',
              },
            },
          },
        ],
      },
      {
        id: 'dc_collect',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'COLLECT',
        prompt: 'Ticho says he spent half. He\'ll hand over credits plus a cred chip, or sign over hardware worth the balance, but you\'d need to verify it.',
        choices: [
          {
            id: 'dc_cash',
            label: 'Take the credits',
            outcome: {
              text: 'Half now, half on credit. Pyre will be annoyed. But you have something to show.',
              branch: 'advance',
            },
          },
          {
            id: 'dc_hardware',
            label: 'Verify and take the hardware',
            statCheck: { stat: 'wire', threshold: 11 },
            pass: {
              text: 'Military-grade optical array, worth more than the debt. Pyre is pleased.',
              branch: 'complete',
            },
            fail: {
              text: 'Hardware is counterfeit. You take the credits instead.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'Debt collected. Pyre sends the transfer: "Don\'t make it complicated next time."',
    failureNarration: 'Collection failed. Pyre covers a fraction of the agreed rate. Grudgingly.',
    abortNarration: 'You walked away from the mark. Pyre doesn\'t work with quitters.',
  },

  {
    id: 'ct_underlevel_rescue',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'remi',
    moduleNumber: 'C-L05',
    questline: "Nyx's Underground",
    questlineStage: 3,
    cyberwareReward: { pool: 'LOW', chance: 0.5 },
    name: 'UNDERLEVEL_RESCUE',
    faction: 'fac_undertow',
    factionRepReward: 12,
    factionRepPenalty: 6,
    minFactionRep: 'FRIENDLY',
    description: 'A family in Saltgate is paying to get their daughter back from Red Chrome. Remi says quick and quiet. You say: define quick.',
    payout: 1800,
    deposit: 0,
    exp: 120,
    stages: [
      {
        id: 'ur_contact',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'THE TIP',
        prompt: 'Remi\'s contact is a woman named Hana. Runs a noodle stall two blocks from the Red Chrome perimeter. She has partial building schematics and knows the crew rotation. Pay 200 for them, or work with what Remi streamed you.',
        choices: [
          {
            id: 'ur_buy_schematic',
            label: 'Buy Hana\'s schematics (200 CR)',
            requires: { credits: 200 },
            outcome: {
              text: 'Hana slides a grimy printout across the counter. Three men on the lower floors, rotating every two hours. You\'re going in with a real layout.',
              branch: 'advance',
              effects: { credits: -200, rewardModifier: 0.2 },
            },
          },
          {
            id: 'ur_work_blind',
            label: 'Work Remi\'s partial data',
            statCheck: { stat: 'wire', threshold: 11 },
            pass: {
              text: 'You stitch Remi\'s fragments into something usable. Gaps, but enough to map the approach.',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'Remi\'s data is too thin. Partial floor plan, no rotation intel. You\'ll be navigating blind past the first corridor.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'ur_entry',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'QUIET ENTRY',
        prompt: 'The girl, Daya, is on the third floor of a repurposed commercial block. Two ways up: ghost the service stairwell, or pay the ground-floor watch to look the other way. He\'s asking 300.',
        choices: [
          {
            id: 'ur_bribe_watch',
            label: 'Pay the watch (300 CR)',
            requires: { credits: 300 },
            outcome: {
              text: 'The guard pockets the eddies without eye contact. You\'re through and moving before he finishes counting.',
              branch: 'advance',
              effects: { credits: -300, rewardModifier: 0.15 },
            },
          },
          {
            id: 'ur_ghost_stair',
            label: 'Ghost through the stairwell',
            statCheck: { stat: 'ghost', threshold: 12 },
            pass: {
              text: 'Silent movement. Third floor without a single alert triggered. Clean approach.',
              branch: 'advance',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'A loose grate. One of them hears something. You press flat and wait. Two full minutes that feel like twenty. They don\'t investigate.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'ur_enforcer',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'ONE OBSTACLE',
        prompt: 'Daya is behind a locked room at the end of the hall. Between you and her: one Red Chrome enforcer, augmented, bored, half-turned away. You could slip past him. Or you could end the conversation permanently.',
        choices: [
          {
            id: 'ur_slip_past',
            label: 'Slip past the enforcer',
            statCheck: { stat: 'ghost', threshold: 12 },
            pass: {
              text: 'You move like smoke. He never turns around. Daya\'s door is ahead.',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'He spins. Recognition lights his eyes. There\'s no talking out of this.',
              branch: 'triggersBattle',
              onVictory: {
                branch: 'advance',
                text: 'Down. Daya\'s door opens before the echo clears.',
              },
              onDefeat: {
                branch: 'fail',
                text: 'The enforcer drops you on the floor. You wake up in the alley. Daya is still up there.',
              },
            },
          },
          {
            id: 'ur_take_enforcer',
            label: 'Take the enforcer down',
            outcome: {
              text: 'No hesitation. You move first. The hallway decides the rest.',
              branch: 'triggersBattle',
              onVictory: {
                branch: 'advance',
                text: 'Clean. You step over him and knock twice on Daya\'s door.',
                effects: { rewardModifier: 0.1 },
              },
              onDefeat: {
                branch: 'fail',
                text: 'He was better than he looked. You pull back empty-handed.',
              },
            },
          },
        ],
      },
      {
        id: 'ur_handoff',
        stageNumber: 4,
        label: 'STAGE_04',
        title: 'CLEAN EXIT',
        prompt: 'Daya is with you. Rattled but mobile. Red Chrome will sweep this block within the hour. Remi wants a clean delivery to her designated drop, professional, traceable, commission intact. Or you return Daya to the family direct. Cuts Remi\'s take. She\'ll hear about it.',
        choices: [
          {
            id: 'ur_remi_drop',
            label: 'Deliver to Remi\'s drop point',
            outcome: {
              text: 'Professional. Remi confirms receipt in real time. Transfer follows. She notes the clean execution in the ledger.',
              branch: 'complete',
              effects: { rewardModifier: 0.1 },
            },
          },
          {
            id: 'ur_direct_return',
            label: 'Return directly to the family',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: 'The family is waiting two blocks over. What the girl says when she sees her mother you won\'t repeat. Remi sends a terse message an hour later: "Noted." The difference in the cut hits your account anyway.',
              branch: 'complete',
              effects: { rewardModifier: 0.25, fixerRep: -1 },
            },
            fail: {
              text: 'The family panics when you show up unannounced. Ten minutes of chaos before they trust you. Daya is home. Remi is not impressed with the approach.',
              branch: 'complete',
              effects: { rewardModifier: -0.1 },
            },
          },
        ],
      },
    ],
    successNarration: 'Daya delivered. Family pays. Remi transfers her commission. The underlevel op cements your rep in Nyx\'s crew. Three jobs deep. You\'re not just a runner anymore.',
    failureNarration: 'Extraction failed. Remi pays a fraction. She covered the logistics cost and nothing more.',
    abortNarration: 'You pulled out mid-run. Daya stays where she is. Remi marks the abort and says nothing, which is worse.',
  },

  // ── Rep seed contracts: faction entry jobs ─────────────────────────────────
  {
    id: 'con_low_signal_drone_wake',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'remi',
    moduleNumber: 'C-L06',
    questline: "Remi's Net",
    questlineStage: 3,
    cyberwareReward: { pool: 'LOW', chance: 0.4 },
    name: 'DRONE_WAKE',
    faction: 'fac_signal',
    factionRepReward: 15,
    factionRepPenalty: 7,
    description: 'A Signal maintenance swarm woke up angry after a Static ghost-script hit the local pipe. Trace the bad code, then decide whether to purge the drones or put them down.',
    payout: 1700,
    deposit: 0,
    exp: 110,
    stages: [
      {
        id: 'dw_trace',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'BAD WAKE',
        prompt: 'Six relay drones are circling a commuter bridge, screaming packet noise into every public channel. Signal wants the source tagged before the city sends heavier guns.',
        choices: [
          {
            id: 'dw_sniff',
            label: 'Sniff the ghost-script trail',
            statCheck: { stat: 'wire', threshold: 11 },
            pass: {
              text: 'Static fingerprints all over the wake command. You isolate the payload and mark the infected drones.',
              branch: 'advance',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'The script keeps shedding false trails. You still tag the infected drones, but Signal sees the delay.',
              branch: 'advance',
            },
          },
          {
            id: 'dw_climb',
            label: 'Climb the bridge spine for direct access',
            statCheck: { stat: 'grit', threshold: 11 },
            pass: {
              text: 'You crawl the bridge ribs while traffic screams below. Direct line to the swarm controller, clean read.',
              branch: 'advance',
            },
            fail: {
              text: 'A drone clips the rail near your hand. You keep climbing, slower and louder.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'dw_cull',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'CULL OR CLEAN',
        prompt: 'The drones are half-restored and half-feral. You can risk a remote purge, or shoot the swarm out of the air before it hits the market block.',
        choices: [
          {
            id: 'dw_purge',
            label: 'Remote-purge the wake command',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'The swarm drops into maintenance hover, obedient again. Signal likes a repair better than a replacement bill.',
              branch: 'complete',
              effects: { rewardModifier: 0.2 },
            },
            fail: {
              text: 'The purge only half-takes. You ground the closest drones with emergency shutdowns and Signal eats the hardware loss.',
              branch: 'complete',
            },
          },
          {
            id: 'dw_down',
            label: 'Put the swarm down',
            outcome: {
              text: 'You go loud. The drones answer with cutting lasers and panic-broadcast screams.',
              branch: 'triggersBattle',
              onVictory: {
                branch: 'complete',
                text: 'The last drone folds into sparks. Signal loses hardware, not face.',
                effects: { rewardModifier: 0.1 },
              },
              onDefeat: {
                branch: 'fail',
                text: 'The swarm drives you off the bridge. Signal has to black out the whole block to end it.',
              },
            },
          },
        ],
      },
    ],
    successNarration: 'Signal logs the drone wake contained and the Static payload archived. Remi sends the payout with a new trust flag attached.',
    failureNarration: 'The wake spreads before Signal can clamp it. Remi pays for the attempt, not the cleanup.',
    abortNarration: 'You left the swarm screaming over the market. Signal remembers the dropped call.',
  },

  {
    id: 'con_low_lexicon_bloodscript',
    tier: 'LOW',
    teamLevelRequired: 2,
    fixerId: 'kade',
    moduleNumber: 'C-L07',
    questline: null,
    questlineStage: null,
    cyberwareReward: { pool: 'LOW', chance: 0.4 },
    name: 'BLOODSCRIPT_SAMPLE',
    faction: 'fac_lexicon',
    factionRepReward: 12,
    factionRepPenalty: 7,
    description: 'The Lexicon wants a stolen clinic sample before the patient record updates. No sermon, no kidnapping — just one vial and the metadata attached to it.',
    payout: 1900,
    deposit: 0,
    exp: 120,
    stages: [
      {
        id: 'bs_window',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'CLINIC WINDOW',
        prompt: 'The sample sits in a street clinic fridge for one hour before courier pickup. Pose as emergency maintenance, or slip through the patient intake crush.',
        choices: [
          {
            id: 'bs_maintenance',
            label: 'Pose as emergency maintenance',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: 'You sell the lie with a badged tablet and two impatient sighs. The clinic manager points you at the cold room.',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'The manager wants a work order number. You improvise one and get waved through after a tense minute.',
              branch: 'advance',
            },
          },
          {
            id: 'bs_intake',
            label: 'Ride the patient intake crowd',
            statCheck: { stat: 'ghost', threshold: 11 },
            pass: {
              text: 'You move with the queue until the camera angle breaks. One door, one badge swipe cloned, you are inside.',
              branch: 'advance',
            },
            fail: {
              text: 'A nurse almost spots you. A spilled med tray buys the distraction you need.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'bs_fridge',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'COLD CHAIN',
        prompt: 'The vial is locked in a smart fridge that logs every open event. Crack the fridge quietly, or spoof the courier pickup early.',
        choices: [
          {
            id: 'bs_crack',
            label: 'Crack the smart fridge',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'The fridge opens without a log entry. Vial in cold sleeve, metadata copied, no one wiser.',
              branch: 'complete',
              effects: { rewardModifier: 0.2 },
            },
            fail: {
              text: 'The fridge logs a maintenance open. You pull the vial anyway and bury the event in noise.',
              branch: 'complete',
            },
          },
          {
            id: 'bs_spoof',
            label: 'Spoof courier pickup',
            statCheck: { stat: 'face', threshold: 12 },
            pass: {
              text: 'You become the courier for ninety seconds. Signature accepted, vial released.',
              branch: 'complete',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'The courier code is stale. You talk fast, blame dispatch, and leave before anyone calls back.',
              branch: 'complete',
            },
          },
        ],
      },
    ],
    successNarration: 'The Lexicon receives blood and metadata. Kade says the word for trust is written in small jobs first.',
    failureNarration: 'The sample degraded before delivery. The Lexicon pays for effort and nothing sacred.',
    abortNarration: 'You walked from the clinic empty. The sample entered official custody and left your reach.',
  },

  {
    id: 'con_low_grammaton_badge_check',
    tier: 'LOW',
    teamLevelRequired: 2,
    fixerId: 'kade',
    moduleNumber: 'C-L08',
    questline: null,
    questlineStage: null,
    cyberwareReward: { pool: 'LOW', chance: 0.4 },
    name: 'BADGE_CHECK',
    faction: 'fac_grammaton',
    factionRepReward: 12,
    factionRepPenalty: 7,
    description: 'A Grammaton patrol is selling confiscated gear out of evidence lockers. The rulebook wants its teeth back.',
    payout: 2100,
    deposit: 0,
    exp: 130,
    stages: [
      {
        id: 'bc_audit',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'EVIDENCE TRAIL',
        prompt: 'Gear vanishes between seizure and catalog. Pull the locker logs, or lean on the night clerk who signs the transfers.',
        choices: [
          {
            id: 'bc_logs',
            label: 'Pull locker logs',
            statCheck: { stat: 'wire', threshold: 11 },
            pass: {
              text: 'Locker logs show a badge ID opening the cage after every seizure. Pattern is clean enough for Grammaton.',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'The logs are scrubbed. You recover enough fragments to name a patrol shift.',
              branch: 'advance',
            },
          },
          {
            id: 'bc_clerk',
            label: 'Lean on the night clerk',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: 'The clerk hates dirty badges more than pressure. Names, dates, buyer channel.',
              branch: 'advance',
            },
            fail: {
              text: 'The clerk clams up. Their shaking hands still point you at the right shift roster.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'bc_recover',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'RECOVER THE RULE',
        prompt: 'The dirty patrol arrives to move tonight\'s haul. Serve the writ and make them stand down, or take the gear before the market opens.',
        choices: [
          {
            id: 'bc_writ',
            label: 'Serve the writ cold',
            statCheck: { stat: 'face', threshold: 12 },
            pass: {
              text: 'You read the citation number. Two badges go pale and put their hands on the wall.',
              branch: 'complete',
              effects: { rewardModifier: 0.2 },
            },
            fail: {
              text: 'They laugh at the writ until dispatch confirms it. You still recover the gear, but the room remembers the disrespect.',
              branch: 'complete',
            },
          },
          {
            id: 'bc_force',
            label: 'Hit the patrol before they move',
            outcome: {
              text: 'Dirty badges reach for clean guns. Grammaton paperwork can wait.',
              branch: 'triggersBattle',
              onVictory: {
                branch: 'complete',
                text: 'Patrol down, gear recovered, rulebook satisfied.',
                effects: { rewardModifier: 0.1 },
              },
              onDefeat: {
                branch: 'fail',
                text: 'The patrol drives you out and dumps the evidence before Grammaton can seal the cage.',
              },
            },
          },
        ],
      },
    ],
    successNarration: 'Grammaton records the recovered gear and the corrected breach. Kade forwards a clipped commendation: "Order restored."',
    failureNarration: 'The dirty patrol moves the gear before it can be secured. Grammaton pays a procedural fraction.',
    abortNarration: 'You left the evidence trail open. Grammaton files you under unreliable.',
  },

  {
    id: 'con_low_referent_false_floor',
    tier: 'LOW',
    teamLevelRequired: 2,
    fixerId: 'remi',
    moduleNumber: 'C-L09',
    questline: null,
    questlineStage: null,
    cyberwareReward: { pool: 'LOW', chance: 0.4 },
    name: 'FALSE_FLOOR',
    faction: 'fac_referent',
    factionRepReward: 13,
    factionRepPenalty: 7,
    description: 'A backroom exchange is lying about volume, badly. Referent wants the numbers corrected just enough that only the right people notice.',
    payout: 2000,
    deposit: 0,
    exp: 120,
    stages: [
      {
        id: 'ff_entry',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'BACKROOM LEDGER',
        prompt: 'The exchange runs behind a pawn shop with three cameras and one bored guard. Walk in as an auditor, or ghost through the repair corridor.',
        choices: [
          {
            id: 'ff_auditor',
            label: 'Walk in as an auditor',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: 'Nobody wants to argue with someone holding a clipboard and a fine schedule. The ledger terminal is yours.',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'The guard asks one real question. You dodge it with fees and jargon until he gives up.',
              branch: 'advance',
            },
          },
          {
            id: 'ff_corridor',
            label: 'Ghost through the repair corridor',
            statCheck: { stat: 'ghost', threshold: 11 },
            pass: {
              text: 'Repair corridor, blind camera, cheap lock. You surface behind the terminal wall.',
              branch: 'advance',
            },
            fail: {
              text: 'A loose panel clangs. The guard checks the wrong hallway while you slip inside.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'ff_numbers',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'PRICE THE LIE',
        prompt: 'The books are ugly. You can correct the false volume cleanly, or plant a sharper anomaly that lets Referent short the room later.',
        choices: [
          {
            id: 'ff_clean',
            label: 'Correct the false volume',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'The numbers settle into a shape that looks honest because it is. Referent can price the room now.',
              branch: 'complete',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'The ledger fights back with broken validation. You force the correction through with a visible seam.',
              branch: 'complete',
            },
          },
          {
            id: 'ff_anomaly',
            label: 'Plant a sharper anomaly',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'You leave a beautiful false floor under the price. It will collapse when Referent steps on it.',
              branch: 'complete',
              effects: { rewardModifier: 0.25 },
            },
            fail: {
              text: 'The anomaly is too obvious. You roll it back to the clean correction before it trips an alarm.',
              branch: 'complete',
            },
          },
        ],
      },
    ],
    successNarration: 'Referent receives the corrected ledger and the market gets a little less fake in exactly the profitable direction.',
    failureNarration: 'The ledger update lands late. Referent still prices the room, but discounts your cut.',
    abortNarration: 'You left the exchange lying. Referent has no patience for unpriced noise.',
  },

  {
    id: 'con_low_static_noise_tax',
    tier: 'LOW',
    teamLevelRequired: 2,
    fixerId: 'pyre',
    moduleNumber: 'C-L10',
    questline: null,
    questlineStage: null,
    cyberwareReward: { pool: 'LOW', chance: 0.4 },
    name: 'NOISE_TAX',
    faction: 'fac_static',
    factionRepReward: 12,
    factionRepPenalty: 7,
    description: 'A corporate ad tower is charging every public screen in Lowport a silent bandwidth tax. Static wants the tower singing garbage by dawn.',
    payout: 1800,
    deposit: 0,
    exp: 115,
    stages: [
      {
        id: 'nt_access',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'TOWER ACCESS',
        prompt: 'The ad tower is bolted to a luxury hab stack. Climb the maintenance ladder under the billboard wash, or spoof a contractor drone and ride the service lift.',
        choices: [
          {
            id: 'nt_ladder',
            label: 'Climb the maintenance ladder',
            statCheck: { stat: 'grit', threshold: 11 },
            pass: {
              text: 'Forty meters of wet ladder and seizure-bright ads. You reach the cabinet with your eyes burning.',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'An ad flare blinds you halfway up. You wait it out and keep climbing, slower.',
              branch: 'advance',
            },
          },
          {
            id: 'nt_lift',
            label: 'Spoof the contractor lift',
            statCheck: { stat: 'wire', threshold: 11 },
            pass: {
              text: 'The lift accepts a forged maintenance drone ID. You ride up inside the tower\'s own blind spot.',
              branch: 'advance',
            },
            fail: {
              text: 'The lift stalls two floors short. You pry the hatch and finish on the ladder.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'nt_jam',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'MAKE IT STATIC',
        prompt: 'The billing daemon hides inside the ad scheduler. Kill only the tax module, or flood the whole tower with raw static and send a louder message.',
        choices: [
          {
            id: 'nt_precise',
            label: 'Kill only the tax module',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'The daemon dies without touching the ad feed. Screens across Lowport stop bleeding microfees.',
              branch: 'complete',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'The daemon hides behind three schedulers. You kill it, but the tower hiccups loud enough for corp techs to notice.',
              branch: 'complete',
            },
          },
          {
            id: 'nt_flood',
            label: 'Flood the tower with raw static',
            outcome: {
              text: 'Every ad becomes white noise for six beautiful minutes. Static calls that a receipt.',
              branch: 'complete',
              effects: { rewardModifier: 0.1 },
            },
          },
        ],
      },
    ],
    successNarration: 'Lowport screens stop paying the invisible tax. Pyre says Static heard the silence underneath the noise.',
    failureNarration: 'The tax daemon respawns by noon. Static pays for the window and complains about permanence.',
    abortNarration: 'You left the tower charging the poor by the pixel. Static has a long memory for sellouts and quitters.',
  },
];
