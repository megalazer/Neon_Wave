import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { CYBER_ABILITIES, CLASS_PRIORITY } from '../../data/cyberAbilities';
import AbilityButton from './AbilityButton';

const CYAN     = colors.primary;
const SLOTS    = 3;

export default function CyberDock({ friendly, cyberPool, pendingAbility, phase, onAbilityPress }) {
  const presentClasses = new Set(friendly.map((u) => u.class).filter(Boolean));

  // Fill 3 slots from priority order — show whether present or locked
  const slots = CLASS_PRIORITY.slice(0, SLOTS).map((classId) => ({
    classId,
    ability: CYBER_ABILITIES[classId],
    available: presentClasses.has(classId),
  }));

  return (
    <View style={styles.dock}>
      <Text style={styles.header}>CYBER_DOCK // GROUP_ABILITIES</Text>

      <View style={styles.row}>
        {slots.map(({ classId, ability, available }) => (
          <AbilityButton
            key={classId}
            ability={ability}
            available={available}
            cyberPool={cyberPool}
            isPending={pendingAbility?.classId === classId}
            phase={phase}
            onPress={() => onAbilityPress(classId)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    borderTopWidth: 1,
    borderTopColor: `${CYAN}1A`,
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 8,
    gap: 5,
    backgroundColor: `${colors.surfaceContainer}CC`,
  },
  header: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 7,
    color: `${CYAN}55`,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
});
