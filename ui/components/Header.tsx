interface HeaderProps {
  isRunning: boolean;
  autorun: boolean;
  onRun: () => void;
  onAutorunChange: (checked: boolean) => void;
  onToggleView?: () => void;
}

export function Header({ isRunning, autorun, onRun, onAutorunChange, onToggleView }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1>Filter Design</h1>
        <span className="header-subtitle">
          [b, a] = Design a digital filter using specified method and parameters
        </span>
      </div>
      <div className="header-right">
        <label className="autorun-toggle">
          <input
            type="checkbox"
            checked={autorun}
            onChange={(e) => onAutorunChange(e.target.checked)}
          />
          Autorun
        </label>
        <button
          className={`run-btn ${isRunning ? "running" : ""}`}
          disabled={isRunning}
          onClick={onRun}
        >
          <span className="run-icon">{isRunning ? "\u25F4" : "\u25B6"}</span> Run
        </button>
        {onToggleView && (
          <button className="view-toggle-btn" title="Toggle inline/fullscreen" onClick={onToggleView}>
            &#x26F6;
          </button>
        )}
      </div>
    </header>
  );
}
