const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo own content management active')) {
  console.log('Earnzo own content management patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Own content patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'backend edit delete imports',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote } from "./backend/client";',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost } from "./backend/client";'
);

replaceOnce(
  'own content state',
  '  const [savedOpen, setSavedOpen] = useState(false); // Earnzo saved content active',
  '  const [savedOpen, setSavedOpen] = useState(false); // Earnzo saved content active\n  const [editOwnPost, setEditOwnPost] = useState(null); // Earnzo own content management active'
);

replaceOnce(
  'own content handlers',
  '  let page;',
  `  const saveOwnPostChanges = async (post, changes) => {
    const cleaned = {
      title: String(changes?.title || '').trim(),
      tags: String(changes?.tags || ''),
      location: String(changes?.location || ''),
      category: String(changes?.category || post?.category || 'Comedy'),
      visibility: String(changes?.visibility || post?.visibility || 'Public'),
    };
    if (!cleaned.title) throw new Error('Caption / title required hai');
    let updated = { ...post, ...cleaned, updatedAt: Date.now() };
    if (backendEnabled && String(post?.id || '').startsWith('post_')) {
      const remote = await updateRemotePost(post.id, cleaned);
      if (remote) updated = { ...updated, ...remote };
    }
    setPosts((old) => old.map((p) => p.id === post.id ? { ...p, ...updated } : p));
    setCreatedPosts((old) => old.map((p) => p.id === post.id ? { ...p, ...updated } : p));
    return updated;
  };
  const deleteOwnPost = async (post) => {
    if (!post) return;
    if (backendEnabled && String(post.id || '').startsWith('post_')) await deleteRemotePost(post.id);
    setPosts((old) => old.filter((p) => p.id !== post.id));
    setCreatedPosts((old) => old.filter((p) => p.id !== post.id));
    setEditOwnPost((old) => old?.id === post.id ? null : old);
  };
  let page;`
);

replaceOnce(
  'profile management props',
  '<Profile name={name} username={username} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} createdPosts={createdPosts} wallet={walletBalance} followers={followersCount} views={totalViews} eligible={eligible} openFollowers={() => setPeopleModal("Followers")} openFollowing={() => setPeopleModal("Following")} openSupport={() => setSupportOpen(true)} openSettings={() => setSettingsOpen(true)} openSaved={() => setSavedOpen(true)} />',
  '<Profile name={name} username={username} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} createdPosts={createdPosts} wallet={walletBalance} followers={followersCount} views={totalViews} eligible={eligible} openFollowers={() => setPeopleModal("Followers")} openFollowing={() => setPeopleModal("Following")} openSupport={() => setSupportOpen(true)} openSettings={() => setSettingsOpen(true)} openSaved={() => setSavedOpen(true)} onEditPost={(post) => setEditOwnPost(post)} onDeletePost={deleteOwnPost} />'
);

replaceOnce(
  'own edit modal mount',
  '<SavedContentModal visible={savedOpen} posts={posts} setPosts={setPosts} close={() => setSavedOpen(false)} openHome={() => { setSavedOpen(false); setTab("Home"); }} /></SafeAreaView>;',
  '<SavedContentModal visible={savedOpen} posts={posts} setPosts={setPosts} close={() => setSavedOpen(false)} openHome={() => { setSavedOpen(false); setTab("Home"); }} /><OwnPostEditModal post={editOwnPost} close={() => setEditOwnPost(null)} onSave={saveOwnPostChanges} /></SafeAreaView>;'
);

replaceOnce(
  'profile signature management',
  'function Profile({ name, username, profilePhoto, setProfilePhoto, createdPosts, wallet, followers, views, eligible, openFollowers, openFollowing, openSupport, openSettings, openSaved }) {',
  'function Profile({ name, username, profilePhoto, setProfilePhoto, createdPosts, wallet, followers, views, eligible, openFollowers, openFollowing, openSupport, openSettings, openSaved, onEditPost, onDeletePost }) {'
);

replaceOnce(
  'profile own content rows',
  '{createdPosts.length ? createdPosts.map((p) => <View key={p.id} style={styles.myPost}><View style={styles.myPostVideo}><Text>▶</Text></View><View style={{ flex: 1 }}><Text style={styles.bold}>{p.title}</Text><Text style={styles.muted}>{p.mediaType === "short" ? "Short" : p.mediaType === "long" ? "Long Video" : "Photo"}</Text></View></View>) : <View style={styles.emptyCard}><Text style={styles.bold}>No content yet</Text><Text style={styles.muted}>Create tab se upload kare.</Text></View>}',
  '{createdPosts.length ? createdPosts.map((p) => <View key={p.id} style={styles.myPost}><View style={styles.myPostVideo}>{(p.coverUri || p.thumbnailUri || (p.mediaType === "photo" && p.mediaUri)) ? <Image source={{ uri: p.coverUri || p.thumbnailUri || p.mediaUri }} style={styles.fill} resizeMode="cover" /> : <Text>▶</Text>}</View><View style={{ flex: 1 }}><Text style={styles.bold}>{p.title}</Text><Text style={styles.muted}>{p.mediaType === "short" ? "Short" : p.mediaType === "long" ? "Long Video" : "Photo"} • {String(p.id || "").startsWith("post_") ? "Cloud" : "Local"}</Text><View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}><Pressable onPress={() => onEditPost(p)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: C.purpleSoft }}><Text style={{ color: C.purple, fontWeight: "900", fontSize: 11 }}>Edit Details</Text></Pressable><Pressable onPress={() => Alert.alert("Delete post?", "Ye post permanently remove ho jayegi.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => onDeletePost(p).catch((e) => Alert.alert("Delete failed", String(e?.message || e || "Please try again"))) }])} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: "#FFF0F1" }}><Text style={{ color: C.red, fontWeight: "900", fontSize: 11 }}>Delete</Text></Pressable></View></View></View>) : <View style={styles.emptyCard}><Text style={styles.bold}>No content yet</Text><Text style={styles.muted}>Create tab se upload kare.</Text></View>}'
);

const modalAnchor = 'function SavedContentModal({ visible, posts, setPosts, close, openHome }) {';
if (!code.includes(modalAnchor)) throw new Error('Own content patch failed: saved modal anchor not found');
const editModal = `function OwnPostEditModal({ post, close, onSave }) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Comedy');
  const [visibility, setVisibility] = useState('Public');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!post) return;
    setTitle(post.title || ''); setTags(post.tags || ''); setLocation(post.location || '');
    setCategory(post.category || 'Comedy'); setVisibility(post.visibility || 'Public');
  }, [post]);
  if (!post) return null;
  const save = async () => {
    if (!title.trim()) return Alert.alert('Caption / title required hai');
    setSaving(true);
    try {
      await onSave(post, { title, tags, location, category, visibility });
      close();
      Alert.alert('Updated ✅', 'Post details update ho gaye.');
    } catch (e) {
      Alert.alert('Update failed', String(e?.message || e || 'Please try again'));
    } finally { setSaving(false); }
  };
  return <Modal visible={!!post} animationType="slide" onRequestClose={close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E7E8EF' }}>
        <Pressable onPress={close}><Text style={{ fontSize: 30, color: '#171722' }}>‹</Text></Pressable>
        <Text style={{ fontWeight: '900', fontSize: 18 }}>Edit Post Details</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          {(post.coverUri || post.thumbnailUri || (post.mediaType === 'photo' && post.mediaUri)) ? <Image source={{ uri: post.coverUri || post.thumbnailUri || post.mediaUri }} style={styles.fill} resizeMode="contain" /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontWeight: '900', fontSize: 24 }}>EZ</Text></View>}
        </View>
        <Text style={styles.fieldLabel}>Caption / Title</Text>
        <TextInput style={[styles.input, { minHeight: 92, textAlignVertical: 'top' }]} multiline value={title} onChangeText={setTitle} maxLength={300} />
        <Text style={styles.fieldLabel}>Tags / Hashtags</Text>
        <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="#earnzo #creator" />
        <Text style={styles.fieldLabel}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Optional" />
        <Text style={styles.fieldLabel}>Topic</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{['Music','Comedy','Tech','Travel','Fitness'].map((x) => <Chip key={x} text={x} active={category === x} onPress={() => setCategory(x)} />)}</ScrollView>
        <ActionRow icon="👁" title="Visibility" sub={visibility} onPress={() => setVisibility(visibility === 'Public' ? 'Followers' : visibility === 'Followers' ? 'Private' : 'Public')} />
        <Text style={[styles.note, { textAlign: 'left' }]}>Video/photo media replace nahi hoga; yahan caption, tags, location, topic aur visibility edit hoti hai.</Text>
        <Pressable style={[styles.primary, saving && { opacity: 0.5 }]} disabled={saving} onPress={save}><Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save Changes'}</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

`;
code = code.replace(modalAnchor, editModal + modalAnchor);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo own content management applied: creator can edit post details and delete local/cloud posts.');
