import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CYBERWARE_ITEMS } from '../../data/cyberware';
import { colors } from '../../theme/colors';

const STAT_KEYS = ['chrome', 'edge', 'ghost', 'face', 'grit', 'wire'];

function computeCyberwareBonus(member) {
  const totals = {};
  (member.equippedCyberware || []).forEach((cybId) => {
    const cyb = CYBERWARE_ITEMS.find((c) => c.id === cybId);
    if (cyb?.bonuses) {
      Object.entries(cyb.bonuses).forEach(([stat, val]) => {
        totals[stat] = (totals[stat] || 0) + val;
      });
    }
  });
  return totals;
}

function getHumanityStatus(ratio) {
  if (ratio < 0.3) return { label: 'DISSOCIATIVE', color: colors.error };
  if (ratio < 0.6) return { label: 'STRAINED', color: '#ffb74d' };
  return { label: 'STABLE', color: colors.primary };
}

export default function MemberStatsModal({ visible, member, onClose }) {
  if (!visible || !member) return null;
  const bonus = computeCyberwareBonus(member);
  const bonusEntries = Object.entries(bonus);
  const hRatio = member.humanity.current / member.humanity.max;
  const hStatus = getHumanityStatus(hRatio);

  const equippedNames = (member.equippedCyberware || [])
    .map((id) => {
      const cyb = CYBERWARE_ITEMS.find((c) => c.id === id);
      return cyb?.name ?? id;
    })
    .join(', ') || '[NONE]';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.header}>
              <Text style={styles.headerLabel}>[DIAGNOSTICS: {member.name.toUpperCase()}]</Text>
            </View>
            <Text style={styles.meta}>{member.class.toUpperCase()} // LVL {member.level}</Text>

            {/* Stat breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>COMBAT_MATRIX</Text>
              {STAT_KEYS.map((stat) => {
                const base = member.stats?.[stat] ?? 0;
                const cyberBonus = bonus[stat] || 0;
                return (
                  <View key={stat} style={styles.statRow}>
                    <Text style={styles.statLabel}>{stat.toUpperCase().padEnd(8)}</Text>
                    <Text style={styles.statBase}>{String(base).padStart(2)}</Text>
                    {cyberBonus > 0 && (
                      <Text style={styles.statBonus}>+{cyberBonus}</Text>
                    )}
                    <View style={styles.statBar}>
                      <View style={[styles.statBarFill, { width: `${Math.min(100, ((base + cyberBonus) / 20) * 100)}%`, backgroundColor: cyberBonus > 0 ? colors.primary : colors.outline }]} />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>INSTALLED_CYBERWARE</Text>
              <Text style={styles.bodyText}>{equippedNames}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>HUMANITY</Text>
              <Text style={[styles.bodyText, { color: hStatus.color }]}>
                {member.humanity.current}/{member.humanity.max} — {hStatus.label}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>[CLOSE_DIAGNOSTICS]</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000dd', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outlineVariant, width: '100%', maxWidth: 400, maxHeight: '80%', borderRadius: 4 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerLabel: { fontFamily: 'KodeMono_700Bold', fontSize: 13, color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  body: { paddingHorizontal: 16, paddingBottom: 8 },
  meta: { fontFamily: 'KodeMono_400Regular', fontSize: 10, color: colors.outline, paddingHorizontal: 16, paddingBottom: 12 },
  section: { marginBottom: 12 },
  sectionLabel: { fontFamily: 'KodeMono_700Bold', fontSize: 9, color: colors.outline, letterSpacing: 1.2, marginBottom: 4, textTransform: 'uppercase' },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, gap: 4 },
  statLabel: { fontFamily: 'KodeMono_400Regular', fontSize: 9, color: colors.onSurfaceVariant, width: 80 },
  statBase: { fontFamily: 'KodeMono_700Bold', fontSize: 9, color: colors.onSurface, width: 20, textAlign: 'right' },
  statBonus: { fontFamily: 'KodeMono_700Bold', fontSize: 9, color: colors.primary, width: 28 },
  statBar: { flex: 1, height: 4, backgroundColor: colors.surfaceContainerHighest, borderRadius: 2 },
  statBarFill: { height: '100%', borderRadius: 2 },
  bodyText: { fontFamily: 'KodeMono_400Regular', fontSize: 9, color: colors.onSurfaceVariant, lineHeight: 14 },
  actions: { borderTopWidth: 1, borderTopColor: colors.outlineVariant, padding: 12 },
  closeBtn: { alignSelf: 'flex-end', borderWidth: 1, borderColor: colors.outline, paddingHorizontal: 14, paddingVertical: 8 },
  closeBtnText: { fontFamily: 'KodeMono_700Bold', fontSize: 10, color: colors.outline, letterSpacing: 1.5 },
});
