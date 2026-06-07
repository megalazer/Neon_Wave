// Pure enemy-turn planner: computes damage assignments for hostile units.
// No mutation of inputs; ramp progression is reported via `patches` only.

export const RAMP_STEP = 3; // extra damage per accumulated ramp stack
export const TELEGRAPH_PERIOD = 3; // telegraph enemies hit hard every Nth round
export const TELEGRAPH_MULT = 2; // telegraph damage multiplier on the big round

export function planEnemyTurn({ hostile, friendly, round, rng = Math.random }) {
  const livingFriendly = friendly.filter((u) => u.hp.current > 0);
  if (livingFriendly.length === 0) {
    return { assignments: [], patches: {} };
  }

  const assignments = [];
  const patches = {};
  let idx = 0;
  let playerClaimed = false; // one priority attacker may target the player per turn

  // Uniform inclusive roll; never below dmg[0] and never below 1.
  const roll = (dmg) => dmg[0] + Math.floor(rng() * (dmg[1] - dmg[0] + 1));
  const randomTarget = () =>
    livingFriendly[Math.floor(rng() * livingFriendly.length)];

  const push = (enemyId, targetId, damage) => {
    assignments.push({ id: `eatk_${enemyId}_${idx}`, enemyId, targetId, damage });
    idx++;
  };

  for (const enemy of hostile) {
    if (enemy.hp.current <= 0) continue;

    switch (enemy.move.type) {
      case 'focus': {
        // Lowest current hp; first on ties.
        let target = livingFriendly[0];
        for (const u of livingFriendly) {
          if (u.hp.current < target.hp.current) target = u;
        }
        push(enemy.id, target.id, roll(enemy.move.damage));
        break;
      }
      case 'priority': {
        // Hunters go for the player, but only ONE may pile on per turn — extras spread
        // to a non-player so a priority-heavy group can't trigger an un-counterable focus-kill.
        const player = livingFriendly.find((u) => u.isPlayer === true);
        let target;
        if (player && !playerClaimed) {
          target = player;
          playerClaimed = true;
        } else {
          const others = livingFriendly.filter((u) => !u.isPlayer);
          const pool = others.length ? others : livingFriendly;
          target = pool[Math.floor(rng() * pool.length)];
        }
        push(enemy.id, target.id, roll(enemy.move.damage));
        break;
      }
      case 'ramp': {
        const stacks = enemy.rampStacks || 0;
        const damage = roll(enemy.move.damage) + stacks * RAMP_STEP;
        push(enemy.id, randomTarget().id, damage);
        patches[enemy.id] = { rampStacks: stacks + 1 };
        break;
      }
      case 'telegraph': {
        const base = roll(enemy.move.damage);
        const big = round % TELEGRAPH_PERIOD === 0;
        push(enemy.id, randomTarget().id, big ? base * TELEGRAPH_MULT : base);
        break;
      }
      case 'aoe': {
        for (const target of livingFriendly) {
          push(enemy.id, target.id, roll(enemy.move.damage));
        }
        break;
      }
      case 'basic':
      default: {
        push(enemy.id, randomTarget().id, roll(enemy.move.damage));
        break;
      }
    }
  }

  return { assignments, patches };
}
