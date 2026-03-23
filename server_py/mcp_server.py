"""Filter Design MCP Server.

Python FastMCP server that:
- Registers two tools (configure-filter, run-filter-design)
- Serves the React UI as an MCP resource
- Connects to MATLAB via matlab.engine
- Supports stdio and HTTP (HTTPS via ngrok) transports
"""

import json
import sys
from pathlib import Path

from mcp.server.fastmcp import FastMCP

from codegen import build_design_code, build_full_code
from matlab_bridge import init_engine, check_status, execute_code, shutdown

# ── Server Setup ──

mcp = FastMCP("FilterDesign")

FILTER_UI_URI = "ui://filter-design/app.html"
FILTER_UI_PATH = Path(__file__).parent.parent / "dist" / "ui" / "index.html"


def _load_ui_html() -> str:
    if FILTER_UI_PATH.exists():
        return FILTER_UI_PATH.read_text(encoding="utf-8")
    return "<html><body>UI not built. Run: cd ui && npm install && npm run build</body></html>"


# ── Resource: UI HTML ──

@mcp.resource(
    FILTER_UI_URI,
    name="filter-design-app",
    description="Interactive filter design configurator with Plotly charts",
    mime_type="text/html;profile=mcp-app",
)
def filter_design_app() -> str:
    """Serve the built React UI as a single HTML file."""
    return _load_ui_html()


# ── Tool 1: configure-filter (visible to model + app) ──

@mcp.tool(meta={"ui": {"resourceUri": FILTER_UI_URI}})
def configure_filter(
    filter_type: str = "butterworth",
    response_type: str = "lowpass",
    order: int = 4,
    cutoff_freq: float = 1000.0,
    sample_rate: float = 8000.0,
    cutoff_freq_high: float = 0.0,
    passband_ripple: float = 1.0,
    stopband_atten: float = 40.0,
) -> str:
    """Open the filter design configurator UI with optional pre-filled parameters.

    Args:
        filter_type: Filter design method — butterworth, chebyshev1, chebyshev2, elliptic, or fir.
        response_type: Filter response — lowpass, highpass, bandpass, or bandstop.
        order: Filter order (1-20). Higher = sharper cutoff but more computation.
        cutoff_freq: Cutoff frequency in Hz. Must be less than sample_rate/2 (Nyquist).
        sample_rate: Sample rate in Hz.
        cutoff_freq_high: Upper cutoff frequency in Hz (only for bandpass/bandstop).
        passband_ripple: Passband ripple in dB (only for chebyshev1/elliptic).
        stopband_atten: Stopband attenuation in dB (only for chebyshev2/elliptic).
    """
    params = {
        "filter_type": filter_type,
        "response_type": response_type,
        "order": order,
        "cutoff_freq": cutoff_freq,
        "sample_rate": sample_rate,
        "cutoff_freq_high": cutoff_freq_high,
        "passband_ripple": passband_ripple,
        "stopband_atten": stopband_atten,
    }

    matlab_code = build_design_code(params)
    status = check_status()

    result = {
        "config": params,
        "matlab_code": matlab_code,
        "matlab_status": status,
        "_meta": {
            "ui_displayed": True,
            "followup_instruction": (
                "The filter design UI is displayed. The user can adjust parameters "
                "and click Run to execute. Don't repeat the parameters unless asked. "
                "If the user asks about filter characteristics, explain based on the "
                "current configuration."
            ),
        },
    }

    return json.dumps(result)


# ── Tool 2: get-filter-settings ──

@mcp.tool()
def get_filter_settings() -> str:
    """Get the current filter design settings and MATLAB connection status.

    Returns the current filter configuration including type, response,
    order, frequencies, and MATLAB connection info. Use this to understand
    what the user has configured before making suggestions.
    """
    status = check_status()
    return json.dumps({
        "matlab_status": status,
        "available_filter_types": ["butterworth", "chebyshev1", "chebyshev2", "elliptic", "fir"],
        "available_response_types": ["lowpass", "highpass", "bandpass", "bandstop"],
        "parameter_ranges": {
            "order": {"min": 1, "max": 20},
            "cutoff_freq": "Must be < sample_rate/2 (Nyquist)",
            "passband_ripple": "dB, used by chebyshev1 and elliptic",
            "stopband_atten": "dB, used by chebyshev2 and elliptic",
        },
        "note": "The UI pushes current settings via updateModelContext. Check the model context for the latest user configuration.",
    })


# ── Tool 3: set-filter-settings ──

@mcp.tool()
def set_filter_settings(
    filter_type: str = "",
    response_type: str = "",
    order: int = 0,
    cutoff_freq: float = 0,
    sample_rate: float = 0,
    cutoff_freq_high: float = 0,
    passband_ripple: float = 0,
    stopband_atten: float = 0,
) -> str:
    """Update filter design parameters. Only non-zero/non-empty values are applied.

    Use this to change the filter configuration based on user requests like
    "change to a Chebyshev filter" or "increase the order to 8".

    Args:
        filter_type: butterworth, chebyshev1, chebyshev2, elliptic, or fir
        response_type: lowpass, highpass, bandpass, or bandstop
        order: Filter order (1-20)
        cutoff_freq: Cutoff frequency in Hz
        sample_rate: Sample rate in Hz
        cutoff_freq_high: Upper cutoff in Hz (bandpass/bandstop only)
        passband_ripple: Passband ripple in dB (chebyshev1/elliptic)
        stopband_atten: Stopband attenuation in dB (chebyshev2/elliptic)
    """
    updates = {}
    if filter_type: updates["filter_type"] = filter_type
    if response_type: updates["response_type"] = response_type
    if order > 0: updates["order"] = order
    if cutoff_freq > 0: updates["cutoff_freq"] = cutoff_freq
    if sample_rate > 0: updates["sample_rate"] = sample_rate
    if cutoff_freq_high > 0: updates["cutoff_freq_high"] = cutoff_freq_high
    if passband_ripple > 0: updates["passband_ripple"] = passband_ripple
    if stopband_atten > 0: updates["stopband_atten"] = stopband_atten

    return json.dumps({
        "updated_settings": updates,
        "instruction": "Settings updated. The UI should reflect these changes. Call run_filter_design to execute with the new settings.",
    })


# ── Tool 4: run-filter-design (app only — hidden from model) ──

@mcp.tool()
def run_filter_design(
    filter_type: str = "butterworth",
    response_type: str = "lowpass",
    order: int = 4,
    cutoff_freq: float = 1000.0,
    sample_rate: float = 8000.0,
    cutoff_freq_high: float = 0.0,
    passband_ripple: float = 1.0,
    stopband_atten: float = 40.0,
    show_magnitude: bool = True,
    show_phase: bool = True,
    show_group_delay: bool = False,
    show_pole_zero: bool = False,
) -> str:
    """Execute filter design in MATLAB and return numeric data for plotting.

    Called directly by the UI's Run button via app.callServerTool().
    Returns frequency response data, coefficients, and timing.

    Args:
        filter_type: Filter design method.
        response_type: Filter response type.
        order: Filter order (1-20).
        cutoff_freq: Cutoff frequency in Hz.
        sample_rate: Sample rate in Hz.
        cutoff_freq_high: Upper cutoff in Hz (bandpass/bandstop only).
        passband_ripple: Passband ripple in dB (chebyshev1/elliptic).
        stopband_atten: Stopband attenuation in dB (chebyshev2/elliptic).
        show_magnitude: Compute magnitude response.
        show_phase: Compute phase response.
        show_group_delay: Compute group delay.
        show_pole_zero: Compute pole-zero locations.
    """
    params = {
        "filter_type": filter_type,
        "response_type": response_type,
        "order": order,
        "cutoff_freq": cutoff_freq,
        "sample_rate": sample_rate,
        "cutoff_freq_high": cutoff_freq_high,
        "passband_ripple": passband_ripple,
        "stopband_atten": stopband_atten,
        "display": {
            "magnitude": show_magnitude,
            "phase": show_phase,
            "group_delay": show_group_delay,
            "pole_zero": show_pole_zero,
        },
    }

    design_code = build_design_code(params)
    full_code = build_full_code(params)
    result = execute_code(full_code)

    if "error" in result:
        return json.dumps({
            "error": result["error"],
            "matlab_code": design_code,
        })

    return json.dumps({
        "data": result["data"],
        "matlab_code": design_code,
        "elapsed": result["elapsed"],
    })


# ── Startup & Transport ──

if __name__ == "__main__":
    # Initialize MATLAB engine
    print("Starting MATLAB engine...", flush=True)
    try:
        init_engine()
    except Exception as e:
        print(f"Warning: MATLAB init failed: {e}. Will retry on first tool call.", flush=True)

    if "--http" in sys.argv:
        import uvicorn
        from starlette.applications import Starlette
        from starlette.middleware import Middleware
        from starlette.middleware.cors import CORSMiddleware
        from starlette.requests import Request
        from starlette.responses import JSONResponse
        from starlette.routing import Route, Mount

        async def api_design(request: Request):
            """REST fallback: direct filter design without MCP protocol."""
            try:
                params = await request.json()
                design_code = build_design_code(params)
                full_code = build_full_code(params)
                result = execute_code(full_code)
                if "error" in result:
                    return JSONResponse({"error": result["error"], "matlab_code": design_code}, status_code=400)
                return JSONResponse({"data": result["data"], "matlab_code": design_code, "elapsed": result["elapsed"]})
            except Exception as e:
                return JSONResponse({"error": str(e)}, status_code=500)

        async def api_status(request: Request):
            """REST fallback: MATLAB status check."""
            return JSONResponse(check_status())

        mcp_app = mcp.streamable_http_app()

        # REST routes first, then MCP app mounted at /mcp only
        # Extract the MCP route handler from the mcp_app
        mcp_route_app = None
        for route in mcp_app.routes:
            if hasattr(route, 'path') and route.path == "/mcp":
                mcp_route_app = route.app
                break

        routes = [
            Route("/api/design", api_design, methods=["POST", "OPTIONS"]),
            Route("/api/status", api_status, methods=["GET"]),
        ]

        if mcp_route_app:
            routes.append(Route("/mcp", mcp_route_app, methods=["GET", "POST", "DELETE", "OPTIONS"]))

        app = Starlette(
            routes=routes,
            middleware=[
                Middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]),
            ],
            lifespan=lambda app: mcp.session_manager.run(),
        )

        print("Filter Design MCP server running at http://localhost:8000/mcp", flush=True)
        print("REST fallback at http://localhost:8000/api/design", flush=True)
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    else:
        # Stdio mode (for local testing / Claude Desktop)
        print("Running in stdio mode...", flush=True)
        mcp.run()
