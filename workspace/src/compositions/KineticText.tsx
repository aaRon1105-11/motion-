import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';

export const kineticTextSchema = z.object({
  text: z.string(),
  backgroundColor: z.string(),
  textColor: z.string(),
  highlightColor: z.string(),
  fontSize: z.number().min(40).max(120),
});

export type KineticTextProps = z.infer<typeof kineticTextSchema>;

export const defaultKineticTextProps: KineticTextProps = {
  text: 'Ideas into High Velocity Motion Graphics',
  backgroundColor: '#09090b',
  textColor: '#f4f4f5',
  highlightColor: '#e11d48',
  fontSize: 72,
};

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  backgroundColor,
  textColor,
  highlightColor,
  fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '100px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {words.map((word, index) => {
        const delay = index * 6;
        const progress = spring({
          frame: frame - delay,
          fps,
          config: { damping: 12, stiffness: 120 },
        });

        const scale = interpolate(progress, [0, 1], [0.3, 1]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const isHighlight = index === words.length - 1;

        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              color: isHighlight ? highlightColor : textColor,
              opacity,
              transform: `scale(${scale})`,
              letterSpacing: '-1px',
            }}
          >
            {word}
          </span>
        );
      })}
    </AbsoluteFill>
  );
};
