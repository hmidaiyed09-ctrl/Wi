/**
 * TabIcons — clean painted-style icons built with View primitives.
 * Built entirely with React Native View primitives, no emoji, no libraries.
 */
import React from 'react';
import { View } from 'react-native';

type IconProps = {
  color: string;
  size?: number;
};

/* ─── Home Icon ─────────────────────────────────────────────────── */
export function HomeIcon({ color, size = 22 }: IconProps) {
  const s = size / 22;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
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
    <View
      style={{
        width: size,
        height: size,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 3,
      }}
    >
      <View
        style={{
          width: size * 0.22,
          height: size * 0.45,
          backgroundColor: color,
          borderRadius: 2,
          opacity: 0.6,
        }}
      />
      <View
        style={{
          width: size * 0.22,
          height: size * 0.75,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          width: size * 0.22,
          height: size * 0.55,
          backgroundColor: color,
          borderRadius: 2,
          opacity: 0.8,
        }}
      />
      <View
        style={{
          width: size * 0.22,
          height: size * 0.9,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
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
      {[0, 90, 180, 270].map(deg => {
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

/* ─── Extra UI Icons (painted style) ──────────────────────────────── */
export function GamepadIcon({
  color = '#6B4CE6',
  size = 22,
  accentColor = '#F5A623',
}: IconProps) {
  return (
    <View style={{ width: size, height: size * 0.72, position: 'relative' }}>
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: size * 0.56,
          borderRadius: size * 0.28,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.18,
          top: size * 0.3,
          width: size * 0.2,
          height: size * 0.2,
          borderRadius: size * 0.04,
          backgroundColor: 'rgba(255,255,255,0.72)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: size * 0.15,
            height: size * 0.035,
            backgroundColor: color,
            borderRadius: size * 0.02,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: size * 0.035,
            height: size * 0.15,
            backgroundColor: color,
            borderRadius: size * 0.02,
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          right: size * 0.16,
          top: size * 0.32,
          width: size * 0.08,
          height: size * 0.08,
          borderRadius: size * 0.04,
          backgroundColor: accentColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.27,
          top: size * 0.42,
          width: size * 0.08,
          height: size * 0.08,
          borderRadius: size * 0.04,
          backgroundColor: 'rgba(255,255,255,0.74)',
        }}
      />
    </View>
  );
}

export function TrophyIcon({
  color = '#F5A623',
  size = 22,
  accentColor = '#6B4CE6',
}: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <View
        style={{
          marginTop: size * 0.06,
          width: size * 0.52,
          height: size * 0.34,
          borderRadius: size * 0.1,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          marginTop: size * 0.04,
          width: size * 0.14,
          height: size * 0.18,
          borderRadius: size * 0.03,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          marginTop: size * 0.04,
          width: size * 0.42,
          height: size * 0.14,
          borderRadius: size * 0.05,
          backgroundColor: accentColor,
          opacity: 0.35,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.12,
          left: size * 0.09,
          width: size * 0.11,
          height: size * 0.15,
          borderTopLeftRadius: size * 0.06,
          borderBottomLeftRadius: size * 0.06,
          borderWidth: size * 0.03,
          borderRightWidth: 0,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.12,
          right: size * 0.09,
          width: size * 0.11,
          height: size * 0.15,
          borderTopRightRadius: size * 0.06,
          borderBottomRightRadius: size * 0.06,
          borderWidth: size * 0.03,
          borderLeftWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  );
}

export function ClipboardIcon({
  color = '#7E8BC7',
  size = 22,
  accentColor = '#F5A623',
}: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <View
        style={{
          marginTop: size * 0.12,
          width: size * 0.66,
          height: size * 0.78,
          borderRadius: size * 0.08,
          backgroundColor: color,
          opacity: 0.22,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.03,
          width: size * 0.32,
          height: size * 0.18,
          borderRadius: size * 0.08,
          backgroundColor: accentColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.3,
          width: size * 0.4,
          height: size * 0.05,
          borderRadius: size * 0.02,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.45,
          width: size * 0.4,
          height: size * 0.05,
          borderRadius: size * 0.02,
          backgroundColor: color,
          opacity: 0.8,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.6,
          width: size * 0.3,
          height: size * 0.05,
          borderRadius: size * 0.02,
          backgroundColor: color,
          opacity: 0.7,
        }}
      />
    </View>
  );
}
