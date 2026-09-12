const API_URL = (process.env.EXPO_PUBLIC_EARNZO_API_URL || "").replace(/\/$/, "");
const API_KEY = process.env.EXPO_PUBLIC_EARNZO_API_KEY || "";

export const backendEnabled = Boolean(API_URL);

function headers(extra = {}) {
  return {
    ...(API_KEY ? { "x-earnzo-key": API_KEY } : {}),
    ...extra,
  };
}

async function request(path, options = {}, timeoutMs = 20000) {
  if (!backendEnabled) throw new Error("Earnzo backend is not configured");
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
    if (!response.ok) {
      const message = body?.error || body?.message || `Backend request failed (${response.status})`;
      throw new Error(message);
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

export async function backendHealth() {
  return request("/health");
}

export async function upsertProfile(profile) {
  return request("/v1/profiles/upsert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
}

export async function fetchFeed(userId = "") {
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return request(`/v1/feed${q}`);
}

function mediaPart(uri, kind = "video") {
  const ext = kind === "image" ? "jpg" : "mp4";
  const type = kind === "image" ? "image/jpeg" : "video/mp4";
  return { uri, name: `earnzo-${Date.now()}.${ext}`, type };
}

export async function uploadMedia(uri, kind = "video") {
  if (!uri) return null;
  const form = new FormData();
  form.append("file", mediaPart(uri, kind));
  form.append("kind", kind);
  return request("/v1/media", {
    method: "POST",
    body: form,
  }, 300000);
}

export async function createPost(post) {
  return request("/v1/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
}

export async function updateRemotePost(postId, changes) {
  return request(`/v1/posts/${encodeURIComponent(postId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes || {}),
  });
}

export async function deleteRemotePost(postId) {
  return request(`/v1/posts/${encodeURIComponent(postId)}`, {
    method: "DELETE",
  });
}

export async function syncPostToBackend(post, mediaUri, coverUri) {
  if (!backendEnabled) return null;
  const mediaKind = post.mediaType === "photo" ? "image" : "video";
  const mediaUpload = mediaUri ? await uploadMedia(mediaUri, mediaKind) : null;
  const coverUpload = coverUri ? await uploadMedia(coverUri, "image") : null;
  return createPost({
    ...post,
    localId: post.id,
    mediaUri: mediaUpload?.url || post.mediaUri || "",
    coverUri: coverUpload?.url || post.coverUri || mediaUpload?.thumbnailUrl || "",
    uploadedAt: Date.now(),
  });
}

export async function toggleLike(postId, userId) {
  return request(`/v1/posts/${encodeURIComponent(postId)}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export async function addRemoteComment(postId, userId, text) {
  return request(`/v1/posts/${encodeURIComponent(postId)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, text }),
  });
}

export async function followRemoteUser(followerId, followingId) {
  return request("/v1/follow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ followerId, followingId }),
  });
}

export async function searchRemote(query) {
  return request(`/v1/search?q=${encodeURIComponent(query || "")}`);
}
