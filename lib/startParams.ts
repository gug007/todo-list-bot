/*
Utility helpers for encoding/decoding Telegram Mini-App `startapp` (or fallback `?id=`) parameters.
The value must be a URL-safe Base64 string ("Base64-URL") that stays within Telegram's 1–64-char limit.

encodeStartParam – takes any JSON-serialisable value and produces a Base64-URL string.
decodeStartParam – converts the string back to the original object.

Both helpers run in Node *and* in the browser.
*/

// Replace "+/=" characters and strip padding for URL safety.
function toBase64URL(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64URL(b64url: string): string {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  return b64;
}

export function encodeStartParam(data: unknown): string {
  const json = JSON.stringify(data);

  let b64: string;
  if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
    // Node (and most bundlers in the browser)
    b64 = Buffer.from(json, "utf-8").toString("base64");
  } else if (typeof btoa === "function") {
    // Native browser – convert UTF-8 to binary string first.
    const binary = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    b64 = btoa(binary);
  } else {
    throw new Error("No base64 encoder available in this environment.");
  }

  return toBase64URL(b64);
}

export function decodeStartParam<T = unknown>(param: string): T {
  const b64 = fromBase64URL(param);

  let json: string;
  if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
    json = Buffer.from(b64, "base64").toString("utf-8");
  } else if (typeof atob === "function") {
    // Browser
    const binary = atob(b64);
    json = decodeURIComponent(
      Array.prototype.map
        .call(binary, (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } else {
    throw new Error("No base64 decoder available in this environment.");
  }

  return JSON.parse(json) as T;
} 