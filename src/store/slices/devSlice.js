import AsyncStorage from '@react-native-async-storage/async-storage';

const TAP_TARGET = 7;
const TAP_WINDOW = 3000;

export const createDevSlice = (set, get) => ({
  dev: {
    enabled: false,
    panelOpen: false,
    tapCount: 0,
    lastTapTime: 0,
  },

  initDevMode: async () => {
    try {
      const val = await AsyncStorage.getItem('dev_enabled');
      if (val === 'true') {
        set((state) => { state.dev.enabled = true; });
      }
    } catch (_) {}
  },

  recordBannerTap: () => {
    const now = Date.now();
    const { dev } = get();
    const elapsed = now - dev.lastTapTime;
    const newCount = elapsed > TAP_WINDOW ? 1 : dev.tapCount + 1;

    if (newCount >= TAP_TARGET) {
      const newEnabled = !dev.enabled;
      set((state) => {
        state.dev.enabled = newEnabled;
        state.dev.tapCount = 0;
        state.dev.lastTapTime = now;
        state.log.entries.push({
          id: `dev_${Date.now()}`,
          turn: state.character.turnNumber,
          text: newEnabled
            ? '[SYS] DEV_PROTOCOL ENGAGED. Restricted access granted.'
            : '[SYS] DEV_PROTOCOL DISENGAGED.',
          timestamp: new Date().toISOString(),
          type: 'system',
        });
      });
      AsyncStorage.setItem('dev_enabled', String(newEnabled)).catch(() => {});
    } else {
      set((state) => {
        state.dev.tapCount = newCount;
        state.dev.lastTapTime = now;
      });
    }
  },

  openDevPanel: () => set((state) => { state.dev.panelOpen = true; }),
  closeDevPanel: () => set((state) => { state.dev.panelOpen = false; }),

  devSetCredits: (amount) =>
    set((state) => {
      state.character.credits = Math.max(0, Math.round(Number(amount) || 0));
    }),

  devSetTurn: (n) =>
    set((state) => {
      const val = Math.max(1, Math.round(Number(n) || 1));
      state.character.turnNumber = val;
      state.world.turnNumber = val;
    }),

  devFillCrewVitals: () =>
    set((state) => {
      state.crew.members.forEach((m) => {
        if (m.vitals) m.vitals.current = m.vitals.max;
        if (m.neural) m.neural.current = m.neural.max;
        if (m.humanity) m.humanity.current = m.humanity.max;
      });
    }),

  devSetFactionPower: (factionId, value) =>
    set((state) => {
      state.world.factionPower[factionId] = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    }),

  devSetCoinPrice: (coinId, price) =>
    set((state) => {
      const coin = state.exchange.coins[coinId];
      if (!coin) return;
      const p = Math.max(1, Math.round(Number(price) || 1));
      coin.currentPrice = p;
      coin.priceHistory.push(p);
      if (coin.priceHistory.length > 30) coin.priceHistory.shift();
    }),

  devSpikeCoin: (coinId) =>
    set((state) => {
      const coin = state.exchange.coins[coinId];
      if (!coin) return;
      const p = Math.round(coin.currentPrice * 2);
      coin.currentPrice = p;
      coin.priceHistory.push(p);
      if (coin.priceHistory.length > 30) coin.priceHistory.shift();
    }),

  devCrashCoin: (coinId) =>
    set((state) => {
      const coin = state.exchange.coins[coinId];
      if (!coin) return;
      const p = Math.max(1, Math.round(coin.currentPrice * 0.5));
      coin.currentPrice = p;
      coin.priceHistory.push(p);
      if (coin.priceHistory.length > 30) coin.priceHistory.shift();
    }),

  devSetHoldings: (coinId, amount) =>
    set((state) => {
      if (state.exchange.holdings[coinId] !== undefined) {
        state.exchange.holdings[coinId] = Math.max(0, Number(amount) || 0);
      }
    }),

  devClearLog: () => set((state) => { state.log.entries = []; }),

  devInjectLog: (text) =>
    set((state) => {
      state.log.entries.push({
        id: `dev_inject_${Date.now()}`,
        turn: state.character.turnNumber,
        text: String(text) || '[DEV_INJECTED_ENTRY]',
        timestamp: new Date().toISOString(),
        type: 'system',
      });
    }),

  devSoftReset: () =>
    set((state) => {
      state.character.name = null;
      state.character.credits = 0;
      state.character.turnNumber = 0;
      state.log.entries = [];
      state.dev.panelOpen = false;
    }),

  devHardReset: () =>
    set((state) => {
      state.character.name = null;
      state.character.credits = 0;
      state.character.turnNumber = 0;
      state.character.path = null;
      state.character.realEstate = [];
      state.character.vehicles = [];
      state.character.luxuryItems = [];
      state.crew.members = [];
      state.world.factionPower = {};
      state.world.turnNumber = 0;
      state.log.entries = [];
      state.dev.panelOpen = false;
    }),
});
