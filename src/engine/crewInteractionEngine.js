import { pickInteraction } from '../data/crewInteractions';
import { colors } from '../theme/colors';

/**
 * Called inside a Zustand+Immer set callback every turn.
 * Picks two crew members (or one for a solo moment), finds an interaction,
 * and sets the crew interaction toast + log entry on state.
 *
 * @param {object} state — mutable Immer draft
 */
export function tryFireCrewInteraction(state) {
  const interaction = state.world.crewInteraction;

  // Cooldown: skip if we haven't waited long enough since last interaction
  if (state.world.turnNumber - interaction.lastInteractionTurn < interaction.cooldownTurns) return;

  // Need at least one living member
  const living = state.crew.members.filter(
    (m) => m.alive !== false && (m.vitals?.current ?? 1) > 0,
  );
  if (living.length === 0) return;

  let memberA;
  let memberB = null;
  let contractsTogether = 0;

  // 70% chance two members interact, 30% chance solo moment
  if (living.length >= 2 && Math.random() < 0.7) {
    const shuffled = [...living].sort(() => Math.random() - 0.5);
    memberA = shuffled[0];
    memberB = shuffled[1];
    contractsTogether = memberA.contractsWith?.[memberB.id] ?? 0;
  } else {
    memberA = living[Math.floor(Math.random() * living.length)];
  }

  const result = pickInteraction(memberA, memberB, contractsTogether, state.world.turnNumber);
  if (!result) return;

  // Set the toast
  interaction.activeToast = {
    nameA: memberA.name,
    nameB: memberB?.name ?? null,
    lines: result.lines,
    accent: memberA.classColor || colors.primary,
  };
  interaction.lastInteractionTurn = state.world.turnNumber;
  interaction.cooldownTurns = 4 + Math.floor(Math.random() * 5); // 4-8 turns

  // Push to log
  state.log.entries.push({
    id: `crew_int_${Date.now()}`,
    turn: state.world.turnNumber,
    text: result.text,
    timestamp: new Date().toISOString(),
    type: 'ambient',
  });
}
