const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo moderation safety active')) {
  console.log('Earnzo moderation/safety patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Moderation patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'moderation backend imports',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost, fetchStories, createStory, fetchNotifications, markNotificationsRead, recordRemoteView, fetchCreatorStats, fetchMonetizationStatus, applyForMonetization, fetchWalletStatus, requestCreatorPayout } from "./backend/client";',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost, fetchStories, createStory, fetchNotifications, markNotificationsRead, recordRemoteView, fetchCreatorStats, fetchMonetizationStatus, applyForMonetization, fetchWalletStatus, requestCreatorPayout, fetchBlockedCreators, toggleRemoteBlock, submitRemoteReport } from "./backend/client";'
);

replaceOnce(
  'moderation state',
  '  const [drafts, setDrafts] = useState([]); // Earnzo creator drafts active',
  '  const [drafts, setDrafts] = useState([]); // Earnzo creator drafts active\n  const [blockedCreators, setBlockedCreators] = useState([]); // Earnzo moderation safety active'
);

replaceOnce(
  'moderation cloud sync request',
  '      const [storyResult, notificationResult, statsResult, monetizationResult, walletResult] = await Promise.all([fetchStories(), fetchNotifications(cloudUserId), fetchCreatorStats(cloudUserId), fetchMonetizationStatus(cloudUserId), fetchWalletStatus(cloudUserId, country.code)]);',
  '      const [storyResult, notificationResult, statsResult, monetizationResult, walletResult, blockResult] = await Promise.all([fetchStories(cloudUserId), fetchNotifications(cloudUserId), fetchCreatorStats(cloudUserId), fetchMonetizationStatus(cloudUserId), fetchWalletStatus(cloudUserId, country.code), fetchBlockedCreators(cloudUserId)]);'
);

replaceOnce(
  'moderation cloud sync result',
  '      if (Number.isFinite(Number(walletResult?.availableBalance))) setWalletBalance(Number(walletResult.availableBalance));',
  '      if (Number.isFinite(Number(walletResult?.availableBalance))) setWalletBalance(Number(walletResult.availableBalance));\n      setBlockedCreators(Array.isArray(blockResult?.blocked) ? blockResult.blocked.map((x) => String(x?.id || x || "").trim()).filter(Boolean) : []);'
);

code = code.replace('const result = await searchRemote(q);', 'const result = await searchRemote(q, cloudUserId);');

replaceOnce(
  'block handler anchor',
  '  const submitPayoutRequest = async () => {',
  `  const handleBlockCreator = async (creatorOrId) => {
    const creatorKey = String(typeof creatorOrId === "string" ? creatorOrId : (creatorOrId?.handle || creatorOrId?.name || "")).trim();
    if (!creatorKey) return;
    const wasBlocked = blockedCreators.includes(creatorKey);
    try {
      const result = backendEnabled ? await toggleRemoteBlock(cloudUserId, creatorKey) : { blocked: !wasBlocked, blockedId: creatorKey };
      const isBlocked = !!result?.blocked;
      setBlockedCreators((old) => isBlocked ? Array.from(new Set([...old, creatorKey])) : old.filter((x) => x !== creatorKey));
      if (isBlocked) {
        setPosts((old) => old.filter((p) => String(p.handle || p.name || "").trim() !== creatorKey));
        setStories((old) => old.filter((s) => String(s.handle || s.name || "").trim() !== creatorKey));
        setNotifications((old) => old.filter((n) => String(n.actorId || "").trim() !== creatorKey));
        setPublicCreator(null);
        Alert.alert("Creator blocked", creatorKey + " ka content, notifications aur profile suggestions hide honge.");
      } else {
        Alert.alert("Creator unblocked", creatorKey + " dobara feed/search me aa sakta hai.");
        if (backendEnabled) { await syncCloudFeed(); await syncCloudExtras(); }
      }
    } catch (e) {
      Alert.alert("Block action failed", String(e?.message || e || "Please try again"));
    }
  };
  const submitPayoutRequest = async () => {`
);

replaceOnce(
  'report modal cloud props',
  '<ReportModal target={reportTarget} close={() => setReportTarget(null)} />',
  '<ReportModal target={reportTarget} reporterId={cloudUserId} close={() => setReportTarget(null)} />'
);

replaceOnce(
  'public creator block props',
  'onReport={(creator) => { setPublicCreator(null); setReportTarget({ type: "Creator", id: creator.handle || creator.name, title: creator.name || creator.handle }); }} />',
  'onReport={(creator) => { setPublicCreator(null); setReportTarget({ type: "Creator", id: creator.handle || creator.name, title: creator.name || creator.handle }); }} blockedCreators={blockedCreators} onBlock={handleBlockCreator} />'
);

replaceOnce(
  'public creator block signature',
  'function PublicCreatorModal({ creator, posts, close, onFollow, onReport }) {',
  'function PublicCreatorModal({ creator, posts, close, onFollow, onReport, blockedCreators, onBlock }) {'
);

replaceOnce(
  'public creator block status',
  "  const following = typeof creator.following === 'boolean' ? creator.following : creatorPosts.some((p) => !!p.following);",
  "  const following = typeof creator.following === 'boolean' ? creator.following : creatorPosts.some((p) => !!p.following);\n  const isBlocked = blockedCreators.includes(key);"
);

replaceOnce(
  'public creator block button',
  "        <Pressable onPress={() => onReport(creator)} style={{ alignSelf: 'center', padding: 12, marginTop: 3 }}><Text style={{ color: '#E53E52', fontWeight: '800' }}>Report creator</Text></Pressable>",
  "        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 3 }}><Pressable onPress={() => onBlock(creator)} style={{ padding: 12 }}><Text style={{ color: isBlocked ? '#6C4CF1' : '#E53E52', fontWeight: '800' }}>{isBlocked ? 'Unblock creator' : 'Block creator'}</Text></Pressable><Pressable onPress={() => onReport(creator)} style={{ padding: 12 }}><Text style={{ color: '#E53E52', fontWeight: '800' }}>Report creator</Text></Pressable></View>"
);

replaceOnce(
  'account settings moderation props',
  '<AccountSettings visible={settingsOpen} close={() => setSettingsOpen(false)}',
  '<AccountSettings visible={settingsOpen} close={() => setSettingsOpen(false)} blockedCreators={blockedCreators} onUnblock={handleBlockCreator}'
);

replaceOnce(
  'account settings moderation signature',
  'function AccountSettings({ visible, close, name, username, setName, setUsername, lastNameChangeAt, setLastNameChangeAt, deactivate, logout }) { const [editOpen, setEditOpen] = useState(false);',
  'function AccountSettings({ visible, close, name, username, setName, setUsername, lastNameChangeAt, setLastNameChangeAt, deactivate, logout, blockedCreators, onUnblock }) { const [editOpen, setEditOpen] = useState(false); const [blockedOpen, setBlockedOpen] = useState(false);'
);

replaceOnce(
  'privacy center blocked list',
  '<SupportItem icon="🔒" title="Privacy Center" sub="Audience, blocking, safety" onPress={() => Alert.alert("Privacy Center", "Privacy controls backend users and block lists ke saath connect honge.")} />',
  '<SupportItem icon="🔒" title="Privacy Center" sub={`${blockedCreators.length} blocked creator(s) • safety controls`} onPress={() => setBlockedOpen(true)} />'
);

replaceOnce(
  'blocked modal mount',
  '<Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>',
  '<BlockedCreatorsModal visible={blockedOpen} close={() => setBlockedOpen(false)} items={blockedCreators} onUnblock={onUnblock} /><Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>'
);

const reportRegex = /function ReportModal\(\{ target, close \}\) \{[\s\S]*?\nfunction SupportItem/;
if (!reportRegex.test(code)) throw new Error('Moderation patch failed: ReportModal block not found');
const reportBlock = `function BlockedCreatorsModal({ visible, close, items, onUnblock }) {
  return <Modal visible={visible} animationType="slide" onRequestClose={close}><SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}><View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E7E8EF" }}><Pressable onPress={close}><Text style={{ fontSize: 30 }}>‹</Text></Pressable><Text style={{ fontWeight: "900", fontSize: 18 }}>Blocked Creators</Text><Text style={{ color: C.muted }}>{items.length}</Text></View><ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 50 }}>{!items.length ? <View style={styles.emptyCard}><Text style={styles.bold}>No blocked creators</Text><Text style={styles.muted}>Blocked accounts yahan manage honge.</Text></View> : items.map((id) => <View key={id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}><View><Text style={{ fontWeight: "900", color: C.text }}>{id}</Text><Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Content and notifications hidden</Text></View><Pressable onPress={() => onUnblock(id)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 14, backgroundColor: C.purpleSoft }}><Text style={{ color: C.purple, fontWeight: "900" }}>Unblock</Text></Pressable></View>)}</ScrollView></SafeAreaView></Modal>;
}
function ReportModal({ target, reporterId, close }) {
  const [reason, setReason] = useState(reportReasons[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (!target) return null;
  const submit = async () => {
    setSubmitting(true);
    try {
      if (backendEnabled) {
        await submitRemoteReport({ reporterId, targetType: target.type, targetId: String(target.id || target.title || "unknown"), reason, details, data: { title: target.title || "" } });
      }
      close(); setDetails("");
      Alert.alert("Report submitted ✅", backendEnabled ? "Report moderation queue me save ho gaya. Review ke baad action liya jayega." : "Report device session me submit hua; cloud backend unavailable hai.");
    } catch (e) {
      Alert.alert("Report failed", String(e?.message || e || "Please try again"));
    } finally { setSubmitting(false); }
  };
  return <Modal visible={!!target} transparent animationType="slide" onRequestClose={close}><View style={styles.modalBg}><View style={styles.sheet}><SheetHeader title={\`Report ${'${target.type}'}\`} close={close} /><Text style={styles.helpText}>{target.title || "Select a reason"}</Text><View style={styles.rowWrap}>{reportReasons.map((x) => <Chip key={x} text={x} active={reason === x} onPress={() => setReason(x)} />)}</View><TextInput style={[styles.bigInput, { marginTop: 10 }]} multiline placeholder="Optional details..." value={details} onChangeText={setDetails} /><Pressable disabled={submitting} style={[styles.dangerButton, submitting && { opacity: 0.5 }]} onPress={submit}><Text style={styles.dangerText}>{submitting ? "Submitting..." : "Submit Report"}</Text></Pressable></View></View></Modal>;
}
function SupportItem`;
code = code.replace(reportRegex, reportBlock);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo moderation safety applied: cloud reports, creator block/unblock, blocked list and hidden blocked activity.');
