/**
 * Preview mode: fetches from Flask server or returns mock data.
 * In preview mode, the Run button hits the Flask API at localhost:3000.
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
