import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/index';
import { ALL_CHOICE_EVENTS } from '../data/events/index';
import { getContract } from '../data/contracts/index';
import { getFixer } from '../data/fixers';
import ConfirmModal from './ConfirmModal';
import { colors } from '../theme/colors';

const ACCENT_MAP = {
  primary:   colors.primary,
  secondary: colors.secondary,
  tertiary:  colors.tertiaryFixed,
  error:     colors.error,
  outline:   colors.outline,
};

const CYAN = colors.primary;

function getChoiceEvent(id) {
  return ALL_CHOICE_EVENTS.find((e) => e.id === id) ?? null;
}

// ── StatBadge ─────────────────────────────────────────────────────────────────
function StatBadge({ stat, threshold, playerStats }) {
  const statVal = playerStats?.[stat] ?? 10;
  const label = stat.toUpperCase();
  const difficulty =
    threshold >= 15 ? 'EXTREME' :
    threshold >= 14 ? 'HIGH' :
    threshold >= 12 ? 'MOD' : 'LOW';
  return (
    <View style={badge.wrap}>
      <Text style={badge.text}>[REQ:{difficulty}_{label}:{statVal}]</Text>
    </View>
  );
}

// ── ChoiceButton ──────────────────────────────────────────────────────────────
function ChoiceButton({ choice, playerStats, onPress, accentColor }) {
  const hasStat  = choice.statCheck;
  const color    = accentColor ?? CYAN;
  return (
    <TouchableOpacity
      style={[cBtn.container, { borderColor: `${color}66`, backgroundColor: `${color}06` }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={cBtn.row}>
        <MaterialIcons name="chevron-right" size={14} color={color} />
        <Text style={[cBtn.label, { color }]}>{choice.label}</Text>
      </View>
      {hasStat && (
        <StatBadge
          stat={choice.statCheck.stat}
          threshold={choice.statCheck.threshold}
          playerStats={playerStats}
        />
      )}
    </TouchableOpacity>
  );
}

// ── OutcomeView (event resolution) ───────────────────────────────────────────
function OutcomeView({ outcome }) {
  const accentColor = ACCENT_MAP[outcome.accent] ?? colors.outline;
  const icon = outcome.accent === 'tertiary' ? 'check-circle' :
               outcome.accent === 'error'    ? 'cancel' : 'info';
  return (
    <View style={[out.container, { borderTopColor: `${accentColor}44` }]}>
      <View style={[out.banner, { backgroundColor: `${accentColor}14` }]}>
        <MaterialIcons name={icon} size={16} color={accentColor} />
        <Text style={[out.bannerLabel, { color: accentColor }]}>
          {outcome.accent === 'tertiary' ? 'OUTCOME: SUCCESS' : 'OUTCOME: FAIL'}
        </Text>
      </View>
      <ScrollView style={out.scroll} contentContainerStyle={out.scrollContent}>
        <Text style={out.text}>{outcome.text}</Text>
      </ScrollView>
    </View>
  );
}

// ── ContractResolutionView (contract final outcome) ───────────────────────────
function ContractResolutionView({ resolution, contract, onDismiss }) {
  const isSuccess  = resolution.outcome === 'success';
  const isAbort    = resolution.outcome === 'aborted';
  const accentColor = isSuccess ? colors.tertiaryFixed :
                      isAbort   ? colors.outline : colors.error;
  const icon        = isSuccess ? 'check-circle' :
                      isAbort   ? 'block' : 'cancel';
  const label       = isSuccess ? 'CONTRACT_COMPLETE' :
                      isAbort   ? 'CONTRACT_ABORTED' : 'CONTRACT_FAILED';

  return (
    <View style={res.container}>
      <View style={[res.banner, { backgroundColor: `${accentColor}14`, borderBottomColor: `${accentColor}33` }]}>
        <MaterialIcons name={icon} size={18} color={accentColor} />
        <Text style={[res.bannerLabel, { color: accentColor }]}>{label}</Text>
      </View>

      <ScrollView style={res.scroll} contentContainerStyle={res.scrollContent}>
        <Text style={res.narration}>{resolution.narration}</Text>

        {resolution.creditsEarned > 0 && (
          <View style={[res.rewardRow, { borderColor: `${accentColor}33` }]}>
            <MaterialIcons name="payments" size={14} color={accentColor} />
            <Text style={[res.rewardText, { color: accentColor }]}>
              +{resolution.creditsEarned.toLocaleString()} CR
            </Text>
            {resolution.expEarned > 0 && (
              <>
                <Text style={res.rewardSep}>·</Text>
                <MaterialIcons name="star" size={14} color={accentColor} />
                <Text style={[res.rewardText, { color: accentColor }]}>
                  +{resolution.expEarned} EXP
                </Text>
              </>
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={[res.dismissBtn, { borderColor: accentColor }]} onPress={onDismiss} activeOpacity={0.7}>
        <Text style={[res.dismissLabel, { color: accentColor }]}>[DISMISS]</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── ChoiceModal ───────────────────────────────────────────────────────────────
export default function ChoiceModal() {
  // Event mode selectors
  const activeChoiceEventId  = useStore((s) => s.event.activeChoiceEventId);
  const pendingChoiceOutcome = useStore((s) => s.event.pendingChoiceOutcome);
  const resolveChoiceEvent   = useStore((s) => s.resolveChoiceEvent);
  const dismissChoiceOutcome = useStore((s) => s.dismissChoiceOutcome);

  // Contract mode selectors
  const contractPhase      = useStore((s) => s.contract.phase);
  const activeContractId   = useStore((s) => s.contract.activeContractId);
  const activeStageIndex   = useStore((s) => s.contract.activeStageIndex);
  const contractResolution = useStore((s) => s.contract.resolution);
  const resolveStageChoice = useStore((s) => s.resolveStageChoice);
  const abortContract      = useStore((s) => s.abortContract);
  const dismissResolution  = useStore((s) => s.dismissResolution);

  const playerStats = useStore((s) => s.character.stats);

  const [showAbortConfirm, setShowAbortConfirm] = useState(false);
  const dismissTimer = useRef(null);

  // Derived data
  const isContractActive   = contractPhase === 'active';
  const isContractResolving = contractPhase === 'resolving';
  const isContractMode     = isContractActive || isContractResolving;

  const activeContract = isContractMode && activeContractId
    ? getContract(activeContractId) : null;
  const currentStage   = activeContract?.stages[activeStageIndex] ?? null;
  const fixer          = activeContract ? getFixer(activeContract.fixerId) : null;
  const fixerColor     = ACCENT_MAP[fixer?.accent] ?? CYAN;

  const event   = activeChoiceEventId ? getChoiceEvent(activeChoiceEventId) : null;
  const visible = isContractMode || activeChoiceEventId !== null || pendingChoiceOutcome !== null;

  const stageCount = activeContract?.stages.length ?? 0;

  // Auto-dismiss event outcome after 1.5 s
  useEffect(() => {
    if (pendingChoiceOutcome) {
      dismissTimer.current = setTimeout(() => dismissChoiceOutcome(), 1500);
    }
    return () => clearTimeout(dismissTimer.current);
  }, [pendingChoiceOutcome, dismissChoiceOutcome]);

  const handleEventChoice = useCallback((choiceId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resolveChoiceEvent(choiceId);
  }, [resolveChoiceEvent]);

  const handleContractChoice = useCallback((choiceId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resolveStageChoice(choiceId);
  }, [resolveStageChoice]);

  const handleAbortConfirmed = useCallback(() => {
    setShowAbortConfirm(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    abortContract();
  }, [abortContract]);

  const handleDismissResolution = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismissResolution();
  }, [dismissResolution]);

  // Glitch animation on the transmission header
  const glitchX = useSharedValue(0);
  useEffect(() => {
    if (!visible) return;
    glitchX.value = withRepeat(
      withSequence(
        withTiming(0,  { duration: 1800 }),
        withTiming(2,  { duration: 40 }),
        withTiming(-2, { duration: 40 }),
        withTiming(0,  { duration: 40 }),
      ),
      -1,
    );
  }, [visible]);
  const glitchStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glitchX.value }],
  }));

  if (!visible) return null;

  // ── Contract: resolution screen ──
  if (isContractResolving && contractResolution && activeContract) {
    return (
      <>
        <Modal visible transparent animationType="slide" statusBarTranslucent>
          <View style={scr.overlay}>
            <View style={[scr.sheet, { borderTopColor: fixerColor }]}>
              <View style={scr.header}>
                <Animated.Text style={[scr.transmitLabel, { color: fixerColor }, glitchStyle]}>
                  {'>>> CONTRACT_DEBRIEF <<<'}
                </Animated.Text>
                <Text style={scr.title}>{activeContract.name}</Text>
              </View>
              <ContractResolutionView
                resolution={contractResolution}
                contract={activeContract}
                onDismiss={handleDismissResolution}
              />
            </View>
          </View>
        </Modal>
        <ConfirmModal
          visible={showAbortConfirm}
          variant="destructive"
          title="ABORT CONTRACT"
          body={`Abandon ${activeContract?.name ?? 'current contract'}? No payout for incomplete work.`}
          warning="This cannot be undone."
          confirmLabel="[ABORT]"
          cancelLabel="[CONTINUE]"
          onConfirm={handleAbortConfirmed}
          onCancel={() => setShowAbortConfirm(false)}
        />
      </>
    );
  }

  // ── Contract: active stage ──
  if (isContractActive && currentStage) {
    return (
      <>
        <Modal visible transparent animationType="slide" statusBarTranslucent>
          <View style={scr.overlay}>
            <View style={[scr.sheet, { borderTopColor: fixerColor }]}>
              {/* Header: fixer + contract name + stage indicator + abort button */}
              <View style={scr.header}>
                <View style={scr.contractHeaderRow}>
                  <Animated.Text style={[scr.transmitLabel, { color: fixerColor }, glitchStyle]}>
                    {fixer ? `>>> ${fixer.handle} <<<` : '>>> CONTRACT <<<'}
                  </Animated.Text>
                  <TouchableOpacity
                    style={scr.abortBtn}
                    onPress={() => setShowAbortConfirm(true)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="close" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <View style={scr.contractTitleRow}>
                  <Text style={scr.title}>{activeContract.name}</Text>
                  <View style={[scr.stagePill, { borderColor: `${fixerColor}66` }]}>
                    <Text style={[scr.stagePillText, { color: fixerColor }]}>
                      {activeStageIndex + 1}/{stageCount}
                    </Text>
                  </View>
                </View>
                <Text style={[scr.stageLabel, { color: `${fixerColor}88` }]}>
                  {currentStage.label} — {currentStage.title}
                </Text>
              </View>

              <View style={scr.body}>
                <ScrollView style={scr.promptScroll} contentContainerStyle={scr.promptContent}>
                  <Text style={scr.prompt}>{currentStage.prompt}</Text>
                </ScrollView>
                <View style={scr.divider} />
                <View style={scr.choices}>
                  {currentStage.choices.map((choice) => (
                    <ChoiceButton
                      key={choice.id}
                      choice={choice}
                      playerStats={playerStats}
                      accentColor={fixerColor}
                      onPress={() => handleContractChoice(choice.id)}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <ConfirmModal
          visible={showAbortConfirm}
          variant="destructive"
          title="ABORT CONTRACT"
          body={`Abandon ${activeContract.name}? No payout for incomplete work.`}
          warning="This cannot be undone."
          confirmLabel="[ABORT]"
          cancelLabel="[CONTINUE]"
          onConfirm={handleAbortConfirmed}
          onCancel={() => setShowAbortConfirm(false)}
        />
      </>
    );
  }

  // ── Event mode ──
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={scr.overlay}>
        <View style={scr.sheet}>
          <View style={scr.header}>
            <Animated.Text style={[scr.transmitLabel, glitchStyle]}>
              {'>>> INCOMING_TRANSMISSION <<<'}
            </Animated.Text>
            {event && <Text style={scr.title}>{event.title}</Text>}
          </View>

          {pendingChoiceOutcome ? (
            <OutcomeView outcome={pendingChoiceOutcome} />
          ) : event ? (
            <View style={scr.body}>
              <ScrollView style={scr.promptScroll} contentContainerStyle={scr.promptContent}>
                <Text style={scr.prompt}>{event.prompt}</Text>
              </ScrollView>
              <View style={scr.divider} />
              <View style={scr.choices}>
                {event.choices.map((choice) => (
                  <ChoiceButton
                    key={choice.id}
                    choice={choice}
                    playerStats={playerStats}
                    onPress={() => handleEventChoice(choice.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const scr = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 2,
    borderTopColor: CYAN,
    minHeight: '55%',
    maxHeight: '72%',
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: `${CYAN}33`,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 4,
  },
  contractHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  abortBtn: {
    padding: 2,
  },
  stagePill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stagePillText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  stageLabel: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  transmitLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: CYAN,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 14,
    color: colors.onSurface,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
  },
  promptScroll: {
    flexShrink: 1,
  },
  promptContent: {
    padding: 16,
  },
  prompt: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 13,
    color: colors.onSurface,
    letterSpacing: 0.4,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: `${colors.outline}33`,
  },
  choices: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
});

const cBtn = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 12,
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
});

const badge = StyleSheet.create({
  wrap: {
    paddingLeft: 20,
  },
  text: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: `${CYAN}88`,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

const out = StyleSheet.create({
  container: {
    flex: 1,
    borderTopWidth: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  text: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 13,
    color: colors.onSurface,
    letterSpacing: 0.4,
    lineHeight: 22,
  },
});

const res = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  bannerLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  narration: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 13,
    color: colors.onSurface,
    letterSpacing: 0.4,
    lineHeight: 22,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  rewardText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  rewardSep: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 13,
    color: colors.outline,
  },
  dismissBtn: {
    borderTopWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  dismissLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
