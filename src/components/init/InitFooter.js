import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

// Scrolls with page content — not fixed. Magenta dot signals active session.
export default function InitFooter() {
  const dotOpacity = useSharedValue(0.4);

  useEffect(() => {
    dotOpacity.value = withRepeat(
      withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Row 1: pulsing dot + copyright */}
      <View style={styles.row}>
        <Animated.View style={[styles.dot, dotAnimatedStyle]} />
        <Text style={styles.copyright}>
          © 2104 NEURAL_SYNC_PROTOCOLS // ALL_RIGHTS_RESERVED
        </Text>
      </View>

      {/* Row 2: diagnostics link row */}
      <Text style={styles.diagnostics}>
        DIAGNOSTICS  /  LOG_09.X  /  TERMINATE_SESSION
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fe00fe',
  },
  copyright: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 1.2,
  },
  diagnostics: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 8,
    color: colors.outlineVariant,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
