import { useState, useCallback, useEffect } from 'react';
import PromptPanel from './components/PromptPanel';
import LogPanel from './components/LogPanel';
import StudioView from './components/StudioView';
import ExportButton from './components/ExportButton';
import StatusBar from './components/StatusBar';
import { AgentEvent } from './types/api';
import './styles/app.css';

export default function App() {
  const [logs, setLogs] = useState<AgentEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [renderPct, setRenderPct] = useState<number | null>(null);
  const [lastStatus, setLastStatus] = useState('Ready for prompt');
  const [compositions, setCompositions] = useState<string[]>([
    'TitleCard',
    'LowerThird',
    'KineticText',
    'LogoReveal',
    'Countdown',
  ]);
  const [selectedComp, setSelectedComp] = useState<string>('TitleCard');
  const [lastExportPath, setLastExportPath] = useState<string | null>(null);
  const [recentCommit, setRecentCommit] = useState<string>('');

  const refreshWorkspace = useCallback(async () => {
    try {
      const comps = await window.motionStudio.listCompositions();
      if (comps && comps.length > 0) {
        setCompositions(comps);
        if (!comps.includes(selectedComp)) {
          setSelectedComp(comps[0]);
        }
      }
      const history = await window.motionStudio.getHistory();
      if (history && history.length > 0) {
        setRecentCommit(history[0]);
      }
    } catch (e) {
      console.error('Failed to refresh workspace:', e);
    }
  }, [selectedComp]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  const appendLog = useCallback((event: AgentEvent) => {
    setLogs((prev) => [...prev.slice(-499), event]);
    if (event.type === 'status') {
      setLastStatus(event.text);
    }
  }, []);

  const handlePromptSubmit = useCallback(
    async (prompt: string) => {
      setIsRunning(true);
      setLogs([]);
      setLastStatus('⚡ Invoking agent…');

      const api = window.motionStudio;

      const unsubEvent = api.onAgentEvent(appendLog);
      const unsubDone = api.onAgentDone(async (result) => {
        setIsRunning(false);
        if (result.success) {
          setLastStatus('✅ Animation generated and committed!');
          await refreshWorkspace();
        } else {
          setLastStatus('❌ ' + (result.error ?? 'Generation failed'));
        }
      });

      try {
        await api.runAgent(prompt, selectedComposition);
      } catch (err) {
        setIsRunning(false);
        const msg = err instanceof Error ? err.message : String(err);
        setLastStatus(`❌ Execution error: ${msg}`);
      } finally {
        unsubEvent();
        unsubDone();
      }
    },
    [appendLog, refreshWorkspace]
  );

  const handleUndo = useCallback(async () => {
    setIsRunning(true);
    setLastStatus('↩️ Rolling back workspace…');
    const result = await window.motionStudio.undo();
    setIsRunning(false);
    if (result.success) {
      setLastStatus('↩️ Successfully rolled back to previous commit');
      await refreshWorkspace();
    } else {
      setLastStatus('❌ Undo failed: ' + result.error);
    }
  }, [refreshWorkspace]);

  const handleExportStart = useCallback(
    async (compositionId: string) => {
      setRenderPct(0);
      setLastExportPath(null);
      setLastStatus(`🎬 Rendering "${compositionId}"…`);

      const unsubProgress = window.motionStudio.onRenderProgress((p) => {
        setRenderPct(p.percent);
      });

      try {
        const result = await window.motionStudio.startRender(compositionId, {});
        if (result.success && result.outputPath) {
          setLastExportPath(result.outputPath);
          setLastStatus(`🎬 Exported successfully: ${result.outputPath}`);
        } else {
          setLastStatus('❌ Export failed: ' + (result.error ?? 'Unknown error'));
        }
      } catch (e: any) {
        setLastStatus('❌ Export error: ' + e.message);
      } finally {
        unsubProgress();
        setRenderPct(null);
      }
    },
    []
  );

  const handleOpenFolder = useCallback((filePath: string) => {
    window.motionStudio.showItemInFolder(filePath);
  }, []);

  return (
    <div className="app-layout">
      {/* Left sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-group">
            <span className="logo-icon">⚡</span>
            <span className="logo">Motion Studio</span>
          </div>
          <span className="version-tag">v1.0</span>
        </div>

        <PromptPanel
          onSubmit={handlePromptSubmit}
          isRunning={isRunning}
          onSelectComposition={setSelectedComp}
        />

        <ExportButton
          compositions={compositions}
          selectedComposition={selectedComp}
          onSelectComposition={setSelectedComp}
          onExport={handleExportStart}
          renderPct={renderPct}
          lastExportPath={lastExportPath}
          onOpenFolder={handleOpenFolder}
          disabled={isRunning}
        />

        <div className="workspace-actions">
          <button
            type="button"
            className="btn-secondary undo-btn"
            onClick={handleUndo}
            disabled={isRunning}
          >
            ↩ Undo Last Edit (Git Rollback)
          </button>
        </div>

        <LogPanel logs={logs} onClear={() => setLogs([])} />
      </aside>

      {/* Main preview area */}
      <main className="preview-area">
        <StudioView selectedComposition={selectedComp} />
      </main>

      <StatusBar
        text={lastStatus}
        recentCommit={recentCommit}
        isBusy={isRunning || renderPct !== null}
      />
    </div>
  );
}
