export const CLASS_PROFILES = {
  netrunner: {
    primary:   ['wire', 'edge'],
    secondary: ['ghost'],
    dump:      ['chrome', 'grit'],
    vitalsMod: -0.10,
    neuralMod:  0.20,
    cyberwarePreference: [
      'cyb_neural_link_mk4', 'cyb_kiroshi_optic_v3', 'cyb_reflex_booster',
      'starter_neural_link', 'starter_optic_basic',
    ],
  },
  street_samurai: {
    primary:   ['chrome', 'edge'],
    secondary: ['grit'],
    dump:      ['wire', 'face'],
    vitalsMod:  0.20,
    neuralMod: -0.10,
    cyberwarePreference: [
      'cyb_gorilla_arms_v1', 'cyb_mantis_blades', 'cyb_sandevistan_apex',
      'cyb_reflex_booster', 'starter_subdermal',
    ],
  },
  fixer: {
    primary:   ['face', 'ghost'],
    secondary: ['edge'],
    dump:      ['chrome', 'wire'],
    vitalsMod:  0,
    neuralMod:  0,
    cyberwarePreference: [
      'cyb_kiroshi_optic_v3', 'cyb_skill_chip_crawl', 'starter_optic_basic',
    ],
  },
  ghost: {
    primary:   ['ghost', 'edge'],
    secondary: ['wire'],
    dump:      ['chrome', 'face'],
    vitalsMod: -0.05,
    neuralMod:  0.05,
    cyberwarePreference: [
      'cyb_kiroshi_optic_v3', 'cyb_skill_chip_crawl', 'cyb_reflex_booster',
      'starter_optic_basic',
    ],
  },
  chrome_doc: {
    primary:   ['wire', 'grit'],
    secondary: ['face'],
    dump:      ['chrome', 'edge'],
    vitalsMod:  0.10,
    neuralMod:  0.10,
    cyberwarePreference: [
      'cyb_bio_monitor_x10', 'cyb_neural_link_mk4', 'starter_neural_link',
    ],
  },
};

export function getClassProfile(cls) {
  return CLASS_PROFILES[cls] ?? CLASS_PROFILES.fixer;
}
