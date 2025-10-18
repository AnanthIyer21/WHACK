// Grab all visible images on the Instagram page
const images = document.querySelectorAll("img");

images.forEach(img => {
  const imageUrl = img.src;

  // Send image URL to background.js for AI detection
  chrome.runtime.sendMessage({ type: "analyzeImage", url: imageUrl }, response => {
    if (response && response.isAI) {
      // Create a badge to overlay on the image
      const badge = document.createElement("div");
      badge.innerText = "⚠️ AI Detected";
      badge.style.position = "absolute";
      badge.style.background = "rgba(255, 0, 0, 0.8)";
      badge.style.color = "white";
      badge.style.fontSize = "12px";
      badge.style.padding = "2px 4px";
      badge.style.borderRadius = "4px";
      badge.style.zIndex = "9999";

      // Ensure the image container is positioned
      const container = img.parentElement;
      container.style.position = "relative";
      container.appendChild(badge);
    }
  });
});

