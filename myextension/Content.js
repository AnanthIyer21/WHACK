const images = document.querySelectorAll("img");

// Filter and store images to download
const imagesToDownload = [];
images.forEach((img, index) => {
  const imageUrl = img.src;

  // Filter: only large post images from Instagram CDN
  if (img.width > 300 && imageUrl.includes("scontent")) {
    imagesToDownload.push({ img, imageUrl, index });

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
  }
});

// Function to download with delay
function downloadWithDelay(index) {
  if (index >= imagesToDownload.length) return;

  const { imageUrl, index: imgIndex } = imagesToDownload[index];
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = `instagram_post_${imgIndex}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => downloadWithDelay(index + 1), 500); // 500ms delay
}

// Start downloading after short initial delay
setTimeout(() => downloadWithDelay(0), 1000);



