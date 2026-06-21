export const CYBERWARE_SLOTS = ['neural', 'optic', 'os', 'arms', 'internal', 'chip', 'subdermal'];

export const CYBERWARE_ITEMS = [
  {
    id: 'cyb_neural_link_mk4',
    name: 'Neural_Link_Mk4',
    slot: 'neural',
    icon: 'psychology',
    humanityCost: 8,
    bonuses: { edge: 2, wire: 3 },
    tags: ['WIFI: ENABLED'],
    description: '+EDGE +WIRE, integrated wireless interface',
    cost: 12000,
    vendorCategory: 'rotating',
    vendorTier: 'intermediate',
  },
  {
    id: 'cyb_kiroshi_optic_v3',
    name: 'Helix_Optic_v3',
    slot: 'optic',
    icon: 'visibility',
    humanityCost: 4,
    bonuses: { ghost: 4 },
    tags: ['SCANNER_V2'],
    description: '+GHOST, embedded scanner module',
    cost: 6500,
    vendorCategory: 'rotating',
    vendorTier: 'intermediate',
  },
  {
    id: 'cyb_sandevistan_apex',
    name: 'Slipstream_Apex',
    slot: 'os',
    icon: 'bolt',
    humanityCost: 15,
    bonuses: { edge: 11 },
    tags: ['OVERLOAD'],
    description: '+EDGE, time-dilation overdrive',
    cost: 24000,
    vendorCategory: 'rotating',
    vendorTier: 'elite',
    factionReq: { faction: 'fac_signal', tier: 'FRIENDLY' },
  },
  {
    id: 'cyb_bio_monitor_x10',
    name: 'Bio-Monitor_X10',
    slot: 'internal',
    icon: 'monitor-heart',
    humanityCost: 2,
    bonuses: { grit: 1 },
    tags: ['AUTO-MEDIC: ON'],
    description: '+GRIT, automated stim injection',
    cost: 3500,
    vendorCategory: 'staple',
    vendorTier: 'basic',
  },
  {
    id: 'cyb_gorilla_arms_v1',
    name: 'Piston_Arms_v1',
    slot: 'arms',
    icon: 'back-hand',
    humanityCost: 12,
    bonuses: { chrome: 3 },
    tags: ['CRUSH: 2d10'],
    description: '+CHROME, hydraulic crushing capability',
    cost: 9000,
    vendorCategory: 'rotating',
    vendorTier: 'elite',
    factionReq: { faction: 'fac_grammaton', tier: 'FRIENDLY' },
  },
  {
    id: 'cyb_skill_chip_crawl',
    name: 'Skill_Chip_Crawl',
    slot: 'chip',
    icon: 'memory',
    humanityCost: 0,
    bonuses: { ghost: 2 },
    tags: ['LEVEL: ELITE'],
    description: '+GHOST, embedded technique',
    cost: 4000,
    vendorCategory: 'staple',
    vendorTier: 'basic',
  },
  {
    id: 'cyb_reflex_booster',
    name: 'Reflex_Booster',
    slot: 'internal',
    icon: 'electric-bolt',
    humanityCost: 6,
    bonuses: { edge: 5 },
    tags: ['ALWAYS-ON'],
    description: '+EDGE, neural acceleration layer',
    cost: 8500,
    vendorCategory: 'rotating',
    vendorTier: 'intermediate',
  },
  {
    id: 'cyb_mantis_blades',
    name: 'Razor_Arms',
    slot: 'arms',
    icon: 'content-cut',
    humanityCost: 14,
    bonuses: { chrome: 2, edge: 1 },
    tags: ['BLEED: ACTIVE'],
    description: '+CHROME +EDGE, retractable mono-edge blades',
    cost: 15000,
    vendorCategory: 'rotating',
    vendorTier: 'elite',
    factionReq: { faction: 'fac_static', tier: 'FRIENDLY' },
  },
  {
    id: 'starter_neural_link',
    name: 'Neural_Link_Mk1',
    slot: 'neural',
    icon: 'psychology',
    humanityCost: 4,
    bonuses: { edge: 1 },
    tags: ['STARTER'],
    description: '+EDGE, basic neural interface',
    cost: 0,
    vendorCategory: 'staple',
    vendorTier: 'basic',
  },
  {
    id: 'starter_optic_basic',
    name: 'Helix_Optic_v1',
    slot: 'optic',
    icon: 'visibility',
    humanityCost: 3,
    bonuses: { ghost: 1 },
    tags: ['STARTER'],
    description: '+GHOST, low-light enhancement',
    cost: 0,
    vendorCategory: 'staple',
    vendorTier: 'basic',
  },
  {
    id: 'starter_subdermal',
    name: 'Subdermal_Plate_Mk1',
    slot: 'subdermal',
    icon: 'shield',
    humanityCost: 5,
    bonuses: { grit: 1 },
    tags: ['STARTER'],
    description: '+GRIT, light dermal armor weave',
    cost: 0,
    vendorCategory: 'staple',
    vendorTier: 'basic',
  },
];

export const CYBERWARE_BY_ID = CYBERWARE_ITEMS.reduce((map, item) => {
  map[item.id] = item;
  return map;
}, {});

export function getCyberwareBonuses(member) {
  const totals = {};
  for (const cyberwareId of member?.equippedCyberware || []) {
    const cyberware = CYBERWARE_BY_ID[cyberwareId];
    if (!cyberware?.bonuses) continue;
    for (const [stat, value] of Object.entries(cyberware.bonuses)) {
      totals[stat] = (totals[stat] || 0) + value;
    }
  }
  return totals;
}

export function getEffectiveStat(member, stat, fallback = 10) {
  const base = member?.stats?.[stat] ?? fallback;
  let cyberwareBonus = 0;
  for (const cyberwareId of member?.equippedCyberware || []) {
    cyberwareBonus += CYBERWARE_BY_ID[cyberwareId]?.bonuses?.[stat] || 0;
  }
  return Math.min(20, base + cyberwareBonus);
}

export function getEffectiveStats(member) {
  const bonuses = getCyberwareBonuses(member);
  const stats = {};
  for (const stat of new Set([
    ...Object.keys(member?.stats || {}),
    ...Object.keys(bonuses),
  ])) {
    stats[stat] = Math.min(20, (member?.stats?.[stat] || 0) + (bonuses[stat] || 0));
  }
  return stats;
}

export const STARTER_CYBERWARE = [
  {
    id: 'starter_neural_link',
    name: 'Neural_Link_Mk1',
    icon: 'psychology',
    slot: 'neural',
    humanityCost: 4,
    bonuses: { edge: 1 },
    description: '+EDGE +1, basic interface for net-running',
    flavor: 'Standard issue. Reliable, unflashy, gets the job done.',
  },
  {
    id: 'starter_optic_basic',
    name: 'Helix_Optic_v1',
    icon: 'visibility',
    slot: 'optic',
    humanityCost: 3,
    bonuses: { ghost: 1 },
    description: '+GHOST +1, low-light enhancement',
    flavor: "Eyes that work when the lights don't.",
  },
  {
    id: 'starter_subdermal',
    name: 'Subdermal_Plate_Mk1',
    icon: 'shield',
    slot: 'subdermal',
    humanityCost: 5,
    bonuses: { grit: 1 },
    description: '+GRIT +1, light dermal armor weave',
    flavor: "Won't stop a round, but it'll slow one down.",
  },
];
