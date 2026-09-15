const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo Play compliance links active')) {
  console.log('Earnzo Play compliance links already applied.');
  process.exit(0);
}

// Add React Native Linking to the existing named import without depending on one exact line order.
if (!/\bLinking\b/.test((code.match(/import\s*\{[\s\S]*?\}\s*from\s*["']react-native["'];?/) || [''])[0])) {
  const importMatch = code.match(/import\s*\{([\s\S]*?)\}\s*from\s*["']react-native["'];?/);
  if (!importMatch) throw new Error('Play compliance patch failed: react-native import not found');
  const full = importMatch[0];
  const inner = importMatch[1];
  const updated = full.replace(inner, inner.replace(/\s*$/, '') + '\n  Linking,\n');
  code = code.replace(full, updated);
}

const start = code.indexOf('function AccountSettings(');
if (start < 0) throw new Error('Play compliance patch failed: AccountSettings not found');
let end = code.indexOf('\nfunction ', start + 12);
if (end < 0) end = code.indexOf('\n\nconst styles =', start + 12);
if (end < 0) throw new Error('Play compliance patch failed: AccountSettings end not found');

let block = code.slice(start, end);
const complianceItems = '<SupportItem icon="📄" title="Privacy Policy" sub="How Earnzo handles your data" onPress={() => Linking.openURL("https://earnzo-backend.onrender.com/privacy")} /><SupportItem icon="🗑" title="Delete Account & Data" sub="Request permanent account and associated data deletion" onPress={() => Linking.openURL("https://earnzo-backend.onrender.com/account-deletion")} />';

// Prefer inserting before the destructive account action; this survives later Settings layout changes.
const dangerAnchor = '<Pressable style={styles.dangerButton}';
const secondaryAnchor = '<Pressable style={styles.secondary} onPress={logout}';
if (block.includes(dangerAnchor)) {
  block = block.replace(dangerAnchor, complianceItems + dangerAnchor);
} else if (block.includes(secondaryAnchor)) {
  block = block.replace(secondaryAnchor, complianceItems + secondaryAnchor);
} else {
  // Last-resort insertion inside the first Settings ScrollView, before its closing tag.
  const closeIdx = block.lastIndexOf('</ScrollView>');
  if (closeIdx < 0) throw new Error('Play compliance patch failed: no Settings insertion anchor found');
  block = block.slice(0, closeIdx) + complianceItems + block.slice(closeIdx);
}

block = block.replace('function AccountSettings(', '/* Earnzo Play compliance links active */\nfunction AccountSettings(');
code = code.slice(0, start) + block + code.slice(end);

if (!code.includes('https://earnzo-backend.onrender.com/privacy')) throw new Error('Privacy link missing after Play compliance patch');
if (!code.includes('https://earnzo-backend.onrender.com/account-deletion')) throw new Error('Account deletion link missing after Play compliance patch');

// Google-only authentication UI: keep alternate auth helpers internally for compatibility,
// but expose only the working Google sign-in option to users.
const oldLoginOptions = '<Text style={styles.authSub}>Login with Google, email or phone number</Text><Pressable style={styles.primary} disabled={authBusy} onPress={doGoogleLogin}><Text style={styles.primaryText}>{authBusy ? "Please wait..." : "G  Continue with Google"}</Text></Pressable><Pressable style={styles.secondary} onPress={() => setStage("emailAuth")}><Text style={styles.secondaryText}>✉  Gmail / Zoho Mail</Text></Pressable><Pressable style={styles.secondary} onPress={() => { setAuthMode("login"); setStage("phone"); }}><Text style={styles.secondaryText}>📱  Phone Number</Text></Pressable><Text style={styles.note}>{authConfigured ? "Secure login powered by Supabase Auth" : "Secure login configuration missing in this build"}</Text>';
const googleOnlyLogin = '<Text style={styles.authSub}>Continue with Google to sign in</Text><Pressable style={styles.primary} disabled={authBusy} onPress={doGoogleLogin}><Text style={styles.primaryText}>{authBusy ? "Please wait..." : "G  Continue with Google"}</Text></Pressable><Text style={styles.note}>{authConfigured ? "Secure Google sign-in powered by Supabase Auth" : "Secure login configuration missing in this build"}</Text>';
if (!code.includes(oldLoginOptions)) throw new Error('Google-only auth patch failed: login options not found');
code = code.replace(oldLoginOptions, googleOnlyLogin);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo Play compliance links + Google-only login applied.');
