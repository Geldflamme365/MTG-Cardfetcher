-- Zaehlt fehlgeschlagene Logins, damit Passwoerter nicht unbegrenzt
-- durchprobiert werden koennen.
--
-- scope ist 'email' oder 'ip'. Beides wird getrennt gezaehlt: Die
-- E-Mail-Sperre schuetzt ein einzelnes Konto, die IP-Sperre bremst
-- jemanden, der viele verschiedene Konten durchprobiert.

CREATE TABLE IF NOT EXISTS login_attempts (
  scope        TEXT NOT NULL,
  key          TEXT NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL,
  locked_until TEXT,
  PRIMARY KEY (scope, key)
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_window ON login_attempts(window_start);
