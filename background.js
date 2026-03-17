// Register context menu item on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translate-to-darija",
    title: "Tarjama – Translate to Darija",
    contexts: ["selection"]
  });
});

// Open the side panel and forward selected text when context menu is clicked
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate-to-darija" && info.selectionText) {
    // Open the side panel for the current tab
    chrome.sidePanel.open({ tabId: tab.id }).then(() => {
      // Small delay to ensure the side panel is ready to receive messages
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: "translate",
          text: info.selectionText
        });
      }, 300);
    });
  }
});

// Also open side panel when the toolbar action button is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});
