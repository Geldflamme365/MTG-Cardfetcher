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
        image: card.image
      }
    }),
  deleteCard: (cardId) => call(`/collection/${encodeURIComponent(cardId)}`, { method: "DELETE" })
};
