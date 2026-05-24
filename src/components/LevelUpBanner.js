import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence, withDelay, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/index';
import { colors } from '../theme/colors';

const CYAN  = colors.primary;
const GREEN = '#00E676';
const BANNER_TOP = 90; // height of TopBanner

export default function LevelUpBanner() {
  const pending            = useStore((s) => s.world.pendingLevelUp);
  const clearLevelUpBanner = useStore((s) => s.clearLevelUpBanner);

  const translateY = useSharedValue(-160);
  const timerRef   = useRef(null);

  // Glitch on the LEVEL_UP label
  const glitchX = useSharedValue(0);
  useEffect(() => {
    glitchX.value = withRepeat(
      withSequence(
        withDelay(1800, withTiming(0, { duration: 0 })),
        withTiming(3,  { duration: 45 }),
        withTiming(-3, { duration: 45 }),
        withTiming(1,  { duration: 45 }),
        withTiming(0,  { duration: 45 }),
      ),
      -1,
    );
  }, []);

  const glitchStyle   = useAnimatedStyle(() => ({ transform: [{ translateX: glitchX.value }] }));
  const glitchStyleMag = useAnimatedStyle(() => ({ transform: [{ translateX: -glitchX.value }] }));

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (!pending) return;

    // Cancel any in-flight dismiss
    if (timerRef.current) clearTimeout(timerRef.current);

    // Slide in
    translateY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Auto-dismiss after 3 s
    timerRef.current = setTimeout(() => {
      translateY.value = withTiming(-160, { duration: 380, easing: Easing.in(Easing.quad) });
      timerRef.current = setTimeout(() => {
        clearLevelUpBanner();
        timerRef.current = null;
      }, 400);
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pending?.to, pending?.target, pending?.memberName]);

  const subject = pending?.memberName ?? '???';
  const levelStr = pending ? `LVL_${String(pending.to).padStart(2, '0')}` : '';

  return (
    <Animated.View style={[styles.banner, bannerStyle]} pointerEvents="none">
      <View style={styles.accent} />

      <View style={styles.body}>
        {/* Glitching LEVEL_UP label */}
        <View style={styles.tagWrap}>
          <Animated.Text style={[styles.tagGhost, { color: colors.secondaryContainer, left: 2 }, glitchStyleMag]}>
            {'>>> LEVEL_UP <<<'}
          </Animated.Text>
          <Animated.Text style={[styles.tagGhost, { color: CYAN, left: -2 }, glitchStyle]}>
            {'>>> LEVEL_UP <<<'}
          </Animated.Text>
          <Text style={styles.tag}>{'>>> LEVEL_UP <<<'}</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {`${subject.toUpperCase()} REACHED ${levelStr}`}
        </Text>
        <Text style={styles.flavor}>
          Neural calibration updated. New protocols available.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: BANNER_TOP,
    left: 0,
    right: 0,
    zIndex: 500,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2,
    borderBottomColor: CYAN,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
  accent: {
    width: 4,
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  body: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 3,
  },
  tagWrap: {
    position: 'relative',
    height: 18,
    justifyContent: 'center',
  },
  tag: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: GREEN,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tagGhost: {
    position: 'absolute',
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.4,
  },
  title: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    color: CYAN,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textShadowColor: `${CYAN}88`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  flavor: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: `${CYAN}88`,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
