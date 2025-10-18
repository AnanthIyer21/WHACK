import random
import subprocess

num_headlines = 5 #change this to however many you want

topics = [
    "technology", "politics", "space", "sports", "pop culture",
    "animals", "science", "food", "fashion", "AI", "weather"
]

topic = random.choice(topics)

prompt = f"""
Generate {num_headlines} realistic-sounding fake news headlines about {topic}.
Each headline should sound like it could appear in real news media, but it is fabricated.
After each headline, provide a short explanation in parentheses why it is fake.
Output each headline on a separate line, in the following format:
Headline 1 (Explanation why this is fake)
Headline 2 (Explanation why this is fake)
...
"""


try:
    result = subprocess.run(
        ["ollama", "run", "llama3", prompt],
        capture_output=True,
        text=True,
        check=True
    )

    #split output into individual headlines
    raw_lines = result.stdout.strip().split("\n")

    fake_headlines = []
    for line in raw_lines:
        if "(" in line and line.endswith(")"):
            headline = line[:line.index("(")].strip()
            explanation = line[line.index("(")+1:-1].strip()
            fake_headlines.append((headline, explanation))


    print("\nGenerated Realistic-Looking Fake Headlines:\n")
    for idx, (headline, explanation) in enumerate(fake_headlines, 1):
        print(f"{idx}. {headline} -> {explanation}")

except FileNotFoundError:
    print("⚠️ Ollama is not installed. Please download from https://ollama.com/download and install it.")
except subprocess.CalledProcessError as e:
    print("⚠️ There was an error running Ollama:", e)



# Real headlines with explanations
real_headlines = [
    ("Oxford student arrested over chant at pro-Palestine march", "Reported by Sky News in October 2025."),
    ("UK government plans to ban disposable vapes by 2026", "Covered by BBC and The Guardian as part of health reforms."),
    ("London museum installs AI-powered exhibit that reacts to visitors’ emotions", "Featured in The Times’ tech section."),
    ("UK restaurant owner sold business to fund terror attack", "Reported by Sky News in a terrorism investigation."),
    ("John Bolton indicted on 18 counts — full indictment released", "Covered by CNN and Reuters.")
]

#AI-generated fake headlines with explanations


def get_headlines(difficulty):
    pool = real_headlines + fake_headlines
    if difficulty == "easy":
        return random.sample(pool, 5)
    elif difficulty == "medium":
        return random.sample(pool, 7)
    elif difficulty == "hard":
        return random.sample(pool, 10)
    else:
        return random.sample(pool, 5)

def play_quiz():
    print("\n🧠 Welcome to 'Fake or Real?' Headline Quiz!")
    print("Choose difficulty: easy / medium / hard")
    difficulty = input("Difficulty: ").strip().lower()

    headlines = get_headlines(difficulty)
    score = 0
    streak = 0

    for i, (headline, explanation) in enumerate(headlines, 1):
        print(f"\n{i}. {headline}")
        guess = input("Your guess (real/fake): ").strip().lower()

        truth = "real" if (headline, explanation) in real_headlines else "fake"

        if guess == truth:
            print("✅ Correct!")
            print(f"🧠 Explanation: {explanation}")
            score += 1
            streak += 1
            if streak > 1:
                print(f"🔥 Streak bonus! {streak} correct in a row.")
                
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

if __name__ == "__main__":
    play_quiz()

    