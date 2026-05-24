import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

const CYAN  = colors.primary;
const MAG   = colors.secondaryContainer;
const RED   = colors.error;
const GREEN = '#00E676';

function getConfig(combat) {
  const { phase, pendingAttacks } = combat;
  const totalAttacks   = pendingAttacks?.length ?? 0;
  const totalCyberCost = pendingAttacks?.reduce((s, a) => s + (a.cyberCost ?? 0), 0) ?? 0;

  switch (phase) {
    case 'roll':
    case 'targeting': {
      if (totalAttacks === 0) {
        return { label: '[ NO_ATTACKS_QUEUED ]', enabled: false, color: `${CYAN}33` };
      }
      const costStr = totalCyberCost > 0 ? ` // -${totalCyberCost} CY` : '';
      return {
        label: `[ CONFIRM_ALL (${totalAttacks})${costStr} ]`,
        enabled: true,
        color: CYAN,
      };
    }

    case 'executing':
      return { label: '[ ...EXECUTING_ATTACKS ]', enabled: false, color: MAG };

    case 'enemy_turn':
      return { label: '[ ENEMY_TURN ]', enabled: false, color: RED };

    case 'victory':
      return { label: '[ EXIT_BATTLE ]', enabled: true, color: GREEN };

    case 'defeat':
      return { label: '[ EXIT_BATTLE ]', enabled: true, color: RED };

    default:
      return { label: '[ ... ]', enabled: false, color: `${CYAN}33` };
  }
}

export default function ActionButton({ combat, onPress }) {
  const { label, enabled, color } = getConfig(combat);

  return (
    <TouchableOpacity
      style={[styles.btn, { borderColor: enabled ? color : `${color}44` }]}
      onPress={enabled ? onPress : undefined}
      disabled={!enabled}
      activeOpacity={0.75}
    >
      <View style={[styles.tick, styles.tl, { borderColor: color }]} />
      <View style={[styles.tick, styles.tr, { borderColor: color }]} />
      <View style={[styles.tick, styles.bl, { borderColor: color }]} />
      <View style={[styles.tick, styles.br, { borderColor: color }]} />

      <Text
        style={[styles.label, { color: enabled ? color : `${color}55` }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 80,
    marginHorizontal: 12,
    marginVertical: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 16,
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tick: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  tl: { top: -1, left: -1,    borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: -1, right: -1,   borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: -1, left: -1,   borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: -1, right: -1,  borderBottomWidth: 2, borderRightWidth: 2 },
});
