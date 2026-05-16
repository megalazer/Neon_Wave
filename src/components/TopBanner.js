import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, glows } from '../theme/colors';
import { labelCaps } from '../theme/fonts';

export default function TopBanner({ subtitle = '', telemetry = {} }) {
  const { credits = '1,000', renown = 'GHOST', time = '00:00:00' } = telemetry;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        {/* Left: terminal icon box + title */}
        <View style={styles.left}>
          <View style={styles.iconBox}>
            <MaterialIcons name="terminal" size={18} color={colors.primary} />
          </View>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>NEURAL_CHRONICLE_OS</Text>
            {subtitle ? (
              <Text style={styles.subtitle}>// {subtitle}</Text>
            ) : null}
          </View>
        </View>

        {/* Right: telemetry */}
        <View style={styles.right}>
          <Text style={styles.telemetry}>CR: {credits}</Text>
          <Text style={[styles.telemetry, { color: colors.outline, marginTop: 1 }]}>
            {renown !== null ? `RN: ${renown}` : `T: ${time}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.primaryContainer}4D`,
    overflow: 'hidden',
    ...glows.bannerBottom,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 44, // safe area top
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primaryContainer}1A`,
  },
  titleGroup: {
    flexShrink: 1,
  },
  title: {
    ...labelCaps,
    color: colors.primary,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  telemetry: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
