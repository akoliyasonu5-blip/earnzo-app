const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo wallet payout flow active')) {
  console.log('Earnzo wallet/payout patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Wallet payout patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'wallet backend imports',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost, fetchStories, createStory, fetchNotifications, markNotificationsRead, recordRemoteView, fetchCreatorStats, fetchMonetizationStatus, applyForMonetization } from "./backend/client";',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost, fetchStories, createStory, fetchNotifications, markNotificationsRead, recordRemoteView, fetchCreatorStats, fetchMonetizationStatus, applyForMonetization, fetchWalletStatus, requestCreatorPayout } from "./backend/client";'
);

replaceOnce(
  'wallet states',
  '  const [monetizationState, setMonetizationState] = useState(null); const [monetizationApplying, setMonetizationApplying] = useState(false); // Earnzo monetization application active',
  '  const [monetizationState, setMonetizationState] = useState(null); const [monetizationApplying, setMonetizationApplying] = useState(false); // Earnzo monetization application active\n  const [walletState, setWalletState] = useState(null); const [payoutAmount, setPayoutAmount] = useState(""); const [payoutRequesting, setPayoutRequesting] = useState(false); // Earnzo wallet payout flow active'
);

replaceOnce(
  'wallet cloud sync request',
  '      const [storyResult, notificationResult, statsResult, monetizationResult] = await Promise.all([fetchStories(), fetchNotifications(cloudUserId), fetchCreatorStats(cloudUserId), fetchMonetizationStatus(cloudUserId)]);',
  '      const [storyResult, notificationResult, statsResult, monetizationResult, walletResult] = await Promise.all([fetchStories(), fetchNotifications(cloudUserId), fetchCreatorStats(cloudUserId), fetchMonetizationStatus(cloudUserId), fetchWalletStatus(cloudUserId, country.code)]);'
);

replaceOnce(
  'wallet cloud sync result',
  '      setMonetizationState(monetizationResult || null);',
  '      setMonetizationState(monetizationResult || null);\n      setWalletState(walletResult || null);\n      if (Number.isFinite(Number(walletResult?.availableBalance))) setWalletBalance(Number(walletResult.availableBalance));'
);

replaceOnce(
  'payout request handler',
  '  const submitMonetizationApplication = async () => {',
  `  const submitPayoutRequest = async () => {
    if (!backendEnabled) return Alert.alert("Payout", "Cloud backend connect hona zaroori hai.");
    if (String(monetizationState?.status || "") !== "approved") return Alert.alert("Payout locked", "Payout sirf monetization approval ke baad request kiya ja sakta hai.");
    if (!String(payoutOwner || "").trim()) return Alert.alert("Payout details required", "Account holder / payout owner details pehle complete kare.");
    const amount = Number(String(payoutAmount || "").replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount < 1) return Alert.alert("Enter payout amount", "Valid amount enter kare.");
    if (amount > Number(walletState?.availableBalance || 0)) return Alert.alert("Insufficient balance", "Available creator wallet balance se zyada amount request nahi kar sakte.");
    setPayoutRequesting(true);
    try {
      const result = await requestCreatorPayout({
        creatorId: cloudUserId,
        amount,
        currencyCode: country.code,
        payoutMethod,
        payoutOwner,
        countryKey,
        language: languageKey,
      });
      const nextWallet = result?.wallet || null;
      setWalletState(nextWallet);
      if (Number.isFinite(Number(nextWallet?.availableBalance))) setWalletBalance(Number(nextWallet.availableBalance));
      setPayoutAmount("");
      Alert.alert("Payout request submitted ✅", "Request Earnzo processing ke liye submit ho gayi. Is step par paisa automatically transfer nahi hota.");
    } catch (e) {
      Alert.alert("Payout request failed", String(e?.message || e || "Please try again"));
    } finally {
      setPayoutRequesting(false);
    }
  };
  const submitMonetizationApplication = async () => {`
);

replaceOnce(
  'earn wallet props',
  'profileName={name} language={languageKey} monetizationState={monetizationState} monetizationApplying={monetizationApplying} onApplyMonetization={submitMonetizationApplication} />;',
  'profileName={name} language={languageKey} monetizationState={monetizationState} monetizationApplying={monetizationApplying} onApplyMonetization={submitMonetizationApplication} walletState={walletState} payoutAmount={payoutAmount} setPayoutAmount={setPayoutAmount} payoutRequesting={payoutRequesting} onRequestPayout={submitPayoutRequest} />;'
);

replaceOnce(
  'earn wallet signature',
  'function Earn({ wallet, country, followers, views, eligible, kycStatus, setKycStatus, kycDocType, setKycDocType, setCountryKey, payoutOwner, setPayoutOwner, payoutMethod, setPayoutMethod, payoutStatus, setPayoutStatus, profileName, language, monetizationState, monetizationApplying, onApplyMonetization }) {',
  'function Earn({ wallet, country, followers, views, eligible, kycStatus, setKycStatus, kycDocType, setKycDocType, setCountryKey, payoutOwner, setPayoutOwner, payoutMethod, setPayoutMethod, payoutStatus, setPayoutStatus, profileName, language, monetizationState, monetizationApplying, onApplyMonetization, walletState, payoutAmount, setPayoutAmount, payoutRequesting, onRequestPayout }) {'
);

replaceOnce(
  'wallet card mount',
  '<MonetizationCard followers={followers} views={views} eligible={eligible} /><MonetizationApplicationCard state={monetizationState} eligible={eligible} kycStatus={kycStatus} payoutOwner={payoutOwner} payoutMethod={payoutMethod} applying={monetizationApplying} onApply={onApplyMonetization} country={country} /><View style={styles.tipCard}>',
  '<MonetizationCard followers={followers} views={views} eligible={eligible} /><MonetizationApplicationCard state={monetizationState} eligible={eligible} kycStatus={kycStatus} payoutOwner={payoutOwner} payoutMethod={payoutMethod} applying={monetizationApplying} onApply={onApplyMonetization} country={country} /><CreatorWalletPayoutCard state={walletState} monetizationState={monetizationState} country={country} payoutOwner={payoutOwner} payoutMethod={payoutMethod} amount={payoutAmount} setAmount={setPayoutAmount} requesting={payoutRequesting} onRequest={onRequestPayout} /><View style={styles.tipCard}>'
);

const anchor = 'function MonetizationApplicationCard({ state, eligible, kycStatus, payoutOwner, payoutMethod, applying, onApply, country }) {';
if (!code.includes(anchor)) throw new Error('Wallet payout patch failed: monetization component anchor not found');
const walletComponent = `function CreatorWalletPayoutCard({ state, monetizationState, country, payoutOwner, payoutMethod, amount, setAmount, requesting, onRequest }) {
  const available = Number(state?.availableBalance || 0);
  const totalEarned = Number(state?.totalEarned || 0);
  const reserved = Number(state?.reserved || 0);
  const paidOut = Number(state?.paidOut || 0);
  const approved = String(monetizationState?.status || "") === "approved";
  const payouts = Array.isArray(state?.payouts) ? state.payouts.slice(0, 5) : [];
  const moneyText = (value) => \`${'${country.currency}'}${'${Number(value || 0).toFixed(2)}'}\`;
  return <View style={styles.tipCard}>
    <View style={styles.progressHead}><Text style={styles.bold}>Creator Wallet & Payout</Text><Text style={{ color: C.green, fontWeight: "900" }}>{moneyText(available)}</Text></View>
    <Text style={[styles.muted, { marginTop: 5 }]}>Available balance</Text>
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
      <View><Text style={styles.muted}>Total earned</Text><Text style={styles.bold}>{moneyText(totalEarned)}</Text></View>
      <View><Text style={styles.muted}>Processing</Text><Text style={styles.bold}>{moneyText(reserved)}</Text></View>
      <View><Text style={styles.muted}>Paid</Text><Text style={styles.bold}>{moneyText(paidOut)}</Text></View>
    </View>
    {!approved ? <View style={[styles.statusCard, { marginTop: 12 }]}><Text style={styles.bold}>Payout locked</Text><Text style={styles.muted}>Monetization approval ke baad payout request unlock hoga.</Text></View> : null}
    {approved && available <= 0 ? <View style={[styles.statusCard, { marginTop: 12 }]}><Text style={styles.bold}>No payout balance yet</Text><Text style={styles.muted}>Approved creator revenue Earnzo ke verified earning records ke through wallet me credit hoga.</Text></View> : null}
    {approved && available > 0 ? <View style={{ marginTop: 12 }}>
      <Text style={styles.bold}>Request payout</Text>
      <Text style={[styles.muted, { marginTop: 4 }]}>{payoutOwner ? \`${'${payoutMethod}'} • ${'${payoutOwner}'}\` : "Complete payout owner details first"}</Text>
      <TextInput style={[styles.input, { marginTop: 10 }]} keyboardType="decimal-pad" placeholder={\`Amount in ${'${country.code}'}\`} value={amount} onChangeText={setAmount} />
      <Pressable disabled={requesting || !payoutOwner} style={[styles.primary, (requesting || !payoutOwner) && { opacity: 0.5 }]} onPress={onRequest}><Text style={styles.primaryText}>{requesting ? "Submitting..." : "Request Payout"}</Text></Pressable>
      <Text style={[styles.noteLeft, { marginTop: 8 }]}>Payout request submit karne se paisa turant transfer nahi hota. Earnzo processing/payment completion ke baad status Paid hoga.</Text>
    </View> : null}
    {payouts.length ? <View style={{ marginTop: 14 }}><Text style={styles.bold}>Recent payout requests</Text>{payouts.map((p) => <View key={String(p.id)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#ECECF2" }}><View><Text style={{ fontWeight: "800", color: C.text }}>{moneyText(p.amount)}</Text><Text style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{p.payoutMethod || payoutMethod}</Text></View><Text style={{ color: p.status === "paid" ? C.green : p.status === "rejected" ? C.pink : C.purple, fontWeight: "900", textTransform: "capitalize" }}>{String(p.status || "pending")}</Text></View>)}</View> : null}
  </View>;
}

`;
code = code.replace(anchor, walletComponent + anchor);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo wallet payout flow applied: cloud wallet balance, payout request gating, status history and safe non-instant payment messaging.');
