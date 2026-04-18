/**
 * toolbox.js
 * Reusable caller for the HederaToolbox MCP endpoint.
 * Toolbox returns Server-Sent Events (SSE), not plain JSON.
 * This module handles the parsing so your agent code stays clean.
 */

import https from "https";

const TOOLBOX_API_URL = process.env.TOOLBOX_API_URL || "https://api.hederatoolbox.com";
const TOOLBOX_API_KEY = process.env.TOOLBOX_API_KEY;

if (!TOOLBOX_API_KEY) {
  throw new Error("TOOLBOX_API_KEY is required. Set it in your .env file.");
}

/**
 * Call any HederaToolbox tool by name.
 * Always resolves — never throws. Check result.ok before using result.data.
 *
 * @param {string} toolName  - e.g. "fixatum_score", "hcs_write_record"
 * @param {object} toolArgs  - tool-specific arguments (api_key is injected automatically)
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export function callToolbox(toolName, toolArgs = {}) {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: toolName,
      arguments: { api_key: TOOLBOX_API_KEY, ...toolArgs },
    },
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: new URL(TOOLBOX_API_URL).hostname,
        path: "/mcp",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            // SSE frames arrive as "data: {...}\n" lines.
            // Scan backward to find the last parseable result frame.
            const lines = raw
              .split("\n")
              .filter((l) => l.startsWith("data:"))
              .map((l) => l.replace(/^data:\s*/, "").trim())
              .filter((l) => l && l !== "[DONE]");

            for (let i = lines.length - 1; i >= 0; i--) {
              try {
                const parsed = JSON.parse(lines[i]);
                const text = parsed?.result?.content?.[0]?.text;
                if (text) return resolve({ ok: true, data: JSON.parse(text) });
              } catch {
                continue;
              }
            }
            resolve({ ok: false, data: null });
          } catch {
            resolve({ ok: false, data: null });
          }
        });
      }
    );

    req.on("error", () => resolve({ ok: false, data: null }));
    req.write(body);
    req.end();
  });
}
