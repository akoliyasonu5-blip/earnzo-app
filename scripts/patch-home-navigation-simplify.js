const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo clean discovery navigation active')) {
  console.log('Earnzo clean discovery navigation already applied.');
  process.exit(0);
}

function replaceFunction(name, replacement) {
  const start = code.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Clean navigation patch failed: ' + name + ' not found');
  let end = code.indexOf('\nfunction ', start + 12);
  if (end < 0) end = code.indexOf('\n\nconst styles =', start + 12);
  if (end < 0) throw new Error('Clean navigation patch failed: end of ' + name + ' not found');
  code = code.slice(0, start) + replacement + '\n' + code.slice(end + (code.startsWith('\nfunction ', end) ? 1 : 0));
}

// Home is a clean discovery feed. Content-type/category chips are removed from Home,
// while the useful For You / Following switch remains available.
code = code.replace(/\s*if \(category !== "All"\) visible = visible\.filter\(\(p\) => p\.category === category\);/g, '');
code = code.replace(/<ScrollView horizontal showsHorizontalScrollIndicator=\{false\} style=\{\{ marginTop: 12 \}\}>\{\["All", "Music", "Comedy", "Tech", "Travel", "Fitness"\]\.map\([\s\S]*?<\/ScrollView>/g, '');
code = code.replace(/<ScrollView horizontal showsHorizontalScrollIndicator=\{false\} style=\{\{ marginTop: 4 \}\}>\{\["Long Videos", "Short Videos", "Photos", "All"\]\.map\([\s\S]*?<\/ScrollView>/g, '');

// Route short-form content only to Shorts. Home shows long-form/video/photo/text feed.
// For You shows the full Home feed; Following narrows it to followed creators.
code = code.replace(/let visible = posts;[\s\S]*?const update =/, 'let visible = posts.filter((p) => p.mediaType !== "short"); if (feed === "Following") visible = visible.filter((p) => p.following);\n  const update =');

// Give creators a richer category selector only during upload.
code = code.replace(
  '<Text style={[styles.bold, { marginTop: 14, marginBottom: 8 }]}>Topic</Text>',
  '<Text style={[styles.bold, { marginTop: 14, marginBottom: 8 }]}>Select video / post category</Text>'
);
code = code.replace(
  '["Music", "Comedy", "Tech", "Travel", "Fitness"].map((x) => <Chip key={x} text={x} active={category === x} onPress={() => setCategory(x)} />)',
  '["Music", "Comedy", "Tech", "Travel", "Fitness", "Food", "Education", "News", "Gaming", "Sports", "Lifestyle", "Other"].map((x) => <Chip key={x} text={x} active={category === x} onPress={() => setCategory(x)} />)'
);

// Brand-specific creator analytics name instead of copying another platform's wording.
code = code.replace(/Professional Dashboard/g, 'Earnzo Creator Hub');
code = code.replace(/Professional dashboard/g, 'Earnzo Creator Hub');

// Always wire the bottom Search button to the existing search modal, regardless of earlier BottomNav props.
const bottomCall = /<BottomNav\b[^>]*\/>/;
if (!bottomCall.test(code)) throw new Error('Clean navigation patch failed: BottomNav mount not found');
code = code.replace(bottomCall, '<BottomNav tab={tab} setTab={setTab} openSearch={() => setSearchOpen(true)} />');

replaceFunction('Header', `// Earnzo clean discovery navigation active
function Header({ name, profilePhoto, country, wallet, openEarn, openProfile, openNotifications, unreadNotifications }) {
  return <View style={[styles.header, { minHeight: 78, paddingVertical: 8 }]}>
    <View style={styles.logoRow}>
      <Image source={require('./assets/earnzo-icon.png')} style={{ width: 48, height: 48, borderRadius: 14, marginRight: 10 }} />
      <View><Text style={[styles.logoTitle, { fontSize: 23 }]}>Earnzo</Text><Text style={styles.tagline}>Create • Connect • Earn</Text></View>
    </View>
    <View style={styles.headerRight}>
      <Pressable style={styles.walletChip} onPress={openEarn}><Text style={styles.walletText}>{country.currency}{wallet}</Text></Pressable>
      <Pressable onPress={openNotifications} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F2F7', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
        <Text style={{ fontSize: 20 }}>🔔</Text>
        {Number(unreadNotifications || 0) > 0 ? <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}><Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>{Number(unreadNotifications) > 99 ? '99+' : unreadNotifications}</Text></View> : null}
      </Pressable>
      <Pressable style={styles.headerAvatar} onPress={openProfile}>{profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.fill} /> : <Text style={styles.headerAvatarText}>{(name || 'E')[0].toUpperCase()}</Text>}</Pressable>
    </View>
  </View>;
}`);

replaceFunction('BottomNav', `function BottomNav({ tab, setTab, openSearch }) {
  const items = [['⌂', 'Home'], ['▶', 'Shorts'], ['+', 'Create'], ['⌕', 'Search'], ['◉', 'Profile']];
  return <View style={styles.nav}>{items.map(([icon, label]) => {
    const active = tab === label;
    const press = () => { if (label === 'Search') { openSearch?.(); return; } setTab(label); };
    return <Pressable key={label} style={styles.navItem} onPress={press} hitSlop={8}><View style={[styles.navIcon, active && styles.navIconOn]}><Text style={[styles.navIconText, active && { color: '#FFF' }]}>{icon}</Text></View><Text style={[styles.navLabel, active && { color: C.purple }]}>{label}</Text></Pressable>;
  })}</View>;
}`);

// Final photo behavior: keep the complete uploaded photo visible in-feed and make every photo tappable.
replaceFunction('PhotoFeedMedia', `function PhotoFeedMedia({ post }) {
  const [open, setOpen] = useState(false);
  const [ratio, setRatio] = useState(1);
  const onPhotoLoad = (e) => {
    const w = Number(e?.nativeEvent?.source?.width || 0);
    const h = Number(e?.nativeEvent?.source?.height || 0);
    if (w > 0 && h > 0) setRatio(Math.max(0.55, Math.min(1.8, w / h)));
  };
  return <>
    <Pressable onPress={() => setOpen(true)} style={{ width: '100%', backgroundColor: '#000' }} hitSlop={4}>
      <Image source={{ uri: post.mediaUri }} onLoad={onPhotoLoad} style={{ width: '100%', aspectRatio: ratio, backgroundColor: '#000' }} resizeMode="contain" />
      <View pointerEvents="none" style={{ position: 'absolute', right: 12, bottom: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFF', fontSize: 20, fontWeight: '900' }}>⛶</Text></View>
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

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo discovery navigation applied: Home content chips removed, For You/Following kept, Shorts routed separately, Search working, branded Creator Hub, full-view tappable photos.');
