import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme/colors';

const CYAN = colors.primary;
const RED  = colors.error;

export default function BattleOutcomeOverlay({ outcome, stats, onExit }) {
  // Hooks must come before any early return
  const isVictory = outcome === 'victory';
  const accent = isVictory ? CYAN : RED;

  const glitchX = useSharedValue(0);

  useEffect(() => {
    if (!outcome) return;
    glitchX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1800 }),
        withTiming(3, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      ),
      -1,
    );
  }, [outcome]);

  const glitchStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glitchX.value }],
  }));

  if (!outcome) return null;

  const title = isVictory ? '>>> MISSION_COMPLETE <<<' : '>>> SQUAD_FLATLINED <<<';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />

      <View style={styles.center}>
        <View style={[styles.panel, { borderColor: accent, shadowColor: accent }]}>
          <Animated.Text style={[styles.title, { color: accent }, glitchStyle]}>
            {title}
          </Animated.Text>

          <View style={styles.stats}>
            <StatRow label="ROUNDS_COMPLETED" value={stats?.round ?? 0} accent={accent} />
            <StatRow label="DAMAGE_DEALT" value={stats?.damageDealt ?? 0} accent={accent} />
            <StatRow label="HITS_LANDED" value={stats?.attacksLanded ?? 0} accent={accent} />
            <StatRow label="SURVIVORS" value={`${stats?.survivors ?? 0} / ${stats?.total ?? 0}`} accent={accent} />
          </View>

          <TouchableOpacity style={[styles.exitBtn, { borderColor: accent }]} onPress={onExit} activeOpacity={0.8}>
            <Text style={[styles.exitBtnText, { color: accent }]}>[EXIT_BATTLE]</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function StatRow({ label, value, accent }) {
  return (
    <View style={sr.row}>
      <Text style={sr.label}>{label}</Text>
      <Text style={[sr.value, { color: accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 2,
    padding: 24,
    gap: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  stats: {
    gap: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: `${colors.outline}33`,
    paddingVertical: 14,
  },
  exitBtn: {
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exitBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
