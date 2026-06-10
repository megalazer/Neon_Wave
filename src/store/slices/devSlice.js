import AsyncStorage from '@react-native-async-storage/async-storage';
import { XP_THRESHOLDS, MAX_LEVEL, applyXPToCrewMember, syncRenown } from '../../data/leveling';

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
          id: `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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
        id: `dev_inject_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text: String(text) || '[DEV_INJECTED_ENTRY]',
        timestamp: new Date().toISOString(),
        type: 'system',
      });
    }),

  devSetName: (name) =>
    set((state) => {
      state.character.name = String(name).trim() || state.character.name;
    }),

  // ── Leveling overrides ──────────────────────────────────────────────────────

  devAddCharacterXP: (amount) =>
    set((state) => {
      const player = state.crew.members.find((m) => m.isPlayer);
      if (!player) return;
      applyXPToCrewMember(state, player, Math.max(0, Number(amount) || 0));
    }),

  devSetCharacterLevel: (level) =>
    set((state) => {
      const player = state.crew.members.find((m) => m.isPlayer);
      if (!player) return;
      const lvl = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
      player.exp   = XP_THRESHOLDS[lvl - 1];
      player.level = lvl;
      syncRenown(state);
    }),

  devAddCrewXP: (memberId, amount) =>
    set((state) => {
      const member = state.crew.members.find((m) => m.id === memberId);
      if (!member) return;
      applyXPToCrewMember(state, member, Math.max(0, Number(amount) || 0));
    }),

  devSetCrewMemberLevel: (memberId, level) =>
    set((state) => {
      const member = state.crew.members.find((m) => m.id === memberId);
      if (!member) return;
      const lvl = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
      member.exp   = XP_THRESHOLDS[lvl - 1];
      member.level = lvl;
      if (member.isPlayer) {
        syncRenown(state);
      }
    }),

  devLevelAllCrew: (level) =>
    set((state) => {
      const lvl = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
      state.crew.members.forEach((m) => {
        m.exp   = XP_THRESHOLDS[lvl - 1];
        m.level = lvl;
      });
      syncRenown(state);
    }),

  devSetTeamLevel: (level) =>
    set((state) => {
      const lvl = Math.max(1, Math.min(MAX_LEVEL, Number(level) || 1));
      state.crew.members.forEach((m) => {
        m.exp   = XP_THRESHOLDS[lvl - 1];
        m.level = lvl;
      });
      syncRenown(state);
    }),

  devResetLeveling: () =>
    set((state) => {
      state.crew.members.forEach((m) => {
        m.exp   = 0;
        m.level = 1;
      });
      syncRenown(state);
    }),

  devTriggerLevelUpBanner: () =>
    set((state) => {
      const player = state.crew.members.find((m) => m.isPlayer);
      if (!player) return;
      state.world.pendingLevelUp = {
        target:     'player',
        memberName: player.name || 'OPERATIVE',
        from:       player.level || 1,
        to:         Math.min(MAX_LEVEL, (player.level || 1) + 1),
      };
    }),

  devForceCombatXP: () =>
    set((state) => {
      const player = state.crew.members.find((m) => m.isPlayer);
      if (!player) return;
      applyXPToCrewMember(state, player, 200);
    }),

  devSoftReset: () =>
    set((state) => {
      state.character.name = null;
      state.character.credits = 0;
      state.character.turnNumber = 0;
      state.crew.members = [];
      state.world.gameOver = false;
      state.world.gameOverReason = null;
      state.log.entries = [];
      state.dev.panelOpen = false;
      state.vendor.rotatingStock = [];
      state.vendor.refreshCountdown = 8;
      state.vendor.purchasedThisRotation = [];
      state.vendor.quickhackModules = [];
      // Run achievements reset; account + lifetime preserved
      if (state.achievements) state.achievements.run.unlocked = [];
      // Faction rep is run-scoped — reset on flatline
      if (state.faction) for (const fid of Object.keys(state.faction.rep)) state.faction.rep[fid] = 0;
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
      state.world.pendingLevelUp = null;
      state.world.turnNumber = 0;
      state.world.gameOver = false;
      state.world.gameOverReason = null;
      state.log.entries = [];
      state.dev.panelOpen = false;
      state.vendor.rotatingStock = [];
      state.vendor.refreshCountdown = 8;
      state.vendor.purchasedThisRotation = [];
      state.vendor.quickhackModules = [];
      // Hard reset also wipes account achievements
      if (state.achievements) {
        state.achievements.run.unlocked     = [];
        state.achievements.account.unlocked = [];
        state.achievements.lifetime         = { contractsCompleted: 0, totalCreditsEarned: 0, totalTurnsSurvived: 0, maxTeamLevelReached: 0, deaths: 0, legendaryRecruits: 0 };
        state.achievements.unseen           = [];
        state.achievements.toastQueue       = [];
      }
      if (state.faction) for (const fid of Object.keys(state.faction.rep)) state.faction.rep[fid] = 0;
    }),

  devKillPlayer: () =>
    set((state) => {
      const player = state.crew.members.find((m) => m.isPlayer);
      if (!player) return;
      player.vitals.current = 0;
      state.world.gameOver = true;
      state.world.gameOverReason = 'FLATLINE';
    }),

  devHealPlayer: () =>
    set((state) => {
      const player = state.crew.members.find((m) => m.isPlayer);
      if (!player) return;
      player.vitals.current = player.vitals.max;
      player.neural.current = player.neural.max;
      state.world.gameOver = false;
      state.world.gameOverReason = null;
    }),

  devDrainNeural: () =>
    set((state) => {
      for (const m of state.crew.members) {
        if ((m.vitals?.current ?? 1) > 0 && m.neural) {
          m.neural.current = Math.max(0, Math.floor(m.neural.current * 0.2));
        }
      }
    }),

  devRestoreNeural: () =>
    set((state) => {
      for (const m of state.crew.members) {
        if (m.neural) m.neural.current = m.neural.max;
      }
    }),
});
