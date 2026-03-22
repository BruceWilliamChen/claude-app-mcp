import { useEffect, useRef, useState } from "react";
import type { FilterResultData, DisplayOptions } from "../types";

declare const Plotly: any;

const baseLayout = {
  font: { family: "system-ui, sans-serif", size: 11 },
  margin: { l: 55, r: 20, t: 10, b: 40 },
  paper_bgcolor: "white",
  plot_bgcolor: "#fafafa",
  xaxis: { gridcolor: "#e0e0e0" },
  yaxis: { gridcolor: "#e0e0e0" },
};

const plotlyConfig = { responsive: true, displayModeBar: false };

type PlotType = "magnitude" | "phase" | "group_delay" | "pole_zero";

const PLOT_LABELS: Record<PlotType, string> = {
  magnitude: "Magnitude Response",
  phase: "Phase Response",
  group_delay: "Group Delay",
  pole_zero: "Pole-Zero Plot",
};

interface PlotAreaProps {
  data: FilterResultData | null;
  display: DisplayOptions;
  onDisplayChange: (partial: Partial<DisplayOptions>) => void;
}

function getActiveTabs(display: DisplayOptions): PlotType[] {
  const tabs: PlotType[] = [];
  if (display.magnitude) tabs.push("magnitude");
  if (display.phase) tabs.push("phase");
  if (display.group_delay) tabs.push("group_delay");
  if (display.pole_zero) tabs.push("pole_zero");
  return tabs;
}

function getAvailableTabs(display: DisplayOptions): PlotType[] {
  const all: PlotType[] = ["magnitude", "phase", "group_delay", "pole_zero"];
  return all.filter((t) => !display[t]);
}

function renderPlot(container: HTMLDivElement, type: PlotType, data: FilterResultData) {
  container.innerHTML = "";
  const div = document.createElement("div");
  div.style.width = "100%";
  div.style.height = "100%";
  container.appendChild(div);

  let traces: any[] = [];
  let layout: any = { ...baseLayout };

  switch (type) {
    case "magnitude":
      traces = [{ x: data.freq, y: data.magnitude, type: "scatter", mode: "lines", line: { width: 2, color: "#0072BD" } }];
      layout = { ...layout, xaxis: { ...baseLayout.xaxis, title: "Frequency (Hz)" }, yaxis: { ...baseLayout.yaxis, title: "Magnitude (dB)" } };
      break;
    case "phase":
      traces = [{ x: data.freq, y: data.phase, type: "scatter", mode: "lines", line: { width: 2, color: "#D95319" } }];
      layout = { ...layout, xaxis: { ...baseLayout.xaxis, title: "Frequency (Hz)" }, yaxis: { ...baseLayout.yaxis, title: "Phase (degrees)" } };
      break;
    case "group_delay":
      if (data.freq_gd && data.group_delay) {
        traces = [{ x: data.freq_gd, y: data.group_delay, type: "scatter", mode: "lines", line: { width: 2, color: "#77AC30" } }];
        layout = { ...layout, xaxis: { ...baseLayout.xaxis, title: "Frequency (Hz)" }, yaxis: { ...baseLayout.yaxis, title: "Samples" } };
      }
      break;
    case "pole_zero":
      if (data.zeros_real) {
        if (data.zeros_real.length > 0)
          traces.push({ x: data.zeros_real, y: data.zeros_imag, type: "scatter", mode: "markers", marker: { size: 10, symbol: "circle-open", color: "#0072BD", line: { width: 2 } }, name: "Zeros" });
        if (data.poles_real && data.poles_real.length > 0)
          traces.push({ x: data.poles_real, y: data.poles_imag, type: "scatter", mode: "markers", marker: { size: 10, symbol: "x", color: "#D95319", line: { width: 2 } }, name: "Poles" });
        const theta = Array.from({ length: 101 }, (_, i) => (i / 100) * 2 * Math.PI);
        traces.push({ x: theta.map(Math.cos), y: theta.map(Math.sin), type: "scatter", mode: "lines", line: { width: 1, color: "#ccc", dash: "dash" }, showlegend: false });
        layout = { ...layout, xaxis: { ...baseLayout.xaxis, title: "Real Part", scaleanchor: "y" }, yaxis: { ...baseLayout.yaxis, title: "Imaginary Part" }, showlegend: true, legend: { x: 0.01, y: 0.99 } };
      }
      break;
  }

  if (traces.length > 0) {
    Plotly.newPlot(div, traces, layout, plotlyConfig);
  }
}

export function PlotArea({ data, display, onDisplayChange }: PlotAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabs = getActiveTabs(display);
  const available = getAvailableTabs(display);
  const [activeTab, setActiveTab] = useState<PlotType>(tabs[0] || "magnitude");
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Keep activeTab valid
  useEffect(() => {
    if (tabs.length > 0 && !tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  // Render plot when data or active tab changes
  useEffect(() => {
    if (!containerRef.current || !data || !tabs.includes(activeTab)) return;
    renderPlot(containerRef.current, activeTab, data);
  }, [data, activeTab, tabs]);

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (containerRef.current && data && tabs.includes(activeTab)) {
        const plotDiv = containerRef.current.firstElementChild as HTMLElement;
        if (plotDiv) Plotly.Plots.resize(plotDiv);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [data, activeTab, tabs]);

  const closeTab = (type: PlotType) => {
    onDisplayChange({ [type]: false });
  };

  const addTab = (type: PlotType) => {
    onDisplayChange({ [type]: true });
    setActiveTab(type);
    setShowAddMenu(false);
  };

  if (tabs.length === 0 && !data) {
    return (
      <div className="plot-container">
        <div className="plot-tabs-bar">
          <button className="plot-tab-add" onClick={() => setShowAddMenu(!showAddMenu)} title="Add analysis">+</button>
          {showAddMenu && (
            <div className="add-menu">
              {(["magnitude", "phase", "group_delay", "pole_zero"] as PlotType[]).map((t) => (
                <div key={t} className="add-menu-item" onClick={() => addTab(t)}>{PLOT_LABELS[t]}</div>
              ))}
            </div>
          )}
        </div>
        <div className="plot-area empty">
          <div className="plot-placeholder">
            Click <strong>Run</strong> to design a filter and see the response plots.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="plot-container">
      <div className="plot-tabs-bar">
        {tabs.map((t) => (
          <div
            key={t}
            className={`plot-tab ${t === activeTab ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            <span className="plot-tab-label">{PLOT_LABELS[t]}</span>
            <span className="plot-tab-close" onClick={(e) => { e.stopPropagation(); closeTab(t); }}>&times;</span>
          </div>
        ))}
        <div className="plot-tab-add-wrap">
          <button className="plot-tab-add" onClick={() => setShowAddMenu(!showAddMenu)} title="Add analysis">+</button>
          {showAddMenu && available.length > 0 && (
            <div className="add-menu">
              {available.map((t) => (
                <div key={t} className="add-menu-item" onClick={() => addTab(t)}>{PLOT_LABELS[t]}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="plot-area" ref={containerRef}>
        {!data && (
          <div className="plot-placeholder">Click <strong>Run</strong> to see the plot.</div>
        )}
      </div>
    </div>
  );
}
