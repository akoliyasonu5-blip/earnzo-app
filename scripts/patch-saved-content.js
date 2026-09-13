const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo saved content active')) {
  console.log('Earnzo saved content patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Saved content patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'saved state',
  '  const [publicCreator, setPublicCreator] = useState(null);',
  '  const [publicCreator, setPublicCreator] = useState(null);\n  const [savedOpen, setSavedOpen] = useState(false); // Earnzo saved content active'
);

replaceOnce(
  'profile saved prop',
  '<Profile name={name} username={username} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} createdPosts={createdPosts} wallet={walletBalance} followers={followersCount} views={totalViews} eligible={eligible} openFollowers={() => setPeopleModal("Followers")} openFollowing={() => setPeopleModal("Following")} openSupport={() => setSupportOpen(true)} openSettings={() => setSettingsOpen(true)} />',
  '<Profile name={name} username={username} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} createdPosts={createdPosts} wallet={walletBalance} followers={followersCount} views={totalViews} eligible={eligible} openFollowers={() => setPeopleModal("Followers")} openFollowing={() => setPeopleModal("Following")} openSupport={() => setSupportOpen(true)} openSettings={() => setSettingsOpen(true)} openSaved={() => setSavedOpen(true)} />'
);

replaceOnce(
  'saved modal mount',
  '<PublicCreatorModal creator={publicCreator} posts={posts} close={() => setPublicCreator(null)} onFollow={handleCreatorFollow} onReport={(creator) => { setPublicCreator(null); setReportTarget({ type: "Creator", id: creator.handle || creator.name, title: creator.name || creator.handle }); }} /></SafeAreaView>;',
  '<PublicCreatorModal creator={publicCreator} posts={posts} close={() => setPublicCreator(null)} onFollow={handleCreatorFollow} onReport={(creator) => { setPublicCreator(null); setReportTarget({ type: "Creator", id: creator.handle || creator.name, title: creator.name || creator.handle }); }} /><SavedContentModal visible={savedOpen} posts={posts} setPosts={setPosts} close={() => setSavedOpen(false)} openHome={() => { setSavedOpen(false); setTab("Home"); }} /></SafeAreaView>;'
);

replaceOnce(
  'profile signature saved',
  'function Profile({ name, username, profilePhoto, setProfilePhoto, createdPosts, wallet, followers, views, eligible, openFollowers, openFollowing, openSupport, openSettings }) {',
  'function Profile({ name, username, profilePhoto, setProfilePhoto, createdPosts, wallet, followers, views, eligible, openFollowers, openFollowing, openSupport, openSettings, openSaved }) {'
);

replaceOnce(
  'profile saved button',
  '<View style={styles.profileButtons}><Pressable style={styles.profileButton} onPress={openSettings}><Text style={styles.profileButtonText}>Settings & Privacy</Text></Pressable><Pressable style={styles.profileButton} onPress={openSupport}><Text style={styles.profileButtonText}>Help & Support</Text></Pressable></View>',
  '<View style={styles.profileButtons}><Pressable style={styles.profileButton} onPress={openSaved}><Text style={styles.profileButtonText}>🔖 Saved</Text></Pressable><Pressable style={styles.profileButton} onPress={openSettings}><Text style={styles.profileButtonText}>Settings & Privacy</Text></Pressable><Pressable style={styles.profileButton} onPress={openSupport}><Text style={styles.profileButtonText}>Help & Support</Text></Pressable></View>'
);

const marker = 'function SupportCenter({ visible, close, tickets, setTickets }) {';
if (!code.includes(marker)) throw new Error('Saved content patch failed: support marker not found');
const modal = `function SavedContentModal({ visible, posts, setPosts, close, openHome }) {\n  const saved = posts.filter((p) => !!p.saved);\n  const remove = (id) => setPosts((old) => old.map((p) => p.id === id ? { ...p, saved: false } : p));\n  return <Modal visible={visible} animationType="slide" onRequestClose={close}>\n    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>\n      <View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E7E8EF' }}>\n        <Pressable onPress={close}><Text style={{ fontSize: 30, color: '#171722' }}>‹</Text></Pressable>\n        <Text style={{ fontWeight: '900', fontSize: 18 }}>Saved</Text>\n        <Text style={{ color: '#747789', fontWeight: '800' }}>{saved.length}</Text>\n      </View>\n      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 50 }}>\n        {!saved.length ? <View style={styles.emptyCard}><Text style={styles.bold}>No saved content</Text><Text style={styles.muted}>Home ya Shorts me Save dabane ke baad content yahan milega.</Text><Pressable style={styles.primary} onPress={openHome}><Text style={styles.primaryText}>Go to Home</Text></Pressable></View> : null}\n        {saved.map((p) => <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F3' }}>\n          <Pressable onPress={openHome} style={{ width: 104, height: 72, borderRadius: 10, overflow: 'hidden', backgroundColor: '#111', marginRight: 10 }}>\n            {(p.coverUri || (p.mediaType === 'photo' && p.mediaUri) || p.thumbnailUri) ? <Image source={{ uri: p.coverUri || p.thumbnailUri || p.mediaUri }} style={styles.fill} resizeMode="cover" /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontWeight: '900' }}>EZ</Text></View>}\n          </Pressable>\n          <View style={{ flex: 1 }}>\n            <Text numberOfLines={2} style={{ fontWeight: '900', color: '#171722' }}>{p.title || 'Earnzo post'}</Text>\n            <Text style={{ color: '#747789', fontSize: 11, marginTop: 4 }}>{p.name || p.handle || 'Creator'} • {p.mediaType === 'short' ? 'Short' : p.mediaType === 'long' ? 'Video' : 'Photo'}</Text>\n            <Pressable onPress={() => remove(p.id)} style={{ alignSelf: 'flex-start', marginTop: 8, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 10, backgroundColor: '#F0EDFF' }}><Text style={{ color: '#6C4CF1', fontWeight: '900', fontSize: 11 }}>Remove from Saved</Text></Pressable>\n          </View>\n        </View>)}\n      </ScrollView>\n    </SafeAreaView>\n  </Modal>;\n}\n\n`;
code = code.replace(marker, modal + marker);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo saved content applied: Profile Saved screen now shows and removes saved posts/shorts/photos.');
