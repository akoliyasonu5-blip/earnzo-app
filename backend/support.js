const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "").trim();
const SUPPORT_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/earnzo-support` : "";

async function request(action, payload = {}, timeoutMs = 20000) {
  if (!SUPPORT_URL || !SUPABASE_KEY) throw new Error("Earnzo support service is not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(SUPPORT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify({ action, payload }),
      signal: controller.signal,
    });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!response.ok) throw new Error(body?.error || body?.message || `Support request failed (${response.status})`);
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSupportRequests(userId) {
  return request("list", { userId });
}

export async function submitSupportRequest(payload) {
  return request("create", payload || {});
}
