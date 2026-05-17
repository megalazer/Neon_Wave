import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';

const SCREEN_H = Dimensions.get('screen').height;
// 1px dark band every 4px — matches the CSS `linear-gradient(...50%,...50%) / 100% 4px` pattern
const LINE_PERIOD = 4;
const LINE_COUNT = Math.ceil(SCREEN_H / LINE_PERIOD) + 8;

export default function ScanlineOverlay() {
  const lines = useMemo(() => Array.from({ length: LINE_COUNT }), []);

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.linesColumn}>
        {lines.map((_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>
      {/* Subtle RGB fringe tint across full width */}
      <View style={styles.rgbTint} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    overflow: 'hidden',
  },
  linesColumn: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
  },
  line: {
    height: 1,
    marginBottom: LINE_PERIOD - 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  rgbTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 243, 255, 0.012)',
  },
});
