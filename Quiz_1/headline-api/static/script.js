let headlines = [];
let current = 0;

async function loadHeadlines() {
  const res = await fetch("https://laughing-space-goggles-v6wppxrrv5x43xvxv-5010.app.github.dev/headlines/mixed");
  headlines = await res.json();
  current = 0;
  showHeadline();
}

function showHeadline() {
  document.getElementById("headline").innerText = headlines[current].text;
  document.getElementById("result").innerText = "";
}

function vote(choice) {
  const correct = headlines[current].type === choice;
  document.getElementById("result").innerText = correct ? "✅ Correct!" : "❌ Nope!";
}

function nextHeadline() {
  current = (current + 1) % headlines.length;
  showHeadline();
}

loadHeadlines();