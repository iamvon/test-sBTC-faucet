import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
} from "./faucet";

function createTextContent(text: string) {
  return [{ type: "text" as const, text }];
}

export function createFaucetMcpServer() {
  const server = new McpServer({
    name: "test-sbtc-faucet-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "get_faucet_config",
    {
      title: "Get faucet configuration",
      description: "Return the current test-sBTC faucet network, contract, drip amount, and on-chain faucet status.",
    },
    async () => {
      const senderAddress = await getSenderAddress();
      const faucetState = await fetchFaucetState(senderAddress);
      const dripAmountRaw = parseUiAmount(requireEnv("FAUCET_UI_AMOUNT", "1"));

      const result = {
        network: getStacksNetwork(),
        contractId: getContractId(),
        faucetEnabled: faucetState.faucetEnabled,
        faucetMaxAmountUi: formatTokenAmount(faucetState.faucetMaxAmount),
        dripAmountUi: formatTokenAmount(dripAmountRaw),
        nodeUrl: getNodeUrl(),
        explorerBaseUrl: getExplorerBaseUrl(),
        senderAddress,
      };

      return {
        content: createTextContent(JSON.stringify(result, null, 2)),
        structuredContent: result,
      };
    }
  );

  server.registerTool(
    "validate_recipient",
    {
      title: "Validate recipient",
      description: "Validate whether a Stacks address can receive faucet test-sBTC.",
      inputSchema: {
        recipient: z.string().min(1).describe("Stacks recipient address"),
      },
    },
    async ({ recipient }) => {
      validateRecipient(recipient);
      const result = { recipient, valid: true };

      return {
        content: createTextContent(`${recipient} is a valid Stacks recipient address.`),
        structuredContent: result,
      };
    }
  );

  server.registerTool(
    "request_test_sbtc",
    {
      title: "Request test-sBTC",
      description: "Send the configured faucet drip amount of test-sBTC to a Stacks recipient address.",
      inputSchema: {
        recipient: z.string().min(1).describe("Stacks recipient address"),
      },
    },
    async ({ recipient }) => {
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

      const result = await broadcastFaucetMint(recipient, dripAmountRaw);

      return {
        content: createTextContent(
          `Sent ${result.amountUi} test-sBTC to ${result.recipient}. Transaction: ${result.explorerUrl}`
        ),
        structuredContent: result,
      };
    }
  );

  return server;
}
