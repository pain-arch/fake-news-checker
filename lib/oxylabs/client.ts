import "server-only";

type OxylabsResult = { content?: unknown; status_code?: unknown };

export class OxylabsRequestError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

export async function fetchPageHtml(url: string): Promise<string> {
  const username = process.env.OXY_WSA_USERNAME;
  const password = process.env.OXY_WSA_PASSWORD;
  if (!username || !password) throw new Error("Oxylabs credentials are not configured");
  let response: Response;
  try {
    response = await fetch("https://realtime.oxylabs.io/v1/queries", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: "universal", url }),
      signal: AbortSignal.timeout(120_000),
      cache: "no-store",
    });
  } catch { throw new Error("Oxylabs request failed or timed out"); }
  if (!response.ok) throw new OxylabsRequestError(`Oxylabs returned HTTP ${response.status}`, response.status);
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new Error("Oxylabs returned invalid JSON"); }
  if (!payload || typeof payload !== "object" || !("results" in payload) || !Array.isArray(payload.results)) {
    throw new Error("Oxylabs response has no results array");
  }
  const result: OxylabsResult | undefined = payload.results[0];
  if (!result || result.status_code !== 200 || typeof result.content !== "string" || !result.content.trim()) {
    throw new Error("Oxylabs returned no successful HTML result");
  }
  return result.content;
}
