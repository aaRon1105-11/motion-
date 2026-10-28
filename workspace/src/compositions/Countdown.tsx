import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';

export const countdownSchema = z.object({
  startNumber: z.number().min(3).max(10),
  backgroundColor: z.string(),
  numberColor: z.string(),
  pulseColor: z.string(),
});

export type CountdownProps = z.infer<typeof countdownSchema>;

export const defaultCountdownProps: CountdownProps = {
  startNumber: 5,
  backgroundColor: '#111827',
  numberColor: '#f9fafb',
  pulseColor: '#ef4444',
};

export const Countdown: React.FC<CountdownProps> = ({
  startNumber,
  backgroundColor,
  numberColor,
  pulseColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const framesPerDigit = fps; // 1 second per number
  const currentStep = Math.min(
    startNumber - 1,
    Math.floor(frame / framesPerDigit)
  );
  const currentNumber = startNumber - currentStep;
  const frameInStep = frame % framesPerDigit;

  const pulse = spring({
    frame: frameInStep,
    fps,
    config: { damping: 10, stiffness: 160 },
  });

  const scale = interpolate(pulse, [0, 1], [1.8, 1]);
  const opacity = interpolate(pulse, [0, 1], [0.2, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          border: `6px solid ${pulseColor}`,
          opacity: 0.3 * opacity,
          transform: `scale(${scale * 1.15})`,
        }}
      />
      <div
        style={{
          fontSize: '180px',
          fontWeight: 900,
          color: numberColor,
          transform: `scale(${scale})`,
          opacity,
          lineHeight: 1,
        }}
      >
        {currentNumber}
      </div>
    </AbsoluteFill>
  );
};
