import { useEffect, useRef } from "react";
import type { FilterResultData, DisplayOptions } from "../types";

// Plotly is loaded globally via CDN in mcp-app.html
declare const Plotly: any;

const baseLayout = {
  font: { family: "system-ui, sans-serif", size: 11 },
  margin: { l: 55, r: 20, t: 30, b: 40 },
  paper_bgcolor: "white",
  plot_bgcolor: "#fafafa",
  xaxis: { gridcolor: "#e0e0e0" },
  yaxis: { gridcolor: "#e0e0e0" },
};

const plotlyConfig = { responsive: true, displayModeBar: false };

interface PlotAreaProps {
  data: FilterResultData | null;
  display: DisplayOptions;
}

export function PlotArea({ data, display }: PlotAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const plots: { traces: any[]; layout: any }[] = [];

    if (display.magnitude && data.freq && data.magnitude) {
      plots.push({
        traces: [{ x: data.freq, y: data.magnitude, type: "scatter", mode: "lines", line: { width: 2, color: "#0076c6" } }],
        layout: { ...baseLayout, title: { text: "Magnitude Response", font: { size: 13 } }, xaxis: { ...baseLayout.xaxis, title: "Frequency (Hz)" }, yaxis: { ...baseLayout.yaxis, title: "Magnitude (dB)" } },
      });
    }

    if (display.phase && data.freq && data.phase) {
      plots.push({
        traces: [{ x: data.freq, y: data.phase, type: "scatter", mode: "lines", line: { width: 2, color: "#d94a1e" } }],
        layout: { ...baseLayout, title: { text: "Phase Response", font: { size: 13 } }, xaxis: { ...baseLayout.xaxis, title: "Frequency (Hz)" }, yaxis: { ...baseLayout.yaxis, title: "Phase (degrees)" } },
      });
    }

    if (display.group_delay && data.freq_gd && data.group_delay) {
      plots.push({
        traces: [{ x: data.freq_gd, y: data.group_delay, type: "scatter", mode: "lines", line: { width: 2, color: "#78ab30" } }],
        layout: { ...baseLayout, title: { text: "Group Delay", font: { size: 13 } }, xaxis: { ...baseLayout.xaxis, title: "Frequency (Hz)" }, yaxis: { ...baseLayout.yaxis, title: "Samples" } },
      });
    }

    if (display.pole_zero && data.zeros_real) {
      const traces: any[] = [];
      if (data.zeros_real.length > 0) {
        traces.push({ x: data.zeros_real, y: data.zeros_imag, type: "scatter", mode: "markers", marker: { size: 10, symbol: "circle-open", color: "#0076c6", line: { width: 2 } }, name: "Zeros" });
      }
      if (data.poles_real && data.poles_real.length > 0) {
        traces.push({ x: data.poles_real, y: data.poles_imag, type: "scatter", mode: "markers", marker: { size: 10, symbol: "x", color: "#d94a1e", line: { width: 2 } }, name: "Poles" });
      }
      const theta = Array.from({ length: 101 }, (_, i) => (i / 100) * 2 * Math.PI);
      traces.push({ x: theta.map(Math.cos), y: theta.map(Math.sin), type: "scatter", mode: "lines", line: { width: 1, color: "#ccc", dash: "dash" }, name: "Unit Circle", showlegend: false });

      plots.push({
        traces,
        layout: { ...baseLayout, title: { text: "Pole-Zero Plot", font: { size: 13 } }, xaxis: { ...baseLayout.xaxis, title: "Real", scaleanchor: "y" }, yaxis: { ...baseLayout.yaxis, title: "Imaginary" }, showlegend: true, legend: { x: 0.01, y: 0.99 } },
      });
    }

    if (plots.length === 0) {
      container.innerHTML = '<div class="plot-placeholder">No display options selected.</div>';
      return;
    }

    const height = Math.max(280, Math.floor(600 / plots.length));

    plots.forEach((p, i) => {
      const div = document.createElement("div");
      div.style.width = "100%";
      div.style.height = height + "px";
      div.style.marginBottom = "8px";
      container.appendChild(div);
      Plotly.newPlot(div, p.traces, { ...p.layout, height }, plotlyConfig);
    });
  }, [data, display]);

  if (!data) {
    return (
      <div className="plot-area empty">
        <div className="plot-placeholder">
          Click <strong>Run</strong> to design a filter and see the response plots.
        </div>
      </div>
    );
  }

  return <div className="plot-area" ref={containerRef} />;
}
