/**
 * TabIcons — clean painted-style icons for the bottom navigation bar.
 * Built entirely with React Native View primitives, no emoji, no libraries.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';

type IconProps = {
  color: string;
  size?: number;
};

/* ─── Home Icon ─────────────────────────────────────────────────── */
export function HomeIcon({ color, size = 22 }: IconProps) {
  const s = size / 22;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* Roof triangle */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.52,
          borderRightWidth: size * 0.52,
          borderBottomWidth: size * 0.5,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      {/* Body */}
      <View
        style={{
          width: size * 0.68,
          height: size * 0.54,
          backgroundColor: color,
          borderTopLeftRadius: 2 * s,
          borderTopRightRadius: 2 * s,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {/* Door */}
        <View
          style={{
            width: size * 0.26,
            height: size * 0.3,
            backgroundColor: 'rgba(255,255,255,0.55)',
            borderTopLeftRadius: 3 * s,
            borderTopRightRadius: 3 * s,
            marginBottom: 0,
          }}
        />
      </View>
    </View>
  );
}

/* ─── Chart / Dashboard Icon ─────────────────────────────────────── */
export function ChartIcon({ color, size = 22 }: IconProps) {
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
      <View style={{ width: size * 0.22, height: size * 0.45, backgroundColor: color, borderRadius: 2, opacity: 0.6 }} />
      <View style={{ width: size * 0.22, height: size * 0.75, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: size * 0.22, height: size * 0.55, backgroundColor: color, borderRadius: 2, opacity: 0.8 }} />
      <View style={{ width: size * 0.22, height: size * 0.9, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

/* ─── Settings / Gear Icon ───────────────────────────────────────── */
export function GearIcon({ color, size = 22 }: IconProps) {
  const cx = size / 2;
  const outerR = size * 0.46;
  const innerR = size * 0.22;
  const toothW = size * 0.18;
  const toothH = size * 0.16;

  return (
    <View style={{ width: size, height: size }}>
      {/* Outer ring */}
      <View
        style={{
          position: 'absolute',
          top: cx - outerR,
          left: cx - outerR,
          width: outerR * 2,
          height: outerR * 2,
          borderRadius: outerR,
          borderWidth: size * 0.12,
          borderColor: color,
        }}
      />
      {/* Center dot */}
      <View
        style={{
          position: 'absolute',
          top: cx - innerR,
          left: cx - innerR,
          width: innerR * 2,
          height: innerR * 2,
          borderRadius: innerR,
          backgroundColor: color,
        }}
      />
      {/* Teeth — top, bottom, left, right */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const dist = outerR - toothH * 0.3;
        return (
          <View
            key={deg}
            style={{
              position: 'absolute',
              top: cx - toothH / 2 + Math.sin(rad) * dist,
              left: cx - toothW / 2 + Math.cos(rad) * dist,
              width: toothW,
              height: toothH,
              backgroundColor: color,
              borderRadius: 2,
              transform: [{ rotate: `${deg}deg` }],
            }}
          />
        );
      })}
    </View>
  );
}
