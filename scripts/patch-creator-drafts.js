const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo creator drafts active')) {
  console.log('Earnzo creator drafts patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Creator drafts patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'app draft state',
  '  const [walletState, setWalletState] = useState(null); const [payoutAmount, setPayoutAmount] = useState(""); const [payoutRequesting, setPayoutRequesting] = useState(false); // Earnzo wallet payout flow active',
  '  const [walletState, setWalletState] = useState(null); const [payoutAmount, setPayoutAmount] = useState(""); const [payoutRequesting, setPayoutRequesting] = useState(false); // Earnzo wallet payout flow active\n  const [drafts, setDrafts] = useState([]); // Earnzo creator drafts active'
);

replaceOnce(
  'draft persistence hooks',
  '  useEffect(() => { AsyncStorage.getItem("earnzoLanguageV1").then((v) => { if (v && languages.some((x) => x.key === v)) setLanguageKey(v); }).catch(() => {}); }, []);',
  '  useEffect(() => { AsyncStorage.getItem("earnzoDraftsV1").then((raw) => { if (!raw) return; const parsed = JSON.parse(raw); if (Array.isArray(parsed)) setDrafts(parsed); }).catch(() => {}); }, []);\n  useEffect(() => { if (loaded) AsyncStorage.setItem("earnzoDraftsV1", JSON.stringify(drafts.slice(0, 50))).catch(() => {}); }, [loaded, drafts]);\n  useEffect(() => { AsyncStorage.getItem("earnzoLanguageV1").then((v) => { if (v && languages.some((x) => x.key === v)) setLanguageKey(v); }).catch(() => {}); }, []);'
);

replaceOnce(
  'create draft props',
  '<Create name={name} username={username} setPosts={setPosts} setCreatedPosts={setCreatedPosts} goHome={() => setTab("Home")} goShorts={() => setTab("Shorts")} />',
  '<Create name={name} username={username} setPosts={setPosts} setCreatedPosts={setCreatedPosts} goHome={() => setTab("Home")} goShorts={() => setTab("Shorts")} drafts={drafts} setDrafts={setDrafts} />'
);

replaceOnce(
  'create signature',
  'function Create({ name, username, setPosts, setCreatedPosts, goHome, goShorts }) {',
  'function Create({ name, username, setPosts, setCreatedPosts, goHome, goShorts, drafts, setDrafts }) {'
);

replaceOnce(
  'draft editor state',
  'const [audioMode, setAudioMode] = useState("Original 100%"); const [cropMode, setCropMode] = useState("Original"); const [cropOpen, setCropOpen] = useState(false);',
  'const [audioMode, setAudioMode] = useState("Original 100%"); const [cropMode, setCropMode] = useState("Original"); const [cropOpen, setCropOpen] = useState(false); const [draftsOpen, setDraftsOpen] = useState(false); const [activeDraftId, setActiveDraftId] = useState(null);'
);

code = code.replace(
  '    setType(finalType);\n    setOverlayText("");',
  '    setActiveDraftId(null);\n    setType(finalType);\n    setOverlayText("");'
);

replaceOnce(
  'draft helpers',
  '  const publish = async () => {',
  `  const clearDraftEditor = () => {
    setMedia(null); setCover(null); setCaption(""); setTags(""); setLocation(""); setPlaylist("");
    setOverlayText(""); setSticker(""); setTrimStartMs(0); setTrimEndMs(0); setTrimOpen(false);
    setVisualFilter("None"); setVisualEffect("None"); setFilterOpen(false); setEffectOpen(false);
    setAudioMode("Original 100%"); setCropMode("Original"); setCropOpen(false); setActiveDraftId(null);
  };
  const saveDraft = () => {
    if (!media?.uri) return Alert.alert("Draft", "Pehle photo ya video select kare.");
    const id = activeDraftId || \`draft-\${Date.now()}\`;
    const draft = {
      id, savedAt: Date.now(), type, media, cover, caption, tags, location, category, playlist, visibility,
      commentsOn, shareStory, paidPromotion, overlayText, sticker, trimStartMs, trimEndMs,
      visualFilter, visualEffect, audioMode, cropMode,
    };
    setDrafts((old) => [draft, ...old.filter((d) => d.id !== id)].slice(0, 50));
    clearDraftEditor();
    setStep("choose");
    Alert.alert("Draft saved ✅", "Draft is device par save ho gaya. Create > Drafts se dobara open kar sakte hain.");
  };
  const loadDraft = (draft) => {
    if (!draft?.media?.uri) return Alert.alert("Draft unavailable", "Is draft ka media file available nahi hai.");
    setActiveDraftId(draft.id);
    setType(draft.type || "photo"); setMedia(draft.media); setCover(draft.cover || null);
    setCaption(draft.caption || ""); setTags(draft.tags || ""); setLocation(draft.location || "");
    setCategory(draft.category || "Comedy"); setPlaylist(draft.playlist || ""); setVisibility(draft.visibility || "Public");
    setCommentsOn(draft.commentsOn !== false); setShareStory(draft.shareStory !== false); setPaidPromotion(!!draft.paidPromotion);
    setOverlayText(draft.overlayText || ""); setSticker(draft.sticker || "");
    setTrimStartMs(Number(draft.trimStartMs || 0)); setTrimEndMs(Number(draft.trimEndMs || draft.media?.durationMs || 0));
    setVisualFilter(draft.visualFilter || "None"); setVisualEffect(draft.visualEffect || "None");
    setAudioMode(draft.audioMode || "Original 100%"); setCropMode(draft.cropMode || "Original");
    setDraftsOpen(false); setStep((draft.type || "photo") === "photo" ? "details" : "edit");
  };
  const deleteDraft = (id) => setDrafts((old) => old.filter((d) => d.id !== id));
  const publish = async () => {`
);

code = code.replace(
  'setPosts((old) => [publishedPost, ...old]); setCreatedPosts((old) => [publishedPost, ...old]); setUploading(false);',
  'setPosts((old) => [publishedPost, ...old]); setCreatedPosts((old) => [publishedPost, ...old]); if (activeDraftId) setDrafts((old) => old.filter((d) => d.id !== activeDraftId)); setUploading(false);'
);

replaceOnce(
  'save draft button',
  '{uploading && <View style={styles.uploadBox}>',
  '<Pressable style={styles.secondary} disabled={uploading} onPress={saveDraft}><Text style={styles.secondaryText}>{activeDraftId ? "Update Draft" : "Save as Draft"}</Text></Pressable>{uploading && <View style={styles.uploadBox}>'
);

replaceOnce(
  'drafts choose button',
  '</View><View style={styles.tipCard}><Text style={styles.bold}>Creator editing tools</Text>',
  '</View><Pressable style={styles.secondary} onPress={() => setDraftsOpen(true)}><Text style={styles.secondaryText}>📝 Drafts ({drafts.length})</Text></Pressable><View style={styles.tipCard}><Text style={styles.bold}>Creator editing tools</Text>'
);

const createStart = code.indexOf('function Create({');
const createEnd = code.indexOf('\nfunction EditorPreview', createStart);
if (createStart < 0 || createEnd < 0) throw new Error('Creator drafts patch failed: Create block not found');
let createBlock = code.slice(createStart, createEnd);
const lastScrollClose = createBlock.lastIndexOf('</ScrollView>;');
if (lastScrollClose < 0) throw new Error('Creator drafts patch failed: Create choose screen close not found');
createBlock = createBlock.slice(0, lastScrollClose) + '<DraftsModal visible={draftsOpen} close={() => setDraftsOpen(false)} drafts={drafts} onOpen={loadDraft} onDelete={deleteDraft} />' + createBlock.slice(lastScrollClose);
code = code.slice(0, createStart) + createBlock + code.slice(createEnd);

const anchor = 'function CreateCard({ icon, title, sub, onPress }) {';
if (!code.includes(anchor)) throw new Error('Creator drafts patch failed: CreateCard anchor not found');
const component = `function DraftsModal({ visible, close, drafts, onOpen, onDelete }) {
  const ago = (value) => {
    const ms = Math.max(0, Date.now() - Number(value || Date.now()));
    const min = Math.floor(ms / 60000);
    if (min < 1) return "Just now";
    if (min < 60) return \`${'${min}'}m ago\`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return \`${'${hr}'}h ago\`;
    return \`${'${Math.floor(hr / 24)}'}d ago\`;
  };
  return <Modal visible={visible} animationType="slide" onRequestClose={close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E7E8EF" }}>
        <Pressable onPress={close}><Text style={{ fontSize: 30, color: "#171722" }}>‹</Text></Pressable>
        <Text style={{ fontWeight: "900", fontSize: 18 }}>Drafts</Text><Text style={{ color: C.muted, fontWeight: "800" }}>{drafts.length}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 50 }}>
        {!drafts.length ? <View style={styles.emptyCard}><Text style={styles.bold}>No drafts yet</Text><Text style={styles.muted}>Create content karke Publish Settings me “Save as Draft” use kare.</Text></View> : null}
        {drafts.map((d) => {
          const thumb = d.cover?.uri || d.media?.thumbnailUri || (d.type === "photo" ? d.media?.uri : "");
          return <View key={d.id} style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#EFEFF3", paddingVertical: 11 }}>
            <Pressable onPress={() => onOpen(d)} style={{ width: 78, height: 62, borderRadius: 10, overflow: "hidden", backgroundColor: "#111", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              {thumb ? <Image source={{ uri: thumb }} style={styles.fill} resizeMode="cover" /> : <Text style={{ color: "#FFF", fontWeight: "900" }}>EZ</Text>}
            </Pressable>
            <Pressable onPress={() => onOpen(d)} style={{ flex: 1 }}>
              <Text numberOfLines={2} style={{ color: C.text, fontWeight: "900" }}>{d.caption?.trim() || (d.type === "short" ? "Untitled Short" : d.type === "long" ? "Untitled Video" : "Untitled Photo")}</Text>
              <Text style={{ color: C.muted, marginTop: 4, fontSize: 11 }}>{d.type === "short" ? "Short" : d.type === "long" ? "Long Video" : "Photo"} • {ago(d.savedAt)}</Text>
              <Text style={{ color: C.purple, marginTop: 5, fontSize: 11, fontWeight: "800" }}>Tap to continue editing</Text>
            </Pressable>
            <Pressable onPress={() => Alert.alert("Delete draft?", "Ye draft device se remove ho jayega.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => onDelete(d.id) }])} style={{ padding: 8 }}><Text style={{ fontSize: 18 }}>🗑</Text></Pressable>
          </View>;
        })}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

`;
code = code.replace(anchor, component + anchor);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo creator drafts applied: device-local draft save, reopen, update and delete with editor settings preserved.');