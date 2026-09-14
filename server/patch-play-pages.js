const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, 'index-durable.js');
let code = fs.readFileSync(target, 'utf8');

if (code.includes("app.get('/privacy'")) {
  console.log('Play Store privacy/deletion pages already applied.');
  process.exit(0);
}

const anchor = "app.use((req, res, next) => {";
if (!code.includes(anchor)) throw new Error('Play pages patch anchor not found');

const routes = `
const playPage = (title, body) => \`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>\${title}</title><style>body{font-family:Arial,sans-serif;max-width:860px;margin:0 auto;padding:24px;line-height:1.6;color:#171722}h1,h2{line-height:1.25}a{color:#6c4cf1}section{margin:24px 0}.card{background:#f7f7fb;border-radius:14px;padding:16px}input,textarea{width:100%;box-sizing:border-box;padding:12px;margin:7px 0 14px;border:1px solid #d9d9e3;border-radius:10px;font:inherit}button{background:#6c4cf1;color:#fff;border:0;border-radius:10px;padding:12px 18px;font-weight:700}small{color:#666}</style></head><body>\${body}</body></html>\`;

app.get('/privacy', (_req, res) => {
  res.type('html').send(playPage('Earnzo Privacy Policy', \`
    <h1>Earnzo Privacy Policy</h1>
    <p><strong>Effective date:</strong> 14 September 2026</p>
    <p>Earnzo is a social creator application for posting videos, shorts, photos and text, interacting with creators, messaging, calling and creator features. This policy explains how Earnzo handles user data.</p>
    <section><h2>Data we may collect</h2><p>Depending on the features you use, Earnzo may process account and authentication information such as email address, phone number, name and username; profile information and profile photo; content you upload or publish; likes, comments, follows, reports, messages and support requests; creator statistics and monetization or payout information you choose to provide; and technical information needed to operate the service.</p><p>Camera and microphone access is used only for features that require it, such as voice/video calls or media creation. Location text is processed when you choose to add a location to content. Watch history and offline downloads may also be stored locally on your device for playback and resume features.</p></section>
    <section><h2>How we use data</h2><p>We use data to authenticate users, provide feeds and creator profiles, publish and deliver content, enable social interactions and messaging, operate support and safety features, prevent abuse, provide creator analytics and monetization features, and maintain and improve Earnzo.</p></section>
    <section><h2>Sharing and service providers</h2><p>Earnzo does not sell personal information. Information may be processed by infrastructure and authentication providers used to operate the app, including Supabase, Render and Google when you choose Google sign-in. Content you intentionally publish can be visible to other Earnzo users according to the visibility settings you select. We may disclose information when required by law or to protect users, the service or legal rights.</p></section>
    <section><h2>Security</h2><p>Earnzo uses secure network connections (HTTPS) for supported online services and uses access controls appropriate to the service. No online system can be guaranteed to be completely secure, so users should protect their account credentials and devices.</p></section>
    <section><h2>Retention and deletion</h2><p>We retain account and service data while needed to provide Earnzo and for legitimate safety, fraud-prevention, legal and operational purposes. You can request deletion of your Earnzo account and associated data. Data that must be retained for legal, security or fraud-prevention reasons may be kept only as necessary for those purposes.</p><p><a href="/account-deletion">Request account and data deletion</a></p></section>
    <section><h2>Your choices</h2><p>You can manage content from your account, use report/block controls, sign out, and request account deletion. Permissions such as camera and microphone can also be controlled through Android settings.</p></section>
    <section><h2>Contact</h2><p>For privacy questions, use <strong>Earnzo Support</strong> inside the app. If you no longer have the app installed, use the <a href="/account-deletion">account deletion request page</a> for account/data deletion requests.</p></section>
    <p><small>This policy applies to the Earnzo Android application and related Earnzo services.</small></p>
  \`));
});

app.get('/account-deletion', (_req, res) => {
  res.type('html').send(playPage('Earnzo Account Deletion', \`
    <h1>Earnzo Account & Data Deletion</h1>
    <p>You can request deletion of your Earnzo account and data from this page even if you no longer have the app installed.</p>
    <div class="card"><form method="post" action="/account-deletion-request"><label>Earnzo username, email address, or phone number used for the account</label><input name="identifier" required maxlength="180" placeholder="Example: @username or email/phone"><label>Additional details (optional)</label><textarea name="details" rows="5" maxlength="1000" placeholder="Anything that helps us identify the account"></textarea><button type="submit">Request account deletion</button></form></div>
    <section><h2>What happens after a request</h2><p>Earnzo will use the information you provide to identify the account and process deletion of the account and associated user data. We may contact you through an available verified account channel if identity verification is needed. Certain records may be retained only where necessary for legal, security, fraud-prevention or dispute-resolution obligations.</p></section>
    <p><a href="/privacy">Read the Earnzo Privacy Policy</a></p>
  \`));
});

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
    return res.type('html').send(playPage('Earnzo Account Deletion', '<h1>Request received ✅</h1><p>Your Earnzo account/data deletion request has been submitted. Keep the account identifier you used available in case identity verification is required.</p><p><a href="/privacy">Privacy Policy</a></p>'));
  } catch (e) {
    console.error('Public account deletion request failed:', e);
    return res.status(503).type('html').send(playPage('Earnzo Account Deletion', '<h1>Request could not be submitted</h1><p>Please try again later or use Earnzo Support inside the app.</p><p><a href="/account-deletion">Try again</a></p>'));
  }
});

`;

code = code.replace(anchor, routes + anchor);
fs.writeFileSync(target, code, 'utf8');
console.log('Play Store privacy policy and account deletion pages applied.');
