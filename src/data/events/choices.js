export const CHOICE_EVENTS = [
  {
    id: 'chc_borrow_bike',
    type: 'choice',
    weight: 3,
    triggers: { excludeFlags: ['flag_bike_lent', 'flag_bike_lent_paid'], minTurn: 5 },
    title: 'COMMS_INCOMING',
    prompt: "Choom: \"Yo, runner. My ride caught fire two hours ago. Lend me yours? I'll have it back in three days. Probably.\"",
    choices: [
      {
        id: 'lend',
        label: '[LEND_IT]',
        outcome: {
          text: 'You toss them the keys. They grin and disappear into the haze. Choom debt is the worst kind.',
          effects: { addFlags: ['flag_bike_lent'], factionDelta: { undercity: 2 } },
        },
      },
      {
        id: 'refuse',
        label: '[REFUSE]',
        outcome: {
          text: 'You shake your head. They shrug. "Worth a shot." They vanish into the crowd.',
          effects: {},
        },
      },
      {
        id: 'collateral',
        label: '[DEMAND_COLLATERAL]',
        statCheck: { stat: 'face', threshold: 13 },
        pass: {
          text: 'You name a price. They pay 500 CR upfront without blinking. Bike\'s theirs for three days.',
          effects: { credits: 500, addFlags: ['flag_bike_lent_paid'] },
        },
        fail: {
          text: 'They laugh in your face. "Forget it. Cheap bastard." They walk off.',
          effects: { factionDelta: { undercity: -3 } },
        },
      },
    ],
  },

  {
    id: 'chc_mystery_chip',
    type: 'choice',
    weight: 4,
    triggers: { minTurn: 8 },
    title: 'ANONYMOUS_DROP',
    prompt: "A delivery drone drops an unlabeled chip at your feet. It says nothing. Then it flies away. The chip is warm.",
    choices: [
      {
        id: 'scan',
        label: '[SCAN_CHIP]',
        statCheck: { stat: 'wire', threshold: 12 },
        pass: {
          text: "You crack the encryption. It's a map of corp surveillance blind spots. Whoever sent this wants you to move freely.",
          effects: { addFlags: ['flag_surveillance_intel'] },
        },
        fail: {
          text: 'The chip detonates a small EMP. Your deck reboots with a migraine. -100 CR in blown components.',
          effects: { credits: -100 },
        },
      },
      {
        id: 'sell',
        label: '[SELL_UNREAD]',
        outcome: {
          text: 'You take it to a fence in Underlevel. 400 CR, no questions, no guilt. Somebody else\'s problem now.',
          effects: { credits: 400 },
        },
      },
      {
        id: 'destroy',
        label: '[DESTROY_IT]',
        outcome: {
          text: "You crush the chip under your heel. Whoever wanted you to have it just got nothing. Feels clean.",
          effects: {},
        },
      },
    ],
  },

  {
    id: 'chc_old_acquaintance',
    type: 'choice',
    weight: 3,
    triggers: { minTurn: 10, excludeFlags: ['flag_helped_mira', 'flag_cold_to_mira', 'flag_mira_owes_favor'] },
    title: 'GHOST_FROM_PAST',
    prompt: 'Someone you used to know — Mira — stops you mid-street. She looks rough. "Hey. Listen. I need 200 CR. Just this once."',
    choices: [
      {
        id: 'give',
        label: '[GIVE_IT]',
        outcome: {
          text: 'She squeezes your hand. "I\'ll find a way." She vanishes before you can ask what happened to her.',
          effects: { credits: -200, addFlags: ['flag_helped_mira'], morale: 3 },
        },
      },
      {
        id: 'cold',
        label: '[WALK_AWAY]',
        outcome: {
          text: "You don't even slow down. Whatever you owed her from before, you don't owe anymore.",
          effects: { addFlags: ['flag_cold_to_mira'], morale: -5 },
        },
      },
      {
        id: 'work_offer',
        label: '[OFFER_WORK_INSTEAD]',
        statCheck: { stat: 'face', threshold: 11 },
        pass: {
          text: "You explain you don't do handouts. She nods, reluctant. She'll send you a tip when she hears something worth knowing.",
          effects: { addFlags: ['flag_mira_owes_favor'] },
        },
        fail: {
          text: '"You always were a piece of work." She spits at your feet and storms off. The undercity has a long memory.',
          effects: { factionDelta: { undercity: -5 }, morale: -4 },
        },
      },
    ],
  },

  {
    id: 'chc_gang_checkpoint',
    type: 'choice',
    weight: 4,
    triggers: { minTurn: 7 },
    title: 'TERRITORIAL_DISPUTE',
    prompt: 'Three Onyx runners block your route. "This block costs 300 CR to cross. Or you go around. Your call, edgerunner."',
    choices: [
      {
        id: 'pay',
        label: '[PAY_THE_TOLL]',
        outcome: {
          text: 'You pay. They step aside without a word. Sometimes paying is smarter than fighting.',
          effects: { credits: -300, factionDelta: { onyx: 1 } },
        },
      },
      {
        id: 'intimidate',
        label: '[STAND_YOUR_GROUND]',
        statCheck: { stat: 'grit', threshold: 13 },
        pass: {
          text: "Your eyes don't move. Neither does your hand near your piece. They read it and step back. \"Next time.\" There won't be one.",
          effects: { factionDelta: { onyx: -3 } },
        },
        fail: {
          text: "They don't blink. One of them racks a round. You take the long way around. -15 minutes, 0 credits, some dignity.",
          effects: { morale: -5 },
        },
      },
      {
        id: 'detour',
        label: '[TAKE_THE_DETOUR]',
        outcome: {
          text: 'You go around. Twenty minutes longer. But you keep your 300 CR and avoid the headache.',
          effects: {},
        },
      },
    ],
  },

  {
    id: 'chc_wounded_runner',
    type: 'choice',
    weight: 3,
    triggers: { minTurn: 12 },
    title: 'MEDICAL_EMERGENCY',
    prompt: "There's a wounded runner bleeding out in the alley behind Malik's. No ID. The wound looks like a corp hit.",
    choices: [
      {
        id: 'help',
        label: '[STABILIZE_THEM]',
        statCheck: { stat: 'grit', threshold: 11 },
        pass: {
          text: 'You tourniquet the wound with your kit. They stabilize. They press a credchip into your palm before passing out. +200 CR.',
          effects: { credits: 200, morale: 8, addFlags: ['flag_saved_runner'] },
        },
        fail: {
          text: "You try but the damage is too extensive. They don't make it. The credchip in their pocket isn't worth taking.",
          effects: { morale: -8 },
        },
      },
      {
        id: 'call_it_in',
        label: '[CALL_MEDITEC]',
        outcome: {
          text: "You ping MediTec. They'll send a unit. Whether they actually come before it's too late is someone else's problem now.",
          effects: { morale: -2 },
        },
      },
      {
        id: 'keep_moving',
        label: '[KEEP_MOVING]',
        outcome: {
          text: "You don't stop. This city is full of people bleeding out. You can't carry all of them.",
          effects: { morale: -6 },
        },
      },
    ],
  },

  {
    id: 'chc_black_market_deal',
    type: 'choice',
    weight: 4,
    triggers: { minTurn: 6 },
    title: 'BACKDOOR_OFFER',
    prompt: '"I\'ve got mil-spec ammo crates, no serial numbers. 600 CR, right now. You move product, you keep 40%. One time offer."',
    choices: [
      {
        id: 'buy_and_flip',
        label: '[BUY_AND_FLIP]',
        statCheck: { stat: 'edge', threshold: 12 },
        pass: {
          text: "You flip the crates to three different buyers by nightfall. Net profit: 840 CR after costs.",
          effects: { credits: 840 - 600 },
        },
        fail: {
          text: "You pay 600, can't move the product fast enough, and one buyer ghosts you. Net loss: -200 CR.",
          effects: { credits: -200 },
        },
      },
      {
        id: 'pass',
        label: '[PASS]',
        outcome: {
          text: 'Not worth the exposure. You wave them off. They find someone else inside of ten minutes.',
          effects: {},
        },
      },
      {
        id: 'report',
        label: '[TIP_OFF_NCPD]',
        statCheck: { stat: 'face', threshold: 10 },
        pass: {
          text: 'NCPD pays 300 CR for the tip. The dealer gets picked up an hour later. You feel nothing about it.',
          effects: { credits: 300, factionDelta: { helix: 2 } },
        },
        fail: {
          text: 'NCPD ignores the tip. The dealer somehow finds out it was you. They remember.',
          effects: { factionDelta: { undercity: -5 } },
        },
      },
    ],
  },

  {
    id: 'chc_hacked_terminal',
    type: 'choice',
    weight: 4,
    triggers: { minTurn: 5 },
    title: 'EXPOSED_ACCESS_NODE',
    prompt: 'Someone left a Helix maintenance terminal unlocked in a utility closet. Three minutes before a sweep cycle. Clock is ticking.',
    choices: [
      {
        id: 'pull_data',
        label: '[PULL_CORP_DATA]',
        statCheck: { stat: 'wire', threshold: 12 },
        pass: {
          text: 'You jack in and strip the cache before the sweep. Route maps, patrol patterns, a name. Priceless. +350 CR fence value.',
          effects: { credits: 350, addFlags: ['flag_helix_intel'] },
        },
        fail: {
          text: "You're in when the sweep triggers early. You barely pull the jack before the alarm bleeds through. They know someone tried.",
          effects: { factionDelta: { helix: -5 } },
        },
      },
      {
        id: 'plant_backdoor',
        label: '[PLANT_BACKDOOR]',
        statCheck: { stat: 'ghost', threshold: 13 },
        pass: {
          text: 'Clean insertion. No trace. Whenever you need to ghost through Helix space, you now have an opening.',
          effects: { addFlags: ['flag_helix_backdoor'] },
        },
        fail: {
          text: 'The plant is detected thirty seconds after you leave. Someone is very good at their job. And now they know yours.',
          effects: { factionDelta: { helix: -8 } },
        },
      },
      {
        id: 'ignore',
        label: '[WALK_PAST]',
        outcome: {
          text: "An unlocked corp terminal. You don't touch it. Smart, probably. Boring, definitely.",
          effects: {},
        },
      },
    ],
  },

  {
    id: 'chc_desperate_vendor',
    type: 'choice',
    weight: 3,
    triggers: { minTurn: 15, excludeFlags: ['flag_helped_vendor'] },
    title: 'SABLE_EVICTION_NOTICE',
    prompt: 'An old woman runs the only non-corp stall on Novalith Ave. Sable Corp served her eviction papers today. She needs 1,000 CR to fight it.',
    choices: [
      {
        id: 'donate',
        label: '[GIVE_1000_CR]',
        outcome: {
          text: "She looks at the credchip like she's never held that much at once. \"I won't forget this.\" You believe her.",
          effects: { credits: -1000, morale: 15, addFlags: ['flag_helped_vendor'], factionDelta: { undercity: 5, sable: -3 } },
        },
      },
      {
        id: 'partial',
        label: '[GIVE_WHAT_YOU_CAN]',
        statCheck: { stat: 'face', threshold: 10 },
        pass: {
          text: "You give 300 CR and a contact name. She has a fighting chance. It might not be enough, but it's real.",
          effects: { credits: -300, morale: 7, addFlags: ['flag_helped_vendor'] },
        },
        fail: {
          text: "Your contact name turns out to be useless. She thanks you anyway. You feel the gap between good intentions and good outcomes.",
          effects: { credits: -300, morale: 2 },
        },
      },
      {
        id: 'decline',
        label: '[CANT_HELP]',
        outcome: {
          text: "\"I understand,\" she says. She doesn't look surprised. That's the worst part.",
          effects: { morale: -4 },
        },
      },
    ],
  },

  {
    id: 'chc_novalith_signal',
    type: 'choice',
    weight: 3,
    triggers: { minTurn: 20, requiredFlags: ['flag_rumor_sector_4'] },
    title: 'ENCRYPTED_SIGNAL',
    prompt: 'Your deck picks up an encrypted broadcast on the Novalith proprietary band. It keeps repeating a set of coordinates. Sector 4.',
    choices: [
      {
        id: 'trace',
        label: '[TRACE_THE_SIGNAL]',
        statCheck: { stat: 'wire', threshold: 14 },
        pass: {
          text: "You trace it to a dead relay station. Someone's been running dark comms out of Sector 4 for weeks. You now have their cipher.",
          effects: { addFlags: ['flag_sector4_cipher'], credits: 500 },
        },
        fail: {
          text: "The trace bounces through four proxy nodes before going cold. Whoever's transmitting is good. Better than you today.",
          effects: {},
        },
      },
      {
        id: 'ignore',
        label: '[IGNORE_IT]',
        outcome: {
          text: "You kill the scan. Sector 4 signals are somebody else's problem.",
          effects: {},
        },
      },
    ],
  },

  {
    id: 'chc_scav_ambush',
    type: 'choice',
    weight: 3,
    triggers: { minTurn: 8 },
    title: 'AMBUSH_WARNING',
    prompt: 'A street kid grabs your sleeve: "Don\'t go down Viper Ave. Scavs set up shop. They\'re taking people for parts." She looks terrified.',
    choices: [
      {
        id: 'pay_kid',
        label: '[TIP_THE_KID]',
        outcome: {
          text: 'You press 50 CR into her hand. She sprints away. You take the long route. Better to owe a kid than a hospital.',
          effects: { credits: -50, morale: 3 },
        },
      },
      {
        id: 'clear_them',
        label: '[HANDLE_IT]',
        statCheck: { stat: 'chrome', threshold: 14 },
        pass: {
          text: 'You hit the Scav nest fast and hard. Three runners scatter. No casualties on your side. The block is clear.',
          effects: { morale: 6, factionDelta: { undercity: 4 } },
        },
        fail: {
          text: "You walk in cocky and walk out bleeding. The Scavs were better armed than expected. -150 CR in med costs.",
          effects: { credits: -150, morale: -5 },
        },
      },
      {
        id: 'ignore_warning',
        label: '[PUSH_THROUGH_ANYWAY]',
        statCheck: { stat: 'ghost', threshold: 13 },
        pass: {
          text: 'You slip through on a parallel route they didn\'t watch. Ghost work.',
          effects: {},
        },
        fail: {
          text: "They spot you. You barely make it out. -200 CR in meds, zero pride.",
          effects: { credits: -200, morale: -8 },
        },
      },
    ],
  },
];
