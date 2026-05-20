import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createCharacterSlice } from './slices/characterSlice';
import { createCrewSlice } from './slices/crewSlice';
import { createWorldSlice } from './slices/worldSlice';
import { createLogSlice } from './slices/logSlice';
import { createEventSlice } from './slices/eventSlice';
import { createLegacySlice } from './slices/legacySlice';
import { createExchangeSlice } from './slices/exchangeSlice';
import { createDevSlice } from './slices/devSlice';
import { createTestCombatSlice } from './slices/testCombatSlice';

export const useStore = create(
  immer((...args) => ({
    ...createCharacterSlice(...args),
    ...createCrewSlice(...args),
    ...createWorldSlice(...args),
    ...createLogSlice(...args),
    ...createEventSlice(...args),
    ...createLegacySlice(...args),
    ...createExchangeSlice(...args),
    ...createDevSlice(...args),
    ...createTestCombatSlice(...args),
  })),
);
