const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo social polish security active')) {
  console.log('Earnzo social polish/security patch already applied.');
  process.exit(0);
}

function nextFunctionEnd(start) {
  const next = code.indexOf('\nfunction ', start + 12);
  if (next < 0) throw new Error('Social polish patch failed: next function boundary not found');
  return next;
}

function replaceFunction(name, replacement) {
  const start = code.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Social polish patch failed: ${name} not found`);
  const end = nextFunctionEnd(start);
  code = code.slice(0, start) + replacement + '\n' + code.slice(end + 1);
}

// Cloud support + real account security helpers.
const authImport = 'import { authConfigured, signInEmail, signUpEmail, sendPhoneOtp, verifyPhoneOtp, signInGoogle, signOutAuth } from "./backend/auth";';
if (code.includes(authImport)) {
  code = code.replace(authImport, 'import { authConfigured, signInEmail, signUpEmail, sendPhoneOtp, verifyPhoneOtp, signInGoogle, signOutAuth, changeAuthPassword, sendPasswordRecovery } from "./backend/auth";\nimport { fetchSupportRequests, submitSupportRequest } from "./backend/support";');
} else if (!code.includes('./backend/support')) {
  throw new Error('Social polish patch failed: secure auth import not found');
}

// Pass identity/support actions into Settings and Support Center.
code = code.replace('<SupportCenter visible={supportOpen}', '<SupportCenter userId={cloudUserId} visible={supportOpen}');
code = code.replace('<AccountSettings visible={settingsOpen}', '<AccountSettings userId={cloudUserId} openSupport={() => { setSettingsOpen(false); setSupportOpen(true); }} visible={settingsOpen}');

// Make voice/video calling discoverable from creator profile, not only inside chat.
code = code.replace('blockedCreators={blockedCreators} onBlock={handleBlockCreator} onMessage={openMessageThread} />', 'blockedCreators={blockedCreators} onBlock={handleBlockCreator} onMessage={openMessageThread} onStartCall={startCall} />');
code = code.replace('function PublicCreatorModal({ creator, posts, close, onFollow, onReport, blockedCreators, onBlock, onMessage }) {', 'function PublicCreatorModal({ creator, posts, close, onFollow, onReport, blockedCreators, onBlock, onMessage, onStartCall }) {');
const messageButton = "        <Pressable disabled={isBlocked} style={[styles.secondary, { marginTop: 10 }, isBlocked && { opacity: 0.5 }]} onPress={() => onMessage(creator)}><Text style={styles.secondaryText}>{isBlocked ? 'Messaging unavailable' : 'Message'}</Text></Pressable>";
if (code.includes(messageButton)) {
  code = code.replace(messageButton, `        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Pressable disabled={isBlocked} style={{ flex: 1, borderRadius: 16, backgroundColor: '#F0EDFF', paddingVertical: 11, alignItems: 'center', opacity: isBlocked ? 0.5 : 1 }} onPress={() => onStartCall?.(creator, 'voice')}><Text style={{ color: '#5B3EE8', fontWeight: '900' }}>📞 Voice Call</Text></Pressable>
          <Pressable disabled={isBlocked} style={{ flex: 1, borderRadius: 16, backgroundColor: '#F0EDFF', paddingVertical: 11, alignItems: 'center', opacity: isBlocked ? 0.5 : 1 }} onPress={() => onStartCall?.(creator, 'video')}><Text style={{ color: '#5B3EE8', fontWeight: '900' }}>📹 Video Call</Text></Pressable>
        </View>
        <Pressable disabled={isBlocked} style={[styles.secondary, { marginTop: 10 }, isBlocked && { opacity: 0.5 }]} onPress={() => onMessage(creator)}><Text style={styles.secondaryText}>{isBlocked ? 'Messaging unavailable' : '✉️ Message'}</Text></Pressable>`);
}

// Clear labeled call actions inside an open chat too.
code = code.replace('<Text style={{ fontSize: 20 }}>📞</Text>', '<Text style={{ fontSize: 13, fontWeight: "900", color: C.purple }}>📞 Voice</Text>');
code = code.replace('<Text style={{ fontSize: 20 }}>📹</Text>', '<Text style={{ fontSize: 13, fontWeight: "900", color: C.purple }}>📹 Video</Text>');

replaceFunction('Header', `function Header({ name, profilePhoto, country, wallet, openEarn, openProfile, openSearch, openNotifications, unreadNotifications, language, openLanguage, openMessages, unreadMessages }) { /* Earnzo social polish security active */
  const Quick = ({ icon, label, onPress, badge }) => <Pressable onPress={onPress} style={{ flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}><View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F2F7', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 17 }}>{icon}</Text>{badge > 0 ? <View style={{ position: 'absolute', top: -4, right: -5, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#E53E52', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}><Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>{badge > 99 ? '99+' : badge}</Text></View> : null}</View><Text numberOfLines={1} style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginTop: 3 }}>{label}</Text></Pressable>;
  return <View style={{ backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: C.line }}>
    <View style={{ minHeight: 62, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}><View style={{ width: 43, height: 43, borderRadius: 13, overflow: 'hidden', marginRight: 9 }}><Image source={require('./assets/earnzo-icon.png')} style={styles.fill} resizeMode="cover" /></View><View style={{ flexShrink: 1 }}><Text numberOfLines={1} style={{ fontSize: 22, fontWeight: '900', color: C.text }}>Earnzo</Text><Text numberOfLines={1} style={{ color: C.muted, fontSize: 11 }}>Create • Connect • Earn</Text></View></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}><Pressable onPress={openEarn} style={{ paddingHorizontal: 11, height: 38, borderRadius: 19, backgroundColor: C.purpleSoft, alignItems: 'center', justifyContent: 'center', marginRight: 7 }}><Text numberOfLines={1} style={{ color: C.purple, fontWeight: '900' }}>{country?.currency || '₹'}{wallet}</Text></Pressable><Pressable onPress={openProfile} style={{ width: 38, height: 38, borderRadius: 19, overflow: 'hidden', backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' }}>{profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.fill} /> : <Text style={{ color: '#FFF', fontWeight: '900' }}>{(name || 'E')[0].toUpperCase()}</Text>}</Pressable></View>
    </View>
    <View style={{ flexDirection: 'row', paddingHorizontal: 6, paddingBottom: 5 }}>
      <Quick icon="🌐" label={String(language || 'EN').toUpperCase()} onPress={openLanguage} />
      <Quick icon="✉️" label="Messages" onPress={openMessages} badge={Number(unreadMessages || 0)} />
      <Quick icon="🔔" label="Alerts" onPress={openNotifications} badge={Number(unreadNotifications || 0)} />
      <Quick icon="🔎" label="Search" onPress={openSearch} />
    </View>
  </View>;
}`);

replaceFunction('HomeVideo', `function HomeVideo({ uri }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [controls, setControls] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    try { player.play(); } catch {}
    const timer = setInterval(() => { try { setCurrent(Number(player.currentTime || 0)); setDuration(Number(player.duration || 0)); } catch {} }, 400);
    return () => { clearInterval(timer); try { player.pause(); } catch {} };
  }, [player]);
  useEffect(() => { if (!controls || !playing) return; const t = setTimeout(() => setControls(false), 2600); return () => clearTimeout(t); }, [controls, playing]);
  const toggle = () => { try { if (playing) player.pause(); else player.play(); setPlaying(!playing); setControls(true); } catch {} };
  const seek = (delta) => { try { player.currentTime = Math.max(0, Math.min(Number(player.duration || 0), Number(player.currentTime || 0) + delta)); setControls(true); } catch {} };
  const time = (s) => { const v = Math.max(0, Math.floor(Number(s || 0))); return Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0'); };
  const percent = duration > 0 ? Math.max(0, Math.min(100, current / duration * 100)) : 0;
  return <Pressable style={[styles.youtubeMedia, { backgroundColor: '#000' }]} onPress={() => setControls((x) => !x)}>
    <VideoView ref={videoRef} player={player} style={styles.fill} nativeControls={false} contentFit="contain" allowsFullscreen />
    {controls ? <View pointerEvents="box-none" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
        <Pressable onPress={() => seek(-10)} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontWeight: '900' }}>↶10</Text></Pressable>
        <Pressable onPress={toggle} style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontSize: 28 }}>{playing ? '❚❚' : '▶'}</Text></Pressable>
        <Pressable onPress={() => seek(10)} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontWeight: '900' }}>10↷</Text></Pressable>
      </View>
      <View style={{ position: 'absolute', left: 12, right: 12, bottom: 10 }}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>{time(current)} / {time(duration)}</Text><View style={{ flex: 1 }} /><Pressable onPress={() => videoRef.current?.enterFullscreen?.()} style={{ padding: 7 }}><Text style={{ color: '#FFF', fontSize: 19 }}>⛶</Text></Pressable></View><View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' }}><View style={{ height: 3, borderRadius: 2, width: percent + '%', backgroundColor: '#FFF' }} /></View></View>
    </View> : null}
  </Pressable>;
}`);

replaceFunction('SupportCenter', `function SupportCenter({ visible, close, tickets, setTickets, userId }) {
  const [section, setSection] = useState('home'); const [category, setCategory] = useState(supportCategories[0]); const [message, setMessage] = useState(''); const [feedback, setFeedback] = useState(''); const [busy, setBusy] = useState(false);
  const supportEmail = String(process.env.EXPO_PUBLIC_EARNZO_SUPPORT_EMAIL || '').trim();
  useEffect(() => { if (!visible || !userId) return; fetchSupportRequests(userId).then((r) => { if (Array.isArray(r?.tickets)) setTickets(r.tickets); }).catch((e) => console.log('Support sync failed', e?.message || e)); }, [visible, userId]);
  const createTicket = async (requestType = 'support', subject = '') => {
    const text = message.trim(); if (!text) return Alert.alert('Problem describe kare'); if (busy) return; setBusy(true);
    try { const t = await submitSupportRequest({ userId, requestType, category, subject: subject || category, message: text, data: { source: 'android-app' } }); setTickets((old) => [t, ...old.filter((x) => x.id !== t.id)]); setMessage(''); setSection('tickets'); Alert.alert('Request company ko send ho gayi ✅', 'Ticket ID: ' + t.id); }
    catch (e) { Alert.alert('Support request failed', String(e?.message || e || 'Please try again')); }
    finally { setBusy(false); }
  };
  const sendFeedback = async () => { if (!feedback.trim() || busy) return; setBusy(true); try { const t = await submitSupportRequest({ userId, requestType: 'feedback', category: 'Feedback', subject: 'App feedback', message: feedback.trim(), data: { source: 'android-app' } }); setTickets((old) => [t, ...old.filter((x) => x.id !== t.id)]); setFeedback(''); setSection('home'); Alert.alert('Feedback company ko send ho gaya ✅'); } catch (e) { Alert.alert('Feedback failed', String(e?.message || e)); } finally { setBusy(false); } };
  const safeTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  return <Modal visible={visible} animationType="slide" onRequestClose={close}><SafeAreaView style={{ flex: 1, backgroundColor: C.bg, paddingTop: safeTop }}><View style={{ minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: '#FFF' }}><Pressable onPress={section === 'home' ? close : () => setSection('home')} style={{ width: 72 }}><Text style={{ color: C.purple, fontWeight: '900', fontSize: 17 }}>‹ Back</Text></Pressable><Text style={{ flex: 1, textAlign: 'center', fontWeight: '900', fontSize: 21, color: C.text }}>Earnzo Support</Text><View style={{ width: 72 }} /></View>
    {section === 'home' && <ScrollView contentContainerStyle={styles.page}><View style={styles.supportHero}><Text style={styles.supportHeroTitle}>How can we help?</Text><Text style={styles.supportHeroText}>Aapki problem direct Earnzo company support queue me jayegi.</Text></View>{supportEmail ? <View style={{ backgroundColor: '#FFF', padding: 14, borderRadius: 16, marginBottom: 12 }}><Text style={styles.bold}>Customer Support Email</Text><Text selectable style={{ color: C.purple, marginTop: 5, fontWeight: '800' }}>{supportEmail}</Text></View> : <View style={{ backgroundColor: C.purpleSoft, padding: 14, borderRadius: 16, marginBottom: 12 }}><Text style={{ color: C.purple, fontWeight: '900' }}>✓ In-app company support active</Text><Text style={{ color: C.muted, marginTop: 4 }}>Official email admin configure karne ke baad yahan bhi dikhega.</Text></View>}<SupportItem icon="!" title="Report a Problem" sub="Bug, login, upload, call, wallet, KYC" onPress={() => setSection('report')} /><SupportItem icon="▣" title="My Support Requests" sub={`${tickets.length} request(s)`} onPress={() => setSection('tickets')} /><SupportItem icon="🛡" title="Account Recovery & Safety" sub="ID recovery, hacked account, privacy" onPress={() => { setCategory('Account / Profile'); setMessage(''); setSection('report'); }} /><SupportItem icon="₹" title="Creator & Monetization Help" sub="Eligibility, KYC, payouts, earnings" onPress={() => { setCategory('Monetization'); setSection('report'); }} /><SupportItem icon="✦" title="Feedback & Suggestions" sub="Tell Earnzo what should improve" onPress={() => setSection('feedback')} /><SupportItem icon="☷" title="Community & Legal" sub="Safety, copyright, platform rules" onPress={() => setSection('terms')} /></ScrollView>}
    {section === 'report' && <ScrollView contentContainerStyle={styles.page}><Text style={styles.sectionTitle}>Send Request to Earnzo</Text><Text style={styles.fieldLabel}>Issue category</Text><View style={styles.rowWrap}>{supportCategories.map((x) => <Chip key={x} text={x} active={category === x} onPress={() => setCategory(x)} />)}</View><TextInput style={[styles.bigInput, { minHeight: 150 }]} multiline placeholder="Problem detail me bataye. Kab hua, kis screen par hua, kya error aaya..." value={message} onChangeText={setMessage} /><Pressable style={[styles.primary, busy && { opacity: 0.5 }]} disabled={busy} onPress={() => createTicket(category === 'Account / Profile' ? 'account_recovery' : 'support')}><Text style={styles.primaryText}>{busy ? 'Sending...' : 'Send to Earnzo Support'}</Text></Pressable></ScrollView>}
    {section === 'tickets' && <ScrollView contentContainerStyle={styles.page}><Text style={styles.sectionTitle}>My Requests</Text>{tickets.length ? tickets.map((t) => <View key={t.id} style={styles.ticketCard}><View style={styles.progressHead}><Text style={styles.bold}>{t.id}</Text><Text style={styles.ticketStatus}>{t.status || 'submitted'}</Text></View><Text style={styles.muted}>{t.category || t.requestType}</Text><Text style={{ marginTop: 8 }}>{t.message}</Text><Text style={styles.noteLeft}>Submitted → Under Review → Resolved</Text></View>) : <View style={styles.emptyCard}><Text style={styles.bold}>No support requests</Text></View>}</ScrollView>}
    {section === 'feedback' && <ScrollView contentContainerStyle={styles.page}><Text style={styles.sectionTitle}>Feedback & Suggestions</Text><TextInput style={[styles.bigInput, { minHeight: 160 }]} multiline placeholder="Aap Earnzo me kya dekhna chahte hain?" value={feedback} onChangeText={setFeedback} /><Pressable style={[styles.primary, busy && { opacity: 0.5 }]} disabled={busy} onPress={sendFeedback}><Text style={styles.primaryText}>{busy ? 'Sending...' : 'Send Feedback'}</Text></Pressable></ScrollView>}
    {section === 'terms' && <ScrollView contentContainerStyle={styles.page}><Text style={styles.sectionTitle}>Community & Legal</Text><Text style={styles.helpText}>Earnzo par safe content, authentic accounts, copyright respect, no scam/fraud, no harassment aur creator monetization rules follow karne honge. Security ke liye OTP/password kabhi kisi ko share na kare.</Text></ScrollView>}
  </SafeAreaView></Modal>;
}`);

replaceFunction('AccountSettings', `function AccountSettings({ visible, close, name, username, setName, setUsername, lastNameChangeAt, setLastNameChangeAt, deactivate, logout, blockedCreators = [], onUnblock, userId, openSupport }) {
  const [editOpen, setEditOpen] = useState(false); const [blockedOpen, setBlockedOpen] = useState(false); const [securityOpen, setSecurityOpen] = useState(false); const [newName, setNewName] = useState(name); const [newUsername, setNewUsername] = useState(username); const [newPassword, setNewPassword] = useState(''); const [recoveryEmail, setRecoveryEmail] = useState(''); const [recoveryMessage, setRecoveryMessage] = useState(''); const [busy, setBusy] = useState(false);
  const remaining = daysRemaining(lastNameChangeAt, NAME_COOLDOWN_DAYS); const safeTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const save = () => { if (remaining > 0) return Alert.alert('Name change locked', remaining + ' days baad dobara name / channel name change kar sakte hain.'); if (!newName.trim() || !newUsername.trim()) return; setName(newName.trim()); setUsername(newUsername.trim().replace(/\s/g, '').toLowerCase()); setLastNameChangeAt(Date.now()); setEditOpen(false); Alert.alert('Profile name updated ✅', 'Next change 60 days baad available hoga.'); };
  const changePassword = async () => { if (newPassword.length < 8) return Alert.alert('Password minimum 8 characters ka rakhe.'); if (busy) return; setBusy(true); try { await changeAuthPassword(newPassword); setNewPassword(''); Alert.alert('Password changed ✅', 'Naya password secure account par update ho gaya.'); } catch (e) { Alert.alert('Password change unavailable', String(e?.message || e || 'Secure login required')); } finally { setBusy(false); } };
  const sendRecovery = async () => { if (!recoveryEmail.includes('@')) return Alert.alert('Valid recovery email enter kare.'); if (busy) return; setBusy(true); try { await sendPasswordRecovery(recoveryEmail); Alert.alert('Recovery email sent ✅', 'Inbox/spam folder check kare.'); } catch (e) { Alert.alert('Recovery email unavailable', String(e?.message || e || 'Secure email login required')); } finally { setBusy(false); } };
  const requestCompanyRecovery = async () => { if (!recoveryMessage.trim()) return Alert.alert('Request detail likhe.'); if (busy) return; setBusy(true); try { const t = await submitSupportRequest({ userId, requestType: 'account_recovery', category: 'Account / Profile', subject: 'ID / account recovery request', message: recoveryMessage.trim(), contactEmail: recoveryEmail.trim(), data: { username, name } }); setRecoveryMessage(''); Alert.alert('Company recovery request submitted ✅', 'Ticket ID: ' + t.id); } catch (e) { Alert.alert('Request failed', String(e?.message || e || 'Please try again')); } finally { setBusy(false); } };
  return <Modal visible={visible} animationType="slide" onRequestClose={close}><SafeAreaView style={{ flex: 1, backgroundColor: C.bg, paddingTop: safeTop }}><View style={{ minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: C.line }}><Pressable onPress={close} style={{ width: 72 }}><Text style={{ color: C.purple, fontWeight: '900', fontSize: 17 }}>‹ Back</Text></Pressable><Text style={{ flex: 1, textAlign: 'center', fontWeight: '900', fontSize: 21, color: C.text }}>Settings & Privacy</Text><View style={{ width: 72 }} /></View><ScrollView contentContainerStyle={styles.page}><SupportItem icon="👤" title="Account & Channel" sub={remaining > 0 ? `Name change available in ${remaining} days` : 'Name / username settings'} onPress={() => setEditOpen(true)} /><SupportItem icon="🛡" title="Account Security" sub="Password, recovery, ID protection" onPress={() => setSecurityOpen(true)} /><SupportItem icon="🔒" title="Privacy Center" sub={`${blockedCreators.length} blocked creator(s) • safety controls`} onPress={() => setBlockedOpen(true)} /><SupportItem icon="🔔" title="Notifications" sub="Likes, comments, tags, followers, messages" onPress={() => Alert.alert('Notifications', 'In-app activity notifications active hain. Phone push notification production FCM setup ke baad enable hoga.')} /><SupportItem icon="🌐" title="Language & Region" sub="Country, language and currency" onPress={() => Alert.alert('Language & Region', 'Home ke language button se language/region change kare.')} /><SupportItem icon="?" title="Customer Support" sub="Problem direct Earnzo company ko send kare" onPress={openSupport} /><Pressable style={styles.dangerButton} onPress={deactivate}><Text style={styles.dangerText}>Deactivate ID (30-day recovery)</Text></Pressable><Pressable style={styles.secondary} onPress={logout}><Text style={styles.secondaryText}>Logout</Text></Pressable></ScrollView>
    <BlockedCreatorsModal visible={blockedOpen} close={() => setBlockedOpen(false)} items={blockedCreators} onUnblock={onUnblock} />
    <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}><View style={styles.modalBg}><View style={styles.sheet}><SheetHeader title="Edit Account & Channel" close={() => setEditOpen(false)} /><Text style={styles.helpText}>Name aur channel name change ke beech 60 days cooldown hai.</Text><TextInput style={styles.input} placeholder="Display name" value={newName} onChangeText={setNewName} editable={remaining === 0} /><TextInput style={[styles.input, { marginTop: 10 }]} placeholder="Channel username" value={newUsername} onChangeText={setNewUsername} editable={remaining === 0} /><Pressable style={[styles.primary, remaining > 0 && { opacity: 0.5 }]} onPress={save}><Text style={styles.primaryText}>{remaining > 0 ? `${remaining} days remaining` : 'Save Changes'}</Text></Pressable></View></View></Modal>
    <Modal visible={securityOpen} animationType="slide" onRequestClose={() => setSecurityOpen(false)}><SafeAreaView style={{ flex: 1, backgroundColor: C.bg, paddingTop: safeTop }}><View style={{ minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: C.line }}><Pressable onPress={() => setSecurityOpen(false)} style={{ width: 72 }}><Text style={{ color: C.purple, fontWeight: '900' }}>‹ Back</Text></Pressable><Text style={{ flex: 1, textAlign: 'center', fontWeight: '900', fontSize: 20 }}>Account Security</Text><View style={{ width: 72 }} /></View><ScrollView contentContainerStyle={styles.page}><View style={{ padding: 15, borderRadius: 18, backgroundColor: C.purpleSoft, marginBottom: 14 }}><Text style={{ color: C.purple, fontWeight: '900', fontSize: 16 }}>Protect your Earnzo ID</Text><Text style={{ color: C.muted, marginTop: 5 }}>OTP/password kisi ko share na kare. Password change real secure login session par hi hota hai.</Text></View><Text style={styles.fieldLabel}>Change password</Text><TextInput style={styles.input} placeholder="New password (minimum 8 characters)" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" /><Pressable style={[styles.primary, busy && { opacity: 0.5 }]} disabled={busy} onPress={changePassword}><Text style={styles.primaryText}>Change Password</Text></Pressable><Text style={styles.fieldLabel}>Password recovery email</Text><TextInput style={styles.input} placeholder="name@gmail.com / Zoho email" value={recoveryEmail} onChangeText={setRecoveryEmail} autoCapitalize="none" keyboardType="email-address" /><Pressable style={styles.secondary} disabled={busy} onPress={sendRecovery}><Text style={styles.secondaryText}>Send Password Recovery Link</Text></Pressable><Text style={[styles.fieldLabel, { marginTop: 18 }]}>ID / account recovery request to Earnzo</Text><TextInput style={[styles.bigInput, { minHeight: 130 }]} multiline placeholder="ID change, hacked account, number/email lost, recovery problem detail..." value={recoveryMessage} onChangeText={setRecoveryMessage} /><Pressable style={[styles.primary, busy && { opacity: 0.5 }]} disabled={busy} onPress={requestCompanyRecovery}><Text style={styles.primaryText}>{busy ? 'Submitting...' : 'Send Request to Company'}</Text></Pressable></ScrollView></SafeAreaView></Modal>
  </SafeAreaView></Modal>;
}`);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo social polish/security applied: unclipped header, clean watch player, visible call actions, account security and cloud company support.');
