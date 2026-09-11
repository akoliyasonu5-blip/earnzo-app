
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";

const { width } = Dimensions.get("window");

const initialPosts = [
  {
    id: "1",
    name: "Ravi Creator",
    handle: "@ravi",
    title: "Delhi street food challenge 🔥",
    views: "128K",
    likes: 18400,
    following: false,
    tag: "Trending",
  },
  {
    id: "2",
    name: "Neha Vlogs",
    handle: "@nehavlogs",
    title: "₹500 mein full day travel!",
    views: "87K",
    likes: 9300,
    following: true,
    tag: "Travel",
  },
  {
    id: "3",
    name: "Tech Aman",
    handle: "@techaman",
    title: "Best phone tricks you should know",
    views: "54K",
    likes: 7200,
    following: false,
    tag: "Tech",
  },
];

const tasks = [
  { id: "t1", title: "Create a 30-sec EV video", reward: "₹1,000", brand: "VoltGo", deadline: "3 days" },
  { id: "t2", title: "Show your city’s best food", reward: "₹500", brand: "FoodBee", deadline: "5 days" },
  { id: "t3", title: "Make a funny 20-sec reel", reward: "₹750", brand: "LaughNow", deadline: "2 days" },
];

export default function App() {
  const [tab, setTab] = useState("Home");
  const [posts, setPosts] = useState(initialPosts);
  const [wallet, setWallet] = useState(1240);
  const [caption, setCaption] = useState("");
  const [created, setCreated] = useState([]);

  const content = useMemo(() => {
    if (tab === "Home") return <Home posts={posts} setPosts={setPosts} />;
    if (tab === "Shorts") return <Shorts posts={posts} setPosts={setPosts} />;
    if (tab === "Create") return <Create caption={caption} setCaption={setCaption} created={created} setCreated={setCreated} />;
    if (tab === "Earn") return <Earn wallet={wallet} setWallet={setWallet} />;
    return <Profile created={created} wallet={wallet} />;
  }, [tab, posts, wallet, caption, created]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>Earnzo</Text>
          <Text style={styles.tagline}>Create • Connect • Earn</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.coin}>₹{wallet}</Text>
          <Pressable style={styles.avatar}><Text style={styles.avatarText}>S</Text></Pressable>
        </View>
      </View>

      <View style={styles.content}>{content}</View>

      <View style={styles.nav}>
        {[
          ["Home", "⌂"],
          ["Shorts", "▶"],
          ["Create", "＋"],
          ["Earn", "₹"],
          ["Profile", "◉"],
        ].map(([name, icon]) => (
          <Pressable key={name} style={styles.navItem} onPress={() => setTab(name)}>
            <View style={[styles.navIconWrap, tab === name && styles.navIconActive]}>
              <Text style={[styles.navIcon, tab === name && styles.navIconTextActive]}>{icon}</Text>
            </View>
            <Text style={[styles.navText, tab === name && styles.navTextActive]}>{name}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function Home({ posts, setPosts }) {
  const toggleLike = (id) => {
    setPosts((list) => list.map((p) => p.id === id ? {...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1)} : p));
  };
  const toggleFollow = (id) => {
    setPosts((list) => list.map((p) => p.id === id ? {...p, following: !p.following} : p));
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Your feed</Text>
        <Text style={styles.heroSub}>Videos that can entertain, teach and earn.</Text>
      </View>

      <View style={styles.chips}>
        {["For You", "Following", "Trending", "India"].map((x, i) => (
          <View key={x} style={[styles.chip, i === 0 && styles.chipActive]}>
            <Text style={[styles.chipText, i === 0 && styles.chipTextActive]}>{x}</Text>
          </View>
        ))}
      </View>

      {posts.map((p) => (
        <View key={p.id} style={styles.card}>
          <View style={styles.userRow}>
            <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{p.name[0]}</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.handle}>{p.handle} • {p.tag}</Text>
            </View>
            <Pressable onPress={() => toggleFollow(p.id)} style={[styles.followBtn, p.following && styles.followingBtn]}>
              <Text style={[styles.followText, p.following && styles.followingText]}>{p.following ? "Following" : "Follow"}</Text>
            </Pressable>
          </View>

          <View style={styles.videoMock}>
            <Text style={styles.play}>▶</Text>
            <Text style={styles.videoLabel}>Video preview</Text>
          </View>

          <Text style={styles.postTitle}>{p.title}</Text>
          <Text style={styles.meta}>{p.views} views</Text>

          <View style={styles.actions}>
            <Pressable onPress={() => toggleLike(p.id)} style={styles.actionBtn}>
              <Text style={styles.actionText}>{p.liked ? "♥" : "♡"} {formatNum(p.likes)}</Text>
            </Pressable>
            <Pressable onPress={() => Alert.alert("Comments", "Comments screen will be connected with backend next.")} style={styles.actionBtn}>
              <Text style={styles.actionText}>💬 Comment</Text>
            </Pressable>
            <Pressable onPress={() => Alert.alert("Share", "Share flow ready for integration.")} style={styles.actionBtn}>
              <Text style={styles.actionText}>↗ Share</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function Shorts({ posts, setPosts }) {
  const p = posts[0];
  const toggleLike = () => {
    setPosts((list) => list.map((x) => x.id === p.id ? {...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1)} : x));
  };
  return (
    <View style={styles.shortScreen}>
      <View style={styles.shortTop}>
        <Text style={styles.shortTopActive}>For You</Text>
        <Text style={styles.shortTopText}>Following</Text>
      </View>
      <View style={styles.shortCenter}>
        <Text style={styles.shortPlay}>▶</Text>
        <Text style={styles.shortHint}>Full-screen short video</Text>
      </View>
      <View style={styles.shortInfo}>
        <Text style={styles.shortName}>@ravi</Text>
        <Text style={styles.shortCaption}>{p.title}</Text>
        <Text style={styles.shortSong}>♫ Original sound • Earnzo</Text>
      </View>
      <View style={styles.shortActions}>
        <Pressable onPress={toggleLike}><Text style={styles.shortAction}>{p.liked ? "♥" : "♡"}{"\n"}{formatNum(p.likes)}</Text></Pressable>
        <Pressable onPress={() => Alert.alert("Comments", "Comments panel will open here.")}><Text style={styles.shortAction}>💬{"\n"}1.2K</Text></Pressable>
        <Pressable onPress={() => Alert.alert("Share", "Share options will open here.")}><Text style={styles.shortAction}>↗{"\n"}Share</Text></Pressable>
        <Pressable onPress={() => Alert.alert("Saved", "Video saved.")}><Text style={styles.shortAction}>🔖{"\n"}Save</Text></Pressable>
      </View>
    </View>
  );
}

function Create({ caption, setCaption, created, setCreated }) {
  const publish = () => {
    if (!caption.trim()) return Alert.alert("Caption required", "Add a caption before publishing.");
    setCreated([{id: Date.now().toString(), caption, status: "Published"}, ...created]);
    setCaption("");
    Alert.alert("Published", "Your demo post is now added to your profile.");
  };
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>Create</Text>
      <Text style={styles.pageSub}>Choose what you want to publish.</Text>

      <View style={styles.createGrid}>
        {[
          ["▶", "Short / Reel"],
          ["▣", "Long Video"],
          ["◎", "Photo"],
          ["●", "Go Live"],
        ].map(([icon, label]) => (
          <Pressable key={label} style={styles.createTile} onPress={() => Alert.alert(label, "Media picker will be connected in the next build.")}>
            <Text style={styles.createIcon}>{icon}</Text>
            <Text style={styles.createLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>Caption</Text>
        <TextInput
          placeholder="Write something..."
          value={caption}
          onChangeText={setCaption}
          multiline
          style={styles.input}
        />
        <View style={styles.optionRow}><Text>🏷 Tag people</Text><Text>›</Text></View>
        <View style={styles.optionRow}><Text>📍 Add location</Text><Text>›</Text></View>
        <View style={styles.optionRow}><Text># Add topics</Text><Text>›</Text></View>
        <Pressable style={styles.primaryBtn} onPress={publish}><Text style={styles.primaryBtnText}>Publish</Text></Pressable>
      </View>
    </ScrollView>
  );
}

function Earn({ wallet, setWallet }) {
  const applyTask = (title) => Alert.alert("Applied", `You applied for: ${title}`);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>Earn</Text>
      <Text style={styles.pageSub}>Multiple ways to earn from your content.</Text>

      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Available balance</Text>
        <Text style={styles.walletAmount}>₹{wallet}</Text>
        <Text style={styles.walletMeta}>Creator earnings + rewards</Text>
        <Pressable
          style={styles.withdrawBtn}
          onPress={() => wallet > 0 ? Alert.alert("Withdraw", "KYC and payout details will be connected next.") : null}
        >
          <Text style={styles.withdrawText}>Withdraw Money</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Brand Tasks</Text>
      {tasks.map((t) => (
        <View key={t.id} style={styles.taskCard}>
          <View style={{flex:1}}>
            <Text style={styles.taskBrand}>{t.brand}</Text>
            <Text style={styles.taskTitle}>{t.title}</Text>
            <Text style={styles.taskMeta}>Deadline: {t.deadline}</Text>
          </View>
          <View style={{alignItems:"flex-end"}}>
            <Text style={styles.reward}>{t.reward}</Text>
            <Pressable style={styles.applyBtn} onPress={() => applyTask(t.title)}><Text style={styles.applyText}>Apply</Text></Pressable>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>More earning options</Text>
      {["Affiliate Products", "Live Gifts", "Paid Membership", "Creator Shop"].map((x) => (
        <Pressable key={x} style={styles.optionRowLarge} onPress={() => Alert.alert(x, "This earning module will be connected in the next build.")}>
          <Text style={styles.optionLargeText}>{x}</Text><Text>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Profile({ created, wallet }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.profileTop}>
        <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>S</Text></View>
        <Text style={styles.profileName}>Sonu Creator</Text>
        <Text style={styles.profileHandle}>@sonu • Earnzo Creator</Text>
      </View>

      <View style={styles.stats}>
        <Stat n="24" label="Posts" />
        <Stat n="12.8K" label="Followers" />
        <Stat n="438" label="Following" />
        <Stat n={`₹${wallet}`} label="Earnings" />
      </View>

      <Pressable style={styles.editBtn}><Text style={styles.editText}>Edit Profile</Text></Pressable>

      <Text style={styles.sectionTitle}>Your posts</Text>
      {created.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>＋</Text>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySub}>Create your first video or post from the Create tab.</Text>
        </View>
      ) : (
        created.map((x) => (
          <View key={x.id} style={styles.createdCard}>
            <View style={styles.createdThumb}><Text>▶</Text></View>
            <View style={{flex:1}}>
              <Text style={styles.createdTitle}>{x.caption}</Text>
              <Text style={styles.createdMeta}>{x.status} • just now</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Stat({n, label}) {
  return <View style={styles.stat}><Text style={styles.statN}>{n}</Text><Text style={styles.statLabel}>{label}</Text></View>
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K";
  return String(n);
}

const styles = StyleSheet.create({
  safe: {
  flex: 1,
  backgroundColor: "#f7f8fb",
  paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
},
  header: {
  minHeight: 78,
  paddingHorizontal: 18,
  paddingTop: 6,
  paddingBottom: 10,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "white",
  borderBottomWidth: 1,
  borderBottomColor: "#eceef2",
},
  logo: { fontSize: 26, fontWeight: "900", letterSpacing: -0.8 },
  tagline: { fontSize: 11, color: "#737780", marginTop: 1 },
  headerRight: { flexDirection: "row", gap: 10, alignItems: "center" },
  coin: { fontWeight: "800", fontSize: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "white", fontWeight: "800" },
  content: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 30 },
  hero: { marginBottom: 14 },
  heroTitle: { fontSize: 26, fontWeight: "900" },
  heroSub: { marginTop: 4, color: "#6f7480" },
  chips: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  chip: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e3e5ea", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  chipActive: { backgroundColor: "#111", borderColor: "#111" },
  chipText: { color: "#333", fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 18, marginBottom: 16, padding: 14, borderWidth: 1, borderColor: "#eceef2" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  smallAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#eceef4", alignItems: "center", justifyContent: "center" },
  smallAvatarText: { fontWeight: "900", fontSize: 17 },
  name: { fontWeight: "800", fontSize: 15 },
  handle: { color: "#7b7f89", marginTop: 2, fontSize: 12 },
  followBtn: { backgroundColor: "#111", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  followingBtn: { backgroundColor: "#f0f1f4" },
  followText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  followingText: { color: "#111" },
  videoMock: { height: 230, borderRadius: 15, marginTop: 14, backgroundColor: "#e9ebf2", alignItems: "center", justifyContent: "center" },
  play: { fontSize: 34 },
  videoLabel: { color: "#70747d", marginTop: 8, fontWeight: "700" },
  postTitle: { fontSize: 16, fontWeight: "800", marginTop: 12 },
  meta: { color: "#777b84", marginTop: 4, fontSize: 12 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, borderTopWidth: 1, borderTopColor: "#f0f1f4", paddingTop: 10 },
  actionBtn: { paddingVertical: 6 },
  actionText: { fontWeight: "700", fontSize: 12 },
  nav: {
  minHeight: 94,
  backgroundColor: "#fff",
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  borderTopWidth: 1,
  borderTopColor: "#e7e9ee",
  paddingTop: 6,
  paddingBottom: Platform.OS === "android" ? 32 : 8,
},
  navItem: { alignItems: "center", minWidth: 58 },
  navIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  navIconActive: { backgroundColor: "#111" },
  navIcon: { fontSize: 18, fontWeight: "800" },
  navIconTextActive: { color: "#fff" },
  navText: { fontSize: 10, color: "#777", marginTop: 2, fontWeight: "700" },
  navTextActive: { color: "#111" },

  shortScreen: { flex: 1, backgroundColor: "#111", position: "relative" },
  shortTop: { position: "absolute", top: 14, left: 0, right: 0, zIndex: 5, flexDirection: "row", justifyContent: "center", gap: 22 },
  shortTopActive: { color: "#fff", fontWeight: "900", fontSize: 16 },
  shortTopText: { color: "#bbb", fontWeight: "700", fontSize: 16 },
  shortCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  shortPlay: { color: "#fff", fontSize: 44 },
  shortHint: { color: "#aaa", marginTop: 10 },
  shortInfo: { position: "absolute", left: 16, bottom: 22, width: width - 100 },
  shortName: { color: "#fff", fontWeight: "900", fontSize: 16 },
  shortCaption: { color: "#fff", marginTop: 8, fontSize: 14 },
  shortSong: { color: "#d6d6d6", marginTop: 8, fontSize: 12 },
  shortActions: { position: "absolute", right: 14, bottom: 35, gap: 22, alignItems: "center" },
  shortAction: { color: "#fff", textAlign: "center", fontSize: 13, fontWeight: "800" },

  pageTitle: { fontSize: 28, fontWeight: "900" },
  pageSub: { color: "#6f7480", marginTop: 4, marginBottom: 18 },
  createGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  createTile: { width: "48%", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e9ebef", borderRadius: 16, padding: 18, alignItems: "center" },
  createIcon: { fontSize: 30, fontWeight: "900" },
  createLabel: { marginTop: 8, fontWeight: "800" },
  formCard: { marginTop: 18, backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#eceef2" },
  fieldLabel: { fontWeight: "800", marginBottom: 8 },
  input: { minHeight: 90, backgroundColor: "#f6f7f9", borderRadius: 12, padding: 12, textAlignVertical: "top" },
  optionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#f0f1f3" },
  primaryBtn: { backgroundColor: "#111", paddingVertical: 15, borderRadius: 12, alignItems: "center", marginTop: 16 },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  walletCard: { backgroundColor: "#111", borderRadius: 20, padding: 20, marginBottom: 20 },
  walletLabel: { color: "#ccc", fontWeight: "700" },
  walletAmount: { color: "#fff", fontSize: 36, fontWeight: "900", marginTop: 8 },
  walletMeta: { color: "#aaa", marginTop: 4 },
  withdrawBtn: { backgroundColor: "#fff", borderRadius: 11, paddingVertical: 13, alignItems: "center", marginTop: 18 },
  withdrawText: { fontWeight: "900" },
  sectionTitle: { fontSize: 19, fontWeight: "900", marginBottom: 10, marginTop: 4 },
  taskCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", gap: 12, borderWidth: 1, borderColor: "#eceef2" },
  taskBrand: { fontSize: 11, color: "#767b84", fontWeight: "800" },
  taskTitle: { fontSize: 15, fontWeight: "900", marginTop: 4 },
  taskMeta: { color: "#777", fontSize: 12, marginTop: 5 },
  reward: { fontSize: 17, fontWeight: "900" },
  applyBtn: { backgroundColor: "#111", borderRadius: 9, paddingHorizontal: 13, paddingVertical: 8, marginTop: 12 },
  applyText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  optionRowLarge: { backgroundColor: "#fff", borderRadius: 13, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9, borderWidth: 1, borderColor: "#eceef2" },
  optionLargeText: { fontWeight: "800" },

  profileTop: { alignItems: "center", paddingTop: 8 },
  profileAvatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
  profileAvatarText: { color: "#fff", fontSize: 34, fontWeight: "900" },
  profileName: { fontSize: 22, fontWeight: "900", marginTop: 12 },
  profileHandle: { color: "#777c85", marginTop: 4 },
  stats: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 15, borderWidth: 1, borderColor: "#eceef2" },
  stat: { flex: 1, alignItems: "center" },
  statN: { fontWeight: "900", fontSize: 15 },
  statLabel: { color: "#777", fontSize: 10, marginTop: 3 },
  editBtn: { borderWidth: 1, borderColor: "#d8dbe1", borderRadius: 11, alignItems: "center", paddingVertical: 12, marginTop: 12, marginBottom: 20 },
  editText: { fontWeight: "800" },
  empty: { backgroundColor: "#fff", borderRadius: 18, alignItems: "center", padding: 28, borderWidth: 1, borderColor: "#eceef2" },
  emptyIcon: { fontSize: 38 },
  emptyTitle: { fontWeight: "900", fontSize: 17, marginTop: 8 },
  emptySub: { color: "#777", textAlign: "center", marginTop: 6 },
  createdCard: { flexDirection: "row", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 10, marginBottom: 10, alignItems: "center" },
  createdThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: "#eceef2", alignItems: "center", justifyContent: "center" },
  createdTitle: { fontWeight: "800" },
  createdMeta: { color: "#777", marginTop: 4, fontSize: 12 },
});
