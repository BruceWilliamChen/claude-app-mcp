"""MATLAB Engine wrapper for filter design."""

import io
import json
import time

import matlab.engine

# Global engine state
eng = None
engine_info = {}


def init_engine():
    """Start or connect to a MATLAB engine session."""
    global eng, engine_info

    sessions = matlab.engine.find_matlab()
    if sessions:
        eng = matlab.engine.connect_matlab(sessions[0])
        print(f"Connected to shared session: {sessions[0]}", flush=True)
    else:
        eng = matlab.engine.start_matlab("-nodesktop")
        print("Started new MATLAB instance.", flush=True)

    # Get version
    out = io.StringIO()
    eng.eval("disp(version)", nargout=0, stdout=out)
    engine_info["version"] = out.getvalue().strip()

    # Get PID
    out = io.StringIO()
    eng.eval("disp(feature('getpid'))", nargout=0, stdout=out)
    engine_info["pid"] = int(out.getvalue().strip())

    # Warm up JIT
    eng.eval(
        "[b__,a__]=butter(2,0.5); [H__,f__]=freqz(b__,a__,512); clear b__ a__ H__ f__;",
        nargout=0,
    )

    print(
        f"MATLAB {engine_info.get('version', '?')} ready "
        f"(PID: {engine_info.get('pid', '?')})",
        flush=True,
    )


def check_status() -> dict:
    """Check MATLAB connection status."""
    connected = False
    if eng is not None:
        try:
            eng.eval("1+1;", nargout=0)
            connected = True
        except Exception:
            pass

    return {
        "connected": connected,
        "version": engine_info.get("version"),
        "pid": engine_info.get("pid"),
    }


def execute_code(code: str) -> dict:
    """Execute MATLAB code and return parsed JSON result from stdout.

    Args:
        code: MATLAB code string. Should end with disp(jsonencode(result__)).

    Returns:
        dict with 'data' (parsed JSON), 'elapsed' (seconds), or 'error'.
    """
    if eng is None:
        return {"error": "MATLAB engine not initialized"}

    t_start = time.time()
    stdout = io.StringIO()
    stderr = io.StringIO()

    try:
        eng.eval(code, nargout=0, stdout=stdout, stderr=stderr)
    except matlab.engine.MatlabExecutionError as e:
        return {"error": str(e)}

    err = stderr.getvalue()
    if err:
        return {"error": err}

    raw = stdout.getvalue().strip()
    elapsed = time.time() - t_start

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {"error": "Failed to parse MATLAB output", "raw": raw[:500]}

    return {"data": data, "elapsed": round(elapsed, 3)}


def shutdown():
    """Clean up MATLAB engine."""
    global eng
    if eng is not None:
        try:
            eng.quit()
        except Exception:
            pass
        eng = None
