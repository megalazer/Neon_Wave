import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../store/index';
import { FACTION_LIST, repTierFromValue } from '../data/factions';
import { colors } from '../theme/colors';
import { labelCaps } from '../theme/fonts';

export default function FactionRepBar() {
  const rep = useStore((s) => s.faction.rep);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>FACTION_STANDING</Text>
      <View style={styles.bar}>
        {FACTION_LIST.map((f) => {
          const value = rep[f.id] ?? 0;
          const tier = repTierFromValue(value);
          const pct = Math.max(0, Math.min(100, ((value + 100) / 400) * 100));
          return (
            <View key={f.id} style={styles.segment}>
              <View style={styles.segHeader}>
                <Text style={[styles.segName, { color: f.accent }]}>{f.tag}</Text>
                <Text style={[styles.segTier, { color: f.accent }]}>{tier}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: f.accent }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    paddingHorizontal: 12,
  },
  label: {
    ...labelCaps,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  bar: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 2,
  },
  segment: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  segHeader: {
    width: 96,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 6,
  },
  segName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  segTier: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 8,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
