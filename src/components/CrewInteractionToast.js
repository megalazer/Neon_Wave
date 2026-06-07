import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../store/index';
import { colors } from '../theme/colors';
import { labelCaps } from '../theme/fonts';

export default function CrewInteractionToast() {
  const toast = useStore((s) => s.world.crewInteraction.activeToast);
  const dismiss = useStore((s) => s.dismissCrewToast);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (!toast) {
      opacity.setValue(0);
      return;
    }

    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after 4s
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => dismiss());
    }, 4000);

    return () => clearTimeout(timerRef.current);
  }, [toast]);

  if (!toast) return null;

  const accent = toast.accent || colors.primary;

  return (
    <Animated.View style={[styles.toast, { borderColor: accent, opacity }]} pointerEvents="none">
      <View style={styles.header}>
        <MaterialIcons name="groups" size={10} color={accent} />
        <Text style={[styles.names, { color: accent }]}>
          {toast.nameA}{toast.nameB ? ` \u25C7 ${toast.nameB}` : ''}
        </Text>
      </View>
      {toast.lines.map((line, i) => (
        <Text key={i} style={styles.line}>{line}</Text>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(28,27,29,0.97)',
    borderWidth: 1,
    padding: 12,
    gap: 6,
    zIndex: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  names: {
    ...labelCaps,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  line: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
});
