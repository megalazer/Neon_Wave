// Relationship-driven events — flavor + choice.
// Reuses the same schema as flavor.js / choices.js.
// ALL ids are prefixed: flv_rel_ / chc_rel_

export const REL_FLAVOR_EVENTS = [
  // ── RICO ────────────────────────────────────────────────────────────────
  {
    id: 'flv_rel_rico_choom',
    type: 'flavor',
    weight: 6,
    triggers: { requiresFriendMet: 'frn_rico', minTurn: 3 },
    narration:
      "Ran into my choom Rico at the Glass Eye. He bought the first round, like always.",
    effects: { morale: 3, friendBondDelta: { friendId: 'frn_rico', amount: 2 } },
    accent: 'secondary',
  },
  // ── VIV ─────────────────────────────────────────────────────────────────
  {
    id: 'flv_rel_viv_intel',
    type: 'flavor',
    weight: 6,
    triggers: { requiresFriendMet: 'frn_viv', minTurn: 4 },
    narration:
      "Viv pings you at 2am. 'Unsecured memo from floor 44. Thought you'd want to see this.' A few bullet points that'll pay rent.",
    effects: { morale: 2, friendBondDelta: { friendId: 'frn_viv', amount: 2 } },
    accent: 'primary',
  },
  // ── SOL ─────────────────────────────────────────────────────────────────
  {
    id: 'flv_rel_sol_supply',
    type: 'flavor',
    weight: 6,
    triggers: { requiresFriendMet: 'frn_sol', minTurn: 4 },
    narration:
      "Sol's convoy rolls through. He tosses you a sealed crate. 'Trade surplus. Better with you than rusting in a cache.'",
    effects: { morale: 3, friendBondDelta: { friendId: 'frn_sol', amount: 2 } },
    accent: 'tertiary',
  },
  // ── Netrunner warm beat ─────────────────────────────────────────────────
  {
    id: 'flv_rel_netrunner_warm',
    type: 'flavor',
    weight: 5,
    triggers: { requiresClass: 'Netrunner', crewBondAtLeast: 40, minTurn: 6 },
    narration:
      "Your netrunner pings you a clean exploit, unprompted. 'Saw it, thought of you.'",
    effects: { bondDelta: { targetClass: 'Netrunner', amount: 1 } },
    accent: 'tertiary',
  },
  // ── Generic crew warm beats (any class, high bond) ──────────────────────
  {
    id: 'flv_rel_samurai_warm',
    type: 'flavor',
    weight: 4,
    triggers: { requiresClass: 'Street Samurai', crewBondAtLeast: 50, minTurn: 8 },
    narration:
      "Your Street Samurai sharpens their blade in silence, then nods at you. That's a compliment. Take it.",
    effects: { morale: 2, bondDelta: { targetClass: 'Street Samurai', amount: 1 } },
    accent: 'secondary',
  },
  {
    id: 'flv_rel_doc_warm',
    type: 'flavor',
    weight: 4,
    triggers: { requiresClass: 'Chrome Doc', crewBondAtLeast: 50, minTurn: 8 },
    narration:
      "Your Chrome Doc slides a sealed hypo across the table. 'Factory seconds. Still sterile. Don't ask.'",
    effects: { morale: 2, bondDelta: { targetClass: 'Chrome Doc', amount: 1 } },
    accent: 'tertiary',
  },
  {
    id: 'flv_rel_ghost_warm',
    type: 'flavor',
    weight: 4,
    triggers: { requiresClass: 'Ghost', crewBondAtLeast: 50, minTurn: 8 },
    narration:
      "Your Ghost appears out of nowhere with a data-slate. 'You're being tailed. Was. Now you're not.'",
    effects: { morale: 2, bondDelta: { targetClass: 'Ghost', amount: 1 } },
    accent: 'outline',
  },
];

// ── CHOICE EVENTS ──────────────────────────────────────────────────────────

export const REL_CHOICE_EVENTS = [
  // ── Netrunner: port-forward confrontation ───────────────────────────────
  {
    id: 'chc_rel_portforward',
    type: 'choice',
    weight: 5,
    triggers: {
      requiresClass: 'Netrunner',
      requiredFlags: ['flag_recent_equip'],
      crewBondAtMost: 59,
      minTurn: 6,
    },
    title: 'COMMS_INCOMING',
    prompt:
      "Your netrunner corners you. 'You hot-swapped chrome and left a port forwarded wide open last run. You trying to get us flatlined?'",
    choices: [
      {
        id: 'apologize',
        label: '[OWN_IT]',
        statCheck: { stat: 'face', threshold: 12 },
        pass: {
          text: "'Yeah. My bad.' They exhale, half a laugh. 'Alright. I patched it. Run a scan next time, yeah?'",
          effects: {
            bondDelta: { targetClass: 'Netrunner', amount: 6 },
            morale: 2,
          },
        },
        fail: {
          text: "'Look, I know. I'll fix it.' They don't look convinced. 'Sure you will.'",
          effects: {
            bondDelta: { targetClass: 'Netrunner', amount: -2 },
          },
        },
      },
      {
        id: 'dismiss',
        label: '[BRUSH_IT_OFF]',
        outcome: {
          text: "'Relax. I've been running longer than you.' They go quiet. The silence is worse than the yelling.",
          effects: {
            bondDelta: { targetClass: 'Netrunner', amount: -6 },
            morale: -3,
          },
        },
      },
      {
        id: 'bribe',
        label: '[BUY_NEW_DECK]',
        requires: { credits: 500 },
        outcome: {
          text: "You hand them 500 CR. 'New deck. On me.' They pocket it, grudging respect. 'Fine. But next time I'm charging double.'",
          effects: {
            credits: -500,
            bondDelta: { targetClass: 'Netrunner', amount: 5 },
          },
        },
      },
    ],
  },
  // ── Friend favor: RICO ──────────────────────────────────────────────────
  {
    id: 'chc_rel_favor_rico',
    type: 'choice',
    weight: 4,
    triggers: {
      requiresFriendMet: 'frn_rico',
      friendBondAtLeast: 60,
      excludeFlags: ['flag_rico_favor_offered'],
      minTurn: 10,
    },
    title: 'COMMS_INCOMING',
    prompt:
      "Rico grabs your arm outside the bar. 'Choom. I got a line on a score but I need a second pair of fists. You in?'",
    choices: [
      {
        id: 'accept',
        label: '[I_GOT_YOUR_BACK]',
        outcome: {
          text: "It's a long night, but you walk out richer and closer. Rico claps your shoulder. 'That's why you're family.'",
          effects: {
            credits: 1500,
            morale: 4,
            addFlags: ['flag_rico_favor_offered'],
            friendBondDelta: { friendId: 'frn_rico', amount: 8 },
          },
        },
      },
      {
        id: 'decline',
        label: '[NOT_TONIGHT]',
        outcome: {
          text: "He nods, disappointed but not surprised. 'Yeah. Cool. Next time.' But next time feels farther away.",
          effects: {
            morale: -2,
            addFlags: ['flag_rico_favor_offered'],
            friendBondDelta: { friendId: 'frn_rico', amount: -3 },
          },
        },
      },
    ],
  },
  // ── Friend favor: VIV ───────────────────────────────────────────────────
  {
    id: 'chc_rel_favor_viv',
    type: 'choice',
    weight: 4,
    triggers: {
      requiresFriendMet: 'frn_viv',
      friendBondAtLeast: 60,
      excludeFlags: ['flag_viv_favor_offered'],
      minTurn: 10,
    },
    title: 'SECURE_CHANNEL',
    prompt:
      "Viv's voice drops. 'I have access to a server that goes dark in six hours. You want what's on it, I need you to run a relay on your end.'",
    choices: [
      {
        id: 'accept',
        label: '[FIRE_IT_UP]',
        outcome: {
          text: "You route the relay. Data floods in. Viv's voice is ice-calm. 'We just made six months of your rent. Delete the logs.'",
          effects: {
            credits: 2000,
            morale: 3,
            addFlags: ['flag_viv_favor_offered'],
            friendBondDelta: { friendId: 'frn_viv', amount: 8 },
          },
        },
      },
      {
        id: 'decline',
        label: '[TOO_HOT]',
        outcome: {
          text: "'Understood.' The channel dies. The next time she calls, the warmth is gone. Just business.",
          effects: {
            morale: -2,
            addFlags: ['flag_viv_favor_offered'],
            friendBondDelta: { friendId: 'frn_viv', amount: -3 },
          },
        },
      },
    ],
  },
  // ── Friend favor: SOL ───────────────────────────────────────────────────
  {
    id: 'chc_rel_favor_sol',
    type: 'choice',
    weight: 4,
    triggers: {
      requiresFriendMet: 'frn_sol',
      friendBondAtLeast: 60,
      excludeFlags: ['flag_sol_favor_offered'],
      minTurn: 10,
    },
    title: 'CONVOY_FREQ',
    prompt:
      "Sol's voice crackles over the convoy band. 'We're routing through your sector. Got a piece of hardware the client didn't claim. It's yours if you want the heat.'",
    choices: [
      {
        id: 'accept',
        label: '[TAKE_IT]',
        outcome: {
          text: "You meet the convoy at the edge. Sol hands you a crate. 'Clan pays its debts. Road keeps turning.'",
          effects: {
            credits: 1200,
            morale: 5,
            addFlags: ['flag_sol_favor_offered'],
            friendBondDelta: { friendId: 'frn_sol', amount: 8 },
          },
        },
      },
      {
        id: 'decline',
        label: '[PASS]',
        outcome: {
          text: "Sol shrugs. 'Your call, kin.' The crate goes back on the truck. The convoy rolls on without looking back.",
          effects: {
            morale: -1,
            addFlags: ['flag_sol_favor_offered'],
            friendBondDelta: { friendId: 'frn_sol', amount: -2 },
          },
        },
      },
    ],
  },
];
