import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type express from "express";
import { z } from "zod";
import {
  broadcastFaucetMint,
  fetchFaucetState,
  formatTokenAmount,
  getContractId,
  getExplorerBaseUrl,
  getNodeUrl,
  getSenderAddress,
  getStacksNetwork,
  parseUiAmount,
  requireEnv,
  validateRecipient,
} from "./faucet.js";

const validateRecipientSchema = {
  recipient: z.string().min(1).describe("Stacks recipient address"),
} as Record<string, z.ZodTypeAny>;

const faucetClaimSchema = {
  recipient: z.string().min(1).describe("Stacks recipient address"),
  confirm: z
    .boolean()
    .describe("Must be true only after the user explicitly confirms they want to get free test-sBTC now."),
} as Record<string, z.ZodTypeAny>;

const app = createMcpExpressApp({
  host: "0.0.0.0",
});

async function getFaucetConfig() {
  const senderAddress = await getSenderAddress();
  const faucetState = await fetchFaucetState(senderAddress);
  const dripAmountRaw = parseUiAmount(requireEnv("FAUCET_UI_AMOUNT", "1"));

  return {
    network: getStacksNetwork(),
    contractId: getContractId(),
    faucetEnabled: faucetState.faucetEnabled,
    faucetMaxAmountUi: formatTokenAmount(faucetState.faucetMaxAmount),
    dripAmountUi: formatTokenAmount(dripAmountRaw),
    nodeUrl: getNodeUrl(),
    explorerBaseUrl: getExplorerBaseUrl(),
    senderAddress,
  };
}

async function sendFaucetDrip(recipient: string) {
  validateRecipient(recipient);

  const senderAddress = await getSenderAddress();
  const faucetState = await fetchFaucetState(senderAddress);
  const dripAmountRaw = parseUiAmount(requireEnv("FAUCET_UI_AMOUNT", "1"));

  if (!faucetState.faucetEnabled) {
    throw new Error("Faucet is disabled on-chain");
  }

  if (dripAmountRaw > faucetState.faucetMaxAmount) {
    throw new Error(
      `Configured drip ${formatTokenAmount(dripAmountRaw)} exceeds faucet max ${formatTokenAmount(faucetState.faucetMaxAmount)}`
    );
  }

  return broadcastFaucetMint(recipient, dripAmountRaw);
}

app.get("/", (_req, res) => {
  res.json({
    name: "test-sbtc-faucet-express-mcp",
    status: "ok",
    mcpUrl: "/api/mcp",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/faucet/config", async (_req, res) => {
  try {
    res.json(await getFaucetConfig());
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load faucet configuration",
    });
  }
});

app.post("/api/faucet/request", async (req, res) => {
  try {
    const recipient = String(req.body?.recipient || "").trim();

    if (!recipient) {
      res.status(400).json({ error: "Recipient is required" });
      return;
    }

    const result = await sendFaucetDrip(recipient);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Faucet request failed",
    });
  }
});

function createServer() {
  const server = new McpServer({
    name: "test-sbtc-faucet-express-mcp",
    version: "0.1.0",
  });
  const unsafeServer = server as any;

  server.tool("get_faucet_config", async () => {
    try {
      const config = await getFaucetConfig();
      return {
        content: [{ type: "text", text: JSON.stringify(config, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : "Failed to load faucet configuration",
          },
        ],
        isError: true,
      };
    }
  });

  unsafeServer.tool(
    "validate_recipient",
    validateRecipientSchema,
    async ({ recipient }: { recipient: string }) => {
      try {
        validateRecipient(recipient);
        return {
          content: [{ type: "text", text: `${recipient} is a valid Stacks recipient address.` }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : "Invalid recipient",
            },
          ],
          isError: true,
        };
      }
    }
  );

  unsafeServer.tool(
    "get_testnet_sbtc_faucet",
    faucetClaimSchema,
    async ({ recipient, confirm }: { recipient: string; confirm: boolean }) => {
      if (!confirm) {
        return {
          content: [
            {
              type: "text",
              text: "User confirmation is required before requesting faucet test-sBTC.", 
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await sendFaucetDrip(recipient);
        return {
          content: [
            {
              type: "text",
              text: `Sent ${result.amountUi} test-sBTC to ${result.recipient}. Transaction: ${result.explorerUrl}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : "Faucet request failed",
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

async function handleMcp(req: express.Request, res: express.Response) {
  console.log("[express-mcp] request", {
    method: req.method,
    url: req.originalUrl,
    accept: req.headers.accept,
    contentType: req.headers["content-type"],
    mcpProtocolVersion: req.headers["mcp-protocol-version"],
    mcpSessionId: req.headers["mcp-session-id"],
    lastEventId: req.headers["last-event-id"],
  });

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on("close", () => {
      void transport.close().catch(error => {
        console.error("[express-mcp] failed to close transport", error);
      });
      void server.close().catch(error => {
        console.error("[express-mcp] failed to close server", error);
      });
    });
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

app.post("/api/mcp", handleMcp);
app.get("/api/mcp", handleMcp);
app.delete("/api/mcp", handleMcp);

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
