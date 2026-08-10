// Passwort-Hashing und Session-Handling.
//
// Cloudflare erlaubt auf dem Free-Plan 10 ms CPU pro Request. PBKDF2 mit
// 50'000 Iterationen braucht rund 6.5 ms und laesst damit noch Luft fuer
// die D1-Abfrage. Wer auf den Paid-Plan wechselt, kann die Konstante
// hochziehen (OWASP empfiehlt 210'000) - alte Hashes bleiben gueltig,
// weil die verwendete Iterationszahl pro User gespeichert wird.
export const PBKDF2_ITERATIONS = 50_000;

const SESSION_TTL_DAYS = 30;
export const SESSION_COOKIE = "remasurium_session";

const encoder = new TextEncoder();

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomHex(bytes) {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function hashPassword(password, salt, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations },
    key,
    256
  );
  return toHex(bits);
}

export async function createPasswordRecord(password) {
  const salt = randomHex(16);
  return {
    salt,
    iterations: PBKDF2_ITERATIONS,
    hash: await hashPassword(password, salt, PBKDF2_ITERATIONS)
  };
}

// Vergleich ohne fruehen Abbruch, damit die Laufzeit nichts ueber den
// Hash verraet.
export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function sha256Hex(value) {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

export function createSessionToken() {
  return randomHex(32);
}

export function sessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function buildSessionCookie(token, expiresAt) {
  return [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`
  ].join("; ");
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readSessionToken(request) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) {
      return rest.join("=") || null;
    }
  }
  return null;
}
