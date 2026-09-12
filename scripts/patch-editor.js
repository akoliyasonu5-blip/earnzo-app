const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('const [overlayText, setOverlayText]')) {
  console.log('Earnzo editor overlay patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) {
    throw new Error(`Editor patch failed: ${label} target not found`);
  }
  code = code.replace(from, to);
}

// Editor state: real text + sticker overlays.
replaceOnce(
  'editor state',
  'const [musicOpen, setMusicOpen] = useState(false);',
  'const [musicOpen, setMusicOpen] = useState(false); const [overlayText, setOverlayText] = useState(""); const [sticker, setSticker] = useState(""); const [textOpen, setTextOpen] = useState(false); const [stickerOpen, setStickerOpen] = useState(false);'
);

// Reset edits whenever a new media item is selected.
replaceOnce(
  'pick reset',
  '    setType(finalType);\n    setMedia({ ...a, durationMs, thumbnailUri });',
  '    setType(finalType);\n    setOverlayText("");\n    setSticker("");\n    setCover(null);\n    setMedia({ ...a, durationMs, thumbnailUri });'
);

// Persist overlays in uploaded post data.
replaceOnce(
  'publish overlay fields',
  'thumbnailUri: media.thumbnailUri || "", tags,',
  'thumbnailUri: media.thumbnailUri || "", overlayText, sticker, tags,'
);
replaceOnce(
  'publish reset',
  'setMedia(null); setCover(null); setCaption("");',
  'setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setCaption("");'
);

// Back navigation should discard the current edit session cleanly.
code = code.replace(
  'if (step === "edit") { setMedia(null); setCover(null); setStep("choose"); return true; }',
  'if (step === "edit") { setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setTextOpen(false); setStickerOpen(false); setStep("choose"); return true; }'
);
code = code.replace(
  'onPress={() => setStep("choose")}><Text style={styles.editorBack}>‹</Text>',
  'onPress={() => { setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setStep("choose"); }}><Text style={styles.editorBack}>‹</Text>'
);

// Show edits live on top of the selected video, plus the chosen cover preview.
replaceOnce(
  'editor preview wrapper',
  '<EditorPreview uri={media.uri} />',
  '<View style={styles.editorPreviewWrap}><EditorPreview uri={media.uri} /><VideoOverlay text={overlayText} sticker={sticker} />{cover?.uri ? <View style={styles.editorCoverBadge}><Image source={{ uri: cover.uri }} style={styles.editorCoverImage} /><Text style={styles.editorCoverText}>Cover</Text></View> : null}</View>'
);

replaceOnce(
  'text tool',
  '<EditorTool icon="Aa" label="Text" onPress={() => Alert.alert("Text", "Video text overlay editor yahan connect hoga.")} />',
  '<EditorTool icon="Aa" label="Text" onPress={() => setTextOpen(true)} />'
);
replaceOnce(
  'sticker tool',
  '<EditorTool icon="☺" label="Stickers" onPress={() => Alert.alert("Stickers", "Emoji / sticker picker yahan connect hoga.")} />',
  '<EditorTool icon="☺" label="Stickers" onPress={() => setStickerOpen(true)} />'
);
replaceOnce(
  'editor modals',
  '<MusicModal visible={musicOpen} close={() => setMusicOpen(false)} /></View>;',
  '<MusicModal visible={musicOpen} close={() => setMusicOpen(false)} /><TextOverlayModal visible={textOpen} close={() => setTextOpen(false)} value={overlayText} setValue={setOverlayText} /><StickerModal visible={stickerOpen} close={() => setStickerOpen(false)} value={sticker} setValue={setSticker} /></View>;'
);

// Reusable overlay rendered in editor, Home videos and Shorts.
replaceOnce(
  'overlay component anchor',
  'function StaticVideoThumbnail({ uri, thumbnailUri }) {',
  `function VideoOverlay({ text, sticker }) {
  if (!text && !sticker) return null;
  return <View pointerEvents="none" style={styles.videoOverlayLayer}>
    {sticker ? <Text style={styles.videoOverlaySticker}>{sticker}</Text> : null}
    {text ? <View style={styles.videoOverlayTextBox}><Text style={styles.videoOverlayText}>{text}</Text></View> : null}
  </View>;
}
function StaticVideoThumbnail({ uri, thumbnailUri }) {`
);

// Home feed: show saved overlay on thumbnail and while video is playing.
code = code.replace(
  'if (activeVideo === post.id) return <HomeVideo uri={post.mediaUri} type={post.mediaType} />;',
  'if (activeVideo === post.id) return <HomeVideo uri={post.mediaUri} type={post.mediaType} overlayText={post.overlayText} sticker={post.sticker} />;'
);
code = code.replace(
  '{post.coverUri ? <Image source={{ uri: post.coverUri }} style={styles.fill} /> : <StaticVideoThumbnail uri={post.mediaUri} thumbnailUri={post.thumbnailUri} />}\n      <VideoTypeBadge type={post.mediaType} />',
  '{post.coverUri ? <Image source={{ uri: post.coverUri }} style={styles.fill} /> : <StaticVideoThumbnail uri={post.mediaUri} thumbnailUri={post.thumbnailUri} />}\n      <VideoOverlay text={post.overlayText} sticker={post.sticker} />\n      <VideoTypeBadge type={post.mediaType} />'
);
code = code.replace(
  'function HomeVideo({ uri, type }) {',
  'function HomeVideo({ uri, type, overlayText, sticker }) {'
);
code = code.replace(
  '<VideoView player={player} style={styles.fill} nativeControls contentFit="contain" allowsFullscreen surfaceType="textureView" />\n    <VideoTypeBadge type={type} />',
  '<VideoView player={player} style={styles.fill} nativeControls contentFit="contain" allowsFullscreen surfaceType="textureView" />\n    <VideoOverlay text={overlayText} sticker={sticker} />\n    <VideoTypeBadge type={type} />'
);

// Shorts player: keep text/sticker visible on the published short.
replaceOnce(
  'short overlay',
  '<View style={styles.shortBottom}><Text style={styles.shortCreator}>',
  '<VideoOverlay text={post.overlayText} sticker={post.sticker} /><View style={styles.shortBottom}><Text style={styles.shortCreator}>'
);

// Functional Text and Sticker bottom sheets.
replaceOnce(
  'modal components anchor',
  'function CreateCard({ icon, title, sub, onPress }) {',
  `function TextOverlayModal({ visible, close, value, setValue }) {
  const [draft, setDraft] = useState(value || "");
  useEffect(() => { if (visible) setDraft(value || ""); }, [visible, value]);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}><KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === "ios" ? "padding" : "height"}><View style={styles.sheet}><SheetHeader title="Add Text" close={close} /><Text style={styles.helpText}>Video par dikhne wala text likhiye.</Text><TextInput style={[styles.input, { marginTop: 12 }]} placeholder="Type text..." value={draft} onChangeText={setDraft} maxLength={80} autoFocus /><View style={styles.overlayModalActions}><Pressable style={[styles.secondary, styles.overlayModalButton]} onPress={() => { setValue(""); close(); }}><Text style={styles.secondaryText}>Remove</Text></Pressable><Pressable style={[styles.primary, styles.overlayModalButton]} onPress={() => { setValue(draft.trim()); close(); }}><Text style={styles.primaryText}>Apply Text</Text></Pressable></View></View></KeyboardAvoidingView></Modal>;
}
function StickerModal({ visible, close, value, setValue }) {
  const emojis = ["🔥", "❤️", "😂", "😍", "👏", "✨", "🎵", "😎", "💯", "🙏", "🎉", "⭐"];
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}><View style={styles.modalBg}><View style={styles.sheet}><SheetHeader title="Emoji / Sticker" close={close} /><Text style={styles.helpText}>Video par ek sticker choose kare.</Text><View style={styles.stickerGrid}>{emojis.map((x) => <Pressable key={x} style={[styles.stickerPick, value === x && styles.stickerPickOn]} onPress={() => { setValue(x); close(); }}><Text style={styles.stickerPickText}>{x}</Text></Pressable>)}</View>{value ? <Pressable style={styles.secondary} onPress={() => { setValue(""); close(); }}><Text style={styles.secondaryText}>Remove Sticker</Text></Pressable> : null}</View></View></Modal>;
}
function CreateCard({ icon, title, sub, onPress }) {`
);

// Editor and overlay styles.
replaceOnce(
  'editor styles',
  'editorVideo: { width: "100%", flex: 1, backgroundColor: "#000" },',
  'editorVideo: { width: "100%", flex: 1, backgroundColor: "#000" }, editorPreviewWrap: { flex: 1, backgroundColor: "#000", position: "relative", overflow: "hidden" }, editorCoverBadge: { position: "absolute", top: 12, right: 12, width: 62, backgroundColor: "rgba(0,0,0,0.72)", borderRadius: 10, padding: 4, zIndex: 12 }, editorCoverImage: { width: 54, height: 38, borderRadius: 7 }, editorCoverText: { color: "#FFF", fontSize: 9, fontWeight: "900", textAlign: "center", marginTop: 3 }, videoOverlayLayer: { position: "absolute", left: 18, right: 18, top: "38%", zIndex: 10, alignItems: "center" }, videoOverlaySticker: { fontSize: 48, marginBottom: 8, textShadowColor: "rgba(0,0,0,0.55)", textShadowRadius: 6 }, videoOverlayTextBox: { backgroundColor: "rgba(0,0,0,0.58)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, maxWidth: "92%" }, videoOverlayText: { color: "#FFF", fontSize: 20, lineHeight: 25, fontWeight: "900", textAlign: "center" }, overlayModalActions: { flexDirection: "row", marginTop: 4 }, overlayModalButton: { flex: 1, marginHorizontal: 4 }, stickerGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14 }, stickerPick: { width: "23%", aspectRatio: 1, borderRadius: 14, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", marginBottom: 9, borderWidth: 1, borderColor: C.line }, stickerPickOn: { borderColor: C.purple, borderWidth: 2, backgroundColor: C.purpleSoft }, stickerPickText: { fontSize: 30 },'
);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo editor upgrade applied: working text, sticker and cover overlays.');
