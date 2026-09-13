const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

(async () => {
  const source = path.join(process.cwd(), 'assets', 'earnzo-icon.svg');
  const outDir = path.join(process.cwd(), 'assets');
  fs.mkdirSync(outDir, { recursive: true });
  const svg = fs.readFileSync(source);
  await sharp(svg).resize(1024, 1024, { fit: 'contain' }).png({ compressionLevel: 9 }).toFile(path.join(outDir, 'earnzo-icon.png'));
  await sharp(svg).resize(512, 512, { fit: 'contain' }).png({ compressionLevel: 9 }).toFile(path.join(outDir, 'earnzo-playstore-icon.png'));
  console.log('Earnzo brand PNG assets generated.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
