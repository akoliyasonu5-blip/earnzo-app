const fs = require('fs');

const path = 'App.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('Earnzo comment keyboard fix active')) {
  console.log('Earnzo comment keyboard fix already applied.');
  process.exit(0);
}

const start = code.indexOf('function CommentsModal(');
const end = code.indexOf('function People(', start);
if (start < 0 || end < 0) throw new Error('Comment keyboard patch failed: CommentsModal/People anchors not found');

const replacement = `function CommentsModal({ visible, close, post, value, setValue, send }) { // Earnzo comment keyboard fix active
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
    <KeyboardAvoidingView
      style={{ flex: 1, justifyContent: "flex-end" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={close} />
      <View style={[styles.sheet, { maxHeight: "82%", minHeight: 330, paddingBottom: Platform.OS === "android" ? 14 : 24 }]}> 
        <SheetHeader title="Comments" close={close} />
        <ScrollView
          style={{ flexGrow: 0, maxHeight: 360 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
          {(post?.comments || []).length ? (post?.comments || []).map((x, i) => <View key={i} style={styles.commentRow}><View style={styles.avatar}><Text style={styles.avatarText}>U</Text></View><View style={styles.commentBubble}><Text style={styles.bold}>User</Text><Text>{typeof x === "string" ? x : (x?.text || "")}</Text></View></View>) : <View style={{ paddingVertical: 28, alignItems: "center" }}><Text style={styles.bold}>No comments yet</Text><Text style={styles.muted}>Be the first to comment.</Text></View>}
        </ScrollView>
        <View style={{ borderTopWidth: 1, borderTopColor: C.line, backgroundColor: "#FFF", paddingTop: 10 }}>
          <View style={styles.commentInputRow}>
            <TextInput
              style={[styles.commentInput, { minHeight: 46, maxHeight: 110, textAlignVertical: "center" }]}
              placeholder="Write a comment..."
              value={value}
              onChangeText={setValue}
              multiline
              returnKeyType="default"
              blurOnSubmit={false}
            />
            <Pressable style={[styles.send, !String(value || "").trim() && { opacity: 0.45 }]} disabled={!String(value || "").trim()} onPress={send}><Text style={styles.sendText}>Send</Text></Pressable>
          </View>
          <Text style={{ color: C.muted, fontSize: 10, marginTop: 5 }}>Keyboard open hone par comment box screen ke upar visible rahega.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
`;

code = code.slice(0, start) + replacement + code.slice(end);
fs.writeFileSync(path, code, 'utf8');
console.log('Earnzo comment keyboard fix applied: composer stays visible above Android/iOS keyboard.');
