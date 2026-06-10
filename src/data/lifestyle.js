export const MAX_REAL_ESTATE = 12;
export const MAX_VEHICLES = 20;

export const REAL_ESTATE = [
  {
    id: 're_skyline_apex',
    name: 'Skyline Apex Suite',
    listingId: '9942-X',
    description: 'Carbon-fiber floors, 360-degree skyline view.',
    cost: 5000000,
    icon: 'apartment',
    attributes: [
      { label: 'LUXURY_GRADE', value: 'S' },
      { label: 'SECURITY', value: 'MAX' },
      { label: 'NET_ISOLATION', value: '100%' },
    ],
    minigame: 'penthouse_party',
  },
  {
    id: 're_penthouse_noir',
    name: 'Penthouse Noir',
    listingId: '8800-N',
    description: 'Double-floor penthouse. Zero paper trail.',
    cost: 2800000,
    icon: 'business',
    attributes: [
      { label: 'LUXURY_GRADE', value: 'A' },
      { label: 'SECURITY', value: 'MAX' },
      { label: 'ANONYMITY', value: '100%' },
    ],
    minigame: 'shadow_deal',
  },
  {
    id: 're_industrial_loft',
    name: 'Industrial Data-Loft',
    listingId: '3311-G',
    description: 'Repurposed server-room. Off-grid access node.',
    cost: 320000,
    icon: 'warehouse',
    attributes: [
      { label: 'LUXURY_GRADE', value: 'B' },
      { label: 'SECURITY', value: 'HVY' },
      { label: 'NET_NODE', value: 'DARK' },
    ],
    minigame: 'hack_den',
  },
  {
    id: 're_kabuki_micro',
    name: 'Saltgate Micro-Loft',
    listingId: '2120-K',
    description: 'Cozy, high-security, near the neon district.',
    cost: 150000,
    icon: 'home',
    attributes: [
      { label: 'LUXURY_GRADE', value: 'C' },
      { label: 'SECURITY', value: 'MED' },
      { label: 'VIBE', value: 'NEON_CITY' },
    ],
    minigame: 'loft_decorate',
  },
];

export const VEHICLES = [
  {
    id: 'veh_rayfield_excalibur',
    name: 'Rayfield Excalibur',
    serial: 'EX-9000',
    description: 'The pinnacle of luxury aerodynes.',
    cost: 1200000,
    icon: 'flight',
    type: 'aerodyne',
    attributes: [
      { label: 'Speed', value: 100 },
      { label: 'Armor', value: 33 },
    ],
    minigame: 'aerial_chase',
  },
  {
    id: 'veh_caliburn_mk2',
    name: 'Caliburn Mk.2',
    serial: 'CAL-MK2',
    description: 'Street-legal track machine. Custom build.',
    cost: 450000,
    icon: 'directions-car',
    type: 'sports',
    attributes: [
      { label: 'Speed', value: 97 },
      { label: 'Handling', value: 88 },
    ],
    minigame: 'drag_race',
  },
  {
    id: 'veh_thor_colossus',
    name: 'Thor Colossus',
    serial: 'COLO-7',
    description: 'Armored cargo hauler. Runs anything, anywhere.',
    cost: 210000,
    icon: 'local-shipping',
    type: 'truck',
    attributes: [
      { label: 'Armor', value: 95 },
      { label: 'Speed', value: 40 },
    ],
    minigame: 'convoy_run',
  },
  {
    id: 'veh_kusanagi_ct3x',
    name: 'Kusanagi CT-3X',
    serial: 'CT-3X-RED',
    description: 'Fast, sleek, and dangerous.',
    cost: 85000,
    icon: 'two-wheeler',
    type: 'motorcycle',
    attributes: [
      { label: 'Handling', value: 90 },
      { label: 'Heat_Sign', value: 80 },
    ],
    minigame: 'street_race',
  },
];
