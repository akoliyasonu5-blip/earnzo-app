const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo creator analytics active')) {
  console.log('Earnzo creator analytics patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Creator analytics patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'analytics client import',
  'import { fetchMessageInbox, fetchMessageThread, sendRemoteMessage, markRemoteMessagesRead } from "./backend/messages";',
  'import { fetchMessageInbox, fetchMessageThread, sendRemoteMessage, markRemoteMessagesRead } from "./backend/messages";\nimport { fetchCreatorAnalytics } from "./backend/analytics";'
);

replaceOnce(
  'analytics state',
  '  const [messagesOpen, setMessagesOpen] = useState(false); const [messageInbox, setMessageInbox] = useState([]); const [messageUnread, setMessageUnread] = useState(0); const [activeMessagePeer, setActiveMessagePeer] = useState(null); const [messageThread, setMessageThread] = useState([]); const [messageText, setMessageText] = useState(""); const [messageLoading, setMessageLoading] = useState(false); // Earnzo cloud messaging active',
  '  const [messagesOpen, setMessagesOpen] = useState(false); const [messageInbox, setMessageInbox] = useState([]); const [messageUnread, setMessageUnread] = useState(0); const [activeMessagePeer, setActiveMessagePeer] = useState(null); const [messageThread, setMessageThread] = useState([]); const [messageText, setMessageText] = useState(""); const [messageLoading, setMessageLoading] = useState(false); // Earnzo cloud messaging active\n  const [analyticsOpen, setAnalyticsOpen] = useState(false); const [creatorAnalytics, setCreatorAnalytics] = useState(null); const [analyticsLoading, setAnalyticsLoading] = useState(false); // Earnzo creator analytics active'
);

replaceOnce(
  'analytics open handler',
  '  const refreshMessageInbox = async () => {',
  `  const openCreatorAnalytics = async () => {
    if (!backendEnabled) return Alert.alert("Analytics", "Cloud backend connect hona zaroori hai.");
    setAnalyticsOpen(true); setAnalyticsLoading(true);
    try {
      const result = await fetchCreatorAnalytics(cloudUserId);
      setCreatorAnalytics(result || null);
    } catch (e) {
      Alert.alert("Analytics unavailable", String(e?.message || e || "Please try again"));
    } finally { setAnalyticsLoading(false); }
  };
  const refreshMessageInbox = async () => {`
);

replaceOnce(
  'earn analytics prop',
  'onRequestPayout={submitPayoutRequest} />;',
  'onRequestPayout={submitPayoutRequest} onOpenAnalytics={openCreatorAnalytics} />;'
);

replaceOnce(
  'earn analytics signature',
  'function Earn({ wallet, country, followers, views, eligible, kycStatus, setKycStatus, kycDocType, setKycDocType, setCountryKey, payoutOwner, setPayoutOwner, payoutMethod, setPayoutMethod, payoutStatus, setPayoutStatus, profileName, language, monetizationState, monetizationApplying, onApplyMonetization, walletState, payoutAmount, setPayoutAmount, payoutRequesting, onRequestPayout }) {',
  'function Earn({ wallet, country, followers, views, eligible, kycStatus, setKycStatus, kycDocType, setKycDocType, setCountryKey, payoutOwner, setPayoutOwner, payoutMethod, setPayoutMethod, payoutStatus, setPayoutStatus, profileName, language, monetizationState, monetizationApplying, onApplyMonetization, walletState, payoutAmount, setPayoutAmount, payoutRequesting, onRequestPayout, onOpenAnalytics }) {'
);

replaceOnce(
  'creator tools analytics button',
  'onPress={() => Alert.alert(t, "Backend connect hone ke baad live data yahan dikhega.")}',
  'onPress={() => t === "Analytics" ? onOpenAnalytics() : Alert.alert(t, "Backend connect hone ke baad live data yahan dikhega.")}'
);

replaceOnce(
  'analytics modal mount',
  '<MessagesModal visible={messagesOpen}',
  '<CreatorAnalyticsModal visible={analyticsOpen} close={() => setAnalyticsOpen(false)} data={creatorAnalytics} loading={analyticsLoading} refresh={openCreatorAnalytics} /><MessagesModal visible={messagesOpen}'
);

const anchor = 'function MessagesModal';
if (!code.includes(anchor)) throw new Error('Creator analytics patch failed: MessagesModal anchor not found');
const component = `function CreatorAnalyticsModal({ visible, close, data, loading, refresh }) {
  const totals = data?.totals || {};
  const daily = Array.isArray(data?.dailyViews) ? data.dailyViews : [];
  const top = Array.isArray(data?.topContent) ? data.topContent : [];
  const breakdown = data?.breakdown || {};
  const maxDay = Math.max(1, ...daily.map((x) => Number(x.views || 0)));
  const number = (v) => fmt(Number(v || 0));
  const metric = (label, value) => <View style={{ width: "48%", backgroundColor: "#F7F7FB", borderRadius: 16, padding: 13, marginBottom: 10 }}><Text style={{ color: C.muted, fontSize: 11, fontWeight: "700" }}>{label}</Text><Text style={{ color: C.text, fontSize: 20, fontWeight: "900", marginTop: 4 }}>{value}</Text></View>;
  const typeLabel = (key) => key === "long" ? "Long Videos" : key === "short" ? "Shorts" : key === "photo" ? "Photos" : "Other";
  return <Modal visible={visible} animationType="slide" onRequestClose={close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E7E8EF" }}><Pressable onPress={close}><Text style={{ fontSize: 30, color: C.text }}>‹</Text></Pressable><View style={{ alignItems: "center" }}><Text style={{ fontWeight: "900", fontSize: 18 }}>Creator Analytics</Text><Text style={{ color: C.muted, fontSize: 10 }}>Valid cloud activity</Text></View><Pressable onPress={refresh} disabled={loading}><Text style={{ color: C.purple, fontWeight: "900", opacity: loading ? 0.4 : 1 }}>↻</Text></Pressable></View>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 60 }}>
        {loading && !data ? <View style={styles.emptyCard}><Text style={styles.bold}>Loading analytics...</Text><Text style={styles.muted}>Views, likes, comments aur followers sync ho rahe hain.</Text></View> : null}
        {!loading && !data ? <View style={styles.emptyCard}><Text style={styles.bold}>No analytics yet</Text><Text style={styles.muted}>Content publish hone ke baad creator performance yahan dikhegi.</Text></View> : null}
        {data ? <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {metric("Valid Views", number(totals.views))}{metric("Followers", number(totals.followers))}{metric("Likes", number(totals.likes))}{metric("Comments", number(totals.comments))}{metric("Published Posts", number(totals.posts))}{metric("Engagement", Number(totals.engagementRate || 0).toFixed(2) + "%")}
          </View>
          <View style={[styles.tipCard, { marginTop: 4 }]}><View style={styles.progressHead}><Text style={styles.bold}>Last 7 days views</Text><Text style={{ color: C.purple, fontWeight: "900" }}>{number(daily.reduce((s, x) => s + Number(x.views || 0), 0))}</Text></View><View style={{ flexDirection: "row", alignItems: "flex-end", height: 130, marginTop: 14, gap: 7 }}>{daily.map((x) => <View key={x.date} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}><Text style={{ color: C.muted, fontSize: 9, marginBottom: 4 }}>{x.views}</Text><View style={{ width: "72%", minHeight: 3, height: Math.max(3, Math.round((Number(x.views || 0) / maxDay) * 86)), borderRadius: 8, backgroundColor: C.purple }} /><Text style={{ color: C.muted, fontSize: 8, marginTop: 5 }}>{String(x.date || "").slice(5)}</Text></View>)}</View></View>
          <View style={[styles.tipCard, { marginTop: 12 }]}><Text style={styles.bold}>Content breakdown</Text>{["long", "short", "photo", "other"].filter((key) => Number(breakdown?.[key]?.posts || 0) > 0).map((key) => <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#ECECF2" }}><Text style={{ color: C.text, fontWeight: "800" }}>{typeLabel(key)}</Text><Text style={{ color: C.muted }}>{number(breakdown[key].posts)} posts • {number(breakdown[key].views)} views</Text></View>)}</View>
          <View style={[styles.tipCard, { marginTop: 12 }]}><Text style={styles.bold}>Top Content</Text>{!top.length ? <Text style={[styles.muted, { marginTop: 8 }]}>No published content analytics yet.</Text> : top.map((p, i) => <View key={p.id || i} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#ECECF2" }}><View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Text numberOfLines={1} style={{ flex: 1, color: C.text, fontWeight: "900", paddingRight: 8 }}>{i + 1}. {p.title || "Untitled"}</Text><Text style={{ color: C.purple, fontWeight: "900" }}>{number(p.views)} views</Text></View><Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>{String(p.mediaType || "content").toUpperCase()} • {number(p.likes)} likes • {number(p.comments)} comments</Text></View>)}</View>
          <Text style={{ color: C.muted, fontSize: 10, marginTop: 12, textAlign: "center" }}>Analytics valid cloud events se calculate hoti hai; demo/local counters is report me include nahi hote.</Text>
        </> : null}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

`;
code = code.replace(anchor, component + anchor);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo creator analytics applied: valid views, followers, engagement, 7-day trend, breakdown and top content.');
