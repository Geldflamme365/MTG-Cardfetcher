# MTG Remasurium

A card finder for Magic: The Gathering with an old-school look. You can
search cards through the Scryfall API, read the Oracle text, look at older
prints of the same card, and keep your own collection.

Without an account, everything stays in your browser. With an account, your
collection is saved on Cloudflare, so it is the same on every device.

Search results come in pages of 60 cards. Scryfall hands out at most 175 per
answer, so the next batch is fetched only when you page past what is loaded —
one answer covers almost three pages. Use the buttons under the results, or
swipe sideways on a phone.

The start page has a "Random Commander" button next to "Random Card". It pulls
a random card that is allowed to lead a deck, planeswalker commanders
included, and opens it. The search page has the same thing as a suggestion
button, but there the card only drops into the result list without opening
anything.

You can try it right now at <https://remasurium.ch>. It is still in
development, so things can change.

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
| POST | `/auth/recover` | Set a new password with the recovery code |
| POST | `/auth/recovery-code` | Get a new recovery code (must be logged in) |
| GET | `/auth/me` | Show the current user, or `null` |
| PATCH | `/profile` | Change the display name |
| GET | `/collection` | Get the collection |
| PUT | `/collection/:cardId` | Add or update one card |
| DELETE | `/collection/:cardId` | Remove one card |
| POST | `/collection/merge` | Copy local cards up without overwriting |
| GET | `/decks` | List all decks with their card count |
| POST | `/decks` | Create a deck |
| GET | `/decks/:id` | One deck with all its cards |
| PATCH | `/decks/:id` | Rename a deck or set its commander |
| DELETE | `/decks/:id` | Delete a deck |
| PUT | `/decks/:id/cards` | Set several cards at once; quantity 0 takes one out |
| PUT | `/decks/:id/cards/:cardId` | Add a card or change how many copies |
| DELETE | `/decks/:id/cards/:cardId` | Take a card out |
| POST | `/decks/merge` | Copy local decks up when you log in |

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
- Failed logins are counted per account (8 tries) and per IP address (30
  tries) in a window of 15 minutes. After that the account or the address is
  blocked for 15 minutes and the API answers with 429. Blocks expire on their
  own, so nobody can lock you out of your account for good. A successful
  login clears the counter.

## Forgot your password

There is no reset email. Cloudflare cannot send mail to any address, and an
outside mail service would need a domain this project does not have.

Instead every account gets a recovery code, shown once when you sign up. To
get back in you enter your email, that code and a new password. The code is
used up in the process and you get a new one right away. While you are logged
in you can create a new code at any time, which makes the old one invalid.
Only a hash of the code is stored.

Resetting also ends all open sessions, so somebody who was already logged in
gets kicked out. The reset route has the same block as the login, so the code
cannot be guessed by trying many times.

## Decks

> **Still being built.** The deck section works, but it is the newest part of
> the project and not finished. The overview and the editor still get changes,
> and the editor in particular is due a visual pass: the panels are laid out
> for function right now, not for looks. Expect things to move around.

The Decks tab holds every deck you build. Each deck has a name, a format and
can have a commander. The commander's artwork is what you see on the deck in
the overview, so you can tell your decks apart at a glance.

Right now the only format is Commander. The others are in the list but turned
off, because the rules behind them are not written yet.

In a Commander deck you may only keep one copy of a card. Two kinds of cards
are free of that rule: basic lands, and cards that say "A deck can have any
number of cards named ...", like Relentless Rats. For those the `+` button
stays usable. The commander itself counts as one of the cards in the deck.

Hovering a deck in the overview shows a small pencil in its corner. It turns
the name into a text field, so a deck can be renamed without opening it. Enter
saves, Escape cancels, and clicking somewhere else saves as well. The name can
also be changed in the deck window at any time.

Click a deck to open the editor. It has two windows side by side: card search
on the left, the deck itself on the right. Drag the bar between them to make
one side wider, the way you would with two windows next to each other. The
width is remembered for next time. You can also move it with the arrow keys.

- **Search** takes plain names or full Scryfall syntax like `c:g t:creature
  mv<=3`. Click a result to see the card up close, then add it from there.
- The suggestion buttons above the search follow your commander. A Commander
  deck may only hold cards in the commander's colours, so every suggestion
  carries that filter, and the commander's creature type is offered as a
  tribal search.
- **Quick Add** sits in the deck window. Type a card name and it takes the best
  match, even if you spell it a bit wrong.
- Every card row has `-` and `+` for the number of copies, a star to make that
  card the commander, and `X` to take it out. Going below one copy removes the
  card.
- Click the picture of a card to open the same detail view the collection has:
  the card up close, its rules text and all its printings. The only difference
  is the button, which adds the card to the deck or takes it out instead of
  touching your collection. This works for search results and for cards
  already in the deck.
- Changing the printing there swaps the card in the deck and keeps the number
  of copies. Clicking the commander's picture goes straight to its printings,
  and the artwork in the overview changes along with it.
- A card made commander leaves the card list, the way the Commander rules put
  it apart from the rest of the deck. It still counts towards the deck size.

Decks work without an account too. They then live in your browser and move up
to your account the first time you log in.

### Import and export

Import sits in the deck overview and always makes a new deck. Export sits in
the deck window and writes out the deck you have open. Both use the same plain
card list, one card per line with the number first:

```
1 Commodore Guff
1 Sol Ring
1 Preordain
```

This is the same format Moxfield and Arena use, so lists move between them
without editing. While reading a list:

- Lines starting with `//` or `#` and empty lines are skipped.
- A set in brackets like `1 Sol Ring (LEA) 269` is ignored, only the name
  counts.
- `1x Preordain` works, and a line with no number at all counts as one.
- Names are looked up 75 at a time in one request. Anything that does not
  match exactly gets a second try with a tolerant search, so small typos still
  land. What is left over is named in the status line.
- The first card that is allowed to be a commander becomes one. That covers
  legendary creatures and cards that say they can be your commander, like the
  planeswalker Commodore Guff.
- You can give the new deck a name. Leave the field empty and it takes the
  commander's name. Either way the deck opens right after, where the name can
  be changed at any time.

Export writes the commander first, so an exported deck can be read back in
unchanged.

### Optimize lands

"Optimize lands" at the right end of the toolbar opens a window that fills the
deck up with basic lands. You say how many lands the deck should have in total,
and the basics are split along the coloured mana symbols in the deck, the
commander counted in. A deck whose symbols are 71% black and 29% green gets its
basics in the same ratio.

Lands you already play are subtracted first, so only the remainder is filled
with basics. A hybrid symbol like `{W/U}` counts half for each of its colours.
The colours offered are the commander's colour identity; a colourless deck gets
Wastes instead.

Every number can be overwritten by hand, and what stands in the fields is what
gets set. Setting a colour to zero takes those basics out of the deck.

### Rules check

Next to "Delete deck" the editor shows whether the deck is legal. Red-orange
"not legal" means something is off; click it and a window lists what. Green
"legal" means the deck passes. Checked are:

- exactly 100 cards, the commander counted among them
- one copy of each card, apart from basic lands and cards like Relentless Rats
- cards banned or not allowed in Commander
- every card inside the commander's colour identity

Cards that cause a problem get a red border in the deck, in both the list and
the stacked view, so a message in the window can be traced back to a card.

The ban list is not kept in this project. Card legality, type line and colour
identity all come from Scryfall in one request per new card, so the check costs
nothing extra. If Scryfall cannot be reached, size and copies are still checked
and the rest is skipped.
