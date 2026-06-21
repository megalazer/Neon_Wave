// Faction-flavored contracts. Same schema as low/mid/high; tagged with a canonical
// faction id + rep reward/penalty. Two are FRIENDLY+ gated to show rep unlocking work.
// Battle-triggering stages spawn faction- and tier-appropriate encounters (see encounterGenerator).

export const FACTION_CONTRACTS = [
  // ── LEXICON — gene-edit heist ──────────────────────────────────────────────
  {
    id: 'con_fac_lexicon_wordmade',
    tier: 'MID',
    teamLevelRequired: 4,
    fixerId: 'kade',
    moduleNumber: 'F-LX01',
    questline: 'The Word & The Signal',
    questlineStage: 4,
    cyberwareReward: { pool: 'MID', chance: 0.4 },
    name: 'THE_WORD_MADE_FLESH',
    faction: 'fac_lexicon',
    factionRepReward: 18,
    factionRepPenalty: 10,
    minFactionRep: 'FRIENDLY',
    description: 'The Lexicon wants a rival gene-scribe\'s research suite lifted before it\'s published. Edit the record. Edit the man if you have to.',
    payout: 8200,
    deposit: 400,
    exp: 440,
    stages: [
      {
        id: 'lx_clinic',
        stageNumber: 1,
        prompt: 'Three factions at war. Lexicon moves to shape the outcome. The scribe works out of a chrome-clean clinic in Highmark. His research lives on an air-gapped wetware server, literally grown into a vat-brain. You can spoof credentials at the desk, or go in through the bio-waste duct.',
        label: 'STAGE_01',
        title: 'THE CLINIC',
        choices: [
          {
            id: 'lx_spoof',
            label: 'Spoof clinic credentials',
            statCheck: { stat: 'face', threshold: 12 },
            pass: {
              text: 'You wear someone else\'s name like a tailored coat. The desk waves you through to the inner lab.',
              branch: 'advance',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'The receptionist\'s smile doesn\'t reach her optics. You back off and take the duct instead. Slower. Filthier.',
              branch: 'advance',
            },
          },
          {
            id: 'lx_duct',
            label: 'Crawl the bio-waste duct',
            outcome: {
              text: 'You come up through the floor smelling of disinfectant and worse. But you\'re inside, unseen.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'lx_vatbrain',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'THE VAT-BRAIN',
        prompt: 'The research is encoded in living tissue. Copy it cleanly with a neural siphon (WIRE), or just cut the vat free and carry the whole wet mess out. Cruder, leaves him nothing.',
        choices: [
          {
            id: 'lx_siphon',
            label: 'Siphon the data clean',
            statCheck: { stat: 'wire', threshold: 13 },
            pass: {
              text: 'Bit by bit, the vat-brain whispers its secrets into your deck. He\'ll never know it was read.',
              branch: 'complete',
              effects: { rewardModifier: 0.2 },
            },
            fail: {
              text: 'The siphon stalls halfway. You panic-pull the vat and run with a dripping cradle under one arm. Messy, but done.',
              branch: 'complete',
            },
          },
          {
            id: 'lx_carve',
            label: 'Cut the vat free and run',
            outcome: {
              text: 'You sever the cradle and haul it out. The Lexicon gets the tissue and the satisfaction of leaving a rival blank.',
              branch: 'complete',
              effects: { rewardModifier: 0.1 },
            },
          },
        ],
      },
    ],
    successNarration: 'The Lexicon receives the work. "Meaning belongs to those who can read it," Kade quotes. Payment clears. The shadow war has a new player.',
    failureNarration: 'The grab fell apart. The Lexicon recovers nothing but the cost of your insertion.',
    abortNarration: 'You walked. The scribe publishes next week. The Lexicon does not forget who left the word unwritten.',
  },

  // ── GRAMMATON — enforcement / order (FRIENDLY-gated) ───────────────────────
  {
    id: 'con_fac_grammaton_redline',
    tier: 'MID',
    teamLevelRequired: 5,
    fixerId: 'kade',
    moduleNumber: 'F-GR01',
    questline: 'The Word & The Signal',
    questlineStage: 5,
    cyberwareReward: { pool: 'MID', chance: 0.4 },
    name: 'REDLINE_ENFORCEMENT',
    faction: 'fac_grammaton',
    factionRepReward: 20,
    factionRepPenalty: 14,
    minFactionRep: 'FRIENDLY',
    description: 'Grammaton only hands sanctioned enforcement to people it trusts. A licensed contractor went off-script and started freelancing with corp gear. Bring the gear back. The contractor is optional.',
    payout: 9000,
    deposit: 600,
    exp: 480,
    stages: [
      {
        id: 'gr_locate',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'OFF THE GRAMMAR',
        prompt: 'Lexicon\'s word-spreading caught Grammaton\'s attention. Enforcement follows. The rogue contractor holes up in a dead mall in Sector 9. Grammaton wants it clean and by-the-book. Announce yourself as sanctioned enforcement (FACE) or move in quiet.',
        choices: [
          {
            id: 'gr_announce',
            label: 'Invoke Grammaton sanction',
            statCheck: { stat: 'face', threshold: 13 },
            pass: {
              text: 'You read him the regulation, badge-cold. Half his crew stands down on the spot. They know the grammar too.',
              branch: 'advance',
              effects: { rewardModifier: 0.2, factionRep: 0 },
            },
            fail: {
              text: 'He laughs at the badge. "Rules are for people who can\'t afford lawyers." Now it\'s the hard way.',
              branch: 'advance',
            },
          },
          {
            id: 'gr_quiet',
            label: 'Move in quiet',
            outcome: {
              text: 'No announcement. You map his sentries and pick the moment yourself.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'gr_confront',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'BY THE BOOK',
        prompt: 'He won\'t give the gear back. He reaches for it instead. Enforce the order.',
        choices: [
          {
            id: 'gr_enforce',
            label: 'Enforce, take him down',
            outcome: {
              text: 'You move first. Grammaton trains its people to end conversations cleanly.',
              branch: 'triggersBattle',
              onVictory: {
                branch: 'complete',
                text: 'Gear recovered, contractor cuffed for collection. The grammar holds.',
                effects: { rewardModifier: 0.15 },
              },
              onDefeat: {
                branch: 'fail',
                text: 'He was better than his file said. You limp out empty-handed. Grammaton notes the failure.',
              },
            },
          },
        ],
      },
    ],
    successNarration: 'Grammaton logs the gear returned and the order restored. Trusted hands get trusted work. Payment and standing follow.',
    failureNarration: 'The enforcement failed. Grammaton recovers nothing and revises your file downward.',
    abortNarration: 'You abandoned a sanctioned job mid-enforcement. Grammaton does not tolerate a broken rule, least of all from its own.',
  },

  // ── SIGNAL — own the pipes ─────────────────────────────────────────────────
  {
    id: 'con_fac_signal_deadrelay',
    tier: 'LOW',
    teamLevelRequired: 2,
    fixerId: 'remi',
    moduleNumber: 'F-SG01',
    questline: 'The Word & The Signal',
    questlineStage: 1,
    cyberwareReward: { pool: 'LOW', chance: 0.5 },
    name: 'DEAD_RELAY',
    faction: 'fac_signal',
    factionRepReward: 12,
    factionRepPenalty: 7,
    minFactionRep: 'FRIENDLY',
    description: 'A Signal relay went dark in the Undercity. Could be a fault. Could be someone splicing the line. The Signal wants its pipe back and the answer to which.',
    payout: 1900,
    deposit: 0,
    exp: 130,
    stages: [
      {
        id: 'sg_descend',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'DOWN THE LINE',
        prompt: 'The relay sits in a flooded service vault three levels down. The water\'s knee-deep and humming with leaked current. Wade carefully (GRIT) or reroute power first to kill the charge.',
        choices: [
          {
            id: 'sg_wade',
            label: 'Wade through the live water',
            statCheck: { stat: 'grit', threshold: 11 },
            pass: {
              text: 'You feel the current bite at your boots and keep walking. The relay\'s just ahead, blinking sick.',
              branch: 'advance',
            },
            fail: {
              text: 'A jolt drops you to one knee. You make it across, teeth buzzing, dignity left in the water.',
              branch: 'advance',
            },
          },
          {
            id: 'sg_reroute',
            label: 'Reroute and kill the charge',
            outcome: {
              text: 'You bleed the line dry before stepping in. Slower, but you keep all your nerve endings.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'sg_splice',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'THE SPLICE',
        prompt: 'It\'s not a fault. Someone spliced a fat tap into the relay. Pirate bandwidth, Static signature all over it. Rip the tap and restore the pipe, or leave it and report a simple fault for an easier life.',
        choices: [
          {
            id: 'sg_rip',
            label: 'Rip the tap, restore the pipe',
            outcome: {
              text: 'You tear out the splice and reseat the relay. The Signal\'s pulse returns to the line, clean. Static loses a vein.',
              branch: 'complete',
              effects: { rewardModifier: 0.15, factionRep: 0 },
            },
          },
          {
            id: 'sg_ignore',
            label: 'Report a simple fault',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'You patch the relay around the tap and file it as hardware failure. The Signal\'s happy. The pirates keep sipping. Nobody the wiser.',
              branch: 'complete',
            },
            fail: {
              text: 'Your falsified log doesn\'t hold up to the Signal\'s diagnostics. They see the tap anyway, and that you hid it. Cooler reception.',
              branch: 'complete',
              effects: { rewardModifier: -0.1 },
            },
          },
        ],
      },
    ],
    successNarration: 'The relay sings again. The Signal sees its pipe restored and remembers who fixed it. Static is making its move. Pay attention.',
    failureNarration: 'The relay stays dark. The Signal eats the downtime and pays only for the attempt.',
    abortNarration: 'You left the pipe broken. In the Signal\'s theology, that\'s a kind of blasphemy.',
  },

  // ── REFERENT — price everything ────────────────────────────────────────────
  {
    id: 'con_fac_referent_markto',
    tier: 'MID',
    teamLevelRequired: 5,
    fixerId: 'kade',
    moduleNumber: 'F-RF01',
    questline: 'The Word & The Signal',
    questlineStage: 6,
    cyberwareReward: { pool: 'MID', chance: 0.4 },
    name: 'MARK_TO_MARKET',
    faction: 'fac_referent',
    factionRepReward: 16,
    factionRepPenalty: 10,
    minFactionRep: 'FRIENDLY',
    description: 'Referent Capital needs a competitor\'s valuation model corrupted twelve hours before a hostile bid. Not stolen. Poisoned. Make their numbers lie in Referent\'s favor.',
    payout: 8800,
    deposit: 500,
    exp: 460,
    stages: [
      {
        id: 'rf_access',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'THE TRADING FLOOR',
        prompt: 'Five factions bleeding each other dry. Referent demands its cut. The model runs on a sealed quant cluster behind a trading floor that never sleeps. You can socially-engineer a floor pass, or ride in on the catering contractor\'s creds.',
        choices: [
          {
            id: 'rf_pass',
            label: 'Talk your way to a floor pass',
            statCheck: { stat: 'face', threshold: 13 },
            pass: {
              text: 'You speak fluent money. Security prints you a badge and a coffee. The floor swallows you whole.',
              branch: 'advance',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'Your story doesn\'t price out. You fall back to the catering route, hauling someone else\'s canapés.',
              branch: 'advance',
            },
          },
          {
            id: 'rf_catering',
            label: 'Ride the catering creds',
            outcome: {
              text: 'Nobody watches the help. You push a trolley past three checkpoints and into the service corridor.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'rf_poison',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'POISON THE WELL',
        prompt: 'You reach the cluster. Inject a subtle bias that skews the valuation just enough to survive an audit (WIRE), or sledgehammer the model and make it obvious. Louder, but Referent gets a cleaner kill.',
        choices: [
          {
            id: 'rf_subtle',
            label: 'Inject a subtle bias',
            statCheck: { stat: 'wire', threshold: 14 },
            pass: {
              text: 'A few decimal points, moved like a card off the bottom of the deck. The model will lie and swear it\'s telling the truth.',
              branch: 'complete',
              effects: { rewardModifier: 0.25 },
            },
            fail: {
              text: 'Your bias trips a consistency check. You overwrite it with a blunter corruption before alarms wake. Works, but they\'ll know it was sabotage.',
              branch: 'complete',
            },
          },
          {
            id: 'rf_smash',
            label: 'Sledgehammer the model',
            outcome: {
              text: 'You gut the valuation engine outright. Crude, undeniable, and twelve hours before the bid, exactly when it hurts most.',
              branch: 'complete',
              effects: { rewardModifier: 0.1 },
            },
          },
        ],
      },
    ],
    successNarration: 'The competitor walks into the bid blind. Referent buys low and pays you a sliver of the spread, which is still a fortune.',
    failureNarration: 'The poison didn\'t take. Referent eats the bid at full price and remembers the line item that failed.',
    abortNarration: 'You pulled out before the close. Referent prices your reliability accordingly. The number is not kind.',
  },

  // ── UNDERTOW — smuggling run ───────────────────────────────────────────────
  {
    id: 'con_fac_undertow_lowtide',
    tier: 'LOW',
    teamLevelRequired: 2,
    fixerId: 'nyx',
    moduleNumber: 'F-UT01',
    questline: 'The Word & The Signal',
    questlineStage: 3,
    cyberwareReward: { pool: 'LOW', chance: 0.5 },
    name: 'LOW_TIDE_RUN',
    faction: 'fac_undertow',
    factionRepReward: 14,
    factionRepPenalty: 8,
    minFactionRep: 'FRIENDLY',
    description: 'Undertow has a crate that needs to cross three checkpoints without existing on any manifest. Don\'t ask what\'s in it. Just keep it dry and keep it moving.',
    payout: 2100,
    deposit: 0,
    exp: 140,
    stages: [
      {
        id: 'ut_checkpoint',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'FIRST CHECKPOINT',
        prompt: 'Signal and Static are bleeding each other. Undertow profits from the chaos. A Grammaton checkpoint stands between you and the canal. Slip the crate through hidden in a refuse hauler, or bribe the bored officer working the late shift (200 CR).',
        choices: [
          {
            id: 'ut_bribe',
            label: 'Bribe the officer (200 CR)',
            requires: { credits: 200 },
            outcome: {
              text: 'Two hundred eddies and a nod. He stamps a manifest he doesn\'t read. The crate rolls through clean.',
              branch: 'advance',
              effects: { credits: -200, rewardModifier: 0.1 },
            },
          },
          {
            id: 'ut_smuggle',
            label: 'Hide it in the refuse hauler',
            statCheck: { stat: 'ghost', threshold: 11 },
            pass: {
              text: 'Under a tonne of synth-waste, the crate is just more garbage. The scanner gags and waves you on.',
              branch: 'advance',
              effects: { rewardModifier: 0.1 },
            },
            fail: {
              text: 'The hauler gets a second look. You talk fast and lose twenty minutes, but the crate stays buried.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'ut_canal',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'THE CANAL',
        prompt: 'A Static cell controls the canal crossing tonight, jamming everything that moves. Pay their toll in noise (let them scramble your comms), or find a quiet culvert around them.',
        choices: [
          {
            id: 'ut_toll',
            label: 'Pay the noise toll',
            outcome: {
              text: 'You let Static fuzz your signals to white static for ten minutes. Blind and deaf, but the crate crosses and they let you pass.',
              branch: 'complete',
            },
          },
          {
            id: 'ut_culvert',
            label: 'Slip around through a culvert',
            statCheck: { stat: 'ghost', threshold: 12 },
            pass: {
              text: 'You thread a forgotten drainage culvert and surface past the jam. Undertow likes a runner who knows the gray paths.',
              branch: 'complete',
              effects: { rewardModifier: 0.2 },
            },
            fail: {
              text: 'The culvert dead-ends and you double back into the open, hauling the crate at a dead run. You make it. Barely.',
              branch: 'complete',
            },
          },
        ],
      },
    ],
    successNarration: 'The crate reaches the drop dry and unlogged. Nyx passes Undertow\'s thanks and your cut. No questions, as promised.',
    failureNarration: 'The run went wet. Undertow loses the cargo and pays a courtesy fraction for the effort.',
    abortNarration: 'You dropped the crate mid-run. In the gray economy, a courier who quits is a courier nobody hires twice.',
  },

  // ── STATIC — signal-jam sabotage ───────────────────────────────────────────
  {
    id: 'con_fac_static_killtheword',
    tier: 'LOW',
    teamLevelRequired: 3,
    fixerId: 'pyre',
    moduleNumber: 'F-ST01',
    questline: 'The Word & The Signal',
    questlineStage: 2,
    cyberwareReward: { pool: 'LOW', chance: 0.5 },
    name: 'KILL_THE_WORD',
    faction: 'fac_static',
    factionRepReward: 14,
    factionRepPenalty: 8,
    description: 'Static wants a Lexicon broadcast node silenced during its big gene-gospel transmission. Every minute it\'s down is a minute of honest noise. Make it static.',
    payout: 2200,
    deposit: 0,
    exp: 150,
    stages: [
      {
        id: 'st_approach',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'THE BROADCAST TOWER',
        prompt: 'Signal\'s dead relay was no accident. The Static collective responds. The Lexicon node broadcasts from a repurposed cathedral spire, all stained glass and server racks. Climb the exterior in the rain (GRIT), or bluff past the acolytes guarding the door (FACE).',
        choices: [
          {
            id: 'st_climb',
            label: 'Climb the wet spire',
            statCheck: { stat: 'grit', threshold: 12 },
            pass: {
              text: 'Hand over frozen hand, you crest the spire. The transmitter hums below you, fat with meaning to murder.',
              branch: 'advance',
              effects: { rewardModifier: 0.15 },
            },
            fail: {
              text: 'A handhold crumbles. You catch yourself on a gargoyle\'s wing, heart slamming, and finish the climb slower.',
              branch: 'advance',
            },
          },
          {
            id: 'st_bluff',
            label: 'Bluff past the acolytes',
            statCheck: { stat: 'face', threshold: 12 },
            pass: {
              text: 'You speak their gene-cant well enough to pass for a pilgrim. They part for you like a sentence around a comma.',
              branch: 'advance',
            },
            fail: {
              text: 'Your scripture\'s a beat off. They get suspicious; you slip away and take the long climb instead.',
              branch: 'advance',
            },
          },
        ],
      },
      {
        id: 'st_jam',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'MAKE IT NOISE',
        prompt: 'Mid-transmission, the gospel pouring out across the district. Plant a clean jammer that kills the signal precisely, or overload the transmitter into a screaming feedback bloom. Louder, uglier, very Static.',
        choices: [
          {
            id: 'st_clean',
            label: 'Plant a precise jammer',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'The gospel cuts to dead air, mid-word. Across the district, a million screens go honest. Static will love the silence.',
              branch: 'complete',
              effects: { rewardModifier: 0.15, factionRep: 0 },
            },
            fail: {
              text: 'The jammer half-takes; the signal stutters but claws back. You rip the transmitter\'s feed cable by hand to finish it.',
              branch: 'complete',
            },
          },
          {
            id: 'st_overload',
            label: 'Overload it into feedback',
            outcome: {
              text: 'You spike the transmitter until it shrieks its own death across every band. Pure noise. The Lexicon\'s word drowns in it.',
              branch: 'complete',
              effects: { rewardModifier: 0.1 },
            },
          },
        ],
      },
    ],
    successNarration: 'The node dies screaming static. Pyre relays Static\'s crude approval: "Best message is no message." Payment, in cash, in noise.',
    failureNarration: 'The broadcast survived. Static pays for the attempt and sulks in its own silence.',
    abortNarration: 'You let the word keep speaking. Static has no creed for cowards who leave the air clean.',
  },

  // ── UNDERTOW — high-trust deep job (ALLIED-gated) ──────────────────────────
  {
    id: 'con_fac_undertow_meaningunder',
    tier: 'HIGH',
    teamLevelRequired: 9,
    fixerId: 'dusk',
    moduleNumber: 'F-UT02',
    questline: 'The Word & The Signal',
    questlineStage: 8,
    cyberwareReward: { pool: 'HIGH', chance: 0.6 },
    name: 'THE_MEANING_UNDER',
    faction: 'fac_undertow',
    factionRepReward: 28,
    factionRepPenalty: 18,
    minFactionRep: 'FRIENDLY',
    description: 'Undertow only whispers this one to family. A ledger exists that names every fixer in the gray economy, including Undertow\'s own. Steal it before Grammaton seizes it, or the whole underworld goes transparent.',
    payout: 32000,
    deposit: 2000,
    exp: 1700,
    stages: [
      {
        id: 'um_race',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'BEFORE THE RAID',
        prompt: 'The shadow war\'s final act. Undertow goes for the throat. Grammaton moves on the ledger\'s holder at dawn. You have hours. Hit the safehouse ahead of them in the dark (GHOST), or intercept the holder in transit and take it on the move.',
        choices: [
          {
            id: 'um_safehouse',
            label: 'Hit the safehouse first',
            statCheck: { stat: 'ghost', threshold: 15 },
            pass: {
              text: 'You\'re in and out of the safehouse like a held breath. The ledger\'s in your pocket before Grammaton\'s vans even roll.',
              branch: 'advance',
              effects: { rewardModifier: 0.25 },
            },
            fail: {
              text: 'The safehouse is already half-burned by its own paranoid owner. You salvage the ledger from a floor safe as sirens grow. Close.',
              branch: 'advance',
            },
          },
          {
            id: 'um_intercept',
            label: 'Intercept the holder in transit',
            outcome: {
              text: 'You take the holder on a rain-slick overpass, between safehouse and the unknown. He doesn\'t give up the ledger easy.',
              branch: 'triggersBattle',
              onVictory: {
                branch: 'advance',
                text: 'He goes down. The ledger\'s yours, and dawn\'s still an hour off.',
                effects: { rewardModifier: 0.1 },
              },
              onDefeat: {
                branch: 'fail',
                text: 'His detail was heavier than promised. You break off as Grammaton closes the net. The ledger\'s gone to the law.',
              },
            },
          },
        ],
      },
      {
        id: 'um_choice',
        stageNumber: 2,
        label: 'STAGE_02',
        title: 'WHAT IT\'S WORTH',
        prompt: 'You hold the names of every fixer alive. Deliver it to Undertow as sworn, buried forever, or skim a copy for yourself first. Undertow would never know. Probably.',
        choices: [
          {
            id: 'um_deliver',
            label: 'Deliver it clean to Undertow',
            outcome: {
              text: 'You hand it over without a copy. Dusk relays the weight of it: Undertow now owes you in a currency deeper than credits.',
              branch: 'complete',
              effects: { rewardModifier: 0.2, factionRep: 0 },
            },
          },
          {
            id: 'um_skim',
            label: 'Skim a copy for yourself',
            statCheck: { stat: 'wire', threshold: 15 },
            pass: {
              text: 'You ghost a copy onto cold storage no one will ever scan, then deliver the original. Leverage for a rainier day. Undertow suspects nothing.',
              branch: 'complete',
              effects: { rewardModifier: 0.35 },
            },
            fail: {
              text: 'Your copy leaves a fingerprint in the transfer log. Dusk\'s voice goes flat: "We\'ll discuss that." You get paid. You also get watched.',
              branch: 'complete',
              effects: { rewardModifier: -0.15 },
            },
          },
        ],
      },
    ],
    successNarration: 'The ledger is Undertow\'s, the underworld stays opaque, and your name is spoken in the gray with something like reverence. The Word & The Signal — eight jobs, six factions, one survivor. You.',
    failureNarration: 'Grammaton got the names. Fixers are vanishing into custody all week. Undertow pays you for the attempt and grieves the rest.',
    abortNarration: 'You walked from the one job Undertow only trusts to family. That door does not open for you twice.',
  },

  // ── REFERENT — market manipulation (LOW entry) ─────────────────────────────
  {
    id: 'con_fac_referent_pumpdump',
    tier: 'LOW',
    teamLevelRequired: 3,
    fixerId: 'remi',
    moduleNumber: 'F-RF02',
    questline: 'The Word & The Signal',
    questlineStage: 7,
    cyberwareReward: { pool: 'LOW', chance: 0.4 },
    name: 'PRICE_DISCOVERY',
    faction: 'fac_referent',
    factionRepReward: 12,
    factionRepPenalty: 7,
    description: 'Referent wants a rumor planted in three exchange backchannels, enough to move a thin synth-coin so they can short it. You\'re a vector for a lie that prices itself true.',
    payout: 1800,
    deposit: 0,
    exp: 120,
    stages: [
      {
        id: 'rf2_seed',
        stageNumber: 1,
        label: 'STAGE_01',
        title: 'SEED THE RUMOR',
        prompt: 'Referent\'s market manipulation ripples outward. The small players get crushed first. Three trader haunts, three whispers, one lie. Sell it with conviction in person (FACE), or inject it as forged insider chatter into the exchange feeds (WIRE).',
        choices: [
          {
            id: 'rf2_talk',
            label: 'Sell it in person',
            statCheck: { stat: 'face', threshold: 11 },
            pass: {
              text: 'You wear the lie like a hot tip you\'re not supposed to share. By the third bar, it\'s repeating itself back to you.',
              branch: 'complete',
              effects: { rewardModifier: 0.2 },
            },
            fail: {
              text: 'One trader calls it thin. You patch the story and push it through anyway, but it spreads slower than Referent wanted.',
              branch: 'complete',
            },
          },
          {
            id: 'rf2_inject',
            label: 'Forge insider chatter',
            statCheck: { stat: 'wire', threshold: 12 },
            pass: {
              text: 'You ghost the rumor into the feeds with timestamps that lie convincingly. The coin twitches, then climbs on its own fear.',
              branch: 'complete',
              effects: { rewardModifier: 0.2 },
            },
            fail: {
              text: 'A feed filter flags one post. The rumor still lands, but with a faint whiff of manufacture. Referent shorts anyway.',
              branch: 'complete',
            },
          },
        ],
      },
    ],
    successNarration: 'The coin spikes on nothing and Referent shorts the top. Value is whatever they say it is, and today they said it through you.',
    failureNarration: 'The rumor died on the vine. Referent\'s short closes flat and your cut closes flatter.',
    abortNarration: 'You declined to lie for them. Referent has no use for a vector that won\'t carry the payload.',
  },
];
