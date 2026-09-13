const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo upload rules active')) {
  console.log('Earnzo upload rules already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Upload rules patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

// Product requirement: Shorts/Reels support up to 1.5 minutes (90 seconds).
replaceOnce(
  'short duration classification',
  'if (durationMs > 0) finalType = durationMs <= 60000 ? "short" : "long";',
  'if (durationMs > 0) finalType = durationMs <= 90000 ? "short" : "long"; // Earnzo upload rules active'
);

// Supabase Free global Storage limit is 50 MB. Fail early in the picker instead of
// waiting for an upload to reach the server and then showing a confusing error.
replaceOnce(
  'picker size guard',
  '    const a = result.assets[0];\n    const durationMs = Number(a.duration || 0);',
  '    const a = result.assets[0];\n    const selectedBytes = Number(a.fileSize || 0);\n    if (selectedType !== "photo" && selectedBytes > 50 * 1024 * 1024) {\n      const selectedMb = Math.ceil(selectedBytes / (1024 * 1024));\n      return Alert.alert("Video too large", `Selected video ${selectedMb} MB hai. Current Earnzo beta storage par maximum 50 MB video upload ho sakti hai. Video compress karke dobara select kare.`);\n    }\n    const durationMs = Number(a.duration || 0);'
);

code = code.replace(/60 sec ya usse kam video automatically Short \/ Reel me jayegi\./g, '90 sec / 1.5 min tak ki video automatically Short / Reel me jayegi.');
code = code.replace(/60 sec se badi video automatically Long Video me jayegi\./g, '90 sec / 1.5 min se badi video automatically Long Video me jayegi.');
code = code.replace(/Auto: up to 60 sec/g, 'Auto: up to 1.5 min');
code = code.replace(/Auto: above 60 sec/g, 'Auto: above 1.5 min');
code = code.replace(/Auto type: up to 60 sec = Short\/Reel • above 60 sec = Long Video/g, 'Auto type: up to 1.5 min = Short/Reel • above 1.5 min = Long Video');

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo upload rules applied: Shorts up to 1.5 min and 50 MB early upload guard.');
