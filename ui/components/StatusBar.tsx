interface StatusBarProps {
  connected: boolean;
  statusText: string;
  elapsed?: number;
}

export function StatusBar({ connected, statusText, elapsed }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span className={`status-dot ${connected ? "connected" : "disconnected"}`} />
      <span>{statusText}</span>
      {elapsed !== undefined && (
        <span className="timing-display">{elapsed}s</span>
      )}
    </footer>
  );
}
