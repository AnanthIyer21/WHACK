import HF_TOKEN from "./config.js";
import { InferenceClient } from "@huggingface/hub";

console.log("[Background] Service worker loaded");

const client = new InferenceClient({ accessToken: HF_TOKEN });
const DEEPFAKE_MODEL = "umm-maybe/AI-image-detector";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    console.log("[Background] Ping received");
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "processImage") {
    async function fetchAndAnalyzeImage() {
      const { imageUrl, base64, imgIndex } = request;
      console.log(`[Background] Received image ${imgIndex}`);

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

        const hfResult = await client.imageClassification({
          model: DEEPFAKE_MODEL,
          data: imageBlob,
        });

        console.log(`[Background] Hugging Face Result for image ${imgIndex}:`, hfResult);

        if (!hfResult || !Array.isArray(hfResult) || hfResult.length === 0) {
          throw new Error("No prediction returned from Hugging Face.");
        }

        sendResponse({
          success: true,
          imgIndex,
          prediction: hfResult[0],
        });

      } catch (error) {
        console.error(`[Background] Error for image ${imgIndex}:`, error);
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