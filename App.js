import React, { useState } from "react";
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
    comments: ["Nice video!", "Bahut badhiya 🔥"],
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
  },
  {
    id: "3",
    name: "Tech Aman",
    handle: "@techaman",
    title: "Best phone tricks",
    likes: 7200,
    following: true,
    trending: true,
    country: "India",
    liked: false,
    comments: [],
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
  const [created, setCreated] = useState([]);

  const [filter, setFilter] = useState("For You");

  const [commentPost, setCommentPost] = useState(null);
  const [commentText, setCommentText] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");

  const wallet = 1240;

  if (stage === "login") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.auth}>
          <Text style={styles.bigLogo}>Earnzo</Text>

          <Text style={styles.tagline}>
            Create • Connect • Earn
          </Text>

          <Text style={styles.authTitle}>
            Welcome to Earnzo
          </Text>

          <Text style={styles.sub}>
            Enter your mobile number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobile}
            onChangeText={setMobile}
          />

          <Pressable
            style={styles.blackButton}
            onPress={() => {
              if (mobile.length === 10) {
                setStage("otp");
              } else {
                Alert.alert("Enter valid mobile number");
              }
            }}
          >
            <Text style={styles.whiteButtonText}>
              Continue
            </Text>
          </Pressable>

          <Text style={styles.testing}>
            Testing OTP: 1234
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === "otp") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.auth}>

          <Text style={styles.bigLogo}>
            Earnzo
          </Text>

          <Text style={styles.authTitle}>
            Verify OTP
          </Text>

          <Text style={styles.sub}>
            OTP sent to +91 {mobile}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
          />

          <Pressable
            style={styles.blackButton}
            onPress={() => {
              if (otp === "1234") {
                setStage("profileSetup");
              } else {
                Alert.alert(
                  "Wrong OTP",
                  "Testing OTP is 1234"
                );
              }
            }}
          >
            <Text style={styles.whiteButtonText}>
              Verify OTP
            </Text>
          </Pressable>

        </View>
      </SafeAreaView>
    );
  }

  if (stage === "profileSetup") {
    return (
      <SafeAreaView style={styles.safe}>

        <View style={styles.auth}>

          <Text style={styles.bigLogo}>
            Earnzo
          </Text>

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
            onChangeText={(value) =>
              setUsername(
                value
                  .replace(/\s/g, "")
                  .toLowerCase()
              )
            }
          />

          <Pressable
            style={styles.blackButton}
            onPress={() => {
              if (
                name.trim() &&
                username.trim()
              ) {
                setStage("app");
              } else {
                Alert.alert(
                  "Enter name and username"
                );
              }
            }}
          >
            <Text style={styles.whiteButtonText}>
              Start Earnzo
            </Text>
          </Pressable>

        </View>

      </SafeAreaView>
    );
  }

  let screen;

  if (tab === "Home") {
    screen = (
      <Home
        posts={posts}
        setPosts={setPosts}
        filter={filter}
        setFilter={setFilter}
        openComments={(post) =>
          setCommentPost(post)
        }
      />
    );
  }

  if (tab === "Shorts") {
    screen = (
      <Shorts
        posts={posts}
        setPosts={setPosts}
        openComments={(post) =>
          setCommentPost(post)
        }
      />
    );
  }

  if (tab === "Create") {
    screen = (
      <Create
        posts={posts}
        setPosts={setPosts}
        created={created}
        setCreated={setCreated}
        name={name}
        username={username}
      />
    );
  }

  if (tab === "Earn") {
    screen = (
      <Earn wallet={wallet} />
    );
  }

  if (tab === "Profile") {
    screen = (
      <Profile
        name={name}
        username={username}
        wallet={wallet}
        created={created}
        edit={() => {
          setEditName(name);
          setEditUsername(username);
          setEditOpen(true);
        }}
        logout={() => {
          setStage("login");
          setTab("Home");
          setOtp("");
        }}
      />
    );
  }

  const sendComment = () => {

    if (!commentText.trim()) return;

    setPosts((old) =>
      old.map((post) => {

        if (
          post.id === commentPost.id
        ) {
          return {
            ...post,
            comments: [
              ...(post.comments || []),
              commentText,
            ],
          };
        }

        return post;
      })
    );

    setCommentPost((old) => ({
      ...old,
      comments: [
        ...(old.comments || []),
        commentText,
      ],
    }));

    setCommentText("");
  };

  return (
    <SafeAreaView style={styles.safe}>

      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
      />

      <View style={styles.header}>

        <View>
          <Text style={styles.logo}>
            Earnzo
          </Text>

          <Text style={styles.smallTag}>
            Create • Connect • Earn
          </Text>
        </View>

        <View style={styles.headerRight}>

          <Text style={styles.walletTop}>
            ₹{wallet}
          </Text>

          <Pressable
            style={styles.avatar}
            onPress={() =>
              setTab("Profile")
            }
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
          ["Create", "＋"],
          ["Earn", "₹"],
          ["Profile", "◉"],
        ].map(([item, icon]) => (

          <Pressable
            key={item}
            style={styles.navItem}
            onPress={() =>
              setTab(item)
            }
          >

            <View
              style={[
                styles.navCircle,
                tab === item &&
                  styles.navCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.navIcon,
                  tab === item && {
                    color: "#fff",
                  },
                ]}
              >
                {icon}
              </Text>
            </View>

            <Text style={styles.navLabel}>
              {item}
            </Text>

          </Pressable>

        ))}

      </View>

      {/* COMMENT POPUP */}

      <Modal
        visible={!!commentPost}
        transparent
        animationType="slide"
      >

        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >

          <View style={styles.modalBox}>

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                Comments
              </Text>

              <Pressable
                onPress={() =>
                  setCommentPost(null)
                }
              >
                <Text style={styles.close}>
                  ✕
                </Text>
              </Pressable>

            </View>

            <ScrollView
              style={{
                maxHeight: 250,
              }}
            >

              {(commentPost?.comments || [])
                .map((comment, index) => (

                  <View
                    key={index}
                    style={styles.comment}
                  >

                    <View
                      style={
                        styles.commentAvatar
                      }
                    >
                      <Text>U</Text>
                    </View>

                    <Text
                      style={{
                        flex: 1,
                      }}
                    >
                      {comment}
                    </Text>

                  </View>

                ))}

            </ScrollView>

            <View
              style={
                styles.commentInputRow
              }
            >

              <TextInput
                style={
                  styles.commentInput
                }
                placeholder="Write comment..."
                value={commentText}
                onChangeText={
                  setCommentText
                }
              />

              <Pressable
                style={styles.sendButton}
                onPress={sendComment}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "900",
                  }}
                >
                  Send
                </Text>
              </Pressable>

            </View>

          </View>

        </KeyboardAvoidingView>

      </Modal>

      {/* EDIT PROFILE */}

      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
      >

        <View style={styles.modalBackground}>

          <View style={styles.modalBox}>

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                Edit Profile
              </Text>

              <Pressable
                onPress={() =>
                  setEditOpen(false)
                }
              >
                <Text style={styles.close}>
                  ✕
                </Text>
              </Pressable>

            </View>

            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Name"
            />

            <TextInput
              style={[
                styles.input,
                { marginTop: 12 },
              ]}
              value={editUsername}
              onChangeText={
                setEditUsername
              }
              placeholder="Username"
            />

            <Pressable
              style={styles.blackButton}
              onPress={() => {

                if (
                  !editName.trim() ||
                  !editUsername.trim()
                ) {
                  Alert.alert(
                    "Enter complete details"
                  );
                  return;
                }

                setName(editName);
                setUsername(editUsername);

                setEditOpen(false);

              }}
            >

              <Text
                style={
                  styles.whiteButtonText
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

function Home({
  posts,
  setPosts,
  filter,
  setFilter,
  openComments,
}) {

  const like = (id) => {

    setPosts((old) =>
      old.map((post) => {

        if (post.id === id) {

          return {
            ...post,
            liked: !post.liked,
            likes:
              post.likes +
              (post.liked ? -1 : 1),
          };

        }

        return post;

      })
    );

  };

  const follow = (id) => {

    setPosts((old) =>
      old.map((post) =>
        post.id === id
          ? {
              ...post,
              following:
                !post.following,
            }
          : post
      )
    );

  };

  const share = async (post) => {

    await Share.share({
      message:
        `${post.name} on Earnzo\n\n` +
        post.title,
    });

  };

  let visible = posts;

  if (filter === "Following") {
    visible = posts.filter(
      (post) => post.following
    );
  }

  if (filter === "Trending") {
    visible = posts.filter(
      (post) => post.trending
    );
  }

  if (filter === "India") {
    visible = posts.filter(
      (post) =>
        post.country === "India"
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.scroll
      }
    >

      <Text style={styles.pageTitle}>
        Your Feed
      </Text>

      <Text style={styles.sub}>
        Discover creators and videos
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
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
              onPress={() =>
                setFilter(item)
              }
              style={[
                styles.filterButton,
                filter === item &&
                  styles.filterActive,
              ]}
            >

              <Text
                style={[
                  styles.filterText,
                  filter === item && {
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

      {visible.map((post) => (

        <View
          key={post.id}
          style={styles.post}
        >

          <View style={styles.postTop}>

            <View
              style={
                styles.smallAvatar
              }
            >
              <Text>
                {post.name[0]}
              </Text>
            </View>

            <View style={{ flex: 1 }}>

              <Text style={styles.bold}>
                {post.name}
              </Text>

              <Text style={styles.gray}>
                {post.handle}
              </Text>

            </View>

            <Pressable
              style={[
                styles.followButton,
                post.following && {
                  backgroundColor:
                    "#eee",
                },
              ]}
              onPress={() =>
                follow(post.id)
              }
            >

              <Text
                style={{
                  color:
                    post.following
                      ? "#111"
                      : "#fff",
                  fontWeight: "800",
                }}
              >
                {post.following
                  ? "Following"
                  : "Follow"}
              </Text>

            </Pressable>

          </View>

<PostMedia post={post} />
                function PostMedia({ post }) {

  if (
    post.mediaType === "photo" &&
    post.mediaUri
  ) {
    return (
      <View style={styles.videoBox}>
        <Image
          source={{ uri: post.mediaUri }}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </View>
    );
  }

  if (
    (post.mediaType === "short" ||
      post.mediaType === "long") &&
    post.mediaUri
  ) {

    const player =
      useVideoPlayer(
        post.mediaUri,
        (player) => {
          player.loop = false;
        }
      );

    return (
      <VideoView
        style={styles.videoPlayer}
        player={player}
        nativeControls
        contentFit="contain"
      />
    );
  }

  return (
    <View style={styles.videoBox}>
      <Text style={{ fontSize: 40 }}>
        ▶
      </Text>
      <Text style={styles.gray}>
        Demo Video
      </Text>
    </View>
  );
}

          <Text style={styles.postTitle}>
            {post.title}
          </Text>

          <View style={styles.actions}>

            <Pressable
              onPress={() =>
                like(post.id)
              }
            >
              <Text style={styles.bold}>
                {post.liked
                  ? "♥"
                  : "♡"}{" "}
                {post.likes}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                openComments(post)
              }
            >
              <Text style={styles.bold}>
                💬{" "}
                {
                  (
                    post.comments || []
                  ).length
                }
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                share(post)
              }
            >
              <Text style={styles.bold}>
                ↗ Share
              </Text>
            </Pressable>

          </View>

        </View>

      ))}

    </ScrollView>
  );
}

function Shorts({
  posts,
  setPosts,
  openComments,
}) {

  const [index, setIndex] =
    useState(0);

  const shorts = posts.filter(
    (post) =>
      post.mediaType === "short" ||
      !post.mediaType
  );

  const post =
    shorts[
      index %
        Math.max(shorts.length, 1)
    ] || demoPosts[0];

  const share = async () => {

    await Share.share({
      message:
        `${post.name}\n${post.title}`,
    });

  };

  return (
    <View style={styles.shortsScreen}>

      <View style={styles.shortTabs}>

        <Text style={styles.whiteBold}>
          For You
        </Text>

        <Text style={styles.grayWhite}>
          Following
        </Text>

      </View>

      <Pressable
        style={styles.shortVideo}
        onPress={() =>
          setIndex(index + 1)
        }
      >

        <Text
          style={{
            color: "#fff",
            fontSize: 45,
          }}
        >
          ▶
        </Text>

        <Text style={styles.grayWhite}>
          Tap for next Short
        </Text>

      </Pressable>

      <View style={styles.shortInfo}>

        <Text style={styles.whiteBold}>
          {post.handle}
        </Text>

        <Text style={{ color: "#fff" }}>
          {post.title}
        </Text>

      </View>

      <View style={styles.shortActions}>

        <Pressable
          onPress={() => {

            setPosts((old) =>
              old.map((item) =>
                item.id === post.id
                  ? {
                      ...item,
                      liked:
                        !item.liked,
                      likes:
                        item.likes +
                        (item.liked
                          ? -1
                          : 1),
                    }
                  : item
              )
            );

          }}
        >

          <Text style={styles.whiteBold}>
            {post.liked ? "♥" : "♡"}
          </Text>

        </Pressable>

        <Pressable
          onPress={() =>
            openComments(post)
          }
        >
          <Text style={styles.whiteBold}>
            💬
          </Text>
        </Pressable>

        <Pressable
          onPress={share}
        >
          <Text style={styles.whiteBold}>
            ↗
          </Text>
        </Pressable>

      </View>

    </View>
  );
}

function Create({
  posts,
  setPosts,
  created,
  setCreated,
  name,
  username,
}) {

  const [media, setMedia] =
    useState(null);

  const [type, setType] =
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

  const [temp, setTemp] =
    useState("");

  const [liveSetup, setLiveSetup] =
    useState(false);

  const [live, setLive] =
    useState(false);

  const [liveTitle, setLiveTitle] =
    useState("");

  const permission = async () => {

    const result =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (!result.granted) {

      Alert.alert(
        "Permission required",
        "Allow photo and video access."
      );

      return false;

    }

    return true;

  };

  const selectMedia = async (
    mediaType
  ) => {

    if (!(await permission())) return;

    const picker =
      await ImagePicker
        .launchImageLibraryAsync({
          mediaTypes:
            mediaType === "photo"
              ? ["images"]
              : ["videos"],
          quality: 0.8,
        });

    if (
      !picker.canceled &&
      picker.assets?.[0]
    ) {

      const asset =
        picker.assets[0];

      if (
        mediaType === "short" &&
        asset.duration &&
        asset.duration > 90000
      ) {

        Alert.alert(
          "Short too long",
          "Maximum 1.5 minutes allowed."
        );

        return;

      }

      setType(mediaType);
      setMedia(asset);

    }

  };

  const selectCover = async () => {

    if (!(await permission())) return;

    const picker =
      await ImagePicker
        .launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });

    if (
      !picker.canceled &&
      picker.assets?.[0]
    ) {
      setCover(picker.assets[0]);
    }

  };

  const openPopup = (
    type,
    value
  ) => {

    setPopup(type);
    setTemp(value);

  };

  const savePopup = () => {

    if (popup === "tag")
      setTagPeople(temp);

    if (popup === "location")
      setLocation(temp);

    if (popup === "topics")
      setTopics(temp);

    setPopup("");
    setTemp("");

  };

  const publish = () => {

    if (!media) {

      Alert.alert(
        "Select media first"
      );

      return;

    }

    if (!caption.trim()) {

      Alert.alert(
        "Write caption"
      );

      return;

    }

    const newPost = {

      id: Date.now().toString(),

      name:
        name || "Creator",

      handle:
        "@" +
        (username || "creator"),

      title: caption,

      likes: 0,

      comments: [],

      following: false,

      liked: false,

      trending: false,

      country: "India",

      mediaType: type,

      mediaUri: media.uri,

      coverUri:
        cover?.uri || "",

      tagPeople,

      location,

      topics,
    };

    setPosts([
      newPost,
      ...posts,
    ]);

    setCreated([
      newPost,
      ...created,
    ]);

    setMedia(null);
    setCaption("");
    setCover(null);
    setTagPeople("");
    setLocation("");
    setTopics("");

    Alert.alert(
      "Published",
      "Post Home and Profile mein add ho gaya."
    );

  };

  if (live) {

    return (
      <View style={styles.liveScreen}>

        <Text style={styles.liveBadge}>
          LIVE
        </Text>

        <Text style={styles.liveTitle}>
          {liveTitle}
        </Text>

        <View style={styles.liveCamera}>

          <Text
            style={{
              color: "#fff",
              fontSize: 45,
            }}
          >
            ●
          </Text>

          <Text
            style={{
              color: "#fff",
            }}
          >
            Live Camera Testing
          </Text>

        </View>

        <Pressable
          style={styles.endLive}
          onPress={() => {

            setLive(false);
            setLiveSetup(false);

          }}
        >
          <Text
            style={
              styles.whiteButtonText
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
      <View style={styles.auth}>

        <Text style={styles.pageTitle}>
          Go Live
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Live title"
          value={liveTitle}
          onChangeText={
            setLiveTitle
          }
        />

        <Pressable
          style={styles.blackButton}
          onPress={() => {

            if (
              liveTitle.trim()
            ) {
              setLive(true);
            } else {
              Alert.alert(
                "Enter live title"
              );
            }

          }}
        >
          <Text
            style={
              styles.whiteButtonText
            }
          >
            Start Live
          </Text>
        </Pressable>

      </View>
    );

  }

  return (
    <>

      <ScrollView
        contentContainerStyle={
          styles.scroll
        }
      >

        <Text style={styles.pageTitle}>
          Create
        </Text>

        <Text style={styles.sub}>
          Choose content type
        </Text>

        <View style={styles.createGrid}>

          <CreateButton
            icon="▶"
            title="Short / Reel"
            subtitle="Max 1.5 min"
            press={() =>
              selectMedia("short")
            }
          />

          <CreateButton
            icon="▣"
            title="Long Video"
            press={() =>
              selectMedia("long")
            }
          />

          <CreateButton
            icon="◎"
            title="Photo"
            press={() =>
              selectMedia("photo")
            }
          />

          <CreateButton
            icon="●"
            title="Go Live"
            press={() =>
              setLiveSetup(true)
            }
          />

        </View>

        {media && (

          <View style={styles.preview}>

            <Text style={styles.bold}>
              Selected{" "}
              {type}
            </Text>

            {type === "photo" ? (

              <Image
                source={{
                  uri: media.uri,
                }}
                style={
                  styles.previewImage
                }
              />

            ) : (

              <View
                style={
                  styles.videoPreview
                }
              >

                <Text
                  style={{
                    fontSize: 35,
                  }}
                >
                  ▶
                </Text>

                <Text>
                  {media.fileName ||
                    "Video selected"}
                </Text>

              </View>

            )}

          </View>

        )}

        <View style={styles.createForm}>

          <Text style={styles.bold}>
            Caption
          </Text>

          <TextInput
            multiline
            style={styles.caption}
            placeholder="Write caption..."
            value={caption}
            onChangeText={
              setCaption
            }
          />

          <Option
            title="🏷 Tag People"
            value={tagPeople}
            press={() =>
              openPopup(
                "tag",
                tagPeople
              )
            }
          />

          <Option
            title="📍 Add Location"
            value={location}
            press={() =>
              openPopup(
                "location",
                location
              )
            }
          />

          <Option
            title="# Add Topics"
            value={topics}
            press={() =>
              openPopup(
                "topics",
                topics
              )
            }
          />

          <Option
            title="🖼 Select Cover"
            value={
              cover
                ? "Cover selected ✓"
                : ""
            }
            press={selectCover}
          />

          {cover && (

            <Image
              source={{
                uri: cover.uri,
              }}
              style={
                styles.coverImage
              }
            />

          )}

          <Pressable
            style={styles.blackButton}
            onPress={publish}
          >

            <Text
              style={
                styles.whiteButtonText
              }
            >
              Publish
            </Text>

          </Pressable>

        </View>

      </ScrollView>

      <Modal
        visible={!!popup}
        transparent
      >

        <View
          style={
            styles.modalBackground
          }
        >

          <View
            style={styles.modalBox}
          >

            <Text
              style={
                styles.modalTitle
              }
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
                { marginTop: 15 },
              ]}
              value={temp}
              onChangeText={setTemp}
              placeholder="Enter details"
            />

            <Pressable
              style={
                styles.blackButton
              }
              onPress={savePopup}
            >
              <Text
                style={
                  styles.whiteButtonText
                }
              >
                Save
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancel}
              onPress={() =>
                setPopup("")
              }
            >
              <Text>Cancel</Text>
            </Pressable>

          </View>

        </View>

      </Modal>

    </>
  );
}

function CreateButton({
  icon,
  title,
  subtitle,
  press,
}) {

  return (
    <Pressable
      style={styles.createButton}
      onPress={press}
    >

      <Text style={{ fontSize: 28 }}>
        {icon}
      </Text>

      <Text style={styles.bold}>
        {title}
      </Text>

      {subtitle && (
        <Text style={styles.gray}>
          {subtitle}
        </Text>
      )}

    </Pressable>
  );
}

function Option({
  title,
  value,
  press,
}) {

  return (
    <Pressable
      style={styles.option}
      onPress={press}
    >

      <View>

        <Text>{title}</Text>

        {!!value && (
          <Text style={styles.gray}>
            {value}
          </Text>
        )}

      </View>

      <Text>›</Text>

    </Pressable>
  );
}

function Earn({ wallet }) {

  return (
    <ScrollView
      contentContainerStyle={
        styles.scroll
      }
    >

      <Text style={styles.pageTitle}>
        Earn
      </Text>

      <View style={styles.walletCard}>

        <Text style={styles.grayWhite}>
          Available Balance
        </Text>

        <Text style={styles.money}>
          ₹{wallet}
        </Text>

        <Pressable
          style={styles.withdraw}
          onPress={() =>
            Alert.alert(
              "Withdraw",
              "Real payment backend baad mein connect hoga."
            )
          }
        >
          <Text style={styles.bold}>
            Withdraw Money
          </Text>
        </Pressable>

      </View>

      <Text style={styles.section}>
        Brand Tasks
      </Text>

      {[
        [
          "VoltGo",
          "Create 30 sec EV Video",
          "₹1,000",
        ],
        [
          "FoodBee",
          "Food Video Challenge",
          "₹500",
        ],
      ].map(
        ([brand, title, money]) => (

          <View
            key={brand}
            style={styles.task}
          >

            <View style={{ flex: 1 }}>
              <Text style={styles.gray}>
                {brand}
              </Text>

              <Text style={styles.bold}>
                {title}
              </Text>
            </View>

            <View>
              <Text style={styles.bold}>
                {money}
              </Text>

              <Pressable
                style={styles.apply}
                onPress={() =>
                  Alert.alert(
                    "Applied"
                  )
                }
              >
                <Text
                  style={{
                    color: "#fff",
                  }}
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

function Profile({
  name,
  username,
  wallet,
  created,
  edit,
  logout,
}) {

  return (
    <ScrollView
      contentContainerStyle={
        styles.scroll
      }
    >

      <View
        style={{
          alignItems: "center",
        }}
      >

        <View
          style={
            styles.profileAvatar
          }
        >
          <Text
            style={
              styles.profileAvatarText
            }
          >
            {(name || "S")[0]
              .toUpperCase()}
          </Text>
        </View>

        <Text
          style={[
            styles.pageTitle,
            { fontSize: 22 },
          ]}
        >
          {name}
        </Text>

        <Text style={styles.gray}>
          @{username}
        </Text>

      </View>

      <View style={styles.stats}>

        <Stat
          number={created.length}
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
        onPress={edit}
      >
        <Text style={styles.bold}>
          Edit Profile
        </Text>
      </Pressable>

      <Text style={styles.section}>
        Your Posts
      </Text>

      {created.length === 0 ? (

        <View style={styles.empty}>

          <Text
            style={{
              fontSize: 35,
            }}
          >
            ＋
          </Text>

          <Text style={styles.bold}>
            No Posts Yet
          </Text>

        </View>

      ) : (

        created.map((post) => (

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
                style={styles.thumbnail}
              />

            ) : (

              <View
                style={
                  styles.thumbnailBox
                }
              >
                <Text>▶</Text>
              </View>

            )}

            <View style={{ flex: 1 }}>

              <Text style={styles.bold}>
                {post.title}
              </Text>

              <Text style={styles.gray}>
                {post.mediaType}
              </Text>

            </View>

          </View>

        ))

      )}

      <Pressable
        style={styles.logout}
        onPress={logout}
      >
        <Text style={styles.bold}>
          Logout
        </Text>
      </Pressable>

    </ScrollView>
  );
}

function Stat({
  number,
  title,
}) {

  return (
    <View style={styles.stat}>

      <Text style={styles.bold}>
        {number}
      </Text>

      <Text style={styles.gray}>
        {title}
      </Text>

    </View>
  );
}

const styles =
  StyleSheet.create({

    safe: {
      flex: 1,
      backgroundColor: "#f7f8fb",

      paddingTop:
        Platform.OS === "android"
          ? StatusBar.currentHeight
          : 0,
    },

    auth: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 28,
      backgroundColor: "#fff",
    },

    bigLogo: {
      fontSize: 44,
      fontWeight: "900",
      textAlign: "center",
    },

    tagline: {
      textAlign: "center",
      color: "#777",
      marginBottom: 45,
    },

    authTitle: {
      fontSize: 27,
      fontWeight: "900",
      marginBottom: 5,
    },

    sub: {
      color: "#777",
      marginBottom: 18,
    },

    input: {
      height: 55,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 14,
      paddingHorizontal: 15,
      backgroundColor: "#f7f8fb",
    },

    blackButton: {
      height: 55,
      borderRadius: 14,
      backgroundColor: "#111",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 15,
    },

    whiteButtonText: {
      color: "#fff",
      fontWeight: "900",
      fontSize: 16,
    },

    testing: {
      textAlign: "center",
      color: "#999",
      marginTop: 15,
    },

    header: {
      minHeight: 78,
      paddingHorizontal: 18,
      backgroundColor: "#fff",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },

    logo: {
      fontSize: 27,
      fontWeight: "900",
    },

    smallTag: {
      fontSize: 11,
      color: "#777",
    },

    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    walletTop: {
      fontWeight: "900",
    },

    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "#111",
      justifyContent: "center",
      alignItems: "center",
    },

    avatarText: {
      color: "#fff",
      fontWeight: "900",
    },

    bottomNav: {
      minHeight: 94,
      flexDirection: "row",
      justifyContent:
        "space-around",
      alignItems: "center",
      backgroundColor: "#fff",
      paddingBottom:
        Platform.OS === "android"
          ? 30
          : 8,
      borderTopWidth: 1,
      borderTopColor: "#eee",
    },

    navItem: {
      alignItems: "center",
    },

    navCircle: {
      width: 31,
      height: 31,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },

    navCircleActive: {
      backgroundColor: "#111",
    },

    navIcon: {
      fontSize: 18,
      fontWeight: "900",
    },

    navLabel: {
      fontSize: 10,
      marginTop: 3,
    },

    scroll: {
      padding: 16,
      paddingBottom: 30,
    },

    pageTitle: {
      fontSize: 28,
      fontWeight: "900",
      marginBottom: 4,
    },

    filters: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 15,
    },

    filterButton: {
      paddingHorizontal: 15,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#ddd",
      backgroundColor: "#fff",
    },

    filterActive: {
      backgroundColor: "#111",
    },

    filterText: {
      fontWeight: "700",
    },

    post: {
      backgroundColor: "#fff",
      borderRadius: 17,
      padding: 14,
      marginBottom: 15,
    },

    postTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    smallAvatar: {
      width: 42,
      height: 42,
      backgroundColor: "#eee",
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },

    followButton: {
      backgroundColor: "#111",
      paddingVertical: 8,
      paddingHorizontal: 13,
      borderRadius: 10,
    },

    videoBox: {
      height: 230,
      backgroundColor: "#eee",
      borderRadius: 14,
      marginTop: 12,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    postTitle: {
      fontWeight: "900",
      fontSize: 16,
      marginTop: 12,
    },

    actions: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginTop: 14,
    },

    bold: {
      fontWeight: "900",
    },

    gray: {
      color: "#777",
      fontSize: 12,
    },

    shortsScreen: {
      flex: 1,
      backgroundColor: "#111",
      position: "relative",
    },

    shortTabs: {
      position: "absolute",
      top: 15,
      left: 0,
      right: 0,
      zIndex: 5,
      flexDirection: "row",
      justifyContent: "center",
      gap: 25,
    },

    shortVideo: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    shortInfo: {
      position: "absolute",
      bottom: 25,
      left: 16,
      width: "70%",
    },

    shortActions: {
      position: "absolute",
      right: 18,
      bottom: 40,
      gap: 28,
    },

    whiteBold: {
      color: "#fff",
      fontWeight: "900",
    },

    grayWhite: {
      color: "#bbb",
    },

    createGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },

    createButton: {
      width: "48%",
      minHeight: 105,
      backgroundColor: "#fff",
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },

    preview: {
      backgroundColor: "#fff",
      padding: 14,
      marginTop: 15,
      borderRadius: 15,
    },

    previewImage: {
      height: 250,
      width: "100%",
      borderRadius: 12,
      marginTop: 10,
    },

    videoPreview: {
      height: 170,
      backgroundColor: "#eee",
      marginTop: 10,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },

    createForm: {
      backgroundColor: "#fff",
      borderRadius: 16,
      marginTop: 15,
      padding: 15,
    },

    caption: {
      minHeight: 90,
      borderRadius: 12,
      backgroundColor: "#f5f5f5",
      padding: 12,
      marginTop: 8,
      textAlignVertical: "top",
    },

    option: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },

    coverImage: {
      width: "100%",
      height: 160,
      marginTop: 12,
      borderRadius: 12,
    },

    modalBackground: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },

    modalBox: {
      backgroundColor: "#fff",
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 18,
      maxHeight: "75%",
    },

    modalHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginBottom: 15,
    },

    modalTitle: {
      fontSize: 20,
      fontWeight: "900",
    },

    close: {
      fontSize: 20,
    },

    comment: {
      flexDirection: "row",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },

    commentAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#eee",
      alignItems: "center",
      justifyContent: "center",
    },

    commentInputRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 15,
    },

    commentInput: {
      flex: 1,
      height: 45,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 12,
      paddingHorizontal: 12,
    },

    sendButton: {
      backgroundColor: "#111",
      borderRadius: 12,
      paddingHorizontal: 15,
      justifyContent: "center",
    },

    cancel: {
      padding: 15,
      alignItems: "center",
    },

    walletCard: {
      backgroundColor: "#111",
      borderRadius: 20,
      padding: 20,
      marginTop: 10,
      marginBottom: 20,
    },

    money: {
      color: "#fff",
      fontSize: 36,
      fontWeight: "900",
      marginTop: 10,
    },

    withdraw: {
      backgroundColor: "#fff",
      padding: 13,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 17,
    },

    section: {
      fontSize: 19,
      fontWeight: "900",
      marginVertical: 12,
    },

    task: {
      backgroundColor: "#fff",
      padding: 14,
      borderRadius: 15,
      flexDirection: "row",
      marginBottom: 10,
    },

    apply: {
      backgroundColor: "#111",
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 8,
      marginTop: 8,
    },

    profileAvatar: {
      width: 85,
      height: 85,
      borderRadius: 43,
      backgroundColor: "#111",
      justifyContent: "center",
      alignItems: "center",
    },

    profileAvatarText: {
      color: "#fff",
      fontSize: 34,
      fontWeight: "900",
    },

    stats: {
      flexDirection: "row",
      backgroundColor: "#fff",
      borderRadius: 15,
      paddingVertical: 15,
      marginTop: 20,
    },

    stat: {
      flex: 1,
      alignItems: "center",
    },

    editButton: {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 12,
      alignItems: "center",
      padding: 13,
      marginTop: 12,
    },

    empty: {
      backgroundColor: "#fff",
      padding: 30,
      borderRadius: 15,
      alignItems: "center",
    },

    profilePost: {
      backgroundColor: "#fff",
      padding: 10,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
    },

    thumbnail: {
      width: 65,
      height: 65,
      borderRadius: 10,
    },

    thumbnailBox: {
      width: 65,
      height: 65,
      backgroundColor: "#eee",
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    logout: {
      borderWidth: 1,
      borderColor: "#ddd",
      padding: 14,
      alignItems: "center",
      borderRadius: 12,
      marginTop: 20,
    },

    liveScreen: {
      flex: 1,
      backgroundColor: "#111",
      padding: 18,
    },

    liveBadge: {
      alignSelf: "flex-start",
      backgroundColor: "red",
      color: "#fff",
      fontWeight: "900",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 7,
    },

    liveTitle: {
      color: "#fff",
      fontSize: 25,
      fontWeight: "900",
      marginTop: 15,
    },

    liveCamera: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },

    endLive: {
      height: 55,
      backgroundColor: "red",
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },

  });
