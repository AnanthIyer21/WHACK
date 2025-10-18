import random

# Real headlines with explanations
real_headlines = [
    ("Oxford student arrested over chant at pro-Palestine march", "Reported by Sky News in October 2025."),
    ("UK government plans to ban disposable vapes by 2026", "Covered by BBC and The Guardian as part of health reforms."),
    ("London museum installs AI-powered exhibit that reacts to visitors’ emotions", "Featured in The Times’ tech section."),
    ("UK restaurant owner sold business to fund terror attack", "Reported by Sky News in a terrorism investigation."),
    ("John Bolton indicted on 18 counts — full indictment released", "Covered by CNN and Reuters.")
]

# AI-generated fake headlines with explanations
fake_headlines = [
    ("NASA confirms discovery of second Earth orbiting Alpha Centauri", "No such planet has been confirmed by NASA."),
    ("Taylor Swift named UN Climate Ambassador", "Taylor Swift has not held any UN ambassador role."),
    ("Elon Musk announces plan to colonize Mars by 2027 with AI-led crew", "No official Mars colonization timeline has been announced."),
    ("King Charles to host TikTok influencers at Buckingham Palace", "No such event has been reported."),
    ("Meta launches brain-to-brain messaging app in beta", "Meta has not released any neural messaging product.")
]

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
                score += 1
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