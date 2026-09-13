const express = require('express');

const router = express.Router();
const DATA_URL = (process.env.SUPABASE_DATA_FUNCTION_URL || '').trim();
const MESSAGES_URL = (process.env.SUPABASE_MESSAGES_FUNCTION_URL || (DATA_URL ? DATA_URL.replace(/earnzo-data\/?$/, 'earnzo-messages') : '')).trim();
const SOCIAL_URL = (process.env.SUPABASE_SOCIAL_FUNCTION_URL || (DATA_URL ? DATA_URL.replace(/earnzo-data\/?$/, 'earnzo-social') : '')).trim();
const ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();

async function callFunction(url, label, action, payload = {}) {
  if (!url || !ANON_KEY) throw new Error(`${label} service is not configured`);
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
    const err = new Error(body?.error || `${label} request failed (${response.status})`);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return { status: response.status, body };
}

const callMessages = (action, payload = {}) => callFunction(MESSAGES_URL, 'Messaging', action, payload);
const callSocial = (action, payload = {}) => callFunction(SOCIAL_URL, 'Social', action, payload);

router.get('/', async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '').trim();
    if (!userId) return res.json({ conversations: [], unread: 0 });
    const out = await callMessages('inbox', { userId });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

router.get('/social', async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '').trim();
    const viewerId = String(req.query.viewerId || userId).trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const out = await callSocial('graph', { userId, viewerId });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

router.get('/thread', async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '').trim();
    const peerId = String(req.query.peerId || '').trim();
    if (!userId || !peerId) return res.status(400).json({ error: 'userId and peerId required' });
    const out = await callMessages('thread', { userId, peerId });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

router.post('/send', async (req, res, next) => {
  try {
    const senderId = String(req.body?.senderId || '').trim();
    const receiverId = String(req.body?.receiverId || '').trim();
    const text = String(req.body?.text || '').trim();
    if (!senderId || !receiverId || !text) return res.status(400).json({ error: 'senderId, receiverId and text required' });
    const out = await callMessages('send', { senderId, receiverId, text });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

router.post('/read', async (req, res, next) => {
  try {
    const userId = String(req.body?.userId || '').trim();
    const peerId = String(req.body?.peerId || '').trim();
    if (!userId || !peerId) return res.status(400).json({ error: 'userId and peerId required' });
    const out = await callMessages('read', { userId, peerId });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

module.exports = router;
