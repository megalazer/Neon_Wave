import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import ConfirmModal from '../components/ConfirmModal';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/index';
import { colors } from '../theme/colors';

const BANNER_HEIGHT = 90;
const NAV_HEIGHT = 72;
const CARD_WIDTH = 280;
const MAX_CREW = 3;

function SectionHeader({ icon, label, color }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={16} color={color} />
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

function PortraitPlaceholder({ classColor }) {
  return (
    <View style={[styles.portrait, { borderColor: colors.secondaryContainer }]}>
      <MaterialIcons name="person" size={52} color={classColor} style={{ opacity: 0.75 }} />
    </View>
  );
}

function RecruitButton({ label, onPress, disabled }) {
  const pressed = useSharedValue(0);

  const containerAnim = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(pressed.value, [0, 1], ['rgba(0,0,0,0)', colors.primary]),
  }));
  const labelAnim = useAnimatedStyle(() => ({
    color: interpolateColor(pressed.value, [0, 1], [colors.primary, colors.onPrimaryContainer]),
  }));

  return (
    <Animated.View style={[styles.recruitBtn, disabled && styles.recruitBtnDisabled, containerAnim]}>
      <TouchableOpacity
        onPressIn={() => { if (!disabled) pressed.value = withTiming(1, { duration: 75 }); }}
        onPressOut={() => { pressed.value = withTiming(0, { duration: 75 }); }}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={1}
        style={styles.recruitBtnInner}
      >
        <Animated.Text style={[styles.recruitBtnText, labelAnim]}>{label}</Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function OperativeCard({ operative, canAfford, rosterFull, onRecruit }) {
  const disabled = !canAfford || rosterFull;
  const buttonLabel = rosterFull
    ? '[ROSTER_FULL]'
    : canAfford
    ? 'RECRUIT'
    : '[INSUFFICIENT_FUNDS]';

  return (
    <View style={styles.card}>
      <View style={styles.idBadge}>
        <Text style={styles.idBadgeText}>{operative.displayId}</Text>
      </View>
      <PortraitPlaceholder classColor={operative.classColor} />
      <View>
        <Text style={styles.opName}>{operative.name}</Text>
        <Text style={styles.opClass}>Class: {operative.class}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.opCost}>{operative.cost.toLocaleString()} CR</Text>
        <RecruitButton
          label={buttonLabel}
          onPress={() => onRecruit(operative.id)}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

function StatBar({ current, max, fillColor }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <View style={styles.statBarBg}>
      <View style={[styles.statBarFill, { width: `${pct}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

function RosterRow({ member, index, onDismiss }) {
  const indexLabel = String(index + 1).padStart(3, '0') + ' |';
  return (
    <View style={styles.rosterRow}>
      <View style={styles.rosterLeft}>
        <Text style={styles.rosterIndex}>{indexLabel}</Text>
        <Text style={styles.rosterName}>{member.name}</Text>
      </View>
      <View style={styles.rosterBars}>
        <View style={styles.barGroup}>
          <View style={styles.barLabels}>
            <Text style={styles.barLabelHp}>HP</Text>
            <Text style={styles.barLabelHp}>{member.hp.current}/{member.hp.max}</Text>
          </View>
          <StatBar current={member.hp.current} max={member.hp.max} fillColor={colors.tertiaryContainer} />
        </View>
        <View style={styles.barGroup}>
          <View style={styles.barLabels}>
            <Text style={styles.barLabelMp}>MP</Text>
            <Text style={styles.barLabelMp}>{member.mp.current}/{member.mp.max}</Text>
          </View>
          <StatBar current={member.mp.current} max={member.mp.max} fillColor={colors.primary} />
        </View>
      </View>
      <TouchableOpacity
        style={styles.dismissBtn}
        onPress={() => onDismiss(member)}
        activeOpacity={0.7}
      >
        <Text style={styles.dismissBtnText}>DISMISS</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptySlot({ onPress }) {
  return (
    <TouchableOpacity style={styles.emptySlot} onPress={onPress} activeOpacity={0.7}>
      <MaterialIcons name="add" size={20} color={colors.outlineVariant} />
      <Text style={styles.emptySlotText}>[ASSIGN_OPERATIVE]</Text>
    </TouchableOpacity>
  );
}

export default function HavenScreen() {
  const scrollRef = useRef(null);
  const [confirmDismiss, setConfirmDismiss] = useState(null);
  const availableOperatives = useStore((s) => s.crew.availableOperatives);
  const members = useStore((s) => s.crew.members);
  const credits = useStore((s) => s.character.credits);
  const recruitOperative = useStore((s) => s.recruitOperative);
  const dismissMember = useStore((s) => s.dismissMember);

  const handleRecruit = useCallback((operativeId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recruitOperative(operativeId);
  }, [recruitOperative]);

  const handleDismissPress = useCallback((member) => {
    setConfirmDismiss(member);
  }, []);

  const handleConfirmDismiss = useCallback(() => {
    dismissMember(confirmDismiss.id);
    setConfirmDismiss(null);
  }, [dismissMember, confirmDismiss]);

  const scrollToOperatives = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const rosterFull = members.length >= MAX_CREW;
  const emptySlotCount = Math.max(0, MAX_CREW - members.length);

  return (
    <>
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Available Operatives */}
      <View style={styles.section}>
        <SectionHeader icon="group_add" label="[AVAILABLE_OPERATIVES]" color={colors.primary} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.opScrollContent}
          nestedScrollEnabled
        >
          {availableOperatives.map((op) => (
            <OperativeCard
              key={op.id}
              operative={op}
              canAfford={credits >= op.cost}
              rosterFull={rosterFull}
              onRecruit={handleRecruit}
            />
          ))}
          {availableOperatives.length === 0 && (
            <View style={styles.noOpsPlaceholder}>
              <Text style={styles.noOpsText}>[ NO OPERATIVES AVAILABLE ]</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Recharge Bar (stub) */}
      <View style={styles.section}>
        <SectionHeader
          icon="local_bar"
          label="[RECHARGE_BAR: Drinks & Stimulants]"
          color={colors.secondaryContainer}
        />
        <View style={styles.rechargeStub}>
          <Text style={styles.rechargeStubText}>[RECHARGE_BAR // PROTOCOL_OFFLINE]</Text>
        </View>
      </View>

      {/* Party Roster */}
      <View style={styles.section}>
        <SectionHeader icon="view_list" label="[PARTY_ROSTER]" color={colors.primary} />
        {members.map((member, i) => (
          <RosterRow key={member.id} member={member} index={i} onDismiss={handleDismissPress} />
        ))}
        {Array.from({ length: emptySlotCount }).map((_, i) => (
          <EmptySlot key={`empty_${i}`} onPress={scrollToOperatives} />
        ))}
      </View>
    </ScrollView>

    <ConfirmModal
      visible={confirmDismiss !== null}
      variant="destructive"
      title="DISMISS_OPERATIVE"
      body={`Terminate contract with ${confirmDismiss?.name}? Crew member will be removed. This action cannot be reversed.`}
      warning="Neural binding will be severed."
      confirmLabel="[EXECUTE_DISMISSAL]"
      cancelLabel="[ABORT_PROTOCOL]"
      onConfirm={handleConfirmDismiss}
      onCancel={() => setConfirmDismiss(null)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: BANNER_HEIGHT + 8,
    paddingBottom: NAV_HEIGHT + 24,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Horizontal scroll for operative cards
  opScrollContent: {
    gap: 16,
    paddingBottom: 8,
    paddingRight: 4,
  },

  // Operative card
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(28,27,29,0.9)',
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 16,
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  idBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
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
    height: 128,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  opName: {
    fontFamily: 'KodeMono_600SemiBold',
    fontSize: 20,
    color: colors.primary,
    textShadowColor: 'rgba(0,243,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  opClass: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    paddingTop: 8,
  },
  opCost: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.tertiaryContainer,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  recruitBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  recruitBtnDisabled: {
    opacity: 0.4,
  },
  recruitBtnInner: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  recruitBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  noOpsPlaceholder: {
    width: 240,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noOpsText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Recharge bar stub
  rechargeStub: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.secondaryContainer,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  rechargeStubText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.secondaryContainer,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Roster row
  rosterRow: {
    backgroundColor: 'rgba(28,27,29,0.9)',
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  rosterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  rosterIndex: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rosterName: {
    fontFamily: 'KodeMono_600SemiBold',
    fontSize: 16,
    color: colors.primary,
    textShadowColor: 'rgba(0,243,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  rosterBars: {
    flex: 1,
    gap: 4,
  },
  barGroup: {
    gap: 2,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabelHp: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.tertiaryContainer,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  barLabelMp: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statBarBg: {
    height: 6,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  statBarFill: {
    height: 6,
  },
  dismissBtn: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  dismissBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.error,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Empty roster slot
  emptySlot: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  emptySlotText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outlineVariant,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
