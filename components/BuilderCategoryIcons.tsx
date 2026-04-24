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
  active?: boolean;
  size?: number;
};

const getAccent = (category: QuizCategory): string => {
  const palette: Record<QuizCategory, string> = {
    entertainment: '#8B5CF6',
    sports: '#3B82F6',
    general_knowledge: '#EC4899',
    science: '#06B6D4',
    history: '#F59E0B',
    custom: '#EF4444',
  };
  return palette[category];
};

type Palette = {
  fill: string;
  accent: string;
  stroke: string;
  soft: string;
};

const getPalette = (category: QuizCategory, active: boolean): Palette => {
  if (active) {
    return {
      fill: '#ECFDF3',
      accent: '#16A34A',
      stroke: '#14532D',
      soft: 'rgba(22,163,74,0.2)',
    };
  }

  return {
    fill: '#E6EEFF',
    accent: getAccent(category),
    stroke: '#1A2347',
    soft: 'rgba(255,255,255,0.1)',
  };
};

function IconFrame({
  size,
  children,
}: {
  size: number;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

function EntertainmentIcon({
  size,
  fill,
  accent,
  stroke,
  soft,
}: {
  size: number;
  fill: string;
  accent: string;
  stroke: string;
  soft: string;
}) {
  return (
    <IconFrame size={size}>
      <View
        style={{
          width: size * 0.76,
          height: size * 0.19,
          borderRadius: size * 0.05,
          backgroundColor: accent,
          borderWidth: size * 0.04,
          borderColor: stroke,
          transform: [{ rotate: '-10deg' }],
        }}
      />
      <View
        style={{
          width: size * 0.78,
          height: size * 0.47,
          borderRadius: size * 0.09,
          backgroundColor: fill,
          borderWidth: size * 0.05,
          borderColor: stroke,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginTop: size * 0.04,
        }}
      >
        {[0, 1, 2].map(row => (
          <View
            key={row}
            style={{
              width: size * 0.62,
              height: 2,
              borderRadius: 1,
              backgroundColor: soft,
              marginVertical: size * 0.02,
            }}
          />
        ))}
      </View>
    </IconFrame>
  );
}

function SportsIcon({
  size,
  fill,
  accent,
  stroke,
  soft,
}: {
  size: number;
  fill: string;
  accent: string;
  stroke: string;
  soft: string;
}) {
  return (
    <IconFrame size={size}>
      <View
        style={{
          width: size * 0.78,
          height: size * 0.78,
          borderRadius: size * 0.39,
          backgroundColor: fill,
          borderWidth: size * 0.06,
          borderColor: stroke,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.18,
            height: size * 0.18,
            borderRadius: size * 0.09,
            backgroundColor: accent,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: size * 0.72,
            height: 2,
            backgroundColor: soft,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: size * 0.72,
            height: 2,
            backgroundColor: soft,
            transform: [{ rotate: '60deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: size * 0.72,
            height: 2,
            backgroundColor: soft,
            transform: [{ rotate: '-60deg' }],
          }}
        />
      </View>
    </IconFrame>
  );
}

function KnowledgeIcon({
  size,
  fill,
  accent,
  stroke,
  soft,
}: {
  size: number;
  fill: string;
  accent: string;
  stroke: string;
  soft: string;
}) {
  return (
    <IconFrame size={size}>
      <View
        style={{
          width: size * 0.54,
          height: size * 0.54,
          borderRadius: size * 0.27,
          backgroundColor: fill,
          borderWidth: size * 0.05,
          borderColor: stroke,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.2,
            height: size * 0.2,
            borderRadius: size * 0.1,
            backgroundColor: accent,
            marginTop: size * 0.02,
          }}
        />
        <View
          style={{
            width: size * 0.12,
            height: size * 0.05,
            borderRadius: size * 0.025,
            backgroundColor: soft,
            marginTop: size * 0.05,
          }}
        />
      </View>
      <View
        style={{
          width: size * 0.26,
          height: size * 0.1,
          borderRadius: size * 0.03,
          backgroundColor: accent,
          marginTop: size * 0.02,
        }}
      />
    </IconFrame>
  );
}

function ScienceIcon({
  size,
  fill,
  accent,
  stroke,
  soft,
}: {
  size: number;
  fill: string;
  accent: string;
  stroke: string;
  soft: string;
}) {
  return (
    <IconFrame size={size}>
      <View
        style={{
          width: size * 0.16,
          height: size * 0.2,
          borderRadius: size * 0.04,
          backgroundColor: fill,
          borderWidth: size * 0.04,
          borderColor: stroke,
        }}
      />
      <View
        style={{
          width: size * 0.56,
          height: size * 0.48,
          borderBottomLeftRadius: size * 0.16,
          borderBottomRightRadius: size * 0.16,
          borderTopLeftRadius: size * 0.08,
          borderTopRightRadius: size * 0.08,
          borderWidth: size * 0.05,
          borderColor: stroke,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginTop: size * 0.02,
        }}
      >
        <View
          style={{ width: '100%', height: '46%', backgroundColor: accent }}
        />
        <View
          style={{
            position: 'absolute',
            width: size * 0.34,
            height: 2,
            borderRadius: 1,
            backgroundColor: soft,
            top: size * 0.19,
          }}
        />
      </View>
    </IconFrame>
  );
}

function HistoryIcon({
  size,
  fill,
  accent,
  stroke,
}: {
  size: number;
  fill: string;
  accent: string;
  stroke: string;
}) {
  return (
    <IconFrame size={size}>
      <View
        style={{
          width: size * 0.68,
          height: size * 0.12,
          borderRadius: size * 0.03,
          backgroundColor: fill,
          borderWidth: size * 0.04,
          borderColor: stroke,
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          gap: size * 0.07,
          marginTop: size * 0.03,
        }}
      >
        {[0, 1, 2].map(column => (
          <View
            key={column}
            style={{
              width: size * 0.11,
              height: size * 0.35,
              borderRadius: size * 0.02,
              backgroundColor: accent,
            }}
          />
        ))}
      </View>
      <View
        style={{
          width: size * 0.72,
          height: size * 0.12,
          borderRadius: size * 0.03,
          backgroundColor: fill,
          borderWidth: size * 0.04,
          borderColor: stroke,
          marginTop: size * 0.03,
        }}
      />
    </IconFrame>
  );
}

function CustomIcon({
  size,
  fill,
  accent,
  stroke,
}: {
  size: number;
  fill: string;
  accent: string;
  stroke: string;
}) {
  return (
    <IconFrame size={size}>
      <View
        style={{
          width: size * 0.56,
          height: size * 0.15,
          borderRadius: size * 0.05,
          backgroundColor: fill,
          borderWidth: size * 0.04,
          borderColor: stroke,
          transform: [{ rotate: '-35deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: size * 0.16,
          top: size * 0.2,
          width: size * 0.15,
          height: size * 0.15,
          borderRadius: size * 0.04,
          backgroundColor: accent,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.14,
          top: size * 0.19,
          width: size * 0.09,
          height: size * 0.09,
          borderRadius: size * 0.045,
          backgroundColor: accent,
        }}
      />
    </IconFrame>
  );
}

export default function BuilderCategoryIcon({
  category,
  active = false,
  size = 24,
}: Props) {
  const { fill, accent, stroke, soft } = getPalette(category, active);

  if (category === 'entertainment') {
    return (
      <EntertainmentIcon
        size={size}
        fill={fill}
        accent={accent}
        stroke={stroke}
        soft={soft}
      />
    );
  }
  if (category === 'sports') {
    return (
      <SportsIcon
        size={size}
        fill={fill}
        accent={accent}
        stroke={stroke}
        soft={soft}
      />
    );
  }
  if (category === 'general_knowledge') {
    return (
      <KnowledgeIcon
        size={size}
        fill={fill}
        accent={accent}
        stroke={stroke}
        soft={soft}
      />
    );
  }
  if (category === 'science') {
    return (
      <ScienceIcon
        size={size}
        fill={fill}
        accent={accent}
        stroke={stroke}
        soft={soft}
      />
    );
  }
  if (category === 'history') {
    return (
      <HistoryIcon size={size} fill={fill} accent={accent} stroke={stroke} />
    );
  }
  return <CustomIcon size={size} fill={fill} accent={accent} stroke={stroke} />;
}
