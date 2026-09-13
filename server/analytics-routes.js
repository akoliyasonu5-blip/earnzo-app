const express = require('express');

const router = express.Router();
const DATA_URL = (process.env.SUPABASE_DATA_FUNCTION_URL || '').trim();
const ANALYTICS_URL = (process.env.SUPABASE_ANALYTICS_FUNCTION_URL || (DATA_URL ? DATA_URL.replace(/earnzo-data\/?$/, 'earnzo-analytics') : '')).trim();
const ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();

async function callAnalytics(action, payload = {}) {
  if (!ANALYTICS_URL || !ANON_KEY) throw new Error('Analytics service is not configured');
  const response = await fetch(ANALYTICS_URL, {
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
    const err = new Error(body?.error || `Analytics request failed (${response.status})`);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return { status: response.status, body };
}

router.get('/', async (req, res, next) => {
  try {
    const creatorId = String(req.query.creatorId || '').trim();
    if (!creatorId) return res.status(400).json({ error: 'creatorId required' });
    const out = await callAnalytics('creator_analytics', { creatorId });
    res.status(out.status).json(out.body);
  } catch (e) { next(e); }
});

module.exports = router;
