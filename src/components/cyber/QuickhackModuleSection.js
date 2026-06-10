import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../store/index';
import { QUICKHACKS } from '../../data/quickhacks';
import { colors } from '../../theme/colors';

const MAG = colors.secondary;

const SLOT_META = {
  slot1: { label: 'LOW_TIER',  tier: 'low' },
  slot2: { label: 'MID_TIER',  tier: 'mid' },
  slot3: { label: 'HIGH_TIER', tier: 'high' },
};

function SlotRow({ slotKey, hackId }) {
  const hack = hackId ? QUICKHACKS[hackId] : null;
  const meta = SLOT_META[slotKey];

  return (
    <View style={q.slotRow}>
      <View style={q.slotTag}>
        <Text style={q.slotTagText}>{meta?.label ?? slotKey.toUpperCase()}</Text>
      </View>
      {hack ? (
        <View style={q.slotFilled}>
          <MaterialIcons name={hack.icon} size={13} color={MAG} />
          <Text style={q.slotName}>{hack.name}</Text>
          <Text style={q.slotRam}>{hack.neuralCost} NEU</Text>
        </View>
      ) : (
        <Text style={q.slotEmpty}>[EMPTY]</Text>
      )}
    </View>
  );
}

function ModuleRow({ hackId, onInstall }) {
  const hack = QUICKHACKS[hackId];
  if (!hack) return null;

  return (
    <View style={q.moduleRow}>
      <MaterialIcons name={hack.icon} size={18} color={MAG} />
      <View style={q.moduleInfo}>
        <Text style={q.moduleName}>{hack.name}</Text>
        <Text style={q.moduleMeta}>
          {hack.tier.toUpperCase()} // {hack.neuralCost} NEU
        </Text>
      </View>
      <TouchableOpacity style={q.installBtn} onPress={onInstall} activeOpacity={0.7}>
        <Text style={q.installBtnText}>[INSTALL]</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function QuickhackModuleSection({ selectedMember }) {
  const quickhackModules       = useStore((s) => s.vendor.quickhackModules);
  const installQuickhackModule = useStore((s) => s.installQuickhackModule);

  const isNetrunner = selectedMember?.class === 'netrunner';

  const handleInstall = useCallback((hackId) => {
    if (!selectedMember) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    installQuickhackModule(selectedMember.id, hackId);
  }, [selectedMember, installQuickhackModule]);

  return (
    <View style={q.section}>
      <View style={q.header}>
        <View style={q.headerAccent} />
        <Text style={q.headerText}>Quickhack_Modules</Text>
        {quickhackModules.length > 0 && (
          <View style={q.countBadge}>
            <Text style={q.countBadgeText}>{quickhackModules.length}</Text>
          </View>
        )}
      </View>

      {!isNetrunner ? (
        <View style={q.notNetrunner}>
          <Text style={q.notNetrunnerText}>
            [NETRUNNER_ONLY // SELECT_A_NETRUNNER]
          </Text>
        </View>
      ) : (
        <>
          <View style={q.subSection}>
            <Text style={q.subLabel}>CURRENT_LOADOUT</Text>
            {(['slot1', 'slot2', 'slot3']).map((key) => (
              <SlotRow
                key={key}
                slotKey={key}
                hackId={selectedMember.quickhacks?.[key] ?? null}
              />
            ))}
          </View>

          <View style={q.subSection}>
            <Text style={q.subLabel}>OWNED_MODULES</Text>
            {quickhackModules.length === 0 ? (
              <View style={q.emptyBox}>
                <Text style={q.emptyText}>[NO_MODULES // BUY FROM VENDOR]</Text>
              </View>
            ) : (
              quickhackModules.map((hackId, i) => (
                <ModuleRow
                  key={`${hackId}_${i}`}
                  hackId={hackId}
                  onInstall={() => handleInstall(hackId)}
                />
              ))
            )}
          </View>
        </>
      )}
    </View>
  );
}

const q = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  headerAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: MAG,
  },
  headerText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 20,
    color: MAG,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.onSecondary,
    letterSpacing: 0.8,
  },
  notNetrunner: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${MAG}33`,
    paddingVertical: 18,
    alignItems: 'center',
  },
  notNetrunnerText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: `${MAG}55`,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  subSection: {
    marginBottom: 14,
    gap: 6,
  },
  subLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: `${MAG}88`,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: `${MAG}33`,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  slotTag: {
    borderWidth: 1,
    borderColor: `${MAG}44`,
    paddingHorizontal: 6,
    paddingVertical: 1,
    width: 72,
    alignItems: 'center',
  },
  slotTagText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: `${MAG}99`,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  slotFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  slotName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: MAG,
    letterSpacing: 0.5,
    flex: 1,
  },
  slotRam: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: `${MAG}88`,
    letterSpacing: 0.5,
  },
  slotEmpty: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: `${colors.outline}55`,
    letterSpacing: 0.8,
    flex: 1,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: `${MAG}44`,
    padding: 10,
  },
  moduleInfo: {
    flex: 1,
    gap: 2,
  },
  moduleName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: MAG,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  moduleMeta: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: `${MAG}88`,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  installBtn: {
    borderWidth: 1,
    borderColor: MAG,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: `${MAG}10`,
  },
  installBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: MAG,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${MAG}33`,
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: `${MAG}55`,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
