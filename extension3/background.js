import { InferenceClient } from "@huggingface/hub";

// 1. Placeholder for the client instance, which will be initialized with the token later.
let client = null;

// Define the model ID for deepfake detection (example model ID)
const DEEPFAKE_MODEL = "dima806/ai_vs_real_image_detection"; 

// Function to securely retrieve the token and initialize the client
async function getInferenceClient() {
    if (client) {
        return client; // Return existing client if already initialized
    }

    // Retrieve the token from Chrome storage (this assumes the user has saved it via an options page)
    const tokenResult = await chrome.storage.local.get('hf_token');
    const HF_TOKEN = tokenResult.hf_token;

    if (!HF_TOKEN) {
        throw new Error("Hugging Face API Token not found. Please set your token in the extension options.");
    }
    
    // Initialize the client only after retrieving the token
    client = new InferenceClient({ accessToken: HF_TOKEN });
    console.log("[Background] InferenceClient initialized successfully.");
    return client;
}

// Listen for messages coming from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Check if the message is the one requesting image processing
    if (request.action === "processImage") {
        
        // Use an async function wrapper since background.js must return true immediately
        async function fetchAndAnalyzeImage() {
            const { imageUrl, imgIndex } = request;
            console.log(`[Background] Processing image ${imgIndex} from URL: ${imageUrl}`);

            try {
                // Get the client instance, which validates the token is present
                const inferenceClient = await getInferenceClient();

                // 2. Receive Image URL from content.js and perform secure fetch
                const res = await fetch(imageUrl);
                
                if (!res.ok) {
                    throw new Error(`Failed to fetch image. HTTP status: ${res.status}`);
                }
                
                // Get the image binary data (Blob)
                const imageBlob = await res.blob();
                console.log(`[Background] Successfully fetched image. Size: ${imageBlob.size} bytes`);


                // 3. Run Hugging Face API inference
                const hfResult = await inferenceClient.imageClassification({
                    model: dima806/ai_vs_real_image_detection,
                    data: imageBlob, 
                });
                
                console.log(`[Background] Hugging Face Result:`, hfResult);

                // 4. Send the result back to Content.js
                // We send the first prediction result (highest confidence)
                sendResponse({ 
                    success: true, 
                    imgIndex: imgIndex,
                    prediction: hfResult[0] 
                });

            } catch (error) {
                console.error("[Background] Error during processing or API call:", error);
                // Send an error message back
                sendResponse({ 
                    success: false, 
                    imgIndex: imgIndex,
                    error: error.message || "Unknown error during AI inference."
                });
            }
        }

        fetchAndAnalyzeImage();
        // Return true to indicate that sendResponse will be called asynchronously
        return true; 
    }
});
