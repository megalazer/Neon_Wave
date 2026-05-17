import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { STARTER_CYBERWARE } from '../../data/cyberware';
import { deriveStats } from '../../data/origins';
import { colors } from '../../theme/colors';
import InitHeader from '../../components/init/InitHeader';
import InitFooter from '../../components/init/InitFooter';

const HEADER_H = 90;

const STAT_KEYS = ['chrome', 'edge', 'ghost', 'face', 'grit', 'wire'];

const GENDER_ICON = { female: 'female', male: 'male', non_binary: 'transgender' };

// --- SyslogCard ---
function SyslogCard({ draft }) {
  return (
    <View style={styles.syslogCard}>
      <View style={styles.syslogTop}>
        <View>
          <Text style={styles.syslogStreamLabel}>[DATA_STREAM]</Text>
          <Text style={styles.syslogTitle}>SYSLOG: READY_FOR_SYNC</Text>
        </View>
        <View style={styles.lockedChip}>
          <Text style={styles.lockedText}>LOCKED</Text>
        </View>
      </View>

      {[
        { label: 'SELECTED_PATH',     value: (draft.path || 'NONE').toUpperCase(),                    color: colors.primary },
        { label: 'NEURAL_PROFILE',    value: (draft.gender || 'NONE').toUpperCase().replace('_', '-'), color: colors.secondary },
        { label: 'LATENCY_PROTOCOL',  value: '0.0024ms (DIRECT)',                                     color: colors.outline },
      ].map((row) => (
        <View key={row.label} style={styles.syslogRow}>
          <View style={styles.syslogRowAccent} />
          <View style={styles.syslogRowBody}>
            <Text style={styles.syslogRowLabel}>{row.label}</Text>
            <Text style={[styles.syslogRowValue, { color: row.color }]}>{row.value}</Text>
          </View>
        </View>
      ))}

      {/* Calibration bar */}
      <View style={styles.calibWrap}>
        <View style={styles.calibHeader}>
          <Text style={styles.calibLabel}>NEURAL_CALIBRATION</Text>
          <Text style={styles.calibPct}>88.42%</Text>
        </View>
        <View style={styles.calibBar}>
          <View style={[styles.calibFill, { flex: 88 }]} />
          <View style={{ flex: 3 }} />
          <View style={styles.calibDash} />
          <View style={{ flex: 2 }} />
          <View style={styles.calibDash} />
          <View style={{ flex: 4 }} />
        </View>
        <Text style={styles.calibItalic}>{'>> SYNAPTIC_BRIDGING_IN_PROGRESS...'}</Text>
      </View>
    </View>
  );
}

// --- WarningCard ---
function WarningCard() {
  return (
    <View style={styles.warningCard}>
      <View style={styles.warningHeader}>
        <MaterialIcons name="warning" size={14} color={colors.error} />
        <Text style={styles.warningTitle}>CRITICAL_WARNING</Text>
      </View>
      <Text style={styles.warningBody}>
        NEURAL OVERWRITE IS PERMANENT. PROCEEDING WILL ERASE ALL PREVIOUS BIOMETRIC SNAPSHOTS AND INITIALIZE A NEW IDENTITY CONSTRUCT. THERE IS NO RECOVERY PATH BEYOND THIS NODE.
      </Text>
      <View style={styles.warningBars}>
        <View style={styles.wBar} />
        <View style={[styles.wBar, { opacity: 0.55 }]} />
        <View style={[styles.wBar, { opacity: 0.25 }]} />
      </View>
    </View>
  );
}

// --- PortraitFrame + InitBtn ---
function PortraitFrame({ draft, onPress, glitchX, glitchOpacity }) {
  const pulseOpacity = useSharedValue(0.3);
  const scanY = useSharedValue(-50);
  const scanAlpha = useSharedValue(0);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));
  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
    opacity: scanAlpha.value,
  }));
  const btnScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handlePress = useCallback(() => {
    btnScale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withTiming(1, { duration: 200 }),
    );
    scanAlpha.value = 1;
    scanY.value = withTiming(260, { duration: 700, easing: Easing.linear }, () => {
      scanAlpha.value = 0;
      scanY.value = -50;
    });
    onPress();
  }, [onPress]);

  const genderIcon = GENDER_ICON[draft.gender] || 'person';
  const handleName = draft.name || 'UNKNOWN';

  return (
    <View style={styles.portrait}>
      {/* Border corners */}
      <View style={[styles.bracket, styles.bTL, { borderColor: colors.primary }]} />
      <View style={[styles.bracket, styles.bTR, { borderColor: colors.secondary }]} />
      <View style={[styles.bracket, styles.bBL, { borderColor: colors.primary }]} />
      <View style={[styles.bracket, styles.bBR, { borderColor: colors.secondary }]} />

      {/* Centre icon */}
      <View style={styles.portraitCenter}>
        <MaterialIcons name={genderIcon} size={72} color={`${colors.primary}70`} />
        <Text style={styles.avatarHandle}>{handleName}</Text>
        <Text style={styles.avatarLabel}>NEURAL_AVATAR_NOT_RENDERED</Text>
      </View>

      {/* HUD overlay top-right */}
      <View style={styles.hud}>
        <Text style={[styles.hudLine, { color: colors.primary }]}>SCAN_COORD: 34.90.11</Text>
        <Text style={[styles.hudLine, { color: colors.secondary }]}>ID_SIG: 0x8842_FINAL</Text>
      </View>

      {/* INITIALIZE_NEURAL button */}
      <Animated.View style={[styles.initBtnWrapper, btnScaleStyle]}>
        <TouchableOpacity style={styles.initBtn} onPress={handlePress} activeOpacity={0.9}>
          <Animated.View style={[styles.initBtnTopLine, pulseStyle]} />
          <View style={styles.initBtnScanWrap}>
            <Animated.View style={[styles.initBtnScanStrip, scanStyle]} />
          </View>
          <View style={styles.initBtnRow}>
            <MaterialIcons name="bolt" size={24} color={colors.primary} />
            <Text style={styles.initBtnText}>INITIALIZE_NEURAL</Text>
          </View>
          <View style={styles.initBtnFooter}>
            <Text style={styles.initBtnFooterText}>SECURE_LINK: ESTABLISHED</Text>
            <Text style={styles.initBtnFooterText}>ENCRYPTION: 1024-BIT_AES_QUAL</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// --- StatsGrid ---
function StatsGrid({ path }) {
  const stats = deriveStats(path);
  return (
    <View style={styles.statsSection}>
      <Text style={styles.statsSectionLabel}>[INITIAL_STATS]</Text>
      <View style={styles.statsGrid}>
        {STAT_KEYS.map((key) => (
          <View key={key} style={styles.statCell}>
            <Text style={styles.statLabel}>{key.toUpperCase()}</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{stats[key]}</Text>
              <Text style={styles.statMax}>/20</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// --- LoadoutCard ---
function LoadoutCard({ item, selected, onSelect }) {
  return (
    <TouchableOpacity
      style={[styles.cyberCard, selected && styles.cyberCardSelected, !selected && { opacity: 0.5 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(item.id);
      }}
      activeOpacity={0.8}
    >
      <View style={[styles.cyberIcon, selected && styles.cyberIconSelected]}>
        <MaterialIcons name={item.icon} size={20} color={selected ? colors.secondaryContainer : colors.outline} />
      </View>
      <View style={styles.cyberBody}>
        <Text style={[styles.cyberName, selected && { color: colors.secondaryContainer }]}>
          {item.name.toUpperCase()}
        </Text>
        <View style={styles.cyberMeta}>
          <Text style={styles.cyberSlot}>{item.slot.toUpperCase()}</Text>
          <View style={styles.humChip}>
            <Text style={styles.humChipText}>-{item.humanityCost} HUM</Text>
          </View>
        </View>
        <Text style={styles.cyberDesc}>{item.description}</Text>
        <Text style={styles.cyberFlavor}>{item.flavor}</Text>
      </View>
    </TouchableOpacity>
  );
}

// --- FinalizeScreen ---
export default function FinalizeScreen({ draft, onBack, onComplete }) {
  const [selectedCyberware, setSelectedCyberware] = useState(
    draft.starterCyberware || 'starter_neural_link',
  );
  const committed = useRef(false);

  const glitchX = useSharedValue(0);
  const glitchOpacity = useSharedValue(1);
  const glitchStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glitchX.value }],
    opacity: glitchOpacity.value,
  }));

  const handleInitialize = useCallback(() => {
    if (committed.current) return;
    committed.current = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    glitchX.value = withSequence(
      withTiming(8,  { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(4,  { duration: 80 }),
      withTiming(-4, { duration: 80 }),
      withTiming(0,  { duration: 160 }),
    );
    glitchOpacity.value = withSequence(
      withTiming(0.4, { duration: 80 }),
      withTiming(1,   { duration: 80 }),
      withTiming(0.6, { duration: 100 }),
      withTiming(1,   { duration: 200 }),
    );

    setTimeout(() => {
      onComplete({ ...draft, starterCyberware: selectedCyberware });
    }, 620);
  }, [draft, selectedCyberware, onComplete]);

  return (
    <View style={styles.root}>
      <InitHeader step={3} stepLabel="FINALIZATION" />

      <Text style={styles.decalL} pointerEvents="none">NEURAL_VOID</Text>
      <Text style={styles.decalR} pointerEvents="none">OVERWRITE_CMD</Text>

      <Animated.View style={[{ flex: 1 }, glitchStyle]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <SyslogCard draft={draft} />
          <WarningCard />
          <PortraitFrame draft={draft} onPress={handleInitialize} />
          <StatsGrid path={draft.path} />

          {/* Loadout selection */}
          <View style={styles.loadoutSection}>
            <View style={styles.loadoutHeader}>
              <MaterialIcons name="bolt" size={14} color={colors.secondaryContainer} />
              <Text style={styles.loadoutHeaderLabel}>[STARTING_CYBERWARE_PROTOCOL]</Text>
            </View>
            <Text style={styles.loadoutSub}>
              Select one neural-grade implant for initial deployment.
            </Text>
            {STARTER_CYBERWARE.map((item) => (
              <LoadoutCard
                key={item.id}
                item={item}
                selected={selectedCyberware === item.id}
                onSelect={setSelectedCyberware}
              />
            ))}
          </View>

          {/* Back link */}
          <TouchableOpacity onPress={onBack} style={styles.backRow} activeOpacity={0.7}>
            <Text style={styles.backLink}>← BACK</Text>
          </TouchableOpacity>

          <InitFooter />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    paddingTop: HEADER_H + 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  decalL: {
    position: 'absolute', left: -48, top: '38%',
    transform: [{ rotate: '-90deg' }],
    fontFamily: 'KodeMono_700Bold', fontSize: 30, color: colors.primary,
    opacity: 0.04, letterSpacing: 8, zIndex: 0,
  },
  decalR: {
    position: 'absolute', right: -72, top: '28%',
    transform: [{ rotate: '90deg' }],
    fontFamily: 'KodeMono_700Bold', fontSize: 26, color: colors.secondaryContainer,
    opacity: 0.04, letterSpacing: 6, zIndex: 0,
  },

  // SYSLOG card
  syslogCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: `${colors.primary}33`,
    borderTopColor: `${colors.primary}55`,
    borderBottomColor: `${colors.primary}55`,
    padding: 14,
    gap: 10,
  },
  syslogTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  syslogStreamLabel: {
    fontFamily: 'KodeMono_700Bold', fontSize: 9,
    color: colors.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4,
  },
  syslogTitle: {
    fontFamily: 'KodeMono_700Bold', fontSize: 14,
    color: colors.onSurface, letterSpacing: 0.3, textTransform: 'uppercase',
  },
  lockedChip: {
    borderWidth: 1, borderColor: colors.primary,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  lockedText: {
    fontFamily: 'KodeMono_700Bold', fontSize: 8,
    color: colors.primary, letterSpacing: 1.5,
  },
  syslogRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  syslogRowAccent: {
    width: 2, height: '100%', backgroundColor: colors.primary, minHeight: 32,
  },
  syslogRowBody: { flex: 1, gap: 2 },
  syslogRowLabel: {
    fontFamily: 'KodeMono_700Bold', fontSize: 8,
    color: `${colors.primary}66`, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  syslogRowValue: {
    fontFamily: 'KodeMono_700Bold', fontSize: 13,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  calibWrap: { gap: 6 },
  calibHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  calibLabel: {
    fontFamily: 'KodeMono_700Bold', fontSize: 9,
    color: colors.primary, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  calibPct: {
    fontFamily: 'KodeMono_700Bold', fontSize: 9,
    color: colors.tertiaryFixedDim, letterSpacing: 1,
  },
  calibBar: {
    height: 6, flexDirection: 'row',
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  calibFill: { height: '100%', backgroundColor: colors.primary },
  calibDash: { width: 3, height: '100%', backgroundColor: colors.primary, opacity: 0.4 },
  calibItalic: {
    fontFamily: 'KodeMono_400Regular', fontSize: 9,
    color: `${colors.primary}66`, letterSpacing: 0.5, fontStyle: 'italic',
  },

  // Warning card
  warningCard: {
    backgroundColor: `${colors.errorContainer}1A`,
    borderWidth: 1, borderColor: `${colors.error}33`,
    padding: 12, gap: 10,
  },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  warningTitle: {
    fontFamily: 'KodeMono_700Bold', fontSize: 10,
    color: colors.error, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  warningBody: {
    fontFamily: 'KodeMono_400Regular', fontSize: 11,
    color: `${colors.error}CC`, letterSpacing: 0.5, lineHeight: 17,
  },
  warningBars: { gap: 3 },
  wBar: { height: 2, backgroundColor: `${colors.error}55` },

  // Portrait
  portrait: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 2,
    borderColor: colors.secondaryContainer,
    minHeight: 220,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 72,
    paddingTop: 16,
  },
  bracket: { position: 'absolute', width: 20, height: 20 },
  bTL: { top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2 },
  bTR: { top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2 },
  bBL: { bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2 },
  bBR: { bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2 },
  portraitCenter: { alignItems: 'center', gap: 6 },
  avatarHandle: {
    fontFamily: 'KodeMono_700Bold', fontSize: 14,
    color: colors.primary, letterSpacing: 1,
  },
  avatarLabel: {
    fontFamily: 'KodeMono_400Regular', fontSize: 9,
    color: `${colors.primary}55`, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  hud: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: `${colors.background}CC`,
    borderWidth: 1, borderColor: `${colors.primary}33`,
    padding: 6, gap: 2,
  },
  hudLine: {
    fontFamily: 'KodeMono_700Bold', fontSize: 8, letterSpacing: 0.8,
  },
  initBtnWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  initBtn: {
    backgroundColor: colors.background,
    borderWidth: 2, borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  initBtnTopLine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 2, backgroundColor: colors.primary,
  },
  initBtnScanWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden',
  },
  initBtnScanStrip: {
    position: 'absolute', left: 0, right: 0,
    height: 40, backgroundColor: `${colors.primary}18`,
  },
  initBtnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  initBtnText: {
    fontFamily: 'KodeMono_700Bold', fontSize: 18,
    color: colors.primary, letterSpacing: 3, textTransform: 'uppercase',
    textShadowColor: 'rgba(0,243,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  initBtnFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  initBtnFooterText: {
    fontFamily: 'KodeMono_700Bold', fontSize: 8,
    color: `${colors.primary}66`, letterSpacing: 1,
  },

  // Stats
  statsSection: { gap: 8 },
  statsSectionLabel: {
    fontFamily: 'KodeMono_700Bold', fontSize: 10,
    color: colors.primary, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCell: {
    width: '47%',
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outlineVariant,
    padding: 10, gap: 4,
  },
  statLabel: {
    fontFamily: 'KodeMono_700Bold', fontSize: 9,
    color: colors.outline, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  statValue: {
    fontFamily: 'KodeMono_700Bold', fontSize: 22, color: colors.onSurface,
  },
  statMax: {
    fontFamily: 'KodeMono_700Bold', fontSize: 11, color: colors.primary,
  },

  // Loadout
  loadoutSection: { gap: 10 },
  loadoutHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  loadoutHeaderLabel: {
    fontFamily: 'KodeMono_700Bold', fontSize: 10,
    color: colors.secondaryContainer, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  loadoutSub: {
    fontFamily: 'KodeMono_400Regular', fontSize: 11,
    color: colors.outline, letterSpacing: 0.5,
  },
  cyberCard: {
    flexDirection: 'row', gap: 12,
    borderWidth: 1, borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
  },
  cyberCardSelected: {
    borderWidth: 2, borderColor: colors.secondaryContainer,
    backgroundColor: `${colors.secondaryContainer}0D`,
    shadowColor: colors.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  cyberIcon: {
    width: 40, height: 40,
    backgroundColor: `${colors.outline}18`,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cyberIconSelected: { backgroundColor: `${colors.secondaryContainer}22` },
  cyberBody: { flex: 1, gap: 4 },
  cyberName: {
    fontFamily: 'KodeMono_700Bold', fontSize: 12,
    color: colors.outline, letterSpacing: 0.5,
  },
  cyberMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cyberSlot: {
    fontFamily: 'KodeMono_700Bold', fontSize: 8,
    color: colors.outline, letterSpacing: 1.5,
  },
  humChip: {
    borderWidth: 1, borderColor: `${colors.error}55`,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  humChipText: {
    fontFamily: 'KodeMono_700Bold', fontSize: 8,
    color: colors.error, letterSpacing: 1,
  },
  cyberDesc: {
    fontFamily: 'KodeMono_400Regular', fontSize: 11,
    color: colors.onSurfaceVariant, letterSpacing: 0.3,
  },
  cyberFlavor: {
    fontFamily: 'KodeMono_400Regular', fontSize: 10,
    color: `${colors.outline}88`, letterSpacing: 0.3, fontStyle: 'italic',
  },

  // Back
  backRow: { paddingVertical: 4 },
  backLink: {
    fontFamily: 'KodeMono_700Bold', fontSize: 11,
    color: colors.outline, letterSpacing: 1.5, textTransform: 'uppercase',
  },
});
