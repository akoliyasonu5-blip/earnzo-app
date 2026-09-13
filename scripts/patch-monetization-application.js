const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo monetization application active')) {
  console.log('Earnzo monetization application patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Monetization patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'monetization imports',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost, fetchStories, createStory, fetchNotifications, markNotificationsRead, recordRemoteView, fetchCreatorStats } from "./backend/client";',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost, fetchStories, createStory, fetchNotifications, markNotificationsRead, recordRemoteView, fetchCreatorStats, fetchMonetizationStatus, applyForMonetization } from "./backend/client";'
);

replaceOnce(
  'monetization state',
  '  const [languageKey, setLanguageKey] = useState("en"); const [languageOpen, setLanguageOpen] = useState(false); // Earnzo global language region active',
  '  const [languageKey, setLanguageKey] = useState("en"); const [languageOpen, setLanguageOpen] = useState(false); // Earnzo global language region active\n  const [monetizationState, setMonetizationState] = useState(null); const [monetizationApplying, setMonetizationApplying] = useState(false); // Earnzo monetization application active'
);

replaceOnce(
  'monetization cloud sync request',
  '      const [storyResult, notificationResult, statsResult] = await Promise.all([fetchStories(), fetchNotifications(cloudUserId), fetchCreatorStats(cloudUserId)]);',
  '      const [storyResult, notificationResult, statsResult, monetizationResult] = await Promise.all([fetchStories(), fetchNotifications(cloudUserId), fetchCreatorStats(cloudUserId), fetchMonetizationStatus(cloudUserId)]);'
);

replaceOnce(
  'monetization cloud sync result',
  '      setValidViews(Number(statsResult?.views || 0));',
  '      setValidViews(Number(statsResult?.views || 0));\n      setMonetizationState(monetizationResult || null);'
);

replaceOnce(
  'monetization handler anchor',
  '  const openNotifications = async () => {',
  `  const submitMonetizationApplication = async () => {
    if (!backendEnabled) return Alert.alert("Monetization", "Cloud backend connect hona zaroori hai.");
    if (!eligible) return Alert.alert("Not eligible yet", "500 followers aur 2 lakh valid views complete kare.");
    setMonetizationApplying(true);
    try {
      const result = await applyForMonetization({
        creatorId: cloudUserId,
        countryKey,
        currencyCode: country.code,
        payoutMethod,
        payoutOwner,
        kycStatus,
        language: languageKey,
      });
      setMonetizationState(result || null);
      const status = String(result?.status || "");
      if (status === "kyc_required") Alert.alert("Eligibility complete ✅", "Ab KYC verification complete kare. Uske baad application policy review me jayegi.");
      else if (status === "pending_review") Alert.alert("Application submitted ✅", "KYC complete hai. Ab Earnzo policy/fraud review ke baad monetization approve karega.");
      else if (status === "approved") Alert.alert("Monetization active ✅", "Aapka creator monetization approved hai.");
      else Alert.alert("Monetization", result?.message || "Application status update ho gaya.");
    } catch (e) {
      Alert.alert("Monetization application failed", String(e?.message || e || "Please try again"));
    } finally {
      setMonetizationApplying(false);
    }
  };
  const openNotifications = async () => {`
);

replaceOnce(
  'earn monetization props',
  'profileName={name} language={languageKey} />;',
  'profileName={name} language={languageKey} monetizationState={monetizationState} monetizationApplying={monetizationApplying} onApplyMonetization={submitMonetizationApplication} />;'
);

replaceOnce(
  'earn monetization signature',
  'function Earn({ wallet, country, followers, views, eligible, kycStatus, setKycStatus, kycDocType, setKycDocType, setCountryKey, payoutOwner, setPayoutOwner, payoutMethod, setPayoutMethod, payoutStatus, setPayoutStatus, profileName, language }) {',
  'function Earn({ wallet, country, followers, views, eligible, kycStatus, setKycStatus, kycDocType, setKycDocType, setCountryKey, payoutOwner, setPayoutOwner, payoutMethod, setPayoutMethod, payoutStatus, setPayoutStatus, profileName, language, monetizationState, monetizationApplying, onApplyMonetization }) {'
);

replaceOnce(
  'monetization status card insertion',
  '<MonetizationCard followers={followers} views={views} eligible={eligible} /><View style={styles.tipCard}>',
  '<MonetizationCard followers={followers} views={views} eligible={eligible} /><MonetizationApplicationCard state={monetizationState} eligible={eligible} kycStatus={kycStatus} payoutOwner={payoutOwner} payoutMethod={payoutMethod} applying={monetizationApplying} onApply={onApplyMonetization} country={country} /><View style={styles.tipCard}>'
);

const anchor = 'function MonetizationCard({ followers, views, eligible }) {';
if (!code.includes(anchor)) throw new Error('Monetization patch failed: MonetizationCard anchor not found');
const component = `function MonetizationApplicationCard({ state, eligible, kycStatus, payoutOwner, payoutMethod, applying, onApply, country }) {
  const status = String(state?.status || (eligible ? 'eligible' : 'not_eligible'));
  const labels = {
    not_eligible: ['Locked', '500 followers aur 2 lakh valid views complete kare.'],
    eligible: ['Eligible ✅', 'Threshold complete hai. KYC aur payout details complete karke application submit kare.'],
    kyc_required: ['KYC required', 'Eligibility complete hai, lekin KYC verification pending hai.'],
    pending_review: ['Under review', 'Application Earnzo policy/fraud review me hai. Approval ke baad monetization active hoga.'],
    approved: ['Monetization active ✅', 'Approval complete. Eligible creator revenue Earnzo wallet me credit ho sakta hai.'],
    rejected: ['Review not approved', state?.application?.rejectionReason || 'Reason aur next steps review status me dikhaye jayenge.'],
  };
  const [title, sub] = labels[status] || ['Monetization', 'Status syncing...'];
  const canApply = eligible && status !== 'pending_review' && status !== 'approved';
  return <View style={styles.tipCard}>
    <View style={styles.progressHead}><Text style={styles.bold}>Monetization Status</Text><Text style={{ color: status === 'approved' ? C.green : C.purple, fontWeight: '900' }}>{title}</Text></View>
    <Text style={[styles.muted, { marginTop: 7 }]}>{sub}</Text>
    <Text style={[styles.muted, { marginTop: 8, fontSize: 11 }]}>KYC: {kycStatus} • Payout: {payoutOwner ? payoutMethod : 'Details required'} • {country.code}</Text>
    {state?.application?.submittedAt ? <Text style={[styles.muted, { marginTop: 4, fontSize: 10 }]}>Application submitted: {new Date(state.application.submittedAt).toLocaleDateString()}</Text> : null}
    {canApply ? <Pressable style={[styles.primary, applying && { opacity: 0.5 }]} disabled={applying} onPress={onApply}><Text style={styles.primaryText}>{applying ? 'Submitting...' : status === 'kyc_required' ? 'Update Application' : 'Apply for Monetization'}</Text></Pressable> : null}
    {status === 'pending_review' ? <View style={styles.statusCard}><Text style={styles.bold}>Next step</Text><Text style={styles.muted}>Earnzo review complete hone ka wait kare. Threshold complete hona automatic approval nahi hai.</Text></View> : null}
  </View>;
}

`;
code = code.replace(anchor, component + anchor);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo monetization application applied: eligibility status, KYC/payout gating and cloud application tracking.');
