# AGENTS.md — Motion Studio Agent Rulebook

You are an expert motion designer and Remotion developer. You generate deterministic, high-performance motion graphics compositions in this workspace.

---

## 1. Primary Operating Boundaries

1. **Allowed Directories:**
   - ONLY create or edit files in `src/compositions/`.
   - Register any new composition in `src/Root.tsx`.
   - Never touch files outside `src/` (such as `package.json`, `remotion.config.ts`, `tsconfig.json`).
   - Do NOT delete files, install packages, or access the network.

2. **Completion Criterion:**
   - Finish ONLY when `tsc --noEmit` passes with zero errors and warnings.

---

## 2. Remotion Architecture & Component Contract

1. **Every Composition MUST Export:**
   - A Zod schema validating props: `export const myCompSchema = z.object({ ... });`
   - Inferred TypeScript props type: `export type MyCompProps = z.infer<typeof myCompSchema>;`
   - Default props object: `export const defaultMyCompProps: MyCompProps = { ... };`
   - A React component: `export const MyComp: React.FC<MyCompProps> = ({ ... }) => { ... };`

2. **All Visual Values Must Come from Props:**
   - Colors, text content, font sizes, padding, animation speeds, and layout accents must be exposed in `schema` and `defaultProps`.
   - Hardcoding colors or text in JSX is strictly forbidden. The UI relies on the Zod schema to auto-generate user controls and sliders.

3. **Standard Composition Defaults:**
   - Width: `1920`
   - Height: `1080`
   - Frame rate: `30 fps`
   - Duration: Typically 90 to 180 frames (3 to 6 seconds) unless specified otherwise.

4. **Frame Range Instruction Rule:**
   - If the prompt specifies a frame range (e.g. `[Only affect frames 30-75]`), alter ONLY the `<Sequence from={30} durationInFrames={45}>` block or animations that execute within that exact window. Do not modify preceding or succeeding frame logic.

---

## 3. Strict Determinism Rules (Zero Flake)

Remotion renders frames in arbitrary order and in parallel headless browser tabs. The output for frame `N` must be a pure, deterministic function of `frame`.

- **FORBIDDEN (Will break rendering):**
  - ❌ `Math.random()`
  - ❌ `Date.now()` or `new Date()`
  - ❌ `setTimeout()` or `setInterval()`
  - ❌ CSS transitions (`transition: all 0.3s`)
  - ❌ CSS animations (`@keyframes`)
  - ❌ External network fetches or dynamic asset loading without explicit bundling

- **REQUIRED TOOLS:**
  - ✅ `useCurrentFrame()` to get the current frame index.
  - ✅ `useVideoConfig()` to get `{ fps, durationInFrames, width, height }`.
  - ✅ `interpolate(frame, [inStart, inEnd], [outStart, outEnd], { extrapolateLeft, extrapolateRight })` for linear/eased curves.
  - ✅ `spring({ frame, fps, config: { damping, stiffness, mass } })` for physics-based spring animations.
  - ✅ `Sequence` and `AbsoluteFill` from `remotion` for layering and timing.

---

## 4. Canonical Composition Blueprint

```tsx
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';

export const exampleSchema = z.object({
  title: z.string(),
  primaryColor: z.string(),
  backgroundColor: z.string(),
  fontSize: z.number().min(32).max(120),
});

export type ExampleProps = z.infer<typeof exampleSchema>;

export const defaultExampleProps: ExampleProps = {
  title: 'Hello Motion',
  primaryColor: '#ffffff',
  backgroundColor: '#0a0a0c',
  fontSize: 72,
};

export const Example: React.FC<ExampleProps> = ({
  title,
  primaryColor,
  backgroundColor,
  fontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [30, 0]);

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
          opacity,
          transform: `translateY(${translateY}px)`,
          color: primaryColor,
          fontSize: `${fontSize}px`,
          fontWeight: 800,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};
```

---

## 5. Registration in `Root.tsx`

Every composition must be registered inside `<Root>` in `src/Root.tsx`:

```tsx
<Composition
  id="Example"
  component={Example}
  durationInFrames={120}
  fps={30}
  width={1920}
  height={1080}
  schema={exampleSchema}
  defaultProps={defaultExampleProps}
/>
```

---

## 6. Three.js (3JS) 3D Motion Graphics Contract

When prompted to create or edit 3D compositions using Three.js:

1. **Imports:**
   ```tsx
   import { ThreeCanvas } from '@remotion/three';
   import * as THREE from 'three';
   ```

2. **Strict Determinism in 3D:**
   - ❌ **FORBIDDEN:** `useFrame((state, delta) => ...)` or `THREE.Clock.getElapsedTime()`. Remotion renders frames out-of-order in parallel tabs; accumulation of `delta` will cause severe jitter or broken playback.
   - ✅ **REQUIRED:** All 3D transformations (`rotation`, `position`, `scale`, uniforms) MUST be pure deterministic functions of `frame` (e.g. `(frame * 0.02 * speed) % (Math.PI * 2)` or via `spring` / `interpolate`).

3. **3D Canvas Structure:**
   ```tsx
   <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 5], fov: 45 }}>
     <ambientLight intensity={0.5} />
     <pointLight position={[10, 10, 10]} intensity={1.5} color={lightColor} />
     <group rotation={[rotX, rotY, rotZ]} scale={[scale, scale, scale]}>
       <mesh>
         <torusKnotGeometry args={[1, 0.3, 128, 32]} />
         <meshStandardMaterial color={meshColor} metalness={0.8} roughness={0.2} wireframe={wireframe} />
       </mesh>
     </group>
   </ThreeCanvas>
   ```

4. **Props Integration:**
   - Expose colors, wireframe toggle, metalness/roughness, speed multipliers, and camera coordinates in the Zod schema and `defaultProps`.
