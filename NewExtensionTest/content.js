function greyOutImages() {
  const images = document.querySelectorAll("article img");

  images.forEach((img) => {
    // Avoid reapplying the filter
    if (img.dataset.greyed === "true") return;

    img.style.filter = "grayscale(100%)";
    img.dataset.greyed = "true";
  });
}

// Observe DOM changes — Instagram dynamically loads posts
const observer = new MutationObserver(greyOutImages);
observer.observe(document.body, { childList: true, subtree: true });

// Initial run
greyOutImages();
