const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo social cloud sync active')) {
  console.log('Earnzo social cloud sync patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Social sync patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'backend social imports',
  'import { backendEnabled, syncPostToBackend, fetchFeed } from "./backend/client";',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser } from "./backend/client";'
);

replaceOnce(
  'user aware feed request',
  'const result = await fetchFeed();',
  'const result = await fetchFeed(cloudUserId);'
);

replaceOnce(
  'remote liked merge',
  'liked: existing?.liked ?? false,',
  'liked: typeof remote.liked === "boolean" ? remote.liked : (existing?.liked ?? false),'
);
replaceOnce(
  'remote following merge',
  'following: existing?.following ?? remote.following ?? false,',
  'following: typeof remote.following === "boolean" ? remote.following : (existing?.following ?? false),'
);

const totalViewsLine = '  const totalViews = ownViews; const eligible = followersCount >= FOLLOWER_TARGET && totalViews >= VIEW_TARGET;';
const socialBlock = `  const totalViews = ownViews; const eligible = followersCount >= FOLLOWER_TARGET && totalViews >= VIEW_TARGET;\n  // Earnzo social cloud sync active\n  const cloudUserId = username ? \`@\${username}\` : (mobile ? \`+91\${mobile}\` : "anonymous");\n  const isCloudPost = (post) => String(post?.id || "").startsWith("post_");\n  const handleLike = async (post) => {\n    const before = { liked: !!post.liked, likes: Number(post.likes || 0) };\n    setPosts((old) => old.map((p) => p.id === post.id ? { ...p, liked: !before.liked, likes: Math.max(0, before.likes + (before.liked ? -1 : 1)) } : p));\n    if (!backendEnabled || !isCloudPost(post)) return;\n    try {\n      const remote = await toggleLike(post.id, cloudUserId);\n      setPosts((old) => old.map((p) => p.id === post.id ? { ...p, liked: !!remote?.liked, likes: Number(remote?.likes || 0) } : p));\n    } catch (e) {\n      setPosts((old) => old.map((p) => p.id === post.id ? { ...p, ...before } : p));\n      Alert.alert("Like sync failed", String(e?.message || e || "Please try again"));\n    }\n  };\n  const handleFollow = async (post) => {\n    const creatorKey = String(post?.handle || post?.name || "").trim();\n    if (!creatorKey) return;\n    const next = !post.following;\n    setPosts((old) => old.map((p) => String(p.handle || p.name || "") === creatorKey ? { ...p, following: next } : p));\n    if (!backendEnabled || !isCloudPost(post)) return;\n    try {\n      const remote = await followRemoteUser(cloudUserId, creatorKey);\n      setPosts((old) => old.map((p) => String(p.handle || p.name || "") === creatorKey ? { ...p, following: !!remote?.following } : p));\n    } catch (e) {\n      setPosts((old) => old.map((p) => String(p.handle || p.name || "") === creatorKey ? { ...p, following: !next } : p));\n      Alert.alert("Follow sync failed", String(e?.message || e || "Please try again"));\n    }\n  };`;
replaceOnce('social helpers', totalViewsLine, socialBlock);

replaceOnce(
  'send comment cloud sync',
  '  const sendComment = () => { const text = commentText.trim(); if (!text || !commentPost) return; setPosts((old) => old.map((p) => p.id === commentPost.id ? { ...p, comments: [...(p.comments || []), text] } : p)); setCommentPost((p) => p ? { ...p, comments: [...(p.comments || []), text] } : p); setCommentText(""); };',
  '  const sendComment = async () => { const text = commentText.trim(); if (!text || !commentPost) return; const target = commentPost; setPosts((old) => old.map((p) => p.id === target.id ? { ...p, comments: [...(p.comments || []), text] } : p)); setCommentPost((p) => p ? { ...p, comments: [...(p.comments || []), text] } : p); setCommentText(""); if (!backendEnabled || !String(target.id || "").startsWith("post_")) return; try { await addRemoteComment(target.id, cloudUserId, text); await syncCloudFeed(); } catch (e) { Alert.alert("Comment sync failed", String(e?.message || e || "Comment device par hi raha")); } };'
);

replaceOnce(
  'home props',
  '<Home posts={posts} setPosts={setPosts} stories={stories} addStory={addStory} openStory={(i) => { setStoryIndex(i); setStoryOpen(true); }} openComments={openComments} onReport={setReportTarget} />',
  '<Home posts={posts} setPosts={setPosts} stories={stories} addStory={addStory} openStory={(i) => { setStoryIndex(i); setStoryOpen(true); }} openComments={openComments} onReport={setReportTarget} onLike={handleLike} onFollow={handleFollow} />'
);
replaceOnce(
  'shorts props',
  '<Shorts posts={posts} setPosts={setPosts} openComments={openComments} onReport={setReportTarget} />',
  '<Shorts posts={posts} setPosts={setPosts} openComments={openComments} onReport={setReportTarget} onLike={handleLike} />'
);

replaceOnce(
  'home signature',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport }) {',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow }) {'
);
replaceOnce(
  'home like action',
  'onPress={() => update(post.id, (p) => ({ ...p, liked: !p.liked, likes: (p.likes || 0) + (p.liked ? -1 : 1) }))}',
  'onPress={() => onLike(post)}'
);
replaceOnce(
  'home follow action',
  'onPress={() => update(post.id, (p) => ({ ...p, following: !p.following }))}',
  'onPress={() => onFollow(post)}'
);

replaceOnce(
  'shorts signature',
  'function Shorts({ posts, setPosts, openComments, onReport }) {',
  'function Shorts({ posts, setPosts, openComments, onReport, onLike }) {'
);
replaceOnce(
  'short page prop',
  'setPosts={setPosts} openComments={openComments} onReport={onReport}',
  'setPosts={setPosts} openComments={openComments} onReport={onReport} onLike={onLike}'
);
replaceOnce(
  'short page signature',
  'function ShortPage({ post, height, active, setPosts, openComments, onReport }) {',
  'function ShortPage({ post, height, active, setPosts, openComments, onReport, onLike }) {'
);
replaceOnce(
  'short like action',
  'onPress={() => update((p) => ({ ...p, liked: !p.liked, likes: (p.likes || 0) + (p.liked ? -1 : 1) }))}',
  'onPress={() => onLike(post)}'
);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo social cloud sync applied: likes, comments, follows and user-aware feed now sync with backend.');
