const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo Play compliance links active')) {
  console.log('Earnzo Play compliance links already applied.');
  process.exit(0);
}

// Add React Native Linking without disturbing the existing import list.
if (!code.includes('  Linking,\n')) {
  const anchors = ['  BackHandler,\n', '  KeyboardAvoidingView,\n'];
  let added = false;
  for (const anchor of anchors) {
    if (code.includes(anchor)) {
      code = code.replace(anchor, anchor + '  Linking,\n');
      added = true;
      break;
    }
  }
  if (!added) throw new Error('Play compliance patch failed: react-native import anchor not found');
}

const start = code.indexOf('function AccountSettings(');
if (start < 0) throw new Error('Play compliance patch failed: AccountSettings not found');
let end = code.indexOf('\nfunction ', start + 12);
if (end < 0) end = code.indexOf('\n\nconst styles =', start + 12);
if (end < 0) throw new Error('Play compliance patch failed: AccountSettings end not found');

let block = code.slice(start, end);
const supportItem = '<SupportItem icon="?" title="Customer Support" sub="Problem direct Earnzo company ko send kare" onPress={openSupport} />';
if (!block.includes(supportItem)) throw new Error('Play compliance patch failed: settings support anchor not found');

const complianceItems = '<SupportItem icon="📄" title="Privacy Policy" sub="How Earnzo handles your data" onPress={() => Linking.openURL("https://earnzo-backend.onrender.com/privacy")} /><SupportItem icon="🗑" title="Delete Account & Data" sub="Request permanent account and associated data deletion" onPress={() => Linking.openURL("https://earnzo-backend.onrender.com/account-deletion")} />';
block = block.replace(supportItem, complianceItems + supportItem);
block = block.replace('function AccountSettings(', '/* Earnzo Play compliance links active */\nfunction AccountSettings(');

code = code.slice(0, start) + block + code.slice(end);

if (!code.includes('https://earnzo-backend.onrender.com/privacy')) throw new Error('Privacy link missing after Play compliance patch');
if (!code.includes('https://earnzo-backend.onrender.com/account-deletion')) throw new Error('Account deletion link missing after Play compliance patch');

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo Play compliance links applied: Privacy Policy + permanent Account/Data Deletion request available in Settings.');
