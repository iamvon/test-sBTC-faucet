"use client";

import { useEffect, useState } from "react";
import { FooterCredit } from "../src/components/FooterCredit";
import { HeroSection } from "../src/components/HeroSection";
import { RequestPanel } from "../src/components/RequestPanel";
import { fetchFaucetConfig, requestFaucet } from "../src/lib/api";
import type { FaucetConfig, FaucetResult, Theme } from "../src/types/faucet";

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [recipient, setRecipient] = useState("");
  const [config, setConfig] = useState<FaucetConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<FaucetResult | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let ignore = false;

    async function loadConfig() {
      setIsLoadingConfig(true);
      setConfigError("");
      try {
        const payload = await fetchFaucetConfig();
        if (!ignore) setConfig(payload);
      } catch (error) {
        if (!ignore) {
          setConfigError(error instanceof Error ? error.message : "Failed to load faucet configuration.");
        }
      } finally {
        if (!ignore) setIsLoadingConfig(false);
      }
    }

    void loadConfig();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setResult(null);

    const trimmedRecipient = recipient.trim();
    if (!trimmedRecipient) {
      setSubmitError("Enter a Stacks Testnet wallet address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = await requestFaucet(trimmedRecipient);
      setResult(payload);
      setRecipient("");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Faucet request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <HeroSection
        theme={theme}
        onToggleTheme={() => setTheme(current => (current === "light" ? "dark" : "light"))}
      />
      <main className="request-shell">
        <RequestPanel
          recipient={recipient}
          config={config}
          isLoadingConfig={isLoadingConfig}
          configError={configError}
          isSubmitting={isSubmitting}
          submitError={submitError}
          result={result}
          onRecipientChange={setRecipient}
          onSubmit={handleSubmit}
        />
      </main>
      <FooterCredit />
    </div>
  );
}
