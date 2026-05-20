import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const CYAN = colors.primary;
const MAG  = colors.secondaryContainer;
const RED  = colors.error;

export default function RoundInfo({ round, friendly }) {
  const alive = friendly.filter((u) => u.hp.current > 0).length;
  const total = friendly.length;
  const pct   = total > 0 ? Math.round((alive / total) * 100) : 0;

  const squadColor = pct === 0 ? RED : pct < 50 ? MAG : CYAN;

  return (
    <View style={styles.strip}>
      <Text style={styles.left}>
        {'ROUND '}
        <Text style={[styles.accent, { color: CYAN }]}>
          {String(round).padStart(2, '0')}
        </Text>
      </Text>

      <View style={styles.divider} />

      <Text style={styles.right}>
        {'SQUAD: '}
        <Text style={[styles.accent, { color: squadColor }]}>
          {pct}%
        </Text>
        {` (${alive}/${total})`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 26,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: `${CYAN}1A`,
  },
  left: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: `${CYAN}55`,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  right: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: `${CYAN}55`,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  accent: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 10,
    backgroundColor: `${CYAN}22`,
  },
});
