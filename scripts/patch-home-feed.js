const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

// Required imports for safe Android back handling and static video thumbnails.
if (!code.includes('BackHandler,')) {
  code = code.replace(
    '  KeyboardAvoidingView,\n} from "react-native";',
    '  KeyboardAvoidingView,\n  BackHandler,\n} from "react-native";'
  );
}
if (!code.includes('expo-video-thumbnails')) {
  code = code.replace(
    'import * as ImagePicker from "expo-image-picker";\n',
    'import * as ImagePicker from "expo-image-picker";\nimport * as VideoThumbnails from "expo-video-thumbnails";\n'
  );
}

// Keep Home feed content above Android bottom navigation.
code = code.replace(
  'return <ScrollView style={styles.home} showsVerticalScrollIndicator={false}>',
  'return <ScrollView style={styles.home} showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeContent}>'
);
code = code.replace(
  'home: { flex: 1, backgroundColor: "#FFF" }, homeTop:',
  'home: { flex: 1, backgroundColor: "#FFF" }, homeContent: { paddingBottom: 150 }, homeTop:'
);

// Make Short/Reel vs Long Video obvious in the Home metadata.
code = code.replace(
  '<Text style={styles.youtubeMeta}>{post.name} • {fmt(post.views || 0)} views • Just now</Text>',
  '<Text style={styles.youtubeMeta}>{post.mediaType === "short" ? "SHORT / REEL • " : post.mediaType === "long" ? "LONG VIDEO • " : ""}{post.name} • {fmt(post.views || 0)} views • Just now</Text>'
);

// Use static generated thumbnails instead of mounting a paused VideoView for every Home card.
// This is much safer for long videos and avoids Android closing under video-decoder pressure.
const homeVideoBlock = `function VideoTypeBadge({ type }) {
  if (type !== "short" && type !== "long") return null;
  return <View style={[styles.videoTypeBadge, type === "short" ? styles.videoTypeShort : styles.videoTypeLong]}>
    <Text style={styles.videoTypeText}>{type === "short" ? "SHORT / REEL" : "LONG VIDEO"}</Text>
  </View>;
}
function StaticVideoThumbnail({ uri, thumbnailUri }) {
  const [thumb, setThumb] = useState(thumbnailUri || "");
  useEffect(() => {
    let alive = true;
    if (thumbnailUri) { setThumb(thumbnailUri); return () => { alive = false; }; }
    VideoThumbnails.getThumbnailAsync(uri, { time: 300, quality: 0.65 })
      .then((result) => { if (alive && result?.uri) setThumb(result.uri); })
      .catch(() => {});
    return () => { alive = false; };
  }, [uri, thumbnailUri]);
  if (thumb) return <Image source={{ uri: thumb }} style={styles.fill} />;
  return <View style={styles.fallbackThumb}><Text style={{ fontSize: 48 }}>🎬</Text></View>;
}
function FeedMedia({ post, activeVideo, setActiveVideo }) {
  if (post.mediaType === "photo" && post.mediaUri) return <Image source={{ uri: post.mediaUri }} style={styles.youtubeMedia} />;
  if ((post.mediaType === "short" || post.mediaType === "long") && post.mediaUri) {
    if (activeVideo === post.id) return <HomeVideo uri={post.mediaUri} type={post.mediaType} />;
    return <Pressable style={styles.youtubeMedia} onPress={() => setActiveVideo(post.id)}>
      {post.coverUri ? <Image source={{ uri: post.coverUri }} style={styles.fill} /> : <StaticVideoThumbnail uri={post.mediaUri} thumbnailUri={post.thumbnailUri} />}
      <VideoTypeBadge type={post.mediaType} />
      <View style={styles.play}><Text style={styles.playText}>▶</Text></View>
    </Pressable>;
  }
  return <View style={styles.youtubeMedia}>
    <View style={styles.fallbackThumb}><Text style={{ fontSize: 48 }}>🎬</Text></View>
    <View style={styles.play}><Text style={styles.playText}>▶</Text></View>
  </View>;
}
function HomeVideo({ uri, type }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  useEffect(() => {
    try { player.play(); } catch {}
    return () => { try { player.pause(); } catch {} };
  }, [player]);
  return <View style={styles.youtubeMedia}>
    <VideoView player={player} style={styles.fill} nativeControls contentFit="contain" allowsFullscreen surfaceType="textureView" />
    <VideoTypeBadge type={type} />
  </View>;
}

function Shorts`;
code = code.replace(
  /function FeedMedia\(\{ post, activeVideo, setActiveVideo \}\)[\s\S]*?\n\nfunction Shorts/,
  homeVideoBlock
);

// Add visible Home badges.
code = code.replace(
  'youtubeInfo: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 10, alignItems: "flex-start" },',
  'videoTypeBadge: { position: "absolute", top: 10, left: 10, zIndex: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 }, videoTypeShort: { backgroundColor: C.purple }, videoTypeLong: { backgroundColor: "rgba(0,0,0,0.78)" }, videoTypeText: { color: "#FFF", fontSize: 10, fontWeight: "900" }, youtubeInfo: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 10, alignItems: "flex-start" },'
);

// Android hardware Back inside Create should go one screen back, never close the app.
code = code.replace(
  'const [musicOpen, setMusicOpen] = useState(false);',
  `const [musicOpen, setMusicOpen] = useState(false);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (musicOpen) { setMusicOpen(false); return true; }
      if (step === "details") { setStep(type === "photo" ? "choose" : "edit"); return true; }
      if (step === "edit") { setMedia(null); setCover(null); setStep("choose"); return true; }
      if (step === "choose") { goHome(); return true; }
      return true;
    });
    return () => sub.remove();
  }, [step, musicOpen, type, goHome]);`
);

// Any selected video is classified automatically by its real duration:
// <= 60 seconds = Short/Reel; > 60 seconds = Long Video.
const pickBlock = `const pick = async (selectedType) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Media permission required");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: selectedType === "photo" ? ["images"] : ["videos"], quality: 0.9 });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    const durationMs = Number(a.duration || 0);
    let finalType = selectedType;
    let thumbnailUri = "";
    if (selectedType !== "photo") {
      if (durationMs > 0) finalType = durationMs <= 60000 ? "short" : "long";
      try {
        const thumb = await VideoThumbnails.getThumbnailAsync(a.uri, { time: Math.min(500, Math.max(0, durationMs - 1)), quality: 0.7 });
        thumbnailUri = thumb?.uri || "";
      } catch {}
      if (durationMs > 0 && finalType !== selectedType) {
        Alert.alert(
          finalType === "short" ? "Short / Reel selected" : "Long Video selected",
          finalType === "short" ? "60 sec ya usse kam video automatically Short / Reel me jayegi." : "60 sec se badi video automatically Long Video me jayegi."
        );
      }
    }
    setType(finalType);
    setMedia({ ...a, durationMs, thumbnailUri });
    setStep(finalType === "photo" ? "details" : "edit");
  };
  const pickCover`;
code = code.replace(
  /const pick = async \(selectedType\) => \{[\s\S]*?\};\n  const pickCover/,
  pickBlock
);

// Persist duration and static thumbnail on every uploaded video post.
code = code.replace(
  'mediaType: type, mediaUri: media.uri, coverUri: cover?.uri || "", tags,',
  'mediaType: type, durationMs: Number(media.durationMs || media.duration || 0), mediaUri: media.uri, coverUri: cover?.uri || "", thumbnailUri: media.thumbnailUri || "", tags,'
);

// Make the automatic 60-second rule clear on Create screen.
code = code.replace('title="Short / Reel" sub="Max 1.5 min"', 'title="Short / Reel" sub="Auto: up to 60 sec"');
code = code.replace('title="Long Video" sub="YouTube-style"', 'title="Long Video" sub="Auto: above 60 sec"');
code = code.replace(
  'Audio • Trim • Effects • Filters • Text • Stickers • Cover • Caption • Tags • Location • Playlist • Story • Visibility • Brand label',
  'Auto type: up to 60 sec = Short/Reel • above 60 sec = Long Video • Audio • Trim • Effects • Filters • Text • Stickers • Cover • Caption • Tags • Location • Playlist'
);

// Keep long-video editor preview lightweight and release it cleanly when user goes Back.
code = code.replace(
  'function EditorPreview({ uri, compact }) { const player = useVideoPlayer(uri); return <VideoView player={player} style={compact ? styles.fill : styles.editorVideo} nativeControls contentFit="contain" />; }',
  'function EditorPreview({ uri, compact }) { const player = useVideoPlayer(uri, (p) => { p.loop = false; }); useEffect(() => () => { try { player.pause(); } catch {} }, [player]); return <VideoView player={player} style={compact ? styles.fill : styles.editorVideo} nativeControls contentFit="contain" surfaceType="textureView" />; }'
);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo Home/Video classification/back-navigation patch applied.');
