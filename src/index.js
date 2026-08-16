import {
  PBKDF2_ITERATIONS,
  buildSessionCookie,
  clearSessionCookie,
  createPasswordRecord,
  createRecoveryRecord,
  createSessionToken,
  hashPassword,
  hashRecoveryCode,
  readSessionToken,
  sessionExpiry,
  sha256Hex,
  timingSafeEqual
} from "./auth.js";
import { checkThrottle, clearAttempts, registerFailure, throttleKeys } from "./throttle.js";

const MIN_PASSWORD_LENGTH = 8;
const MAX_COLLECTION_SIZE = 5000;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

function fail(message, status = 400) {
  return json({ error: message }, status);
}

async function readJson(request) {
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) {
    return null;
  }
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

// Wer das Feedback lesen und löschen darf. Die Prüfung läuft
// ausschliesslich hier im Worker; die Oberfläche blendet den Bereich nur
// zusätzlich aus.
const ADMIN_EMAIL = "tackeret2008@gmail.com";

function isAdmin(user) {
  return Boolean(user) && user.email === ADMIN_EMAIL;
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    isAdmin: isAdmin(row)
  };
}

function cardFromInput(input) {
  const cardId = String(input?.id || "").trim();
  const name = String(input?.name || "").trim();
  if (!cardId || !name) {
    return null;
  }
  return {
    id: cardId.slice(0, 64),
    name: name.slice(0, 300),
    set_name: input.set_name ? String(input.set_name).slice(0, 200) : null,
    released_at: input.released_at ? String(input.released_at).slice(0, 20) : null,
    image: input.image ? String(input.image).slice(0, 500) : null,
    // Wird beim Versionswechsel mitgeschickt, damit die Karte in der
    // Collection an ihrer Stelle bleibt statt nach vorne zu springen.
    added_at: input.added_at ? String(input.added_at).slice(0, 40) : null
  };
}

function cardFromRow(row) {
  return {
    id: row.card_id,
    name: row.name,
    set_name: row.set_name,
    released_at: row.released_at,
    image: row.image,
    added_at: row.added_at
  };
}

async function resolveSession(request, env) {
  const token = readSessionToken(request);
  if (!token) {
    return null;
  }

  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT u.*, s.expires_at AS session_expires
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?`
  )
    .bind(tokenHash)
    .first();

  if (!row) {
    return null;
  }

  if (new Date(row.session_expires).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
    return null;
  }

  return { user: row, tokenHash };
}

async function startSession(env, userId) {
  const token = createSessionToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = sessionExpiry();

  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  )
    .bind(tokenHash, userId, new Date().toISOString(), expiresAt.toISOString())
    .run();

  return { token, expiresAt };
}

async function handleRegister(request, env) {
  const body = await readJson(request);
  if (!body) {
    return fail("Ungültiger Request-Body.");
  }

  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const displayName = String(body.displayName || "").trim() || email.split("@")[0];

  if (!isValidEmail(email)) {
    return fail("Bitte eine gültige E-Mail-Adresse angeben.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return fail(`Das Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`);
  }
  if (displayName.length > 60) {
    return fail("Der Anzeigename darf höchstens 60 Zeichen haben.");
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return fail("Für diese E-Mail gibt es bereits ein Konto.", 409);
  }

  const record = await createPasswordRecord(password);
  const recovery = await createRecoveryRecord();
  const user = {
    id: crypto.randomUUID(),
    email,
    display_name: displayName,
    created_at: new Date().toISOString()
  };

  await env.DB.prepare(
    `INSERT INTO users
       (id, email, display_name, password_hash, password_salt, iterations, created_at,
        recovery_hash, recovery_salt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      user.id,
      user.email,
      user.display_name,
      record.hash,
      record.salt,
      record.iterations,
      user.created_at,
      recovery.hash,
      recovery.salt
    )
    .run();

  const session = await startSession(env, user.id);
  // Der Code wird genau hier einmal ausgeliefert. Danach liegt nur noch
  // sein Hash in der Datenbank.
  return json({ user: publicUser(user), recoveryCode: recovery.code }, 201, {
    "Set-Cookie": buildSessionCookie(session.token, session.expiresAt)
  });
}

async function handleLogin(request, env) {
  const body = await readJson(request);
  if (!body) {
    return fail("Ungültiger Request-Body.");
  }

  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  const keys = throttleKeys(email, request);
  const lockedFor = await checkThrottle(env, keys);
  if (lockedFor > 0) {
    const minutes = Math.ceil(lockedFor / 60);
    return json(
      { error: `Zu viele Fehlversuche. Bitte in ${minutes} Minute${minutes === 1 ? "" : "n"} erneut versuchen.` },
      429,
      { "Retry-After": String(lockedFor) }
    );
  }

  const row = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();

  // Auch ohne Treffer wird gehasht, damit die Antwortzeit nicht verraet,
  // ob es das Konto gibt.
  const salt = row?.password_salt || "unknown-account-placeholder-salt";
  const iterations = row?.iterations || PBKDF2_ITERATIONS;
  const candidate = await hashPassword(password, salt, iterations);

  if (!row || !timingSafeEqual(candidate, row.password_hash)) {
    await registerFailure(env, keys);
    return fail("E-Mail oder Passwort stimmt nicht.", 401);
  }

  await clearAttempts(env, keys);
  const session = await startSession(env, row.id);
  return json({ user: publicUser(row) }, 200, {
    "Set-Cookie": buildSessionCookie(session.token, session.expiresAt)
  });
}

// Passwort zuruecksetzen mit dem Wiederherstellungscode. Dieselbe Sperre
// wie beim Login, sonst waere der Code durchprobierbar.
async function handleRecover(request, env) {
  const body = await readJson(request);
  if (!body) {
    return fail("Ungültiger Request-Body.");
  }

  const email = normalizeEmail(body.email);
  const code = String(body.recoveryCode || "");
  const newPassword = String(body.newPassword || "");

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return fail(`Das neue Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`);
  }

  const keys = throttleKeys(email, request);
  const lockedFor = await checkThrottle(env, keys);
  if (lockedFor > 0) {
    const minutes = Math.ceil(lockedFor / 60);
    return json(
      { error: `Zu viele Fehlversuche. Bitte in ${minutes} Minute${minutes === 1 ? "" : "n"} erneut versuchen.` },
      429,
      { "Retry-After": String(lockedFor) }
    );
  }

  const row = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();

  const salt = row?.recovery_salt || "unknown-account-placeholder-salt";
  const candidate = await hashRecoveryCode(code, salt);

  if (!row || !row.recovery_hash || !timingSafeEqual(candidate, row.recovery_hash)) {
    await registerFailure(env, keys);
    return fail("E-Mail oder Wiederherstellungscode stimmt nicht.", 401);
  }

  const record = await createPasswordRecord(newPassword);
  // Der verbrauchte Code wird sofort durch einen neuen ersetzt.
  const recovery = await createRecoveryRecord();

  await env.DB.prepare(
    `UPDATE users
        SET password_hash = ?, password_salt = ?, iterations = ?,
            recovery_hash = ?, recovery_salt = ?
      WHERE id = ?`
  )
    .bind(record.hash, record.salt, record.iterations, recovery.hash, recovery.salt, row.id)
    .run();

  // Alte Sitzungen beenden: Wer das Passwort zuruecksetzt, soll auch
  // jemanden aussperren, der bereits angemeldet war.
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(row.id).run();
  await clearAttempts(env, keys);

  const session = await startSession(env, row.id);
  return json({ user: publicUser(row), recoveryCode: recovery.code }, 200, {
    "Set-Cookie": buildSessionCookie(session.token, session.expiresAt)
  });
}

// Erzeugt einen neuen Code und entwertet damit den alten.
async function handleNewRecoveryCode(env, user) {
  const recovery = await createRecoveryRecord();

  await env.DB.prepare("UPDATE users SET recovery_hash = ?, recovery_salt = ? WHERE id = ?")
    .bind(recovery.hash, recovery.salt, user.id)
    .run();

  return json({ recoveryCode: recovery.code });
}

async function handleLogout(request, env) {
  const session = await resolveSession(request, env);
  if (session) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(session.tokenHash).run();
  }
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
}

async function handleUpdateProfile(request, env, user) {
  const body = await readJson(request);
  if (!body) {
    return fail("Ungültiger Request-Body.");
  }

  const displayName = String(body.displayName || "").trim();
  if (!displayName) {
    return fail("Der Anzeigename darf nicht leer sein.");
  }
  if (displayName.length > 60) {
    return fail("Der Anzeigename darf höchstens 60 Zeichen haben.");
  }

  await env.DB.prepare("UPDATE users SET display_name = ? WHERE id = ?").bind(displayName, user.id).run();
  return json({ user: publicUser({ ...user, display_name: displayName }) });
}

async function handleGetCollection(env, user) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM collection_cards WHERE user_id = ? ORDER BY added_at DESC"
  )
    .bind(user.id)
    .all();

  return json({ cards: (results || []).map(cardFromRow) });
}

async function handlePutCard(request, env, user, cardId) {
  const body = await readJson(request);
  const card = cardFromInput({ ...body, id: cardId });
  if (!card) {
    return fail("Kartendaten unvollständig.");
  }

  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM collection_cards WHERE user_id = ?")
    .bind(user.id)
    .first();
  const exists = await env.DB.prepare(
    "SELECT 1 FROM collection_cards WHERE user_id = ? AND card_id = ?"
  )
    .bind(user.id, card.id)
    .first();

  if (!exists && (count?.n || 0) >= MAX_COLLECTION_SIZE) {
    return fail(`Die Collection ist auf ${MAX_COLLECTION_SIZE} Karten begrenzt.`, 409);
  }

  await env.DB.prepare(
    `INSERT INTO collection_cards (user_id, card_id, name, set_name, released_at, image, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, card_id) DO UPDATE SET
       name = excluded.name,
       set_name = excluded.set_name,
       released_at = excluded.released_at,
       image = excluded.image`
  )
    .bind(
      user.id,
      card.id,
      card.name,
      card.set_name,
      card.released_at,
      card.image,
      card.added_at || new Date().toISOString()
    )
    .run();

  return json({ card });
}

async function handleDeleteCard(env, user, cardId) {
  await env.DB.prepare("DELETE FROM collection_cards WHERE user_id = ? AND card_id = ?")
    .bind(user.id, cardId)
    .run();
  return json({ ok: true });
}

// Wird beim Login benutzt: was lokal im Browser lag, wandert in die
// Cloud-Collection, ohne dort vorhandene Karten zu verlieren.
async function handleMergeCollection(request, env, user) {
  const body = await readJson(request);
  const input = Array.isArray(body?.cards) ? body.cards : null;
  if (!input) {
    return fail("Erwartet wird ein Feld 'cards' mit einer Liste.");
  }

  const cards = input.map(cardFromInput).filter(Boolean).slice(0, MAX_COLLECTION_SIZE);
  const now = Date.now();

  if (cards.length) {
    const statement = env.DB.prepare(
      `INSERT INTO collection_cards (user_id, card_id, name, set_name, released_at, image, added_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, card_id) DO NOTHING`
    );

    await env.DB.batch(
      cards.map((card, index) =>
        statement.bind(
          user.id,
          card.id,
          card.name,
          card.set_name,
          card.released_at,
          card.image,
          // Absteigende Zeitmarken, damit die Reihenfolge aus dem
          // Browser erhalten bleibt. Bei identischen Werten waere die
          // Sortierung sonst zufaellig.
          card.added_at || new Date(now - index * 1000).toISOString()
        )
      )
    );
  }

  return handleGetCollection(env, user);
}

const MAX_DECKS = 200;
const MAX_DECK_CARDS = 500;
const DECK_FORMATS = ["commander"];

// Im Commander-Format ist genau ein Exemplar je Karte erlaubt. Ausnahme
// sind Standardländer und Karten mit Relentless-Text ("A deck can have
// any number of cards named ..."), beide kommen als unlimited herein.
function limitQuantity(deck, card, requested) {
  const quantity = Math.min(Math.max(Number(requested) || 1, 1), 99);
  if (deck.format === "commander" && !card.unlimited) {
    return 1;
  }
  return quantity;
}

function deckFromRow(row, cardCount = 0) {
  // Der Commander zählt als Karte des Decks mit.
  const total = cardCount + (row.commander_card_id ? 1 : 0);
  return {
    id: row.id,
    name: row.name,
    format: row.format || "commander",
    commander: row.commander_card_id
      ? {
          id: row.commander_card_id,
          name: row.commander_name,
          image: row.commander_image,
          art: row.commander_art || null
        }
      : null,
    cardCount: total,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function deckCardFromRow(row) {
  return {
    id: row.card_id,
    name: row.name,
    set_name: row.set_name,
    image: row.image,
    quantity: row.quantity,
    unlimited: Boolean(row.unlimited)
  };
}

function cleanDeckName(value) {
  return String(value || "").trim().slice(0, 80);
}

async function touchDeck(env, deckId) {
  await env.DB.prepare("UPDATE decks SET updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), deckId)
    .run();
}

async function findDeck(env, userId, deckId) {
  return env.DB.prepare("SELECT * FROM decks WHERE id = ? AND user_id = ?").bind(deckId, userId).first();
}

async function handleListDecks(env, user) {
  const { results } = await env.DB.prepare(
    `SELECT d.*, COALESCE(SUM(c.quantity), 0) AS card_count
       FROM decks d
       LEFT JOIN deck_cards c ON c.deck_id = d.id
      WHERE d.user_id = ?
      GROUP BY d.id
      ORDER BY d.updated_at DESC`
  )
    .bind(user.id)
    .all();

  // Für den Preis in der Übersicht braucht die Oberfläche die Karten-Ids.
  // Eine zweite Abfrage für alle Decks zusammen statt einer je Deck.
  const { results: karten } = await env.DB.prepare(
    `SELECT c.deck_id, c.card_id, c.quantity
       FROM deck_cards c
       JOIN decks d ON d.id = c.deck_id
      WHERE d.user_id = ?`
  )
    .bind(user.id)
    .all();

  const nachDeck = new Map();
  for (const zeile of karten || []) {
    if (!nachDeck.has(zeile.deck_id)) {
      nachDeck.set(zeile.deck_id, []);
    }
    nachDeck.get(zeile.deck_id).push({ id: zeile.card_id, quantity: zeile.quantity });
  }

  return json({
    decks: (results || []).map((row) => ({
      ...deckFromRow(row, row.card_count),
      cards: nachDeck.get(row.id) || []
    }))
  });
}

async function handleCreateDeck(request, env, user) {
  const body = await readJson(request);
  const name = cleanDeckName(body?.name) || "Neues Deck";
  const format = DECK_FORMATS.includes(body?.format) ? body.format : "commander";

  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM decks WHERE user_id = ?")
    .bind(user.id)
    .first();
  if ((count?.n || 0) >= MAX_DECKS) {
    return fail(`Mehr als ${MAX_DECKS} Decks sind nicht möglich.`, 409);
  }

  const now = new Date().toISOString();
  const deck = { id: crypto.randomUUID(), name, format, created_at: now, updated_at: now };

  await env.DB.prepare(
    "INSERT INTO decks (id, user_id, name, format, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(deck.id, user.id, deck.name, format, now, now)
    .run();

  return json({ deck: deckFromRow(deck) }, 201);
}

async function handleGetDeck(env, user, deckId) {
  const deck = await findDeck(env, user.id, deckId);
  if (!deck) {
    return fail("Deck nicht gefunden.", 404);
  }

  const { results } = await env.DB.prepare(
    "SELECT * FROM deck_cards WHERE deck_id = ? ORDER BY added_at DESC"
  )
    .bind(deckId)
    .all();

  const cards = (results || []).map(deckCardFromRow);
  const total = cards.reduce((sum, card) => sum + card.quantity, 0);

  return json({ deck: deckFromRow(deck, total), cards });
}

async function handleUpdateDeck(request, env, user, deckId) {
  const deck = await findDeck(env, user.id, deckId);
  if (!deck) {
    return fail("Deck nicht gefunden.", 404);
  }

  const body = await readJson(request);
  if (!body) {
    return fail("Ungültiger Request-Body.");
  }

  const updates = [];
  const values = [];

  if (body.name !== undefined) {
    const name = cleanDeckName(body.name);
    if (!name) {
      return fail("Der Deckname darf nicht leer sein.");
    }
    updates.push("name = ?");
    values.push(name);
  }

  // commander: null entfernt ihn, ein Objekt setzt ihn.
  if (body.commander !== undefined) {
    if (body.commander === null) {
      updates.push(
        "commander_card_id = NULL",
        "commander_name = NULL",
        "commander_image = NULL",
        "commander_art = NULL"
      );
    } else {
      const card = cardFromInput(body.commander);
      if (!card) {
        return fail("Commander-Daten unvollständig.");
      }
      updates.push(
        "commander_card_id = ?",
        "commander_name = ?",
        "commander_image = ?",
        "commander_art = ?"
      );
      values.push(card.id, card.name, card.image, body.commander.art ? String(body.commander.art).slice(0, 500) : null);
      // Der Commander gehört nicht zusätzlich in die Kartenliste.
      await env.DB.prepare("DELETE FROM deck_cards WHERE deck_id = ? AND card_id = ?")
        .bind(deckId, card.id)
        .run();
    }
  }

  if (!updates.length) {
    return fail("Nichts zu ändern.");
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString(), deckId);

  await env.DB.prepare(`UPDATE decks SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return handleGetDeck(env, user, deckId);
}

async function handleDeleteDeck(env, user, deckId) {
  const deck = await findDeck(env, user.id, deckId);
  if (!deck) {
    return fail("Deck nicht gefunden.", 404);
  }
  await env.DB.prepare("DELETE FROM deck_cards WHERE deck_id = ?").bind(deckId).run();
  await env.DB.prepare("DELETE FROM decks WHERE id = ?").bind(deckId).run();
  return json({ ok: true });
}

async function handlePutDeckCard(request, env, user, deckId, cardId) {
  const deck = await findDeck(env, user.id, deckId);
  if (!deck) {
    return fail("Deck nicht gefunden.", 404);
  }

  const body = await readJson(request);
  const card = cardFromInput({ ...body, id: cardId });
  if (!card) {
    return fail("Kartendaten unvollständig.");
  }

  const unlimited = Boolean(body?.unlimited);
  const quantity = limitQuantity(deck, { unlimited }, body?.quantity);

  const totals = await env.DB.prepare(
    "SELECT COALESCE(SUM(quantity), 0) AS n FROM deck_cards WHERE deck_id = ? AND card_id <> ?"
  )
    .bind(deckId, card.id)
    .first();

  if ((totals?.n || 0) + quantity > MAX_DECK_CARDS) {
    return fail(`Ein Deck fasst höchstens ${MAX_DECK_CARDS} Karten.`, 409);
  }

  await env.DB.prepare(
    `INSERT INTO deck_cards (deck_id, card_id, name, set_name, image, quantity, unlimited, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (deck_id, card_id) DO UPDATE SET
       name = excluded.name,
       set_name = excluded.set_name,
       image = excluded.image,
       quantity = excluded.quantity,
       unlimited = excluded.unlimited`
  )
    .bind(
      deckId,
      card.id,
      card.name,
      card.set_name,
      card.image,
      quantity,
      unlimited ? 1 : 0,
      new Date().toISOString()
    )
    .run();

  await touchDeck(env, deckId);
  return handleGetDeck(env, user, deckId);
}

// Mehrere Karten in einem Zug setzen. Das spart bei Aktionen wie
// "Länder optimieren" fünf bis sechs einzelne Anfragen, die je das ganze
// Deck gelesen und geschrieben hätten. Menge 0 heisst: raus aus dem Deck.
async function handlePutDeckCards(request, env, user, deckId) {
  const deck = await findDeck(env, user.id, deckId);
  if (!deck) {
    return fail("Deck nicht gefunden.", 404);
  }

  const body = await readJson(request);
  const input = Array.isArray(body?.cards) ? body.cards : null;
  if (!input) {
    return fail("Erwartet wird ein Feld 'cards' mit einer Liste.");
  }
  if (input.length > 200) {
    return fail("Höchstens 200 Karten auf einmal.");
  }

  const eintraege = [];
  for (const roh of input) {
    const card = cardFromInput(roh);
    if (!card) {
      return fail("Kartendaten unvollständig.");
    }
    const unlimited = Boolean(roh?.unlimited);
    const menge = Number(roh?.quantity);
    eintraege.push({
      card,
      unlimited,
      // Menge 0 muss durchkommen, limitQuantity würde daraus eine 1 machen.
      quantity: menge === 0 ? 0 : limitQuantity(deck, { unlimited }, menge)
    });
  }

  if (!eintraege.length) {
    return handleGetDeck(env, user, deckId);
  }

  // Wie viel liegt im Deck, das dieser Aufruf nicht anfasst?
  const platzhalter = eintraege.map(() => "?").join(", ");
  const rest = await env.DB.prepare(
    `SELECT COALESCE(SUM(quantity), 0) AS n FROM deck_cards
     WHERE deck_id = ? AND card_id NOT IN (${platzhalter})`
  )
    .bind(deckId, ...eintraege.map((eintrag) => eintrag.card.id))
    .first();

  const neu = eintraege.reduce((summe, eintrag) => summe + eintrag.quantity, 0);
  if ((rest?.n || 0) + neu > MAX_DECK_CARDS) {
    return fail(`Ein Deck fasst höchstens ${MAX_DECK_CARDS} Karten.`, 409);
  }

  const jetzt = new Date().toISOString();
  const anweisungen = eintraege.map((eintrag) =>
    eintrag.quantity === 0
      ? env.DB.prepare("DELETE FROM deck_cards WHERE deck_id = ? AND card_id = ?").bind(
          deckId,
          eintrag.card.id
        )
      : env.DB.prepare(
          `INSERT INTO deck_cards (deck_id, card_id, name, set_name, image, quantity, unlimited, added_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (deck_id, card_id) DO UPDATE SET
             name = excluded.name,
             set_name = excluded.set_name,
             image = excluded.image,
             quantity = excluded.quantity,
             unlimited = excluded.unlimited`
        ).bind(
          deckId,
          eintrag.card.id,
          eintrag.card.name,
          eintrag.card.set_name,
          eintrag.card.image,
          eintrag.quantity,
          eintrag.unlimited ? 1 : 0,
          jetzt
        )
  );

  // Ein Rundgang zur Datenbank statt einer je Karte.
  await env.DB.batch(anweisungen);
  await touchDeck(env, deckId);
  return handleGetDeck(env, user, deckId);
}

async function handleDeleteDeckCard(env, user, deckId, cardId) {
  const deck = await findDeck(env, user.id, deckId);
  if (!deck) {
    return fail("Deck nicht gefunden.", 404);
  }
  await env.DB.prepare("DELETE FROM deck_cards WHERE deck_id = ? AND card_id = ?")
    .bind(deckId, cardId)
    .run();
  await touchDeck(env, deckId);
  return handleGetDeck(env, user, deckId);
}

// Übernahme der lokal angelegten Decks beim Login.
async function handleMergeDecks(request, env, user) {
  const body = await readJson(request);
  const input = Array.isArray(body?.decks) ? body.decks : null;
  if (!input) {
    return fail("Erwartet wird ein Feld 'decks' mit einer Liste.");
  }

  const existing = await env.DB.prepare("SELECT COUNT(*) AS n FROM decks WHERE user_id = ?")
    .bind(user.id)
    .first();
  let budget = MAX_DECKS - (existing?.n || 0);
  const now = Date.now();

  for (const [index, raw] of input.entries()) {
    if (budget <= 0) {
      break;
    }
    budget -= 1;

    const name = cleanDeckName(raw?.name) || "Neues Deck";
    const deckId = crypto.randomUUID();
    const stamp = new Date(now - index * 1000).toISOString();
    const commander = raw?.commander ? cardFromInput(raw.commander) : null;
    const format = DECK_FORMATS.includes(raw?.format) ? raw.format : "commander";

    await env.DB.prepare(
      `INSERT INTO decks (id, user_id, name, format, commander_card_id, commander_name, commander_image, commander_art, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        deckId,
        user.id,
        name,
        format,
        commander?.id || null,
        commander?.name || null,
        commander?.image || null,
        raw?.commander?.art ? String(raw.commander.art).slice(0, 500) : null,
        stamp,
        stamp
      )
      .run();

    // cardFromInput kennt keine Menge, die muss aus den Rohdaten kommen.
    const cards = (Array.isArray(raw?.cards) ? raw.cards : [])
      .map((entry) => {
        const card = cardFromInput(entry);
        if (!card) {
          return null;
        }
        const unlimited = Boolean(entry?.unlimited);
        return { ...card, unlimited, quantity: limitQuantity({ format }, { unlimited }, entry?.quantity) };
      })
      .filter(Boolean)
      .slice(0, MAX_DECK_CARDS);

    if (cards.length) {
      const statement = env.DB.prepare(
        `INSERT INTO deck_cards (deck_id, card_id, name, set_name, image, quantity, unlimited, added_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (deck_id, card_id) DO NOTHING`
      );

      await env.DB.batch(
        cards.map((card, i) =>
          statement.bind(
            deckId,
            card.id,
            card.name,
            card.set_name,
            card.image,
            card.quantity,
            card.unlimited ? 1 : 0,
            new Date(now - i * 1000).toISOString()
          )
        )
      );
    }
  }

  return handleListDecks(env, user);
}

const MAX_REVIEW_LENGTH = 2000;

function reviewFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    rating: row.rating,
    message: row.message,
    createdAt: row.created_at
  };
}

// Feedback darf jeder abgeben, auch ohne Konto.
async function handleCreateReview(request, env, session) {
  const body = await readJson(request);
  if (!body) {
    return fail("Ungültiger Request-Body.");
  }

  const message = String(body.message || "").trim();
  if (!message) {
    return fail("Bitte schreib etwas ins Feedback.");
  }

  const rating = Math.min(Math.max(Math.round(Number(body.rating) || 0), 1), 5);
  const user = session?.user || null;
  const name = String(body.name || "").trim().slice(0, 60) || user?.display_name || "Anonym";

  const review = {
    id: crypto.randomUUID(),
    user_id: user?.id || null,
    email: user?.email || null,
    name,
    rating,
    message: message.slice(0, MAX_REVIEW_LENGTH),
    created_at: new Date().toISOString()
  };

  await env.DB.prepare(
    `INSERT INTO reviews (id, user_id, email, name, rating, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      review.id,
      review.user_id,
      review.email,
      review.name,
      review.rating,
      review.message,
      review.created_at
    )
    .run();

  return json({ ok: true }, 201);
}

async function handleListReviews(env, user) {
  if (!isAdmin(user)) {
    return fail("Nicht berechtigt.", 403);
  }

  const { results } = await env.DB.prepare(
    "SELECT * FROM reviews ORDER BY created_at DESC LIMIT 500"
  ).all();

  return json({ reviews: (results || []).map(reviewFromRow) });
}

async function handleDeleteReview(env, user, reviewId) {
  if (!isAdmin(user)) {
    return fail("Nicht berechtigt.", 403);
  }

  await env.DB.prepare("DELETE FROM reviews WHERE id = ?").bind(reviewId).run();
  return json({ ok: true });
}

async function handleApi(request, env, url) {
  if (!env.DB) {
    return fail("Die Datenbank ist nicht konfiguriert (Binding 'DB' fehlt).", 503);
  }

  const path = url.pathname.replace(/^\/api/, "");
  const method = request.method.toUpperCase();

  if (path === "/auth/register" && method === "POST") {
    return handleRegister(request, env);
  }
  if (path === "/auth/login" && method === "POST") {
    return handleLogin(request, env);
  }
  if (path === "/auth/logout" && method === "POST") {
    return handleLogout(request, env);
  }
  if (path === "/auth/recover" && method === "POST") {
    return handleRecover(request, env);
  }

  const session = await resolveSession(request, env);

  // Ohne Konto möglich, deshalb vor der Anmeldeprüfung.
  if (path === "/reviews" && method === "POST") {
    return handleCreateReview(request, env, session);
  }

  if (path === "/auth/me" && method === "GET") {
    return session ? json({ user: publicUser(session.user) }) : json({ user: null });
  }

  if (!session) {
    return fail("Nicht angemeldet.", 401);
  }
  const user = session.user;

  if (path === "/profile" && method === "PATCH") {
    return handleUpdateProfile(request, env, user);
  }
  if (path === "/auth/recovery-code" && method === "POST") {
    return handleNewRecoveryCode(env, user);
  }
  if (path === "/collection" && method === "GET") {
    return handleGetCollection(env, user);
  }
  if (path === "/collection/merge" && method === "POST") {
    return handleMergeCollection(request, env, user);
  }

  const cardMatch = path.match(/^\/collection\/([^/]+)$/);
  if (cardMatch) {
    const cardId = decodeURIComponent(cardMatch[1]);
    if (method === "PUT") {
      return handlePutCard(request, env, user, cardId);
    }
    if (method === "DELETE") {
      return handleDeleteCard(env, user, cardId);
    }
  }

  if (path === "/reviews" && method === "GET") {
    return handleListReviews(env, user);
  }

  const reviewMatch = path.match(/^\/reviews\/([^/]+)$/);
  if (reviewMatch && method === "DELETE") {
    return handleDeleteReview(env, user, decodeURIComponent(reviewMatch[1]));
  }

  if (path === "/decks" && method === "GET") {
    return handleListDecks(env, user);
  }
  if (path === "/decks" && method === "POST") {
    return handleCreateDeck(request, env, user);
  }
  if (path === "/decks/merge" && method === "POST") {
    return handleMergeDecks(request, env, user);
  }

  const deckMatch = path.match(/^\/decks\/([^/]+)$/);
  if (deckMatch) {
    const deckId = decodeURIComponent(deckMatch[1]);
    if (method === "GET") {
      return handleGetDeck(env, user, deckId);
    }
    if (method === "PATCH") {
      return handleUpdateDeck(request, env, user, deckId);
    }
    if (method === "DELETE") {
      return handleDeleteDeck(env, user, deckId);
    }
  }

  const deckCardsMatch = path.match(/^\/decks\/([^/]+)\/cards$/);
  if (deckCardsMatch && method === "PUT") {
    return handlePutDeckCards(request, env, user, decodeURIComponent(deckCardsMatch[1]));
  }

  const deckCardMatch = path.match(/^\/decks\/([^/]+)\/cards\/([^/]+)$/);
  if (deckCardMatch) {
    const deckId = decodeURIComponent(deckCardMatch[1]);
    const cardId = decodeURIComponent(deckCardMatch[2]);
    if (method === "PUT") {
      return handlePutDeckCard(request, env, user, deckId, cardId);
    }
    if (method === "DELETE") {
      return handleDeleteDeckCard(env, user, deckId, cardId);
    }
  }

  return fail("Unbekannter Endpunkt.", 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env, url);
      } catch (error) {
        return fail(`Serverfehler: ${error.message}`, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
