import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getFaucetConfig, sendFaucetDrip, validateRecipient } from "../services/faucetService.js";
import { faucetClaimSchema, validateRecipientSchema } from "./schemas.js";

export function createServer() {
  const server = new McpServer({
    name: "test-sbtc-faucet-express-mcp",
    version: "0.1.0",
  });
  const unsafeServer = server as any;

  server.tool("get_testnet_sbtc_help", async () => {
    try {
      const config = await getFaucetConfig();
      return {
        content: [
          {
            type: "text",
            text:
              `Use this faucet to get testnet sBTC.\n\n` +
              `Current faucet status: ${config.faucetEnabled ? "enabled" : "disabled"}.\n` +
              `Drip amount: ${config.dripAmountUi} sBTC.\n` +
              `Maximum faucet amount: ${config.faucetMaxAmountUi} sBTC.\n` +
              `Network: ${config.network}.\n` +
              `Contract: ${config.contractId}.\n\n` +
              `If the user wants tokens, ask for their testnet Stacks address. ` +
              `After they provide it and confirm, use get_testnet_sbtc_faucet.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : "Failed to load testnet sBTC faucet help",
          },
        ],
        isError: true,
      };
    }
  });

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
