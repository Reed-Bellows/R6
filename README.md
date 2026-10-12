# Siege Hypergamy

A "who mogs?" voting site for Rainbow Six Siege operators. Visitors pick between two random
operators, and the **Siege Hypergamy Leaderboard** page ranks every operator by Elo rating, built from
everyone's votes.

- `index.html`: the voting page
- `hypergamy.html`: the leaderboard
- `js/operators.js`: the operator list
- `supabase/schema.sql`: database setup
- `images/`: operator portraits

## Try it locally

Browsers block JS modules opened straight from a file, so serve the folder:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Until Supabase is set up, the site runs in **demo mode** and
votes are stored only in your browser.

## Set up Supabase (shared leaderboard)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste in `supabase/schema.sql`, and click **Run**.
3. Go to **Project Settings → API keys** and copy the **Project URL** and the **publishable**
   (anon) key into `js/supabase-config.js`.
   **Never** use the secret (service_role) key in this project.

## Deploy on GitHub Pages

1. Commit and push to GitHub.
2. In the repo, go to **Settings → Pages**, set **Source** to "Deploy from a branch", and pick
   `main` and `/ (root)`.
3. The site will be live at `https://<your-username>.github.io/R6/` within a minute or two.

Also turn on **Settings → Code security → Push protection** so GitHub blocks any secret keys
from being pushed.

## Adding operators

Add the operator to `js/operators.js`, then run this in the Supabase SQL Editor:

```sql
insert into operators (id) values ('new_operator_id');
```

## Notes

- Ratings use Elo: everyone starts at 1200, and upsets move ratings more than expected wins.
- Each IP address can vote at most once per second. Every vote is logged in the `votes` table.
- Rainbow Six Siege and its operators belong to Ubisoft. This is a non-commercial fan project.
