import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type express from "express";
import { randomUUID } from "node:crypto";
import { createServer } from "./server.js";

export type SupportedTransport = StreamableHTTPServerTransport | SSEServerTransport;

export const transports: Record<string, SupportedTransport> = {};

function getSessionId(headerValue: string | string[] | undefined) {
  return Array.isArray(headerValue) ? headerValue[0] : headerValue;
}

export async function handleStreamableMcp(req: express.Request, res: express.Response) {
  console.log("[express-mcp] request", {
    method: req.method,
    url: req.originalUrl,
    accept: req.headers.accept,
    contentType: req.headers["content-type"],
    mcpProtocolVersion: req.headers["mcp-protocol-version"],
    mcpSessionId: req.headers["mcp-session-id"],
    lastEventId: req.headers["last-event-id"],
  });

  try {
    const sessionId = getSessionId(req.headers["mcp-session-id"]);
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId] instanceof StreamableHTTPServerTransport) {
      transport = transports[sessionId] as StreamableHTTPServerTransport;
    } else if (!sessionId && req.method === "POST" && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: generatedSessionId => {
          transports[generatedSessionId] = transport;
        },
        onsessionclosed: closedSessionId => {
          delete transports[closedSessionId];
        },
      });

      const server = createServer();
      await server.connect(transport);

      transport.onclose = () => {
        const currentId = transport.sessionId;
        if (currentId) {
          delete transports[currentId];
        }
        void server.close().catch(error => {
          console.error("[express-mcp] failed to close server", error);
        });
      };
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("[express-mcp] handler error", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal MCP server error",
        },
        id: null,
      });
    }
  }
}

export async function handleLegacySse(req: express.Request, res: express.Response) {
  console.log("[express-mcp] legacy sse request", {
    method: req.method,
    url: req.originalUrl,
    accept: req.headers.accept,
  });

  try {
    const transport = new SSEServerTransport("/api/mcp/messages", res);
    transports[transport.sessionId] = transport;

    res.on("close", () => {
      delete transports[transport.sessionId];
    });

    const server = createServer();
    await server.connect(transport);
  } catch (error) {
    console.error("[express-mcp] legacy sse error", error);
    if (!res.headersSent) {
      res.status(500).send(error instanceof Error ? error.message : "Internal server error");
    }
  }
}

export async function handleLegacyMessage(req: express.Request, res: express.Response) {
  const sessionIdValue = req.query.sessionId;
  const sessionId =
    typeof sessionIdValue === "string"
      ? sessionIdValue
      : Array.isArray(sessionIdValue) && typeof sessionIdValue[0] === "string"
        ? sessionIdValue[0]
        : undefined;

  console.log("[express-mcp] legacy message request", {
    method: req.method,
    url: req.originalUrl,
    sessionId,
  });

  if (!sessionId) {
    res.status(400).send("Missing sessionId");
    return;
  }

  const transport = transports[sessionId];
  if (!(transport instanceof SSEServerTransport)) {
    res.status(400).send("No SSE transport found for sessionId");
    return;
  }

  try {
    await transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error("[express-mcp] legacy message error", error);
    if (!res.headersSent) {
      res.status(500).send(error instanceof Error ? error.message : "Internal server error");
    }
  }
}
