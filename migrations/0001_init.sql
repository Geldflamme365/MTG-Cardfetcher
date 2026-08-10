-- Users, Sessions und Collection fuer Remasurium.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  iterations    INTEGER NOT NULL,
  created_at    TEXT NOT NULL
);

-- Nur der SHA-256-Hash des Tokens liegt in der DB. Wer die Datenbank
-- liest, kann damit keine Session uebernehmen.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS collection_cards (
  user_id     TEXT NOT NULL,
  card_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  set_name    TEXT,
  released_at TEXT,
  image       TEXT,
  added_at    TEXT NOT NULL,
  PRIMARY KEY (user_id, card_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collection_user ON collection_cards(user_id, added_at DESC);
