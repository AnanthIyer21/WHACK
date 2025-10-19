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

topics = [
    "technology", "politics", "space", "sports", "pop culture",
    "animals", "science", "food", "fashion", "AI", "weather"
]

def generate_fake_headlines(num=5):
    """Generate fake headlines using Ollama"""
    topic = random.choice(topics)
    
    prompt = f"""
Generate {num} realistic-sounding fake news headlines about {topic}.
Each headline should sound like it could appear in real news media, but it is fabricated.
Output ONLY the headlines, one per line, without explanations or numbering.
Example format:
Scientists discover coffee that improves memory by 300%
NASA announces plan to terraform Venus by 2030
"""
    
    try:
        result = subprocess.run(
            ["ollama", "run", "llama3", prompt],
            capture_output=True,
            text=True,
            check=True,
            timeout=60
        )
        
        raw_lines = result.stdout.strip().split("\n")
        headlines = [line.strip() for line in raw_lines if line.strip()]
        
        # Filter out any lines that look like explanations or metadata
        headlines = [h for h in headlines if len(h) > 10 and not h.startswith("(")]
        
        return headlines[:num] if headlines else None
    
    except FileNotFoundError:
        print("⚠️ Ollama not installed")
        return None
    except subprocess.TimeoutExpired:
        print("⚠️ Ollama timeout")
        return None
    except Exception as e:
        print(f"⚠️ Error generating headlines: {e}")
        return None

def get_fallback_headlines():
    """Fallback headlines if Ollama fails"""
    return [
        "Scientists discover coffee bean that glows in the dark",
        "UK Parliament debates mandatory nap breaks for office workers",
        "NASA confirms moon made of recycled plastic",
        "Google launches AI that writes breakup texts",
        "World's first underwater theme park opens in Iceland"
    ]

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
    generated = generate_fake_headlines(5)
    headlines = generated if generated else get_fallback_headlines()
    return jsonify({"type": "fake", "headlines": headlines})

@app.route("/headlines/mixed")
def mixed_headlines():
    try:
        real_response = real_headlines()
        fake_response = fake_headlines()
        
        real_data = real_response.get_json()
        fake_data = fake_response.get_json()
        
        real = real_data.get("headlines", [])
        fake = fake_data.get("headlines", [])
        
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