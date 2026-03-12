import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type express from "express";
import { registerHttpRoutes } from "./routes/http.js";
import { handleLegacyMessage, handleLegacySse, handleStreamableMcp } from "./mcp/transports.js";

const app = createMcpExpressApp({
  host: "0.0.0.0",
});
registerHttpRoutes(app);
app.get("/api/mcp", handleLegacySse);
app.post("/api/mcp", handleStreamableMcp);
app.delete("/api/mcp", handleStreamableMcp);
app.post("/api/mcp/messages", handleLegacyMessage);

app.options("/api/mcp", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Last-Event-ID, mcp-protocol-version, mcp-session-id"
  );
  res.setHeader("Access-Control-Expose-Headers", "mcp-protocol-version, mcp-session-id");
  res.status(204).end();
});

app.options("/api/mcp/messages", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(204).end();
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[express-mcp] unhandled error", error);
  res.status(500).json({
    error: error instanceof Error ? error.message : "Internal server error",
  });
});

const port = Number(process.env.PORT || 3000);

if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`test-sBTC Express MCP server listening on http://localhost:${port}`);
  });
}

export default app;
