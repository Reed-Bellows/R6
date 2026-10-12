-- Siege Hypergamy database setup.
-- Run this once in Supabase → SQL Editor → New query → Run.
-- It's safe to run again: it won't duplicate operators or reset ratings.

-- One row per operator, holding its Elo rating.
create table if not exists operators (
  id text primary key,
  rating double precision not null default 1200,
  wins integer not null default 0,
  losses integer not null default 0
);

-- Log of every vote, so ratings can be recomputed if spam gets through.
create table if not exists votes (
  id bigint generated always as identity primary key,
  winner_id text not null references operators (id),
  loser_id text not null references operators (id),
  voter_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists votes_voter_time on votes (voter_hash, created_at desc);

-- Row Level Security: visitors can read ratings, nothing else.
-- All writes go through submit_vote() below.
alter table operators enable row level security;
alter table votes enable row level security;

-- Newer Supabase projects don't expose new tables to visitors automatically.
grant select on operators to anon, authenticated;

drop policy if exists "Anyone can read ratings" on operators;
create policy "Anyone can read ratings" on operators
  for select to anon, authenticated using (true);

-- Records a vote and updates both operators' Elo ratings in one step.
create or replace function submit_vote(p_winner text, p_loser text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  k constant double precision := 32;
  w_rating double precision;
  l_rating double precision;
  change double precision;
  voter text;
begin
  if p_winner = p_loser then
    raise exception 'An operator cannot face themselves';
  end if;

  -- Identify the voter by a hash of their IP address (the raw IP isn't stored).
  voter := md5(coalesce(
    split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1),
    'unknown'
  ));

  -- Rate limit: one vote per second per voter.
  if exists (
    select 1 from votes
    where voter_hash = voter and created_at > now() - interval '1 second'
  ) then
    raise exception 'Too many votes, slow down';
  end if;

  -- Lock both rows (in a fixed order) so simultaneous votes can't overwrite each other.
  perform 1 from operators where id in (p_winner, p_loser) order by id for update;

  select rating into w_rating from operators where id = p_winner;
  select rating into l_rating from operators where id = p_loser;
  if w_rating is null or l_rating is null then
    raise exception 'Unknown operator';
  end if;

  change := k * (1 - 1 / (1 + power(10, (l_rating - w_rating) / 400)));

  update operators set rating = rating + change, wins = wins + 1 where id = p_winner;
  update operators set rating = rating - change, losses = losses + 1 where id = p_loser;

  insert into votes (winner_id, loser_id, voter_hash) values (p_winner, p_loser, voter);
end;
$$;

revoke all on function submit_vote(text, text) from public;
grant execute on function submit_vote(text, text) to anon, authenticated;

-- Operators. Keep this in sync with js/operators.js.
insert into operators (id) values
  ('sledge'),
  ('thatcher'),
  ('ash'),
  ('thermite'),
  ('twitch'),
  ('montagne'),
  ('glaz'),
  ('fuze'),
  ('blitz'),
  ('iq'),
  ('buck'),
  ('blackbeard'),
  ('capitao'),
  ('hibana'),
  ('jackal'),
  ('ying'),
  ('zofia'),
  ('dokkaebi'),
  ('lion'),
  ('finka'),
  ('maverick'),
  ('nomad'),
  ('gridlock'),
  ('nokk'),
  ('amaru'),
  ('kali'),
  ('iana'),
  ('ace'),
  ('zero'),
  ('flores'),
  ('osa'),
  ('sens'),
  ('grim'),
  ('brava'),
  ('ram'),
  ('deimos'),
  ('striker'),
  ('rauora'),
  ('smoke'),
  ('mute'),
  ('castle'),
  ('pulse'),
  ('doc'),
  ('rook'),
  ('kapkan'),
  ('tachanka'),
  ('jager'),
  ('bandit'),
  ('frost'),
  ('valkyrie'),
  ('caveira'),
  ('echo'),
  ('mira'),
  ('lesion'),
  ('ela'),
  ('vigil'),
  ('maestro'),
  ('alibi'),
  ('clash'),
  ('kaid'),
  ('mozzie'),
  ('warden'),
  ('goyo'),
  ('wamai'),
  ('oryx'),
  ('melusi'),
  ('aruni'),
  ('thunderbird'),
  ('thorn'),
  ('azami'),
  ('solis'),
  ('fenrir'),
  ('tubarao'),
  ('sentry'),
  ('skopos'),
  ('denari')
on conflict (id) do nothing;
