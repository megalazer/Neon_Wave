import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createCharacterSlice } from './slices/characterSlice';
import { createCrewSlice } from './slices/crewSlice';
import { createWorldSlice } from './slices/worldSlice';
import { createLogSlice } from './slices/logSlice';
import { createEventSlice } from './slices/eventSlice';
import { createLegacySlice } from './slices/legacySlice';

export const useStore = create(
  immer((...args) => ({
    ...createCharacterSlice(...args),
    ...createCrewSlice(...args),
    ...createWorldSlice(...args),
    ...createLogSlice(...args),
    ...createEventSlice(...args),
    ...createLegacySlice(...args),
  })),
);
