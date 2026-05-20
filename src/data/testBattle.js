export const TEST_FRIENDLY_UNITS = [
  { id: 'unit_cipher',  name: 'Cipher',  class: 'netrunner',     level: 24, hp: { current: 85,  max: 100 } },
  { id: 'unit_ronin',   name: 'Ronin_X', class: 'street_samurai', level: 30, hp: { current: 100, max: 100 } },
  { id: 'unit_vex',     name: 'Vex',     class: 'fixer',         level: 22, hp: { current: 62,  max: 100 } },
  { id: 'unit_lyra',    name: 'Lyra',    class: 'chrome_doc',    level: 28, hp: { current: 45,  max: 100 } },
];

export const TEST_HOSTILE_UNITS = [
  { id: 'enemy_enforcer', name: 'Enforcer',  threat: 'HIGH_TRT', hp: { current: 100, max: 100 } },
  { id: 'enemy_droid',    name: 'Droid_X9',  threat: 'MED_TRT',  hp: { current: 72,  max: 100 } },
  { id: 'enemy_netrun',   name: 'Net_Run',   threat: 'EX_TRT',   hp: { current: 30,  max: 100 } },
];

export const TEST_BATTLE_CONFIG = {
  diceCount: 4,
  diceSides: 10,
  startingCyberPool: 7,
  maxCyberPool: 10,
};
