import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key=os.environ["HF_TOKEN"],
)

output = client.image_classification("test.jpg", model="dima806/ai_vs_real_image_detection")