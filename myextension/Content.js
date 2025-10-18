const images = document.querySelectorAll("img");

// Filter and store large post images
images.forEach((img, index) => {
  const imageUrl = img.src;

  if (img.width > 300 && imageUrl.includes("scontent")) {
    // Create grey overlay
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = img.width + "px";
    overlay.style.height = img.height + "px";
    overlay.style.backgroundColor = "rgba(128, 128, 128, 0.5)";
    overlay.style.zIndex = "9998";

    const container = img.parentElement;
    container.style.position = "relative";
    container.appendChild(overlay);

    // Fetch image and store as base64
    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result;
          const key = `instagram_img_${index}`;
          chrome.storage.local.set({ [key]: base64Data }, () => {
            console.log(`Stored ${key} in chrome.storage.local`);
          });
        };
        reader.readAsDataURL(blob);
      });
  }
});
