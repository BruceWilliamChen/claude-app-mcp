# Plan: Mobile Support

> Make the fullscreen filter design UI usable on mobile devices (phones + tablets).
> The inline view (filter type buttons) already works fine on mobile.

---

## Known Issues on Mobile

### Issue 1: Left panel (FILTERS / PARAMETERS / FILTER INFO) has nowhere to go

On desktop the left panel is a 320px sidebar. On mobile there's no room for it alongside
the plot. The panel either gets hidden entirely (current `@media max-width:600px` hides it)
or squishes the plot to nothing.

**Impact:** Users can't change parameters on mobile — they're stuck with defaults.

### Issue 2: Run button overlaps with host's close button

The header has Run/Autorun/Show Code buttons on the right side. On mobile hosts (ChatGPT app),
the host renders its own X close button in the top-right corner, which overlaps with our buttons.

**Impact:** Users can't click Run or accidentally close the app.

---

## Solution: Mobile-First Responsive Layout

### Approach: Bottom sheet parameter panel + repositioned header

On mobile (`< 768px`), switch to a single-column layout:

```
┌─────────────────────────────┐
│ Filter Design    [Run] [</>]│  ← header (left-aligned actions, avoid top-right)
├─────────────────────────────┤
│                             │
│     Plot area (full width)  │
│                             │
│                             │
├─────────────────────────────┤
│ ▲ Parameters                │  ← collapsible bottom sheet (drag up to expand)
│  Fc: 1000 Hz   Order: 4    │
│  Method: Butterworth        │
└─────────────────────────────┘
```

### Step 1: Fix header button overlap

Move Run button and action buttons to the **left** side of the header on mobile,
or add top padding to avoid the host's close button zone.

```css
@media (max-width: 768px) {
  .app-header {
    padding-top: 12px;  /* space for host's X button */
    flex-wrap: wrap;
  }
  .header-right {
    order: -1;  /* move actions before title */
    width: 100%;
    justify-content: flex-start;
    margin-bottom: 4px;
  }
}
```

**Simpler option:** Just add `padding-right: 50px` to the header on mobile to keep our
buttons out of the host's close button zone.

### Step 2: Convert left panel to bottom sheet

On mobile, the param panel becomes a collapsible bottom sheet:

- **Collapsed** (default): Shows a single summary line ("Butterworth Lowpass, Order 4, Fc=1kHz")
  with a drag handle or "Parameters ▲" button
- **Expanded**: Slides up covering ~60% of screen, scrollable, with all parameter sections
- **Fully expanded**: Covers full screen (for detailed editing)

```
State: collapsed
┌─────────────────────────────┐
│ ▲ Butterworth LP, Order 4   │  ← tap to expand
└─────────────────────────────┘

State: half-expanded
┌─────────────────────────────┐
│ ▼ Parameters                │
│ ┌─ Filter order ──────────┐ │
│ │ Order: [4] ═══●═══════  │ │
│ └──────────────────────────┘ │
│ ┌─ Frequency ─────────────┐ │
│ │ Fs: [8000] Hz            │ │
│ │ Fc: [1000] Hz            │ │
│ └──────────────────────────┘ │
│ ┌─ Algorithm ─────────────┐ │
│ │ [Butterworth ▼]          │ │
│ │ [Lowpass     ▼]          │ │
│ └──────────────────────────┘ │
└─────────────────────────────┘
```

### Step 3: Simplify mobile parameter layout

On mobile, flatten the 3-section panel (FILTERS, PARAMETERS, FILTER INFO) into a simpler layout:

- **Skip FILTERS table** (only useful with multiple filters, which we don't support yet)
- **Show PARAMETERS sections** directly (filter order, frequency, algorithm)
- **Move FILTER INFO** to a small summary badge or hide behind a (i) button
- **Coefficients** accessible via Show Code dialog (already works)

### Step 4: Touch-friendly plot tabs

The plot tab bar needs larger touch targets on mobile:

```css
@media (max-width: 768px) {
  .plot-tab {
    padding: 8px 16px;  /* bigger touch target */
    font-size: 13px;
  }
  .plot-tab-close {
    padding: 4px 8px;
    font-size: 16px;
  }
}
```

### Step 5: Full-width plot

On mobile, the plot should take the full viewport width with no side padding:

```css
@media (max-width: 768px) {
  .results-panel {
    padding: 0;
  }
  .plot-area {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
```

---

## Implementation Phases

### Phase 1: Quick fixes (< 1 hour)
- [ ] Add `padding-right: 50px` to header on mobile (avoid host X button)
- [ ] Increase plot tab touch targets
- [ ] Full-width plot on mobile
- [ ] Test with Playwright at 375px viewport width

### Phase 2: Bottom sheet parameters (half day)
- [ ] Create `MobileParamSheet.tsx` component
- [ ] Three states: collapsed (summary), half-expanded, full-expanded
- [ ] Drag handle or toggle button
- [ ] Simplified param layout (no FILTERS table)
- [ ] CSS transitions for smooth expand/collapse

### Phase 3: Polish (half day)
- [ ] Test on actual mobile devices (iOS Safari, Android Chrome)
- [ ] Test in ChatGPT mobile app and Claude mobile app
- [ ] Handle landscape orientation (wider = more like tablet)
- [ ] Handle virtual keyboard pushing layout up when editing number inputs
- [ ] Ensure Plotly touch gestures (pinch zoom, pan) work correctly

---

## Files to Modify

| File | Changes |
|------|---------|
| `ui/global.css` | Add `@media (max-width: 768px)` responsive rules |
| `ui/components/Header.tsx` | Conditional layout on mobile |
| `ui/components/ParamPanel.tsx` | Export simplified mobile version |
| `ui/components/MobileParamSheet.tsx` | **New** — bottom sheet component |
| `ui/mcp-app.tsx` | Detect mobile, render MobileParamSheet instead of ParamPanel |
| `ui/components/PlotArea.tsx` | Touch-friendly tab sizing |

---

## Testing Approach

Use Playwright with mobile viewport:

```javascript
await page.setViewportSize({ width: 375, height: 812 }); // iPhone
await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
await page.setViewportSize({ width: 768, height: 1024 }); // iPad
```

Also test in actual mobile apps:
- ChatGPT iOS/Android app
- Claude iOS app (when MCP session bugs are fixed)
