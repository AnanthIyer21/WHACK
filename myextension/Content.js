// Create a "Download Post Images" button
const button = document.createElement("button");
button.innerText = "Download Post Images";
button.style.position = "fixed";
button.style.top = "10px";
button.style.right = "10px";
button.style.zIndex = "9999";
button.style.padding = "8px 12px";
button.style.background = "#3897f0";
button.style.color = "white";
button.style.border = "none";
button.style.borderRadius = "4px";
button.style.cursor = "pointer";

// Highlight and tag images to download
const imagesToDownload = [];
const images = document.querySelectorAll("img");

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

    // Ensure container is positioned
    const container = img.parentElement;
    container.style.position = "relative";
    container.appendChild(overlay);
  }
});

// Download logic triggered by button
button.onclick = () => {
  imagesToDownload.forEach(({ imageUrl, index }) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `instagram_post_${index}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};

document.body.appendChild(button);



