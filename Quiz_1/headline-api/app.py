from flask import Flask, jsonify
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Get API keys from environment
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

@app.route("/")
def home():
    return """
    <h1>🧠 Fake or Real? Headline API</h1>
    <p>Use <a href='/headlines/real'>/headlines/real</a> for real headlines.</p>
    <p>Use <a href='/headlines/fake'>/headlines/fake</a> for AI-generated fake headlines.</p>
    """

@app.route("/headlines/real")
def real_headlines():
    try:
        url = f"https://newsapi.org/v2/top-headlines?language=en&pageSize=5&apiKey={NEWS_API_KEY}"
        response = requests.get(url)
        articles = response.json().get("articles", [])
        headlines = [a["title"] for a in articles if a.get("title")]
        return jsonify({"type": "real", "headlines": headlines})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/headlines/fake")
def fake_headlines():
    try:
        prompt = "Generate 5 fake but plausible news headlines that sound real but are completely made up."
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.8
        }
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
        text = response.json()["choices"][0]["message"]["content"]
        headlines = [line.strip("- ").strip() for line in text.split("\n") if line.strip()]
        return jsonify({"type": "fake", "headlines": headlines})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5004)