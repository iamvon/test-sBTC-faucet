import { NextResponse } from "next/server";
import {
  fetchFaucetState,
  formatTokenAmount,
  getContractId,
  getExplorerBaseUrl,
  getNodeUrl,
  getSenderAddress,
  getStacksNetwork,
  parseUiAmount,
  requireEnv,
} from "../../../../src/server/faucet";

export async function GET() {
  try {
    const senderAddress = await getSenderAddress();
    const faucetState = await fetchFaucetState(senderAddress);
    const dripAmountRaw = parseUiAmount(requireEnv("FAUCET_UI_AMOUNT", "1"));

    return NextResponse.json({
      network: getStacksNetwork(),
      contractId: getContractId(),
      faucetEnabled: faucetState.faucetEnabled,
      faucetMaxAmountUi: formatTokenAmount(faucetState.faucetMaxAmount),
      dripAmountUi: formatTokenAmount(dripAmountRaw),
      nodeUrl: getNodeUrl(),
      explorerBaseUrl: getExplorerBaseUrl(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load faucet configuration" },
      { status: 500 }
    );
  }
}
