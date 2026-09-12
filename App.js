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
  Dimensions,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHORT_HEIGHT = SCREEN_HEIGHT - 190;

const C = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
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

const demoStories = [
  {
    id: "story1",
    name: "Ravi",
    handle: "@ravi",
    category: "Music",
    emoji: "🎵",
    mediaType: "demo",
    text: "New music vibe 🎵",
  },
  {
    id: "story2",
    name: "Neha",
    handle: "@nehavlogs",
    category: "Travel",
    emoji: "✈️",
    mediaType: "demo",
    text: "Travel day ✈️",
  },
  {
    id: "story3",
    name: "Aman",
    handle: "@techaman",
    category: "Tech",
    emoji: "💡",
    mediaType: "demo",
    text: "Tech tip of the day 💡",
  },
  {
    id: "story4",
    name: "Meera",
    handle: "@meeradance",
    category: "Comedy",
    emoji: "😂",
    mediaType: "demo",
    text: "Fun moment 😂",
  },
];

const demoPosts = [
  {
    id: "1",
    name: "Ravi Creator",
    handle: "@ravi",
    title: "Delhi street food challenge 🔥",
    likes: 18400,
    following: false,
    liked: false,
    saved: false,
    comments: ["Nice video!"],
    mediaType: "demo",
    category: "Comedy",
  },
  {
    id: "2",
    name: "Neha Vlogs",
    handle: "@nehavlogs",
    title: "₹500 mein full day travel!",
    likes: 9300,
    following: true,
    liked: false,
    saved: false,
    comments: ["Amazing vlog"],
    mediaType: "demo",
    category: "Travel",
  },
  {
    id: "3",
    name: "Tech Aman",
    handle: "@techaman",
    title: "Best phone tricks you should know",
    likes: 7200,
    following: true,
    liked: false,
    saved: false,
    comments: [],
    mediaType: "demo",
    category: "Tech",
  },
];

const fmt = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
};

export default function App() {
  const [stage, setStage] = useState("login");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  const [tab, setTab] = useState("Home");
  const [posts, setPosts] = useState(demoPosts);
  const [createdPosts, setCreatedPosts] = useState([]);
  const [stories, setStories] = useState(demoStories);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentPost, setCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);

  const [loaded, setLoaded] = useState(false);

  const wallet = 1240;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (loaded) saveData();
  }, [
    loaded,
    stage,
    name,
    username,
    profilePhoto,
    posts,
    createdPosts,
    stories,
  ]);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem("earnzoData");

      if (saved) {
        const data = JSON.parse(saved);

        if (data.stage) setStage(data.stage);
        if (data.name) setName(data.name);
        if (data.username) setUsername(data.username);

        if (typeof data.profilePhoto === "string") {
          setProfilePhoto(data.profilePhoto);
        }

        if (Array.isArray(data.posts)) {
          setPosts(data.posts);
        }

        if (Array.isArray(data.createdPosts)) {
          setCreatedPosts(data.createdPosts);
        }

        if (Array.isArray(data.stories)) {
          setStories(data.stories);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoaded(true);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(
        "earnzoData",
        JSON.stringify({
          stage,
          name,
          username,
          profilePhoto,
          posts,
          createdPosts,
          stories,
        })
      );
    } catch (e) {
      console.log(e);
    }
  };

  if (stage === "login") {
    return (
      <AuthScreen
        title="Welcome to Earnzo"
        subtitle="Create • Connect • Earn"
        value={mobile}
        setValue={setMobile}
        placeholder="Mobile Number"
        keyboardType="phone-pad"
        button="Continue"
        note="Testing OTP: 1234"
        onPress={() => {
          if (mobile.length === 10) {
            setStage("otp");
          } else {
            Alert.alert("Enter valid 10-digit mobile number");
          }
        }}
      />
    );
  }

  if (stage === "otp") {
    return (
      <AuthScreen
        title="Verify OTP"
        subtitle={`OTP sent to +91 ${mobile}`}
        value={otp}
        setValue={setOtp}
        placeholder="Enter OTP"
        keyboardType="number-pad"
        button="Verify"
        note="Testing OTP: 1234"
        onPress={() => {
          if (otp === "1234") {
            setStage("profile");
          } else {
            Alert.alert("Wrong OTP", "Use 1234 for testing");
          }
        }}
      />
    );
  }

  if (stage === "profile") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.authWrap}>
          <Brand />

          <View style={styles.authCard}>
            <Text style={styles.authTitle}>Create Profile</Text>

            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder="Username"
              value={username}
              autoCapitalize="none"
              onChangeText={(t) =>
                setUsername(t.replace(/\s/g, "").toLowerCase())
              }
            />

            <Pressable
              style={styles.primary}
              onPress={() => {
                if (!name.trim() || !username.trim()) {
                  Alert.alert("Enter name and username");
                  return;
                }

                setStage("app");
              }}
            >
              <Text style={styles.primaryText}>Start Earnzo</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const openComments = (post) => {
    setCommentPost(post);
    setCommentText("");
    setCommentsOpen(true);
  };

  const sendComment = () => {
    if (!commentText.trim() || !commentPost) return;

    const text = commentText.trim();

    setPosts((old) =>
      old.map((p) =>
        p.id === commentPost.id
          ? {
              ...p,
              comments: [...(p.comments || []), text],
            }
          : p
      )
    );

    setCommentPost((old) =>
      old
        ? {
            ...old,
            comments: [...(old.comments || []), text],
          }
        : old
    );

    setCommentText("");
  };

  const addStory = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Photo/video access allow kare."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        quality: 0.9,
      });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];

    const type =
      asset.type === "video" ? "video" : "photo";

    const newStory = {
      id: `mystory-${Date.now()}`,
      name: name || "You",
      handle: `@${username || "you"}`,
      category: "Your Story",
      emoji: "⭐",
      mediaType: type,
      mediaUri: asset.uri,
      text: "Your Story",
      isMine: true,
    };

    setStories((old) => [
      newStory,
      ...old.filter((s) => !s.isMine),
    ]);

    Alert.alert(
      "Story Added ✅",
      "Your Story ab Creator Circles me dikh rahi hai."
    );
  };

  const openStory = (index) => {
    setStoryIndex(index);
    setStoryViewerOpen(true);
  };

  let page = null;

  if (tab === "Home") {
    page = (
      <Home
        posts={posts}
        setPosts={setPosts}
        stories={stories}
        addStory={addStory}
        openStory={openStory}
        openComments={openComments}
      />
    );
  }

  if (tab === "Shorts") {
    page = (
      <Shorts
        posts={posts}
        setPosts={setPosts}
        openComments={openComments}
      />
    );
  }

  if (tab === "Create") {
    page = (
      <Create
        name={name}
        username={username}
        posts={posts}
        setPosts={setPosts}
        createdPosts={createdPosts}
        setCreatedPosts={setCreatedPosts}
        goHome={() => setTab("Home")}
        goShorts={() => setTab("Shorts")}
      />
    );
  }

  if (tab === "Earn") {
    page = <Earn wallet={wallet} />;
  }

  if (tab === "Profile") {
    page = (
      <Profile
        name={name}
        username={username}
        profilePhoto={profilePhoto}
        setProfilePhoto={setProfilePhoto}
        createdPosts={createdPosts}
        wallet={wallet}
        followers={() => setFollowersOpen(true)}
        following={() => setFollowingOpen(true)}
        logout={async () => {
          await AsyncStorage.removeItem("earnzoData");

          setName("");
          setUsername("");
          setProfilePhoto("");
          setMobile("");
          setOtp("");
          setPosts(demoPosts);
          setCreatedPosts([]);
          setStories(demoStories);
          setTab("Home");
          setStage("login");
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle={
          tab === "Shorts"
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={
          tab === "Shorts"
            ? "#000000"
            : "#FFFFFF"
        }
      />

      {tab !== "Shorts" && (
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoBoxText}>EZ</Text>
            </View>

            <View>
              <Text style={styles.logoTitle}>Earnzo</Text>
              <Text style={styles.tagline}>
                Create • Connect • Earn
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              style={styles.wallet}
              onPress={() => setTab("Earn")}
            >
              <Text style={styles.walletText}>
                ₹{wallet}
              </Text>
            </Pressable>

            <Pressable
              style={styles.headerAvatar}
              onPress={() => setTab("Profile")}
            >
              {profilePhoto ? (
                <Image
                  source={{ uri: profilePhoto }}
                  style={styles.headerAvatarImage}
                />
              ) : (
                <Text style={styles.headerAvatarText}>
                  {(name || "E")[0].toUpperCase()}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      <View style={{ flex: 1 }}>{page}</View>

      <View style={styles.nav}>
        <Nav
          icon="⌂"
          label="Home"
          active={tab === "Home"}
          onPress={() => setTab("Home")}
        />

        <Nav
          icon="▶"
          label="Shorts"
          active={tab === "Shorts"}
          onPress={() => setTab("Shorts")}
        />

        <Nav
          icon="+"
          label="Create"
          active={tab === "Create"}
          onPress={() => setTab("Create")}
        />

        <Nav
          icon="₹"
          label="Earn"
          active={tab === "Earn"}
          onPress={() => setTab("Earn")}
        />

        <Nav
          icon="◉"
          label="Profile"
          active={tab === "Profile"}
          onPress={() => setTab("Profile")}
        />
      </View>

      <Modal
        visible={commentsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentsOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBg}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
        >
          <View style={styles.sheet}>
            <View style={styles.sheetTop}>
              <Text style={styles.sheetTitle}>
                Comments
              </Text>

              <Pressable
                onPress={() =>
                  setCommentsOpen(false)
                }
              >
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 300 }}
            >
              {(commentPost?.comments || []).map(
                (comment, i) => (
                  <View
                    key={i}
                    style={styles.comment}
                  >
                    <View
                      style={styles.commentAvatar}
                    >
                      <Text
                        style={
                          styles.commentAvatarText
                        }
                      >
                        U
                      </Text>
                    </View>

                    <View
                      style={styles.commentBubble}
                    >
                      <Text style={styles.bold}>
                        User
                      </Text>
                      <Text>{comment}</Text>
                    </View>
                  </View>
                )
              )}

              {(commentPost?.comments || [])
                .length === 0 && (
                <Text style={styles.empty}>
                  No comments yet
                </Text>
              )}
            </ScrollView>

            <View
              style={styles.commentInputRow}
            >
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                value={commentText}
                onChangeText={setCommentText}
              />

              <Pressable
                style={styles.send}
                onPress={sendComment}
              >
                <Text style={styles.sendText}>
                  Send
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <People
        visible={followersOpen}
        title="Followers"
        close={() =>
          setFollowersOpen(false)
        }
      />

      <People
        visible={followingOpen}
        title="Following"
        close={() =>
          setFollowingOpen(false)
        }
      />

      <StoryViewer
        visible={storyViewerOpen}
        stories={stories}
        index={storyIndex}
        setIndex={setStoryIndex}
        close={() =>
          setStoryViewerOpen(false)
        }
      />
    </SafeAreaView>
  );
}

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.bigLogo}>
        <Text style={styles.bigLogoText}>
          EZ
        </Text>
      </View>

      <Text style={styles.brandName}>
        Earnzo
      </Text>

      <Text style={styles.brandTag}>
        Create • Connect • Earn
      </Text>
    </View>
  );
}

function AuthScreen({
  title,
  subtitle,
  value,
  setValue,
  placeholder,
  keyboardType,
  button,
  onPress,
  note,
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.authWrap}>
        <Brand />

        <View style={styles.authCard}>
          <Text style={styles.authTitle}>
            {title}
          </Text>

          <Text style={styles.authSub}>
            {subtitle}
          </Text>

          <TextInput
            style={styles.input}
            placeholder={placeholder}
            keyboardType={keyboardType}
            value={value}
            onChangeText={setValue}
          />

          <Pressable
            style={styles.primary}
            onPress={onPress}
          >
            <Text style={styles.primaryText}>
              {button}
            </Text>
          </Pressable>

          <Text style={styles.note}>{note}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Home({
  posts,
  setPosts,
  stories,
  addStory,
  openStory,
  openComments,
}) {
  const [activeVideo, setActiveVideo] =
    useState(null);

  const [feed, setFeed] =
    useState("For You");

  const [category, setCategory] =
    useState("All");

  let visible = posts;

  if (feed === "Following") {
    visible = visible.filter(
      (p) => p.following
    );
  }

  if (category !== "All") {
    visible = visible.filter(
      (p) => p.category === category
    );
  }

  const like = (id) => {
    setPosts((old) =>
      old.map((p) =>
        p.id === id
          ? {
              ...p,
              liked: !p.liked,
              likes:
                p.likes +
                (p.liked ? -1 : 1),
            }
          : p
      )
    );
  };

  const follow = (id) => {
    setPosts((old) =>
      old.map((p) =>
        p.id === id
          ? {
              ...p,
              following: !p.following,
            }
          : p
      )
    );
  };

  const save = (id) => {
    setPosts((old) =>
      old.map((p) =>
        p.id === id
          ? {
              ...p,
              saved: !p.saved,
            }
          : p
      )
    );
  };

  const categoryItems = [
    ["🎵", "Music"],
    ["😂", "Comedy"],
    ["💡", "Tech"],
    ["✈️", "Travel"],
    ["💪", "Fitness"],
  ];

  const mine = stories.find(
    (s) => s.isMine
  );

  const otherStories =
    stories.filter((s) => !s.isMine);

  return (
    <ScrollView
      contentContainerStyle={styles.page}
    >
      <View style={styles.pulse}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pulseSmall}>
            EARNZO PULSE
          </Text>

          <Text style={styles.pulseTitle}>
            What's your vibe today?
          </Text>

          <Text style={styles.pulseText}>
            Discover creators, videos and new ideas.
          </Text>
        </View>

        <View style={styles.pulseLogo}>
          <Text style={styles.pulseLogoText}>
            EZ
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Creator Circles
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.circles}>
          <Pressable
            style={styles.circleItem}
            onPress={addStory}
          >
            <View
              style={[
                styles.circle,
                mine && styles.circleActive,
              ]}
            >
              {mine?.mediaType ===
                "photo" &&
              mine.mediaUri ? (
                <Image
                  source={{
                    uri: mine.mediaUri,
                  }}
                  style={styles.circleImage}
                />
              ) : (
                <Text style={styles.circleIcon}>
                  +
                </Text>
              )}
            </View>

            <Text style={styles.circleText}>
              Your Story
            </Text>
          </Pressable>

          {otherStories.map((story) => (
            <Pressable
              key={story.id}
              style={styles.circleItem}
              onPress={() =>
                openStory(
                  stories.indexOf(story)
                )
              }
            >
              <View style={styles.circle}>
                <Text style={styles.circleIcon}>
                  {story.emoji || "⭐"}
                </Text>
              </View>

              <Text style={styles.circleText}>
                {story.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          marginTop: 4,
          marginBottom: 12,
        }}
      >
        <View style={styles.categoryRow}>
          <Pressable
            style={[
              styles.categoryChip,
              category === "All" &&
                styles.categoryChipOn,
            ]}
            onPress={() =>
              setCategory("All")
            }
          >
            <Text
              style={[
                styles.categoryText,
                category === "All" && {
                  color: "#fff",
                },
              ]}
            >
              All
            </Text>
          </Pressable>

          {categoryItems.map(
            ([icon, label]) => (
              <Pressable
                key={label}
                style={[
                  styles.categoryChip,
                  category === label &&
                    styles.categoryChipOn,
                ]}
                onPress={() =>
                  setCategory(label)
                }
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === label && {
                      color: "#fff",
                    },
                  ]}
                >
                  {icon} {label}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </ScrollView>

      <View style={styles.feedTabs}>
        {["For You", "Following"].map(
          (item) => (
            <Pressable
              key={item}
              style={[
                styles.feedTab,
                feed === item &&
                  styles.feedTabActive,
              ]}
              onPress={() =>
                setFeed(item)
              }
            >
              <Text
                style={[
                  styles.feedTabText,
                  feed === item && {
                    color: "#FFFFFF",
                  },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )
        )}
      </View>

      {visible.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.bold}>
            Is category me abhi content nahi hai.
          </Text>

          <Text style={styles.muted}>
            Create tab se content upload kare.
          </Text>
        </View>
      ) : null}

      {visible.map((post) => (
        <View
          key={post.id}
          style={styles.post}
        >
          <View style={styles.postHeader}>
            <View
              style={styles.creatorAvatar}
            >
              <Text
                style={
                  styles.creatorAvatarText
                }
              >
                {post.name[0]}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.bold}>
                {post.name}
              </Text>

              <Text style={styles.muted}>
                {post.handle}
              </Text>
            </View>

            <Pressable
              style={[
                styles.follow,
                post.following &&
                  styles.following,
              ]}
              onPress={() =>
                follow(post.id)
              }
            >
              <Text
                style={[
                  styles.followText,
                  post.following && {
                    color: C.purple,
                  },
                ]}
              >
                {post.following
                  ? "Following"
                  : "Follow"}
              </Text>
            </Pressable>
          </View>

          <FeedMedia
            post={post}
            activeVideo={activeVideo}
            setActiveVideo={setActiveVideo}
          />

          <Text style={styles.postTitle}>
            {post.title}
          </Text>

          <View style={styles.vibe}>
            <Text style={styles.vibeText}>
              VIBE
            </Text>

            {["🔥", "😍", "👏", "💡"].map(
              (v) => (
                <View
                  key={v}
                  style={styles.vibeBubble}
                >
                  <Text>{v}</Text>
                </View>
              )
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() =>
                like(post.id)
              }
            >
              <Text
                style={[
                  styles.action,
                  post.liked && {
                    color: C.pink,
                  },
                ]}
              >
                {post.liked ? "♥" : "♡"}{" "}
                {fmt(post.likes)}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                openComments(post)
              }
            >
              <Text style={styles.action}>
                💬{" "}
                {(post.comments || []).length}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                save(post.id)
              }
            >
              <Text style={styles.action}>
                {post.saved
                  ? "🔖 Saved"
                  : "🔖 Save"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Share.share({
                  message: `${post.name} on Earnzo\n${post.title}`,
                })
              }
            >
              <Text style={styles.action}>
                ↗ Share
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function FeedMedia({
  post,
  activeVideo,
  setActiveVideo,
}) {
  if (
    post.mediaType === "photo" &&
    post.mediaUri
  ) {
    return (
      <Image
        source={{ uri: post.mediaUri }}
        style={styles.feedImage}
      />
    );
  }

  if (
    (post.mediaType === "short" ||
      post.mediaType === "long") &&
    post.mediaUri
  ) {
    if (activeVideo !== post.id) {
      return (
        <Pressable
          style={styles.youtubeFrame}
          onPress={() =>
            setActiveVideo(post.id)
          }
        >
          {post.coverUri ? (
            <Image
              source={{
                uri: post.coverUri,
              }}
              style={styles.poster}
            />
          ) : (
            <PausedVideoThumbnail
              uri={post.mediaUri}
            />
          )}

          <View style={styles.play}>
            <Text style={styles.playText}>
              ▶
            </Text>
          </View>
        </Pressable>
      );
    }

    return (
      <FeedVideo uri={post.mediaUri} />
    );
  }

  return (
    <View style={styles.youtubeFrame}>
      <View style={styles.demoThumb}>
        <View style={styles.play}>
          <Text style={styles.playText}>
            ▶
          </Text>
        </View>

        <Text style={styles.demoThumbText}>
          Earnzo Video
        </Text>
      </View>
    </View>
  );
}

function PausedVideoThumbnail({ uri }) {
  const player = useVideoPlayer(
    uri,
    (p) => {
      p.loop = false;
    }
  );

  useEffect(() => {
    try {
      player.pause();
    } catch {}
  }, [player]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFillObject}
      nativeControls={false}
      contentFit="cover"
    />
  );
}

function FeedVideo({ uri }) {
  const player = useVideoPlayer(
    uri,
    (p) => {
      p.loop = false;
    }
  );

  useEffect(() => {
    try {
      player.play();
    } catch {}

    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  return (
    <View style={styles.youtubeFrame}>
      <VideoView
        player={player}
        style={styles.feedVideo}
        nativeControls
        contentFit="contain"
        allowsFullscreen
      />
    </View>
  );
}

function Shorts({
  posts,
  setPosts,
  openComments,
}) {
  const shorts = posts.filter(
    (p) =>
      p.mediaType === "short" &&
      p.mediaUri
  );

  if (shorts.length === 0) {
    return (
      <View style={styles.shortsScreen}>
        <View
          style={styles.shortPlaceholder}
        >
          <View style={styles.bigShortLogo}>
            <Text
              style={
                styles.bigShortLogoText
              }
            >
              EZ
            </Text>
          </View>

          <Text
            style={
              styles.shortPlaceholderTitle
            }
          >
            Earnzo Shorts
          </Text>

          <Text
            style={
              styles.shortPlaceholderText
            }
          >
            Create tab se Short upload kare.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.shortsScreen}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      decelerationRate="fast"
    >
      {shorts.map((post) => (
        <ShortPage
          key={post.id}
          post={post}
          setPosts={setPosts}
          openComments={openComments}
        />
      ))}
    </ScrollView>
  );
}

function ShortPage({
  post,
  setPosts,
  openComments,
}) {
  const like = () => {
    setPosts((old) =>
      old.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked: !p.liked,
              likes:
                p.likes +
                (p.liked ? -1 : 1),
            }
          : p
      )
    );
  };

  const save = () => {
    setPosts((old) =>
      old.map((p) =>
        p.id === post.id
          ? {
              ...p,
              saved: !p.saved,
            }
          : p
      )
    );
  };

  return (
    <View style={styles.shortPage}>
      <FullShortVideo
        uri={post.mediaUri}
      />

      <View style={styles.shortHeader}>
        <View
          style={styles.shortHeaderLogo}
        >
          <Text
            style={
              styles.shortHeaderLogoText
            }
          >
            EZ
          </Text>
        </View>

        <Text
          style={styles.shortHeaderText}
        >
          For You
        </Text>

        <Text
          style={
            styles.shortHeaderMuted
          }
        >
          Following
        </Text>
      </View>

      <View style={styles.shortDetails}>
        <Text
          style={styles.shortCreator}
        >
          {post.handle}
        </Text>

        <Text
          style={styles.shortCaption}
        >
          {post.title}
        </Text>

        <Text style={styles.shortMusic}>
          ♫ Earnzo Original Sound
        </Text>
      </View>

      <View style={styles.shortButtons}>
        <ShortButton
          icon={post.liked ? "♥" : "♡"}
          text={fmt(post.likes || 0)}
          onPress={like}
        />

        <ShortButton
          icon="💬"
          text={`${(post.comments || []).length}`}
          onPress={() =>
            openComments(post)
          }
        />

        <ShortButton
          icon="↗"
          text="Share"
          onPress={() =>
            Share.share({
              message: `${post.name}\n${post.title}`,
            })
          }
        />

        <ShortButton
          icon={
            post.saved ? "🔖" : "◇"
          }
          text={
            post.saved
              ? "Saved"
              : "Save"
          }
          onPress={save}
        />
      </View>
    </View>
  );
}

function FullShortVideo({ uri }) {
  const player = useVideoPlayer(
    uri,
    (p) => {
      p.loop = true;
    }
  );

  useEffect(() => {
    try {
      player.play();
    } catch {}

    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={
        StyleSheet.absoluteFillObject
      }
      nativeControls={false}
      contentFit="cover"
    />
  );
}

function ShortButton({
  icon,
  text,
  onPress,
}) {
  return (
    <Pressable
      style={styles.shortButton}
      onPress={onPress}
    >
      <View
        style={styles.shortButtonCircle}
      >
        <Text
          style={styles.shortButtonIcon}
        >
          {icon}
        </Text>
      </View>

      <Text
        style={styles.shortButtonText}
      >
        {text}
      </Text>
    </Pressable>
  );
}

function StoryViewer({
  visible,
  stories,
  index,
  setIndex,
  close,
}) {
  const story = stories[index];

  if (!story) return null;

  const next = () => {
    if (
      index <
      stories.length - 1
    ) {
      setIndex(index + 1);
    } else {
      close();
    }
  };

  const prev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.storyViewer}>
        {story.mediaType === "photo" &&
        story.mediaUri ? (
          <Image
            source={{
              uri: story.mediaUri,
            }}
            style={styles.storyMedia}
            resizeMode="cover"
          />
        ) : story.mediaType ===
            "video" &&
          story.mediaUri ? (
          <StoryVideo
            uri={story.mediaUri}
          />
        ) : (
          <View style={styles.storyDemo}>
            <Text
              style={
                styles.storyDemoEmoji
              }
            >
              {story.emoji || "⭐"}
            </Text>

            <Text
              style={
                styles.storyDemoTitle
              }
            >
              {story.text}
            </Text>
          </View>
        )}

        <View style={styles.storyTop}>
          <View
            style={
              styles.storyProgressRow
            }
          >
            {stories.map((s, i) => (
              <View
                key={s.id}
                style={[
                  styles.storyProgress,
                  i <= index &&
                    styles.storyProgressOn,
                ]}
              />
            ))}
          </View>

          <View
            style={styles.storyUserRow}
          >
            <View
              style={
                styles.storyUserAvatar
              }
            >
              <Text
                style={
                  styles.storyUserAvatarText
                }
              >
                {(story.name || "U")[0]}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={
                  styles.storyUserName
                }
              >
                {story.name}
              </Text>

              <Text
                style={
                  styles.storyUserHandle
                }
              >
                {story.handle}
              </Text>
            </View>

            <Pressable onPress={close}>
              <Text
                style={styles.storyClose}
              >
                ✕
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.storyPrevArea}
          onPress={prev}
        />

        <Pressable
          style={styles.storyNextArea}
          onPress={next}
        />
      </View>
    </Modal>
  );
}

function StoryVideo({ uri }) {
  const player = useVideoPlayer(
    uri,
    (p) => {
      p.loop = true;
    }
  );

  useEffect(() => {
    try {
      player.play();
    } catch {}

    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={
        StyleSheet.absoluteFillObject
      }
      nativeControls={false}
      contentFit="cover"
    />
  );
}

function Create({
  name,
  username,
  posts,
  setPosts,
  createdPosts,
  setCreatedPosts,
  goHome,
  goShorts,
}) {
  const [media, setMedia] =
    useState(null);

  const [type, setType] =
    useState("short");

  const [caption, setCaption] =
    useState("");

  const [cover, setCover] =
    useState(null);

  const [location, setLocation] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [category, setCategory] =
    useState("Comedy");

  const [uploading, setUploading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const pick = async (
    selectedType
  ) => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Media permission required"
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          selectedType === "photo"
            ? ["images"]
            : ["videos"],
        quality: 0.9,
      });

    if (
      result.canceled ||
      !result.assets?.[0]
    ) {
      return;
    }

    const asset = result.assets[0];

    if (
      selectedType === "short" &&
      asset.duration &&
      asset.duration > 90000
    ) {
      Alert.alert(
        "Video too long",
        "Short maximum 1.5 minutes hona chahiye."
      );
      return;
    }

    setType(selectedType);
    setMedia(asset);
  };

  const pickCover = async () => {
    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.9,
      });

    if (
      !result.canceled &&
      result.assets?.[0]
    ) {
      setCover(result.assets[0]);
    }
  };

  const publish = async () => {
    if (!media) {
      Alert.alert(
        "Pehle photo/video select kare"
      );
      return;
    }

    if (!caption.trim()) {
      Alert.alert(
        "Caption/Title likhe"
      );
      return;
    }

    setUploading(true);
    setProgress(0);

    const steps = [
      10,
      25,
      40,
      55,
      70,
      85,
      100,
    ];

    for (const p of steps) {
      await new Promise((resolve) =>
        setTimeout(resolve, 200)
      );

      setProgress(p);
    }

    const newPost = {
      id: Date.now().toString(),
      name:
        name || "Creator",
      handle: `@${
        username || "creator"
      }`,
      title: caption.trim(),
      likes: 0,
      comments: [],
      following: false,
      liked: false,
      saved: false,
      mediaType: type,
      mediaUri: media.uri,
      coverUri: cover?.uri || "",
      location,
      tags,
      category,
    };

    setPosts([
      newPost,
      ...posts,
    ]);

    setCreatedPosts([
      newPost,
      ...createdPosts,
    ]);

    setMedia(null);
    setCaption("");
    setCover(null);
    setLocation("");
    setTags("");
    setProgress(0);
    setUploading(false);

    Alert.alert(
      "Published ✅",
      type === "short"
        ? "Short publish ho gaya. Shorts me swipe karke sab videos dekh sakte ho."
        : "Post publish ho gaya.",
      [
        {
          text:
            type === "short"
              ? "View Shorts"
              : "View Home",
          onPress:
            type === "short"
              ? goShorts
              : goHome,
        },
      ]
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.page}
    >
      <Text
        style={styles.sectionTitle}
      >
        Create Studio
      </Text>

      <Text style={styles.sub}>
        Share your creativity with Earnzo.
      </Text>

      <View style={styles.createGrid}>
        <CreateCard
          icon="▶"
          title="Short / Reel"
          sub="Max 1.5 min"
          onPress={() =>
            pick("short")
          }
        />

        <CreateCard
          icon="▣"
          title="Long Video"
          sub="YouTube style"
          onPress={() =>
            pick("long")
          }
        />

        <CreateCard
          icon="◎"
          title="Photo"
          sub="Social post"
          onPress={() =>
            pick("photo")
          }
        />

        <CreateCard
          icon="●"
          title="Go Live"
          sub="Coming soon"
          onPress={() =>
            Alert.alert(
              "Earnzo Live",
              "Real live streaming backend connect hone ke baad chalegi."
            )
          }
        />
      </View>

      {media && (
        <View
          style={styles.createForm}
        >
          <Text style={styles.bold}>
            Selected Media
          </Text>

          {type === "photo" ? (
            <Image
              source={{
                uri: media.uri,
              }}
              style={styles.preview}
            />
          ) : (
            <VideoPreview
              uri={media.uri}
            />
          )}
        </View>
      )}

      <View style={styles.createForm}>
        <Text style={styles.bold}>
          Post Details
        </Text>

        <TextInput
          style={styles.captionInput}
          multiline
          placeholder="Caption / Title..."
          value={caption}
          onChangeText={setCaption}
        />

        <TextInput
          style={styles.input}
          placeholder="Tags / #hashtags"
          value={tags}
          onChangeText={setTags}
        />

        <TextInput
          style={[
            styles.input,
            { marginTop: 10 },
          ]}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />

        <Text
          style={[
            styles.bold,
            {
              marginTop: 14,
              marginBottom: 8,
            },
          ]}
        >
          Category
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View
            style={styles.categoryRow}
          >
            {[
              "Music",
              "Comedy",
              "Tech",
              "Travel",
              "Fitness",
            ].map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.categoryChip,
                  category === item &&
                    styles.categoryChipOn,
                ]}
                onPress={() =>
                  setCategory(item)
                }
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === item && {
                      color: "#fff",
                    },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {type !== "photo" && (
          <Pressable
            style={styles.coverButton}
            onPress={pickCover}
          >
            <Text
              style={
                styles.coverButtonText
              }
            >
              {cover
                ? "✓ Cover Selected"
                : "Select Cover / Thumbnail"}
            </Text>
          </Pressable>
        )}

        {cover && (
          <Image
            source={{
              uri: cover.uri,
            }}
            style={styles.coverImage}
          />
        )}

        {uploading && (
          <View
            style={styles.uploadArea}
          >
            <View
              style={styles.progressTop}
            >
              <Text style={styles.bold}>
                Uploading...
              </Text>

              <Text
                style={
                  styles.progressText
                }
              >
                {progress}%
              </Text>
            </View>

            <View
              style={styles.progressBar}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <Pressable
          style={[
            styles.primary,
            uploading && {
              opacity: 0.5,
            },
          ]}
          disabled={uploading}
          onPress={publish}
        >
          <Text
            style={styles.primaryText}
          >
            {uploading
              ? `Uploading ${progress}%`
              : "Publish Now"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function VideoPreview({ uri }) {
  const player =
    useVideoPlayer(uri);

  return (
    <VideoView
      player={player}
      style={styles.previewVideo}
      nativeControls
      contentFit="contain"
    />
  );
}

function CreateCard({
  icon,
  title,
  sub,
  onPress,
}) {
  return (
    <Pressable
      style={styles.createCard}
      onPress={onPress}
    >
      <View
        style={styles.createIconBox}
      >
        <Text
          style={styles.createIcon}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.bold}>
        {title}
      </Text>

      <Text style={styles.muted}>
        {sub}
      </Text>
    </Pressable>
  );
}

function Earn({ wallet }) {
  return (
    <ScrollView
      contentContainerStyle={styles.page}
    >
      <View style={styles.earnHero}>
        <Text style={styles.earnLabel}>
          CREATOR WALLET
        </Text>

        <Text style={styles.earnAmount}>
          ₹{wallet}
        </Text>

        <Text
          style={
            styles.earnDescription
          }
        >
          Your Earnzo earning dashboard
        </Text>

        <Pressable
          style={styles.withdraw}
          onPress={() =>
            Alert.alert(
              "Withdraw",
              "Real withdrawal ke liye KYC, UPI/Bank aur payment backend connect karna hoga."
            )
          }
        >
          <Text
            style={styles.primaryText}
          >
            Withdraw
          </Text>
        </Pressable>
      </View>

      <Text
        style={styles.sectionTitle}
      >
        Ways to Earn
      </Text>

      <View style={styles.earnGrid}>
        {[
          ["🎯", "Brand Tasks"],
          ["📈", "Creator Rewards"],
          ["🛍️", "Affiliate"],
          ["🎁", "Live Gifts"],
          ["⭐", "Membership"],
          ["🤝", "Referral"],
        ].map(([icon, title]) => (
          <Pressable
            key={title}
            style={styles.earnCard}
            onPress={() =>
              Alert.alert(
                title,
                "Ye earning module backend connect hone ke baad real transaction ke saath chalega."
              )
            }
          >
            <Text style={styles.earnIcon}>
              {icon}
            </Text>

            <Text style={styles.bold}>
              {title}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function Profile({
  name,
  username,
  profilePhoto,
  setProfilePhoto,
  createdPosts,
  wallet,
  followers,
  following,
  logout,
}) {
  const [photoMenu, setPhotoMenu] =
    useState(false);

  const [viewPhoto, setViewPhoto] =
    useState(false);

  const choosePhoto = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo permission required"
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

    if (
      !result.canceled &&
      result.assets?.[0]
    ) {
      setProfilePhoto(
        result.assets[0].uri
      );
    }

    setPhotoMenu(false);
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.page}
      >
        <View
          style={styles.profileCard}
        >
          <Pressable
            onPress={() =>
              setPhotoMenu(true)
            }
          >
            {profilePhoto ? (
              <Image
                source={{
                  uri: profilePhoto,
                }}
                style={
                  styles.profilePhoto
                }
              />
            ) : (
              <View
                style={
                  styles.profileFallback
                }
              >
                <Text
                  style={
                    styles.profileFallbackText
                  }
                >
                  {(name || "E")[0].toUpperCase()}
                </Text>
              </View>
            )}

            <View
              style={styles.photoEdit}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                }}
              >
                +
              </Text>
            </View>
          </Pressable>

          <Text
            style={styles.profileName}
          >
            {name || "Creator"}
          </Text>

          <Text
            style={styles.profileUser}
          >
            @{username || "creator"}
          </Text>

          <Text
            style={styles.profileBio}
          >
            Creator on Earnzo • Create • Connect • Earn
          </Text>
        </View>

        <View style={styles.stats}>
          <Stat
            value={createdPosts.length}
            label="Posts"
          />

          <Stat
            value="12.8K"
            label="Followers"
            onPress={followers}
          />

          <Stat
            value="438"
            label="Following"
            onPress={following}
          />

          <Stat
            value={`₹${wallet}`}
            label="Earned"
          />
        </View>

        <View
          style={styles.profileButtons}
        >
          <Pressable
            style={
              styles.profileButton
            }
            onPress={() =>
              Alert.alert(
                "Edit Profile",
                "Profile edit next version me backend ke saath aur detail me chalega."
              )
            }
          >
            <Text
              style={
                styles.profileButtonText
              }
            >
              Edit Profile
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.profileButton
            }
            onPress={() =>
              Share.share({
                message: `Follow @${username} on Earnzo`,
              })
            }
          >
            <Text
              style={
                styles.profileButtonText
              }
            >
              Share Profile
            </Text>
          </Pressable>
        </View>

        <Text
          style={styles.sectionTitle}
        >
          Your Content
        </Text>

        {createdPosts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text
              style={{
                fontSize: 34,
              }}
            >
              +
            </Text>

            <Text style={styles.bold}>
              No posts yet
            </Text>

            <Text style={styles.muted}>
              Create tab se apna first post upload kare.
            </Text>
          </View>
        ) : (
          createdPosts.map(
            (post) => (
              <View
                key={post.id}
                style={styles.myPost}
              >
                {post.mediaType ===
                "photo" ? (
                  <Image
                    source={{
                      uri: post.mediaUri,
                    }}
                    style={
                      styles.myPostImage
                    }
                  />
                ) : (
                  <View
                    style={
                      styles.myPostVideo
                    }
                  >
                    <Text
                      style={{
                        fontSize: 25,
                      }}
                    >
                      ▶
                    </Text>
                  </View>
                )}

                <View
                  style={{ flex: 1 }}
                >
                  <Text
                    style={styles.bold}
                  >
                    {post.title}
                  </Text>

                  <Text
                    style={styles.muted}
                  >
                    {post.mediaType ===
                    "short"
                      ? "Short"
                      : post.mediaType ===
                        "long"
                      ? "Long Video"
                      : "Photo"}
                  </Text>
                </View>
              </View>
            )
          )
        )}

        <Pressable
          style={styles.logout}
          onPress={logout}
        >
          <Text
            style={styles.logoutText}
          >
            Logout
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={photoMenu}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setPhotoMenu(false)
        }
      >
        <View style={styles.modalBg}>
          <View style={styles.sheet}>
            <View
              style={styles.sheetTop}
            >
              <Text
                style={styles.sheetTitle}
              >
                Profile Photo
              </Text>

              <Pressable
                onPress={() =>
                  setPhotoMenu(false)
                }
              >
                <Text style={styles.close}>
                  ✕
                </Text>
              </Pressable>
            </View>

            {!profilePhoto ? (
              <Menu
                title="Add Photo"
                onPress={choosePhoto}
              />
            ) : (
              <>
                <Menu
                  title="View Photo"
                  onPress={() => {
                    setPhotoMenu(false);
                    setViewPhoto(true);
                  }}
                />

                <Menu
                  title="Change Photo"
                  onPress={choosePhoto}
                />

                <Menu
                  title="Remove Photo"
                  danger
                  onPress={() => {
                    setProfilePhoto("");
                    setPhotoMenu(false);
                  }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={viewPhoto}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setViewPhoto(false)
        }
      >
        <View
          style={styles.photoViewer}
        >
          <Pressable
            style={styles.photoClose}
            onPress={() =>
              setViewPhoto(false)
            }
          >
            <Text
              style={
                styles.photoCloseText
              }
            >
              ✕
            </Text>
          </Pressable>

          {profilePhoto ? (
            <Image
              source={{
                uri: profilePhoto,
              }}
              style={styles.fullPhoto}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </>
  );
}

function Menu({
  title,
  onPress,
  danger,
}) {
  return (
    <Pressable
      style={styles.menu}
      onPress={onPress}
    >
      <Text
        style={[
          styles.menuText,
          danger && {
            color: C.pink,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function Stat({
  value,
  label,
  onPress,
}) {
  const inside = (
    <>
      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={styles.stat}
        onPress={onPress}
      >
        {inside}
      </Pressable>
    );
  }

  return (
    <View style={styles.stat}>
      {inside}
    </View>
  );
}

function People({
  visible,
  title,
  close,
}) {
  const people = [
    ["Neha Vlogs", "@nehavlogs"],
    ["Ravi Creator", "@ravi"],
    ["Tech Aman", "@techaman"],
    ["Meera Dance", "@meeradance"],
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <View style={styles.modalBg}>
        <View style={styles.sheet}>
          <View
            style={styles.sheetTop}
          >
            <Text
              style={styles.sheetTitle}
            >
              {title}
            </Text>

            <Pressable
              onPress={close}
            >
              <Text style={styles.close}>
                ✕
              </Text>
            </Pressable>
          </View>

          {people.map(
            ([personName, user]) => (
              <View
                key={user}
                style={styles.person}
              >
                <View
                  style={
                    styles.creatorAvatar
                  }
                >
                  <Text
                    style={
                      styles.creatorAvatarText
                    }
                  >
                    {personName[0]}
                  </Text>
                </View>

                <View
                  style={{ flex: 1 }}
                >
                  <Text
                    style={styles.bold}
                  >
                    {personName}
                  </Text>

                  <Text
                    style={styles.muted}
                  >
                    {user}
                  </Text>
                </View>

                <Pressable
                  style={styles.follow}
                >
                  <Text
                    style={
                      styles.followText
                    }
                  >
                    Follow
                  </Text>
                </Pressable>
              </View>
            )
          )}
        </View>
      </View>
    </Modal>
  );
}

function Nav({
  icon,
  label,
  active,
  onPress,
}) {
  return (
    <Pressable
      style={styles.navItem}
      onPress={onPress}
    >
      <View
        style={[
          styles.navIcon,
          active && {
            backgroundColor: C.purple,
          },
        ]}
      >
        <Text
          style={[
            styles.navIconText,
            active && {
              color: "#FFFFFF",
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text
        style={[
          styles.navLabel,
          active && {
            color: C.purple,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
    paddingTop:
      Platform.OS === "android"
        ? StatusBar.currentHeight
        : 0,
  },

  header: {
    minHeight: 76,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  logoBoxText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  logoTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text,
  },

  tagline: {
    fontSize: 10,
    color: C.muted,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  wallet: {
    backgroundColor: C.soft,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 12,
    marginRight: 8,
  },

  walletText: {
    color: C.purple,
    fontWeight: "900",
  },

  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.dark,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  headerAvatarImage: {
    width: "100%",
    height: "100%",
  },

  headerAvatarText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  nav: {
    minHeight: 108,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: C.line,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 8,
    paddingBottom:
      Platform.OS === "android"
        ? 42
        : 10,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
  },

  navIcon: {
    width: 40,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  navIconText: {
    color: C.text,
    fontSize: 18,
    fontWeight: "900",
  },

  navLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },

  page: {
    padding: 14,
    paddingBottom: 30,
  },

  pulse: {
    backgroundColor: C.dark,
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  pulseSmall: {
    color: "#B6A8FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  pulseTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },

  pulseText: {
    color: "#C4C5CC",
    marginTop: 5,
    fontSize: 12,
  },

  pulseLogo: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  pulseLogoText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  sectionTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
  },

  circles: {
    flexDirection: "row",
    paddingBottom: 12,
  },

  circleItem: {
    width: 70,
    alignItems: "center",
  },

  circle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: C.purple,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  circleActive: {
    borderColor: C.pink,
  },

  circleImage: {
    width: "100%",
    height: "100%",
  },

  circleIcon: {
    fontSize: 23,
  },

  circleText: {
    color: C.text,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 5,
  },

  categoryRow: {
    flexDirection: "row",
  },

  categoryChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginRight: 8,
  },

  categoryChipOn: {
    backgroundColor: C.purple,
    borderColor: C.purple,
  },

  categoryText: {
    color: C.text,
    fontWeight: "800",
    fontSize: 12,
  },

  feedTabs: {
    flexDirection: "row",
    marginBottom: 12,
  },

  feedTab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },

  feedTabActive: {
    backgroundColor: C.purple,
  },

  feedTabText: {
    fontWeight: "900",
    color: C.text,
  },

  post: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.line,
  },

  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  creatorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  creatorAvatarText: {
    color: C.purple,
    fontWeight: "900",
  },

  bold: {
    color: C.text,
    fontWeight: "900",
  },

  muted: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },

  follow: {
    backgroundColor: C.purple,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  following: {
    backgroundColor: C.soft,
  },

  followText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 11,
  },

  feedImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 18,
  },

  youtubeFrame: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 18,
    backgroundColor: "#000000",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  poster: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  demoThumb: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#12131A",
    alignItems: "center",
    justifyContent: "center",
  },

  demoThumbText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontWeight: "800",
  },

  play: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },

  playText: {
    color: "#FFFFFF",
    fontSize: 25,
    marginLeft: 3,
  },

  feedVideo: {
    width: "100%",
    height: "100%",
  },

  postTitle: {
    color: C.text,
    fontWeight: "800",
    marginTop: 10,
  },

  vibe: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  vibeText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "900",
    marginRight: 6,
  },

  vibeBubble: {
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 5,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.line,
    marginTop: 10,
    paddingTop: 11,
  },

  action: {
    color: C.text,
    fontWeight: "800",
    fontSize: 11,
  },

  shortsScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },

  shortPage: {
    height: SHORT_HEIGHT,
    backgroundColor: "#000000",
    overflow: "hidden",
  },

  shortPlaceholder: {
    flex: 1,
    backgroundColor: "#101118",
    alignItems: "center",
    justifyContent: "center",
  },

  bigShortLogo: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },

  bigShortLogoText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },

  shortPlaceholderTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 16,
  },

  shortPlaceholderText: {
    color: "#BFC0C7",
    marginTop: 7,
  },

  shortHeader: {
    position: "absolute",
    top: 15,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 4,
  },

  shortHeaderLogo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  shortHeaderLogoText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  shortHeaderText: {
    color: "#FFFFFF",
    fontWeight: "900",
    marginRight: 16,
  },

  shortHeaderMuted: {
    color: "#C7C8CE",
    fontWeight: "700",
  },

  shortDetails: {
    position: "absolute",
    left: 16,
    right: 88,
    bottom: 28,
    zIndex: 4,
  },

  shortCreator: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  shortCaption: {
    color: "#FFFFFF",
    marginTop: 6,
    lineHeight: 20,
  },

  shortMusic: {
    color: "#E3E3E6",
    fontSize: 11,
    marginTop: 8,
  },

  shortButtons: {
    position: "absolute",
    right: 12,
    bottom: 26,
    zIndex: 4,
  },

  shortButton: {
    alignItems: "center",
    marginTop: 12,
  },

  shortButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  shortButtonIcon: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  shortButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },

  storyViewer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  storyMedia: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  storyDemo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.dark,
    alignItems: "center",
    justifyContent: "center",
  },

  storyDemoEmoji: {
    fontSize: 76,
  },

  storyDemoTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 18,
  },

  storyTop: {
    position: "absolute",
    top:
      Platform.OS === "android"
        ? 24
        : 42,
    left: 12,
    right: 12,
    zIndex: 10,
  },

  storyProgressRow: {
    flexDirection: "row",
  },

  storyProgress: {
    flex: 1,
    height: 3,
    backgroundColor:
      "rgba(255,255,255,0.35)",
    borderRadius: 3,
    marginRight: 4,
  },

  storyProgressOn: {
    backgroundColor: "#FFFFFF",
  },

  storyUserRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  storyUserAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  storyUserAvatarText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  storyUserName: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  storyUserHandle: {
    color: "#D7D7DB",
    fontSize: 11,
  },

  storyClose: {
    color: "#FFFFFF",
    fontSize: 24,
    padding: 6,
  },

  storyPrevArea: {
    position: "absolute",
    left: 0,
    top: 100,
    bottom: 0,
    width: "40%",
    zIndex: 8,
  },

  storyNextArea: {
    position: "absolute",
    right: 0,
    top: 100,
    bottom: 0,
    width: "60%",
    zIndex: 8,
  },

  sub: {
    color: C.muted,
    marginTop: -5,
    marginBottom: 14,
  },

  createGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  createCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.line,
  },

  createIconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  createIcon: {
    color: C.purple,
    fontSize: 20,
    fontWeight: "900",
  },

  createForm: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.line,
  },

  preview: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    marginTop: 10,
  },

  previewVideo: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
    borderRadius: 16,
    marginTop: 10,
  },

  captionInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "#FAFAFC",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    marginBottom: 10,
    textAlignVertical: "top",
  },

  input: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "#FAFAFC",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  coverButton: {
    backgroundColor: C.soft,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 13,
    marginTop: 12,
  },

  coverButtonText: {
    color: C.purple,
    fontWeight: "900",
  },

  coverImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    marginTop: 10,
  },

  uploadArea: {
    backgroundColor: C.bg,
    padding: 12,
    borderRadius: 14,
    marginTop: 12,
  },

  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressText: {
    color: C.purple,
    fontWeight: "900",
  },

  progressBar: {
    height: 9,
    backgroundColor: "#E3E4EA",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 10,
  },

  progressFill: {
    height: "100%",
    backgroundColor: C.purple,
  },

  primary: {
    backgroundColor: C.purple,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
    marginTop: 14,
  },

  primaryText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  earnHero: {
    backgroundColor: C.dark,
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
  },

  earnLabel: {
    color: "#A7A8B0",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  earnAmount: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "900",
    marginTop: 6,
  },

  earnDescription: {
    color: "#C7C8CE",
    marginTop: 5,
  },

  withdraw: {
    backgroundColor: C.purple,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },

  earnGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  earnCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.line,
  },

  earnIcon: {
    fontSize: 28,
    marginBottom: 8,
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    padding: 18,
    borderWidth: 1,
    borderColor: C.line,
  },

  profilePhoto: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },

  profileFallback: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },

  profileFallbackText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
  },

  photoEdit: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.dark,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  profileName: {
    color: C.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 10,
  },

  profileUser: {
    color: C.purple,
    fontWeight: "800",
    marginTop: 3,
  },

  profileBio: {
    color: C.muted,
    textAlign: "center",
    marginTop: 8,
  },

  stats: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.line,
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    color: C.text,
    fontWeight: "900",
  },

  statLabel: {
    color: C.muted,
    fontSize: 10,
    marginTop: 3,
  },

  profileButtons: {
    flexDirection: "row",
    marginVertical: 12,
  },

  profileButton: {
    flex: 1,
    backgroundColor: C.soft,
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },

  profileButtonText: {
    color: C.purple,
    fontWeight: "900",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.line,
  },

  myPost: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.line,
  },

  myPostImage: {
    width: 75,
    height: 75,
    borderRadius: 12,
    marginRight: 10,
  },

  myPostVideo: {
    width: 75,
    height: 75,
    borderRadius: 12,
    backgroundColor: "#EEEFF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  logout: {
    backgroundColor: "#FFF0F4",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 18,
  },

  logoutText: {
    color: C.pink,
    fontWeight: "900",
  },

  authWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
  },

  brand: {
    alignItems: "center",
  },

  bigLogo: {
    width: 94,
    height: 94,
    borderRadius: 30,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },

  bigLogoText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
  },

  brandName: {
    color: C.text,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 10,
  },

  brandTag: {
    color: C.muted,
    marginTop: 4,
  },

  authCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginTop: 26,
    borderWidth: 1,
    borderColor: C.line,
  },

  authTitle: {
    color: C.text,
    fontSize: 22,
    fontWeight: "900",
  },

  authSub: {
    color: C.muted,
    marginTop: 5,
    marginBottom: 14,
  },

  note: {
    color: C.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
  },

  modalBg: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom:
      Platform.OS === "android"
        ? 34
        : 20,
  },

  sheetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sheetTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: "900",
  },

  close: {
    color: C.text,
    fontSize: 22,
  },

  comment: {
    flexDirection: "row",
    marginBottom: 12,
  },

  commentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  commentAvatarText: {
    color: C.purple,
    fontWeight: "900",
  },

  commentBubble: {
    flex: 1,
    backgroundColor: C.bg,
    padding: 10,
    borderRadius: 14,
  },

  empty: {
    color: C.muted,
    textAlign: "center",
    paddingVertical: 25,
  },

  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },

  send: {
    backgroundColor: C.purple,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },

  sendText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  person: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },

  menu: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },

  menuText: {
    color: C.text,
    fontWeight: "900",
    fontSize: 16,
  },

  photoViewer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  fullPhoto: {
    width: "100%",
    height: "80%",
  },

  photoClose: {
    position: "absolute",
    top: 45,
    right: 18,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  photoCloseText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
});
