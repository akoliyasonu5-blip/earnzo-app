const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo global language region active')) {
  console.log('Earnzo global language/region patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Global language patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

const countryData = fs.readFileSync('scripts/global-country-data.txt', 'utf8').trim();
const packs = JSON.parse(fs.readFileSync('scripts/global-language-packs.json', 'utf8'));

const countryBlock = `const countryDirectory = ${JSON.stringify(countryData)};
const specialIds = {
  IN: ["Aadhaar", "PAN", "Passport"],
  US: ["Passport", "Driver License", "State ID"],
  GB: ["Passport", "Driving Licence"],
  AE: ["Emirates ID", "Passport"],
  CA: ["Passport", "Driver Licence", "Provincial ID"],
  AU: ["Passport", "Driver Licence"],
  SG: ["NRIC", "Passport"],
};
const countries = countryDirectory.split(";").map((row) => {
  const [key, name, code, currency] = row.split("|");
  return { key, name, code, currency, ids: specialIds[key] || ["Government ID", "Passport"] };
});
const languages = ${JSON.stringify(packs.languages)};
const UI_TEXT = ${JSON.stringify(packs.text)};
function t(language, key) { return UI_TEXT[language]?.[key] || UI_TEXT.en[key] || key; }`;

if (!/const countries = \[[\s\S]*?\];\nconst supportCategories/.test(code)) {
  throw new Error('Global language patch failed: countries block not found');
}
code = code.replace(/const countries = \[[\s\S]*?\];\nconst supportCategories/, countryBlock + '\nconst supportCategories');

replaceOnce(
  'language state',
  '  const [notificationsOpen, setNotificationsOpen] = useState(false); const [notifications, setNotifications] = useState([]); const [unreadNotifications, setUnreadNotifications] = useState(0); const [lastRefreshAt, setLastRefreshAt] = useState(0); // Earnzo priority experience active',
  '  const [notificationsOpen, setNotificationsOpen] = useState(false); const [notifications, setNotifications] = useState([]); const [unreadNotifications, setUnreadNotifications] = useState(0); const [lastRefreshAt, setLastRefreshAt] = useState(0); // Earnzo priority experience active\n  const [languageKey, setLanguageKey] = useState("en"); const [languageOpen, setLanguageOpen] = useState(false); // Earnzo global language region active'
);

replaceOnce(
  'language persistence hooks',
  '  if (!loaded) return <View style={styles.center}><Brand /><Text style={styles.muted}>Loading Earnzo...</Text></View>;',
  '  useEffect(() => { AsyncStorage.getItem("earnzoLanguageV1").then((v) => { if (v && languages.some((x) => x.key === v)) setLanguageKey(v); }).catch(() => {}); }, []);\n  useEffect(() => { if (loaded) AsyncStorage.setItem("earnzoLanguageV1", languageKey).catch(() => {}); }, [loaded, languageKey]);\n  if (!loaded) return <View style={styles.center}><Brand /><Text style={styles.muted}>Loading Earnzo...</Text></View>;'
);

replaceOnce(
  'header language props',
  '<Header name={name} profilePhoto={profilePhoto} country={country} wallet={walletBalance} openEarn={() => setTab("Earn")} openProfile={() => setTab("Profile")} openSearch={() => setSearchOpen(true)} openNotifications={openNotifications} unreadNotifications={unreadNotifications} />',
  '<Header name={name} profilePhoto={profilePhoto} country={country} wallet={walletBalance} openEarn={() => setTab("Earn")} openProfile={() => setTab("Profile")} openSearch={() => setSearchOpen(true)} openNotifications={openNotifications} unreadNotifications={unreadNotifications} language={languageKey} openLanguage={() => setLanguageOpen(true)} />'
);

replaceOnce(
  'bottom nav language prop',
  '<BottomNav tab={tab} setTab={setTab} />',
  '<BottomNav tab={tab} setTab={setTab} language={languageKey} />'
);

replaceOnce(
  'home language prop',
  'openCreator={openPublicCreator} lastRefreshAt={lastRefreshAt} />',
  'openCreator={openPublicCreator} lastRefreshAt={lastRefreshAt} language={languageKey} />'
);

replaceOnce(
  'home language signature',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow, refreshing, onRefresh, openCreator, lastRefreshAt }) {',
  'function Home({ posts, setPosts, stories, addStory, openStory, openComments, onReport, onLike, onFollow, refreshing, onRefresh, openCreator, lastRefreshAt, language }) {'
);

replaceOnce(
  'home translated content tabs',
  '<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>{["Long Videos", "Short Videos", "Photos", "All"].map((x) => <Chip key={x} text={x} active={contentType === x} onPress={() => setContentType(x)} />)}</ScrollView><View style={styles.feedTabs}>{["For You", "Following"].map((x) => <Chip key={x} text={x} active={feed === x} onPress={() => setFeed(x)} />)}</View><Text style={{ color: C.muted, fontSize: 10, marginBottom: 8 }}>{refreshing ? "Refreshing..." : lastRefreshAt ? "Pull down to refresh • Synced" : "Pull down to refresh"}</Text>',
  '<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>{[{ value: "Long Videos", key: "longVideos" }, { value: "Short Videos", key: "shortVideos" }, { value: "Photos", key: "photos" }, { value: "All", key: "all" }].map((x) => <Chip key={x.value} text={t(language, x.key)} active={contentType === x.value} onPress={() => setContentType(x.value)} />)}</ScrollView><View style={styles.feedTabs}>{[{ value: "For You", key: "forYou" }, { value: "Following", key: "following" }].map((x) => <Chip key={x.value} text={t(language, x.key)} active={feed === x.value} onPress={() => setFeed(x.value)} />)}</View><Text style={{ color: C.muted, fontSize: 10, marginBottom: 8 }}>{refreshing ? t(language, "refreshing") : lastRefreshAt ? `${t(language, "refresh")} • ${t(language, "synced")}` : t(language, "refresh")}</Text>'
);

replaceOnce(
  'earn language prop',
  'profileName={name} />;',
  'profileName={name} language={languageKey} />;'
);

replaceOnce(
  'earn language signature',
  'function Earn({ wallet, country, followers, views, eligible, kycStatus, setKycStatus, kycDocType, setKycDocType, setCountryKey, payoutOwner, setPayoutOwner, payoutMethod, setPayoutMethod, payoutStatus, setPayoutStatus, profileName }) {',
  'function Earn({ wallet, country, followers, views, eligible, kycStatus, setKycStatus, kycDocType, setKycDocType, setCountryKey, payoutOwner, setPayoutOwner, payoutMethod, setPayoutMethod, payoutStatus, setPayoutStatus, profileName, language }) {'
);

code = code.replace('<Text style={styles.earnLabel}>CREATOR WALLET</Text>', '<Text style={styles.earnLabel}>{t(language, "creatorWallet")}</Text>');
code = code.replace('<Text style={styles.sectionTitle}>Verification & Payout</Text>', '<Text style={styles.sectionTitle}>{t(language, "verificationPayout")}</Text>');
code = code.replace('<Text style={styles.sectionTitle}>Creator Tools</Text>', '<Text style={styles.sectionTitle}>{t(language, "creatorTools")}</Text>');
code = code.replace('<Text style={styles.bold}>How creators earn</Text>', '<Text style={styles.bold}>{t(language, "howCreatorsEarn")}</Text>');

replaceOnce(
  'language modal mount',
  '<NotificationsModal visible={notificationsOpen} items={notifications} close={() => setNotificationsOpen(false)} /></SafeAreaView>;',
  '<NotificationsModal visible={notificationsOpen} items={notifications} close={() => setNotificationsOpen(false)} /><LanguageRegionModal visible={languageOpen} close={() => setLanguageOpen(false)} language={languageKey} setLanguage={setLanguageKey} countryKey={countryKey} onCountry={(key) => { setCountryKey(key); const selected = countries.find((c) => c.key === key); if (selected?.ids?.[0]) setKycDocType(selected.ids[0]); }} /></SafeAreaView>;'
);

const headerRegex = /function Header\([^\n]+\nfunction Brand\(\)/;
if (!headerRegex.test(code)) throw new Error('Global language patch failed: Header function not found');
const globalHeader = `function Header({ name, profilePhoto, country, wallet, openEarn, openProfile, openSearch, openNotifications, unreadNotifications, language, openLanguage }) { return <View style={styles.header}><View style={styles.logoRow}><View style={styles.logoBox}><Text style={styles.logoBoxText}>EZ</Text></View><View><Text style={styles.logoTitle}>Earnzo</Text><Text style={styles.tagline}>Create • Connect • Earn</Text></View></View><View style={styles.headerRight}><Pressable onPress={openLanguage} style={{ minWidth: 36, height: 38, paddingHorizontal: 7, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7", marginRight: 6 }}><Text style={{ fontSize: 11, fontWeight: "900", color: C.purple }}>{String(language || "en").toUpperCase()}</Text></Pressable><Pressable onPress={openNotifications} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7", marginRight: 6 }}><Text style={{ fontSize: 18 }}>🔔</Text>{unreadNotifications > 0 ? <View style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#E53E52", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}><Text style={{ color: "#FFF", fontSize: 9, fontWeight: "900" }}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</Text></View> : null}</Pressable><Pressable onPress={openSearch} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7" }}><Text style={{ fontSize: 18 }}>🔍</Text></Pressable><Pressable style={styles.walletChip} onPress={openEarn}><Text style={styles.walletText}>{country.currency}{wallet}</Text></Pressable><Pressable style={styles.headerAvatar} onPress={openProfile}>{profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.fill} /> : <Text style={styles.headerAvatarText}>{(name || "E")[0].toUpperCase()}</Text>}</Pressable></View></View>; }
function Brand()`;
code = code.replace(headerRegex, globalHeader);

replaceOnce(
  'translated bottom nav',
  'function BottomNav({ tab, setTab }) { return <View style={styles.nav}>{[["⌂", "Home"], ["▶", "Shorts"], ["+", "Create"], ["₹", "Earn"], ["◉", "Profile"]].map(([icon, label]) => <Pressable key={label} style={styles.navItem} onPress={() => setTab(label)}><View style={[styles.navIcon, tab === label && styles.navIconOn]}><Text style={[styles.navIconText, tab === label && { color: "#FFF" }]}>{icon}</Text></View><Text style={[styles.navLabel, tab === label && { color: C.purple }]}>{label}</Text></Pressable>)}</View>; }',
  'function BottomNav({ tab, setTab, language }) { const items = [["⌂", "Home", "home"], ["▶", "Shorts", "shorts"], ["+", "Create", "create"], ["₹", "Earn", "earn"], ["◉", "Profile", "profile"]]; return <View style={styles.nav}>{items.map(([icon, value, key]) => <Pressable key={value} style={styles.navItem} onPress={() => setTab(value)}><View style={[styles.navIcon, tab === value && styles.navIconOn]}><Text style={[styles.navIconText, tab === value && { color: "#FFF" }]}>{icon}</Text></View><Text numberOfLines={1} style={[styles.navLabel, tab === value && { color: C.purple }]}>{t(language, key)}</Text></Pressable>)}</View>; }'
);

const modalAnchor = 'function NotificationsModal({ visible, items, close }) {';
if (!code.includes(modalAnchor)) throw new Error('Global language patch failed: NotificationsModal anchor not found');
const modal = `function LanguageRegionModal({ visible, close, language, setLanguage, countryKey, onCountry }) {
  const [q, setQ] = useState("");
  const selected = countries.find((c) => c.key === countryKey) || countries.find((c) => c.key === "IN") || countries[0];
  const filteredCountries = countries.filter((c) => (c.name + " " + c.key + " " + c.code).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 250);
  return <Modal visible={visible} animationType="slide" onRequestClose={close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E7E8EF" }}>
        <Pressable onPress={close}><Text style={{ fontSize: 30, color: "#171722" }}>‹</Text></Pressable>
        <Text style={{ fontWeight: "900", fontSize: 18 }}>{t(language, "languageRegion")}</Text><View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>{t(language, "language")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{languages.map((item) => <Pressable key={item.key} onPress={() => setLanguage(item.key)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, marginRight: 8, marginBottom: 8, backgroundColor: language === item.key ? C.purple : "#F0F1F5" }}><Text style={{ color: language === item.key ? "#FFF" : C.text, fontWeight: "800" }}>{item.native}</Text></Pressable>)}</View>
        <Text style={styles.sectionTitle}>{t(language, "countryRegion")}</Text>
        <View style={styles.statusCard}><Text style={styles.bold}>{selected.name}</Text><Text style={styles.muted}>Currency: {selected.code} ({selected.currency})</Text></View>
        <TextInput style={styles.input} placeholder="Search country / currency..." value={q} onChangeText={setQ} />
        <View style={{ marginTop: 10 }}>{filteredCountries.map((c) => <Pressable key={c.key} onPress={() => onCountry(c.key)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}><View style={{ flex: 1, paddingRight: 8 }}><Text style={{ fontWeight: c.key === countryKey ? "900" : "700", color: C.text }}>{c.name}</Text><Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{c.key} • {c.code}</Text></View><Text style={{ color: c.key === countryKey ? C.purple : C.muted, fontWeight: "900" }}>{c.key === countryKey ? "✓" : c.currency}</Text></Pressable>)}</View>
        <View style={styles.tipCard}><Text style={styles.bold}>{t(language, "verificationPayout")}</Text><Text style={[styles.muted, { marginTop: 6 }]}>{t(language, "payoutNotice")}</Text><Text style={[styles.noteLeft, { marginTop: 8 }]}>Country list covers ISO countries/territories. Unsupported UI text falls back to English while more language packs are added.</Text></View>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

`;
code = code.replace(modalAnchor, modal + modalAnchor);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo global language/region applied: ISO country directory, multi-language core UI, currency-aware region selector and global payout guidance.');
