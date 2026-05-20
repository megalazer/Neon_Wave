import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const MAG = colors.secondaryContainer;
const MAX = 10;

export default function CyberPool({ current }) {
  const filled = Math.max(0, Math.min(MAX, Math.round(current)));

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>CYBER_POOL</Text>
        <Text style={styles.count}>
          {String(filled).padStart(2, '0')} / {MAX} CHARGED
        </Text>
      </View>

      <View style={styles.cells}>
        {Array.from({ length: MAX }, (_, i) => (
          <View
            key={i}
            style={[
              styles.cell,
              i < filled ? styles.cellFilled : styles.cellEmpty,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 5,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: MAG,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  count: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: `${MAG}AA`,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cells: {
    flexDirection: 'row',
    gap: 3,
  },
  cell: {
    flex: 1,
    height: 8,
  },
  cellFilled: {
    backgroundColor: MAG,
    shadowColor: MAG,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  cellEmpty: {
    backgroundColor: `${colors.surfaceVariant}66`,
  },
});
