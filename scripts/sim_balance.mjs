// Final balance gate. Drives the REAL modules (generateEncounter, scaleEnemy,
// buildUnits, planEnemyTurn, ENCOUNTERS) against a faithful player model.
// Target: matched fights 3-5 rounds (HIGH up to ~6), LOW/MID winnable, HIGH risky (~85-90%).
import { generateEncounter, buildUnits } from '../src/engine/encounterGenerator.js';
import { planEnemyTurn } from '../src/engine/enemyTurn.js';
import { ENCOUNTERS } from '../src/data/encounters.js';

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
      else if (a.kind === 'reduce') { if (liveE(hostile).length >= 2) { reduce = true; pool -= a.cost; } }
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

const PARTIES = {
  L1: [{ id: 'player', class: 'street_samurai', isPlayer: true, hp: 100, neural: 100 }],
  L3: [{ id: 'player', class: 'street_samurai', isPlayer: true, hp: 100, neural: 100 }, { id: 'r1', class: 'netrunner', hp: 75, neural: 55 }],
  L4: [{ id: 'player', class: 'street_samurai', isPlayer: true, hp: 100, neural: 100 }, { id: 'r1', class: 'netrunner', hp: 80, neural: 60 }, { id: 'r2', class: 'fixer', hp: 78, neural: 60 }],
  L5: [{ id: 'player', class: 'street_samurai', isPlayer: true, hp: 100, neural: 100 }, { id: 'r1', class: 'netrunner', hp: 95, neural: 80 }, { id: 'r2', class: 'fixer', hp: 90, neural: 75 }],
  L7: [{ id: 'player', class: 'street_samurai', isPlayer: true, hp: 100, neural: 100 }, { id: 'r1', class: 'netrunner', hp: 110, neural: 90 }, { id: 'r2', class: 'fixer', hp: 100, neural: 85 }, { id: 'r3', class: 'chrome_doc', hp: 80, neural: 60 }],
  L8: [{ id: 'player', class: 'street_samurai', isPlayer: true, hp: 100, neural: 100 }, { id: 'r1', class: 'netrunner', hp: 115, neural: 95 }, { id: 'r2', class: 'fixer', hp: 100, neural: 85 }, { id: 'r3', class: 'chrome_doc', hp: 90, neural: 70 }],
  L10: [{ id: 'player', class: 'street_samurai', isPlayer: true, hp: 100, neural: 100 }, { id: 'r1', class: 'netrunner', hp: 140, neural: 130 }, { id: 'r2', class: 'fixer', hp: 110, neural: 90 }, { id: 'r3', class: 'chrome_doc', hp: 105, neural: 100 }],
};
// [party, tier, factionOrNull, boss?]
const CELLS = [
  ['L1', 'LOW', null], ['L3', 'LOW', null],
  ['L4', 'MID', 'fac_grammaton'], ['L5', 'MID', null], ['L7', 'MID', 'fac_signal'],
  ['L8', 'HIGH', 'fac_referent'], ['L10', 'HIGH', null],
  ['L10', 'HIGH', 'boss'],
];
const LVL = { L1: 1, L3: 3, L4: 4, L5: 5, L7: 7, L8: 8, L10: 10 };
const N = 5000;

console.log('cell        tier   faction        win%  rounds  hpLost%  enemyCounts');
for (const [pl, tier, fac] of CELLS) {
  const lvl = LVL[pl];
  const boss = fac === 'boss';
  let wins = 0, rs = 0, hl = 0, hn = 0; const counts = {};
  for (let i = 0; i < N; i++) {
    const hostile = boss
      ? buildUnits(ENCOUNTERS.enc_cyberpsycho.enemies, lvl)
      : generateEncounter({ faction: boss ? null : fac, tier, partyLevel: lvl }).enemies;
    if (i < 500) counts[hostile.length] = (counts[hostile.length] || 0) + 1;
    const r = battle(PARTIES[pl], hostile);
    if (r.win) { wins++; rs += r.rounds; const mx = r.friendly.reduce((s, u) => s + u.hp.max, 0); const cu = r.friendly.reduce((s, u) => s + Math.max(0, u.hp.current), 0); hl += 1 - cu / mx; hn++; }
  }
  const label = `${pl}${boss ? '/boss' : ''}`.padEnd(10);
  const facL = (boss ? 'enc_cyberpsycho' : (fac || 'any')).padEnd(13);
  console.log(`${label}  ${tier.padEnd(5)} ${facL}  ${(wins / N * 100).toFixed(0).padStart(3)}   ${(wins ? rs / wins : 0).toFixed(1).padStart(4)}    ${(hn ? hl / hn * 100 : 0).toFixed(0).padStart(4)}    ${JSON.stringify(counts)}`);
}
