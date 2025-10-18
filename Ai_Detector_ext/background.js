// NOTE: TensorFlow.js is loaded via an importScripts call at the top, which
// is required for Service Workers when not using a bundler.
// Since you cannot use a CDN in MV3, you must download the
// tf.min.js and tf-layers.min.js files and place them in your extension root.

// IMPORTANT: For simplicity and to avoid third-party bundling, we will use
// the MINIMAL version of TF.js for the service worker.
// Download the latest versions of: 
// 1. https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.x.x/dist/tf.min.js
// 2. https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-layers@4.x.x/dist/tf-layers.min.js
// Place them in the root of your extension folder and rename them to
// 'tf_core.js' and 'tf_layers.js' respectively.

importScripts('tf_core.js', 'tf_layers.js');

const MODEL_URL = 'tfjs_model/model.json';
let model = null;
const CACHE_KEY = 'processed_images_cache';
const TILE_SIZE = 32;

// --- TILING/INFERENCE CONFIGURATION (MATCHES YOUR LAST PYTHON SCRIPT) ---
const TILE_FAKE_THRESHOLD = 0.65; 
const IMAGE_FAKE_PERCENTAGE = 0.05; 
// ------------------------------------------------------------------------

// 1. Model Loading Function
async function loadModel() {
    if (model) {
        return model;
    }
    console.log("Loading AI detection model...");
    // Use tf.loadLayersModel to load the model converted from Keras
    model = await tf.loadLayersModel(chrome.runtime.getURL(MODEL_URL));
    console.log("Model loaded successfully.");
    return model;
}

// 2. The core Tiling and Prediction logic
async function checkImageAI(imageDataUrl) {
    await loadModel();
    if (!model) return false;

    // --- FIX IS HERE: Use createImageBitmap with the Data URL ---
    // This allows the Service Worker to process the image data directly
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    
    // createImageBitmap is supported in Service Workers and is efficient
    const imgBitmap = await createImageBitmap(blob);
    // -----------------------------------------------------------

    const { width, height } = imgBitmap;
    
    // Create an OffscreenCanvas to hold the image data
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw the image bitmap onto the canvas
    ctx.drawImage(imgBitmap, 0, 0); 
    
    // ... (rest of your tiling logic remains the same) ...

    const tiles = [];
    let strongFakeTiles = 0;

    const pad_width = Math.ceil(width / TILE_SIZE) * TILE_SIZE;
    // ... (rest of the tiling loop and logic remains the same) ...
}

// 3. Message Listener from Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Only process requests when detection is enabled
    if (request.type === "CHECK_IMAGE") {
        
        // Check local storage for the cached result
        chrome.storage.local.get([CACHE_KEY], async (result) => {
            const cache = result[CACHE_KEY] || {};
            const { url, imageData } = request.payload;

            // 1. Check Cache
            if (cache[url] !== undefined) {
                sendResponse({ 
                    success: true, 
                    isFake: cache[url], 
                    cached: true 
                });
                return;
            }

            // 2. Run Model Inference
            try {
                const isFake = await checkImageAI(imageData);
                
                // 3. Update Cache
                cache[url] = isFake;
                chrome.storage.local.set({ [CACHE_KEY]: cache });

                sendResponse({ 
                    success: true, 
                    isFake: isFake,
                    cached: false 
                });
            } catch (error) {
                console.error("Model Prediction Error:", error);
                sendResponse({ 
                    success: false, 
                    message: error.message 
                });
            }
        });
        
        // MUST return true to indicate you will call sendResponse asynchronously
        return true; 
    }
});

// 4. State Listener (for the popup)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_STATE') {
        chrome.storage.local.get('isDetectionEnabled', (data) => {
            sendResponse({ isDetectionEnabled: !!data.isDetectionEnabled });
        });
        return true; 
    }
});