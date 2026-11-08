// Chat.onezal — Firebase Realtime demo. Isi konfigurasi Firebase di bawah agar online lintas perangkat.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD8Kk3-WEzNlQ6HlzTB2Lj7G67PaeRFVts",
  authDomain: "chatonezal.firebaseapp.com",
  projectId: "chatonezal",
  storageBucket: "chatonezal.firebasestorage.app",
  messagingSenderId: "349413058938",
  appId: "1:349413058938:web:da1930358c71e8fd5a4ec3"
};
const configured = firebaseConfig.apiKey !== "ISI_API_KEY_FIREBASE";
let db=null,auth=null,storage=null,user=null,stopMessages=null,activeRoom="global",activeFriend=null;
let localMessages=JSON.parse(localStorage.getItem("onezal_messages")||"[]");
let username=localStorage.getItem("onezal_username")||"onezal"+Math.floor(1000+Math.random()*9000);
let phone=localStorage.getItem("onezal_phone")||"628"+String(Math.floor(1000000000+Math.random()*9000000000));
localStorage.setItem("onezal_username",username);localStorage.setItem("onezal_phone",phone);
const $=id=>document.getElementById(id);
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2300)}
function openModal(title,html){$("modalTitle").textContent=title;$("modalBody").innerHTML=html;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden")}
$("closeModal").onclick=closeModal;
function showPage(name){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$("page-"+name).classList.add("active");document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===name));}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$("topProfile").onclick=()=>showPage("settings");
updateOwnName();$("myNumber").textContent=phone;
function fallbackAvatar(){return "assets/onezal-small.png"}
function isCreator(name){return String(name||"").toLowerCase()==="rijal"}
function nameWithBadge(name, className="verified-mark"){
  const span=document.createElement("span");span.className="creator-name";span.append(document.createTextNode("@"+name));
  if(isCreator(name)){const img=document.createElement("img");img.src="assets/verified-blue.png";img.alt="Akun kreator ONEZAL";img.title="Kreator resmi Chat.onezal";img.className=className;span.append(img)}
  return span;
}
function updateOwnName(){const el=$("myUsername");el.innerHTML="";el.append(nameWithBadge(username,"verified-mark profile-verified"));}
async function init(){
 if(!configured){toast("Mode demo lokal aktif. Hubungkan Firebase agar semua perangkat online.");return}
 try{const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);storage=getStorage(app);await signInAnonymously(auth);onAuthStateChanged(auth,async u=>{if(!u)return;user=u;await setDoc(doc(db,"users",u.uid),{uid:u.uid,username,phone,photo:localStorage.getItem("onezal_photo")||"",createdAt:serverTimestamp()},{merge:true});listenMessages();listenStatuses();});}
 catch(e){console.error(e);toast("Firebase belum siap: periksa konfigurasi dan aturan database.")}
}
function listenMessages(){
 if(stopMessages)stopMessages();
 const q=query(collection(db,"rooms",activeRoom,"messages"),orderBy("createdAt","asc"),limit(100));
 stopMessages=onSnapshot(q,s=>{const arr=s.docs.map(d=>({id:d.id,...d.data()}));renderMessages(arr)},e=>console.error(e));
}
function renderMessages(arr){
 $("messages").innerHTML="";
 arr.forEach(m=>{const el=document.createElement("div");el.className="message"+(m.uid===user?.uid||m.localMine?" mine":"");if(activeRoom==="global"&&m.username)el.innerHTML='<div class="sender"></div>';if(activeRoom==="global"&&m.username){const sender=el.querySelector(".sender");sender.textContent="";sender.append(nameWithBadge(m.username));}
 if(m.image){const im=document.createElement("img");im.src=m.image;im.alt="Foto yang dibagikan";el.append(im)}
 if(m.text){const t=document.createElement("div");t.textContent=m.text;el.append(t)}
 const time=document.createElement("time");time.textContent=m.createdAt?.toDate?m.createdAt.toDate().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}):"baru saja";el.append(time);$("messages").append(el)});
 $("messages").scrollTop=$("messages").scrollHeight;
}
function renderLocal(){renderMessages(localMessages.filter(m=>m.room===activeRoom))}
function openConversation(room,name,friend=null){activeRoom=room;activeFriend=friend;$("conversationName").textContent=name;$("conversationSub").textContent=room==="global"?"Grup publik · semua pengguna":"Percakapan pribadi";$("conversationAvatar").src=room==="global"?"assets/logo-onezal.jpg":"assets/default-avatar.jpg";$("friendActions").classList.toggle("hidden",!friend);showPage("conversation");if(db&&user)listenMessages();else renderLocal()}
$("openGroup").onclick=()=>openConversation("global","ChatGlobalonezal");
$("backChats").onclick=()=>{if(stopMessages){stopMessages();stopMessages=null}showPage("chat")};
$("conversationMenu").onclick=()=>openModal("Pengaturan chat",'<p>Atur tampilan ruang obrolan ini.</p><button class="primary" id="wallpaperBtn">Ubah latar belakang</button>');
$("modalBody").onclick=e=>{if(e.target.id==="wallpaperBtn"){closeModal();pickImage("wallpaper")}};
$("messageForm").onsubmit=async e=>{e.preventDefault();const text=$("messageInput").value.trim();if(!text)return;$("messageInput").value="";await sendMessage({text})};
async function sendMessage(data){const m={...data,uid:user?.uid||"local",username,createdAt:db?serverTimestamp():null,localMine:true,room:activeRoom};
 if(db&&user){try{await addDoc(collection(db,"rooms",activeRoom,"messages"),m)}catch(e){toast("Pesan gagal dikirim. Periksa koneksi.")}}
 else{localMessages.push(m);localStorage.setItem("onezal_messages",JSON.stringify(localMessages));renderLocal()}}
$("attachPhoto").onclick=()=>pickImage("chat");
function pickImage(kind){const picker=$("imagePicker");picker.accept=kind==="status"?"image/*,video/*":"image/*";picker.onchange=async()=>{const file=picker.files[0];if(!file)return;if(file.size>12*1024*1024){toast("File maksimal 12 MB.");return}try{let url;if(storage&&user){const r=ref(storage,`uploads/${user.uid}/${Date.now()}_${file.name}`);await uploadBytes(r,file);url=await getDownloadURL(r)}else{url=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
 if(kind==="chat")await sendMessage({image:url});if(kind==="profile"){localStorage.setItem("onezal_photo",url);$("profileImage").src=url;$("profileImage").hidden=false;$("profileFallback").hidden=true;if(db&&user)await setDoc(doc(db,"users",user.uid),{photo:url},{merge:true})}
 if(kind==="status"){const item={uid:user?.uid||"local",username,photo:url,mediaType:file.type.startsWith("video/")?"video":"image",expiresAt:Date.now()+86400000,createdAt:Date.now()};if(db&&user)await addDoc(collection(db,"statuses"),{...item,createdAt:serverTimestamp()});else{let a=JSON.parse(localStorage.getItem("onezal_status")||"[]");a.unshift(item);localStorage.setItem("onezal_status",JSON.stringify(a));renderLocalStatuses()}toast("Status ditambahkan") }
 if(kind==="wallpaper"){document.documentElement.style.setProperty("--wallpaper",`url("${url}")`);localStorage.setItem("onezal_wallpaper",url);toast("Latar chat diperbarui")}
 }catch(e){console.error(e);toast("Foto gagal diproses")}picker.value=""};picker.click()}
$("profileUpload").onclick=()=>pickImage("profile");$("addStatus").onclick=()=>pickImage("status");
$("changeWallpaper").onclick=()=>pickImage("wallpaper");
$("changeTheme").onclick=()=>openModal("Ubah latar tema",'<p>Pilih warna aksen aplikasi.</p><button class="primary" data-theme="blue">Biru neon</button> <button class="primary" data-theme="violet">Ungu</button> <button class="primary" data-theme="green">Hijau</button>');
$("modalBody").addEventListener("click",e=>{const t=e.target.dataset.theme;if(!t)return;const colors={blue:"#299cff",violet:"#a77bff",green:"#36d69a"};document.documentElement.style.setProperty("--blue",colors[t]);localStorage.setItem("onezal_theme",t);closeModal()});
$("editUsername").onclick=()=>openModal("Ubah username",'<p>Gunakan nama unik agar teman dapat menemukan akunmu.</p><input id="newUsername" maxlength="22" placeholder="username baru"><button class="primary" id="saveUsername">Simpan</button>');
$("modalBody").addEventListener("click",async e=>{if(e.target.id!=="saveUsername")return;const v=$("newUsername").value.trim().replace(/^@/,"");if(!/^[a-zA-Z0-9_]{3,22}$/.test(v)){toast("Username 3–22 karakter, huruf/angka/underscore.");return}username=v;localStorage.setItem("onezal_username",v);updateOwnName();if(db&&user)await setDoc(doc(db,"users",user.uid),{username:v},{merge:true});closeModal();toast("Username diperbarui")});
$("userSearch").oninput=async()=>{const term=$("userSearch").value.trim().toLowerCase();if(term.length<2){$("searchResults").classList.add("hidden");return}let users=[];if(db){try{const s=await getDocs(query(collection(db,"users"),limit(40)));users=s.docs.map(d=>d.data()).filter(u=>u.username?.toLowerCase().includes(term)&&u.uid!==user?.uid)}catch(e){}}else users=[{username:"contoh_teman",uid:"sample"}].filter(u=>u.username.includes(term));$("searchResults").innerHTML="";users.forEach(u=>{const b=document.createElement("button");b.className="search-result";b.innerHTML='<div class="avatar">◯</div><div class="chat-info"><b></b><small>Ketuk untuk melihat profil</small></div>';b.querySelector("b").textContent="@"+u.username;if(isCreator(u.username)){b.querySelector("b").append(Object.assign(document.createElement("img"),{src:"assets/verified-blue.png",alt:"Kreator ONEZAL",className:"verified-mark"}))}b.onclick=()=>showUser(u);$("searchResults").append(b)});if(!users.length)$("searchResults").textContent="Username tidak ditemukan."; $("searchResults").classList.remove("hidden")};
$("clearSearch").onclick=()=>{$("userSearch").value="";$("searchResults").classList.add("hidden")};
function showUser(u){openModal("@"+u.username,'<p>Pilih cara berinteraksi dengan pengguna ini.</p><button class="primary" id="profileFriend">Tambah teman</button> <button class="primary" id="profileChat">Tambah chat</button>');$("modalBody").onclick=e=>{if(e.target.id==="profileFriend"||e.target.id==="profileChat"){const isFriend=e.target.id==="profileFriend";if(isFriend&&db&&user)setDoc(doc(db,"users",user.uid,"friends",u.uid),{uid:u.uid,username:u.username,createdAt:serverTimestamp()});closeModal();openConversation("dm_"+[user?.uid||"local",u.uid].sort().join("_"),"@"+u.username,u);toast(isFriend?"Teman ditambahkan":"Chat dibuka")}}}
$("addFriend").onclick=()=>toast("Teman ditambahkan");$("addChat").onclick=()=>toast("Chat pribadi dibuka");
function listenStatuses(){onSnapshot(query(collection(db,"statuses"),orderBy("createdAt","desc"),limit(40)),s=>renderStatuses(s.docs.map(d=>d.data())),e=>console.error(e))}
function renderStatuses(items){$("statusList").innerHTML="";$("statusEmpty").classList.toggle("hidden",items.length>0);items.forEach(s=>addStatusRow(s))}
function addStatusRow(s){const b=document.createElement("button");b.className="status-card";b.innerHTML='<div class="avatar">◯</div><div><b></b><small>Ketuk untuk melihat status</small></div>';b.querySelector("b").textContent="@"+s.username;b.onclick=()=>{const media=s.mediaType==="video"?`<video src="${s.photo}" controls style="width:100%;max-height:65vh"></video>`:`<img src="${s.photo}" style="width:100%;border-radius:12px;max-height:65vh;object-fit:contain">`;openModal("Status @"+s.username,media+(s.uid===(user?.uid||"local")?`<p>👁️ Lihat: ${(s.views||[]).length} orang</p>`:""))};$("statusList").append(b)}
function renderLocalStatuses(){const items=JSON.parse(localStorage.getItem("onezal_status")||"[]").filter(s=>!s.expiresAt||s.expiresAt>Date.now());localStorage.setItem("onezal_status",JSON.stringify(items));$("statusList").innerHTML="";$("statusEmpty").classList.toggle("hidden",items.length>0);items.forEach(addStatusRow)}
$("profileImage").src=localStorage.getItem("onezal_photo")||"assets/onezal-small.png";if(localStorage.getItem("onezal_photo")){$("profileImage").hidden=false;$("profileFallback").hidden=true}
if(localStorage.getItem("onezal_wallpaper"))document.documentElement.style.setProperty("--wallpaper",`url("${localStorage.getItem("onezal_wallpaper")}")`);
const savedTheme=localStorage.getItem("onezal_theme");if(savedTheme)document.documentElement.style.setProperty("--blue",{blue:"#299cff",violet:"#a77bff",green:"#36d69a"}[savedTheme]);
renderLocalStatuses();init();


// Gerbang login demo Chat.onezal. Akun Rijal adalah akun kreator yang dicadangkan.
const authGate=document.getElementById("authGate");
const appShell=document.querySelector(".app-shell");
appShell.classList.add("login-locked");
document.getElementById("authForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const u=document.getElementById("authUsername").value.trim();
  const p=document.getElementById("authPassword").value;
  const bot=document.getElementById("botCheck").checked;
  const err=document.getElementById("authError");err.textContent="";
  if(!/^[a-zA-Z0-9_]{3,22}$/.test(u)){err.textContent="Username 3–22 karakter, gunakan huruf, angka, atau _.";return;}
  if(!bot){err.textContent="Centang konfirmasi bot terlebih dahulu.";return;}
  if(u.toLowerCase()==="rijal" && p!=="221101"){err.textContent="Password akun kreator Rijal salah.";return;}
  if(u.toLowerCase()!=="rijal" && p.length<6){err.textContent="Password minimal 6 karakter.";return;}
  {
    username=u.toLowerCase()==="rijal"?"Rijal":u;
    localStorage.setItem("onezal_username",username);
    phone=localStorage.getItem("onezal_phone")||"628"+String(Math.floor(1000000000+Math.random()*9000000000));
    localStorage.setItem("onezal_phone",phone);
    $("myNumber").textContent=phone;updateOwnName();
    if(db&&user){try{await setDoc(doc(db,"users",user.uid),{username,phone,isCreator:isCreator(username)},{merge:true})}catch(err){console.warn("Profil belum tersinkron",err)}}
    $("authGate").classList.add("hide");
    appShell.classList.remove("login-locked");
    if(!sessionStorage.getItem("onezal_intro_seen")){
      const layer=document.getElementById("welcomeVideo");const video=document.getElementById("welcomeClip");
      layer.classList.remove("hide");
      const finish=()=>{layer.classList.add("hide");video.pause();sessionStorage.setItem("onezal_intro_seen","1")};
      document.getElementById("skipWelcome").onclick=finish;video.onended=finish;
      const play=video.play();if(play&&play.catch)play.catch(()=>{video.controls=true;});
    }
    toast("Selamat datang di Chat.onezal");
  }
});
