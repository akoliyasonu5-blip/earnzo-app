const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo final QA fixes active')) {
  console.log('Earnzo final QA fixes already applied.');
  process.exit(0);
}

function must(label, ok) {
  if (!ok) throw new Error('Final QA patch failed: ' + label);
}

function functionRange(name) {
  const start = code.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Final QA patch failed: ' + name + ' not found');
  let end = code.indexOf('\nfunction ', start + 12);
  if (end < 0) end = code.indexOf('\n\nconst styles =', start + 12);
  if (end < 0) throw new Error('Final QA patch failed: end of ' + name + ' not found');
  return { start, end };
}

code = code.replace('export default function App() {', '// Earnzo final QA fixes active\nexport default function App() {');

// Replace Google login helper after the testing-fallback patch has run.
{
  const re = /  const doGoogleLogin = async \(\) => \{[\s\S]*?\n  \};\n  const doEmailAuth = async \(createAccount\) => \{/;
  must('Google/email auth helper boundary not found', re.test(code));
  const replacement = `  const doGoogleLogin = async () => {
    if (authBusy) return;
    setAuthBusy(true);
    try { const data = await signInGoogle(); finishSecureAuth(data?.user); }
    catch (e) {
      const msg = String(e?.message || e || "Please try again");
      if (/provider.*not enabled|unsupported provider/i.test(msg)) {
        if (testLoginEnabled) Alert.alert("Google provider pending", "Google OAuth Supabase me abhi enabled nahi hai. Testing build me temporary login use karein.", [{ text: "Cancel", style: "cancel" }, { text: "Test Login", onPress: () => finishTestAuth("google") }]);
        else Alert.alert("Google login setup pending", "Google sign-in abhi Supabase me enable nahi hai. Filhaal Gmail/Zoho Email Login ya Phone OTP use kare.");
      } else Alert.alert("Google login failed", msg);
    }
    finally { setAuthBusy(false); }
  };
  const doEmailAuth = async (createAccount) => {`;
  code = code.replace(re, replacement);
}

// Replace the email helper so error messages are useful and verified accounts can sign in cleanly.
{
  const start = code.indexOf('  const doEmailAuth = async (createAccount) => {');
  const end = code.indexOf('  const doSendPhoneOtp = async () => {', start);
  must('email auth helper not found', start >= 0 && end > start);
  const replacement = `  const doEmailAuth = async (createAccount) => {
    const email = String(emailAddress || "").trim().toLowerCase();
    if (!email.includes("@") || emailPassword.length < 6) return Alert.alert("Valid email aur minimum 6-character password enter kare.");
    if (authBusy) return;
    setAuthBusy(true);
    try {
      const data = createAccount ? await signUpEmail(email, emailPassword) : await signInEmail(email, emailPassword);
      if (createAccount && !data?.session) return Alert.alert("Email verification sent", "Inbox me verification link open kare. Uske baad isi Earnzo password se Sign In kare — Gmail/Zoho account ka original password use nahi hoga.");
      if (!data?.user) throw new Error("Login session create nahi hui. Please try again.");
      finishSecureAuth(data.user);
    } catch (e) {
      const msg = String(e?.message || e || "Please try again");
      if (/invalid login credentials/i.test(msg)) return Alert.alert("Email login failed", "Email ya Earnzo password match nahi ho raha. Create Account ke time banaya hua Earnzo password use kare. Password bhool gaye ho to Reset Password dabaye.");
      if (/email not confirmed/i.test(msg)) return Alert.alert("Email verify kare", "Inbox me Earnzo verification link open karke email verify kare, phir Sign In kare.");
      Alert.alert(createAccount ? "Account create failed" : "Email login failed", msg);
    } finally { setAuthBusy(false); }
  };
`;
  code = code.slice(0, start) + replacement + code.slice(end);
}

// Add password reset on the email screen regardless of which helper note earlier patches wrote.
{
  const { start, end } = functionRange('EmailAuthScreen');
  let block = code.slice(start, end);
  const noteRe = /<Text style=\{styles\.note\}>[\s\S]*?<\/Text>/;
  must('EmailAuthScreen note not found', noteRe.test(block));
  const newNote = '<Pressable disabled={busy} onPress={async () => { const address = String(email || "").trim().toLowerCase(); if (!address.includes("@")) return Alert.alert("Valid email enter kare"); try { await sendPasswordRecovery(address); Alert.alert("Reset link sent ✅", "Inbox/spam folder check kare aur naya Earnzo password set kare."); } catch (e) { Alert.alert("Reset failed", String(e?.message || e || "Please try again")); } }}><Text style={{ color: C.purple, fontWeight: "900", textAlign: "center", marginTop: 12 }}>Forgot / Reset Password</Text></Pressable><Text style={styles.note}>First time Create Account karein. Verification ke baad wahi Earnzo password use karke Sign In karein.</Text>';
  block = block.replace(noteRe, newNote);
  code = code.slice(0, start) + block + code.slice(end);
}

// Edit Profile must expose name + username.
{
  const oldCall = '<Profile name={name} username={username} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto}';
  must('Profile call setters target not found', code.includes(oldCall));
  code = code.replace(oldCall, '<Profile name={name} setName={setName} username={username} setUsername={setUsername} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto}');

  const { start, end } = functionRange('Profile');
  let block = code.slice(start, end);
  must('Profile signature target not found', block.includes('function Profile({ name, username, profilePhoto, setProfilePhoto,'));
  block = block.replace('function Profile({ name, username, profilePhoto, setProfilePhoto,', 'function Profile({ name, setName, username, setUsername, profilePhoto, setProfilePhoto,');

  const stateOld = '  const [draftBio, setDraftBio] = useState(bio || ""); const [draftLink, setDraftLink] = useState(profileLink || ""); const [draftCategory, setDraftCategory] = useState(profileCategory || "Digital Creator");';
  must('Profile draft state target not found', block.includes(stateOld));
  block = block.replace(stateOld, '  const [draftName, setDraftName] = useState(name || ""); const [draftUsername, setDraftUsername] = useState(username || ""); const [draftBio, setDraftBio] = useState(bio || ""); const [draftLink, setDraftLink] = useState(profileLink || ""); const [draftCategory, setDraftCategory] = useState(profileCategory || "Digital Creator");');

  const saveOld = '  const saveProfile = () => { setBio(draftBio.trim().slice(0, 220)); setProfileLink(draftLink.trim().slice(0, 160)); setProfileCategory(draftCategory.trim().slice(0, 60) || "Digital Creator"); setEditOpen(false); Alert.alert("Profile updated ✅", "Bio aur creator profile save ho gaya."); };';
  must('Profile save target not found', block.includes(saveOld));
  block = block.replace(saveOld, '  const saveProfile = () => { const nextName = draftName.trim().slice(0, 60); const nextUsername = draftUsername.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9._]/g, "").toLowerCase().slice(0, 30); if (!nextName) return Alert.alert("Name required"); if (nextUsername.length < 3) return Alert.alert("Username minimum 3 characters ka rakhe"); setName(nextName); setUsername(nextUsername); setBio(draftBio.trim().slice(0, 220)); setProfileLink(draftLink.trim().slice(0, 160)); setProfileCategory(draftCategory.trim().slice(0, 60) || "Digital Creator"); setEditOpen(false); Alert.alert("Profile updated ✅", "Name, username aur creator profile save ho gaya."); };');

  const editOld = 'onPress={() => { setDraftBio(bio || ""); setDraftLink(profileLink || ""); setDraftCategory(profileCategory || "Digital Creator"); setEditOpen(true); }}';
  must('Profile edit button target not found', block.includes(editOld));
  block = block.replace(editOld, 'onPress={() => { setDraftName(name || ""); setDraftUsername(username || ""); setDraftBio(bio || ""); setDraftLink(profileLink || ""); setDraftCategory(profileCategory || "Digital Creator"); setEditOpen(true); }}');

  const bioAnchor = '<Text style={styles.fieldLabel}>Bio</Text><TextInput multiline maxLength={220}';
  must('Profile Bio anchor not found', block.includes(bioAnchor));
  block = block.replace(bioAnchor, '<Text style={styles.fieldLabel}>Name</Text><TextInput style={styles.input} maxLength={60} placeholder="Your name" value={draftName} onChangeText={setDraftName} /><Text style={styles.fieldLabel}>Username</Text><TextInput style={styles.input} maxLength={30} autoCapitalize="none" placeholder="username" value={draftUsername} onChangeText={setDraftUsername} /><Text style={{ color: C.muted, fontSize: 11, marginTop: 5, marginBottom: 8 }}>Public profile: @{draftUsername.trim().replace(/^@+/, "").toLowerCase() || "username"}</Text><Text style={styles.fieldLabel}>Bio</Text><TextInput multiline maxLength={220}');
  code = code.slice(0, start) + block + code.slice(end);
}

// Stable Your Story ownership: creatorId survives future username changes.
{
  const oldStoryObject = 'const s = { id: localId, name: name || "You", handle: `@${username || "you"}`, mediaType:';
  must('story object target not found', code.includes(oldStoryObject));
  code = code.replace(oldStoryObject, 'const s = { id: localId, creatorId: cloudUserId, name: name || "You", handle: `@${username || "you"}`, mediaType:');

  const oldMapped = 'const mapped = remoteStories.map((s) => ({ ...s, isMine: !!myHandle && String(s.handle || "") === myHandle, uploadStatus: "Uploaded ✓" }));';
  must('remote story ownership target not found', code.includes(oldMapped));
  code = code.replace(oldMapped, 'const mapped = remoteStories.map((s) => ({ ...s, isMine: (!!cloudUserId && String(s.creatorId || s.userId || "") === String(cloudUserId)) || (!!myHandle && String(s.handle || "") === myHandle), uploadStatus: "Uploaded ✓" }));');
}

// Final Home regressed the story thumbnail to a tick; restore the actual uploaded story preview.
{
  const { start, end } = functionRange('Home');
  let block = code.slice(start, end);
  const oldStory = '<Pressable style={styles.storyCard} onPress={ownStory ? () => openStory((stories || []).indexOf(ownStory)) : addStory}><View style={styles.storyAdd}><Text style={styles.storyAddText}>{ownStory ? "✓" : "+"}</Text></View><Text style={styles.storyCardText}>{ownStory?.uploadStatus === "Uploading..." ? "Uploading..." : "Your Story"}</Text></Pressable>';
  must('final Home Your Story target not found', block.includes(oldStory));
  const newStory = '<View style={styles.storyCard}>{ownStory ? <Pressable style={styles.storyOwnPress} onPress={() => openStory((stories || []).indexOf(ownStory))}>{ownStory.mediaType === "photo" && ownStory.mediaUri ? <Image source={{ uri: ownStory.mediaUri }} style={styles.storyOwnMedia} resizeMode="cover" /> : (ownStory.coverUri || ownStory.thumbnailUri) ? <Image source={{ uri: ownStory.coverUri || ownStory.thumbnailUri }} style={styles.storyOwnMedia} resizeMode="cover" /> : <View style={styles.storyOwnVideo}><Text style={styles.storyOwnVideoIcon}>▶</Text></View>}</Pressable> : <Pressable onPress={addStory}><View style={styles.storyAdd}><Text style={styles.storyAddText}>+</Text></View></Pressable>}{ownStory ? <Pressable style={styles.storyAddBadge} onPress={addStory}><Text style={styles.storyAddBadgeText}>+</Text></Pressable> : null}<Text style={styles.storyCardText}>{ownStory?.uploadStatus === "Uploading..." ? "Uploading..." : ownStory?.uploadStatus?.startsWith("Upload failed") ? "Upload failed" : "Your Story"}</Text></View>';
  block = block.replace(oldStory, newStory);
  code = code.slice(0, start) + block + code.slice(end);
}

must('password reset UI missing', code.includes('Forgot / Reset Password'));
must('username editor missing', code.includes('placeholder="username" value={draftUsername}'));
must('Your Story preview missing', code.includes('style={styles.storyOwnMedia}'));
must('story creatorId missing', code.includes('creatorId: cloudUserId'));

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo final QA fixes applied: auth guidance/reset, editable name+username, stable story ownership and visible Your Story preview.');
