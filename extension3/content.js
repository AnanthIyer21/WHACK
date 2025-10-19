// Find all potential image elements on the page. Using a more specific selector is often better for Instagram.
const postImages = document.querySelectorAll('img'); 

// Store a map to track which image is being processed.
const processingMap = new Map();

// Use a mutation observer to handle dynamically loaded content (important for scrolling feeds like Instagram)
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.querySelector) {
                    // Re-run the analysis check on new nodes (like new posts appearing on scroll)
                    checkAndAnalyzeImages(node);
                }
            });
        }
    });
});

// Start observing the main content area (e.g., the body)
observer.observe(document.body, { childList: true, subtree: true });


/**
 * Processes a set of nodes (or the entire document) to find and analyze images.
 * @param {HTMLElement|Document} rootNode The element to start searching from.
 */
function checkAndAnalyzeImages(rootNode) {
    const images = rootNode.querySelectorAll('img');

    images.forEach((img, index) => {
        const imageUrl = img.src;

        // Create a unique key for tracking across sessions/runs.
        const imageKey = imageUrl + img.width + img.height; 

        // Filter for large post images that are likely actual content
        // 🚨 수정됨: 'imageUrl.includes("scontent")' 인스타그램 전용 필터를 제거하여 모든 사이트에서 작동하도록 일반화합니다.
        if (img.width > 250 && !processingMap.has(imageKey)) {
            
            // Mark as processing immediately to prevent re-analysis
            processingMap.set(imageKey, true);
            
            // --- 1. Create Safe Wrapper and Attach Overlay (UI Feedback) ---
            
            // A. Create a safe container div to wrap the image and its siblings.
            const wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.style.display = "inline-block";
            wrapper.style.width = img.width + "px";
            wrapper.style.height = img.height + "px";
            
            // B. Replace the image element with our wrapper in the original DOM
            const originalParent = img.parentElement;
            if (!originalParent) {
                // Skip if the image somehow has no parent (shouldn't happen on Instagram)
                processingMap.delete(imageKey);
                return;
            }
            originalParent.replaceChild(wrapper, img);
            
            // C. Move the original image *into* our safe wrapper
            wrapper.appendChild(img);
            
            // D. Create and attach the "Analyzing..." overlay within the wrapper
            const overlay = document.createElement("div");
            overlay.style.position = "absolute";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.backgroundColor = "rgba(128, 128, 128, 0.5)";
            overlay.style.zIndex = "9998";
            overlay.style.display = "flex";
            overlay.style.alignItems = "center";
            overlay.style.justifyContent = "center";
            overlay.textContent = "Analyzing...";
            overlay.style.color = "white";
            overlay.style.fontWeight = "bold";

            wrapper.appendChild(overlay);

            // Map the image element to its UI elements for easy removal later
            processingMap.set(imageKey, { imgElement: img, overlayElement: overlay, wrapper: wrapper });
            
            // --- 2. Send the URL to background.js for secure processing ---
            // Use the imageKey as the index for reliable tracking
            chrome.runtime.sendMessage({ 
                action: "processImage",
                imageUrl: imageUrl,
                imgIndex: imageKey 
            }, (response) => {
                
                const item = processingMap.get(imageKey);
                if (!item) return;

                // --- 3. Clean up the overlay and Map, regardless of success/failure ---
                item.overlayElement.remove();
                
                // Note: The key remains in the map to prevent re-analysis during scroll.
                // We just update its status if needed.

                // --- 4. Receive prediction and display result ---
                if (response && response.success) {
                    const hfResult = response.result; 
                    
                    // The API returns an array, we take the first prediction object
                    const prediction = hfResult && hfResult.length > 0 ? hfResult[0] : null;

                    if (prediction) {
                        console.log(`[Content.js] Image ${imageKey} predicted as: ${prediction.label} (${(prediction.score * 100).toFixed(2)}%)`);
                        
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
                        
                        item.wrapper.appendChild(resultBadge);
                        
                    } else {
                        // Handle case where API response was successful but result array was empty/invalid
                        console.error(`[Content.js] Image ${imageKey} failed: Unexpected response structure.`);
                        processingMap.set(imageKey, 'failed'); // Mark as failed
                    }
                    
                } else if (response && response.error) {
                    console.error(`[Content.js] Error for image ${imageKey}:`, response.error);
                    
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
                    item.wrapper.appendChild(errorBadge);
                    processingMap.set(imageKey, 'failed'); // Mark as failed
                } else {
                    // This catches the 'Unchecked runtime.lastError' if it still occurs
                    console.error(`[Content.js] Image ${imageKey} failed: Unhandled response error.`);
                    processingMap.set(imageKey, 'failed'); // Mark as failed
                }
            });
        }
    });
}

// Initial analysis when the page first loads
checkAndAnalyzeImages(document);
