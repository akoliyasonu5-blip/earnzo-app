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
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [dataLoaded, setDataLoaded] = useState(false);

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  const [tab, setTab] = useState("Home");
  const [posts, setPosts] = useState(demoPosts);
  const [createdPosts, setCreatedPosts] = useState([]);
  const [filter, setFilter] = useState("For You");

  const [commentPost, setCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [editProfile, setEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");

  const wallet = 1240;

  useEffect(() => {
    async function loadData() {
      try {
        const saved = await AsyncStorage.getItem(
          "earnzoData"
        );

        if (saved) {
          const data = JSON.parse(saved);

          if (data.stage) {
            setStage(data.stage);
          }

          if (data.name) {
            setName(data.name);
          }

          if (data.username) {
            setUsername(data.username);
          }

          if (data.profilePhoto) {
            setProfilePhoto(data.profilePhoto);
          }

          if (Array.isArray(data.posts)) {
            setPosts(data.posts);
          }

          if (Array.isArray(data.createdPosts)) {
            setCreatedPosts(data.createdPosts);
          }
        }
      } catch (error) {
        console.log("Load error:", error);
      } finally {
        setDataLoaded(true);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!dataLoaded) {
      return;
    }

    async function saveData() {
      try {
        const data = {
          stage,
          name,
          username,
          profilePhoto,
          posts,
          createdPosts,
        };

        await AsyncStorage.setItem(
          "earnzoData",
          JSON.stringify(data)
        );
      } catch (error) {
        console.log("Save error:", error);
      }
    }

    saveData();
  }, [
    dataLoaded,
    stage,
    name,
    username,
    profilePhoto,
    posts,
    createdPosts,
  ]);

  function openComments(post) {
    setCommentPost(post);
    setCommentText("");
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

    setCreatedPosts((oldPosts) =>
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

  async function logout() {
    try {
      await AsyncStorage.removeItem("earnzoData");
    } catch (error) {
      console.log(error);
    }

    setName("");
    setUsername("");
    setProfilePhoto("");
    setMobile("");
    setOtp("");
    setPosts(demoPosts);
    setCreatedPosts([]);
    setTab("Home");
    setStage("login");
  }

  if (stage === "login") {
    return (
      <AuthScreen
        title="Welcome to Earnzo"
        subtitle="Enter your mobile number"
        placeholder="Mobile Number"
        value={mobile}
        setValue={setMobile}
        keyboardType="phone-pad"
        buttonText="Continue"
        note="Testing OTP: 1234"
        maxLength={10}
        onPress={() => {
          if (mobile.length !== 10) {
            Alert.alert(
              "Please enter a valid 10-digit mobile number"
            );
            return;
          }

          setStage("otp");
        }}
      />
    );
  }

  if (stage === "otp") {
    return (
      <AuthScreen
        title="Verify OTP"
        subtitle={`OTP sent to +91 ${mobile}`}
        placeholder="4-digit OTP"
        value={otp}
        setValue={setOtp}
        keyboardType="number-pad"
        buttonText="Verify OTP"
        maxLength={4}
        onPress={() => {
          if (otp !== "1234") {
            Alert.alert(
              "Wrong OTP",
              "Testing OTP is 1234"
            );
            return;
          }

          setStage("profile");
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
            <Text style={styles.authTitle}>
              Create Profile
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={[
                styles.input,
                { marginTop: 12 },
              ]}
              placeholder="Username"
              value={username}
              autoCapitalize="none"
              onChangeText={(text) =>
                setUsername(
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
                  !name.trim() ||
                  !username.trim()
                ) {
                  Alert.alert(
                    "Please enter name and username"
                  );
                  return;
                }

                setStage("app");
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

  let screen = null;

  if (tab === "Home") {
    screen = (
      <HomeScreen
        posts={posts}
        setPosts={setPosts}
        filter={filter}
        setFilter={setFilter}
        openComments={openComments}
      />
    );
  } else if (tab === "Shorts") {
    screen = (
      <ShortsScreen
        posts={posts}
        setPosts={setPosts}
        openComments={openComments}
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
        profilePhoto={profilePhoto}
        setProfilePhoto={setProfilePhoto}
        wallet={wallet}
        createdPosts={createdPosts}
        setCreatedPosts={setCreatedPosts}
        setPosts={setPosts}
        onEdit={() => {
          setEditName(name);
          setEditUsername(username);
          setEditProfile(true);
        }}
        onLogout={logout}
      />
    );
  }

  const searchResults = posts.filter((post) => {
    const q = searchText.trim().toLowerCase();

    if (!q) {
      return false;
    }

    return (
      post.name?.toLowerCase().includes(q) ||
      post.handle?.toLowerCase().includes(q) ||
      post.title?.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.smallLogo}>
            <Text style={styles.smallLogoText}>
              E
            </Text>
          </View>

          <View>
            <Text style={styles.logoText}>
              Earnzo
            </Text>

            <Text style={styles.smallText}>
              Create • Connect • Earn
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.notificationButton}
            onPress={() =>
              setNotificationOpen(true)
            }
          >
            <Text style={{ fontSize: 17 }}>
              🔔
            </Text>
          </Pressable>

          <Pressable
            style={styles.searchButton}
            onPress={() => setSearchOpen(true)}
          >
            <Text style={{ fontSize: 17 }}>
              🔍
            </Text>
          </Pressable>

          <View style={styles.walletPill}>
            <Text style={styles.walletPillText}>
              ₹{wallet}
            </Text>
          </View>

          <Pressable
            style={styles.avatar}
            onPress={() => setTab("Profile")}
          >
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                style={styles.headerAvatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {(name || "S")[0].toUpperCase()}
              </Text>
            )}
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
                    color: COLORS.white,
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

      {/* SEARCH MODAL */}
      <Modal
        visible={searchOpen}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSearchOpen(false)
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
                Search
              </Text>

              <Pressable
                onPress={() =>
                  setSearchOpen(false)
                }
              >
                <Text style={styles.closeText}>
                  ✕
                </Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Search creator or post..."
              value={searchText}
              onChangeText={setSearchText}
            />

            <ScrollView
              style={{
                maxHeight: 360,
                marginTop: 14,
              }}
              keyboardShouldPersistTaps="handled"
            >
              {searchResults.map((post) => (
                <Pressable
                  key={post.id}
                  style={styles.searchResult}
                  onPress={() => {
                    setSearchOpen(false);
                    setSearchText("");
                    setTab("Home");
                  }}
                >
                  <Text style={styles.creatorName}>
                    {post.name}
                  </Text>

                  <Text style={styles.smallText}>
                    {post.handle}
                  </Text>

                  <Text
                    style={{
                      color: COLORS.text,
                      marginTop: 5,
                    }}
                  >
                    {post.title}
                  </Text>
                </Pressable>
              ))}

              {searchText.trim() &&
              searchResults.length === 0 ? (
                <Text style={styles.emptyText}>
                  No results found
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* NOTIFICATION MODAL */}
      <Modal
        visible={notificationOpen}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setNotificationOpen(false)
        }
      >
        <View style={styles.modalBackground}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Notifications
              </Text>

              <Pressable
                onPress={() =>
                  setNotificationOpen(false)
                }
              >
                <Text style={styles.closeText}>
                  ✕
                </Text>
              </Pressable>
            </View>

            {[
              {
                icon: "❤️",
                title: "New Like",
                text: "Ravi liked your video.",
                time: "2 min ago",
              },
              {
                icon: "💬",
                title: "New Comment",
                text: "Neha commented on your post.",
                time: "10 min ago",
              },
              {
                icon: "👤",
                title: "New Follower",
                text: "Aman started following you.",
                time: "1 hour ago",
              },
              {
                icon: "₹",
                title: "Earnings",
                text: "₹120 added to your creator wallet.",
                time: "Today",
              },
            ].map((item, index) => (
              <View
                key={index}
                style={styles.notificationRow}
              >
                <View
                  style={styles.notificationIcon}
                >
                  <Text style={{ fontSize: 20 }}>
                    {item.icon}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.creatorName}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={{
                      color: COLORS.text,
                      marginTop: 3,
                    }}
                  >
                    {item.text}
                  </Text>

                  <Text
                    style={{
                      color: COLORS.gray,
                      fontSize: 11,
                      marginTop: 4,
                    }}
                  >
                    {item.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>

      {/* COMMENTS MODAL */}
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
                    key={`${index}-${comment}`}
                    style={styles.commentRow}
                  >
                    <View
                      style={styles.commentAvatar}
                    >
                      <Text
                        style={{
                          color: COLORS.purple,
                          fontWeight: "900",
                        }}
                      >
                        U
                      </Text>
                    </View>

                    <View
                      style={styles.commentBubble}
                    >
                      <Text
                        style={styles.commentUser}
                      >
                        User
                      </Text>

                      <Text>{comment}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View
              style={styles.commentComposer}
            >
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
                  style={styles.sendButtonText}
                >
                  Send
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* EDIT PROFILE MODAL */}
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
                style={styles.primaryButtonText}
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
  placeholder,
  value,
  setValue,
  keyboardType,
  buttonText,
  onPress,
  note,
  maxLength,
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
            maxLength={maxLength}
          />

          <Pressable
            style={styles.primaryButton}
            onPress={onPress}
          >
            <Text
              style={styles.primaryButtonText}
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
                (post.likes || 0) +
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
              following: !post.following,
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
      (post) => post.country === "India"
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
        showsHorizontalScrollIndicator={false}
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
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && {
                    color: COLORS.white,
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
                {(post.name || "U")[0]}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.creatorName}>
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
                {formatNumber(
                  post.likes || 0
                )}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                openComments(post)
              }
            >
              <Text style={styles.actionText}>
                💬{" "}
                {(post.comments || []).length}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Share.share({
                  message: `${post.name} on Earnzo\n${post.title}`,
                })
              }
            >
              <Text style={styles.actionText}>
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
      <Image
        source={{ uri: post.mediaUri }}
        style={styles.postImage}
        resizeMode="cover"
      />
    );
  }

  if (
    (post.mediaType === "short" ||
      post.mediaType === "long") &&
    post.mediaUri
  ) {
    return <VideoCard uri={post.mediaUri} />;
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
    (post) => post.mediaType === "short"
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
                (item.likes || 0) +
                (item.liked ? -1 : 1),
            }
          : item
      )
    );
  }

  return (
    <View style={styles.shortsScreen}>
      <View style={styles.shortsTabs}>
        <Text style={styles.shortsTabActive}>
          For You
        </Text>

        <Text style={styles.shortsTab}>
          Following
        </Text>
      </View>

      <View style={styles.shortMedia}>
        {post.mediaType === "short" &&
        post.mediaUri ? (
          <ShortVideo uri={post.mediaUri} />
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
        <Text style={styles.shortCreator}>
          {post.handle}
        </Text>

        <Text style={styles.shortCaption}>
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
            {(post.comments || []).length}
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
      } catch (error) {
        console.log(error);
      }
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
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] =
    useState("short");

  const [caption, setCaption] =
    useState("");

  const [cover, setCover] = useState(null);
  const [tagPeople, setTagPeople] =
    useState("");
  const [location, setLocation] =
    useState("");
  const [topics, setTopics] =
    useState("");

  const [popup, setPopup] = useState("");
  const [tempValue, setTempValue] =
    useState("");

  const [liveSetup, setLiveSetup] =
    useState(false);
  const [live, setLive] = useState(false);
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
      result.canceled ||
      !result.assets?.[0]
    ) {
      return;
    }

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

    Alert.alert(
      "Published Successfully ✅",
      mediaType === "short"
        ? "Your Short is now visible on Home, Shorts and Profile."
        : "Your post is now visible on Home and Profile."
    );
  }

  if (live) {
    return (
      <View style={styles.liveScreen}>
        <View style={styles.liveTop}>
          <Text style={styles.liveBadge}>
            LIVE
          </Text>

          <Text style={styles.liveViewers}>
            👁 0 viewers
          </Text>
        </View>

        <Text style={styles.liveTitle}>
          {liveTitle}
        </Text>

        <View style={styles.liveCamera}>
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
            style={styles.primaryButtonText}
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
        contentContainerStyle={styles.scroll}
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
            style={styles.primaryButton}
            onPress={() => {
              if (!liveTitle.trim()) {
                Alert.alert(
                  "Please enter live title"
                );
                return;
              }

              setLive(true);
            }}
          >
            <Text
              style={styles.primaryButtonText}
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
              style={styles.cancelButtonText}
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
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.heading}>
          Create
        </Text>

        <Text style={styles.subtitleText}>
          Choose what you want to publish.
        </Text>

        <View style={styles.createGrid}>
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
            style={styles.selectedMediaCard}
          >
            <Text
              style={styles.selectedMediaTitle}
            >
              Selected{" "}
              {mediaType === "short"
                ? "Short / Reel"
                : mediaType === "long"
                ? "Long Video"
                : "Photo"}
            </Text>

            {mediaType === "photo" ? (
              <Image
                source={{ uri: media.uri }}
                style={styles.previewImage}
              />
            ) : (
              <SelectedVideo
                uri={media.uri}
              />
            )}

            <Text style={styles.readyText}>
              ✓ Ready
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
              source={{ uri: cover.uri }}
              style={styles.coverImage}
            />
          ) : null}

          <Pressable
            style={styles.publishButton}
            onPress={publishPost}
          >
            <Text
              style={styles.publishButtonText}
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
        <View style={styles.modalBackground}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.modalTitle}>
              {popup === "tag"
                ? "Tag People"
                : popup === "location"
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
                  : popup === "location"
                  ? "Delhi, India"
                  : "EV, Travel, Tech"
              }
              value={tempValue}
              onChangeText={setTempValue}
            />

            <Pressable
              style={styles.primaryButton}
              onPress={savePopupValue}
            >
              <Text
                style={styles.primaryButtonText}
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
                style={styles.cancelButtonText}
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
      style={styles.selectedVideoContainer}
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
        { borderColor: color },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.createIcon,
          { backgroundColor: color },
        ]}
      >
        <Text
          style={styles.createIconText}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.createTitle}>
        {title}
      </Text>

      <Text style={styles.createSubtitle}>
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
        <Text style={styles.optionTitle}>
          {title}
        </Text>

        {value ? (
          <Text style={styles.optionValue}>
            {value}
          </Text>
        ) : null}
      </View>

      <Text style={styles.optionArrow}>
        ›
      </Text>
    </Pressable>
  );
}

function EarnScreen({ wallet }) {
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
    >
      <Text style={styles.heading}>
        Earn
      </Text>

      <Text style={styles.subtitleText}>
        Creator rewards and brand opportunities.
      </Text>

      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>
          Available Balance
        </Text>

        <Text style={styles.moneyText}>
          ₹{wallet}
        </Text>

        <Text style={styles.walletSubtitle}>
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
            style={styles.withdrawButtonText}
          >
            Withdraw Money
          </Text>
        </Pressable>
      </View>

      <Text style={styles.subHeading}>
        Brand Tasks
      </Text>

      {[
        {
          brand: "VoltGo",
          title: "Create a 30-sec EV video",
          amount: "₹1,000",
          color: COLORS.purple,
        },
        {
          brand: "FoodBee",
          title: "Food Video Challenge",
          amount: "₹500",
          color: "#FF9F43",
        },
      ].map((task) => (
        <View
          key={task.brand}
          style={styles.taskCard}
        >
          <View
            style={[
              styles.taskLogo,
              {
                backgroundColor:
                  task.color,
              },
            ]}
          >
            <Text style={styles.taskLogoText}>
              {task.brand[0]}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.taskBrand}>
              {task.brand}
            </Text>

            <Text style={styles.taskTitle}>
              {task.title}
            </Text>
          </View>

          <View
            style={{ alignItems: "flex-end" }}
          >
            <Text style={styles.taskAmount}>
              {task.amount}
            </Text>

            <Pressable
              style={styles.applyButton}
              onPress={() =>
                Alert.alert(
                  "Applied ✅",
                  task.title
                )
              }
            >
              <Text
                style={styles.applyButtonText}
              >
                Apply
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function ProfileScreen({
  name,
  username,
  profilePhoto,
  setProfilePhoto,
  wallet,
  createdPosts,
  setCreatedPosts,
  setPosts,
  onEdit,
  onLogout,
}) {
  const [editPost, setEditPost] =
    useState(null);

  const [editCaption, setEditCaption] =
    useState("");

  async function changeProfilePhoto() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow photo access."
      );

      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        }
      );

    if (
      !result.canceled &&
      result.assets?.[0]
    ) {
      setProfilePhoto(
        result.assets[0].uri
      );
    }
  }

  function saveEditedPost() {
    const text = editCaption.trim();

    if (!text || !editPost) {
      return;
    }

    setCreatedPosts((oldPosts) =>
      oldPosts.map((item) =>
        item.id === editPost.id
          ? {
              ...item,
              title: text,
            }
          : item
      )
    );

    setPosts((oldPosts) =>
      oldPosts.map((item) =>
        item.id === editPost.id
          ? {
              ...item,
              title: text,
            }
          : item
      )
    );

    setEditPost(null);
    setEditCaption("");
  }

  function deletePost(post) {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setCreatedPosts(
              (oldPosts) =>
                oldPosts.filter(
                  (item) =>
                    item.id !== post.id
                )
            );

            setPosts((oldPosts) =>
              oldPosts.filter(
                (item) =>
                  item.id !== post.id
              )
            );
          },
        },
      ]
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.profileHero}>
          <Pressable
            style={styles.profileAvatar}
            onPress={changeProfilePhoto}
          >
            {profilePhoto ? (
              <Image
                source={{
                  uri: profilePhoto,
                }}
                style={
                  styles.profileAvatarImage
                }
              />
            ) : (
              <Text
                style={
                  styles.profileAvatarText
                }
              >
                {(name || "S")[0].toUpperCase()}
              </Text>
            )}
          </Pressable>

          <Text style={styles.profileName}>
            {name || "Creator"}
          </Text>

          <Text style={styles.profileHandle}>
            @{username || "creator"}
          </Text>

          <Text style={styles.tapPhotoText}>
            Tap photo to change
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
          <Text style={styles.editButtonText}>
            ✎ Edit Profile
          </Text>
        </Pressable>

        <Text style={styles.subHeading}>
          Your Posts
        </Text>

        {createdPosts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 34 }}>
              +
            </Text>

            <Text style={styles.creatorName}>
              No posts yet
            </Text>

            <Text style={styles.smallText}>
              Create your first post from the Create tab.
            </Text>
          </View>
        ) : (
          createdPosts.map((post) => (
            <View
              key={post.id}
              style={styles.profilePost}
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
                    style={{ fontSize: 22 }}
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

                <Text style={styles.smallText}>
                  {post.mediaType === "short"
                    ? "Short / Reel"
                    : post.mediaType === "long"
                    ? "Long Video"
                    : "Photo"}
                </Text>

                <View
                  style={styles.postEditRow}
                >
                  <Pressable
                    onPress={() => {
                      setEditPost(post);
                      setEditCaption(
                        post.title
                      );
                    }}
                  >
                    <Text
                      style={styles.editPostText}
                    >
                      Edit
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      deletePost(post)
                    }
                  >
                    <Text
                      style={
                        styles.deletePostText
                      }
                    >
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}

        <Pressable
          style={styles.logoutButton}
          onPress={onLogout}
        >
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={!!editPost}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setEditPost(null)
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
                Edit Caption
              </Text>

              <Pressable
                onPress={() =>
                  setEditPost(null)
                }
              >
                <Text style={styles.closeText}>
                  ✕
                </Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.captionInput}
              multiline
              value={editCaption}
              onChangeText={setEditCaption}
              placeholder="Update caption"
            />

            <Pressable
              style={styles.primaryButton}
              onPress={saveEditedPost}
            >
              <Text
                style={styles.primaryButtonText}
              >
                Save Changes
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function Stat({ number, title }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNumber}>
        {number}
      </Text>

      <Text style={styles.statTitle}>
        {title}
      </Text>
    </View>
  );
}

function formatNumber(number) {
  if (number >= 1000000) {
    return `${(
      number / 1000000
    ).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(
      number / 1000
    ).toFixed(1)}K`;
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
    backgroundColor: COLORS.white,
  },

  authContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },

  brandLogo: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: COLORS.purple,
    alignItems: "center",
    justifyContent: "center",
  },

  brandLogoText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 38,
  },

  brandTitle: {
    marginTop: 14,
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
  },

  brandTagline: {
    color: COLORS.gray,
    marginTop: 4,
    marginBottom: 24,
  },

  authCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 22,
    elevation: 3,
  },

  authTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: COLORS.text,
  },

  authSubtitle: {
    marginTop: 5,
    marginBottom: 18,
    color: COLORS.gray,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: COLORS.white,
    fontSize: 15,
  },

  primaryButton: {
    marginTop: 18,
    backgroundColor: COLORS.purple,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 15,
  },

  noteText: {
    marginTop: 12,
    textAlign: "center",
    color: COLORS.gray,
    fontSize: 12,
  },

  header: {
    minHeight: 78,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },

  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  smallLogo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.purple,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  smallLogoText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 23,
  },

  logoText: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
  },

  smallText: {
    fontSize: 12,
    color: COLORS.gray,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFF1F5",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },

  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.softPurple,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },

  walletPill: {
    marginLeft: 5,
    backgroundColor: "#EDFFF6",
    paddingHorizontal: 9,
    paddingVertical: 9,
    borderRadius: 12,
  },

  walletPillText: {
    color: COLORS.green,
    fontWeight: "900",
  },

  avatar: {
    marginLeft: 5,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.purple,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  headerAvatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarText: {
    color: COLORS.white,
    fontWeight: "900",
  },

  bottomNav: {
    minHeight: 94,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingBottom:
      Platform.OS === "android"
        ? 30
        : 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
  },

  navIconBox: {
    width: 38,
    height: 33,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  navIconBoxActive: {
    backgroundColor: COLORS.purple,
  },

  navIcon: {
    fontWeight: "900",
    color: COLORS.gray,
    fontSize: 17,
  },

  navText: {
    fontSize: 10,
    marginTop: 4,
    color: COLORS.gray,
    fontWeight: "700",
  },

  scroll: {
    padding: 16,
    paddingBottom: 32,
  },

  heroCard: {
    backgroundColor: COLORS.purple,
    padding: 20,
    borderRadius: 22,
    flexDirection: "row",
    marginBottom: 22,
  },

  heroTopText: {
    color: "#DCD3FF",
    fontSize: 11,
    fontWeight: "800",
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6,
  },

  heroSubtitle: {
    color: "#EEE9FF",
    marginTop: 6,
  },

  heroCoin: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#FFFFFF22",
    alignItems: "center",
    justifyContent: "center",
  },

  heroCoinText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
  },

  heading: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 10,
  },

  subHeading: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },

  subtitleText: {
    color: COLORS.gray,
    marginBottom: 18,
  },

  filters: {
    flexDirection: "row",
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
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
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: 16,
    padding: 14,
  },

  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  creatorAvatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: COLORS.softPurple,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  creatorAvatarText: {
    color: COLORS.purple,
    fontWeight: "900",
    fontSize: 18,
  },

  creatorName: {
    color: COLORS.text,
    fontWeight: "900",
  },

  followButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },

  followingButton: {
    backgroundColor: COLORS.softPurple,
  },

  followButtonText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
  },

  demoVideo: {
    height: 215,
    backgroundColor: "#151520",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  playCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF22",
    alignItems: "center",
    justifyContent: "center",
  },

  playText: {
    color: COLORS.white,
    fontSize: 26,
  },

  demoVideoText: {
    color: COLORS.white,
    marginTop: 10,
  },

  postImage: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    backgroundColor: "#EEE",
  },

  videoContainer: {
    width: "100%",
    height: 250,
    backgroundColor: COLORS.black,
    borderRadius: 16,
    overflow: "hidden",
  },

  videoPlayer: {
    width: "100%",
    height: "100%",
  },

  postTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 15,
    marginTop: 12,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  actionText: {
    marginRight: 22,
    color: COLORS.text,
    fontWeight: "800",
  },

  shortsScreen: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  shortsTabs: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
  },

  shortsTabActive: {
    color: COLORS.white,
    fontWeight: "900",
    marginHorizontal: 12,
  },

  shortsTab: {
    color: "#999",
    fontWeight: "800",
    marginHorizontal: 12,
  },

  shortMedia: {
    flex: 1,
  },

  shortVideo: {
    width: "100%",
    height: "100%",
  },

  shortDemo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  shortDemoIcon: {
    color: COLORS.white,
    fontSize: 54,
  },

  shortDemoText: {
    color: COLORS.white,
    marginTop: 12,
    fontWeight: "900",
  },

  shortInfo: {
    position: "absolute",
    left: 16,
    bottom: 28,
    width: "68%",
  },

  shortCreator: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 16,
  },

  shortCaption: {
    color: COLORS.white,
    marginTop: 6,
  },

  shortActions: {
    position: "absolute",
    right: 16,
    bottom: 30,
    alignItems: "center",
  },

  shortActionText: {
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "900",
    marginTop: 18,
  },

  createGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  createButton: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    marginBottom: 12,
  },

  createIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  createIconText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  createTitle: {
    color: COLORS.text,
    fontWeight: "900",
    marginTop: 10,
  },

  createSubtitle: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 3,
  },

  selectedMediaCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 18,
    marginTop: 10,
  },

  selectedMediaTitle: {
    color: COLORS.text,
    fontWeight: "900",
    marginBottom: 10,
  },

  readyText: {
    color: COLORS.green,
    fontWeight: "900",
    marginTop: 8,
  },

  previewImage: {
    width: "100%",
    height: 230,
    borderRadius: 14,
  },

  selectedVideoContainer: {
    width: "100%",
    height: 240,
    backgroundColor: COLORS.black,
    borderRadius: 14,
    overflow: "hidden",
  },

  selectedVideo: {
    width: "100%",
    height: "100%",
  },

  formCard: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
  },

  fieldLabel: {
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
  },

  captionInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 12,
    textAlignVertical: "top",
    backgroundColor: COLORS.white,
  },

  optionButton: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  optionTitle: {
    color: COLORS.text,
    fontWeight: "800",
  },

  optionValue: {
    color: COLORS.gray,
    marginTop: 3,
    fontSize: 12,
  },

  optionArrow: {
    fontSize: 25,
    color: COLORS.gray,
  },

  coverImage: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    marginTop: 10,
  },

  publishButton: {
    backgroundColor: COLORS.purple,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 18,
  },

  publishButtonText: {
    color: COLORS.white,
    fontWeight: "900",
  },

  liveScreen: {
    flex: 1,
    padding: 18,
    backgroundColor: COLORS.black,
  },

  liveTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  liveBadge: {
    backgroundColor: "#E53935",
    color: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    fontWeight: "900",
  },

  liveViewers: {
    color: COLORS.white,
  },

  liveTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 18,
  },

  liveCamera: {
    flex: 1,
    marginVertical: 20,
    borderRadius: 20,
    backgroundColor: "#20202A",
    alignItems: "center",
    justifyContent: "center",
  },

  liveDot: {
    color: "#E53935",
    fontSize: 30,
  },

  liveText: {
    color: COLORS.white,
    marginTop: 10,
  },

  endLiveButton: {
    backgroundColor: "#E53935",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },

  cancelButton: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },

  cancelButtonText: {
    color: COLORS.gray,
    fontWeight: "900",
  },

  walletCard: {
    backgroundColor: COLORS.purple,
    borderRadius: 22,
    padding: 22,
  },

  walletLabel: {
    color: "#DDD4FF",
    fontWeight: "800",
  },

  moneyText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 34,
    marginTop: 6,
  },

  walletSubtitle: {
    color: "#EAE5FF",
    marginTop: 4,
  },

  withdrawButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 18,
  },

  withdrawButtonText: {
    color: COLORS.purple,
    fontWeight: "900",
  },

  taskCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  taskLogo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  taskLogoText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 20,
  },

  taskBrand: {
    color: COLORS.text,
    fontWeight: "900",
  },

  taskTitle: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 3,
  },

  taskAmount: {
    color: COLORS.green,
    fontWeight: "900",
  },

  applyButton: {
    backgroundColor: COLORS.softPurple,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 6,
  },

  applyButtonText: {
    color: COLORS.purple,
    fontWeight: "900",
    fontSize: 12,
  },

  profileHero: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
  },

  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.softPurple,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  profileAvatarImage: {
    width: "100%",
    height: "100%",
  },

  profileAvatarText: {
    color: COLORS.purple,
    fontWeight: "900",
    fontSize: 34,
  },

  profileName: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 12,
  },

  profileHandle: {
    color: COLORS.gray,
    marginTop: 3,
  },

  tapPhotoText: {
    color: COLORS.purple,
    fontSize: 11,
    marginTop: 5,
  },

  statsCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginTop: 14,
    paddingVertical: 16,
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16,
  },

  statTitle: {
    color: COLORS.gray,
    fontSize: 10,
    marginTop: 3,
  },

  editButton: {
    backgroundColor: COLORS.softPurple,
    padding: 13,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 14,
  },

  editButtonText: {
    color: COLORS.purple,
    fontWeight: "900",
  },

  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    alignItems: "center",
    padding: 24,
  },

  profilePost: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    marginBottom: 10,
  },

  profileThumbnail: {
    width: 76,
    height: 76,
    borderRadius: 12,
    marginRight: 12,
  },

  profileVideoThumbnail: {
    width: 76,
    height: 76,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#E9E9EE",
    alignItems: "center",
    justifyContent: "center",
  },

  profilePostTitle: {
    color: COLORS.text,
    fontWeight: "900",
    marginBottom: 5,
  },

  postEditRow: {
    flexDirection: "row",
    marginTop: 8,
  },

  editPostText: {
    color: COLORS.blue,
    fontWeight: "900",
    marginRight: 18,
  },

  deletePostText: {
    color: "#D94467",
    fontWeight: "900",
  },

  logoutButton: {
    borderWidth: 1,
    borderColor: "#FFCBD8",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },

  logoutText: {
    color: "#D94467",
    fontWeight: "900",
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "flex-end",
  },

  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom:
      Platform.OS === "android"
        ? 34
        : 20,
    maxHeight: "85%",
  },

  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D9DAE3",
    alignSelf: "center",
    marginBottom: 14,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },

  closeText: {
    color: COLORS.gray,
    fontSize: 22,
    fontWeight: "900",
  },

  searchResult: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },

  notificationRow: {
    flexDirection: "row",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },

  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.softPurple,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  emptyText: {
    textAlign: "center",
    color: COLORS.gray,
    paddingVertical: 22,
  },

  commentRow: {
    flexDirection: "row",
    marginBottom: 12,
  },

  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.softPurple,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  commentBubble: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 10,
    borderRadius: 13,
  },

  commentUser: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 12,
    marginBottom: 3,
  },

  commentComposer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  sendButton: {
    marginLeft: 8,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 13,
  },

  sendButtonText: {
    color: COLORS.white,
    fontWeight: "900",
  },
});
