import React, { useCallback, useEffect, useRef } from 'react';
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
    threshold >= 14 ? 'HIGH' :
    threshold >= 12 ? 'MOD' : 'LOW';
  return (
    <View style={badge.wrap}>
      <Text style={badge.text}>[REQ:{difficulty}_{label}:{statVal}]</Text>
    </View>
  );
}

// ── ChoiceButton ──────────────────────────────────────────────────────────────
function ChoiceButton({ choice, playerStats, onPress }) {
  const hasStat = !!choice.statCheck;
  return (
    <TouchableOpacity
      style={cBtn.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={cBtn.row}>
        <MaterialIcons name="chevron-right" size={14} color={CYAN} />
        <Text style={cBtn.label}>{choice.label}</Text>
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

// ── OutcomeView ───────────────────────────────────────────────────────────────
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

// ── ChoiceModal ───────────────────────────────────────────────────────────────
export default function ChoiceModal() {
  const activeChoiceEventId  = useStore((s) => s.event.activeChoiceEventId);
  const pendingChoiceOutcome = useStore((s) => s.event.pendingChoiceOutcome);
  const resolveChoiceEvent   = useStore((s) => s.resolveChoiceEvent);
  const dismissChoiceOutcome = useStore((s) => s.dismissChoiceOutcome);
  const playerStats          = useStore((s) => s.character.stats);

  const dismissTimer = useRef(null);

  const visible = activeChoiceEventId !== null || pendingChoiceOutcome !== null;
  const event   = activeChoiceEventId ? getChoiceEvent(activeChoiceEventId) : null;

  // Auto-dismiss the outcome view after 1.5 s
  useEffect(() => {
    if (pendingChoiceOutcome) {
      dismissTimer.current = setTimeout(() => {
        dismissChoiceOutcome();
      }, 1500);
    }
    return () => clearTimeout(dismissTimer.current);
  }, [pendingChoiceOutcome, dismissChoiceOutcome]);

  const handleChoice = useCallback((choiceId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resolveChoiceEvent(choiceId);
  }, [resolveChoiceEvent]);

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

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={scr.overlay}>
        <View style={scr.sheet}>
          {/* Transmission header */}
          <View style={scr.header}>
            <Animated.Text style={[scr.transmitLabel, glitchStyle]}>
              {'>>> INCOMING_TRANSMISSION <<<'}
            </Animated.Text>
            {event && (
              <Text style={scr.title}>{event.title}</Text>
            )}
          </View>

          {pendingChoiceOutcome ? (
            <OutcomeView outcome={pendingChoiceOutcome} />
          ) : event ? (
            <View style={scr.body}>
              {/* Prompt */}
              <ScrollView
                style={scr.promptScroll}
                contentContainerStyle={scr.promptContent}
              >
                <Text style={scr.prompt}>{event.prompt}</Text>
              </ScrollView>

              {/* Divider */}
              <View style={scr.divider} />

              {/* Choices */}
              <View style={scr.choices}>
                {event.choices.map((choice) => (
                  <ChoiceButton
                    key={choice.id}
                    choice={choice}
                    playerStats={playerStats}
                    onPress={() => handleChoice(choice.id)}
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
    marginHorizontal: 0,
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
    borderColor: `${CYAN}66`,
    padding: 12,
    gap: 5,
    backgroundColor: `${CYAN}06`,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: CYAN,
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
