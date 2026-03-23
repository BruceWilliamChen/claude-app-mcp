"""Generate MATLAB code for filter design from parameters."""


def build_design_code(params: dict) -> str:
    """Build MATLAB filter design code string.

    Args:
        params: dict with filter_type, response_type, order, cutoff_freq,
                sample_rate, cutoff_freq_high, passband_ripple, stopband_atten.

    Returns:
        MATLAB code string for the design function call.
    """
    ft = params["filter_type"]
    rt = params["response_type"]
    order = params["order"]
    fc = params["cutoff_freq"]
    fs = params["sample_rate"]
    fc2 = params.get("cutoff_freq_high", 0) or 0
    rp = params.get("passband_ripple", 1) or 1
    rs = params.get("stopband_atten", 40) or 40

    wn = fc / (fs / 2)

    if rt in ("bandpass", "bandstop"):
        wn2 = fc2 / (fs / 2)
        freq_arg = f"[{wn}, {wn2}]"
    else:
        freq_arg = str(wn)

    # MATLAB uses 'high'/'stop', not 'highpass'/'bandstop'
    matlab_rt = {
        "lowpass": "",
        "highpass": "high",
        "bandpass": "bandpass",
        "bandstop": "stop",
    }
    rt_matlab = matlab_rt.get(rt, rt)
    rt_arg = "" if rt == "lowpass" else f", '{rt_matlab}'"

    design_lines = {
        "butterworth": f"[b, a] = butter({order}, {freq_arg}{rt_arg});",
        "chebyshev1": f"[b, a] = cheby1({order}, {rp}, {freq_arg}{rt_arg});",
        "chebyshev2": f"[b, a] = cheby2({order}, {rs}, {freq_arg}{rt_arg});",
        "elliptic": f"[b, a] = ellip({order}, {rp}, {rs}, {freq_arg}{rt_arg});",
        "fir": f"b = fir1({order}, {freq_arg}{rt_arg});\na = 1;",
    }

    return design_lines.get(ft, design_lines["butterworth"])


def build_full_code(params: dict) -> str:
    """Build complete MATLAB code: design + frequency response + JSON output.

    Returns a MATLAB script that designs the filter, computes response data,
    and prints the result as JSON to stdout.
    """
    design_code = build_design_code(params)
    fs = params["sample_rate"]
    display = params.get("display", {})

    parts = [design_code]
    parts.append(f"[H__, f__] = freqz(b, a, 1024, {fs});")
    parts.append("mag__ = 20*log10(abs(H__));")
    parts.append("phase__ = unwrap(angle(H__))*180/pi;")

    if display.get("group_delay", False):
        parts.append(f"[gd__, fgd__] = grpdelay(b, a, 1024, {fs});")

    if display.get("pole_zero", False):
        parts.append("z__ = roots(b); p__ = roots(a);")

    # Build JSON result struct
    fields = [
        "'b', b",
        "'a', a",
        "'freq', f__(:).'",
        "'magnitude', mag__(:).'",
        "'phase', phase__(:).'",
    ]
    if display.get("group_delay", False):
        fields.extend(["'group_delay', gd__(:).'", "'freq_gd', fgd__(:).'"])
    if display.get("pole_zero", False):
        fields.extend([
            "'zeros_real', real(z__(:).')",
            "'zeros_imag', imag(z__(:).')",
            "'poles_real', real(p__(:).')",
            "'poles_imag', imag(p__(:).')",
        ])

    parts.append(f"result__ = struct({', '.join(fields)});")
    parts.append("disp(jsonencode(result__));")

    return "\n".join(parts)
