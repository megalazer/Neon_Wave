import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { labelCaps } from '../theme/fonts';

export default function AdvanceCycleFAB({ onPress }) {
  const opacity = useSharedValue(0.5);
  const glowRadius = useSharedValue(10);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    glowRadius.value = withRepeat(
      withTiming(25, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity.value,
    shadowRadius: glowRadius.value,
    elevation: 12,
    opacity: 0.85 + opacity.value * 0.15,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View style={[styles.fabWrapper, animStyle]}>
      <TouchableOpacity
        style={styles.fab}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <MaterialIcons name="bolt" size={22} color={colors.onPrimary} />
        <Text style={styles.label}>ADVANCE_CYCLE</Text>
      </TouchableOpacity>
      {/* Chunky bottom-right border effect from design */}
      <View style={styles.borderBottom} />
      <View style={styles.borderRight} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    bottom: 88,
    right: 20,
    zIndex: 60,
  },
  fab: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    color: colors.onPrimary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  borderBottom: {
    position: 'absolute',
    bottom: -4,
    left: 4,
    right: -4,
    height: 4,
    backgroundColor: colors.primaryFixedDim,
  },
  borderRight: {
    position: 'absolute',
    top: 4,
    right: -4,
    bottom: -4,
    width: 4,
    backgroundColor: colors.primaryFixedDim,
  },
});
