import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';

export const titleCardSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  fontSize: z.number().min(32).max(140),
});

export type TitleCardProps = z.infer<typeof titleCardSchema>;

export const defaultTitleCardProps: TitleCardProps = {
  title: 'Hello World',
  subtitle: 'Welcome to Motion Studio',
  backgroundColor: '#0d1117',
  primaryColor: '#ffffff',
  secondaryColor: '#58a6ff',
  fontSize: 84,
};

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  backgroundColor,
  primaryColor,
  secondaryColor,
  fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const subtitleProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleProgress, [0, 1], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: `${fontSize}px`,
          fontWeight: 800,
          color: primaryColor,
          letterSpacing: '-2px',
          textAlign: 'center',
          lineHeight: 1.1,
          padding: '0 40px',
        }}
      >
        {title}
      </div>
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontSize: `${Math.round(fontSize * 0.42)}px`,
          fontWeight: 500,
          color: secondaryColor,
          marginTop: '20px',
          textAlign: 'center',
          letterSpacing: '-0.5px',
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};
