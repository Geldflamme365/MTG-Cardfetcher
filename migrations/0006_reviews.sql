-- Rückmeldungen zur Anwendung.
--
-- user_id bleibt leer, wenn jemand ohne Konto schreibt. Deshalb kein
-- Fremdschlüssel mit Löschweitergabe: Verschwindet ein Konto, soll die
-- Rückmeldung erhalten bleiben, nur ohne Zuordnung.

CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  email      TEXT,
  name       TEXT NOT NULL,
  rating     INTEGER NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
