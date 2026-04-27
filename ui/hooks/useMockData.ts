/**
 * Data fetching utilities.
 * - Preview mode: hits Flask server on localhost:3000
 * - Production fallback: hits MCP server's REST endpoint via relative /api/
 */

import type { FilterConfig, FilterResult } from "../types";

const FLASK_API = "http://localhost:3000/api";

export async function fetchDesign(config: FilterConfig): Promise<FilterResult> {
  const resp = await fetch(`${FLASK_API}/design`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  const json = await resp.json();

  if (!resp.ok) {
    throw new Error(json.error || "Design failed");
  }

  return json as FilterResult;
}

/**
 * Fallback: call the REST endpoint on the MCP server directly.
 * Used when app.callServerTool fails (web client session bug).
 * The base URL is derived from the page's origin or the MCP server URL.
 */
export async function fetchDesignFallback(config: FilterConfig, serverUrl?: string): Promise<FilterResult> {
  // Try to derive the API URL from the MCP server
  // In production, the iframe is served from the MCP host, but we can try the ngrok URL
  const baseUrls = [
    serverUrl,
    "https://matlab-mcp-app.ngrok.app",
    "http://localhost:8000",
    "http://localhost:3000",
  ].filter(Boolean);

  let lastError: Error | null = null;

  for (const base of baseUrls) {
    try {
      const resp = await fetch(`${base}/api/design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const json = await resp.json();

      if (!resp.ok) {
        throw new Error(json.error || "Design failed");
      }

      return json as FilterResult;
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error("All fallback endpoints failed");
}

export async function fetchStatus(): Promise<{
  connected: boolean;
  version?: string;
  pid?: number;
}> {
  try {
    const resp = await fetch(`${FLASK_API}/status`);
    return await resp.json();
  } catch {
    return { connected: false };
  }
}

export function createMockApp() {
  return {
    callServerTool: async (_name: string, params: FilterConfig) => {
      const result = await fetchDesign(params);
      return { isError: false, content: [{ type: "text", text: JSON.stringify(result) }] };
    },
    updateModelContext: async () => {},
    requestDisplayMode: () => {},
  } as any;
}
