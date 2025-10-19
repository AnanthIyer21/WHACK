let headlines = [];
let current = 0;
let correct = 0;
let incorrect = 0;
let streak = 0;

// 🌗 Theme toggle
document.getElementById("theme-toggle").onclick = () => {
  document.body.classList.toggle("dark");
};

// 🎮 Difficulty selector logic
document.querySelectorAll(".diff-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// 🚀 Start quiz
function startQuiz() {
  const level = document.querySelector(".diff-btn.active").dataset.level;
  fetch("https://laughing-space-goggles-v6wppxrrv5x43xvxv-5010.app.github.dev/headlines/mixed")
    .then(res => res.json())
    .then(data => {
      headlines = selectDifficulty(data, level);
      current = 0;
      correct = 0;
      incorrect = 0;
      streak = 0;
      updateScore();
      document.getElementById("quiz-area").style.display = "block";
      showHeadline();
    })
    .catch(() => {
      document.getElementById("headline").innerText = "⚠️ Failed to load headlines.";
    });
}

// 🧪 Difficulty filter
function selectDifficulty(data, level) {
  const count = level === "easy" ? 5 : level === "medium" ? 7 : 10;
  return data.slice(0, count);
}

// 🧠 Show headline
function showHeadline() {
  if (current >= headlines.length) return showFinalScore();

  document.getElementById("headline").innerText = headlines[current].text;
  document.getElementById("result").innerText = "";
  document.getElementById("explanation").innerText = "";
  updateProgress();
}

// ✅ Vote logic
function vote(choice) {
  const truth = headlines[current].type;
  const explanation = headlines[current].explanation || "";

  if (choice === truth) {
    correct++;
    streak++;
    document.getElementById("result").innerText = "✅ Correct!";
  } else {
    incorrect++;
    streak = 0;
    document.getElementById("result").innerText = `❌ Nope — it was ${truth.toUpperCase()}`;
  }

  document.getElementById("explanation").innerText = explanation;
  updateScore();
}

// 🔁 Next headline
function nextHeadline() {
  current++;
  showHeadline();
}

// 📊 Update score
function updateScore() {
  document.getElementById("correct").innerText = correct;
  document.getElementById("incorrect").innerText = incorrect;
  document.getElementById("streak").innerText = streak;
}

// 📈 Progress bar
function updateProgress() {
  const percent = ((current + 1) / headlines.length) * 100;
  document.getElementById("progress-bar").style.width = `${percent}%`;
}

// 🏁 Final score screen
function showFinalScore() {
  document.getElementById("headline").innerText = "🎉 Quiz Complete!";
  document.getElementById("result").innerText = `You got ${correct} out of ${headlines.length} correct.`;
  document.getElementById("explanation").innerText = "";

  if (correct === headlines.length) launchConfetti();

  document.querySelector(".buttons").style.display = "none";
  document.querySelector(".next").style.display = "none";

  const restartBtn = document.createElement("button");
  restartBtn.innerText = "Restart Quiz";
  restartBtn.className = "next";
  restartBtn.onclick = () => location.reload();
  document.querySelector(".score").appendChild(restartBtn);
}

// 🎉 Confetti celebration
function launchConfetti() {
  const duration = 2 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}