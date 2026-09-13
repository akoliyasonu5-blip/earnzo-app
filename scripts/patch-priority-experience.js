const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo priority experience active')) {
  console.log('Earnzo priority experience patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Priority experience patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'backend priority imports',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost } from "./backend/client";',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost, fetchStories, createStory, fetchNotifications, markNotificationsRead } from "./backend/client";'
);

replaceOnce(
  'priority states',
  '  const [editOwnPost, setEditOwnPost] = useState(null); // Earnzo own content management active',
  '  const [editOwnPost, setEditOwnPost] = useState(null); // Earnzo own content management active\n  const [notificationsOpen, setNotificationsOpen] = useState(false); const [notifications, setNotifications] = useState([]); const [unreadNotifications, setUnreadNotifications] = useState(0); const [lastRefreshAt, setLastRefreshAt] = useState(0); // Earnzo priority experience active'
);

const oldAddStory = '  const addStory = async () => { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) return Alert.alert("Media permission required"); const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.9 }); if (result.canceled || !result.assets?.[0]) return; const a = result.assets[0]; const s = { id: `my-${Date.now()}`, name: name || "You", handle: `@${username || "you"}`, mediaType: a.type === "video" ? "video" : "photo", mediaUri: a.uri, isMine: true, text: "Your Story" }; setStories((old) => [s, ...old.filter((x) => !x.isMine)]); setStoryIndex(0); setStoryOpen(true); };';
const newAddStory = `  const addStory = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Media permission required");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.9 });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    const localId = \`story-local-\${Date.now()}\`;
    const s = { id: localId, name: name || "You", handle: \`@\${username || "you"}\`, mediaType: a.type === "video" ? "video" : "photo", mediaUri: a.uri, isMine: true, text: "Your Story", uploadStatus: backendEnabled ? "Uploading..." : "Saved on device" };
    setStories((old) => [s, ...old.filter((x) => !x.isMine)]);
    setStoryIndex(0); setStoryOpen(true);
    if (!backendEnabled) return Alert.alert("Story saved", "Story device par save ho gayi.");
    try {
      const remote = await createStory({ ...s, id: undefined, title: "Story", handle: s.handle, name: s.name }, a.uri);
      const cloudStory = { ...s, ...remote, isMine: true, uploadStatus: "Uploaded ✓" };
      setStories((old) => [cloudStory, ...old.filter((x) => x.id !== localId && !x.isMine)]);
      setStoryIndex(0);
      Alert.alert("Story uploaded ✅", "Your Story cloud par upload ho gayi.");
    } catch (e) {
      setStories((old) => old.map((x) => x.id === localId ? { ...x, uploadStatus: "Upload failed • saved locally" } : x));
      Alert.alert("Story upload failed", String(e?.message || e || "Story device par save hai"));
    }
  };`;
replaceOnce('story cloud upload', oldAddStory, newAddStory);

replaceOnce(
  'cloud extras before refresh',
  '  // Earnzo pull refresh active\n  const refreshCloud = async () => {',
  `  const syncCloudExtras = async () => {
    if (!backendEnabled) return;
    try {
      const [storyResult, notificationResult] = await Promise.all([fetchStories(), fetchNotifications(cloudUserId)]);
      const remoteStories = Array.isArray(storyResult?.stories) ? storyResult.stories : [];
      const myHandle = username ? \`@\${username}\` : "";
      setStories((current) => {
        const demos = current.filter((s) => s.mediaType === "demo");
        const mapped = remoteStories.map((s) => ({ ...s, isMine: !!myHandle && String(s.handle || "") === myHandle, uploadStatus: "Uploaded ✓" }));
        return [...mapped, ...demos];
      });
      setNotifications(Array.isArray(notificationResult?.notifications) ? notificationResult.notifications : []);
      setUnreadNotifications(Number(notificationResult?.unread || 0));
    } catch (e) { console.log("Earnzo extra cloud sync failed", e?.message || e); }
  };
  // Earnzo pull refresh active
  const refreshCloud = async () => {`
);

replaceOnce(
  'priority refresh helper',
  `  const refreshCloud = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await syncCloudFeed();
    } finally {
      setRefreshing(false);
    }
  };`,
  `  const refreshCloud = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([syncCloudFeed(), syncCloudExtras()]);
      setLastRefreshAt(Date.now());
    } finally {
      setRefreshing(false);
    }
  };`
);

code = code.replace(
  'const run = async () => { if (active) await syncCloudFeed(); };',
  'const run = async () => { if (active) { await syncCloudFeed(); await syncCloudExtras(); } };'
);
code = code.replace(
  'if (tab === "Home" || tab === "Shorts") syncCloudFeed();',
  'if (tab === "Home" || tab === "Shorts") { syncCloudFeed(); syncCloudExtras(); }'
);

replaceOnce(
  'notification helpers before page',
  '  let page;',
  `  const openNotifications = async () => {
    setNotificationsOpen(true);
    setUnreadNotifications(0);
    if (backendEnabled) {
      try { await markNotificationsRead(cloudUserId); }
      catch (e) { console.log("Notification read sync failed", e?.message || e); }
    }
  };
  let page;`
);

replaceOnce(
  'header notification props',
  '<Header name={name} profilePhoto={profilePhoto} country={country} wallet={walletBalance} openEarn={() => setTab("Earn")} openProfile={() => setTab("Profile")} openSearch={() => setSearchOpen(true)} />',
  '<Header name={name} profilePhoto={profilePhoto} country={country} wallet={walletBalance} openEarn={() => setTab("Earn")} openProfile={() => setTab("Profile")} openSearch={() => setSearchOpen(true)} openNotifications={openNotifications} unreadNotifications={unreadNotifications} />'
);

const oldHeader = 'function Header({ name, profilePhoto, country, wallet, openEarn, openProfile, openSearch }) { return <View style={styles.header}><View style={styles.logoRow}><View style={styles.logoBox}><Text style={styles.logoBoxText}>EZ</Text></View><View><Text style={styles.logoTitle}>Earnzo</Text><Text style={styles.tagline}>Create • Connect • Earn</Text></View></View><View style={styles.headerRight}><Pressable onPress={openSearch} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7" }}><Text style={{ fontSize: 18 }}>🔍</Text></Pressable><Pressable style={styles.walletChip} onPress={openEarn}><Text style={styles.walletText}>{country.currency}{wallet}</Text></Pressable><Pressable style={styles.headerAvatar} onPress={openProfile}>{profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.fill} /> : <Text style={styles.headerAvatarText}>{(name || "E")[0].toUpperCase()}</Text>}</Pressable></View></View>; }';
const newHeader = 'function Header({ name, profilePhoto, country, wallet, openEarn, openProfile, openSearch, openNotifications, unreadNotifications }) { return <View style={styles.header}><View style={styles.logoRow}><View style={styles.logoBox}><Text style={styles.logoBoxText}>EZ</Text></View><View><Text style={styles.logoTitle}>Earnzo</Text><Text style={styles.tagline}>Create • Connect • Earn</Text></View></View><View style={styles.headerRight}><Pressable onPress={openNotifications} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7", marginRight: 6 }}><Text style={{ fontSize: 18 }}>🔔</Text>{unreadNotifications > 0 ? <View style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#E53E52", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}><Text style={{ color: "#FFF", fontSize: 9, fontWeight: "900" }}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</Text></View> : null}</Pressable><Pressable onPress={openSearch} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7" }}><Text style={{ fontSize: 18 }}>🔍</Text></Pressable><Pressable style={styles.walletChip} onPress={openEarn}><Text style={styles.walletText}>{country.currency}{wallet}</Text></Pressable><Pressable style={styles.headerAvatar} onPress={openProfile}>{profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.fill} /> : <Text style={styles.headerAvatarText}>{(name || "E")[0].toUpperCase()}</Text>}</Pressable></View></View>; }';
replaceOnce('notification header', oldHeader, newHeader);

replaceOnce(
  'home content type state',
  '  const [activeVideo, setActiveVideo] = useState(null); const [feed, setFeed] = useState("For You"); const [category, setCategory] = useState("All");',
  '  const [activeVideo, setActiveVideo] = useState(null); const [feed, setFeed] = useState("For You"); const [category, setCategory] = useState("All"); const [contentType, setContentType] = useState("Long Videos");'
);
replaceOnce(
  'home content type filter',
  '  let visible = posts; if (feed === "Following") visible = visible.filter((p) => p.following); if (category !== "All") visible = visible.filter((p) => p.category === category);',
  '  let visible = posts; if (feed === "Following") visible = visible.filter((p) => p.following); if (category !== "All") visible = visible.filter((p) => p.category === category); if (contentType === "Long Videos") visible = visible.filter((p) => p.mediaType === "long" || p.mediaType === "demo"); if (contentType === "Short Videos") visible = visible.filter((p) => p.mediaType === "short"); if (contentType === "Photos") visible = visible.filter((p) => p.mediaType === "photo");'
);
replaceOnce(
  'home content type controls',
  '<View style={styles.feedTabs}>{["For You", "Following"].map((x) => <Chip key={x} text={x} active={feed === x} onPress={() => setFeed(x)} />)}</View>',
  '<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>{["Long Videos", "Short Videos", "Photos", "All"].map((x) => <Chip key={x} text={x} active={contentType === x} onPress={() => setContentType(x)} />)}</ScrollView><View style={styles.feedTabs}>{["For You", "Following"].map((x) => <Chip key={x} text={x} active={feed === x} onPress={() => setFeed(x)} />)}</View><Text style={{ color: C.muted, fontSize: 10, marginBottom: 8 }}>{refreshing ? "Refreshing..." : lastRefreshAt ? "Pull down to refresh • Synced" : "Pull down to refresh"}</Text>'
);

replaceOnce(
  'home last refresh prop signature',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow, refreshing, onRefresh, openCreator }) {',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow, refreshing, onRefresh, openCreator, lastRefreshAt }) {'
);
replaceOnce(
  'home last refresh prop call',
  'openCreator={openPublicCreator} />',
  'openCreator={openPublicCreator} lastRefreshAt={lastRefreshAt} />'
);

replaceOnce(
  'story card status',
  '<Text style={styles.storyCardText}>Your Story</Text></View>',
  '<Text style={styles.storyCardText}>{ownStory?.uploadStatus === "Uploading..." ? "Uploading..." : ownStory?.uploadStatus?.startsWith("Upload failed") ? "Upload failed" : "Your Story"}</Text></View>'
);

replaceOnce(
  'story viewer status',
  '<View style={styles.storyViewerTop}><Text style={styles.storyUser}>{story.name} {story.handle}</Text><Pressable onPress={close}><Text style={styles.storyClose}>✕</Text></Pressable></View>',
  '<View style={styles.storyViewerTop}><View><Text style={styles.storyUser}>{story.name} {story.handle}</Text>{story.isMine && story.uploadStatus ? <Text style={{ color: "#DDD", fontSize: 11, marginTop: 2 }}>{story.uploadStatus}</Text> : null}</View><Pressable onPress={close}><Text style={styles.storyClose}>✕</Text></Pressable></View>'
);

replaceOnce(
  'earning explanation',
  '<MonetizationCard followers={followers} views={views} eligible={eligible} /><Text style={styles.sectionTitle}>Verification & Payout</Text>',
  '<MonetizationCard followers={followers} views={views} eligible={eligible} /><View style={styles.tipCard}><Text style={styles.bold}>How creators earn</Text><Text style={[styles.muted, { marginTop: 6 }]}>1. 500 followers + 2 lakh valid views complete kare.\n2. Eligibility unlock hogi; KYC aur policy review complete hoga.\n3. Approval ke baad ads/creator revenue Earnzo Creator Wallet me credit hoga.\n4. Payment Earnzo se verified Bank / UPI / supported payout method par jayega.</Text></View><Text style={styles.sectionTitle}>Verification & Payout</Text>'
);

const oldMonetization = 'function MonetizationCard({ followers, views, eligible }) { return <View style={styles.monetizationCard}><Text style={styles.monetizationSmall}>CREATOR MONETIZATION</Text><Text style={styles.monetizationTitle}>Earnzo Creator Program</Text><Text style={styles.monetizationSub}>500 followers + 2 lakh valid views complete karne ke baad apply option unlock hoga.</Text><Progress title="Followers" value={`${fmt(followers)} / 500`} percent={pct(followers, FOLLOWER_TARGET)} /><Progress title="Valid Views" value={`${fmt(views)} / 200K`} percent={pct(views, VIEW_TARGET)} /><Pressable style={[styles.applyButton, !eligible && styles.locked]} onPress={() => Alert.alert(eligible ? "Eligible ✅" : "Not eligible yet", eligible ? "Apply flow admin review, policy check aur KYC ke saath submit hoga." : "500 followers aur 2 lakh valid views complete kare.")}><Text style={styles.primaryText}>{eligible ? "Apply for Monetization" : "Monetization Locked"}</Text></Pressable></View>; }';
const newMonetization = 'function MonetizationCard({ followers, views, eligible }) { return <View style={styles.monetizationCard}><Text style={styles.monetizationSmall}>CREATOR MONETIZATION</Text><Text style={styles.monetizationTitle}>Earnzo Creator Program</Text><Text style={styles.monetizationSub}>{eligible ? "Threshold complete ✅ Aap monetization review ke liye eligible hain. KYC + policy approval ke baad monetization ON hoga." : "500 followers + 2 lakh valid views complete karke monetization eligibility unlock kare."}</Text><Progress title="Followers" value={`${fmt(followers)} / 500`} percent={pct(followers, FOLLOWER_TARGET)} /><Progress title="Valid Views" value={`${fmt(views)} / 200K`} percent={pct(views, VIEW_TARGET)} /><Pressable style={[styles.applyButton, !eligible && styles.locked]} onPress={() => Alert.alert(eligible ? "Eligible for review ✅" : "Not eligible yet", eligible ? "Threshold complete hai. KYC, policy/fraud checks aur approval ke baad monetization active hoga. Creator payment Earnzo wallet se verified payout method par jayega." : "500 followers aur 2 lakh valid views complete kare.")}><Text style={styles.primaryText}>{eligible ? "Apply for Monetization" : "Monetization Locked"}</Text></Pressable></View>; }';
replaceOnce('monetization clarity', oldMonetization, newMonetization);

replaceOnce(
  'notifications modal mount',
  '<OwnPostEditModal post={editOwnPost} close={() => setEditOwnPost(null)} onSave={saveOwnPostChanges} /></SafeAreaView>;',
  '<OwnPostEditModal post={editOwnPost} close={() => setEditOwnPost(null)} onSave={saveOwnPostChanges} /><NotificationsModal visible={notificationsOpen} items={notifications} close={() => setNotificationsOpen(false)} /></SafeAreaView>;'
);

const searchAnchor = 'function SearchModal({ visible, close, value, setValue, loading, results, onSearch, openPost, openCreator }) {';
if (!code.includes(searchAnchor)) throw new Error('Priority experience patch failed: SearchModal anchor not found');
const notificationModal = `function NotificationsModal({ visible, items, close }) {
  const icon = (type) => type === 'like' ? '♥' : type === 'comment' ? '💬' : type === 'tag' ? '@' : type === 'follow' ? '👤' : '🔔';
  return <Modal visible={visible} animationType="slide" onRequestClose={close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E7E8EF' }}>
        <Pressable onPress={close}><Text style={{ fontSize: 30, color: '#171722' }}>‹</Text></Pressable>
        <Text style={{ fontWeight: '900', fontSize: 18 }}>Notifications</Text><View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 50 }}>
        {!items.length ? <View style={styles.emptyCard}><Text style={styles.bold}>No notifications yet</Text><Text style={styles.muted}>Likes, comments, follows aur tags yahan dikhेंगे.</Text></View> : null}
        {items.map((n) => <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F3' }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0EDFF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}><Text style={{ fontSize: 18 }}>{icon(n.type)}</Text></View>
          <View style={{ flex: 1 }}><Text style={{ color: '#171722', fontWeight: n.readAt ? '700' : '900' }}>{n.text || 'New activity on Earnzo'}</Text>{n.data?.comment ? <Text numberOfLines={2} style={{ color: '#747789', marginTop: 3 }}>{n.data.comment}</Text> : null}<Text style={{ color: '#9A9CAB', fontSize: 10, marginTop: 4 }}>{n.type === 'tag' ? 'Tagged you' : n.type === 'like' ? 'Like' : n.type === 'comment' ? 'Comment' : n.type === 'follow' ? 'New follower' : 'Activity'}</Text></View>
        </View>)}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

`;
code = code.replace(searchAnchor, notificationModal + searchAnchor);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo priority experience applied: refresh-first sync, separate Home content types, cloud Story status, notifications and monetization explanation.');
