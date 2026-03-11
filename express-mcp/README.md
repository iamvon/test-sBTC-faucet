# Express MCP Server

This subproject is a dedicated Express-based MCP server for GitBook Assistant and other hosted MCP clients.

## Why this exists

The Next.js `app/api` route version is a poor fit for long-lived MCP transport behavior on Vercel. This Express server follows Vercel's documented MCP + Express pattern instead.

## Endpoints

- `GET /api/health`
- `GET /api/faucet/config`
- `POST /api/faucet/request`
- `POST /api/mcp`

## MCP tools

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
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Vercel deployment

Create a separate Vercel project for this folder and set the Root Directory to `express-mcp`.

After deploy, your MCP URL will be:

```text
https://your-vercel-project.vercel.app/api/mcp
```
