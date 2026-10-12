// Matchup page: shows two operators, records which one mogs.
import { OPERATORS, imagePath, initials } from "./operators.js";
import { vote, isDemo } from "./store.js";

const RECENT_LIMIT = 15;
const recentPairs = [];

const cards = [document.getElementById("left"), document.getElementById("right")];
const status = document.getElementById("status");
let current = [];

function pairKey(a, b) {
  return [a.id, b.id].sort().join("|");
}

function randomOp() {
  return OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
}

// Pick two different operators, avoiding pairs shown recently.
function pickPair() {
  for (let tries = 0; tries < 50; tries++) {
    const a = randomOp();
    const b = randomOp();
    if (a.id !== b.id && !recentPairs.includes(pairKey(a, b))) return [a, b];
  }
  const a = randomOp();
  let b = randomOp();
  while (b.id === a.id) b = randomOp();
  return [a, b];
}

function renderCard(card, op) {
  card.classList.remove("no-img");
  card.dataset.side = op.side;
  card.querySelector(".initials").textContent = initials(op);
  card.querySelector(".name").textContent = op.name;
  card.querySelector(".side").textContent = op.side === "attack" ? "Attacker" : "Defender";
  const img = card.querySelector("img");
  img.alt = op.name;
  img.src = imagePath(op);
}

function nextMatchup() {
  current = pickPair();
  recentPairs.push(pairKey(...current));
  if (recentPairs.length > RECENT_LIMIT) recentPairs.shift();
  cards.forEach((card, i) => renderCard(card, current[i]));
}

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function choose(index) {
  const winner = current[index];
  const loser = current[1 - index];
  // Move on right away; the vote is saved in the background.
  nextMatchup();
  vote(winner.id, loser.id).catch((err) => {
    console.error(err);
    showStatus("That vote didn't go through. Slow down a little and try again.", true);
  });
}

cards.forEach((card, i) => {
  card.addEventListener("click", () => choose(i));
  card.querySelector("img").addEventListener("error", () => card.classList.add("no-img"));
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") choose(0);
  if (e.key === "ArrowRight") choose(1);
});

document.getElementById("skip").addEventListener("click", nextMatchup);

if (isDemo) {
  showStatus("Demo mode: votes are saved only in this browser until Supabase is set up.");
}

nextMatchup();
