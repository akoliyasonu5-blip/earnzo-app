const fs = require('fs');

// Compatibility runner for the language/region patch. SearchModal is inserted
// between Header and Brand by an earlier patch, so the old adjacency regex is
// replaced at runtime with an exact Header replacement.
const sourcePath = 'scripts/patch-global-language-region.js';
let source = fs.readFileSync(sourcePath, 'utf8');

const start = source.indexOf('const headerRegex =');
const endMarker = "\n\nreplaceOnce(\n  'translated bottom nav'";
const end = source.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error('Global language v2: header compatibility block not found');

const currentHeader = 'function Header({ name, profilePhoto, country, wallet, openEarn, openProfile, openSearch, openNotifications, unreadNotifications }) { return <View style={styles.header}><View style={styles.logoRow}><View style={styles.logoBox}><Text style={styles.logoBoxText}>EZ</Text></View><View><Text style={styles.logoTitle}>Earnzo</Text><Text style={styles.tagline}>Create • Connect • Earn</Text></View></View><View style={styles.headerRight}><Pressable onPress={openNotifications} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7", marginRight: 6 }}><Text style={{ fontSize: 18 }}>🔔</Text>{unreadNotifications > 0 ? <View style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#E53E52", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}><Text style={{ color: "#FFF", fontSize: 9, fontWeight: "900" }}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</Text></View> : null}</Pressable><Pressable onPress={openSearch} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7" }}><Text style={{ fontSize: 18 }}>🔍</Text></Pressable><Pressable style={styles.walletChip} onPress={openEarn}><Text style={styles.walletText}>{country.currency}{wallet}</Text></Pressable><Pressable style={styles.headerAvatar} onPress={openProfile}>{profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.fill} /> : <Text style={styles.headerAvatarText}>{(name || "E")[0].toUpperCase()}</Text>}</Pressable></View></View>; }';

const globalHeader = 'function Header({ name, profilePhoto, country, wallet, openEarn, openProfile, openSearch, openNotifications, unreadNotifications, language, openLanguage }) { return <View style={styles.header}><View style={styles.logoRow}><View style={styles.logoBox}><Text style={styles.logoBoxText}>EZ</Text></View><View><Text style={styles.logoTitle}>Earnzo</Text><Text style={styles.tagline}>Create • Connect • Earn</Text></View></View><View style={styles.headerRight}><Pressable onPress={openLanguage} style={{ minWidth: 36, height: 38, paddingHorizontal: 7, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7", marginRight: 6 }}><Text style={{ fontSize: 11, fontWeight: "900", color: C.purple }}>{String(language || "en").toUpperCase()}</Text></Pressable><Pressable onPress={openNotifications} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7", marginRight: 6 }}><Text style={{ fontSize: 18 }}>🔔</Text>{unreadNotifications > 0 ? <View style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#E53E52", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}><Text style={{ color: "#FFF", fontSize: 9, fontWeight: "900" }}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</Text></View> : null}</Pressable><Pressable onPress={openSearch} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7" }}><Text style={{ fontSize: 18 }}>🔍</Text></Pressable><Pressable style={styles.walletChip} onPress={openEarn}><Text style={styles.walletText}>{country.currency}{wallet}</Text></Pressable><Pressable style={styles.headerAvatar} onPress={openProfile}>{profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.fill} /> : <Text style={styles.headerAvatarText}>{(name || "E")[0].toUpperCase()}</Text>}</Pressable></View></View>; }';

const replacement = [
  `const currentHeader = ${JSON.stringify(currentHeader)};`,
  `const globalHeader = ${JSON.stringify(globalHeader)};`,
  "replaceOnce('global header', currentHeader, globalHeader);",
].join('\n');

source = source.slice(0, start) + replacement + source.slice(end);
const runtimePath = 'scripts/.patch-global-language-region.runtime.cjs';
fs.writeFileSync(runtimePath, source, 'utf8');
try {
  require('../' + runtimePath);
} finally {
  try { fs.unlinkSync(runtimePath); } catch {}
}
