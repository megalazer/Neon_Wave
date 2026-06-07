import { colors } from '../theme/colors';

export const QUALITY_CONFIG = {
  common: {
    label: 'COMMON',
    color: colors.outline,
    statRange: { min: 5, max: 10 },
    vitalsRange: { min: 60, max: 90 },
    neuralRange: { min: 40, max: 70 },
    humanityBase: 80,
    costRange: { min: 3000, max: 8000 },
    startingCyberware: [],
    maxCyberwareSlots: 6,
    arrivalNarrations: [
      "A contact vouched for them. No history, no rep. That's usually fine.",
      'Drifter from the outskirts. Available, hungry for work.',
      'The net threw them up. Decent base stats. No red flags yet.',
      "You've seen worse. Baseline operative, nothing flashy.",
    ],
  },
  rare: {
    label: 'RARE',
    color: colors.secondaryContainer,
    statRange: { min: 9, max: 15 },
    vitalsRange: { min: 85, max: 125 },
    neuralRange: { min: 65, max: 105 },
    humanityBase: 80,
    costRange: { min: 12000, max: 22000 },
    startingCyberware: [
      ['cyb_kiroshi_optic_v3'],
      ['cyb_skill_chip_crawl'],
      ['cyb_bio_monitor_x10'],
      ['cyb_reflex_booster'],
      ['cyb_kiroshi_optic_v3', 'cyb_skill_chip_crawl'],
    ],
    maxCyberwareSlots: 7,
    arrivalNarrations: [
      'Rep checks out. Somebody trained them right.',
      'Ex-corporate, went freelance six months ago. Still sharp.',
      'Street legend. Locally. Capable. Might surprise you.',
      'Professional. Clean record. Costs more for a reason.',
    ],
  },
  legendary: {
    label: 'LEGENDARY',
    color: '#ffb400',
    statRange: { min: 13, max: 18 },
    vitalsRange: { min: 120, max: 165 },
    neuralRange: { min: 100, max: 145 },
    humanityBase: 80,
    costRange: { min: 28000, max: 55000 },
    startingCyberware: [
      ['cyb_neural_link_mk4', 'cyb_reflex_booster'],
      ['cyb_gorilla_arms_v1', 'cyb_kiroshi_optic_v3'],
      ['cyb_sandevistan_apex', 'cyb_skill_chip_crawl'],
      ['cyb_mantis_blades', 'cyb_reflex_booster'],
      ['cyb_neural_link_mk4', 'cyb_gorilla_arms_v1', 'cyb_bio_monitor_x10'],
    ],
    maxCyberwareSlots: 8,
    arrivalNarrations: [
      "Names like this don't show up in open pools. Favor called in.",
      "You've heard of them. Everyone has.",
      'Militech tried to recruit them twice. Both times they said no.',
      "One job together and you'll understand the price.",
    ],
  },
};

export function getSpawnWeights(contractsCompleted) {
  if (contractsCompleted >= 20) return { common: 25, rare: 50, legendary: 25 };
  if (contractsCompleted >= 15) return { common: 40, rare: 45, legendary: 15 };
  if (contractsCompleted >= 10) return { common: 55, rare: 38, legendary: 7 };
  if (contractsCompleted >= 5)  return { common: 72, rare: 26, legendary: 2 };
  return { common: 90, rare: 10, legendary: 0 };
}

export function rollQuality(contractsCompleted) {
  const w = getSpawnWeights(contractsCompleted);
  const total = w.common + w.rare + w.legendary;
  const roll = Math.random() * total;
  if (roll < w.common) return 'common';
  if (roll < w.common + w.rare) return 'rare';
  return 'legendary';
}
