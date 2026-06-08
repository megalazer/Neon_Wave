import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

const GRID_SIZE = 9; // 3x3
const BASE_WAVE_DURATION = 8000;
const BASE_SPAWN_RATE = 1200;
const BASE_DAEMON_LIFE = 1500;
const INFECTION_PER_MISS = 0.15;

export default function DaemonHunt({ statValue, onResult, accentColor }) {
  const [round, setRound] = useState(0);
  const [state, setState] = useState('playing'); // playing, paused, busted
  const [infection, setInfection] = useState(0);
  const [daemons, setDaemons] = useState({}); // { id: { index, createdAt } }
  const [timeLeft, setTimeLeft] = useState(BASE_WAVE_DURATION);

  const edgeScale = Math.max(1, statValue);
  const daemonLife = Math.max(600, BASE_DAEMON_LIFE + (edgeScale * 50) - (round * 150));
  const spawnRate = Math.max(300, BASE_SPAWN_RATE - (round * 150));
  const waveDuration = BASE_WAVE_DURATION + (round * 1000);
  
  const timerRef = useRef(null);
  const spawnerRef = useRef(null);
  const daemonsRef = useRef({});

  useEffect(() => {
    if (state === 'playing') {
      let currentInfection = infection;
      
      const gameLoop = setInterval(() => {
        const now = Date.now();
        let missed = 0;
        
        // Check for expired daemons
        const currentDaemons = { ...daemonsRef.current };
        let updated = false;
        
        Object.keys(currentDaemons).forEach(id => {
          if (now - currentDaemons[id].createdAt > daemonLife) {
            delete currentDaemons[id];
            missed++;
            updated = true;
          }
        });

        if (missed > 0) {
          currentInfection += missed * INFECTION_PER_MISS;
          if (currentInfection >= 1) {
            setInfection(1);
            setState('busted');
            clearInterval(gameLoop);
            clearInterval(spawnerRef.current);
            setTimeout(() => {
              onResult({ outcome: 'bust', payoutMultiplier: 0.25, vitalsHit: 10, bustReason: 'System fully infected' });
            }, 1000);
            return;
          }
          setInfection(currentInfection);
        }
        
        if (updated) {
          daemonsRef.current = currentDaemons;
          setDaemons(currentDaemons);
        }
        
        setTimeLeft(prev => {
          if (prev <= 100) {
            clearInterval(gameLoop);
            clearInterval(spawnerRef.current);
            setState('paused');
            setRound(round + 1);
            daemonsRef.current = {};
            setDaemons({});
            return waveDuration;
          }
          return prev - 100;
        });
      }, 100);
      
      timerRef.current = gameLoop;

      spawnerRef.current = setInterval(() => {
        const activeCount = Object.keys(daemonsRef.current).length;
        if (activeCount < 4) { // max 4 at once
          const activeIndices = Object.values(daemonsRef.current).map(d => d.index);
          const availableIndices = Array.from({length: GRID_SIZE}, (_, i) => i).filter(i => !activeIndices.includes(i));
          
          if (availableIndices.length > 0) {
            const index = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            const id = Date.now().toString() + Math.random().toString();
            const newDaemons = { ...daemonsRef.current, [id]: { index, createdAt: Date.now() } };
            daemonsRef.current = newDaemons;
            setDaemons(newDaemons);
          }
        }
      }, spawnRate);
      
      return () => {
        clearInterval(timerRef.current);
        clearInterval(spawnerRef.current);
      };
    }
  }, [state, round, spawnRate, daemonLife, waveDuration]);

  const handleTap = (index) => {
    if (state !== 'playing') return;
    
    const entry = Object.entries(daemonsRef.current).find(([id, d]) => d.index === index);
    if (entry) {
      const [id] = entry;
      const newDaemons = { ...daemonsRef.current };
      delete newDaemons[id];
      daemonsRef.current = newDaemons;
      setDaemons(newDaemons);
    }
  };

  const handleBank = () => {
    if (round === 0) return;
    setState('banked');
    const payoutMultiplier = 0.7 + (round * 0.35);
    onResult({ outcome: 'banked', payoutMultiplier, bankedSteps: round });
  };

  const handlePush = () => {
    setTimeLeft(waveDuration);
    setState('playing');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: accentColor }]}>WAVE: {round + 1}</Text>
        <Text style={[styles.label, { color: colors.error }]}>INFECTION: {Math.floor(infection * 100)}%</Text>
      </View>

      <View style={styles.traceBarContainer}>
        <View style={[styles.traceBarFill, { width: `${infection * 100}%` }]} />
      </View>
      
      <Text style={styles.timerText}>{(timeLeft / 1000).toFixed(1)}s</Text>

      <View style={styles.gameContainer}>
        <View style={styles.grid}>
          {Array.from({length: GRID_SIZE}).map((_, i) => {
            const isDaemon = Object.values(daemons).some(d => d.index === i);
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.gridCell,
                  isDaemon ? { backgroundColor: colors.error, borderColor: colors.error } : null
                ]}
                onPress={() => handleTap(i)}
                activeOpacity={0.5}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.controls}>
        {state === 'paused' && (
          <View style={styles.choiceRow}>
            <TouchableOpacity 
              style={[styles.choiceButton, { borderColor: colors.primary }]} 
              onPress={handleBank}
            >
              <Text style={[styles.choiceText, { color: colors.primary }]}>SYSTEM CLEAN (BANK)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.choiceButton, { borderColor: colors.error }]} 
              onPress={handlePush}
            >
              <Text style={[styles.choiceText, { color: colors.error }]}>NEXT WAVE</Text>
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
  label: { fontFamily: 'KodeMono_700Bold', fontSize: 14, letterSpacing: 1 },
  traceBarContainer: { height: 8, backgroundColor: colors.surfaceHighlight, borderWidth: 1, borderColor: colors.outline, marginBottom: 16 },
  traceBarFill: { height: '100%', backgroundColor: colors.error },
  timerText: { fontFamily: 'KodeMono_700Bold', fontSize: 18, color: colors.text, textAlign: 'center', marginBottom: 16 },
  gameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: {
    width: 240,
    height: 240,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  gridCell: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surfaceHighlight,
  },
  controls: { height: 80, justifyContent: 'flex-end' },
  choiceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  choiceButton: { flex: 1, height: 60, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  choiceText: { fontFamily: 'KodeMono_700Bold', fontSize: 14, letterSpacing: 1, textAlign: 'center' }
});