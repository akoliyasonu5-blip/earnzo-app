const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo account security profile active')) {
  console.log('Earnzo account security profile patch already applied.');
  process.exit(0);
}

function must(label, ok) {
  if (!ok) throw new Error('Account security profile patch failed: ' + label);
}

// Keep the real Supabase session available so Google identity survives app restarts.
code = code.replace(/import \{([^}]*)\} from "\.\/backend\/auth";/, (m, inner) => {
  if (inner.includes('getAuthSession')) return m;
  return `import {${inner.trim()}, getAuthSession } from "./backend/auth";`;
});
must('getAuthSession import missing', code.includes('getAuthSession'));

if (!code.includes('const [signedInEmail, setSignedInEmail]')) {
  const authBusyRe = /(const \[authBusy, setAuthBusy\] = useState\(false\);[^\n]*)/;
  must('auth busy state missing', authBusyRe.test(code));
  code = code.replace(authBusyRe, `$1\n  const [signedInEmail, setSignedInEmail] = useState(""); const [signedInPhone, setSignedInPhone] = useState("");`);
}

const mailAnchor = '    const mail = String(user?.email || "").trim();';
if (code.includes(mailAnchor) && !code.includes('setSignedInEmail(mail);')) {
  code = code.replace(mailAnchor, mailAnchor + '\n    setSignedInEmail(mail);\n    setSignedInPhone(String(user?.phone || "").trim());');
}

const loadingAnchor = '  if (!loaded) return <View style={styles.center}><Brand /><Text style={styles.muted}>Loading Earnzo...</Text></View>;';
must('loading anchor missing', code.includes(loadingAnchor));
if (!code.includes('Auth identity sync failed')) {
  const sessionSync = `  useEffect(() => {\n    if (!loaded || !authConfigured) return;\n    let active = true;\n    getAuthSession().then((session) => {\n      if (!active) return;\n      const user = session?.user;\n      if (!user) return;\n      setSignedInEmail(String(user.email || "").trim());\n      setSignedInPhone(String(user.phone || "").trim());\n    }).catch((e) => console.log("Auth identity sync failed", e?.message || e));\n    return () => { active = false; };\n  }, [loaded]);\n\n`;
  code = code.replace(loadingAnchor, sessionSync + loadingAnchor);
}

// Pass account identity into Settings regardless of how earlier UI patches ordered its props.
if (!code.includes('accountEmail={signedInEmail}')) {
  const mountIndex = code.indexOf('<AccountSettings ');
  must('AccountSettings mount missing', mountIndex >= 0);
  code = code.slice(0, mountIndex) + '<AccountSettings accountEmail={signedInEmail} accountPhone={signedInPhone} ' + code.slice(mountIndex + '<AccountSettings '.length);
}

// The following Google recovery patch replaces AccountSettings completely, so avoid fragile
// dependencies on exact settings markup here. This patch only provides real signed-in identity.
code = code.replace('export default function App() {', '// Earnzo account security profile active\nexport default function App() {');

must('signed-in email state missing', code.includes('signedInEmail'));
must('signed-in phone state missing', code.includes('signedInPhone'));
must('settings identity props missing', code.includes('accountEmail={signedInEmail}'));

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo account security identity applied: real Google email/phone session passed safely to Settings.');
