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

const COLORS = {
  bg: "#F6F7FB",
  white: "#FFFFFF",
  text: "#171722",
  gray: "#77798B",
  purple: "#6C4CF1",
  pink: "#FF4F8B",
  blue: "#2D8CFF",
  green: "#20B573",
  line: "#E8E9F1",
  softPurple: "#F1EEFF",
  black: "#0E0E15",
};

const demoPosts = [
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
  const [stage, setStage] = useState("login");

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  const [tab, setTab] = useState("Home");

  const [posts, setPosts] = useState(demoPosts);
  const [createdPosts, setCreatedPosts] = useState([]);

  const [filter, setFilter] = useState("For You");

  const [commentPost, setCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  const [editProfile, setEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");

  const wallet = 1240;

  if (stage === "login") {
    return (
      <AuthScreen
        title="Welcome to Earnzo"
        subtitle="Enter your mobile number"
        value={mobile}
        setValue={setMobile}
        placeholder="Mobile Number"
        keyboardType="phone-pad"
        buttonText="Continue"
        note="Testing OTP: 1234"
        onPress={() => {
          if (mobile.length === 10) {
            setStage("otp");
          } else {
            Alert.alert("Please enter a valid 10-digit mobile number");
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
        placeholder="4-digit OTP"
        keyboardType="number-pad"
        buttonText="Verify OTP"
        onPress={() => {
          if (otp === "1234") {
            setStage("profile");
          } else {
            Alert.alert("Wrong OTP", "Testing OTP is 1234");
          }
        }}
      />
    );
  }

  if (stage === "profile") {
    return (
      <SafeAreaView style={styles.safeWhite}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.authContainer}>
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
              onChangeText={(text) =>
                setUsername(
                  text.replace(/\s/g, "").toLowerCase()
                )
              }
            />

            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (name.trim() && username.trim()) {
                  setStage("app");
                } else {
                  Alert.alert(
                    "Please enter name and username"
                  );
                }
              }}
            >
              <Text style={styles.primaryButtonText}>
                Start Earnzo
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  let screen;

  if (tab === "Home") {
    screen = (
      <HomeScreen
        posts={posts}
        setPosts={setPosts}
        filter={filter}
        setFilter={setFilter}
        openComments={(post) => {
          setCommentPost(post);
          setCommentText("");
        }}
      />
    );
  } else if (tab === "Shorts") {
    screen = (
      <ShortsScreen
        posts={posts}
        setPosts={setPosts}
        openComments={(post) => {
          setCommentPost(post);
          setCommentText("");
        }}
      />
    );
  } else if (tab === "Create") {
    screen = (
      <CreateScreen
        posts={posts}
        setPosts={setPosts}
        createdPosts={createdPosts}
        setCreatedPosts={setCreatedPosts}
        name={name || "Creator"}
        username={username || "creator"}
      />
    );
  } else if (tab === "Earn") {
    screen = <EarnScreen wallet={wallet} />;
  } else {
    screen = (
      <ProfileScreen
        name={name}
        username={username}
        wallet={wallet}
        createdPosts={createdPosts}
        onEdit={() => {
          setEditName(name);
          setEditUsername(username);
          setEditProfile(true);
        }}
        onLogout={() => {
          setStage("login");
          setTab("Home");
          setOtp("");
        }}
      />
    );
  }

  function sendComment() {
    const text = commentText.trim();

    if (!text || !commentPost) {
      return;
    }

    setPosts((oldPosts) =>
      oldPosts.map((post) =>
        post.id === commentPost.id
          ? {
              ...post,
              comments: [
                ...(post.comments || []),
                text,
              ],
            }
          : post
      )
    );

    setCommentPost((oldPost) =>
      oldPost
        ? {
            ...oldPost,
            comments: [
              ...(oldPost.comments || []),
              text,
            ],
          }
        : oldPost
    );

    setCommentText("");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.smallLogo}>
            <Text style={styles.smallLogoText}>E</Text>
          </View>

          <View>
            <Text style={styles.logoText}>Earnzo</Text>

            <Text style={styles.smallText}>
              Create • Connect • Earn
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.walletPill}>
            <Text style={styles.walletPillText}>
              ₹{wallet}
            </Text>
          </View>

          <Pressable
            style={styles.avatar}
            onPress={() => setTab("Profile")}
          >
            <Text style={styles.avatarText}>
              {(name || "S")[0].toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {screen}
      </View>

      <View style={styles.bottomNav}>
        {[
          ["Home", "⌂"],
          ["Shorts", "▶"],
          ["Create", "+"],
          ["Earn", "₹"],
          ["Profile", "◉"],
        ].map(([navName, icon]) => (
          <Pressable
            key={navName}
            style={styles.navItem}
            onPress={() => setTab(navName)}
          >
            <View
              style={[
                styles.navIconBox,
                tab === navName &&
                  styles.navIconBoxActive,
              ]}
            >
              <Text
                style={[
                  styles.navIcon,
                  tab === navName && {
                    color: "#FFFFFF",
                  },
                ]}
              >
                {icon}
              </Text>
            </View>

            <Text
              style={[
                styles.navText,
                tab === navName && {
                  color: COLORS.purple,
                },
              ]}
            >
              {navName}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal
        visible={!!commentPost}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setCommentPost(null)
        }
      >
        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Comments
              </Text>

              <Pressable
                onPress={() =>
                  setCommentPost(null)
                }
              >
                <Text style={styles.closeText}>
                  ✕
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 300 }}
              keyboardShouldPersistTaps="handled"
            >
              {(commentPost?.comments || [])
                .length === 0 ? (
                <Text style={styles.emptyText}>
                  No comments yet 😊
                </Text>
              ) : (
                (
                  commentPost?.comments || []
                ).map((comment, index) => (
                  <View
                    key={`${comment}-${index}`}
                    style={styles.commentRow}
                  >
                    <View
                      style={
                        styles.commentAvatar
                      }
                    >
                      <Text
                        style={{
                          color:
                            COLORS.purple,
                          fontWeight: "900",
                        }}
                      >
                        U
                      </Text>
                    </View>

                    <View
                      style={
                        styles.commentBubble
                      }
                    >
                      <Text
                        style={
                          styles.commentUser
                        }
                      >
                        User
                      </Text>

                      <Text>
                        {comment}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.commentComposer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={sendComment}
              />

              <Pressable
                style={styles.sendButton}
                onPress={sendComment}
              >
                <Text
                  style={
                    styles.sendButtonText
                  }
                >
                  Send
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={editProfile}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setEditProfile(false)
        }
      >
        <View style={styles.modalBackground}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit Profile
              </Text>

              <Pressable
                onPress={() =>
                  setEditProfile(false)
                }
              >
                <Text style={styles.closeText}>
                  ✕
                </Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editName}
              onChangeText={setEditName}
            />

            <TextInput
              style={[
                styles.input,
                { marginTop: 12 },
              ]}
              placeholder="Username"
              value={editUsername}
              autoCapitalize="none"
              onChangeText={(text) =>
                setEditUsername(
                  text
                    .replace(/\s/g, "")
                    .toLowerCase()
                )
              }
            />

            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                if (
                  !editName.trim() ||
                  !editUsername.trim()
                ) {
                  Alert.alert(
                    "Please enter complete details"
                  );
                  return;
                }

                setName(editName.trim());
                setUsername(
                  editUsername.trim()
                );

                setEditProfile(false);
              }}
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Save Changes
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AuthScreen({
  title,
  subtitle,
  value,
  setValue,
  placeholder,
  keyboardType,
  buttonText,
  onPress,
  note,
}) {
  return (
    <SafeAreaView style={styles.safeWhite}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.authContainer}>
        <Brand />

        <View style={styles.authCard}>
          <Text style={styles.authTitle}>
            {title}
          </Text>

          <Text style={styles.authSubtitle}>
            {subtitle}
          </Text>

          <TextInput
            style={styles.input}
            placeholder={placeholder}
            keyboardType={keyboardType}
            value={value}
            onChangeText={setValue}
            maxLength={
              placeholder.includes("OTP")
                ? 4
                : 10
            }
          />

          <Pressable
            style={styles.primaryButton}
            onPress={onPress}
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {buttonText}
            </Text>
          </Pressable>

          {note ? (
            <Text style={styles.noteText}>
              {note}
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Brand() {
  return (
    <>
      <View style={styles.brandLogo}>
        <Text style={styles.brandLogoText}>
          E
        </Text>
      </View>

      <Text style={styles.brandTitle}>
        Earnzo
      </Text>

      <Text style={styles.brandTagline}>
        Create • Connect • Earn
      </Text>
    </>
  );
}

function HomeScreen({
  posts,
  setPosts,
  filter,
  setFilter,
  openComments,
}) {
  function likePost(id) {
    setPosts((oldPosts) =>
      oldPosts.map((post) =>
        post.id === id
          ? {
              ...post,
              liked: !post.liked,
              likes:
                post.likes +
                (post.liked ? -1 : 1),
            }
          : post
      )
    );
  }

  function followPost(id) {
    setPosts((oldPosts) =>
      oldPosts.map((post) =>
        post.id === id
          ? {
              ...post,
              following:
                !post.following,
            }
          : post
      )
    );
  }

  let visiblePosts = posts;

  if (filter === "Following") {
    visiblePosts = posts.filter(
      (post) => post.following
    );
  }

  if (filter === "Trending") {
    visiblePosts = posts.filter(
      (post) => post.trending
    );
  }

  if (filter === "India") {
    visiblePosts = posts.filter(
      (post) =>
        post.country === "India"
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTopText}>
            WELCOME BACK
          </Text>

          <Text style={styles.heroTitle}>
            Create. Connect. Earn.
          </Text>

          <Text style={styles.heroSubtitle}>
            Your creator journey starts here.
          </Text>
        </View>

        <View style={styles.heroCoin}>
          <Text style={styles.heroCoinText}>
            ₹
          </Text>
        </View>
      </View>

      <Text style={styles.heading}>
        Your Feed
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        style={{ marginBottom: 14 }}
      >
        <View style={styles.filters}>
          {[
            "For You",
            "Following",
            "Trending",
            "India",
          ].map((item) => (
            <Pressable
              key={item}
              style={[
                styles.filterButton,
                filter === item &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setFilter(item)
              }
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && {
                    color: "#FFFFFF",
                  },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {visiblePosts.map((post) => (
        <View
          key={post.id}
          style={styles.postCard}
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
              <Text
                style={styles.creatorName}
              >
                {post.name}
              </Text>

              <Text style={styles.smallText}>
                {post.handle}
              </Text>
            </View>

            <Pressable
              style={[
                styles.followButton,
                post.following &&
                  styles.followingButton,
              ]}
              onPress={() =>
                followPost(post.id)
              }
            >
              <Text
                style={[
                  styles.followButtonText,
                  post.following && {
                    color: COLORS.purple,
                  },
                ]}
              >
                {post.following
                  ? "Following"
                  : "Follow"}
              </Text>
            </Pressable>
          </View>

          <PostMedia post={post} />

          <Text style={styles.postTitle}>
            {post.title}
          </Text>

          {post.location ? (
            <Text style={styles.smallText}>
              📍 {post.location}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={() =>
                likePost(post.id)
              }
            >
              <Text
                style={[
                  styles.actionText,
                  post.liked && {
                    color: COLORS.pink,
                  },
                ]}
              >
                {post.liked ? "♥" : "♡"}{" "}
                {formatNumber(post.likes)}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                openComments(post)
              }
            >
              <Text
                style={styles.actionText}
              >
                💬{" "}
                {
                  (post.comments || [])
                    .length
                }
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Share.share({
                  message: `${post.name} on Earnzo\n${post.title}`,
                })
              }
            >
              <Text
                style={styles.actionText}
              >
                ↗ Share
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function PostMedia({ post }) {
  if (
    post.mediaType === "photo" &&
    post.mediaUri
  ) {
    return (
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: post.mediaUri,
          }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (
    (post.mediaType === "short" ||
      post.mediaType === "long") &&
    post.mediaUri
  ) {
    return (
      <VideoCard uri={post.mediaUri} />
    );
  }

  return (
    <View style={styles.demoVideo}>
      <View style={styles.playCircle}>
        <Text style={styles.playText}>
          ▶
        </Text>
      </View>

      <Text style={styles.demoVideoText}>
        Demo Video
      </Text>
    </View>
  );
}

function VideoCard({ uri }) {
  const player = useVideoPlayer(
    uri,
    (videoPlayer) => {
      videoPlayer.loop = false;
    }
  );

  return (
    <View style={styles.videoContainer}>
      <VideoView
        style={styles.videoPlayer}
        player={player}
        nativeControls
        contentFit="contain"
        allowsFullscreen
      />
    </View>
  );
}

function ShortsScreen({
  posts,
  setPosts,
  openComments,
}) {
  const shorts = posts.filter(
    (post) =>
      post.mediaType === "short"
  );

  const [shortIndex, setShortIndex] =
    useState(0);

  const post =
    shorts.length > 0
      ? shorts[
          shortIndex % shorts.length
        ]
      : {
          id: "demo-short",
          name: "Earnzo",
          handle: "@earnzo",
          title:
            "Upload your first Short / Reel",
          likes: 0,
          comments: [],
          liked: false,
          mediaType: "demo",
        };

  function likeShort() {
    if (post.id === "demo-short") {
      return;
    }

    setPosts((oldPosts) =>
      oldPosts.map((item) =>
        item.id === post.id
          ? {
              ...item,
              liked: !item.liked,
              likes:
                item.likes +
                (item.liked ? -1 : 1),
            }
          : item
      )
    );
  }

  return (
    <View style={styles.shortsScreen}>
      <View style={styles.shortsTabs}>
        <Text
          style={styles.shortsTabActive}
        >
          For You
        </Text>

        <Text style={styles.shortsTab}>
          Following
        </Text>
      </View>

      <View style={styles.shortMedia}>
        {post.mediaType === "short" &&
        post.mediaUri ? (
          <ShortVideo
            uri={post.mediaUri}
          />
        ) : (
          <View style={styles.shortDemo}>
            <Text
              style={styles.shortDemoIcon}
            >
              ▶
            </Text>

            <Text
              style={styles.shortDemoText}
            >
              Upload a Short / Reel
            </Text>
          </View>
        )}
      </View>

      <View style={styles.shortInfo}>
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
      </View>

      <View style={styles.shortActions}>
        <Pressable onPress={likeShort}>
          <Text
            style={styles.shortActionText}
          >
            {post.liked ? "♥" : "♡"}
            {"\n"}
            {formatNumber(
              post.likes || 0
            )}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (
              post.id !== "demo-short"
            ) {
              openComments(post);
            }
          }}
        >
          <Text
            style={styles.shortActionText}
          >
            💬
            {"\n"}
            {
              (post.comments || [])
                .length
            }
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            Share.share({
              message: `${post.name}\n${post.title}`,
            })
          }
        >
          <Text
            style={styles.shortActionText}
          >
            ↗
            {"\n"}
            Share
          </Text>
        </Pressable>

        {shorts.length > 1 ? (
          <Pressable
            onPress={() =>
              setShortIndex(
                (old) => old + 1
              )
            }
          >
            <Text
              style={
                styles.shortActionText
              }
            >
              ↓
              {"\n"}
              Next
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ShortVideo({ uri }) {
  const player = useVideoPlayer(
    uri,
    (videoPlayer) => {
      videoPlayer.loop = true;
    }
  );

  useEffect(() => {
    player.play();

    return () => {
      try {
        player.pause();
      } catch (error) {}
    };
  }, [player]);

  return (
    <VideoView
      style={styles.shortVideo}
      player={player}
      nativeControls
      contentFit="contain"
      allowsFullscreen
    />
  );
}

function CreateScreen({
  posts,
  setPosts,
  createdPosts,
  setCreatedPosts,
  name,
  username,
}) {
  const [media, setMedia] =
    useState(null);

  const [mediaType, setMediaType] =
    useState("short");

  const [caption, setCaption] =
    useState("");

  const [cover, setCover] =
    useState(null);

  const [tagPeople, setTagPeople] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [topics, setTopics] =
    useState("");

  const [popup, setPopup] =
    useState("");

  const [tempValue, setTempValue] =
    useState("");

  const [liveSetup, setLiveSetup] =
    useState(false);

  const [live, setLive] =
    useState(false);

  const [liveTitle, setLiveTitle] =
    useState("");

  async function requestPermission() {
    const result =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!result.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow photo and video access."
      );

      return false;
    }

    return true;
  }

  async function selectMedia(type) {
    const allowed =
      await requestPermission();

    if (!allowed) {
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes:
            type === "photo"
              ? ["images"]
              : ["videos"],

          quality: 0.9,
        }
      );

    if (
      !result.canceled &&
      result.assets?.[0]
    ) {
      const selected =
        result.assets[0];

      if (
        type === "short" &&
        selected.duration &&
        selected.duration > 90000
      ) {
        Alert.alert(
          "Short Too Long",
          "Maximum duration is 1.5 minutes."
        );

        return;
      }

      setMediaType(type);
      setMedia(selected);
    }
  }

  async function selectCover() {
    const allowed =
      await requestPermission();

    if (!allowed) {
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.9,
        }
      );

    if (
      !result.canceled &&
      result.assets?.[0]
    ) {
      setCover(result.assets[0]);
    }
  }

  function savePopupValue() {
    if (popup === "tag") {
      setTagPeople(tempValue.trim());
    }

    if (popup === "location") {
      setLocation(tempValue.trim());
    }

    if (popup === "topics") {
      setTopics(tempValue.trim());
    }

    setPopup("");
    setTempValue("");
  }

  function publishPost() {
    if (!media) {
      Alert.alert(
        "Please select media first"
      );

      return;
    }

    if (!caption.trim()) {
      Alert.alert(
        "Please write a caption"
      );

      return;
    }

    const newPost = {
      id: Date.now().toString(),
      name,
      handle: `@${username}`,
      title: caption.trim(),
      likes: 0,
      comments: [],
      following: false,
      liked: false,
      trending: false,
      country: "India",

      mediaType,
      mediaUri: media.uri,

      coverUri: cover?.uri || "",

      tagPeople,
      location,
      topics,
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
    setTagPeople("");
    setLocation("");
    setTopics("");

    if (mediaType === "short") {
      Alert.alert(
        "Published Successfully ✅",
        "Your Short is now visible on Home, Shorts and Profile."
      );
    } else if (
      mediaType === "long"
    ) {
      Alert.alert(
        "Published Successfully ✅",
        "Your video is now visible on Home and Profile."
      );
    } else {
      Alert.alert(
        "Published Successfully ✅",
        "Your photo is now visible on Home and Profile."
      );
    }
  }

  if (live) {
    return (
      <View style={styles.liveScreen}>
        <View style={styles.liveTop}>
          <Text
            style={styles.liveBadge}
          >
            LIVE
          </Text>

          <Text
            style={styles.liveViewers}
          >
            👁 0 viewers
          </Text>
        </View>

        <Text style={styles.liveTitle}>
          {liveTitle}
        </Text>

        <View
          style={styles.liveCamera}
        >
          <Text style={styles.liveDot}>
            ●
          </Text>

          <Text style={styles.liveText}>
            Live camera testing
          </Text>
        </View>

        <Pressable
          style={styles.endLiveButton}
          onPress={() => {
            setLive(false);
            setLiveSetup(false);
            setLiveTitle("");
          }}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            End Live
          </Text>
        </Pressable>
      </View>
    );
  }

  if (liveSetup) {
    return (
      <ScrollView
        contentContainerStyle={
          styles.scroll
        }
      >
        <Text style={styles.heading}>
          Go Live 🔴
        </Text>

        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="Live title"
            value={liveTitle}
            onChangeText={setLiveTitle}
          />

          <Pressable
            style={
              styles.primaryButton
            }
            onPress={() => {
              if (liveTitle.trim()) {
                setLive(true);
              } else {
                Alert.alert(
                  "Please enter live title"
                );
              }
            }}
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Start Live
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() =>
              setLiveSetup(false)
            }
          >
            <Text
              style={
                styles.cancelButtonText
              }
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={
          styles.scroll
        }
      >
        <Text style={styles.heading}>
          Create
        </Text>

        <Text
          style={styles.subtitleText}
        >
          Choose what you want to publish.
        </Text>

        <View
          style={styles.createGrid}
        >
          <CreateButton
            icon="▶"
            title="Short / Reel"
            subtitle="Max 1.5 min"
            color={COLORS.purple}
            onPress={() =>
              selectMedia("short")
            }
          />

          <CreateButton
            icon="▣"
            title="Long Video"
            subtitle="Full video"
            color={COLORS.blue}
            onPress={() =>
              selectMedia("long")
            }
          />

          <CreateButton
            icon="◎"
            title="Photo"
            subtitle="Post image"
            color={COLORS.pink}
            onPress={() =>
              selectMedia("photo")
            }
          />

          <CreateButton
            icon="●"
            title="Go Live"
            subtitle="Live setup"
            color="#E53935"
            onPress={() =>
              setLiveSetup(true)
            }
          />
        </View>

        {media ? (
          <View
            style={
              styles.selectedMediaCard
            }
          >
            <View
              style={
                styles.selectedMediaHeader
              }
            >
              <Text
                style={
                  styles.selectedMediaTitle
                }
              >
                Selected{" "}
                {mediaType === "long"
                  ? "Long Video"
                  : mediaType ===
                    "short"
                  ? "Short / Reel"
                  : "Photo"}
              </Text>

              <Text
                style={styles.readyText}
              >
                ✓ Ready
              </Text>
            </View>

            {mediaType === "photo" ? (
              <Image
                source={{
                  uri: media.uri,
                }}
                style={
                  styles.previewImage
                }
              />
            ) : (
              <SelectedVideo
                uri={media.uri}
              />
            )}

            <Text
              style={styles.smallText}
            >
              {media.fileName ||
                "Media selected successfully"}
            </Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>
            Caption
          </Text>

          <TextInput
            multiline
            style={styles.captionInput}
            placeholder="Write something interesting..."
            value={caption}
            onChangeText={setCaption}
          />

          <OptionButton
            title="🏷 Tag People"
            value={tagPeople}
            onPress={() => {
              setPopup("tag");
              setTempValue(tagPeople);
            }}
          />

          <OptionButton
            title="📍 Add Location"
            value={location}
            onPress={() => {
              setPopup("location");
              setTempValue(location);
            }}
          />

          <OptionButton
            title="# Add Topics"
            value={topics}
            onPress={() => {
              setPopup("topics");
              setTempValue(topics);
            }}
          />

          <OptionButton
            title="🖼 Select Cover"
            value={
              cover
                ? "Cover selected ✓"
                : ""
            }
            onPress={selectCover}
          />

          {cover ? (
            <Image
              source={{
                uri: cover.uri,
              }}
              style={styles.coverImage}
            />
          ) : null}

          <Pressable
            style={styles.publishButton}
            onPress={publishPost}
          >
            <Text
              style={
                styles.publishButtonText
              }
            >
              Publish Now
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={!!popup}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setPopup("")
        }
      >
        <View
          style={
            styles.modalBackground
          }
        >
          <View
            style={styles.bottomSheet}
          >
            <View
              style={styles.sheetHandle}
            />

            <Text
              style={styles.modalTitle}
            >
              {popup === "tag"
                ? "Tag People"
                : popup ===
                  "location"
                ? "Add Location"
                : "Add Topics"}
            </Text>

            <TextInput
              style={[
                styles.input,
                { marginTop: 16 },
              ]}
              placeholder={
                popup === "tag"
                  ? "@username1, @username2"
                  : popup ===
                    "location"
                  ? "Delhi, India"
                  : "EV, Travel, Tech"
              }
              value={tempValue}
              onChangeText={setTempValue}
            />

            <Pressable
              style={
                styles.primaryButton
              }
              onPress={savePopupValue}
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Save
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() =>
                setPopup("")
              }
            >
              <Text
                style={
                  styles.cancelButtonText
                }
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SelectedVideo({ uri }) {
  const player = useVideoPlayer(
    uri,
    (videoPlayer) => {
      videoPlayer.loop = false;
    }
  );

  return (
    <View
      style={
        styles.selectedVideoContainer
      }
    >
      <VideoView
        style={styles.selectedVideo}
        player={player}
        nativeControls
        contentFit="contain"
        allowsFullscreen
      />
    </View>
  );
}

function CreateButton({
  icon,
  title,
  subtitle,
  color,
  onPress,
}) {
  return (
    <Pressable
      style={[
        styles.createButton,
        {
          borderColor: color,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.createIcon,
          {
            backgroundColor: color,
          },
        ]}
      >
        <Text
          style={
            styles.createIconText
          }
        >
          {icon}
        </Text>
      </View>

      <Text
        style={styles.createTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.createSubtitle}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

function OptionButton({
  title,
  value,
  onPress,
}) {
  return (
    <Pressable
      style={styles.optionButton}
      onPress={onPress}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={styles.optionTitle}
        >
          {title}
        </Text>

        {value ? (
          <Text
            style={
              styles.optionValue
            }
          >
            {value}
          </Text>
        ) : null}
      </View>

      <Text
        style={styles.optionArrow}
      >
        ›
      </Text>
    </Pressable>
  );
}

function EarnScreen({ wallet }) {
  return (
    <ScrollView
      contentContainerStyle={
        styles.scroll
      }
    >
      <Text style={styles.heading}>
        Earn
      </Text>

      <Text
        style={styles.subtitleText}
      >
        Creator rewards and brand opportunities.
      </Text>

      <View style={styles.walletCard}>
        <Text
          style={styles.walletLabel}
        >
          Available Balance
        </Text>

        <Text style={styles.moneyText}>
          ₹{wallet}
        </Text>

        <Text
          style={styles.walletSubtitle}
        >
          Creator earnings + rewards
        </Text>

        <Pressable
          style={styles.withdrawButton}
          onPress={() =>
            Alert.alert(
              "Withdraw",
              "Real KYC + Bank/UPI payout will work after backend integration."
            )
          }
        >
          <Text
            style={
              styles.withdrawButtonText
            }
          >
            Withdraw Money
          </Text>
        </Pressable>
      </View>

      <Text style={styles.subHeading}>
        Brand Tasks
      </Text>

      {[
        [
          "VoltGo",
          "Create a 30-sec EV video",
          "₹1,000",
          COLORS.purple,
        ],
        [
          "FoodBee",
          "Food Video Challenge",
          "₹500",
          "#FF9F43",
        ],
      ].map(
        ([
          brand,
          title,
          amount,
          color,
        ]) => (
          <View
            key={brand}
            style={styles.taskCard}
          >
            <View
              style={[
                styles.taskLogo,
                {
                  backgroundColor:
                    color,
                },
              ]}
            >
              <Text
                style={
                  styles.taskLogoText
                }
              >
                {brand[0]}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={
                  styles.taskBrand
                }
              >
                {brand}
              </Text>

              <Text
                style={
                  styles.taskTitle
                }
              >
                {title}
              </Text>
            </View>

            <View
              style={{
                alignItems:
                  "flex-end",
              }}
            >
              <Text
                style={
                  styles.taskAmount
                }
              >
                {amount}
              </Text>

              <Pressable
                style={
                  styles.applyButton
                }
                onPress={() =>
                  Alert.alert(
                    "Applied ✅",
                    title
                  )
                }
              >
                <Text
                  style={
                    styles.applyButtonText
                  }
                >
                  Apply
                </Text>
              </Pressable>
            </View>
          </View>
        )
      )}
    </ScrollView>
  );
}

function ProfileScreen({
  name,
  username,
  wallet,
  createdPosts,
  onEdit,
  onLogout,
}) {
  return (
    <ScrollView
      contentContainerStyle={
        styles.scroll
      }
    >
      <View style={styles.profileHero}>
        <View
          style={styles.profileAvatar}
        >
          <Text
            style={
              styles.profileAvatarText
            }
          >
            {(name || "S")[0].toUpperCase()}
          </Text>
        </View>

        <Text
          style={styles.profileName}
        >
          {name || "Creator"}
        </Text>

        <Text
          style={styles.profileHandle}
        >
          @{username || "creator"}
        </Text>
      </View>

      <View style={styles.statsCard}>
        <Stat
          number={createdPosts.length}
          title="Posts"
        />

        <Stat
          number="12.8K"
          title="Followers"
        />

        <Stat
          number="438"
          title="Following"
        />

        <Stat
          number={`₹${wallet}`}
          title="Earnings"
        />
      </View>

      <Pressable
        style={styles.editButton}
        onPress={onEdit}
      >
        <Text
          style={styles.editButtonText}
        >
          ✎ Edit Profile
        </Text>
      </Pressable>

      <Text style={styles.subHeading}>
        Your Posts
      </Text>

      {createdPosts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text
            style={{ fontSize: 34 }}
          >
            +
          </Text>

          <Text
            style={styles.creatorName}
          >
            No posts yet
          </Text>

          <Text
            style={styles.smallText}
          >
            Create your first post from the Create tab.
          </Text>
        </View>
      ) : (
        createdPosts.map((post) => (
          <View
            key={post.id}
            style={
              styles.profilePost
            }
          >
            {post.mediaType ===
            "photo" ? (
              <Image
                source={{
                  uri: post.mediaUri,
                }}
                style={
                  styles.profileThumbnail
                }
              />
            ) : (
              <View
                style={
                  styles.profileVideoThumbnail
                }
              >
                <Text
                  style={{
                    fontSize: 22,
                  }}
                >
                  ▶
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text
                style={
                  styles.profilePostTitle
                }
              >
                {post.title}
              </Text>

              <Text
                style={
                  styles.smallText
                }
              >
                {post.mediaType ===
                "short"
                  ? "Short / Reel"
                  : post.mediaType ===
                    "long"
                  ? "Long Video"
                  : "Photo"}
              </Text>
            </View>
          </View>
        ))
      )}

      <Pressable
        style={styles.logoutButton}
        onPress={onLogout}
      >
        <Text
          style={styles.logoutText}
        >
          Logout
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ number, title }) {
  return (
    <View style={styles.stat}>
      <Text
        style={styles.statNumber}
      >
        {number}
      </Text>

      <Text
        style={styles.statTitle}
      >
        {title}
      </Text>
    </View>
  );
}

function formatNumber(number) {
  if (number >= 1000) {
    return `${(
      number / 1000
    ).toFixed(
      number >= 10000 ? 0 : 1
    )}K`;
  }

  return String(number);
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop:
      Platform.OS === "android"
        ? StatusBar.currentHeight
        : 0,
  },

  safeWhite: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop:
      Platform.OS === "android"
        ? StatusBar.currentHeight
        : 0,
  },

  authContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },

  brandLogo: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: COLORS.purple,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  brandLogoText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
  },

  brandTitle: {
    textAlign: "center",
    fontSize: 38,
    fontWeight: "900",
    color: COLORS.text,
  },

  brandTagline: {
    textAlign: "center",
    color: COLORS.gray,
    marginTop: 4,
    marginBottom: 26,
  },

  authCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    elevation: 3,
  },

  authTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.text,
  },

  authSubtitle: {
    color: COLORS.gray,
    marginTop: 5,
    marginBottom: 16,
  },

  input: {
    height: 55,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 15,
    paddingHorizontal: 15,
    backgroundColor: "#FAFAFD",
    color: COLORS.text,
  },

  primaryButton: {
    height: 55,
    backgroundColor: COLORS.purple,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  noteText: {
    textAlign: "center",
    color: COLORS.gray,
    marginTop: 14,
  },

  header: {
    minHeight: 78,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  smallLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.purple,
    alignItems: "center",
    justifyContent: "center",
  },

  smallLogoText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 20,
  },

  logoText: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
  },

  smallText: {
    color: COLORS.gray,
    fontSize: 11,
    marginTop: 2,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  walletPill: {
    backgroundColor:
      COLORS.softPurple,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  walletPillText: {
    color: COLORS.purple,
    fontWeight: "900",
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.pink,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  bottomNav: {
    minHeight: 94,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingTop: 6,
    paddingBottom:
      Platform.OS === "android"
        ? 30
        : 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },

  navItem: {
    alignItems: "center",
    minWidth: 58,
  },

  navIconBox: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  navIconBoxActive: {
    backgroundColor: COLORS.purple,
  },

  navIcon: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 18,
  },

  navText: {
    color: COLORS.gray,
    fontSize: 10,
    marginTop: 3,
    fontWeight: "700",
  },

  scroll: {
    padding: 16,
    paddingBottom: 28,
  },

  heroCard: {
    backgroundColor: COLORS.purple,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroTopText: {
    color: "#DDD5FF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6,
  },

  heroSubtitle: {
    color: "#EAE5FF",
    marginTop: 5,
  },

  heroCoin: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF22",
    alignItems: "center",
    justifyContent: "center",
  },

  heroCoinText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
  },

  heading: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 10,
  },

  subHeading: {
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.text,
    marginVertical: 12,
  },

  subtitleText: {
    color: COLORS.gray,
    marginTop: -4,
    marginBottom: 16,
  },

  filters: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 10,
  },

  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  filterButtonActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },

  filterText: {
    color: COLORS.text,
    fontWeight: "800",
  },

  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#ECF5FF",
    alignItems: "center",
    justifyContent: "center",
  },

  creatorAvatarText: {
    color: COLORS.blue,
    fontWeight: "900",
    fontSize: 17,
  },

  creatorName: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15,
  },

  followButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },

  followingButton: {
    backgroundColor:
      COLORS.softPurple,
  },

  followButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
  },

  demoVideo: {
    height: 235,
    borderRadius: 18,
    backgroundColor:
      COLORS.softPurple,
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  playCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.purple,
    alignItems: "center",
    justifyContent: "center",
  },

  playText: {
    color: "#FFFFFF",
    fontSize: 22,
    marginLeft: 3,
  },

  demoVideoText: {
    color: COLORS.purple,
    fontWeight: "800",
    marginTop: 10,
  },

  imageContainer: {
    height: 280,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 14,
    backgroundColor: "#EEEEEE",
  },

  postImage: {
    width: "100%",
    height: "100%",
  },

  videoContainer: {
    height: 250,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#000000",
    marginTop: 14,
  },

  videoPlayer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
  },

  postTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 12,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    marginTop: 13,
    paddingTop: 11,
  },

  actionText: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 13,
  },

  shortsScreen: {
    flex: 1,
    backgroundColor: "#0C0C12",
    position: "relative",
  },

  shortsTabs: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },

  shortsTabActive: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  shortsTab: {
    color: "#A7A7B4",
    fontWeight: "800",
    fontSize: 16,
  },

  shortMedia: {
    flex: 1,
  },

  shortVideo: {
    flex: 1,
    backgroundColor: "#000000",
  },

  shortDemo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  shortDemoIcon: {
    color: "#FFFFFF",
    fontSize: 48,
  },

  shortDemoText: {
    color: "#B4B4C0",
    marginTop: 10,
  },

  shortInfo: {
    position: "absolute",
    left: 16,
    bottom: 26,
    width: "70%",
  },

  shortCreator: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  shortCaption: {
    color: "#FFFFFF",
    marginTop: 8,
  },

  shortActions: {
    position: "absolute",
    right: 16,
    bottom: 36,
    gap: 23,
    alignItems: "center",
  },

  shortActionText: {
    color: "#FFFFFF",
    fontWeight: "900",
    textAlign: "center",
  },

  createGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  createButton: {
    width: "48%",
    minHeight: 125,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
  },

  createIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  createIconText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  createTitle: {
    color: COLORS.text,
    fontWeight: "900",
  },

  createSubtitle: {
    color: COLORS.gray,
    fontSize: 11,
    marginTop: 3,
  },

  selectedMediaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  selectedMediaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectedMediaTitle: {
    color: COLORS.text,
    fontWeight: "900",
  },

  readyText: {
    color: COLORS.green,
    fontWeight: "900",
  },

  previewImage: {
    width: "100%",
    height: 250,
    borderRadius: 14,
    marginTop: 12,
  },

  selectedVideoContainer: {
    height: 220,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000000",
    marginTop: 12,
  },

  selectedVideo: {
    width: "100%",
    height: "100%",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  fieldLabel: {
    color: COLORS.text,
    fontWeight: "900",
    marginBottom: 8,
  },

  captionInput: {
    minHeight: 95,
    backgroundColor: "#F7F7FB",
    borderRadius: 14,
    padding: 12,
    textAlignVertical: "top",
    color: COLORS.text,
  },

  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },

  optionTitle: {
    color: COLORS.text,
    fontWeight: "700",
  },

  optionValue: {
    color: COLORS.gray,
    fontSize: 11,
    marginTop: 4,
  },

  optionArrow: {
    fontSize: 24,
    color: COLORS.gray,
  },

  coverImage: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    marginTop: 14,
  },

  publishButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.pink,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  publishButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  walletCard: {
    backgroundColor: COLORS.black,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },

  walletLabel: {
    color: "#B7B7C4",
    fontWeight: "700",
  },

  moneyText: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "900",
    marginTop: 6,
  },

  walletSubtitle: {
    color: "#8F8F9E",
    marginTop: 4,
  },

  withdrawButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 18,
  },

  withdrawButtonText: {
    color: COLORS.black,
    fontWeight: "900",
  },

  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  taskLogo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  taskLogoText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 18,
  },

  taskBrand: {
    color: COLORS.gray,
    fontSize: 11,
    fontWeight: "800",
  },

  taskTitle: {
    color: COLORS.text,
    fontWeight: "900",
    marginTop: 2,
  },

  taskAmount: {
    color: COLORS.green,
    fontWeight: "900",
  },

  applyButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    marginTop: 7,
  },

  applyButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
  },

  profileHero: {
    alignItems: "center",
    paddingTop: 8,
  },

  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: COLORS.pink,
    alignItems: "center",
    justifyContent: "center",
  },

  profileAvatarText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
  },

  profileName: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 23,
    marginTop: 12,
  },

  profileHandle: {
    color: COLORS.gray,
    marginTop: 3,
  },

  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15,
  },

  statTitle: {
    color: COLORS.gray,
    fontSize: 10,
    marginTop: 3,
  },

  editButton: {
    backgroundColor: "#ECF5FF",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
  },

  editButtonText: {
    color: COLORS.blue,
    fontWeight: "900",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  profilePost: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  profileThumbnail: {
    width: 66,
    height: 66,
    borderRadius: 12,
  },

  profileVideoThumbnail: {
    width: 66,
    height: 66,
    borderRadius: 12,
    backgroundColor:
      COLORS.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },

  profilePostTitle: {
    color: COLORS.text,
    fontWeight: "900",
  },

  logoutButton: {
    borderWidth: 1,
    borderColor: "#F0C4CF",
    backgroundColor: "#FFF7F9",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },

  logoutText: {
    color: "#D94467",
    fontWeight: "900",
  },

  modalBackground: {
    flex: 1,
    backgroundColor:
      "rgba(12,12,18,0.45)",
    justifyContent: "flex-end",
  },

  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 10,

    paddingBottom:
      Platform.OS === "android"
        ? 36
        : 20,

    maxHeight: "82%",
  },

  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#DADBE5",
    alignSelf: "center",
    marginBottom: 12,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
  },

  closeText: {
    fontSize: 20,
    color: COLORS.text,
  },

  emptyText: {
    color: COLORS.gray,
    paddingVertical: 20,
    textAlign: "center",
  },

  commentRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 9,
  },

  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor:
      COLORS.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },

  commentBubble: {
    flex: 1,
    backgroundColor: "#F7F7FB",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  commentUser: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 12,
  },

  commentComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },

  commentInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingHorizontal: 13,
    backgroundColor: "#FAFAFD",
    color: COLORS.text,
  },

  sendButton: {
    height: 48,
    paddingHorizontal: 17,
    borderRadius: 14,
    backgroundColor: COLORS.purple,
    justifyContent: "center",
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  cancelButton: {
    paddingVertical: 14,
    alignItems: "center",
  },

  cancelButtonText: {
    color: COLORS.purple,
    fontWeight: "800",
  },

  liveScreen: {
    flex: 1,
    backgroundColor: "#0D0D13",
    padding: 18,
  },

  liveTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  liveBadge: {
    backgroundColor: "#E53935",
    color: "#FFFFFF",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    fontWeight: "900",
  },

  liveViewers: {
    color: "#B5B5C0",
    fontWeight: "700",
  },

  liveTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 16,
  },

  liveCamera: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  liveDot: {
    color: "#E53935",
    fontSize: 48,
  },

  liveText: {
    color: "#C4C4CD",
    marginTop: 12,
  },

  endLiveButton: {
    height: 56,
    backgroundColor: "#E53935",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
});
