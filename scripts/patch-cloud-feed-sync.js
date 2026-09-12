const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo cloud feed sync active')) {
  console.log('Earnzo cloud feed sync patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Cloud feed patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'backend import',
  'import { backendEnabled, syncPostToBackend } from "./backend/client";',
  'import { backendEnabled, syncPostToBackend, fetchFeed } from "./backend/client";'
);

const ownViewsLine = '  const ownViews = useMemo(() => createdPosts.reduce((sum, p) => sum + (p.views || 0), validViews), [createdPosts, validViews]);';
const syncBlock = `${ownViewsLine}\n\n  // Earnzo cloud feed sync active\n  const syncCloudFeed = async () => {\n    if (!backendEnabled) return;\n    try {\n      const result = await fetchFeed();\n      const remotePosts = Array.isArray(result?.posts) ? result.posts : [];\n      if (!remotePosts.length) return;\n      setPosts((current) => {\n        const currentById = new Map(current.map((p) => [String(p.id || ''), p]));\n        const remoteIds = new Set(remotePosts.map((p) => String(p.id || '')).filter(Boolean));\n        const remoteLocalIds = new Set(remotePosts.map((p) => String(p.localId || '')).filter(Boolean));\n        const remoteMerged = remotePosts.map((remote) => {\n          const existing = currentById.get(String(remote.id || '')) || current.find((p) => remote.localId && (String(p.id || '') === String(remote.localId) || String(p.localId || '') === String(remote.localId)));\n          return {\n            ...(existing || {}),\n            ...remote,\n            liked: existing?.liked ?? false,\n            saved: existing?.saved ?? false,\n            following: existing?.following ?? remote.following ?? false,\n          };\n        });\n        const localOnly = current.filter((p) => {\n          const id = String(p.id || '');\n          const localId = String(p.localId || '');\n          return !remoteIds.has(id) && !remoteLocalIds.has(id) && (!localId || !remoteLocalIds.has(localId));\n        });\n        return [...remoteMerged, ...localOnly];\n      });\n    } catch (e) {\n      console.log('Earnzo cloud feed sync failed', e?.message || e);\n    }\n  };`;
replaceOnce('sync helper', ownViewsLine, syncBlock);

const persistenceEffect = '  useEffect(() => { if (!loaded) return; AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ stage, authMode, mobile, name, username, profilePhoto, lastNameChangeAt, accountStatus, deactivatedAt, posts, createdPosts, stories, supportTickets, followersCount, validViews, walletBalance, countryKey, kycStatus, kycDocType, payoutOwner, payoutMethod, payoutStatus })).catch(() => {}); }, [loaded, stage, authMode, mobile, name, username, profilePhoto, lastNameChangeAt, accountStatus, deactivatedAt, posts, createdPosts, stories, supportTickets, followersCount, validViews, walletBalance, countryKey, kycStatus, kycDocType, payoutOwner, payoutMethod, payoutStatus]);';
const feedEffects = `${persistenceEffect}\n  useEffect(() => {\n    if (!loaded || stage !== "app" || !backendEnabled) return;\n    let active = true;\n    const run = async () => { if (active) await syncCloudFeed(); };\n    run();\n    const timer = setInterval(run, 30000);\n    return () => { active = false; clearInterval(timer); };\n  }, [loaded, stage]);\n  useEffect(() => {\n    if (!loaded || stage !== "app" || !backendEnabled) return;\n    if (tab === "Home" || tab === "Shorts") syncCloudFeed();\n  }, [tab, loaded, stage]);`;
replaceOnce('feed effects', persistenceEffect, feedEffects);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo cloud feed sync applied: Supabase-backed posts load on app open, Home/Shorts tab switch, and every 30 seconds.');
