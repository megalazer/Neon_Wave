import { useStore } from '../store/index';
import { pickNarration } from '../data/placeholderNarration';
import { calculateTeamLevel } from '../data/leveling';
import { tryFireCrewInteraction } from './crewInteractionEngine';


function makeId() {
  return `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function devAdvanceTurns(count) {
  const n = Math.max(1, Math.round(count));
  const store = useStore.getState();
  for (let i = 0; i < n; i++) {
    store.incrementTurn();
    store.tickTurn();
    store.tickPrices();
    store.tickFeed();
    store.tickVendor();
    store.trySpawnRecruit();
    store.tickAvailableOperatives();
    _tryFireRandomEvent(useStore.getState());
    const tl = calculateTeamLevel(useStore.getState().crew.members);
    store.incrementLifetime?.('totalTurnsSurvived');
    store.recordMaxTeamLevel?.(tl);
    store.checkMilestones?.();
  }
  const turnNumber = useStore.getState().character.turnNumber;
  store.addEntry({
    id: makeId(),
    turn: turnNumber,
    text: `[DEV] Fast-forwarded ${n} turn${n !== 1 ? 's' : ''}. Now at turn ${turnNumber}.`,
    timestamp: new Date().toISOString(),
    type: 'system',
  });
}

export function advanceTurn() {
  const store = useStore.getState();

  store.incrementTurn();
  store.tickTurn();
  store.tickPrices();
  store.tickFeed();
  store.tickVendor();
  store.trySpawnRecruit();
  store.tickAvailableOperatives();

  // Achievement tracking — lifetime counters + milestone polling
  const teamLevel = calculateTeamLevel(useStore.getState().crew.members);
  store.incrementLifetime?.('totalTurnsSurvived');
  store.recordMaxTeamLevel?.(teamLevel);
  store.checkMilestones?.();

  const state = useStore.getState();

  // Random events are mutually exclusive with combat, active contracts, and pending choice modals.
  const eventBlocked =
    state.combat.active ||
    state.contract.activeContractId !== null ||
    state.event.activeChoiceEventId !== null ||
    state.event.pendingChoiceOutcome !== null;

  if (!eventBlocked) {
    store.selectAndFireRandomEvent();
  }

  // If no event fired (or was blocked), push a placeholder narration line.
  const afterState = useStore.getState();
  const eventFired =
    afterState.event.activeChoiceEventId !== null ||
    afterState.event.pendingChoiceOutcome !== null ||
    // A flavor event pushes to log directly — detect by comparing entry count
    afterState.log.entries.length > state.log.entries.length;

  if (!eventFired) {
    const turnNumber = afterState.character.turnNumber;
    const playerStats = useStore.getState().crew.members.find(m => m.isPlayer)?.stats ?? {};
    store.addEntry({
      id: makeId(),
      turn: turnNumber,
      text: pickNarration(playerStats, useStore.getState().character.path),
      timestamp: new Date().toISOString(),
      type: 'narration',
    });
  }

  // Crew banter — independent of events, gated by its own cooldown
  const crewState = useStore.getState();
  if (!crewState.combat.active && crewState.contract.activeContractId === null) {
    useStore.setState((state) => {
      tryFireCrewInteraction(state);
    });
  }
}

// Internal helper shared by devAdvanceTurns — fires events without adding a fallback narration.
function _tryFireRandomEvent(state) {
  if (
    state.combat.active ||
    state.contract.activeContractId !== null ||
    state.event.activeChoiceEventId !== null ||
    state.event.pendingChoiceOutcome !== null
  ) return;
  useStore.getState().selectAndFireRandomEvent();
}
