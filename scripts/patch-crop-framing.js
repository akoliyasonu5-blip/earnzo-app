const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('const [cropMode, setCropMode]')) {
  console.log('Earnzo crop/framing patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Crop patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'crop state',
  'const [audioMode, setAudioMode] = useState("Original 100%");',
  'const [audioMode, setAudioMode] = useState("Original 100%"); const [cropMode, setCropMode] = useState("Original"); const [cropOpen, setCropOpen] = useState(false);'
);

replaceOnce(
  'new media crop reset',
  '    setAudioMode("Original 100%");',
  '    setAudioMode("Original 100%");\n    setCropMode("Original");\n    setCropOpen(false);'
);

replaceOnce(
  'publish crop field',
  'thumbnailUri: media.thumbnailUri || "", overlayText, sticker, visualFilter, visualEffect, audioMode, trimStartMs,',
  'thumbnailUri: media.thumbnailUri || "", overlayText, sticker, visualFilter, visualEffect, audioMode, cropMode, trimStartMs,'
);

replaceOnce(
  'publish crop reset',
  'setVisualFilter("None"); setVisualEffect("None"); setAudioMode("Original 100%"); setFilterOpen(false);',
  'setVisualFilter("None"); setVisualEffect("None"); setAudioMode("Original 100%"); setCropMode("Original"); setCropOpen(false); setFilterOpen(false);'
);

code = code.replace(
  'setFilterOpen(false); setEffectOpen(false); setVisualFilter("None"); setVisualEffect("None"); setTrimOpen(false);',
  'setFilterOpen(false); setEffectOpen(false); setCropOpen(false); setVisualFilter("None"); setVisualEffect("None"); setCropMode("Original"); setTrimOpen(false);'
);

replaceOnce(
  'editor crop frame open',
  '<View style={styles.editorPreviewWrap}><EditorPreview uri={media.uri} trimStartMs={trimStartMs} trimEndMs={trimEndMs} audioMode={audioMode} /><AudioBadge mode={audioMode} /><VisualTreatment',
  '<View style={styles.editorPreviewWrap}><View style={[styles.cropPreviewFrame, cropFrameStyle(cropMode, "editor")]}><EditorPreview uri={media.uri} trimStartMs={trimStartMs} trimEndMs={trimEndMs} audioMode={audioMode} cropMode={cropMode} /><AudioBadge mode={audioMode} /><VisualTreatment'
);
replaceOnce(
  'editor crop frame close',
  '<VideoOverlay text={overlayText} sticker={sticker} />{cover?.uri ?',
  '<VideoOverlay text={overlayText} sticker={sticker} /></View>{cover?.uri ?'
);

replaceOnce(
  'crop tool',
  '<EditorTool icon="↕" label="Crop" onPress={() => Alert.alert("Crop", "9:16 / 16:9 / 1:1 crop options yahan connect honge.")} />',
  '<EditorTool icon="↕" label="Crop" onPress={() => setCropOpen(true)} />'
);

replaceOnce(
  'crop modal mount',
  '<VisualPresetModal visible={effectOpen} close={() => setEffectOpen(false)} mode="effect" value={visualEffect} apply={(x) => { setVisualEffect(x); setEffectOpen(false); }} /></View>;',
  '<VisualPresetModal visible={effectOpen} close={() => setEffectOpen(false)} mode="effect" value={visualEffect} apply={(x) => { setVisualEffect(x); setEffectOpen(false); }} /><CropModal visible={cropOpen} close={() => setCropOpen(false)} value={cropMode} apply={(x) => { setCropMode(x); setCropOpen(false); }} /></View>;'
);

replaceOnce(
  'crop helper anchor',
  'function VisualPresetModal({ visible, close, mode, value, apply }) {',
  `function cropFrameStyle(mode, surface = "editor") {
  if (surface === "editor") {
    if (mode === "9:16") return { height: "100%", aspectRatio: 9 / 16, alignSelf: "center" };
    if (mode === "1:1") return { width: "100%", aspectRatio: 1, alignSelf: "center" };
    if (mode === "16:9") return { width: "100%", aspectRatio: 16 / 9, alignSelf: "center" };
    return { width: "100%", height: "100%" };
  }
  return {};
}
function CropModal({ visible, close, value, apply }) {
  const options = ["Original", "9:16", "16:9", "1:1"];
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}><View style={styles.modalBg}><View style={styles.sheet}><SheetHeader title="Crop / Ratio" close={close} /><Text style={styles.helpText}>Video framing choose kare. Ye framing Earnzo playback me save rahegi.</Text><View style={styles.cropOptionRow}>{options.map((x) => <Pressable key={x} style={[styles.cropOption, value === x && styles.cropOptionOn]} onPress={() => apply(x)}><View style={[styles.cropShape, x === "9:16" && styles.cropShape916, x === "16:9" && styles.cropShape169, x === "1:1" && styles.cropShape11]}><Text style={styles.cropShapeText}>{x === "Original" ? "ORIG" : x}</Text></View><Text style={[styles.cropOptionText, value === x && styles.presetLabelOn]}>{x}</Text></Pressable>)}</View><Text style={styles.note}>Note: framing app ke andar apply hoti hai; original MP4 file permanently re-render nahi hoti.</Text></View></View></Modal>;
}
function VisualPresetModal({ visible, close, mode, value, apply }) {`
);

replaceOnce(
  'editor preview crop signature',
  'function EditorPreview({ uri, compact, trimStartMs = 0, trimEndMs = 0, audioMode = "Original 100%" }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useTrimmedPlayback(player, trimStartMs, trimEndMs, true, false); useEffect(() => { try { player.muted = audioMode === "Muted"; player.volume = audioMode === "Original 50%" ? 0.5 : 1; } catch {} }, [player, audioMode]); useEffect(() => () => { try { player.pause(); } catch {} }, [player]); return <VideoView player={player} style={compact ? styles.fill : styles.editorVideo} nativeControls contentFit="contain" surfaceType="textureView" />; }',
  'function EditorPreview({ uri, compact, trimStartMs = 0, trimEndMs = 0, audioMode = "Original 100%", cropMode = "Original" }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useTrimmedPlayback(player, trimStartMs, trimEndMs, true, false); useEffect(() => { try { player.muted = audioMode === "Muted"; player.volume = audioMode === "Original 50%" ? 0.5 : 1; } catch {} }, [player, audioMode]); useEffect(() => () => { try { player.pause(); } catch {} }, [player]); return <VideoView player={player} style={compact ? styles.fill : styles.editorVideo} nativeControls contentFit={cropMode === "Original" ? "contain" : "cover"} surfaceType="textureView" />; }'
);

replaceOnce(
  'home crop props',
  'visualFilter={post.visualFilter} visualEffect={post.visualEffect} audioMode={post.audioMode || "Original 100%"} trimStartMs={post.trimStartMs || 0}',
  'visualFilter={post.visualFilter} visualEffect={post.visualEffect} audioMode={post.audioMode || "Original 100%"} cropMode={post.cropMode || "Original"} trimStartMs={post.trimStartMs || 0}'
);
replaceOnce(
  'home crop signature',
  'function HomeVideo({ uri, type, overlayText, sticker, visualFilter, visualEffect, audioMode = "Original 100%", trimStartMs, trimEndMs }) {',
  'function HomeVideo({ uri, type, overlayText, sticker, visualFilter, visualEffect, audioMode = "Original 100%", cropMode = "Original", trimStartMs, trimEndMs }) {'
);
replaceOnce(
  'home crop video',
  '<VideoView player={player} style={styles.fill} nativeControls contentFit="contain" allowsFullscreen surfaceType="textureView" />',
  '<View style={styles.cropPlaybackWrap}><VideoView player={player} style={cropMode === "9:16" ? styles.homeCrop916 : cropMode === "1:1" ? styles.homeCrop11 : styles.fill} nativeControls contentFit={cropMode === "Original" ? "contain" : "cover"} allowsFullscreen surfaceType="textureView" /></View>'
);

replaceOnce(
  'short crop props',
  '<ActiveShortVideo uri={post.mediaUri} audioMode={post.audioMode || "Original 100%"} trimStartMs={post.trimStartMs || 0} trimEndMs={post.trimEndMs || post.durationMs || 0} />',
  '<ActiveShortVideo uri={post.mediaUri} audioMode={post.audioMode || "Original 100%"} cropMode={post.cropMode || "Original"} trimStartMs={post.trimStartMs || 0} trimEndMs={post.trimEndMs || post.durationMs || 0} />'
);
replaceOnce(
  'short crop player',
  'function ActiveShortVideo({ uri, audioMode = "Original 100%", trimStartMs = 0, trimEndMs = 0 }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useTrimmedPlayback(player, trimStartMs, trimEndMs, true, true); useEffect(() => { try { player.muted = audioMode === "Muted"; player.volume = audioMode === "Original 50%" ? 0.5 : 1; } catch {} }, [player, audioMode]); return <VideoView player={player} style={styles.fill} nativeControls={false} contentFit="cover" />; }',
  'function ActiveShortVideo({ uri, audioMode = "Original 100%", cropMode = "Original", trimStartMs = 0, trimEndMs = 0 }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useTrimmedPlayback(player, trimStartMs, trimEndMs, true, true); useEffect(() => { try { player.muted = audioMode === "Muted"; player.volume = audioMode === "Original 50%" ? 0.5 : 1; } catch {} }, [player, audioMode]); return <View style={styles.shortCropWrap}><VideoView player={player} style={cropMode === "16:9" ? styles.shortCrop169 : cropMode === "1:1" ? styles.shortCrop11 : styles.fill} nativeControls={false} contentFit={cropMode === "Original" ? "cover" : "cover"} /></View>; }'
);

replaceOnce(
  'crop styles',
  'trackRowOn: { backgroundColor: "rgba(108,76,241,0.22)" }, trackRow:',
  'trackRowOn: { backgroundColor: "rgba(108,76,241,0.22)" }, cropPreviewFrame: { overflow: "hidden", backgroundColor: "#000", alignSelf: "center", justifyContent: "center" }, cropOptionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 }, cropOption: { width: "23%", alignItems: "center", paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg }, cropOptionOn: { borderColor: C.purple, borderWidth: 2, backgroundColor: C.purpleSoft }, cropShape: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#25262B", alignItems: "center", justifyContent: "center" }, cropShape916: { width: 30, height: 54 }, cropShape169: { width: 58, height: 33 }, cropShape11: { width: 46, height: 46 }, cropShapeText: { color: "#FFF", fontSize: 9, fontWeight: "900" }, cropOptionText: { marginTop: 8, color: C.text, fontSize: 11, fontWeight: "800" }, cropPlaybackWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#000" }, homeCrop916: { height: "100%", aspectRatio: 9 / 16 }, homeCrop11: { height: "100%", aspectRatio: 1 }, shortCropWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#000" }, shortCrop169: { width: "100%", aspectRatio: 16 / 9 }, shortCrop11: { width: "100%", aspectRatio: 1 }, trackRow:'
);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo crop/framing upgrade applied: Original, 9:16, 16:9 and 1:1 ratios saved and shown in editor/Home/Shorts.');
