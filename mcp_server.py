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
FILTER_UI_PATH = Path(__file__).parent / "dist" / "ui" / "mcp-app.html"


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


# ── Tool 2: run-filter-design (app only — hidden from model) ──

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
        # HTTP mode: for web access, HTTPS via ngrok
        from starlette.applications import Starlette
        from starlette.middleware import Middleware
        from starlette.middleware.cors import CORSMiddleware
        from starlette.routing import Route
        import uvicorn

        original_app = mcp.streamable_http_app()

        # Workaround: FastMCP creates routes with GET/HEAD only.
        # MCP protocol needs POST/DELETE/OPTIONS too.
        fixed_routes = []
        for route in original_app.routes:
            if isinstance(route, Route) and route.path == "/mcp":
                fixed_routes.append(
                    Route(
                        route.path,
                        endpoint=route.app,
                        methods=["GET", "POST", "DELETE", "OPTIONS"],
                        name=route.name,
                    )
                )
            else:
                fixed_routes.append(route)

        cors_middleware = [
            Middleware(
                CORSMiddleware,
                allow_origins=["*"],
                allow_methods=["*"],
                allow_headers=["*"],
            )
        ]

        app = Starlette(
            debug=original_app.debug,
            routes=fixed_routes,
            middleware=cors_middleware + list(original_app.user_middleware),
            lifespan=lambda app: mcp.session_manager.run(),
        )

        print("Filter Design MCP server running at http://localhost:8000/mcp", flush=True)
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    else:
        # Stdio mode (for local testing / Claude Desktop)
        print("Running in stdio mode...", flush=True)
        mcp.run()
