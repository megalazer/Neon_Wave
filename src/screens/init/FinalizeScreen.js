import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
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
import { deriveStats, STAT_DESCRIPTIONS } from '../../data/origins';
import { colors } from '../../theme/colors';
import { labelCaps, fontStyles } from '../../theme/fonts';
import InitHeader from '../../components/init/InitHeader';
import InitFooter from '../../components/init/InitFooter';
import PortraitPreview from '../../components/recruit/PortraitPreview';
import { generatePortrait, seededPortraitRng } from '../../engine/portraitGenerator';

const HEADER_H = 90;

const STAT_KEYS = ['chrome', 'edge', 'ghost', 'face', 'grit', 'wire'];

function portraitClassForPath(path) {
  const classMap = { corpo: 'FIXER', street_kid: 'STREET_SAMURAI', nomad: 'GHOST' };
  return classMap[path] || 'STREET_SAMURAI';
}

// --- PortraitFrame ---
function PortraitFrame({ draft, portraitSpec }) {
  const handleName = draft.name || 'UNKNOWN';
  const previewCharacter = { name: handleName, class: portraitClassForPath(draft.path) };

  return (
    <View style={portrait.frame}>
      <View style={[portrait.bracket, portrait.bTL, { borderColor: colors.primary }]} />
      <View style={[portrait.bracket, portrait.bTR, { borderColor: colors.secondary }]} />
      <View style={[portrait.bracket, portrait.bBL, { borderColor: colors.primary }]} />
      <View style={[portrait.bracket, portrait.bBR, { borderColor: colors.secondary }]} />

      <View style={portrait.center}>
        <PortraitPreview
          character={previewCharacter}
          portrait={portraitSpec}
          size={128}
          borderColor="transparent"
          backgroundColor="transparent"
        />
        <Text style={portrait.handle}>{handleName}</Text>
        <Text style={portrait.label}>NEURAL_AVATAR_RENDERED</Text>
      </View>

      <View style={portrait.hud}>
        <Text style={[portrait.hudLine, { color: colors.primary }]}>SCAN_COORD: 34.90.11</Text>
        <Text style={[portrait.hudLine, { color: colors.secondary }]}>ID_SIG: 0x8842_FINAL</Text>
      </View>
    </View>
  );
}

// --- InitButton (fixed bottom) ---
function InitButton({ onPress }) {
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

  return (
    <Animated.View style={[initBtn.wrapper, btnScaleStyle]}>
      <TouchableOpacity style={initBtn.btn} onPress={handlePress} activeOpacity={0.9}>
        <Animated.View style={[initBtn.topLine, pulseStyle]} />
        <View style={initBtn.scanWrap}>
          <Animated.View style={[initBtn.scanStrip, scanStyle]} />
        </View>
        <View style={initBtn.row}>
          <MaterialIcons name="bolt" size={24} color={colors.primary} />
          <Text style={initBtn.text}>INITIALIZE_NEURAL</Text>
        </View>
        <View style={initBtn.footer}>
          <Text style={initBtn.footerText}>SECURE_LINK: ESTABLISHED</Text>
          <Text style={initBtn.footerText}>ENCRYPTION: 1024-BIT_AES_QUAL</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// --- StatsGrid ---
function StatsGrid({ path }) {
  const stats = deriveStats(path);
  const [activeStat, setActiveStat] = useState(null);

  return (
    <>
      <View style={statsSc.statsSection}>
        <Text style={statsSc.sectionLabel}>[INITIAL_STATS]</Text>
        <Text style={statsSc.hint}>TAP A STAT FOR DETAILS</Text>
        <View style={statsSc.grid}>
          {STAT_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={statsSc.cell}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveStat(activeStat === key ? null : key);
              }}
              activeOpacity={0.7}
            >
              <Text style={statsSc.label}>{key.toUpperCase()}</Text>
              <View style={statsSc.valueRow}>
                <Text style={statsSc.value}>{stats[key]}</Text>
                <Text style={statsSc.max}>/20</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tooltip overlay */}
      <Modal visible={activeStat !== null} transparent animationType="fade" onRequestClose={() => setActiveStat(null)}>
        <Pressable style={statsSc.backdrop} onPress={() => setActiveStat(null)}>
          <Pressable style={statsSc.tooltip} onPress={(e) => e.stopPropagation()}>
            <View style={statsSc.tooltipHeader}>
              <MaterialIcons name="info" size={14} color={colors.primary} />
              <Text style={statsSc.tooltipTitle}>{activeStat?.toUpperCase()}</Text>
            </View>
            <Text style={statsSc.tooltipBody}>
              {activeStat ? STAT_DESCRIPTIONS[activeStat] : ''}
            </Text>
            <View style={statsSc.tooltipBar} />
            <Text style={statsSc.tooltipFooter}>TAP OUTSIDE TO DISMISS</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// --- LoadoutCard ---
function LoadoutCard({ item, selected, onSelect }) {
  return (
    <TouchableOpacity
      style={[loadout.card, selected && loadout.cardSelected, !selected && { opacity: 0.5 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(item.id);
      }}
      activeOpacity={0.8}
    >
      <View style={[loadout.icon, selected && loadout.iconSelected]}>
        <MaterialIcons name={item.icon} size={20} color={selected ? colors.secondaryContainer : colors.outline} />
      </View>
      <View style={loadout.body}>
        <Text style={[loadout.name, selected && { color: colors.secondaryContainer }]}>
          {item.name.toUpperCase()}
        </Text>
        <View style={loadout.meta}>
          <Text style={loadout.slot}>{item.slot.toUpperCase()}</Text>
          <View style={loadout.humChip}>
            <Text style={loadout.humChipText}>-{item.humanityCost} HUM</Text>
          </View>
        </View>
        <Text style={loadout.desc}>{item.description}</Text>
        <Text style={loadout.flavor}>{item.flavor}</Text>
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

  const portraitCharacter = useMemo(() => ({
    name: draft.name || 'UNKNOWN',
    class: portraitClassForPath(draft.path),
  }), [draft.name, draft.path]);

  const portraitSpec = useMemo(
    () => generatePortrait(
      portraitCharacter,
      seededPortraitRng(`${draft.path}_${draft.name || 'operator'}`),
    ),
    [portraitCharacter, draft.path, draft.name],
  );

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
      onComplete({ ...draft, starterCyberware: selectedCyberware, portrait: portraitSpec });
    }, 620);
  }, [draft, selectedCyberware, portraitSpec, onComplete]);

  return (
    <View style={scr.root}>
      <InitHeader step={3} stepLabel="FINALIZATION" />

      <Text style={scr.decalL} pointerEvents="none">NEURAL_VOID</Text>
      <Text style={scr.decalR} pointerEvents="none">OVERWRITE_CMD</Text>

      <Animated.View style={[{ flex: 1 }, glitchStyle]}>
        <ScrollView
          style={scr.scroll}
          contentContainerStyle={scr.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <PortraitFrame draft={draft} portraitSpec={portraitSpec} />
          <StatsGrid path={draft.path} />

          {/* Loadout selection */}
          <View style={loadout.section}>
            <View style={loadout.header}>
              <MaterialIcons name="bolt" size={14} color={colors.secondaryContainer} />
              <Text style={loadout.headerLabel}>[STARTING_CYBERWARE_PROTOCOL]</Text>
            </View>
            <Text style={loadout.sub}>
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
          <TouchableOpacity onPress={onBack} style={scr.backRow} activeOpacity={0.7}>
            <Text style={scr.backLink}>← BACK</Text>
          </TouchableOpacity>

          <InitFooter />
        </ScrollView>
      </Animated.View>

      <InitButton onPress={handleInitialize} />
    </View>
  );
}

// ── StyleSheet blocks ──────────────────────────────────────────────────────────

const scr = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    paddingTop: HEADER_H + 16,
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 16,
  },
  decalL: {
    position: 'absolute', left: -48, top: '38%',
    transform: [{ rotate: '-90deg' }],
    ...fontStyles.bold, fontSize: 30, color: colors.primary,
    opacity: 0.04, letterSpacing: 8, zIndex: 0,
  },
  decalR: {
    position: 'absolute', right: -72, top: '28%',
    transform: [{ rotate: '90deg' }],
    ...fontStyles.bold, fontSize: 26, color: colors.secondaryContainer,
    opacity: 0.04, letterSpacing: 6, zIndex: 0,
  },
  backRow: { paddingVertical: 4 },
  backLink: { ...labelCaps, fontSize: 11, color: colors.outline },
});

const portrait = StyleSheet.create({
  frame: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 2,
    borderColor: colors.secondaryContainer,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  bracket: { position: 'absolute', width: 20, height: 20 },
  bTL: { top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2 },
  bTR: { top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2 },
  bBL: { bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2 },
  bBR: { bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2 },
  center: { alignItems: 'center', gap: 6 },
  handle: { ...fontStyles.bold, fontSize: 14, color: colors.primary, letterSpacing: 1 },
  label: { ...fontStyles.regular, fontSize: 9, color: `${colors.primary}55`, letterSpacing: 1.5, textTransform: 'uppercase' },
  hud: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: `${colors.background}CC`,
    borderWidth: 1, borderColor: `${colors.primary}33`,
    padding: 6, gap: 2,
  },
  hudLine: { ...fontStyles.bold, fontSize: 8, letterSpacing: 0.8 },
});

const initBtn = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  btn: {
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
  topLine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 2, backgroundColor: colors.primary,
  },
  scanWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden',
  },
  scanStrip: {
    position: 'absolute', left: 0, right: 0,
    height: 40, backgroundColor: `${colors.primary}18`,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  text: {
    ...fontStyles.bold, fontSize: 18,
    color: colors.primary, letterSpacing: 3, textTransform: 'uppercase',
    textShadowColor: 'rgba(0,243,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { ...fontStyles.bold, fontSize: 8, color: `${colors.primary}66`, letterSpacing: 1 },
});

const statsSc = StyleSheet.create({
  statsSection: { gap: 8 },
  sectionLabel: { ...labelCaps, fontSize: 10, color: colors.primary },
  hint: { ...fontStyles.regular, fontSize: 9, color: `${colors.outline}99`, letterSpacing: 0.5, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '47%',
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outlineVariant,
    padding: 10, gap: 4,
  },
  label: { ...labelCaps, fontSize: 9, color: colors.outline },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  value: { ...fontStyles.bold, fontSize: 22, color: colors.onSurface },
  max: { ...fontStyles.bold, fontSize: 11, color: colors.primary },
  // tooltip
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tooltip: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 20,
    gap: 10,
    maxWidth: 340,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  tooltipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tooltipTitle: { ...labelCaps, fontSize: 13, color: colors.primary },
  tooltipBody: { ...fontStyles.regular, fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 20, letterSpacing: 0.3 },
  tooltipBar: { height: 1, backgroundColor: `${colors.primary}33` },
  tooltipFooter: { ...fontStyles.regular, fontSize: 9, color: `${colors.outline}99`, textAlign: 'center', letterSpacing: 1 },
});

const loadout = StyleSheet.create({
  section: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerLabel: { ...labelCaps, fontSize: 10, color: colors.secondaryContainer },
  sub: { ...fontStyles.regular, fontSize: 11, color: colors.outline, letterSpacing: 0.5 },
  card: {
    flexDirection: 'row', gap: 12,
    borderWidth: 1, borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
  },
  cardSelected: {
    borderWidth: 2, borderColor: colors.secondaryContainer,
    backgroundColor: `${colors.secondaryContainer}0D`,
    shadowColor: colors.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    width: 40, height: 40,
    backgroundColor: `${colors.outline}18`,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  iconSelected: { backgroundColor: `${colors.secondaryContainer}22` },
  body: { flex: 1, gap: 4 },
  name: { ...fontStyles.bold, fontSize: 12, color: colors.outline, letterSpacing: 0.5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slot: { ...labelCaps, fontSize: 8, color: colors.outline },
  humChip: {
    borderWidth: 1, borderColor: `${colors.error}55`,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  humChipText: { ...fontStyles.bold, fontSize: 8, color: colors.error, letterSpacing: 1 },
  desc: { ...fontStyles.regular, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 0.3 },
  flavor: { ...fontStyles.regular, fontSize: 10, color: `${colors.outline}88`, letterSpacing: 0.3, fontStyle: 'italic' },
});
