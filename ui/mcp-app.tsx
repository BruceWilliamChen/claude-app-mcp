import { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";

import { Header } from "./components/Header";
import { ParamPanel } from "./components/ParamPanel";
import { MobileParamSheet } from "./components/MobileParamSheet";
import { PlotArea } from "./components/PlotArea";
import { CodeDialog } from "./components/CoeffDisplay";
import { StatusBar } from "./components/StatusBar";
import { InlineView } from "./components/InlineView";
import { useFilterDesign } from "./hooks/useFilterDesign";
import { useMcpToolResult } from "./hooks/useMcpToolResult";
import { fetchDesign, fetchDesignFallback, fetchStatus } from "./hooks/useMockData";
import type { FilterResult, FilterConfig } from "./types";

// ── Shared FilterDesigner component ──

interface FilterDesignerProps {
  fd: ReturnType<typeof useFilterDesign>;
  connected: boolean;
  statusText: string;
  showCode: boolean;
  onRun: () => void;
  onShowCode: () => void;
  onCloseCode: () => void;
  onToggleView?: () => void;
}

function FilterDesigner({ fd, connected, statusText, showCode, onRun, onShowCode, onCloseCode, onToggleView }: FilterDesignerProps) {
  return (
    <div className="app-container">
      <Header
        isRunning={fd.isRunning}
        autorun={fd.autorun}
        hasMatlabCode={!!fd.result?.matlab_code}
        onRun={onRun}
        onAutorunChange={fd.setAutorun}
        onShowCode={onShowCode}
        onToggleView={onToggleView}
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

          {showCode && fd.result?.matlab_code && (
            <CodeDialog matlabCode={fd.result.matlab_code} onClose={onCloseCode} />
          )}
        </main>
      </div>

      <StatusBar
        connected={connected}
        statusText={statusText}
        elapsed={fd.result?.elapsed}
      />
      <div className="bottom-spacer" />

      {/* Mobile: bottom sheet for parameters (hidden on desktop via CSS) */}
      <MobileParamSheet
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
    </div>
  );
}

// ── Preview App (standalone in browser, talks to Flask on :3000) ──

function PreviewApp() {
  const fd = useFilterDesign();
  const [statusText, setStatusText] = useState("Checking connection...");
  const [connected, setConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showCode, setShowCode] = useState(false);

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

  useEffect(() => {
    if (fd.autorun && !fd.isRunning) runDesign();
  }, [fd.config, fd.autorun]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isFullscreen) {
    return (
      <InlineView
        onSelectFilter={(rt) => {
          fd.setResponseType(rt);
          setIsFullscreen(true);
        }}
      />
    );
  }

  return (
    <FilterDesigner
      fd={fd}
      connected={connected}
      statusText={statusText}
      showCode={showCode}
      onRun={runDesign}
      onShowCode={() => setShowCode(true)}
      onCloseCode={() => setShowCode(false)}
      onToggleView={() => setIsFullscreen(false)}
    />
  );
}

// ── Production App (inside MCP host) ──

function ProductionApp() {
  const fd = useFilterDesign();
  const mcp = useMcpToolResult();
  const [showCode, setShowCode] = useState(false);

  // Apply initial config from configure-filter tool
  useEffect(() => {
    if (mcp.initialConfig?.config) {
      const c = mcp.initialConfig.config;
      fd.setConfig((prev) => ({
        ...prev,
        filter_type: c.filter_type as any,
        response_type: c.response_type as any,
        order: c.order,
        cutoff_freq: c.cutoff_freq,
        cutoff_freq_high: c.cutoff_freq_high || undefined,
        sample_rate: c.sample_rate,
        passband_ripple: c.passband_ripple || undefined,
        stopband_atten: c.stopband_atten || undefined,
      }));
    }
  }, [mcp.initialConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  // When MCP returns a run result, update fd
  useEffect(() => {
    if (mcp.result) {
      fd.setResult(mcp.result);
      fd.setIsRunning(false);
    }
  }, [mcp.result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push config changes to model context
  useEffect(() => {
    if (mcp.app && mcp.isConnected) {
      mcp.app.updateModelContext({
        currentConfig: fd.config,
        lastResult: fd.result ? {
          matlab_code: fd.result.matlab_code,
          elapsed: fd.result.elapsed,
          coefficients: { b: fd.result.data.b, a: fd.result.data.a },
        } : null,
      });
    }
  }, [fd.config, fd.result, mcp.app, mcp.isConnected]);

  const runDesign = useCallback(async () => {
    if (fd.isRunning) return;
    fd.setIsRunning(true);
    fd.setError(null);

    // Try MCP callServerTool first, fall back to REST endpoint
    try {
      let result: FilterResult | null = null;

      // Skip MCP callServerTool — known to hang on web clients.
      // Go straight to REST fallback.

      // Attempt 2: REST fallback (direct HTTP to server)
      if (!result) {
        result = await fetchDesignFallback(fd.config);
      }

      if (result) {
        fd.setResult(result);
      }
    } catch (err: any) {
      fd.setError(err.message || "Design failed");
    } finally {
      fd.setIsRunning(false);
    }
  }, [fd, mcp.app]);

  if (mcp.error) {
    return <div style={{ padding: 20, color: "red" }}>Connection error: {mcp.error.message}</div>;
  }

  if (!mcp.isConnected) {
    return <div style={{ padding: 20, color: "#666" }}>Connecting to host...</div>;
  }

  const statusText = mcp.initialConfig?.matlab_status?.connected
    ? `Connected to MATLAB ${mcp.initialConfig.matlab_status.version || ""}`.trim()
    : "MATLAB status unknown";

  const connected = mcp.initialConfig?.matlab_status?.connected ?? false;

  // Inline vs fullscreen based on host display mode
  if (mcp.displayMode === "inline") {
    return (
      <InlineView
        onSelectFilter={(rt) => {
          fd.setResponseType(rt);
          mcp.app?.requestDisplayMode({ mode: "fullscreen" });
        }}
      />
    );
  }

  return (
    <FilterDesigner
      fd={fd}
      connected={connected}
      statusText={statusText}
      showCode={showCode}
      onRun={runDesign}
      onShowCode={() => setShowCode(true)}
      onCloseCode={() => setShowCode(false)}
    />
  );
}

// ── Root ──

function App() {
  const isPreview =
    import.meta.env.VITE_PREVIEW_MODE === "true" ||
    new URLSearchParams(window.location.search).get("preview") === "true";

  return isPreview ? <PreviewApp /> : <ProductionApp />;
}

createRoot(document.getElementById("root")!).render(<App />);
