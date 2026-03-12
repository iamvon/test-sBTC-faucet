import type express from "express";
import { getFaucetConfig, sendFaucetDrip } from "../services/faucetService.js";

export function registerHttpRoutes(app: express.Express) {
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
}
