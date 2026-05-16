import React from 'react';
import { StyleSheet, View } from 'react-native';

// Grain/noise overlay — opacity 0.05, blend-mode overlay approximation.
// In RN we use a very subtle semi-transparent white tint over the whole screen.
// The intialzescreen uses a similar approach with grain at 0.05 opacity.
export default function NoiseTexture() {
  return <View style={styles.grain} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  grain: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
    // Very subtle noise approximation via a barely-visible tint
    // Can't replicate SVG fractalNoise in RN without a library, so we approximate
    backgroundColor: 'rgba(229,225,228,0.02)',
  },
});
