const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo real upload progress active')) {
  console.log('Earnzo real upload progress already applied.');
  process.exit(0);
}

const backendImport = /import \{[^\n]*backendEnabled[^\n]*\} from "\.\/backend\/client";/;
if (!backendImport.test(code)) throw new Error('Real upload progress patch failed: backend client import not found');
code = code.replace(backendImport, (match) => `${match}\nimport { syncPostToBackendWithProgress } from "./backend/upload-progress";`);

const fakeProgress = 'setUploading(true); for (const p of [10, 25, 40, 55, 70, 85, 100]) { await new Promise((r) => setTimeout(r, 150)); setProgress(p); } const post = {';
if (!code.includes(fakeProgress)) throw new Error('Real upload progress patch failed: simulated progress loop not found');
code = code.replace(fakeProgress, 'setUploading(true); setProgress(1); // Earnzo real upload progress active\n    const post = {');

const oldSync = 'const remotePost = await syncPostToBackend(post, media.uri, cover?.uri || "");';
if (!code.includes(oldSync)) throw new Error('Real upload progress patch failed: cloud sync call not found');
code = code.replace(oldSync, 'const remotePost = await syncPostToBackendWithProgress(post, media.uri, cover?.uri || "", (value) => setProgress(value));');

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo real upload progress applied: progress follows actual media transfer bytes.');
