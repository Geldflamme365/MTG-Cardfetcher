// Bremse fuer fehlgeschlagene Logins.
//
// Gezaehlt wird getrennt nach Konto und nach Herkunfts-IP. Wer ein
// einzelnes Konto angreift, laeuft in die Kontosperre; wer viele Konten
// durchprobiert, in die IP-Sperre. Beide Sperren sind zeitlich begrenzt,
// es gibt also keinen Weg, ein fremdes Konto dauerhaft auszusperren.

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

const LIMITS = {
  email: 8,
  ip: 30
};

export function throttleKeys(email, request) {
  const keys = [];
  if (email) {
    keys.push({ scope: "email", key: email });
  }
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) {
    keys.push({ scope: "ip", key: ip });
  }
  return keys;
}

// Liefert die Sekunden bis zum Ablauf der Sperre, sonst 0.
export async function checkThrottle(env, keys) {
  if (!keys.length) {
    return 0;
  }

  const now = Date.now();
  let longest = 0;

  for (const { scope, key } of keys) {
    const row = await env.DB.prepare(
      "SELECT locked_until FROM login_attempts WHERE scope = ? AND key = ?"
    )
      .bind(scope, key)
      .first();

    if (!row?.locked_until) {
      continue;
    }

    const remaining = new Date(row.locked_until).getTime() - now;
    if (remaining > 0) {
      longest = Math.max(longest, Math.ceil(remaining / 1000));
    }
  }

  return longest;
}

export async function registerFailure(env, keys) {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  for (const { scope, key } of keys) {
    const row = await env.DB.prepare(
      "SELECT attempts, window_start FROM login_attempts WHERE scope = ? AND key = ?"
    )
      .bind(scope, key)
      .first();

    const windowExpired = !row || now - new Date(row.window_start).getTime() > WINDOW_MS;
    const attempts = windowExpired ? 1 : (row.attempts || 0) + 1;
    const windowStart = windowExpired ? nowIso : row.window_start;
    const limit = LIMITS[scope] || LIMITS.email;
    const lockedUntil = attempts >= limit ? new Date(now + LOCK_MS).toISOString() : null;

    await env.DB.prepare(
      `INSERT INTO login_attempts (scope, key, attempts, window_start, locked_until)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (scope, key) DO UPDATE SET
         attempts = excluded.attempts,
         window_start = excluded.window_start,
         locked_until = excluded.locked_until`
    )
      .bind(scope, key, attempts, windowStart, lockedUntil)
      .run();
  }
}

// Nach erfolgreichem Login ist der Zaehler hinfaellig.
export async function clearAttempts(env, keys) {
  for (const { scope, key } of keys) {
    await env.DB.prepare("DELETE FROM login_attempts WHERE scope = ? AND key = ?")
      .bind(scope, key)
      .run();
  }
}
