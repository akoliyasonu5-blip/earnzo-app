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
    if (!response.ok) throw new Error(body?.error || body?.message || `Messaging request failed (${response.status})`);
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchMessageInbox(userId) {
  return request(`/v1/messages?userId=${encodeURIComponent(userId || "")}`);
}

export async function fetchMessageThread(userId, peerId) {
  const params = new URLSearchParams();
  params.set("userId", userId || "");
  params.set("peerId", peerId || "");
  return request(`/v1/messages/thread?${params.toString()}`);
}

export async function sendRemoteMessage(senderId, receiverId, text) {
  return request("/v1/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId, receiverId, text }),
  });
}

export async function markRemoteMessagesRead(userId, peerId) {
  return request("/v1/messages/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, peerId }),
  });
}
