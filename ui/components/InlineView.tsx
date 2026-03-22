import { useEffect, useRef } from "react";
import type { FilterConfig, FilterResultData } from "../types";

declare const Plotly: any;

const FILTER_NAMES: Record<string, string> = {
  butterworth: "Butterworth",
  chebyshev1: "Chebyshev I",
  chebyshev2: "Chebyshev II",
  elliptic: "Elliptic",
  fir: "FIR",
};

function buildSummary(config: FilterConfig): string {
  const ft = FILTER_NAMES[config.filter_type] || config.filter_type;
  const rt = config.response_type.charAt(0).toUpperCase() + config.response_type.slice(1);
  let s = `${ft} ${rt}, Order ${config.order}, Fc=${config.cutoff_freq}Hz`;
  if ((config.response_type === "bandpass" || config.response_type === "bandstop") && config.cutoff_freq_high) {
    s += `-${config.cutoff_freq_high}Hz`;
  }
  s += `, Fs=${config.sample_rate}Hz`;
  return s;
}

function formatCoeffs(b: number[], a: number[]): string {
  const fmt = (arr: number[]) => "[" + arr.map((v) => v.toFixed(6)).join(", ") + "]";
  return `b = ${fmt(b)}\na = ${fmt(a)}`;
}

interface InlineViewProps {
  config: FilterConfig;
  data: FilterResultData | null;
  onExpand: () => void;
}

export function InlineView({ config, data, onExpand }: InlineViewProps) {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plotRef.current || !data?.freq || !data?.magnitude) return;
    const div = plotRef.current;
    div.innerHTML = "";

    const plotDiv = document.createElement("div");
    plotDiv.style.width = "100%";
    plotDiv.style.height = "250px";
    div.appendChild(plotDiv);

    Plotly.newPlot(
      plotDiv,
      [{ x: data.freq, y: data.magnitude, type: "scatter", mode: "lines", line: { width: 2, color: "#0076c6" } }],
      {
        font: { family: "system-ui, sans-serif", size: 11 },
        margin: { l: 55, r: 20, t: 30, b: 40 },
        paper_bgcolor: "white",
        plot_bgcolor: "#fafafa",
        height: 250,
        title: { text: "Magnitude Response", font: { size: 12 } },
        xaxis: { title: "Frequency (Hz)", gridcolor: "#e0e0e0" },
        yaxis: { title: "dB", gridcolor: "#e0e0e0" },
      },
      { responsive: true, displayModeBar: false }
    );
  }, [data]);

  return (
    <div className="inline-view">
      <div className="inline-header">
        <span className="inline-title">Filter Design</span>
        <button className="view-toggle-btn" title="Expand to fullscreen" onClick={onExpand}>
          &#x26F6;
        </button>
      </div>
      <div className="inline-summary">{buildSummary(config)}</div>
      <div className="inline-plot-area" ref={plotRef}>
        {!data && <div className="plot-placeholder">No filter designed yet.</div>}
      </div>
      {data?.b && data?.a && (
        <div className="inline-coefficients">{formatCoeffs(data.b, data.a)}</div>
      )}
    </div>
  );
}
