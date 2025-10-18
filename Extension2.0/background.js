chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "saveImage") {
    const key = `img_${Date.now()}`;
    await chrome.storage.local.set({ [key]: msg.dataUrl });
    console.log("Stored greyed image as:", key);
  }
});
