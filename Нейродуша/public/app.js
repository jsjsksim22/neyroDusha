// Простая SPA-логика + галерея + загрузка фото + чат (с базовым кризис-проверочным поведением)
const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll(".main-nav a");
const chatEl = document.getElementById("chat");
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");

const galleryGrid = document.getElementById("galleryGrid");
const uploadBtn = document.getElementById("uploadBtn");
const photoInput = document.getElementById("photoInput");
const uploadPreview = document.getElementById("uploadPreview");

const profileAvatar = document.getElementById("profileAvatar");
const clearAvatarBtn = document.getElementById("clearAvatar");

const emergencyCard = document.getElementById("emergency");
const emText = document.getElementById("emText");
const emCall = document.getElementById("emCall");

const AI_AVATAR_DEFAULT = "assets/avatar-ai.svg";
const STORAGE_AVATAR_KEY = "ai_profile_avatar";

function showPage(name){
  pages.forEach(p => p.id === name ? p.classList.remove("hidden") : p.classList.add("hidden"));
  navLinks.forEach(a => a.dataset.page === name ? a.classList.add("active") : a.classList.remove("active"));
}
navLinks.forEach(a => a.addEventListener("click", (e)=>{
  e.preventDefault();
  showPage(a.dataset.page);
}));

// initial
showPage("home");

// quick exercise buttons
document.querySelectorAll(".pill").forEach(b=>{
  b.addEventListener("click", ()=>{
    const msg = b.textContent;
    appendUser(msg);
    sendMessage(msg);
  });
});

// chat helpers
function appendMessage(text, from="ai"){
  const d = document.createElement("div");
  d.className = "msg " + (from === "user" ? "user" : "ai");
  if (from === "ai") {
    const img = document.createElement("img");
    img.className = "avatar";
    img.src = localStorage.getItem(STORAGE_AVATAR_KEY) || AI_AVATAR_DEFAULT;
    img.alt = "AI";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    d.appendChild(img);
    d.appendChild(bubble);
  } else {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    d.appendChild(bubble);
  }
  chatEl.appendChild(d);
  chatEl.scrollTop = chatEl.scrollHeight;
}
function appendUser(text){ appendMessage(text, "user"); }

// simple crisis detection on frontend (also checked on server)
function isCrisis(text){
  if (!text) return false;
  const k = ["суицид","покончу","хочу умереть","не хочу жить","убью себя","suicide","kill myself"];
  const lower = text.toLowerCase();
  return k.some(t => lower.includes(t));
}

// send to backend
async function sendMessage(text){
  const typing = document.createElement("div");
  typing.className = "msg ai";
  const img = document.createElement("img");
  img.className = "avatar";
  img.src = localStorage.getItem(STORAGE_AVATAR_KEY) || AI_AVATAR_DEFAULT;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = "ИИ думает…";
  typing.appendChild(img); typing.appendChild(bubble);
  chatEl.appendChild(typing);
  chatEl.scrollTop = chatEl.scrollHeight;

  if (isCrisis(text)) {
    chatEl.removeChild(typing);
    showEmergency("Похоже, вы описываете кризис. Пожалуйста, обратитесь в экстренные службы (112/911) или горячие линии.");
    appendMessage("Похоже, это экстренная ситуация. Немедленно обратитесь в экстренные службы.", "ai");
    return;
  }

  try {
    const res = await fetch("/api/chat", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    chatEl.removeChild(typing);
    if (data.error) appendMessage("Ошибка: " + data.error, "ai");
    else if (data.escalate) {
      showEmergency(data.reply);
      appendMessage(data.reply, "ai");
    } else appendMessage(data.reply || "Пустой ответ", "ai");
  } catch (err) {
    console.error(err);
    if (typing.parentNode) chatEl.removeChild(typing);
    appendMessage("Сетевая ошибка. Попробуйте позже.", "ai");
  }
}

form.addEventListener("submit", (e)=>{
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  appendUser(text);
  input.value = "";
  sendMessage(text);
});

// ---------------- gallery & uploads ----------------
function renderGallery(images){
  galleryGrid.innerHTML = "";
  if (!images.length) {
    galleryGrid.innerHTML = "<p>Пока нет изображений.</p>";
    return;
  }
  images.forEach(img => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    const imageEl = document.createElement("img");
    imageEl.src = img.thumb || img.url;
    imageEl.alt = img.filename;
    item.appendChild(imageEl);

    const actions = document.createElement("div");
    actions.className = "actions";
    const viewBtn = document.createElement("a");
    viewBtn.className = "btn";
    viewBtn.href = img.url;
    viewBtn.target = "_blank";
    viewBtn.textContent = "Открыть";
    const setAvatar = document.createElement("button");
    setAvatar.className = "btn small";
    setAvatar.textContent = "Установить аватар";
    setAvatar.addEventListener("click", ()=>{
      localStorage.setItem(STORAGE_AVATAR_KEY, img.url);
      profileAvatar.src = img.url;
      alert("Аватар обновлён");
    });

    actions.appendChild(viewBtn);
    actions.appendChild(setAvatar);
    item.appendChild(actions);
    galleryGrid.appendChild(item);
  });
}

// load gallery from server
async function loadGallery(){
  try {
    const res = await fetch("/api/gallery");
    const data = await res.json();
    if (data.images) renderGallery(data.images);
  } catch (err) {
    console.error("Gallery load error", err);
  }
}

uploadBtn.addEventListener("click", async ()=>{
  const file = photoInput.files[0];
  if (!file) { alert("Выберите файл"); return; }
  const formData = new FormData();
  formData.append("photo", file);
  uploadPreview.classList.remove("hidden");
  uploadPreview.textContent = "Загрузка…";
  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.ok) {
      uploadPreview.innerHTML = XXXINLINECODEXXX8XXXINLINECODEXXX;
      await loadGallery();
      photoInput.value = "";
    } else {
      uploadPreview.textContent = "Ошибка загрузки: " + (data.error || "unknown");
    }
  } catch (err) {
    console.error(err);
    uploadPreview.textContent = "Сетевая ошибка при загрузке";
  }
});

// preview selected file
photoInput.addEventListener("change", ()=>{
  const f = photoInput.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  uploadPreview.classList.remove("hidden");
  uploadPreview.innerHTML = XXXINLINECODEXXX9XXXINLINECODEXXX;
});

// profile avatar load
function initProfileAvatar(){
  const av = localStorage.getItem(STORAGE_AVATAR_KEY);
  profileAvatar.src = av || AI_AVATAR_DEFAULT;
}
clearAvatarBtn.addEventListener("click", ()=>{
  localStorage.removeItem(STORAGE_AVATAR_KEY);
  profileAvatar.src = AI_AVATAR_DEFAULT;
  alert("Аватар сброшен");
});

// emergency functions
function showEmergency(text){
  emergencyCard.classList.remove("hidden");
  emText.textContent = text;
  emCall.href = "tel:112";
}

// initial load
loadGallery();
initProfileAvatar();