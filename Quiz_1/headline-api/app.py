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
        headlines = [
            {
                "text": a["title"],
                "type": "real",
                "explanation": f"Reported by {a.get('source', {}).get('name', 'Unknown')}.",
                "source": a.get("source", {}).get("name", "Unknown")
            }
            for a in articles if a.get("title")
        ]
        return jsonify({"type": "real", "headlines": headlines})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/headlines/fake")
def fake_headlines():
    raw_headlines = [
        "Scientists discover coffee bean that glows in the dark",
        "UK Parliament debates mandatory nap breaks for office workers",
        "NASA confirms moon made of recycled plastic",
        "Google launches AI that writes breakup texts",
        "World’s first underwater theme park opens in Iceland",
        "Apple unveils invisible smartwatch with gesture-only controls",
        "Netflix announces series written entirely by dolphins",
        "Mars rover finds ancient pizza crust fossil",
        "TikTok trend leads to global shortage of left socks",
        "UN declares sarcasm a universal language",
        "Time travel tourism banned after historical disruptions",
        "Global warming reversed by mass use of glitter umbrellas",
        "AI elected mayor of small town in Oregon",
        "New study shows cats understand quantum physics",
        "Olympics adds competitive napping as official sport",
        "NASA confirms Saturn’s rings are made of frozen memes",
        "AI therapist offers emotional support via haiku only",
        "Facebook introduces 'Regret' button next to 'Like'",
        "Researchers discover birds gossip about humans",
        "YouTube launches silent video challenge for introverts",
        "World’s first museum of forgotten passwords opens in Berlin",
        "Study finds 83% of dogs prefer jazz over pop",
        "Scientists unveil plant that grows selfies instead of fruit",
        "New app translates baby cries into Shakespearean sonnets",
        "AI-generated novels outsell human authors in 2025",
        "New dating app matches users by snack preferences",
        "Researchers teach dolphins to code in Python",
        "UN votes to rename Earth 'Planet Vibe'",
        "Study shows pigeons outperform humans in chess",
        "Scientists confirm clouds have regional accents",
        "New law requires all emails to end with a compliment",
        "Mars colony elects first robot president",
        "Study finds humans blink in Morse code",
        "New wearable translates thoughts into interpretive dance",
        "AI predicts next big tech trend: edible smartphones",
        "New Olympic sport: synchronized scrolling",
        "Study finds squirrels have complex banking systems",
        "AI chatbot wins national poetry slam",
        "New app lets users swap dreams in real time"
    ]

    # Randomly select 5–10 headlines each time to simulate API freshness
    selected = random.sample(raw_headlines, k=random.randint(5, 10))

    headlines = [
        {
            "text": h,
            "type": "fake",
            "explanation": "🧠 This headline mimics real patterns but contains fabricated claims.",
            "source": "Generated manually"
        }
        for h in selected
    ]

    return jsonify({"type": "fake", "headlines": headlines})

@app.route("/headlines/mixed")
def mixed_headlines():
    try:
        real_response = requests.get("http://localhost:5010/headlines/real")
        fake_response = requests.get("http://localhost:5010/headlines/fake")

        real = real_response.json().get("headlines", [])
        fake = fake_response.json().get("headlines", [])

        combined = real + fake
        random.shuffle(combined)
        return jsonify(combined)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/quiz")
def quiz():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5010)