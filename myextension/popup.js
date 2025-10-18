document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("imageContainer");

  // 🔄 Wake up the service worker
  chrome.runtime.sendMessage({ action: "ping" }, response => {
    console.log("Ping response:", response);
  });

  // 🖼️ Load stored Instagram images
  chrome.storage.local.get(null, data => {
    const keys = Object.keys(data).filter(key => key.startsWith("instagram_img_"));

    if (keys.length === 0) {
      container.innerText = "No images stored yet.";
      return;
    }

    container.innerHTML = "";

    keys.forEach(key => {
      const base64 = data[key];
      const wrapper = document.createElement("div");
      wrapper.className = "image-wrapper";

      const img = document.createElement("img");
      img.src = base64;
      wrapper.appendChild(img);

      container.appendChild(wrapper);
    });
  });

  // 🚀 Send images to background for analysis
  document.getElementById("sendToBackground").addEventListener("click", () => {
    chrome.storage.local.get(null, async data => {
      const keys = Object.keys(data).filter(key => key.startsWith("instagram_img_"));

      for (let i = 0; i < keys.length; i++) {
        const base64 = data[keys[i]];
        const blob = await (await fetch(base64)).blob();
        const imageUrl = URL.createObjectURL(blob);

        chrome.runtime.sendMessage({
          action: "processImage",
          imageUrl: imageUrl,
          imgIndex: i
        }, response => {
          console.log("Response from background:", response);

          const wrapper = container.children[i];
          if (!wrapper) {
            console.warn(`No wrapper found for image ${i}`);
            return;
          }

          const overlay = document.createElement("div");
          overlay.className = "overlay";

          if (response?.success && response.prediction) {
            const { label, score } = response.prediction;
            overlay.innerText = `${label} (${(score * 100).toFixed(1)}%)`;
            overlay.style.backgroundColor = label.toLowerCase().includes("ai")
              ? "rgba(255,0,0,0.7)"
              : "rgba(0,128,0,0.7)";
          } else {
            overlay.innerText = `Error: ${response?.error || "No response"}`;
            overlay.style.backgroundColor = "rgba(128,0,0,0.7)";
          }

          wrapper.appendChild(overlay);
          URL.revokeObjectURL(imageUrl);
        });
      }
    });
  });
});