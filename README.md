# test-sBTC Faucet

A lightweight Stacks testnet faucet UI for requesting `test-sBTC` from the `test-sbtc-faucet` Clarity contract in <a href="https://github.com/iamvon/test-sBTC-contract" target="_blank" rel="noreferrer">test-sBTC-contract</a>.

## Product Preview

<table>
  <tr>
    <td align="center" width="50%">
      <img src="./docs/images/test-sbtc-faucet-light-mode.png" alt="test-sBTC Faucet in light mode" />
      <br />
      <sub>Light mode</sub>
    </td>
    <td align="center" width="50%">
      <img src="./docs/images/test-sbtc-faucet-dark-mode.png" alt="test-sBTC Faucet in dark mode" />
      <br />
      <sub>Dark mode</sub>
    </td>
  </tr>
</table>

## GitBook AI Assistant sBTC Faucet MCP Demo

https://github.com/user-attachments/assets/40648538-b476-4dc1-91f0-8715db5dd410

GitBook AI Assistant using the sBTC Faucet MCP server to help Stacks builders discover the faucet, validate a testnet address, and request test-sBTC directly from the docs experience.

## Setup

1. Use Node `18.18+` or Node `20`
2. Copy `.env.example` to `.env.local`
3. Set `STACKS_FAUCET_MNEMONIC` or `STACKS_FAUCET_PRIVATE_KEY`
4. Install dependencies:

```bash
npm install
```

5. Run the app:

```bash
npm run dev
```

The UI and API routes run from the same Next.js app.

## MCP Server

The GitBook-compatible MCP server now lives in the dedicated Express subproject at [./express-mcp](./express-mcp).

Use that server, not the main Next.js app, for GitBook Assistant or other hosted MCP clients.

See [./express-mcp/README.md](./express-mcp/README.md) for setup and deployment.

Important: the faucet currently has no rate limit or CAPTCHA. Do not expose the MCP faucet tool publicly without abuse controls.

## Environment

- `STACKS_NETWORK`: `testnet` or `mainnet`
- `STACKS_NODE_URL`: Stacks API base URL
- `STACKS_CONTRACT_ADDRESS`: deployed contract address
- `STACKS_CONTRACT_NAME`: contract name
- `STACKS_FAUCET_MNEMONIC`: server-side faucet mnemonic
- `STACKS_FAUCET_PRIVATE_KEY`: optional alternative to mnemonic
- `FAUCET_UI_AMOUNT`: drip amount shown in the UI and sent on-chain

## Notes

- End users only enter a recipient address.
- The faucet signer remains server-side in Next route handlers.
- The API does a live read-only preflight before broadcasting.
- Never expose the faucet mnemonic through `NEXT_PUBLIC_*` variables.

## License

MIT
