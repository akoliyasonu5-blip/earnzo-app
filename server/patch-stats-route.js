const fs = require('fs');

const file = 'index-durable.js';
let code = fs.readFileSync(file, 'utf8');

if (code.includes('SUPABASE_STATS_FUNCTION_URL')) {
  console.log('90-day creator stats route already patched.');
  process.exit(0);
}

const supportLine = "const SUPPORT_URL = (process.env.SUPABASE_SUPPORT_FUNCTION_URL || (DATA_URL ? DATA_URL.replace(/earnzo-data\\/?$/, 'earnzo-support') : '')).trim();";
if (!code.includes(supportLine)) throw new Error('Stats patch failed: SUPPORT_URL anchor not found');
code = code.replace(
  supportLine,
  supportLine + "\nconst STATS_URL = (process.env.SUPABASE_STATS_FUNCTION_URL || (DATA_URL ? DATA_URL.replace(/earnzo-data\\/?$/, 'earnzo-stats-90d') : '')).trim();"
);

const supportHelper = "const callSupport = (action, payload = {}) => callFunction(SUPPORT_URL, action, payload);";
if (!code.includes(supportHelper)) throw new Error('Stats patch failed: callSupport anchor not found');
code = code.replace(
  supportHelper,
  supportHelper + "\nconst callStats = (action, payload = {}) => callFunction(STATS_URL, action, payload);"
);

const oldRoute = "const out = await callData('creator_stats', { creatorId: String(req.query.creatorId || '') });";
if (!code.includes(oldRoute)) throw new Error('Stats patch failed: creator stats route not found');
code = code.replace(oldRoute, "const out = await callStats('creator_stats', { creatorId: String(req.query.creatorId || '') });");

fs.writeFileSync(file, code, 'utf8');
console.log('Earnzo creator stats now use 10K followers + 1M valid views in rolling 90 days.');
