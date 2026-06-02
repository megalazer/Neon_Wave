import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { useStore } from '../store/index';
import NoiseTexture from '../components/NoiseTexture';
import ScanlineOverlay from '../components/ScanlineOverlay';

import Die from '../components/battle/Die';
import UnitCard from '../components/battle/UnitCard';
import PhaseBanner from '../components/battle/PhaseBanner';
import ActionButton from '../components/battle/ActionButton';
import CompactRollControls from '../components/battle/CompactRollControls';
import RoundInfo from '../components/battle/RoundInfo';
import CyberPool from '../components/battle/CyberPool';
import CyberDock from '../components/battle/CyberDock';
import TargetingOverlay from '../components/battle/TargetingOverlay';
import BattleOutcomeOverlay from '../components/battle/BattleOutcomeOverlay';
import { CYBER_ABILITIES } from '../data/cyberAbilities';

const CYAN = colors.primary;
const MAG  = colors.secondaryContainer;
const RED  = colors.error;

const ACCENT_COLORS = {
  primary:   CYAN,
  secondary: MAG,
  error:     RED,
  tertiary:  '#00E676',
};

const LOCK_DELAYS = [600, 800, 1000, 1200];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Dice Hub ──────────────────────────────────────────────────────────────────
function DiceHub({ dice, friendly, rolling, phase, onLastDieLocked }) {
  const hubLabel = phase === 'targeting'
    ? 'NEURAL_DICE // TARGETING_ACTIVE'
    : 'NEURAL_DICE // STAND_BY';

  return (
    <View style={hub.wrap}>
      <View style={[hub.tick, hub.tl]} /><View style={[hub.tick, hub.tr]} />
      <View style={[hub.tick, hub.bl]} /><View style={[hub.tick, hub.br]} />

      <Text style={hub.label}>{hubLabel}</Text>

      <View style={hub.row}>
        {dice.map((die, i) => {
          const owner = friendly.find((u) => u.id === die.ownerId);
          return (
            <Die
              key={die.ownerId}
              value={die.value}
              isRolling={rolling}
              lockDelay={LOCK_DELAYS[i] ?? 1200}
              onLocked={i === dice.length - 1 ? onLastDieLocked : undefined}
              ownerName={owner?.name ?? ''}
              spent={die.spent}
              alive={die.alive}
            />
          );
        })}
      </View>
    </View>
  );
}

// ── Tactical Field ────────────────────────────────────────────────────────────
function TacticalField({
  friendly, hostile,
  selectedFriendlyId, phase,
  pendingAbility, abilityIsSingleTarget, abilityAccent,
  previewByEnemy, previewByFriendly,
  onFriendlyPress, onEnemyPress,
  onUnitMeasure,
}) {
  const hasSelection    = selectedFriendlyId !== null;
  const playerTargeting = hasSelection && phase === 'targeting';

  return (
    <View style={tac.wrap}>
      {/* Friendly column */}
      <View style={tac.col}>
        <View style={tac.sideLabel}>
          <View style={[tac.sideLine, { backgroundColor: CYAN }]} />
          <Text style={[tac.sideLabelText, { color: CYAN }]}>FRIENDLY_UNITS</Text>
        </View>
        {friendly.map((u) => {
          const isSelected = selectedFriendlyId === u.id;
          const isDead = u.hp.current === 0;
          const canPress = phase === 'targeting' && !isDead;
          return (
            <UnitCard
              key={u.id}
              unit={u}
              variant="friendly"
              onPress={canPress ? () => onFriendlyPress(u.id) : undefined}
              previewDamage={previewByFriendly[u.id] || 0}
              isSelected={isSelected}
              isPulsing={isSelected && phase === 'targeting'}
              pulseColor={CYAN}
              onMeasure={(coords) => onUnitMeasure(u.id, coords)}
            />
          );
        })}
      </View>

      {/* Hostile column */}
      <View style={[tac.col, tac.colRight]}>
        <View style={[tac.sideLabel, tac.sideLabelRight]}>
          <Text style={[tac.sideLabelText, { color: RED }]}>HOSTILE_OPERATIVES</Text>
          <View style={[tac.sideLine, { backgroundColor: RED }]} />
        </View>
        {hostile.map((u) => {
          const isDead = u.hp.current === 0;
          const canPress = !isDead && (abilityIsSingleTarget || playerTargeting);
          const enemyPulsing = !isDead && (abilityIsSingleTarget || playerTargeting);
          const enemyColor = abilityIsSingleTarget ? abilityAccent : RED;
          return (
            <UnitCard
              key={u.id}
              unit={u}
              variant="hostile"
              onPress={canPress ? () => onEnemyPress(u.id) : undefined}
              previewDamage={previewByEnemy[u.id] || 0}
              isPulsing={enemyPulsing}
              pulseColor={enemyColor}
              onMeasure={(coords) => onUnitMeasure(u.id, coords)}
            />
          );
        })}
      </View>
    </View>
  );
}

// ── Active Buff Chips ─────────────────────────────────────────────────────────
function BuffChips({ squadBuffs }) {
  if (!squadBuffs.length) return null;
  return (
    <View style={buff.row}>
      {squadBuffs.map((b) => (
        <View key={b.sourceClassId} style={buff.chip}>
          <Text style={buff.text}>
            {b.type === 'damage_reduction'
              ? `PHANTOM // -${Math.round(b.value * 100)}% DMG`
              : b.type.toUpperCase()}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Main BattleScreen ─────────────────────────────────────────────────────────
export default function BattleScreen({ onExit }) {
  const combat     = useStore((s) => s.combat);
  const exitBattle = useStore((s) => s.exitBattle);

  const [unitCoords, setUnitCoords] = useState({});

  const pendingAbility        = combat.pendingAbility;
  const pendingAbilityData    = pendingAbility ? CYBER_ABILITIES[pendingAbility.classId] : null;
  const abilityIsSingleTarget = pendingAbilityData?.effect.type === 'single_target_damage';
  const abilityAccent         = pendingAbilityData
    ? (ACCENT_COLORS[pendingAbilityData.accent] ?? CYAN)
    : CYAN;

  // Only compute live dice-based preview during targeting. Once execution starts
  // UnitCard reads the frozen snapshot directly; zeroing this out prevents the
  // prop from conflicting with snapshot data or triggering stale preview renders.
  const previewByEnemy = useMemo(() => {
    if (combat.phase !== 'targeting') return {};
    const map = {};
    for (const die of combat.dice) {
      if (die.alive && die.spent && die.assignedTo) {
        map[die.assignedTo] = (map[die.assignedTo] || 0) + die.value;
      }
    }
    return map;
  }, [combat.dice, combat.phase]);

  const previewByFriendly = useMemo(() => {
    if (combat.phase !== 'enemy_turn') return {};
    const map = {};
    for (const a of combat.enemyAssignments) {
      map[a.targetId] = (map[a.targetId] || 0) + a.damage;
    }
    return map;
  }, [combat.enemyAssignments, combat.phase]);

  // ── Executing phase: drain pendingAttacks queue ──
  useEffect(() => {
    if (combat.phase !== 'executing') return;
    let cancelled = false;

    (async () => {
      const attacks = [...useStore.getState().combat.pendingAttacks];

      for (const attack of attacks) {
        if (cancelled) return;
        useStore.getState().applyPendingAttack(attack.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await delay(80);
        if (useStore.getState().combat.phase === 'victory') return;
      }

      if (cancelled) return;
      useStore.getState().clearPendingQueue();

      const latest = useStore.getState().combat;
      if (latest.phase === 'victory') return;

      if (latest.hostile.every((u) => u.hp.current === 0)) {
        useStore.getState().checkAndSetOutcome();
      } else {
        if (!cancelled) useStore.getState().beginEnemyTurn();
      }
    })();

    return () => { cancelled = true; };
  }, [combat.phase]);

  // ── Enemy turn ──
  useEffect(() => {
    if (combat.phase !== 'enemy_turn') return;
    let cancelled = false;

    (async () => {
      const { enemyAssignments } = useStore.getState().combat;
      await delay(50);

      for (const a of enemyAssignments) {
        if (cancelled) return;
        useStore.getState().applyEnemyHit(a.enemyId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await delay(120);
      }

      if (!cancelled) useStore.getState().endRound();
    })();

    return () => { cancelled = true; };
  }, [combat.phase]);

  // ── Handlers ──

  const handleExit = useCallback(() => {
    // Read combat outcome BEFORE exitBattle clears it
    const state = useStore.getState();
    const combatOutcome = state.combat.outcome;
    const hasPendingContract = state.contract.pendingCombatResult !== null;
    exitBattle();
    if (hasPendingContract) {
      useStore.getState().handleCombatResolution(combatOutcome);
    }
    onExit();
  }, [exitBattle, onExit]);

  const handleFriendlyPress = useCallback((unitId) => {
    const store = useStore.getState();
    const { phase, dice } = store.combat;
    if (phase !== 'targeting') return;

    const die = dice.find((d) => d.ownerId === unitId);
    if (!die?.alive) return;

    if (die.spent) {
      store.clearAttack(unitId);
    } else {
      store.selectFriendly(unitId);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleEnemyPress = useCallback((unitId) => {
    const store = useStore.getState();
    const { pendingAbility, phase, selectedFriendlyId } = store.combat;

    if (pendingAbility) {
      store.queueAbility(unitId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    if (phase !== 'targeting' || !selectedFriendlyId) return;
    store.assignAttack(unitId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleAbilityPress = useCallback((classId) => {
    const store = useStore.getState();
    const ability = CYBER_ABILITIES[classId];
    if (!ability) return;

    const { pendingAttacks, pendingAbility } = store.combat;

    // Cancel if already queued
    const isQueued = pendingAttacks.some((a) => a.source === 'ability' && a.sourceId === classId);
    if (isQueued) {
      store.cancelQueuedAbility(classId);
      return;
    }

    // Toggle off if same ability is pending targeting
    if (pendingAbility?.classId === classId) {
      store.clearAbility();
      return;
    }

    store.selectAbility(classId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Auto-queue non-single-target abilities without needing a target tap
    if (ability.effect.type !== 'single_target_damage') {
      store.queueAbility(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, []);

  const handleCancelAbility = useCallback(() => {
    useStore.getState().clearAbility();
  }, []);

  const handleCancelQueuedAbility = useCallback((classId) => {
    useStore.getState().cancelQueuedAbility(classId);
  }, []);

  const handleRoll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    useStore.getState().rollDice();
  }, []);

  const handleReroll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    useStore.getState().rerollDice();
  }, []);

  const handleActionPress = useCallback(() => {
    const store = useStore.getState();
    const { phase } = store.combat;
    if (phase === 'roll' || phase === 'targeting') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      store.confirmAllAttacks();
    } else if (phase === 'victory' || phase === 'defeat') {
      exitBattle();
      onExit();
    }
  }, [exitBattle, onExit]);

  const handleLastDieLocked = useCallback(() => {
    useStore.getState().finishRolling();
  }, []);

  const handleUnitMeasure = useCallback((unitId, coords) => {
    setUnitCoords((prev) => {
      if (prev[unitId]?.x === coords.x && prev[unitId]?.y === coords.y) return prev;
      return { ...prev, [unitId]: coords };
    });
  }, []);

  const {
    friendly, hostile, dice, phase, rerollsRemaining,
    selectedFriendlyId, rolling, round, cyberPool, maxCyberPool, squadBuffs,
    pendingAttacks, outcome, damageDealt, attacksLanded,
  } = combat;

  const survivors = friendly.filter((u) => u.hp.current > 0).length;
  const stats = { round, damageDealt, attacksLanded, survivors, total: friendly.length };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <PhaseBanner
        phase={phase}
        round={round}
        friendly={friendly}
        rerollsRemaining={rerollsRemaining}
        pendingAbility={pendingAbility}
        onCancelAbility={handleCancelAbility}
      />

      <DiceHub
        dice={dice}
        friendly={friendly}
        rolling={rolling}
        phase={phase}
        onLastDieLocked={handleLastDieLocked}
      />

      <TacticalField
        friendly={friendly}
        hostile={hostile}
        selectedFriendlyId={selectedFriendlyId}
        phase={phase}
        pendingAbility={pendingAbility}
        abilityIsSingleTarget={abilityIsSingleTarget}
        abilityAccent={abilityAccent}
        previewByEnemy={previewByEnemy}
        previewByFriendly={previewByFriendly}
        onFriendlyPress={handleFriendlyPress}
        onEnemyPress={handleEnemyPress}
        onUnitMeasure={handleUnitMeasure}
      />

      <BuffChips squadBuffs={squadBuffs} />

      {/* Roll controls — above cyber dock */}
      <CompactRollControls
        combat={combat}
        onRoll={handleRoll}
        onReroll={handleReroll}
      />

      {/* Cyber ability dock */}
      <CyberDock
        friendly={friendly}
        cyberPool={cyberPool}
        pendingAbility={pendingAbility}
        pendingAttacks={pendingAttacks}
        phase={phase}
        onAbilityPress={handleAbilityPress}
        onCancelAbility={handleCancelQueuedAbility}
      />

      {/* Cyber Pool bar */}
      <CyberPool current={cyberPool} maxPool={maxCyberPool} />

      {/* Main action button */}
      <ActionButton combat={combat} onPress={handleActionPress} />

      {/* Round info strip */}
      <RoundInfo round={round} friendly={friendly} />

      <NoiseTexture />
      <ScanlineOverlay />

      <TargetingOverlay unitCoords={unitCoords} />
      <BattleOutcomeOverlay outcome={outcome} stats={stats} onExit={handleExit} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

const hub = StyleSheet.create({
  wrap: {
    margin: 12,
    borderWidth: 1,
    borderColor: `${CYAN}77`,
    backgroundColor: colors.surfaceContainer,
    padding: 12,
    gap: 10,
  },
  tick: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: CYAN,
  },
  tl: { top: -1, left: -1,   borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: -1, right: -1,  borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: -1, left: -1,  borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: CYAN,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

const tac = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: `${colors.outline}22`,
  },
  col: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 4,
    gap: 2,
    borderRightWidth: 1,
    borderRightColor: `${colors.outline}1A`,
  },
  colRight: {
    borderRightWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: `${colors.outline}1A`,
    alignItems: 'flex-end',
  },
  sideLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  sideLabelRight: {
    justifyContent: 'flex-end',
  },
  sideLine: {
    width: 3,
    height: 10,
  },
  sideLabelText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

const buff = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: `${MAG}66`,
    backgroundColor: `${MAG}12`,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 7,
    color: MAG,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
