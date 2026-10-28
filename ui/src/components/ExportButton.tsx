interface Props {
  compositions: string[];
  selectedComposition: string;
  onSelectComposition: (id: string) => void;
  onExport: (compositionId: string) => void;
  renderPct: number | null;
  lastExportPath: string | null;
  onOpenFolder: (path: string) => void;
  disabled: boolean;
}

export default function ExportButton({
  compositions,
  selectedComposition,
  onSelectComposition,
  onExport,
  renderPct,
  lastExportPath,
  onOpenFolder,
  disabled,
}: Props) {
  const isRendering = renderPct !== null;

  return (
    <section className="export-section">
      <div className="section-header">
        <label className="field-label">Active Composition</label>
      </div>

      <div className="comp-selector-row">
        <select
          className="comp-select"
          value={selectedComposition}
          onChange={(e) => onSelectComposition(e.target.value)}
          disabled={disabled || isRendering}
        >
          {compositions.map((comp) => (
            <option key={comp} value={comp}>
              {comp}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="btn-export"
        onClick={() => onExport(selectedComposition)}
        disabled={disabled || isRendering || !selectedComposition}
      >
        {isRendering ? `🎬 Exporting MP4… ${renderPct}%` : `⬇ Export ${selectedComposition} MP4`}
      </button>

      {isRendering && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${renderPct}%` }} />
        </div>
      )}

      {lastExportPath && !isRendering && (
        <div className="export-success-box">
          <span className="export-success-msg">Export complete!</span>
          <button
            type="button"
            className="btn-link"
            onClick={() => onOpenFolder(lastExportPath)}
          >
            Show in Explorer ↗
          </button>
        </div>
      )}
    </section>
  );
}
