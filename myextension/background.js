import HF_TOKEN from "./config.js";
import { InferenceClient } from "@huggingface/hub";

// Initialize Hugging Face client
const client = new InferenceClient({ accessToken: HF_TOKEN });

// Replace with your actual model ID
const DEEPFAKE_MODEL = "Model-ID-for-Deepfake-Detection";

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processImage") {
    async function fetchAndAnalyzeImage() {
      const { imageUrl, base64, imgIndex } = request;
      console.log(`[Background] Processing image ${imgIndex}`);

      try {
        // Validate token format
        if (!HF_TOKEN || HF_TOKEN.length < 20 || !HF_TOKEN.startsWith("hf_")) {
          throw new Error("Missing or invalid Hugging Face token.");
        }

        // Get image blob from either base64 or blob URL
        let imageBlob;
        if (base64) {
          imageBlob = await (await fetch(base64)).blob();
        } else if (imageUrl) {
          const res = await fetch(imageUrl);
          if (!res.ok) throw new Error(`Failed to fetch image. Status: ${res.status}`);
          imageBlob = await res.blob();
        } else {
          throw new Error("No image source provided.");
        }

        console.log(`[Background] Fetched image. Size: ${imageBlob.size} bytes`);

        // Run Hugging Face inference
        const hfResult = await client.imageClassification({
          model: DEEPFAKE_MODEL,
          data: imageBlob,
        });

        // Validate response
        if (!hfResult || !Array.isArray(hfResult) || hfResult.length === 0) {
          throw new Error("No prediction returned from Hugging Face.");
        }

        console.log(`[Background] Hugging Face Result:`, hfResult);

        // Send result back
        sendResponse({
          success: true,
          imgIndex,
          prediction: hfResult[0],
        });

      } catch (error) {
        console.error(`[Background] Error:`, error);
        sendResponse({
          success: false,
          imgIndex,
          error: error.message || "Unknown error during AI inference.",
        });
      }
    }

    fetchAndAnalyzeImage();
    return true; // Keep message channel open for async response
  }
});