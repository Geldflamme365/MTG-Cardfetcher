-- Decks und ihre Karten.
--
-- Der Commander steht direkt am Deck und nicht in deck_cards: In der
-- Übersicht wird sein Bild als Deckbild gebraucht, dafür soll keine
-- zweite Abfrage nötig sein. Name und Bild liegen deshalb denormalisiert
-- daneben, genau wie bei collection_cards.

CREATE TABLE IF NOT EXISTS decks (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL,
  name              TEXT NOT NULL,
  commander_card_id TEXT,
  commander_name    TEXT,
  commander_image   TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS deck_cards (
  deck_id  TEXT NOT NULL,
  card_id  TEXT NOT NULL,
  name     TEXT NOT NULL,
  set_name TEXT,
  image    TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TEXT NOT NULL,
  PRIMARY KEY (deck_id, card_id),
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deck_cards_deck ON deck_cards(deck_id, added_at DESC);
