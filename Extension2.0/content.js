function greyOutAndSaveImages() {
  const images = document.querySelectorAll("article img");

  images.forEach((img) => {
    if (img.dataset.processed === "true") return;
    img.dataset.processed = "true";

    // Apply grey filter
    img.style.filter = "grayscale(100%)";

    // Create a canvas to convert image → greyed-out data URL
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw the greyed-out version
    ctx.filter = "grayscale(100%)";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const dataUrl = canvas.toDataURL("image/jpeg");

    // Send to background for saving/storing
    chrome.runtime.sendMessage({ type: "saveImage", dataUrl });
  });
}

// Watch for new posts
const observer = new MutationObserver(greyOutAndSaveImages);
observer.observe(document.body, { childList: true, subtree: true });

// Initial run
greyOutAndSaveImages();
