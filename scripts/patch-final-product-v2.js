const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo final product v2 active')) {
  console.log('Earnzo final product v2 already applied.');
  process.exit(0);
}

function range(name) {
  const start = code.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Final product v2: ' + name + ' not found');
  let end = code.indexOf('\nfunction ', start + 12);
  if (end < 0) end = code.indexOf('\n\nconst styles =', start + 12);
  if (end < 0) throw new Error('Final product v2: end of ' + name + ' not found');
  return { start, end };
}

function replaceFunction(name, replacement) {
  const { start, end } = range(name);
  code = code.slice(0, start) + replacement + '\n' + code.slice(end + (code.startsWith('\nfunction ', end) ? 1 : 0));
}

// Required imports for app-private offline video storage and resume/history.
if (!code.includes('expo-file-system')) {
  code = code.replace('import * as ImagePicker from "expo-image-picker";\n', 'import * as ImagePicker from "expo-image-picker";\nimport * as FileSystem from "expo-file-system/legacy";\n');
}
if (!/import React, \{[^}]*useRef/.test(code)) {
  code = code.replace(/import React, \{([^}]*)\} from "react";/, (m, inner) => `import React, {${inner.trim().replace(/,?\s*$/, '')}, useRef } from "react";`);
}

const helperAnchor = 'export default function App() {';
if (!code.includes(helperAnchor)) throw new Error('Final product v2: App anchor not found');
const helpers = `// Earnzo final product v2 active
const EARNZO_MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
const EARNZO_HISTORY_KEY = "earnzoWatchHistoryV2";
const EARNZO_OFFLINE_KEY = "earnzoOfflineVideosV2";

async function earnzoReadJson(key, fallback = []) {
  try { const raw = await AsyncStorage.getItem(key); const value = raw ? JSON.parse(raw) : fallback; return value ?? fallback; }
  catch { return fallback; }
}
async function earnzoWriteJson(key, value) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function earnzoSafeId(value) { return String(value || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100); }
async function saveOfflineVideo(post) {
  if (!post?.mediaUri || !['long','short'].includes(post.mediaType)) return Alert.alert('Offline download', 'Video available nahi hai.');
  try {
    const base = FileSystem.documentDirectory;
    if (!base) throw new Error('App storage unavailable');
    const dir = base + 'earnzo-offline/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const destination = dir + earnzoSafeId(post.id || post.localId || post.title) + '.mp4';
    if (String(post.mediaUri).startsWith('file://')) await FileSystem.copyAsync({ from: post.mediaUri, to: destination });
    else await FileSystem.downloadAsync(post.mediaUri, destination);
    const list = await earnzoReadJson(EARNZO_OFFLINE_KEY, []);
    const item = { id: String(post.id || post.localId || destination), title: post.title || 'Video', name: post.name || 'Creator', handle: post.handle || '', mediaType: post.mediaType, mediaUri: post.mediaUri, localUri: destination, coverUri: post.coverUri || post.thumbnailUri || '', savedAt: Date.now() };
    await earnzoWriteJson(EARNZO_OFFLINE_KEY, [item, ...list.filter((x) => String(x.id) !== String(item.id))].slice(0, 100));
    Alert.alert('Saved inside Earnzo ✅', 'Video Earnzo ke app-private Offline section me save ho gaya. Phone Gallery me nahi jayega.');
  } catch (e) { Alert.alert('Offline download failed', String(e?.message || e || 'Please try again')); }
}
async function saveWatchProgress(post, positionSec, durationSec) {
  if (!post?.id || !post?.mediaUri) return;
  const position = Math.max(0, Number(positionSec || 0));
  const duration = Math.max(0, Number(durationSec || 0));
  const list = await earnzoReadJson(EARNZO_HISTORY_KEY, []);
  const item = { id: String(post.id), title: post.title || 'Video', name: post.name || 'Creator', handle: post.handle || '', mediaType: post.mediaType || 'long', mediaUri: post.mediaUri, coverUri: post.coverUri || post.thumbnailUri || '', positionSec: position, durationSec: duration, progress: duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0, lastWatchedAt: Date.now() };
  await earnzoWriteJson(EARNZO_HISTORY_KEY, [item, ...list.filter((x) => String(x.id) !== String(item.id))].slice(0, 150));
}
`;
code = code.replace(helperAnchor, helpers + '\n' + helperAnchor);

// Hard app-side upload ceiling: 2 GB, with visible messaging in Create.
{
  const { start, end } = range('Create');
  let block = code.slice(start, end);
  block = block.replace(/const a = result\.assets\[0\];/, `const a = result.assets[0];\n    const pickedBytes = Number(a?.fileSize || 0);\n    if (pickedBytes > EARNZO_MAX_UPLOAD_BYTES) return Alert.alert("File too large", "Earnzo par maximum 2 GB tak ka video upload kiya ja sakta hai.");`);
  block = block.replace(/title="Short \/ Reel" sub="[^"]*"/, 'title="Short / Reel" sub="Max 1.5 min • up to 2 GB"');
  block = block.replace(/title="Long Video" sub="[^"]*"/, 'title="Long Video" sub="Max 2 GB • above 1.5 min"');
  if (!block.includes('<TextPostComposer')) {
    const grid = block.indexOf('<View style={styles.createGrid}>');
    if (grid >= 0) {
      const close = block.indexOf('</View>', grid);
      if (close >= 0) block = block.slice(0, close) + '<TextPostComposer name={name} username={username} setPosts={setPosts} setCreatedPosts={setCreatedPosts} goHome={goHome} />' + block.slice(close);
    }
  }
  code = code.slice(0, start) + block + code.slice(end);
}

// Clean Home: no Long/Short/Photos/All category row. Shorts live only in Shorts tab.
replaceFunction('Home', `function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow, refreshing, onRefresh, openCreator, lastRefreshAt }) {
  const [activeVideo, setActiveVideo] = useState(null); const [feed, setFeed] = useState("For You");
  const ownStory = (stories || []).find((s) => s.isMine);
  let visible = (posts || []).filter((p) => p?.kind !== "story" && p?.mediaType !== "short");
  if (feed === "Following") visible = visible.filter((p) => p.following);
  const update = (id, patcher) => setPosts((old) => old.map((p) => p.id === id ? patcher(p) : p));
  return <ScrollView style={styles.home} showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeContent} refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />}>
    <View style={styles.homeTop}>
      <Text style={styles.sectionTitle}>Creator Stories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.storyRow}>
        <Pressable style={styles.storyCard} onPress={ownStory ? () => openStory((stories || []).indexOf(ownStory)) : addStory}><View style={styles.storyAdd}><Text style={styles.storyAddText}>{ownStory ? "✓" : "+"}</Text></View><Text style={styles.storyCardText}>{ownStory?.uploadStatus === "Uploading..." ? "Uploading..." : "Your Story"}</Text></Pressable>
        {(stories || []).filter((s) => !s.isMine).map((s) => <Pressable key={s.id} style={styles.storyCard} onPress={() => openStory((stories || []).indexOf(s))}><View style={styles.storyDemoCircle}><Text style={{ fontSize: 24 }}>{s.emoji || "★"}</Text></View><Text style={styles.storyCardText}>{s.name}</Text></Pressable>)}
      </View></ScrollView>
      <View style={[styles.feedTabs, { marginTop: 10 }]}>{["For You", "Following"].map((x) => <Chip key={x} text={x} active={feed === x} onPress={() => setFeed(x)} />)}</View>
      <Text style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>{refreshing ? "Refreshing..." : "Pull down to refresh • Synced"}</Text>
    </View>
    {visible.map((post) => <View key={post.id} style={styles.youtubePost}>
      <FeedMedia post={post} activeVideo={activeVideo} setActiveVideo={setActiveVideo} />
      <View style={styles.youtubeInfo}>
        <Pressable style={styles.avatar} onPress={() => openCreator?.(post)}><Text style={styles.avatarText}>{(post.name || "E")[0]}</Text></Pressable>
        <View style={{ flex: 1 }}><Text style={styles.youtubeTitle}>{post.title}</Text><Pressable onPress={() => openCreator?.(post)}><Text style={styles.youtubeMeta}>{post.name} • {fmt(post.views || 0)} views • Just now</Text></Pressable></View>
        <Pressable onPress={() => onReport({ type: "Post", id: post.id, title: post.title })}><Text style={styles.more}>⋮</Text></Pressable>
      </View>
      <View style={[styles.youtubeActions, { flexWrap: "wrap", rowGap: 10 }]}>
        <Pressable onPress={() => onLike?.(post)}><Text style={[styles.actionText, post.liked && { color: C.pink }]}>{post.liked ? "♥" : "♡"} {fmt(post.likes)}</Text></Pressable>
        <Pressable onPress={() => openComments(post)}><Text style={styles.actionText}>💬 {(post.comments || []).length}</Text></Pressable>
        <Pressable onPress={() => update(post.id, (p) => ({ ...p, saved: !p.saved }))}><Text style={styles.actionText}>{post.saved ? "🔖 Saved" : "🔖 Save"}</Text></Pressable>
        {['long','short'].includes(post.mediaType) && post.mediaUri ? <Pressable onPress={() => saveOfflineVideo(post)}><Text style={styles.actionText}>⬇ Offline</Text></Pressable> : null}
        <Pressable onPress={() => Share.share({ message: (post.name || 'Creator') + "\\n" + (post.textBody || post.title || '') })}><Text style={styles.actionText}>↗ Share</Text></Pressable>
        <Pressable onPress={() => onFollow?.(post)}><Text style={styles.followMini}>{post.following ? "Following" : "Follow"}</Text></Pressable>
      </View>
    </View>)}
    {!visible.length ? <View style={styles.emptyCard}><Text style={styles.bold}>{feed === "Following" ? "No followed posts yet" : "No posts yet"}</Text><Text style={styles.muted}>Create tab se video, photo ya text post publish kare.</Text></View> : null}
  </ScrollView>;
}`);

replaceFunction('FeedMedia', `function FeedMedia({ post, activeVideo, setActiveVideo }) {
  if (post.mediaType === "text") return <View style={{ minHeight: 220, padding: 22, backgroundColor: C.purpleSoft, alignItems: "center", justifyContent: "center" }}><Text selectable style={{ color: C.text, fontSize: 20, lineHeight: 30, fontWeight: "800", textAlign: "center" }}>{post.textBody || post.title}</Text></View>;
  if (post.mediaType === "photo" && post.mediaUri) return <PhotoFeedMedia post={post} />;
  if ((post.mediaType === "short" || post.mediaType === "long") && post.mediaUri) {
    if (activeVideo === post.id) return <HomeVideo post={post} />;
    return <Pressable style={styles.youtubeMedia} onPress={() => setActiveVideo(post.id)}>{post.coverUri || post.thumbnailUri ? <Image source={{ uri: post.coverUri || post.thumbnailUri }} style={styles.fill} resizeMode="cover" /> : <StaticVideoThumbnail uri={post.mediaUri} thumbnailUri={post.thumbnailUri} />}<View style={styles.play}><Text style={styles.playText}>▶</Text></View></Pressable>;
  }
  return <View style={styles.youtubeMedia}><View style={styles.fallbackThumb}><Text style={{ fontSize: 48 }}>🎬</Text><Text style={styles.fallbackText}>{post.title}</Text></View></View>;
}`);

replaceFunction('HomeVideo', `function HomeVideo({ post }) {
  const player = useVideoPlayer(post?.mediaUri || "", (p) => { p.loop = false; });
  const videoRef = useRef(null); const [current, setCurrent] = useState(0); const [duration, setDuration] = useState(0); const savedRef = useRef(0);
  useEffect(() => {
    let alive = true;
    (async () => { const history = await earnzoReadJson(EARNZO_HISTORY_KEY, []); const old = history.find((x) => String(x.id) === String(post?.id)); if (!alive) return; const resume = Number(old?.positionSec || 0); try { if (resume > 5) player.currentTime = resume; player.play(); } catch {} })();
    const timer = setInterval(() => { try { const now = Number(player.currentTime || 0); const total = Number(player.duration || 0); setCurrent(now); setDuration(total); if (Math.abs(now - savedRef.current) >= 2) { savedRef.current = now; saveWatchProgress(post, now, total); } } catch {} }, 750);
    return () => { alive = false; clearInterval(timer); try { saveWatchProgress(post, Number(player.currentTime || 0), Number(player.duration || 0)); player.pause(); } catch {} };
  }, [player, post?.id]);
  const time = (s) => { const v = Math.max(0, Math.floor(Number(s || 0))); return Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0'); };
  return <View style={[styles.youtubeMedia, { backgroundColor: '#000' }]}><VideoView ref={videoRef} player={player} style={styles.fill} nativeControls contentFit="contain" allowsFullscreen surfaceType="textureView" /><View pointerEvents="none" style={{ position: 'absolute', left: 10, bottom: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)' }}><Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>Resume saved • {time(current)} / {time(duration)}</Text></View></View>;
}`);

// Shorts can also be kept inside Earnzo without exporting to Gallery.
{
  const { start, end } = range('ShortPage');
  let block = code.slice(start, end);
  if (!block.includes('text="Offline"')) block = block.replace('<RoundAction icon="!" text="Report"', '<RoundAction icon="⬇" text="Offline" onPress={() => saveOfflineVideo(post)} /><RoundAction icon="!" text="Report"');
  code = code.slice(0, start) + block + code.slice(end);
}

// Profile button for app-private downloads + watch history/continue-watching.
{
  const { start, end } = range('Profile');
  let block = code.slice(start, end);
  const marker = '🔖 Saved';
  if (!block.includes('<EarnzoLibraryButton') && block.includes(marker)) {
    const i = block.indexOf(marker); const rowEnd = block.indexOf('</View>', i);
    if (rowEnd >= 0) block = block.slice(0, rowEnd + 7) + '<EarnzoLibraryButton />' + block.slice(rowEnd + 7);
  }
  code = code.slice(0, start) + block + code.slice(end);
}

const componentAnchor = 'function CreateCard({ icon, title, sub, onPress }) {';
if (!code.includes(componentAnchor)) throw new Error('Final product v2: CreateCard anchor not found');
const components = `function TextPostComposer({ name, username, setPosts, setCreatedPosts, goHome }) {
  const [open, setOpen] = useState(false); const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const publish = async () => {
    const body = text.trim(); if (!body || busy) return; setBusy(true);
    const local = { id: 'text-' + Date.now(), name: name || 'Creator', handle: '@' + (username || 'creator'), title: body.slice(0, 90), textBody: body, mediaType: 'text', mediaUri: '', likes: 0, views: 0, comments: [], following: false, liked: false, saved: false, category: 'Text', createdAt: Date.now() };
    setPosts((old) => [local, ...old]); setCreatedPosts((old) => [local, ...old]); setOpen(false); setText(''); goHome();
    if (backendEnabled) { try { const remote = await syncPostToBackend(local, '', ''); if (remote) { setPosts((old) => old.map((p) => p.id === local.id ? { ...local, ...remote } : p)); setCreatedPosts((old) => old.map((p) => p.id === local.id ? { ...local, ...remote } : p)); } } catch (e) { Alert.alert('Text post saved on device', 'Cloud sync failed: ' + String(e?.message || e)); } }
    setBusy(false);
  };
  return <><CreateCard icon="Aa" title="Text Post" sub="Write without video" onPress={() => setOpen(true)} /><Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><SafeAreaView style={{ flex: 1, backgroundColor: '#FFF', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }}><View style={{ minHeight: 60, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line }}><Pressable onPress={() => setOpen(false)}><Text style={{ fontSize: 28 }}>‹</Text></Pressable><Text style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900' }}>Create Text Post</Text><Pressable disabled={!text.trim() || busy} onPress={publish}><Text style={{ color: text.trim() ? C.purple : C.muted, fontWeight: '900' }}>{busy ? 'Posting...' : 'Post'}</Text></Pressable></View><View style={{ flex: 1, padding: 18 }}><TextInput autoFocus multiline maxLength={5000} value={text} onChangeText={setText} placeholder="Jo baat video se nahi samjha pa rahe, yahan text me likhiye..." textAlignVertical="top" style={{ minHeight: 260, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 16, fontSize: 18, lineHeight: 27, color: C.text }} /><Text style={{ color: C.muted, textAlign: 'right', marginTop: 8 }}>{text.length}/5000</Text></View></SafeAreaView></Modal></>;
}
function EarnzoLibraryButton() {
  const [open, setOpen] = useState(false); const [tab, setTab] = useState('Offline'); const [offline, setOffline] = useState([]); const [history, setHistory] = useState([]); const [selected, setSelected] = useState(null);
  const load = async () => { const [a,b] = await Promise.all([earnzoReadJson(EARNZO_OFFLINE_KEY, []), earnzoReadJson(EARNZO_HISTORY_KEY, [])]); setOffline(Array.isArray(a) ? a : []); setHistory(Array.isArray(b) ? b : []); };
  useEffect(() => { if (open) load(); }, [open]);
  const removeOffline = async (item) => { try { if (item?.localUri) await FileSystem.deleteAsync(item.localUri, { idempotent: true }); } catch {} const next = offline.filter((x) => String(x.id) !== String(item.id)); setOffline(next); await earnzoWriteJson(EARNZO_OFFLINE_KEY, next); };
  const list = tab === 'Offline' ? offline : history;
  const offlineById = new Map(offline.map((x) => [String(x.id), x]));
  return <><Pressable onPress={() => setOpen(true)} style={{ marginTop: 10, marginHorizontal: 0, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 13, alignItems: 'center' }}><Text style={{ fontWeight: '900', color: C.text }}>⬇ Offline Downloads   •   🕘 Watch History</Text></Pressable><Modal visible={open} animationType="slide" onRequestClose={() => { if (selected) setSelected(null); else setOpen(false); }}><SafeAreaView style={{ flex: 1, backgroundColor: '#FFF', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }}><View style={{ minHeight: 60, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line }}><Pressable onPress={() => selected ? setSelected(null) : setOpen(false)}><Text style={{ fontSize: 28 }}>‹</Text></Pressable><Text style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900' }}>{selected ? 'Continue Watching' : 'Your Library'}</Text><View style={{ width: 30 }} /></View>{selected ? <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}><HomeVideo post={{ ...selected, mediaUri: selected.localUri || offlineById.get(String(selected.id))?.localUri || selected.mediaUri }} /></View> : <><View style={{ flexDirection: 'row', gap: 10, padding: 14 }}><Chip text="Offline" active={tab === 'Offline'} onPress={() => setTab('Offline')} /><Chip text="History" active={tab === 'History'} onPress={() => setTab('History')} /></View><ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 60 }}>{!list.length ? <View style={styles.emptyCard}><Text style={styles.bold}>{tab === 'Offline' ? 'No offline downloads' : 'No watch history'}</Text><Text style={styles.muted}>{tab === 'Offline' ? 'Video par Offline button dabakar yahan save kare.' : 'Jo video dekhenge, woh yahan Continue Watching ke saath dikhegi.'}</Text></View> : list.map((item) => { const local = offlineById.get(String(item.id)); const pct = Number(item.progress || 0); return <View key={String(item.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#EFEFF3' }}><Pressable onPress={() => setSelected({ ...item, localUri: local?.localUri || item.localUri })} style={{ width: 86, height: 58, borderRadius: 10, overflow: 'hidden', backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>{item.coverUri ? <Image source={{ uri: item.coverUri }} style={styles.fill} resizeMode="cover" /> : <Text style={{ color: '#FFF', fontSize: 23 }}>▶</Text>}</Pressable><Pressable onPress={() => setSelected({ ...item, localUri: local?.localUri || item.localUri })} style={{ flex: 1 }}><Text numberOfLines={2} style={{ fontWeight: '900', color: C.text }}>{item.title || 'Video'}</Text><Text style={{ color: C.muted, marginTop: 4, fontSize: 11 }}>{tab === 'History' ? (Math.round(pct * 100) + '% watched • Continue') : 'Saved inside Earnzo'}</Text></Pressable>{tab === 'Offline' ? <Pressable onPress={() => removeOffline(item)} style={{ padding: 8 }}><Text style={{ fontSize: 18 }}>🗑</Text></Pressable> : null}</View>; })}</ScrollView></>}</SafeAreaView></Modal></>;
}

`;
code = code.replace(componentAnchor, components + componentAnchor);

// Final guard: these content-type chips must never survive in Home.
{
  const { start, end } = range('Home'); const home = code.slice(start, end);
  for (const forbidden of ['Long Videos', 'Short Videos', 'Photos', 'contentType']) if (home.includes(forbidden)) throw new Error('Final product v2 Home still contains ' + forbidden);
}

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo final product v2 applied: clean Home, long video feed, 2GB app limit, private offline library, history/resume and text posts.');
