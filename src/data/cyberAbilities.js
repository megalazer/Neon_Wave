export const CYBER_ABILITIES = {
  netrunner: {
    classId: 'netrunner',
    name: 'NETRUNNER_PROTOCOL',
    cyberCost: 1,
    icon: 'wifi-tethering',
    accent: 'primary',
    description: 'Pulse-hack a single target. Bypasses armor.',
    effect: { type: 'single_target_damage', damage: 15 },
  },

  street_samurai: {
    classId: 'street_samurai',
    name: 'OVERLOAD_STRIKE',
    cyberCost: 2,
    icon: 'bolt',
    accent: 'secondary',
    description: 'Burst-fire single target for heavy damage.',
    effect: { type: 'single_target_damage', damage: 30 },
  },

  fixer: {
    classId: 'fixer',
    name: 'SYSTEM_CRASH',
    cyberCost: 3,
    icon: 'security',
    accent: 'error',
    description: 'Cascading malware. Damages all hostile units.',
    effect: { type: 'aoe_damage', damage: 18 },
  },

  ghost: {
    classId: 'ghost',
    name: 'PHANTOM_GAMBIT',
    cyberCost: 2,
    icon: 'visibility-off',
    accent: 'secondary',
    description: 'Shroud the squad. Reduces incoming damage by 50% this round.',
    effect: { type: 'squad_buff', buffType: 'damage_reduction', value: 0.5, duration: 1 },
  },

  chrome_doc: {
    classId: 'chrome_doc',
    name: 'AUTO-MEDIC_BURST',
    cyberCost: 2,
    icon: 'healing',
    accent: 'tertiary',
    description: 'Stim-burst the squad. Heals all friendlies for 20.',
    effect: { type: 'squad_heal', amount: 20 },
  },
};

// Priority order for dock slot assignment (first 3 present classes fill the 3 slots)
export const CLASS_PRIORITY = [
  'netrunner',
  'street_samurai',
  'fixer',
  'ghost',
  'chrome_doc',
];
