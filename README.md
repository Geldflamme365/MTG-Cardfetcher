# MTG Remasurium

Ein Old-School-Cardfinder für Magic: The Gathering. Suche über die
Scryfall-API, Oracle-Text, Versionshistorie und eine eigene Collection.

Ohne Konto läuft alles wie bisher rein im Browser. Mit Konto liegt die
Collection auf Cloudflare und ist auf jedem Gerät gleich.

Momentan ist er erreichbar unter mtg-remasurium.t-ackeret-inf24.workers.dev, da er fortläufig im developement ist.

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `Remasurium/` | Frontend, wird als statisches Asset ausgeliefert |
| `src/index.js` | Worker mit der API unter `/api/*` |
| `src/auth.js` | Passwort-Hashing und Sessions |
| `migrations/` | D1-Schema |

Kein Build-Schritt, kein Framework: HTML, CSS und JavaScript direkt.

## Lokal starten

```bash
npm install
npm run db:migrate:local
npm run dev
```

Danach läuft alles auf <http://127.0.0.1:8787>. Die lokale Datenbank
liegt in `.wrangler/` und ist von der echten getrennt.

## Auf Cloudflare in Betrieb nehmen

Die Datenbank ist angelegt und ihre `database_id` steht bereits in
`wrangler.jsonc`, das Schema ist angewendet. Für ein Deployment genügt:

```bash
npm run deploy
```

Wer das Projekt in einem anderen Cloudflare-Konto aufsetzt, braucht
vorher einmalig:

```bash
npx wrangler login
npm run db:create      # gibt eine neue database_id aus
                       # -> in wrangler.jsonc eintragen
npm run db:migrate     # Schema auf die neue Datenbank anwenden
```

Hängt `wrangler login` beim Zurückleiten auf `localhost:8976`, hilft
stattdessen ein API-Token aus dem Dashboard in `CLOUDFLARE_API_TOKEN`.

## API

Alle Endpunkte liegen unter `/api`. Die Session steckt in einem
HttpOnly-Cookie und wird vom Browser automatisch mitgeschickt.

| Methode | Pfad | Zweck |
| --- | --- | --- |
| POST | `/auth/register` | Konto anlegen, meldet direkt an |
| POST | `/auth/login` | Anmelden |
| POST | `/auth/logout` | Abmelden |
| GET | `/auth/me` | Aktueller User oder `null` |
| PATCH | `/profile` | Anzeigename ändern |
| GET | `/collection` | Collection lesen |
| PUT | `/collection/:cardId` | Karte anlegen oder aktualisieren |
| DELETE | `/collection/:cardId` | Karte entfernen |
| POST | `/collection/merge` | Lokale Karten übernehmen, ohne vorhandene zu überschreiben |

## Zur Sicherheit

- Passwörter werden mit PBKDF2-SHA256 gehasht, eigener Salt pro Konto.
- Die Iterationszahl steht in `src/auth.js` und liegt bei 50 000. Grund:
  Der Cloudflare-Free-Plan erlaubt 10 ms CPU pro Request, 50 000
  Iterationen brauchen rund 6.5 ms. Die OWASP-Empfehlung von 210 000
  würde das Limit sprengen. Wer auf den Paid-Plan wechselt, kann die
  Konstante hochziehen — die pro Konto gespeicherte Iterationszahl sorgt
  dafür, dass bestehende Logins weiter funktionieren.
- In der Datenbank liegt nur der SHA-256-Hash des Session-Tokens.
- Der Login hasht auch bei unbekannter E-Mail, damit die Antwortzeit
  nicht verrät, welche Konten existieren.

## Geplant

- Decks aus der eigenen Collection bauen
