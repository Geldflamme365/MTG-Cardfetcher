# MTG Remasurium

A card finder for Magic: The Gathering with an old-school look. You can
search cards through the Scryfall API, read the Oracle text, look at older
prints of the same card, and keep your own collection.

Without an account, everything stays in your browser. With an account, your
collection is saved on Cloudflare, so it is the same on every device.

## Project structure

| Path | What it is |
| --- | --- |
| `Remasurium/` | The website. It is served as static files. |
| `src/index.js` | The Worker. It handles the API under `/api/*`. |
| `src/auth.js` | Password hashing and sessions. |
| `migrations/` | The database schema for D1. |

There is no build step and no framework. Just HTML, CSS and JavaScript.

## Run it on your computer

```bash
npm install
npm run db:migrate:local
npm run dev
```

Then open <http://127.0.0.1:8787>. This uses a local test database in the
`.wrangler/` folder. It is separate from the real one, so you cannot break
anything.

## Put it online

The database already exists and its id is in `wrangler.jsonc`. The schema is
applied. So you only need:

```bash
npm run deploy
```

If you set this project up in a different Cloudflare account, do this once
first:

```bash
npx wrangler login
npm run db:create      # this prints a new database id
                       # -> copy it into wrangler.jsonc
npm run db:migrate     # create the tables in the new database
```

If `wrangler login` gets stuck on `localhost:8976`, it means the login window
closed too early. You can use an API token from the Cloudflare dashboard
instead and put it in `CLOUDFLARE_API_TOKEN`.

## The API

Every route starts with `/api`. The session is stored in a cookie. The browser
sends it automatically, so you do not have to handle it yourself.

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/auth/register` | Create an account and log in right away |
| POST | `/auth/login` | Log in |
| POST | `/auth/logout` | Log out |
| GET | `/auth/me` | Show the current user, or `null` |
| PATCH | `/profile` | Change the display name |
| GET | `/collection` | Get the collection |
| PUT | `/collection/:cardId` | Add or update one card |
| DELETE | `/collection/:cardId` | Remove one card |
| POST | `/collection/merge` | Copy local cards up without overwriting |

## About security

- Passwords are hashed with PBKDF2-SHA256. Every account has its own salt.
- The number of rounds is 50,000. You find it in `src/auth.js`. The reason for
  this number: the Cloudflare free plan gives a Worker only 10 ms of CPU time
  per request, and 50,000 rounds take about 6.5 ms. The OWASP number of
  210,000 would take about 26 ms and would break the limit. Each account
  stores the number of rounds it was created with, so you can raise the
  constant later on a paid plan and old logins still work.
- The database only stores a SHA-256 hash of the session token. Someone who
  reads the database cannot take over a session with it.
- Login also hashes a password when the email does not exist. Otherwise the
  response time would tell an attacker which accounts are real.

## Not done yet

- No rate limiting on login, so passwords can be guessed many times.
- No password reset, because that needs sending emails.
- Building decks from your collection. This is the next big goal.
