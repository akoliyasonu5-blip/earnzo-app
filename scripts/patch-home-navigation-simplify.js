const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo simplified home navigation active')) {
  console.log('Earnzo simplified home navigation already applied.');
  process.exit(0);
}

function replaceFunction(name, replacement) {
  const start = code.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('Simplified navigation patch failed: ' + name + ' not found');
  let end = code.indexOf('\nfunction ', start + 12);
  if (end < 0) end = code.indexOf('\n\nconst styles =', start + 12);
  if (end < 0) throw new Error('Simplified navigation patch failed: end of ' + name + ' not found');
  code = code.slice(0, start) + replacement + '\n' + code.slice(end + (code.startsWith('\nfunction ', end) ? 1 : 0));
}

// Home should not filter by upload category. Category belongs to publishing, not browsing controls.
code = code.replace(/\s*if \(category !== "All"\) visible = visible\.filter\(\(p\) => p\.category === category\);/g, '');
code = code.replace(/<ScrollView horizontal showsHorizontalScrollIndicator=\{false\} style=\{\{ marginTop: 12 \}\}>\{\["All", "Music", "Comedy", "Tech", "Travel", "Fitness"\]\.map\(\(x\) => <Chip key=\{x\} text=\{x\} active=\{category === x\} onPress=\{\(\) => setCategory\(x\)\} \/>\)\}<\/ScrollView>/g, '');

// Give creators a richer category selector at upload time.
code = code.replace(
  '<Text style={[styles.bold, { marginTop: 14, marginBottom: 8 }]}>Topic</Text>',
  '<Text style={[styles.bold, { marginTop: 14, marginBottom: 8 }]}>Select video / post category</Text>'
);
code = code.replace(
  '["Music", "Comedy", "Tech", "Travel", "Fitness"].map((x) => <Chip key={x} text={x} active={category === x} onPress={() => setCategory(x)} />)',
  '["Music", "Comedy", "Tech", "Travel", "Fitness", "Food", "Education", "News", "Gaming", "Sports", "Lifestyle", "Other"].map((x) => <Chip key={x} text={x} active={category === x} onPress={() => setCategory(x)} />)'
);

// Bottom Search opens the existing search modal; Earn remains available via wallet/profile/settings.
code = code.replace(
  '<BottomNav tab={tab} setTab={setTab} />',
  '<BottomNav tab={tab} setTab={setTab} openSearch={() => setSearchOpen(true)} />'
);

replaceFunction('Header', `// Earnzo simplified home navigation active
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
    const press = () => label === 'Search' ? openSearch?.() : setTab(label);
    return <Pressable key={label} style={styles.navItem} onPress={press}><View style={[styles.navIcon, active && styles.navIconOn]}><Text style={[styles.navIconText, active && { color: '#FFF' }]}>{icon}</Text></View><Text style={[styles.navLabel, active && { color: C.purple }]}>{label}</Text></Pressable>;
  })}</View>;
}`);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo simplified home navigation applied: Home categories removed, upload categories expanded, notification-only header actions, Search in bottom nav.');
