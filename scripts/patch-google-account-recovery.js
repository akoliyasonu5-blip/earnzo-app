const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo Google recovery experience active')) {
  console.log('Earnzo Google recovery experience already applied.');
  process.exit(0);
}

function must(label, ok) {
  if (!ok) throw new Error('Google recovery experience patch failed: ' + label);
}

function functionRange(name) {
  const start = code.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Google recovery experience patch failed: ' + name + ' not found');
  let end = code.indexOf('\nfunction ', start + 12);
  if (end < 0) end = code.indexOf('\n\nconst styles =', start + 12);
  if (end < 0) throw new Error('Google recovery experience patch failed: end of ' + name + ' not found');
  return { start, end };
}

// Google-only recovery needs an external Google account recovery link.
if (!code.includes('  Linking,')) {
  const importAnchor = '  KeyboardAvoidingView,\n} from "react-native";';
  must('react-native import anchor missing', code.includes(importAnchor));
  code = code.replace(importAnchor, '  KeyboardAvoidingView,\n  Linking,\n} from "react-native";');
}

const { start, end } = functionRange('AccountSettings');
const replacement = `function AccountSettings({ visible, close, name, username, setName, setUsername, lastNameChangeAt, setLastNameChangeAt, deactivate, logout, blockedCreators = [], onUnblock, userId, openSupport, accountEmail = "", accountPhone = "" }) { /* Earnzo Google recovery experience active */
  const [editOpen, setEditOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newUsername, setNewUsername] = useState(username);
  const [recoveryContact, setRecoveryContact] = useState(accountEmail || '');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const remaining = daysRemaining(lastNameChangeAt, NAME_COOLDOWN_DAYS);
  const safeTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const accountId = String(userId || '').trim();
  const shortId = accountId ? ('EZ-' + accountId.slice(-8).toUpperCase()) : 'Creating...';

  useEffect(() => {
    if (securityOpen && accountEmail && !recoveryContact) setRecoveryContact(accountEmail);
  }, [securityOpen, accountEmail, recoveryContact]);

  const save = () => {
    if (remaining > 0) return Alert.alert('Name change locked', remaining + ' days baad dobara name / username change kar sakte hain.');
    const nextName = newName.trim();
    const nextUsername = newUsername.trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9._]/g, '').toLowerCase();
    if (!nextName) return Alert.alert('Name required');
    if (nextUsername.length < 3) return Alert.alert('Username minimum 3 characters ka rakhe.');
    setName(nextName.slice(0, 60));
    setUsername(nextUsername.slice(0, 30));
    setLastNameChangeAt(Date.now());
    setEditOpen(false);
    Alert.alert('Profile updated ✅', 'Name aur username save ho gaya.');
  };

  const openGoogleRecovery = async () => {
    try { await Linking.openURL('https://accounts.google.com/signin/recovery'); }
    catch { Alert.alert('Google recovery open nahi hua', 'Browser me Google Account Recovery open kare.'); }
  };

  const openGoogleSecurity = async () => {
    try { await Linking.openURL('https://myaccount.google.com/security'); }
    catch { Alert.alert('Google Account open nahi hua', 'Browser me myaccount.google.com open kare.'); }
  };

  const requestCompanyRecovery = async () => {
    const detail = recoveryMessage.trim();
    const contact = String(recoveryContact || accountEmail || '').trim().toLowerCase();
    if (detail.length < 10) return Alert.alert('Thoda detail likhe', 'Kam se kam 10 characters me problem describe kare.');
    if (!contact.includes('@')) return Alert.alert('Contact email required', 'Aisa email enter kare jahan Earnzo team aapse contact kar sake.');
    if (busy) return;
    setBusy(true);
    try {
      const t = await submitSupportRequest({
        userId: accountId || username || contact,
        requestType: 'account_recovery',
        category: 'Account / Profile',
        subject: 'Google sign-in / Earnzo ID recovery',
        message: detail,
        contactEmail: contact,
        data: {
          source: 'account-security-google-recovery',
          name: name || '',
          username: username || '',
          registeredGoogleEmail: accountEmail || '',
          linkedPhone: accountPhone || '',
          earnzoAccountId: accountId || '',
          signInProvider: 'google',
        },
      });
      setRecoveryMessage('');
      Alert.alert('Recovery request sent ✅', 'Ticket ID: ' + t.id + '\nEarnzo team ke paas account details automatically chali gayi hain.');
    } catch (e) {
      Alert.alert('Request send nahi hui', String(e?.message || e || 'Please try again'));
    } finally { setBusy(false); }
  };

  const DetailRow = ({ label, value, last = false }) => <View style={{ paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: '#F0F0F3' }}><Text style={{ color: C.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>{label}</Text><Text selectable style={{ color: C.text, fontSize: 15, fontWeight: '800', marginTop: 4 }}>{value || 'Not available'}</Text></View>;
  const Step = ({ n, title, text }) => <View style={{ flexDirection: 'row', marginTop: 12 }}><View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.purpleSoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}><Text style={{ color: C.purple, fontWeight: '900' }}>{n}</Text></View><View style={{ flex: 1 }}><Text style={{ color: C.text, fontWeight: '900' }}>{title}</Text><Text style={{ color: C.muted, marginTop: 3, lineHeight: 19 }}>{text}</Text></View></View>;

  return <Modal visible={visible} animationType="slide" onRequestClose={close}><SafeAreaView style={{ flex: 1, backgroundColor: C.bg, paddingTop: safeTop }}>
    <View style={{ minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: C.line }}><Pressable onPress={close} style={{ width: 72 }}><Text style={{ color: C.purple, fontWeight: '900', fontSize: 17 }}>‹ Back</Text></Pressable><Text style={{ flex: 1, textAlign: 'center', fontWeight: '900', fontSize: 21, color: C.text }}>Settings & Privacy</Text><View style={{ width: 72 }} /></View>
    <ScrollView contentContainerStyle={styles.page}>
      <SupportItem icon="👤" title="Account & Channel" sub={remaining > 0 ? 'Name change available in ' + remaining + ' days' : 'Name / username settings'} onPress={() => { setNewName(name || ''); setNewUsername(username || ''); setEditOpen(true); }} />
      <SupportItem icon="🛡" title="Account Security & Recovery" sub="Google sign-in • ID recovery • account protection" onPress={() => setSecurityOpen(true)} />
      <SupportItem icon="🔒" title="Privacy Center" sub={blockedCreators.length + ' blocked creator(s) • safety controls'} onPress={() => setBlockedOpen(true)} />
      <SupportItem icon="🔔" title="Notifications" sub="Likes, comments, tags, followers, messages" onPress={() => Alert.alert('Notifications', 'In-app activity notifications active hain. Phone push notification production FCM setup ke baad enable hoga.')} />
      <SupportItem icon="🌐" title="Language & Region" sub="Country, language and currency" onPress={() => Alert.alert('Language & Region', 'Home ke language button se language/region change kare.')} />
      <SupportItem icon="?" title="Customer Support" sub="Problem direct Earnzo company ko send kare" onPress={openSupport} />
      <Pressable style={styles.dangerButton} onPress={deactivate}><Text style={styles.dangerText}>Deactivate ID (30-day recovery)</Text></Pressable>
      <Pressable style={styles.secondary} onPress={logout}><Text style={styles.secondaryText}>Logout</Text></Pressable>
    </ScrollView>

    <BlockedCreatorsModal visible={blockedOpen} close={() => setBlockedOpen(false)} items={blockedCreators} onUnblock={onUnblock} />

    <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}><View style={styles.modalBg}><View style={styles.sheet}><SheetHeader title="Edit Account & Channel" close={() => setEditOpen(false)} /><Text style={styles.helpText}>Name aur username change ke beech 60 days cooldown hai.</Text><TextInput style={styles.input} placeholder="Display name" value={newName} onChangeText={setNewName} editable={remaining === 0} /><TextInput style={[styles.input, { marginTop: 10 }]} placeholder="Username" autoCapitalize="none" value={newUsername} onChangeText={setNewUsername} editable={remaining === 0} /><Pressable style={[styles.primary, remaining > 0 && { opacity: 0.5 }]} onPress={save}><Text style={styles.primaryText}>{remaining > 0 ? remaining + ' days remaining' : 'Save Changes'}</Text></Pressable></View></View></Modal>

    <Modal visible={securityOpen} animationType="slide" onRequestClose={() => setSecurityOpen(false)}><SafeAreaView style={{ flex: 1, backgroundColor: C.bg, paddingTop: safeTop }}>
      <View style={{ minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: C.line }}><Pressable onPress={() => setSecurityOpen(false)} style={{ width: 72 }}><Text style={{ color: C.purple, fontWeight: '900', fontSize: 17 }}>‹ Back</Text></Pressable><Text style={{ flex: 1, textAlign: 'center', fontWeight: '900', fontSize: 20 }}>Account & Recovery</Text><View style={{ width: 72 }} /></View>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={{ borderRadius: 20, padding: 17, backgroundColor: '#171722', marginBottom: 14 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#2A2B35', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Text style={{ fontSize: 23 }}>🛡️</Text></View><View style={{ flex: 1 }}><Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>Protected with Google</Text><Text style={{ color: '#C9CAD3', marginTop: 3 }}>No separate Earnzo password needed</Text></View><Text style={{ color: '#68E0A7', fontSize: 18, fontWeight: '900' }}>✓</Text></View><Text style={{ color: '#D7D8E1', marginTop: 13, lineHeight: 20 }}>Same Google account se login karte hi aapki Earnzo ID wapas open ho jayegi.</Text></View>

        <View style={{ backgroundColor: '#FFF', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 5, marginBottom: 14, borderWidth: 1, borderColor: C.line }}>
          <Text style={{ color: C.text, fontWeight: '900', fontSize: 17, paddingTop: 12, paddingBottom: 4 }}>Your account details</Text>
          <DetailRow label="NAME" value={name || 'Not set'} />
          <DetailRow label="USERNAME" value={username ? '@' + username : 'Not set'} />
          <DetailRow label="REGISTERED GOOGLE EMAIL" value={accountEmail || 'Not available'} />
          <DetailRow label="PHONE NUMBER" value={accountPhone || 'Not linked with Google sign-in'} />
          <DetailRow label="EARNZO ACCOUNT ID" value={shortId} last />
        </View>

        <View style={{ backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.line }}><Text style={{ color: C.text, fontWeight: '900', fontSize: 17 }}>Easy recovery</Text><Step n="1" title="App logout / uninstall ho gaya?" text="Continue with Google par wahi registered Google account select kare. Earnzo ID automatically restore hogi." /><Step n="2" title="Google account ka access nahi hai?" text="Pehle Google Account Recovery se email access wapas le. Earnzo aapka Google password nahi dekh sakta aur reset nahi kar sakta." /><Pressable onPress={openGoogleRecovery} style={{ backgroundColor: C.purple, borderRadius: 13, paddingVertical: 12, alignItems: 'center', marginTop: 14 }}><Text style={{ color: '#FFF', fontWeight: '900' }}>Recover Google Account</Text></Pressable><Pressable onPress={openGoogleSecurity} style={{ backgroundColor: C.purpleSoft, borderRadius: 13, paddingVertical: 12, alignItems: 'center', marginTop: 9 }}><Text style={{ color: C.purple, fontWeight: '900' }}>Google Security Settings</Text></Pressable></View>

        <View style={{ backgroundColor: '#FFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.line }}><Text style={{ color: C.text, fontWeight: '900', fontSize: 17 }}>Need Earnzo help?</Text><Text style={{ color: C.muted, marginTop: 5, lineHeight: 19 }}>ID open nahi ho rahi, username/account issue hai, ya registered Google email ka problem hai to request bheje. Account ID, username aur registered email ticket me automatically attach honge.</Text><Text style={[styles.fieldLabel, { marginTop: 16 }]}>Contact email</Text><TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="Email where we can contact you" value={recoveryContact} onChangeText={setRecoveryContact} /><Text style={[styles.fieldLabel, { marginTop: 12 }]}>Problem detail</Text><TextInput style={[styles.bigInput, { minHeight: 125 }]} multiline placeholder="Example: Same Google account se login karne par meri purani Earnzo ID open nahi ho rahi..." value={recoveryMessage} onChangeText={setRecoveryMessage} /><Pressable style={[styles.primary, busy && { opacity: 0.5 }]} disabled={busy} onPress={requestCompanyRecovery}><Text style={styles.primaryText}>{busy ? 'Sending...' : 'Send Recovery Request'}</Text></Pressable></View>

        <View style={{ backgroundColor: C.purpleSoft, borderRadius: 15, padding: 13, marginTop: 14 }}><Text style={{ color: C.purple, fontWeight: '900' }}>Security tip</Text><Text style={{ color: C.muted, marginTop: 4, lineHeight: 19 }}>Google password, OTP ya recovery code kabhi kisi ko share na kare — Earnzo support bhi ye details kabhi nahi mangega.</Text></View>
      </ScrollView>
    </SafeAreaView></Modal>
  </SafeAreaView></Modal>;
}`;

code = code.slice(0, start) + replacement + code.slice(end);

must('Google protected account UI missing', code.includes('Protected with Google'));
must('Google recovery action missing', code.includes('Recover Google Account'));
must('Earnzo recovery request missing', code.includes('Send Recovery Request'));

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo Google recovery experience applied: Google-only protection, clear account details, easy recovery and support handoff.');
