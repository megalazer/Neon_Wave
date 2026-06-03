import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/index';
import { ACHIEVEMENTS } from '../data/achievements';
import { colors } from '../theme/colors';

const GREEN = colors.tertiaryFixed; // account accent
const CYAN  = colors.primary;       // run accent
const BANNER_TOP = 90;

function rewardLine(reward) {
  if (!reward) return null;
  if (reward.credits)        return `+${reward.credits.toLocaleString()} CR`;
  if (reward.cyberwareId)    return `CYBERWARE: ${reward.cyberwareId.replace(/^cyb_/, '').toUpperCase()}`;
  if (reward.recruitQuality) return `${reward.recruitQuality.toUpperCase()} RECRUIT INBOUND`;
  return null;
}

export default function AchievementToast() {
  const toastQueue   = useStore((s) => s.achievements.toastQueue);
  const dequeueToast = useStore((s) => s.dequeueToast);

  const [active, setActive] = useState(null); // { id, scope }
  const translateY = useSharedValue(-200);
  const timerRef   = useRef(null);
  const glitchX    = useSharedValue(0);

  // Pull the next toast off the queue when idle
  useEffect(() => {
    if (!active && toastQueue.length > 0) {
      setActive(toastQueue[0]);
    }
  }, [toastQueue, active]);

  // Glitch loop for the header
  useEffect(() => {
    glitchX.value = withRepeat(
      withSequence(
        withTiming(0,  { duration: 1600 }),
        withTiming(3,  { duration: 45 }),
        withTiming(-3, { duration: 45 }),
        withTiming(0,  { duration: 45 }),
      ),
      -1,
    );
  }, []);

  // Animate the active toast in, hold, then out + dequeue
  useEffect(() => {
    if (!active) return;
    const def = ACHIEVEMENTS[active.id];
    const isAccount = active.scope === 'account';

    Haptics.impactAsync(
      isAccount ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light,
    );

    translateY.value = withTiming(0, { duration: 360, easing: Easing.out(Easing.quad) });

    const holdMs = isAccount ? 3500 : 2800;
    timerRef.current = setTimeout(() => {
      translateY.value = withTiming(-200, { duration: 340, easing: Easing.in(Easing.quad) });
      timerRef.current = setTimeout(() => {
        dequeueToast();
        setActive(null);
        timerRef.current = null;
      }, 360);
    }, holdMs);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  const bannerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const glitchStyle = useAnimatedStyle(() => ({ transform: [{ translateX: glitchX.value }] }));

  if (!active) return null;
  const def = ACHIEVEMENTS[active.id];
  if (!def) return null;

  const isAccount = active.scope === 'account';
  const accent    = isAccount ? GREEN : CYAN;
  const header    = isAccount ? '>>> ACCOUNT_ACHIEVEMENT <<<' : '[RUN]';
  // Account achievements grant a permanent perk; run achievements a one-time reward.
  const reward    = isAccount
    ? (def.accountPerk ? `PERK: ${def.accountPerk.description}` : null)
    : rewardLine(def.reward);

  return (
    <Animated.View
      style={[
        styles.banner,
        isAccount ? styles.bannerAccount : styles.bannerRun,
        { borderBottomColor: accent, shadowColor: accent },
        bannerStyle,
      ]}
      pointerEvents="none"
    >
      <View style={[styles.accent, { backgroundColor: accent, shadowColor: accent }]} />

      <View style={styles.body}>
        <Animated.Text style={[styles.header, { color: accent }, isAccount && glitchStyle]}>
          {header}
        </Animated.Text>
        <Text
          style={[styles.name, { color: accent }, isAccount && styles.nameAccount]}
          numberOfLines={1}
        >
          {def.name}
        </Text>
        {isAccount && (
          <Text style={styles.desc} numberOfLines={2}>{def.description}</Text>
        )}
        {reward && (
          <View style={[styles.rewardChip, { borderColor: `${accent}66` }]}>
            <Text style={[styles.rewardText, { color: accent }]}>{reward}</Text>
          </View>
        )}
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
    zIndex: 600,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 24,
  },
  bannerAccount: {
    shadowOpacity: 0.6,
  },
  bannerRun: {
    shadowOpacity: 0.4,
    marginHorizontal: 0,
  },
  accent: {
    width: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  body: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 3,
  },
  header: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  nameAccount: {
    fontSize: 16,
    textShadowColor: `${GREEN}88`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  desc: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rewardChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
  },
  rewardText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
