export const MID_CONTRACTS = [
  {
    id: 'con_mid_vault_breach',
    tier: 'MID',
    teamLevelRequired: 5,
    fixerId: 'kade',
    moduleNumber: 'C-M01',
    name: 'VAULT_BREACH',
    faction: 'fac_referent',
    factionRepReward: 16,
    factionRepPenalty: 10,
    minFactionRep: 'FRIENDLY',
    description: 'Helix Corp distribution warehouse. Kade has a buyer for the contents before you crack the locks.',
    payout: 7500,
    deposit: 500,
    exp: 400,
    stages: [
      {
        id: 'vb_recon',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'RECON',
        prompt: 'The warehouse runs a layered sensor net. Kade wants a full security map before the run. You can probe the net remotely, risking detection, or do a physical walk-around.',
        choices: [
          {
            id: 'vb_remote',
            label: 'Remote probe the sensor net',
            statCheck: { stat: 'wire', threshold: 13 },
            pass: {
              text: 'Full map acquired. Guard rotations, blind spots, sensor cycles. All of it. Kade is pleased.',
              branch: 'advance',
            },
            fail: {
              text: 'You trip an intrusion flag. Pull out fast. Partial map, but Kade says you have enough to work with.',
              branch: 'advance',
            },
          },
          {
            id: 'vb_physical',
            label: 'Physical walk-around',
            statCheck: { stat: 'grit', threshold: 11 },
            pass: {
              text: 'Six hours of circling the perimeter. You know every camera angle by heart. Zero digital trace.',
              branch: 'advance',
            },
            fail: {
              text: 'A guard spots you loitering. You burn a cover story and walk. They log your description.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'vb_crack',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'CRACK THE VAULT',
        prompt: 'You\'re inside. The vault runs Helix\'s proprietary encryption, hardened against standard deck tools. Force through with raw processing power, or find the maintenance override Kade said might exist.',
        choices: [
          {
            id: 'vb_brute',
            label: 'Brute-force the encryption',
            statCheck: { stat: 'wire', threshold: 14 },
            pass: {
              text: 'Forty-minute crack. Your deck runs hot. Vault opens. Nobody\'s been alerted.',
              branch: 'advance',
            },
            fail: {
              text: 'Encryption suite detects the attempt. Secondary lockout activates. You have four minutes.',
              branch: 'advance',
            },
          },
          {
            id: 'vb_override',
            label: 'Hunt for the maintenance override',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'Override found behind a maintenance panel. Helix never purged the test credentials. Vault opens silent.',
              branch: 'advance',
            },
            fail: {
              text: 'No override. You lose time looking. Back to brute-force, deck running hotter than you\'d like.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'vb_exfil',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'EXFIL UNDER FIRE',
        prompt: 'You have the goods. Three guards have been alerted; unrelated patrol change, not your op. You can fight through, or find a service tunnel Kade marked as an emergency exit.',
        choices: [
          {
            id: 'vb_fight',
            label: 'Fight through',
            outcome: {
              text: 'Three guards, one way out. You make noise.',
              branch: 'triggersBattle',
              onVictory: {
                branch: 'advance',
                text: 'Guards down. Kade\'s buyer gets the full inventory. Clean exfil from there.',
              },
              onDefeat: {
                branch: 'fail',
                text: 'Overwhelmed at the exit. You make it out alive but the goods stay behind.',
              },
            },
          },
          {
            id: 'vb_tunnel',
            label: 'Find the service tunnel',
            statCheck: { stat: 'wire', threshold: 13 },
            pass: {
              text: 'Kade\'s map leads you to a maintenance hatch. You\'re out before the guard rotation clears.',
              branch: 'advance',
            },
            fail: {
              text: 'Tunnel is sealed. You have to improvise. Lose half the inventory ditching a guard, but you\'re out.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'Vault contents delivered. Kade\'s buyer pays immediately. Full transfer plus a bonus for the clean exit.',
    failureNarration: 'Run compromised. Kade salvages what he can from your partial take. You get a fraction.',
    abortNarration: 'You pulled out mid-breach. Kade loses the deposit covering his costs. That\'s on you.',
  },

  {
    id: 'con_mid_blackmail_op',
    tier: 'MID',
    teamLevelRequired: 5,
    fixerId: 'nyx',
    moduleNumber: 'C-M02',
    name: 'BLACKMAIL_OP',
    faction: 'fac_grammaton',
    factionRepReward: 16,
    factionRepPenalty: 10,
    description: 'Collect dirt on a mid-tier Referent exec. Nyx has a buyer. Evidence needs to be airtight.',
    payout: 6000,
    deposit: 300,
    exp: 350,
    stages: [
      {
        id: 'bo_social',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'SOCIAL ENGINEERING',
        prompt: 'Target runs his personal comms through an encrypted private server. His assistant is the weak link. You need an in; talk your way close, or spoof a corporate identity to get access.',
        choices: [
          {
            id: 'bo_charm',
            label: 'Charm the assistant directly',
            statCheck: { stat: 'face', threshold: 13 },
            pass: {
              text: 'Two coffee meetings and a planted listening device. The assistant trusts you. You\'re in.',
              branch: 'advance',
            },
            fail: {
              text: 'Assistant is more suspicious than briefed. You pivot to the spoof approach, which costs time.',
              branch: 'advance',
            },
          },
          {
            id: 'bo_spoof',
            label: 'Spoof a corporate identity',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'Fabricated ID clears the server\'s whitelist. You have remote access for forty-eight hours.',
              branch: 'advance',
            },
            fail: {
              text: 'Spoof triggers a flagging system. Your access is limited, partial logs only.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'bo_extract',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'DATA EXTRACTION',
        prompt: 'You\'re in the server. Evidence is in three encrypted partitions. You can grab everything in one sweep, loud and fast, or cherry-pick the best material carefully.',
        choices: [
          {
            id: 'bo_sweep',
            label: 'Grab everything, one sweep',
            statCheck: { stat: 'wire', threshold: 13 },
            pass: {
              text: 'Full sweep completed before the intrusion system wakes. You have more material than Nyx expected.',
              branch: 'advance',
            },
            fail: {
              text: 'Intrusion system flags the volume. You pull out with sixty percent. Nyx says it\'ll be enough.',
              branch: 'advance',
            },
          },
          {
            id: 'bo_selective',
            label: 'Cherry-pick, stay clean',
            statCheck: { stat: 'wire', threshold: 11 },
            pass: {
              text: 'Three perfectly curated files. Airtight evidence. Nyx will be able to charge twice the going rate.',
              branch: 'advance',
            },
            fail: {
              text: 'Selective approach takes longer than planned. You grab two of three. Workable.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'bo_deliver',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'FINAL DELIVERY',
        prompt: 'Evidence is packaged and ready. Nyx wants a face-to-face handoff in Kabuki; minimal trace. The exec\'s security team has been running elevated sweeps in the area. You\'ll need to get through them.',
        choices: [
          {
            id: 'bo_blend',
            label: 'Blend through the sweep zone',
            statCheck: { stat: 'face', threshold: 13 },
            pass: {
              text: 'You look like a corporate commuter. The sweep team doesn\'t give you a second look. Nyx gets the package.',
              branch: 'advance',
            },
            fail: {
              text: 'Sweep team holds you at a checkpoint. You talk your way through, barely. Nyx is annoyed at the delay.',
              branch: 'advance',
            },
          },
          {
            id: 'bo_route',
            label: 'Find an alternate route',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'You hack traffic management to create a coverage gap. Clean path to Nyx. Textbook.',
              branch: 'advance',
            },
            fail: {
              text: 'Traffic hack alerts a nearby patrol. You detour twice. Nyx is waiting when you finally arrive.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'Evidence delivered and verified. Nyx sells it before end of day. "Cleanest work I\'ve seen this quarter."',
    failureNarration: 'Evidence was incomplete. Nyx gets a discount from her buyer, passes the loss downstream. Partial payout.',
    abortNarration: 'Operation aborted. Nyx loses the buyer. No payout, and a note in your file.',
  },

  {
    id: 'con_mid_asset_extraction',
    tier: 'MID',
    teamLevelRequired: 5,
    fixerId: 'remi',
    moduleNumber: 'C-M03',
    name: 'ASSET_EXTRACTION',
    faction: 'fac_lexicon',
    factionRepReward: 16,
    factionRepPenalty: 10,
    minFactionRep: 'FRIENDLY',
    description: 'A defecting Grammaton analyst wants out of the city. Remi has a buyer for the data she\'s carrying.',
    payout: 9000,
    deposit: 400,
    exp: 500,
    stages: [
      {
        id: 'ae_locate',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'LOCATE ASSET',
        prompt: 'The analyst, codename VESPER, is holed up somewhere in the Industrial District. She\'s gone dark on her primary comm. You can try to triangulate her emergency beacon, or work your contacts.',
        choices: [
          {
            id: 'ae_beacon',
            label: 'Triangulate her emergency beacon',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'Beacon signal is faint but you narrow it down to a block in the refinery district. VESPER makes contact.',
              branch: 'advance',
            },
            fail: {
              text: 'Signal is too degraded to triangulate. You switch to contacts and lose six hours.',
              branch: 'advance',
            },
          },
          {
            id: 'ae_contacts',
            label: 'Work your contacts',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: 'A fixer associate puts you onto a safe house address. VESPER is there, scared but alive.',
              branch: 'advance',
            },
            fail: {
              text: 'Wrong address. You find another lead and eventually track VESPER down in a transit locker room.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'ae_extract',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'EXTRACTION',
        prompt: 'VESPER is ready to move. Grammaton has a loose cordon around the Industrial District; standard sweep for their missing analyst. Fight through or find a gap in the net.',
        choices: [
          {
            id: 'ae_fight',
            label: 'Breach the cordon directly',
            outcome: {
              text: 'VESPER is non-combat. Whatever happens, it\'s on you.',
              branch: 'triggersBattle',
              onVictory: {
                branch: 'advance',
                text: 'Cordon team is down. VESPER is shaken but moving. You\'re through.',
              },
              onDefeat: {
                branch: 'fail',
                text: 'Cordon was reinforced. You retreat without VESPER. Remi pulls the contract.',
              },
            },
          },
          {
            id: 'ae_gap',
            label: 'Find a gap in the cordon',
            statCheck: { stat: 'grit', threshold: 12 },
            pass: {
              text: 'You spot a rotation blind spot and move VESPER through it in under three minutes. Textbook.',
              branch: 'advance',
            },
            fail: {
              text: 'You find a gap but VESPER panics at the last moment. You recover, but it costs time and noise.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'ae_border',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'BORDER RUN',
        prompt: 'City perimeter checkpoint. VESPER has forged papers Remi supplied. They\'re good, but the checkpoint officer is running deep scans tonight.',
        choices: [
          {
            id: 'ae_papers',
            label: 'Trust the forged papers',
            statCheck: { stat: 'grit', threshold: 12 },
            pass: {
              text: 'VESPER holds it together. The officer scans and waves you through. You breathe.',
              branch: 'advance',
            },
            fail: {
              text: 'Officer pulls VESPER aside. You intervene with a story about a medical emergency. Tense, but it works.',
              branch: 'advance',
            },
          },
          {
            id: 'ae_bribe',
            label: 'Bribe the checkpoint officer',
            statCheck: { stat: 'face', threshold: 13 },
            pass: {
              text: 'Officer pockets the chip and doesn\'t scan. "Fast lane." VESPER is out.',
              branch: 'advance',
            },
            fail: {
              text: 'Officer refuses and signals for backup. You activate the papers and bluff through on the scan.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'VESPER is out. Data delivered to Remi\'s buyer. Full transfer plus a commendation note: "High-difficulty run."',
    failureNarration: 'Extraction failed. VESPER is in Grammaton custody. Remi pays a fraction for the attempt.',
    abortNarration: 'You abandoned the asset. Remi doesn\'t call you again for a month.',
  },

  {
    id: 'con_mid_burn_depot',
    tier: 'MID',
    teamLevelRequired: 5,
    fixerId: 'pyre',
    moduleNumber: 'C-M04',
    name: 'BURN_IT_DOWN',
    faction: 'fac_static',
    factionRepReward: 16,
    factionRepPenalty: 10,
    minFactionRep: 'FRIENDLY',
    description: 'Gang supply depot in Heywood. Pyre wants it gone. Charges provided, delivery not included.',
    payout: 8500,
    deposit: 200,
    exp: 450,
    stages: [
      {
        id: 'bd_recon',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'RECON DEPOT',
        prompt: 'Depot is guarded by six Static street crew. You need to know their patrol pattern before you move in with charges. Scout physically or pull their internal comms.',
        choices: [
          {
            id: 'bd_physical',
            label: 'Physical recon',
            statCheck: { stat: 'grit', threshold: 11 },
            pass: {
              text: 'Two-hour observation from a rooftop. You map every patrol rotation. Pyre says the intel is clean.',
              branch: 'advance',
            },
            fail: {
              text: 'A Static crew member spots you on the roof. You run. They don\'t pursue, but your observation window is blown.',
              branch: 'advance',
            },
          },
          {
            id: 'bd_comms',
            label: 'Pull their internal comms',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'Comms are unencrypted. Static crews aren\'t professional. Full patrol map in twenty minutes.',
              branch: 'advance',
            },
            fail: {
              text: 'Comms are more scrambled than expected. Partial intel. Pyre says it\'s enough to proceed.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'bd_plant',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'PLANT CHARGES',
        prompt: 'Pyre\'s charges need to be placed at three structural points. You\'re inside. Two guards are still awake on an irregular pattern. Plant quick and dirty, or take them out first.',
        choices: [
          {
            id: 'bd_stealth',
            label: 'Plant around the guards',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'All three charges placed. Guards never knew you were there. Detonation sequence armed.',
              branch: 'advance',
            },
            fail: {
              text: 'Guard walks past while you\'re placing the second charge. You freeze for thirty seconds. Third charge is rushed.',
              branch: 'advance',
            },
          },
          {
            id: 'bd_eliminate',
            label: 'Take out the guards first',
            outcome: {
              text: 'Two Static enforcers, close quarters. Pyre didn\'t say anything about clean.',
              branch: 'triggersBattle',
              onVictory: {
                branch: 'advance',
                text: 'Guards down. You plant all three charges clean and arm the sequence.',
              },
              onDefeat: {
                branch: 'fail',
                text: 'More guards respond than expected. You bail without planting. Pyre is furious.',
              },
            },
          },
        ],
      },
      {
        id: 'bd_detonate',
        stageNumber: 3,
        label: 'STAGE_03',
        title: 'BURN IT DOWN',
        prompt: 'Charges are set. You\'re clear of the blast radius; theoretically. Pyre wants confirmation of destruction. Detonate remotely and walk, or stay to confirm visually.',
        choices: [
          {
            id: 'bd_remote',
            label: 'Detonate and walk',
            outcome: {
              text: 'Signal sent. Three seconds of silence, then the night lights up. You\'re already moving.',
              branch: 'advance',
            },
          },
          {
            id: 'bd_confirm',
            label: 'Stay for visual confirmation',
            statCheck: { stat: 'grit', threshold: 11 },
            pass: {
              text: 'You watch the depot go up. Nothing left but framework. Pyre gets the confirmation footage.',
              branch: 'complete',
            },
            fail: {
              text: 'A late-arriving Static vehicle spots you at the scene. You detonate and run in the same motion.',
              branch: 'advance',
            },
          },
        ],
      },
    ],
    successNarration: 'Depot is ash. Pyre confirms structural collapse. Full transfer with a voice note: "Now that\'s how you do it."',
    failureNarration: 'Depot partially damaged. Static crew put the fire out. Pyre pays partial, and he\'s not happy.',
    abortNarration: 'Run aborted. Depot still stands. Pyre keeps the deposit for wasted materials.',
  },
];
