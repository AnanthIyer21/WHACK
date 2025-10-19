import random
import subprocess

# --------------------------
# Configuration
# --------------------------
NUM_FAKE_HEADLINES = 5  # Number of fake headlines to generate
MAX_ATTEMPTS = 3  # Retry if Ollama doesn't return enough headlines

TOPICS = [
    "technology", "politics", "space", "sports", "pop culture",
    "health", "science", "business", "environment", "AI"
]

# --------------------------
# Real headlines
# --------------------------
REAL_HEADLINES = [
    ("Oxford student arrested over chant at pro-Palestine march", "Reported by Sky News in October 2025."),
    ("UK government plans to ban disposable vapes by 2026", "Covered by BBC and The Guardian as part of health reforms."),
    ("London museum installs AI-powered exhibit that reacts to visitors’ emotions", "Featured in The Times’ tech section."),
    ("UK restaurant owner sold business to fund terror attack", "Reported by Sky News in a terrorism investigation."),
    ("John Bolton indicted on 18 counts — full indictment released", "Covered by CNN and Reuters.")
]

# --------------------------
# Function to generate fake headlines
# --------------------------
def generate_fake_headlines(num_headlines):
    topic = random.choice(TOPICS)
    prompt = f"""
    Generate {num_headlines} realistic-sounding fake news headlines about {topic}.
    Each headline should sound like it could appear in reputable news outlets and include plausible statistics, percentages, or numbers.
    Do NOT make the headlines humorous or absurd — they should be believable.
    After each headline, provide a short explanation in parentheses why it is fake.
    Output each headline on a separate line, in the following format:
    Headline 1 (Explanation why this is fake)
    Headline 2 (Explanation why this is fake)
    ...
    """
    for attempt in range(MAX_ATTEMPTS):
        try:
            result = subprocess.run(
                ["ollama", "run", "llama3", prompt],
                capture_output=True,
                text=True,
                check=True
            )
            lines = [line.strip() for line in result.stdout.strip().split("\n") if line.strip()]
            
            fake_headlines = []
            for line in lines:
                if "(" in line and line.endswith(")"):
                    headline = line[:line.index("(")].strip()
                    explanation = line[line.index("(")+1:-1].strip()
                else:
                    headline = line
                    explanation = "This headline is fake and for training purposes."
                if headline:  # avoid empty headlines
                    fake_headlines.append((headline, explanation))

            # Only return if we got enough headlines
            if len(fake_headlines) >= num_headlines:
                return fake_headlines[:num_headlines]

        except FileNotFoundError:
            print("⚠️ Ollama is not installed. Please download from https://ollama.com/download and install it.")
            return []
        except subprocess.CalledProcessError as e:
            print("⚠️ There was an error running Ollama:", e)
            return []

    # Fallback: generate placeholder fake headlines if Ollama fails
    fallback = [
        (f"Fake headline {i+1} about {topic}", "This headline is fake and for training purposes.")
        for i in range(num_headlines)
    ]
    return fallback

# --------------------------
# Helper functions
# --------------------------
def get_headlines(difficulty, fake_headlines):
    pool = REAL_HEADLINES + fake_headlines
    if difficulty == "easy":
        return random.sample(pool, min(5, len(pool)))
    elif difficulty == "medium":
        return random.sample(pool, min(7, len(pool)))
    elif difficulty == "hard":
        return random.sample(pool, min(10, len(pool)))
    else:
        return random.sample(pool, min(5, len(pool)))

# --------------------------
# Quiz game
# --------------------------
def play_quiz():
    print("\n🧠 Welcome to 'Fake or Real?' Headline Quiz!")
    print("Choose difficulty: easy / medium / hard")
    difficulty = input("Difficulty: ").strip().lower()

    fake_headlines = generate_fake_headlines(NUM_FAKE_HEADLINES)
    if not fake_headlines:
        print("⚠️ Could not generate fake headlines. Exiting.")
        return

    headlines = get_headlines(difficulty, fake_headlines)
    score = 0
    streak = 0
    real_headline_texts = [h[0] for h in REAL_HEADLINES]

    for i, (headline, explanation) in enumerate(headlines, 1):
        print(f"\n{i}. {headline}")
        guess = input("Your guess (real/fake): ").strip().lower()
        truth = "real" if headline in real_headline_texts else "fake"

        if guess == truth:
            print("✅ Correct!")
            print(f"🧠 Explanation: {explanation}")
            score += 1
            streak += 1
            if streak > 1:
                print(f"🔥 Streak: {streak} correct in a row!")
        else:
            print(f"❌ Nope — it was {truth}.")
            print(f"🧠 Explanation: {explanation}")
            streak = 0

    print("\n🎯 Final Score:", score)
    print(f"🧩 You got {score} out of {len(headlines)} correct.")

    replay = input("Play again? (y/n): ").strip().lower()
    if replay == "y":
        play_quiz()
    else:
        print("Thanks for playing!")

# --------------------------
# Run the quiz
# --------------------------
if __name__ == "__main__":
    play_quiz()
