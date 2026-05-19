import { useStore } from '../store/index';
import { PLACEHOLDER_LINES } from '../data/placeholderNarration';

// Picks a random line from the placeholder narration array
function pickNarration() {
  return PLACEHOLDER_LINES[Math.floor(Math.random() * PLACEHOLDER_LINES.length)];
}

// Generates a unique entry ID
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

// Core turn loop for MVP — no LLM, no stat checks, no death check yet.
// Each call: increments turn counters, picks narration, pushes to log.
export function advanceTurn() {
  const store = useStore.getState();

  store.incrementTurn();
  store.tickTurn();
  store.tickPrices();

  const turnNumber = useStore.getState().character.turnNumber;

  const entry = {
    id: makeId(),
    turn: turnNumber,
    text: pickNarration(),
    timestamp: new Date().toISOString(),
    type: 'narration',
  };

  store.addEntry(entry);
}
