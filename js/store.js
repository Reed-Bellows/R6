// Data layer: reads ratings and records votes, either in Supabase or
// (in demo mode) in this browser's localStorage.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";
import { OPERATORS } from "./operators.js";

const START_RATING = 1200;
const K = 32;
const DEMO_KEY = "siege-hypergamy-demo";

export const isDemo =
  SUPABASE_URL.startsWith("YOUR_") || SUPABASE_PUBLISHABLE_KEY.startsWith("YOUR_");

const client = isDemo ? null : createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Returns a Map of operator id -> { rating, wins, losses }.
export async function getRatings() {
  const ratings = new Map(
    OPERATORS.map((op) => [op.id, { rating: START_RATING, wins: 0, losses: 0 }])
  );

  if (isDemo) {
    for (const [id, stats] of Object.entries(loadDemo())) {
      if (ratings.has(id)) ratings.set(id, stats);
    }
    return ratings;
  }

  const { data, error } = await client.from("operators").select("id, rating, wins, losses");
  if (error) throw error;
  for (const row of data) {
    if (ratings.has(row.id)) {
      ratings.set(row.id, { rating: row.rating, wins: row.wins, losses: row.losses });
    }
  }
  return ratings;
}

export async function vote(winnerId, loserId) {
  if (isDemo) {
    const saved = loadDemo();
    const w = saved[winnerId] ?? { rating: START_RATING, wins: 0, losses: 0 };
    const l = saved[loserId] ?? { rating: START_RATING, wins: 0, losses: 0 };
    const expected = 1 / (1 + 10 ** ((l.rating - w.rating) / 400));
    const change = K * (1 - expected);
    saved[winnerId] = { rating: w.rating + change, wins: w.wins + 1, losses: w.losses };
    saved[loserId] = { rating: l.rating - change, wins: l.wins, losses: l.losses + 1 };
    saveDemo(saved);
    return;
  }

  const { error } = await client.rpc("submit_vote", { p_winner: winnerId, p_loser: loserId });
  if (error) throw error;
}

function loadDemo() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveDemo(data) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable (private window, etc.); the vote is simply not kept.
  }
}
