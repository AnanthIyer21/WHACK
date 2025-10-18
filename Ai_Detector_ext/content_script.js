// content_script.js - Finds images on the page, fetches their data, and sends the raw data to the Service Worker for AI detection.

const GREYSCALE_CLASS = 'detected-by-ml-ext';

/**
 * Converts a Blob (like from an image fetch) into a Base64 string.
 * @param {Blob} blob The image data blob.
 * @returns {Promise<string>} Base64 data string (e.g., "data:image/png;base64,...").
 */
function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

// 1. Core Image Processing Loop
async function processImages() {
    // Select images from Google Images.
    const images = document.querySelectorAll('img[data-srcset], img[data-src], img'); 

    for (const img of images) {
        const imgUrl = img.src || img.dataset.src || img.dataset.srcset;

        // Skip already processed images and images without a valid source (minimum size limit removed)
        if (img.classList.contains(GREYSCALE_CLASS) || !imgUrl || imgUrl.startsWith('data:')) {
            continue; 
        }
        
        // Ensure image is fully loaded before proceeding
        if (!img.complete) {
            continue; 
        }
        
        // Get the image's bounding box relative to the viewport
        const rect = img.getBoundingClientRect();

        // Check if the image is currently visible on screen
        if (rect.width <= 0 || rect.height <= 0 || rect.bottom <= 0 || rect.top >= window.innerHeight) {
            continue;
        }

        // Apply visual cue immediately
        img.style.filter = 'grayscale(100%)';
        img.classList.add(GREYSCALE_CLASS);

        try {
            // Fetch the image data directly
            const response = await fetch(imgUrl);
            if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
            
            const imageBlob = await response.blob();
            const base64Data = await blobToBase64(imageBlob);
            
            // 2. Send the image data to the Service Worker
            chrome.runtime.sendMessage({
                type: "CHECK_IMAGE_DATA",
                payload: {
                    url: imgUrl, 
                    imageData: base64Data
                }
            }, (response) => {
                if (response && response.success) {
                    console.log(`✅ [CS] Processed image result for: ${imgUrl}. Fake: ${response.isFake}`);
                    
                    // Final Visual Feedback based on model result
                    img.style.filter = 'none'; // Remove greyscale
                    if (response.isFake) {
                        img.style.border = '4px solid red';
                    } else {
                        img.style.border = '4px solid green';
                    }
                    
                } else if (chrome.runtime.lastError) {
                    console.error("[CS] Error communicating with Service Worker:", chrome.runtime.lastError.message);
                    img.style.filter = 'none';
                }
            });

        } catch (error) {
            console.error(`[CS] Failed to fetch or process image ${imgUrl}:`, error);
            // If fetching fails (e.g., CORS blocked), remove the greyscale filter
            img.style.filter = 'none'; 
        }
    }
}

// 3. Set up the MutationObserver to handle dynamic content loading
const observer = new MutationObserver(processImages);
// Observe changes to the document body, including subtrees and new elements added
observer.observe(document.body, { childList: true, subtree: true });

// Initial run for images already loaded
processImages();
