const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo brand logo active')) {
  console.log('Earnzo brand logo patch already applied.');
  process.exit(0);
}

const headerLogo = '<View style={styles.logoBox}><Text style={styles.logoBoxText}>EZ</Text></View>';
const brandLogo = '<View style={styles.bigLogo}><Text style={styles.bigLogoText}>EZ</Text></View>';
if (!code.includes(headerLogo)) throw new Error('Brand logo patch failed: header logo target not found');
if (!code.includes(brandLogo)) throw new Error('Brand logo patch failed: auth logo target not found');

code = code.replace(headerLogo, '<View style={[styles.logoBox, { overflow: "hidden" }]}><Image source={require("./assets/earnzo-icon.png")} style={styles.fill} resizeMode="cover" /></View>');
code = code.replace(brandLogo, '<View style={[styles.bigLogo, { overflow: "hidden", backgroundColor: "transparent" }]}><Image source={require("./assets/earnzo-icon.png")} style={styles.fill} resizeMode="cover" /></View>');
code = code.replace('function Brand() {', 'function Brand() { // Earnzo brand logo active');

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo brand logo applied to header and authentication screens.');
