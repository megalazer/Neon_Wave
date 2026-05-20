import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const CYAN  = colors.primary;
const MAG   = colors.secondaryContainer;
const RED   = colors.error;
const GREEN = '#00E676';

const ACCENT_COLORS = {
  primary:   CYAN,
  secondary: MAG,
  error:     RED,
  tertiary:  GREEN,
};

function resolveAccent(accent) {
  return ACCENT_COLORS[accent] ?? CYAN;
}

export default function AbilityButton({ ability, available, cyberPool, isPending, phase, onPress }) {
  const canAct = phase === 'roll' || phase === 'targeting';
  const canAfford = cyberPool >= ability.cyberCost;
  const isActive = available && canAct;

  const pulseOp = useSharedValue(0);

  useEffect(() => {
    if (isPending) {
      pulseOp.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 450 }),
          withTiming(0.35, { duration: 450 }),
        ),
        -1,
      );
    } else {
      pulseOp.value = withTiming(0, { duration: 160 });
    }
  }, [isPending]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: pulseOp.value,
  }));

  const accent = resolveAccent(ability.accent);

  let status;
  if (!available)   status = 'LOCKED';
  else if (!canAct) status = '—';
  else if (!canAfford) status = `NEED ${ability.cyberCost - cyberPool} CY`;
  else if (isPending)  status = 'TARGETING...';
  else                 status = 'READY';

  const enabled = isActive && canAfford;

  const dimmed = !enabled || (isPending === false && false); // not pending, but enabled

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { borderColor: enabled ? accent : `${accent}28` },
        isPending && styles.btnPending,
        !enabled && styles.btnDisabled,
      ]}
      onPress={enabled ? onPress : undefined}
      disabled={!enabled}
      activeOpacity={0.75}
    >
      {/* Pulsing ring overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.ring, { borderColor: accent }, ringStyle]}
        pointerEvents="none"
      />

      <MaterialIcons
        name={ability.icon}
        size={22}
        color={enabled ? accent : `${accent}33`}
      />

      <Text style={[styles.name, { color: enabled ? accent : `${accent}44` }]} numberOfLines={1}>
        {ability.name}
      </Text>

      <Text style={[styles.cost, { color: enabled ? `${accent}BB` : `${accent}33` }]}>
        {`COST: ${ability.cyberCost} CY`}
      </Text>

      <Text style={[
        styles.status,
        { color: status === 'READY' ? `${accent}99` : status === 'LOCKED' ? `${CYAN}28` : RED },
      ]}>
        {status}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surfaceContainerLowest,
    overflow: 'hidden',
  },
  btnPending: {
    backgroundColor: `${colors.primary}08`,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  ring: {
    borderWidth: 2,
  },
  name: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 7,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  cost: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 7,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  status: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 7,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
