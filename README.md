# Tarjama – English to Darija Translator

**Tarjama** (ترجمة) is a sleek, Manifest V3 Chrome Extension that lives directly in your browser's Side Panel, bringing robust translation capabilities to your fingertips without interrupting your current workflow. It leverages the speed and power of the **Google Gemini API** (specifically `gemini-3.1-flash-lite-preview`) to offer seamless translations between major global languages and regional dialects.

## ✨ Features

- **Multilingual Support:** Translate to and from English, French, Spanish, Modern Standard Arabic (MSA), and the Moroccan Arabic Dialect (Darija). Include an auto-detect feature for seamless usage.
- **Powered by Gemini AI:** Uses Google's highly efficient Gemini 3.1 Flash Lite model to provide accurate colloquial and standard translations.
- **Native Side Panel UI:** Enjoy a persistent side panel that stays with you across different web pages.
- **Context Menu Integration:** Select any text on any webpage, right-click, and select "Tarjama – Translate" to instantly send text to the side panel for translation.
- **Smart Text Direction:** Automatically manages Right-to-Left (RTL) formatting when Arabic or Darija are selected as the target languages.
- **Bring Your Own Key (BYOK):** Your API key is stored securely via Chrome's local storage and can be easily managed from the user-friendly settings drawer.

## 🚀 Installation (Developer Mode)

Since this extension uses Manifest V3, you must run it on a modern version of Chrome (or Edge/Brave/Chromium).

1. Clone or download this repository to your local machine.
2. Open your chromium-based browser and navigate to the Extensions page: `chrome://extensions/`.
3. Toggle the **Developer mode** switch in the top-right corner to **ON**.
4. Click the **Load unpacked** button.
5. Select the folder containing the project files (the folder that contains `manifest.json`).

## 💻 Usage

1. **Set Up the API Key**: 
   - Click the extension icon in your toolbar to open the Side Panel.
   - Click the Settings (gear) icon in the panel.
   - Paste your [Google Gemini API Key](https://aistudio.google.com/app/apikey) and click **Save Key**.
2. **Translating Using the UI**:
   - Choose your source and target languages using the language pills.
   - Type or paste text into the source card.
   - Click **Translate**.
3. **Translating from the Web**:
   - Highlight any text on any website.
   - Right-click the highlighted text.
   - Choose **Tarjama – Translate** from the context menu. The translated text will automatically populate inside the open side panel.

## 🛠️ Project Structure

- `manifest.json` - Defines the extension's metadata, permissions (`sidePanel`, `contextMenus`, `storage`), and V3 requirements.
- `background.js` - The service worker that registers the right-click context menu and handles triggering the side panel.
- `content.js` - Ready-to-go content script for cross-frame interactions and DOM reading (if necessary).
- `sidepanel.*` (`.html`, `.css`, `.js`) - The user interface and main translation logic bridging the frontend and the Gemini API.
- `icons/` - Contains the extension logos for the Chrome toolbar and store.

## 🛡️ Privacy & Security

Tarjama only stores your Gemini API key locally on your own machine using Chrome's secure storage API (`chrome.storage.local`). The key is only sent directly to Google's official Gemini endpoints during a translation request and is never tracked, shared, or logged externally. 

---
*Made with ❤️ for connecting languages.*