import React,{useState}from"react";
import{SafeAreaView,View,Text,StyleSheet,Pressable,ScrollView,TextInput,Alert,StatusBar,Dimensions,Platform}from"react-native";
const{width}=Dimensions.get("window");

const seed=[
{id:"1",name:"Ravi Creator",handle:"@ravi",title:"Delhi street food challenge 🔥",views:"128K",likes:18400,following:false,tag:"Trending"},
{id:"2",name:"Neha Vlogs",handle:"@nehavlogs",title:"₹500 mein full day travel!",views:"87K",likes:9300,following:true,tag:"Travel"}
];
const tasks=[
{id:"1",brand:"VoltGo",title:"Create a 30-sec EV video",reward:"₹1,000",deadline:"3 days"},
{id:"2",brand:"FoodBee",title:"Show your city's best food",reward:"₹500",deadline:"5 days"}
];

export default function App(){
 const[stage,setStage]=useState("login");
 const[mobile,setMobile]=useState("");
 const[otp,setOtp]=useState("");
 const[name,setName]=useState("");
 const[username,setUsername]=useState("");
 const[tab,setTab]=useState("Home");
 const[posts,setPosts]=useState(seed);
 const[wallet]=useState(1240);
 const[caption,setCaption]=useState("");
 const[created,setCreated]=useState([]);

 if(stage==="login")return <SafeAreaView style={s.safe}><StatusBar barStyle="dark-content" backgroundColor="#fff"/><View style={s.auth}>
  <Text style={s.logoBig}>Earnzo</Text><Text style={s.tagBig}>Create • Connect • Earn</Text>
  <Text style={s.authTitle}>Welcome to Earnzo</Text><Text style={s.authSub}>Enter your mobile number to continue</Text>
  <TextInput style={s.inputOne} placeholder="Mobile Number" keyboardType="phone-pad" maxLength={10} value={mobile} onChangeText={setMobile}/>
  <Pressable style={s.primary} onPress={()=>mobile.length===10?setStage("otp"):Alert.alert("Enter valid 10-digit number")}><Text style={s.primaryText}>Continue</Text></Pressable>
  <Text style={s.note}>Testing OTP: 1234</Text>
 </View></SafeAreaView>;

 if(stage==="otp")return <SafeAreaView style={s.safe}><StatusBar barStyle="dark-content" backgroundColor="#fff"/><View style={s.auth}>
  <Text style={s.logoBig}>Earnzo</Text><Text style={s.authTitle}>Verify OTP</Text><Text style={s.authSub}>OTP sent to +91 {mobile}</Text>
  <TextInput style={s.inputOne} placeholder="4-digit OTP" keyboardType="number-pad" maxLength={4} value={otp} onChangeText={setOtp}/>
  <Pressable style={s.primary} onPress={()=>otp==="1234"?setStage("profile"):Alert.alert("Wrong OTP","Testing OTP is 1234")}><Text style={s.primaryText}>Verify OTP</Text></Pressable>
  <Pressable style={s.link} onPress={()=>setStage("login")}><Text>Change mobile number</Text></Pressable>
 </View></SafeAreaView>;

 if(stage==="profile")return <SafeAreaView style={s.safe}><StatusBar barStyle="dark-content" backgroundColor="#fff"/><ScrollView contentContainerStyle={s.authScroll}>
  <Text style={s.logoBig}>Earnzo</Text><Text style={s.authTitle}>Create your profile</Text><Text style={s.authSub}>Set your name and username</Text>
  <TextInput style={s.inputOne} placeholder="Your Name" value={name} onChangeText={setName}/>
  <TextInput style={[s.inputOne,{marginTop:12}]} placeholder="Username" value={username} onChangeText={t=>setUsername(t.replace(/\s/g,"").toLowerCase())}/>
  <Pressable style={s.primary} onPress={()=>name.trim()&&username.trim()?setStage("app"):Alert.alert("Enter name and username")}><Text style={s.primaryText}>Start Earnzo</Text></Pressable>
 </ScrollView></SafeAreaView>;

  let content;
if(tab==="Home"){
  content=<Home posts={posts} setPosts={setPosts}/>;
}else if(tab==="Shorts"){
  content=<Shorts posts={posts} setPosts={setPosts}/>;
}else if(tab==="Create"){
  content=<Create
    caption={caption}
    setCaption={setCaption}
    created={created}
    setCreated={setCreated}
  />;
}else if(tab==="Earn"){
  content=<Earn wallet={wallet}/>;
}else{
  content=<Profile
    name={name}
    username={username}
    wallet={wallet}
    created={created}
    onLogout={()=>{
      setStage("login");
      setOtp("");
      setTab("Home");
    }}
  />;
}

 return <SafeAreaView style={s.safe}><StatusBar barStyle="dark-content" backgroundColor="#fff"/>
  <View style={s.header}><View><Text style={s.logo}>Earnzo</Text><Text style={s.tag}>Create • Connect • Earn</Text></View><View style={s.headerR}><Text style={s.coin}>₹{wallet}</Text><Pressable style={s.avatar} onPress={()=>setTab("Profile")}><Text style={s.avatarText}>{(name||"S")[0].toUpperCase()}</Text></Pressable></View></View>
  <View style={{flex:1}}>{content}</View>
  <View style={s.nav}>{[["Home","⌂"],["Shorts","▶"],["Create","＋"],["Earn","₹"],["Profile","◉"]].map(([n,i])=><Pressable key={n} style={s.navItem} onPress={()=>setTab(n)}><View style={[s.navCircle,tab===n&&s.navOn]}><Text style={[s.navIcon,tab===n&&{color:"#fff"}]}>{i}</Text></View><Text style={[s.navText,tab===n&&{color:"#111"}]}>{n}</Text></Pressable>)}</View>
 </SafeAreaView>;
}

function Home({posts,setPosts}){
 const like=id=>setPosts(a=>a.map(p=>p.id===id?{...p,liked:!p.liked,likes:p.likes+(p.liked?-1:1)}:p));
 const follow=id=>setPosts(a=>a.map(p=>p.id===id?{...p,following:!p.following}:p));
 return <ScrollView contentContainerStyle={s.scroll}><Text style={s.page}>Your feed</Text><Text style={s.sub}>Videos that can entertain, teach and earn.</Text>
 <View style={s.chips}>{["For You","Following","Trending","India"].map((x,i)=><View key={x} style={[s.chip,i===0&&s.chipOn]}><Text style={[s.chipText,i===0&&{color:"#fff"}]}>{x}</Text></View>)}</View>
 {posts.map(p=><View key={p.id} style={s.card}><View style={s.user}><View style={s.smallAv}><Text style={s.bold}>{p.name[0]}</Text></View><View style={{flex:1}}><Text style={s.bold}>{p.name}</Text><Text style={s.gray}>{p.handle} • {p.tag}</Text></View><Pressable style={[s.follow,p.following&&s.following]} onPress={()=>follow(p.id)}><Text style={[s.followTxt,p.following&&{color:"#111"}]}>{p.following?"Following":"Follow"}</Text></Pressable></View>
 <Pressable style={s.video} onPress={()=>Alert.alert("Video","Video player test button working")}><Text style={{fontSize:34}}>▶</Text><Text style={s.gray}>Video preview</Text></Pressable>
 <Text style={[s.bold,{fontSize:16,marginTop:12}]}>{p.title}</Text><Text style={s.gray}>{p.views} views</Text>
 <View style={s.actions}><Pressable onPress={()=>like(p.id)}><Text style={s.bold}>{p.liked?"♥":"♡"} {Math.round(p.likes/1000)}K</Text></Pressable><Pressable onPress={()=>Alert.alert("Comments","Working in test mode")}><Text style={s.bold}>💬 Comment</Text></Pressable><Pressable onPress={()=>Alert.alert("Share","Working in test mode")}><Text style={s.bold}>↗ Share</Text></Pressable></View></View>)}
 </ScrollView>;
}

function Shorts({posts,setPosts}){
 const p=posts[0];
 const like=()=>setPosts(a=>a.map(x=>x.id===p.id?{...x,liked:!x.liked,likes:x.likes+(x.liked?-1:1)}:x));

 return <View style={s.short}>
  <View style={s.shortTop}>
   <Text style={s.whiteBold}>For You</Text>
   <Text style={s.shortDim}>Following</Text>
  </View>

  <View style={s.shortMid}>
   <Text style={s.playWhite}>▶</Text>
   <Text style={s.shortDim}>Full-screen short video</Text>
  </View>

  <View style={s.shortInfo}>
   <Text style={s.whiteBold}>@ravi</Text>
   <Text style={s.white}>{p.title}</Text>
   <Text style={s.shortDim}>♫ Original sound • Earnzo</Text>
  </View>

  <View style={s.shortBtns}>
   <Pressable onPress={like}><Text style={s.whiteBold}>{p.liked?"♥":"♡"}{"\n"}18K</Text></Pressable>
   <Pressable onPress={()=>Alert.alert("Comments","Working")}><Text style={s.whiteBold}>💬{"\n"}1.2K</Text></Pressable>
   <Pressable onPress={()=>Alert.alert("Share","Working")}><Text style={s.whiteBold}>↗{"\n"}Share</Text></Pressable>
   <Pressable onPress={()=>Alert.alert("Saved","Saved")}><Text style={s.whiteBold}>🔖{"\n"}Save</Text></Pressable>
  </View>
 </View>;
}

function Create({caption,setCaption,created,setCreated}){
 const publish=()=>{
  if(!caption.trim())return Alert.alert("Add caption");
  setCreated([{id:Date.now().toString(),caption},...created]);
  setCaption("");
  Alert.alert("Published","Test post added to Profile");
 };

 return <ScrollView contentContainerStyle={s.scroll}>
  <Text style={s.page}>Create</Text>
  <Text style={s.sub}>Test all creation options.</Text>

  <View style={s.grid}>
   {[["▶","Short / Reel"],["▣","Long Video"],["◎","Photo"],["●","Go Live"]].map(([i,l])=>
    <Pressable key={l} style={s.tile} onPress={()=>Alert.alert(l,"Real media upload comes with backend")}>
     <Text style={{fontSize:30}}>{i}</Text>
     <Text style={s.bold}>{l}</Text>
    </Pressable>
   )}
  </View>

  <View style={s.form}>
   <Text style={s.bold}>Caption</Text>
   <TextInput multiline style={s.caption} placeholder="Write something..." value={caption} onChangeText={setCaption}/>

   {["🏷 Tag people","📍 Add location","# Add topics","🖼 Select cover"].map(x=>
    <Pressable key={x} style={s.row} onPress={()=>Alert.alert(x,"Working in test mode")}>
     <Text>{x}</Text>
     <Text>›</Text>
    </Pressable>
   )}

   <Pressable style={s.primary} onPress={publish}>
    <Text style={s.primaryText}>Publish Test Post</Text>
   </Pressable>
  </View>
 </ScrollView>;
}

function Earn({wallet}){
 return <ScrollView contentContainerStyle={s.scroll}>
  <Text style={s.page}>Earn</Text>
  <Text style={s.sub}>Creator earning test screens.</Text>

  <View style={s.wallet}>
   <Text style={s.shortDim}>Available balance</Text>
   <Text style={s.money}>₹{wallet}</Text>
   <Text style={s.shortDim}>Creator earnings + rewards</Text>

   <Pressable style={s.withdraw} onPress={()=>Alert.alert("Withdraw","KYC + bank/UPI payout comes with backend")}>
    <Text style={s.bold}>Withdraw Money</Text>
   </Pressable>
  </View>

  <Text style={s.section}>Brand Tasks</Text>

  {tasks.map(t=>
   <View key={t.id} style={s.task}>
    <View style={{flex:1}}>
     <Text style={s.gray}>{t.brand}</Text>
     <Text style={s.bold}>{t.title}</Text>
     <Text style={s.gray}>Deadline: {t.deadline}</Text>
    </View>

    <View>
     <Text style={s.reward}>{t.reward}</Text>
     <Pressable style={s.apply} onPress={()=>Alert.alert("Applied",t.title)}>
      <Text style={s.followTxt}>Apply</Text>
     </Pressable>
    </View>
   </View>
  )}

  {["Affiliate Products","Live Gifts","Paid Membership","Creator Shop"].map(x=>
   <Pressable key={x} style={s.bigRow} onPress={()=>Alert.alert(x,"Working in test mode")}>
    <Text style={s.bold}>{x}</Text>
    <Text>›</Text>
   </Pressable>
  )}
 </ScrollView>;
}

function Profile({name,username,wallet,created,onLogout}){
 return <ScrollView contentContainerStyle={s.scroll}>
  <View style={{alignItems:"center"}}>
   <View style={s.profileAv}>
    <Text style={s.profileLetter}>{(name||"S")[0].toUpperCase()}</Text>
   </View>
   <Text style={[s.page,{fontSize:22}]}>{name||"Creator"}</Text>
   <Text style={s.gray}>@{username||"creator"} • Earnzo Creator</Text>
  </View>

  <View style={s.stats}>
   {[[created.length,"Posts"],["12.8K","Followers"],["438","Following"],[`₹${wallet}`,"Earnings"]].map(([n,l])=>
    <View key={l} style={{flex:1,alignItems:"center"}}>
     <Text style={s.bold}>{n}</Text>
     <Text style={s.gray}>{l}</Text>
    </View>
   )}
  </View>

  <Pressable style={s.edit} onPress={()=>Alert.alert("Edit Profile","Working")}>
   <Text style={s.bold}>Edit Profile</Text>
  </Pressable>

  <Text style={s.section}>Your posts</Text>

  {created.length===0?
   <View style={s.empty}>
    <Text style={{fontSize:36}}>＋</Text>
    <Text style={s.bold}>No posts yet</Text>
   </View>
   :
   created.map(x=>
    <View key={x.id} style={s.created}>
     <View style={s.thumb}><Text>▶</Text></View>
     <Text style={[s.bold,{flex:1}]}>{x.caption}</Text>
    </View>
   )
  }

  <Pressable style={s.logout} onPress={onLogout}>
   <Text style={s.bold}>Logout</Text>
  </Pressable>
 </ScrollView>;
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#f7f8fb",paddingTop:Platform.OS==="android"?StatusBar.currentHeight:0},

 auth:{flex:1,justifyContent:"center",paddingHorizontal:28,backgroundColor:"#fff"},
 authScroll:{flexGrow:1,justifyContent:"center",paddingHorizontal:28,backgroundColor:"#fff"},
 logoBig:{fontSize:44,fontWeight:"900",textAlign:"center"},
 tagBig:{textAlign:"center",color:"#777",marginTop:5,marginBottom:50},
 authTitle:{fontSize:27,fontWeight:"900",marginTop:24},
 authSub:{color:"#777",marginTop:8,marginBottom:20,fontSize:15},
 inputOne:{height:56,borderWidth:1,borderColor:"#ddd",borderRadius:14,paddingHorizontal:16,fontSize:18,backgroundColor:"#f7f8fb"},
 note:{textAlign:"center",color:"#999",marginTop:18},
 link:{alignItems:"center",padding:16},

 primary:{height:56,backgroundColor:"#111",borderRadius:14,alignItems:"center",justifyContent:"center",marginTop:15},
 primaryText:{color:"#fff",fontWeight:"900",fontSize:17},

 header:{minHeight:78,paddingHorizontal:18,paddingTop:6,paddingBottom:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#eceef2"},
 logo:{fontSize:26,fontWeight:"900"},
 tag:{fontSize:11,color:"#777"},
 headerR:{flexDirection:"row",alignItems:"center",gap:10},
 coin:{fontWeight:"900",fontSize:16},
 avatar:{width:36,height:36,borderRadius:18,backgroundColor:"#111",alignItems:"center",justifyContent:"center"},
 avatarText:{color:"#fff",fontWeight:"900"},

 nav:{minHeight:94,backgroundColor:"#fff",flexDirection:"row",justifyContent:"space-around",alignItems:"center",borderTopWidth:1,borderTopColor:"#e7e9ee",paddingTop:6,paddingBottom:Platform.OS==="android"?32:8},
 navItem:{alignItems:"center",minWidth:58},
 navCircle:{width:30,height:30,borderRadius:15,alignItems:"center",justifyContent:"center"},
 navOn:{backgroundColor:"#111"},
 navIcon:{fontSize:18,fontWeight:"900"},
 navText:{fontSize:10,color:"#777",fontWeight:"700"},

 scroll:{padding:16,paddingBottom:30},
 page:{fontSize:28,fontWeight:"900"},
 sub:{color:"#6f7480",marginTop:4,marginBottom:18},

 chips:{flexDirection:"row",gap:8,flexWrap:"wrap",marginBottom:14},
 chip:{backgroundColor:"#fff",borderWidth:1,borderColor:"#e3e5ea",paddingHorizontal:14,paddingVertical:8,borderRadius:999},
 chipOn:{backgroundColor:"#111"},
 chipText:{fontWeight:"700"},

 card:{backgroundColor:"#fff",borderRadius:18,padding:14,marginBottom:16,borderWidth:1,borderColor:"#eceef2"},
 user:{flexDirection:"row",alignItems:"center",gap:10},
 smallAv:{width:42,height:42,borderRadius:21,backgroundColor:"#eceef4",alignItems:"center",justifyContent:"center"},
 bold:{fontWeight:"900"},
 gray:{color:"#777",fontSize:12},

 follow:{backgroundColor:"#111",paddingHorizontal:15,paddingVertical:8,borderRadius:10},
 following:{backgroundColor:"#f0f1f4"},
 followTxt:{color:"#fff",fontWeight:"900"},

 video:{height:230,borderRadius:15,marginTop:14,backgroundColor:"#e9ebf2",alignItems:"center",justifyContent:"center"},
 actions:{flexDirection:"row",justifyContent:"space-between",marginTop:12,borderTopWidth:1,borderTopColor:"#eee",paddingTop:10},

 short:{flex:1,backgroundColor:"#111",position:"relative"},
 shortTop:{position:"absolute",top:14,left:0,right:0,flexDirection:"row",justifyContent:"center",gap:22,zIndex:2},
 shortMid:{flex:1,alignItems:"center",justifyContent:"center"},
 shortInfo:{position:"absolute",left:16,bottom:22,width:width-100},
 shortBtns:{position:"absolute",right:14,bottom:35,gap:22,alignItems:"center"},
 white:{color:"#fff"},
 whiteBold:{color:"#fff",fontWeight:"900",textAlign:"center"},
 shortDim:{color:"#bbb"},
 playWhite:{color:"#fff",fontSize:44},

 grid:{flexDirection:"row",flexWrap:"wrap",gap:12},
 tile:{width:"48%",backgroundColor:"#fff",borderWidth:1,borderColor:"#e9ebef",borderRadius:16,padding:18,alignItems:"center"},
 form:{marginTop:18,backgroundColor:"#fff",borderRadius:18,padding:16},
 caption:{minHeight:90,backgroundColor:"#f6f7f9",borderRadius:12,padding:12,textAlignVertical:"top",marginTop:8},
 row:{flexDirection:"row",justifyContent:"space-between",paddingVertical:15,borderBottomWidth:1,borderBottomColor:"#f0f1f3"},

 wallet:{backgroundColor:"#111",borderRadius:20,padding:20,marginBottom:20},
 money:{color:"#fff",fontSize:36,fontWeight:"900",marginTop:8},
 withdraw:{backgroundColor:"#fff",borderRadius:11,paddingVertical:13,alignItems:"center",marginTop:18},

 section:{fontSize:19,fontWeight:"900",marginVertical:10},

 task:{backgroundColor:"#fff",borderRadius:16,padding:14,marginBottom:10,flexDirection:"row",gap:12},
 reward:{fontSize:17,fontWeight:"900"},
 apply:{backgroundColor:"#111",borderRadius:9,paddingHorizontal:13,paddingVertical:8,marginTop:12},

 bigRow:{backgroundColor:"#fff",borderRadius:13,padding:16,flexDirection:"row",justifyContent:"space-between",marginBottom:9},

 profileAv:{width:86,height:86,borderRadius:43,backgroundColor:"#111",alignItems:"center",justifyContent:"center"},
 profileLetter:{color:"#fff",fontSize:34,fontWeight:"900"},
 stats:{flexDirection:"row",backgroundColor:"#fff",borderRadius:16,paddingVertical:15,marginTop:20},

 edit:{borderWidth:1,borderColor:"#ddd",borderRadius:11,alignItems:"center",paddingVertical:12,marginVertical:12},
 empty:{backgroundColor:"#fff",borderRadius:18,alignItems:"center",padding:28},

 created:{backgroundColor:"#fff",borderRadius:14,padding:10,flexDirection:"row",gap:12,alignItems:"center",marginBottom:10},
 thumb:{width:64,height:64,borderRadius:10,backgroundColor:"#eceef2",alignItems:"center",justifyContent:"center"},

 logout:{borderWidth:1,borderColor:"#ddd",borderRadius:12,paddingVertical:14,alignItems:"center",marginTop:20}
});
