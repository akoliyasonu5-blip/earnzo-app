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

// Shorts/Reels are classified automatically by duration. Up to 1.5 minutes = Short.
replaceOnce(
  'short duration classification',
  'if (durationMs > 0) finalType = durationMs <= 60000 ? "short" : "long";',
  'if (durationMs > 0) finalType = durationMs <= 90000 ? "short" : "long"; // Earnzo upload rules active'
);

// Do not impose an arbitrary MB cap in the app. Large files are handled by the
// configured storage/upload infrastructure, whose provider/global limits still apply.
code = code.replace(/60 sec ya usse kam video automatically Short \/ Reel me jayegi\./g, '90 sec / 1.5 min tak ki video automatically Short / Reel me jayegi.');
code = code.replace(/60 sec se badi video automatically Long Video me jayegi\./g, '90 sec / 1.5 min se badi video automatically Long Video me jayegi.');
code = code.replace(/Auto: up to 60 sec/g, 'Auto: up to 1.5 min');
code = code.replace(/Auto: above 60 sec/g, 'Auto: above 1.5 min');
code = code.replace(/Auto type: up to 60 sec = Short\/Reel • above 60 sec = Long Video/g, 'Auto type: up to 1.5 min = Short/Reel • above 1.5 min = Long Video');

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo upload rules applied: automatic Short/Long classification with no fixed app-side MB cap.');
