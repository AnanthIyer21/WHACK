const button = document.createElement("button");
button.innerText = "Download Images";
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

button.onclick = () => {
  const images = document.querySelectorAll("img");
  images.forEach((img, index) => {
    const imageUrl = img.src;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `instagram_image_${index}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};

document.body.appendChild(button);

