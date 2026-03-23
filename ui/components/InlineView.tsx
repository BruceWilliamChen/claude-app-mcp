import type { ResponseType } from "../types";

const FILTER_OPTIONS: { type: ResponseType; icon: string; label: string; desc: string }[] = [
  { type: "lowpass", icon: "\u2581\u2581\u2581\u2596", label: "Lowpass", desc: "Pass low frequencies" },
  { type: "highpass", icon: "\u2598\u2581\u2581\u2581", label: "Highpass", desc: "Pass high frequencies" },
  { type: "bandpass", icon: "\u2581\u2580\u2580\u2581", label: "Bandpass", desc: "Pass a frequency band" },
  { type: "bandstop", icon: "\u2580\u2581\u2581\u2580", label: "Bandstop", desc: "Reject a frequency band" },
];

interface InlineViewProps {
  onSelectFilter: (responseType: ResponseType) => void;
}

export function InlineView({ onSelectFilter }: InlineViewProps) {
  return (
    <div className="inline-view">
      <div className="inline-header">
        <span className="inline-title">Filter Design</span>
      </div>
      <div className="inline-subtitle">Select a filter type to start designing</div>
      <div className="inline-filter-grid">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.type}
            className="inline-filter-btn"
            onClick={() => onSelectFilter(f.type)}
          >
            <span className="inline-filter-icon">{f.icon}</span>
            <div>
              <div className="inline-filter-label">{f.label}</div>
              <div className="inline-filter-desc">{f.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
