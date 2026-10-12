// Siege Hypergamy Leaderboard page: ranks operators by Elo rating.
import { OPERATORS, imagePath, initials } from "./operators.js";
import { getRatings, isDemo } from "./store.js";

const body = document.getElementById("rankings");
const status = document.getElementById("status");
const filters = document.querySelectorAll(".filter");
let rows = [];
let activeSide = "all";

function render() {
  const visible = activeSide === "all" ? rows : rows.filter((r) => r.side === activeSide);
  body.replaceChildren(
    ...visible.map((r, i) => {
      const games = r.wins + r.losses;
      const winRate = games ? Math.round((r.wins / games) * 100) + "%" : "—";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="rank">${i + 1}</td>
        <td class="op">
          <span class="thumb" data-side="${r.side}">
            <span class="initials">${initials(r)}</span>
            <img src="${imagePath(r)}" alt="">
          </span>
          <span>${r.name}</span>
        </td>
        <td class="side-cell" data-side="${r.side}">${r.side === "attack" ? "ATK" : "DEF"}</td>
        <td class="num">${Math.round(r.rating)}</td>
        <td class="num">${r.wins}–${r.losses}</td>
        <td class="num">${winRate}</td>`;
      const img = tr.querySelector("img");
      img.addEventListener("load", () => tr.querySelector(".initials").remove());
      img.addEventListener("error", () => img.remove());
      return tr;
    })
  );
}

filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    activeSide = btn.dataset.side;
    filters.forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

async function load() {
  try {
    const ratings = await getRatings();
    rows = OPERATORS.map((op) => ({ ...op, ...ratings.get(op.id) })).sort(
      (a, b) => b.rating - a.rating
    );
    status.textContent = isDemo ? "Demo mode: showing only votes from this browser." : "";
    render();
  } catch (err) {
    console.error(err);
    status.textContent = "Couldn't load the rankings. Try refreshing.";
    status.classList.add("error");
  }
}

load();
