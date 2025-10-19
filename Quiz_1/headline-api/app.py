from flask import Flask, jsonify, render_template
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS
import random
import subprocess

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
    num_headlines = 5
    topics = ["technology", "politics", "space", "sports", "pop culture", "animals", "science", "food", "fashion", "AI", "weather"]
    topic = random.choice(topics)
    prompt = f"""
    Generate {num_headlines} realistic-sounding fake news headlines about {topic}.
    Each headline should sound like it could appear in real news media, but it is fabricated.
    After each headline, provide a short explanation in parentheses why it is fake.
    Output each headline on a separate line, in the following format:
    Headline 1 (Explanation why this is fake)
    Headline 2 (Explanation why this is fake)
    """

    try:
        result = subprocess.run(
            ["ollama", "run", "llama3", prompt],
            capture_output=True,
            text=True,
            check=True
        )
        raw_lines = result.stdout.strip().split("\n")

        headlines = []
        for line in raw_lines:
            if "(" in line and line.endswith(")"):
                headline = line[:line.index("(")].strip()
                explanation = line[line.index("(")+1:-1].strip()
                headlines.append((headline, explanation))
    except FileNotFoundError:
        print("Ollama is not installed. Please download from https://ollama.com/download and install it.")
    except subprocess.CalledProcessError as e:
        print("there was an error running ollama:", e)
    
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