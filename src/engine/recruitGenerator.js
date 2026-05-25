import { QUALITY_CONFIG, rollQuality } from '../data/recruitQuality';
import { RECRUIT_NAMES, RECRUIT_HANDLES, RECRUIT_CLASSES } from '../data/recruitNames';
import { CYBERWARE_ITEMS } from '../data/cyberware';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRecruit(contractsCompleted, currentTurn, qualityOverride) {
  const quality = qualityOverride || rollQuality(contractsCompleted);
  const cfg = QUALITY_CONFIG[quality];

  const { min, max } = cfg.statRange;
  const stats = {
    chrome: randInt(min, max),
    edge:   randInt(min, max),
    ghost:  randInt(min, max),
    face:   randInt(min, max),
    grit:   randInt(min, max),
    wire:   randInt(min, max),
  };

  const vitalsMax = randInt(cfg.vitalsRange.min, cfg.vitalsRange.max);
  const neuralMax = randInt(cfg.neuralRange.min, cfg.neuralRange.max);

  // Pick a cyberware loadout from the quality pool (each entry is an array of IDs)
  const cwPool = cfg.startingCyberware;
  const equippedCyberware = cwPool.length > 0 ? [...pickRandom(cwPool)] : [];

  let humanityDeduction = 0;
  for (const cwId of equippedCyberware) {
    const cw = CYBERWARE_ITEMS.find((c) => c.id === cwId);
    if (cw) humanityDeduction += cw.humanityCost;
  }

  const humanityMax = cfg.humanityBase;
  const cost = Math.round(randInt(cfg.costRange.min, cfg.costRange.max) / 500) * 500;

  return {
    id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: pickRandom(RECRUIT_NAMES),
    handle: pickRandom(RECRUIT_HANDLES),
    class: pickRandom(RECRUIT_CLASSES),
    quality,
    cost,
    exp: 0,
    level: 1,
    vitals:  { current: vitalsMax, max: vitalsMax },
    neural:  { current: neuralMax, max: neuralMax },
    humanity: {
      current: Math.max(0, humanityMax - humanityDeduction),
      max: humanityMax,
    },
    equippedCyberware,
    maxCyberwareSlots: cfg.maxCyberwareSlots,
    stats,
    expiresAtTurn: currentTurn + 15,
    arrivalNarration: pickRandom(cfg.arrivalNarrations),
  };
}
