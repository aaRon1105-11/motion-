import { useState, useRef } from 'react';

interface Props {
  onSubmit: (prompt: string) => void;
  isRunning: boolean;
  onSelectComposition?: (name: string) => void;
}

const TEMPLATES = [
  {
    name: '🏷️ Title Card',
    prompt: 'Create a title card that fades in smoothly with a bold title "Next Generation Motion" and a subtitle.',
    frameRange: '0-90',
  },
  {
    name: '📺 Lower Third',
    prompt: 'A broadcast lower third with name "Sarah Connor" and role "Chief Technology Officer" sliding in from the left.',
    frameRange: '0-120',
  },
  {
    name: '⚡ Kinetic Text',
    prompt: 'Kinetic typography composition where each word "Design In High Velocity" springs into place with staggered timing.',
    frameRange: '0-150',
  },
  {
    name: '✨ Logo Reveal',
    prompt: 'A futuristic cyber logo reveal with a glowing horizontal light wipe and scaling brand text.',
    frameRange: '0-120',
  },
  {
    name: '⏱️ Countdown',
    prompt: 'A dynamic 5-second countdown timer with a pulsating shockwave ring for each second.',
    frameRange: '0-150',
  },
  {
    name: '🪐 3D Torus (3JS)',
    prompt: 'A 3D metallic torus knot animation using Three.js WebGL rendering with glowing wireframe cage and futuristic typography.',
    frameRange: '0-150',
  },
  {
    name: '🧊 3D Cyber Cube (3JS)',
    prompt: 'A futuristic 3D cyber cube cluster with glowing core, orbiting gyroscope rings, and HUD readout coordinates.',
    frameRange: '0-150',
  },
];

export default function PromptPanel({ onSubmit, isRunning }: Props) {
  const [prompt, setPrompt] = useState('');
  const [frameRange, setFrameRange] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!prompt.trim() || isRunning) return;
    const fullPrompt = frameRange.trim()
      ? `${prompt.trim()}\n\n[Only affect frames ${frameRange.trim()}]`
      : prompt.trim();
    onSubmit(fullPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const applyTemplate = (t: (typeof TEMPLATES)[0]) => {
    setPrompt(t.prompt);
    setFrameRange(t.frameRange);
    textareaRef.current?.focus();
  };

  return (
    <section className="prompt-panel">
      <div className="section-header">
        <label className="field-label">Quick Templates</label>
      </div>
      <div className="template-pills">
        {TEMPLATES.map((t) => (
          <button
            key={t.name}
            type="button"
            className="pill-btn"
            disabled={isRunning}
            onClick={() => applyTemplate(t)}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="section-header" style={{ marginTop: 10 }}>
        <label className="field-label">Agent Prompt</label>
      </div>
      <textarea
        ref={textareaRef}
        className="prompt-textarea"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the animation you want to create or edit…"
        rows={4}
        disabled={isRunning}
      />

      <label className="field-label" style={{ marginTop: 8 }}>
        Frame Range <span className="hint">(e.g. 0-90, optional)</span>
      </label>
      <input
        type="text"
        className="frame-range-input"
        value={frameRange}
        onChange={(e) => setFrameRange(e.target.value)}
        placeholder="0-90"
        disabled={isRunning}
      />

      <button
        type="button"
        className="btn-primary generate-btn"
        onClick={handleSubmit}
        disabled={isRunning || !prompt.trim()}
      >
        {isRunning ? '⏳ Generating Composition…' : '✨ Generate with Agent  ⌘↵'}
      </button>
    </section>
  );
}
