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
    prompt: 'Someone you used to know, Mira, stops you mid-street. She looks rough. "Hey. Listen. I need 200 CR. Just this once."',
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
    prompt: 'A street kid grabs your sleeve: "Don\'t go down Viper Ave. Static crew set up shop. They\'re taking people for parts." She looks terrified.',
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
          text: 'You hit the Static nest fast and hard. Three runners scatter. No casualties on your side. The block is clear.',
          effects: { morale: 6, factionDelta: { undercity: 4 } },
        },
        fail: {
          text: "You walk in cocky and walk out bleeding. The Static crew were better armed than expected. -150 CR in med costs.",
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

  // ─── FACTION CHOICE EVENTS ─────────────────────────────────────────────────

  {
    id: 'chc_grammaton_shakedown',
    type: 'choice', weight: 5,
    triggers: { minTurn: 6 },
    title: 'GRAMMATON_STOP',
    prompt: 'A Grammaton officer steps into your path, palm out. "Unscheduled movement in a regulated zone. There\'s a fee for that. Or there\'s paperwork. Your choice, citizen."',
    choices: [
      {
        id: 'gs_pay',
        label: '[PAY_THE_FEE]',
        outcome: {
          text: 'You pay the "fee" and he stamps you cleared. Order has a price and you just met it. -250 CR. Grammaton notes a cooperative citizen.',
          effects: { credits: -250, factionDelta: { fac_grammaton: 5 } },
        },
      },
      {
        id: 'gs_talk',
        label: '[TALK_YOUR_WAY_OUT]',
        statCheck: { stat: 'face', threshold: 13 },
        pass: {
          text: 'You quote three sub-clauses that make the stop itself irregular. He blinks, salutes, and waves you on. Rules cut both ways.',
          effects: { factionDelta: { fac_grammaton: 3 } },
        },
        fail: {
          text: '"Resisting a lawful stop." He logs your face with relish. You walk, but Grammaton\'s ledger now has a red line by your name.',
          effects: { factionDelta: { fac_grammaton: -8 } },
        },
      },
      {
        id: 'gs_refuse',
        label: '[REFUSE_AND_WALK]',
        outcome: {
          text: 'You walk past him. He doesn\'t stop you; he just records it. To Grammaton, defiance is a kind of grammar too, and they\'ve filed yours.',
          effects: { factionDelta: { fac_grammaton: -10 }, morale: 2 },
        },
      },
    ],
  },

  {
    id: 'chc_undertow_sidedeal',
    type: 'choice', weight: 5,
    triggers: { minTurn: 8 },
    title: 'UNDERTOW_OFFER',
    prompt: 'An Undertow fixer leans into your booth. "Got a little off-book moving job. Pays well, cuts Grammaton out of a shipment they think is theirs. You in, or you a law-abiding type now?"',
    choices: [
      {
        id: 'us_accept',
        label: '[TAKE_THE_DEAL]',
        outcome: {
          text: 'You run the package through a Grammaton blind spot. Undertow pays in cash and warmth. Grammaton, somewhere, comes up a crate short. +400 CR.',
          effects: { credits: 400, factionDelta: { fac_undertow: 10 } },
        },
      },
      {
        id: 'us_decline',
        label: '[DECLINE]',
        outcome: {
          text: '"Not tonight." The fixer shrugs and melts back into the crowd. No harm, no rep; just a door you didn\'t walk through.',
          effects: {},
        },
      },
    ],
  },

  {
    id: 'chc_static_jamjob',
    type: 'choice', weight: 4,
    triggers: { minTurn: 10 },
    title: 'STATIC_CELL',
    prompt: 'A Static runner, face hidden in scrambled pixels, slides you a jammer. "One Lexicon data-node. Kill it for an hour. They write people like code; we think the block deserves a little silence. Yes or no."',
    choices: [
      {
        id: 'sj_doit',
        label: '[JAM_THE_NODE]',
        statCheck: { stat: 'wire', threshold: 12 },
        pass: {
          text: 'The node goes dark and the street exhales. Static loves you for it; the Lexicon will not. Two reps swing on one zero-sum hinge.',
          effects: { factionDelta: { fac_static: 12 } },
        },
        fail: {
          text: 'The jammer backfires and pings the node\'s defenses. You bolt. Static got nothing, and the Lexicon got your signature. Bad trade.',
          effects: { factionDelta: { fac_lexicon: -6 } },
        },
      },
      {
        id: 'sj_refuse',
        label: '[HAND_IT_BACK]',
        outcome: {
          text: 'You give the jammer back. The runner\'s pixels flicker something like disgust before they\'re gone. No noise tonight.',
          effects: {},
        },
      },
    ],
  },

  {
    id: 'chc_lexicon_trial',
    type: 'choice', weight: 4,
    triggers: { minTurn: 9 },
    title: 'LEXICON_OFFER',
    prompt: 'A Lexicon gene-scribe studies you over tea. "Your body has three typos. I could fix one, free, as a sample of our work. A small edit. You\'d barely feel the rewrite."',
    choices: [
      {
        id: 'lt_accept',
        label: '[LET_THEM_EDIT]',
        outcome: {
          text: 'A cold thread of nanites, a flicker of vertigo, and something in you reads cleaner. You feel sharper, and slightly less yourself. The Lexicon smiles. +morale, +Lexicon standing.',
          effects: { morale: 6, factionDelta: { fac_lexicon: 8 } },
        },
      },
      {
        id: 'lt_decline',
        label: '[KEEP_YOUR_TYPOS]',
        outcome: {
          text: '"I\'ll keep my mistakes, thanks." The scribe inclines their head. "Mistakes are also a language." No edit, no rep. But Static would approve.',
          effects: { factionDelta: { fac_static: 3 } },
        },
      },
    ],
  },

  {
    id: 'chc_found_tech',
    type: 'choice', weight: 5,
    triggers: { minTurn: 7 },
    title: 'SALVAGE_FIND',
    prompt: 'You find a sealed tech-case in a dead drop, stamped with a Referent Capital sigil. It was clearly meant for someone else. Keep it, or return it to its owners for goodwill?',
    choices: [
      {
        id: 'ft_keep',
        label: '[KEEP_IT]',
        outcome: {
          text: 'You crack the case and fence the contents. Good money, no questions. +650 CR. If Referent ever finds out, that\'s a future problem.',
          effects: { credits: 650 },
        },
      },
      {
        id: 'ft_return',
        label: '[RETURN_TO_REFERENT]',
        outcome: {
          text: 'You hand the case back intact. The Referent courier prices your honesty precisely and pays a finder\'s fee. +150 CR, and standing that compounds.',
          effects: { credits: 150, factionDelta: { fac_referent: 9 } },
        },
      },
    ],
  },

  {
    id: 'chc_signal_recruit',
    type: 'choice', weight: 4,
    triggers: { minTurn: 11 },
    title: 'SIGNAL_TAP_REQUEST',
    prompt: 'A Signal technician finds you on a private channel you didn\'t know was open. "We need eyes on an Undertow smuggling route. Tag the next courier you see in the canal district. Quiet. Clean. Ours."',
    choices: [
      {
        id: 'sr_tag',
        label: '[TAG_THE_COURIER]',
        statCheck: { stat: 'ghost', threshold: 13 },
        pass: {
          text: 'You ghost a tracer onto an Undertow courier\'s case. The Signal logs it grateful. The gray economy is a little more visible tonight, and Undertow won\'t love that.',
          effects: { factionDelta: { fac_signal: 10, fac_undertow: -5 } },
        },
        fail: {
          text: 'The courier makes you. You abort before the tracer sets. The Signal gets nothing, and word of the attempt drifts down into Undertow.',
          effects: { factionDelta: { fac_undertow: -4 } },
        },
      },
      {
        id: 'sr_decline',
        label: '[STAY_OUT_OF_IT]',
        outcome: {
          text: 'You close the channel. Some pipes are better left untapped. No standing gained, no enemies made.',
          effects: {},
        },
      },
    ],
  },

  {
    id: 'chc_undertow_allied_favor',
    type: 'choice', weight: 5,
    triggers: { minTurn: 12, faction: 'fac_undertow', repAtLeast: 25 },
    title: 'A_FAVOR_OWED',
    prompt: 'An Undertow lieutenant calls in person, a rare honor. "You\'ve been solid. One of ours got pinched by Grammaton. Buy the arresting officer\'s silence for us. We\'ll remember it. Costs 800 to make it disappear."',
    choices: [
      {
        id: 'uf_pay',
        label: '[COVER_THE_BRIBE]',
        requires: { credits: 800 },
        outcome: {
          text: 'You front the 800. The charge evaporates; the runner walks. Undertow doesn\'t forget who paid when it mattered. -800 CR, deep standing.',
          effects: { credits: -800, factionDelta: { fac_undertow: 18 } },
        },
      },
      {
        id: 'uf_decline',
        label: '[NOT_THIS_TIME]',
        outcome: {
          text: '"Tight on cash. Sorry." The lieutenant nods, slow. They understand. They also remember. A little frost creeps into the gray.',
          effects: { factionDelta: { fac_undertow: -4 } },
        },
      },
    ],
  },

  {
    id: 'chc_static_vs_lexicon',
    type: 'choice', weight: 4,
    triggers: { minTurn: 13 },
    title: 'NOISE_OR_MEANING',
    prompt: 'Two recruiters corner you at once, a Lexicon scribe and a Static runner, mid-argument. Each wants you to denounce the other publicly. The street is watching. Pick a side, or refuse the whole framing.',
    choices: [
      {
        id: 'nl_lexicon',
        label: '[SIDE_WITH_LEXICON]',
        outcome: {
          text: 'You call Static\'s creed nihilist garbage to the watching crowd. The scribe glows. The runner\'s pixels go dark and cold. Zero-sum, and you chose.',
          effects: { factionDelta: { fac_lexicon: 12 } },
        },
      },
      {
        id: 'nl_static',
        label: '[SIDE_WITH_STATIC]',
        outcome: {
          text: 'You call the Lexicon\'s edits a slow erasure of everyone. The runner barks a laugh. The scribe files you under "corrupted." The hinge swings.',
          effects: { factionDelta: { fac_static: 12 } },
        },
      },
      {
        id: 'nl_refuse',
        label: '[REFUSE_TO_CHOOSE]',
        statCheck: { stat: 'face', threshold: 14 },
        pass: {
          text: 'You give a speech about not being anyone\'s megaphone. The crowd nods. Both recruiters leave annoyed but respecting you. No rep, no enemies.',
          effects: { morale: 4 },
        },
        fail: {
          text: 'Your non-answer satisfies no one. Both factions write you off as spineless. You leave a little smaller than you arrived.',
          effects: { morale: -4 },
        },
      },
    ],
  },

  {
    id: 'chc_referent_insider',
    type: 'choice', weight: 4,
    triggers: { minTurn: 10 },
    title: 'REFERENT_WHISPER',
    prompt: 'A Referent analyst slides you a folded note at the exchange. "Coin\'s going to crater at midnight. We\'re telling friends first. Act on it, or don\'t. Just remember who told you."',
    choices: [
      {
        id: 'ri_act',
        label: '[ACT_ON_THE_TIP]',
        outcome: {
          text: 'You move before midnight and clear a tidy margin on the crash. Referent counts you among the people who listen, the only people who matter to them. +500 CR.',
          effects: { credits: 500, factionDelta: { fac_referent: 8 } },
        },
      },
      {
        id: 'ri_ignore',
        label: '[IGNORE_IT]',
        outcome: {
          text: 'You let it pass. Maybe it was a setup, maybe a gift. Either way, Referent notes that you didn\'t bite. They prefer players who play.',
          effects: { factionDelta: { fac_referent: -3 } },
        },
      },
    ],
  },

  // ─── PATH-SPECIFIC CHOICE EVENTS ───────────────────────────────────────────────

  // CORPO — 2 events
  {
    id: 'chc_corpo_insider',
    type: 'choice', weight: 4, path: 'corpo',
    triggers: { minTurn: 6 },
    title: 'ENCLAVE_ECHO',
    prompt: 'An encrypted message hits your subdermal. Old routing signature — someone still inside your former division. "The merger is happening. I can get you in. One last job. You in?"',
    choices: [
      {
        id: 'ci_accept',
        label: '[ACCEPT_THE_JOB]',
        statCheck: { stat: 'wire', threshold: 14 },
        pass: {
          text: 'You crack the old authentication layer and slide into the board\'s data stream. The intel is worth 1,200 CR to the right buyer. Your old contact vanishes again. Clean.',
          effects: { credits: 1200, addFlags: ['flag_corpo_insider_job'] },
        },
        fail: {
          text: 'The ICE is updated. Your credentials bounce. Someone logs the attempt. You pull out before they trace it, but your old contact goes dark. Smart.',
          effects: { morale: -5 },
        },
      },
      {
        id: 'ci_decline',
        label: '[DELETE_THE_MESSAGE]',
        outcome: {
          text: 'You wipe the message. That life is over. The enclave can merge without you. You sleep better than you expected.',
          effects: { morale: 3 },
        },
      },
    ],
  },
  {
    id: 'chc_corpo_takeover',
    type: 'choice', weight: 3, path: 'corpo',
    triggers: { minTurn: 12, requiredFlags: ['flag_corpo_insider_job'] },
    title: 'HOSTILE_ACQUISITION',
    prompt: 'Your old contact surfaces again. They\'re frantic. "The merger is collapsing. There\'s a power vacuum. I can put your name in the hat. Executive clearance. Do you want back in?"',
    choices: [
      {
        id: 'ct_exec',
        label: '[TAKE_THE_SEAT]',
        statCheck: { stat: 'face', threshold: 15 },
        pass: {
          text: 'You walk into the boardroom like you never left. The old guard steps aside. Your clearance is reactivated. +2,500 CR and a seat at the table.',
          effects: { credits: 2500, morale: 8, factionDelta: { fac_lexicon: 15 } },
        },
        fail: {
          text: 'The board sees you coming. They\'ve already filled the seat. Your contact is escorted out. You\'re not banned, but the door is definitely closed now.',
          effects: { morale: -8, factionDelta: { fac_lexicon: -10 } },
        },
      },
      {
        id: 'ct_stay',
        label: '[STAY_IN_THE_STREETS]',
        outcome: {
          text: 'You let the message expire. The enclave isn\'t your world anymore. The street is. You don\'t look back. That door closes forever, and you\'re fine with it.',
          effects: { morale: 5, addFlags: ['flag_corpo_walked_away'] },
        },
      },
    ],
  },

  // STREET_KID — 2 events
  {
    id: 'chc_street_crew',
    type: 'choice', weight: 4, path: 'street_kid',
    triggers: { minTurn: 5 },
    title: 'OLD_CREW_CALLING',
    prompt: 'A face from the old Static crew finds you at the noodle stall. "We\'re hitting a Lexicon cargo drone tonight. Could use someone who knows the grid. Split\'s even. You in, or you gone soft?"',
    choices: [
      {
        id: 'sc_join',
        label: '[JOIN_THE_HEIST]',
        statCheck: { stat: 'ghost', threshold: 13 },
        pass: {
          text: 'You ghost the drone\'s tracking and redirect the cargo to a blind drop. The crew splits the haul. Your cut: 900 CR. They call you the ghost who never left.',
          effects: { credits: 900, factionDelta: { fac_static: 10 } },
        },
        fail: {
          text: 'The drone\'s security is tighter than expected. You trigger a proximity alarm. The crew scatters. You get away clean, but the haul is gone. Embarrassing.',
          effects: { morale: -4, factionDelta: { fac_static: -5 } },
        },
      },
      {
        id: 'sc_pass',
        label: '[SIT_THIS_ONE_OUT]',
        outcome: {
          text: 'You shake your head. "Not my fight anymore." The crew nods. They don\'t hold it against you. A street kid who survives long enough to say no is rare.',
          effects: { morale: 2 },
        },
      },
    ],
  },
  {
    id: 'chc_street_market',
    type: 'choice', weight: 3, path: 'street_kid',
    triggers: { minTurn: 10 },
    title: 'SALTGATE_OPPORTUNITY',
    prompt: 'A Saltgate Market stall is selling pre-collapse data-shards. The vendor doesn\'t know what they have. One shard glows faintly — military-grade encryption. The vendor wants 300 CR for the lot.',
    choices: [
      {
        id: 'sm_buy',
        label: '[BUY_THE_LOT]',
        outcome: {
          text: 'You pay 300 CR and walk away with twelve shards. The encrypted one contains Grammaton patrol routes from the last three months. Resale value: significant.',
          effects: { credits: -300, addFlags: ['flag_patrol_intel'] },
        },
      },
      {
        id: 'sm_haggle',
        label: '[HAGGLE_HARD]',
        statCheck: { stat: 'face', threshold: 12 },
        pass: {
          text: 'You talk them down to 100 CR. They don\'t know what they\'re sitting on. The encrypted shard alone is worth twenty times that to the right buyer.',
          effects: { credits: -100, addFlags: ['flag_patrol_intel'] },
        },
        fail: {
          text: 'The vendor gets suspicious. "If you want it that bad, it\'s worth more." They pull the lot. You walk away empty-handed but wiser.',
          effects: {},
        },
      },
      {
        id: 'sm_walk',
        label: '[WALK_AWAY]',
        outcome: {
          text: 'You leave the shards on the table. Not every deal is yours to make. The next runner who picks them up might owe you a favor, or might not. You don\'t keep score.',
          effects: {},
        },
      },
    ],
  },

  // NOMAD — 2 events
  {
    id: 'chc_nomad_convoy',
    type: 'choice', weight: 4, path: 'nomad',
    triggers: { minTurn: 5 },
    title: 'CONVOY_DISTRESS',
    prompt: 'A clan convoy on the mag-highway pings a distress signal. Engine failure. They\'re sitting ducks for scavengers. The clan markings are unfamiliar, but the code is badlands-standard.',
    choices: [
      {
        id: 'nc_help',
        label: '[RENDER_AID]',
        statCheck: { stat: 'chrome', threshold: 12 },
        pass: {
          text: 'You muscle the engine block back into alignment and recalibrate the fuel injectors. The convoy leader clasps your arm. "You\'re clan now, whether you wear the mark or not." +600 CR and a new ally.',
          effects: { credits: 600, morale: 5, factionDelta: { fac_undercity: 8 } },
        },
        fail: {
          text: 'The repair doesn\'t hold. The engine seizes again twenty klicks out. They send a thank-you ping anyway. Nomads remember the attempt more than the result.',
          effects: { morale: -2 },
        },
      },
      {
        id: 'nc_ignore',
        label: '[KEEP_MOVING]',
        outcome: {
          text: 'You let the distress signal fade. Every nomad clan learns to fix their own rigs. It\'s the first rule. They\'ll figure it out or they won\'t.',
          effects: {},
        },
      },
    ],
  },
  {
    id: 'chc_nomad_salvage',
    type: 'choice', weight: 3, path: 'nomad',
    triggers: { minTurn: 10 },
    title: 'WRECKAGE_FOUND',
    prompt: 'You find a nomad rig wrecked in the badlands fringe, stripped of parts but still carrying a sealed cargo bay. The manifest is encrypted. The clan that owned it is either dead or moved on.',
    choices: [
      {
        id: 'ns_crack',
        label: '[CRACK_THE_BAY]',
        statCheck: { stat: 'wire', threshold: 14 },
        pass: {
          text: 'You bypass the encryption. The cargo bay contains medical supplies — pre-collapse antibiotics. Priceless. You sell them quietly for 1,500 CR. The clan that lost them is long gone.',
          effects: { credits: 1500, addFlags: ['flag_salvaged_supplies'] },
        },
        fail: {
          text: 'The cargo bay\'s security triggers a distress beacon. Grammaton patrol is en route. You bail with nothing but a scorched deck and a lesson.',
          effects: { morale: -5 },
        },
      },
      {
        id: 'ns_leave',
        label: '[LEAVE_IT_BE]',
        outcome: {
          text: 'You leave the wreck untouched. Someone else will find it. Maybe the clan that lost it. Maybe not. The badlands take everything eventually.',
          effects: { morale: 2 },
        },
      },
    ],
  },
];
