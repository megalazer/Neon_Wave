import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { QUALITY_CONFIG } from '../../data/recruitQuality';
import { CYBERWARE_ITEMS } from '../../data/cyberware';
import { getFaction } from '../../data/factions';
import AnimatedRainbowBorder from './AnimatedRainbowBorder';
import RecruitButton from './RecruitButton';
import PortraitPreview from './PortraitPreview';

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
    : canAfford
    ? colors.primary
    : quality === 'rare'
    ? colors.secondaryContainer
    : colors.outlineVariant;

  const turnsLeft = isGenerated ? recruit.expiresAtTurn - currentTurn : null;
  const expiryUrgent = isGenerated && turnsLeft <= 3;

  const cardBgColor = canAfford ? `${colors.primary}08` : 'rgba(28,27,29,0.95)';
  const faction = getFaction(recruit.faction);
  const cardContent = (
    <>
      {/* Top badge */}
      <View style={[styles.qualityChip, { backgroundColor: quality === 'legendary' ? 'transparent' : cfg?.color || colors.outline }]}>
        <Text style={[styles.qualityChipText, quality === 'legendary' && styles.legendaryChipText]}>
          {cfg?.label || 'OPERATIVE'}
        </Text>
      </View>

      {/* Portrait */}
      <PortraitPreview
        size={null}
        character={recruit}
        portrait={recruit.portrait}
        borderColor={portraitColor}
        backgroundColor={colors.surfaceContainerHigh}
        fallbackIcon={CLASS_ICONS[classKey(recruit.class)] || 'person'}
        style={styles.portrait}
      />

      {/* Identity */}
      <View style={styles.identity}>
        <Text style={[styles.name, { color: portraitColor }]}>{recruit.name}</Text>
        {isGenerated && <Text style={[styles.handle, { color: cfg.color }]}>{recruit.handle}</Text>}
        <View style={styles.clsRow}>
          <Text style={styles.cls}>
            {classKey(recruit.class).replace('_', ' ').toUpperCase()}
          </Text>
          {faction && (
            <View style={[styles.factionChip, { borderColor: `${faction.accent}88` }]}>
              <Text style={[styles.factionChipText, { color: faction.accent }]}>{faction.tag}</Text>
            </View>
          )}
        </View>
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
          <Text style={[styles.statVal, styles.statValAccent]}>{Math.round((recruit.vitals.current + recruit.neural.current) / 2)}</Text>
        </View>
      </View>

      {/* Affordability flavor text — signals the player they can recruit */}
      {canAfford && !rosterFull && (
        <View style={styles.flavorRow}>
          <MaterialIcons name="sync" size={10} color={colors.primary} />
          <Text style={styles.flavorText}>SYNC_READY — RECRUITMENT_VIABLE</Text>
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
    <View style={[styles.card, { borderColor: cardBorderColor, backgroundColor: cardBgColor }, !isGenerated && styles.cardGlow]}>
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
    width: '100%',
    aspectRatio: 1,
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
  clsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  cls: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  factionChip: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  factionChipText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 7,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  flavorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: `${colors.primary}33`,
    paddingTop: 6,
  },
  flavorText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 8,
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
  voiceLine: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    fontStyle: 'italic',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  traitChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  traitChipText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  backstory: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 0.3,
    lineHeight: 13,
    marginTop: 6,
  },
});
