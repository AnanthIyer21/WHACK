// background.js - Service Worker: Acts as a proxy to fetch images (bypassing CORS) and runs the AI model.

// NOTE: TensorFlow.js is loaded via an importScripts call at the top, which
// is required for Service Workers when not using a bundler.
importScripts('tf_core.js', 'tf_layers.js');

// --- Configuration Constants ---
const MODEL_URL = 'tfjs_model/model.json';
const CACHE_KEY = 'processed_images_cache';
const TILE_SIZE = 32;

// --- TILING/INFERENCE CONFIGURATION ---
const TILE_FAKE_THRESHOLD = 0.65; 
const IMAGE_FAKE_PERCENTAGE = 0.05; 
// ----------------------------------------

// Global State
let model = null;

// 1. Model Loading
async function loadModel() {
    if (model) return model;
    try {
        console.log('[SW] Loading TensorFlow model...');
        // Load the model from the path relative to the extension root
        model = await tf.loadLayersModel(chrome.runtime.getURL(MODEL_URL));
        console.log('[SW] Model loaded successfully.');
        return model;
    } catch (error) {
        console.error('[SW] Failed to load model:', error);
        return null;
    }
}

/**
 * Converts a fetched image Blob into a TensorFlow-compatible tensor using OffscreenCanvas.
 * @param {Blob} imageBlob The raw image data blob.
 * @returns {tf.Tensor3D} The tensor ready for prediction.
 */
async function blobToTensor(imageBlob) {
    const imageBitmap = await createImageBitmap(imageBlob);
    
    const { width, height } = imageBitmap;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(imageBitmap, 0, 0);
    
    // Create tensor and normalize
    return tf.tidy(() => {
        let tensor = tf.browser.fromPixels(canvas, 3).toFloat().div(255.0);
        
        // Pad to ensure width and height are multiples of TILE_SIZE (32)
        const targetWidth = Math.ceil(width / TILE_SIZE) * TILE_SIZE;
        const targetHeight = Math.ceil(height / TILE_SIZE) * TILE_SIZE;

        if (targetWidth !== width || targetHeight !== height) {
            // Use zero padding to reach the target size
            const pad_w = targetWidth - width;
            const pad_h = targetHeight - height;
            
            tensor = tensor.pad([
                [0, pad_h], // padding for height
                [0, pad_w], // padding for width
                [0, 0]      // no padding for color channels
            ]);
        }
        return tensor;
    });
}


/**
 * Runs the tiled AI inference on the pre-loaded image tensor.
 * @param {tf.Tensor3D} imageTensor The tensor representing the image.
 * @returns {boolean} True if the image is classified as fake, false otherwise.
 */
async function runTiledInference(imageTensor) {
    if (!model) return false;

    return tf.tidy(() => {
        const [height, width] = imageTensor.shape;
        let strongFakeTiles = 0;
        
        const totalTiles = (width / TILE_SIZE) * (height / TILE_SIZE);
        if (totalTiles === 0) return false;

        for (let ty = 0; ty < height; ty += TILE_SIZE) {
            for (let tx = 0; tx < width; tx += TILE_SIZE) {
                // Slice the tile: [y_start, x_start, z_start], [y_size, x_size, z_size]
                const tileTensor = imageTensor.slice(
                    [ty, tx, 0], 
                    [TILE_SIZE, TILE_SIZE, 3]
                );
                
                // Add batch dimension: (1, 32, 32, 3)
                const tileBatch = tileTensor.expandDims(0); 

                // Prediction
                const real_prob_tensor = model.predict(tileBatch);
                const real_prob = real_prob_tensor.dataSync()[0]; 
                const fake_prob = 1.0 - real_prob;
                
                if (fake_prob >= TILE_FAKE_THRESHOLD) {
                    strongFakeTiles++;
                }
            }
        }
        
        // Decision Logic
        const fake_ratio = strongFakeTiles / totalTiles;
        console.log(`[SW] Tiles processed: ${totalTiles}. Strong FAKE Tiles: ${strongFakeTiles}. Fake Ratio: ${fake_ratio.toFixed(2)}`);
        
        return fake_ratio >= IMAGE_FAKE_PERCENTAGE;
    });
}


// 2. Main Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // --- Detection Request (New: Fetch URL and Check) ---
    if (request.type === "CHECK_IMAGE_URL") { 
        
        const { url } = request.payload; 

        // Check cache first
        chrome.storage.local.get([CACHE_KEY], async (result) => {
            const cache = result[CACHE_KEY] || {};
            
            // 1. Cache Check
            if (cache[url] !== undefined) {
                console.log(`[SW] Cache hit for ${url}`);
                sendResponse({ 
                    success: true, 
                    isFake: cache[url], 
                    cached: true 
                });
                return;
            }

            await loadModel();
            if (!model) {
                 sendResponse({ 
                    success: false, 
                    message: "AI Model failed to load." 
                });
                return;
            }

            // 2. Fetch Image Data (Service Worker acts as CORS proxy)
            let isFake = false;
            try {
                const fetchResponse = await fetch(url);
                if (!fetchResponse.ok) {
                    throw new Error(`Fetch failed: ${fetchResponse.status}`);
                }
                const imageBlob = await fetchResponse.blob();
                
                // 3. Convert Blob to Tensor
                const imageTensor = await blobToTensor(imageBlob);
                
                // 4. Run Model Inference
                isFake = await runTiledInference(imageTensor);
                
                // Dispose of the tensor to free memory
                tf.dispose(imageTensor);
                
                // 5. Update Cache
                cache[url] = isFake;
                chrome.storage.local.set({ [CACHE_KEY]: cache });

                sendResponse({ 
                    success: true, 
                    isFake: isFake,
                    cached: false 
                });

            } catch (error) {
                console.error("[SW] Fetch or Model Prediction Error:", error);
                sendResponse({ 
                    success: false, 
                    message: `Could not process image data: ${error.message}` 
                });
            }
        });
        
        // IMPORTANT: Must return true for asynchronous sendResponse
        return true; 
    } 
});