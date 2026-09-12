const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo creator stats views active')) {
  console.log('Earnzo creator stats/views patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Creator stats patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'stats backend imports',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost, fetchStories, createStory, fetchNotifications, markNotificationsRead } from "./backend/client";',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost, fetchStories, createStory, fetchNotifications, markNotificationsRead, recordRemoteView, fetchCreatorStats } from "./backend/client";'
);

// Remove demo monetization numbers. Real cloud stats will overwrite these after sync.
code = code.replace(
  '  const [followersCount, setFollowersCount] = useState(320); const [validViews, setValidViews] = useState(146000); const [walletBalance, setWalletBalance] = useState(1240);',
  '  const [followersCount, setFollowersCount] = useState(0); const [validViews, setValidViews] = useState(0); const [walletBalance, setWalletBalance] = useState(0);'
);
code = code.replace(
  'if (Number.isFinite(d.followersCount)) setFollowersCount(d.followersCount); if (Number.isFinite(d.validViews)) setValidViews(d.validViews); if (Number.isFinite(d.walletBalance)) setWalletBalance(d.walletBalance);',
  'if (Number.isFinite(d.walletBalance)) setWalletBalance(d.walletBalance);'
);
code = code.replace(
  '  const ownViews = useMemo(() => createdPosts.reduce((sum, p) => sum + (p.views || 0), validViews), [createdPosts, validViews]);',
  '  const ownViews = validViews;'
);

replaceOnce(
  'cloud stats request',
  '      const [storyResult, notificationResult] = await Promise.all([fetchStories(), fetchNotifications(cloudUserId)]);',
  '      const [storyResult, notificationResult, statsResult] = await Promise.all([fetchStories(), fetchNotifications(cloudUserId), fetchCreatorStats(cloudUserId)]);'
);
replaceOnce(
  'cloud stats update',
  '      setUnreadNotifications(Number(notificationResult?.unread || 0));',
  '      setUnreadNotifications(Number(notificationResult?.unread || 0));\n      setFollowersCount(Number(statsResult?.followers || 0));\n      setValidViews(Number(statsResult?.views || 0));'
);

replaceOnce(
  'view helper before notifications',
  '  const openNotifications = async () => {',
  `  // Earnzo creator stats views active
  const recordPostView = async (post) => {
    if (!backendEnabled || !String(post?.id || "").startsWith("post_")) return;
    const creatorKey = String(post?.handle || post?.name || "").trim();
    if (creatorKey && creatorKey === cloudUserId) return;
    try {
      const result = await recordRemoteView(post.id, cloudUserId);
      if (Number.isFinite(Number(result?.views))) {
        setPosts((old) => old.map((p) => p.id === post.id ? { ...p, views: Number(result.views) } : p));
      }
    } catch (e) {
      console.log("Earnzo view sync failed", e?.message || e);
    }
  };
  const openNotifications = async () => {`
);

replaceOnce(
  'home view prop',
  'openCreator={openPublicCreator} lastRefreshAt={lastRefreshAt} language={languageKey} />',
  'openCreator={openPublicCreator} lastRefreshAt={lastRefreshAt} language={languageKey} onView={recordPostView} />'
);
replaceOnce(
  'home view signature',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow, refreshing, onRefresh, openCreator, lastRefreshAt, language }) {',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow, refreshing, onRefresh, openCreator, lastRefreshAt, language, onView }) {'
);
replaceOnce(
  'home feed media view prop',
  '<FeedMedia post={post} activeVideo={activeVideo} setActiveVideo={setActiveVideo} />',
  '<FeedMedia post={post} activeVideo={activeVideo} setActiveVideo={setActiveVideo} onView={onView} />'
);
replaceOnce(
  'feed media view signature',
  'function FeedMedia({ post, activeVideo, setActiveVideo }) {',
  'function FeedMedia({ post, activeVideo, setActiveVideo, onView }) {'
);
replaceOnce(
  'home video view trigger',
  'return <Pressable style={styles.youtubeMedia} onPress={() => setActiveVideo(post.id)}>',
  'return <Pressable style={styles.youtubeMedia} onPress={() => { onView?.(post); setActiveVideo(post.id); }}>'
);

replaceOnce(
  'shorts view prop app',
  '<Shorts posts={posts} setPosts={setPosts} openComments={openComments} onReport={setReportTarget} onLike={handleLike} refreshing={refreshing} onRefresh={refreshCloud} openCreator={openPublicCreator} />',
  '<Shorts posts={posts} setPosts={setPosts} openComments={openComments} onReport={setReportTarget} onLike={handleLike} refreshing={refreshing} onRefresh={refreshCloud} openCreator={openPublicCreator} onView={recordPostView} />'
);
replaceOnce(
  'shorts view signature',
  'function Shorts({ posts, setPosts, openComments, onReport, onLike, refreshing, onRefresh, openCreator }) {',
  'function Shorts({ posts, setPosts, openComments, onReport, onLike, refreshing, onRefresh, openCreator, onView }) {'
);
replaceOnce(
  'short page view prop',
  'setPosts={setPosts} openComments={openComments} onReport={onReport} onLike={onLike} openCreator={openCreator}',
  'setPosts={setPosts} openComments={openComments} onReport={onReport} onLike={onLike} openCreator={openCreator} onView={onView}'
);
replaceOnce(
  'short page view signature',
  'function ShortPage({ post, height, active, setPosts, openComments, onReport, onLike, openCreator }) {',
  'function ShortPage({ post, height, active, setPosts, openComments, onReport, onLike, openCreator, onView }) {'
);
replaceOnce(
  'short active view effect',
  'function ShortPage({ post, height, active, setPosts, openComments, onReport, onLike, openCreator, onView }) { const update = (patcher) => setPosts((old) => old.map((p) => p.id === post.id ? patcher(p) : p));',
  'function ShortPage({ post, height, active, setPosts, openComments, onReport, onLike, openCreator, onView }) { const update = (patcher) => setPosts((old) => old.map((p) => p.id === post.id ? patcher(p) : p)); useEffect(() => { if (active) onView?.(post); }, [active, post.id]);'
);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo creator stats/views applied: real cloud follower count, deduplicated valid video views and monetization progress sync.');
