const API_URL = (process.env.EXPO_PUBLIC_EARNZO_API_URL || "").replace(/\/$/, "");
const API_KEY = process.env.EXPO_PUBLIC_EARNZO_API_KEY || "";

function headers(extra = {}) {
  return {
    ...(API_KEY ? { "x-earnzo-key": API_KEY } : {}),
    ...extra,
  };
}

async function request(path, options = {}, timeoutMs = 20000) {
  if (!API_URL) throw new Error("Earnzo backend is not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: headers(options.headers || {}),
      signal: controller.signal,
    });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!response.ok) throw new Error(body?.error || body?.message || `Analytics request failed (${response.status})`);
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCreatorAnalytics(creatorId) {
  return request(`/v1/creator-analytics?creatorId=${encodeURIComponent(creatorId || "")}`);
}
