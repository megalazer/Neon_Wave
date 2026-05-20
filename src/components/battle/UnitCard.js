import React, { useEffect, useRef, useCallback, useState } from 'react';
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
  const isDead     = unit.hp.current === 0;
  const accent     = isFriendly ? CYAN : RED;

  const hpPct      = unit.hp.max > 0 ? unit.hp.current / unit.hp.max : 0;
  const hpAnim     = useSharedValue(hpPct);
  const barWidthSV = useSharedValue(0);
  const [barPxWidth, setBarPxWidth] = useState(0);

  const pulseOp = useSharedValue(0);

  const cardRef = useRef(null);

  useEffect(() => {
    hpAnim.value = withTiming(Math.max(0, Math.min(1, hpPct)), {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
  }, [hpPct]);

  useEffect(() => {
    if (isPulsing) {
      pulseOp.value = withRepeat(
        withSequence(
          withTiming(0.75, { duration: 550 }),
          withTiming(0.15, { duration: 550 }),
        ),
        -1,
      );
    } else {
      pulseOp.value = withTiming(0, { duration: 180 });
    }
  }, [isPulsing]);

  const barStyle = useAnimatedStyle(() => ({
    width: hpAnim.value * barWidthSV.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOp.value,
  }));

  const handleBarLayout = useCallback((e) => {
    const w = e.nativeEvent.layout.width;
    barWidthSV.value = w;
    setBarPxWidth(w);
  }, []);

  const handleCardLayout = useCallback(() => {
    if (!cardRef.current || !onMeasure) return;
    cardRef.current.measureInWindow((x, y, w, h) => {
      onMeasure({ x: x + w / 2, y: y + h / 2 });
    });
  }, [onMeasure]);

  const previewPx = (barPxWidth > 0 && unit.hp.max > 0 && !isDead)
    ? (Math.min(previewDamage, unit.hp.current) / unit.hp.max) * barPxWidth
    : 0;
  const previewLeft = Math.max(0, hpPct * barPxWidth - previewPx);

  // Selected friendly: brighter accent border
  const selectedBorderColor = isSelected ? accent : 'transparent';

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
            {unit.name.toUpperCase()}
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

      {/* HP bar — alignSelf: stretch fixes zero-width bug on hostile cards */}
      <View style={[styles.hpBg, { alignSelf: 'stretch' }]} onLayout={handleBarLayout}>
        <Animated.View style={[
          styles.hpFill,
          { backgroundColor: isDead ? colors.errorContainer : accent, shadowColor: accent },
          barStyle,
        ]} />

        {previewPx > 0 && (
          <View style={[styles.previewChunk, { width: previewPx, left: previewLeft }]} />
        )}
      </View>

      {/* Pulse glow overlay — pointer-events none */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.pulseOverlay, { borderColor: pulseColor }, pulseStyle]}
        pointerEvents="none"
      />

      {/* Selected outline — always visible at full opacity when selected */}
      {isSelected && (
        <View style={[StyleSheet.absoluteFill, styles.selectedOutline, { borderColor: selectedBorderColor }]} pointerEvents="none" />
      )}
    </View>
  );

  if (onPress && !isDead) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {inner}
      </TouchableOpacity>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
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
