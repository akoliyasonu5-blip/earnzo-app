const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo notification center active')) {
  console.log('Earnzo notification center patch already applied.');
  process.exit(0);
}

function replaceOnce(label, from, to) {
  if (!code.includes(from)) throw new Error(`Notification center patch failed: ${label} target not found`);
  code = code.replace(from, to);
}

replaceOnce(
  'notification modal props',
  '<NotificationsModal visible={notificationsOpen} items={notifications} close={() => setNotificationsOpen(false)} />',
  '<NotificationsModal visible={notificationsOpen} items={notifications} close={() => setNotificationsOpen(false)} openCreator={(creator) => { setNotificationsOpen(false); openPublicCreator(creator); }} openPost={() => { setNotificationsOpen(false); setTab("Home"); }} />'
);

const notificationRegex = /function NotificationsModal\(\{ visible, items, close \}\) \{[\s\S]*?\n\}\n\nfunction SearchModal/;
if (!notificationRegex.test(code)) throw new Error('Notification center patch failed: NotificationsModal block not found');

const replacement = `// Earnzo notification center active
function NotificationsModal({ visible, items, close, openCreator, openPost }) {
  const [filter, setFilter] = useState('All');
  const tabs = [
    { label: 'All', type: '' },
    { label: 'Likes', type: 'like' },
    { label: 'Comments', type: 'comment' },
    { label: 'Follows', type: 'follow' },
    { label: 'Tags', type: 'tag' },
  ];
  const icon = (type) => type === 'like' ? '♥' : type === 'comment' ? '💬' : type === 'tag' ? '@' : type === 'follow' ? '👤' : '🔔';
  const label = (type) => type === 'like' ? 'Like' : type === 'comment' ? 'Comment' : type === 'tag' ? 'Tagged you' : type === 'follow' ? 'New follower' : 'Activity';
  const filtered = filter === 'All' ? items : items.filter((n) => n.type === tabs.find((x) => x.label === filter)?.type);
  const ago = (value) => {
    const ms = Math.max(0, Date.now() - Number(value || Date.now()));
    const min = Math.floor(ms / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return \`${'${min}'}m ago\`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return \`${'${hr}'}h ago\`;
    const day = Math.floor(hr / 24);
    return \`${'${day}'}d ago\`;
  };
  const openItem = (n) => {
    if (n.type === 'follow' && n.actorId) return openCreator?.({ handle: n.actorId, name: n.actorId });
    if (n.postId) return openPost?.(n.postId);
    if (n.actorId) return openCreator?.({ handle: n.actorId, name: n.actorId });
  };
  return <Modal visible={visible} animationType="slide" onRequestClose={close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={{ minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E7E8EF' }}>
        <Pressable onPress={close}><Text style={{ fontSize: 30, color: '#171722' }}>‹</Text></Pressable>
        <Text style={{ fontWeight: '900', fontSize: 18 }}>Notifications</Text><View style={{ width: 28 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }} style={{ maxHeight: 58, borderBottomWidth: 1, borderBottomColor: '#F0F0F3' }}>
        {tabs.map((x) => <Pressable key={x.label} onPress={() => setFilter(x.label)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, marginRight: 8, backgroundColor: filter === x.label ? C.purple : '#F1F2F7' }}><Text style={{ color: filter === x.label ? '#FFF' : C.text, fontWeight: '800', fontSize: 12 }}>{x.label}</Text></Pressable>)}
      </ScrollView>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 50 }}>
        {!filtered.length ? <View style={styles.emptyCard}><Text style={styles.bold}>No {filter === 'All' ? '' : filter.toLowerCase() + ' '}notifications yet</Text><Text style={styles.muted}>Likes, comments, follows aur tags yahan dikhेंगे.</Text></View> : null}
        {filtered.map((n) => <Pressable onPress={() => openItem(n)} key={n.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F3' }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0EDFF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}><Text style={{ fontSize: 18 }}>{icon(n.type)}</Text></View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: C.purple, fontSize: 10, fontWeight: '900' }}>{label(n.type)}</Text><Text style={{ color: '#9A9CAB', fontSize: 10 }}>{ago(n.createdAt)}</Text></View>
            <Text style={{ color: '#171722', fontWeight: '900', marginTop: 3 }}>{n.text || 'New activity on Earnzo'}</Text>
            {n.actorId ? <Text style={{ color: '#747789', marginTop: 3, fontWeight: '700' }}>From: {n.actorId}</Text> : null}
            {n.data?.comment ? <Text numberOfLines={2} style={{ color: '#747789', marginTop: 3 }}>“{n.data.comment}”</Text> : null}
            {n.postId ? <Text style={{ color: C.purple, fontSize: 10, marginTop: 5, fontWeight: '800' }}>Tap to open post</Text> : n.actorId ? <Text style={{ color: C.purple, fontSize: 10, marginTop: 5, fontWeight: '800' }}>Tap to open creator</Text> : null}
          </View>
        </Pressable>)}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

function SearchModal`;

code = code.replace(notificationRegex, replacement);
fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo notification center applied: filters, actor identity, comment preview, time labels and tap actions.');
