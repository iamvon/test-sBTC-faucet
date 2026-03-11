import { createNetwork } from "@stacks/network";
import {
  broadcastTransaction,
  Cl,
  cvToValue,
  fetchCallReadOnlyFunction,
  getAddressFromPrivateKey,
  makeContractCall,
  validateStacksAddress,
} from "@stacks/transactions";
import { generateWallet } from "@stacks/wallet-sdk";

type NetworkName = "testnet" | "mainnet";

export type FaucetState = {
  faucetEnabled: boolean;
  faucetMaxAmount: bigint;
};

const TOKEN_DECIMALS = 8n;

export function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export function getStacksNetwork(): NetworkName {
  const network = requireEnv("STACKS_NETWORK", "testnet") as NetworkName;
  if (network !== "testnet" && network !== "mainnet") {
    throw new Error('STACKS_NETWORK must be either "testnet" or "mainnet"');
  }
  return network;
}

export function getNodeUrl(): string {
  return requireEnv("STACKS_NODE_URL", "https://api.testnet.hiro.so");
}

export function getContractAddress(): string {
  return requireEnv("STACKS_CONTRACT_ADDRESS");
}

export function getContractName(): string {
  return requireEnv("STACKS_CONTRACT_NAME", "test-sbtc-faucet");
}

export function getContractId(): string {
  return `${getContractAddress()}.${getContractName()}`;
}

export function getNetwork() {
  return createNetwork({
    network: getStacksNetwork(),
    client: { baseUrl: getNodeUrl() },
  });
}

export function parseUiAmount(uiAmount: string): bigint {
  if (!/^\d+(\.\d+)?$/.test(uiAmount)) {
    throw new Error("FAUCET_UI_AMOUNT must be a positive decimal number");
  }

  const [wholePart, fractionalPart = ""] = uiAmount.split(".");
  if (fractionalPart.length > Number(TOKEN_DECIMALS)) {
    throw new Error("FAUCET_UI_AMOUNT supports at most 8 decimal places");
  }

  return BigInt(`${wholePart}${fractionalPart.padEnd(Number(TOKEN_DECIMALS), "0")}`);
}

export function formatTokenAmount(rawAmount: bigint): string {
  const wholePart = rawAmount / 10n ** TOKEN_DECIMALS;
  const fractionPart = (rawAmount % 10n ** TOKEN_DECIMALS)
    .toString()
    .padStart(Number(TOKEN_DECIMALS), "0");
  const trimmedFraction = fractionPart.replace(/0+$/, "");
  return trimmedFraction ? `${wholePart}.${trimmedFraction}` : wholePart.toString();
}

function parseReadOnlyValue(cv: unknown): string | bigint | boolean {
  const parsed = cvToValue(cv as never);
  if (!parsed || typeof parsed !== "object" || !("value" in parsed)) {
    throw new Error("Unexpected read-only response shape from contract");
  }
  return parsed.value as string | bigint | boolean;
}

export async function resolveSenderKey(): Promise<string> {
  const privateKey = process.env.STACKS_FAUCET_PRIVATE_KEY || "";
  if (privateKey) {
    return privateKey;
  }

  const mnemonic = requireEnv("STACKS_FAUCET_MNEMONIC");
  const wallet = await generateWallet({
    secretKey: mnemonic,
    password: "",
  });
  return wallet.accounts[0].stxPrivateKey;
}

export async function getSenderAddress(): Promise<string> {
  const senderKey = await resolveSenderKey();
  return getAddressFromPrivateKey(senderKey, getNetwork());
}

export async function fetchFaucetState(senderAddress: string): Promise<FaucetState> {
  const network = getNetwork();
  const [enabledCv, maxAmountCv] = await Promise.all([
    fetchCallReadOnlyFunction({
      contractAddress: getContractAddress(),
      contractName: getContractName(),
      functionName: "is-faucet-enabled",
      functionArgs: [],
      senderAddress,
      network,
    }),
    fetchCallReadOnlyFunction({
      contractAddress: getContractAddress(),
      contractName: getContractName(),
      functionName: "get-faucet-max-amount",
      functionArgs: [],
      senderAddress,
      network,
    }),
  ]);

  return {
    faucetEnabled: Boolean(parseReadOnlyValue(enabledCv)),
    faucetMaxAmount: BigInt(parseReadOnlyValue(maxAmountCv)),
  };
}

export function getExplorerBaseUrl(): string {
  return "https://explorer.hiro.so";
}

export function getExplorerTxUrl(txid: string): string {
  const chain = getStacksNetwork() === "mainnet" ? "mainnet" : "testnet";
  return `${getExplorerBaseUrl()}/txid/${txid}?chain=${chain}`;
}

export function validateRecipient(recipient: string): void {
  if (!validateStacksAddress(recipient)) {
    throw new Error(`Invalid Stacks address: ${recipient}`);
  }
}

export async function broadcastFaucetMint(recipient: string, amount: bigint) {
  const network = getNetwork();
  const senderKey = await resolveSenderKey();

  const transaction = await makeContractCall({
    contractAddress: getContractAddress(),
    contractName: getContractName(),
    functionName: "faucet-mint",
    functionArgs: [Cl.uint(amount), Cl.principal(recipient)],
    senderKey,
    network,
  });

  const broadcastResult = await broadcastTransaction({ transaction, network });
  if ("error" in broadcastResult) {
    throw new Error(broadcastResult.reason || "Stacks node rejected the transaction");
  }

  return {
    txid: broadcastResult.txid,
    explorerUrl: getExplorerTxUrl(broadcastResult.txid),
    recipient,
    amountUi: formatTokenAmount(amount),
  };
}
