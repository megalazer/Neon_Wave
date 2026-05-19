import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, glows } from '../theme/colors';
import { labelCaps } from '../theme/fonts';
import { useStore } from '../store/index';

export default function TopBanner({ subtitle = '', telemetry = {} }) {
  const { credits = '1,000', renown = 'GHOST', time = '00:00:00' } = telemetry;

  const devEnabled   = useStore((s) => s.dev.enabled);
  const recordTap    = useStore((s) => s.recordBannerTap);
  const openDevPanel = useStore((s) => s.openDevPanel);

  const displaySubtitle = devEnabled ? 'DEV_PROTOCOL_ENGAGED' : subtitle;
  const subtitleColor   = devEnabled ? colors.error : colors.outline;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        {/* Left: terminal icon box + tappable title */}
        <View style={styles.left}>
          <View style={styles.iconBox}>
            <MaterialIcons name="terminal" size={18} color={colors.primary} />
          </View>
          <Pressable onPress={recordTap} style={styles.titleGroup}>
            <Text style={styles.title}>NEURAL_CHRONICLE_OS</Text>
            {(displaySubtitle) ? (
              <Text style={[styles.subtitle, { color: subtitleColor }]}>
                // {displaySubtitle}
              </Text>
            ) : null}
          </Pressable>
        </View>

        {/* Right: DEV chip (when enabled) + telemetry */}
        <View style={styles.right}>
          {devEnabled && (
            <Pressable onPress={openDevPanel} style={styles.devChip}>
              <Text style={styles.devChipText}>[DEV]</Text>
            </Pressable>
          )}
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
    paddingTop: 44,
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
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
    gap: 2,
  },
  devChip: {
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginBottom: 2,
  },
  devChipText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.error,
    letterSpacing: 1.5,
  },
  telemetry: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
