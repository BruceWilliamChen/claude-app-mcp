# Knowledge: Filter Design API Contract (from matlab-mcp-app)

> Reference: `D:\projects\matlab-mcp-app\server.py` and `public/app.js`
> This doc captures the exact API contract and MATLAB code generation to replicate.

---

## API Endpoints

### POST /api/design

**Request:**
```json
{
  "filter_type": "butterworth | chebyshev1 | chebyshev2 | elliptic | fir",
  "response_type": "lowpass | highpass | bandpass | bandstop",
  "order": 4,
  "cutoff_freq": 1000,
  "cutoff_freq_high": 2000,
  "sample_rate": 8000,
  "passband_ripple": 1,
  "stopband_atten": 40,
  "display": {
    "magnitude": true,
    "phase": true,
    "group_delay": false,
    "pole_zero": false
  }
}
```

**Response (success):**
```json
{
  "data": {
    "b": [0.000417, 0.001666, 0.002499, 0.001666, 0.000417],
    "a": [1.0, -3.1806, 3.8612, -2.1122, 0.4383],
    "freq": [0, 3.90625, 7.8125, ...],
    "magnitude": [-0.0036, -0.0145, -0.0327, ...],
    "phase": [0, -0.716, -1.433, ...],
    "group_delay": [3.82, 3.82, 3.83, ...],
    "freq_gd": [0, 3.90625, 7.8125, ...],
    "zeros_real": [1.0, -1.0, 1.0, -1.0],
    "zeros_imag": [0, 0, 0, 0],
    "poles_real": [0.726, 0.726, 0.864, 0.864],
    "poles_imag": [0.172, -0.172, 0.480, -0.480]
  },
  "matlab_code": "[b, a] = butter(4, 0.25);",
  "elapsed": 0.475
}
```

**Response (error):**
```json
{
  "error": "error message",
  "matlab_code": "[b, a] = butter(4, 0.25);"
}
```

**Notes:**
- `freq`, `magnitude`, `phase` always returned (1024 points)
- `group_delay`, `freq_gd` only if `display.group_delay === true`
- `zeros_*`, `poles_*` only if `display.pole_zero === true`
- Arrays are always row vectors (transposed in MATLAB with `(:).'`)

### GET /api/status

**Response:**
```json
{
  "connected": true,
  "version": "25.1.0.2973910 (R2025a) Update 1",
  "pid": 20600
}
```

### POST /api/run

**Request:**
```json
{
  "code": "disp(1+1)"
}
```

**Response:**
```json
{
  "output": "2\n",
  "error": null
}
```

---

## MATLAB Code Generation

### Frequency Normalization

MATLAB filter design functions use normalized frequency [0, 1] where 1 = Nyquist:

```python
wn = cutoff_freq / (sample_rate / 2)

# For bandpass/bandstop:
wn2 = cutoff_freq_high / (sample_rate / 2)
freq_arg = f"[{wn}, {wn2}]"
```

### Response Type Mapping

MATLAB uses different keywords than the UI:

| UI value | MATLAB argument |
|----------|----------------|
| `lowpass` | (no argument) |
| `highpass` | `'high'` |
| `bandpass` | `'bandpass'` |
| `bandstop` | `'stop'` |

### Design Function Templates

```python
design_lines = {
    "butterworth": f"[b, a] = butter({order}, {freq_arg}{rt_arg});",
    "chebyshev1":  f"[b, a] = cheby1({order}, {rp}, {freq_arg}{rt_arg});",
    "chebyshev2":  f"[b, a] = cheby2({order}, {rs}, {freq_arg}{rt_arg});",
    "elliptic":    f"[b, a] = ellip({order}, {rp}, {rs}, {freq_arg}{rt_arg});",
    "fir":         f"b = fir1({order}, {freq_arg}{rt_arg});\na = 1;",
}
```

### Full MATLAB Code Generated for Execution

```matlab
% 1. Design filter
[b, a] = butter(4, 0.25);

% 2. Frequency response (always computed)
[H__, f__] = freqz(b, a, 1024, 8000);
mag__ = 20*log10(abs(H__));
phase__ = unwrap(angle(H__))*180/pi;

% 3. Group delay (if requested)
[gd__, fgd__] = grpdelay(b, a, 1024, 8000);

% 4. Pole-zero (if requested)
z__ = roots(b); p__ = roots(a);

% 5. Build result struct
result__ = struct('b', b, 'a', a, 'freq', f__(:).', ...
    'magnitude', mag__(:).', 'phase', phase__(:).', ...
    'group_delay', gd__(:).', 'freq_gd', fgd__(:).', ...
    'zeros_real', real(z__(:).'), 'zeros_imag', imag(z__(:).'), ...
    'poles_real', real(p__(:).'), 'poles_imag', imag(p__(:).'));

% 6. Output as JSON
disp(jsonencode(result__));
```

---

## MATLAB Engine Integration (Python)

### Initialization

```python
import matlab.engine
import io

eng = None
engine_info = {}

def init_engine():
    global eng, engine_info

    sessions = matlab.engine.find_matlab()
    if sessions:
        eng = matlab.engine.connect_matlab(sessions[0])
    else:
        eng = matlab.engine.start_matlab("-nodesktop")

    # Get version
    out = io.StringIO()
    eng.eval("disp(version)", nargout=0, stdout=out)
    engine_info["version"] = out.getvalue().strip()

    # Get PID
    out = io.StringIO()
    eng.eval("disp(feature('getpid'))", nargout=0, stdout=out)
    engine_info["pid"] = int(out.getvalue().strip())

    # Warm up JIT
    eng.eval("[b__,a__]=butter(2,0.5); [H__,f__]=freqz(b__,a__,512); clear b__ a__ H__ f__;", nargout=0)
```

### Execution Pattern

```python
stdout = io.StringIO()
stderr = io.StringIO()

try:
    eng.eval(matlab_code, nargout=0, stdout=stdout, stderr=stderr)
except matlab.engine.MatlabExecutionError as e:
    return {"error": str(e)}

err = stderr.getvalue()
if err:
    return {"error": err}

raw = stdout.getvalue().strip()
result_data = json.loads(raw)
```

---

## Plotly Chart Definitions

### Layout Template

```javascript
const plotlyLayout = {
  font: { family: "system-ui, sans-serif", size: 11 },
  margin: { l: 55, r: 20, t: 30, b: 40 },
  paper_bgcolor: "white",
  plot_bgcolor: "#fafafa",
  xaxis: { gridcolor: "#e0e0e0" },
  yaxis: { gridcolor: "#e0e0e0" },
};

const plotlyConfig = {
  responsive: true,
  displayModeBar: false,
};
```

### Magnitude Response

```javascript
{
  traces: [{
    x: data.freq,
    y: data.magnitude,
    type: "scatter",
    mode: "lines",
    line: { width: 2, color: "#0076c6" },
  }],
  layout: {
    title: { text: "Magnitude Response", font: { size: 13 } },
    xaxis: { title: "Frequency (Hz)" },
    yaxis: { title: "Magnitude (dB)" },
  },
}
```

### Phase Response

```javascript
{
  traces: [{
    x: data.freq,
    y: data.phase,
    type: "scatter",
    mode: "lines",
    line: { width: 2, color: "#d94a1e" },
  }],
  layout: {
    title: { text: "Phase Response", font: { size: 13 } },
    xaxis: { title: "Frequency (Hz)" },
    yaxis: { title: "Phase (degrees)" },
  },
}
```

### Group Delay

```javascript
{
  traces: [{
    x: data.freq_gd,
    y: data.group_delay,
    type: "scatter",
    mode: "lines",
    line: { width: 2, color: "#78ab30" },
  }],
  layout: {
    title: { text: "Group Delay", font: { size: 13 } },
    xaxis: { title: "Frequency (Hz)" },
    yaxis: { title: "Samples" },
  },
}
```

### Pole-Zero Plot

```javascript
{
  traces: [
    // Zeros (circle markers)
    {
      x: data.zeros_real, y: data.zeros_imag,
      type: "scatter", mode: "markers",
      marker: { size: 10, symbol: "circle-open", color: "#0076c6", line: { width: 2 } },
      name: "Zeros",
    },
    // Poles (x markers)
    {
      x: data.poles_real, y: data.poles_imag,
      type: "scatter", mode: "markers",
      marker: { size: 10, symbol: "x", color: "#d94a1e", line: { width: 2 } },
      name: "Poles",
    },
    // Unit circle (dashed)
    {
      x: theta.map(Math.cos), y: theta.map(Math.sin),
      type: "scatter", mode: "lines",
      line: { width: 1, color: "#ccc", dash: "dash" },
      showlegend: false,
    },
  ],
  layout: {
    title: { text: "Pole-Zero Plot", font: { size: 13 } },
    xaxis: { title: "Real", scaleanchor: "y" },
    yaxis: { title: "Imaginary" },
    showlegend: true,
    legend: { x: 0.01, y: 0.99 },
  },
}
```

### Dynamic Plot Height

```javascript
const height = Math.max(280, Math.floor(600 / plots.length));
```

### Inline View (Magnitude Only)

```javascript
// Only show magnitude response in inline view
Plotly.newPlot(div, [{
  x: data.freq,
  y: data.magnitude,
  type: "scatter",
  mode: "lines",
  line: { width: 2, color: "#0076c6" },
}], {
  ...plotlyLayout,
  height: 250,
  title: { text: "Magnitude Response", font: { size: 12 } },
  xaxis: { title: "Frequency (Hz)" },
  yaxis: { title: "dB" },
});
```

---

## UI Conditional Field Logic

### When to Show Upper Frequency

```javascript
cutoffHighRow.style.display =
  responseType === "bandpass" || responseType === "bandstop" ? "" : "none";
```

### When to Show Ripple/Attenuation

```javascript
const showRipple = filterType === "chebyshev1" || filterType === "elliptic";
const showAtten  = filterType === "chebyshev2" || filterType === "elliptic";

rippleSection.style.display = showRipple || showAtten ? "" : "none";
rippleRow.style.display = showRipple ? "" : "none";
attenRow.style.display  = showAtten  ? "" : "none";
```

---

## CSS Color Variables

```css
:root {
  --bg: #f5f5f5;
  --panel-bg: #ffffff;
  --border: #d4d4d4;
  --accent: #0076c6;
  --accent-hover: #005a9e;
  --text: #1e1e1e;
  --text-muted: #616161;
  --section-header: #e8e8e8;
  --success: #16a34a;
  --error: #dc2626;
  --code-bg: #f8f8f8;
  --radius: 4px;
}
```

## Format Coefficients

```javascript
function formatCoefficients(b, a) {
  const fmt = (arr) => {
    if (!Array.isArray(arr)) return String(arr);
    return "[" + arr.map(v => typeof v === "number" ? v.toFixed(6) : v).join(", ") + "]";
  };
  return `b = ${fmt(b)}\na = ${fmt(a)}`;
}
```
