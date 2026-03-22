import { useState } from "react";
import type { FilterResultData } from "../types";

function formatCoefficients(b: number[], a: number[]): string {
  const fmt = (arr: number[]) =>
    "[" + arr.map((v) => (typeof v === "number" ? v.toFixed(6) : v)).join(", ") + "]";
  return `b = ${fmt(b)}\na = ${fmt(a)}`;
}

interface CoeffDisplayProps {
  data: FilterResultData | null;
  matlabCode: string | null;
}

export function CoeffDisplay({ data, matlabCode }: CoeffDisplayProps) {
  const [coeffOpen, setCoeffOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  return (
    <>
      {data?.b && data?.a && (
        <div className="section" style={{ marginBottom: 8, border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--panel-bg)" }}>
          <div className={`section-header ${coeffOpen ? "open" : ""}`} onClick={() => setCoeffOpen(!coeffOpen)} style={{ background: "var(--section-header)", borderRadius: "var(--radius) var(--radius) 0 0" }}>
            Coefficients
          </div>
          {coeffOpen && (
            <div className="section-body">
              <pre className="coeff-display">{formatCoefficients(data.b, data.a)}</pre>
            </div>
          )}
        </div>
      )}

      <div className="section" style={{ marginBottom: 8, border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--panel-bg)" }}>
        <div className={`section-header ${codeOpen ? "open" : ""}`} onClick={() => setCodeOpen(!codeOpen)} style={{ background: "var(--section-header)", borderRadius: "var(--radius) var(--radius) 0 0" }}>
          Show Code
        </div>
        {codeOpen && (
          <div className="section-body">
            <pre className="code-display">{matlabCode || "% Configure parameters and click Run"}</pre>
          </div>
        )}
      </div>
    </>
  );
}
