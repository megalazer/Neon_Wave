export const HIGH_CONTRACTS = [
  {
    id: 'con_high_blackwall_probe',
    tier: 'HIGH',
    teamLevelRequired: 10,
    fixerId: 'dusk',
    moduleNumber: 'C-H01',
    questline: 'Dusk\'s Edge',
    questlineStage: 1,
    cyberwareReward: { pool: 'HIGH', chance: 0.6 },
    name: 'DEADWALL_PROBE',
    faction: 'fac_signal',
    factionRepReward: 22,
    factionRepPenalty: 14,
    minFactionRep: 'FRIENDLY',
    description: 'Dusk wants data from the other side of the Deadwall. Nobody who\'s done this before is available to brief you.',
    payout: 30000,
    deposit: 2000,
    exp: 1800,
    stages: [
      {
        id: 'bwp_interface',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'INTERFACE',
        prompt: 'You need a hardline to a Grammaton relay tower to even reach the perimeter. The tower is guarded by an automated defense grid, breach it, or find a dead terminal Dusk marked on an old map.',
        choices: [
          {
            id: 'bwp_breach',
            label: 'Breach the defense grid',
            statCheck: { stat: 'wire', threshold: 15 },
            pass: {
              text: 'Grid peels back under your deck. You have sixty seconds before it reboots. Hardline connected.',
              branch: 'advance',
            },
            fail: {
              text: 'Grid adapts faster than you expected. You burn two ICE breakers getting through. Connection is unstable.',
              branch: 'advance',
            },
          },
          {
            id: 'bwp_dead',
            label: 'Find Dusk\'s dead terminal',
            statCheck: { stat: 'grit', threshold: 13 },
            pass: {
              text: 'Terminal is where Dusk said. Dusty, offline for years, but hardline is intact. You jack in.',
              branch: 'advance',
            },
            fail: {
              text: 'Terminal has been stripped for parts. You patch together what\'s left. Unstable connection, but enough.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'bwp_navigate',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'NAVIGATE THE ICE',
        prompt: 'You\'re at the perimeter. The Deadwall\'s ICE is unlike anything in the commercial sector; it probes back. You can push through with raw code, or look for a seam in its pattern.',
        choices: [
          {
            id: 'bwp_push',
            label: 'Push through with raw code',
            statCheck: { stat: 'wire', threshold: 16 },
            pass: {
              text: 'Your deck nearly bricks twice. You hold it together through sheer experience. You\'re through. Something is watching you from the other side.',
              branch: 'advance',
            },
            fail: {
              text: 'ICE fractures your access. You pull back with system damage. Connection degraded but holding.',
              branch: 'advance',
            },
          },
          {
            id: 'bwp_seam',
            label: 'Look for a seam in the pattern',
            statCheck: { stat: 'wire', threshold: 14 },
            pass: {
              text: 'There, a ghost of a maintenance path, years old. You thread through it. No friction. That shouldn\'t be possible.',
              branch: 'advance',
            },
            fail: {
              text: 'No seam. You wait too long looking and the ICE begins to profile your access pattern. Push through now.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'bwp_exfil',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'PULL THE DATA',
        prompt: 'You\'re inside. It\'s quiet in a way that feels wrong. Data structures you\'ve never seen before. You can grab as much as possible and disconnect immediately, or spend more time curating. The ICE is reforming.',
        choices: [
          {
            id: 'bwp_grab',
            label: 'Grab everything and disconnect',
            statCheck: { stat: 'wire', threshold: 14 },
            pass: {
              text: 'Massive data pull. You disconnect at the last second before the ICE closes. Your deck is smoking. Dusk will be very happy.',
              branch: 'advance',
            },
            fail: {
              text: 'ICE clips you during disconnect. Your deck takes damage and some data is corrupted, but you\'re out.',
              branch: 'advance',
            },
          },
          {
            id: 'bwp_curate',
            label: 'Curate carefully, stay longer',
            statCheck: { stat: 'wire', threshold: 17 },
            pass: {
              text: 'You spend three full minutes inside. Perfectly curated dataset. You disconnect clean. Whatever you saw in there stays behind the wall. Mostly.',
              branch: 'complete',
            },
            fail: {
              text: 'You stayed too long. The ICE closes around your connection. You emergency-disconnect with whatever you had already pulled.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'Dusk\'s first task. The probe is live — and Dusk already has the liquidation contract drafted. Data extracted. Dusk goes quiet for six hours, then sends the largest transfer you\'ve ever received. No note.',
    failureNarration: 'Data was corrupted or incomplete. Dusk pays a fraction. Still more than most people see in a year.',
    abortNarration: 'You disconnected early. Dusk sends a single line: "Don\'t contact me for a while."',
  },

  {
    id: 'con_high_deep_cover',
    tier: 'HIGH',
    teamLevelRequired: 10,
    fixerId: 'kade',
    moduleNumber: 'C-H02',
    questline: 'Kade\'s Corpo Game',
    questlineStage: 4,
    cyberwareReward: { pool: 'HIGH', chance: 0.6 },
    name: 'DEEP_COVER',
    faction: 'fac_grammaton',
    factionRepReward: 22,
    factionRepPenalty: 14,
    minFactionRep: 'FRIENDLY',
    description: 'Plant a fabricated identity inside Grammaton\'s mid-tier management layer. Kade\'s client needs an inside channel for six months minimum.',
    payout: 45000,
    deposit: 3000,
    exp: 2200,
    stages: [
      {
        id: 'dc_h_fabricate',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'IDENTITY FABRICATION',
        prompt: 'Kade\'s chain culminates here. Three jobs bought you a Grammaton credential set. Use it. The legend needs to be airtight: employment history, psych profiles, social graph, biometric registration. Kade\'s team handles the physical documents. You need to seed the digital trail.',
        choices: [
          {
            id: 'dc_h_deep',
            label: 'Build a deep digital trail',
            statCheck: { stat: 'wire', threshold: 15 },
            pass: {
              text: 'Seven years of fabricated digital existence planted across twelve systems. Background check will pass even internal audit.',
              branch: 'advance',
            },
            fail: {
              text: 'Two systems flag inconsistencies. You patch them, but the trail has gaps. Kade says proceed. Grammaton audit teams are slow.',
              branch: 'advance',
            },
          },
          {
            id: 'dc_h_minimal',
            label: 'Minimal trail, rely on presentation',
            statCheck: { stat: 'face', threshold: 14 },
            pass: {
              text: 'Less is more. The sparse trail reads as intentional privacy. Grammaton likes people with something to protect.',
              branch: 'advance',
            },
            fail: {
              text: 'Too minimal. Grammaton\'s automated screening flags the absence of data. You add more, rushing.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'dc_h_longcon',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'THE LONG CON',
        prompt: 'Your asset is inside. Three weeks of cultivating trust with a target executive. There\'s a leak somewhere in Kade\'s operation. Someone is asking questions about your asset\'s background. Neutralize the leak or redirect it.',
        choices: [
          {
            id: 'dc_h_redirect',
            label: 'Redirect the investigation',
            statCheck: { stat: 'face', threshold: 15 },
            pass: {
              text: 'You plant a false trail pointing at a real Grammaton employee who fits the paranoia profile. Investigation ends there.',
              branch: 'advance',
            },
            fail: {
              text: 'Redirect only partially works. The investigation narrows but doesn\'t close. Your asset is operating under elevated scrutiny.',
              branch: 'advance',
            },
          },
          {
            id: 'dc_h_silence',
            label: 'Find and silence the leak source',
            statCheck: { stat: 'wire', threshold: 14 },
            pass: {
              text: 'Leak was an automated flag in Kade\'s own system. You kill it clean. No trace of the investigation.',
              branch: 'advance',
            },
            fail: {
              text: 'Leak source is a person, not a system. You can\'t silence them cleanly. Redirect approach, late.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'dc_h_extraction',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'LOCK IN THE CHANNEL',
        prompt: 'Asset is established and trusted. Now you need to set up an extraction protocol: a secure channel and a fallback exfil plan. Kade wants both or the contract doesn\'t pay.',
        choices: [
          {
            id: 'dc_h_channel',
            label: 'Build the secure channel',
            statCheck: { stat: 'wire', threshold: 15 },
            pass: {
              text: 'Dead-drop mesh node, rotating cipher, two fallback relays. Channel will run for eighteen months minimum. Kade\'s client gets their inside track.',
              branch: 'advance',
            },
            fail: {
              text: 'Channel architecture has a vulnerability in the third relay. You patch it, but it\'s a weak point Kade notes.',
              branch: 'advance',
            },
          },
          {
            id: 'dc_h_both',
            label: 'Build channel and exfil plan simultaneously',
            statCheck: { stat: 'wire', threshold: 17 },
            pass: {
              text: 'Dual-track build: channel goes live and exfil protocol is clean and tested. Kade calls it the best setup he\'s ever seen. Full bonus.',
              branch: 'complete',
            },
            fail: {
              text: 'Stretched too thin. Channel works; exfil plan is half-built. Kade pays full rate but notes the incomplete work.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'Kade\'s Corpo Game: complete. Vault Breach to Deep Cover — a four-job arc that put a ghost inside the machine. Asset embedded. Channel live. Kade\'s client will be pulling Grammaton intel for months. Largest payout you\'ve logged.',
    failureNarration: 'Asset was burned or channel was compromised. Kade recovers what he can. Partial payout for the attempt.',
    abortNarration: 'Operation abandoned. Kade has to extract the asset before they\'re burned. He keeps the deposit for the emergency pull.',
  },

  {
    id: 'con_high_liquidation',
    tier: 'HIGH',
    teamLevelRequired: 10,
    fixerId: 'pyre',
    moduleNumber: 'C-H03',
    questline: 'Dusk\'s Edge',
    questlineStage: 2,
    cyberwareReward: { pool: 'HIGH', chance: 0.6 },
    name: 'LIQUIDATION',
    faction: 'fac_referent',
    factionRepReward: 22,
    factionRepPenalty: 14,
    minFactionRep: 'FRIENDLY',
    description: 'High-value target. Corporate security detail. One clean shot or nothing. Pyre\'s client has a name and a deadline.',
    payout: 60000,
    deposit: 5000,
    exp: 2800,
    stages: [
      {
        id: 'lq_intel',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'INTEL GATHER',
        prompt: 'Dusk calls. The probe identified the target. Now close the loop. Target is Sable Corp\'s Head of Internal Security. Runs a sixteen-person detail, rotates routes daily. You need their schedule for the next forty-eight hours before you can plan an approach.',
        choices: [
          {
            id: 'lq_hack',
            label: 'Breach their scheduling system',
            statCheck: { stat: 'wire', threshold: 14 },
            pass: {
              text: 'Sable\'s scheduling system is hardened but not unhackable. Forty-eight hour window confirmed. You have a window.',
              branch: 'advance',
            },
            fail: {
              text: 'System pushes back hard. You get partial data: a twelve-hour window, not forty-eight. Tighter margin.',
              branch: 'advance',
            },
          },
          {
            id: 'lq_tail',
            label: 'Tail the detail for a day',
            statCheck: { stat: 'grit', threshold: 13 },
            pass: {
              text: 'Twenty-two hours of surveillance. You map their gaps personally. Three clean windows.',
              branch: 'advance',
            },
            fail: {
              text: 'Detail spots a tail on hour sixteen. You burn the surveillance position. One window recovered from partial observation.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'lq_approach',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'TARGET ACQUIRED',
        prompt: 'You\'ve found your window. The target is in transit, detail reduced to four operators. Take the shot from distance, or get closer for a guaranteed hit but higher risk of exposure.',
        choices: [
          {
            id: 'lq_distance',
            label: 'Long-range shot, keep distance',
            statCheck: { stat: 'grit', threshold: 15 },
            pass: {
              text: 'Clean shot at three hundred meters. Target down before the detail knows where you are. You\'re already moving.',
              branch: 'advance',
            },
            fail: {
              text: 'Target shifts at the last moment. Non-fatal hit. Detail engages your position.',
              branch: 'advance',
            },
          },
          {
            id: 'lq_close',
            label: 'Close approach, guaranteed hit',
            outcome: {
              text: 'You move into the detail\'s perimeter. They see you before you see him.',
              branch: 'triggersBattle',
              onVictory: {
                branch: 'advance',
                text: 'Detail is down. Target is down. Messy. Pyre says messy is fine as long as the job is done.',
              },
              onDefeat: {
                branch: 'fail',
                text: 'Detail was better than briefed. You abort. Target escapes. Pyre is silent for three days.',
              },
            },
          },
        ],
      },
      {
        id: 'lq_exfil',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'CLEAN EXIT',
        prompt: 'Target neutralized. Sable Corp has been alerted. Response teams deploying. City-wide APB will be active in six minutes. You need to be off the grid before that.',
        choices: [
          {
            id: 'lq_ghost',
            label: 'Ghost out through the underlevels',
            statCheck: { stat: 'grit', threshold: 14 },
            pass: {
              text: 'You drop into the maintenance understructure and disappear. APB activates above you. You surface three kilometers away, clean.',
              branch: 'advance',
            },
            fail: {
              text: 'Response team enters the underlevels too fast. You have to fight through a checkpoint to surface.',
              branch: 'advance',
            },
          },
          {
            id: 'lq_vehicle',
            label: 'Acquire a vehicle and run hard',
            statCheck: { stat: 'wire', threshold: 13 },
            pass: {
              text: 'You jack an Onyx Bureau support vehicle, the irony isn\'t lost on you, and drive out of the response perimeter before anyone thinks to flag it.',
              branch: 'complete',
            },
            fail: {
              text: 'Vehicle acquisition takes too long. You switch to foot and go deep into the underlevels the hard way.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'Two jobs for Dusk. Two payouts. The fixer nods once — that\'s all the approval you\'ll get. Target eliminated. Clean exfil. Pyre\'s client sends double the agreed payout. Apparently the target was worth more than disclosed.',
    failureNarration: 'Target survived or escaped clean. Pyre delivers a partial payment and a blunt assessment of what went wrong.',
    abortNarration: 'Contract abandoned. Pyre keeps the full deposit and removes you from his active list.',
  },
];
