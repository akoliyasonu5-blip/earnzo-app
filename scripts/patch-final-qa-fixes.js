const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo final QA fixes active')) {
  console.log('Earnzo final QA fixes already applied.');
  process.exit(0);
}

function assertReplace(label, from, to) {
  if (!code.includes(from)) throw new Error('Final QA patch failed: ' + label + ' target not found');
  code = code.replace(from, to);
}

function functionRange(name) {
  const start = code.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Final QA patch failed: ' + name + ' not found');
  let end = code.indexOf('\nfunction ', start + 12);
  if (end < 0) end = code.indexOf('\n\nconst styles =', start + 12);
  if (end < 0) throw new Error('Final QA patch failed: end of ' + name + ' not found');
  return { start, end };
}

// Marker.
code = code.replace('export default function App() {', '// Earnzo final QA fixes active\nexport default function App() {');

// Better Google-provider error and clearer email/password sign-in guidance.
code = code.replace(
  'catch (e) { Alert.alert("Google login failed", String(e?.message || e || "Please try again")); }',
  'catch (e) { const msg = String(e?.message || e || "Please try again"); Alert.alert("Google login failed", /provider is not enabled|unsupported provider/i.test(msg) ? "Google sign-in abhi Supabase me enable nahi hai. Filhaal Gmail/Zoho Email Login ya Phone OTP use kare." : msg); }'
);

const emailAuthStart = code.indexOf('  const doEmailAuth = async (createAccount) => {');
const emailAuthEnd = code.indexOf('  const doSendPhoneOtp = async () => {', emailAuthStart);
if (emailAuthStart < 0 || emailAuthEnd < 0) throw new Error('Final QA patch failed: email auth helper not found');
const emailAuthReplacement = `  const doEmailAuth = async (createAccount) => {
    const email = String(emailAddress || "").trim().toLowerCase();
    if (!email.includes("@") || emailPassword.length < 6) return Alert.alert("Valid email aur minimum 6-character password enter kare.");
    if (authBusy) return;
    setAuthBusy(true);
    try {
      const data = createAccount ? await signUpEmail(email, emailPassword) : await signInEmail(email, emailPassword);
      if (createAccount && !data?.session) return Alert.alert("Email verification sent", "Inbox me verification link open kare. Uske baad isi Earnzo password se Sign In kare — Gmail/Zoho account ka password use nahi hoga.");
      if (!data?.user) throw new Error("Login session create nahi hui. Please try again.");
      finishSecureAuth(data.user);
    } catch (e) {
      const msg = String(e?.message || e || "Please try again");
      if (/invalid login credentials/i.test(msg)) return Alert.alert("Email login failed", "Email ya Earnzo password match nahi ho raha. Gmail/Zoho ka original password nahi, Create Account ke time banaya hua Earnzo password use kare. Password bhool gaye ho to Reset Password dabaye.");
      if (/email not confirmed/i.test(msg)) return Alert.alert("Email verify kare", "Inbox me Earnzo verification link open karke email verify kare, phir Sign In kare.");
      Alert.alert(createAccount ? "Account create failed" : "Email login failed", msg);
    } finally { setAuthBusy(false); }
  };
`;
code = code.slice(0, emailAuthStart) + emailAuthReplacement + code.slice(emailAuthEnd);

// Add a password-reset action directly on the Gmail/Zoho screen.
{
  const { start, end } = functionRange('EmailAuthScreen');
  let block = code.slice(start, end);
  const oldNote = '<Text style={styles.note}>New account par email verification required ho sakti hai.</Text>';
  const newNote = '<Pressable disabled={busy} onPress={async () => { const address = String(email || "").trim().toLowerCase(); if (!address.includes("@")) return Alert.alert("Valid email enter kare"); try { await sendPasswordRecovery(address); Alert.alert("Reset link sent ✅", "Inbox/spam folder check kare aur naya Earnzo password set kare."); } catch (e) { Alert.alert("Reset failed", String(e?.message || e || "Please try again")); } }}><Text style={{ color: C.purple, fontWeight: "900", textAlign: "center", marginTop: 12 }}>Forgot / Reset Password</Text></Pressable><Text style={styles.note}>New account par email verification required ho sakti hai. Sign In me wahi Earnzo password use kare jo Create Account ke time banaya tha.</Text>';
  if (!block.includes(oldNote)) throw new Error('Final QA patch failed: EmailAuthScreen note not found');
  block = block.replace(oldNote, newNote);
  code = code.slice(0, start) + block + code.slice(end);
}

// Edit Profile must include display name and username, not only bio/category/link.
assertReplace(
  'Profile call setters',
  '<Profile name={name} username={username} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto}',
  '<Profile name={name} setName={setName} username={username} setUsername={setUsername} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto}'
);

{
  const { start, end } = functionRange('Profile');
  let block = code.slice(start, end);
  block = block.replace(
    'function Profile({ name, username, profilePhoto, setProfilePhoto,',
    'function Profile({ name, setName, username, setUsername, profilePhoto, setProfilePhoto,'
  );
  block = block.replace(
    '  const [draftBio, setDraftBio] = useState(bio || ""); const [draftLink, setDraftLink] = useState(profileLink || ""); const [draftCategory, setDraftCategory] = useState(profileCategory || "Digital Creator");',
    '  const [draftName, setDraftName] = useState(name || ""); const [draftUsername, setDraftUsername] = useState(username || ""); const [draftBio, setDraftBio] = useState(bio || ""); const [draftLink, setDraftLink] = useState(profileLink || ""); const [draftCategory, setDraftCategory] = useState(profileCategory || "Digital Creator");'
  );
  block = block.replace(
    '  const saveProfile = () => { setBio(draftBio.trim().slice(0, 220)); setProfileLink(draftLink.trim().slice(0, 160)); setProfileCategory(draftCategory.trim().slice(0, 60) || "Digital Creator"); setEditOpen(false); Alert.alert("Profile updated ✅", "Bio aur creator profile save ho gaya."); };',
    '  const saveProfile = () => { const nextName = draftName.trim().slice(0, 60); const nextUsername = draftUsername.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9._]/g, "").toLowerCase().slice(0, 30); if (!nextName) return Alert.alert("Name required"); if (nextUsername.length < 3) return Alert.alert("Username minimum 3 characters ka rakhe"); setName(nextName); setUsername(nextUsername); setBio(draftBio.trim().slice(0, 220)); setProfileLink(draftLink.trim().slice(0, 160)); setProfileCategory(draftCategory.trim().slice(0, 60) || "Digital Creator"); setEditOpen(false); Alert.alert("Profile updated ✅", "Name, username aur creator profile save ho gaya."); };'
  );
  block = block.replace(
    'onPress={() => { setDraftBio(bio || ""); setDraftLink(profileLink || ""); setDraftCategory(profileCategory || "Digital Creator"); setEditOpen(true); }}',
    'onPress={() => { setDraftName(name || ""); setDraftUsername(username || ""); setDraftBio(bio || ""); setDraftLink(profileLink || ""); setDraftCategory(profileCategory || "Digital Creator"); setEditOpen(true); }}'
  );
  const bioAnchor = '<Text style={styles.fieldLabel}>Bio</Text><TextInput multiline maxLength={220}';
  if (!block.includes(bioAnchor)) throw new Error('Final QA patch failed: profile Bio field anchor not found');
  block = block.replace(
    bioAnchor,
    '<Text style={styles.fieldLabel}>Name</Text><TextInput style={styles.input} maxLength={60} placeholder="Your name" value={draftName} onChangeText={setDraftName} /><Text style={styles.fieldLabel}>Username</Text><TextInput style={styles.input} maxLength={30} autoCapitalize="none" placeholder="username" value={draftUsername} onChangeText={setDraftUsername} /><Text style={{ color: C.muted, fontSize: 11, marginTop: 5, marginBottom: 8 }}>Public profile: @{draftUsername.trim().replace(/^@+/, "").toLowerCase() || "username"}</Text><Text style={styles.fieldLabel}>Bio</Text><TextInput multiline maxLength={220}'
  );
  code = code.slice(0, start) + block + code.slice(end);
}

// Keep ownership stable for Your Story by storing creatorId, not only the username/handle.
code = code.replace(
  'const s = { id: localId, name: name || "You", handle: `@${username || "you"}`, mediaType:',
  'const s = { id: localId, creatorId: cloudUserId, name: name || "You", handle: `@${username || "you"}`, mediaType:'
);
code = code.replace(
  'const mapped = remoteStories.map((s) => ({ ...s, isMine: !!myHandle && String(s.handle || "") === myHandle, uploadStatus: "Uploaded ✓" }));',
  'const mapped = remoteStories.map((s) => ({ ...s, isMine: (!!cloudUserId && String(s.creatorId || s.userId || "") === String(cloudUserId)) || (!!myHandle && String(s.handle || "") === myHandle), uploadStatus: "Uploaded ✓" }));'
);

// Final Home had regressed Your Story to a plain tick. Restore a visible story preview + add badge.
{
  const { start, end } = functionRange('Home');
  let block = code.slice(start, end);
  const oldStory = '<Pressable style={styles.storyCard} onPress={ownStory ? () => openStory((stories || []).indexOf(ownStory)) : addStory}><View style={styles.storyAdd}><Text style={styles.storyAddText}>{ownStory ? "✓" : "+"}</Text></View><Text style={styles.storyCardText}>{ownStory?.uploadStatus === "Uploading..." ? "Uploading..." : "Your Story"}</Text></Pressable>';
  const newStory = '<View style={styles.storyCard}>{ownStory ? <Pressable style={styles.storyOwnPress} onPress={() => openStory((stories || []).indexOf(ownStory))}>{ownStory.mediaType === "photo" && ownStory.mediaUri ? <Image source={{ uri: ownStory.mediaUri }} style={styles.storyOwnMedia} resizeMode="cover" /> : (ownStory.coverUri || ownStory.thumbnailUri) ? <Image source={{ uri: ownStory.coverUri || ownStory.thumbnailUri }} style={styles.storyOwnMedia} resizeMode="cover" /> : <View style={styles.storyOwnVideo}><Text style={styles.storyOwnVideoIcon}>▶</Text></View>}</Pressable> : <Pressable onPress={addStory}><View style={styles.storyAdd}><Text style={styles.storyAddText}>+</Text></View></Pressable>}{ownStory ? <Pressable style={styles.storyAddBadge} onPress={addStory}><Text style={styles.storyAddBadgeText}>+</Text></Pressable> : null}<Text style={styles.storyCardText}>{ownStory?.uploadStatus === "Uploading..." ? "Uploading..." : ownStory?.uploadStatus?.startsWith("Upload failed") ? "Upload failed" : "Your Story"}</Text></View>';
  if (!block.includes(oldStory)) throw new Error('Final QA patch failed: final Home Your Story target not found');
  block = block.replace(oldStory, newStory);
  code = code.slice(0, start) + block + code.slice(end);
}

// Guardrails so these regressions cannot silently return in the release build.
if (!code.includes('Forgot / Reset Password')) throw new Error('Final QA verification failed: password reset UI missing');
if (!code.includes('placeholder="username" value={draftUsername}')) throw new Error('Final QA verification failed: username editor missing');
if (!code.includes('style={styles.storyOwnMedia}')) throw new Error('Final QA verification failed: Your Story preview missing');
if (!code.includes('creatorId: cloudUserId')) throw new Error('Final QA verification failed: story creatorId missing');

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo final QA fixes applied: auth guidance/reset, editable name+username, stable story ownership and visible Your Story preview.');
