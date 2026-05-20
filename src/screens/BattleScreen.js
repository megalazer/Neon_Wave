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
import TargetingOverlay from '../components/battle/TargetingOverlay';
import BattleOutcomeOverlay from '../components/battle/BattleOutcomeOverlay';

const CYAN = colors.primary;
const MAG  = colors.secondaryContainer;
const RED  = colors.error;

// Each die locks in sequence; index 3 is always last
const LOCK_DELAYS = [600, 800, 1000, 1200];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Dice Hub ─────────────────────────────────────────────────────────────────
function DiceHub({ dice, friendly, rolling, selectedDieIndex, onDiePress, onLastDieLocked, onDieMeasure }) {
  return (
    <View style={hub.wrap}>
      <View style={[hub.tick, hub.tl]} /><View style={[hub.tick, hub.tr]} />
      <View style={[hub.tick, hub.bl]} /><View style={[hub.tick, hub.br]} />

      <Text style={hub.label}>NEURAL_DICE // ACT_READY</Text>

      <View style={hub.row}>
        {dice.map((die, i) => {
          const owner = friendly.find((u) => u.id === die.ownerId);
          return (
            <Die
              key={i}
              value={die.value}
              isRolling={rolling}
              lockDelay={LOCK_DELAYS[i]}
              onLocked={i === dice.length - 1 ? onLastDieLocked : undefined}
              ownerName={owner?.name ?? ''}
              isSelected={selectedDieIndex === i}
              assigned={die.assigned}
              alive={die.alive}
              onPress={() => onDiePress(i)}
              onMeasure={(coords) => onDieMeasure(i, coords)}
            />
          );
        })}
      </View>
    </View>
  );
}

// ── Tactical Field ────────────────────────────────────────────────────────────
function TacticalField({ friendly, hostile, previewByEnemy, onEnemyPress, onFriendlyMeasure, onHostileMeasure }) {
  return (
    <View style={tac.wrap}>
      {/* Friendly column */}
      <View style={tac.col}>
        <View style={tac.sideLabel}>
          <View style={[tac.sideLine, { backgroundColor: CYAN }]} />
          <Text style={[tac.sideLabelText, { color: CYAN }]}>FRIENDLY_UNITS</Text>
        </View>
        {friendly.map((u) => (
          <UnitCard
            key={u.id}
            unit={u}
            variant="friendly"
            onMeasure={(coords) => onFriendlyMeasure(u.id, coords)}
          />
        ))}
      </View>

      {/* Hostile column */}
      <View style={[tac.col, tac.colRight]}>
        <View style={[tac.sideLabel, tac.sideLabelRight]}>
          <Text style={[tac.sideLabelText, { color: RED }]}>HOSTILE_OPERATIVES</Text>
          <View style={[tac.sideLine, { backgroundColor: RED }]} />
        </View>
        {hostile.map((u) => (
          <UnitCard
            key={u.id}
            unit={u}
            variant="hostile"
            onPress={() => onEnemyPress(u.id)}
            previewDamage={previewByEnemy[u.id] || 0}
            onMeasure={(coords) => onHostileMeasure(u.id, coords)}
          />
        ))}
      </View>
    </View>
  );
}

// ── Main BattleScreen ─────────────────────────────────────────────────────────
export default function BattleScreen({ onExit }) {
  const combat = useStore((s) => s.combat);
  const exitBattle = useStore((s) => s.exitBattle);

  const [diceCoords, setDiceCoords] = useState({});
  const [unitCoords, setUnitCoords]  = useState({});

  // ── Coordinate-driven targeting lines ──
  const lines = useMemo(() => {
    const result = [];
    for (const a of combat.playerAssignments) {
      const src = diceCoords[a.dieIndex];
      const dst = unitCoords[a.targetId];
      if (src && dst) result.push({ x1: src.x, y1: src.y, x2: dst.x, y2: dst.y, type: 'player' });
    }
    for (const a of combat.enemyAssignments) {
      const src = unitCoords[a.enemyId];
      const dst = unitCoords[a.targetId];
      if (src && dst) result.push({ x1: src.x, y1: src.y, x2: dst.x, y2: dst.y, type: 'enemy' });
    }
    return result;
  }, [combat.playerAssignments, combat.enemyAssignments, diceCoords, unitCoords]);

  // ── Damage previews on enemy HP bars ──
  const previewByEnemy = useMemo(() => {
    const map = {};
    for (const a of combat.playerAssignments) {
      map[a.targetId] = (map[a.targetId] || 0) + a.damage;
    }
    return map;
  }, [combat.playerAssignments]);

  // ── Executing phase: sequential player hits ──
  useEffect(() => {
    if (combat.phase !== 'executing') return;
    let cancelled = false;

    (async () => {
      const { playerAssignments } = useStore.getState().combat;
      await delay(200);

      for (const a of playerAssignments) {
        if (cancelled) return;
        useStore.getState().applyPlayerHit(a.dieIndex);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await delay(380);
      }

      if (cancelled) return;
      const latest = useStore.getState().combat;
      if (latest.hostile.every((u) => u.hp.current === 0)) {
        useStore.getState().checkAndSetOutcome();
      } else {
        await delay(280);
        if (!cancelled) useStore.getState().beginEnemyTurn();
      }
    })();

    return () => { cancelled = true; };
  }, [combat.phase]);

  // ── Enemy turn: sequential enemy hits ──
  useEffect(() => {
    if (combat.phase !== 'enemy_turn') return;
    let cancelled = false;

    (async () => {
      const { enemyAssignments } = useStore.getState().combat;
      await delay(350);

      for (const a of enemyAssignments) {
        if (cancelled) return;
        useStore.getState().applyEnemyHit(a.enemyId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await delay(460);
      }

      if (cancelled) return;
      await delay(400);
      if (!cancelled) useStore.getState().endEnemyTurn();
    })();

    return () => { cancelled = true; };
  }, [combat.phase]);

  // ── Handlers ──

  const handleDiePress = useCallback((index) => {
    const store = useStore.getState();
    const { phase, selectedDieIndex, dice } = store.combat;
    if (phase !== 'targeting') return;
    const die = dice[index];
    if (!die?.alive) return;

    if (die.assigned !== null) {
      // Tap assigned die → clear it and reselect for retargeting
      store.clearAssignment(index);
      store.selectDie(index);
    } else {
      // Tap unselected/selected → toggle selection
      store.selectDie(index);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleEnemyPress = useCallback((unitId) => {
    const store = useStore.getState();
    const { phase, selectedDieIndex } = store.combat;
    if (phase !== 'targeting' || selectedDieIndex === null) return;
    store.assignDie(selectedDieIndex, unitId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleActionPress = useCallback(() => {
    const store = useStore.getState();
    const { phase, rerollsRemaining, dice, playerAssignments } = store.combat;
    const aliveDice   = dice.filter((d) => d.alive);
    const allAssigned = aliveDice.length > 0 && aliveDice.every((d) => d.assigned !== null);

    if (phase === 'roll') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      store.rollDice();
    } else if (phase === 'targeting') {
      if (!allAssigned && rerollsRemaining > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        store.rerollDice();
      } else if (playerAssignments.length > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        store.lockInAttacks();
      }
    } else if (phase === 'victory' || phase === 'defeat') {
      handleExit();
    }
  }, []);

  const handleLastDieLocked = useCallback(() => {
    useStore.getState().finishRolling();
  }, []);

  const handleExit = useCallback(() => {
    exitBattle();
    onExit();
  }, [exitBattle, onExit]);

  const handleDieMeasure = useCallback((index, coords) => {
    setDiceCoords((prev) => {
      if (prev[index]?.x === coords.x && prev[index]?.y === coords.y) return prev;
      return { ...prev, [index]: coords };
    });
  }, []);

  const handleFriendlyMeasure = useCallback((unitId, coords) => {
    setUnitCoords((prev) => {
      if (prev[unitId]?.x === coords.x && prev[unitId]?.y === coords.y) return prev;
      return { ...prev, [unitId]: coords };
    });
  }, []);

  const handleHostileMeasure = useCallback((unitId, coords) => {
    setUnitCoords((prev) => {
      if (prev[unitId]?.x === coords.x && prev[unitId]?.y === coords.y) return prev;
      return { ...prev, [unitId]: coords };
    });
  }, []);

  const { friendly, hostile, dice, phase, rerollsRemaining, selectedDieIndex, rolling, round, outcome, damageDealt, attacksLanded } = combat;

  const survivors = friendly.filter((u) => u.hp.current > 0).length;
  const stats = {
    round,
    damageDealt,
    cyberSpent: attacksLanded,
    survivors,
    total: friendly.length,
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <PhaseBanner
        phase={phase}
        round={round}
        friendly={friendly}
        rerollsRemaining={rerollsRemaining}
      />

      <DiceHub
        dice={dice}
        friendly={friendly}
        rolling={rolling}
        selectedDieIndex={selectedDieIndex}
        onDiePress={handleDiePress}
        onLastDieLocked={handleLastDieLocked}
        onDieMeasure={handleDieMeasure}
      />

      <TacticalField
        friendly={friendly}
        hostile={hostile}
        previewByEnemy={previewByEnemy}
        onEnemyPress={handleEnemyPress}
        onFriendlyMeasure={handleFriendlyMeasure}
        onHostileMeasure={handleHostileMeasure}
      />

      <ActionButton combat={combat} onPress={handleActionPress} />

      <NoiseTexture />
      <ScanlineOverlay />

      {/* Coordinate-driven targeting lines — over everything, no pointer events */}
      <TargetingOverlay lines={lines} phase={phase} />

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
