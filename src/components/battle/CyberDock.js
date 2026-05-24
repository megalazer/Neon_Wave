import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { CYBER_ABILITIES, CLASS_PRIORITY } from '../../data/cyberAbilities';
import AbilityButton from './AbilityButton';

const CYAN  = colors.primary;
const SLOTS = 3;

export default function CyberDock({
  friendly, cyberPool, pendingAbility, pendingAttacks, phase,
  onAbilityPress, onCancelAbility,
}) {
  const presentClasses = new Set(friendly.map((u) => u.class).filter(Boolean));

  const reservedCyber = pendingAttacks
    .filter((a) => a.source === 'ability')
    .reduce((s, a) => s + a.cyberCost, 0);
  const availableCyber = cyberPool - reservedCyber;

  const slots = CLASS_PRIORITY.slice(0, SLOTS).map((classId) => ({
    classId,
    ability: CYBER_ABILITIES[classId],
    available: presentClasses.has(classId),
    isQueued: pendingAttacks.some((a) => a.source === 'ability' && a.sourceId === classId),
  }));

  return (
    <View style={styles.dock}>
      <Text style={styles.header}>CYBER_DOCK // GROUP_ABILITIES</Text>

      <View style={styles.row}>
        {slots.map(({ classId, ability, available, isQueued }) => (
          <AbilityButton
            key={classId}
            ability={ability}
            available={available}
            availableCyber={availableCyber}
            isQueued={isQueued}
            isPending={pendingAbility?.classId === classId}
            phase={phase}
            onPress={() => onAbilityPress(classId)}
            onCancel={() => onCancelAbility(classId)}
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
