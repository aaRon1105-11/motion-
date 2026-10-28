import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';

export const logoRevealSchema = z.object({
  brandName: z.string(),
  subtitle: z.string(),
  backgroundColor: z.string(),
  wipeColor: z.string(),
  textColor: z.string(),
  accentColor: z.string(),
});

export type LogoRevealProps = z.infer<typeof logoRevealSchema>;

export const defaultLogoRevealProps: LogoRevealProps = {
  brandName: 'NEXUS',
  subtitle: 'NEXT GENERATION STUDIO',
  backgroundColor: '#0a0a0c',
  wipeColor: '#6366f1',
  textColor: '#ffffff',
  accentColor: '#818cf8',
};

export const LogoReveal: React.FC<LogoRevealProps> = ({
  brandName,
  subtitle,
  backgroundColor,
  wipeColor,
  textColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wipeProgress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  const wipeWidth = interpolate(wipeProgress, [0, 1], [0, 100]);

  const textProgress = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const textOpacity = interpolate(textProgress, [0, 1], [0, 1]);
  const textScale = interpolate(textProgress, [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: `${wipeWidth}%`,
          height: '4px',
          backgroundColor: wipeColor,
          boxShadow: `0 0 24px ${wipeColor}`,
        }}
      />

      <div
        style={{
          opacity: textOpacity,
          transform: `scale(${textScale})`,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            fontSize: '96px',
            fontWeight: 900,
            letterSpacing: '12px',
            color: textColor,
          }}
        >
          {brandName}
        </div>
        <div
          style={{
            fontSize: '20px',
            fontWeight: 600,
            letterSpacing: '6px',
            color: accentColor,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
