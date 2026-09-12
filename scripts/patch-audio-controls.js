const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('const [audioMode, setAudioMode]')) {
  console.log('Earnzo audio controls patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Audio patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'audio state',
  'const [visualFilter, setVisualFilter] = useState("None"); const [visualEffect, setVisualEffect] = useState("None"); const [filterOpen, setFilterOpen] = useState(false); const [effectOpen, setEffectOpen] = useState(false);',
  'const [visualFilter, setVisualFilter] = useState("None"); const [visualEffect, setVisualEffect] = useState("None"); const [filterOpen, setFilterOpen] = useState(false); const [effectOpen, setEffectOpen] = useState(false); const [audioMode, setAudioMode] = useState("Original 100%");'
);

replaceOnce(
  'new media audio reset',
  '    setVisualFilter("None");\n    setVisualEffect("None");',
  '    setVisualFilter("None");\n    setVisualEffect("None");\n    setAudioMode("Original 100%");'
);

replaceOnce(
  'publish audio field',
  'thumbnailUri: media.thumbnailUri || "", overlayText, sticker, visualFilter, visualEffect, trimStartMs,',
  'thumbnailUri: media.thumbnailUri || "", overlayText, sticker, visualFilter, visualEffect, audioMode, trimStartMs,'
);

replaceOnce(
  'publish audio reset',
  'setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setVisualFilter("None"); setVisualEffect("None"); setFilterOpen(false); setEffectOpen(false);',
  'setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setVisualFilter("None"); setVisualEffect("None"); setAudioMode("Original 100%"); setFilterOpen(false); setEffectOpen(false);'
);

replaceOnce(
  'editor preview audio',
  '<EditorPreview uri={media.uri} trimStartMs={trimStartMs} trimEndMs={trimEndMs} /><VisualTreatment',
  '<EditorPreview uri={media.uri} trimStartMs={trimStartMs} trimEndMs={trimEndMs} audioMode={audioMode} /><AudioBadge mode={audioMode} /><VisualTreatment'
);

replaceOnce(
  'music modal props',
  '<MusicModal visible={musicOpen} close={() => setMusicOpen(false)} />',
  '<MusicModal visible={musicOpen} close={() => setMusicOpen(false)} value={audioMode} onSelect={(mode) => { setAudioMode(mode); setMusicOpen(false); }} />'
);

replaceOnce(
  'music modal',
  'function MusicModal({ visible, close }) { const [q, setQ] = useState(""); const tracks = ["Earnzo Beat", "Village Vibes", "Nature Love", "Creator Pop", "Travel Mood", "Krishna Flute"]; const filtered = tracks.filter((x) => x.toLowerCase().includes(q.toLowerCase())); return <Modal visible={visible} animationType="slide" onRequestClose={close}><SafeAreaView style={styles.darkModal}><View style={styles.musicTop}><Pressable onPress={close}><Text style={styles.storyClose}>‹</Text></Pressable><TextInput style={styles.musicSearch} placeholder="Search audio" placeholderTextColor="#AAA" value={q} onChangeText={setQ} /></View><Text style={styles.musicTabs}>For You     Trending     Saved</Text><ScrollView>{filtered.map((x, i) => <Pressable key={x} style={styles.trackRow} onPress={() => { close(); Alert.alert("Audio selected", x); }}><View style={styles.trackArt}><Text>♫</Text></View><View style={{ flex: 1 }}><Text style={styles.trackTitle}>{x}</Text><Text style={styles.trackSub}>{i % 2 ? "Royalty-free" : "Creator library"}</Text></View><Text style={styles.trackPlay}>▶</Text></Pressable>)}</ScrollView><Text style={styles.musicLegal}>Real commercial/licensed music requires rights-cleared catalog integration.</Text></SafeAreaView></Modal>; }',
  'function MusicModal({ visible, close, value, onSelect }) { const [q, setQ] = useState(""); const modes = ["Original 100%", "Original 50%", "Muted"]; const library = ["Earnzo Beat", "Village Vibes", "Nature Love", "Creator Pop", "Travel Mood", "Krishna Flute"]; const filtered = library.filter((x) => x.toLowerCase().includes(q.toLowerCase())); return <Modal visible={visible} animationType="slide" onRequestClose={close}><SafeAreaView style={styles.darkModal}><View style={styles.musicTop}><Pressable onPress={close}><Text style={styles.storyClose}>‹</Text></Pressable><TextInput style={styles.musicSearch} placeholder="Search audio" placeholderTextColor="#AAA" value={q} onChangeText={setQ} /></View><Text style={styles.musicTabs}>Original Sound</Text>{modes.map((x) => <Pressable key={x} style={[styles.trackRow, value === x && styles.trackRowOn]} onPress={() => onSelect(x)}><View style={styles.trackArt}><Text>{x === "Muted" ? "🔇" : "♫"}</Text></View><View style={{ flex: 1 }}><Text style={styles.trackTitle}>{x}</Text><Text style={styles.trackSub}>{x === "Muted" ? "Video sound off" : "Use video original audio"}</Text></View><Text style={styles.trackPlay}>{value === x ? "✓" : "›"}</Text></Pressable>)}<Text style={styles.musicTabs}>Music Library</Text><ScrollView>{filtered.map((x) => <Pressable key={x} style={styles.trackRow} onPress={() => Alert.alert("Music catalog", "Track selection UI ready hai. Real music mixing ke liye licensed catalog / media engine connect karna hoga.")}><View style={styles.trackArt}><Text>♫</Text></View><View style={{ flex: 1 }}><Text style={styles.trackTitle}>{x}</Text><Text style={styles.trackSub}>Catalog preview</Text></View><Text style={styles.trackPlay}>＋</Text></Pressable>)}</ScrollView><Text style={styles.musicLegal}>Original audio volume/mute is active now. Commercial music mixing needs rights-cleared catalog integration.</Text></SafeAreaView></Modal>; }'
);

replaceOnce(
  'audio badge component',
  'function EditorTool({ icon, label, onPress }) {',
  'function AudioBadge({ mode }) { if (!mode) return null; return <View pointerEvents="none" style={styles.audioBadge}><Text style={styles.audioBadgeText}>♫ {mode}</Text></View>; }\nfunction EditorTool({ icon, label, onPress }) {'
);

replaceOnce(
  'editor preview signature',
  'function EditorPreview({ uri, compact, trimStartMs = 0, trimEndMs = 0 }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useTrimmedPlayback(player, trimStartMs, trimEndMs, true, false); useEffect(() => () => { try { player.pause(); } catch {} }, [player]); return <VideoView player={player} style={compact ? styles.fill : styles.editorVideo} nativeControls contentFit="contain" surfaceType="textureView" />; }',
  'function EditorPreview({ uri, compact, trimStartMs = 0, trimEndMs = 0, audioMode = "Original 100%" }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useTrimmedPlayback(player, trimStartMs, trimEndMs, true, false); useEffect(() => { try { player.muted = audioMode === "Muted"; player.volume = audioMode === "Original 50%" ? 0.5 : 1; } catch {} }, [player, audioMode]); useEffect(() => () => { try { player.pause(); } catch {} }, [player]); return <VideoView player={player} style={compact ? styles.fill : styles.editorVideo} nativeControls contentFit="contain" surfaceType="textureView" />; }'
);

replaceOnce(
  'home audio props',
  'visualFilter={post.visualFilter} visualEffect={post.visualEffect} trimStartMs={post.trimStartMs || 0}',
  'visualFilter={post.visualFilter} visualEffect={post.visualEffect} audioMode={post.audioMode || "Original 100%"} trimStartMs={post.trimStartMs || 0}'
);
replaceOnce(
  'home video audio signature',
  'function HomeVideo({ uri, type, overlayText, sticker, visualFilter, visualEffect, trimStartMs, trimEndMs }) {',
  'function HomeVideo({ uri, type, overlayText, sticker, visualFilter, visualEffect, audioMode = "Original 100%", trimStartMs, trimEndMs }) {'
);
replaceOnce(
  'home audio effect',
  '  useTrimmedPlayback(player, trimStartMs, trimEndMs, false, true);\n  return <View style={styles.youtubeMedia}>',
  '  useTrimmedPlayback(player, trimStartMs, trimEndMs, false, true);\n  useEffect(() => { try { player.muted = audioMode === "Muted"; player.volume = audioMode === "Original 50%" ? 0.5 : 1; } catch {} }, [player, audioMode]);\n  return <View style={styles.youtubeMedia}>'
);

replaceOnce(
  'short audio props',
  '<ActiveShortVideo uri={post.mediaUri} trimStartMs={post.trimStartMs || 0} trimEndMs={post.trimEndMs || post.durationMs || 0} />',
  '<ActiveShortVideo uri={post.mediaUri} audioMode={post.audioMode || "Original 100%"} trimStartMs={post.trimStartMs || 0} trimEndMs={post.trimEndMs || post.durationMs || 0} />'
);
replaceOnce(
  'short player audio',
  'function ActiveShortVideo({ uri, trimStartMs = 0, trimEndMs = 0 }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useTrimmedPlayback(player, trimStartMs, trimEndMs, true, true); return <VideoView player={player} style={styles.fill} nativeControls={false} contentFit="cover" />; }',
  'function ActiveShortVideo({ uri, audioMode = "Original 100%", trimStartMs = 0, trimEndMs = 0 }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useTrimmedPlayback(player, trimStartMs, trimEndMs, true, true); useEffect(() => { try { player.muted = audioMode === "Muted"; player.volume = audioMode === "Original 50%" ? 0.5 : 1; } catch {} }, [player, audioMode]); return <VideoView player={player} style={styles.fill} nativeControls={false} contentFit="cover" />; }'
);

code = code.replace('<Text style={styles.shortMusic}>♫ Earnzo Original Sound</Text>', '<Text style={styles.shortMusic}>♫ {post.audioMode || "Original 100%"}</Text>');

replaceOnce(
  'audio styles',
  'musicTabs: { color: "#FFF", fontSize: 18, paddingHorizontal: 18, paddingVertical: 10 }, trackRow:',
  'musicTabs: { color: "#FFF", fontSize: 18, paddingHorizontal: 18, paddingVertical: 10 }, audioBadge: { position: "absolute", left: 12, bottom: 12, zIndex: 20, backgroundColor: "rgba(0,0,0,0.66)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }, audioBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "900" }, trackRowOn: { backgroundColor: "rgba(108,76,241,0.22)" }, trackRow:'
);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo audio controls applied: original audio 100%, 50%, mute, persistence and playback.');
