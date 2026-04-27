import { useState } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { FilterResult, ConfigureFilterOutput } from "../types";

type DisplayMode = "inline" | "fullscreen";

export function useMcpToolResult() {
  const [result, setResult] = useState<FilterResult | null>(null);
  const [initialConfig, setInitialConfig] = useState<ConfigureFilterOutput | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("inline");

  const { app, isConnected, error } = useApp({
    appInfo: { name: "Filter Design", version: "1.0.0" },
    capabilities: {
      availableDisplayModes: ["inline", "fullscreen"],
    },
    onAppCreated: (app) => {
      app.ontoolresult = (toolResult: any) => {
        try {
          const text = (toolResult.content as { type: string; text: string }[])?.find(
            (c) => c.type === "text"
          )?.text;
          if (text) {
            const parsed = JSON.parse(text);
            // Check if this is a configure-filter result (has config field)
            if (parsed.config) {
              setInitialConfig(parsed as ConfigureFilterOutput);
            }
            // Check if this is a run-filter-design result (has data field)
            if (parsed.data) {
              setResult(parsed as FilterResult);
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      app.onhostcontextchanged = (ctx: any) => {
        if (ctx.displayMode) {
          setDisplayMode(ctx.displayMode);
        }
      };
    },
  });

  const isLoading = isConnected && !initialConfig && !error;

  return {
    result,
    setResult,
    initialConfig,
    isConnected,
    error,
    app,
    displayMode,
    isLoading,
  };
}
