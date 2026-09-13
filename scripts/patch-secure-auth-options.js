const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo secure auth options active')) {
  console.log('Earnzo secure auth options already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Secure auth patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'auth import',
  'import AsyncStorage from "@react-native-async-storage/async-storage";',
  'import AsyncStorage from "@react-native-async-storage/async-storage";\nimport { authConfigured, signInEmail, signUpEmail, sendPhoneOtp, verifyPhoneOtp, signInGoogle, signOutAuth } from "./backend/auth";'
);

replaceOnce(
  'auth state',
  '  const [mobile, setMobile] = useState(""); const [otp, setOtp] = useState("");',
  '  const [mobile, setMobile] = useState(""); const [otp, setOtp] = useState("");\n  const [emailAddress, setEmailAddress] = useState(""); const [emailPassword, setEmailPassword] = useState(""); const [authBusy, setAuthBusy] = useState(false); // Earnzo secure auth options active'
);

const loadingAnchor = '  if (!loaded) return <View style={styles.center}><Brand /><Text style={styles.muted}>Loading Earnzo...</Text></View>;';
if (!code.includes(loadingAnchor)) throw new Error('Secure auth patch failed: loading anchor not found');
const authHelpers = `  const normalizedPhone = () => {\n    const raw = String(mobile || "").replace(/\\s/g, "");\n    return raw.startsWith("+") ? raw : (raw.length === 10 ? \`+91\${raw}\` : raw);\n  };\n  const finishSecureAuth = (user) => {\n    if (user?.phone) setMobile(String(user.phone));\n    const mail = String(user?.email || "").trim();\n    const metaName = String(user?.user_metadata?.full_name || user?.user_metadata?.name || "").trim();\n    if (!name.trim() && metaName) setName(metaName);\n    if (!username.trim() && mail) setUsername(mail.split("@")[0].replace(/[^a-zA-Z0-9._]/g, "").toLowerCase());\n    setOtp(""); setEmailPassword("");\n    if (!name.trim() || !username.trim()) setStage("profileSetup"); else setStage("app");\n  };\n  const doGoogleLogin = async () => {\n    if (authBusy) return;\n    setAuthBusy(true);\n    try { const data = await signInGoogle(); finishSecureAuth(data?.user); }\n    catch (e) { Alert.alert("Google login failed", String(e?.message || e || "Please try again")); }\n    finally { setAuthBusy(false); }\n  };\n  const doEmailAuth = async (createAccount) => {\n    const email = String(emailAddress || "").trim().toLowerCase();\n    if (!email.includes("@") || emailPassword.length < 6) return Alert.alert("Valid email aur minimum 6-character password enter kare.");\n    if (authBusy) return;\n    setAuthBusy(true);\n    try {\n      const data = createAccount ? await signUpEmail(email, emailPassword) : await signInEmail(email, emailPassword);\n      if (createAccount && !data?.session) return Alert.alert("Email verification sent", "Apne Gmail/Zoho mail inbox me verification link open kare, phir Sign In kare.");\n      finishSecureAuth(data?.user);\n    } catch (e) { Alert.alert(createAccount ? "Account create failed" : "Email login failed", String(e?.message || e || "Please try again")); }\n    finally { setAuthBusy(false); }\n  };\n  const doSendPhoneOtp = async () => {\n    const phone = normalizedPhone();\n    if (!/^\\+[1-9]\\d{7,14}$/.test(phone)) return Alert.alert("Phone number country code ke saath enter kare, jaise +9198XXXXXXXX");\n    if (authBusy) return; setAuthBusy(true);\n    try { await sendPhoneOtp(phone); setMobile(phone); setStage("otp"); }\n    catch (e) { Alert.alert("OTP send failed", String(e?.message || e || "Please try again")); }\n    finally { setAuthBusy(false); }\n  };\n  const doVerifyPhoneOtp = async () => {\n    if (!String(otp || "").trim()) return Alert.alert("OTP enter kare");\n    if (authBusy) return; setAuthBusy(true);\n    try { const data = await verifyPhoneOtp(normalizedPhone(), otp); finishSecureAuth(data?.user); }\n    catch (e) { Alert.alert("OTP verification failed", String(e?.message || e || "Please try again")); }\n    finally { setAuthBusy(false); }\n  };\n\n`;
code = code.replace(loadingAnchor, authHelpers + loadingAnchor);

const authStart = code.indexOf('  if (stage === "welcome") return ');
const profileStart = code.indexOf('  if (stage === "profileSetup")', authStart);
if (authStart < 0 || profileStart < 0) throw new Error('Secure auth patch failed: auth stage block not found');
const stages = `  if (stage === "welcome") return <SafeAreaView style={styles.safe}><StatusBar barStyle="dark-content" /><ScrollView contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled"><Brand /><View style={styles.authCard}><Text style={styles.authTitle}>Welcome to Earnzo</Text><Text style={styles.authSub}>Login with Google, email or phone number</Text><Pressable style={styles.primary} disabled={authBusy} onPress={doGoogleLogin}><Text style={styles.primaryText}>{authBusy ? "Please wait..." : "G  Continue with Google"}</Text></Pressable><Pressable style={styles.secondary} onPress={() => setStage("emailAuth")}><Text style={styles.secondaryText}>✉  Gmail / Zoho Mail</Text></Pressable><Pressable style={styles.secondary} onPress={() => { setAuthMode("login"); setStage("phone"); }}><Text style={styles.secondaryText}>📱  Phone Number</Text></Pressable><Text style={styles.note}>{authConfigured ? "Secure login powered by Supabase Auth" : "Secure login configuration missing in this build"}</Text></View></ScrollView></SafeAreaView>;\n  if (stage === "emailAuth") return <EmailAuthScreen email={emailAddress} setEmail={setEmailAddress} password={emailPassword} setPassword={setEmailPassword} busy={authBusy} onBack={() => setStage("welcome")} onSignIn={() => doEmailAuth(false)} onCreate={() => doEmailAuth(true)} />;\n  if (stage === "phone") return <AuthScreen title="Phone Login" subtitle="Country code ke saath mobile number enter kare" value={mobile} setValue={setMobile} placeholder="+9198XXXXXXXX" keyboardType="phone-pad" button={authBusy ? "Sending..." : "Send OTP"} note="Real SMS OTP" onBack={() => setStage("welcome")} onPress={doSendPhoneOtp} />;\n  if (stage === "otp") return <AuthScreen title="Verify OTP" subtitle={\`OTP sent to \${normalizedPhone()}\`} value={otp} setValue={setOtp} placeholder="Enter SMS OTP" keyboardType="number-pad" button={authBusy ? "Verifying..." : "Verify"} note="OTP SMS provider se aayega" onBack={() => setStage("phone")} onPress={doVerifyPhoneOtp} />;\n`;
code = code.slice(0, authStart) + stages + code.slice(profileStart);

const authScreenAnchor = 'function AuthScreen({ title, subtitle, value, setValue, placeholder, keyboardType, button, onPress, note, onBack }) {';
if (!code.includes(authScreenAnchor)) throw new Error('Secure auth patch failed: AuthScreen anchor not found');
const emailScreen = `function EmailAuthScreen({ email, setEmail, password, setPassword, busy, onBack, onSignIn, onCreate }) {\n  return <SafeAreaView style={styles.safe}><StatusBar barStyle="dark-content" /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled"><Pressable onPress={onBack}><Text style={styles.backText}>‹ Back</Text></Pressable><Brand /><View style={styles.authCard}><Text style={styles.authTitle}>Email Login</Text><Text style={styles.authSub}>Gmail, Zoho Mail ya kisi bhi valid email se login kare.</Text><TextInput style={styles.input} placeholder="name@gmail.com / name@zohomail.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /><TextInput style={[styles.input, { marginTop: 10 }]} placeholder="Password" value={password} onChangeText={setPassword} autoCapitalize="none" secureTextEntry /><Pressable style={[styles.primary, busy && { opacity: 0.5 }]} disabled={busy} onPress={onSignIn}><Text style={styles.primaryText}>{busy ? "Please wait..." : "Sign In"}</Text></Pressable><Pressable style={styles.secondary} disabled={busy} onPress={onCreate}><Text style={styles.secondaryText}>Create Account</Text></Pressable><Text style={styles.note}>New account par email verification required ho sakti hai.</Text></View></ScrollView></KeyboardAvoidingView></SafeAreaView>;\n}\n`;
code = code.replace(authScreenAnchor, emailScreen + authScreenAnchor);

// Keep secure Supabase session and local app state aligned on logout.
code = code.replace('logout={() => { setSettingsOpen(false); setStage("welcome"); setTab("Home"); }}', 'logout={() => { signOutAuth().catch(() => {}); setSettingsOpen(false); setStage("welcome"); setTab("Home"); }}');

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo secure auth options applied: Google OAuth, Gmail/Zoho email/password and phone SMS OTP UI/flows.');
