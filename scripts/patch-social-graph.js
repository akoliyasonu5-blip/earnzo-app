const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo social graph active')) {
  console.log('Earnzo social graph patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Social graph patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'social graph import',
  'import { fetchCreatorAnalytics } from "./backend/analytics";',
  'import { fetchCreatorAnalytics } from "./backend/analytics";\nimport { fetchSocialGraph } from "./backend/social";'
);

replaceOnce(
  'social graph state',
  '  const [analyticsOpen, setAnalyticsOpen] = useState(false); const [creatorAnalytics, setCreatorAnalytics] = useState(null); const [analyticsLoading, setAnalyticsLoading] = useState(false); // Earnzo creator analytics active',
  '  const [analyticsOpen, setAnalyticsOpen] = useState(false); const [creatorAnalytics, setCreatorAnalytics] = useState(null); const [analyticsLoading, setAnalyticsLoading] = useState(false); // Earnzo creator analytics active\n  const [socialGraph, setSocialGraph] = useState({ followers: [], following: [], followersCount: 0, followingCount: 0 }); const [peopleLoading, setPeopleLoading] = useState(false); // Earnzo social graph active'
);

replaceOnce(
  'social graph cloud sync request',
  '      const [storyResult, notificationResult, statsResult, monetizationResult, walletResult, blockResult, messageInboxResult] = await Promise.all([fetchStories(cloudUserId), fetchNotifications(cloudUserId), fetchCreatorStats(cloudUserId), fetchMonetizationStatus(cloudUserId), fetchWalletStatus(cloudUserId, country.code), fetchBlockedCreators(cloudUserId), fetchMessageInbox(cloudUserId)]);',
  '      const [storyResult, notificationResult, statsResult, monetizationResult, walletResult, blockResult, messageInboxResult, socialResult] = await Promise.all([fetchStories(cloudUserId), fetchNotifications(cloudUserId), fetchCreatorStats(cloudUserId), fetchMonetizationStatus(cloudUserId), fetchWalletStatus(cloudUserId, country.code), fetchBlockedCreators(cloudUserId), fetchMessageInbox(cloudUserId), fetchSocialGraph(cloudUserId, cloudUserId)]);'
);

replaceOnce(
  'social graph cloud sync result',
  '      setMessageInbox(Array.isArray(messageInboxResult?.conversations) ? messageInboxResult.conversations : []); setMessageUnread(Number(messageInboxResult?.unread || 0));',
  '      setMessageInbox(Array.isArray(messageInboxResult?.conversations) ? messageInboxResult.conversations : []); setMessageUnread(Number(messageInboxResult?.unread || 0));\n      setSocialGraph({ followers: Array.isArray(socialResult?.followers) ? socialResult.followers : [], following: Array.isArray(socialResult?.following) ? socialResult.following : [], followersCount: Number(socialResult?.followersCount || 0), followingCount: Number(socialResult?.followingCount || 0) });\n      if (Number.isFinite(Number(socialResult?.followersCount))) setFollowersCount(Number(socialResult.followersCount));'
);

replaceOnce(
  'social graph handlers',
  '  const openCreatorAnalytics = async () => {',
  `  const refreshSocialGraph = async () => {
    if (!backendEnabled) return null;
    const result = await fetchSocialGraph(cloudUserId, cloudUserId);
    const next = {
      followers: Array.isArray(result?.followers) ? result.followers : [],
      following: Array.isArray(result?.following) ? result.following : [],
      followersCount: Number(result?.followersCount || 0),
      followingCount: Number(result?.followingCount || 0),
    };
    setSocialGraph(next);
    setFollowersCount(next.followersCount);
    return next;
  };
  const openPeople = async (type) => {
    setPeopleModal(type); setPeopleLoading(true);
    try { await refreshSocialGraph(); }
    catch (e) { Alert.alert("Social list unavailable", String(e?.message || e || "Please try again")); }
    finally { setPeopleLoading(false); }
  };
  const toggleSocialPerson = async (person) => {
    const id = String(person?.handle || person?.id || "").trim();
    if (!id || id === cloudUserId || !backendEnabled) return;
    try {
      const result = await followRemoteUser(cloudUserId, id);
      setPosts((old) => old.map((p) => String(p.handle || p.name || "").trim() === id ? { ...p, following: !!result?.following } : p));
      await refreshSocialGraph();
    } catch (e) { Alert.alert("Follow action failed", String(e?.message || e || "Please try again")); }
  };
  const openCreatorAnalytics = async () => {`
);

replaceOnce(
  'profile social props',
  '<Profile name={name} username={username} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} createdPosts={createdPosts} wallet={walletBalance} followers={followersCount} views={totalViews} eligible={eligible} openFollowers={() => setPeopleModal("Followers")} openFollowing={() => setPeopleModal("Following")} openSupport={() => setSupportOpen(true)} openSettings={() => setSettingsOpen(true)} openSaved={() => setSavedOpen(true)} onEditPost={(post) => setEditOwnPost(post)} onDeletePost={deleteOwnPost} />',
  '<Profile name={name} username={username} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} createdPosts={createdPosts} wallet={walletBalance} followers={followersCount} following={socialGraph.followingCount} views={totalViews} eligible={eligible} openFollowers={() => openPeople("Followers")} openFollowing={() => openPeople("Following")} openSupport={() => setSupportOpen(true)} openSettings={() => setSettingsOpen(true)} openSaved={() => setSavedOpen(true)} onEditPost={(post) => setEditOwnPost(post)} onDeletePost={deleteOwnPost} />'
);

replaceOnce(
  'profile social signature',
  'function Profile({ name, username, profilePhoto, setProfilePhoto, createdPosts, wallet, followers, views, eligible, openFollowers, openFollowing, openSupport, openSettings, openSaved, onEditPost, onDeletePost }) {',
  'function Profile({ name, username, profilePhoto, setProfilePhoto, createdPosts, wallet, followers, following, views, eligible, openFollowers, openFollowing, openSupport, openSettings, openSaved, onEditPost, onDeletePost }) {'
);

replaceOnce(
  'real following count',
  '<Stat value="438" label="Following" onPress={openFollowing} />',
  '<Stat value={fmt(following || 0)} label="Following" onPress={openFollowing} />'
);

replaceOnce(
  'people modal props',
  '<People visible={!!peopleModal} title={peopleModal} close={() => setPeopleModal("")} />',
  '<People visible={!!peopleModal} title={peopleModal} close={() => setPeopleModal("")} people={peopleModal === "Followers" ? socialGraph.followers : socialGraph.following} loading={peopleLoading} currentUser={cloudUserId} onCreator={(person) => { setPeopleModal(""); openPublicCreator(person); }} onFollow={toggleSocialPerson} />'
);

const peopleRegex = /function People\(\{ visible, title, close \}\) \{[\s\S]*?\nfunction SheetHeader/;
if (!peopleRegex.test(code)) throw new Error('Social graph patch failed: People component not found');
const peopleComponent = `function People({ visible, title, close, people, loading, currentUser, onCreator, onFollow }) {
  const rows = Array.isArray(people) ? people : [];
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}><View style={styles.modalBg}><View style={[styles.sheet, { maxHeight: "78%" }]}><SheetHeader title={title} close={close} /><ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
    {loading ? <View style={styles.emptyCard}><Text style={styles.bold}>Loading {title?.toLowerCase()}...</Text><Text style={styles.muted}>Cloud social graph sync ho raha hai.</Text></View> : null}
    {!loading && !rows.length ? <View style={styles.emptyCard}><Text style={styles.bold}>No {String(title || "people").toLowerCase()} yet</Text><Text style={styles.muted}>Real Earnzo follow activity yahan dikhegi.</Text></View> : null}
    {rows.map((p) => { const id = String(p.handle || p.id || "").trim(); const mine = id === currentUser; return <View key={id || p.name} style={styles.person}><Pressable onPress={() => onCreator(p)} style={styles.avatar}>{p.profilePhoto ? <Image source={{ uri: p.profilePhoto }} style={styles.fill} /> : <Text style={styles.avatarText}>{String(p.name || id || "E")[0].toUpperCase()}</Text>}</Pressable><Pressable onPress={() => onCreator(p)} style={{ flex: 1 }}><Text style={styles.bold}>{p.name || id || "Creator"}</Text><Text style={styles.muted}>{id}</Text></Pressable>{!mine ? <Pressable onPress={() => onFollow(p)} style={[styles.smallPurple, p.following && { backgroundColor: "#EDEEF3" }]}><Text style={[styles.primaryText, p.following && { color: C.text }]}>{p.following ? "Following" : "Follow"}</Text></Pressable> : null}</View>; })}
  </ScrollView></View></View></Modal>;
}
function SheetHeader`;
code = code.replace(peopleRegex, peopleComponent);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo social graph applied: real followers/following counts, cloud lists, creator opening and follow toggles.');
