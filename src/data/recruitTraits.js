// ── Trait pools ──────────────────────────────────────────────────────────────
// Cosmetic: pure flavor. Mechanical: tagged [TAG] with gameplay effect description.

const TRAIT_POOLS = {
  common: [
    'Chain-smoker',
    'Prays to the signal',
    'Collects antique bullets',
    'Never blinks',
    'Recites corpo ad copy from memory',
    'Has a pet roach named Dividend',
    'Sleeps with optics open',
    'Always pays in exact change',
    '[GAMBLER] +5% contract payout, -10% on failure',
    '[PARANOID] +2 ghost checks, -2 face checks',
    '[HOTHEAD] +10% combat damage, -3 morale per contract',
    '[HAGGLER] -8% recruit cost, -1 edge on missions',
  ],
  rare: [
    'Ex-corporate. Still uses the old buzzwords.',
    'Black-ops survivor. Wont say which op.',
    'Undercity folk hero. The bars know the songs.',
    'Gene-sculpted. The designer left a watermark.',
    'Debt runner. The interest is personal.',
    'Former priest of the Signal. Lost faith. Kept the voice.',
    'Underground fight circuit. Won more than lost.',
    'Medical school dropout. Knows exactly where it hurts.',
    'Can taste lies. Metallic, she says.',
    '[COLD_BLOOD] +15% ambush damage, -2 face checks',
    '[SCRAPPER] Recover 5% of fallen enemy gear, -1 wire',
    '[NET_DIVING] +15% hack success, -10 vitals start',
  ],
  legendary: [
    'The real deal.',
    'Died once. Came back. Doesnt talk about it.',
    'Keeps a kill count. Updates it daily.',
    'Wrote the protocol. Refuses to maintain it.',
    'Ghost of the old net. The old net remembers back.',
    'Only takes jobs that matter. Defines matter loosely.',
    'Smiles before a fight. Never after.',
    '[LEGEND] +25% rep gains, double rival penalty',
    '[GHOST_PROTOCOL] Once per run: survive a fatal hit with 1 vitals',
    '[NEMESIS] Mark one faction as lifelong enemy. +30% damage vs them.',
  ],
};

// ── Voice lines ──────────────────────────────────────────────────────────────
// One-liner the recruit says on arrival. Class×Faction, 3 each.

const VOICE_LINES = {
  netrunner: {
    fac_signal: [
      'The pipes talk. I listen. You pay.',
      'Signal flows. I ride it. You benefit.',
      "Every packet has a story. I'm the one who reads them.",
    ],
    fac_lexicon: [
      'Code is language. I speak it without an accent.',
      'The Lexicon taught me that words are weapons. Deploying.',
      "I translate between what machines want and what you need.",
    ],
    fac_grammaton: [
      'Rules are syntax. Syntax has loopholes.',
      'The Grammaton writes law. I compile it into action.',
      "Order is just chaos with better documentation. I'm the documentation.",
    ],
    fac_static: [
      'I pull signal from noise. The noise fights back.',
      'Static isnt silence. Its every voice at once. I pick yours.',
      "When the line goes dead, I'm still listening.",
    ],
    fac_undertow: [
      'The deep net doesnt forget. Neither do I.',
      'I sank so far into the Undertow I forgot which way was up. Found my way back.',
      "Down here, data is currency. I'm rich.",
    ],
    fac_referent: [
      'Money has a frequency. I tune in.',
      'The Referent deals in meaning. I deal in the signal beneath it.',
      'I can trace a cred stick through twelve shell companies. Done it twice.',
    ],
  },
  street_samurai: {
    fac_signal: [
      'The signal called. I answered. With chrome.',
      "I don't pray. But the signal and I have an understanding.",
      'Blades and bandwidth. I carry both.',
    ],
    fac_lexicon: [
      'Every fight is a sentence. I write the last word.',
      'The Lexicon says precision is power. My aim agrees.',
      "Words end arguments. I end them faster.",
    ],
    fac_grammaton: [
      'Rules are just violence with paperwork. I skip the paper.',
      'The Grammaton trains discipline. I trained past it.',
      "I enforce the law. The law I choose.",
    ],
    fac_static: [
      'Noise covers footsteps. I walk in static.',
      'You hear interference. I hear a war zone.',
      "Static is honest. It doesn't pretend to be clean.",
    ],
    fac_undertow: [
      'The Undertow pulls you under. I learned to breathe there.',
      'I fought in the deep black for three years. Only thing that broke was my conscience.',
      "Surface fights are polite. I'm not.",
    ],
    fac_referent: [
      'The Referent pays in value. I deliver in impact.',
      "I don't take jobs I don't understand. I understand violence.",
      'Every contract has a body count. I read the fine print.',
    ],
  },
  fixer: {
    fac_signal: [
      'Information moves. I move it faster.',
      'The signal connects buyers to sellers. I connect both to me.',
      "A whisper on the right frequency is worth more than a broadcast. I whisper.",
    ],
    fac_lexicon: [
      'Negotiation is syntax. I conjugate in credits.',
      'The Lexicon arranges words. I arrange outcomes.',
      "I speak seven trade dialects. Lie in all of them.",
    ],
    fac_grammaton: [
      'Contracts are law. I find the gaps.',
      'The Grammaton drafts order. I draft exceptions.',
      "Every rule creates a market. I'm the market.",
    ],
    fac_static: [
      'Chaos is opportunity. I carry a clipboard.',
      'Where the signal breaks, I build bridges. Toll bridges.',
      "Static scares people. I sell calm. Markup is steep.",
    ],
    fac_undertow: [
      'The black market has a current. I steer.',
      'I deal in things that sink. The Undertow taught me buoyancy.',
      "Down here, favors are harder currency than creds. I'm a banker.",
    ],
    fac_referent: [
      'Money talks. I translate.',
      'The Referent sets value. I negotiate it upward.',
      'I can sell water to a drowning man. Gave him a discount.',
    ],
  },
  ghost: {
    fac_signal: [
      'I exist between transmissions. Find me if you can.',
      'The signal carries ghosts. I was the first.',
      "I'm not invisible. I'm just not where you're looking.",
    ],
    fac_lexicon: [
      'Some names are erased. I erase them.',
      'The Lexicon catalogs what exists. I catalog what doesnt.',
      "Language defines reality. I edited myself out.",
    ],
    fac_grammaton: [
      'Rules require enforcement. I am the exception.',
      'The Grammaton keeps order. I keep secrets.',
      "Legal identity is a contract. I tore mine up.",
    ],
    fac_static: [
      'I move in the noise. The noise moved first.',
      'Static hides faces. I dont have one.',
      "They say the static drives people mad. I was already there.",
    ],
    fac_undertow: [
      'I was a rumor before I was a person.',
      'The Undertow erases trails. I erased myself before it could.',
      "I surfaced once. Regretted it immediately.",
    ],
    fac_referent: [
      'Value is perception. I am very expensive.',
      'The Referent quantifies worth. I defy quantification.',
      "They put a price on my head. I bought the contract.",
    ],
  },
  chrome_doc: {
    fac_signal: [
      'The body transmits. I repair the signal.',
      'Flesh is noisy. Chrome is clean. I clean up.',
      "The signal keeps the body alive. I keep the signal running.",
    ],
    fac_lexicon: [
      'They told me healing was a language. I am fluent.',
      'The Lexicon studies meaning. I study what breaks it.',
      "Anatomy is vocabulary. Trauma is punctuation. I edit.",
    ],
    fac_grammaton: [
      'The body has rules. I rewrite them.',
      'The Grammaton demands order. I impose it on flesh.',
      "Regulation says some mods are illegal. My patients don't care.",
    ],
    fac_static: [
      'Pain is just static in the nervous system. I filter.',
      'Bodies fail in predictable ways. I predict faster.',
      "Static is what the body hears when it's dying. I turn it down.",
    ],
    fac_undertow: [
      'I patched up things that shouldnt exist. They paid well.',
      'The Undertow runs on desperation. I run on skill.',
      "Deep clinic. No questions. No records. No complications.",
    ],
    fac_referent: [
      'Health is the ultimate commodity. I trade.',
      'The Referent deals in value. A working body is priceless.',
      "I charge what healing costs. You don't want to know what that is.",
    ],
  },
};

// ── Backstories ──────────────────────────────────────────────────────────────
// 2-sentence vignettes. Concrete, present-tense, noir.

const BACKSTORIES = {
  netrunner: {
    fac_signal: {
      common: [
        'Ran courier packets through Undertow gray net for two years. Got caught, got out, got bored. Says she misses the adrenaline. The twitch in her left eye says she misses something else.',
        'Taught herself to decode Signal procurement manifests at fourteen. Sold the intel to a mid-level fixer who stiffed her. She still has the fixer on a watchlist.',
      ],
      rare: [
        'Wrote the original signal-routing worm that Lexicon still uses for black-bag data ops. Never got credit. Gets a royalty in untraceable creds every quarter.',
        'Spent eighteen months inside a Grammaton data fortress as a planted ghost. Burned when she refused to sabotage her own team. Walked out with half the fortress database in her skull.',
      ],
      legendary: [
        'Built the Undertow relay network from scratch using scrapped satellite parts and a stolen neural link. Three factions tried to recruit her. One tried to kill her. None succeeded.',
        'Surfed the static storm of 72 when the old net collapsed. Most runners died in the surge. She came out the other side with protocols nobody else has seen.',
      ],
    },
    fac_lexicon: {
      common: [
        'Former Lexicon archivist who read one too many classified files. Quit when she realized the catalog was a weapon. Still has access to a few forgotten indexing nodes.',
        'Grew up in a Lexicon education pod. Scored top marks in structured intrusion. Flunked loyalty assessment. Now selling skills to anyone who asks fewer questions.',
      ],
      rare: [
        'Decrypted the Lexicon cant used by deep-cover operatives at seventeen. They offered her a job instead of a bullet. She took the job. Left three years later with a vocabulary nobody else has.',
        'Designed the lexical parsing engine that runs half the citys automated security. Built a backdoor into it. Hasnt used it yet. Waiting for the right price.',
      ],
      legendary: [
        'Named in three Lexicon internal memoranda as a person of interest. The memoranda disagree on whether to recruit or eliminate. She keeps them framed.',
        'Wrote a virus that learned to speak. It taught itself three more languages before Lexicon contained it. She still has the source code. The virus has been asking for her.',
      ],
    },
    fac_grammaton: {
      common: [
        'Grammaton compliance auditor who found too many violations. Reported them. Got reassigned to a windowless office in Sector 12. Left through the window.',
        'Wrote traffic-routing algorithms for Grammaton enforcement convoys. Realized she was optimizing arrest patterns. Optimized herself out of the system instead.',
      ],
      rare: [
        'Cracked the Grammaton judicial cipher during a live trial. Submitted the key as evidence. The case was sealed. So was she, for six months. The cipher is still in use.',
        'Served as Grammaton tactical netrunner for a rapid-response unit. Racked up thirty-seven successful extractions. Request thirty-eight was herself.',
      ],
      legendary: [
        'Authored the Grammaton Codex Annex, the addendum that closed seventeen legal loopholes. The loopholes were hers. She closed them to see who complained. Three corps did.',
        'Ran a shadow court in Sector 4 that arbitrated disputes the Grammaton wouldnt touch. Ran it for five years. The Grammaton found out and offered her a seat. She declined.',
      ],
    },
    fac_static: {
      common: [
        'Grew up in a Static dead zone where the only net access was through a jury-rigged relay on a rooftop. Learned to stretch a weak signal into something usable. Still frugal with bandwidth.',
        'Worked Static border recon, mapping signal bleed zones for salvage crews. Found a buried data cache from the pre-collapse era. Sold the coordinates. Kept the contents.',
      ],
      rare: [
        'Ran interference for Static cell operations in contested territory. Her jamming patterns became standard doctrine. She wasnt told. Found out from a captured enemy manual.',
        'Reverse-engineered a Static null-field generator from battlefield salvage. Modified it to pulse instead of sustain. The pulse knocks out chrome for six seconds. She never sold the design.',
      ],
      legendary: [
        'Soloed a corp data fortress during a Static blackout op. No backup. No extraction. She walked in during the chaos and walked out with the CEO personal files. The blackout was her idea.',
        'Built a mesh network that operates inside Static suppression fields. The military said it was impossible. She built one for every cell in her sector. They stopped saying impossible.',
      ],
    },
    fac_undertow: {
      common: [
        'Dived the Undertow gray markets at sixteen looking for cheap wetware. Found a malicious ICE that burned out her first rig. Rebuilt it from scraps. The ICE is still embedded in her current deck. She says it learned to behave.',
        'Worked Undertow salvage ops, pulling data from drowned corporate servers. Found a corpse still jacked in on her third dive. The corpse had better ware than she did. She didnt report it.',
      ],
      rare: [
        'Brokered Undertow net routes for three years. Knew every backdoor between the surface and the deep. When a corp traced a route back to her, she burned all three years of contacts in one night.',
        'Extracted a netrunner trapped in a recursive ICE loop in Undertow territory. The runner had been looping for eleven days. Came out speaking in fragmented code. Recovered. Mostly.',
      ],
      legendary: [
        'Plumbed the deepest Undertow archive nodes where pre-collapse military AI fragments still run. Most netrunners dont come back from that depth. She brought back schematics for a weapon that doesnt exist.',
        'Survived six months embedded in an Undertow data haven with no outside contact. When she emerged, she had three new identities, two corps banking on her intel, and a warrant in every jurisdiction.',
      ],
    },
    fac_referent: {
      common: [
        'Started as a Referent transaction auditor, tracing missing funds. Found the missing funds. Found who took them. Decided the finders fee was better than the salary. Still auditing. Still finding.',
        'Built a cred-laundering script as a hobby project. It got loose on the Referent exchange and cleaned half a million before anyone noticed. She patched the exploit. Kept the half million.',
      ],
      rare: [
        'Indexed the Referent black budget for two fiscal years. Learned exactly how much a life costs in every district. Filed the knowledge away. Uses it to price her contracts.',
        'Ran a prediction market on Referent trade flows that was accurate enough to move prices. The Referent investigated. She offered them the algorithm. They paid. She gave them a slightly worse version.',
      ],
      legendary: [
        'Hacked the Referent clearinghouse during a live settlement cycle. Nobody noticed for seventeen minutes. In those minutes she proved the entire system was built on trust. She still has the proof.',
        'Designed the transaction anonymizer that half the Referent black market uses. Takes a 0.03 percent cut invisible in the rounding. That was twelve years ago. She hasnt worked since.',
      ],
    },
  },

  street_samurai: {
    fac_signal: {
      common: [
        'Signal relay tower guard who got bored of standing watch. Started running patrols into the noise zone. Came back with scars and a taste for the edge.',
        'Courier for a Signal precinct. Packages got heavier over time. Realized she was delivering weapons. Decided she would rather carry them.',
      ],
      rare: [
        'Signal rapid-response enforcer. Broke up seventeen riots solo. Retired when she realized she was starting to enjoy them. The retirement didnt last.',
        'Trained Signal recruits in urban combat. Wrote a manual on close-quarters chrome deployment. The manual is still used. She isnt.',
      ],
      legendary: [
        'Held a Signal outpost against a Grammaton enforcement battalion for three days. Reinforcements arrived to find her smoking on a pile of disabled chrome. She asked what took them so long.',
        'Signal named a combat doctrine after her. She wasnt consulted. When she found out, she demonstrated why the doctrine had a critical flaw. They renamed it.',
      ],
    },
    fac_lexicon: {
      common: [
        'Lexicon security contractor. Bounced corpo executives from meetings they shouldnt attend. Got tired of suits. Kept the reflexes.',
        'Ran Lexicon archive protection detail. Nothing ever happened. Trained obsessively in the empty hours. Something finally happened. She was ready.',
      ],
      rare: [
        'Lexicon wetwork specialist assigned to terminated-employee recovery. Recovered twelve targets. The thirteenth asked why. She didnt have an answer. Neither did Lexicon.',
        'Bodyguard for a Lexicon negotiator through three hostile territory tours. The negotiator died of natural causes. She took it personally.',
      ],
      legendary: [
        'Fought a Lexicon internal purge from the wrong side. Switched sides mid-operation when she learned the truth. Both sides are still uncertain whether she won or lost.',
        'Lexicon once sent a kill team of twelve. She sent eleven back in boxes and one with a message. The message was one word. That word is now Lexicon policy never to repeat.',
      ],
    },
    fac_grammaton: {
      common: [
        'Grammaton correctional officer who noticed the inmates had better discipline than the guards. Quit after a riot where she sided with the prisoners. Still writes to two of them.',
        'Traffic enforcement in Grammaton Sector 3. Wrote citations. Broke up fights. One fight broke her jaw. She broke back harder. Found she had a gift.',
      ],
      rare: [
        'Grammaton tactical squad leader. Twelve successful breach operations. Promoted to desk. Requested demotion. Denied. Resigned with her squad gear.',
        'Enforcer for a Grammaton judge. Carried out sentences. One sentence was a child. She carried the child somewhere else. The judge is still looking.',
      ],
      legendary: [
        'Grammaton executioner for seven years. Carried out ninety-three sentences. Number ninety-four was a frame job. She executed the framers instead. Keeps the hood.',
        'Led the Grammaton breach that ended the Sector 9 uprising. Saw what Grammaton did after the cameras went off. Testified. The testimony is sealed. She is not.',
      ],
    },
    fac_static: {
      common: [
        'Static cell enforcer in Sector 7 until the cell got burned. Selling their aim now. Wont talk about the missing two fingers.',
        'Grew up in Static contested territory. Learned to shoot before she learned to read. The reading came later. The shooting stayed better.',
      ],
      rare: [
        'Static demolition specialist. Brought down three Grammaton supply depots in one month. The fourth was a trap. She walked into it and out the other side.',
        'Trained Static irregulars in asymmetrical warfare. Her unit held a bridge for nine days against armored corps. The bridge is still there. So is the graffiti.',
      ],
      legendary: [
        'Static assault lead during the Signal corridor war. Credited with forty confirmed armor kills. The number is low. She stopped counting when the kills stopped mattering.',
        'Planned and executed the Static retaliation strike after the Referent market bombing. The strike was surgical. The surgeon was angry.',
      ],
    },
    fac_undertow: {
      common: [
        'Undertow dive bar bouncer with a collection of confiscated weapons. Learned to use all of them. The bar burned down. She didnt.',
        'Security for Undertow freight runners. Got ambushed. Got even. The freight company offered her a permanent position. She prefers temporary. Less paperwork.',
      ],
      rare: [
        'Undertow arena fighter. Won twenty-three bouts. Lost four. The losses taught her more than the wins. Her titanium knuckles are original issue.',
        'Enforcer for an Undertow smuggling ring. The ring got rolled up by Grammaton. She was the only one who walked away. The ring leader thinks she talked. She didnt. Doesnt matter.',
      ],
      legendary: [
        'Undertow pit champion for three consecutive seasons. Retired undefeated. The pit still calls. She still answers sometimes. Just to remind them.',
        'Survived an Undertow deep-tunnel collapse that killed forty-seven others. Dug herself out with a piece of rebar and her own severed chrome arm. The arm is mounted above her workbench.',
      ],
    },
    fac_referent: {
      common: [
        'Referent vault guard who watched other people count money for five years. Started counting her own. Quit when the numbers added up to a ticket out.',
        'Security for a Referent trade delegation. Learned that the polite ones are more dangerous than the armed ones. Applied the lesson to her own career.',
      ],
      rare: [
        'Referent repo enforcement. Collected assets from people who couldnt pay. One collection was a childs cybernetic spine. She paid the debt herself. The repo agency fired her. She kept the spine.',
        'Bodyguard for a Referent trade prince. Prevented four assassinations. The fifth was an inside job. She chose the wrong inside. Left with a severance package and a grudge.',
      ],
      legendary: [
        'Referent hired her to eliminate a competitor. She eliminated the person who placed the order instead. The competitor paid double. She took both payments.',
        'Ran security for a Referent summit where every attendee had a kill order on someone else in the room. Nobody died. She considers it her finest work.',
      ],
    },
  },

  fixer: {
    fac_signal: {
      common: [
        'Signal relay operator who overheard too many deals. Started brokering her own on the side. Got caught. Got promoted. The boss liked the initiative.',
        'Ran a Signal comms booth in a border district. Knew every frequency and every operator on them. Still has the numbers. They still answer.',
      ],
      rare: [
        'Brokered the Signal-Grammaton ceasefire of 74. Nobody knows her name. The ceasefire held for eighteen months. She considers that a product demo.',
        'Signal intelligence handler running a network of twelve informants. One was a double. She turned the double into a triple. The original handler still doesnt know.',
      ],
      legendary: [
        'Arranged the defection of a Grammaton logistics chief mid-war. The chief brought seventeen cargo manifests. She sold them to three different buyers before the chief landed.',
        'Negotiated the Signal corridor treaty that everyone said was impossible. Two factions. One table. Forty-eight hours. She charged by the hour.',
      ],
    },
    fac_lexicon: {
      common: [
        'Lexicon procurement assistant who found cheaper suppliers for everything. Got fired when the suppliers turned out to be Lexicon itself. Got rehired as a consultant. Rate went up.',
        'Worked Lexicon diplomatic corps as a junior attache. Memorized every delegates drink order and leverage point. The drink orders proved more useful.',
      ],
      rare: [
        'Lexicon trade negotiator who secured three resource-sharing pacts in one quarter. The pacts were contradictory. Each side thinks she favored them. Each side is wrong.',
        'Managed Lexicon asset disposition for decommissioned facilities. Sold the same server farm twice. Both buyers are still operational. Neither knows.',
      ],
      legendary: [
        'Architected the Lexicon-Reconciliation Accord that ended a three-year data rights war. The accord is ninety pages. The real agreement fits on a napkin. She still has the napkin.',
        'Ran Lexicon black-site negotiations for five years. Never lost a concession. Never made an enemy who stayed one. Retired when she realized she could run the table herself.',
      ],
    },
    fac_grammaton: {
      common: [
        'Grammaton clerk who processed evidence for minor cases. Learned which evidence was valuable and to whom. Started a side business in pre-trial asset recovery.',
        'Paralegal for a Grammaton public defender. Watched guilty people walk and innocent people fall. Decided the difference was negotiable.',
      ],
      rare: [
        'Grammaton arbitration mediator. Settled three hundred disputes. Claimed a 92 percent resolution rate. The 8 percent kept her in business.',
        'Advisor to a Grammaton tribunal judge. Wrote opinions the judge signed. The judge was impeached. The opinions stood. She kept writing. Different judge.',
      ],
      legendary: [
        'Drafted the Grammaton Commercial Code amendments that legalized gray-market exchange in three sectors. The amendments passed unanimously. She lobbied both sides.',
        'Grammaton offered her a judgeship. She counter-offered with a consulting rate. They paid. She consults. The judges still call her for rulings.',
      ],
    },
    fac_static: {
      common: [
        'Static zone trader who moved goods through contested checkpoints. Knew which guards took bribes and which took bullets. The list changed weekly. She updated it daily.',
        'Ran a Static market stall selling black-market comms gear. The gear was stolen. The buyers were the original owners. She charged a finders fee.',
      ],
      rare: [
        'Negotiated supply lines for three Static cells during the corridor war. Kept all three supplied while they were shooting at each other. They still dont know.',
        'Brokered the exchange of a Static prisoner for a Grammaton data cache. The prisoner was dead. She kept him alive on paper for six weeks until the cache was verified.',
      ],
      legendary: [
        'Ran the Static underground railroad that moved three hundred people out of contested zones. Charged what they could pay. Kept records on who couldnt. Collected later. Everyone paid.',
        'Static council tried to replace her as chief negotiator. She negotiated her own replacement. Negotiated herself back a month later at triple the rate.',
      ],
    },
    fac_undertow: {
      common: [
        'Undertow fence who moved stolen chrome through a network of dive bars. The bars changed ownership. She didnt. The new owners learned to work with her.',
        'Runs a black-market pharmacy out of an Undertow freight depot. Knows which pills are placebos and which are poison. The customers trust her. The suppliers fear her.',
      ],
      rare: [
        'Undertow contraband broker. Moved weapons, data, and people through twelve checkpoints. Got caught once. The arresting officer retired the next day. Full pension.',
        'Managed Undertow grey-market tariffs for three years. Every shipment paid a fee. Nobody knew where the fees went. She did. They went exactly where they needed to.',
      ],
      legendary: [
        'Organized the Undertow shadow market that supplies half the city with off-grid medical supplies. Three corps tried to shut her down. She bought stock in all three.',
        'Undertow council meets in her basement. Nobody knows this. She bills the council for the space through three shell companies. They pay. On time.',
      ],
    },
    fac_referent: {
      common: [
        'Referent exchange floor runner. Carried trade slips before everything went digital. Knows every trader by their tells. Still gets calls when machines freeze.',
        'Junior analyst at a Referent investment house. Spotted a trend. Bet her salary. Won. Quit the same day. Now she bets other peoples money.',
      ],
      rare: [
        'Referent commodities broker. Cornered the market on medical-grade palladium for six hours. Sold her position to a hospital chain at cost. The short sellers never recovered.',
        'Managed Referent escrow for three years. Handled more money than the city budget. Took her cut. The cut was contractual. The contract was thirty-seven pages of fine print.',
      ],
      legendary: [
        'Referent clearinghouse director who rebuilt the settlement system after the crash of 77. The system hasnt failed since. She charges a stability fee. Nobody argues.',
        'Retired at thirty-two after a single decade-long Referent arbitrage play. The play was legal. Barely. The legal team that reviewed it now works for her.',
      ],
    },
  },

  ghost: {
    fac_signal: {
      common: [
        'Signal surveillance tech who watched too many people disappear. Learned how they did it. Practiced on herself. Still watching. Nobody watching back.',
        'Ran Signal signal-intercept for a mid-level operator. Learned to listen without being heard. The operator got caught. She didnt. The operator never knew she was there.',
      ],
      rare: [
        'Signal deep-cover operative placed inside a Grammaton logistics division. Extraction was compromised. She extracted herself. Popped up two years later with a different face.',
        'Eraser for Signal counter-intelligence. Removed sixteen operatives from dangerous situations. Removed three more from existence. The distinction is classified.',
      ],
      legendary: [
        'Signal has no record of her. The absence is deliberate. Three database queries for her name trigger internal alerts. Two of the alerts route to her.',
        'Infiltrated the Referent exchange mainframe through a janitorial access card and a year of patience. Extracted trade algorithms worth more than the GDP of three sectors. Left a note: found the leak.',
      ],
    },
    fac_lexicon: {
      common: [
        'Lexicon records clerk who perfected the art of being forgettable. Deleted files. Deleted herself from the deleted-file logs. Still has admin access. Nobody noticed.',
        'Worked Lexicon data disposal. Burned classified records. Memorized the best ones. The memorization is illegal. Proving it is impossible.',
      ],
      rare: [
        'Lexicon archivist who discovered a hidden index of erased persons. Added herself to it. Removed herself. The adding and removing left a gap. The gap is a monument.',
        'Assigned to Lexicon data-sanitization for a war-crimes tribunal. Sanitized the wrong side. The tribunal collapsed. The evidence she kept is in a dead-drop nobody has found.',
      ],
      legendary: [
        'Lexicon internal affairs opened a file on her. The file was empty. They opened another. Also empty. After the seventh empty file, they stopped opening files.',
        'Ghost-wrote the Lexicon erasure protocols. The protocols are designed to remove a person from all records. She tested them on herself. They work.',
      ],
    },
    fac_grammaton: {
      common: [
        'Grammaton witness protection custodian. Saw too many protected witnesses become unprotected. Started providing her own protection. Started charging for it.',
        'Court recorder for Grammaton tribunals. Transcribed confessions. Noticed the confessions didnt match the verdicts. Kept copies. The copies keep her employed.',
      ],
      rare: [
        'Grammaton black-site interrogator. Extracted information professionally. One subject told her something about herself she didnt know. She walked out mid-shift. The subject walked out behind her.',
        'Assigned to Grammaton evidence disposal for capital cases. Some evidence is too dangerous to destroy. Some evidence is too dangerous to keep. She knows which is which.',
      ],
      legendary: [
        'Grammaton sealed her own case file. The case involved a judge, three senators, and a weapons shipment that never existed. The file is still sealed. She is still free.',
        'Served as Grammaton ghost auditor, the person who investigates the investigators. Found corruption at the highest levels. Filed one report. The report is the reason corruption moved to the second-highest levels.',
      ],
    },
    fac_static: {
      common: [
        'Static zone courier who learned to move through no-mans-land without being seen. The routes change daily. She changes faster.',
        'Worked Static border watch. Spotted infiltrators by the way they walked. Never fired a shot. Never needed to. The infiltrators just never came back.',
      ],
      rare: [
        'Static sniper whose spotter never saw her targets before they dropped. She worked alone after the first month. The kills are still officially unattributed.',
        'Ran Static black recon through Grammaton forward positions. Mapped artillery emplacements by sound alone. The map was accurate to within three meters. Nobody knows how.',
      ],
      legendary: [
        'Static has a kill order with her name on it. Static also has a protection detail assigned to her. The two orders were signed on the same day by different people. Neither knows about the other.',
        'Walked into a Static command bunker during an active assault. Delivered a message. Walked out. The assault stopped twenty minutes later. She never said what the message was.',
      ],
    },
    fac_undertow: {
      common: [
        'Undertow dive bar regular who listens more than she drinks. Knows every secret in three districts. Tells none of them. Sells the ones that matter.',
        'Undertow corpse disposal. Made bodies vanish for people who needed vanishing. Started vanishing living people too. The living pay better. The dead dont complain.',
      ],
      rare: [
        'Undertow exit specialist. Extracted seventeen people from situations where extraction was impossible. The eighteenth was a setup. She extracted herself. The setup is still waiting.',
        'Undertow information broker who never meets clients. Messages arrive. Answers return. The system is untraceable because she built it on top of three other untraceable systems.',
      ],
      legendary: [
        'Nobody knows their real name. Three governments want them dead. Joined your crew because they were passing through and got curious.',
        'Undertow legends mention a ghost who can walk through walls. The walls are firewalls. The ghost is real. She wrote the legends to throw off the trail.',
      ],
    },
    fac_referent: {
      common: [
        'Referent compliance officer who traced illicit transactions. Traced one to her own supervisor. The supervisor disappeared. She took the supervisors office. Keeps the trace on her desk.',
        'Referent accounting ghost. Her name is on no payroll. Her work appears on every balance sheet. She prefers it that way. The accountants call her the balancing error.',
      ],
      rare: [
        'Froze and seized assets for a Referent enforcement division. Seized a databank that belonged to a Lexicon director. The seizure wasnt authorized. The promotion was.',
        'Built the Referent anonymous escrow protocol that enables untraceable transactions. The protocol is banned. The ban increased usage by 400 percent.',
      ],
      legendary: [
        'Referent once calculated her net worth. The number caused three trading algorithms to crash. She shorted the algorithms before running the calculation.',
        'Controls a portfolio of seventeen shell companies that own each other in a loop. The loop generates a dividend that doesnt exist from revenue that never happened. Perfectly legal.',
      ],
    },
  },

  chrome_doc: {
    fac_signal: {
      common: [
        'Signal field medic during the corridor skirmishes. Patched up soldiers on both sides. Kept a tally. The tally was even. She considers that her finest achievement.',
        'Ran a Signal-funded community clinic in a border district. The funding stopped. The clinic stayed open. She stopped asking where the supplies came from.',
      ],
      rare: [
        'Signal medical researcher developing neural-interference countermeasures. Her prototype worked too well. The military classified it. She kept the notes.',
        'Trauma surgeon for Signal rapid response. Operated in active combat zones with artillery shaking the table. Only lost three patients. The number haunts her.',
      ],
      legendary: [
        'Signal medical division chief during the corridor war. Treated more enemy wounded than her own. After the war, the enemy sent her a medal. She wears it. Signal pretends not to notice.',
        'Developed a battlefield triage algorithm that saved an estimated four hundred lives. The algorithm determined who lived and who died. She still dreams in triage tags.',
      ],
    },
    fac_lexicon: {
      common: [
        'Lexicon med-tech who serviced neural link installations. Noticed the links had undocumented monitoring subroutines. Noticed quietly. Disabled them more quietly.',
        'Worked Lexicon pharmaceutical testing. Documented side effects the reports omitted. The documentation is in a locked file. The key is her heartbeat.',
      ],
      rare: [
        'Lexicon bio-augmentation surgeon. Designed chrome that interfaced with the nervous system. The chrome was for soldiers. She used the same tech to restore nerve function in civilians. The soldiers didnt know.',
        'Ran Lexicon cyberware compatibility trials. Approved twelve implants. Rejected forty. The forty were designed by Lexicon executives with no medical training. The rejections made her enemies.',
      ],
      legendary: [
        'Authored the Lexicon Bio-Ethical Charter that bans certain classes of neural modification. The charter passed because she demonstrated each banned mod on herself first.',
        'Lexicon offered her a directorship in bio-medical research. She accepted. Resigned the same day. The resignation letter was a treatise on corporate medical ethics. It is now taught in Lexicon academies.',
      ],
    },
    fac_grammaton: {
      common: [
        'Grammaton prison medic. Treated inmates and guards with equal indifference. The inmates respected her. The guards feared her. She preferred the inmates.',
        'Grammaton coroner assistant. Autopsied three hundred bodies. Learned cause of death was rarely what the report said. Kept a private ledger. The ledger has more entries than the official records.',
      ],
      rare: [
        'Grammaton forensic surgeon. Reconstructed crime scenes from bone and tissue. Testified in forty-three trials. Changed her testimony in three. The three were where the evidence lied.',
        'Medical examiner for Grammaton capital cases. Declared death in forty executions. Refused to declare in one. The one is why she no longer works for Grammaton.',
      ],
      legendary: [
        'Grammaton court-certified medical expert. Her testimony has decided eighty-seven cases. She has never been cross-examined successfully. The prosecution stopped trying six years ago.',
        'Performed an autopsy on a Grammaton judge who died under suspicious circumstances. Ruled natural causes. The ruling is the only lie she has ever told professionally.',
      ],
    },
    fac_static: {
      common: [
        'Static field surgeon. Operates in basements and bomb shelters. Sterilization is aspirational. Survival is mandatory. Her patients survive at a rate that defies the conditions.',
        'Runs a Static underground clinic that treats anyone who makes it to the door. Payment is optional. The optional payments somehow cover costs. She doesnt ask how.',
      ],
      rare: [
        'Static combat medic who carried wounded fighters through three kilometers of crossfire. Received no medal. Received sixteen letters from people who are alive because of her.',
        'Developed a field-expedient chrome repair kit from scavenged parts. The kit works on thirty-seven models of combat chrome. Corps tried to buy the design. She published it for free.',
      ],
      legendary: [
        'Static medical corps director. Organized field hospitals during the corridor siege. Treated two thousand casualties in seventeen days. Slept four hours. Lost count of the saved.',
        'Invented a surgical technique that allows chrome integration with 60 percent less rejection. Refused to patent it. Taught it to every Static medic who asked. The technique is now standard.',
      ],
    },
    fac_undertow: {
      common: [
        'Undertow back-alley surgeon. Installs chrome that fell off a truck. The chrome works. The installation is clean. The paperwork does not exist.',
        'Worked Undertow body shop reassembling people who got on the wrong side of the wrong people. Learned to identify caliber by entry wound. The knowledge is less useful than she hoped.',
      ],
      rare: [
        'Undertow ripper doc who specialized in emergency extraction of compromised chrome. Saved forty-three patients from having their own limbs kill them. The chrome manufacturers deny the problem exists.',
        'Ran an Undertow clinic that traded medical care for information. The information was worth more than the care. She used it to buy better equipment. The spiral continues.',
      ],
      legendary: [
        'Undertow medical legend who can rebuild a person from 40 percent original parts. The remaining 60 percent is better than the original. The patients pay in favors. She has a lot of favors.',
        'Performed the first successful full-spinal chrome replacement in Undertow history. The procedure took fourteen hours. The patient walked out on day three. The medical establishment called it impossible.',
      ],
    },
    fac_referent: {
      common: [
        'Referent insurance medical examiner. Denied claims for a living. Started approving the ones where the patient would die otherwise. Got fired. The patients she approved are still alive.',
        'Referent pharma sales rep who pushed drugs she didnt believe in. Quit when she read the contraindications on her best-seller. Now she prescribes. Doesnt sell.',
      ],
      rare: [
        'Referent medical pricing analyst. Determined how much a life costs across six districts. The variability was criminal. The criminals were her employers. She documented everything.',
        'Ran a Referent-funded clinical trial for a neural-enhancement drug. The drug worked. The side effects were unacceptable. She buried the successful results with the dead patients.',
      ],
      legendary: [
        'Referent offered her a medical directorship with a seven-figure budget. She demanded the budget be spent on free clinics. They agreed. She audited the spending personally. The clinics are still open.',
        'Built a network of forty clinics across five districts funded by Referent trade taxes. The taxes are voluntary. She collects them in person. Nobody declines.',
      ],
    },
  },
};

// ── Picker helpers ────────────────────────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick a random trait for the given quality tier.
 * Falls back to common pool if quality is unrecognized.
 */
export function pickTrait(quality) {
  const pool = TRAIT_POOLS[quality] ?? TRAIT_POOLS.common;
  return pickRandom(pool);
}

/**
 * Pick a random voice line for the given class and faction.
 * Falls back through faction-agnostic lines if no match, then to generic.
 */
export function pickVoiceLine(cls, faction) {
  const classLines = VOICE_LINES[cls];
  if (classLines && classLines[faction] && classLines[faction].length) {
    return pickRandom(classLines[faction]);
  }
  // Fallback: any faction in the same class
  if (classLines) {
    const anyFaction = Object.values(classLines).find((lines) => lines.length);
    if (anyFaction) return pickRandom(anyFaction);
  }
  return 'Here for the credits.';
}

/**
 * Pick a random backstory for the given class, faction, and quality tier.
 * Falls back through broader pools when a specific combination is missing.
 */
export function pickBackstory(cls, faction, quality) {
  const byClass = BACKSTORIES[cls];
  if (byClass) {
    const byFaction = byClass[faction];
    if (byFaction) {
      const pool = byFaction[quality];
      if (pool && pool.length) return pickRandom(pool);
      // Fallback: any quality in same faction
      const anyPool = Object.values(byFaction).find((p) => p.length);
      if (anyPool) return pickRandom(anyPool);
    }
    // Fallback: any faction in same class
    for (const fac of Object.values(byClass)) {
      const anyPool = Object.values(fac).find((p) => p.length);
      if (anyPool) return pickRandom(anyPool);
    }
  }
  return 'Not much to tell. The streets raised them. The streets still call.';
}

export { TRAIT_POOLS, VOICE_LINES, BACKSTORIES };
