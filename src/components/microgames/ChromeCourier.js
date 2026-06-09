import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';
import { colors } from '../../theme/colors';

const LANES = [0, 1, 2];
const DISTRICT_LENGTH = 15; // 15 "ticks" per district

export default function ChromeCourier({ statValue, onResult, accentColor }) {
  const [state, setState] = useState('playing'); // playing, checkpoint, busted
  const [district, setDistrict] = useState(0);
  const [tick, setTick] = useState(0);
  const [playerLane, setPlayerLane] = useState(1); // 0 = left, 1 = mid, 2 = right
  const [obstacles, setObstacles] = useState([]); // { lane, y } y goes from 0 to 100
  
  const gameLoop = useRef(null);

  const ghostScale = Math.max(1, statValue);
  const speed = Math.max(50, 150 - (district * 20) + (ghostScale * 5)); // tick ms
  const obstacleChance = Math.max(0.1, 0.2 + (district * 0.1) - (ghostScale * 0.02));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        if (state !== 'playing') return;
        const dx = gestureState.dx;
        if (dx > 30 && playerLane < 2) {
          setPlayerLane(prev => prev + 1);
        } else if (dx < -30 && playerLane > 0) {
          setPlayerLane(prev => prev - 1);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (state === 'playing') {
      gameLoop.current = setInterval(() => {
        setTick(t => {
          const nextTick = t + 1;
          
          if (nextTick >= DISTRICT_LENGTH) {
            clearInterval(gameLoop.current);
            setState('checkpoint');
            return 0;
          }
          return nextTick;
        });
        
        setObstacles(prev => {
          let updated = prev.map(o => ({ ...o, y: o.y + 20 })).filter(o => o.y < 120);
          
          // Collision check
          const collision = updated.some(o => o.lane === playerLane && o.y > 80 && o.y < 100);
          if (collision) {
            clearInterval(gameLoop.current);
            setState('busted');
            setTimeout(() => {
              // Lose only the current unbanked leg (checkpoints already banked are safe).
              const payoutMultiplier = district * 0.5; 
              if (district > 0) {
                // Not a full bust, just end with banked amount
                onResult({ outcome: 'banked', payoutMultiplier, bankedSteps: district });
              } else {
                onResult({ outcome: 'bust', payoutMultiplier: 0, vitalsHit: 10, bustReason: 'Crashed' });
              }
            }, 1000);
            return updated;
          }
          
          // Spawn new
          if (Math.random() < obstacleChance) {
            const lane = Math.floor(Math.random() * 3);
            updated.push({ lane, y: -20 });
          }
          return updated;
        });
        
      }, speed);
      return () => clearInterval(gameLoop.current);
    }
  }, [state, playerLane, speed, obstacleChance, district, onResult]);

  const handleExtract = () => {
    setState('banked');
    const payoutMultiplier = 0.5 + (district * 0.5);
    onResult({ outcome: 'banked', payoutMultiplier, bankedSteps: district });
  };

  const handlePressOn = () => {
    setDistrict(d => d + 1);
    setObstacles([]);
    setState('playing');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: accentColor }]}>DISTRICT: {district + 1}</Text>
        <Text style={[styles.label, { color: colors.text }]}>PROG: {Math.floor((tick / DISTRICT_LENGTH) * 100)}%</Text>
      </View>

      <View style={styles.gameContainer} {...panResponder.panHandlers}>
        <View style={styles.road}>
          {LANES.map(lane => (
            <View key={lane} style={[styles.lane, lane === 1 ? styles.midLane : null]}>
              {playerLane === lane && (
                <View style={[styles.player, { backgroundColor: state === 'busted' ? colors.error : accentColor }]} />
              )}
              {obstacles.filter(o => o.lane === lane).map((o, idx) => (
                <View key={idx} style={[styles.obstacle, { top: `${o.y}%` }]} />
              ))}
            </View>
          ))}
        </View>
        <Text style={styles.swipeHint}>&lt; SWIPE &gt;</Text>
      </View>

      <View style={styles.controls}>
        {state === 'checkpoint' && (
          <View style={styles.choiceRow}>
            <TouchableOpacity 
              style={[styles.choiceButton, { borderColor: colors.primary }]} 
              onPress={handleExtract}
            >
              <Text style={[styles.choiceText, { color: colors.primary }]}>EXTRACT (BANK)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.choiceButton, { borderColor: colors.error }]} 
              onPress={handlePressOn}
            >
              <Text style={[styles.choiceText, { color: colors.error }]}>PRESS ON</Text>
            </TouchableOpacity>
          </View>
        )}
        {state === 'playing' && (
          <View style={styles.choiceRow}>
             <View style={[styles.choiceButton, { borderColor: colors.outline }]}>
              <Text style={[styles.choiceText, { color: colors.outline }]}>RUNNING...</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  label: { fontFamily: 'KodeMono_700Bold', fontSize: 14, letterSpacing: 1 },
  gameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.outline, overflow: 'hidden' },
  road: { width: '80%', height: '100%', flexDirection: 'row' },
  lane: { flex: 1, position: 'relative' },
  midLane: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.surfaceHighlight, borderStyle: 'dashed' },
  player: { position: 'absolute', bottom: '10%', left: '20%', width: '60%', height: 40, borderRadius: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 },
  obstacle: { position: 'absolute', left: '10%', width: '80%', height: 20, backgroundColor: colors.error, opacity: 0.8 },
  swipeHint: { position: 'absolute', bottom: 20, fontFamily: 'KodeMono_700Bold', color: colors.outline, opacity: 0.5, letterSpacing: 4 },
  controls: { height: 80, justifyContent: 'flex-end', marginTop: 16 },
  choiceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  choiceButton: { flex: 1, height: 60, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  choiceText: { fontFamily: 'KodeMono_700Bold', fontSize: 14, letterSpacing: 1, textAlign: 'center' }
});