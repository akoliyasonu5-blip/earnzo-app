const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('syncPostToBackend')) {
  console.log('Earnzo backend foundation patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Backend patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'backend import',
  'import AsyncStorage from "@react-native-async-storage/async-storage";',
  'import AsyncStorage from "@react-native-async-storage/async-storage";\nimport { backendEnabled, syncPostToBackend } from "./backend/client";'
);

replaceOnce(
  'publish cloud sync',
  'setPosts((old) => [post, ...old]); setCreatedPosts((old) => [post, ...old]); setUploading(false);',
  'let publishedPost = post; let cloudSynced = false; let cloudError = ""; if (backendEnabled) { try { const remotePost = await syncPostToBackend(post, media.uri, cover?.uri || ""); if (remotePost) { publishedPost = { ...post, ...remotePost, localId: post.id }; cloudSynced = true; } } catch (e) { cloudError = String(e?.message || e || "Cloud upload failed"); console.log("Earnzo cloud sync failed; keeping local post", cloudError); } } setPosts((old) => [publishedPost, ...old]); setCreatedPosts((old) => [publishedPost, ...old]); setUploading(false);'
);

replaceOnce(
  'publish status alert',
  'Alert.alert("Published ✅", type === "short" ? "Short upload ho gaya" : "Post upload ho gaya",',
  'Alert.alert(cloudSynced ? "Published to Cloud ✅" : backendEnabled ? "Saved locally ⚠️" : "Published locally ✅", type === "short" ? (cloudSynced ? "Short cloud par upload ho gaya" : `Short device par save ho gaya${cloudError ? `\\n\\nCloud: ${cloudError}` : ""}`) : (cloudSynced ? "Post cloud par upload ho gaya" : `Post device par save ho gaya${cloudError ? `\\n\\nCloud: ${cloudError}` : ""}`),'
);

const creatorToolsText = 'Audio • Trim • Effects • Filters • Text • Stickers • Cover • Caption • Tags • Location • Playlist • Story • Visibility • Brand label';
if (code.includes(creatorToolsText)) {
  code = code.replace(creatorToolsText, `${creatorToolsText} • Cloud upload ready`);
} else {
  console.log('Creator tools helper text not found; skipping optional label update.');
}

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo backend foundation applied: cloud upload hook with safe local fallback.');
