import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

function computeStatDeltas(member, newItem, replacingItem) {
  const stats = {};
  for (const [stat, v] of Object.entries(newItem.bonuses || {})) {
    stats[stat] = (stats[stat] || 0) + v;
  }
  if (replacingItem) {
    for (const [stat, v] of Object.entries(replacingItem.bonuses || {})) {
      stats[stat] = (stats[stat] || 0) - v;
    }
  }
  for (const k of Object.keys(stats)) {
    if (stats[k] === 0) delete stats[k];
  }
  const humanityCost   = newItem.humanityCost - (replacingItem?.humanityCost ?? 0);
  const humanityAfter  = member.humanity.current - newItem.humanityCost + (replacingItem?.humanityCost ?? 0);
  return { stats, humanityCost, humanityAfter };
}

export default function EquipPreviewModal({
  visible, member, newItem, replacingItem, onConfirm, onCancel,
}) {
  if (!visible || !newItem || !member) return null;

  const deltas      = computeStatDeltas(member, newItem, replacingItem);
  const isReplace   = !!replacingItem;
  const statEntries = Object.entries(deltas.stats);
  const psychoRisk  = deltas.humanityAfter / member.humanity.max < 0.3;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={m.backdrop}>
        <View style={m.card}>
          {/* Header */}
          <View style={m.header}>
            <Text style={m.headerLabel}>
              {isReplace ? '>>> CYBERWARE_REPLACE <<<' : '>>> CYBERWARE_INSTALL <<<'}
            </Text>
          </View>

          <ScrollView contentContainerStyle={m.body} showsVerticalScrollIndicator={false}>
            {/* Operative */}
            <View style={m.infoRow}>
              <Text style={m.infoLabel}>OPERATIVE:</Text>
              <Text style={m.infoValue}>{member.name.toUpperCase()}</Text>
            </View>

            {/* Removing (replace only) */}
            {isReplace && (
              <View style={m.infoRow}>
                <Text style={m.infoLabel}>REMOVING:</Text>
                <Text style={[m.infoValue, { color: colors.error }]}>
                  {replacingItem.name.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Installing */}
            <View style={m.infoRow}>
              <Text style={m.infoLabel}>INSTALLING:</Text>
              <Text style={[m.infoValue, { color: colors.primary }]}>
                {newItem.name.toUpperCase()}
              </Text>
            </View>

            {/* Stat deltas */}
            <View style={m.section}>
              <Text style={m.sectionLabel}>NET_CHANGES:</Text>

              {statEntries.length === 0 ? (
                <Text style={m.noChange}>[NO_STAT_DELTA]</Text>
              ) : (
                statEntries.map(([stat, delta]) => (
                  <View key={stat} style={m.deltaRow}>
                    <Text style={m.deltaStat}>{stat.toUpperCase()}:</Text>
                    <Text style={[m.deltaValue, {
                      color: delta > 0 ? colors.tertiaryFixed : delta < 0 ? colors.error : colors.outline,
                    }]}>
                      {delta > 0 ? '+' : ''}{delta}
                    </Text>
                  </View>
                ))
              )}

              {/* Humanity delta — always shown */}
              <View style={[m.deltaRow, m.humanityRow]}>
                <Text style={[m.deltaStat, { color: colors.error }]}>HUMANITY:</Text>
                <Text style={[m.deltaValue, { color: deltas.humanityCost > 0 ? colors.error : deltas.humanityCost < 0 ? colors.tertiaryFixed : colors.outline }]}>
                  {deltas.humanityCost > 0 ? '-' : deltas.humanityCost < 0 ? '+' : ''}{Math.abs(deltas.humanityCost)}
                  {'  '}
                  <Text style={m.humanityAfter}>
                    ({deltas.humanityAfter}/{member.humanity.max})
                  </Text>
                </Text>
              </View>

              {psychoRisk && (
                <View style={m.warningBox}>
                  <MaterialIcons name="warning" size={14} color={colors.error} />
                  <Text style={m.warningText}>PSYCHOSIS_RISK_HIGH AFTER INSTALLATION</Text>
                </View>
              )}
            </View>

            {/* New tags */}
            {newItem.tags?.length > 0 && (
              <View style={m.section}>
                <Text style={m.sectionLabel}>NEW_TAGS:</Text>
                <View style={m.tagsRow}>
                  {newItem.tags.map((tag) => (
                    <View key={tag} style={m.tag}>
                      <Text style={m.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={m.actions}>
            <TouchableOpacity style={m.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={m.cancelBtnText}>[CANCEL]</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.confirmBtn} onPress={onConfirm} activeOpacity={0.7}>
              <Text style={m.confirmBtnText}>
                {isReplace ? '[CONFIRM_REPLACE]' : '[CONFIRM_INSTALL]'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#0d0d0f',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.primary}33`,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  body: {
    padding: 16,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  infoLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
    width: 90,
  },
  infoValue: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.onSurface,
    letterSpacing: 0.8,
    flex: 1,
  },
  section: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: `${colors.outline}22`,
    paddingTop: 10,
    gap: 6,
  },
  sectionLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: `${colors.outline}88`,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  noChange: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.8,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  humanityRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: `${colors.error}22`,
  },
  deltaStat: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    width: 80,
  },
  deltaValue: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  humanityAfter: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: colors.outline,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.error}14`,
    borderWidth: 1,
    borderColor: `${colors.error}44`,
    padding: 8,
    marginTop: 4,
  },
  warningText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.error,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: `${colors.primary}08`,
  },
  tagText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: `${colors.outline}33`,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: `${colors.outline}33`,
  },
  cancelBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: `${colors.primary}14`,
  },
  confirmBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
