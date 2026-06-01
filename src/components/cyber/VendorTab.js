import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../store/index';
import { CYBERWARE_ITEMS } from '../../data/cyberware';
import { QUICKHACKS } from '../../data/quickhacks';
import { calculateTeamLevel } from '../../data/leveling';
import { getUnlockedTiers, fmtCredits } from '../../data/vendor';
import { colors } from '../../theme/colors';
import VendorItemCard from './VendorItemCard';
import ConfirmModal from '../ConfirmModal';

const NAV_HEIGHT = 72;

// All items that are always stocked
const STAPLE_STOCK = [
  ...CYBERWARE_ITEMS
    .filter((c) => c.vendorCategory === 'staple')
    .map((c) => ({ type: 'cyberware', id: c.id })),
  ...Object.values(QUICKHACKS)
    .filter((qh) => qh.vendorTier === 'basic')
    .map((qh) => ({ type: 'quickhack', id: qh.id })),
];

function tierLabel(tiers) {
  if (tiers.includes('elite'))        return 'ALL_TIERS';
  if (tiers.includes('intermediate')) return 'BASIC + INTERMEDIATE';
  return 'BASIC_ONLY';
}

function itemCost(entry) {
  if (entry.type === 'quickhack') return QUICKHACKS[entry.id]?.moduleCost ?? 0;
  const cyb = CYBERWARE_ITEMS.find((c) => c.id === entry.id);
  return cyb?.cost ?? 0;
}

function itemName(entry) {
  if (entry.type === 'quickhack') return QUICKHACKS[entry.id]?.name ?? entry.id;
  return CYBERWARE_ITEMS.find((c) => c.id === entry.id)?.name ?? entry.id;
}

// ── VendorTab ────────────────────────────────────────────────────────────────

export default function VendorTab() {
  const members                = useStore((s) => s.crew.members);
  const credits                = useStore((s) => s.character.credits);
  const rotatingStock          = useStore((s) => s.vendor.rotatingStock);
  const refreshCountdown       = useStore((s) => s.vendor.refreshCountdown);
  const purchasedThisRotation  = useStore((s) => s.vendor.purchasedThisRotation);
  const refreshVendorStock     = useStore((s) => s.refreshVendorStock);
  const purchaseCyberware      = useStore((s) => s.purchaseCyberware);
  const purchaseQuickhackModule = useStore((s) => s.purchaseQuickhackModule);

  const teamLevel     = calculateTeamLevel(members);
  const unlockedTiers = getUnlockedTiers(teamLevel);

  const [pendingPurchase, setPendingPurchase] = useState(null);

  // Lazy-init stock on first open
  useEffect(() => {
    if (rotatingStock.length === 0) refreshVendorStock(teamLevel);
  }, []);

  const handleBuyPress = useCallback((entry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingPurchase({
      type: entry.type,
      id:   entry.id,
      name: itemName(entry),
      cost: itemCost(entry),
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pendingPurchase) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (pendingPurchase.type === 'cyberware') {
      purchaseCyberware(pendingPurchase.id);
    } else {
      purchaseQuickhackModule(pendingPurchase.id);
    }
    setPendingPurchase(null);
  }, [pendingPurchase, purchaseCyberware, purchaseQuickhackModule]);

  const rotatingEmpty = rotatingStock.length === 0;

  return (
    <>
      <ScrollView contentContainerStyle={v.content} showsVerticalScrollIndicator={false}>
        {/* Vendor Header */}
        <View style={v.header}>
          <Text style={v.headerTitle}>CYBERWARE_VENDOR // BLACK_MARKET</Text>
          <View style={v.headerMetaRow}>
            <View style={v.credChip}>
              <Text style={v.credText}>{fmtCredits(credits)} CR</Text>
            </View>
            <View style={v.countChip}>
              <Text style={v.countText}>ROTATION: {refreshCountdown} TURNS</Text>
            </View>
          </View>
          <Text style={v.tierBadge}>POOL_TIER: {tierLabel(unlockedTiers)}</Text>
        </View>

        {/* Permanent Staples */}
        <View style={v.section}>
          <View style={v.sectionHeader}>
            <View style={[v.sectionAccent, { backgroundColor: colors.primary }]} />
            <Text style={[v.sectionTitle, { color: colors.primary }]}>
              [PERMANENT_STAPLES]
            </Text>
          </View>
          {STAPLE_STOCK.map((entry) => (
            <VendorItemCard
              key={entry.id}
              stockEntry={entry}
              soldOut={false}
              canAfford={credits >= itemCost(entry)}
              onPurchase={() => handleBuyPress(entry)}
            />
          ))}
        </View>

        {/* Rotating Stock */}
        <View style={v.section}>
          <View style={v.sectionHeader}>
            <View style={[v.sectionAccent, { backgroundColor: colors.secondary }]} />
            <View style={v.rotHeader}>
              <Text style={[v.sectionTitle, { color: colors.secondary }]}>
                [ROTATING_STOCK]
              </Text>
              <View style={[v.rotTierChip, { borderColor: `${colors.secondary}55` }]}>
                <Text style={[v.rotTierText, { color: colors.secondary }]}>
                  {tierLabel(unlockedTiers)}
                </Text>
              </View>
            </View>
          </View>

          {rotatingEmpty ? (
            <View style={v.emptyState}>
              <Text style={v.emptyTitle}>[STOCK_PENDING]</Text>
              <Text style={v.emptyBody}>
                {teamLevel < 4
                  ? `Rotating stock unlocks at TEAM_LEVEL 4. Current: ${teamLevel}.`
                  : 'Awaiting next rotation cycle.'}
              </Text>
            </View>
          ) : (
            rotatingStock.map((entry) => {
              const sold = purchasedThisRotation.includes(entry.id);
              return (
                <VendorItemCard
                  key={entry.id}
                  stockEntry={entry}
                  soldOut={sold}
                  canAfford={credits >= itemCost(entry)}
                  onPurchase={() => handleBuyPress(entry)}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={!!pendingPurchase}
        variant="neutral"
        title=">>> CONFIRM_PURCHASE <<<"
        body={
          pendingPurchase
            ? `Acquire ${pendingPurchase.name} for ${
                pendingPurchase.cost > 0
                  ? `${pendingPurchase.cost.toLocaleString()} CR`
                  : 'FREE'
              }? Added to inventory immediately.`
            : ''
        }
        confirmLabel="[PURCHASE]"
        cancelLabel="[ABORT]"
        onConfirm={handleConfirm}
        onCancel={() => setPendingPurchase(null)}
      />
    </>
  );
}

const v = StyleSheet.create({
  content: {
    paddingTop: 12,
    paddingBottom: NAV_HEIGHT + 24,
    paddingHorizontal: 16,
  },
  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    padding: 14,
    marginBottom: 20,
    gap: 8,
    backgroundColor: `${colors.primary}05`,
  },
  headerTitle: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  credChip: {
    borderWidth: 1,
    borderColor: `${colors.primary}55`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: `${colors.primary}0D`,
  },
  credText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 1,
  },
  countChip: {
    borderWidth: 1,
    borderColor: `${colors.outline}44`,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tierBadge: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: `${colors.primary}88`,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // ── Section ────────────────────────────────────────────────────────────────
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  rotHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rotTierChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rotTierText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${colors.outline}44`,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  emptyBody: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: `${colors.outline}88`,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 17,
  },
});
