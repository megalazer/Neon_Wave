import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

const CYAN  = colors.primary;
const MAG   = colors.secondaryContainer;
const RED   = colors.error;
const GREEN = '#00E676';

function getConfig(combat) {
  const { phase, rerollsRemaining, dice, playerAssignments } = combat;
  const aliveDice    = dice.filter((d) => d.alive);
  const allAssigned  = aliveDice.length > 0 && aliveDice.every((d) => d.assigned !== null);
  const hasAny       = playerAssignments.length > 0;

  switch (phase) {
    case 'roll':
      return { label: '[ ROLL_DICE ]', enabled: true, color: CYAN };

    case 'targeting':
      if (!allAssigned && rerollsRemaining > 0) {
        return {
          label: `[ REROLL ] (${rerollsRemaining} / 2)`,
          enabled: true,
          color: MAG,
        };
      }
      return {
        label: '[ LOCK_IN_ATTACKS ]',
        enabled: hasAny,
        color: hasAny ? CYAN : `${CYAN}55`,
      };

    case 'executing':
      return { label: '[ ...EXECUTING ]', enabled: false, color: MAG };

    case 'enemy_turn':
      return { label: '[ ENEMY_TURN ]', enabled: false, color: RED };

    case 'victory':
      return { label: '[ EXIT_BATTLE ]', enabled: true, color: GREEN };

    case 'defeat':
      return { label: '[ EXIT_BATTLE ]', enabled: true, color: RED };

    default:
      return { label: '[ ... ]', enabled: false, color: CYAN };
  }
}

export default function ActionButton({ combat, onPress }) {
  const { label, enabled, color } = getConfig(combat);

  return (
    <TouchableOpacity
      style={[styles.btn, { borderColor: enabled ? color : `${color}55` }]}
      onPress={enabled ? onPress : undefined}
      disabled={!enabled}
      activeOpacity={0.75}
    >
      {/* Corner accent ticks */}
      <View style={[styles.tick, styles.tl, { borderColor: color }]} />
      <View style={[styles.tick, styles.tr, { borderColor: color }]} />
      <View style={[styles.tick, styles.bl, { borderColor: color }]} />
      <View style={[styles.tick, styles.br, { borderColor: color }]} />

      <Text style={[styles.label, { color: enabled ? color : `${color}66` }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 72,
    marginHorizontal: 12,
    marginVertical: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  tick: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  tl: { top: -1, left: -1,   borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: -1, right: -1,  borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: -1, left: -1,  borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
});
