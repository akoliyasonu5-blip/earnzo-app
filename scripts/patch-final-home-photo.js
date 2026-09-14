const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo final clean home photo active')) {
  console.log('Final clean Home/photo patch already applied.');
  process.exit(0);
}

function range(name) {
  const start = code.indexOf('function ' + name + '(');
  if (start < 0) throw new Error(name + ' function not found');
  let end = code.indexOf('\nfunction ', start + 12);
  if (end < 0) end = code.indexOf('\n\nconst styles =', start + 12);
  if (end < 0) throw new Error('End of ' + name + ' not found');
  return { start, end };
}

function replaceFunction(name, replacement) {
  const { start, end } = range(name);
  code = code.slice(0, start) + replacement + '\n' + code.slice(end + (code.startsWith('\nfunction ', end) ? 1 : 0));
}

function removeAround(source, marker, openTag, closeTag) {
  let out = source;
  let i = out.indexOf(marker);
  while (i >= 0) {
    const s = out.lastIndexOf(openTag, i);
    const e = out.indexOf(closeTag, i);
    if (s < 0 || e < 0) break;
    out = out.slice(0, s) + out.slice(e + closeTag.length);
    i = out.indexOf(marker);
  }
  return out;
}

// Final Home cleanup: remove content-type/category filter rows only.
// Keep the useful For You / Following switch directly below Creator Stories.
{
  const { start, end } = range('Home');
  let home = code.slice(start, end);
  home = removeAround(home, '["Long Videos", "Short Videos", "Photos", "All"]', '<ScrollView', '</ScrollView>');
  home = removeAround(home, '["All", "Music", "Comedy", "Tech", "Travel", "Fitness"]', '<ScrollView', '</ScrollView>');
  home = home.replace(/let visible = posts;[\s\S]*?const update =/, 'let visible = posts.filter((p) => p.mediaType !== "short"); if (feed === "Following") visible = visible.filter((p) => p.following);\n  const update =');
  code = code.slice(0, start) + home + code.slice(end);
}

// Ensure photo posts use the tappable photo viewer.
{
  const { start, end } = range('FeedMedia');
  let fm = code.slice(start, end);
  fm = fm.replace(/if\s*\(\s*post\.mediaType\s*===\s*"photo"\s*&&\s*post\.mediaUri\s*\)\s*return\s*<Image[\s\S]*?\/>;/, 'if (post.mediaType === "photo" && post.mediaUri) return <PhotoFeedMedia post={post} />;');
  if (!fm.includes('<PhotoFeedMedia post={post} />')) {
    fm = fm.replace('{', '{ if (post.mediaType === "photo" && post.mediaUri) return <PhotoFeedMedia post={post} />;');
  }
  code = code.slice(0, start) + fm + code.slice(end);
}

replaceFunction('PhotoFeedMedia', `// Earnzo final clean home photo active
function PhotoFeedMedia({ post }) {
  const [open, setOpen] = useState(false);
  const [ratio, setRatio] = useState(1);
  useEffect(() => {
    let alive = true;
    if (post?.mediaUri) {
      try {
        Image.getSize(post.mediaUri, (w, h) => {
          if (alive && Number(w) > 0 && Number(h) > 0) setRatio(Number(w) / Number(h));
        }, () => {});
      } catch {}
    }
    return () => { alive = false; };
  }, [post?.mediaUri]);
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  return <>
    <Pressable onPress={() => setOpen(true)} style={{ width: '100%', backgroundColor: '#F7F7F9' }} hitSlop={4}>
      <Image source={{ uri: post.mediaUri }} style={{ width: '100%', aspectRatio: safeRatio, backgroundColor: '#F7F7F9' }} resizeMode="contain" />
      <View pointerEvents="none" style={{ position: 'absolute', right: 12, bottom: 12, minWidth: 44, height: 36, paddingHorizontal: 10, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900' }}>⛶ View</Text></View>
    </Pressable>
    <Modal visible={open} animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000' }}>
          <Text numberOfLines={1} style={{ color: '#FFF', fontSize: 16, fontWeight: '900', flex: 1, marginRight: 12 }}>{post.title || 'Photo'}</Text>
          <Pressable onPress={() => setOpen(false)} hitSlop={12}><Text style={{ color: '#FFF', fontSize: 28, padding: 6 }}>✕</Text></Pressable>
        </View>
        <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }} onPress={() => setOpen(false)}>
          <Image source={{ uri: post.mediaUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </Pressable>
      </SafeAreaView>
    </Modal>
  </>;
}`);

// Stop the build if old Home content-filter controls survive.
{
  const { start, end } = range('Home');
  const home = code.slice(start, end);
  if (home.includes('["Long Videos", "Short Videos", "Photos", "All"]')) throw new Error('Old content filter row still present');
  if (home.includes('["All", "Music", "Comedy", "Tech", "Travel", "Fitness"]')) throw new Error('Old category filter row still present');
}

fs.writeFileSync(path, code, 'utf8');
console.log('Final Home cleanup applied: content chips removed, For You/Following kept, full tappable photo view active.');
