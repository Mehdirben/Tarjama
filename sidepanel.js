const sourceEl = document.getElementById("source-text");
const resultEl = document.getElementById("result-text");
const translateBtn = document.getElementById("translate-btn");
const copyBtn = document.getElementById("copy-btn");
const statusEl = document.getElementById("status");
const apiKeyEl = document.getElementById("api-key");
const saveKeyBtn = document.getElementById("save-key-btn");
const toggleKeyBtn = document.getElementById("toggle-key-btn");
const keyStatusEl = document.getElementById("key-status");

const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

// ── Load saved API key on startup ────────────────────────────
chrome.storage.local.get("geminiApiKey", ({ geminiApiKey }) => {
  if (geminiApiKey) {
    apiKeyEl.value = geminiApiKey;
    keyStatusEl.textContent = "Key saved";
    keyStatusEl.className = "key-status saved";
  }
});

// ── Save API key ─────────────────────────────────────────────
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
  });
});

// ── Toggle key visibility ────────────────────────────────────
toggleKeyBtn.addEventListener("click", () => {
  const isHidden = apiKeyEl.type === "password";
  apiKeyEl.type = isHidden ? "text" : "password";
});

// ── Listen for messages from the background service worker ───
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "translate" && message.text) {
    sourceEl.value = message.text;
    doTranslate(message.text);
  }
});

// ── Translate button ─────────────────────────────────────────
translateBtn.addEventListener("click", () => {
  const text = sourceEl.value.trim();
  if (!text) return;
  doTranslate(text);
});

// ── Copy button ──────────────────────────────────────────────
copyBtn.addEventListener("click", () => {
  const text = resultEl.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showStatus("Copied to clipboard!", "info");
  });
});

// ── Core translation logic (Gemini API) ──────────────────────
async function doTranslate(text) {
  // Read key from storage (may have been saved earlier)
  const { geminiApiKey } = await chrome.storage.local.get("geminiApiKey");

  if (!geminiApiKey) {
    showStatus("Please enter and save your Gemini API key first.", "error");
    apiKeyEl.focus();
    return;
  }

  setLoading(true);
  hideStatus();
  resultEl.innerHTML = "";
  copyBtn.disabled = true;

  const apiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;

  const prompt =
    `Translate the following English text to Moroccan Arabic Dialect (Darija). ` +
    `Return ONLY the Darija translation, nothing else. No explanations, no transliteration.\n\n` +
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
    const translated =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!translated) {
      throw new Error("Empty response from Gemini");
    }

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

// ── Helpers ──────────────────────────────────────────────────
function setLoading(loading) {
  translateBtn.disabled = loading;
  translateBtn.textContent = loading ? "Translating…" : "Translate";
  if (loading) translateBtn.classList.add("loading");
  else translateBtn.classList.remove("loading");
}

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`;
  statusEl.hidden = false;
}

function hideStatus() {
  statusEl.hidden = true;
}
