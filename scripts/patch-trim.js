const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('const [trimOpen, setTrimOpen]')) {
  console.log('Earnzo trim patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) {
    throw new Error(`Trim patch failed: ${label} target not found`);
  }
  code = code.replace(from, to);
}

// Keep a non-destructive trim range in the editor. Published playback honors this range.
replaceOnce(
  'trim state',
  'const [musicOpen, setMusicOpen] = useState(false); const [overlayText, setOverlayText] = useState(""); const [sticker, setSticker] = useState(""); const [textOpen, setTextOpen] = useState(false); const [stickerOpen, setStickerOpen] = useState(false);',
  'const [musicOpen, setMusicOpen] = useState(false); const [overlayText, setOverlayText] = useState(""); const [sticker, setSticker] = useState(""); const [textOpen, setTextOpen] = useState(false); const [stickerOpen, setStickerOpen] = useState(false); const [trimOpen, setTrimOpen] = useState(false); const [trimStartMs, setTrimStartMs] = useState(0); const [trimEndMs, setTrimEndMs] = useState(0);'
);

replaceOnce(
  'new media trim reset',
  '    setCover(null);\n    setMedia({ ...a, durationMs, thumbnailUri });',
  '    setCover(null);\n    setTrimStartMs(0);\n    setTrimEndMs(durationMs || 0);\n    setMedia({ ...a, durationMs, thumbnailUri });'
);

replaceOnce(
  'publish trim fields',
  'thumbnailUri: media.thumbnailUri || "", overlayText, sticker, tags,',
  'thumbnailUri: media.thumbnailUri || "", overlayText, sticker, trimStartMs, trimEndMs: trimEndMs || Number(media.durationMs || media.duration || 0), tags,'
);

replaceOnce(
  'publish trim reset',
  'setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setCaption("");',
  'setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setTrimStartMs(0); setTrimEndMs(0); setTrimOpen(false); setCaption("");'
);

code = code.replace(
  'if (step === "edit") { setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setTextOpen(false); setStickerOpen(false); setStep("choose"); return true; }',
  'if (step === "edit") { setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setTextOpen(false); setStickerOpen(false); setTrimOpen(false); setTrimStartMs(0); setTrimEndMs(0); setStep("choose"); return true; }'
);
code = code.replace(
  'onPress={() => { setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setStep("choose"); }}><Text style={styles.editorBack}>‹</Text>',
  'onPress={() => { setMedia(null); setCover(null); setOverlayText(""); setSticker(""); setTrimOpen(false); setTrimStartMs(0); setTrimEndMs(0); setStep("choose"); }}><Text style={styles.editorBack}>‹</Text>'
);

// Editor preview immediately obeys the selected trim range.
replaceOnce(
  'editor trimmed preview',
  '<EditorPreview uri={media.uri} />',
  '<EditorPreview uri={media.uri} trimStartMs={trimStartMs} trimEndMs={trimEndMs} />'
);
replaceOnce(
  'trim tool',
  '<EditorTool icon="✂" label="Trim" onPress={() => Alert.alert("Trim", "Timeline trim UI ready; real media trimming engine native processing ke saath connect hoga.")} />',
  '<EditorTool icon="✂" label="Trim" onPress={() => setTrimOpen(true)} />'
);
replaceOnce(
  'trim modal mount',
  '<MusicModal visible={musicOpen} close={() => setMusicOpen(false)} /><TextOverlayModal visible={textOpen} close={() => setTextOpen(false)} value={overlayText} setValue={setOverlayText} /><StickerModal visible={stickerOpen} close={() => setStickerOpen(false)} value={sticker} setValue={setSticker} /></View>;',
  '<MusicModal visible={musicOpen} close={() => setMusicOpen(false)} /><TextOverlayModal visible={textOpen} close={() => setTextOpen(false)} value={overlayText} setValue={setOverlayText} /><StickerModal visible={stickerOpen} close={() => setStickerOpen(false)} value={sticker} setValue={setSticker} /><TrimModal visible={trimOpen} close={() => setTrimOpen(false)} uri={media.uri} durationMs={Number(media.durationMs || media.duration || 0)} startMs={trimStartMs} endMs={trimEndMs} apply={(start, end) => { setTrimStartMs(start); setTrimEndMs(end); setTrimOpen(false); }} /></View>;'
);

// Shared range playback helper. It seeks to trim start and enforces trim end.
replaceOnce(
  'trim playback helper anchor',
  'function HomeVideo({ uri, type, overlayText, sticker }) {',
  `function useTrimmedPlayback(player, startMs = 0, endMs = 0, loopSegment = false, autoPlay = false) {
  useEffect(() => {
    const start = Math.max(0, Number(startMs || 0)) / 1000;
    const end = Math.max(0, Number(endMs || 0)) / 1000;
    try { player.currentTime = start; if (autoPlay) player.play(); } catch {}
    const timer = setInterval(() => {
      if (!end || end <= start) return;
      try {
        if (Number(player.currentTime || 0) >= end - 0.06) {
          if (loopSegment) {
            player.currentTime = start;
            player.play();
          } else {
            player.pause();
            player.currentTime = start;
          }
        }
      } catch {}
    }, 120);
    return () => {
      clearInterval(timer);
      if (autoPlay) { try { player.pause(); } catch {} }
    };
  }, [player, startMs, endMs, loopSegment, autoPlay]);
}
function HomeVideo({ uri, type, overlayText, sticker, trimStartMs, trimEndMs }) {`
);

// Home playback uses the selected range.
replaceOnce(
  'home video props',
  '<HomeVideo uri={post.mediaUri} type={post.mediaType} overlayText={post.overlayText} sticker={post.sticker} />;',
  '<HomeVideo uri={post.mediaUri} type={post.mediaType} overlayText={post.overlayText} sticker={post.sticker} trimStartMs={post.trimStartMs || 0} trimEndMs={post.trimEndMs || post.durationMs || 0} />;'
);
replaceOnce(
  'home trim playback effect',
  '  useEffect(() => {\n    try { player.play(); } catch {}\n    return () => { try { player.pause(); } catch {} };\n  }, [player]);\n  return <View style={styles.youtubeMedia}>',
  '  useTrimmedPlayback(player, trimStartMs, trimEndMs, false, true);\n  return <View style={styles.youtubeMedia}>'
);

// Shorts loop only the selected range.
replaceOnce(
  'short video props',
  '<ActiveShortVideo uri={post.mediaUri} />',
  '<ActiveShortVideo uri={post.mediaUri} trimStartMs={post.trimStartMs || 0} trimEndMs={post.trimEndMs || post.durationMs || 0} />'
);
replaceOnce(
  'short trimmed player',
  'function ActiveShortVideo({ uri }) { const player = useVideoPlayer(uri, (p) => { p.loop = true; }); useEffect(() => { try { player.play(); } catch {} return () => { try { player.pause(); } catch {} }; }, [player]); return <VideoView player={player} style={styles.fill} nativeControls={false} contentFit="cover" />; }',
  'function ActiveShortVideo({ uri, trimStartMs = 0, trimEndMs = 0 }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useTrimmedPlayback(player, trimStartMs, trimEndMs, true, true); return <VideoView player={player} style={styles.fill} nativeControls={false} contentFit="cover" />; }'
);

// Editor preview is interactive, but it loops inside the selected range when the user presses play.
replaceOnce(
  'editor preview player',
  'function EditorPreview({ uri, compact }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useEffect(() => () => { try { player.pause(); } catch {} }, [player]); return <VideoView player={player} style={compact ? styles.fill : styles.editorVideo} nativeControls contentFit="contain" surfaceType="textureView" />; }',
  'function EditorPreview({ uri, compact, trimStartMs = 0, trimEndMs = 0 }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useTrimmedPlayback(player, trimStartMs, trimEndMs, true, false); useEffect(() => () => { try { player.pause(); } catch {} }, [player]); return <VideoView player={player} style={compact ? styles.fill : styles.editorVideo} nativeControls contentFit="contain" surfaceType="textureView" />; }'
);

// Functional trim sheet with live preview and precise start/end controls.
replaceOnce(
  'trim component anchor',
  'function TextOverlayModal({ visible, close, value, setValue }) {',
  `function TrimPreview({ uri, startMs, endMs, visible }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  useTrimmedPlayback(player, startMs, endMs, true, visible);
  return <VideoView player={player} style={styles.trimPreview} nativeControls={false} contentFit="contain" surfaceType="textureView" />;
}
function TrimNudge({ label, onPress }) { return <Pressable style={styles.trimNudge} onPress={onPress}><Text style={styles.trimNudgeText}>{label}</Text></Pressable>; }
function TrimModal({ visible, close, uri, durationMs, startMs, endMs, apply }) {
  const maxMs = Math.max(1000, Number(durationMs || endMs || 60000));
  const [draftStart, setDraftStart] = useState(Math.max(0, Number(startMs || 0)));
  const [draftEnd, setDraftEnd] = useState(Math.max(1000, Number(endMs || maxMs)));
  useEffect(() => {
    if (!visible) return;
    const s = Math.max(0, Math.min(Number(startMs || 0), maxMs - 1000));
    const eRaw = Number(endMs || maxMs);
    const e = Math.max(s + 1000, Math.min(eRaw || maxMs, maxMs));
    setDraftStart(s);
    setDraftEnd(e);
  }, [visible, startMs, endMs, maxMs]);
  const fmtTrim = (ms) => { const sec = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`; };
  const moveStart = (delta) => setDraftStart((v) => Math.max(0, Math.min(v + delta, draftEnd - 1000)));
  const moveEnd = (delta) => setDraftEnd((v) => Math.max(draftStart + 1000, Math.min(v + delta, maxMs)));
  const reset = () => { setDraftStart(0); setDraftEnd(maxMs); };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}><View style={styles.modalBg}><View style={styles.sheet}><SheetHeader title="Trim Video" close={close} /><Text style={styles.helpText}>Start aur End set karke sirf selected part play hoga.</Text>{uri ? <TrimPreview uri={uri} startMs={draftStart} endMs={draftEnd} visible={visible} /> : null}<View style={styles.trimSummary}><Text style={styles.bold}>Selected: {fmtTrim(draftStart)} – {fmtTrim(draftEnd)}</Text><Text style={styles.muted}>Length: {fmtTrim(Math.max(1000, draftEnd - draftStart))} / Total: {fmtTrim(maxMs)}</Text></View><View style={styles.trimRange}><View style={styles.trimControlBox}><Text style={styles.fieldLabel}>Start</Text><Text style={styles.trimValue}>{fmtTrim(draftStart)}</Text><View style={styles.trimButtons}><TrimNudge label="−5s" onPress={() => moveStart(-5000)} /><TrimNudge label="−1s" onPress={() => moveStart(-1000)} /><TrimNudge label="+1s" onPress={() => moveStart(1000)} /><TrimNudge label="+5s" onPress={() => moveStart(5000)} /></View></View><View style={styles.trimControlBox}><Text style={styles.fieldLabel}>End</Text><Text style={styles.trimValue}>{fmtTrim(draftEnd)}</Text><View style={styles.trimButtons}><TrimNudge label="−5s" onPress={() => moveEnd(-5000)} /><TrimNudge label="−1s" onPress={() => moveEnd(-1000)} /><TrimNudge label="+1s" onPress={() => moveEnd(1000)} /><TrimNudge label="+5s" onPress={() => moveEnd(5000)} /></View></View></View><View style={styles.trimActions}><Pressable style={[styles.secondary, styles.overlayModalButton]} onPress={reset}><Text style={styles.secondaryText}>Reset</Text></Pressable><Pressable style={[styles.primary, styles.overlayModalButton]} onPress={() => apply(Math.round(draftStart), Math.round(draftEnd))}><Text style={styles.primaryText}>Apply Trim</Text></Pressable></View></View></View></Modal>;
}
function TextOverlayModal({ visible, close, value, setValue }) {`
);

replaceOnce(
  'trim styles',
  'stickerPickText: { fontSize: 30 },',
  'stickerPickText: { fontSize: 30 }, trimPreview: { width: "100%", height: 190, backgroundColor: "#000", borderRadius: 14, marginTop: 12, overflow: "hidden" }, trimSummary: { backgroundColor: C.bg, borderRadius: 14, padding: 12, marginTop: 12 }, trimRange: { marginTop: 4 }, trimControlBox: { backgroundColor: "#FFF", borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 10, marginTop: 10 }, trimValue: { color: C.purple, fontWeight: "900", fontSize: 24, marginBottom: 9 }, trimButtons: { flexDirection: "row", justifyContent: "space-between" }, trimNudge: { minWidth: 58, paddingVertical: 9, paddingHorizontal: 8, backgroundColor: C.purpleSoft, borderRadius: 10, alignItems: "center" }, trimNudgeText: { color: C.purple, fontWeight: "900", fontSize: 12 }, trimActions: { flexDirection: "row", marginTop: 8 },'
);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo trim upgrade applied: selectable start/end range with live preview and trimmed playback.');
