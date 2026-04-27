import React from 'react';
import { View } from 'react-native';

type QuizCategory =
  | 'entertainment'
  | 'sports'
  | 'general_knowledge'
  | 'science'
  | 'history'
  | 'custom';

type Props = {
  category: QuizCategory;
  active: boolean;
  size?: number;
};

/* ─── Entertainment — Film clapperboard ───────────────────────────── */
function EntertainmentIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.8,
          height: size * 0.55,
          backgroundColor: color,
          borderRadius: size * 0.08,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.1,
          width: size * 0.8,
          height: size * 0.18,
          backgroundColor: color,
          opacity: 0.6,
          borderTopLeftRadius: size * 0.08,
          borderTopRightRadius: size * 0.08,
        }}
      />
    </View>
  );
}

/* ─── Sports — Ball ───────────────────────────────────────────────── */
function SportsIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: size * 0.35,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.7,
          height: size * 0.06,
          backgroundColor: 'rgba(255,255,255,0.5)',
          borderRadius: size * 0.03,
        }}
      />
    </View>
  );
}

/* ─── General Knowledge — Lightbulb ──────────────────────────────── */
function GeneralKnowledgeIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.22,
          height: size * 0.2,
          backgroundColor: color,
          opacity: 0.7,
          borderBottomLeftRadius: size * 0.04,
          borderBottomRightRadius: size * 0.04,
          marginTop: -size * 0.04,
        }}
      />
    </View>
  );
}

/* ─── Science — Atom / Flask ─────────────────────────────────────── */
function ScienceIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.35,
          height: size * 0.35,
          borderRadius: size * 0.175,
          borderWidth: size * 0.06,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.12,
          height: size * 0.12,
          borderRadius: size * 0.06,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/* ─── History — Column / Pillar ───────────────────────────────────── */
function HistoryIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.5,
          height: size * 0.12,
          backgroundColor: color,
          borderRadius: size * 0.04,
        }}
      />
      <View
        style={{
          width: size * 0.18,
          height: size * 0.5,
          backgroundColor: color,
          opacity: 0.85,
        }}
      />
      <View
        style={{
          width: size * 0.5,
          height: size * 0.12,
          backgroundColor: color,
          borderRadius: size * 0.04,
        }}
      />
    </View>
  );
}

/* ─── Custom — Pencil / Edit ─────────────────────────────────────── */
function CustomIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.2,
          height: size * 0.6,
          backgroundColor: color,
          borderRadius: size * 0.04,
          transform: [{ rotate: '-45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.12,
          left: size * 0.2,
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.06,
          borderRightWidth: size * 0.06,
          borderTopWidth: size * 0.1,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

const ICON_MAP: Record<QuizCategory, React.FC<{ color: string; size: number }>> = {
  entertainment: EntertainmentIcon,
  sports: SportsIcon,
  general_knowledge: GeneralKnowledgeIcon,
  science: ScienceIcon,
  history: HistoryIcon,
  custom: CustomIcon,
};

export default function BuilderCategoryIcon({ category, active, size = 28 }: Props) {
  const color = active ? '#FFFFFF' : '#6B4A1F';
  const IconComponent = ICON_MAP[category] ?? GeneralKnowledgeIcon;
  return <IconComponent color={color} size={size} />;
}
