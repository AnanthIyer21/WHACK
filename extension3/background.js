// Constants for the Hugging Face API
const HF_API_URL = 'https://api-inference.huggingface.co/models/';
const DEEPFAKE_MODEL = 'dima806/ai_vs_real_image_detection'; // The model for AI vs Real detection

/**
 * Retrieves the Hugging Face API token from local storage.
 * @returns {Promise<string>} The stored token.
 */
async function getHfToken() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('hf_token', (result) => {
            if (result.hf_token) {
                resolve(result.hf_token);
            } else {
                reject('Hugging Face API Token not found.');
            }
        });
    });
}

/**
 * Sends the image URL to the Hugging Face API for analysis.
 * This method delegates image downloading to the HF server (URL-based analysis),
 * thereby bypassing CORS issues.
 * @param {string} imageUrl The Instagram image URL.
 * @param {string} hfToken The Hugging Face API token.
 * @returns {Promise<Array | null>} Analysis result array or null if failed.
 */
async function fetchAndAnalyzeImage(imageUrl, hfToken) {
    const modelUrl = `${HF_API_URL}${DEEPFAKE_MODEL}`;

    try {
        // Send the request to the Hugging Face API with the image URL in the body.
        const response = await fetch(modelUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                inputs: imageUrl,
                options: {
                    wait_for_model: true
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API failed (${response.status}). Response: ${errorText.substring(0, 100)}...`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("[Background] Error during analysis:", error.message);
        throw new Error(`Analysis failed: ${error.message}`);
    }
}

/**
 * Handles messages from the content script, orchestrating the analysis process.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // We must return true to indicate that we will send the response asynchronously.
    if (request.action === "ANALYZE_IMAGE") {
        (async () => {
            try {
                const hfToken = await getHfToken();
                console.log(`[Background] Starting analysis for image ${request.imgIndex}...`);
                
                // Fetch and analyze the image via URL
                const hfResult = await fetchAndAnalyzeImage(request.imageUrl, hfToken);

                console.log(`[Background] Hugging Face Result for image ${request.imgIndex}:`, hfResult);

                // Send successful result back to content.js
                sendResponse({ 
                    success: true, 
                    result: hfResult,
                    imgIndex: request.imgIndex
                });

            } catch (error) {
                // Send error message back to content.js
                console.error(`[Background] Failed to analyze image ${request.imgIndex}:`, error.message);
                sendResponse({ 
                    success: false, 
                    error: error.message || 'Unknown analysis error.',
                    imgIndex: request.imgIndex
                });
            }
        })();
        return true; 
    }
});

// Initial setup to confirm Service Worker is active
console.log('[Background] Service Worker Initialized.');