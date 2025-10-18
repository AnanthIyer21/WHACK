from flask import Flask, jsonify
import requests
import random
import os

app = Flask(__name__)

# Replace with your actual News API key
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# Replace with your actual OpenAI key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def fetch_real_headlines():
    url = f"https://newsapi.org/v2/top-headlines?country=gb&pageSize=5&apiKey={NEWS_API_KEY}"
    response = requests.get(url)
    articles = response.json().get("articles", [])
    headlines = [a["title"] for a in articles if a.get("title")]
    return headlines

def generate_fake_headlines():
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
    return [line.strip("- ").strip() for line in text.split("\n") if line.strip()]

@app.route("/headlines/real")
def real_headlines():
    try:
        headlines = fetch_real_headlines()
        return jsonify({"type": "real", "headlines": headlines})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/headlines/fake")
def fake_headlines():
    try:
        headlines = generate_fake_headlines()
        return jsonify({"type": "fake", "headlines": headlines})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)