import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

const RAINBOW_STOPS = [
  '#ff0040',
  '#ff8800',
  '#ffdd00',
  '#00ff88',
  '#00f3ff',
  '#aa00ff',
  '#ff0040',
];
const RAINBOW_INPUT = [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1];

export default function AnimatedRainbowBorder({ children, style, borderWidth = 2 }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, RAINBOW_INPUT, RAINBOW_STOPS),
  }));

  return (
    <Animated.View style={[style, animStyle, { borderWidth }]}>
      {children}
    </Animated.View>
  );
}
