const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo discovery monetization v3 active')) {
  console.log('Earnzo discovery/monetization patch already applied.');
  process.exit(0);
}

function must(label, ok) {
  if (!ok) throw new Error('Discovery monetization patch failed: ' + label);
}

function functionRange(name) {
  const start = code.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Discovery monetization patch failed: ' + name + ' not found');
  let end = code.indexOf('\nfunction ', start + 12);
  if (end < 0) end = code.indexOf('\n\nconst styles =', start + 12);
  if (end < 0) throw new Error('Discovery monetization patch failed: end of ' + name + ' not found');
  return { start, end };
}

must('FOLLOWER_TARGET not found', code.includes('const FOLLOWER_TARGET = 500;'));
must('VIEW_TARGET not found', code.includes('const VIEW_TARGET = 200000;'));
code = code.replace('const FOLLOWER_TARGET = 500;', 'const FOLLOWER_TARGET = 10000;');
code = code.replace('const VIEW_TARGET = 200000;', 'const VIEW_TARGET = 1000000;\nconst MONETIZATION_WINDOW_DAYS = 90;');

code = code
  .replaceAll('500 followers aur 2 lakh valid views complete kare.', '10K followers aur 10 lakh valid views last 90 days me complete kare.')
  .replaceAll('500 followers + 2 lakh valid views complete karne ke baad apply option unlock hoga.', '10K followers + 10 lakh valid views last 90 days me complete karne ke baad apply option unlock hoga.')
  .replaceAll('500 followers aur 2 lakh valid views', '10K followers aur 10 lakh valid views last 90 days me')
  .replaceAll('500 followers + 2 lakh valid views', '10K followers + 10 lakh valid views • 90 days');

{
  const { start, end } = functionRange('MonetizationCard');
  const replacement = `function MonetizationCard({ followers, views, eligible }) {
  return <View style={styles.monetizationCard}>
    <Text style={styles.monetizationSmall}>CREATOR MONETIZATION</Text>
    <Text style={styles.monetizationTitle}>Earnzo Creator Program</Text>
    <Text style={styles.monetizationSub}>10K followers + 10 lakh valid views last 90 days me complete karne ke baad apply option unlock hoga.</Text>
    <Progress title="Followers" value={fmt(followers) + " / 10K"} percent={pct(followers, FOLLOWER_TARGET)} />
    <Progress title="Valid Views • Last 90 days" value={fmt(views) + " / 1M"} percent={pct(views, VIEW_TARGET)} />
    <Pressable style={[styles.applyButton, !eligible && styles.locked]} onPress={() => Alert.alert(eligible ? "Eligible ✅" : "Not eligible yet", eligible ? "KYC aur policy review complete karke monetization application submit kare." : "10K followers aur 10 lakh valid views last 90 days me complete kare.")}>
      <Text style={styles.primaryText}>{eligible ? "Apply for Monetization" : "Monetization Locked"}</Text>
    </Pressable>
    <Text style={[styles.muted, { marginTop: 8, fontSize: 11 }]}>Views eligibility window: rolling 90 days. Followers target total followers par based hai.</Text>
  </View>;
}`;
  code = code.slice(0, start) + replacement + code.slice(end);
}

code = code.replace('const runCloudSearch = async () => {', 'const runCloudSearch = async (queryOverride = "") => {');
code = code.replace('    const q = searchText.trim();', '    const q = String(queryOverride || searchText).trim();\n    if (queryOverride) setSearchText(q);');

const oldSearchMount = '<SearchModal visible={searchOpen} close={() => setSearchOpen(false)} value={searchText} setValue={setSearchText} loading={searchLoading} results={searchResults} onSearch={runCloudSearch} openPost={() => { setSearchOpen(false); setTab("Home"); }} />';
if (code.includes(oldSearchMount)) {
  code = code.replace(oldSearchMount, '<SearchModal visible={searchOpen} close={() => setSearchOpen(false)} value={searchText} setValue={setSearchText} loading={searchLoading} results={searchResults} onSearch={runCloudSearch} openPost={() => { setSearchOpen(false); setTab("Home"); }} openCreate={() => { setSearchOpen(false); setTab("Create"); }} />');
} else {
  must('SearchModal mount missing', code.includes('<SearchModal visible={searchOpen}'));
  code = code.replace('openPost={() => { setSearchOpen(false); setTab("Home"); }} />', 'openPost={() => { setSearchOpen(false); setTab("Home"); }} openCreate={() => { setSearchOpen(false); setTab("Create"); }} />');
}

{
  const { start, end } = functionRange('SearchModal');
  const replacement = `function SearchModal({ visible, close, value, setValue, loading, results, onSearch, openPost, openCreate }) {
  const profiles = Array.isArray(results?.profiles) ? results.profiles : [];
  const posts = Array.isArray(results?.posts) ? results.posts : [];
  const topics = [
    ["🔥", "Trending", "trending"], ["😂", "Comedy", "comedy"], ["🍲", "Food", "food"],
    ["🏞️", "Village Life", "village"], ["✈️", "Travel", "travel"], ["📱", "Tech", "tech"],
    ["🎓", "Education", "education"], ["💪", "Motivation", "motivation"], ["💃", "Dance", "dance"],
    ["🎵", "Music", "music"], ["🏏", "Cricket", "cricket"], ["🙏", "Devotional", "devotional"],
    ["🎮", "Gaming", "gaming"], ["👗", "Fashion", "fashion"], ["🏍️", "Cars & Bikes", "bike"],
    ["💼", "Business", "business"], ["🏋️", "Fitness", "fitness"], ["🎤", "Singing", "singing"]
  ];
  const sounds = ["Earnzo Beat", "Village Vibes", "Creator Pop", "Travel Mood", "Krishna Flute", "Nature Love"];
  const term = String(value || "").trim().toLowerCase();
  const topicMatches = term ? topics.filter((x) => (String(x[1]) + " " + String(x[2])).toLowerCase().includes(term)).slice(0, 8) : topics.slice(0, 10);
  const soundMatches = term ? sounds.filter((x) => x.toLowerCase().includes(term)).slice(0, 6) : sounds.slice(0, 6);
  const pickQuery = (q) => { setValue(q); onSearch?.(q); };

  return <Modal visible={visible} animationType="slide" onRequestClose={close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E7E8EF" }}>
        <Pressable onPress={close} style={{ paddingRight: 12 }}><Text style={{ fontSize: 30, color: "#171722" }}>‹</Text></Pressable>
        <Text style={{ fontSize: 20, fontWeight: "900", color: "#171722" }}>Search Earnzo</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 8, padding: 14 }}>
        <TextInput value={value} onChangeText={setValue} onSubmitEditing={() => onSearch?.()} returnKeyType="search" autoFocus placeholder="Search creators, videos, topics, sounds..." style={[styles.input, { flex: 1, marginBottom: 0 }]} />
        <Pressable onPress={() => onSearch?.()} style={{ backgroundColor: "#6C4CF1", paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#FFF", fontWeight: "900" }}>Search</Text></Pressable>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 50 }}>
        {!term ? <View style={{ backgroundColor: "#F5F3FF", borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <Text style={{ fontSize: 17, fontWeight: "900", color: "#171722" }}>Discover what to create</Text>
          <Text style={{ color: "#747789", marginTop: 5, lineHeight: 20 }}>Creators kam hone par bhi topics, trends aur sound ideas dikhte rahenge. Kisi topic ko tap karke search kare ya Create se us par Reel/Video banaye.</Text>
        </View> : null}

        {term ? <View style={{ borderWidth: 1, borderColor: "#E7E8EF", borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#171722" }}>Explore “{value.trim()}”</Text>
          <Text style={{ color: "#747789", marginTop: 4 }}>Is topic par content kam hai to aap pehle creators me se ho sakte ho.</Text>
          <Pressable onPress={openCreate} style={{ marginTop: 10, alignSelf: "flex-start", backgroundColor: "#6C4CF1", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}><Text style={{ color: "#FFF", fontWeight: "900" }}>＋ Create on this topic</Text></Pressable>
        </View> : null}

        {topicMatches.length ? <Text style={{ fontSize: 17, fontWeight: "900", marginTop: 4, marginBottom: 8 }}>{term ? "Topics" : "Trending Topics"}</Text> : null}
        {topicMatches.length ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {topicMatches.map((x) => <Pressable key={x[1]} onPress={() => pickQuery(x[2])} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F8", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 }}>
            <Text style={{ marginRight: 6 }}>{x[0]}</Text><Text style={{ fontWeight: "800", color: "#171722" }}>#{x[1].replace(/\s+/g, "")}</Text>
          </Pressable>)}
        </View> : null}

        {soundMatches.length ? <Text style={{ fontSize: 17, fontWeight: "900", marginTop: 10, marginBottom: 8 }}>{term ? "Sound ideas" : "Trending Sounds"}</Text> : null}
        {soundMatches.map((s) => <Pressable key={s} onPress={() => Alert.alert("Sound idea", String(s) + " Creator Library suggestion hai. Create > Add Sound me sound options open kare. Commercial songs ke liye licensed music catalog connect karna hoga.")} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#F0EDFF", alignItems: "center", justifyContent: "center", marginRight: 10 }}><Text style={{ fontSize: 20 }}>♫</Text></View>
          <View style={{ flex: 1 }}><Text style={{ fontWeight: "900", color: "#171722" }}>{s}</Text><Text style={{ color: "#747789", marginTop: 2 }}>Creator sound idea • Add Sound</Text></View>
          <Text style={{ color: "#6C4CF1", fontWeight: "900" }}>›</Text>
        </Pressable>)}

        {loading ? <Text style={{ color: "#747789", textAlign: "center", marginTop: 20 }}>Searching creators and videos...</Text> : null}

        {profiles.length > 0 ? <Text style={{ fontSize: 17, fontWeight: "900", marginTop: 18, marginBottom: 8 }}>Creators</Text> : null}
        {profiles.map((p, i) => <View key={String(p.id || p.username || i)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: "#F0EDFF", alignItems: "center", justifyContent: "center", marginRight: 10 }}>{p.profilePhoto ? <Image source={{ uri: p.profilePhoto }} style={styles.fill} /> : <Text style={{ fontWeight: "900", color: "#6C4CF1" }}>{String(p.name || p.username || "E")[0].toUpperCase()}</Text>}</View>
          <View style={{ flex: 1 }}><Text style={{ fontWeight: "900", fontSize: 15 }}>{p.name || "Creator"}</Text><Text style={{ color: "#747789", marginTop: 2 }}>{p.username ? "@" + p.username : (p.handle || "")}</Text></View>
        </View>)}

        {posts.length > 0 ? <Text style={{ fontSize: 17, fontWeight: "900", marginTop: 18, marginBottom: 8 }}>Videos & Posts</Text> : null}
        {posts.map((p, i) => <Pressable key={String(p.id || i)} onPress={openPost} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}>
          <View style={{ width: 68, height: 52, borderRadius: 9, overflow: "hidden", backgroundColor: "#111", marginRight: 10 }}>{p.coverUri || (p.mediaType === "photo" && p.mediaUri) ? <Image source={{ uri: p.coverUri || p.mediaUri }} style={styles.fill} /> : <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#FFF", fontWeight: "900" }}>EZ</Text></View>}</View>
          <View style={{ flex: 1 }}><Text numberOfLines={2} style={{ fontWeight: "800", color: "#171722" }}>{p.title || "Earnzo post"}</Text><Text style={{ color: "#747789", marginTop: 3 }}>{p.name || p.handle || "Creator"}</Text></View>
        </Pressable>)}

        {!loading && term && profiles.length === 0 && posts.length === 0 ? <View style={{ marginTop: 18, backgroundColor: "#F8F8FB", borderRadius: 14, padding: 14 }}>
          <Text style={{ fontWeight: "900", color: "#171722" }}>Abhi creator/video result nahi hai</Text>
          <Text style={{ color: "#747789", marginTop: 4, lineHeight: 19 }}>Topic phir bhi searchable rahega. Aap isi search ko content idea bana kar pehli Reel/Video publish kar sakte ho.</Text>
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}`;
  code = code.slice(0, start) + replacement + code.slice(end);
}

code = code.replace('Real commercial/licensed music requires rights-cleared catalog integration.', 'Commercial songs need a rights-cleared/licensed music catalog. Original audio and creator sound ideas can be used for testing now.');
code = code.replace('Original audio volume/mute is active now. Commercial music mixing needs rights-cleared catalog integration.', 'Original audio controls are active. Commercial song mixing will be enabled only after a licensed music catalog/media engine is connected.');

code = code.replace('export default function App() {', '// Earnzo discovery monetization v3 active\nexport default function App() {');

must('new follower target missing', code.includes('const FOLLOWER_TARGET = 10000;'));
must('new view target missing', code.includes('const VIEW_TARGET = 1000000;'));
must('90-day copy missing', code.includes('Valid Views • Last 90 days'));
must('discovery search missing', code.includes('Discover what to create'));
must('create from topic missing', code.includes('Create on this topic'));

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo discovery/monetization applied: discovery-first search, sound ideas, 10K followers + 1M valid views / 90-day rule.');
