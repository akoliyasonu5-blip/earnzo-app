const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "").trim();

const endpoint = () => `${SUPABASE_URL}/functions/v1/earnzo-calls`;

async function request(body, timeoutMs = 15000) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Call service is not configured in this build");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
      body: JSON.stringify(body || {}),
      signal: controller.signal,
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) throw new Error(data?.error || data?.message || `Call request failed (${response.status})`);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function get(params, timeoutMs = 12000) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Call service is not configured in this build");
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => { if (value !== undefined && value !== null) qs.set(key, String(value)); });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${endpoint()}?${qs.toString()}`, { headers: { apikey: SUPABASE_KEY }, signal: controller.signal });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) throw new Error(data?.error || data?.message || `Call request failed (${response.status})`);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createCallSession(callerId, calleeId, callType, offer) {
  return request({ action: "create", callerId, calleeId, callType, offer });
}

export async function fetchIncomingCall(userId) {
  return get({ action: "incoming", userId });
}

export async function fetchCallSession(callId, userId) {
  return get({ action: "get", callId, userId });
}

export async function answerCallSession(callId, userId, answer) {
  return request({ action: "answer", callId, userId, answer });
}

export async function declineCallSession(callId, userId) {
  return request({ action: "decline", callId, userId });
}

export async function endCallSession(callId, userId) {
  return request({ action: "end", callId, userId });
}
