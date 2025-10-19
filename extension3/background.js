// Hugging Face API Inference Endpoint Configuration
const HF_API_URL = 'https://api-inference.huggingface.co/models/';
const DEEPFAKE_MODEL = 'prithivMLmods/Deep-Fake-Detector-v2-Model';

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
                reject(new Error("Hugging Face API Token not found. Please set it in the extension options."));
            }
        });
    });
}

/**
 * Analyzes an image URL using the Hugging Face deepfake detection model.
 * It sends the image URL to the API as a JSON payload, letting the HF server handle the fetching.
 * @param {string} imageUrl The URL of the image to analyze.
 * @returns {Promise<Array<Object>>} The prediction results from the API.
 */
async function fetchAndAnalyzeImage(imageUrl) {
    let hfToken;
    try {
        hfToken = await getHfToken();
    } catch (error) {
        throw new Error(error.message);
    }

    const modelUrl = `${HF_API_URL}${DEEPFAKE_MODEL}`;

    // 1. Send the image URL to Hugging Face API as a JSON payload
    const response = await fetch(modelUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json'
        },
        // IMPORTANT: Sending the URL directly as the input
        body: JSON.stringify({
            inputs: imageUrl
        })
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(`Authentication failed (401). Check your Hugging Face API Token.`);
        }
        // Attempt to read error message from API response body
        let errorDetails = `HTTP status: ${response.status}`;
        try {
            const errorJson = await response.json();
            if (errorJson && errorJson.error) {
                errorDetails = errorJson.error;
            }
        } catch (e) {
            // Ignore JSON parsing errors if response body is not JSON
        }
        throw new Error(`API analysis failed: ${errorDetails}`);
    }

    // 2. Parse the JSON response
    const result = await response.json();

    // 3. Return the result array
    return result;
}

// ------------------------------------------------------------------
// Main Message Listener for Communication with content.js
// ------------------------------------------------------------------

/**
 * Listener for messages from content scripts (content.js).
 * Since API calls are asynchronous, we MUST return true to keep the message port open.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Handle Ping check (for service worker survival check)
    if (request.action === "ping") {
        console.log("[Background] Ping received");
        sendResponse({ success: true });
        return true; // Keep port open until response is sent (though unnecessary for sync response)
    }

    // 2. Handle Image Analysis Request
    if (request.action === "processImage") {
        const { imageUrl, imgIndex } = request;
        console.log(`[Background] Processing image ${imgIndex} from URL: ${imageUrl}`);

        // Async function to handle the analysis and response
        (async () => {
            try {
                const hfResult = await fetchAndAnalyzeImage(imageUrl);
                console.log(`[Background] Analysis successful for image ${imgIndex}.`);

                // Check for valid API response structure (should be an array of predictions)
                if (!Array.isArray(hfResult) || hfResult.length === 0) {
                    throw new Error("Invalid or empty prediction results from the API.");
                }

                // Send successful response back to content.js
                sendResponse({
                    success: true,
                    imgIndex: imgIndex,
                    result: hfResult
                });

            } catch (error) {
                // Handle all errors (Token, Fetch, API failure)
                console.error(`[Background] Error analyzing image ${imgIndex}:`, error.message);
                
                // Send error response back to content.js
                sendResponse({
                    success: false,
                    imgIndex: imgIndex,
                    error: error.message
                });
            }
        })();

        // IMPORTANT: Return true to indicate that we will send an asynchronous response.
        // This keeps the message port open and prevents the "runtime.lastError" message.
        return true; 
    }
});