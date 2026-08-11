-- Wiederherstellungscode je Konto, damit ein vergessenes Passwort ohne
-- Mailversand zurueckgesetzt werden kann.
--
-- Gespeichert wird nur der Hash. Bestehende Konten starten mit NULL und
-- koennen sich angemeldet einen Code erzeugen.

ALTER TABLE users ADD COLUMN recovery_hash TEXT;
ALTER TABLE users ADD COLUMN recovery_salt TEXT;
