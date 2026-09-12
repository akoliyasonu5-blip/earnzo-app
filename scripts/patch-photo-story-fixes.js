const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo photo and story fixes active')) {
  console.log('Earnzo photo/story fixes already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Photo/story patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

// Marker + keep a direct reference to the user's current story in Home.
replaceOnce(
  'own story helper',
  '  const update = (id, patcher) => setPosts((old) => old.map((p) => p.id === id ? patcher(p) : p));',
  '  const update = (id, patcher) => setPosts((old) => old.map((p) => p.id === id ? patcher(p) : p));\n  // Earnzo photo and story fixes active\n  const ownStory = stories.find((s) => s.isMine);'
);

// Your Story now shows the uploaded media and opens on tap. A small + remains available to add/replace it.
replaceOnce(
  'your story card',
  '<Pressable style={styles.storyCard} onPress={addStory}><View style={styles.storyAdd}><Text style={styles.storyAddText}>+</Text></View><Text style={styles.storyCardText}>Your Story</Text></Pressable>',
  '<View style={styles.storyCard}>{ownStory ? <Pressable style={styles.storyOwnPress} onPress={() => openStory(stories.indexOf(ownStory))}>{ownStory.mediaType === "photo" && ownStory.mediaUri ? <Image source={{ uri: ownStory.mediaUri }} style={styles.storyOwnMedia} resizeMode="cover" /> : <View style={styles.storyOwnVideo}><Text style={styles.storyOwnVideoIcon}>▶</Text></View>}</Pressable> : <Pressable onPress={addStory}><View style={styles.storyAdd}><Text style={styles.storyAddText}>+</Text></View></Pressable>}{ownStory ? <Pressable style={styles.storyAddBadge} onPress={addStory}><Text style={styles.storyAddBadgeText}>+</Text></Pressable> : null}<Text style={styles.storyCardText}>Your Story</Text></View>'
);

// Open the freshly added story immediately instead of only showing a success alert.
replaceOnce(
  'story upload visibility',
  'setStories((old) => [s, ...old.filter((x) => !x.isMine)]); Alert.alert("Story added ✅");',
  'setStories((old) => [s, ...old.filter((x) => !x.isMine)]); setStoryIndex(0); setStoryOpen(true);'
);

// Home photos show the complete image and can be tapped for a full-screen viewer.
replaceOnce(
  'photo feed component anchor',
  'function FeedMedia({ post, activeVideo, setActiveVideo }) {',
  `function PhotoFeedMedia({ post }) {
  const [open, setOpen] = useState(false);
  return <>
    <Pressable style={styles.youtubeMedia} onPress={() => setOpen(true)}>
      <Image source={{ uri: post.mediaUri }} style={styles.photoFeedImage} resizeMode="contain" />
      <View pointerEvents="none" style={styles.photoTapHint}><Text style={styles.photoTapHintText}>⛶</Text></View>
    </Pressable>
    <Modal visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.photoViewer}>
        <View style={styles.photoViewerTop}><Text style={styles.photoViewerTitle}>{post.title || "Photo"}</Text><Pressable onPress={() => setOpen(false)}><Text style={styles.photoViewerClose}>✕</Text></Pressable></View>
        <Pressable style={styles.photoViewerBody} onPress={() => setOpen(false)}>
          <Image source={{ uri: post.mediaUri }} style={styles.photoViewerImage} resizeMode="contain" />
        </Pressable>
      </SafeAreaView>
    </Modal>
  </>;
}
function FeedMedia({ post, activeVideo, setActiveVideo }) {`
);
replaceOnce(
  'photo feed rendering',
  'if (post.mediaType === "photo" && post.mediaUri) return <Image source={{ uri: post.mediaUri }} style={styles.youtubeMedia} />;',
  'if (post.mediaType === "photo" && post.mediaUri) return <PhotoFeedMedia post={post} />;'
);

// Show the entire selected photo on Publish Settings.
code = code.replace(
  '<Image source={{ uri: media.uri }} style={styles.publishThumb} />',
  '<Image source={{ uri: media.uri }} style={styles.publishThumb} resizeMode="contain" />'
);

// Story photos should not be cropped in the full-screen story viewer.
replaceOnce(
  'story photo fit',
  'story.mediaType === "photo" && story.mediaUri ? <Image source={{ uri: story.mediaUri }} style={styles.fill} resizeMode="cover" />',
  'story.mediaType === "photo" && story.mediaUri ? <Image source={{ uri: story.mediaUri }} style={styles.fill} resizeMode="contain" />'
);

// Styles for the story thumbnail/add badge and full-screen photo viewer.
replaceOnce(
  'photo story styles',
  'storyAddText: { color: "#FFF", fontSize: 32, fontWeight: "700" }, storyDemoCircle:',
  'storyAddText: { color: "#FFF", fontSize: 32, fontWeight: "700" }, storyOwnPress: { width: 58, height: 72, borderRadius: 16, overflow: "hidden", borderWidth: 2, borderColor: C.purple, backgroundColor: "#111" }, storyOwnMedia: { width: "100%", height: "100%" }, storyOwnVideo: { flex: 1, backgroundColor: "#111", alignItems: "center", justifyContent: "center" }, storyOwnVideoIcon: { color: "#FFF", fontSize: 22 }, storyAddBadge: { position: "absolute", top: 61, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: C.purple, borderWidth: 2, borderColor: "#FFF", alignItems: "center", justifyContent: "center", zIndex: 5 }, storyAddBadgeText: { color: "#FFF", fontSize: 17, lineHeight: 18, fontWeight: "900" }, storyDemoCircle:'
);
replaceOnce(
  'photo viewer styles',
  'youtubeMedia: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#090A0E", overflow: "hidden", alignItems: "center", justifyContent: "center" },',
  'youtubeMedia: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#090A0E", overflow: "hidden", alignItems: "center", justifyContent: "center" }, photoFeedImage: { width: "100%", height: "100%", backgroundColor: "#090A0E" }, photoTapHint: { position: "absolute", right: 10, bottom: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }, photoTapHintText: { color: "#FFF", fontSize: 18, fontWeight: "900" }, photoViewer: { flex: 1, backgroundColor: "#000" }, photoViewerTop: { minHeight: 58, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#000" }, photoViewerTitle: { color: "#FFF", fontSize: 16, fontWeight: "900", flex: 1, marginRight: 12 }, photoViewerClose: { color: "#FFF", fontSize: 26, padding: 8 }, photoViewerBody: { flex: 1, alignItems: "center", justifyContent: "center" }, photoViewerImage: { width: "100%", height: "100%" },'
);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo photo/story fixes applied: complete photo view, tappable full-screen photos, and visible Your Story.');
