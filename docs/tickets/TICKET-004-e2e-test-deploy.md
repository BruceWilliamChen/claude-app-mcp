# TICKET-004: End-to-End Test and Deploy

**Status:** Done
**Created:** 2026-03-22
**Priority:** Medium
**Assignee:** TBD
**Blocked by:** TICKET-001, TICKET-002, TICKET-003

## What
Build everything, run end-to-end tests, verify the full flow works from chat to MATLAB and back.

## Why
Individual pieces may work in isolation but fail when combined. Need to verify the full chain: client → HTTPS → MCP server → MATLAB → response → UI → Plotly plots.

## How

**Build steps:**
```bash
cd ui && npm install && npm run build    # → dist/ui/mcp-app.html
pip install -r requirements.txt          # → Python deps
python mcp_server.py --http              # → localhost:8000
ngrok http 8000                          # → HTTPS URL
```

**Test matrix:**

| # | Test | How to verify |
|---|------|---------------|
| 1 | UI preview mode | `npm run dev` → open browser → form renders |
| 2 | Server starts | `python mcp_server.py --http` → no errors |
| 3 | MATLAB connects | `/mcp` status shows version + PID |
| 4 | Butterworth lowpass | Design returns 1024 freq points + coefficients |
| 5 | Chebyshev with ripple | Ripple field appears, correct response |
| 6 | Bandpass filter | Upper freq field appears, both cutoffs used |
| 7 | All 4 plot types | Magnitude, phase, group delay, pole-zero render |
| 8 | Pole-zero plot | Unit circle, zeros (o), poles (x) visible |
| 9 | Inline view | Compact card with magnitude plot |
| 10 | ngrok HTTPS | MCP endpoint accessible via HTTPS URL |
| 11 | Chat integration | Tool appears in client, UI renders in chat |
| 12 | Model pre-fill | "Design 6th order Chebyshev lowpass" → form filled |

## Acceptance Criteria
- [ ] `npm run build` succeeds
- [ ] Server starts and MATLAB connects
- [ ] All 12 test scenarios pass
- [ ] No console errors in browser
- [ ] Response time < 2s for filter design
- [ ] HTTPS endpoint works from external machine

## Progress Log
_Updates will be added here as work proceeds_
