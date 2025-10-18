import HF_TOKEN from "./config.js";
import { InferenceClient } from "@huggingface/hub";

const client = new InferenceClient({ accessToken: HF_TOKEN });
const DEEPFAKE_MODEL = "Model-ID-for-Deepfake-Detection"; // Replace with actual model ID

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processImage") {
    async function fetchAndAnalyzeImage() {
      const { imageUrl, base64, imgIndex } = request;
      console.log(`[Background] Processing image ${imgIndex}`);

      try {
        if (!HF_TOKEN || HF_TOKEN.length < 20 || !HF_TOKEN.startsWith("hf_")) {
          throw new Error("Missing or invalid Hugging Face token.");
        }

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

        const hfResult = await client.imageClassification({
          model: DEEPFAKE_MODEL,
          data: imageBlob,
        });

        if (!hfResult || !Array.isArray(hfResult) || hfResult.length === 0) {
          throw new Error("No prediction returned from Hugging Face.");
        }

        console.log(`[Background] Hugging Face Result:`, hfResult);

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
    return true;
  }
});
