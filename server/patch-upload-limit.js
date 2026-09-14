const fs = require('fs');
const path = require('path');
const target = path.join(__dirname, 'index-durable.js');
let code = fs.readFileSync(target, 'utf8');
const oldLine = "const upload = multer({ storage, limits: { fileSize: 250 * 1024 * 1024 } });";
const noCapLine = "const upload = multer({ storage }); // no Earnzo-side fixed MB cap; provider/project storage limits remain authoritative";
const newLine = "const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } }); // Earnzo hard maximum: 2 GB per upload";
if (code.includes(oldLine)) {
  code = code.replace(oldLine, newLine);
  fs.writeFileSync(target, code, 'utf8');
  console.log('Earnzo backend upload ceiling set to 2 GB.');
} else if (code.includes(noCapLine)) {
  code = code.replace(noCapLine, newLine);
  fs.writeFileSync(target, code, 'utf8');
  console.log('Earnzo backend upload ceiling set to 2 GB.');
} else if (code.includes(newLine)) {
  console.log('Earnzo backend 2 GB upload ceiling already active.');
} else {
  throw new Error('Upload limit patch target not found');
}
