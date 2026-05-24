import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const CYAN = colors.primary;
const RED  = colors.error;

const DASH = 7;
const GAP  = 9;

// Renders one dashed line as a series of rotated View rectangles
function DashedLine({ x1, y1, x2, y2, color }) {
  const dx  = x2 - x1;
  const dy  = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;

  const angle   = Math.atan2(dy, dx) * (180 / Math.PI);
  const period  = DASH + GAP;
  const count   = Math.floor(len / period);

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const t = (i * period + DASH / 2) / len;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x1 + dx * t - DASH / 2,
              top:  y1 + dy * t - 0.75,
              width: DASH,
              height: 1.5,
              backgroundColor: color,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
    </>
  );
}

// Two fixed shared values — one for player lines, one for enemy lines.
// Fixed hook count regardless of how many lines are in the prop.
export default function TargetingOverlay({ lines = [], phase }) {
  const playerOp = useSharedValue(0);
  const enemyOp  = useSharedValue(0);

  useEffect(() => {
    const isPlayerActive = phase === 'targeting' || phase === 'executing';
    const isEnemyActive  = phase === 'enemy_turn';

    playerOp.value = isPlayerActive
      ? withRepeat(
          withSequence(
            withTiming(0.9, { duration: 700 }),
            withTiming(0.3, { duration: 700 }),
          ),
          -1,
        )
      : withTiming(0, { duration: 180 });

    enemyOp.value = isEnemyActive
      ? withRepeat(
          withSequence(
            withTiming(1.0, { duration: 500 }),
            withTiming(0.35, { duration: 500 }),
          ),
          -1,
        )
      : withTiming(0, { duration: 180 });
  }, [phase]);

  const playerStyle = useAnimatedStyle(() => ({ opacity: playerOp.value }));
  const enemyStyle  = useAnimatedStyle(() => ({ opacity: enemyOp.value  }));

  const playerLines = lines.filter((l) => l.type === 'player');
  const enemyLines  = lines.filter((l) => l.type === 'enemy');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Player assignment lines */}
      <Animated.View style={[StyleSheet.absoluteFill, playerStyle]}>
        {playerLines.map((l, i) => (
          <DashedLine key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} color={CYAN} />
        ))}
      </Animated.View>

      {/* Enemy retaliation lines */}
      <Animated.View style={[StyleSheet.absoluteFill, enemyStyle]}>
        {enemyLines.map((l, i) => (
          <DashedLine key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} color={RED} />
        ))}
      </Animated.View>
    </View>
  );
}
