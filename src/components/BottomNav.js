import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, glows } from '../theme/colors';
import { labelCaps } from '../theme/fonts';

const TABS = [
  { id: 'haven', label: 'HAVEN', icon: 'nightlife' },
  { id: 'cyber', label: 'CYBER', icon: 'memory' },
  { id: 'neural', label: 'NEURAL', icon: 'psychology' },
  { id: 'jobs', label: 'JOBS', icon: 'terminal' },
  { id: 'lifestyle', label: 'LIFESTYLE', icon: 'diamond' },
];

function PulsingTab({ isActive, children }) {
  const glowOpacity = useSharedValue(0.3);
  const glowRadius = useSharedValue(8);

  useEffect(() => {
    if (isActive) {
      glowOpacity.value = withRepeat(
        withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      glowRadius.value = withRepeat(
        withTiming(16, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
      glowRadius.value = withTiming(8, { duration: 200 });
    }
  }, [isActive]);

  const animStyle = useAnimatedStyle(() => ({
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowOpacity.value,
    shadowRadius: glowRadius.value,
    elevation: isActive ? 8 : 0,
  }));

  return (
    <Animated.View style={[styles.tabAnimWrapper, animStyle]}>
      {children}
    </Animated.View>
  );
}

export default function BottomNav({ activeTab, onTabPress }) {
  const handlePress = (tabId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabPress(tabId);
  };

  return (
    <View style={styles.navWrapper}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.topBorder} />
      <View style={styles.row}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isNeural = tab.id === 'neural';
          const iconSize = isNeural ? 32 : 24;

          return (
            <PulsingTab key={tab.id} isActive={isActive}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  isActive && styles.tabActive,
                ]}
                onPress={() => handlePress(tab.id)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={iconSize}
                  color={isActive ? colors.primary : colors.outline}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                    isNeural && styles.tabLabelNeural,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            </PulsingTab>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    zIndex: 50,
    overflow: 'hidden',
    // Upward magenta glow
    shadowColor: '#fe00fe',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.secondaryContainer,
    zIndex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
    marginTop: 2,
  },
  tabAnimWrapper: {
    flex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: colors.primaryFixedDim,
    backgroundColor: `${colors.primary}0D`,
  },
  tabLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabLabelInactive: {
    color: colors.outline,
  },
  tabLabelNeural: {
    fontSize: 10,
    fontFamily: 'KodeMono_700Bold',
  },
});
