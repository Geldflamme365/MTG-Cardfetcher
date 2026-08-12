// Duenner Client fuer die Worker-API. Das Session-Cookie wird vom
// Browser automatisch mitgeschickt, weil alles unter derselben Origin
// laeuft.

async function call(path, { method = "GET", body } = {}) {
  const options = { method, headers: {} };

  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`/api${path}`, options);

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  me: () => call("/auth/me"),
  register: (email, password, displayName) =>
    call("/auth/register", { method: "POST", body: { email, password, displayName } }),
  login: (email, password) => call("/auth/login", { method: "POST", body: { email, password } }),
  logout: () => call("/auth/logout", { method: "POST" }),
  recover: (email, recoveryCode, newPassword) =>
    call("/auth/recover", { method: "POST", body: { email, recoveryCode, newPassword } }),
  newRecoveryCode: () => call("/auth/recovery-code", { method: "POST", body: {} }),
  updateProfile: (displayName) => call("/profile", { method: "PATCH", body: { displayName } }),
  getCollection: () => call("/collection"),
  mergeCollection: (cards) => call("/collection/merge", { method: "POST", body: { cards } }),
  putCard: (card) =>
    call(`/collection/${encodeURIComponent(card.id)}`, {
      method: "PUT",
      body: {
        name: card.name,
        set_name: card.set_name,
        released_at: card.released_at,
        image: card.image,
        added_at: card.added_at
      }
    }),
  deleteCard: (cardId) => call(`/collection/${encodeURIComponent(cardId)}`, { method: "DELETE" }),

  listDecks: () => call("/decks"),
  createDeck: (name) => call("/decks", { method: "POST", body: { name } }),
  getDeck: (id) => call(`/decks/${encodeURIComponent(id)}`),
  updateDeck: (id, changes) => call(`/decks/${encodeURIComponent(id)}`, { method: "PATCH", body: changes }),
  deleteDeck: (id) => call(`/decks/${encodeURIComponent(id)}`, { method: "DELETE" }),
  mergeDecks: (decks) => call("/decks/merge", { method: "POST", body: { decks } }),
  putDeckCard: (id, card, quantity) =>
    call(`/decks/${encodeURIComponent(id)}/cards/${encodeURIComponent(card.id)}`, {
      method: "PUT",
      body: { name: card.name, set_name: card.set_name, image: card.image, quantity }
    }),
  deleteDeckCard: (id, cardId) =>
    call(`/decks/${encodeURIComponent(id)}/cards/${encodeURIComponent(cardId)}`, { method: "DELETE" })
};
