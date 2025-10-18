const headlines = [
  {
    text: "Oxford student arrested over chant at pro-Palestine march",
    truth: "real",
    explanation: "Reported by Sky News in October 2025."
  },
  {
    text: "NASA confirms discovery of second Earth orbiting Alpha Centauri",
    truth: "fake",
    explanation: "No such planet has been confirmed by NASA."
  },
  {
    text: "Taylor Swift named UN Climate Ambassador",
    truth: "fake",
    explanation: "Taylor Swift has not held any UN ambassador role."
  },
  {
    text: "UK government plans to ban disposable vapes by 2026",
    truth: "real",
    explanation: "Covered by BBC and The Guardian as part of health reforms."
  },
  {
    text: "Meta launches brain-to-brain messaging app in beta",
    truth: "fake",
    explanation: "Meta has not released any neural messaging product."
  }
];

let current = 0;
let score = 0;

function showHeadline() {
  document.getElementById("headline").innerText = headlines[current].text;
  document.getElementById("feedback").innerText = "";
  document.getElementById("nextBtn").style.display = "none";
}

function submitGuess(guess) {
  const correct = headlines[current].truth;
  const explanation = headlines[current].explanation;
  const feedback = document.getElementById("feedback");

  if (guess === correct) {
    score++;
    feedback.innerText = `✅ Correct! ${explanation}`;
  } else {
    feedback.innerText = `❌ Incorrect. ${explanation}`;
  }

  document.getElementById("score").innerText = `Score: ${score}/${current + 1}`;
  document.getElementById("nextBtn").style.display = "inline-block";
}

function nextHeadline() {
  current++;
  if (current < headlines.length) {
    showHeadline();
  } else {
    document.getElementById("headline").innerText = "🎉 Quiz complete!";
    document.querySelector(".buttons").style.display = "none";
    document.getElementById("nextBtn").style.display = "none";
    document.getElementById("feedback").innerText = `Final Score: ${score}/${headlines.length}`;
  }
}

showHeadline();