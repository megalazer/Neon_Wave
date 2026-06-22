// Balance gate. Drives the REAL modules (generateEncounter, scaleEnemy, buildUnits,
// planEnemyTurn, ENCOUNTERS) + real leveling HP formulas against a faithful player
// model. Focus: early-game survivability across all 3 origins (incl. drained neural),
// plus the level/tier diagonal. Target: early game survivable, no full-wipe spirals.
import { generateEncounter, buildUnits } from '../src/engine/encounterGenerator.js';
import { planEnemyTurn } from '../src/engine/enemyTurn.js';
import { ENCOUNTERS } from '../src/data/encounters.js';
import { VITALITY_BASE, VITALITY_PER_GRIT_BASE, vitalityGainPerLevel } from '../src/data/leveling.js';
import { deriveStats } from '../src/data/origins.js';

const ABIL = {
  netrunner: { cost: 1, kind: 'nuke', dmg: 15 },
  street_samurai: { cost: 2, kind: 'nuke', dmg: 30 },
  fixer: { cost: 3, kind: 'aoe', dmg: 18 },
  ghost: { cost: 2, kind: 'reduce', value: 0.5 },
  chrome_doc: { cost: 2, kind: 'heal', amount: 20 },
};
const rollDie = () => { let v = 1 + Math.floor(Math.random() * 10); for (let r = 0; r < 2 && v < 6; r++) v = 1 + Math.floor(Math.random() * 10); return v; };
const liveE = (h) => h.filter((e) => e.hp.current > 0);
const liveF = (f) => f.filter((u) => u.hp.current > 0);
const pickE = (h) => { const l = liveE(h); if (!l.length) return null; const open = l.filter((e) => !(e.blockCharges > 0)); const p = open.length ? open : l; return p.reduce((a, b) => (b.hp.current < a.hp.current ? b : a)); };
const hitE = (h, d) => { const t = pickE(h); if (!t) return; if (t.blockCharges > 0) { t.blockCharges -= 1; return; } t.hp.current = Math.max(0, t.hp.current - d); };

// Real HP formulas
function playerHP(grit, level) {
  let hp = VITALITY_BASE + Math.round(grit * VITALITY_PER_GRIT_BASE);
  for (let l = 2; l <= level; l++) hp += vitalityGainPerLevel(grit);
  return hp;
}
function recruitHP(baseHP, grit, level) {
  let hp = baseHP;
  for (let l = 2; l <= level; l++) hp += vitalityGainPerLevel(grit);
  return hp;
}

function battle(party, hostile) {
  const friendly = party.map((m) => ({ id: m.id, class: m.class, isPlayer: !!m.isPlayer, neural: m.neural, hp: { current: m.hp, max: m.hp } }));
  for (const e of hostile) { e.rampStacks = e.rampStacks ?? 0; e.blockCharges = e.block && Math.random() < e.block.chance ? 1 : 0; }
  const startPool = Math.max(0, Math.min(10, Math.floor(friendly.reduce((s, m) => s + m.neural, 0) / 40)));
  let pool = startPool; const present = new Set(friendly.map((m) => m.class));
  let round = 1;
  while (round <= 20) {
    let reduce = false, heal = false;
    const minFrac = Math.min(...liveF(friendly).map((u) => u.hp.current / u.hp.max));
    for (const cls of ['chrome_doc', 'ghost', 'fixer', 'street_samurai', 'netrunner']) {
      if (!present.has(cls)) continue; const a = ABIL[cls]; if (pool < a.cost) continue;
      if (a.kind === 'heal') { if (minFrac < 0.5) { heal = true; pool -= a.cost; } }
      else if (a.kind === 'reduce') { if (liveE(hostile).length >= 1) { reduce = true; pool -= a.cost; } }
      else if (a.kind === 'aoe') { if (liveE(hostile).length >= 2) { for (const e of liveE(hostile)) { if (e.blockCharges > 0) { e.blockCharges -= 1; continue; } e.hp.current = Math.max(0, e.hp.current - a.dmg); } pool -= a.cost; } }
      else if (a.kind === 'nuke') { hitE(hostile, a.dmg); pool -= a.cost; }
    }
    if (heal) for (const u of liveF(friendly)) u.hp.current = Math.min(u.hp.max, u.hp.current + 20);
    for (const _ of liveF(friendly)) hitE(hostile, rollDie());
    if (liveE(hostile).length === 0) return { win: true, rounds: round, friendly };
    const { assignments, patches } = planEnemyTurn({ hostile, friendly, round });
    for (const eid of Object.keys(patches)) { const e = hostile.find((u) => u.id === eid); if (e) e.rampStacks = patches[eid].rampStacks; }
    const mult = reduce ? 0.5 : 1;
    for (const a of assignments) { const t = friendly.find((u) => u.id === a.targetId); if (!t || t.hp.current <= 0) continue; t.hp.current = Math.max(0, t.hp.current - Math.max(1, Math.round(a.damage * mult))); }
    if (liveF(friendly).length === 0) return { win: false, rounds: round, friendly };
    const pl = friendly.find((u) => u.isPlayer); if (pl && pl.hp.current <= 0) return { win: false, rounds: round, friendly };
    pool = Math.min(startPool, pool + 1);
    for (const e of hostile) if (e.hp.current > 0 && e.block) e.blockCharges = Math.random() < e.block.chance ? 1 : 0;
    round++;
  }
  return { win: false, rounds: 20, friendly, timeout: true };
}

const ORIG = {
  corpo:      { cls: 'fixer',          neural: 100 },
  street_kid: { cls: 'street_samurai', neural: 100 },
  nomad:      { cls: 'ghost',          neural: 100 },
};
const QUAL = { common: { hp: 75, neural: 55, grit: 8 }, rare: { hp: 105, neural: 85, grit: 12 } };
const mkPlayer = (origin, level, nf = 1) => { const o = ORIG[origin]; const stats = deriveStats(origin); return { id: 'player', isPlayer: true, class: o.cls, hp: playerHP(stats.grit, level), neural: Math.round(o.neural * nf) }; };
const mkRec = (id, cls, q, level, nf = 1) => { const Q = QUAL[q]; return { id, class: cls, hp: recruitHP(Q.hp, Q.grit, level), neural: Math.round(Q.neural * nf) }; };

const CELLS = [
  ['L1 corpo(fix) rested',  [mkPlayer('corpo', 1)],            'LOW', 1],
  ['L1 corpo(fix) DRAINED', [mkPlayer('corpo', 1, 0.3)],       'LOW', 1],
  ['L1 street(sam) rested', [mkPlayer('street_kid', 1)],       'LOW', 1],
  ['L1 nomad(gho) rested',  [mkPlayer('nomad', 1)],            'LOW', 1],
  ['L1 nomad(gho) DRAINED', [mkPlayer('nomad', 1, 0.3)],       'LOW', 1],
  ['L2 corpo solo',         [mkPlayer('corpo', 2)],            'LOW', 2],
  ['L3 corpo+net',          [mkPlayer('corpo', 3), mkRec('r1', 'netrunner', 'common', 3)], 'LOW', 3],
  ['L5 MID mixed',          [mkPlayer('street_kid', 5), mkRec('r1', 'netrunner', 'rare', 5), mkRec('r2', 'fixer', 'common', 5)], 'MID', 5],
  ['L8 HIGH fac_referent',  [mkPlayer('street_kid', 8), mkRec('r1', 'netrunner', 'rare', 8), mkRec('r2', 'fixer', 'rare', 8), mkRec('r3', 'chrome_doc', 'common', 8)], 'HIGH', 8, false, 'fac_referent'],
  ['L10 HIGH mixed',        [mkPlayer('street_kid', 10), mkRec('r1', 'netrunner', 'rare', 10), mkRec('r2', 'fixer', 'rare', 10), mkRec('r3', 'chrome_doc', 'rare', 10)], 'HIGH', 10],
  ['L10 HIGH fac_grammaton',[mkPlayer('street_kid', 10), mkRec('r1', 'netrunner', 'rare', 10), mkRec('r2', 'fixer', 'rare', 10), mkRec('r3', 'chrome_doc', 'rare', 10)], 'HIGH', 10, false, 'fac_grammaton'],
  ['L10 BOSS',              [mkPlayer('street_kid', 10), mkRec('r1', 'netrunner', 'rare', 10), mkRec('r2', 'fixer', 'rare', 10), mkRec('r3', 'chrome_doc', 'rare', 10)], 'HIGH', 10, 'boss'],
];
const N = 5000;

console.log('cell                    partyHP  win%  rounds  hpLost%');
for (const [label, party, tier, lvl, boss, faction = null] of CELLS) {
  let wins = 0, rs = 0, hl = 0, hn = 0;
  for (let i = 0; i < N; i++) {
    const hostile = boss ? buildUnits(ENCOUNTERS.enc_cyberpsycho.enemies, lvl) : generateEncounter({ faction, tier, partyLevel: lvl }).enemies;
    const r = battle(party, hostile);
    if (r.win) { wins++; rs += r.rounds; const mx = r.friendly.reduce((s, u) => s + u.hp.max, 0); const cu = r.friendly.reduce((s, u) => s + Math.max(0, u.hp.current), 0); hl += 1 - cu / mx; hn++; }
  }
  const partyHP = party.reduce((s, m) => s + m.hp, 0);
  console.log(`${label.padEnd(22)}  ${String(partyHP).padStart(5)}  ${(wins / N * 100).toFixed(0).padStart(3)}   ${(wins ? rs / wins : 0).toFixed(1).padStart(4)}    ${(hn ? hl / hn * 100 : 0).toFixed(0).padStart(4)}`);
}
