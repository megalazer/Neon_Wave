import { colors } from '../theme/colors';

export const FIXERS = [
  {
    id: 'remi',
    name: 'REMI',
    handle: 'REMI_VANCE',
    accent: 'primary',
    color: colors.primary,
    icon: 'person',
    bio: 'Freelance broker. Reliable. Neutral.',
  },
  {
    id: 'pyre',
    name: 'PYRE',
    handle: 'PYRE_9',
    accent: 'error',
    color: colors.error,
    icon: 'whatshot',
    bio: 'Weapons-hot specialty. Likes collateral.',
  },
  {
    id: 'nyx',
    name: 'NYX',
    handle: 'NYX_NULL',
    accent: 'secondary',
    color: colors.secondary,
    icon: 'visibility-off',
    bio: 'Ghost ops. Zero trace specialist.',
  },
  {
    id: 'kade',
    name: 'KADE',
    handle: 'KADE_SYNC',
    accent: 'tertiary',
    color: colors.tertiaryFixed,
    icon: 'security',
    bio: 'Corporate extraction. Pays well.',
  },
  {
    id: 'dusk',
    name: 'DUSK',
    handle: 'DUSK_7',
    accent: 'outline',
    color: colors.outline,
    icon: 'nightlight',
    bio: 'High-risk. High-reward. Fewer questions.',
  },
];

export function getFixer(id) {
  return FIXERS.find((f) => f.id === id) ?? FIXERS[0];
}
