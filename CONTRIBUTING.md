# Contributing to Motion Studio

Thank you for your interest in contributing to Motion Studio! We welcome community contributions to expand composition templates, refine autonomous agent contracts, and improve tooling.

---

## 1. Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+
- **Antigravity CLI (`agy`)**: [Install Google Antigravity CLI](https://antigravity.google) and authenticate via `agy login` or `motion login`.

### Clone & Install
```bash
git clone https://github.com/your-username/motion-studio.git
cd motion-studio
npm install
cd workspace && npm install && cd ..
```

### Running Locally
```bash
# Launch Electron desktop app in live hot-reload development mode
npm run dev

# Or test via the lightweight CLI wrapper directly in your terminal
npm run motion -- "Create a title card with glowing text"
```

---

## 2. Architecture Guidelines

Motion Studio follows a strict separation of concerns:
- `electron/`: Main process orchestrator, native process spawning, IPC handlers, git rollback manager.
- `ui/`: React + Vite frontend. **Zero Node.js access**; all OS operations travel strictly through `window.motionStudio` via Electron `contextBridge`.
- `workspace/`: Isolated Remotion workspace where the agent writes code. The workspace has its own internal git repository used as an undo/rollback buffer.

---

## 3. Remotion & 3D Composition Contracts

When contributing new compositions to `workspace/src/compositions/`:

1. **Zod Schema Contract:**
   Every composition MUST export:
   - A Zod schema: `export const mySchema = z.object({ ... });`
   - Inferred TypeScript type: `export type MyProps = z.infer<typeof mySchema>;`
   - Default props object: `export const defaultMyProps: MyProps = { ... };`
   - React component: `export const MyComp: React.FC<MyProps> = ({ ... }) => { ... };`

2. **Strict Determinism (Zero Flake):**
   Remotion renders frames in parallel headless browser tabs. The output at frame $N$ must be a pure mathematical function of `frame`.
   - ❌ **Forbidden:** `Math.random()`, `Date.now()`, `setTimeout()`, CSS transitions/keyframes, `THREE.Clock.getElapsedTime()`, `useFrame()`.
   - ✅ **Required:** `useCurrentFrame()`, `useVideoConfig()`, `interpolate()`, `spring()`, `ThreeCanvas`.

3. **No Hardcoded Values:**
   All colors, text, timings, font sizes, and layout accents must be exposed in `defaultProps` and validated through `schema`.

4. **Register in `Root.tsx`:**
   Add your `<Composition />` declaration inside `workspace/src/Root.tsx`.

---

## 4. Quality Checks

Before opening a pull request, verify that all static analysis and compilation tests pass:

```bash
# Typecheck desktop app and UI
npm run typecheck

# Typecheck workspace compositions
cd workspace && npm run typecheck && cd ..

# Verify headless MP4 rendering
npm run motion -- render TitleCard
```

---

## 5. Pull Request Process

1. Fork the repository and create your feature branch: `git checkout -b feature/amazing-feature`.
2. Commit your changes with clear, descriptive commit messages: `git commit -m "feat(3d): add procedural particle tunnel"`.
3. Push to your branch: `git push origin feature/amazing-feature`.
4. Open a Pull Request on GitHub describing your changes and testing results.
