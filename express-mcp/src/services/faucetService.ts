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
} from "../faucet.js";

export async function getFaucetConfig() {
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

export async function sendFaucetDrip(recipient: string) {
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

export { validateRecipient };
