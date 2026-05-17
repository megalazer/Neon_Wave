import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

// CPU_INIT pulses to signal active boot state — mechanical rhythm, no bounce.
export default function InitHeader({ step, stepLabel }) {
  const cpuOpacity = useSharedValue(0.5);

  useEffect(() => {
    cpuOpacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const cpuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cpuOpacity.value,
  }));

  const stepStr = `STEP_0${step}_OF_03 // ${stepLabel}`;

  return (
    <View style={styles.container}>
      {/* Row 1: boot label + status tags */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <MaterialIcons
            name="settings_input_component"
            size={16}
            color={colors.primary}
          />
          <Text style={styles.bootLabel}>BOOT_SEQUENCE: V.4.0.2</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.memOk}>MEM_OK</Text>
          <Animated.Text style={[styles.cpuInit, cpuAnimatedStyle]}>
            CPU_INIT
          </Animated.Text>
        </View>
      </View>

      {/* Row 2: system title + step indicator */}
      <View style={styles.row}>
        <Text style={styles.sysTitle}>SYSTEM_INITIALIZATION_V.4.0.2</Text>
        <Text style={styles.stepLabel}>{stepStr}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 60,
    height: 90,
    paddingTop: 44,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,243,255,0.4)',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bootLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 1.5,
  },
  memOk: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 1.2,
  },
  cpuInit: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 1.2,
  },
  sysTitle: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 14,
    color: colors.primary,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,243,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  stepLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 1.2,
  },
});
