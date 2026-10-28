import { useEffect, useRef } from 'react';
import { AgentEvent } from '../types/api';

interface Props {
  logs: AgentEvent[];
  onClear: () => void;
}

export default function LogPanel({ logs, onClear }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <section className="log-panel">
      <div className="log-header">
        <label className="field-label">Agent Stream & Compiler</label>
        {logs.length > 0 && (
          <button type="button" className="clear-btn" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      <div className="log-scroll">
        {logs.length === 0 ? (
          <div className="log-empty">Ready. Prompts stream live logs and compiler checks here.</div>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className={`log-line log-${entry.type}`}>
              {entry.type === 'status' && <span className="log-prefix">› </span>}
              {entry.text}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
