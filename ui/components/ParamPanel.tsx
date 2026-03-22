import { useState } from "react";
import type { FilterConfig, FilterType, ResponseType, DisplayOptions } from "../types";

interface ParamPanelProps {
  config: FilterConfig;
  showCutoffHigh: boolean;
  showRipple: boolean;
  showAtten: boolean;
  showRippleSection: boolean;
  onFilterTypeChange: (ft: FilterType) => void;
  onResponseTypeChange: (rt: ResponseType) => void;
  onConfigChange: (partial: Partial<FilterConfig>) => void;
  onDisplayChange: (partial: Partial<DisplayOptions>) => void;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <div className={`section-header ${open ? "open" : ""}`} onClick={() => setOpen(!open)}>
        {title}
      </div>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

export function ParamPanel({
  config,
  showCutoffHigh,
  showRipple,
  showAtten,
  showRippleSection,
  onFilterTypeChange,
  onResponseTypeChange,
  onConfigChange,
  onDisplayChange,
}: ParamPanelProps) {
  return (
    <aside className="param-panel">
      <Section title="Filter Type">
        <select
          value={config.filter_type}
          onChange={(e) => onFilterTypeChange(e.target.value as FilterType)}
        >
          <option value="butterworth">Butterworth</option>
          <option value="chebyshev1">Chebyshev Type I</option>
          <option value="chebyshev2">Chebyshev Type II</option>
          <option value="elliptic">Elliptic</option>
          <option value="fir">FIR (Window)</option>
        </select>
      </Section>

      <Section title="Response Type">
        <select
          value={config.response_type}
          onChange={(e) => onResponseTypeChange(e.target.value as ResponseType)}
        >
          <option value="lowpass">Lowpass</option>
          <option value="highpass">Highpass</option>
          <option value="bandpass">Bandpass</option>
          <option value="bandstop">Bandstop</option>
        </select>
      </Section>

      <Section title="Order">
        <div className="slider-row">
          <input
            type="range"
            min={1}
            max={20}
            value={config.order}
            onChange={(e) => onConfigChange({ order: parseInt(e.target.value) })}
          />
          <span className="slider-value">{config.order}</span>
        </div>
      </Section>

      <Section title="Frequencies">
        <div className="field-row">
          <label>Cutoff frequency</label>
          <div className="input-unit">
            <input
              type="number"
              value={config.cutoff_freq}
              min={1}
              step={1}
              onChange={(e) => onConfigChange({ cutoff_freq: parseFloat(e.target.value) || 0 })}
            />
            <span className="unit">Hz</span>
          </div>
        </div>

        {showCutoffHigh && (
          <div className="field-row">
            <label>Upper frequency</label>
            <div className="input-unit">
              <input
                type="number"
                value={config.cutoff_freq_high || 2000}
                min={1}
                step={1}
                onChange={(e) => onConfigChange({ cutoff_freq_high: parseFloat(e.target.value) || 0 })}
              />
              <span className="unit">Hz</span>
            </div>
          </div>
        )}

        <div className="field-row">
          <label>Sample rate</label>
          <div className="input-unit">
            <input
              type="number"
              value={config.sample_rate}
              min={1}
              step={1}
              onChange={(e) => onConfigChange({ sample_rate: parseFloat(e.target.value) || 0 })}
            />
            <span className="unit">Hz</span>
          </div>
        </div>
      </Section>

      {showRippleSection && (
        <Section title="Ripple & Attenuation">
          {showRipple && (
            <div className="field-row">
              <label>Passband ripple</label>
              <div className="input-unit">
                <input
                  type="number"
                  value={config.passband_ripple || 1}
                  min={0.01}
                  step={0.1}
                  onChange={(e) => onConfigChange({ passband_ripple: parseFloat(e.target.value) || 0 })}
                />
                <span className="unit">dB</span>
              </div>
            </div>
          )}
          {showAtten && (
            <div className="field-row">
              <label>Stopband attenuation</label>
              <div className="input-unit">
                <input
                  type="number"
                  value={config.stopband_atten || 40}
                  min={1}
                  step={1}
                  onChange={(e) => onConfigChange({ stopband_atten: parseFloat(e.target.value) || 0 })}
                />
                <span className="unit">dB</span>
              </div>
            </div>
          )}
        </Section>
      )}

      <Section title="Display Options">
        <label className="checkbox-row">
          <input type="checkbox" checked={config.display.magnitude} onChange={(e) => onDisplayChange({ magnitude: e.target.checked })} />
          Magnitude response
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={config.display.phase} onChange={(e) => onDisplayChange({ phase: e.target.checked })} />
          Phase response
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={config.display.group_delay} onChange={(e) => onDisplayChange({ group_delay: e.target.checked })} />
          Group delay
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={config.display.pole_zero} onChange={(e) => onDisplayChange({ pole_zero: e.target.checked })} />
          Pole-zero plot
        </label>
      </Section>
    </aside>
  );
}
