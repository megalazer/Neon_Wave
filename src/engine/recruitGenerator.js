import { QUALITY_CONFIG, rollQuality } from '../data/recruitQuality';
import { pickRandomName, pickRandomHandle, RECRUIT_CLASSES } from '../data/recruitNames';
import { CYBERWARE_ITEMS } from '../data/cyberware';
import { getClassProfile } from '../data/classProfiles';
import { generateNetrunnerQuickhacks } from '../data/quickhacks';
import { pickTrait, pickVoiceLine, pickBackstory } from '../data/recruitTraits';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Each class leans toward a couple of canonical factions by flavor/identity.
const CLASS_FACTION_AFFINITY = {
  netrunner:      ['fac_signal', 'fac_lexicon'],
  street_samurai: ['fac_grammaton', 'fac_static'],
  fixer:          ['fac_undertow', 'fac_referent'],
  ghost:          ['fac_undertow', 'fac_signal'],
  chrome_doc:     ['fac_lexicon', 'fac_referent'],
};

// Pick a faction from the class affinity list, weighted slightly toward factions
// the player has high rep with (a soft nudge, never a hard gate).
function pickFactionForClass(cls, factionRep) {
  const pool = CLASS_FACTION_AFFINITY[cls] || ['fac_undertow'];
  if (!factionRep) return pickRandom(pool);
  // Weight = base 10 + max(0, rep) so allied factions surface more of their people.
  const weights = pool.map((fid) => 10 + Math.max(0, factionRep[fid] ?? 0));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// Bias a single stat roll by the stat's role in the class profile.
function rollStatForClass(stat, profile, min, max) {
  const range = max - min;
  if (profile.primary.includes(stat))   return randInt(min + Math.floor(range * 0.6), max);
  if (profile.secondary.includes(stat)) return randInt(min + Math.floor(range * 0.4), max);
  if (profile.dump.includes(stat))      return randInt(min, min + Math.floor(range * 0.4));
  return randInt(min, max);
}

export function generateRecruit(contractsCompleted, currentTurn, qualityOverride, classOverride, factionRep = null) {
  const quality = qualityOverride || rollQuality(contractsCompleted);
  const cfg     = QUALITY_CONFIG[quality];
  const cls     = classOverride || pickRandom(RECRUIT_CLASSES);
  const profile = getClassProfile(cls);
  const faction = pickFactionForClass(cls, factionRep);

  // Stats: quality sets the numeric range; class shapes which stats land high/low.
  const { min, max } = cfg.statRange;
  const stats = {
    chrome: rollStatForClass('chrome', profile, min, max),
    edge:   rollStatForClass('edge',   profile, min, max),
    ghost:  rollStatForClass('ghost',  profile, min, max),
    face:   rollStatForClass('face',   profile, min, max),
    grit:   rollStatForClass('grit',   profile, min, max),
    wire:   rollStatForClass('wire',   profile, min, max),
  };

  // Vitals/neural: quality range, then apply class modifier.
  const vitalsMax = Math.max(1, Math.round(
    randInt(cfg.vitalsRange.min, cfg.vitalsRange.max) * (1 + profile.vitalsMod),
  ));
  const neuralMax = Math.max(1, Math.round(
    randInt(cfg.neuralRange.min, cfg.neuralRange.max) * (1 + profile.neuralMod),
  ));

  // Cyberware: filter each quality loadout to items in the class preference;
  // pick from the filtered set. Fall back to unfiltered if all loadouts empty out.
  const cwPool = cfg.startingCyberware || [];
  let equippedCyberware = [];
  if (cwPool.length > 0) {
    const pref = profile.cyberwarePreference;
    const filtered = cwPool
      .map((loadout) => loadout.filter((id) => pref.includes(id)))
      .filter((loadout) => loadout.length > 0);
    equippedCyberware = [...(filtered.length > 0 ? pickRandom(filtered) : pickRandom(cwPool))];
  }

  let humanityDeduction = 0;
  for (const cwId of equippedCyberware) {
    const cw = CYBERWARE_ITEMS.find((c) => c.id === cwId);
    if (cw) humanityDeduction += cw.humanityCost;
  }

  const humanityMax = cfg.humanityBase;
  const cost = Math.round(randInt(cfg.costRange.min, cfg.costRange.max) / 500) * 500;

  return {
    id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name:   pickRandomName(quality),
    handle: pickRandomHandle(quality),
    class:  cls,
    faction,
    quality,
    cost,
    exp:   0,
    level: 1,
    alive: true,
    vitals:   { current: vitalsMax, max: vitalsMax },
    neural:   { current: neuralMax, max: neuralMax },
    humanity: { current: Math.max(0, humanityMax - humanityDeduction), max: humanityMax },
    equippedCyberware,
    maxCyberwareSlots: cfg.maxCyberwareSlots,
    stats,
    quickhacks: cls === 'netrunner' ? generateNetrunnerQuickhacks() : null,
    expiresAtTurn: currentTurn + 15,
    arrivalNarration: pickRandom(cfg.arrivalNarrations),
trait:     pickTrait(quality),
voiceLine: pickVoiceLine(cls, faction),
backstory: pickBackstory(cls, faction, quality),
  };
}
