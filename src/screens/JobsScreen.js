import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/index';
import { advanceTurn } from '../engine/turnPipeline';
import { ACTIVITIES } from '../data/activities';
import { CONTRACTS } from '../data/contracts';
import { colors } from '../theme/colors';

const BANNER_HEIGHT = 90;
const NAV_HEIGHT = 72;

// --- Accent helpers ---
function getAccent(accent) {
  switch (accent) {
    case 'primary':
      return {
        leftBorder: colors.primary,
        moduleText: colors.primary,
        nameColor: colors.primary,
        iconColor: colors.primary,
        btnBorder: colors.primary,
        btnTextRest: colors.primary,
        btnTextFilled: colors.background,
        btnFill: colors.primary,
      };
    case 'secondary':
      return {
        leftBorder: colors.secondary,
        moduleText: colors.secondary,
        nameColor: colors.secondary,
        iconColor: colors.secondary,
        btnBorder: colors.secondary,
        btnTextRest: colors.secondary,
        btnTextFilled: colors.background,
        btnFill: colors.secondary,
      };
    case 'error':
      return {
        leftBorder: colors.error,
        moduleText: colors.error,
        nameColor: colors.error,
        iconColor: colors.error,
        btnBorder: colors.error,
        btnTextRest: colors.error,
        btnTextFilled: colors.background,
        btnFill: colors.error,
      };
    case 'outline':
    default:
      return {
        leftBorder: colors.outline,
        moduleText: colors.outline,
        nameColor: colors.outline,
        iconColor: colors.outline,
        btnBorder: colors.outline,
        btnTextRest: colors.outline,
        btnTextFilled: colors.outline,
        btnFill: 'transparent',
      };
  }
}

// --- MonitorCell ---
function MonitorCell({ member }) {
  const hpPct = member ? Math.min(1, member.vitals.current / member.vitals.max) : 0;
  const neuPct = member ? Math.min(1, member.neural.current / member.neural.max) : 0;

  return (
    <View style={styles.monitorCell}>
      <View style={[styles.monitorAvatar, member && styles.monitorAvatarFilled]}>
        <MaterialIcons name="person" size={18} color={member ? (member.classColor || colors.primary) : `${colors.primary}40`} />
      </View>
      <View style={styles.monitorInfo}>
        <Text style={[styles.monitorName, member && styles.monitorNameFilled]} numberOfLines={1}>
          {member ? member.name.toUpperCase() : 'EMPTY'}
        </Text>
        <View style={styles.monitorBarRow}>
          <View style={styles.monitorBarBg}>
            <View style={[styles.monitorBarFill, { width: `${Math.round(hpPct * 100)}%`, backgroundColor: colors.tertiaryFixedDim }]} />
          </View>
        </View>
        <View style={styles.monitorBarRow}>
          <View style={styles.monitorBarBg}>
            <View style={[styles.monitorBarFill, { width: `${Math.round(neuPct * 100)}%`, backgroundColor: colors.secondary }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

// --- UnitStatusMonitor ---
function UnitStatusMonitor({ members }) {
  const slots = [members[0] || null, members[1] || null, members[2] || null, members[3] || null];
  const totalCurrent = members.reduce((sum, m) => sum + m.vitals.current + m.neural.current, 0);
  const pwr = (totalCurrent / 100).toFixed(1);
  const allFull = members.every(
    (m) => m.vitals.current >= m.vitals.max && m.neural.current >= m.neural.max,
  );

  return (
    <View style={styles.monitorContainer}>
      <Text style={styles.monitorFloatLabel}>UNIT_STATUS_MONITOR</Text>
      <View style={styles.monitorGrid}>
        {slots.map((member, i) => (
          <MonitorCell key={i} member={member} />
        ))}
      </View>
      <View style={styles.monitorFooter}>
        <Text style={styles.monitorFooterText}>
          PWR: <Text style={{ color: colors.primary }}>{pwr}k</Text>
        </Text>
        <Text style={[styles.monitorFooterText, { color: allFull ? colors.primary : colors.secondary }]}>
          {allFull ? 'SYSTEMS_NOMINAL' : 'DEGRADED'}
        </Text>
      </View>
    </View>
  );
}

// --- SegmentedTabs ---
function SegmentedTabs({ active, onChange }) {
  return (
    <View style={styles.segmentedRow}>
      <TouchableOpacity
        style={[styles.segmentTab, active === 'contracts' && styles.segmentTabActive]}
        onPress={() => onChange('contracts')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="description" size={14} color={active === 'contracts' ? colors.secondary : colors.outline} />
        <Text style={[styles.segmentLabel, active === 'contracts' && { color: colors.secondary }]}>
          CONTRACTS
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segmentTab, active === 'activities' && styles.segmentTabActive]}
        onPress={() => onChange('activities')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="terminal" size={14} color={active === 'activities' ? colors.secondary : colors.outline} />
        <Text style={[styles.segmentLabel, active === 'activities' && { color: colors.secondary }]}>
          ACTIVITIES
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// --- ContractCard ---
function ContractCard({ contract, renown, onAccept }) {
  const glitch = useSharedValue(0);
  const pressed = useSharedValue(0);
  const locked = contract.locked || renown < contract.renownRequired;

  const RISK_COLORS = { low: colors.tertiaryFixedDim, moderate: colors.primary, high: colors.error };
  const accentColor = contract.risk ? (RISK_COLORS[contract.risk] || colors.primary) : colors.outline;

  const btnFillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(pressed.value, [0, 1], ['transparent', accentColor]),
  }));
  const btnTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(pressed.value, [0, 1], [accentColor, colors.background]),
  }));

  const handlePressIn = useCallback(() => {
    if (locked) return;
    pressed.value = withTiming(1, { duration: 120, easing: Easing.in(Easing.linear) });
    glitch.value = withTiming(1, { duration: 80, easing: Easing.out(Easing.linear) });
  }, [locked]);

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.linear) });
    glitch.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.linear) });
  }, []);

  const handlePress = useCallback(() => {
    if (locked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAccept(contract.id);
  }, [locked, contract.id, onAccept]);

  return (
    <View style={[styles.contractCard, { borderLeftColor: accentColor, opacity: locked ? 0.45 : 1 }]}>
      {/* Header */}
      <View style={styles.activityHeader}>
        <View style={styles.contractHeaderLeft}>
          <Text style={[styles.activityModule, { color: accentColor }]}>
            [{contract.moduleNumber}]
          </Text>
          <View style={[styles.tierBadge, { borderColor: `${accentColor}66` }]}>
            <Text style={[styles.tierText, { color: accentColor }]}>{contract.tier}</Text>
          </View>
        </View>
        <MaterialIcons name={contract.icon} size={18} color={accentColor} />
      </View>

      <GlitchTitle text={contract.name} color={accentColor} glitch={glitch} />

      {/* Client / District meta */}
      {!locked && (
        <View style={styles.contractMeta}>
          <Text style={styles.contractMetaText}>
            CLIENT: <Text style={{ color: colors.primary }}>{contract.client}</Text>
          </Text>
          <Text style={styles.contractMetaText}>
            ZONE: <Text style={{ color: colors.primary }}>{contract.district}</Text>
          </Text>
        </View>
      )}

      <Text style={styles.activityDesc}>{contract.description}</Text>

      {/* Objectives */}
      {!locked && contract.objectives.length > 0 && (
        <View style={styles.objectivesList}>
          {contract.objectives.map((obj, i) => (
            <View key={i} style={styles.objectiveRow}>
              <MaterialIcons name="chevron_right" size={12} color={`${accentColor}99`} />
              <Text style={[styles.objectiveText, { color: `${accentColor}CC` }]}>{obj}</Text>
            </View>
          ))}
        </View>
      )}

      {!locked && contract.payout > 0 && (
        <RewardsRow payout={contract.payout} exp={contract.exp} accentColor={accentColor} />
      )}

      {!locked && (
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          activeOpacity={1}
        >
          <Animated.View style={[styles.activityBtn, { borderColor: accentColor }, btnFillStyle]}>
            <Animated.Text style={[styles.activityBtnText, btnTextStyle]}>
              ACCEPT_CONTRACT
            </Animated.Text>
          </Animated.View>
        </TouchableOpacity>
      )}

      {locked && (
        <View style={[styles.activityBtn, { borderColor: colors.outline }]}>
          <MaterialIcons name="lock" size={12} color={colors.outline} />
          <Text style={[styles.activityBtnText, { color: colors.outline, marginLeft: 4 }]}>
            LOCKED
          </Text>
        </View>
      )}
    </View>
  );
}

// --- GlitchTitle ---
function GlitchTitle({ text, color, glitch }) {
  const cyanStyle = useAnimatedStyle(() => ({
    opacity: glitch.value * 0.8,
    transform: [{ translateX: -2 }],
  }));
  const magentaStyle = useAnimatedStyle(() => ({
    opacity: glitch.value * 0.6,
    transform: [{ translateX: 2 }],
  }));

  return (
    <View style={styles.glitchContainer}>
      <Animated.Text style={[styles.activityName, { color: colors.primary, position: 'absolute' }, cyanStyle]}>
        {text}
      </Animated.Text>
      <Animated.Text style={[styles.activityName, { color: colors.secondary, position: 'absolute' }, magentaStyle]}>
        {text}
      </Animated.Text>
      <Text style={[styles.activityName, { color }]}>{text}</Text>
    </View>
  );
}

// --- RewardsRow — shared by ActivityCard and ContractCard ---
function RewardsRow({ payout, exp, accentColor }) {
  return (
    <View style={styles.rewardsRow}>
      <MaterialIcons name="payments" size={12} color={accentColor} />
      <Text style={[styles.rewardText, { color: accentColor }]}>
        +{payout.toLocaleString()} CR
      </Text>
      <Text style={styles.rewardSep}>·</Text>
      <MaterialIcons name="star" size={12} color={accentColor} />
      <Text style={[styles.rewardText, { color: accentColor }]}>
        +{exp} EXP
      </Text>
    </View>
  );
}

// --- ActivityCard ---
function ActivityCard({ activity, renown, onExecute }) {
  const acc = getAccent(activity.accent);
  const glitch = useSharedValue(0);
  const pressed = useSharedValue(0);
  const locked = activity.locked || renown < activity.renownRequired;

  const btnFillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      ['transparent', acc.btnFill],
    ),
  }));

  const btnTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      pressed.value,
      [0, 1],
      [acc.btnTextRest, acc.btnTextFilled],
    ),
  }));

  const handlePressIn = useCallback(() => {
    if (locked) return;
    pressed.value = withTiming(1, { duration: 120, easing: Easing.in(Easing.linear) });
    glitch.value = withTiming(1, { duration: 80, easing: Easing.out(Easing.linear) });
  }, [locked]);

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.linear) });
    glitch.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.linear) });
  }, []);

  const handlePress = useCallback(() => {
    if (locked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onExecute(activity.id);
  }, [locked, activity.id, onExecute]);

  return (
    <View style={[styles.activityCard, { borderLeftColor: acc.leftBorder, opacity: locked ? 0.45 : 1 }]}>
      <View style={styles.activityHeader}>
        <Text style={[styles.activityModule, { color: acc.moduleText }]}>
          [{activity.moduleNumber}]
        </Text>
        <MaterialIcons name={activity.icon} size={18} color={acc.iconColor} />
      </View>

      <GlitchTitle text={activity.name.toUpperCase()} color={acc.nameColor} glitch={glitch} />

      <Text style={styles.activityDesc}>{activity.description}</Text>

      {!locked && activity.payout > 0 && (
        <RewardsRow payout={activity.payout} exp={activity.exp} accentColor={acc.nameColor} />
      )}

      {!locked && activity.buttonLabel && (
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          activeOpacity={1}
        >
          <Animated.View style={[styles.activityBtn, { borderColor: acc.btnBorder }, btnFillStyle]}>
            <Animated.Text style={[styles.activityBtnText, btnTextStyle]}>
              {activity.buttonLabel}
            </Animated.Text>
          </Animated.View>
        </TouchableOpacity>
      )}

      {locked && (
        <View style={[styles.activityBtn, { borderColor: colors.outline }]}>
          <MaterialIcons name="lock" size={12} color={colors.outline} />
          <Text style={[styles.activityBtnText, { color: colors.outline, marginLeft: 4 }]}>
            LOCKED
          </Text>
        </View>
      )}
    </View>
  );
}

// --- JobsScreen ---
export default function JobsScreen({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('activities');
  const members = useStore((s) => s.crew.members);
  const renown = useStore((s) => s.character.renown);
  const executeActivity = useStore((s) => s.executeActivity);
  const acceptContract = useStore((s) => s.acceptContract);
  const startTestBattle = useStore((s) => s.startTestBattle);

  const handleExecute = useCallback(
    (activityId) => {
      const activity = ACTIVITIES.find((a) => a.id === activityId);
      if (activity?.isTestBattle) {
        startTestBattle();
        onNavigate('battle');
        return;
      }
      executeActivity(activityId);
      advanceTurn();
      onNavigate('neural');
    },
    [executeActivity, startTestBattle, onNavigate],
  );

  const handleAccept = useCallback(
    (contractId) => {
      acceptContract(contractId);
      advanceTurn();
      onNavigate('neural');
    },
    [acceptContract, onNavigate],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <UnitStatusMonitor members={members} />

        <SegmentedTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'contracts' && (
          <View style={styles.activitiesList}>
            {CONTRACTS.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                renown={renown}
                onAccept={handleAccept}
              />
            ))}
          </View>
        )}

        {activeTab === 'activities' && (
          <View style={styles.activitiesList}>
            {ACTIVITIES.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                renown={renown}
                onExecute={handleExecute}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: BANNER_HEIGHT + 8,
    paddingHorizontal: 16,
    paddingBottom: NAV_HEIGHT + 90 + 24,
  },

  // Monitor
  monitorContainer: {
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    backgroundColor: 'rgba(28,27,29,0.5)',
    marginBottom: 16,
    marginTop: 8,
    paddingTop: 16,
  },
  monitorFloatLabel: {
    position: 'absolute',
    top: -10,
    left: 12,
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    backgroundColor: colors.background,
    paddingHorizontal: 4,
  },
  monitorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monitorCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: `${colors.primary}1A`,
  },
  monitorAvatar: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}0D`,
    flexShrink: 0,
  },
  monitorAvatarFilled: {
    borderColor: `${colors.primary}CC`,
    backgroundColor: `${colors.primary}1A`,
  },
  monitorInfo: {
    flex: 1,
  },
  monitorName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: `${colors.primary}66`,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  monitorNameFilled: {
    color: colors.primary,
  },
  monitorBarRow: {
    marginBottom: 2,
  },
  monitorBarBg: {
    height: 4,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  monitorBarFill: {
    height: '100%',
  },
  monitorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: `${colors.primary}1A`,
  },
  monitorFooterText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Segmented tabs
  segmentedRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: `${colors.secondary}4D`,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: `${colors.secondary}4D`,
  },
  segmentTabActive: {
    backgroundColor: `${colors.secondary}1A`,
    borderTopWidth: 2,
    borderTopColor: colors.secondary,
  },
  segmentLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Rewards row
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: `${colors.outline}26`,
  },
  rewardText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rewardSep: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: colors.outline,
  },

  // Contract card
  contractCard: {
    borderWidth: 1,
    borderColor: `${colors.outline}4D`,
    borderLeftWidth: 3,
    backgroundColor: 'rgba(28,27,29,0.6)',
    padding: 14,
    gap: 8,
  },
  contractHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tierText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  contractMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  contractMetaText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  objectivesList: {
    gap: 4,
    paddingLeft: 2,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  objectiveText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Activities list
  activitiesList: {
    gap: 12,
  },

  // Activity card
  activityCard: {
    borderWidth: 1,
    borderColor: `${colors.outline}4D`,
    borderLeftWidth: 3,
    backgroundColor: 'rgba(28,27,29,0.6)',
    padding: 14,
    gap: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityModule: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  glitchContainer: {
    position: 'relative',
    height: 22,
    justifyContent: 'center',
  },
  activityName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activityDesc: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 0.5,
    lineHeight: 17,
  },
  activityBtn: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  activityBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
