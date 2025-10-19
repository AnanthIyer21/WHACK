// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeImage",
    title: "Analyze with AI Detector",
    contexts: ["image"]
  });
});

// Handle context menu clicks  
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "analyzeImage") {
    // Store image URL
    await chrome.storage.local.set({ 
      pendingImageUrl: info.srcUrl,
      timestamp: Date.now()
    });
    
    // Tell user to click extension icon
    console.log('Image queued. User needs to click extension icon.');
  }
});