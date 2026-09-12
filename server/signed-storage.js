const fs = require('fs');
const tus = require('tus-js-client');

const SIGN_URL = (process.env.SUPABASE_SIGN_UPLOAD_URL || '').trim();
const SIGN_KEY = (process.env.SUPABASE_STORAGE_SIGNING_KEY || '').trim();
const PROJECT_REF = (process.env.SUPABASE_PROJECT_REF || '').trim();
const BUCKET = (process.env.SUPABASE_STORAGE_BUCKET || 'earnzo-media').trim();

function enabled() {
  return Boolean(SIGN_URL && SIGN_KEY && PROJECT_REF);
}

async function getSignedUpload(file) {
  const response = await fetch(SIGN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-earnzo-storage-key': SIGN_KEY,
    },
    body: JSON.stringify({
      filename: file.originalname || file.filename || 'upload.bin',
      contentType: file.mimetype || 'application/octet-stream',
    }),
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = {}; }
  if (!response.ok || !body?.token || !body?.path) {
    throw new Error(body?.error || `Storage signer failed (${response.status})`);
  }
  return body;
}

function tusUpload(file, signed) {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(fs.createReadStream(file.path), {
      endpoint: `https://${PROJECT_REF}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        'x-signature': signed.token,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: BUCKET,
        objectName: signed.path,
        contentType: file.mimetype || 'application/octet-stream',
        cacheControl: '3600',
      },
      onError: reject,
      onSuccess: () => resolve(signed.publicUrl),
    });
    upload.start();
  });
}

async function uploadViaSignedTus(file) {
  if (!enabled()) return null;
  const signed = await getSignedUpload(file);
  const publicUrl = await tusUpload(file, signed);
  try { fs.unlinkSync(file.path); } catch {}
  return publicUrl;
}

module.exports = { uploadViaSignedTus, signedStorageEnabled: enabled };
