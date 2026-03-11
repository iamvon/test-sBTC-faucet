import type { FormEvent } from "react";
import Image from "next/image";
import { ArrowUpRight, CircleAlert, Droplets, LoaderCircle, ShieldCheck, Wallet } from "lucide-react";
import type { FaucetConfig, FaucetResult } from "../types/faucet";

type RequestPanelProps = {
  recipient: string;
  config: FaucetConfig | null;
  isLoadingConfig: boolean;
  configError: string;
  isSubmitting: boolean;
  submitError: string;
  result: FaucetResult | null;
  onRecipientChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function RequestPanel({
  recipient,
  config,
  isLoadingConfig,
  configError,
  isSubmitting,
  submitError,
  result,
  onRecipientChange,
  onSubmit,
}: RequestPanelProps) {
  const ctaLabel = isSubmitting
    ? "Submitting faucet request"
    : config
      ? `Request ${config.dripAmountUi} test-sBTC`
      : "Request test-sBTC";

  return (
    <section className="panel request-panel">
      <div className="section-head">
        <div className="section-title-row">
          <Image src="/logos/sBTC.svg" alt="test-sBTC token" width={20} height={20} />
          <p className="m-0 text-sm font-semibold text-[var(--text)]">Request test-sBTC</p>
        </div>
        <p className="section-subhead">
          Enter your Stacks Testnet address from{" "}
          <a className="inline-link" href="https://leather.io" target="_blank" rel="noreferrer">
            Leather
          </a>{" "}
          or{" "}
          <a className="inline-link" href="https://www.xverse.app" target="_blank" rel="noreferrer">
            Xverse
          </a>{" "}
          to request test-sBTC.
        </p>
      </div>

      <form className="form-block" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="recipient">Stacks address</label>
          <input
            id="recipient"
            autoComplete="off"
            spellCheck={false}
            placeholder="ST2..."
            value={recipient}
            onChange={event => onRecipientChange(event.target.value)}
          />
        </div>

        <div className="summary-row">
          <div className="status wallet-feedback">
            <div className="inline-flex items-center gap-2 font-semibold">
              <Wallet size={16} />
              Faucet drip
            </div>
            <div className="mt-2 text-sm text-[var(--muted)]">
              {isLoadingConfig && "Loading faucet configuration..."}
              {!isLoadingConfig && config && (
                <>{`You can request ${config.dripAmountUi} test-sBTC each time.`}</>
              )}
              {!isLoadingConfig && !config && "Configuration unavailable."}
            </div>
          </div>

          <button className="btn" type="submit" disabled={isSubmitting || isLoadingConfig || !config}>
            {isSubmitting ? <LoaderCircle className="spin" size={16} /> : <Droplets size={16} />}
            {ctaLabel}
          </button>
        </div>
      </form>

      {configError ? (
        <div className="status error">
          <div className="inline-flex items-center gap-2 font-semibold">
            <CircleAlert size={16} />
            Backend unavailable
          </div>
          <div className="mt-2 text-sm">{configError}</div>
        </div>
      ) : null}

      {submitError ? (
        <div className="status error">
          <div className="inline-flex items-center gap-2 font-semibold">
            <CircleAlert size={16} />
            Request failed
          </div>
          <div className="mt-2 text-sm">{submitError}</div>
        </div>
      ) : null}

      {result ? (
        <div className="status ok">
          <div className="inline-flex items-center gap-2 font-semibold">
            <ShieldCheck size={16} />
            Faucet transaction submitted
          </div>
          <div className="mt-2 text-sm">
            Sent {result.amountUi} test-sBTC to <span className="mono">{result.recipient}</span>.
          </div>
          <a className="hash-link mt-3 inline-flex items-center gap-1.5" href={result.explorerUrl} target="_blank" rel="noreferrer">
            View transaction {result.txid.slice(0, 10)}...
            <ArrowUpRight size={14} />
          </a>
        </div>
      ) : null}
    </section>
  );
}
