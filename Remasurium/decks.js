import { api } from "./api.js";

// Decks funktionieren mit und ohne Konto. Damit die Oberfläche nicht
// zweimal geschrieben werden muss, liegt der Unterschied allein hier:
// angemeldet geht alles an den Worker, sonst in den localStorage. Beide
// Seiten liefern dieselben Datenformen zurück.

const STORAGE_KEY = "remasurium.decks";
const MAX_DECK_CARDS = 500;

function loadLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveLocal(decks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

function countCards(cards) {
  return (cards || []).reduce((sum, card) => sum + (Number(card.quantity) || 1), 0);
}

function publicDeck(deck) {
  return {
    id: deck.id,
    name: deck.name,
    format: deck.format || "commander",
    commander: deck.commander || null,
    // Der Commander zählt als Karte des Decks mit.
    cardCount: countCards(deck.cards) + (deck.commander ? 1 : 0),
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt
  };
}

// Dieselbe Regel wie im Worker: Commander erlaubt ein Exemplar je Karte,
// ausser bei Standardländern und Relentless-Karten.
function limitQuantity(deck, unlimited, requested) {
  const quantity = Math.min(Math.max(Number(requested) || 1, 1), 99);
  return (deck.format || "commander") === "commander" && !unlimited ? 1 : quantity;
}

function cardEntry(deck, card, quantity) {
  const unlimited = Boolean(card.unlimited);
  return {
    id: card.id,
    name: card.name,
    set_name: card.set_name ?? null,
    image: card.image ?? null,
    unlimited,
    quantity: limitQuantity(deck, unlimited, quantity)
  };
}

function localResult(deck) {
  return { deck: publicDeck(deck), cards: (deck.cards || []).slice() };
}

export function createDeckStore({ isLoggedIn }) {
  function findLocal(decks, id) {
    const deck = decks.find((entry) => entry.id === id);
    if (!deck) {
      throw new Error("Deck nicht gefunden.");
    }
    return deck;
  }

  return {
    // Wird beim Login gebraucht: was lokal liegt, wandert hoch.
    takeLocalDecks() {
      const decks = loadLocal();
      return decks.map((deck) => ({
        name: deck.name,
        format: deck.format || "commander",
        commander: deck.commander || null,
        cards: (deck.cards || []).map((card) => ({ ...card }))
      }));
    },

    clearLocal() {
      localStorage.removeItem(STORAGE_KEY);
    },

    async list() {
      if (isLoggedIn()) {
        return (await api.listDecks()).decks;
      }
      return loadLocal()
        .slice()
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
        .map(publicDeck);
    },

    async create(name, format = "commander") {
      const clean = String(name || "").trim().slice(0, 80) || "Neues Deck";
      if (isLoggedIn()) {
        return (await api.createDeck(clean, format)).deck;
      }

      const decks = loadLocal();
      const now = new Date().toISOString();
      const deck = {
        id: `local-${crypto.randomUUID()}`,
        name: clean,
        format,
        commander: null,
        cards: [],
        createdAt: now,
        updatedAt: now
      };
      decks.unshift(deck);
      saveLocal(decks);
      return publicDeck(deck);
    },

    async get(id) {
      if (isLoggedIn()) {
        return api.getDeck(id);
      }
      return localResult(findLocal(loadLocal(), id));
    },

    async update(id, changes) {
      if (isLoggedIn()) {
        return api.updateDeck(id, changes);
      }

      const decks = loadLocal();
      const deck = findLocal(decks, id);

      if (changes.name !== undefined) {
        const clean = String(changes.name).trim().slice(0, 80);
        if (!clean) {
          throw new Error("Der Deckname darf nicht leer sein.");
        }
        deck.name = clean;
      }

      if (changes.commander !== undefined) {
        deck.commander = changes.commander
          ? {
              id: changes.commander.id,
              name: changes.commander.name,
              image: changes.commander.image ?? null,
              art: changes.commander.art ?? null
            }
          : null;
        // Gleiche Regel wie im Backend: der Commander steht nicht
        // zusätzlich in der Kartenliste.
        if (deck.commander) {
          deck.cards = (deck.cards || []).filter((card) => card.id !== deck.commander.id);
        }
      }

      deck.updatedAt = new Date().toISOString();
      saveLocal(decks);
      return localResult(deck);
    },

    async remove(id) {
      if (isLoggedIn()) {
        return api.deleteDeck(id);
      }
      saveLocal(loadLocal().filter((deck) => deck.id !== id));
      return { ok: true };
    },

    async putCard(id, card, quantity) {
      if (isLoggedIn()) {
        return api.putDeckCard(id, card, quantity);
      }

      const decks = loadLocal();
      const deck = findLocal(decks, id);
      deck.cards = deck.cards || [];

      const entry = cardEntry(deck, card, quantity);
      const others = deck.cards.filter((item) => item.id !== entry.id);
      if (countCards(others) + entry.quantity > MAX_DECK_CARDS) {
        throw new Error(`Ein Deck fasst höchstens ${MAX_DECK_CARDS} Karten.`);
      }

      const existing = deck.cards.find((item) => item.id === entry.id);
      if (existing) {
        Object.assign(existing, entry);
      } else {
        deck.cards.unshift(entry);
      }

      deck.updatedAt = new Date().toISOString();
      saveLocal(decks);
      return localResult(deck);
    },

    async removeCard(id, cardId) {
      if (isLoggedIn()) {
        return api.deleteDeckCard(id, cardId);
      }

      const decks = loadLocal();
      const deck = findLocal(decks, id);
      deck.cards = (deck.cards || []).filter((card) => card.id !== cardId);
      deck.updatedAt = new Date().toISOString();
      saveLocal(decks);
      return localResult(deck);
    }
  };
}
