import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { colors } from '../../theme/colors';
import { useStore } from '../../store';
import ScanlineOverlay from '../ScanlineOverlay';
import PacketSniffer from './PacketSniffer';
import DaemonHunt from './DaemonHunt';
import SignalJamming from './SignalJamming';
import ChromeCourier from './ChromeCourier';

const STAT_MAP = {
  act_packet_sniffer: 'wire',
  act_daemon_hunt: 'edge',
  act_chrome_courier: 'ghost',
  act_signal_jamming: 'grit',
};

export default function MicrogameHost({ activity, onResult }) {
  const [glitch, setGlitch] = useState(false);
  const player = useStore((s) => s.crew.members.find((m) => m.isPlayer));
  
  const statName = STAT_MAP[activity.id] || 'wire';
  const statValue = player?.stats?.[statName] || 1;

  // Children fire onResult from timers; guard so a stray double-fire can
  // never execute the activity (and advance the turn) twice.
  const resolvedRef = useRef(false);

  const handleResult = (result) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    if (result.outcome === 'bust') {
      setGlitch(true);
      setTimeout(() => {
        onResult(result);
      }, 800);
    } else {
      onResult(result);
    }
  };

  const getAccentColor = () => {
    switch(activity.accent) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'tertiary': return colors.tertiary;
      case 'error': return colors.error;
      default: return colors.primary;
    }
  };

  const accentColor = getAccentColor();

  const renderGame = () => {
    switch (activity.id) {
      case 'act_packet_sniffer':
        return <PacketSniffer statValue={statValue} onResult={handleResult} accentColor={accentColor} />;
      case 'act_daemon_hunt':
        return <DaemonHunt statValue={statValue} onResult={handleResult} accentColor={accentColor} />;
      case 'act_signal_jamming':
        return <SignalJamming statValue={statValue} onResult={handleResult} accentColor={accentColor} />;
      case 'act_chrome_courier':
        return <ChromeCourier statValue={statValue} onResult={handleResult} accentColor={accentColor} />;
      default:
        return (
          <View style={styles.placeholder}>
            <Text style={[styles.title, { color: accentColor }]}>[GAME NOT FOUND]</Text>
            <TouchableOpacity 
              style={[styles.button, { borderColor: accentColor }]}
              onPress={() => onResult({ outcome: 'banked', payoutMultiplier: 1 })}
            >
              <Text style={[styles.buttonText, { color: accentColor }]}>BAIL</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, glitch && styles.glitchContainer]}>
          <View style={[styles.header, { borderBottomColor: accentColor }]}>
            <Text style={[styles.headerText, { color: accentColor }]}>
              {activity.name.toUpperCase()} :: SYS.ACTIVE
            </Text>
          </View>
          
          <View style={styles.gameArea}>
            {renderGame()}
          </View>
          
          {glitch && (
            <View style={styles.glitchOverlay}>
              <Text style={styles.glitchText}>SYSTEM BUST</Text>
              <Text style={styles.glitchSubtext}>FATAL ERROR :: CONNECTION LOST</Text>
            </View>
          )}
          <ScanlineOverlay opacity={0.15} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    height: '80%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: 'hidden',
  },
  glitchContainer: {
    borderColor: colors.error,
    transform: [{ translateX: 2 }, { translateY: -1 }],
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    backgroundColor: colors.background,
  },
  headerText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 14,
    letterSpacing: 1.4,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 2,
  },
  button: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  buttonText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 14,
    letterSpacing: 1.4,
  },
  glitchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 0, 51, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  glitchText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 32,
    color: colors.error,
    letterSpacing: 4,
    textShadowColor: colors.error,
    textShadowOffset: { width: 2, height: 0 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  glitchSubtext: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.error,
    letterSpacing: 2,
  }
});
