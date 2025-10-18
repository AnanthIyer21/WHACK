document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("imageContainer");

  chrome.storage.local.get(null, data => {
    const keys = Object.keys(data).filter(key => key.startsWith("instagram_img_"));

    if (keys.length === 0) {
      container.innerText = "No images stored yet.";
      return;
    }

    container.innerHTML = ""; // Clear loading text

    keys.forEach(key => {
      const base64 = data[key];
      const img = document.createElement("img");
      img.src = base64;
      container.appendChild(img);
    });
  });
<<<<<<< HEAD
=======

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
          if (response?.success) {
            console.log(`Image ${i} processed:`, response.prediction);
          } else {
            console.error(`Image ${i} failed:`, response?.error);
          }

          URL.revokeObjectURL(imageUrl);
        });
      }
    });
  });
>>>>>>> b1430140fd6d6d7c35fd8bd113c37cb58ea10d12
});