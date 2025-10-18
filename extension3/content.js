// Find all potential image elements on the page. Using a more specific selector is often better for Instagram.
const postImages = document.querySelectorAll('img'); 

// Store a map to track which image has which overlay, useful for response handling
const processingMap = new Map();

postImages.forEach((img, index) => {
    const imageUrl = img.src;

    // Filter for large post images that are likely actual content
    if (img.width > 300 && imageUrl.includes("scontent")) {
        
        // --- 1. Create and Attach Overlay (UI Feedback) ---
        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = img.width + "px";
        overlay.style.height = img.height + "px";
        overlay.style.backgroundColor = "rgba(128, 128, 128, 0.5)";
        overlay.style.zIndex = "9998";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.textContent = "Analyzing...";
        overlay.style.color = "white";
        overlay.style.fontWeight = "bold";

        const container = img.parentElement;
        container.style.position = "relative";
        container.appendChild(overlay);

        // Map the image element to its overlay for easy removal later
        processingMap.set(index, { imgElement: img, overlayElement: overlay });
        
        // --- 2. Send the URL to background.js for secure processing ---
        chrome.runtime.sendMessage({ 
            action: "processImage",
            imageUrl: imageUrl,
            imgIndex: index // Send index so background knows which image's result to return
        }, (response) => {
            
            const item = processingMap.get(index);
            if (!item) return;

            // Remove the 'Analyzing...' overlay
            item.overlayElement.remove();
            processingMap.delete(index);

            // --- 3. Receive prediction and display result ---
            if (response && response.success) {
                const prediction = response.prediction;
                console.log(`[Content.js] Image ${index} is predicted as: ${prediction.label} (${(prediction.score * 100).toFixed(2)}%)`);
                
                // Determine color and label
                const isFake = prediction.label.toLowerCase().includes('fake') || prediction.label.toLowerCase().includes('manipulated');
                const badgeColor = isFake ? 'red' : '#1abc9c'; // Green for Real, Red for Fake
                const badgeText = isFake ? `FAKE (${(prediction.score * 100).toFixed(0)}%)` : `REAL (${(prediction.score * 100).toFixed(0)}%)`;

                // Create a result badge
                const resultBadge = document.createElement("div");
                resultBadge.textContent = badgeText;
                resultBadge.style.position = "absolute";
                resultBadge.style.bottom = "10px";
                resultBadge.style.right = "10px";
                resultBadge.style.backgroundColor = badgeColor;
                resultBadge.style.color = "white";
                resultBadge.style.padding = "5px 10px";
                resultBadge.style.borderRadius = "5px";
                resultBadge.style.zIndex = "9999";
                resultBadge.style.fontSize = "12px";
                
                item.imgElement.parentElement.appendChild(resultBadge);
                
            } else if (response && response.error) {
                console.error(`[Content.js] Error for image ${index}:`, response.error);
                // Display error message badge
                const errorBadge = document.createElement("div");
                errorBadge.textContent = "Error: " + response.error.substring(0, 20) + "...";
                errorBadge.style.backgroundColor = 'orange';
                errorBadge.style.color = 'white';
                errorBadge.style.padding = "5px";
                errorBadge.style.borderRadius = "5px";
                errorBadge.style.position = "absolute";
                errorBadge.style.top = "10px";
                errorBadge.style.left = "10px";
                errorBadge.style.zIndex = "9999";
                item.imgElement.parentElement.appendChild(errorBadge);
            }
        });
    }
});
