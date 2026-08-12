-- Format je Deck und ein eigenes Feld für das Commander-Artwork.
--
-- format bestimmt die Regeln beim Kartenzählen. Vorerst gibt es nur
-- "commander"; die Spalte existiert, damit weitere Formate später ohne
-- Schemaänderung dazukommen können.
--
-- commander_art hält den art_crop von Scryfall, also nur das Bild ohne
-- Rahmen und Text. Die Übersicht braucht genau das; das vollständige
-- Kartenbild bleibt in commander_image für die Detailanzeige.

ALTER TABLE decks ADD COLUMN format TEXT NOT NULL DEFAULT 'commander';
ALTER TABLE decks ADD COLUMN commander_art TEXT;

-- unlimited markiert Karten, von denen ein Deck beliebig viele haben
-- darf: Standardländer und Karten mit dem Relentless-Text.
ALTER TABLE deck_cards ADD COLUMN unlimited INTEGER NOT NULL DEFAULT 0;
