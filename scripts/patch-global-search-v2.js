const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo global discovery search v2 active')) {
  console.log('Earnzo global discovery search v2 already applied.');
  process.exit(0);
}

function must(label, ok) {
  if (!ok) throw new Error('Global discovery search v2 failed: ' + label);
}

function functionRange(name) {
  const start = code.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Global discovery search v2 failed: ' + name + ' not found');
  let end = code.indexOf('\nfunction ', start + 12);
  if (end < 0) end = code.indexOf('\n\nconst styles =', start + 12);
  if (end < 0) throw new Error('Global discovery search v2 failed: end of ' + name + ' not found');
  return { start, end };
}

// Keep a topic selected from Search so Create can prefill it.
const searchState = 'const [searchOpen, setSearchOpen] = useState(false); const [searchText, setSearchText] = useState(""); const [searchLoading, setSearchLoading] = useState(false); const [searchResults, setSearchResults] = useState({ profiles: [], posts: [] });';
must('search state anchor missing', code.includes(searchState));
code = code.replace(searchState, searchState + '\n  const [createSeedTopic, setCreateSeedTopic] = useState(""); // Earnzo global discovery search v2 active');

// Preserve optional future backend sections without breaking older backend responses.
const resultBlock = `      setSearchResults({
        profiles: Array.isArray(result?.profiles) ? result.profiles : [],
        posts: Array.isArray(result?.posts) ? result.posts : [],
      });`;
if (code.includes(resultBlock)) {
  code = code.replace(resultBlock, `      setSearchResults({
        profiles: Array.isArray(result?.profiles) ? result.profiles : [],
        posts: Array.isArray(result?.posts) ? result.posts : [],
        topics: Array.isArray(result?.topics) ? result.topics : [],
        sounds: Array.isArray(result?.sounds) ? result.sounds : [],
      });`);
}

// Pass all visible feed posts into search so search is useful even before cloud data grows.
const searchMountNeedle = '<SearchModal visible={searchOpen} close={() => setSearchOpen(false)} value={searchText} setValue={setSearchText} loading={searchLoading} results={searchResults} onSearch={runCloudSearch} openPost={() => { setSearchOpen(false); setTab("Home"); }} openCreate={() => { setSearchOpen(false); setTab("Create"); }} />';
must('SearchModal mount missing', code.includes(searchMountNeedle));
code = code.replace(searchMountNeedle, '<SearchModal visible={searchOpen} close={() => setSearchOpen(false)} value={searchText} setValue={setSearchText} loading={searchLoading} results={searchResults} localPosts={posts} onSearch={runCloudSearch} openPost={() => { setSearchOpen(false); setTab("Home"); }} openCreate={(topic) => { setCreateSeedTopic(String(topic || searchText || "").trim()); setSearchOpen(false); setTab("Create"); }} />');

// Feed the selected topic into Create.
const createCall = '<Create name={name} username={username} setPosts={setPosts} setCreatedPosts={setCreatedPosts} goHome={() => setTab("Home")} goShorts={() => setTab("Shorts")} />';
must('Create call missing', code.includes(createCall));
code = code.replace(createCall, '<Create name={name} username={username} setPosts={setPosts} setCreatedPosts={setCreatedPosts} goHome={() => setTab("Home")} goShorts={() => setTab("Shorts")} initialTopic={createSeedTopic} clearInitialTopic={() => setCreateSeedTopic("")} />');

// Add the props to the Create signature without depending on other future props.
const createSig = /function Create\(\{([^}]*)\}\) \{/;
const sigMatch = code.match(createSig);
must('Create signature missing', !!sigMatch);
if (!sigMatch[1].includes('initialTopic')) {
  code = code.replace(createSig, (m, inner) => `function Create({${inner.trim()}, initialTopic = "", clearInitialTopic }) {`);
}

// Prefill a topic/hashtag when the user starts Create from Search.
const audioState = 'const [audioMode, setAudioMode] = useState("Original 100%");';
must('Create audio state missing', code.includes(audioState));
code = code.replace(audioState, audioState + `
  useEffect(() => {
    const topic = String(initialTopic || "").trim();
    if (!topic) return;
    const clean = topic.replace(/^#+/, "").replace(/\s+/g, " ").slice(0, 60);
    const hash = "#" + clean.replace(/[^a-zA-Z0-9\u0900-\u097F]+/g, "");
    setCaption((old) => old.trim() ? old : clean);
    setTags((old) => old.trim() ? old : hash);
    clearInitialTopic?.();
  }, [initialTopic]);`);

// Replace Search with a global-style discovery surface.
{
  const { start, end } = functionRange('SearchModal');
  const replacement = `function SearchModal({ visible, close, value, setValue, loading, results, localPosts = [], onSearch, openPost, openCreate }) {
  const [activeTab, setActiveTab] = useState("All");
  const term = String(value || "").trim().toLowerCase();
  const cloudPosts = Array.isArray(results?.posts) ? results.posts : [];
  const cloudProfiles = Array.isArray(results?.profiles) ? results.profiles : [];
  const builtInTopics = [
    ["🔥", "Trending"], ["😂", "Comedy"], ["🍲", "Food"], ["🏞️", "Village Life"], ["✈️", "Travel"],
    ["📱", "Tech"], ["🎓", "Education"], ["💪", "Motivation"], ["💃", "Dance"], ["🎵", "Music"],
    ["🏏", "Cricket"], ["🙏", "Devotional"], ["🎮", "Gaming"], ["👗", "Fashion"], ["🏍️", "Cars & Bikes"],
    ["💼", "Business"], ["🏋️", "Fitness"], ["🎤", "Singing"], ["📰", "News"], ["🤣", "Funny"],
  ];
  const starterSounds = ["Earnzo Beat", "Village Vibes", "Creator Pop", "Travel Mood", "Krishna Flute", "Nature Love"];
  const norm = (v) => String(v || "").toLowerCase();
  const postText = (p) => [p?.title, p?.tags, p?.category, p?.name, p?.handle, p?.location, p?.playlist].map(norm).join(" ");
  const mergedMap = new Map();
  [...localPosts, ...cloudPosts].forEach((p, i) => { if (!p) return; const key = String(p.id || p.localId || p.mediaUri || p.title || i); if (!mergedMap.has(key)) mergedMap.set(key, p); });
  const allPosts = Array.from(mergedMap.values());
  const matchedPosts = term ? allPosts.filter((p) => postText(p).includes(term)) : allPosts.slice(0, 18);
  const videos = matchedPosts.filter((p) => p.mediaType === "long" || p.mediaType === "video");
  const reels = matchedPosts.filter((p) => p.mediaType === "short");

  const profileMap = new Map();
  cloudProfiles.forEach((p, i) => { const key = String(p?.id || p?.username || p?.handle || i); if (p && !profileMap.has(key)) profileMap.set(key, p); });
  allPosts.forEach((p) => { const key = String(p?.handle || p?.name || ""); if (key && !profileMap.has(key)) profileMap.set(key, { id: key, name: p.name || "Creator", handle: p.handle || "", username: String(p.handle || "").replace(/^@/, "") }); });
  const creators = Array.from(profileMap.values()).filter((p) => !term || norm((p?.name || "") + " " + (p?.username || "") + " " + (p?.handle || "")).includes(term)).slice(0, 30);

  const dynamicTopics = Array.from(new Set(allPosts.flatMap((p) => [p?.category, ...(String(p?.tags || "").match(/#[^\s#]+/g) || [])]).filter(Boolean).map(String)));
  const topicPool = [...builtInTopics.map((x) => x[1]), ...dynamicTopics];
  const topics = Array.from(new Set(topicPool)).filter((t) => !term || norm(t).includes(term)).slice(0, 30);
  const fallbackTopic = term && !topics.some((t) => norm(t) === term) ? [String(value).trim()] : [];

  const soundPool = [...starterSounds];
  allPosts.forEach((p) => {
    const explicit = String(p?.soundName || p?.audioTitle || "").trim();
    if (explicit) soundPool.push(explicit);
    else if (p?.mediaType === "short" && p?.handle) soundPool.push(String(p.handle).replace(/^@/, "") + " Original Sound");
  });
  const sounds = Array.from(new Set(soundPool)).filter((s) => !term || norm(s).includes(term)).slice(0, 30);

  const tabs = ["All", "Videos", "Reels", "Creators", "Sounds", "Topics"];
  const showPosts = activeTab === "All" || activeTab === "Videos" || activeTab === "Reels";
  const postList = activeTab === "Videos" ? videos : activeTab === "Reels" ? reels : matchedPosts;
  const showCreators = activeTab === "All" || activeTab === "Creators";
  const showSounds = activeTab === "All" || activeTab === "Sounds";
  const showTopics = activeTab === "All" || activeTab === "Topics";
  const hasAny = postList.length || (showCreators && creators.length) || (showSounds && sounds.length) || (showTopics && (topics.length || fallbackTopic.length));
  const chooseTopic = (topic) => { const q = String(topic || "").replace(/^#/, ""); setValue(q); onSearch?.(q); };

  return <Modal visible={visible} animationType="slide" onRequestClose={close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E7E8EF" }}>
        <Pressable onPress={close} style={{ paddingRight: 12 }}><Text style={{ fontSize: 30, color: "#171722" }}>‹</Text></Pressable>
        <Text style={{ fontSize: 20, fontWeight: "900", color: "#171722" }}>Search Earnzo</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingTop: 14 }}>
        <TextInput value={value} onChangeText={setValue} onSubmitEditing={() => onSearch?.()} returnKeyType="search" autoFocus placeholder="Search videos, reels, creators, sounds, topics..." style={[styles.input, { flex: 1, marginBottom: 0 }]} />
        <Pressable onPress={() => onSearch?.()} style={{ backgroundColor: "#6C4CF1", paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#FFF", fontWeight: "900" }}>Search</Text></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 8 }}>
        {tabs.map((x) => <Pressable key={x} onPress={() => setActiveTab(x)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: activeTab === x ? "#171722" : "#F1F2F6" }}><Text style={{ fontWeight: "900", color: activeTab === x ? "#FFF" : "#444756" }}>{x}</Text></Pressable>)}
      </ScrollView>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 60 }}>
        {!term ? <View style={{ backgroundColor: "#F5F3FF", borderRadius: 16, padding: 14, marginBottom: 12 }}><Text style={{ fontSize: 17, fontWeight: "900", color: "#171722" }}>Discover something new</Text><Text style={{ color: "#747789", marginTop: 5, lineHeight: 20 }}>Search blank nahi rahega. Earnzo posts ke saath trending topics, creators aur sound ideas bhi milenge.</Text></View> : null}
        {loading ? <Text style={{ color: "#747789", textAlign: "center", marginVertical: 12 }}>Searching Earnzo...</Text> : null}

        {showTopics && (topics.length || fallbackTopic.length) ? <><Text style={{ fontSize: 17, fontWeight: "900", marginTop: 4, marginBottom: 8 }}>{term ? "Topics" : "Explore Topics"}</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>{[...fallbackTopic, ...topics].slice(0, activeTab === "Topics" ? 30 : 10).map((t) => <Pressable key={t} onPress={() => chooseTopic(t)} style={{ backgroundColor: "#F3F4F8", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 }}><Text style={{ fontWeight: "800", color: "#171722" }}>#{String(t).replace(/^#/, "").replace(/\s+/g, "")}</Text></Pressable>)}</View></> : null}

        {term ? <Pressable onPress={() => openCreate?.(value.trim())} style={{ backgroundColor: "#6C4CF1", borderRadius: 14, padding: 13, marginBottom: 16, alignItems: "center" }}><Text style={{ color: "#FFF", fontWeight: "900" }}>＋ Create Reel / Video on “{value.trim()}”</Text></Pressable> : null}

        {showPosts && postList.length ? <><Text style={{ fontSize: 17, fontWeight: "900", marginTop: 4, marginBottom: 8 }}>{activeTab === "Reels" ? "Reels" : activeTab === "Videos" ? "Videos" : "Videos & Reels"}</Text>{postList.slice(0, activeTab === "All" ? 12 : 30).map((p, i) => <Pressable key={String(p.id || p.localId || i)} onPress={openPost} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}><View style={{ width: 86, height: 60, borderRadius: 10, overflow: "hidden", backgroundColor: "#111", marginRight: 10 }}>{p.coverUri || (p.mediaType === "photo" && p.mediaUri) ? <Image source={{ uri: p.coverUri || p.mediaUri }} style={styles.fill} /> : <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#FFF", fontWeight: "900" }}>{p.mediaType === "short" ? "REEL" : "EZ"}</Text></View>}</View><View style={{ flex: 1 }}><Text numberOfLines={2} style={{ fontWeight: "900", color: "#171722" }}>{p.title || "Earnzo video"}</Text><Text numberOfLines={1} style={{ color: "#747789", marginTop: 3 }}>{p.name || p.handle || "Creator"} • {p.mediaType === "short" ? "Reel" : p.mediaType === "long" ? "Video" : "Post"}</Text></View><Text style={{ color: "#6C4CF1", fontSize: 22 }}>›</Text></Pressable>)}</> : null}

        {showCreators && creators.length ? <><Text style={{ fontSize: 17, fontWeight: "900", marginTop: 18, marginBottom: 8 }}>Creators</Text>{creators.slice(0, activeTab === "All" ? 8 : 30).map((p, i) => <View key={String(p.id || p.username || p.handle || i)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}><View style={{ width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: "#F0EDFF", alignItems: "center", justifyContent: "center", marginRight: 10 }}>{p.profilePhoto ? <Image source={{ uri: p.profilePhoto }} style={styles.fill} /> : <Text style={{ fontWeight: "900", color: "#6C4CF1" }}>{String(p.name || p.username || "E")[0].toUpperCase()}</Text>}</View><View style={{ flex: 1 }}><Text style={{ fontWeight: "900", fontSize: 15 }}>{p.name || "Creator"}</Text><Text style={{ color: "#747789", marginTop: 2 }}>{p.username ? "@" + String(p.username).replace(/^@/, "") : (p.handle || "")}</Text></View></View>)}</> : null}

        {showSounds && sounds.length ? <><Text style={{ fontSize: 17, fontWeight: "900", marginTop: 18, marginBottom: 8 }}>Sounds</Text>{sounds.slice(0, activeTab === "All" ? 6 : 30).map((s) => <View key={s} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}><View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#F0EDFF", alignItems: "center", justifyContent: "center", marginRight: 10 }}><Text style={{ fontSize: 20 }}>♫</Text></View><View style={{ flex: 1 }}><Text style={{ fontWeight: "900", color: "#171722" }}>{s}</Text><Text style={{ color: "#747789", marginTop: 2 }}>Earnzo sound discovery</Text></View><Pressable onPress={() => Alert.alert("Sound", "Sound mil gaya. Real ‘Use this sound’ mixing next media-engine step me enable hoga; copyrighted songs ke liye licensed catalog required hoga.")} style={{ backgroundColor: "#F0EDFF", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}><Text style={{ color: "#6C4CF1", fontWeight: "900" }}>View</Text></Pressable></View>)}</> : null}

        {!loading && term && !hasAny ? <View style={{ marginTop: 18, backgroundColor: "#F8F8FB", borderRadius: 14, padding: 14 }}><Text style={{ fontWeight: "900", color: "#171722" }}>Is search par abhi Earnzo video nahi hai</Text><Text style={{ color: "#747789", marginTop: 5, lineHeight: 19 }}>Search phir bhi topic ke roop me available hai. Aap is topic par pehli Reel/Video bana sakte hain.</Text><Pressable onPress={() => openCreate?.(value.trim())} style={{ marginTop: 10, backgroundColor: "#6C4CF1", borderRadius: 10, padding: 10, alignItems: "center" }}><Text style={{ color: "#FFF", fontWeight: "900" }}>Create on this topic</Text></Pressable></View> : null}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}`;
  code = code.slice(0, start) + replacement + code.slice(end);
}

must('global search tabs missing', code.includes('["All", "Videos", "Reels", "Creators", "Sounds", "Topics"]'));
must('local posts search missing', code.includes('localPosts={posts}'));
must('topic create seed missing', code.includes('initialTopic={createSeedTopic}'));

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo global discovery search v2 applied: tabs, local+cloud search, non-empty topics, and Create-from-topic prefill.');
