import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { ConfiguratorToolOutput } from "../ui/types.js";

const RESOURCE_URI = "ui://configurator";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "noise-filter-configurator",
    version: "0.1.0",
  });

  // Tool: open-configurator
  // Claude calls this to open the app UI
  registerAppTool(server, "open-configurator", {
    title: "Open Configurator",
    description: "Open the noise filter configurator UI",
    inputSchema: {
      message: z.string().optional().describe("Optional greeting message"),
    },
    _meta: {
      ui: { resourceUri: RESOURCE_URI },
    },
  }, async ({ message }) => {
    const output: ConfiguratorToolOutput = {
      message: message ?? "Hello World",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
    };
  });

  // Resource: the built UI HTML
  // Claude fetches this when rendering the tool's UI
  registerAppResource(server, "configurator", RESOURCE_URI, {
    description: "The noise filter configurator interface",
  }, async () => {
    const htmlPath = resolve(process.cwd(), "dist/ui/mcp-app.html");
    const html = readFileSync(htmlPath, "utf-8");
    return {
      contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html }],
    };
  });

  return server;
}
