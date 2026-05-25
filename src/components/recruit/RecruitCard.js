import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { QUALITY_CONFIG } from '../../data/recruitQuality';
import { CYBERWARE_ITEMS } from '../../data/cyberware';
import AnimatedRainbowBorder from './AnimatedRainbowBorder';
import RecruitButton from './RecruitButton';

const CLASS_ICONS = {
  netrunner:      'psychology',
  street_samurai: 'bolt',
  fixer:          'handshake',
  ghost:          'visibility-off',
  chrome_doc:     'medical-services',
};

function classKey(cls) {
  return (cls || '').toLowerCase().replace(/\s+/g, '_');
}

function statsAvg(stats) {
  const vals = Object.values(stats);
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

export default function RecruitCard({ recruit, credits, rosterFull, currentTurn, onRecruit, onDismiss }) {
  const isGenerated = recruit.quality !== undefined;
  const quality = recruit.quality;
  const cfg = isGenerated ? QUALITY_CONFIG[quality] : null;
  const canAfford = credits >= recruit.cost;

  const portraitColor = !isGenerated
    ? (recruit.classColor || colors.primary)
    : quality === 'common'    ? colors.outline
    : quality === 'rare'      ? colors.secondaryContainer
    : colors.tertiaryContainer;

  const cardBorderColor = !isGenerated
    ? colors.primary
    : quality === 'rare'
    ? colors.secondaryContainer
    : colors.outlineVariant;

  const turnsLeft = isGenerated ? recruit.expiresAtTurn - currentTurn : null;
  const expiryUrgent = isGenerated && turnsLeft <= 3;

  const cardContent = (
    <>
      {/* Top badge */}
      {isGenerated ? (
        <View style={[styles.qualityChip, { backgroundColor: quality === 'legendary' ? 'transparent' : cfg.color }]}>
          <Text style={[styles.qualityChipText, quality === 'legendary' && styles.legendaryChipText]}>
            {cfg.label}
          </Text>
        </View>
      ) : (
        <View style={[styles.idBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.idBadgeText}>{recruit.displayId}</Text>
        </View>
      )}

      {/* Portrait */}
      <View style={[styles.portrait, { borderColor: portraitColor }]}>
        <MaterialIcons
          name={CLASS_ICONS[classKey(recruit.class)] || 'person'}
          size={52}
          color={portraitColor}
          style={{ opacity: 0.75 }}
        />
      </View>

      {/* Identity */}
      <View style={styles.identity}>
        <Text style={[styles.name, { color: portraitColor }]}>{recruit.name}</Text>
        {isGenerated && <Text style={[styles.handle, { color: cfg.color }]}>{recruit.handle}</Text>}
        <Text style={styles.cls}>
          {classKey(recruit.class).replace('_', ' ').toUpperCase()}
        </Text>
      </View>

      {/* Stat pills */}
      <View style={styles.statRow}>
        <View style={styles.statPill}>
          <Text style={styles.statLabel}>VIT</Text>
          <Text style={styles.statVal}>{recruit.vitals.current}</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statLabel}>NEU</Text>
          <Text style={styles.statVal}>{recruit.neural.current}</Text>
        </View>
        <View style={[styles.statPill, styles.statPillAccent]}>
          <Text style={[styles.statLabel, styles.statLabelAccent]}>AVG</Text>
          <Text style={[styles.statVal, styles.statValAccent]}>{statsAvg(recruit.stats)}</Text>
        </View>
      </View>

      {/* Cyberware chips */}
      {isGenerated && recruit.equippedCyberware.length > 0 && (
        <View style={styles.cwRow}>
          {recruit.equippedCyberware.map((cwId) => {
            const cw = CYBERWARE_ITEMS.find((c) => c.id === cwId);
            return (
              <View key={cwId} style={[styles.cwChip, { borderColor: `${cfg.color}88` }]}>
                <Text style={[styles.cwText, { color: cfg.color }]} numberOfLines={1}>
                  {cw?.name ?? cwId}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Expiry */}
      {isGenerated && (
        <View style={styles.expiryRow}>
          <MaterialIcons name="schedule" size={9} color={expiryUrgent ? colors.error : colors.outline} />
          <Text style={[styles.expiryText, expiryUrgent && styles.expiryUrgent]}>
            {turnsLeft <= 0
              ? 'EXPIRED'
              : `EXPIRES IN ${turnsLeft} TURN${turnsLeft !== 1 ? 'S' : ''}`}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.cost, { color: canAfford ? colors.tertiaryContainer : colors.error }]}>
          {recruit.cost.toLocaleString()} CR
        </Text>
        <View style={styles.footerBtns}>
          {isGenerated && onDismiss && (
            <TouchableOpacity style={styles.passBtn} onPress={() => onDismiss(recruit.id)} activeOpacity={0.7}>
              <Text style={styles.passBtnText}>[PASS]</Text>
            </TouchableOpacity>
          )}
          <RecruitButton
            quality={quality}
            canAfford={canAfford}
            rosterFull={rosterFull}
            onRecruit={() => onRecruit(recruit.id)}
          />
        </View>
      </View>
    </>
  );

  if (quality === 'legendary') {
    return (
      <AnimatedRainbowBorder style={[styles.card, styles.cardInner]} borderWidth={2}>
        {cardContent}
      </AnimatedRainbowBorder>
    );
  }

  return (
    <View style={[styles.card, { borderColor: cardBorderColor }, !isGenerated && styles.cardGlow]}>
      {cardContent}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    backgroundColor: 'rgba(28,27,29,0.95)',
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardInner: {
    // padding is handled by AnimatedRainbowBorder's children area
  },
  cardGlow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  qualityChip: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  qualityChipText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.background,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  legendaryChipText: {
    color: '#ffb400',
  },
  idBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  idBadgeText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.onPrimaryContainer,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  portrait: {
    height: 112,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { gap: 2 },
  name: {
    fontFamily: 'KodeMono_600SemiBold',
    fontSize: 18,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  handle: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cls: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  statRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingVertical: 5,
    alignItems: 'center',
    gap: 2,
  },
  statPillAccent: {
    borderColor: `${colors.primary}55`,
    backgroundColor: `${colors.primary}08`,
  },
  statLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statLabelAccent: { color: colors.primary },
  statVal: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    color: colors.onSurface,
  },
  statValAccent: { color: colors.primary },
  cwRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cwChip: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cwText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 8,
    letterSpacing: 0.6,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  expiryUrgent: {
    color: colors.error,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    paddingTop: 8,
  },
  cost: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  footerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passBtn: {
    borderWidth: 1,
    borderColor: `${colors.outline}88`,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  passBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
