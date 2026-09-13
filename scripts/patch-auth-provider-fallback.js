const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo auth test fallback active')) {
  console.log('Earnzo auth provider fallback already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Auth fallback patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'auth state marker',
  '  const [emailAddress, setEmailAddress] = useState(""); const [emailPassword, setEmailPassword] = useState(""); const [authBusy, setAuthBusy] = useState(false); // Earnzo secure auth options active',
  '  const [emailAddress, setEmailAddress] = useState(""); const [emailPassword, setEmailPassword] = useState(""); const [authBusy, setAuthBusy] = useState(false); // Earnzo secure auth options active\n  const testLoginEnabled = process.env.EXPO_PUBLIC_ENABLE_TEST_LOGIN === "true"; // Earnzo auth test fallback active'
);

replaceOnce(
  'test helper',
  '  const doGoogleLogin = async () => {',
  '  const finishTestAuth = (source = "test") => {\n    const suffix = String(source || "test").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "test";\n    if (!name.trim()) setName("Earnzo Tester");\n    if (!username.trim()) setUsername("tester_" + suffix);\n    setOtp(""); setEmailPassword(""); setStage("app");\n  };\n  const doGoogleLogin = async () => {'
);

replaceOnce(
  'google disabled fallback',
  '    catch (e) { Alert.alert("Google login failed", String(e?.message || e || "Please try again")); }',
  '    catch (e) {\n      const msg = String(e?.message || e || "Please try again");\n      if (testLoginEnabled && /provider.*not enabled|unsupported provider/i.test(msg)) {\n        Alert.alert("Google provider pending", "Google OAuth Supabase me abhi enabled nahi hai. Testing build me temporary login use karein.", [{ text: "Cancel", style: "cancel" }, { text: "Test Login", onPress: () => finishTestAuth("google") }]);\n      } else Alert.alert("Google login failed", msg);\n    }'
);

replaceOnce(
  'email invalid credentials help',
  '    } catch (e) { Alert.alert(createAccount ? "Account create failed" : "Email login failed", String(e?.message || e || "Please try again")); }',
  '    } catch (e) {\n      const msg = String(e?.message || e || "Please try again");\n      if (!createAccount && /invalid login credentials/i.test(msg)) {\n        Alert.alert("Earnzo account not found", "Gmail/Zoho ka existing password yahan use nahi hota. First time Create Account dabakar Earnzo password set karein.", [{ text: "OK" }, { text: "Create Account", onPress: () => doEmailAuth(true) }]);\n      } else Alert.alert(createAccount ? "Account create failed" : "Email login failed", msg);\n    }'
);

replaceOnce(
  'phone provider fallback',
  '    catch (e) { Alert.alert("OTP send failed", String(e?.message || e || "Please try again")); }',
  '    catch (e) {\n      const msg = String(e?.message || e || "Please try again");\n      if (testLoginEnabled && /unsupported phone provider|phone provider/i.test(msg)) {\n        setMobile(phone); setStage("otp");\n        Alert.alert("Testing OTP", "SMS provider abhi connected nahi hai. Is testing APK me OTP 123456 use karein.");\n      } else Alert.alert("OTP send failed", msg);\n    }'
);

replaceOnce(
  'test otp verify',
  '  const doVerifyPhoneOtp = async () => {\n    if (!String(otp || "").trim()) return Alert.alert("OTP enter kare");',
  '  const doVerifyPhoneOtp = async () => {\n    if (!String(otp || "").trim()) return Alert.alert("OTP enter kare");\n    if (testLoginEnabled && String(otp || "").trim() === "123456") { finishTestAuth("phone"); return; }'
);

code = code.replace('note="Real SMS OTP"', 'note={testLoginEnabled ? "Testing build: provider unavailable ho to OTP 123456" : "Real SMS OTP"}');
code = code.replace('note="OTP SMS provider se aayega"', 'note={testLoginEnabled ? "Testing OTP: 123456" : "OTP SMS provider se aayega"}');
code = code.replace('New account par email verification required ho sakti hai.', 'First time Create Account karein. Gmail/Zoho ka password nahi, Earnzo ka naya password use hoga.');

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo auth provider fallback applied for testing builds.');
