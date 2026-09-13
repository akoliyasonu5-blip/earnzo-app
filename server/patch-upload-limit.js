const fs = require('fs');
const path = require('path');
const target = path.join(__dirname, 'index-durable.js');
let code = fs.readFileSync(target, 'utf8');
const oldLine = "const upload = multer({ storage, limits: { fileSize: 250 * 1024 * 1024 } });";
const newLine = "const upload = multer({ storage }); // no Earnzo-side fixed MB cap; provider/project storage limits remain authoritative";
if (code.includes(oldLine)) {
  code = code.replace(oldLine, newLine);
  fs.writeFileSync(target, code, 'utf8');
  console.log('Earnzo backend fixed upload-size cap removed.');
} else if (code.includes('const upload = multer({ storage });')) {
  console.log('Earnzo backend upload-size cap already removed.');
} else {
  throw new Error('Upload limit patch target not found');
}
