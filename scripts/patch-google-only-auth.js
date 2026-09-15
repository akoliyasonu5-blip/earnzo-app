const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo Google-only auth active')) {
  console.log('Earnzo Google-only auth already applied.');
  process.exit(0);
}

const oldWelcome = '<Text style={styles.authSub}>Login with Google, email or phone number</Text><Pressable style={styles.primary} disabled={authBusy} onPress={doGoogleLogin}><Text style={styles.primaryText}>{authBusy ? "Please wait..." : "G  Continue with Google"}</Text></Pressable><Pressable style={styles.secondary} onPress={() => setStage("emailAuth")}><Text style={styles.secondaryText}>✉  Gmail / Zoho Mail</Text></Pressable><Pressable style={styles.secondary} onPress={() => { setAuthMode("login"); setStage("phone"); }}><Text style={styles.secondaryText}>📱  Phone Number</Text></Pressable><Text style={styles.note}>{authConfigured ? "Secure login powered by Supabase Auth" : "Secure login configuration missing in this build"}</Text>';
const newWelcome = '<Text style={styles.authSub}>Continue with Google to sign in</Text><Pressable style={styles.primary} disabled={authBusy} onPress={doGoogleLogin}><Text style={styles.primaryText}>{authBusy ? "Please wait..." : "G  Continue with Google"}</Text></Pressable><Text style={styles.note}>{authConfigured ? "Secure Google sign-in powered by Supabase Auth" : "Secure login configuration missing in this build"}</Text>';

if (!code.includes(oldWelcome)) {
  throw new Error('Google-only auth patch failed: welcome login options not found');
}
code = code.replace(oldWelcome, newWelcome);

const oldFallback = '      if (/provider.*not enabled|unsupported provider/i.test(msg)) {\n        if (testLoginEnabled) Alert.alert("Google provider pending", "Google OAuth Supabase me abhi enabled nahi hai. Testing build me temporary login use karein.", [{ text: "Cancel", style: "cancel" }, { text: "Test Login", onPress: () => finishTestAuth("google") }]);\n        else Alert.alert("Google login setup pending", "Google sign-in abhi Supabase me enable nahi hai. Filhaal Gmail/Zoho Email Login ya Phone OTP use kare.");\n      } else Alert.alert("Google login failed", msg);';
const newFallback = '      if (/provider.*not enabled|unsupported provider/i.test(msg)) {\n        Alert.alert("Google sign-in unavailable", "Google sign-in abhi available nahi hai. Please thodi der baad dobara try karein.");\n      } else Alert.alert("Google login failed", msg);';
if (code.includes(oldFallback)) code = code.replace(oldFallback, newFallback);

code = code.replace('export default function App() {', '// Earnzo Google-only auth active\nexport default function App() {');

if (code.includes('Gmail / Zoho Mail') || code.includes('📱  Phone Number')) {
  throw new Error('Google-only auth patch failed: alternate login buttons still visible');
}

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo Google-only auth applied: only Continue with Google is visible on login.');
