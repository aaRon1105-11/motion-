import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { z } from 'zod';

export const threeDCubeGridSchema = z.object({
  title: z.string(),
  tagline: z.string(),
  coreColor: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  cubeCount: z.number().min(1).max(27),
  wireframe: z.boolean(),
  rotationSpeed: z.number().min(0.2).max(4),
});

export type ThreeDCubeGridProps = z.infer<typeof threeDCubeGridSchema>;

export const defaultThreeDCubeGridProps: ThreeDCubeGridProps = {
  title: 'SPATIAL COMPUTE',
  tagline: 'Procedural 3D Geometry Cluster',
  coreColor: '#ff2d55',
  accentColor: '#5856d6',
  backgroundColor: '#050508',
  cubeCount: 9,
  wireframe: true,
  rotationSpeed: 1.2,
};

interface ClusterProps {
  frame: number;
  fps: number;
  coreColor: string;
  accentColor: string;
  wireframe: boolean;
  rotationSpeed: number;
}

const CyberCluster: React.FC<ClusterProps> = ({
  frame,
  fps,
  coreColor,
  accentColor,
  wireframe,
  rotationSpeed,
}) => {
  const enter = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 90 },
  });

  const rotY = (frame * 0.025 * rotationSpeed) % (Math.PI * 2);
  const rotX = (frame * 0.015 * rotationSpeed) % (Math.PI * 2);
  const rotZ = (frame * 0.008 * rotationSpeed) % (Math.PI * 2);

  // Orbiting rings rotation
  const ringRot = (frame * 0.04 * rotationSpeed) % (Math.PI * 2);

  return (
    <group rotation={[rotX, rotY, rotZ]} scale={[enter, enter, enter]}>
      {/* Central Solid Glowing Box */}
      <mesh>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Outer Wireframe Cage */}
      <mesh scale={[1.4, 1.4, 1.4]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshBasicMaterial
          color={accentColor}
          wireframe={true}
          transparent={true}
          opacity={wireframe ? 0.8 : 0.2}
        />
      </mesh>

      {/* Orbiting Thin Gyroscope Rings */}
      <mesh rotation={[ringRot, 0, ringRot]}>
        <torusGeometry args={[2.0, 0.02, 16, 64]} />
        <meshBasicMaterial color={coreColor} transparent={true} opacity={0.6} />
      </mesh>
      <mesh rotation={[-ringRot, ringRot, 0]}>
        <torusGeometry args={[2.3, 0.02, 16, 64]} />
        <meshBasicMaterial color={accentColor} transparent={true} opacity={0.5} />
      </mesh>
    </group>
  );
};

export const ThreeDCubeGrid: React.FC<ThreeDCubeGridProps> = ({
  title,
  tagline,
  coreColor,
  accentColor,
  backgroundColor,
  wireframe,
  rotationSpeed,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const titleSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: "'Space Grotesk', -apple-system, sans-serif",
        overflow: 'hidden',
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 6], fov: 45 }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[8, 8, 8]} intensity={2.5} color={coreColor} />
        <pointLight position={[-8, -8, -6]} intensity={2.0} color={accentColor} />
        <directionalLight position={[0, 4, 4]} intensity={0.6} />

        <CyberCluster
          frame={frame}
          fps={fps}
          coreColor={coreColor}
          accentColor={accentColor}
          wireframe={wireframe}
          rotationSpeed={rotationSpeed}
        />
      </ThreeCanvas>

      {/* Center Top Minimal Branding */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '70px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            transform: `translateY(${(1 - titleSpring) * -20}px)`,
            opacity: titleSpring,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: `1px solid rgba(255, 255, 255, 0.12)`,
              color: accentColor,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.15em',
              marginBottom: 16,
            }}
          >
            3D WEBGL ENGINE
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 64,
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: '8px 0 0 0',
              fontSize: 20,
              color: '#94a3b8',
              letterSpacing: '0.05em',
            }}
          >
            {tagline}
          </p>
        </div>

        {/* Minimal Bottom Coordinate Readout */}
        <div
          style={{
            color: '#64748b',
            fontSize: 14,
            fontFamily: 'monospace',
            letterSpacing: '0.1em',
          }}
        >
          FRAME [{String(frame).padStart(4, '0')}] // ROT [{(frame * 0.02 * rotationSpeed).toFixed(2)}]
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
