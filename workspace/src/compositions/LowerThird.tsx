import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';

export const lowerThirdSchema = z.object({
  name: z.string(),
  title: z.string(),
  accentColor: z.string(),
  cardBackground: z.string(),
  nameColor: z.string(),
  titleColor: z.string(),
});

export type LowerThirdProps = z.infer<typeof lowerThirdSchema>;

export const defaultLowerThirdProps: LowerThirdProps = {
  name: 'Jane Doe',
  title: 'Lead Motion Designer',
  accentColor: '#3b82f6',
  cardBackground: '#1e293b',
  nameColor: '#ffffff',
  titleColor: '#94a3b8',
};

export const LowerThird: React.FC<LowerThirdProps> = ({
  name,
  title,
  accentColor,
  cardBackground,
  nameColor,
  titleColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const translateX = interpolate(slideIn, [0, 1], [-600, 0]);
  const barScaleY = interpolate(slideIn, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: '80px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          transform: `translateX(${translateX}px)`,
          display: 'flex',
          flexDirection: 'row',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: cardBackground,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div
          style={{
            width: '8px',
            backgroundColor: accentColor,
            transform: `scaleY(${barScaleY})`,
            transformOrigin: 'bottom',
          }}
        />
        <div
          style={{
            padding: '24px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: nameColor,
              lineHeight: 1.2,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 500,
              color: titleColor,
              marginTop: '4px',
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
