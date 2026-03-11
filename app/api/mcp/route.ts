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

function logRequest(request: Request) {
  console.log("[mcp] request", {
    method: request.method,
    url: request.url,
    accept: request.headers.get("accept"),
    contentType: request.headers.get("content-type"),
    mcpProtocolVersion: request.headers.get("mcp-protocol-version"),
    mcpSessionId: request.headers.get("mcp-session-id"),
    lastEventId: request.headers.get("last-event-id"),
    userAgent: request.headers.get("user-agent"),
  });
}

async function handleMcpRequest(request: Request) {
  logRequest(request);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = createFaucetMcpServer();

  await server.connect(transport);

  const response = await transport.handleRequest(request);
  return applyCorsHeaders(response);
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
