# TICKET-002: Port Filter Design UI to React

**Status:** Open
**Created:** 2026-03-22
**Priority:** High
**Assignee:** TBD

## What
Port the vanilla JS filter design UI from `matlab-mcp-app` into React components. Must work standalone in preview mode (browser, no MCP host) and bundle into a single HTML file.

## Why
The current UI is just "Hello World". We need the full filter design experience — parameter panel, interactive Plotly plots, coefficients display — running inside an MCP app iframe.

## How

**Port from:** `D:\projects\matlab-mcp-app\public\` (index.html, styles.css, app.js)
**Port into:** `D:\projects\matlab-mcp-app-smoothdata\ui\`

**Components to create:**
- `ui/components/Header.tsx` — title, Run button, Autorun toggle
- `ui/components/ParamPanel.tsx` — filter type, response type, order, frequencies, ripple/atten, display options
- `ui/components/PlotArea.tsx` — Plotly rendering for magnitude, phase, group delay, pole-zero
- `ui/components/CoeffDisplay.tsx` — collapsible coefficient + code sections
- `ui/components/StatusBar.tsx` — connection status footer
- `ui/components/InlineView.tsx` — compact view with magnitude-only plot

**Hooks:**
- `ui/hooks/useFilterDesign.ts` — param state, results, conditional field logic
- `ui/hooks/useMockData.ts` — preview mode with mock/real data

**Other:**
- `ui/types.ts` — FilterConfig, FilterResult, DisplayOptions
- `ui/global.css` — full CSS ported from filter design app
- `ui/codegen-preview.ts` — client-side MATLAB code preview

**Plotly decision:** Bundle `plotly.js-dist-min` via npm (not CDN) because MCP app iframes are sandboxed and may not have network access.

**Reference:** See `docs/knowledge/filter-design-api.md` for exact Plotly definitions, conditional field logic, and CSS.

## Acceptance Criteria
- [ ] `npm run dev` serves UI in browser (preview mode)
- [ ] Parameter panel renders all fields with correct conditional visibility
- [ ] Plotly magnitude, phase, group delay, pole-zero plots render
- [ ] Coefficients and code sections display correctly
- [ ] Inline view shows compact magnitude plot
- [ ] Autorun triggers on parameter changes
- [ ] `npm run build` produces single HTML file in `dist/ui/`
- [ ] No console errors in browser

## Progress Log
_Updates will be added here as work proceeds_
