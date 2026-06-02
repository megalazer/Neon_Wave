import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const MAG              = colors.secondaryContainer;
const LOW_NEURAL_FLOOR = 5; // TUNABLE — at or below this max, tint signals depleted neural

export default function CyberPool({ current, maxPool = 10 }) {
  const clampedMax = Math.max(1, Math.round(maxPool));
  const filled     = Math.max(0, Math.min(clampedMax, Math.round(current)));
  const isLow      = clampedMax <= LOW_NEURAL_FLOOR;
  const barColor   = isLow ? colors.error : MAG;
  const labelColor = isLow ? `${colors.error}CC` : MAG;
  const countColor = isLow ? `${colors.error}88` : `${MAG}AA`;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: labelColor }]}>
          {isLow ? 'CYBER_POOL // NEURAL_LOW' : 'CYBER_POOL'}
        </Text>
        <Text style={[styles.count, { color: countColor }]}>
          {String(filled).padStart(2, '0')} / {clampedMax} CHARGED
        </Text>
      </View>

      <View style={styles.cells}>
        {Array.from({ length: clampedMax }, (_, i) => (
          <View
            key={i}
            style={[
              styles.cell,
              i < filled
                ? [styles.cellFilled, { backgroundColor: barColor, shadowColor: barColor }]
                : styles.cellEmpty,
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
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  count: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  cellEmpty: {
    backgroundColor: `${colors.surfaceVariant}66`,
  },
});
