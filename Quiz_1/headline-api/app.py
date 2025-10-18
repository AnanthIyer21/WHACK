from flask import Flask, jsonify, render_template
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS
import random

load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

@app.route("/")
def home():
    return """
    <h1>🧠 Fake or Real? Headline API</h1>
    <p>Use <a href='/headlines/real'>/headlines/real</a> for real headlines.</p>
    <p>Use <a href='/headlines/fake'>/headlines/fake</a> for AI-generated fake headlines.</p>
    <p>Use <a href='/quiz'>/quiz</a> to play the quiz.</p>
    """

@app.route("/headlines/real")
def real_headlines():
    try:
        url = f"https://newsapi.org/v2/everything?q=technology&language=en&sortBy=publishedAt&pageSize=5&apiKey={NEWS_API_KEY}"
        response = requests.get(url)
        articles = response.json().get("articles", [])
        headlines = [a["title"] for a in articles if a.get("title")]
        return jsonify({"type": "real", "headlines": headlines})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/headlines/fake")
def fake_headlines():
    headlines = [
        "Scientists discover coffee bean that glows in the dark",
        "UK Parliament debates mandatory nap breaks for office workers",
        "NASA confirms moon made of recycled plastic",
        "Google launches AI that writes breakup texts",
        "World’s first underwater theme park opens in Iceland"
    ]
    return jsonify({"type": "fake", "headlines": headlines})

@app.route("/headlines/mixed")
def mixed_headlines():
    try:
        real = real_headlines().get_json().get("headlines", [])
        fake = fake_headlines().get_json().get("headlines", [])
        combined = [{"text": h, "type": "real"} for h in real] + [{"text": h, "type": "fake"} for h in fake]
        random.shuffle(combined)
        return jsonify(combined)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/quiz")
def quiz():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5010)