import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

const CYAN = colors.primary;
const MAG  = colors.secondaryContainer;

export default function CompactRollControls({ combat, onRoll, onReroll }) {
  const { phase, rerollsRemaining, rolling } = combat;

  const canRoll   = phase === 'roll' && !rolling;
  const canReroll = phase === 'targeting' && rerollsRemaining > 0;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, canRoll ? styles.btnRoll : styles.btnDim]}
        onPress={canRoll ? onRoll : undefined}
        disabled={!canRoll}
        activeOpacity={0.75}
      >
        <Text style={[styles.label, { color: canRoll ? CYAN : `${CYAN}28` }]}>
          {phase === 'roll' && rolling ? '[  ROLLING...  ]' : '[  ROLL_DICE  ]'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, canReroll ? styles.btnReroll : styles.btnDim]}
        onPress={canReroll ? onReroll : undefined}
        disabled={!canReroll}
        activeOpacity={0.75}
      >
        <Text style={[styles.label, { color: canReroll ? MAG : `${MAG}28` }]}>
          {`[  REROLL (${rerollsRemaining}/2)  ]`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: `${CYAN}1A`,
  },
  btn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRoll: {
    borderColor: `${CYAN}88`,
    backgroundColor: `${CYAN}0D`,
  },
  btnReroll: {
    borderColor: `${MAG}88`,
    backgroundColor: `${MAG}0D`,
  },
  btnDim: {
    borderColor: `${CYAN}18`,
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
