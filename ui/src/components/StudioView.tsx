import { useEffect, useState, useRef } from 'react';

interface Props {
  selectedComposition: string;
}

export default function StudioView({ selectedComposition }: Props) {
  const [studioUrl, setStudioUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const webviewRef = useRef<any>(null);

  useEffect(() => {
    window.motionStudio.getStudioUrl().then((url) => {
      setStudioUrl(url);
    });

    const interval = setInterval(async () => {
      try {
        const res = await window.motionStudio.checkStudioStatus();
        setIsOnline(res.online);
      } catch {
        setIsOnline(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    if (webviewRef.current) {
      try {
        webviewRef.current.reload();
      } catch {
        // webview reload fallback
      }
    }
  };

  const handleOpenBrowser = () => {
    if (studioUrl) {
      const targetUrl = selectedComposition
        ? `${studioUrl}/${selectedComposition}`
        : studioUrl;
      window.motionStudio.openExternal(targetUrl);
    }
  };

  const currentCompositionUrl = studioUrl
    ? selectedComposition
      ? `${studioUrl}/${selectedComposition}`
      : studioUrl
    : '';

  return (
    <div className="studio-container">
      <div className="studio-topbar">
        <div className="studio-info">
          <span className={`status-dot ${isOnline ? 'online' : 'booting'}`} />
          <span className="studio-title">
            Remotion Studio Preview {isOnline ? '• Live Hot-Reload' : '• Starting server…'}
          </span>
          <span className="current-comp-badge">{selectedComposition}</span>
        </div>

        <div className="studio-actions">
          <button
            type="button"
            className="topbar-btn"
            title="Reload Studio View"
            onClick={handleRefresh}
          >
            ↻ Reload
          </button>
          <button
            type="button"
            className="topbar-btn"
            title="Open Studio in System Browser"
            onClick={handleOpenBrowser}
          >
            ↗ External Browser
          </button>
        </div>
      </div>

      <div className="studio-frame-wrapper">
        {currentCompositionUrl ? (
          <webview
            ref={webviewRef}
            src={currentCompositionUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            /* @ts-ignore — webview is an Electron element */
            allowpopups="true"
            webpreferences="contextIsolation=yes"
          />
        ) : (
          <div className="studio-loading">
            <div className="spinner" />
            <p>Initializing Remotion Studio…</p>
          </div>
        )}
      </div>
    </div>
  );
}
