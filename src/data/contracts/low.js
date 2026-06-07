export const LOW_CONTRACTS = [
  {
    id: 'con_low_signal_tap',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'remi',
    moduleNumber: 'C-L01',
    name: 'SIGNAL_TAP',
    faction: 'fac_signal',
    factionRepReward: 10,
    factionRepPenalty: 6,
    description: 'Intercept a corporate data stream relay in Watson. Plant the tap, pull the feed, disappear.',
    payout: 1400,
    deposit: 0,
    exp: 90,
    stages: [
      {
        id: 'sl_approach',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'LOCATE RELAY',
        prompt: 'The relay node is in a maintenance tunnel under Watson. You have partial coordinates. Breach the access grid to pinpoint it, or move blind and trust instinct.',
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
              text: 'Quiet exit. Nobody sees you. Remi confirms the tap is transmitting. Credits inbound.',
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
        prompt: 'Package is in a locker at Kabuki transit hub. The key code Nyx sent is a single-use cipher. Decode it on the fly, or talk your way in.',
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
        prompt: 'Second stop runs through a MaxTac patrol corridor. Vehicle scans running. Reroute through back streets, longer, invisible, or push straight through.',
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
        prompt: 'Last stop is a Japantown teahouse. Contact has a silver cochlear implant. She\'ll ask for a code word. Nyx gave you three options; only one is right. Read her, or ping Nyx.',
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
              text: 'Signal bounces in Japantown\'s mesh fog. You guess. You guess right.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'Package delivered. Three stops, no casualties. Nyx sends the full transfer and a note: "Solid run."',
    failureNarration: 'Delivery chain broke. Nyx pays partial. No note.',
    abortNarration: 'You left the package. Nyx doesn\'t say anything. That\'s worse.',
  },

  {
    id: 'con_low_ghost_entry',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'remi',
    moduleNumber: 'C-L03',
    name: 'GHOST_ENTRY',
    faction: 'fac_undertow',
    factionRepReward: 10,
    factionRepPenalty: 6,
    description: 'After-hours breach of a low-sec Petrochem satellite office. Extract three files. No alarms.',
    payout: 1600,
    deposit: 0,
    exp: 100,
    stages: [
      {
        id: 'ge_entry',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'BREACH ENTRY',
        prompt: 'The building runs Militech Gen-2 keypad auth. Hard-bypass the hardware, or use the janitor\'s badge credentials Remi pulled.',
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
            statCheck: { stat: 'wire', threshold: 13 },
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
    successNarration: 'Three files extracted, no alarm. Remi confirms data integrity. Full payout transferred.',
    failureNarration: 'Files were incomplete or corrupt. Remi pays half. "Better luck on the clean crack."',
    abortNarration: 'Extraction aborted. You left empty. Remi refunds nothing.',
  },

  {
    id: 'con_low_debt_collection',
    tier: 'LOW',
    teamLevelRequired: 1,
    fixerId: 'pyre',
    moduleNumber: 'C-L04',
    name: 'DEBT_COLLECTION',
    faction: 'fac_undertow',
    factionRepReward: 10,
    factionRepPenalty: 6,
    description: 'Heywood loan shark wants his eddies back. Mark is hiding. Pyre wants results, not reports.',
    payout: 1200,
    deposit: 0,
    exp: 80,
    stages: [
      {
        id: 'dc_locate',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'LOCATE THE MARK',
        prompt: 'The mark, who calls himself Ticho, dropped off the grid three days ago. Last seen at a Heywood bar. Burn a local contact or trace his last comm ping.',
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
              text: 'Ping bounces through a relay. Close enough. Southeast Heywood, maintenance area.',
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
    name: 'UNDERLEVEL_RESCUE',
    faction: 'fac_undertow',
    factionRepReward: 12,
    factionRepPenalty: 6,
    description: 'A family in Kabuki is paying to get their daughter back from Red Chrome. Remi says quick and quiet. You say: define quick.',
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
            statCheck: { stat: 'ghost', threshold: 13 },
            pass: {
              text: 'You move like smoke. He never turns around. Daya\'s door is ahead.',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'He spins. Recognition lights his eyes. There\'s no talking out of this.',
              branch: 'triggersBattle',
              encounterId: 'enc_gang_enforcer_solo',
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
              encounterId: 'enc_gang_enforcer_solo',
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
    successNarration: 'Daya delivered. Family pays. Remi transfers her commission. Job is in the ledger: clean.',
    failureNarration: 'Extraction failed. Remi pays a fraction. She covered the logistics cost and nothing more.',
    abortNarration: 'You pulled out mid-run. Daya stays where she is. Remi marks the abort and says nothing, which is worse.',
  },
];
