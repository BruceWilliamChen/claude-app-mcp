import { createServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { randomUUID } from "crypto";

const server = createServer();

const useStdio = process.argv.includes("--stdio");

if (useStdio) {
  // stdio transport: Claude Desktop launches this as a subprocess
  const transport = new StdioServerTransport();
  await server.connect(transport);
} else {
  // HTTP transport: for development and testing
  const app = express();
  app.use(express.json());

  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.all("/mcp", async (req, res) => {
    console.log(`[${req.method}] /mcp body:`, JSON.stringify(req.body)?.slice(0, 200));
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (req.method === "GET" || req.method === "POST") {
      let transport = sessionId ? transports.get(sessionId) : undefined;

      if (!transport) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            transports.set(id, transport!);
          },
        });
        const serverInstance = createServer();
        await serverInstance.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);
    } else if (req.method === "DELETE" && sessionId) {
      const transport = transports.get(sessionId);
      if (transport) {
        await transport.close();
        transports.delete(sessionId);
      }
      res.status(200).end();
    } else {
      res.status(405).end();
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`MCP server listening on http://localhost:${port}/mcp`);
  });
}
