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

  const handleFaucetClaim = async ({
    recipient,
    confirm,
  }: {
    recipient: string;
    confirm: boolean;
  }) => {
    if (!confirm) {
      throw new Error("User confirmation is required before requesting faucet test-sBTC.");
    }

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
  };

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
    "get_testnet_sbtc_faucet",
    {
      title: "Get testnet sBTC faucet",
      description:
        "Use this when the user asks how to get testnet sBTC, wants free test-sBTC, asks for the sBTC faucet, or wants faucet tokens sent to their Stacks address. First collect their Stacks address and confirmation, then send the faucet drip amount. Do not use for general sBTC documentation or troubleshooting.",
      inputSchema: {
        recipient: z.string().min(1).describe("Stacks recipient address"),
        confirm: z
          .boolean()
          .describe("Must be true only after the user explicitly confirms they want to get free test-sBTC now."),
      },
    },
    handleFaucetClaim
  );

  return server;
}
