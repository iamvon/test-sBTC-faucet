# Express MCP Server

This subproject is a dedicated Express-based MCP server for GitBook Assistant and other hosted MCP clients.

## Why this exists

The Next.js `app/api` route version was a poor fit for GitBook's MCP handshake. This Express server works because it supports both:

- modern Streamable HTTP MCP
- legacy SSE-style MCP compatibility used by GitBook's GET-first client flow

## Endpoints

- `GET /api/health`
- `GET /api/faucet/config`
- `POST /api/faucet/request`
- `GET /api/mcp`
- `POST /api/mcp`
- `POST /api/mcp/messages?sessionId=...`

## MCP tools

- `get_testnet_sbtc_help`
- `get_faucet_config`
- `validate_recipient`
- `get_testnet_sbtc_faucet`

## Local development

1. Install dependencies:

```bash
cd express-mcp
yarn install
```

2. Copy the same faucet environment variables used by the main Next app.

Required env vars:

- `STACKS_NETWORK`
- `STACKS_NODE_URL`
- `STACKS_CONTRACT_ADDRESS`
- `STACKS_CONTRACT_NAME`
- `STACKS_FAUCET_MNEMONIC` or `STACKS_FAUCET_PRIVATE_KEY`
- `FAUCET_UI_AMOUNT`

3. Run locally:

```bash
yarn run start
```

or with Vercel's local runtime:

```bash
yarn run dev
```

4. Test the MCP endpoint:

```bash
curl -i http://localhost:3000/api/mcp \
  -H "Accept: text/event-stream"
```

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Vercel deployment

Create a separate project for this folder and set the Root Directory to `express-mcp`.

Recommended runtimes:

- Railway
- Render
- Fly.io

Vercel may still be fragile for this MCP transport flow because GitBook opens long-lived GET/SSE requests first.

After deploy, your MCP URL will be:

```text
https://your-vercel-project.vercel.app/api/mcp
```

For Railway or Render, replace the hostname with your deployed service URL.
