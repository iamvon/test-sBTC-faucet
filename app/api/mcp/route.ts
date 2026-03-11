import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createFaucetMcpServer } from "../../../src/server/mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function applyCorsHeaders(response: Response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Last-Event-ID, mcp-protocol-version, mcp-session-id"
  );
  response.headers.set("Access-Control-Expose-Headers", "mcp-protocol-version, mcp-session-id");
  return response;
}

async function handleMcpRequest(request: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = createFaucetMcpServer();

  await server.connect(transport);

  try {
    const response = await transport.handleRequest(request);
    return applyCorsHeaders(response);
  } finally {
    await transport.close();
    await server.close();
  }
}

export async function GET(request: Request) {
  return handleMcpRequest(request);
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request);
}

export async function OPTIONS() {
  return applyCorsHeaders(new Response(null, { status: 204 }));
}
