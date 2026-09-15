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

// Make the persisted Supabase session available so Google email/phone details survive app restarts.
code = code.replace(/import \{([^}]*)\} from "\.\/backend\/auth";/, (m, inner) => {
  if (inner.includes('getAuthSession')) return m;
  return `import { ${inner.trim().replace(/^\s+|\s+$/g, '')}, getAuthSession } from "./backend/auth";`;
});
must('getAuthSession import missing', code.includes('getAuthSession'));

const authStateAnchor = '  const [emailAddress, setEmailAddress] = useState(""); const [emailPassword, setEmailPassword] = useState(""); const [authBusy, setAuthBusy] = useState(false); // Earnzo secure auth options active';
must('secure auth state anchor missing', code.includes(authStateAnchor));
code = code.replace(authStateAnchor, authStateAnchor + '\n  const [signedInEmail, setSignedInEmail] = useState(""); const [signedInPhone, setSignedInPhone] = useState(""); // Earnzo account security profile active');

const mailAnchor = '    const mail = String(user?.email || "").trim();';
must('Google auth email anchor missing', code.includes(mailAnchor));
code = code.replace(mailAnchor, mailAnchor + '\n    setSignedInEmail(mail);\n    setSignedInPhone(String(user?.phone || "").trim());');

const loadingAnchor = '  if (!loaded) return <View style={styles.center}><Brand /><Text style={styles.muted}>Loading Earnzo...</Text></View>;';
must('loading anchor missing', code.includes(loadingAnchor));
const sessionSync = `  useEffect(() => {
    if (!loaded || !authConfigured) return;
    let active = true;
    getAuthSession().then((session) => {
      if (!active) return;
      const user = session?.user;
      if (!user) return;
      setSignedInEmail(String(user.email || "").trim());
      setSignedInPhone(String(user.phone || "").trim());
    }).catch((e) => console.log("Auth identity sync failed", e?.message || e));
    return () => { active = false; };
  }, [loaded]);

`;
code = code.replace(loadingAnchor, sessionSync + loadingAnchor);

// Final UI patches may reorder AccountSettings props, so inject identity props into the first mount generically.
const accountMount = /<AccountSettings\s+/;
must('AccountSettings mount missing', accountMount.test(code));
if (!code.includes('<AccountSettings accountEmail={signedInEmail}')) {
  code = code.replace(accountMount, '<AccountSettings accountEmail={signedInEmail} accountPhone={signedInPhone} ');
}

// Final UI patches may add props to AccountSettings, so append ours to the destructured signature generically.
const signatureRegex = /function AccountSettings\(\{([^}]*)\}\) \{/;
const signatureMatch = code.match(signatureRegex);
must('AccountSettings signature missing', !!signatureMatch);
if (!signatureMatch[1].includes('accountEmail')) {
  const inner = signatureMatch[1].trim().replace(/,\s*$/, '');
  code = code.replace(signatureRegex, `function AccountSettings({ ${inner}, accountEmail = "", accountPhone = "" }) {`);
}

const recoveryState = "const [recoveryEmail, setRecoveryEmail] = useState('');";
if (code.includes(recoveryState)) {
  code = code.replace(recoveryState, "const [recoveryEmail, setRecoveryEmail] = useState(accountEmail || '');");
}

const remainingAnchor = "  const remaining = daysRemaining(lastNameChangeAt, NAME_COOLDOWN_DAYS); const safeTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;";
must('AccountSettings remaining anchor missing', code.includes(remainingAnchor));
code = code.replace(remainingAnchor, `  useEffect(() => { if (securityOpen && accountEmail && !recoveryEmail) setRecoveryEmail(accountEmail); }, [securityOpen, accountEmail, recoveryEmail]);
${remainingAnchor}`);

const securityAnchor = '</View><Text style={styles.fieldLabel}>Change password</Text>';
must('Account Security content anchor missing', code.includes(securityAnchor));
const detailsCard = `</View><View style={{ backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.line }}>
  <Text style={{ color: C.text, fontWeight: '900', fontSize: 17, marginBottom: 12 }}>Your Earnzo Account</Text>
  <View style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F0F0F3' }}><Text style={{ color: C.muted, fontSize: 11, fontWeight: '800' }}>NAME</Text><Text style={{ color: C.text, fontSize: 15, fontWeight: '800', marginTop: 3 }}>{name || 'Not set'}</Text></View>
  <View style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F0F0F3' }}><Text style={{ color: C.muted, fontSize: 11, fontWeight: '800' }}>USERNAME</Text><Text style={{ color: C.text, fontSize: 15, fontWeight: '800', marginTop: 3 }}>{username ? '@' + username : 'Not set'}</Text></View>
  <View style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F0F0F3' }}><Text style={{ color: C.muted, fontSize: 11, fontWeight: '800' }}>GOOGLE EMAIL</Text><Text selectable style={{ color: C.text, fontSize: 15, fontWeight: '800', marginTop: 3 }}>{accountEmail || 'Not available'}</Text></View>
  <View style={{ paddingVertical: 7 }}><Text style={{ color: C.muted, fontSize: 11, fontWeight: '800' }}>PHONE NUMBER</Text><Text selectable style={{ color: C.text, fontSize: 15, fontWeight: '800', marginTop: 3 }}>{accountPhone || 'Not linked'}</Text></View>
  <View style={{ marginTop: 10, backgroundColor: C.purpleSoft, borderRadius: 12, padding: 10 }}><Text style={{ color: C.purple, fontWeight: '900' }}>Sign-in: Google</Text>{!accountPhone ? <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Google sign-in phone number automatically share nahi karta, isliye phone tab tak “Not linked” dikhega jab tak Earnzo me phone linking feature add nahi hota.</Text> : null}</View>
</View><Text style={styles.fieldLabel}>Change password</Text>`;
code = code.replace(securityAnchor, detailsCard);

must('account details UI missing', code.includes('Your Earnzo Account'));
must('signed-in email state missing', code.includes('signedInEmail'));

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo account security profile applied: name, username, Google email and linked phone are visible from the real auth session.');
