import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

// CRT body background matching neuralscreen:
// background-color: #0e0e10
// background-image: horizontal scanlines + vertical RGB shift at 4px/3px repeat
export default function CRTBackground({ children }) {
  return (
    <View style={styles.root}>
      {/* Base dark background */}
      <View style={[StyleSheet.absoluteFill, styles.base]} />
      {/* Vertical RGB tint (3px column simulation) */}
      <LinearGradient
        colors={[
          'rgba(0,243,255,0.02)',
          'rgba(254,0,254,0.015)',
          'rgba(0,243,255,0.02)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  base: {
    backgroundColor: colors.background,
  },
});
