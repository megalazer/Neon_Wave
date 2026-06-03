import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACHIEVEMENTS, ACHIEVEMENT_LIST, DEFAULT_THEME } from '../../data/achievements';

const STORAGE_KEY = 'neon_terminus_account_achievements';

async function loadAccountData() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAccountData(state) {
  const data = {
    account:  state.achievements.account,
    lifetime: state.achievements.lifetime,
  };
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

export const createAchievementSlice = (set, get) => ({
  achievements: {
    account:  { unlocked: [], selectedTitle: null, selectedTheme: DEFAULT_THEME },
    lifetime: {
      contractsCompleted:  0,
      totalCreditsEarned:  0,
      totalTurnsSurvived:  0,
      maxTeamLevelReached: 0,
      deaths:              0,
      legendaryRecruits:   0,
      flawlessWins:        0,
    },
    run:        { unlocked: [] },
    unseen:     [],
    toastQueue: [],
  },

  // ── Init — load persisted account + lifetime data ─────────────────────────

  initAchievements: async () => {
    const saved = await loadAccountData();
    if (!saved) return;
    set((draft) => {
      if (Array.isArray(saved.account?.unlocked)) {
        draft.achievements.account.unlocked = saved.account.unlocked;
      }
      if (saved.account?.selectedTitle !== undefined) {
        draft.achievements.account.selectedTitle = saved.account.selectedTitle;
      }
      if (saved.account?.selectedTheme) {
        draft.achievements.account.selectedTheme = saved.account.selectedTheme;
      }
      if (saved.lifetime && typeof saved.lifetime === 'object') {
        Object.assign(draft.achievements.lifetime, saved.lifetime);
      }
    });
  },

  // ── Core unlock ───────────────────────────────────────────────────────────

  unlockAchievement: (id) => {
    const state = get();
    const def = ACHIEVEMENTS[id];
    if (!def) return;

    const isUnlocked = def.scope === 'account'
      ? state.achievements.account.unlocked.includes(id)
      : state.achievements.run.unlocked.includes(id);
    if (isUnlocked) return;

    set((draft) => {
      if (def.scope === 'account') draft.achievements.account.unlocked.push(id);
      else draft.achievements.run.unlocked.push(id);

      draft.achievements.unseen.push(id);
      draft.achievements.toastQueue.push({ id, scope: def.scope });

      // Run-scope rewards apply once, in-run. Account-scope uses accountPerk,
      // which is applied fresh at the start of every run (not here).
      if (def.scope === 'run') {
        if (def.reward?.credits) {
          draft.character.credits = (draft.character.credits ?? 0) + def.reward.credits;
        }
        if (def.reward?.cyberwareId) {
          draft.character.cyberwareInventory.push(def.reward.cyberwareId);
        }
      }

      // Log entry — account shows the permanent perk, run shows the one-time reward
      let detailStr = '';
      if (def.scope === 'account' && def.accountPerk) {
        detailStr = ` PERK: ${def.accountPerk.description}`;
      } else if (def.reward?.credits) {
        detailStr = ` +${def.reward.credits.toLocaleString()} CR`;
      } else if (def.reward?.cyberwareId) {
        detailStr = ` [${def.reward.cyberwareId}]`;
      } else if (def.reward?.recruitQuality) {
        detailStr = ` [${def.reward.recruitQuality.toUpperCase()} RECRUIT]`;
      }
      draft.log.entries.push({
        id: `ach_${id}_${Date.now()}`,
        turn: draft.character.turnNumber,
        text: `ACHIEVEMENT_UNLOCKED: ${def.name}${detailStr}`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    });

    // Recruit reward (run scope only) — requires action call
    if (def.scope === 'run' && def.reward?.recruitQuality) {
      get().forceSpawnRecruit?.(def.reward.recruitQuality);
    }

    // Persist account data when an account achievement unlocks
    if (def.scope === 'account') {
      saveAccountData(get());
    }
  },

  // ── Polling — call each turn ───────────────────────────────────────────────

  checkMilestones: () => {
    const state = get();
    for (const a of ACHIEVEMENT_LIST) {
      if (a.type !== 'milestone' || !a.condition) continue;
      const isUnlocked = a.scope === 'account'
        ? state.achievements.account.unlocked.includes(a.id)
        : state.achievements.run.unlocked.includes(a.id);
      if (!isUnlocked && a.condition(state)) {
        get().unlockAchievement(a.id);
      }
    }
  },

  // ── Direct trigger (action achievements) ─────────────────────────────────

  triggerAchievement: (id) => {
    get().unlockAchievement(id);
  },

  // ── Lifetime counter updates ──────────────────────────────────────────────

  incrementLifetime: (key, amount = 1) => {
    set((draft) => {
      draft.achievements.lifetime[key] = (draft.achievements.lifetime[key] ?? 0) + amount;
    });
    saveAccountData(get());
  },

  recordMaxTeamLevel: (tl) => {
    const current = get().achievements.lifetime.maxTeamLevelReached ?? 0;
    if (tl > current) {
      set((draft) => { draft.achievements.lifetime.maxTeamLevelReached = tl; });
      saveAccountData(get());
    }
  },

  // ── Toast lifecycle ───────────────────────────────────────────────────────

  dequeueToast: () =>
    set((draft) => { draft.achievements.toastQueue.shift(); }),

  // ── UI bookkeeping ────────────────────────────────────────────────────────

  markAchievementsSeen: () =>
    set((draft) => { draft.achievements.unseen = []; }),

  // ── Run reset (called in devSoftReset, not here directly) ─────────────────
  // devSlice handles run reset inline; this action is available if needed elsewhere.

  resetRunAchievements: () =>
    set((draft) => { draft.achievements.run.unlocked = []; }),

  // ── Death recording — call from App.handleRestart BEFORE devSoftReset ─────

  recordPlayerDeath: () => {
    get().incrementLifetime('deaths');
    get().triggerAchievement('acc_first_death');
    // run achievements reset is handled by devSoftReset
  },

  // ── Cosmetics — selected title / theme (persist with account data) ────────

  setSelectedTitle: (title) => {
    set((draft) => { draft.achievements.account.selectedTitle = title; });
    saveAccountData(get());
  },

  setSelectedTheme: (theme) => {
    set((draft) => { draft.achievements.account.selectedTheme = theme; });
    saveAccountData(get());
  },
});
