const imagesContainer = document.getElementById("images");
const clearBtn = document.getElementById("clear");

// Load all images from storage
chrome.storage.local.get(null, (data) => {
  imagesContainer.innerHTML = "";
  for (const key in data) {
    const img = document.createElement("img");
    img.src = data[key];
    imagesContainer.appendChild(img);
  }
});

// Clear all images
clearBtn.addEventListener("click", () => {
  chrome.storage.local.clear(() => {
    imagesContainer.innerHTML = "";
    console.log("All saved images cleared.");
  });
});
