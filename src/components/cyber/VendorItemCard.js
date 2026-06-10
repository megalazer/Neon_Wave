import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CYBERWARE_ITEMS } from '../../data/cyberware';
import { QUICKHACKS } from '../../data/quickhacks';
import { fmtCredits } from '../../data/vendor';
import { colors } from '../../theme/colors';

export default function VendorItemCard({ stockEntry, soldOut, canAfford, onPurchase }) {
  const isHack = stockEntry.type === 'quickhack';
  const data   = isHack
    ? QUICKHACKS[stockEntry.id]
    : CYBERWARE_ITEMS.find((c) => c.id === stockEntry.id);

  if (!data) return null;

  const cost     = isHack ? data.moduleCost : (data.cost ?? 0);
  const disabled = soldOut || !canAfford;
  const accent   = isHack ? colors.secondary : colors.primary;

  let btnLabel;
  if (soldOut)         btnLabel = '[SOLD_OUT]';
  else if (!canAfford) btnLabel = `[REQ: ${fmtCredits(cost)} CR]`;
  else if (cost === 0) btnLabel = '[ACQUIRE_FREE]';
  else                 btnLabel = `[BUY // ${fmtCredits(cost)} CR]`;

  return (
    <View style={[vc.card, { borderColor: `${accent}55` }, soldOut && vc.soldOut]}>
      <View style={[vc.iconBox, { borderColor: `${accent}44`, backgroundColor: `${accent}0D` }]}>
        <MaterialIcons
          name={data.icon}
          size={28}
          color={soldOut ? `${accent}44` : accent}
        />
      </View>

      <View style={vc.details}>
        <View style={vc.nameRow}>
          <Text
            style={[vc.name, { color: soldOut ? `${accent}55` : accent }]}
            numberOfLines={1}
          >
            {data.name}
          </Text>
          {isHack && (
            <View style={[vc.hackBadge, { borderColor: `${accent}55` }]}>
              <Text style={[vc.hackBadgeText, { color: accent }]}>QUICKHACK</Text>
            </View>
          )}
        </View>

        <Text style={[vc.meta, soldOut && vc.dimText]}>
          {isHack
            ? `${data.neuralCost} NEU   SLOT: ${data.tier.toUpperCase()} // ${data.vendorTier.toUpperCase()}`
            : `SLOT: ${data.slot.toUpperCase()}   HUM: ${data.humanityCost}   TIER: ${(data.vendorTier ?? 'basic').toUpperCase()}`}
        </Text>

        <Text style={[vc.desc, soldOut && vc.dimText]}>{data.description}</Text>

        <TouchableOpacity
          style={[
            vc.buyBtn,
            { borderColor: disabled ? `${colors.outline}66` : accent },
            disabled && vc.buyBtnDisabled,
          ]}
          onPress={disabled ? undefined : onPurchase}
          activeOpacity={0.7}
        >
          <Text style={[vc.buyBtnText, { color: disabled ? colors.outline : accent }]}>
            {btnLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const vc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.surfaceContainerLowest,
  },
  soldOut: {
    opacity: 0.45,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  hackBadge: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  hackBadgeText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  meta: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  desc: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  dimText: {
    opacity: 0.6,
  },
  buyBtn: {
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 4,
    alignItems: 'center',
  },
  buyBtnDisabled: {
    backgroundColor: 'transparent',
  },
  buyBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
