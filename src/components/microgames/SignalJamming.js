import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const TRACE_PER_SEC = 0.08;
const SCORE_PER_SEC = 100;

export default function SignalJamming({ statValue, onResult, accentColor }) {
  const [state, setState] = useState('ready'); // ready, playing, busted, banked
  const [trace, setTrace] = useState(0);
  const [score, setScore] = useState(0); // time in ms
  const [needlePos, setNeedlePos] = useState(0.5);
  
  const isHolding = useRef(false);
  const gameLoop = useRef(null);

  const gritScale = Math.max(1, statValue);
  const traceRate = Math.max(0.02, TRACE_PER_SEC - (gritScale * 0.005));
  
  // Drift speed increases with score
  const getDriftSpeed = (currentScore) => {
    return 0.015 + (currentScore / 100000); // gets faster over time
  };
  
  // Band narrows over time
  const getBandWidth = (currentScore) => {
    return Math.max(0.15, 0.4 - (currentScore / 50000) + (gritScale * 0.01));
  };

  useEffect(() => {
    if (state === 'playing') {
      gameLoop.current = setInterval(() => {
        setScore(s => {
          const newScore = s + 50;
          
          setNeedlePos(p => {
            const drift = getDriftSpeed(newScore);
            const move = isHolding.current ? drift * 1.5 : -drift; // holding pushes right, otherwise drifts left
            const newPos = Math.max(0, Math.min(1, p + move));
            
            const bandW = getBandWidth(newScore);
            const bandStart = 0.5 - (bandW / 2);
            const bandEnd = 0.5 + (bandW / 2);
            
            if (newPos < bandStart || newPos > bandEnd) {
              // Busted
              clearInterval(gameLoop.current);
              setState('busted');
              setTimeout(() => {
                onResult({ outcome: 'bust', payoutMultiplier: 0.25, vitalsHit: 10, bustReason: 'Signal lost' });
              }, 1000);
            }
            return newPos;
          });
          
          setTrace(t => {
            const newTrace = t + (traceRate * 0.05); // per 50ms
            if (newTrace >= 1) {
              clearInterval(gameLoop.current);
              setState('busted');
              setTimeout(() => {
                onResult({ outcome: 'bust', payoutMultiplier: 0.25, vitalsHit: 10, bustReason: 'Helix traced you' });
              }, 1000);
            }
            return newTrace;
          });
          
          return newScore;
        });
      }, 50);
      
      return () => clearInterval(gameLoop.current);
    }
  }, [state, traceRate, onResult]);

  const handleStart = () => {
    setState('playing');
  };

  const handleBail = () => {
    if (state !== 'playing') return;
    clearInterval(gameLoop.current);
    setState('banked');
    // 5 seconds = ~1.0 multiplier
    const payoutMultiplier = Math.max(0.2, 0.2 + (score / 6000));
    onResult({ outcome: 'banked', payoutMultiplier, bankedSteps: `${(score/1000).toFixed(1)}s` });
  };

  const bandWidth = getBandWidth(score);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: accentColor }]}>TIME: {(score / 1000).toFixed(1)}s</Text>
        <Text style={[styles.label, { color: colors.error }]}>TRACE: {Math.floor(trace * 100)}%</Text>
      </View>

      <View style={styles.traceBarContainer}>
        <View style={[styles.traceBarFill, { width: `${trace * 100}%` }]} />
      </View>

      <View style={styles.gameContainer}>
        <View style={styles.meter}>
          <View style={[
            styles.band, 
            { 
              width: `${bandWidth * 100}%`,
              left: `${(0.5 - bandWidth/2) * 100}%`,
              backgroundColor: state === 'busted' ? colors.error : colors.tertiary
            }
          ]} />
          <View style={[styles.needle, { left: `${needlePos * 100}%`, backgroundColor: accentColor }]} />
        </View>
      </View>

      <View style={styles.controls}>
        {state === 'ready' && (
          <TouchableOpacity style={[styles.bigButton, { borderColor: accentColor }]} onPress={handleStart}>
            <Text style={[styles.bigButtonText, { color: accentColor }]}>START JAMMING</Text>
          </TouchableOpacity>
        )}
        
        {state === 'playing' && (
          <View style={styles.choiceRow}>
            <TouchableOpacity 
              style={[styles.holdButton, { borderColor: accentColor }]}
              onPressIn={() => { isHolding.current = true; }}
              onPressOut={() => { isHolding.current = false; }}
              activeOpacity={0.8}
            >
              <Text style={[styles.choiceText, { color: accentColor }]}>HOLD TO COUNTER</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.choiceButton, { borderColor: colors.primary }]} 
              onPress={handleBail}
            >
              <Text style={[styles.choiceText, { color: colors.primary }]}>BAIL (BANK)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontFamily: fonts.mono, fontSize: 14, letterSpacing: 1 },
  traceBarContainer: { height: 8, backgroundColor: colors.surfaceHighlight, borderWidth: 1, borderColor: colors.outline, marginBottom: 40 },
  traceBarFill: { height: '100%', backgroundColor: colors.error },
  gameContainer: { flex: 1, justifyContent: 'center' },
  meter: { height: 60, backgroundColor: colors.surfaceHighlight, borderWidth: 1, borderColor: colors.outline, position: 'relative' },
  band: { position: 'absolute', height: '100%', opacity: 0.3 },
  needle: { position: 'absolute', width: 4, height: 80, top: -10, marginLeft: -2, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
  controls: { height: 80, justifyContent: 'flex-end' },
  bigButton: { height: 60, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  bigButtonText: { fontFamily: fonts.mono, fontSize: 20, letterSpacing: 2 },
  choiceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  holdButton: { flex: 2, height: 60, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  choiceButton: { flex: 1, height: 60, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  choiceText: { fontFamily: fonts.mono, fontSize: 14, letterSpacing: 1, textAlign: 'center' }
});