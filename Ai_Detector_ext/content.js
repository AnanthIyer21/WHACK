const IMAGE_OVERLAY_ID = 'ai-detector-overlay';
let isDetectionEnabled = true;
const OBSERVER_CONFIG = { childList: true, subtree: true };
let cache = {}; // Local in-page cache for efficiency

const observer1 = new MutationObserver(checkForNewImages);
observer1.observe(document.body, { childList: true, subtree: true });

function checkForNewImages() {
  // Use a precise selector for Instagram images. 
  // You might need to inspect the current HTML to find the exact class or tag.
  const images = document.querySelectorAll('img[srcset], article img'); 

  images.forEach(img => {
    if (!img.dataset.processed) {
      console.log('Found new image:', img.src);
      // Send the image URL back to the Service Worker for processing
      chrome.runtime.sendMessage({
        action: "PROCESS_IMAGE",
        url: img.src
      });
      img.dataset.processed = true; // Mark as processed to avoid duplicates
    }
  });
}

// 1. Core function to check and apply overlay
async function processImage(imgElement) {
    if (!imgElement || imgElement.dataset.processed) return;

    // Check local cache first
    const imageUrl = imgElement.src || imgElement.srcset;
    if (cache[imageUrl] !== undefined) {
        applyOverlay(imgElement, cache[imageUrl]);
        return;
    }

    // 2. Fetch image data as Blob/Base64 to send to Service Worker
    // Note: We use the Canvas method to reliably convert the image data.
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;
    
    if (canvas.width === 0 || canvas.height === 0) {
        // Wait for image to load if dimensions are 0
        imgElement.onload = () => processImage(imgElement);
        return;
    }

    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg'); // Base64 data URL

    // 3. Send message to the background script
    const response = await chrome.runtime.sendMessage({
        type: "CHECK_IMAGE",
        payload: {
            url: imageUrl,
            imageData: imageData
        }
    });

    if (response && response.success) {
        cache[imageUrl] = response.isFake;
        applyOverlay(imgElement, response.isFake);
    }

    // Mark as processed to prevent re-checking
    imgElement.dataset.processed = true;
}

// 4. Function to create and apply the colored overlay
function applyOverlay(imgElement, isFake) {
    const parent = imgElement.parentElement;
    
    // Check if an overlay already exists
    if (parent.querySelector(`#${IMAGE_OVERLAY_ID}`)) return;

    const overlay = document.createElement('div');
    overlay.id = IMAGE_OVERLAY_ID;
    
    // Determine color and label
    let color, label;
    if (isFake) {
        color = 'rgba(255, 0, 0, 0.3)'; // Red for FAKE
        label = 'AI-GENERATED';
    } else {
        color = 'rgba(0, 255, 0, 0.3)'; // Green for REAL
        label = 'REAL IMAGE';
    }

    // Apply styles to match the image size and position it over the image
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
        font-weight: bold;
        pointer-events: none; /* Allows clicks to pass through to Instagram */
        z-index: 1000;
    `;
    overlay.textContent = label;

    // Ensure the image container is position: relative
    parent.style.position = 'relative';
    parent.appendChild(overlay);
}

// 5. Mutation Observer Callback: Handles DOM changes (e.g., infinite scroll)
function mutationCallback(mutationsList, observer) {
    if (!isDetectionEnabled) return;

    for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    // Find all <img> elements, focusing on those likely to be content
                    const images = node.querySelectorAll('img');
                    images.forEach(img => {
                        // Instagram images often have a specific aspect ratio container
                        // or are styled as block/flex items. Filter based on size/style.
                        if (img.width >= 300 || img.height >= 300) { 
                            // Only process if it has loaded
                            if (img.complete) {
                                processImage(img);
                            } else {
                                img.addEventListener('load', () => processImage(img));
                            }
                        }
                    });
                }
            });
        }
    }
}

// 6. State synchronization and Initialization
function updateState(enabled) {
    isDetectionEnabled = enabled;
    // Clear all overlays if detection is disabled
    if (!isDetectionEnabled) {
        document.querySelectorAll(`#${IMAGE_OVERLAY_ID}`).forEach(el => el.remove());
        document.querySelectorAll('img[data-processed="true"]').forEach(el => el.removeAttribute('data-processed'));
    } else {
        // Re-process all images if re-enabled
        document.querySelectorAll('img').forEach(img => {
            if (img.width >= 300 || img.height >= 300) {
                processImage(img);
            }
        });
    }
}

// Listen for state changes from the popup/background script
chrome.storage.local.get('isDetectionEnabled', (data) => {
    updateState(!!data.isDetectionEnabled);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TOGGLE_DETECTION') {
        updateState(request.enabled);
    }
});

// Start observing the DOM for new content
const observer3 = new MutationObserver(mutationCallback);
// Start observing the <body> tag to capture all dynamic loading
observer3.observe(document.body, OBSERVER_CONFIG);

//
//
//
// 1. Function to find and apply the greyscale filter to images
function applyGreyscaleFilter() {
    // Select images that are likely part of the feed (Instagram uses <img> with various selectors)
    // The selector 'img' is broad but reliable for this test.
    const images = document.querySelectorAll('img'); 
    let imagesFound = 0;

    images.forEach(img => {
        // Prevent applying the filter multiple times
        if (!img.classList.contains('detected-by-ml-ext')) {
            // Apply the CSS filter directly to the image element
            img.style.filter = 'grayscale(100%)';
            img.classList.add('detected-by-ml-ext'); // Mark the image as processed
            imagesFound++;
        }
    });
    
    // Optional: Log results to the console for debugging
    if (imagesFound > 0) {
        console.log(`Successfully filtered ${imagesFound} new images!`);
    }
}


// 2. Use a MutationObserver to detect images loaded after the page initially loads
// Instagram loads content dynamically, so we must watch for changes.
const observer = new MutationObserver(applyGreyscaleFilter);

// Configuration for the observer: watch for new children anywhere in the body
const config = { childList: true, subtree: true };

// Start observing the target node (the body element)
observer.observe(document.body, config);

// Run the filter immediately for images that loaded before the observer started
applyGreyscaleFilter();

// 3. Listen for messages from the Service Worker (or Popup)
// This is where you would integrate the ML detection later.
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.command === "GET_IMAGE_DATA") {
            // In a real scenario, you'd collect image URLs here and send them to the background script.
            // For now, the visual filter is the check.
        }
        // Always return true if you plan to send an asynchronous response later
        // return true; 
    }
);