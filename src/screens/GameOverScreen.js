import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../store/index';
import { colors } from '../theme/colors';

export default function GameOverScreen({ onRestart }) {
  const gameOverReason = useStore((s) => s.world.gameOverReason);
  const character      = useStore((s) => s.character);
  const members        = useStore((s) => s.crew.members);
  const selectedTitle  = useStore((s) => s.achievements.account.selectedTitle);

  const player = members.find((m) => m.isPlayer);

  const glitchX  = useSharedValue(0);
  const pulseOp  = useSharedValue(0.4);
  const scanY    = useSharedValue(0);

  useEffect(() => {
    glitchX.value = withRepeat(
      withSequence(
        withTiming(0,  { duration: 1800 }),
        withTiming(6,  { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(2,  { duration: 50 }),
        withTiming(0,  { duration: 80 }),
      ),
      -1,
    );
    pulseOp.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    scanY.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
    );
  }, []);

  const glitchStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glitchX.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOp.value }));
  const scanStyle  = useAnimatedStyle(() => ({
    transform: [{ translateY: (scanY.value * 500) % 500 }],
    opacity: 0.04,
  }));

  return (
    <View style={styles.root}>
      {/* Scan sweep */}
      <Animated.View style={[styles.scanStrip, scanStyle]} pointerEvents="none" />

      {/* Red corner brackets */}
      <View style={[styles.bracket, styles.bTL]} />
      <View style={[styles.bracket, styles.bTR]} />
      <View style={[styles.bracket, styles.bBL]} />
      <View style={[styles.bracket, styles.bBR]} />

      <View style={styles.content}>
        {/* Icon */}
        <Animated.View style={pulseStyle}>
          <MaterialIcons name="warning" size={48} color={colors.error} />
        </Animated.View>

        {/* FLATLINE header */}
        <Animated.Text style={[styles.headline, glitchStyle]} numberOfLines={1} adjustsFontSizeToFit>
          FLATLINE
        </Animated.Text>

        <View style={styles.divider} />

        <Text style={styles.reasonLabel}>CAUSE_OF_DEATH</Text>
        <Text style={styles.reason}>{gameOverReason ?? 'UNKNOWN_PROTOCOL'}</Text>

        <View style={styles.statsBlock}>
          {character.name && (
            <Text style={styles.statLine}>{`OPERATOR: ${character.name}`}</Text>
          )}
          {selectedTitle && (
            <Text style={styles.statLine}>{`TITLE: ${selectedTitle}`}</Text>
          )}
          {player && (
            <Text style={styles.statLine}>{`LEVEL: ${player.level ?? 1}`}</Text>
          )}
          {character.turnNumber !== undefined && (
            <Text style={styles.statLine}>{`CYCLES_SURVIVED: ${character.turnNumber}`}</Text>
          )}
        </View>

        <View style={styles.divider} />

        <Text style={styles.flavorText}>
          {'NEURAL SIGNAL LOST.\nIDENTITY CONSTRUCT UNRECOVERABLE.\nFORMATTING MEMORY BLOCK...'}
        </Text>

        <TouchableOpacity style={styles.restartBtn} onPress={onRestart} activeOpacity={0.8}>
          <Text style={styles.restartBtnText}>[ INITIATE_NEW_RUN ]</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: colors.error,
    top: -80,
  },
  bracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.error,
  },
  bTL: { top: 24, left: 24, borderTopWidth: 2, borderLeftWidth: 2 },
  bTR: { top: 24, right: 24, borderTopWidth: 2, borderRightWidth: 2 },
  bBL: { bottom: 24, left: 24, borderBottomWidth: 2, borderLeftWidth: 2 },
  bBR: { bottom: 24, right: 24, borderBottomWidth: 2, borderRightWidth: 2 },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  headline: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 52,
    color: colors.error,
    letterSpacing: 8,
    textTransform: 'uppercase',
    textShadowColor: `${colors.error}88`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: `${colors.error}33`,
  },
  reasonLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: `${colors.error}66`,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  reason: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 18,
    color: colors.error,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: -8,
  },
  statsBlock: {
    alignSelf: 'stretch',
    backgroundColor: `${colors.error}08`,
    borderWidth: 1,
    borderColor: `${colors.error}22`,
    padding: 14,
    gap: 6,
  },
  statLine: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: `${colors.error}AA`,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  flavorText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: `${colors.error}55`,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 16,
  },
  restartBtn: {
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.error,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: `${colors.error}10`,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  restartBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    color: colors.error,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
