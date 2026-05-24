import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CYBER_ABILITIES } from '../../data/cyberAbilities';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const CYAN = colors.primary;
const MAG  = colors.secondaryContainer;
const RED  = colors.error;
const GREEN = '#00E676';

const PHASE_CONFIG = {
  roll:       { label: 'PLAYER_TURN',       sub: '// ROLL_DICE',          color: CYAN },
  targeting:  { label: 'ASSIGN_TARGETS',     sub: '// SELECT_OPERATIVES',  color: CYAN },
  executing:  { label: 'EXECUTING...',       sub: '// APPLYING_DAMAGE',    color: MAG  },
  enemy_turn: { label: 'ENEMY_TURN',         sub: '// HOSTILE_RETALIATION',color: RED  },
  victory:    { label: 'MISSION_COMPLETE',   sub: '// ALL_HOSTILES_DOWN',  color: GREEN },
  defeat:     { label: 'SQUAD_FLATLINED',    sub: '// OPERATIVES_DOWN',    color: RED  },
};

const ACCENT_COLORS = {
  primary:   CYAN,
  secondary: MAG,
  error:     RED,
  tertiary:  '#00E676',
};

export default function PhaseBanner({ phase, round, friendly, rerollsRemaining, pendingAbility, onCancelAbility }) {
  const config = PHASE_CONFIG[phase] || PHASE_CONFIG.roll;
  const accent = config.color;

  const totalCurrent = friendly.reduce((s, u) => s + u.hp.current, 0);
  const totalMax     = friendly.reduce((s, u) => s + u.hp.max, 0);
  const squadPct     = totalMax > 0 ? Math.round((totalCurrent / totalMax) * 100) : 0;

  // Chromatic aberration glitch on the phase label
  const glitchX = useSharedValue(0);
  useEffect(() => {
    glitchX.value = withRepeat(
      withSequence(
        withDelay(2400, withTiming(0, { duration: 0 })),
        withTiming(3, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      ),
      -1,
    );
  }, []);

  const cyanStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glitchX.value }],
  }));
  const magStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -glitchX.value }],
  }));

  const isEnemy = phase === 'enemy_turn';

  const pendingData = pendingAbility
    ? CYBER_ABILITIES[pendingAbility.classId]
    : null;
  const abilityAccent = pendingData
    ? (ACCENT_COLORS[pendingData.accent] ?? CYAN)
    : CYAN;

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: `${accent}66` }}>
      <View style={[
        styles.bar,
        isEnemy && styles.barEnemy,
      ]}>
        {/* Left: phase label with glitch */}
        <View style={styles.labelWrap}>
          <View>
            <Animated.Text style={[styles.labelGhost, { color: MAG, left: 2 }, magStyle]}>
              {config.label}
            </Animated.Text>
            <Animated.Text style={[styles.labelGhost, { color: CYAN, left: -2 }, cyanStyle]}>
              {config.label}
            </Animated.Text>
            <Text style={[styles.label, { color: accent }]}>{config.label}</Text>
          </View>
          <Text style={[styles.sub, { color: `${accent}88` }]}>{config.sub}</Text>
        </View>

        {/* Right: round + squad health */}
        <View style={styles.right}>
          <Text style={[styles.roundLabel, { color: accent }]}>
            ROUND_{String(round).padStart(2, '0')}
          </Text>
          {rerollsRemaining > 0 && phase === 'targeting' && (
            <Text style={[styles.rerollLabel, { color: `${MAG}CC` }]}>
              REROLL: {rerollsRemaining}
            </Text>
          )}
          <Text style={[styles.squadPct, { color: squadPct <= 25 ? RED : squadPct <= 50 ? MAG : `${accent}99` }]}>
            SQUAD: {squadPct}%
          </Text>
        </View>
      </View>

      {/* Ability targeting prompt strip */}
      {pendingData && (
        <TouchableOpacity
          style={[styles.abilityPrompt, { backgroundColor: `${abilityAccent}12`, borderTopColor: `${abilityAccent}40` }]}
          onPress={onCancelAbility}
          activeOpacity={0.75}
        >
          <Text style={[styles.promptText, { color: abilityAccent }]}>
            {`>>> SELECT_TARGET FOR ${pendingData.name} <<<`}
          </Text>
          <Text style={[styles.promptCancel, { color: `${abilityAccent}77` }]}>
            TAP TO CANCEL
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 10,
    backgroundColor: `${colors.surface}F0`,
  },
  barEnemy: {
    backgroundColor: `${RED}18`,
  },
  abilityPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  promptText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  promptCancel: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelWrap: {
    gap: 2,
  },
  labelGhost: {
    position: 'absolute',
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.45,
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sub: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    letterSpacing: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  roundLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  rerollLabel: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    letterSpacing: 1,
  },
  squadPct: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    letterSpacing: 1,
  },
});
