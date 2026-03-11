import { Droplets, Moon, Sun } from "lucide-react";
import type { Theme } from "../types/faucet";

type HeroSectionProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

export function HeroSection({ theme, onToggleTheme }: HeroSectionProps) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="brand-row">
          <Droplets className="brand-mark" size={28} />
          <div>
            <h1>Stacks test-sBTC Faucet</h1>
            <p className="subhead">
              Get free <strong>test-sBTC</strong> for Stacks Testnet development and app testing.
            </p>
          </div>
        </div>
      </div>

      <div className="hero-controls">
        <button className="theme-btn" type="button" aria-label="Toggle theme" onClick={onToggleTheme}>
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </section>
  );
}
