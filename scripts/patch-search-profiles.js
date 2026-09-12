const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo cloud search active')) {
  console.log('Earnzo cloud search patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Search patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'backend search imports',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser } from "./backend/client";',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote } from "./backend/client";'
);

replaceOnce(
  'search states',
  '  const [supportOpen, setSupportOpen] = useState(false); const [settingsOpen, setSettingsOpen] = useState(false); const [reportTarget, setReportTarget] = useState(null); const [supportTickets, setSupportTickets] = useState([]);',
  '  const [supportOpen, setSupportOpen] = useState(false); const [settingsOpen, setSettingsOpen] = useState(false); const [reportTarget, setReportTarget] = useState(null); const [supportTickets, setSupportTickets] = useState([]);\n  const [searchOpen, setSearchOpen] = useState(false); const [searchText, setSearchText] = useState(""); const [searchLoading, setSearchLoading] = useState(false); const [searchResults, setSearchResults] = useState({ profiles: [], posts: [] });'
);

const persistenceEffect = '  useEffect(() => { if (!loaded) return; AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ stage, authMode, mobile, name, username, profilePhoto, lastNameChangeAt, accountStatus, deactivatedAt, posts, createdPosts, stories, supportTickets, followersCount, validViews, walletBalance, countryKey, kycStatus, kycDocType, payoutOwner, payoutMethod, payoutStatus })).catch(() => {}); }, [loaded, stage, authMode, mobile, name, username, profilePhoto, lastNameChangeAt, accountStatus, deactivatedAt, posts, createdPosts, stories, supportTickets, followersCount, validViews, walletBalance, countryKey, kycStatus, kycDocType, payoutOwner, payoutMethod, payoutStatus]);';
const profileEffect = `${persistenceEffect}\n  useEffect(() => {\n    if (!loaded || stage !== "app" || !backendEnabled || (!username && !mobile)) return;\n    const timer = setTimeout(() => {\n      upsertProfile({\n        mobile,\n        name: name || "Creator",\n        username,\n        handle: username ? \`@\${username}\` : "",\n        profilePhoto,\n        updatedAt: Date.now(),\n      }).catch((e) => console.log("Earnzo profile sync failed", e?.message || e));\n    }, 500);\n    return () => clearTimeout(timer);\n  }, [loaded, stage, mobile, name, username, profilePhoto]);`;
replaceOnce('profile sync effect', persistenceEffect, profileEffect);

replaceOnce(
  'search helper before page',
  '  let page;',
  `  // Earnzo cloud search active\n  const runCloudSearch = async () => {\n    const q = searchText.trim();\n    if (!q) { setSearchResults({ profiles: [], posts: [] }); return; }\n    setSearchLoading(true);\n    try {\n      const result = await searchRemote(q);\n      setSearchResults({\n        profiles: Array.isArray(result?.profiles) ? result.profiles : [],\n        posts: Array.isArray(result?.posts) ? result.posts : [],\n      });\n    } catch (e) {\n      Alert.alert("Search failed", String(e?.message || e || "Please try again"));\n    } finally {\n      setSearchLoading(false);\n    }\n  };\n  let page;`
);

replaceOnce(
  'header search prop',
  '<Header name={name} profilePhoto={profilePhoto} country={country} wallet={walletBalance} openEarn={() => setTab("Earn")} openProfile={() => setTab("Profile")} />',
  '<Header name={name} profilePhoto={profilePhoto} country={country} wallet={walletBalance} openEarn={() => setTab("Earn")} openProfile={() => setTab("Profile")} openSearch={() => setSearchOpen(true)} />'
);

replaceOnce(
  'search modal mount',
  'logout={() => { setSettingsOpen(false); setStage("welcome"); setTab("Home"); }} /></SafeAreaView>;',
  'logout={() => { setSettingsOpen(false); setStage("welcome"); setTab("Home"); }} /><SearchModal visible={searchOpen} close={() => setSearchOpen(false)} value={searchText} setValue={setSearchText} loading={searchLoading} results={searchResults} onSearch={runCloudSearch} openPost={() => { setSearchOpen(false); setTab("Home"); }} /></SafeAreaView>;'
);

replaceOnce(
  'header search button',
  'function Header({ name, profilePhoto, country, wallet, openEarn, openProfile }) { return <View style={styles.header}><View style={styles.logoRow}><View style={styles.logoBox}><Text style={styles.logoBoxText}>EZ</Text></View><View><Text style={styles.logoTitle}>Earnzo</Text><Text style={styles.tagline}>Create • Connect • Earn</Text></View></View><View style={styles.headerRight}><Pressable style={styles.walletChip} onPress={openEarn}><Text style={styles.walletText}>{country.currency}{wallet}</Text></Pressable><Pressable style={styles.headerAvatar} onPress={openProfile}>{profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.fill} /> : <Text style={styles.headerAvatarText}>{(name || "E")[0].toUpperCase()}</Text>}</Pressable></View></View>; }',
  'function Header({ name, profilePhoto, country, wallet, openEarn, openProfile, openSearch }) { return <View style={styles.header}><View style={styles.logoRow}><View style={styles.logoBox}><Text style={styles.logoBoxText}>EZ</Text></View><View><Text style={styles.logoTitle}>Earnzo</Text><Text style={styles.tagline}>Create • Connect • Earn</Text></View></View><View style={styles.headerRight}><Pressable onPress={openSearch} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7" }}><Text style={{ fontSize: 18 }}>🔍</Text></Pressable><Pressable style={styles.walletChip} onPress={openEarn}><Text style={styles.walletText}>{country.currency}{wallet}</Text></Pressable><Pressable style={styles.headerAvatar} onPress={openProfile}>{profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.fill} /> : <Text style={styles.headerAvatarText}>{(name || "E")[0].toUpperCase()}</Text>}</Pressable></View></View>; }'
);

const marker = 'function Brand() {';
const searchModal = `function SearchModal({ visible, close, value, setValue, loading, results, onSearch, openPost }) {\n  const profiles = Array.isArray(results?.profiles) ? results.profiles : [];\n  const posts = Array.isArray(results?.posts) ? results.posts : [];\n  return <Modal visible={visible} animationType="slide" onRequestClose={close}>\n    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>\n      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E7E8EF" }}>\n        <Pressable onPress={close} style={{ paddingRight: 12 }}><Text style={{ fontSize: 30, color: "#171722" }}>‹</Text></Pressable>\n        <Text style={{ fontSize: 20, fontWeight: "900", color: "#171722" }}>Search Earnzo</Text>\n      </View>\n      <View style={{ flexDirection: "row", gap: 8, padding: 14 }}>\n        <TextInput value={value} onChangeText={setValue} onSubmitEditing={onSearch} returnKeyType="search" autoFocus placeholder="Search creator or post..." style={[styles.input, { flex: 1, marginBottom: 0 }]} />\n        <Pressable onPress={onSearch} style={{ backgroundColor: "#6C4CF1", paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#FFF", fontWeight: "900" }}>Search</Text></Pressable>\n      </View>\n      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }}>\n        {loading ? <Text style={{ color: "#747789", textAlign: "center", marginTop: 20 }}>Searching...</Text> : null}\n        {!loading && value.trim() && profiles.length === 0 && posts.length === 0 ? <Text style={{ color: "#747789", textAlign: "center", marginTop: 20 }}>No results found</Text> : null}\n        {profiles.length > 0 ? <Text style={{ fontSize: 17, fontWeight: "900", marginTop: 8, marginBottom: 8 }}>Creators</Text> : null}\n        {profiles.map((p, i) => <View key={String(p.id || p.username || i)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}>\n          <View style={{ width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: "#F0EDFF", alignItems: "center", justifyContent: "center", marginRight: 10 }}>{p.profilePhoto ? <Image source={{ uri: p.profilePhoto }} style={styles.fill} /> : <Text style={{ fontWeight: "900", color: "#6C4CF1" }}>{String(p.name || p.username || "E")[0].toUpperCase()}</Text>}</View>\n          <View style={{ flex: 1 }}><Text style={{ fontWeight: "900", fontSize: 15 }}>{p.name || "Creator"}</Text><Text style={{ color: "#747789", marginTop: 2 }}>{p.username ? \`@\${p.username}\` : (p.handle || "")}</Text></View>\n        </View>)}\n        {posts.length > 0 ? <Text style={{ fontSize: 17, fontWeight: "900", marginTop: 18, marginBottom: 8 }}>Posts</Text> : null}\n        {posts.map((p, i) => <Pressable key={String(p.id || i)} onPress={openPost} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}>\n          <View style={{ width: 68, height: 52, borderRadius: 9, overflow: "hidden", backgroundColor: "#111", marginRight: 10 }}>{p.coverUri || (p.mediaType === "photo" && p.mediaUri) ? <Image source={{ uri: p.coverUri || p.mediaUri }} style={styles.fill} /> : <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#FFF", fontWeight: "900" }}>EZ</Text></View>}</View>\n          <View style={{ flex: 1 }}><Text numberOfLines={2} style={{ fontWeight: "800", color: "#171722" }}>{p.title || "Earnzo post"}</Text><Text style={{ color: "#747789", marginTop: 3 }}>{p.name || p.handle || "Creator"}</Text></View>\n        </Pressable>)}\n      </ScrollView>\n    </SafeAreaView>\n  </Modal>;\n}\n\n`;
if (!code.includes(marker)) throw new Error('Search patch failed: Brand marker not found');
code = code.replace(marker, searchModal + marker);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo cloud search applied: profile sync + creator/post search UI.');
