import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useStore } from '../../store/index';

const CYAN = colors.primary;
const RED  = colors.error;

// Floating "-N" damage number — mounts, rises, fades; parent prunes it after
// the animation window. Anchored just above the HP bar so the card's
// overflow:hidden never clips it.
function DamageFloater({ amount, isFriendly, color }) {
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - anim.value,
    transform: [{ translateY: -14 * anim.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.floater, isFriendly ? styles.floaterRight : styles.floaterLeft, style]}
    >
      <Text style={[styles.floaterText, { color, textShadowColor: color }]}>
        -{amount}
      </Text>
    </Animated.View>
  );
}

export default function UnitCard({
  unit,
  variant = 'friendly',
  onPress,
  previewDamage = 0,
  onMeasure,
  isSelected = false,
  isPulsing = false,
  pulseColor = CYAN,
}) {
  const isFriendly = variant === 'friendly';

  const hpCurrent = unit?.hp?.current ?? 0;
  const hpMax     = unit?.hp?.max     ?? 1;
  const isDead    = hpCurrent <= 0;
  const accent    = isFriendly ? CYAN : RED;
  // Preview color is inverse of fill: red incoming on friendlies, cyan incoming on enemies.
  const previewColor = isFriendly ? RED : CYAN;
  const hpPct     = Math.max(0, Math.min(1, hpCurrent / hpMax));

  // Snapshot for this unit: populated at confirm/enemy-assign time so preview chunks
  // don't recalculate while HP mutates during sequential execution.
  const executingPreviews = useStore((s) => s.combat.executingPreviews);
  const snapshot  = executingPreviews?.[unit?.id];
  const hasSnapshot = !!snapshot;

  // Use a ref so the hpPct effect reads current value without re-registering.
  const hasSnapshotRef = useRef(hasSnapshot);
  hasSnapshotRef.current = hasSnapshot;

  const hpAnim    = useSharedValue(hpPct);
  const previewOp = useSharedValue(0.55);
  const flashOp   = useSharedValue(0);

  const cardRef              = useRef(null);
  const prevHpPctRef         = useRef(hpPct);
  const frozenTimeoutRef     = useRef(null);
  const floaterIdRef         = useRef(0);
  const [frozenPreview, setFrozenPreview] = useState(null);
  const [floaters, setFloaters] = useState([]);

  // ── Death punctuation ──
  const prevIsDeadRef = useRef(false);
  const deathFlicker  = useSharedValue(0);
  const [showTerminated, setShowTerminated] = useState(false);

  // ── Dice assignment chips (hostile cards only, targeting phase) ──
  const combatDice  = useStore((s) => s.combat.dice);
  const combatPhase = useStore((s) => s.combat.phase);
  const assignedDice = !isFriendly && combatPhase === 'targeting'
    ? combatDice.filter((d) => d.alive && d.spent && d.assignedTo === unit?.id)
    : [];

  // ── Enemy intent LOCK (friendly cards only, enemy_turn phase) ──
  const enemyAssignments = useStore((s) => s.combat.enemyAssignments);
  const isLockedByEnemy = isFriendly && combatPhase === 'enemy_turn'
    && enemyAssignments.some((a) => a.targetId === unit?.id);
  // Animate HP fill. Flash on every HP drop. Only show frozenPreview when there
  // is no snapshot — during execution/enemy_turn the snapshot handles the visual.
  useEffect(() => {
    const prevHp = prevHpPctRef.current;
    prevHpPctRef.current = hpPct;

    if (hpPct < prevHp - 0.001) {
      // Brief white flash gives per-hit visual punctuation regardless of phase.
      flashOp.value = 0.9;
      flashOp.value = withTiming(0, { duration: 200 });

      // Floating damage number — exact hit size, capped at 3 concurrent.
      const dmgAmount = Math.max(1, Math.round((prevHp - hpPct) * hpMax));
      const fid = ++floaterIdRef.current;
      setFloaters((f) => [...f.slice(-2), { id: fid, amount: dmgAmount }]);
      setTimeout(() => {
        setFloaters((f) => f.filter((x) => x.id !== fid));
      }, 700);

      // frozenPreview is only needed outside snapshot execution — it bridges the
      // gap between HP landing and the fill catching up in non-snapshot phases.
      if (!hasSnapshotRef.current) {
        const damagePct = (prevHp - hpPct) * 100;
        if (frozenTimeoutRef.current) clearTimeout(frozenTimeoutRef.current);
        setFrozenPreview({ left: hpPct * 100, width: damagePct });
        frozenTimeoutRef.current = setTimeout(() => setFrozenPreview(null), 420);
      }
    }

    hpAnim.value = withTiming(hpPct, { duration: 350, easing: Easing.out(Easing.quad) });
  }, [hpPct]);

  // ── Death punctuation: glitch flicker + [TERMINATED] stamp on death transition ──
  useEffect(() => {
    const wasDead = prevIsDeadRef.current;
    prevIsDeadRef.current = isDead;
    if (isDead && !wasDead) {
      setShowTerminated(true);
      deathFlicker.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 30 }),
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 30 }),
        withTiming(1, { duration: 60 }),
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 40 }),
        withTiming(0, { duration: 100 }),
      );
    }
  }, [isDead]);

  // Preview opacity: pulse during targeting (previewDamage > 0, no snapshot),
  // hold static at 0.7 during execution (snapshot present), fade out otherwise.
  useEffect(() => {
    if (hasSnapshot) {
      previewOp.value = withTiming(0.7, { duration: 100 });
    } else if (previewDamage > 0) {
      previewOp.value = withRepeat(withTiming(0.8, { duration: 800 }), -1, true);
    } else {
      previewOp.value = 0.55;
    }
  }, [previewDamage > 0, hasSnapshot]);

  const barStyle = useAnimatedStyle(() => {
    const pct = Math.max(0, Math.min(100, hpAnim.value * 100));
    return { width: `${pct}%` };
  });

  const previewOpAnim   = useAnimatedStyle(() => ({ opacity: previewOp.value }));
  const flashStyle      = useAnimatedStyle(() => ({ opacity: flashOp.value }));
  const deathFlickerAnim = useAnimatedStyle(() => ({ opacity: deathFlicker.value }));

  const handleCardLayout = useCallback(() => {
    if (!cardRef.current || !onMeasure) return;
    cardRef.current.measureInWindow((x, y, w, h) => {
      onMeasure({ x: x + w / 2, y: y + h / 2 });
    });
  }, [onMeasure]);

  // Preview anchor: use frozen snapshot during execution so position never moves.
  // During targeting, anchor at live hpCurrent so preview tracks reality.
  const previewAnchorHp   = hasSnapshot ? snapshot.hpAtCommit : hpCurrent;
  const previewTotalDmg   = hasSnapshot ? snapshot.totalDamage : previewDamage;
  const previewMaxHp      = hasSnapshot ? snapshot.maxHp : hpMax;

  const staticPreviewVisible = previewTotalDmg > 0 && !frozenPreview;
  const staticPreviewLeft  = previewMaxHp > 0
    ? Math.max(0, ((previewAnchorHp - Math.min(previewTotalDmg, previewAnchorHp)) / previewMaxHp) * 100)
    : 0;
  const staticPreviewWidth = previewMaxHp > 0
    ? (Math.min(previewTotalDmg, previewAnchorHp) / previewMaxHp) * 100
    : 0;

  const portrait = (
    <View style={[styles.portrait, { borderColor: isDead ? `${accent}44` : accent }]}>
      <MaterialIcons
        name="person"
        size={20}
        color={isDead ? `${accent}44` : `${accent}CC`}
      />
    </View>
  );

  const inner = (
    <View
      ref={cardRef}
      onLayout={handleCardLayout}
      style={[
        styles.card,
        isFriendly ? styles.cardFriendly : styles.cardHostile,
        {
          borderLeftColor:  isFriendly ? accent : 'transparent',
          borderRightColor: !isFriendly ? accent : 'transparent',
        },
        isDead && styles.cardDead,
      ]}
    >
      <View style={[styles.row, isFriendly ? styles.rowFriendly : styles.rowHostile]}>
        {isFriendly && portrait}

        <View style={[styles.nameGroup, !isFriendly && styles.nameGroupRight]}>
          <Text style={[styles.name, { color: isDead ? `${RED}AA` : accent }]} numberOfLines={1}>
            {unit.name?.toUpperCase() ?? '???'}
          </Text>
          {unit.level !== undefined && (
            <Text style={[styles.sub, { color: isDead ? `${accent}44` : `${accent}88` }]}>
              LVL_{unit.level} · {hpCurrent}/{hpMax}
            </Text>
          )}
          {unit.threat !== undefined && (
            <Text style={[styles.sub, { color: isDead ? `${RED}44` : `${RED}AA` }]}>
              {String(unit.threat).toUpperCase()} · {hpCurrent}/{hpMax}
            </Text>
          )}
        </View>

        {!isFriendly && portrait}
      </View>

      {/* Dice assignment chips — show which dice are assigned to this hostile */}
      {assignedDice.length > 0 && (
        <View style={styles.diceChipRow}>
          {assignedDice.map((d, i) => (
            <View key={i} style={[styles.dieChip, { borderColor: CYAN }]}>
              <Text style={styles.dieChipText}>{d.value}</Text>
            </View>
          ))}
        </View>
      )}
      {/* HP bar — four layers: track bg / animated fill / preview overlay / hit flash */}
      <View style={styles.hpBg}>
        {/* Layer 1: animated HP fill */}
        <Animated.View style={[
          styles.hpFill,
          { backgroundColor: isDead ? colors.errorContainer : accent, shadowColor: accent },
          barStyle,
        ]} />

        {/* Layer 2: frozen preview — anchored at pre-damage position, static during animation.
            Only visible outside snapshot phases (non-executing, non-enemy_turn). */}
        {frozenPreview && (
          <View style={[
            styles.previewChunk,
            { left: `${frozenPreview.left}%`, width: `${frozenPreview.width}%`, backgroundColor: previewColor },
          ]} />
        )}

        {/* Layer 3: static preview — anchored at snapshot.hpAtCommit during execution,
            anchored at live hpCurrent during targeting. Pulsing in targeting, static in execution. */}
        {staticPreviewVisible && (
          <Animated.View style={[
            styles.previewChunk,
            previewOpAnim,
            { left: `${staticPreviewLeft}%`, width: `${staticPreviewWidth}%`, backgroundColor: previewColor },
          ]} />
        )}

        {/* Layer 4: per-hit white flash — fires on every HP drop for tactile feedback */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.flashOverlay, flashStyle]}
          pointerEvents="none"
        />
      </View>

      {/* Targetable glow border — static, snaps on/off with selection state */}
      {isPulsing && (
        <View
          style={[StyleSheet.absoluteFill, styles.pulseOverlay, { borderColor: pulseColor, shadowColor: pulseColor }]}
          pointerEvents="none"
        />
      )}

      {/* Selected outline */}
      {isSelected && (
        <View
          style={[StyleSheet.absoluteFill, styles.selectedOutline, { borderColor: accent }]}
          pointerEvents="none"
        />
      )}

      {/* Enemy intent LOCK — pulsing warning when a hostile has targeted this friendly */}
      {isLockedByEnemy && !isDead && (
        <View style={[StyleSheet.absoluteFill, styles.lockOverlay]} pointerEvents="none">
          <View style={[styles.lockBadge, isFriendly ? styles.lockBadgeRight : styles.lockBadgeLeft]}>
            <MaterialIcons name="gps-fixed" size={10} color={RED} />
            <Text style={styles.lockText}>LOCK</Text>
          </View>
        </View>
      )}

      {/* Death punctuation — glitchy [TERMINATED] stamp */}
      {showTerminated && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.terminatedOverlay, deathFlickerAnim]} pointerEvents="none">
          <Text style={styles.terminatedText}>[TERMINATED]</Text>
        </Animated.View>
      )}

      {/* Floating damage numbers — anchored toward screen center so both
          columns read at a glance during exchanges */}
      {floaters.map((f) => (
        <DamageFloater
          key={f.id}
          amount={f.amount}
          isFriendly={isFriendly}
          color={previewColor}
        />
      ))}
    </View>
  );

  if (onPress && !isDead) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={styles.touchWrapper}
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  touchWrapper: {
    alignSelf: 'stretch',
  },
  card: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 5,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    overflow: 'hidden',
  },
  cardFriendly: {
    paddingLeft: 6,
    borderRightWidth: 0,
  },
  cardHostile: {
    paddingRight: 6,
    borderLeftWidth: 0,
    alignItems: 'flex-end',
    alignSelf: 'stretch',
  },
  cardDead: {
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowFriendly: {},
  rowHostile: {
    flexDirection: 'row-reverse',
  },
  portrait: {
    width: 34,
    height: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    flexShrink: 0,
  },
  nameGroup: {
    flex: 1,
  },
  nameGroupRight: {
    alignItems: 'flex-end',
  },
  name: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  sub: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  hpBg: {
    height: 5,
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  hpFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  previewChunk: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    opacity: 0.75,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  flashOverlay: {
    backgroundColor: '#ffffff',
  },
  pulseOverlay: {
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedOutline: {
    borderWidth: 2,
  },
  floater: {
    position: 'absolute',
    bottom: 10,
  },
  floaterRight: {
    right: 8,
  },
  floaterLeft: {
    left: 8,
  },
  floaterText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  // ── Dice assignment chips ──
  diceChipRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
  },
  dieChip: {
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  dieChipText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: CYAN,
  },
  // ── Enemy intent LOCK ──
  lockOverlay: {
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${RED}22`,
    borderWidth: 1,
    borderColor: RED,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  lockBadgeRight: {
    right: 4,
  },
  lockBadgeLeft: {
    left: 4,
  },
  lockText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 7,
    color: RED,
    letterSpacing: 1.5,
  },
  // ── Death punctuation ──
  terminatedOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${RED}18`,
  },
  terminatedText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: RED,
    letterSpacing: 2,
    textShadowColor: RED,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
