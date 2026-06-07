import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { QUALITY_CONFIG } from '../../data/recruitQuality';

const FALLBACK_COLOR = colors.primary;

export default function RecruitButton({ quality, canAfford, rosterFull, onRecruit }) {
  const pressed = useSharedValue(0);
  const accentColor = quality ? (QUALITY_CONFIG[quality]?.color ?? FALLBACK_COLOR) : FALLBACK_COLOR;

  const disabled = !canAfford || rosterFull;
  const label = rosterFull
    ? '[ROSTER_FULL]'
    : !canAfford
    ? '[NO_FUNDS]'
    : '[RECRUIT]';

  const containerAnim = useAnimatedStyle(() => {
    if (disabled) return { backgroundColor: 'transparent' };
    return {
      backgroundColor: interpolateColor(pressed.value, [0, 1], ['rgba(0,0,0,0)', accentColor]),
    };
  });
  const labelAnim = useAnimatedStyle(() => {
    if (disabled) return { color: `${accentColor}44` };
    return { color: interpolateColor(pressed.value, [0, 1], [accentColor, colors.background]) };
  });

  return (
    <Animated.View
      style={[
        styles.btn,
        { borderColor: disabled ? `${accentColor}33` : accentColor },
        !disabled && { shadowColor: accentColor },
        containerAnim,
      ]}
    >
      <TouchableOpacity
        onPressIn={() => { if (!disabled) pressed.value = withTiming(1, { duration: 75 }); }}
        onPressOut={() => { pressed.value = withTiming(0, { duration: 75 }); }}
        onPress={onRecruit}
        disabled={disabled}
        activeOpacity={1}
        style={styles.inner}
      >
        <Animated.Text style={[styles.label, labelAnim]}>{label}</Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 130,
  },
  inner: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
