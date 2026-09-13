const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo cloud messaging active')) {
  console.log('Earnzo cloud messaging patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Cloud messaging patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'message client import',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost, fetchStories, createStory, fetchNotifications, markNotificationsRead, recordRemoteView, fetchCreatorStats, fetchMonetizationStatus, applyForMonetization, fetchWalletStatus, requestCreatorPayout, fetchBlockedCreators, toggleRemoteBlock, submitRemoteReport } from "./backend/client";',
  'import { backendEnabled, syncPostToBackend, fetchFeed, toggleLike, addRemoteComment, followRemoteUser, upsertProfile, searchRemote, updateRemotePost, deleteRemotePost, fetchStories, createStory, fetchNotifications, markNotificationsRead, recordRemoteView, fetchCreatorStats, fetchMonetizationStatus, applyForMonetization, fetchWalletStatus, requestCreatorPayout, fetchBlockedCreators, toggleRemoteBlock, submitRemoteReport } from "./backend/client";\nimport { fetchMessageInbox, fetchMessageThread, sendRemoteMessage, markRemoteMessagesRead } from "./backend/messages";'
);

replaceOnce(
  'message state',
  '  const [blockedCreators, setBlockedCreators] = useState([]); // Earnzo moderation safety active',
  '  const [blockedCreators, setBlockedCreators] = useState([]); // Earnzo moderation safety active\n  const [messagesOpen, setMessagesOpen] = useState(false); const [messageInbox, setMessageInbox] = useState([]); const [messageUnread, setMessageUnread] = useState(0); const [activeMessagePeer, setActiveMessagePeer] = useState(null); const [messageThread, setMessageThread] = useState([]); const [messageText, setMessageText] = useState(""); const [messageLoading, setMessageLoading] = useState(false); // Earnzo cloud messaging active'
);

replaceOnce(
  'message inbox cloud sync request',
  '      const [storyResult, notificationResult, statsResult, monetizationResult, walletResult, blockResult] = await Promise.all([fetchStories(cloudUserId), fetchNotifications(cloudUserId), fetchCreatorStats(cloudUserId), fetchMonetizationStatus(cloudUserId), fetchWalletStatus(cloudUserId, country.code), fetchBlockedCreators(cloudUserId)]);',
  '      const [storyResult, notificationResult, statsResult, monetizationResult, walletResult, blockResult, messageInboxResult] = await Promise.all([fetchStories(cloudUserId), fetchNotifications(cloudUserId), fetchCreatorStats(cloudUserId), fetchMonetizationStatus(cloudUserId), fetchWalletStatus(cloudUserId, country.code), fetchBlockedCreators(cloudUserId), fetchMessageInbox(cloudUserId)]);'
);

replaceOnce(
  'message inbox cloud sync result',
  '      setBlockedCreators(Array.isArray(blockResult?.blocked) ? blockResult.blocked.map((x) => String(x?.id || x || "").trim()).filter(Boolean) : []);',
  '      setBlockedCreators(Array.isArray(blockResult?.blocked) ? blockResult.blocked.map((x) => String(x?.id || x || "").trim()).filter(Boolean) : []);\n      setMessageInbox(Array.isArray(messageInboxResult?.conversations) ? messageInboxResult.conversations : []); setMessageUnread(Number(messageInboxResult?.unread || 0));'
);

replaceOnce(
  'message handlers anchor',
  '  const handleBlockCreator = async (creatorOrId) => {',
  `  const refreshMessageInbox = async () => {
    if (!backendEnabled) return;
    try {
      const result = await fetchMessageInbox(cloudUserId);
      setMessageInbox(Array.isArray(result?.conversations) ? result.conversations : []);
      setMessageUnread(Number(result?.unread || 0));
    } catch (e) { console.log("Earnzo message inbox sync failed", e?.message || e); }
  };
  const openMessageInbox = async () => {
    if (!backendEnabled) return Alert.alert("Messages", "Cloud backend connect hona zaroori hai.");
    setActiveMessagePeer(null); setMessageThread([]); setMessagesOpen(true); setMessageLoading(true);
    try { await refreshMessageInbox(); } finally { setMessageLoading(false); }
  };
  const openMessageThread = async (creatorOrId) => {
    const peerId = String(typeof creatorOrId === "string" ? creatorOrId : (creatorOrId?.handle || (creatorOrId?.username ? \`@\${creatorOrId.username}\` : "") || creatorOrId?.name || "")).trim();
    if (!peerId || peerId === cloudUserId) return;
    if (blockedCreators.includes(peerId)) return Alert.alert("Messages unavailable", "Is creator ko pehle unblock kare.");
    if (!backendEnabled) return Alert.alert("Messages", "Cloud backend connect hona zaroori hai.");
    setPublicCreator(null); setMessagesOpen(true); setActiveMessagePeer({ id: peerId, name: creatorOrId?.name || peerId }); setMessageLoading(true); setMessageText("");
    try {
      const result = await fetchMessageThread(cloudUserId, peerId);
      setMessageThread(Array.isArray(result?.messages) ? result.messages : []);
      await markRemoteMessagesRead(cloudUserId, peerId).catch(() => {});
      await refreshMessageInbox();
    } catch (e) {
      Alert.alert("Chat unavailable", String(e?.message || e || "Please try again"));
      setActiveMessagePeer(null);
    } finally { setMessageLoading(false); }
  };
  const sendMessage = async () => {
    const text = messageText.trim(); const peerId = String(activeMessagePeer?.id || "").trim();
    if (!text || !peerId || messageLoading) return;
    setMessageLoading(true);
    try {
      const sent = await sendRemoteMessage(cloudUserId, peerId, text);
      setMessageThread((old) => [...old, sent]); setMessageText("");
      await refreshMessageInbox();
    } catch (e) { Alert.alert("Message failed", String(e?.message || e || "Please try again")); }
    finally { setMessageLoading(false); }
  };
  const handleBlockCreator = async (creatorOrId) => {`
);

replaceOnce(
  'header message props',
  '<Header name={name} profilePhoto={profilePhoto} country={country} wallet={walletBalance} openEarn={() => setTab("Earn")} openProfile={() => setTab("Profile")} openSearch={() => setSearchOpen(true)} openNotifications={openNotifications} unreadNotifications={unreadNotifications} language={languageKey} openLanguage={() => setLanguageOpen(true)} />',
  '<Header name={name} profilePhoto={profilePhoto} country={country} wallet={walletBalance} openEarn={() => setTab("Earn")} openProfile={() => setTab("Profile")} openSearch={() => setSearchOpen(true)} openNotifications={openNotifications} unreadNotifications={unreadNotifications} language={languageKey} openLanguage={() => setLanguageOpen(true)} openMessages={openMessageInbox} unreadMessages={messageUnread} />'
);

replaceOnce(
  'header message signature',
  'function Header({ name, profilePhoto, country, wallet, openEarn, openProfile, openSearch, openNotifications, unreadNotifications, language, openLanguage })',
  'function Header({ name, profilePhoto, country, wallet, openEarn, openProfile, openSearch, openNotifications, unreadNotifications, language, openLanguage, openMessages, unreadMessages })'
);

replaceOnce(
  'header message button',
  '<Pressable onPress={openNotifications}',
  '<Pressable onPress={openMessages} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F2F7", marginRight: 6 }}><Text style={{ fontSize: 17 }}>✉️</Text>{unreadMessages > 0 ? <View style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#E53E52", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}><Text style={{ color: "#FFF", fontSize: 9, fontWeight: "900" }}>{unreadMessages > 99 ? "99+" : unreadMessages}</Text></View> : null}</Pressable><Pressable onPress={openNotifications}'
);

replaceOnce(
  'notification message prop',
  '<NotificationsModal visible={notificationsOpen} items={notifications} close={() => setNotificationsOpen(false)} openCreator={(creator) => { setNotificationsOpen(false); openPublicCreator(creator); }} openPost={() => { setNotificationsOpen(false); setTab("Home"); }} />',
  '<NotificationsModal visible={notificationsOpen} items={notifications} close={() => setNotificationsOpen(false)} openCreator={(creator) => { setNotificationsOpen(false); openPublicCreator(creator); }} openPost={() => { setNotificationsOpen(false); setTab("Home"); }} openMessage={(creator) => { setNotificationsOpen(false); openMessageThread(creator); }} />'
);

replaceOnce(
  'notification message signature',
  'function NotificationsModal({ visible, items, close, openCreator, openPost }) {',
  'function NotificationsModal({ visible, items, close, openCreator, openPost, openMessage }) {'
);

replaceOnce(
  'notification message tab',
  "    { label: 'Tags', type: 'tag' },",
  "    { label: 'Tags', type: 'tag' },\n    { label: 'Messages', type: 'message' },"
);

replaceOnce(
  'notification message icon',
  "  const icon = (type) => type === 'like' ? '♥' : type === 'comment' ? '💬' : type === 'tag' ? '@' : type === 'follow' ? '👤' : '🔔';",
  "  const icon = (type) => type === 'like' ? '♥' : type === 'comment' ? '💬' : type === 'tag' ? '@' : type === 'follow' ? '👤' : type === 'message' ? '✉️' : '🔔';"
);
replaceOnce(
  'notification message label',
  "  const label = (type) => type === 'like' ? 'Like' : type === 'comment' ? 'Comment' : type === 'tag' ? 'Tagged you' : type === 'follow' ? 'New follower' : 'Activity';",
  "  const label = (type) => type === 'like' ? 'Like' : type === 'comment' ? 'Comment' : type === 'tag' ? 'Tagged you' : type === 'follow' ? 'New follower' : type === 'message' ? 'New message' : 'Activity';"
);
replaceOnce(
  'notification open message',
  "  const openItem = (n) => {\n    if (n.type === 'follow' && n.actorId) return openCreator?.({ handle: n.actorId, name: n.actorId });",
  "  const openItem = (n) => {\n    if (n.type === 'message' && n.actorId) return openMessage?.({ handle: n.actorId, name: n.actorId });\n    if (n.type === 'follow' && n.actorId) return openCreator?.({ handle: n.actorId, name: n.actorId });"
);

replaceOnce(
  'public creator message prop',
  'blockedCreators={blockedCreators} onBlock={handleBlockCreator} />',
  'blockedCreators={blockedCreators} onBlock={handleBlockCreator} onMessage={openMessageThread} />'
);
replaceOnce(
  'public creator message signature',
  'function PublicCreatorModal({ creator, posts, close, onFollow, onReport, blockedCreators, onBlock }) {',
  'function PublicCreatorModal({ creator, posts, close, onFollow, onReport, blockedCreators, onBlock, onMessage }) {'
);
replaceOnce(
  'public creator message button',
  "        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 3 }}><Pressable onPress={() => onBlock(creator)}",
  "        <Pressable disabled={isBlocked} style={[styles.secondary, { marginTop: 10 }, isBlocked && { opacity: 0.5 }]} onPress={() => onMessage(creator)}><Text style={styles.secondaryText}>{isBlocked ? 'Messaging unavailable' : 'Message'}</Text></Pressable><View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 3 }}><Pressable onPress={() => onBlock(creator)}"
);

replaceOnce(
  'message modal mount',
  '<LanguageRegionModal visible={languageOpen}',
  '<MessagesModal visible={messagesOpen} close={() => { setMessagesOpen(false); setActiveMessagePeer(null); }} inbox={messageInbox} unread={messageUnread} activePeer={activeMessagePeer} messages={messageThread} text={messageText} setText={setMessageText} loading={messageLoading} currentUser={cloudUserId} onOpenPeer={openMessageThread} onBackInbox={() => { setActiveMessagePeer(null); setMessageThread([]); refreshMessageInbox(); }} onSend={sendMessage} /><LanguageRegionModal visible={languageOpen}'
);

const anchor = 'function SearchModal';
if (!code.includes(anchor)) throw new Error('Cloud messaging patch failed: SearchModal anchor not found');
const component = `function MessagesModal({ visible, close, inbox, unread, activePeer, messages, text, setText, loading, currentUser, onOpenPeer, onBackInbox, onSend }) {
  const ago = (value) => {
    const ms = Math.max(0, Date.now() - Number(value || Date.now())); const min = Math.floor(ms / 60000);
    if (min < 1) return "Now"; if (min < 60) return \`${'${min}'}m\`; const hr = Math.floor(min / 60); if (hr < 24) return \`${'${hr}'}h\`; return \`${'${Math.floor(hr / 24)}'}d\`;
  };
  return <Modal visible={visible} animationType="slide" onRequestClose={activePeer ? onBackInbox : close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E7E8EF" }}>
        <Pressable onPress={activePeer ? onBackInbox : close}><Text style={{ fontSize: 30, color: C.text }}>‹</Text></Pressable>
        <View style={{ alignItems: "center" }}><Text style={{ fontWeight: "900", fontSize: 18 }}>{activePeer ? (activePeer.name || activePeer.id) : "Messages"}</Text>{activePeer ? <Text style={{ color: C.muted, fontSize: 10 }}>{activePeer.id}</Text> : unread > 0 ? <Text style={{ color: C.purple, fontSize: 10, fontWeight: "800" }}>{unread} unread</Text> : null}</View><View style={{ width: 28 }} />
      </View>
      {!activePeer ? <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 50 }}>
        {!inbox.length ? <View style={styles.emptyCard}><Text style={styles.bold}>No messages yet</Text><Text style={styles.muted}>Creator profile par Message button se chat start kare.</Text></View> : inbox.map((c) => <Pressable key={c.peerId} onPress={() => onOpenPeer(c.peerId)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F3" }}><View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.purpleSoft, alignItems: "center", justifyContent: "center", marginRight: 10 }}><Text style={{ color: C.purple, fontWeight: "900" }}>{String(c.peerId || "E").replace(/^@/, "")[0]?.toUpperCase()}</Text></View><View style={{ flex: 1 }}><View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: C.text, fontWeight: c.unread ? "900" : "800" }}>{c.peerId}</Text><Text style={{ color: C.muted, fontSize: 10 }}>{ago(c.createdAt)}</Text></View><Text numberOfLines={1} style={{ color: c.unread ? C.text : C.muted, marginTop: 4 }}>{c.senderId === currentUser ? "You: " : ""}{c.text}</Text></View>{c.unread ? <View style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: C.purple, alignItems: "center", justifyContent: "center", marginLeft: 8, paddingHorizontal: 5 }}><Text style={{ color: "#FFF", fontSize: 10, fontWeight: "900" }}>{c.unread > 99 ? "99+" : c.unread}</Text></View> : null}</Pressable>)}
      </ScrollView> : <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          {loading && !messages.length ? <Text style={{ textAlign: "center", color: C.muted, marginTop: 20 }}>Loading chat...</Text> : null}
          {!loading && !messages.length ? <View style={styles.emptyCard}><Text style={styles.bold}>Start the conversation</Text><Text style={styles.muted}>Text message bhej sakte hain.</Text></View> : null}
          {messages.map((m) => { const mine = m.senderId === currentUser; return <View key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%", backgroundColor: mine ? C.purple : "#F1F2F7", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 8 }}><Text style={{ color: mine ? "#FFF" : C.text }}>{m.text}</Text><Text style={{ color: mine ? "#DDD6FF" : C.muted, fontSize: 9, marginTop: 4, textAlign: "right" }}>{ago(m.createdAt)}{mine && m.readAt ? " • Read" : ""}</Text></View>; })}
        </ScrollView>
        <View style={{ flexDirection: "row", alignItems: "flex-end", padding: 10, borderTopWidth: 1, borderTopColor: "#E7E8EF", backgroundColor: "#FFF" }}><TextInput style={[styles.input, { flex: 1, marginRight: 8, maxHeight: 100 }]} multiline placeholder="Message..." value={text} onChangeText={setText} maxLength={2000} /><Pressable disabled={loading || !text.trim()} onPress={onSend} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.purple, alignItems: "center", justifyContent: "center", opacity: loading || !text.trim() ? 0.5 : 1 }}><Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>➤</Text></Pressable></View>
      </KeyboardAvoidingView>}
    </SafeAreaView>
  </Modal>;
}

`;
code = code.replace(anchor, component + anchor);

fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo cloud messaging applied: inbox, unread badge, creator DMs, message notifications and blocked-account protection.');
