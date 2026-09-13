const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo pull refresh active')) {
  console.log('Earnzo pull refresh patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Refresh patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

// React Native pull-to-refresh control.
if (!code.includes('RefreshControl,')) {
  replaceOnce(
    'refresh import',
    '  BackHandler,\n} from "react-native";',
    '  BackHandler,\n  RefreshControl,\n} from "react-native";'
  );
}

// App-level refresh state so Home and Shorts share the same cloud refresh.
replaceOnce(
  'refresh state',
  '  const [searchOpen, setSearchOpen] = useState(false); const [searchText, setSearchText] = useState(""); const [searchLoading, setSearchLoading] = useState(false); const [searchResults, setSearchResults] = useState({ profiles: [], posts: [] });',
  '  const [searchOpen, setSearchOpen] = useState(false); const [searchText, setSearchText] = useState(""); const [searchLoading, setSearchLoading] = useState(false); const [searchResults, setSearchResults] = useState({ profiles: [], posts: [] });\n  const [refreshing, setRefreshing] = useState(false);'
);

// Manual cloud refresh helper used by pull-to-refresh.
replaceOnce(
  'refresh helper',
  '  // Earnzo cloud search active\n  const runCloudSearch = async () => {',
  '  // Earnzo pull refresh active\n  const refreshCloud = async () => {\n    if (refreshing) return;\n    setRefreshing(true);\n    try {\n      await syncCloudFeed();\n    } finally {\n      setRefreshing(false);\n    }\n  };\n  // Earnzo cloud search active\n  const runCloudSearch = async () => {'
);

// Pass refresh into Home and Shorts.
replaceOnce(
  'home refresh props',
  '<Home posts={posts} setPosts={setPosts} stories={stories} addStory={addStory} openStory={(i) => { setStoryIndex(i); setStoryOpen(true); }} openComments={openComments} onReport={setReportTarget} onLike={handleLike} onFollow={handleFollow} />',
  '<Home posts={posts} setPosts={setPosts} stories={stories} addStory={addStory} openStory={(i) => { setStoryIndex(i); setStoryOpen(true); }} openComments={openComments} onReport={setReportTarget} onLike={handleLike} onFollow={handleFollow} refreshing={refreshing} onRefresh={refreshCloud} />'
);
replaceOnce(
  'shorts refresh props',
  '<Shorts posts={posts} setPosts={setPosts} openComments={openComments} onReport={setReportTarget} onLike={handleLike} />',
  '<Shorts posts={posts} setPosts={setPosts} openComments={openComments} onReport={setReportTarget} onLike={handleLike} refreshing={refreshing} onRefresh={refreshCloud} />'
);

// Home pull-to-refresh.
replaceOnce(
  'home signature',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow }) {',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow, refreshing, onRefresh }) {'
);
replaceOnce(
  'home scroll refresh',
  '<ScrollView style={styles.home} showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeContent}>',
  '<ScrollView style={styles.home} showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>'
);

// Shorts pull-to-refresh, including the empty Shorts screen.
replaceOnce(
  'shorts signature',
  'function Shorts({ posts, setPosts, openComments, onReport, onLike }) {',
  'function Shorts({ posts, setPosts, openComments, onReport, onLike, refreshing, onRefresh }) {'
);
replaceOnce(
  'shorts empty refresh',
  'if (!shorts.length) return <View style={styles.noShorts}><Text style={styles.noShortLogo}>EZ</Text><Text style={styles.noShortTitle}>Earnzo Shorts</Text><Text style={styles.noShortText}>Create se Short upload kare.</Text></View>;',
  'if (!shorts.length) return <ScrollView style={styles.shorts} contentContainerStyle={styles.noShorts} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}><Text style={styles.noShortLogo}>EZ</Text><Text style={styles.noShortTitle}>Earnzo Shorts</Text><Text style={styles.noShortText}>Create se Short upload kare.</Text></ScrollView>;'
);
replaceOnce(
  'shorts list refresh',
  '<FlatList data={shorts} keyExtractor={(x) => x.id} pagingEnabled showsVerticalScrollIndicator={false}',
  '<FlatList data={shorts} keyExtractor={(x) => x.id} pagingEnabled showsVerticalScrollIndicator={false} refreshing={refreshing} onRefresh={onRefresh}'
);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo pull-to-refresh applied: pull down on Home or Shorts to fetch latest cloud feed.');
