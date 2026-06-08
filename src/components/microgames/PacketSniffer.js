import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  cancelAnimation,
  Easing 
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const BASE_SPEED = 2000;
const SPEED_MULT_PER_ROUND = 0.85;
const BASE_BAND_WIDTH = 0.3; // 30% of bar
const BAND_SHRINK_PER_ROUND = 0.04;
const TRACE_PER_CAPTURE = 0.2;

export default function PacketSniffer({ statValue, onResult, accentColor }) {
  const [round, setRound] = useState(0);
  const [state, setState] = useState('playing'); // playing, paused (between rounds)
  const [trace, setTrace] = useState(0);

  const position = useSharedValue(0);

  // Scaling based on stat: wire (1 to 10 typical)
  const wireScale = Math.max(1, statValue);
  const bandWidthPct = Math.max(0.08, BASE_BAND_WIDTH + (wireScale * 0.01) - (round * BAND_SHRINK_PER_ROUND));
  const sweepDuration = Math.max(400, BASE_SPEED * Math.pow(SPEED_MULT_PER_ROUND, round) * (1 + (wireScale * 0.02)));
  const traceGain = Math.max(0.05, TRACE_PER_CAPTURE - (wireScale * 0.01));

  useEffect(() => {
    if (state === 'playing') {
      position.value = 0;
      position.value = withRepeat(
        withSequence(
          withTiming(1, { duration: sweepDuration, easing: Easing.linear }),
          withTiming(0, { duration: sweepDuration, easing: Easing.linear })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(position);
    }
  }, [state, round, sweepDuration]);

  const handleCapture = () => {
    if (state !== 'playing') return;
    
    cancelAnimation(position);
    
    // Check if within band
    const val = position.value;
    const bandStart = 0.5 - (bandWidthPct / 2);
    const bandEnd = 0.5 + (bandWidthPct / 2);

    if (val >= bandStart && val <= bandEnd) {
      // Success!
      const newTrace = trace + traceGain;
      if (newTrace >= 1) {
        // Bust via trace
        setTrace(1);
        setState('busted');
        setTimeout(() => {
          onResult({ outcome: 'bust', payoutMultiplier: 0.25, vitalsHit: 10, bustReason: 'ICE traced you' });
        }, 1000);
      } else {
        setTrace(newTrace);
        setState('paused');
        setRound(round + 1);
      }
    } else {
      // Missed band
      setState('busted');
      setTimeout(() => {
        onResult({ outcome: 'bust', payoutMultiplier: 0.25, vitalsHit: 10, bustReason: 'Missed capture band' });
      }, 1000);
    }
  };

  const handleBank = () => {
    if (round === 0) return;
    setState('banked');
    const payoutMultiplier = 0.5 + (round * 0.5);
    onResult({ outcome: 'banked', payoutMultiplier, bankedSteps: round });
  };

  const handlePush = () => {
    setState('playing');
  };

  const markerStyle = useAnimatedStyle(() => {
    return {
      left: `${position.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: accentColor }]}>BURSTS: {round}</Text>
        <Text style={[styles.label, { color: colors.error }]}>TRACE: {Math.floor(trace * 100)}%</Text>
      </View>

      <View style={styles.traceBarContainer}>
        <View style={[styles.traceBarFill, { width: `${trace * 100}%` }]} />
      </View>

      <View style={styles.gameContainer}>
        <View style={styles.sweepTrack}>
          <View 
            style={[
              styles.captureBand, 
              { 
                width: `${bandWidthPct * 100}%`,
                left: `${(0.5 - bandWidthPct/2) * 100}%`,
                backgroundColor: state === 'busted' ? colors.error : colors.tertiary 
              }
            ]} 
          />
          <Animated.View style={[styles.marker, markerStyle, { backgroundColor: accentColor }]} />
        </View>
      </View>

      <View style={styles.controls}>
        {state === 'playing' && (
          <TouchableOpacity 
            style={[styles.bigButton, { borderColor: accentColor }]} 
            onPress={handleCapture}
            activeOpacity={0.7}
          >
            <Text style={[styles.bigButtonText, { color: accentColor }]}>SIPHON</Text>
          </TouchableOpacity>
        )}

        {state === 'paused' && (
          <View style={styles.choiceRow}>
            <TouchableOpacity 
              style={[styles.choiceButton, { borderColor: colors.primary }]} 
              onPress={handleBank}
            >
              <Text style={[styles.choiceText, { color: colors.primary }]}>DISCONNECT (BANK)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.choiceButton, { borderColor: colors.error }]} 
              onPress={handlePush}
            >
              <Text style={[styles.choiceText, { color: colors.error }]}>PUSH DEEPER</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 14,
    letterSpacing: 1,
  },
  traceBarContainer: {
    height: 8,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 40,
  },
  traceBarFill: {
    height: '100%',
    backgroundColor: colors.error,
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  sweepTrack: {
    height: 40,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.outline,
    position: 'relative',
    justifyContent: 'center',
  },
  captureBand: {
    position: 'absolute',
    height: '100%',
    opacity: 0.4,
  },
  marker: {
    position: 'absolute',
    width: 4,
    height: 48,
    marginLeft: -2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  controls: {
    height: 80,
    justifyContent: 'flex-end',
  },
  bigButton: {
    height: 60,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bigButtonText: {
    fontFamily: fonts.mono,
    fontSize: 20,
    letterSpacing: 2,
  },
  choiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  choiceButton: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  choiceText: {
    fontFamily: fonts.mono,
    fontSize: 14,
    letterSpacing: 1,
  }
});