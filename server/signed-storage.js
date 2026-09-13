const fs = require('fs');

const SIGN_URL = (process.env.SUPABASE_SIGN_UPLOAD_URL || '').trim();
const ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();
const BUCKET = (process.env.SUPABASE_STORAGE_BUCKET || 'earnzo-media').trim();
// 0 means Earnzo itself does not impose a file-size cap. The actual provider,
// project global limit and bucket limit remain authoritative.
const MAX_FILE_BYTES = Number(process.env.SUPABASE_MAX_FILE_BYTES || 0);

function enabled() {
  return Boolean(SIGN_URL && ANON_KEY);
}

async function getSignedUpload(file) {
  const response = await fetch(SIGN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      filename: file.originalname || file.filename || 'upload.bin',
      contentType: file.mimetype || 'application/octet-stream',
    }),
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = {}; }
  if (!response.ok || !body?.signedUrl || !body?.path) {
    throw new Error(body?.error || `Storage signer failed (${response.status})`);
  }
  return body;
}

async function uploadToSignedUrl(file, signed) {
  const response = await fetch(signed.signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.mimetype || 'application/octet-stream',
      'Cache-Control': '3600',
    },
    body: fs.createReadStream(file.path),
    duplex: 'half',
  });
  const text = await response.text();
  if (!response.ok) {
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch {}
    throw new Error(body?.message || body?.error || `Supabase upload failed (${response.status})`);
  }
  return signed.publicUrl;
}

async function uploadViaSignedTus(file) {
  if (!enabled()) return null;
  if (MAX_FILE_BYTES > 0 && Number(file.size || 0) > MAX_FILE_BYTES) {
    const mb = Math.ceil(Number(file.size || 0) / (1024 * 1024));
    const maxMb = Math.ceil(MAX_FILE_BYTES / (1024 * 1024));
    throw new Error(`Video ${mb} MB hai. Configured storage limit ${maxMb} MB hai.`);
  }
  const signed = await getSignedUpload(file);
  const publicUrl = await uploadToSignedUrl(file, signed);
  try { fs.unlinkSync(file.path); } catch {}
  return publicUrl;
}

module.exports = { uploadViaSignedTus, signedStorageEnabled: enabled };
