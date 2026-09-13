const express = require('express');

const router = express.Router();
const DATA_URL = (process.env.SUPABASE_DATA_FUNCTION_URL || '').trim();
const SOCIAL_URL = (process.env.SUPABASE_SOCIAL_FUNCTION_URL || (DATA_URL ? DATA_URL.replace(/earnzo-data\/?$/, 'earnzo-social') : '')).trim();
const ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();

async function callSocial(action, payload = {}) {
  if (!SOCIAL_URL || !ANON_KEY) throw new Error('Social service is not configured');
  const response = await fetch(SOCIAL_URL, {
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
    const err = new Error(body?.error || `Social request failed (${response.status})`);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return { status: response.status, body };
}

router.get('/', async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '').trim();
    const viewerId = String(req.query.viewerId || userId).trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const out = await callSocial('graph', { userId, viewerId });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

module.exports = router;
