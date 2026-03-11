import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "test-sBTC Faucet",
  description: "Request test-sBTC on Stacks Testnet from a single hosted faucet surface.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
