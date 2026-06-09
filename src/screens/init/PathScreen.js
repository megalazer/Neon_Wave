import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ORIGINS } from '../../data/origins';
import { useStore } from '../../store/index';
import { colors } from '../../theme/colors';
import InitHeader from '../../components/init/InitHeader';
import InitFooter from '../../components/init/InitFooter';

const HEADER_H = 90;

export default function PathScreen({ draft, onSetPath, onContinue }) {
  const unlocked = useStore((s) => s.achievements.account.unlocked);
  const selected = draft.path;
  const promptText = selected
    ? `> PATH_LOCKED: ${selected.toUpperCase()}. PROCEED_TO_IDENTITY?`
    : '> AWAITING_PATH_SELECTION...';

  return (
    <View style={styles.root}>
      <InitHeader step={1} stepLabel="PATH" />

      <Text style={styles.decalL} pointerEvents="none">NEURAL_VOID</Text>
      <Text style={styles.decalR} pointerEvents="none">OVERWRITE_CMD</Text>
      <View style={styles.content}>
        {ORIGINS.map((origin) => {
          const active = selected === origin.id;
          const isLocked = origin.lockedBy && !unlocked.includes(origin.lockedBy);
          const dimmed = isLocked && !active;
          const borderColor = active ? origin.color : `${origin.color}${dimmed ? '15' : '33'}`;
          const textColor = dimmed ? `${origin.color}33` : origin.color;
          return (
            <TouchableOpacity
              key={origin.id}
              style={[
                styles.card,
                { borderColor },
                active && {
                  shadowColor: origin.color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 14,
                  elevation: 8,
                },
                dimmed && { opacity: 0.45 },
              ]}
              onPress={() => {
                if (isLocked) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  return;
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSetPath(origin.id);
              }}
              activeOpacity={isLocked ? 1 : 0.85}
            >
              {/* Image placeholder area */}
              <View style={[styles.imgArea, { backgroundColor: `${origin.color}0D` }]}>
                <MaterialIcons
                  name={isLocked ? 'lock' : origin.icon}
                  size={52}
                  color={`${origin.color}${dimmed ? '1A' : '55'}`}
                />
                <View
                  style={[
                    styles.badge,
                    {
                      borderColor: origin.color,
                      backgroundColor: active ? origin.color : 'transparent',
                    },
                    dimmed && { opacity: 0.3 },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: active ? origin.onColor : origin.color }]}>
                    {origin.badge}
                  </Text>
                </View>
                {/* Decor corners */}
                <View style={[styles.cTL, { borderColor: `${origin.color}${dimmed ? '22' : '66'}` }]} />
                <View style={[styles.cBR, { borderColor: `${origin.color}${dimmed ? '22' : '66'}` }]} />
              </View>

              {/* Card content */}
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: textColor }]}>
                  PROTOCOL: {origin.label}
                </Text>
                <Text style={[styles.cardDesc, dimmed && { color: `${colors.outline}44` }]}>
                  {origin.desc}
                </Text>
                <Text style={[styles.cardBonus, { color: `${origin.color}${dimmed ? '33' : '99'}` }]}>
                  {origin.bonusLine}
                </Text>
                {isLocked ? (
                  <View style={[styles.selectRow, { borderColor: `${colors.error}44`, backgroundColor: `${colors.error}0A` }]}>
                    <MaterialIcons name="lock" size={12} color={colors.error} />
                    <Text style={[styles.selectText, { color: colors.error }]}>
                      REQUIRES: AMASS 1,000,000 CR IN A RUN
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.selectRow,
                      {
                        borderColor: active ? origin.color : `${origin.color}44`,
                        backgroundColor: active ? `${origin.color}1A` : 'transparent',
                      },
                    ]}
                  >
                    {active && <MaterialIcons name="check-circle" size={12} color={origin.color} />}
                    <Text style={[styles.selectText, { color: origin.color }]}>
                      {active ? 'PATH_SELECTED' : 'EXECUTE_CHOICE'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Terminal prompt */}
        <View style={styles.prompt}>
          <Text style={[styles.promptText, { color: selected ? colors.primary : `${colors.primary}55` }]}>
            {promptText}
          </Text>
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnOff]}
          onPress={() => {
            if (!selected) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onContinue();
          }}
          activeOpacity={selected ? 0.75 : 1}
        >
          <Text style={[styles.continueTxt, !selected && styles.continueTxtOff]}>
            {selected ? 'CONTINUE →' : 'SELECT_PATH_FIRST'}
          </Text>
        </TouchableOpacity>

        <InitFooter />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    flex: 1,
    paddingTop: HEADER_H + 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  decalL: {
    position: 'absolute',
    left: -48,
    top: '38%',
    transform: [{ rotate: '-90deg' }],
    fontFamily: 'KodeMono_700Bold',
    fontSize: 30,
    color: colors.primary,
    opacity: 0.04,
    letterSpacing: 8,
    zIndex: 0,
  },
  decalR: {
    position: 'absolute',
    right: -72,
    top: '28%',
    transform: [{ rotate: '90deg' }],
    fontFamily: 'KodeMono_700Bold',
    fontSize: 26,
    color: colors.secondaryContainer,
    opacity: 0.04,
    letterSpacing: 6,
    zIndex: 0,
  },
  card: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
  },
  imgArea: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  cTL: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 14,
    height: 14,
    borderLeftWidth: 1,
    borderTopWidth: 1,
  },
  cBR: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  cardBody: { padding: 8, gap: 4 },
  cardTitle: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  cardBonus: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  selectRow: {
    borderWidth: 1,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  selectText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  prompt: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: `${colors.primary}26`,
    backgroundColor: `${colors.primary}06`,
  },
  promptText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueBtnOff: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: `${colors.outline}55`,
  },
  continueTxt: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    color: colors.onPrimary,
    textTransform: 'uppercase',
  },
  continueTxtOff: { color: `${colors.outline}55` },
});
