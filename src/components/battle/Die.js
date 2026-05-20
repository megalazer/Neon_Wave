import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const CYAN = colors.primary;
const MAG  = colors.secondaryContainer;
const DSIZE = 52;

export default function Die({
  value,
  isRolling,
  lockDelay = 600,
  onLocked,
  ownerName,
  isSelected = false,
  assigned = null,
  alive = true,
  onPress,
  onMeasure,
}) {
  const [display, setDisplay] = useState(value);
  const intervalRef = useRef(null);
  const lockedRef  = useRef(false);
  const viewRef    = useRef(null);

  const shakeX = useSharedValue(0);
  useEffect(() => {
    shakeX.value = withRepeat(
      withSequence(
        withDelay(2800, withTiming(0, { duration: 0 })),
        withTiming(2, { duration: 60 }),
        withTiming(-2, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      ),
      -1,
    );
  }, []);

  useEffect(() => {
    if (!isRolling) {
      setDisplay(alive ? value : 0);
      lockedRef.current = false;
      return;
    }

    lockedRef.current = false;
    const start = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      if (!lockedRef.current && elapsed >= lockDelay) {
        lockedRef.current = true;
        setDisplay(alive ? value : 0);
        clearInterval(intervalRef.current);
        onLocked?.();
      } else if (!lockedRef.current && alive) {
        setDisplay(Math.floor(Math.random() * 10) + 1);
      } else if (!lockedRef.current && !alive) {
        // Dead die: still needs to call onLocked after lockDelay but doesn't cycle
        if (elapsed >= lockDelay) {
          lockedRef.current = true;
          clearInterval(intervalRef.current);
          onLocked?.();
        }
      }
    }, 80);

    return () => clearInterval(intervalRef.current);
  }, [isRolling, value, lockDelay, alive]);

  const handleLayout = useCallback(() => {
    if (!viewRef.current || !onMeasure) return;
    viewRef.current.measureInWindow((x, y, w, h) => {
      onMeasure({ x: x + w / 2, y: y + h / 2 });
    });
  }, [onMeasure]);

  const cyanLayerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  const magLayerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -shakeX.value }],
  }));

  const isDead   = !alive;
  const isEmpty  = display === 0;
  const label    = isEmpty ? '--' : String(display).padStart(2, '0');

  const borderColor  = isSelected ? CYAN : isDead ? `${CYAN}22` : `${CYAN}66`;
  const borderWidth  = isSelected ? 2.5 : 1.5;
  const shadowOp     = isSelected ? 1 : isDead ? 0 : 0.5;
  const bgColor      = isSelected ? `${CYAN}22` : `${CYAN}0D`;

  return (
    <TouchableOpacity
      ref={viewRef}
      onPress={alive && !isRolling ? onPress : undefined}
      onLayout={handleLayout}
      disabled={!alive || isRolling}
      activeOpacity={0.75}
      style={[styles.outer, isDead && styles.outerDead]}
    >
      <View style={[styles.diamond, {
        borderColor,
        borderWidth,
        shadowOpacity: shadowOp,
        backgroundColor: bgColor,
      }]}>
        <View style={styles.numberWrap}>
          <Animated.Text style={[styles.numGhost, { color: MAG, left: 2 }, magLayerStyle]}>
            {label}
          </Animated.Text>
          <Animated.Text style={[styles.numGhost, { color: CYAN, left: -2 }, cyanLayerStyle]}>
            {label}
          </Animated.Text>
          <Text style={[styles.num, (isEmpty || isDead) && styles.numDim]}>{label}</Text>
        </View>
      </View>

      {/* Assigned indicator: small dot on corner of diamond */}
      {assigned && !isDead && (
        <View style={styles.assignedDot} />
      )}

      {/* Owner name below die */}
      {ownerName ? (
        <Text style={[styles.ownerLabel, isDead && styles.ownerLabelDead]} numberOfLines={1}>
          {ownerName.toUpperCase()}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: DSIZE,
    alignItems: 'center',
    gap: 4,
  },
  outerDead: {
    opacity: 0.3,
  },
  diamond: {
    width: DSIZE * 0.72,
    height: DSIZE * 0.72,
    borderWidth: 1.5,
    borderColor: `${CYAN}66`,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: `${CYAN}0D`,
  },
  numberWrap: {
    transform: [{ rotate: '-45deg' }],
    width: 28,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numGhost: {
    position: 'absolute',
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 1,
    opacity: 0.5,
  },
  num: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    color: CYAN,
    letterSpacing: 1,
  },
  numDim: {
    color: `${CYAN}55`,
  },
  assignedDot: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CYAN,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  ownerLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 7,
    color: `${CYAN}88`,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  ownerLabelDead: {
    color: `${CYAN}33`,
  },
});
