import { NextRequest, NextResponse } from "next/server";
import {
  broadcastFaucetMint,
  fetchFaucetState,
  formatTokenAmount,
  getSenderAddress,
  parseUiAmount,
  requireEnv,
  validateRecipient,
} from "../../../src/server/faucet";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { recipient?: string };
    const recipient = String(body?.recipient || "").trim();

    if (!recipient) {
      return NextResponse.json({ error: "Recipient is required" }, { status: 400 });
    }

    validateRecipient(recipient);

    const senderAddress = await getSenderAddress();
    const faucetState = await fetchFaucetState(senderAddress);
    const dripAmountRaw = parseUiAmount(requireEnv("FAUCET_UI_AMOUNT", "1"));

    if (!faucetState.faucetEnabled) {
      return NextResponse.json({ error: "Faucet is disabled on-chain" }, { status: 400 });
    }

    if (dripAmountRaw > faucetState.faucetMaxAmount) {
      return NextResponse.json(
        {
          error: `Configured drip ${formatTokenAmount(dripAmountRaw)} exceeds faucet max ${formatTokenAmount(faucetState.faucetMaxAmount)}`,
        },
        { status: 400 }
      );
    }

    const result = await broadcastFaucetMint(recipient, dripAmountRaw);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Faucet request failed" },
      { status: 500 }
    );
  }
}
