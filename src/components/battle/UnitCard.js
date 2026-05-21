import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const CYAN = colors.primary;
const RED  = colors.error;

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

  // Safe-fallback access: hostile units arrive from Immer drafts;
  // current can hit 0 but max must never be 0 or we get NaN width.
  const hpCurrent = unit?.hp?.current ?? 0;
  const hpMax     = unit?.hp?.max     ?? 1;
  const isDead    = hpCurrent <= 0;
  const accent    = isFriendly ? CYAN : RED;
  const hpPct     = Math.max(0, Math.min(1, hpCurrent / hpMax));

  // Initialise to the actual percentage so the bar is correct before onLayout ever fires.
  const hpAnim  = useSharedValue(hpPct);
  const pulseOp = useSharedValue(0);

  const cardRef = useRef(null);

  useEffect(() => {
    hpAnim.value = withTiming(hpPct, {
      duration: 350,
      easing: Easing.out(Easing.quad),
    });
  }, [hpPct]);

  useEffect(() => {
    if (isPulsing) {
      pulseOp.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 500 }),
          withTiming(0.1, { duration: 500 }),
        ),
        -1,
      );
    } else {
      pulseOp.value = withTiming(0, { duration: 160 });
    }
  }, [isPulsing]);

  // Percentage-based width — no barWidthSV, no onLayout dependency, never collapses.
  const barStyle = useAnimatedStyle(() => {
    const pct = Math.max(0, Math.min(100, hpAnim.value * 100));
    return { width: `${pct}%` };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOp.value,
  }));

  const handleCardLayout = useCallback(() => {
    if (!cardRef.current || !onMeasure) return;
    cardRef.current.measureInWindow((x, y, w, h) => {
      onMeasure({ x: x + w / 2, y: y + h / 2 });
    });
  }, [onMeasure]);

  // Preview chunk — percentage positioning so it tracks the fill correctly.
  const previewPct = (hpMax > 0 && !isDead)
    ? (Math.min(previewDamage, hpCurrent) / hpMax) * 100
    : 0;
  const previewLeftPct = Math.max(0, hpPct * 100 - previewPct);

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
              LVL_{unit.level}
            </Text>
          )}
          {unit.threat !== undefined && (
            <Text style={[styles.sub, { color: isDead ? `${RED}44` : `${RED}AA` }]}>
              {unit.threat}
            </Text>
          )}
        </View>

        {!isFriendly && portrait}
      </View>

      {/* HP bar — always renders, always stretches full card width */}
      <View style={styles.hpBg}>
        <Animated.View style={[
          styles.hpFill,
          { backgroundColor: isDead ? colors.errorContainer : accent, shadowColor: accent },
          barStyle,
        ]} />

        {previewPct > 0 && (
          <View style={[
            styles.previewChunk,
            { left: `${previewLeftPct}%`, width: `${previewPct}%` },
          ]} />
        )}
      </View>

      {/* Pulse glow border overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.pulseOverlay, { borderColor: pulseColor }, pulseStyle]}
        pointerEvents="none"
      />

      {/* Selected outline */}
      {isSelected && (
        <View
          style={[StyleSheet.absoluteFill, styles.selectedOutline, { borderColor: accent }]}
          pointerEvents="none"
        />
      )}
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
  // Wrapper applied to TouchableOpacity so hostile column width is honoured
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
    // Right-align name/portrait content, but card itself stretches to column width
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
    // Stretch overrides alignItems: 'flex-end' on cardHostile so bar fills full width
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
    backgroundColor: CYAN,
    opacity: 0.75,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  pulseOverlay: {
    borderWidth: 2,
  },
  selectedOutline: {
    borderWidth: 2,
  },
});
