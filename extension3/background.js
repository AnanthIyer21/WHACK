// This is the final version that removes the Hugging Face library import and uses the browser's native 'fetch' to call the API.
// This code avoids 'import' related errors in the Chrome Service Worker.

// Hugging Face Inference API endpoint
const HF_API_URL = "https://api-inference.huggingface.co/models/";
const DEEPFAKE_MODEL = "dima806/ai_vs_real_image_detection"; 

// 1. Function to retrieve the token (async)
async function getHfToken() {
    // Retrieve the token from chrome.storage.
    const tokenResult = await chrome.storage.local.get('hf_token');
    const token = tokenResult.hf_token;

    if (!token) {
        // If the token is missing, log an error message to the console and throw.
        console.error("Hugging Face API Token not found. Please set your token in the extension options.");
        // This message will appear in the inspect console.
        throw new Error("Token Missing");
    }
    return token;
}

async function fetchAndAnalyzeImage(imageUrl, hfToken) {
    const modelUrl = 'https://api-inference.huggingface.co/models/dima806/ai_vs_real_image_detection';

    // 1. Send the request to the Hugging Face API.
    //    The Hugging Face API can process the image URL received as a JSON payload.
    const response = await fetch(modelUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json' 
        },
        // **IMPORTANT:** Send the URL itself, without converting the image to BASE64.
        body: JSON.stringify({
            inputs: imageUrl
        })
    });

    if (hfResponse.status === 401) {
        throw new Error("Authentication failed (401). Check your Hugging Face API Token.");
    }

    if (!hfResponse.ok) {
        const errorText = await hfResponse.text();
        throw new Error(`API call failed: ${hfResponse.status} - ${errorText}`);
    }

    // c. Receive the JSON response
    const hfResult = await hfResponse.json();
    
    console.log(`[Background] Hugging Face Result for image ${imgIndex}:`, hfResult);

    // Return the prediction with the highest score from the image classification results.
    return hfResult[0]; 
}

// 3. Listener for messages received from the Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.action === "processImage") {
        
        async function runAnalysis() {
            const { imageUrl, imgIndex } = request;
            console.log(`[Background] Starting analysis for image ${imgIndex}: ${imageUrl}`);

            try {
                // Run the analysis
                const prediction = await fetchAndAnalyzeImage(imageUrl, imgIndex);

                // Return the result
                sendResponse({ 
                    success: true, 
                    imgIndex: imgIndex,
                    prediction: prediction 
                });

            } catch (error) {
                console.error("[Background] Error during analysis:", error);
                
                // Return the error message
                sendResponse({ 
                    success: false, 
                    imgIndex: imgIndex,
                    error: error.message || "Unknown error during AI inference."
                });
            }
        }

        runAnalysis();
        // Return true to indicate that sendResponse will be called asynchronously.
        return true; 
    }
});
