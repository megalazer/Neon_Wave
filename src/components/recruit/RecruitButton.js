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

  const containerAnim = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(pressed.value, [0, 1], ['rgba(0,0,0,0)', accentColor]),
  }));
  const labelAnim = useAnimatedStyle(() => ({
    color: interpolateColor(pressed.value, [0, 1], [accentColor, colors.background]),
  }));

  const disabled = !canAfford || rosterFull;
  const label = rosterFull
    ? '[ROSTER_FULL]'
    : !canAfford
    ? '[NO_FUNDS]'
    : '[RECRUIT]';

  return (
    <Animated.View style={[styles.btn, { borderColor: accentColor }, disabled && styles.btnDisabled, containerAnim]}>
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
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  btnDisabled: { opacity: 0.4 },
  inner: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
