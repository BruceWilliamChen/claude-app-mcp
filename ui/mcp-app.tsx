import { useState } from "react";
import { createRoot } from "react-dom/client";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { ConfiguratorToolOutput } from "./types";

function App() {
  const [message, setMessage] = useState<string | null>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: "noise-filter-configurator", version: "0.1.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = (result) => {
        const text = result.content.find((c: { type: string }) => c.type === "text");
        if (text && "text" in text) {
          const data = JSON.parse(text.text) as ConfiguratorToolOutput;
          setMessage(data.message);
        }
      };
    },
  });

  if (error) return <div>Error: {error.message}</div>;
  if (!isConnected) return <div>Connecting...</div>;

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>Noise Filter Configurator</h2>
      <p>{message ?? "Hello World"}</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
