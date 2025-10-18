from transformers import AutoProcessor, AutoModelForImageClassification
from PIL import Image
import torch

# Load model and processor
model_name = "ai_vs_real_image_detection_model"
processor = AutoProcessor.from_pretrained(model_name)
model = AutoModelForImageClassification.from_pretrained(model_name)

# Load image
image = Image.open("test.jpg")

# Prepare and predict
inputs = processor(images=image, return_tensors="pt")
with torch.no_grad():
    outputs = model(**inputs)
    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
    predicted_class = probs.argmax().item()

# Interpret results
labels = model.config.id2label
print(f"Prediction: {labels[predicted_class]} ({probs[0][predicted_class]*100:.2f}% confidence)")
