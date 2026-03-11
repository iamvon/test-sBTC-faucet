import { Github, Ship } from "lucide-react";

export function FooterCredit() {
  return (
    <footer className="footer-credit">
      <div className="footer-line">
        <Ship size={14} />
        <span>Built by </span>
        <a href="https://x.com/tuanpmhd" target="_blank" rel="noreferrer">
          tuanpmhd
        </a>
      </div>
      <a
        className="footer-github"
        href="https://github.com/iamvon/test-sBTC-faucet"
        target="_blank"
        rel="noreferrer"
      >
        <Github size={16} />
        <span>GitHub</span>
      </a>
    </footer>
  );
}
