const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { uploadViaSignedTus, signedStorageEnabled } = require('./signed-storage');
const messagesRoutes = require('./messages-routes');
const analyticsRoutes = require('./analytics-routes');

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
const SUPPORT_URL = (process.env.SUPABASE_SUPPORT_FUNCTION_URL || (DATA_URL ? DATA_URL.replace(/earnzo-data\/?$/, 'earnzo-support') : '')).trim();
const ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function playPage(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:Arial,sans-serif;max-width:860px;margin:0 auto;padding:24px;line-height:1.6;color:#171722}h1,h2{line-height:1.25}a{color:#6c4cf1}section{margin:24px 0}.card{background:#f7f7fb;border-radius:14px;padding:16px}input,textarea{width:100%;box-sizing:border-box;padding:12px;margin:7px 0 14px;border:1px solid #d9d9e3;border-radius:10px;font:inherit}button{background:#6c4cf1;color:#fff;border:0;border-radius:10px;padding:12px 18px;font-weight:700}small{color:#666}</style></head><body>${body}</body></html>`;
}

app.get('/privacy', (_req, res) => {
  res.type('html').send(playPage('Earnzo Privacy Policy', `
    <h1>Earnzo Privacy Policy</h1>
    <p><strong>Effective date:</strong> 14 September 2026</p>
    <p>Earnzo is a social creator application for posting videos, shorts, photos and text, interacting with creators, messaging, calling and creator features. This policy explains how Earnzo handles user data.</p>
    <section><h2>Data we may collect</h2><p>Depending on the features you use, Earnzo may process account and authentication information such as email address, phone number, name and username; profile information and profile photo; content you upload or publish; likes, comments, follows, reports, messages and support requests; creator statistics and monetization or payout information you choose to provide; and technical information needed to operate the service.</p><p>Camera and microphone access is used only for features that require it, such as voice/video calls or media creation. Location text is processed when you choose to add a location to content. Watch history and offline downloads may also be stored locally on your device for playback and resume features.</p></section>
    <section><h2>How we use data</h2><p>We use data to authenticate users, provide feeds and creator profiles, publish and deliver content, enable social interactions and messaging, operate support and safety features, prevent abuse, provide creator analytics and monetization features, and maintain and improve Earnzo.</p></section>
    <section><h2>Sharing and service providers</h2><p>Earnzo does not sell personal information. Information may be processed by infrastructure and authentication providers used to operate the app, including Supabase, Render and Google when you choose Google sign-in. Content you intentionally publish can be visible to other Earnzo users according to the visibility settings you select. We may disclose information when required by law or to protect users, the service or legal rights.</p></section>
    <section><h2>Security</h2><p>Earnzo uses secure network connections for supported online services and uses access controls appropriate to the service. No online system can be guaranteed to be completely secure, so users should protect their account credentials and devices.</p></section>
    <section><h2>Retention and deletion</h2><p>We retain account and service data while needed to provide Earnzo and for legitimate safety, fraud-prevention, legal and operational purposes. You can request deletion of your Earnzo account and associated data. Data that must be retained for legal, security or fraud-prevention reasons may be kept only as necessary for those purposes.</p><p><a href="/account-deletion">Request account and data deletion</a></p></section>
    <section><h2>Your choices</h2><p>You can manage content from your account, use report/block controls, sign out, and request account deletion. Permissions such as camera and microphone can also be controlled through Android settings.</p></section>
    <section><h2>Contact</h2><p>For privacy questions, use <strong>Earnzo Support</strong> inside the app. If you no longer have the app installed, use the <a href="/account-deletion">account deletion request page</a> for account/data deletion requests.</p></section>
    <p><small>This policy applies to the Earnzo Android application and related Earnzo services.</small></p>
  `));
});

app.get('/account-deletion', (_req, res) => {
  res.type('html').send(playPage('Earnzo Account Deletion', `
    <h1>Earnzo Account & Data Deletion</h1>
    <p>You can request deletion of your Earnzo account and data from this page even if you no longer have the app installed.</p>
    <div class="card"><form method="post" action="/account-deletion-request"><label>Earnzo username, email address, or phone number used for the account</label><input name="identifier" required maxlength="180" placeholder="Example: @username or email/phone"><label>Additional details (optional)</label><textarea name="details" rows="5" maxlength="1000" placeholder="Anything that helps us identify the account"></textarea><button type="submit">Request account deletion</button></form></div>
    <section><h2>What happens after a request</h2><p>Earnzo will use the information you provide to identify the account and process deletion of the account and associated user data. We may contact you through an available verified account channel if identity verification is needed. Certain records may be retained only where necessary for legal, security, fraud-prevention or dispute-resolution obligations.</p></section>
    <p><a href="/privacy">Read the Earnzo Privacy Policy</a></p>
  `));
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
const callSupport = (action, payload = {}) => callFunction(SUPPORT_URL, action, payload);

app.post('/account-deletion-request', express.urlencoded({ extended: false }), async (req, res) => {
  const identifier = String(req.body?.identifier || '').trim();
  const details = String(req.body?.details || '').trim();
  if (!identifier) return res.status(400).type('html').send(playPage('Earnzo Account Deletion', '<h1>Account deletion request</h1><p>Please provide your Earnzo username, email address, or phone number.</p><p><a href="/account-deletion">Go back</a></p>'));
  try {
    await callSupport('create', {
      userId: identifier,
      requestType: 'account_deletion',
      category: 'Account / Profile',
      subject: 'Account and data deletion request',
      message: 'Delete Earnzo account and associated data. ' + (details || 'No additional details provided.'),
      data: { source: 'public-account-deletion-page', requestedAt: Date.now() },
    });
    return res.type('html').send(playPage('Earnzo Account Deletion', '<h1>Request received</h1><p>Your Earnzo account/data deletion request has been submitted. Keep the account identifier you used available in case identity verification is required.</p><p><a href="/privacy">Privacy Policy</a></p>'));
  } catch (e) {
    console.error('Public account deletion request failed:', e);
    return res.status(503).type('html').send(playPage('Earnzo Account Deletion', '<h1>Request could not be submitted</h1><p>Please try again later or use Earnzo Support inside the app.</p><p><a href="/account-deletion">Try again</a></p>'));
  }
});

app.use((req, res, next) => {
  if (!API_KEY || req.path === '/health') return next();
  if (req.get('x-earnzo-key') !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

app.get('/health', async (_req, res) => {
  try {
    const data = await callData('health');
    res.json({
      ok: true,
      service: 'earnzo-backend',
      version: '1.1.0',
      database: data.body?.database || 'supabase-postgres',
      mediaStorage: signedStorageEnabled() ? 'supabase-storage' : 'not-configured',
      monetizationService: MONETIZATION_URL ? 'configured' : 'not-configured',
      messagingService: DATA_URL ? 'configured' : 'not-configured',
      analyticsService: DATA_URL ? 'configured' : 'not-configured',
      supportService: SUPPORT_URL ? 'configured' : 'not-configured',
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

app.get('/v1/support', async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const out = await callSupport('list', { userId });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.post('/v1/support', async (req, res, next) => {
  try {
    const body = req.body || {};
    const userId = String(body.userId || '').trim();
    const message = String(body.message || '').trim();
    if (!userId || !message) return res.status(400).json({ error: 'userId and message required' });
    const out = await callSupport('create', body);
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

app.use('/v1/messages', messagesRoutes);
app.use('/v1/creator-analytics', analyticsRoutes);

app.use((err, _req, res, _next) => {
  console.error('Earnzo backend error:', err);
  const status = Number(err?.status || 500);
  res.status(status >= 400 && status < 600 ? status : 500).json(err?.body || { error: err?.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Earnzo durable backend listening on port ${PORT}`);
});
