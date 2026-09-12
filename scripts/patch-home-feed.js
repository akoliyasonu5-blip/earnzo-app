const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

// Keep Home feed content above the Android bottom navigation.
code = code.replace(
  'return <ScrollView style={styles.home} showsVerticalScrollIndicator={false}>',
  'return <ScrollView style={styles.home} showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeContent}>'
);

code = code.replace(
  'home: { flex: 1, backgroundColor: "#FFF" }, homeTop:',
  'home: { flex: 1, backgroundColor: "#FFF" }, homeContent: { paddingBottom: 150 }, homeTop:'
);

// For uploaded videos without a selected cover, show the video first frame instead
// of a black title card. Keep title/channel/views below the media like a video feed.
const feedMedia = `function FeedMedia({ post, activeVideo, setActiveVideo }) {
  if (post.mediaType === "photo" && post.mediaUri) return <Image source={{ uri: post.mediaUri }} style={styles.youtubeMedia} />;
  if ((post.mediaType === "short" || post.mediaType === "long") && post.mediaUri) {
    if (activeVideo === post.id) return <HomeVideo uri={post.mediaUri} />;
    return <Pressable style={styles.youtubeMedia} onPress={() => setActiveVideo(post.id)}>
      {post.coverUri ? <Image source={{ uri: post.coverUri }} style={styles.fill} /> : <PausedVideoThumbnail uri={post.mediaUri} />}
      <View style={styles.play}><Text style={styles.playText}>▶</Text></View>
    </Pressable>;
  }
  return <View style={styles.youtubeMedia}>
    <View style={styles.fallbackThumb}><Text style={{ fontSize: 48 }}>🎬</Text></View>
    <View style={styles.play}><Text style={styles.playText}>▶</Text></View>
  </View>;
}
function PausedVideoThumbnail({ uri }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  useEffect(() => {
    try { player.currentTime = 0.15; player.pause(); } catch {}
    return () => { try { player.pause(); } catch {} };
  }, [player]);
  return <VideoView player={player} style={styles.fill} nativeControls={false} contentFit="cover" />;
}
function HomeVideo`;

code = code.replace(
  /function FeedMedia\(\{ post, activeVideo, setActiveVideo \}\) \{[\s\S]*?\}\nfunction HomeVideo/,
  feedMedia
);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo Home feed patch applied.');
