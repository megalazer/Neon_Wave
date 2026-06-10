// scope: 'account' | 'run'
// type: 'milestone' (polled each turn) | 'action' (directly triggered)
// hidden: show as ??? until unlocked
// condition: (state) => bool — milestones only; actions are null
// progressHint: (state) => string — shown in locked-milestone UI

export const ACHIEVEMENTS = {

  // ─── ACCOUNT — LIFETIME MILESTONES ─────────────────────────────────────────

  acc_first_blood: {
    id: 'acc_first_blood', scope: 'account', type: 'milestone', hidden: false,
    name: 'FIRST_BLOOD',
    description: 'Complete your first contract. (Lifetime)',
    condition: (s) => s.achievements.lifetime.contractsCompleted >= 1,
    progressHint: (s) => `${s.achievements.lifetime.contractsCompleted}/1 contracts`,
    accountPerk: { type: 'start_credits', value: 1000, description: 'All runs start with +1,000 CR.' },
  },
  acc_seasoned: {
    id: 'acc_seasoned', scope: 'account', type: 'milestone', hidden: false,
    name: 'SEASONED_RUNNER',
    description: 'Complete 25 contracts across all runs.',
    condition: (s) => s.achievements.lifetime.contractsCompleted >= 25,
    progressHint: (s) => `${s.achievements.lifetime.contractsCompleted}/25 contracts`,
    accountPerk: { type: 'start_credits', value: 2500, description: 'All runs start with +2,500 CR.' },
  },
  acc_legend: {
    id: 'acc_legend', scope: 'account', type: 'milestone', hidden: false,
    name: 'NIGHT_CITY_LEGEND',
    description: 'Complete 100 contracts across all runs.',
    condition: (s) => s.achievements.lifetime.contractsCompleted >= 100,
    progressHint: (s) => `${s.achievements.lifetime.contractsCompleted}/100 contracts`,
    accountPerk: { type: 'unlock_vendor_cyberware', value: 'cyb_sandevistan_apex', description: 'Slipstream Apex can now appear in the vendor.' },
  },
  acc_apex_crew: {
    id: 'acc_apex_crew', scope: 'account', type: 'milestone', hidden: false,
    name: 'APEX_CREW',
    description: 'Reach Team Level 10 (ever).',
    condition: (s) => s.achievements.lifetime.maxTeamLevelReached >= 10,
    progressHint: (s) => `TL ${s.achievements.lifetime.maxTeamLevelReached}/10`,
    accountPerk: { type: 'start_level', value: 1, description: 'You start every run 1 level higher.' },
  },
  acc_rich: {
    id: 'acc_rich', scope: 'account', type: 'milestone', hidden: false,
    name: 'CORPO_DYNASTY',
    description: 'Earn 250,000 lifetime credits.',
    condition: (s) => s.achievements.lifetime.totalCreditsEarned >= 250000,
    progressHint: (s) => `${(s.achievements.lifetime.totalCreditsEarned / 1000).toFixed(0)}K / 250K CR`,
    accountPerk: { type: 'start_credits', value: 5000, description: 'All runs start with +5,000 CR.' },
  },
  acc_corpo_run: {
    id: 'acc_corpo_run', scope: 'account', type: 'milestone', hidden: false,
    name: 'CORPO_CLEARANCE',
    description: 'Amass 1,000,000 CR in a single run. Unlocks the CORPO life path.',
    condition: (s) => s.character.credits >= 1000000,
    progressHint: (s) => `${(s.character.credits / 1000).toFixed(0)}K / 1,000K CR`,
    accountPerk: { type: 'cosmetic_title', value: 'CORPO', description: 'Unlocks the title: CORPO.' },
  },
  acc_survivor: {
    id: 'acc_survivor', scope: 'account', type: 'milestone', hidden: false,
    name: 'NINE_LIVES',
    description: 'Survive 500 total turns across all runs.',
    condition: (s) => s.achievements.lifetime.totalTurnsSurvived >= 500,
    progressHint: (s) => `${s.achievements.lifetime.totalTurnsSurvived}/500 turns`,
    accountPerk: { type: 'start_neural', value: 15, description: 'You start every run with +15 max neural.' },
  },

  // ─── ACCOUNT — ACTION ──────────────────────────────────────────────────────

  acc_legendary_recruit: {
    id: 'acc_legendary_recruit', scope: 'account', type: 'action', hidden: false,
    name: 'STAR_POWER',
    description: 'Recruit a legendary operative (ever).',
    condition: null, progressHint: null,
    accountPerk: { type: 'unlock_vendor_quickhack', value: 'qh_system_collapse', description: 'System Collapse modules can now appear in the vendor.' },
  },
  acc_boss_down: {
    id: 'acc_boss_down', scope: 'account', type: 'action', hidden: false,
    name: 'GIANT_SLAYER',
    description: 'Defeat a high-tier enemy (ever).',
    condition: null, progressHint: null,
    accountPerk: { type: 'unlock_vendor_cyberware', value: 'cyb_mantis_blades', description: 'Razor Arms can now appear in the vendor.' },
  },

  // ─── ACCOUNT — HIDDEN ──────────────────────────────────────────────────────

  acc_first_death: {
    id: 'acc_first_death', scope: 'account', type: 'action', hidden: true,
    name: 'GAME_OVER_MAN',
    description: 'Flatline for the first time.',
    condition: null, progressHint: null,
    accountPerk: { type: 'cosmetic_title', value: 'FLATLINER', description: 'Unlocks the title: FLATLINER.' },
  },
  acc_serial_death: {
    id: 'acc_serial_death', scope: 'account', type: 'milestone', hidden: true,
    name: 'GROUNDHOG_RUNNER',
    description: 'Die 10 times. The grid keeps spinning.',
    condition: (s) => s.achievements.lifetime.deaths >= 10,
    progressHint: (s) => `${s.achievements.lifetime.deaths}/10 deaths`,
    accountPerk: { type: 'start_credits', value: 3000, description: 'All runs start with +3,000 CR. The grid pays its regulars.' },
  },

  // ─── ACCOUNT — HIDDEN / EXTREME ────────────────────────────────────────────

  acc_cyberpsycho: {
    id: 'acc_cyberpsycho', scope: 'account', type: 'milestone', hidden: true,
    name: 'CHROME_FRACTURE',
    description: 'Drive a crew member below 5% humanity and keep them alive.',
    condition: (s) => s.crew.members.some((m) =>
      m.humanity && (m.humanity.current / m.humanity.max) < 0.05 && (m.vitals?.current ?? 1) > 0),
    progressHint: null,
    accountPerk: { type: 'cosmetic_title', value: 'CHROME_FRACTURE', description: 'Unlocks the title: CHROME_FRACTURE. The chrome won.' },
  },
  acc_full_chrome: {
    id: 'acc_full_chrome', scope: 'account', type: 'milestone', hidden: true,
    name: 'MORE_MACHINE_THAN_MAN',
    description: 'Equip a crew member to their maximum cyberware slots.',
    condition: (s) => s.crew.members.some((m) =>
      (m.equippedCyberware?.length || 0) >= (m.maxCyberwareSlots || 99)),
    progressHint: null,
    accountPerk: { type: 'cosmetic_hud_theme', value: 'theme_chrome', description: 'Unlocks the FULL_CHROME HUD theme.' },
  },
  acc_glass_cannon: {
    id: 'acc_glass_cannon', scope: 'account', type: 'action', hidden: true,
    name: 'GLASS_CANNON',
    description: 'Win a combat where your only damage came from quickhacks.',
    condition: null, progressHint: null,
    accountPerk: { type: 'unlock_vendor_quickhack', value: 'qh_cyberpsychosis', description: 'Neural Cascade modules can now appear in the vendor.' },
  },
  acc_untouchable_streak: {
    id: 'acc_untouchable_streak', scope: 'account', type: 'milestone', hidden: true,
    name: 'GHOST_IN_THE_MACHINE',
    description: 'Win 10 flawless combats across all runs.',
    condition: (s) => s.achievements.lifetime.flawlessWins >= 10,
    progressHint: (s) => `${s.achievements.lifetime.flawlessWins}/10 flawless`,
    accountPerk: { type: 'start_stat', stat: 'ghost', value: 2, description: 'You start every run with +2 GHOST.' },
  },
  acc_high_roller: {
    id: 'acc_high_roller', scope: 'account', type: 'milestone', hidden: true,
    name: 'HOUSE_ALWAYS_WINS',
    description: 'Earn 1,000,000 lifetime credits.',
    condition: (s) => s.achievements.lifetime.totalCreditsEarned >= 1000000,
    progressHint: (s) => `${(s.achievements.lifetime.totalCreditsEarned / 1000).toFixed(0)}K / 1M CR`,
    accountPerk: { type: 'cosmetic_hud_theme', value: 'theme_gold', description: 'Unlocks the SOLID_GOLD HUD theme.' },
  },
  acc_legend_collector: {
    id: 'acc_legend_collector', scope: 'account', type: 'milestone', hidden: true,
    name: 'DREAM_TEAM',
    description: 'Recruit 10 legendary operatives across all runs.',
    condition: (s) => s.achievements.lifetime.legendaryRecruits >= 10,
    progressHint: (s) => `${s.achievements.lifetime.legendaryRecruits}/10 legendary`,
    accountPerk: { type: 'start_credits', value: 4000, description: 'All runs start with +4,000 CR.' },
  },

  // ─── RUN — MILESTONES ──────────────────────────────────────────────────────

  run_five_contracts: {
    id: 'run_five_contracts', scope: 'run', type: 'milestone', hidden: false,
    name: 'ON_A_ROLL',
    description: 'Complete 5 contracts this run.',
    condition: (s) => s.contract.completedContracts.length >= 5,
    progressHint: (s) => `${s.contract.completedContracts.length}/5 this run`,
    reward: { credits: 2000 },
  },
  run_full_roster: {
    id: 'run_full_roster', scope: 'run', type: 'milestone', hidden: false,
    name: 'FULL_DECK',
    description: 'Fill all 4 crew slots this run.',
    condition: (s) => s.crew.members.length >= 4,
    progressHint: (s) => `${s.crew.members.length}/4 crew`,
    reward: { credits: 1000 },
  },
  run_chromed: {
    id: 'run_chromed', scope: 'run', type: 'milestone', hidden: false,
    name: 'CHROMED_UP',
    description: 'Equip 4+ cyberware on one crew member this run.',
    condition: (s) => s.crew.members.some((m) => (m.equippedCyberware?.length || 0) >= 4),
    progressHint: (s) => {
      const best = Math.max(0, ...s.crew.members.map((m) => m.equippedCyberware?.length || 0));
      return `${best}/4 on best member`;
    },
    reward: { credits: 1500 },
  },

  // ─── RUN — ACTIONS ─────────────────────────────────────────────────────────

  run_baptism: {
    id: 'run_baptism', scope: 'run', type: 'action', hidden: false,
    name: 'BAPTISM',
    description: 'Win a combat this run.',
    condition: null, progressHint: null,
    reward: { credits: 500 },
  },
  run_flawless: {
    id: 'run_flawless', scope: 'run', type: 'action', hidden: false,
    name: 'UNTOUCHABLE',
    description: 'Win a combat without any crew taking damage.',
    condition: null, progressHint: null,
    reward: { cyberwareId: 'cyb_reflex_booster' },
  },

  // ─── RUN — HIDDEN ──────────────────────────────────────────────────────────

  run_near_death: {
    id: 'run_near_death', scope: 'run', type: 'action', hidden: true,
    name: 'CHEATED_DEATH',
    description: 'Win a combat with a crew member at 1 HP.',
    condition: null, progressHint: null,
    reward: { credits: 3000 },
  },
  run_pacifist: {
    id: 'run_pacifist', scope: 'run', type: 'action', hidden: true,
    name: 'NO_BLOOD_SPILLED',
    description: 'Complete a contract avoiding combat entirely.',
    condition: null, progressHint: null,
    reward: { credits: 2000 },
  },
  run_puppeteer: {
    id: 'run_puppeteer', scope: 'run', type: 'action', hidden: true,
    name: 'PUPPETEER',
    description: 'Turn an enemy against their own allies.',
    condition: null, progressHint: null,
    reward: { recruitQuality: 'rare' },
  },
};

export const ACHIEVEMENT_LIST    = Object.values(ACHIEVEMENTS);
export const ACCOUNT_ACHIEVEMENTS = ACHIEVEMENT_LIST.filter((a) => a.scope === 'account');
export const RUN_ACHIEVEMENTS     = ACHIEVEMENT_LIST.filter((a) => a.scope === 'run');
export function getMilestones(scope) {
  return ACHIEVEMENT_LIST.filter((a) => a.type === 'milestone' && a.scope === scope);
}

// ─── Account perks (derived from unlocked account achievements) ──────────────
// Perks are never persisted separately — they're recomputed from account.unlocked,
// which already persists. Always reflects the current unlocked set.

export const DEFAULT_TITLE = 'OPERATOR';
export const DEFAULT_THEME = 'theme_default';

export function getActiveAccountPerks(state) {
  const unlocked = state?.achievements?.account?.unlocked ?? [];
  return unlocked.map((id) => ACHIEVEMENTS[id]?.accountPerk).filter(Boolean);
}

export function getUnlockedTitles(state) {
  const titles = getActiveAccountPerks(state)
    .filter((p) => p.type === 'cosmetic_title')
    .map((p) => p.value);
  return [DEFAULT_TITLE, ...titles];
}

export function getUnlockedThemes(state) {
  const themes = getActiveAccountPerks(state)
    .filter((p) => p.type === 'cosmetic_hud_theme')
    .map((p) => p.value);
  return [DEFAULT_THEME, ...themes];
}
