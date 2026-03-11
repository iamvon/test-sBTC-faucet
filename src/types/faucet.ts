export type Theme = "light" | "dark";

export type FaucetConfig = {
  network: string;
  contractId: string;
  faucetEnabled: boolean;
  faucetMaxAmountUi: string;
  dripAmountUi: string;
  nodeUrl: string;
  explorerBaseUrl: string;
};

export type FaucetResult = {
  txid: string;
  explorerUrl: string;
  recipient: string;
  amountUi: string;
};
