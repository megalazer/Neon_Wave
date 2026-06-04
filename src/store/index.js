import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

enableMapSet();
import { createCharacterSlice } from './slices/characterSlice';
import { createCrewSlice } from './slices/crewSlice';
import { createWorldSlice } from './slices/worldSlice';
import { createLogSlice } from './slices/logSlice';
import { createEventSlice } from './slices/eventSlice';
import { createLegacySlice } from './slices/legacySlice';
import { createExchangeSlice } from './slices/exchangeSlice';
import { createDevSlice } from './slices/devSlice';
import { createTestCombatSlice } from './slices/testCombatSlice';
import { createContractSlice } from './slices/contractSlice';
import { createVendorSlice } from './slices/vendorSlice';
import { createAchievementSlice } from './slices/achievementSlice';
import { createFactionSlice } from './slices/factionSlice';

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
    ...createContractSlice(...args),
    ...createVendorSlice(...args),
    ...createAchievementSlice(...args),
    ...createFactionSlice(...args),
  })),
);
