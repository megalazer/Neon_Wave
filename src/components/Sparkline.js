import React, { useMemo } from 'react';
import { View } from 'react-native';

// Draws a sparkline using absolutely-positioned Views — no SVG dependency.
// Each consecutive pair of data points becomes a rotated thin rectangle.
export default function Sparkline({
  data,
  width = 100,
  height = 32,
  color = '#00f3ff',
  strokeWidth = 1.5,
  showLastDot = true,
  fillBelow = true,
}) {
  const { segments, lastPoint, stepX } = useMemo(() => {
    if (!data || data.length < 2) return { segments: [], lastPoint: null, stepX: 0 };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);

    const points = data.map((v, i) => ({
      x: i * step,
      y: height - ((v - min) / range) * height * 0.8 - height * 0.1,
    }));

    const segs = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      segs.push({ cx: (p1.x + p2.x) / 2, cy: (p1.y + p2.y) / 2, len, angle, y1: p1.y });
    }

    return { segments: segs, lastPoint: points[points.length - 1], stepX: step };
  }, [data, width, height]);

  if (!data || data.length < 2) {
    // Flat line fallback so we never show nothing
    return (
      <View style={{ width, height }}>
        <View style={{
          position: 'absolute',
          left: 0, top: height / 2 - strokeWidth / 2,
          width, height: strokeWidth,
          backgroundColor: color, opacity: 0.4,
        }} />
      </View>
    );
  }

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      {/* Fill strips below each segment */}
      {fillBelow && segments.map((seg, i) => (
        <View
          key={`f${i}`}
          style={{
            position: 'absolute',
            left: seg.cx - seg.len / 2,
            top: seg.cy,
            width: seg.len,
            height: height - seg.cy,
            backgroundColor: color,
            opacity: 0.08,
          }}
        />
      ))}

      {/* Line segments */}
      {segments.map((seg, i) => (
        <View
          key={`s${i}`}
          style={{
            position: 'absolute',
            left: seg.cx - seg.len / 2,
            top: seg.cy - strokeWidth / 2,
            width: seg.len,
            height: strokeWidth,
            backgroundColor: color,
            transform: [{ rotate: `${seg.angle}deg` }],
          }}
        />
      ))}

      {/* Last point dot */}
      {showLastDot && lastPoint && (
        <View
          style={{
            position: 'absolute',
            left: lastPoint.x - 2.5,
            top: lastPoint.y - 2.5,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: color,
          }}
        />
      )}
    </View>
  );
}
