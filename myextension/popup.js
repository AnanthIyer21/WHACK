document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("imageContainer");

  // Retrieve all stored images from chrome.storage.local
  chrome.storage.local.get(null, data => {
    const keys = Object.keys(data).filter(key => key.startsWith("instagram_img_"));

    if (keys.length === 0) {
      container.innerText = "No images stored yet.";
      return;
    }

    keys.forEach(key => {
      const base64 = data[key];
      const img = document.createElement("img");
      img.src = base64;
      img.style.maxWidth = "100%";
      img.style.marginBottom = "10px";
      container.appendChild(img);
    });
  });
});
