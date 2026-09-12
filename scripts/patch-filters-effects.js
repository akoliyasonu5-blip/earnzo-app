const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('const [visualFilter, setVisualFilter]')) {
  console.log('Earnzo filters/effects patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) {
    throw new Error(`Filters/effects patch failed: ${label} target not found`);
  }
  code = code.replace(from, to);
}

replaceOnce(
  'visual state',
  'const [musicOpen, setMusicOpen] = useState(false); const [overlayText, setOverlayText] = useState(""); const [sticker, setSticker] = useState(""); const [textOpen, setTextOpen] = useState(false); const [stickerOpen, setStickerOpen] = useState(false); const [trimOpen, setTrimOpen] = useState(false); const [trimStartMs, setTrimStartMs] = useState(0); const [trimEndMs, setTrimEndMs] = useState(0);',
  'const [musicOpen, setMusicOpen] = useState(false); const [overlayText, setOverlayText] = useState(""); const [sticker, setSticker] = useState(""); const [textOpen, setTextOpen] = useState(false); const [stickerOpen, setStickerOpen] = useState(false); const [trimOpen, setTrimOpen] = useState(false); const [trimStartMs, setTrimStartMs] = useState(0); const [trimEndMs, setTrimEndMs] = useState(0); const [visualFilter, setVisualFilter] = useState("None"); const [visualEffect, setVisualEffect] = useState("None"); const [filterOpen, setFilterOpen] = useState(false); const [effectOpen, setEffectOpen] = useState(false);'
);

replaceOnce(
  'new media visual reset',
  '    setCover(null);\n    setTrimStartMs(0);',
  '    setCover(null);\n    setVisualFilter("None");\n    setVisualEffect("None");\n    setFilterOpen(false);\n    setEffectOpen(false);\n    setTrimStartMs(0);'
);

replaceOnce(
  'publish visual fields',
  'thumbnailUri: media.thumbnailUri || "", overlayText, sticker, trimStartMs, trimEndMs: trimEndMs || Number(media.durationMs || media.duration || 0), tags,',
  'thumbnailUri: media.thumbnailUri || "", overlayText, sticker, visualFilter, visualEffect, trimStartMs, trimEndMs: trimEndMs || Number(media.durationMs || media.duration || 0), tags,'
);

replaceOnce(
  'publish visual reset',
  'setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setTrimStartMs(0); setTrimEndMs(0); setTrimOpen(false); setCaption("");',
  'setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setVisualFilter("None"); setVisualEffect("None"); setFilterOpen(false); setEffectOpen(false); setTrimStartMs(0); setTrimEndMs(0); setTrimOpen(false); setCaption("");'
);

code = code.replace(
  'if (step === "edit") { setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setTextOpen(false); setStickerOpen(false); setTrimOpen(false); setTrimStartMs(0); setTrimEndMs(0); setStep("choose"); return true; }',
  'if (step === "edit") { setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setTextOpen(false); setStickerOpen(false); setFilterOpen(false); setEffectOpen(false); setVisualFilter("None"); setVisualEffect("None"); setTrimOpen(false); setTrimStartMs(0); setTrimEndMs(0); setStep("choose"); return true; }'
);
code = code.replace(
  'onPress={() => { setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setTrimOpen(false); setTrimStartMs(0); setTrimEndMs(0); setStep("choose"); }}><Text style={styles.editorBack}>‹</Text>',
  'onPress={() => { setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setFilterOpen(false); setEffectOpen(false); setVisualFilter("None"); setVisualEffect("None"); setTrimOpen(false); setTrimStartMs(0); setTrimEndMs(0); setStep("choose"); }}><Text style={styles.editorBack}>‹</Text>'
);

replaceOnce(
  'editor treatment preview',
  '<View style={styles.editorPreviewWrap}><EditorPreview uri={media.uri} trimStartMs={trimStartMs} trimEndMs={trimEndMs} /><VideoOverlay text={overlayText} sticker={sticker} />',
  '<View style={styles.editorPreviewWrap}><EditorPreview uri={media.uri} trimStartMs={trimStartMs} trimEndMs={trimEndMs} /><VisualTreatment filter={visualFilter} effect={visualEffect} /><VideoOverlay text={overlayText} sticker={sticker} />'
);

replaceOnce(
  'effects tool',
  '<EditorTool icon="✦" label="Effects" onPress={() => Alert.alert("Effects", "Effects library UI ready.")} />',
  '<EditorTool icon="✦" label="Effects" onPress={() => setEffectOpen(true)} />'
);
replaceOnce(
  'filter tool',
  '<EditorTool icon="◐" label="Filter" onPress={() => Alert.alert("Filters", "Filter presets UI ready.")} />',
  '<EditorTool icon="◐" label="Filter" onPress={() => setFilterOpen(true)} />'
);

replaceOnce(
  'visual modal mount',
  'apply={(start, end) => { setTrimStartMs(start); setTrimEndMs(end); setTrimOpen(false); }} /></View>;',
  'apply={(start, end) => { setTrimStartMs(start); setTrimEndMs(end); setTrimOpen(false); }} /><VisualPresetModal visible={filterOpen} close={() => setFilterOpen(false)} mode="filter" value={visualFilter} apply={(x) => { setVisualFilter(x); setFilterOpen(false); }} /><VisualPresetModal visible={effectOpen} close={() => setEffectOpen(false)} mode="effect" value={visualEffect} apply={(x) => { setVisualEffect(x); setEffectOpen(false); }} /></View>;'
);

replaceOnce(
  'visual treatment component anchor',
  'function VideoOverlay({ text, sticker }) {',
  `function VisualTreatment({ filter = "None", effect = "None" }) {
  const tint = {
    Warm: "rgba(255,145,60,0.16)",
    Cool: "rgba(60,145,255,0.16)",
    Sunset: "rgba(255,78,92,0.18)",
    Vintage: "rgba(176,122,70,0.18)",
    Night: "rgba(16,28,74,0.24)",
    Rose: "rgba(255,84,160,0.14)",
  }[filter];
  return <View pointerEvents="none" style={styles.visualTreatmentLayer}>
    {tint ? <View style={[styles.visualTint, { backgroundColor: tint }]} /> : null}
    {effect === "Glow" ? <View style={styles.effectGlow} /> : null}
    {effect === "Sparkle" ? <View style={styles.effectSparkle}><Text style={styles.effectSparkleText}>✦     ✧\n   ✨      ✦\n✧       ✦</Text></View> : null}
    {effect === "Vignette" ? <><View style={[styles.vignetteEdge, styles.vignetteTop]} /><View style={[styles.vignetteEdge, styles.vignetteBottom]} /><View style={[styles.vignetteSide, styles.vignetteLeft]} /><View style={[styles.vignetteSide, styles.vignetteRight]} /></> : null}
    {effect === "Scanlines" ? <View style={styles.scanlineWrap}>{Array.from({ length: 12 }).map((_, i) => <View key={i} style={styles.scanline} />)}</View> : null}
    {effect === "Dream" ? <View style={styles.effectDream} /> : null}
  </View>;
}
function VideoOverlay({ text, sticker }) {`
);

replaceOnce(
  'home active visual props',
  '<HomeVideo uri={post.mediaUri} type={post.mediaType} overlayText={post.overlayText} sticker={post.sticker} trimStartMs={post.trimStartMs || 0} trimEndMs={post.trimEndMs || post.durationMs || 0} />;',
  '<HomeVideo uri={post.mediaUri} type={post.mediaType} overlayText={post.overlayText} sticker={post.sticker} visualFilter={post.visualFilter} visualEffect={post.visualEffect} trimStartMs={post.trimStartMs || 0} trimEndMs={post.trimEndMs || post.durationMs || 0} />;'
);
replaceOnce(
  'home thumbnail visual',
  '<VideoOverlay text={post.overlayText} sticker={post.sticker} />\n      <VideoTypeBadge type={post.mediaType} />',
  '<VisualTreatment filter={post.visualFilter} effect={post.visualEffect} />\n      <VideoOverlay text={post.overlayText} sticker={post.sticker} />\n      <VideoTypeBadge type={post.mediaType} />'
);
replaceOnce(
  'home video signature',
  'function HomeVideo({ uri, type, overlayText, sticker, trimStartMs, trimEndMs }) {',
  'function HomeVideo({ uri, type, overlayText, sticker, visualFilter, visualEffect, trimStartMs, trimEndMs }) {'
);
replaceOnce(
  'home player visual',
  '<VideoView player={player} style={styles.fill} nativeControls contentFit="contain" allowsFullscreen surfaceType="textureView" />\n    <VideoOverlay text={overlayText} sticker={sticker} />',
  '<VideoView player={player} style={styles.fill} nativeControls contentFit="contain" allowsFullscreen surfaceType="textureView" />\n    <VisualTreatment filter={visualFilter} effect={visualEffect} />\n    <VideoOverlay text={overlayText} sticker={sticker} />'
);

replaceOnce(
  'short visual treatment',
  '<VideoOverlay text={post.overlayText} sticker={post.sticker} /><View style={styles.shortBottom}>',
  '<VisualTreatment filter={post.visualFilter} effect={post.visualEffect} /><VideoOverlay text={post.overlayText} sticker={post.sticker} /><View style={styles.shortBottom}>'
);

replaceOnce(
  'preset modal anchor',
  'function TrimPreview({ uri, startMs, endMs, visible }) {',
  `function VisualPresetModal({ visible, close, mode, value, apply }) {
  const options = mode === "filter" ? ["None", "Warm", "Cool", "Sunset", "Vintage", "Night", "Rose"] : ["None", "Glow", "Sparkle", "Vignette", "Scanlines", "Dream"];
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}><View style={styles.modalBg}><View style={styles.sheet}><SheetHeader title={mode === "filter" ? "Choose Filter" : "Choose Effect"} close={close} /><Text style={styles.helpText}>{mode === "filter" ? "Video ka visual tone choose kare." : "Video ke upar visual effect choose kare."}</Text><View style={styles.presetGrid}>{options.map((x) => <Pressable key={x} style={[styles.presetCard, value === x && styles.presetCardOn]} onPress={() => apply(x)}><View style={styles.presetPreview}><VisualTreatment filter={mode === "filter" ? x : "None"} effect={mode === "effect" ? x : "None"} /><Text style={styles.presetPreviewText}>EZ</Text></View><Text style={[styles.presetLabel, value === x && styles.presetLabelOn]}>{x}</Text></Pressable>)}</View></View></View></Modal>;
}
function TrimPreview({ uri, startMs, endMs, visible }) {`
);

replaceOnce(
  'visual styles',
  'trimActions: { flexDirection: "row", marginTop: 8 },',
  'trimActions: { flexDirection: "row", marginTop: 8 }, visualTreatmentLayer: { ...StyleSheet.absoluteFillObject, zIndex: 7, overflow: "hidden" }, visualTint: { ...StyleSheet.absoluteFillObject }, effectGlow: { ...StyleSheet.absoluteFillObject, borderWidth: 8, borderColor: "rgba(255,255,255,0.28)", shadowColor: "#FFF", shadowOpacity: 0.9, shadowRadius: 18, elevation: 8 }, effectSparkle: { ...StyleSheet.absoluteFillObject, justifyContent: "space-around", padding: 22 }, effectSparkleText: { color: "rgba(255,255,255,0.82)", fontSize: 26, lineHeight: 72, textAlign: "center", textShadowColor: "rgba(255,255,255,0.8)", textShadowRadius: 8 }, vignetteEdge: { position: "absolute", left: 0, right: 0, height: "22%", backgroundColor: "rgba(0,0,0,0.38)" }, vignetteTop: { top: 0 }, vignetteBottom: { bottom: 0 }, vignetteSide: { position: "absolute", top: 0, bottom: 0, width: "15%", backgroundColor: "rgba(0,0,0,0.28)" }, vignetteLeft: { left: 0 }, vignetteRight: { right: 0 }, scanlineWrap: { ...StyleSheet.absoluteFillObject, justifyContent: "space-around" }, scanline: { height: 1, backgroundColor: "rgba(255,255,255,0.16)" }, effectDream: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(220,190,255,0.12)", borderWidth: 5, borderColor: "rgba(255,255,255,0.2)" }, presetGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14 }, presetCard: { width: "31%", borderRadius: 14, padding: 6, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, marginBottom: 10 }, presetCardOn: { borderColor: C.purple, borderWidth: 2, backgroundColor: C.purpleSoft }, presetPreview: { height: 78, borderRadius: 10, backgroundColor: "#25262B", overflow: "hidden", alignItems: "center", justifyContent: "center" }, presetPreviewText: { color: "#FFF", fontSize: 22, fontWeight: "900", zIndex: 10 }, presetLabel: { color: C.text, fontSize: 11, fontWeight: "800", textAlign: "center", marginTop: 6 }, presetLabelOn: { color: C.purple },'
);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo filters/effects upgrade applied: selectable visual presets in editor, Home and Shorts playback.');
