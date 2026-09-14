const API_URL = (process.env.EXPO_PUBLIC_EARNZO_API_URL || "").replace(/\/$/, "");

function mediaPart(uri, kind = "video") {
  const ext = kind === "image" ? "jpg" : "mp4";
  const type = kind === "image" ? "image/jpeg" : "video/mp4";
  return { uri, name: `earnzo-${Date.now()}.${ext}`, type };
}

function parseBody(text) {
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

function uploadMediaWithProgress(uri, kind, start, end, onProgress) {
  return new Promise((resolve, reject) => {
    if (!API_URL) return reject(new Error("Earnzo backend is not configured"));
    if (!uri) return resolve(null);
    const form = new FormData();
    form.append("file", mediaPart(uri, kind));
    form.append("kind", kind);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/v1/media`);
    // Long videos can take much longer on mobile data. Keep the session alive up to 1 hour.
    xhr.timeout = 60 * 60 * 1000;
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !event.total) return;
      const ratio = Math.max(0, Math.min(1, event.loaded / event.total));
      onProgress?.(Math.round(start + (end - start) * ratio));
    };
    xhr.onload = () => {
      const body = parseBody(xhr.responseText || "");
      if (xhr.status >= 200 && xhr.status < 300) { onProgress?.(end); resolve(body); }
      else if (xhr.status === 413 || /file.*(size|large)|too large|limit/i.test(String(body?.error || body?.message || body || ""))) {
        reject(new Error("Storage ne file-size limit ki wajah se upload reject kiya. Earnzo app maximum 2 GB allow karta hai, lekin connected cloud storage ka plan/bucket limit bhi kam nahi hona chahiye."));
      } else reject(new Error(body?.error || body?.message || `Media upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Media upload network error"));
    xhr.ontimeout = () => reject(new Error("Media upload timed out"));
    xhr.send(form);
  });
}

async function createCloudPost(post) {
  const response = await fetch(`${API_URL}/v1/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
  const text = await response.text();
  const body = parseBody(text);
  if (!response.ok) throw new Error(body?.error || body?.message || `Post create failed (${response.status})`);
  return body;
}

export async function syncPostToBackendWithProgress(post, mediaUri, coverUri, onProgress) {
  if (!API_URL) throw new Error("Earnzo backend is not configured");
  onProgress?.(1);
  const mediaKind = post.mediaType === "photo" ? "image" : "video";
  const mediaEnd = coverUri ? 86 : 96;
  const mediaUpload = mediaUri ? await uploadMediaWithProgress(mediaUri, mediaKind, 2, mediaEnd, onProgress) : null;
  const coverUpload = coverUri ? await uploadMediaWithProgress(coverUri, "image", 87, 96, onProgress) : null;
  onProgress?.(98);
  const created = await createCloudPost({ ...post, localId: post.id, mediaUri: mediaUpload?.url || post.mediaUri || "", coverUri: coverUpload?.url || post.coverUri || mediaUpload?.thumbnailUrl || "", uploadedAt: Date.now() });
  onProgress?.(100);
  return created;
}
