import type { FaucetConfig, FaucetResult } from "../types/faucet";

type ApiError = {
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function fetchFaucetConfig(): Promise<FaucetConfig> {
  const response = await fetch("/api/faucet/config");
  const payload = await parseJson<FaucetConfig & ApiError>(response);
  if (!response.ok) {
    throw new Error(payload.error || "Failed to load faucet configuration.");
  }
  return payload;
}

export async function requestFaucet(recipient: string): Promise<FaucetResult> {
  const response = await fetch("/api/faucet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient }),
  });

  const payload = await parseJson<FaucetResult & ApiError>(response);
  if (!response.ok) {
    throw new Error(payload.error || "Faucet request failed.");
  }

  return payload;
}
