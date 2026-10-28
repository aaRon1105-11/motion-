import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { z } from 'zod';

export const threeDTorusSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  primaryColor: z.string(),
  wireframeColor: z.string(),
  backgroundColor: z.string(),
  wireframe: z.boolean(),
  roughness: z.number().min(0).max(1),
  metalness: z.number().min(0).max(1),
  speedMultiplier: z.number().min(0.1).max(5),
});

export type ThreeDTorusProps = z.infer<typeof threeDTorusSchema>;

export const defaultThreeDTorusProps: ThreeDTorusProps = {
  title: '3D KINETIC MESH',
  subtitle: 'Deterministic Three.js GPU Motion Graphics',
  primaryColor: '#00f2fe',
  wireframeColor: '#4facfe',
  backgroundColor: '#070a13',
  wireframe: false,
  roughness: 0.15,
  metalness: 0.85,
  speedMultiplier: 1.0,
};

interface TorusMeshProps {
  frame: number;
  fps: number;
  durationInFrames: number;
  primaryColor: string;
  wireframeColor: string;
  wireframe: boolean;
  roughness: number;
  metalness: number;
  speedMultiplier: number;
}

const TorusMesh: React.FC<TorusMeshProps> = ({
  frame,
  fps,
  durationInFrames,
  primaryColor,
  wireframeColor,
  wireframe,
  roughness,
  metalness,
  speedMultiplier,
}) => {
  // Deterministic entrance animation using spring physics
  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 80,
      mass: 0.8,
    },
  });

  // Deterministic rotations derived purely from current frame index
  const rotX = (frame * 0.02 * speedMultiplier) % (Math.PI * 2);
  const rotY = (frame * 0.03 * speedMultiplier) % (Math.PI * 2);
  const rotZ = (frame * 0.01 * speedMultiplier) % (Math.PI * 2);

  // Subtle breathing scale pulse
  const pulse = Math.sin((frame / fps) * 2 * Math.PI * 0.5) * 0.05 + 1;
  const currentScale = entrance * 1.35 * pulse;

  return (
    <group rotation={[rotX, rotY, rotZ]} scale={[currentScale, currentScale, currentScale]}>
      {/* Primary 3D Torus Knot */}
      <mesh>
        <torusKnotGeometry args={[1.1, 0.32, 128, 32]} />
        <meshStandardMaterial
          color={primaryColor}
          roughness={roughness}
          metalness={metalness}
          wireframe={wireframe}
        />
      </mesh>

      {/* Outer subtle glowing wireframe cage */}
      <mesh scale={[1.12, 1.12, 1.12]}>
        <torusKnotGeometry args={[1.1, 0.32, 64, 16]} />
        <meshBasicMaterial
          color={wireframeColor}
          wireframe={true}
          transparent={true}
          opacity={0.35}
        />
      </mesh>
    </group>
  );
};

export const ThreeDTorus: React.FC<ThreeDTorusProps> = ({
  title,
  subtitle,
  primaryColor,
  wireframeColor,
  backgroundColor,
  wireframe,
  roughness,
  metalness,
  speedMultiplier,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Overlay text entrance
  const textSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const textOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cameraFov = 45;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* 3D WebGL Canvas Layer */}
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 5], fov: cameraFov }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={2.0} color={primaryColor} />
        <pointLight position={[-10, -10, -5]} intensity={1.5} color={wireframeColor} />
        <directionalLight position={[0, 5, 5]} intensity={0.8} />

        <TorusMesh
          frame={frame}
          fps={fps}
          durationInFrames={durationInFrames}
          primaryColor={primaryColor}
          wireframeColor={wireframeColor}
          wireframe={wireframe}
          roughness={roughness}
          metalness={metalness}
          speedMultiplier={speedMultiplier}
        />
      </ThreeCanvas>

      {/* Elegant 2D HUD / Typography Overlay */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px 100px',
          pointerEvents: 'none',
        }}
      >
        {/* Top Header Badge */}
        <div
          style={{
            opacity: textOpacity,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: primaryColor,
              boxShadow: `0 0 16px ${primaryColor}`,
            }}
          />
          <span
            style={{
              color: '#8b9bb4',
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Three.js + Remotion Pipeline
          </span>
        </div>

        {/* Bottom Title & Subtitle */}
        <div
          style={{
            transform: `translateY(${(1 - textSpring) * 30}px)`,
            opacity: textSpring,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 68,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 24px rgba(0,0,0,0.6)',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: '12px 0 0 0',
              fontSize: 24,
              color: primaryColor,
              fontWeight: 500,
              letterSpacing: '0.04em',
            }}
          >
            {subtitle}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
