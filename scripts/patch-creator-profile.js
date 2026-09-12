const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo public creator profile active')) {
  console.log('Earnzo creator profile patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Creator profile patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

// App state for public creator/profile view.
replaceOnce(
  'creator profile state',
  '  const [refreshing, setRefreshing] = useState(false);',
  '  const [refreshing, setRefreshing] = useState(false);\n  const [publicCreator, setPublicCreator] = useState(null);'
);

// Public-profile helpers. Follow is cloud-backed when backend is available.
replaceOnce(
  'creator helper anchor',
  '  // Earnzo pull refresh active\n  const refreshCloud = async () => {',
  `  // Earnzo public creator profile active\n  const openPublicCreator = (creator) => {\n    if (!creator) return;\n    const handle = String(creator.handle || (creator.username ? \`@\${creator.username}\` : '') || '').trim();\n    setPublicCreator({\n      ...creator,\n      name: creator.name || creator.title || 'Creator',\n      handle,\n    });\n  };\n  const handleCreatorFollow = async (creator) => {\n    const creatorKey = String(creator?.handle || creator?.name || '').trim();\n    if (!creatorKey) return;\n    const creatorPosts = posts.filter((p) => String(p.handle || p.name || '').trim() === creatorKey);\n    const currentlyFollowing = creatorPosts.some((p) => !!p.following);\n    const next = !currentlyFollowing;\n    setPosts((old) => old.map((p) => String(p.handle || p.name || '').trim() === creatorKey ? { ...p, following: next } : p));\n    setPublicCreator((old) => old && String(old.handle || old.name || '').trim() === creatorKey ? { ...old, following: next } : old);\n    if (!backendEnabled) return;\n    try {\n      const remote = await followRemoteUser(cloudUserId, creatorKey);\n      setPosts((old) => old.map((p) => String(p.handle || p.name || '').trim() === creatorKey ? { ...p, following: !!remote?.following } : p));\n      setPublicCreator((old) => old && String(old.handle || old.name || '').trim() === creatorKey ? { ...old, following: !!remote?.following } : old);\n    } catch (e) {\n      setPosts((old) => old.map((p) => String(p.handle || p.name || '').trim() === creatorKey ? { ...p, following: currentlyFollowing } : p));\n      setPublicCreator((old) => old && String(old.handle || old.name || '').trim() === creatorKey ? { ...old, following: currentlyFollowing } : old);\n      Alert.alert('Follow failed', String(e?.message || e || 'Please try again'));\n    }\n  };\n  // Earnzo pull refresh active\n  const refreshCloud = async () => {`
);

// Pass creator-open callback into Home and Shorts.
replaceOnce(
  'home public profile prop',
  '<Home posts={posts} setPosts={setPosts} stories={stories} addStory={addStory} openStory={(i) => { setStoryIndex(i); setStoryOpen(true); }} openComments={openComments} onReport={setReportTarget} onLike={handleLike} onFollow={handleFollow} refreshing={refreshing} onRefresh={refreshCloud} />',
  '<Home posts={posts} setPosts={setPosts} stories={stories} addStory={addStory} openStory={(i) => { setStoryIndex(i); setStoryOpen(true); }} openComments={openComments} onReport={setReportTarget} onLike={handleLike} onFollow={handleFollow} refreshing={refreshing} onRefresh={refreshCloud} openCreator={openPublicCreator} />'
);
replaceOnce(
  'shorts public profile prop',
  '<Shorts posts={posts} setPosts={setPosts} openComments={openComments} onReport={setReportTarget} onLike={handleLike} refreshing={refreshing} onRefresh={refreshCloud} />',
  '<Shorts posts={posts} setPosts={setPosts} openComments={openComments} onReport={setReportTarget} onLike={handleLike} refreshing={refreshing} onRefresh={refreshCloud} openCreator={openPublicCreator} />'
);

// Search creator rows become clickable and open the creator profile.
replaceOnce(
  'search modal props',
  '<SearchModal visible={searchOpen} close={() => setSearchOpen(false)} value={searchText} setValue={setSearchText} loading={searchLoading} results={searchResults} onSearch={runCloudSearch} openPost={() => { setSearchOpen(false); setTab("Home"); }} />',
  '<SearchModal visible={searchOpen} close={() => setSearchOpen(false)} value={searchText} setValue={setSearchText} loading={searchLoading} results={searchResults} onSearch={runCloudSearch} openPost={() => { setSearchOpen(false); setTab("Home"); }} openCreator={(creator) => { setSearchOpen(false); openPublicCreator(creator); }} />'
);
replaceOnce(
  'search modal signature',
  'function SearchModal({ visible, close, value, setValue, loading, results, onSearch, openPost }) {',
  'function SearchModal({ visible, close, value, setValue, loading, results, onSearch, openPost, openCreator }) {'
);
replaceOnce(
  'search profile row opening',
  '{profiles.map((p, i) => <View key={String(p.id || p.username || i)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}>',
  '{profiles.map((p, i) => <Pressable key={String(p.id || p.username || i)} onPress={() => openCreator(p)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}>'
);
replaceOnce(
  'search profile row closing',
  '          <View style={{ flex: 1 }}><Text style={{ fontWeight: "900", fontSize: 15 }}>{p.name || "Creator"}</Text><Text style={{ color: "#747789", marginTop: 2 }}>{p.username ? `@${p.username}` : (p.handle || "")}</Text></View>\n        </View>)}',
  '          <View style={{ flex: 1 }}><Text style={{ fontWeight: "900", fontSize: 15 }}>{p.name || "Creator"}</Text><Text style={{ color: "#747789", marginTop: 2 }}>{p.username ? `@${p.username}` : (p.handle || "")}</Text></View><Text style={{ color: "#747789", fontSize: 22 }}>›</Text>\n        </Pressable>)}'
);

// Home creator avatar/name opens profile.
replaceOnce(
  'home signature public profile',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow, refreshing, onRefresh }) {',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow, refreshing, onRefresh, openCreator }) {'
);
replaceOnce(
  'home creator identity',
  '<View style={styles.youtubeInfo}><View style={styles.avatar}><Text style={styles.avatarText}>{(post.name || "E")[0]}</Text></View><View style={{ flex: 1 }}><Text style={styles.youtubeTitle}>{post.title}</Text><Text style={styles.youtubeMeta}>{post.mediaType === "short" ? "SHORT / REEL • " : post.mediaType === "long" ? "LONG VIDEO • " : ""}{post.name} • {fmt(post.views || 0)} views • Just now</Text></View>',
  '<View style={styles.youtubeInfo}><Pressable style={styles.avatar} onPress={() => openCreator(post)}><Text style={styles.avatarText}>{(post.name || "E")[0]}</Text></Pressable><View style={{ flex: 1 }}><Text style={styles.youtubeTitle}>{post.title}</Text><Pressable onPress={() => openCreator(post)}><Text style={styles.youtubeMeta}>{post.mediaType === "short" ? "SHORT / REEL • " : post.mediaType === "long" ? "LONG VIDEO • " : ""}{post.name} • {fmt(post.views || 0)} views • Just now</Text></Pressable></View>'
);

// Shorts creator handle opens profile.
replaceOnce(
  'shorts signature public profile',
  'function Shorts({ posts, setPosts, openComments, onReport, onLike, refreshing, onRefresh }) {',
  'function Shorts({ posts, setPosts, openComments, onReport, onLike, refreshing, onRefresh, openCreator }) {'
);
replaceOnce(
  'short page prop public profile',
  'setPosts={setPosts} openComments={openComments} onReport={onReport} onLike={onLike}',
  'setPosts={setPosts} openComments={openComments} onReport={onReport} onLike={onLike} openCreator={openCreator}'
);
replaceOnce(
  'short page signature public profile',
  'function ShortPage({ post, height, active, setPosts, openComments, onReport, onLike }) {',
  'function ShortPage({ post, height, active, setPosts, openComments, onReport, onLike, openCreator }) {'
);
replaceOnce(
  'short creator click',
  '<View style={styles.shortBottom}><Text style={styles.shortCreator}>{post.handle}</Text><Text style={styles.shortCaption}>{post.title}</Text>',
  '<View style={styles.shortBottom}><Pressable onPress={() => openCreator(post)}><Text style={styles.shortCreator}>{post.handle}</Text></Pressable><Text style={styles.shortCaption}>{post.title}</Text>'
);

// Mount public creator modal next to existing modal stack.
replaceOnce(
  'public creator modal mount',
  '<SearchModal visible={searchOpen} close={() => setSearchOpen(false)} value={searchText} setValue={setSearchText} loading={searchLoading} results={searchResults} onSearch={runCloudSearch} openPost={() => { setSearchOpen(false); setTab("Home"); }} openCreator={(creator) => { setSearchOpen(false); openPublicCreator(creator); }} /></SafeAreaView>;',
  '<SearchModal visible={searchOpen} close={() => setSearchOpen(false)} value={searchText} setValue={setSearchText} loading={searchLoading} results={searchResults} onSearch={runCloudSearch} openPost={() => { setSearchOpen(false); setTab("Home"); }} openCreator={(creator) => { setSearchOpen(false); openPublicCreator(creator); }} /><PublicCreatorModal creator={publicCreator} posts={posts} close={() => setPublicCreator(null)} onFollow={handleCreatorFollow} onReport={(creator) => { setPublicCreator(null); setReportTarget({ type: "Creator", id: creator.handle || creator.name, title: creator.name || creator.handle }); }} /></SafeAreaView>;'
);

// Public creator profile modal.
const brandMarker = 'function Brand() {';
const modalCode = `function PublicCreatorModal({ creator, posts, close, onFollow, onReport }) {\n  if (!creator) return null;\n  const key = String(creator.handle || creator.name || '').trim();\n  const creatorPosts = posts.filter((p) => String(p.handle || p.name || '').trim() === key);\n  const following = typeof creator.following === 'boolean' ? creator.following : creatorPosts.some((p) => !!p.following);\n  const likes = creatorPosts.reduce((sum, p) => sum + Number(p.likes || 0), 0);\n  const views = creatorPosts.reduce((sum, p) => sum + Number(p.views || 0), 0);\n  return <Modal visible={!!creator} animationType="slide" onRequestClose={close}>\n    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>\n      <View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E7E8EF' }}>\n        <Pressable onPress={close}><Text style={{ fontSize: 30, color: '#171722' }}>‹</Text></Pressable>\n        <Text style={{ fontWeight: '900', fontSize: 18 }}>Creator Profile</Text>\n        <Pressable onPress={() => Share.share({ message: \`Earnzo creator: \${creator.name || 'Creator'} \${creator.handle || ''}\` })}><Text style={{ fontSize: 20 }}>↗</Text></Pressable>\n      </View>\n      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 50 }}>\n        <View style={{ alignItems: 'center' }}>\n          <View style={{ width: 92, height: 92, borderRadius: 46, overflow: 'hidden', backgroundColor: '#F0EDFF', alignItems: 'center', justifyContent: 'center' }}>\n            {creator.profilePhoto ? <Image source={{ uri: creator.profilePhoto }} style={styles.fill} /> : <Text style={{ color: '#6C4CF1', fontSize: 32, fontWeight: '900' }}>{String(creator.name || 'E')[0].toUpperCase()}</Text>}\n          </View>\n          <Text style={{ fontSize: 23, fontWeight: '900', color: '#171722', marginTop: 10 }}>{creator.name || 'Creator'}</Text>\n          <Text style={{ color: '#747789', marginTop: 3 }}>{creator.handle || (creator.username ? \`@\${creator.username}\` : '')}</Text>\n          <Text style={{ color: '#747789', textAlign: 'center', marginTop: 8 }}>Creator on Earnzo • Create • Connect • Earn</Text>\n        </View>\n        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 18, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E7E8EF' }}>\n          <View style={{ alignItems: 'center' }}><Text style={{ fontWeight: '900', fontSize: 18 }}>{creatorPosts.length}</Text><Text style={{ color: '#747789', fontSize: 11 }}>Posts</Text></View>\n          <View style={{ alignItems: 'center' }}><Text style={{ fontWeight: '900', fontSize: 18 }}>{fmt(likes)}</Text><Text style={{ color: '#747789', fontSize: 11 }}>Likes</Text></View>\n          <View style={{ alignItems: 'center' }}><Text style={{ fontWeight: '900', fontSize: 18 }}>{fmt(views)}</Text><Text style={{ color: '#747789', fontSize: 11 }}>Views</Text></View>\n        </View>\n        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>\n          <Pressable style={[styles.primary, { flex: 1, marginTop: 0 }, following && { backgroundColor: '#EDEEF3' }]} onPress={() => onFollow(creator)}><Text style={[styles.primaryText, following && { color: '#171722' }]}>{following ? 'Following' : 'Follow'}</Text></Pressable>\n          <Pressable style={[styles.secondary, { flex: 1, marginTop: 0 }]} onPress={() => Share.share({ message: \`Earnzo creator: \${creator.name || 'Creator'} \${creator.handle || ''}\` })}><Text style={styles.secondaryText}>Share Profile</Text></Pressable>\n        </View>\n        <Pressable onPress={() => onReport(creator)} style={{ alignSelf: 'center', padding: 12, marginTop: 3 }}><Text style={{ color: '#E53E52', fontWeight: '800' }}>Report creator</Text></Pressable>\n        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Creator Content</Text>\n        {creatorPosts.length ? creatorPosts.map((p) => <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F3' }}>\n          <View style={{ width: 92, height: 62, borderRadius: 10, overflow: 'hidden', backgroundColor: '#111', marginRight: 10 }}>\n            {(p.coverUri || (p.mediaType === 'photo' && p.mediaUri)) ? <Image source={{ uri: p.coverUri || p.mediaUri }} style={styles.fill} resizeMode="cover" /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontWeight: '900' }}>EZ</Text></View>}\n          </View>\n          <View style={{ flex: 1 }}><Text numberOfLines={2} style={{ fontWeight: '900', color: '#171722' }}>{p.title || 'Earnzo post'}</Text><Text style={{ color: '#747789', fontSize: 11, marginTop: 4 }}>{p.mediaType === 'short' ? 'Short / Reel' : p.mediaType === 'long' ? 'Long Video' : 'Photo'} • {fmt(p.views || 0)} views</Text></View>\n        </View>) : <View style={{ paddingVertical: 26, alignItems: 'center' }}><Text style={{ fontWeight: '900' }}>No public posts yet</Text></View>}\n      </ScrollView>\n    </SafeAreaView>\n  </Modal>;\n}\n\n`;
if (!code.includes(brandMarker)) throw new Error('Creator profile patch failed: Brand marker not found');
code = code.replace(brandMarker, modalCode + brandMarker);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo public creator profiles applied: Home, Shorts and Search creators are clickable with follow/share/report and creator content.');
