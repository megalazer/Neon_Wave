import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, Easing, createAnimatedComponent,
} from 'react-native-reanimated';
import { useStore } from '../../store/index';
import { colors } from '../../theme/colors';

const RED  = colors.error;

const AnimatedLine = createAnimatedComponent(Line);

// One-shot tracer: draws itself from source to target in 120ms, then stays static.
// Re-fires when justFiredAt changes (reassignment case).
function TracerLine({ x1, y1, x2, y2, color, justFiredAt }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
  }, [justFiredAt]);

  const dx = x2 - x1;
  const dy = y2 - y1;

  const animatedProps = useAnimatedProps(() => ({
    x2: x1 + dx * progress.value,
    y2: y1 + dy * progress.value,
  }));

  return (
    <AnimatedLine
      x1={x1}
      y1={y1}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      animatedProps={animatedProps}
    />
  );
}

// Reads targetLines directly from the store — no lines/phase props needed.
// During targeting: friendly → hostile tracers from targetLines.
// During enemy_turn: hostile → friendly warning tracers from enemyAssignments.
export default function TargetingOverlay({ unitCoords }) {
  const phase = useStore((s) => s.combat.phase);
  const targetLines = useStore((s) => s.combat.targetLines);
  const enemyAssignments = useStore((s) => s.combat.enemyAssignments);

  let lines = null;

  if (phase === 'targeting') {
    const entries = Object.entries(targetLines);
    if (entries.length === 0) return null;
    lines = entries.map(([friendlyId, line]) => {
      const from = unitCoords[friendlyId];
      const to   = unitCoords[line.targetId];
      if (!from || !to) return null;
      return (
        <TracerLine
          key={friendlyId}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          color={line.color}
          justFiredAt={line.justFiredAt}
        />
      );
    });
  } else if (phase === 'enemy_turn') {
    if (enemyAssignments.length === 0) return null;
    lines = enemyAssignments.map((a) => {
      const from = unitCoords[a.enemyId];
      const to   = unitCoords[a.targetId];
      if (!from || !to) return null;
      return (
        <TracerLine
          key={a.id}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          color={RED}
          justFiredAt={a.id}
        />
      );
    });
  } else {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        {lines}
      </Svg>
    </View>
  );
}
