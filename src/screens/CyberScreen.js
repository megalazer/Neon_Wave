import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/index';
import { colors } from '../theme/colors';
import { CYBERWARE_ITEMS } from '../data/cyberware';
import EquipPreviewModal from '../components/cyber/EquipPreviewModal';
import QuickhackModuleSection from '../components/cyber/QuickhackModuleSection';
import MemberStatsModal from '../components/cyber/MemberStatsModal';
import VendorTab from '../components/cyber/VendorTab';
import PortraitPreview from '../components/recruit/PortraitPreview';

const BANNER_HEIGHT  = 90;
const NAV_HEIGHT     = 72;
const HUD_BOTTOM     = NAV_HEIGHT + 8;
const CARD_WIDTH     = 192;
const MAX_OPERATIVES = 4;

// ── Utilities ────────────────────────────────────────────────────────────────

function getEquipState(item, member) {
  if (!member) return { label: '[NO_TARGET]', disabled: true };
  if (member.humanity.current < item.humanityCost) return { label: '[INSUF_HUM]', disabled: true };
  const hasConflict = member.equippedCyberware.some((id) => {
    const existing = CYBERWARE_ITEMS.find((c) => c.id === id);
    return existing?.slot === item.slot;
  });
  if (hasConflict) return { label: '[REPLACE]', disabled: false };
  if (member.equippedCyberware.length >= member.maxCyberwareSlots) return { label: '[SLOTS_FULL]', disabled: true };
  return { label: '[EQUIP]', disabled: false };
}

function formatStats(item) {
  const parts = [];
  for (const [k, v] of Object.entries(item.bonuses || {})) parts.push(`${k.toUpperCase()} +${v}`);
  for (const tag of (item.tags || [])) parts.push(tag);
  return parts.join('   ');
}

function getPsychosisRisk(ratio) {
  if (ratio >= 0.8) return { text: 'STABLE',   color: colors.primary };
  if (ratio >= 0.5) return { text: 'LOW',       color: colors.error };
  if (ratio >= 0.25) return { text: 'MODERATE', color: colors.error };
  if (ratio >= 0.1) return { text: 'HIGH',      color: colors.error };
  return                    { text: 'CRITICAL',  color: colors.error };
}

// ── PersonnelCard ────────────────────────────────────────────────────────────

function PersonnelCard({ member, selected, onPress }) {
  const vitalsRatio = member.vitals.current / member.vitals.max;
  const barColor    = vitalsRatio < 0.4 ? colors.error : colors.primary;
  const statusText  = vitalsRatio > 0.8 ? 'OPTIMAL' : vitalsRatio >= 0.4 ? 'SYNC: OK' : 'CRIT_DMG';
  const statusColor = vitalsRatio < 0.4 ? colors.error : colors.primary;

  return (
    <TouchableOpacity
      style={[styles.personnelCard, selected ? styles.personnelCardSelected : styles.personnelCardIdle]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.personnelTop}>
        <PortraitPreview
          character={member}
          portrait={member.portrait}
          size={46}
          borderColor={selected ? colors.primaryFixedDim : colors.outline}
          backgroundColor={colors.surfaceContainerHigh}
        />
        <View style={styles.personnelInfo}>
          <Text
            style={[styles.personnelName, { color: selected ? colors.primaryFixedDim : colors.outline }]}
            numberOfLines={1}
          >
            {member.name.toUpperCase()}
          </Text>
          <Text style={styles.personnelClass}>{member.class.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.personnelBarSection}>
        <View style={styles.personnelBar}>
          <View style={[styles.personnelBarFill, { width: `${Math.round(vitalsRatio * 100)}%`, backgroundColor: barColor }]} />
        </View>
        <View style={styles.personnelBarLabels}>
          <Text style={[styles.personnelStatText, { color: vitalsRatio < 0.4 ? colors.error : colors.onSurfaceVariant }]}>
            HP: {member.vitals.current}/{member.vitals.max}
          </Text>
          <Text style={[styles.personnelStatText, { color: statusColor }]}>{statusText}</Text>
        </View>
      {selected && (
        <Text style={styles.personnelHint}>[TAP_AGAIN_FOR_DIAGNOSTICS]</Text>
      )}
      </View>
    </TouchableOpacity>
  );
}

// ── EquippedItemCard ─────────────────────────────────────────────────────────

function EquippedItemCard({ item, position, onUnequip }) {
  return (
    <TouchableOpacity style={styles.equippedCard} onPress={() => onUnequip(item.id)} activeOpacity={0.75}>
      <View style={styles.equippedIconBox}>
        <MaterialIcons name={item.icon} size={28} color={colors.secondary} />
      </View>
      <View style={styles.itemDetails}>
        <View style={styles.itemNameRow}>
          <Text style={styles.equippedName}>{item.name}</Text>
          <Text style={styles.equippedPos}>{String(position).padStart(3, '0')}</Text>
        </View>
        <View style={styles.chipRow}>
          <View style={styles.chipSlot}><Text style={styles.chipSlotText}>SLOT: {item.slot.toUpperCase()}</Text></View>
          <View style={styles.chipHum}><Text style={styles.chipHumText}>HUM: {item.humanityCost}</Text></View>
        </View>
        <Text style={styles.equippedStats}>{formatStats(item)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── InventoryItemCard ────────────────────────────────────────────────────────

function InventoryItemCard({ item, selectedMember, onEquip }) {
  const { label, disabled } = getEquipState(item, selectedMember);
  return (
    <TouchableOpacity
      style={[styles.inventoryCard, disabled && styles.inventoryCardDim]}
      onPress={() => !disabled && onEquip(item.id)}
      activeOpacity={0.75}
    >
      <View style={[styles.inventoryIconBox, !disabled && styles.inventoryIconBoxActive]}>
        <MaterialIcons name={item.icon} size={28} color={disabled ? colors.outline : colors.primary} />
      </View>
      <View style={styles.itemDetails}>
        <View style={styles.itemNameRow}>
          <Text style={styles.inventoryName}>{item.name}</Text>
          <TouchableOpacity
            style={[styles.equipBtn, disabled && styles.equipBtnDisabled]}
            onPress={() => !disabled && onEquip(item.id)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={[styles.equipBtnText, disabled && styles.equipBtnTextDim]}>{label}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipRow}>
          <View style={styles.chipSlot}><Text style={styles.chipSlotText}>SLOT: {item.slot.toUpperCase()}</Text></View>
          <View style={styles.chipHum}><Text style={styles.chipHumText}>HUM: {item.humanityCost}</Text></View>
        </View>
        <Text style={[styles.inventoryStats, !disabled && styles.inventoryStatsActive]}>{formatStats(item)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── HumanityHUD ──────────────────────────────────────────────────────────────

function HumanityHUD({ member }) {
  const ratio    = member.humanity.current / member.humanity.max;
  const pct      = Math.round(ratio * 100);
  const barColor = ratio >= 0.5 ? colors.primary : colors.error;
  const risk     = getPsychosisRisk(ratio);

  return (
    <View style={styles.hudWrapper}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.hudBorder} />
      <View style={styles.hudContent}>
        <View>
          <Text style={styles.hudLabel}>CURRENT_HUMANITY</Text>
          <View style={styles.hudBarRow}>
            <Text style={styles.hudValue}>{member.humanity.current}/{member.humanity.max}</Text>
            <View style={styles.hudBar}>
              <View style={[styles.hudBarFill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>
          </View>
        </View>
        <View style={styles.hudRight}>
          <Text style={[styles.hudRiskLabel, { color: colors.error }]}>PSYCHOSIS_RISK</Text>
          <Text style={[styles.hudRisk, { color: risk.color }]}>{risk.text}</Text>
        </View>
      </View>
    </View>
  );
}

// ── SubTabBar ────────────────────────────────────────────────────────────────

const SUB_TABS = [
  { id: 'loadout', label: 'LOADOUT', icon: 'memory' },
  { id: 'vendor',  label: 'VENDOR',  icon: 'store' },
];

function SubTabBar({ activeSubTab, onTabChange }) {
  return (
    <View style={styles.segmentedRow}>
      {SUB_TABS.map((tab, i) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.segmentTab,
            activeSubTab === tab.id && styles.segmentTabActive,
            i < SUB_TABS.length - 1 && styles.segmentTabBorder,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onTabChange(tab.id);
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={tab.icon}
            size={16}
            color={activeSubTab === tab.id ? colors.primary : colors.outline}
          />
          <Text style={[styles.segmentLabel, activeSubTab === tab.id && styles.segmentLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── LoadoutContent ───────────────────────────────────────────────────────────

function LoadoutContent({
  members, selectedId, selectedMember,
  equippedItems, inventoryItems, equippedCount, maxSlots,
  onSelectMember, onEquip, onUnequip,
}) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Active Personnel Selector */}
      <View style={styles.section}>
        <View style={styles.selectorHeader}>
          <Text style={styles.selectorLabel}>Active_Personnel</Text>
          <Text style={styles.selectorCount}>
            {String(members.length).padStart(3, '0')}/{String(MAX_OPERATIVES).padStart(3, '0')}
          </Text>
        </View>
        {members.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>[NO_CREW — RECRUIT_OPERATIVES_FIRST]</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.personnelRow}
            nestedScrollEnabled
          >
            {members.map((m) => (
              <PersonnelCard
                key={m.id}
                member={m}
                selected={m.id === selectedId}
                onPress={() => onSelectMember(m.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Equipped Nodes */}
      <View style={styles.section}>
        <View style={styles.equippedHeader}>
          <View style={styles.equippedHeaderAccent} />
          <Text style={styles.equippedHeaderText}>Equipped_Nodes</Text>
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>{equippedCount}/{maxSlots}</Text>
          </View>
        </View>
        {equippedItems.length > 0 ? (
          equippedItems.map((item, i) => (
            <EquippedItemCard key={`${item.id}_${i}`} item={item} position={i + 1} onUnequip={onUnequip} />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: `${colors.secondaryContainer}99` }]}>
              [NO_CYBERWARE_INSTALLED]
            </Text>
          </View>
        )}
      </View>

      {/* Available Inventory */}
      <View style={styles.section}>
        <View style={styles.inventoryHeader}>
          <View style={styles.inventoryHeaderAccent} />
          <Text style={styles.inventoryHeaderText}>Available_Inventory</Text>
        </View>
        {inventoryItems.length > 0 ? (
          inventoryItems.map((item, i) => (
            <InventoryItemCard
              key={`${item.id}_${i}`}
              item={item}
              selectedMember={selectedMember}
              onEquip={onEquip}
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>[INVENTORY_EMPTY]</Text>
          </View>
        )}
      </View>

      {/* Quickhack Module Install — magenta-accented, Netrunner-only controls */}
      <QuickhackModuleSection selectedMember={selectedMember} />
    </ScrollView>
  );
}

// ── CyberScreen ──────────────────────────────────────────────────────────────

export default function CyberScreen() {
  const members            = useStore((s) => s.crew.members);
  const cyberwareInventory = useStore((s) => s.character.cyberwareInventory);
  const equipCyberware     = useStore((s) => s.equipCyberware);
  const unequipCyberware   = useStore((s) => s.unequipCyberware);

  const [activeSubTab, setActiveSubTab] = useState('loadout');
  const [selectedId, setSelectedId]     = useState(null);
  const [pendingEquip, setPendingEquip] = useState(null); // { item, replacingItem } | null
  const [statsMember, setStatsMember] = useState(null);

  useEffect(() => {
    if (!selectedId && members.length > 0) {
      setSelectedId(members[0].id);
    } else if (selectedId && !members.find((m) => m.id === selectedId)) {
      setSelectedId(members[0]?.id || null);
    }
  }, [members.length]);

  const selectedMember = members.find((m) => m.id === selectedId) || null;

  const equippedItems = selectedMember
    ? selectedMember.equippedCyberware.map((id) => CYBERWARE_ITEMS.find((c) => c.id === id)).filter(Boolean)
    : [];
  const inventoryItems = cyberwareInventory
    .map((id) => CYBERWARE_ITEMS.find((c) => c.id === id)).filter(Boolean);

  const handleEquip = useCallback((itemId) => {
    if (!selectedMember) return;
    const item = CYBERWARE_ITEMS.find((c) => c.id === itemId);
    if (!item) return;
    const replacingId   = selectedMember.equippedCyberware.find((eid) => {
      const existing = CYBERWARE_ITEMS.find((c) => c.id === eid);
      return existing?.slot === item.slot;
    });
    const replacingItem = replacingId
      ? CYBERWARE_ITEMS.find((c) => c.id === replacingId)
      : null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingEquip({ item, replacingItem });
  }, [selectedMember]);

  const confirmEquip = useCallback(() => {
    if (!pendingEquip || !selectedMember) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    equipCyberware(selectedMember.id, pendingEquip.item.id);
    setPendingEquip(null);
  }, [pendingEquip, selectedMember, equipCyberware]);

  const handleUnequip = useCallback((itemId) => {
    if (!selectedMember) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    unequipCyberware(selectedMember.id, itemId);
  }, [unequipCyberware, selectedMember]);

  const handleSelectMember = useCallback((id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === selectedId) {
      // Double-tap: open stats modal
      const member = members.find((m) => m.id === id);
      if (member) setStatsMember(member);
    } else {
      setSelectedId(id);
    }
  }, [selectedId, members]);

  const equippedCount = selectedMember ? selectedMember.equippedCyberware.length : 0;
  const maxSlots      = selectedMember ? selectedMember.maxCyberwareSlots : 8;

  return (
    <View style={styles.screen}>
      <View style={styles.subTabWrapper}>
        <SubTabBar activeSubTab={activeSubTab} onTabChange={setActiveSubTab} />
      </View>

      <View style={styles.tabContent}>
        {activeSubTab === 'loadout' && (
          <LoadoutContent
            members={members}
            selectedId={selectedId}
            selectedMember={selectedMember}
            equippedItems={equippedItems}
            inventoryItems={inventoryItems}
            equippedCount={equippedCount}
            maxSlots={maxSlots}
            onSelectMember={handleSelectMember}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
          />
        )}
        {activeSubTab === 'vendor' && <VendorTab />}
      </View>

      {activeSubTab === 'loadout' && selectedMember && (
        <HumanityHUD member={selectedMember} />
      )}

      <EquipPreviewModal
        visible={!!pendingEquip}
        member={selectedMember}
        newItem={pendingEquip?.item}
        replacingItem={pendingEquip?.replacingItem}
        onConfirm={confirmEquip}
        onCancel={() => setPendingEquip(null)}
      />

      <MemberStatsModal
        visible={!!statsMember}
        member={statsMember}
        onClose={() => setStatsMember(null)}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  subTabWrapper: {
    paddingTop: BANNER_HEIGHT + 8,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  tabContent: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    paddingBottom: NAV_HEIGHT + 90 + 24,
    paddingHorizontal: 16,
    gap: 0,
  },
  section: {
    marginBottom: 28,
  },

  // ── Sub-tab segmented control ──────────────────────────────────────────────
  segmentedRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: `${colors.primary}4D`,
    marginBottom: 0,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  segmentTabBorder: {
    borderRightWidth: 1,
    borderRightColor: `${colors.primary}4D`,
  },
  segmentTabActive: {
    backgroundColor: `${colors.primary}1A`,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  segmentLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  segmentLabelActive: {
    color: colors.primary,
  },

  // ── Personnel Selector ─────────────────────────────────────────────────────
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: 8,
    marginBottom: 14,
  },
  selectorLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.primaryFixedDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  selectorCount: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.outline,
    letterSpacing: 1,
  },
  personnelRow: {
    gap: 12,
    paddingBottom: 4,
  },
  personnelCard: {
    width: CARD_WIDTH,
    padding: 12,
  },
  personnelCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerLow,
    shadowColor: '#00f3ff',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  personnelCardIdle: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    opacity: 0.6,
  },
  personnelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  personnelInfo: {
    flex: 1,
  },
  personnelName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  personnelClass: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  personnelBarSection: { gap: 4 },
  personnelBar: {
    height: 4,
    backgroundColor: colors.surfaceVariant,
    overflow: 'hidden',
  },
  personnelBarFill: { height: '100%' },
  personnelBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  personnelStatText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  personnelHint: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 7,
    color: colors.outline,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },


  // ── Equipped Section ───────────────────────────────────────────────────────
  equippedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  equippedHeaderAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.secondaryContainer,
  },
  equippedHeaderText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 20,
    color: colors.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  slotBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  slotBadgeText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.onSecondary,
    letterSpacing: 0.8,
  },
  equippedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.secondary,
    padding: 14,
    marginBottom: 10,
  },
  equippedIconBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(254,0,254,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,171,243,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Inventory Section ──────────────────────────────────────────────────────
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  inventoryHeaderAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
  },
  inventoryHeaderText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 20,
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inventoryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 14,
    marginBottom: 10,
  },
  inventoryCardDim: { opacity: 0.6 },
  inventoryIconBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inventoryIconBoxActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0,243,255,0.1)',
  },
  equipBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  equipBtnDisabled: { borderColor: colors.outline },
  equipBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  equipBtnTextDim: { color: colors.outline },
  inventoryName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    color: colors.onSurface,
    flex: 1,
    marginRight: 8,
  },
  inventoryStats: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  inventoryStatsActive: { color: colors.primaryFixedDim },

  // ── Shared item card sub-elements ──────────────────────────────────────────
  itemDetails: { flex: 1 },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  equippedName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    color: colors.onSurface,
    flex: 1,
    marginRight: 8,
  },
  equippedPos: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.secondary,
    flexShrink: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  chipSlot: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipSlotText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chipHum: {
    backgroundColor: 'rgba(147,0,10,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipHumText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.error,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  equippedStats: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.primaryFixedDim,
    letterSpacing: 0.5,
  },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Humanity HUD ───────────────────────────────────────────────────────────
  hudWrapper: {
    position: 'absolute',
    bottom: HUD_BOTTOM,
    left: 16,
    right: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
    zIndex: 10,
  },
  hudBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: `${colors.primary}66`,
    zIndex: 1,
  },
  hudContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  hudLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  hudBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hudValue: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 26,
    color: colors.primaryFixedDim,
    letterSpacing: -0.5,
  },
  hudBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  hudBarFill: { height: '100%' },
  hudRight: { alignItems: 'flex-end' },
  hudRiskLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  hudRisk: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 20,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
