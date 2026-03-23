import { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";

import { Header } from "./components/Header";
import { ParamPanel } from "./components/ParamPanel";
import { PlotArea } from "./components/PlotArea";
import { ShowCodeButton } from "./components/CoeffDisplay";
import { StatusBar } from "./components/StatusBar";
import { InlineView } from "./components/InlineView";
import { useFilterDesign } from "./hooks/useFilterDesign";
import { fetchDesign, fetchStatus } from "./hooks/useMockData";
import type { FilterResult } from "./types";

// ── Preview App (standalone in browser) ──

function PreviewApp() {
  const fd = useFilterDesign();
  const [statusText, setStatusText] = useState("Checking connection...");
  const [connected, setConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);

  // Poll status
  useEffect(() => {
    const check = async () => {
      const s = await fetchStatus();
      setConnected(s.connected);
      setStatusText(
        s.connected
          ? `Connected to MATLAB ${s.version || ""} ${s.pid ? `(PID: ${s.pid})` : ""}`.trim()
          : "Disconnected — start Flask server on :3000"
      );
    };
    check();
    const timer = setInterval(check, 10000);
    return () => clearInterval(timer);
  }, []);

  const runDesign = useCallback(async () => {
    if (fd.isRunning) return;
    fd.setIsRunning(true);
    fd.setError(null);

    try {
      const result: FilterResult = await fetchDesign(fd.config);
      fd.setResult(result);
    } catch (err: any) {
      fd.setError(err.message || "Design failed");
    } finally {
      fd.setIsRunning(false);
    }
  }, [fd]);

  // Autorun on config change
  useEffect(() => {
    if (fd.autorun && !fd.isRunning) {
      runDesign();
    }
  }, [fd.config, fd.autorun]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isFullscreen) {
    return (
      <InlineView
        config={fd.config}
        data={fd.result?.data || null}
        onExpand={() => setIsFullscreen(true)}
      />
    );
  }

  return (
    <div className="app-container">
      <Header
        isRunning={fd.isRunning}
        autorun={fd.autorun}
        onRun={runDesign}
        onAutorunChange={fd.setAutorun}
        onToggleView={() => setIsFullscreen(false)}
      />

      <div className="main-content">
        <ParamPanel
          config={fd.config}
          result={fd.result?.data || null}
          showCutoffHigh={fd.showCutoffHigh}
          showRipple={fd.showRipple}
          showAtten={fd.showAtten}
          showRippleSection={fd.showRippleSection}
          onFilterTypeChange={fd.setFilterType}
          onResponseTypeChange={fd.setResponseType}
          onConfigChange={fd.updateConfig}
          onDisplayChange={fd.updateDisplay}
        />

        <main className="results-panel">
          {fd.error ? (
            <div className="plot-area empty">
              <div className="plot-placeholder">
                <span className="error-text">{fd.error}</span>
              </div>
            </div>
          ) : (
            <PlotArea data={fd.result?.data || null} display={fd.config.display} onDisplayChange={fd.updateDisplay} />
          )}

          <ShowCodeButton matlabCode={fd.result?.matlab_code || null} />
        </main>
      </div>

      <StatusBar
        connected={connected}
        statusText={statusText}
        elapsed={fd.result?.elapsed}
      />
    </div>
  );
}

// ── Production App (inside MCP host) ──
// TODO: Wire up useMcpToolResult hook (TICKET-003)

function ProductionApp() {
  // For now, fall back to preview app behavior
  return <PreviewApp />;
}

// ── Root ──

function App() {
  const isPreview =
    import.meta.env.VITE_PREVIEW_MODE === "true" ||
    new URLSearchParams(window.location.search).get("preview") === "true";

  // Default to preview mode for now since production MCP wiring is TICKET-003
  return isPreview || true ? <PreviewApp /> : <ProductionApp />;
}

createRoot(document.getElementById("root")!).render(<App />);
