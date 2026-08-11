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

// Wiederherstellungscodes.
//
// Ohne I, L, O, 0 und 1, damit beim Abschreiben nichts verwechselt wird.
// 12 Zeichen aus 31 Moeglichkeiten sind rund 59 Bit - zu viel zum
// Durchprobieren, zumal die Reset-Route dieselbe Sperre hat wie der
// Login. Anders als ein Passwort ist der Code also zufaellig genug,
// dass ein schneller Hash mit eigenem Salt genuegt. Das ist hier auch
// noetig: Ein zweites PBKDF2 wuerde bei der Registrierung zusammen mit
// dem Passwort-Hash das CPU-Limit des Free-Plans sprengen.
const RECOVERY_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const RECOVERY_LENGTH = 12;

export function createRecoveryCode() {
  const chars = [];
  const limit = Math.floor(256 / RECOVERY_ALPHABET.length) * RECOVERY_ALPHABET.length;

  while (chars.length < RECOVERY_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(RECOVERY_LENGTH))) {
      // Werte oberhalb des Vielfachen verwerfen, sonst waeren die
      // vorderen Zeichen des Alphabets haeufiger.
      if (byte < limit && chars.length < RECOVERY_LENGTH) {
        chars.push(RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length]);
      }
    }
  }

  const body = chars.join("");
  return `REMA-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

export function normalizeRecoveryCode(value) {
  const clean = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.length === RECOVERY_LENGTH ? `REMA${clean}` : clean;
}

export async function hashRecoveryCode(code, salt) {
  return sha256Hex(`${salt}:${normalizeRecoveryCode(code)}`);
}

export async function createRecoveryRecord() {
  const code = createRecoveryCode();
  const salt = randomHex(16);
  return { code, salt, hash: await hashRecoveryCode(code, salt) };
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
