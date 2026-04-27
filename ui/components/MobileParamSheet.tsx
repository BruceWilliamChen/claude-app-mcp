import { useState } from "react";
import type { FilterConfig, FilterType, ResponseType, DisplayOptions, FilterResultData } from "../types";

const FILTER_NAMES: Record<string, string> = {
  butterworth: "Butterworth",
  chebyshev1: "Chebyshev I",
  chebyshev2: "Chebyshev II",
  elliptic: "Elliptic",
  fir: "FIR",
};

interface MobileParamSheetProps {
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

function buildSummary(config: FilterConfig): string {
  const ft = FILTER_NAMES[config.filter_type] || config.filter_type;
  const rt = config.response_type.charAt(0).toUpperCase() + config.response_type.slice(1);
  return `${ft} ${rt}, Order ${config.order}, Fc=${config.cutoff_freq}Hz, Fs=${config.sample_rate}Hz`;
}

export function MobileParamSheet({
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
}: MobileParamSheetProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`mobile-sheet ${expanded ? "expanded" : ""}`}>
      {/* Collapsed: summary bar */}
      <div className="mobile-sheet-handle" onClick={() => setExpanded(!expanded)}>
        <div className="mobile-sheet-drag" />
        <span className="mobile-sheet-summary">
          {expanded ? "Parameters" : buildSummary(config)}
        </span>
        <span className="mobile-sheet-arrow">{expanded ? "\u25BC" : "\u25B2"}</span>
      </div>

      {/* Expanded: parameter form */}
      {expanded && (
        <div className="mobile-sheet-body">
          {/* Algorithm */}
          <div className="mobile-param-group">
            <div className="mobile-param-row">
              <label>Method</label>
              <select
                className="mobile-select"
                value={config.filter_type}
                onChange={(e) => onFilterTypeChange(e.target.value as FilterType)}
              >
                <option value="butterworth">Butterworth</option>
                <option value="chebyshev1">Chebyshev I</option>
                <option value="chebyshev2">Chebyshev II</option>
                <option value="elliptic">Elliptic</option>
                <option value="fir">FIR</option>
              </select>
            </div>
            <div className="mobile-param-row">
              <label>Response</label>
              <select
                className="mobile-select"
                value={config.response_type}
                onChange={(e) => onResponseTypeChange(e.target.value as ResponseType)}
              >
                <option value="lowpass">Lowpass</option>
                <option value="highpass">Highpass</option>
                <option value="bandpass">Bandpass</option>
                <option value="bandstop">Bandstop</option>
              </select>
            </div>
          </div>

          {/* Order */}
          <div className="mobile-param-group">
            <div className="mobile-param-row">
              <label>Order</label>
              <input
                type="number"
                className="mobile-input"
                value={config.order}
                min={1}
                max={20}
                onChange={(e) => onConfigChange({ order: parseInt(e.target.value) || 1 })}
              />
            </div>
            <input
              type="range"
              className="mobile-slider"
              min={1}
              max={20}
              value={config.order}
              onChange={(e) => onConfigChange({ order: parseInt(e.target.value) })}
            />
          </div>

          {/* Frequencies */}
          <div className="mobile-param-group">
            <div className="mobile-param-row">
              <label>Fc</label>
              <div className="mobile-input-unit">
                <input
                  type="number"
                  className="mobile-input"
                  value={config.cutoff_freq}
                  min={1}
                  onChange={(e) => onConfigChange({ cutoff_freq: parseFloat(e.target.value) || 1 })}
                />
                <span className="mobile-unit">Hz</span>
              </div>
            </div>
            {showCutoffHigh && (
              <div className="mobile-param-row">
                <label>Fc2</label>
                <div className="mobile-input-unit">
                  <input
                    type="number"
                    className="mobile-input"
                    value={config.cutoff_freq_high || 2000}
                    min={1}
                    onChange={(e) => onConfigChange({ cutoff_freq_high: parseFloat(e.target.value) || 1 })}
                  />
                  <span className="mobile-unit">Hz</span>
                </div>
              </div>
            )}
            <div className="mobile-param-row">
              <label>Fs</label>
              <div className="mobile-input-unit">
                <input
                  type="number"
                  className="mobile-input"
                  value={config.sample_rate}
                  min={1}
                  onChange={(e) => onConfigChange({ sample_rate: parseFloat(e.target.value) || 1 })}
                />
                <span className="mobile-unit">Hz</span>
              </div>
            </div>
          </div>

          {/* Ripple/Atten */}
          {showRippleSection && (
            <div className="mobile-param-group">
              {showRipple && (
                <div className="mobile-param-row">
                  <label>Ripple</label>
                  <div className="mobile-input-unit">
                    <input
                      type="number"
                      className="mobile-input"
                      value={config.passband_ripple || 1}
                      min={0.01}
                      step={0.1}
                      onChange={(e) => onConfigChange({ passband_ripple: parseFloat(e.target.value) || 0.01 })}
                    />
                    <span className="mobile-unit">dB</span>
                  </div>
                </div>
              )}
              {showAtten && (
                <div className="mobile-param-row">
                  <label>Atten</label>
                  <div className="mobile-input-unit">
                    <input
                      type="number"
                      className="mobile-input"
                      value={config.stopband_atten || 40}
                      min={1}
                      onChange={(e) => onConfigChange({ stopband_atten: parseFloat(e.target.value) || 1 })}
                    />
                    <span className="mobile-unit">dB</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
