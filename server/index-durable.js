const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { uploadViaSignedTus, signedStorageEnabled } = require('./signed-storage');

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = Number(process.env.PORT || 10000);
const ROOT = __dirname;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, 'uploads');
const API_KEY = process.env.EARNZO_API_KEY || '';
const DATA_URL = (process.env.SUPABASE_DATA_FUNCTION_URL || '').trim();
const MONETIZATION_URL = (process.env.SUPABASE_MONETIZATION_FUNCTION_URL || (DATA_URL ? DATA_URL.replace(/earnzo-data\/?$/, 'earnzo-monetization') : '')).trim();
const ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use((req, res, next) => {
  if (!API_KEY || req.path === '/health') return next();
  if (req.get('x-earnzo-key') !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 10) || '.bin';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 250 * 1024 * 1024 } });

async function callFunction(url, action, payload = {}) {
  if (!url || !ANON_KEY) throw new Error('Durable database is not configured');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ action, payload }),
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const err = new Error(body?.error || `Durable database request failed (${response.status})`);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return { status: response.status, body };
}

const callData = (action, payload = {}) => callFunction(DATA_URL, action, payload);
const callMonetization = (action, payload = {}) => callFunction(MONETIZATION_URL, action, payload);

app.get('/health', async (_req, res) => {
  try {
    const data = await callData('health');
    res.json({
      ok: true,
      service: 'earnzo-backend',
      version: '0.8.1',
      database: data.body?.database || 'supabase-postgres',
      mediaStorage: signedStorageEnabled() ? 'supabase-storage' : 'not-configured',
      monetizationService: MONETIZATION_URL ? 'configured' : 'not-configured',
    });
  } catch (e) {
    res.status(503).json({ ok: false, error: e?.message || 'Backend unavailable' });
  }
});

app.post('/v1/profiles/upsert', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!String(body.mobile || body.username || '').trim()) return res.status(400).json({ error: 'mobile or username required' });
    const out = await callData('profile_upsert', body);
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.get('/v1/feed', async (req, res, next) => {
  try {
    const out = await callData('feed', { userId: String(req.query.userId || '') });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.get('/v1/stories', async (req, res, next) => {
  try {
    const out = await callData('stories', { userId: String(req.query.userId || '') });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.get('/v1/creator-stats', async (req, res, next) => {
  try {
    const out = await callData('creator_stats', { creatorId: String(req.query.creatorId || '') });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.get('/v1/monetization/status', async (req, res, next) => {
  try {
    const creatorId = String(req.query.creatorId || '').trim();
    if (!creatorId) return res.status(400).json({ error: 'creatorId required' });
    const out = await callMonetization('status', { creatorId });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.post('/v1/monetization/apply', async (req, res, next) => {
  try {
    const creatorId = String(req.body?.creatorId || '').trim();
    if (!creatorId) return res.status(400).json({ error: 'creatorId required' });
    const out = await callMonetization('apply', req.body || {});
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.get('/v1/wallet', async (req, res, next) => {
  try {
    const creatorId = String(req.query.creatorId || '').trim();
    const currencyCode = String(req.query.currencyCode || '').trim();
    if (!creatorId) return res.status(400).json({ error: 'creatorId required' });
    const out = await callMonetization('wallet', { creatorId, currencyCode });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.post('/v1/payouts/request', async (req, res, next) => {
  try {
    const creatorId = String(req.body?.creatorId || '').trim();
    if (!creatorId) return res.status(400).json({ error: 'creatorId required' });
    const out = await callMonetization('request_payout', req.body || {});
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.post('/v1/media', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const cloudUrl = await uploadViaSignedTus(req.file);
    if (!cloudUrl) throw new Error('Supabase media storage is not configured');
    res.json({ url: cloudUrl, kind: req.body?.kind || 'file', size: req.file.size, storage: 'supabase' });
  } catch (e) { next(e); }
});

app.post('/v1/posts', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.mediaType) return res.status(400).json({ error: 'title and mediaType required' });
    const out = await callData('create_post', body);
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.patch('/v1/posts/:id', async (req, res, next) => {
  try {
    const out = await callData('update_post', { postId: req.params.id, ...(req.body || {}) });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.delete('/v1/posts/:id', async (req, res, next) => {
  try {
    const out = await callData('delete_post', { postId: req.params.id });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.post('/v1/posts/:id/view', async (req, res, next) => {
  try {
    const out = await callData('record_view', { postId: req.params.id, userId: String(req.body?.userId || 'anonymous') });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.post('/v1/posts/:id/like', async (req, res, next) => {
  try {
    const out = await callData('toggle_like', { postId: req.params.id, userId: String(req.body?.userId || 'anonymous') });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.post('/v1/posts/:id/comments', async (req, res, next) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'comment text required' });
    const out = await callData('add_comment', { postId: req.params.id, userId: String(req.body?.userId || 'anonymous'), text });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.post('/v1/follow', async (req, res, next) => {
  try {
    const followerId = String(req.body?.followerId || '').trim();
    const followingId = String(req.body?.followingId || '').trim();
    if (!followerId || !followingId) return res.status(400).json({ error: 'followerId and followingId required' });
    const out = await callData('toggle_follow', { followerId, followingId });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.get('/v1/blocks', async (req, res, next) => {
  try {
    const out = await callData('blocks_list', { userId: String(req.query.userId || '') });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.post('/v1/blocks/toggle', async (req, res, next) => {
  try {
    const blockerId = String(req.body?.blockerId || '').trim();
    const blockedId = String(req.body?.blockedId || '').trim();
    if (!blockerId || !blockedId) return res.status(400).json({ error: 'blockerId and blockedId required' });
    const out = await callData('toggle_block', { blockerId, blockedId });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.post('/v1/reports', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!String(body.reporterId || '').trim() || !String(body.targetType || '').trim() || !String(body.targetId || '').trim() || !String(body.reason || '').trim()) {
      return res.status(400).json({ error: 'reporterId, targetType, targetId and reason required' });
    }
    const out = await callData('report_create', body);
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.get('/v1/notifications', async (req, res, next) => {
  try {
    const out = await callData('notifications', { userId: String(req.query.userId || '') });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.post('/v1/notifications/read', async (req, res, next) => {
  try {
    const out = await callData('notifications_read', { userId: String(req.body?.userId || '') });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.get('/v1/search', async (req, res, next) => {
  try {
    const out = await callData('search', { q: String(req.query.q || ''), userId: String(req.query.userId || '') });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.use((err, _req, res, _next) => {
  console.error('Earnzo backend error:', err);
  const status = Number(err?.status || 500);
  res.status(status >= 400 && status < 600 ? status : 500).json(err?.body || { error: err?.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Earnzo durable backend listening on port ${PORT}`);
});
