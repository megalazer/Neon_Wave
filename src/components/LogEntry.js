import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  LinearTransition,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { labelCaps, bodyMd } from '../theme/fonts';

// Entry unfolds from zero height then siblings slide down via LinearTransition
const unfoldFromTop = () => {
  'worklet';
  return {
    initialValues: {
      opacity: 0,
      transform: [{ scaleY: 0 }],
    },
    animations: {
      opacity: withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
      transform: [
        { scaleY: withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }) },
      ],
    },
  };
};

export default function LogEntry({ entry, index }) {
  const entryNum = String(index + 1).padStart(3, '0');

  return (
    <Animated.View
      entering={unfoldFromTop}
      layout={LinearTransition.duration(350)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.label}>ENTRY_{entryNum}</Text>
        <MaterialIcons name="sensors" size={14} color={`${colors.primary}66`} />
      </View>
      <Text style={styles.body}>
        <Text style={styles.prefix}>LOG: </Text>
        {entry.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerLow,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    ...labelCaps,
    color: `${colors.primary}B3`,
    fontSize: 10,
  },
  body: {
    ...bodyMd,
    color: colors.onBackground,
    lineHeight: 22,
  },
  prefix: {
    fontFamily: 'KodeMono_700Bold',
    color: colors.primary,
  },
});
