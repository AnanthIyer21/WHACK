import { InferenceClient } from "@huggingface/hub";

// 1. Store API Token securely (only visible here)
// IMPORTANT: Replace this placeholder with your actual Hugging Face Access Token.
const HF_TOKEN = "YOUR_SECURE_HUGGING_FACE_TOKEN_HERE"; 
const client = new InferenceClient({ accessToken: HF_TOKEN });

// Define the model ID for deepfake detection (example model ID)
const DEEPFAKE_MODEL = "Model-ID-for-Deepfake-Detection"; 

// Listen for messages coming from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Check if the message is the one requesting image processing
    if (request.action === "processImage") {
        
        // Use an async function wrapper since background.js must return true immediately
        async function fetchAndAnalyzeImage() {
            const { imageUrl, imgIndex } = request;
            console.log(`[Background] Processing image ${imgIndex} from URL: ${imageUrl}`);

            try {
                // 2. Receive Image URL from content.js and perform secure fetch
                // This works because background.js is allowed to bypass CORS restrictions.
                const res = await fetch(imageUrl);
                
                if (!res.ok) {
                    throw new Error(`Failed to fetch image. HTTP status: ${res.status}`);
                }
                
                // Get the image binary data (Blob)
                const imageBlob = await res.blob();
                console.log(`[Background] Successfully fetched image. Size: ${imageBlob.size} bytes`);


                // 3. Run Hugging Face API inference
                // InferenceClient automatically handles Blob data.
                const hfResult = await client.imageClassification({
                    model: DEEPFAKE_MODEL,
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
