import React, { useEffect, useState } from "react";
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
  Platform,
  Modal,
  Share,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";

const C = {
  bg: "#F6F7FB",
  card: "#FFF",
  text: "#171722",
  muted: "#77798B",
  purple: "#6C4CF1",
  pink: "#FF4F8B",
  blue: "#2D8CFF",
  green: "#20B573",
  line: "#E8E9F1",
  soft: "#F1EEFF",
  dark: "#0E0E15",
};
const demo = [
  {
    id: "1",
    name: "Ravi Creator",
    handle: "@ravi",
    title: "Delhi street food challenge 🔥",
    likes: 18400,
    following: false,
    trending: true,
    country: "India",
    liked: false,
    comments: ["Nice video!"],
    mediaType: "demo",
  },
  {
    id: "2",
    name: "Neha Vlogs",
    handle: "@nehavlogs",
    title: "₹500 mein full day travel!",
    likes: 9300,
    following: true,
    trending: false,
    country: "India",
    liked: false,
    comments: ["Amazing vlog"],
    mediaType: "demo",
  },
  {
    id: "3",
    name: "Tech Aman",
    handle: "@techaman",
    title: "Best phone tricks you should know",
    likes: 7200,
    following: true,
    trending: true,
    country: "India",
    liked: false,
    comments: [],
    mediaType: "demo",
  },
];

export default function App() {
  const [stage, setStage] = useState("login"),
    [mobile, setMobile] = useState(""),
    [otp, setOtp] = useState(""),
    [name, setName] = useState(""),
    [username, setUsername] = useState("");
  const [tab, setTab] = useState("Home"),
    [posts, setPosts] = useState(demo),
    [created, setCreated] = useState([]),
    [filter, setFilter] = useState("For You");
  const [commentPost, setCommentPost] = useState(null),
    [commentText, setCommentText] = useState("");
  const [edit, setEdit] = useState(false),
    [editName, setEditName] = useState(""),
    [editUser, setEditUser] = useState("");
  const wallet = 1240;

  if (stage === "login")
    return (
      <Auth title="Welcome to Earnzo" sub="Enter your mobile number" value={mobile} setValue={setMobile} placeholder="Mobile Number" keyboard="phone-pad" button="Continue" press={() => mobile.length === 10 ? setStage("otp") : Alert.alert("Enter valid 10-digit number") } note="Testing OTP: 1234" />
    );
  if (stage === "otp")
    return (
      <Auth title="Verify OTP" sub={OTP sent to +91 ${mobile}} value={otp} setValue={setOtp} placeholder="4-digit OTP" keyboard="number-pad" button="Verify OTP" press={() => otp === "1234" ? setStage("profile") : Alert.alert("Wrong OTP", "Testing OTP is 1234") } />
    );
  if (stage === "profile")
    return (
      <SafeAreaView style={s.safeWhite}> <StatusBar barStyle="dark-content" /> <View style={s.authWrap}> <Brand /> <View style={s.authCard}> <Text style={s.authTitle}>Create Profile</Text> <TextInput style={s.input} placeholder="Your Name" value={name} onChangeText={setName} /> <TextInput style={[s.input, { marginTop: 12 }]} placeholder="Username" value={username} onChangeText={(t) => setUsername(t.replace(/\s/g, "").toLowerCase()) } /> <Pressable style={s.primary} onPress={() => name.trim() && username.trim() ? setStage("app") : Alert.alert("Enter name and username") } > <Text style={s.primaryText}>Start Earnzo</Text> </Pressable> </View> </View> </SafeAreaView>
    );

  let screen = null;
  if (tab === "Home")
    screen = (
      <Home posts={posts} setPosts={setPosts} filter={filter} setFilter={setFilter} openComments={(p) => { setCommentPost(p); setCommentText(""); }} />
    );
  else if (tab === "Shorts")
    screen = (
      <Shorts posts={posts} setPosts={setPosts} openComments={(p) => { setCommentPost(p); setCommentText(""); }} />
    );
  else if (tab === "Create")
    screen = (
      <Create posts={posts} setPosts={setPosts} created={created} setCreated={setCreated} name={name || "Creator"} username={username || "creator"} />
    );
  else if (tab === "Earn") screen = <Earn wallet={wallet} />;
  else
    screen = (
      <Profile name={name} username={username} wallet={wallet} created={created} edit={() => { setEditName(name); setEditUser(username); setEdit(true); }} logout={() => { setStage("login"); setTab("Home"); setOtp(""); }} />
    );

  const sendComment = () => {
    const v = commentText.trim();
    if (!v || !commentPost) return;
    setPosts((a) =>
      a.map((p) =>
        p.id === commentPost.id
          ? { ...p, comments: [...(p.comments || []), v] }
          : p
      )
    );
    setCommentPost((p) => ({ ...p, comments: [...(p.comments || []), v] }));
    setCommentText("");
  };

  return (
    <SafeAreaView style={s.safe}> <StatusBar barStyle="dark-content" backgroundColor="#fff" /> <View style={s.header}> <View style={s.headerBrand}> <View style={s.miniLogo}> <Text style={s.miniLogoText}>E</Text> </View> <View> <Text style={s.logo}>Earnzo</Text> <Text style={s.small}>Create • Connect • Earn</Text> </View> </View> <View style={s.headerRight}> <View style={s.walletPill}> <Text style={s.walletText}>₹{wallet}</Text> </View> <Pressable style={s.avatar} onPress={() => setTab("Profile")}> <Text style={s.avatarText}>{(name || "S")[0].toUpperCase()}</Text> </Pressable> </View> </View> <View style={{ flex: 1 }}>{screen}</View> <View style={s.nav}> {[ ["Home", "⌂"], ["Shorts", "▶️"], ["Create", "＋"], ["Earn", "₹"], ["Profile", "◉"], ].map(([n, i]) => ( <Pressable key={n} style={s.navItem} onPress={() => setTab(n)}> <View style={[s.navCircle, tab === n && s.navOn]}> <Text style={[s.navIcon, tab === n && { color: "#fff" }]}> {i} </Text> </View> <Text style={[s.navText, tab === n && { color: C.purple }]}> {n} </Text> </Pressable> ))} </View> <Modal visible={!!commentPost} transparent animationType="slide" onRequestClose={() => setCommentPost(null)} > <KeyboardAvoidingView style={s.modalBg} behavior={Platform.OS === "ios" ? "padding" : "height"} > <View style={s.sheet}> <View style={s.handle} /> <View style={s.modalHead}> <Text style={s.modalTitle}>Comments</Text> <Pressable onPress={() => setCommentPost(null)}> <Text style={s.close}>✕</Text> </Pressable> </View> <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled" > {(commentPost?.comments || []).length === 0 ? ( <Text style={s.emptyText}>No comments yet 😊</Text> ) : ( (commentPost?.comments || []).map((c, i) => ( <View key={i} style={s.commentRow}> <View style={s.commentAv}> <Text style={{ color: C.purple, fontWeight: "900" }}> U </Text> </View> <View style={s.commentBubble}> <Text style={s.commentUser}>User</Text> <Text>{c}</Text> </View> </View> )) )} </ScrollView> <View style={s.composer}> <TextInput style={s.commentInput} placeholder="Write a comment..." value={commentText} onChangeText={setCommentText} onSubmitEditing={sendComment} /> <Pressable style={s.send} onPress={sendComment}> <Text style={s.sendText}>Send</Text> </Pressable> </View> </View> </KeyboardAvoidingView> </Modal> <Modal visible={edit} transparent animationType="slide" onRequestClose={() => setEdit(false)} > <View style={s.modalBg}> <View style={s.sheet}> <View style={s.handle} /> <View style={s.modalHead}> <Text style={s.modalTitle}>Edit Profile</Text> <Pressable onPress={() => setEdit(false)}> <Text style={s.close}>✕</Text> </Pressable> </View> <TextInput style={s.input} value={editName} onChangeText={setEditName} placeholder="Name" /> <TextInput style={[s.input, { marginTop: 12 }]} value={editUser} onChangeText={(t) => setEditUser(t.replace(/\s/g, "").toLowerCase()) } placeholder="Username" /> <Pressable style={s.primary} onPress={() => { if (!editName.trim() || !editUser.trim()) return Alert.alert("Enter complete details"); setName(editName.trim()); setUsername(editUser.trim()); setEdit(false); }} > <Text style={s.primaryText}>Save Changes</Text> </Pressable> </View> </View> </Modal> </SafeAreaView>
  );
}

function Auth({ title, sub, value, setValue, placeholder, keyboard, button, press, note, }) {
  return (
    <SafeAreaView style={s.safeWhite}> <StatusBar barStyle="dark-content" /> <View style={s.authWrap}> <Brand /> <View style={s.authCard}> <Text style={s.authTitle}>{title}</Text> <Text style={s.authSub}>{sub}</Text> <TextInput style={s.input} placeholder={placeholder} keyboardType={keyboard} value={value} onChangeText={setValue} maxLength={placeholder.includes("OTP") ? 4 : 10} /> <Pressable style={s.primary} onPress={press}> <Text style={s.primaryText}>{button}</Text> </Pressable> {note && <Text style={s.note}>{note}</Text>} </View> </View> </SafeAreaView>
  );
}
function Brand() {
  return (
    <> <View style={s.brandBubble}> <Text style={s.brandE}>E</Text> </View> <Text style={s.brandTitle}>Earnzo</Text> <Text style={s.brandTag}>Create • Connect • Earn</Text> </>
  );
}

function Home({ posts, setPosts, filter, setFilter, openComments }) {
  const like = (id) =>
    setPosts((a) =>
      a.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
          : p
      )
    );
  const follow = (id) =>
    setPosts((a) =>
      a.map((p) => (p.id === id ? { ...p, following: !p.following } : p))
    );
  let visible = posts;
  if (filter === "Following") visible = posts.filter((p) => p.following);
  if (filter === "Trending") visible = posts.filter((p) => p.trending);
  if (filter === "India") visible = posts.filter((p) => p.country === "India");
  return (
    <ScrollView contentContainerStyle={s.scroll}> <View style={s.hero}> <View> <Text style={s.heroOver}>WELCOME BACK</Text> <Text style={s.heroTitle}>Create. Connect. Earn.</Text> <Text style={s.heroSub}>Your creator journey starts here.</Text> </View> <View style={s.heroCoin}> <Text style={s.heroCoinText}>₹</Text> </View> </View> <Text style={s.h2}>Your Feed</Text> <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} > <View style={s.filters}> {["For You", "Following", "Trending", "India"].map((x) => ( <Pressable key={x} onPress={() => setFilter(x)} style={[s.filter, filter === x && s.filterOn]} > <Text style={[s.filterText, filter === x && { color: "#fff" }]}> {x} </Text> </Pressable> ))} </View> </ScrollView> {visible.map((p) => ( <View key={p.id} style={s.post}> <View style={s.postTop}> <View style={s.creatorAv}> <Text style={s.creatorAvText}>{p.name[0]}</Text> </View> <View style={{ flex: 1 }}> <Text style={s.creatorName}>{p.name}</Text> <Text style={s.small}>{p.handle}</Text> </View> <Pressable style={[s.follow, p.following && s.following]} onPress={() => follow(p.id)} > <Text style={[s.followText, p.following && { color: C.purple }]}> {p.following ? "Following" : "Follow"} </Text> </Pressable> </View> <PostMedia post={p} /> <Text style={s.postTitle}>{p.title}</Text> {p.location ? <Text style={s.small}>📍 {p.location}</Text> : null} <View style={s.actions}> <Pressable onPress={() => like(p.id)}> <Text style={[s.actionText, p.liked && { color: C.pink }]}> {p.liked ? "♥️" : "♡"} {fmt(p.likes)} </Text> </Pressable> <Pressable onPress={() => openComments(p)}> <Text style={s.actionText}>💬 {(p.comments || []).length}</Text> </Pressable> <Pressable onPress={() => Share.share({ message: ${p.name} on Earnzo\n${p.title} }) } > <Text style={s.actionText}>↗️ Share</Text> </Pressable> </View> </View> ))} </ScrollView>
  );
}
function PostMedia({ post }) {
  if (post.mediaType === "photo" && post.mediaUri)
    return (
      <View style={s.mediaFrame}> <Image source={{ uri: post.mediaUri }} style={s.mediaImage} /> </View>
    );
  if (
    (post.mediaType === "short" || post.mediaType === "long") &&
    post.mediaUri
  )
    return <VideoCard uri={post.mediaUri} />;
  return (
    <View style={s.demoVideo}> <View style={s.playCircle}> <Text style={s.playText}>▶️</Text> </View> <Text style={s.demoText}>Demo video</Text> </View>
  );
}
function VideoCard({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return (
    <View style={s.videoShell}> <VideoView style={s.video} player={player} nativeControls contentFit="contain" allowsFullscreen allowsPictureInPicture /> </View>
  );
}

function Shorts({ posts, setPosts, openComments }) {
  const shorts = posts.filter((p) => p.mediaType === "short"),
    [i, setI] = useState(0);
  const p = shorts.length
    ? shorts[i % shorts.length]
    : {
        id: "d",
        name: "Earnzo",
        handle: "@earnzo",
        title: "Upload a Short / Reel",
        likes: 0,
        comments: [],
        liked: false,
        mediaType: "demo",
      };
  const like = () =>
    p.id !== "d" &&
    setPosts((a) =>
      a.map((x) =>
        x.id === p.id
          ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) }
          : x
      )
    );
  return (
    <View style={s.shortScreen}> <View style={s.shortTabs}> <Text style={s.shortActive}>For You</Text> <Text style={s.shortTab}>Following</Text> </View> <View style={s.shortMedia}> {p.mediaType === "short" && p.mediaUri ? ( <ShortVideo uri={p.mediaUri} /> ) : ( <View style={s.shortDemo}> <Text style={s.shortDemoIcon}>▶️</Text> <Text style={s.shortDemoText}>Upload a Short / Reel</Text> </View> )} </View> <View style={s.shortInfo}> <Text style={s.shortCreator}>{p.handle}</Text> <Text style={s.shortCaption}>{p.title}</Text> </View> <View style={s.shortActions}> <Pressable onPress={like}> <Text style={s.shortAction}> {p.liked ? "♥️" : "♡"} {\n${fmt(p.likes || 0)}} </Text> </Pressable> <Pressable onPress={() => p.id !== "d" && openComments(p)}> <Text style={s.shortAction}> 💬{\n${(p.comments || []).length}} </Text> </Pressable> <Pressable onPress={() => Share.share({ message: ${p.name}\n${p.title} })} > <Text style={s.shortAction}>↗️{\nShare}</Text> </Pressable> {shorts.length > 1 && ( <Pressable onPress={() => setI((v) => v + 1)}> <Text style={s.shortAction}>↓{\nNext}</Text> </Pressable> )} </View> </View>
  );
}
function ShortVideo({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });
  useEffect(() => {
    player.play();
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);
  return (
    <VideoView style={s.shortVideo} player={player} nativeControls contentFit="contain" allowsFullscreen />
  );
}

function Create({ posts, setPosts, created, setCreated, name, username }) {
  const [media, setMedia] = useState(null),
    [type, setType] = useState("short"),
    [caption, setCaption] = useState(""),
    [cover, setCover] = useState(null),
    [tag, setTag] = useState(""),
    [location, setLocation] = useState(""),
    [topics, setTopics] = useState(""),
    [popup, setPopup] = useState(""),
    [temp, setTemp] = useState(""),
    [liveSetup, setLiveSetup] = useState(false),
    [live, setLive] = useState(false),
    [liveTitle, setLiveTitle] = useState("");
  const permission = async () => {
    const r = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!r.granted) {
      Alert.alert("Permission required", "Allow photo/video access.");
      return false;
    }
    return true;
  };
  const selectMedia = async (t) => {
    if (!(await permission())) return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: t === "photo" ? ["images"] : ["videos"],
      quality: 0.9,
    });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      if (t === "short" && a.duration && a.duration > 90000)
        return Alert.alert("Short too long", "Maximum 1.5 minutes allowed.");
      setType(t);
      setMedia(a);
    }
  };
  const selectCover = async () => {
    if (!(await permission())) return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    });
    if (!r.canceled && r.assets?.[0]) setCover(r.assets[0]);
  };
  const savePopup = () => {
    if (popup === "tag") setTag(temp.trim());
    if (popup === "location") setLocation(temp.trim());
    if (popup === "topics") setTopics(temp.trim());
    setPopup("");
    setTemp("");
  };
  const publish = () => {
    if (!media) return Alert.alert("Select media first");
    if (!caption.trim()) return Alert.alert("Write caption");
    const n = {
      id: Date.now().toString(),
      name,
      handle: @${username},
      title: caption.trim(),
      likes: 0,
      comments: [],
      following: false,
      liked: false,
      trending: false,
      country: "India",
      mediaType: type,
      mediaUri: media.uri,
      coverUri: cover?.uri || "",
      tagPeople: tag,
      location,
      topics,
    };
    setPosts([n, ...posts]);
    setCreated([n, ...created]);
    setMedia(null);
    setCaption("");
    setCover(null);
    setTag("");
    setLocation("");
    setTopics("");
    Alert.alert(
      "Published successfully ✅",
      type === "short"
        ? "Short is visible on Home, Shorts and Profile."
        : type === "long"
        ? "Long video is visible on Home and Profile."
        : "Photo is visible on Home and Profile."
    );
  };
  if (live)
    return (
      <View style={s.liveScreen}> <View style={s.liveTop}> <Text style={s.liveBadge}>LIVE</Text> <Text style={s.liveViewers}>👁️ 0 viewers</Text> </View> <Text style={s.liveTitle}>{liveTitle}</Text> <View style={s.liveCamera}> <Text style={s.liveDot}>●</Text> <Text style={s.liveText}>Live camera testing</Text> </View> <Pressable style={s.endLive} onPress={() => { setLive(false); setLiveSetup(false); setLiveTitle(""); }} > <Text style={s.primaryText}>End Live</Text> </Pressable> </View>
    );
  if (liveSetup)
    return (
      <ScrollView contentContainerStyle={s.scroll}> <Text style={s.h2}>Go Live 🔴</Text> <View style={s.form}> <TextInput style={s.input} placeholder="Live title" value={liveTitle} onChangeText={setLiveTitle} /> <Pressable style={s.primary} onPress={() => liveTitle.trim() ? setLive(true) : Alert.alert("Enter live title") } > <Text style={s.primaryText}>Start Live</Text> </Pressable> <Pressable style={s.textBtn} onPress={() => setLiveSetup(false)}> <Text style={s.textBtnText}>Cancel</Text> </Pressable> </View> </ScrollView>
    );
  return (
    <> <ScrollView contentContainerStyle={s.scroll}> <Text style={s.h2}>Create</Text> <Text style={s.subText}>Choose what you want to publish.</Text> <View style={s.createGrid}> <CreateBtn icon="▶️" title="Short / Reel" sub="Max 1.5 min" color={C.purple} press={() => selectMedia("short")} /> <CreateBtn icon="▣" title="Long Video" sub="Full video" color={C.blue} press={() => selectMedia("long")} /> <CreateBtn icon="◎" title="Photo" sub="Post image" color={C.pink} press={() => selectMedia("photo")} /> <CreateBtn icon="●" title="Go Live" sub="Live setup" color="#E53935" press={() => setLiveSetup(true)} /> </View> {media && ( <View style={s.selected}> <View style={s.selectedHead}> <Text style={s.selectedTitle}> Selected{" "} {type === "long" ? "Long Video" : type === "short" ? "Short / Reel" : "Photo"} </Text> <Text style={s.ready}>✓ Ready</Text> </View> {type === "photo" ? ( <Image source={{ uri: media.uri }} style={s.previewImage} /> ) : ( <SelectedVideo uri={media.uri} /> )} <Text style={s.small}> {media.fileName || "Media selected successfully"} </Text> </View> )} <View style={s.form}> <Text style={s.field}>Caption</Text> <TextInput multiline style={s.caption} placeholder="Write something interesting..." value={caption} onChangeText={setCaption} /> <Option title="🏷️ Tag People" value={tag} press={() => { setPopup("tag"); setTemp(tag); }} /> <Option title="📍 Add Location" value={location} press={() => { setPopup("location"); setTemp(location); }} /> <Option title="# Add Topics" value={topics} press={() => { setPopup("topics"); setTemp(topics); }} /> <Option title="🖼️ Select Cover" value={cover ? "Cover selected ✓" : ""} press={selectCover} /> {cover && <Image source={{ uri: cover.uri }} style={s.cover} />} <Pressable style={s.publish
