const sourceEl = document.getElementById("source-text");
const resultEl = document.getElementById("result-text");
const translateBtn = document.getElementById("translate-btn");
const copyBtn = document.getElementById("copy-btn");
const statusEl = document.getElementById("status");
const swapBtn = document.getElementById("swap-btn");

// Settings drawer elements
const settingsBtn = document.getElementById("settings-btn");
const closeSettings = document.getElementById("close-settings");
const overlay = document.getElementById("settings-overlay");
const drawer = document.getElementById("settings-drawer");
const apiKeyEl = document.getElementById("api-key");
const saveKeyBtn = document.getElementById("save-key-btn");
const toggleKeyBtn = document.getElementById("toggle-key-btn");
const keyStatusEl = document.getElementById("key-status");

const sourceCard = document.querySelector(".source-card");
const sourceLangBar = document.getElementById("source-lang-bar");
const targetLangBar = document.getElementById("target-lang-bar");

const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

// ── Language definitions ─────────────────────────────────
const LANGUAGES = {
  en:  { label: "English",  rtl: false },
  fr:  { label: "French",   rtl: false },
  es:  { label: "Spanish",  rtl: false },
  ar:  { label: "Modern Standard Arabic", rtl: true  },
  drj: { label: "Moroccan Arabic Dialect (Darija)", rtl: true  }
};

let sourceLang = "en";
let targetLang = "drj";

// ── Language pill selection ──────────────────────────────
function setActivePill(bar, lang) {
  bar.querySelectorAll(".lang-pill").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

sourceLangBar.addEventListener("click", (e) => {
  const pill = e.target.closest(".lang-pill");
  if (!pill) return;
  const lang = pill.dataset.lang;
  if (lang === targetLang) {
    // swap instead of blocking
    [sourceLang, targetLang] = [lang, sourceLang];
    setActivePill(sourceLangBar, sourceLang);
    setActivePill(targetLangBar, targetLang);
    updateResultDir();
    return;
  }
  sourceLang = lang;
  setActivePill(sourceLangBar, sourceLang);
});

targetLangBar.addEventListener("click", (e) => {
  const pill = e.target.closest(".lang-pill");
  if (!pill) return;
  const lang = pill.dataset.lang;
  if (lang === sourceLang) {
    [sourceLang, targetLang] = [targetLang, lang];
    setActivePill(sourceLangBar, sourceLang);
    setActivePill(targetLangBar, targetLang);
    updateResultDir();
    return;
  }
  targetLang = lang;
  setActivePill(targetLangBar, targetLang);
  updateResultDir();
});

// ── Swap button ──────────────────────────────────────────
swapBtn.addEventListener("click", () => {
  [sourceLang, targetLang] = [targetLang, sourceLang];
  setActivePill(sourceLangBar, sourceLang);
  setActivePill(targetLangBar, targetLang);
  // Also swap the textarea / result text
  const prevSource = sourceEl.value;
  const prevResult = resultEl.textContent.trim();
  if (prevResult && prevResult !== "Translation will appear here") {
    sourceEl.value = prevResult;
    resultEl.textContent = prevSource;
  }
  updateResultDir();
});

function updateResultDir() {
  const isRtl = LANGUAGES[targetLang].rtl;
  resultEl.setAttribute("dir", isRtl ? "rtl" : "ltr");
}

// ── Settings drawer toggle ───────────────────────────────
function openSettings() {
  drawer.classList.remove("hidden");
  overlay.classList.remove("hidden");
}

function closeSettingsDrawer() {
  drawer.classList.add("hidden");
  overlay.classList.add("hidden");
}

settingsBtn.addEventListener("click", openSettings);
closeSettings.addEventListener("click", closeSettingsDrawer);
overlay.addEventListener("click", closeSettingsDrawer);

// ── Load saved API key on startup ────────────────────────
chrome.storage.local.get("geminiApiKey", ({ geminiApiKey }) => {
  if (geminiApiKey) {
    apiKeyEl.value = geminiApiKey;
    keyStatusEl.textContent = "Key saved";
    keyStatusEl.className = "key-status saved";
  }
});

// ── Save API key ─────────────────────────────────────────
saveKeyBtn.addEventListener("click", () => {
  const key = apiKeyEl.value.trim();
  if (!key) {
    keyStatusEl.textContent = "Please enter a key";
    keyStatusEl.className = "key-status error";
    return;
  }
  chrome.storage.local.set({ geminiApiKey: key }, () => {
    keyStatusEl.textContent = "Key saved";
    keyStatusEl.className = "key-status saved";
    setTimeout(closeSettingsDrawer, 600);
  });
});

// ── Toggle key visibility ────────────────────────────────
toggleKeyBtn.addEventListener("click", () => {
  apiKeyEl.type = apiKeyEl.type === "password" ? "text" : "password";
});

// ── Listen for messages from background (context menu) ───
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "translate" && message.text) {
    sourceEl.value = message.text;
    pulseCard();
    doTranslate(message.text);
  }
});

// ── Translate button ─────────────────────────────────────
translateBtn.addEventListener("click", () => {
  const text = sourceEl.value.trim();
  if (!text) return;
  doTranslate(text);
});

// ── Copy button ──────────────────────────────────────────
copyBtn.addEventListener("click", () => {
  const text = resultEl.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showStatus("Copied to clipboard!", "info");
  });
});

// ── Core translation logic (Gemini API) ──────────────────
async function doTranslate(text) {
  const { geminiApiKey } = await chrome.storage.local.get("geminiApiKey");

  if (!geminiApiKey) {
    showStatus("Add your Gemini API key in Settings first.", "error");
    openSettings();
    apiKeyEl.focus();
    return;
  }

  if (sourceLang === targetLang) {
    showStatus("Source and target language are the same.", "error");
    return;
  }

  setLoading(true);
  hideStatus();
  resultEl.innerHTML = "";
  copyBtn.disabled = true;

  const apiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;

  const srcLabel = LANGUAGES[sourceLang].label;
  const tgtLabel = LANGUAGES[targetLang].label;

  const prompt =
    `Translate the following ${srcLabel} text into ${tgtLabel}. ` +
    `Return ONLY the translation, nothing else. No explanations, no transliteration.\n\n` +
    `"${text}"`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.error?.message || `Gemini API responded with ${response.status}`
      );
    }

    const data = await response.json();
    const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!translated) throw new Error("Empty response from Gemini");

    resultEl.textContent = translated;
    copyBtn.disabled = false;
  } catch (err) {
    showStatus(`Translation failed: ${err.message}`, "error");
    resultEl.innerHTML =
      '<span class="placeholder">Translation will appear here</span>';
  } finally {
    setLoading(false);
  }
}

// ── Helpers ──────────────────────────────────────────────
function setLoading(loading) {
  translateBtn.disabled = loading;
  const label = translateBtn.querySelector(".btn-label");
  label.textContent = loading ? "Translating..." : "Translate";
  if (loading) translateBtn.classList.add("loading");
  else translateBtn.classList.remove("loading");
}

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `toast ${type}`;
  statusEl.hidden = false;
}

function hideStatus() {
  statusEl.hidden = true;
}

function pulseCard() {
  sourceCard.classList.remove("pulse");
  void sourceCard.offsetWidth;
  sourceCard.classList.add("pulse");
}
