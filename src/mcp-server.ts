#!/usr/bin/env node

/**
 * ViewProbe MCP Server
 *
 * Exposes ViewProbe as a Model Context Protocol server so any
 * MCP-compatible coding agent can use layout verification as a tool.
 *
 * Tools:
 *   - viewprobe_check: Run a layout scan on a URL
 *   - viewprobe_viewports: List available viewport presets
 */

import { ProbeEngine } from "./engine.js";
import { formatForAgent } from "./formatter.js";
import { DEFAULT_VIEWPORTS, type Viewport, type ProbeConfig } from "./types.js";

interface MCPRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

const engine = new ProbeEngine();

const TOOL_DEFINITIONS = [
  {
    name: "viewprobe_check",
    description:
      "Scan a URL, local HTML file, or raw HTML string for CSS layout violations (overflow, truncation, tap-target sizing) across responsive viewports. Returns compact JSON with exact selectors, computed styles, and automated suggested fixes (Tailwind & CSS).",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The URL or local file path to scan (e.g. http://localhost:3000, ./index.html)",
        },
        html: {
          type: "string",
          description: "Optional raw HTML string to scan directly in-memory without a running server.",
        },
        viewports: {
          type: "string",
          description:
            "Comma-separated viewport names to test: mobile, tablet, desktop, wide. Defaults to mobile,desktop.",
          default: "mobile,desktop",
        },
        selectors: {
          type: "string",
          description:
            "Optional comma-separated CSS selectors to focus the scan on specific elements.",
        },
        skipSelectors: {
          type: "string",
          description:
            "Optional comma-separated CSS selectors to exclude from scanning.",
        },
        microCrops: {
          type: "boolean",
          description: "Attach base64 micro-crop images of violations. Default true.",
          default: true,
        },
      },
    },
  },
  {
    name: "viewprobe_viewports",
    description: "List available viewport presets with their dimensions.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "viewprobe_check": {
      const url = args.url as string | undefined;
      const html = args.html as string | undefined;
      if (!url && !html) {
        throw new Error("Must provide either 'url' or 'html'");
      }
      const viewportStr = (args.viewports as string) ?? "mobile,desktop";
      const viewportNames = viewportStr.split(",").map((s) => s.trim());
      const viewports: Viewport[] = viewportNames
        .map((n) => DEFAULT_VIEWPORTS.find((v) => v.name === n))
        .filter(Boolean) as Viewport[];

      const config: ProbeConfig = {
        url,
        html,
        viewports: viewports.length > 0 ? viewports : undefined,
        selectors: (args.selectors as string)
          ?.split(",")
          .map((s) => s.trim()),
        skipSelectors: (args.skipSelectors as string)
          ?.split(",")
          .map((s) => s.trim()),
        microCrops: (args.microCrops as boolean) ?? true,
      };

      const result = await engine.probe(config);
      return {
        content: [{ type: "text", text: formatForAgent(result) }],
      };
    }

    case "viewprobe_viewports":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              DEFAULT_VIEWPORTS.map((v) => ({
                name: v.name,
                dimensions: `${v.width}\u00D7${v.height}`,
              })),
              null,
              2
            ),
          },
        ],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleRequest(req: MCPRequest): Promise<MCPResponse> {
  try {
    switch (req.method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id: req.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "viewprobe", version: "0.1.0" },
          },
        };

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id: req.id,
          result: { tools: TOOL_DEFINITIONS },
        };

      case "tools/call": {
        const params = req.params as {
          name: string;
          arguments: Record<string, unknown>;
        };
        const result = await handleToolCall(
          params.name,
          params.arguments ?? {}
        );
        return { jsonrpc: "2.0", id: req.id, result };
      }

      case "notifications/initialized":
        return { jsonrpc: "2.0", id: req.id, result: {} };

      default:
        return {
          jsonrpc: "2.0",
          id: req.id,
          error: { code: -32601, message: `Method not found: ${req.method}` },
        };
    }
  } catch (err) {
    return {
      jsonrpc: "2.0",
      id: req.id,
      error: { code: -32603, message: (err as Error).message },
    };
  }
}

let buffer = "";

process.stdin.setEncoding("utf-8");
process.stdin.on("data", async (chunk: string) => {
  buffer += chunk;

  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const req = JSON.parse(trimmed) as MCPRequest;
      const res = await handleRequest(req);
      if (req.method.startsWith("notifications/")) continue;
      process.stdout.write(JSON.stringify(res) + "\n");
    } catch {
      // skip malformed input
    }
  }
});

process.stderr.write("ViewProbe MCP server running on stdio\n");
