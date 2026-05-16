import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Replicates the CSS scanline overlay from neuralscreen:
// linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%) at 2px height
// + linear-gradient(90deg, cyan 0.03, magenta 0.02, cyan 0.03) at 3px width
export default function ScanlineOverlay() {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Vertical RGB column shift (horizontal gradient) */}
      <LinearGradient
        colors={[
          'rgba(0,243,255,0.025)',
          'rgba(254,0,254,0.015)',
          'rgba(0,243,255,0.025)',
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Horizontal scanline darkening — alternating rows approximation */}
      <LinearGradient
        colors={[
          'rgba(18,16,16,0)',
          'rgba(0,0,0,0.18)',
          'rgba(18,16,16,0)',
          'rgba(0,0,0,0.18)',
          'rgba(18,16,16,0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
