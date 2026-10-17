-- Ranked runs with server-verified scores (Block Journey).
-- Players are anonymous: an unguessable id kept in an http-only cookie.
-- No personal data: only an optional display name the player picks.

create table if not exists bj_players (
  id         text primary key,
  nick       text,
  created_at timestamptz not null default now()
);

create table if not exists bj_runs (
  id          text primary key,
  player_id   text not null references bj_players (id),
  seed        bigint not null,
  ip_hash     text not null,
  issued_at   timestamptz not null default now(),
  status      text not null default 'open',
  finished_at timestamptz,
  score       integer,
  lines       integer,
  moves       integer,
  best_combo  integer
);

create index if not exists bj_runs_player_issued_idx on bj_runs (player_id, issued_at);
create index if not exists bj_runs_ip_issued_idx on bj_runs (ip_hash, issued_at);
create index if not exists bj_runs_verified_score_idx on bj_runs (status, score desc);
