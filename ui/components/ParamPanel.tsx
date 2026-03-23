import { useState } from "react";
import type { FilterConfig, FilterType, ResponseType, DisplayOptions, FilterResultData } from "../types";

interface ParamPanelProps {
  config: FilterConfig;
  result: FilterResultData | null;
  showCutoffHigh: boolean;
  showRipple: boolean;
  showAtten: boolean;
  showRippleSection: boolean;
  onFilterTypeChange: (ft: FilterType) => void;
  onResponseTypeChange: (rt: ResponseType) => void;
  onConfigChange: (partial: Partial<FilterConfig>) => void;
  onDisplayChange: (partial: Partial<DisplayOptions>) => void;
}

const FILTER_NAMES: Record<string, string> = {
  butterworth: "Butterworth",
  chebyshev1: "Chebyshev I",
  chebyshev2: "Chebyshev II",
  elliptic: "Elliptic",
  fir: "FIR",
};

function formatCoeffs(b: number[], a: number[]): string {
  const fmt = (arr: number[]) => "[" + arr.map((v) => v.toFixed(6)).join(", ") + "]";
  return `b = ${fmt(b)}\na = ${fmt(a)}`;
}

const LINE_COLORS: Record<string, string> = {
  butterworth: "#0072BD",
  chebyshev1: "#D95319",
  chebyshev2: "#EDB120",
  elliptic: "#7E2F8E",
  fir: "#77AC30",
};

// Collapsible major section with MATLAB-style header
function MajorSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="major-section">
      <div className={`major-section-header ${open ? "open" : ""}`} onClick={() => setOpen(!open)}>
        <span className="disclosure">{open ? "\u25BC" : "\u25B6"}</span>
        {title}
      </div>
      {open && <div className="major-section-body">{children}</div>}
    </div>
  );
}

// Collapsible sub-section inside PARAMETERS
function SubSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sub-section">
      <div className={`sub-section-header ${open ? "open" : ""}`} onClick={() => setOpen(!open)}>
        <span className="disclosure-sm">{open ? "\u25BC" : "\u25B6"}</span>
        {title}
      </div>
      {open && <div className="sub-section-body">{children}</div>}
    </div>
  );
}

export function ParamPanel({
  config,
  result,
  showCutoffHigh,
  showRipple,
  showAtten,
  showRippleSection,
  onFilterTypeChange,
  onResponseTypeChange,
  onConfigChange,
  onDisplayChange,
}: ParamPanelProps) {
  const filterName = `${config.response_type}${config.filter_type === "fir" ? "fir" : "iir"}1`;
  const lineColor = LINE_COLORS[config.filter_type] || "#0072BD";
  const isStable = result ? (result.poles_real
    ? result.poles_real.every((r, i) => Math.sqrt(r * r + (result.poles_imag?.[i] || 0) ** 2) < 1)
    : true) : null;
  const isFir = config.filter_type === "fir";

  return (
    <aside className="param-panel">
      {/* ── FILTERS ── */}
      <MajorSection title="FILTERS">
        <table className="filter-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Line</th>
              <th>Fs</th>
              <th>Stable</th>
            </tr>
          </thead>
          <tbody>
            <tr className="filter-row active">
              <td className="filter-name">{filterName}</td>
              <td>
                <span className="line-swatch" style={{ background: lineColor }} />
              </td>
              <td className="filter-fs">{config.sample_rate >= 1000 ? `${(config.sample_rate/1000).toFixed(config.sample_rate % 1000 === 0 ? 0 : 2)}k` : config.sample_rate}</td>
              <td>
                {isStable === null ? <span className="stable-na">—</span> :
                  isStable ? <span className="stable-yes">&#10003;</span> :
                  <span className="stable-no">&#10007;</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </MajorSection>

      {/* ── PARAMETERS ── */}
      <MajorSection title="PARAMETERS">
        <SubSection title="Filter order" defaultOpen={true}>
          <div className="param-row">
            <label>Order</label>
            <div className="param-row-right">
              <input
                type="number"
                className="param-input-sm"
                value={config.order}
                min={1}
                max={20}
                onChange={(e) => onConfigChange({ order: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <input
            type="range"
            className="param-slider"
            min={1}
            max={20}
            value={config.order}
            onChange={(e) => onConfigChange({ order: parseInt(e.target.value) })}
          />
        </SubSection>

        <SubSection title="Frequency parameters" defaultOpen={true}>
          <div className="param-row">
            <label>Fs</label>
            <div className="param-row-right">
              <input
                type="number"
                className="param-input"
                value={config.sample_rate}
                min={1}
                onChange={(e) => onConfigChange({ sample_rate: parseFloat(e.target.value) || 1 })}
              />
              <span className="param-unit">Hz</span>
            </div>
          </div>
          <div className="param-row">
            <label>Fc</label>
            <div className="param-row-right">
              <input
                type="number"
                className="param-input"
                value={config.cutoff_freq}
                min={1}
                onChange={(e) => onConfigChange({ cutoff_freq: parseFloat(e.target.value) || 1 })}
              />
              <span className="param-unit">Hz</span>
            </div>
          </div>
          {showCutoffHigh && (
            <div className="param-row">
              <label>Fc2</label>
              <div className="param-row-right">
                <input
                  type="number"
                  className="param-input"
                  value={config.cutoff_freq_high || 2000}
                  min={1}
                  onChange={(e) => onConfigChange({ cutoff_freq_high: parseFloat(e.target.value) || 1 })}
                />
                <span className="param-unit">Hz</span>
              </div>
            </div>
          )}
        </SubSection>

        {showRippleSection && (
          <SubSection title="Magnitude parameters" defaultOpen={true}>
            {showRipple && (
              <div className="param-row">
                <label>Apass</label>
                <div className="param-row-right">
                  <input
                    type="number"
                    className="param-input"
                    value={config.passband_ripple || 1}
                    min={0.01}
                    step={0.1}
                    onChange={(e) => onConfigChange({ passband_ripple: parseFloat(e.target.value) || 0.01 })}
                  />
                  <span className="param-unit">dB</span>
                </div>
              </div>
            )}
            {showAtten && (
              <div className="param-row">
                <label>Astop</label>
                <div className="param-row-right">
                  <input
                    type="number"
                    className="param-input"
                    value={config.stopband_atten || 40}
                    min={1}
                    onChange={(e) => onConfigChange({ stopband_atten: parseFloat(e.target.value) || 1 })}
                  />
                  <span className="param-unit">dB</span>
                </div>
              </div>
            )}
          </SubSection>
        )}

        <SubSection title="Algorithm">
          <div className="param-row">
            <label>Design method</label>
            <select
              className="param-select"
              value={config.filter_type}
              onChange={(e) => onFilterTypeChange(e.target.value as FilterType)}
            >
              <option value="butterworth">Butterworth</option>
              <option value="chebyshev1">Chebyshev Type I</option>
              <option value="chebyshev2">Chebyshev Type II</option>
              <option value="elliptic">Elliptic</option>
              <option value="fir">FIR (Window)</option>
            </select>
          </div>
          <div className="param-row">
            <label>Response type</label>
            <select
              className="param-select"
              value={config.response_type}
              onChange={(e) => onResponseTypeChange(e.target.value as ResponseType)}
            >
              <option value="lowpass">Lowpass</option>
              <option value="highpass">Highpass</option>
              <option value="bandpass">Bandpass</option>
              <option value="bandstop">Bandstop</option>
            </select>
          </div>
        </SubSection>
      </MajorSection>

      {/* ── FILTER INFORMATION ── */}
      <MajorSection title="FILTER INFORMATION">
        <table className="info-table">
          <tbody>
            <tr>
              <td className="info-label">Description</td>
              <td className="info-value">
                Discrete-Time {isFir ? "FIR" : "IIR"} Filter ({config.response_type})
              </td>
            </tr>
            <tr>
              <td className="info-label">Structure</td>
              <td className="info-value">{isFir ? "Direct-Form FIR" : "Direct-Form II"}</td>
            </tr>
            <tr>
              <td className="info-label">Order</td>
              <td className="info-value">{config.order}</td>
            </tr>
            <tr>
              <td className="info-label">Stable</td>
              <td className="info-value">
                {isStable === null ? "—" : isStable ? "Yes" : "No"}
              </td>
            </tr>
            {result?.b && (
              <tr>
                <td className="info-label">Length</td>
                <td className="info-value">{result.b.length}</td>
              </tr>
            )}
          </tbody>
        </table>
        {result?.b && result?.a && (
          <SubSection title="Coefficients">
            <pre className="coeff-display">{formatCoeffs(result.b, result.a)}</pre>
          </SubSection>
        )}
      </MajorSection>
    </aside>
  );
}
