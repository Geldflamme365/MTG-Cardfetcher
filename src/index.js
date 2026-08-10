import {
  PBKDF2_ITERATIONS,
  buildSessionCookie,
  clearSessionCookie,
  createPasswordRecord,
  createSessionToken,
  hashPassword,
  readSessionToken,
  sessionExpiry,
  sha256Hex,
  timingSafeEqual
} from "./auth.js";

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

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at
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
    image: input.image ? String(input.image).slice(0, 500) : null
  };
}

function cardFromRow(row) {
  return {
    id: row.card_id,
    name: row.name,
    set_name: row.set_name,
    released_at: row.released_at,
    image: row.image
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
  const user = {
    id: crypto.randomUUID(),
    email,
    display_name: displayName,
    created_at: new Date().toISOString()
  };

  await env.DB.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, password_salt, iterations, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(user.id, user.email, user.display_name, record.hash, record.salt, record.iterations, user.created_at)
    .run();

  const session = await startSession(env, user.id);
  return json({ user: publicUser(user) }, 201, {
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

  const row = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();

  // Auch ohne Treffer wird gehasht, damit die Antwortzeit nicht verraet,
  // ob es das Konto gibt.
  const salt = row?.password_salt || "unknown-account-placeholder-salt";
  const iterations = row?.iterations || PBKDF2_ITERATIONS;
  const candidate = await hashPassword(password, salt, iterations);

  if (!row || !timingSafeEqual(candidate, row.password_hash)) {
    return fail("E-Mail oder Passwort stimmt nicht.", 401);
  }

  const session = await startSession(env, row.id);
  return json({ user: publicUser(row) }, 200, {
    "Set-Cookie": buildSessionCookie(session.token, session.expiresAt)
  });
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
    .bind(user.id, card.id, card.name, card.set_name, card.released_at, card.image, new Date().toISOString())
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
  const now = new Date().toISOString();

  if (cards.length) {
    const statement = env.DB.prepare(
      `INSERT INTO collection_cards (user_id, card_id, name, set_name, released_at, image, added_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, card_id) DO NOTHING`
    );

    await env.DB.batch(
      cards.map((card) =>
        statement.bind(user.id, card.id, card.name, card.set_name, card.released_at, card.image, now)
      )
    );
  }

  return handleGetCollection(env, user);
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

  const session = await resolveSession(request, env);

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
