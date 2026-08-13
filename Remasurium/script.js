import { api } from "./api.js";
import { createDeckStore } from "./decks.js";
import { getLang, setLang, t, watchForNewContent } from "./i18n.js";

const state = {
  results: [],
  searchSelection: null,
  searchPrints: [],
  searchFaceIndex: 0,
  collectionSelection: null,
  collectionPrints: [],
  collectionFaceIndex: 0,
  versionModalContext: null,
  collection: loadCollection(),
  user: null,
  decks: [],
  activeDeck: null,
  activeDeckCards: [],
  deckResults: [],
  deckVersionCard: null,
  renamingDeckId: null,
  deckSelection: null,
  deckPrints: [],
  deckFaceIndex: 0,
  commanderCard: null
};

const deckStore = createDeckStore({ isLoggedIn: () => Boolean(state.user) });

// Laufende Nummer je Ansicht, um veraltete Antworten zu erkennen.
const selectionCounters = {
  search: 0,
  collection: 0,
  deck: 0
};

const els = {
  status: document.getElementById("status"),
  routeFooter: document.getElementById("routeFooter"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  results: document.getElementById("results"),
  searchDetails: document.getElementById("searchDetails"),
  searchModal: document.getElementById("searchModal"),
  modalCloseBtn: document.getElementById("modalCloseBtn"),
  collectionModal: document.getElementById("collectionModal"),
  collectionModalCloseBtn: document.getElementById("collectionModalCloseBtn"),
  versionModal: document.getElementById("versionModal"),
  versionModalCloseBtn: document.getElementById("versionModalCloseBtn"),
  versionModalTitle: document.getElementById("versionModalTitle"),
  versionModalNote: document.getElementById("versionModalNote"),
  versionList: document.getElementById("versionList"),
  collection: document.getElementById("collection"),
  collectionDetails: document.getElementById("collectionDetails"),
  resultCountOutputs: document.querySelectorAll("[data-results-count]"),
  collectionCountOutputs: document.querySelectorAll("[data-collection-count]"),
  queryButtons: document.querySelectorAll("[data-query]"),
  randomButtons: document.querySelectorAll("[data-random-card]"),
  views: {
    home: document.getElementById("view-home"),
    suche: document.getElementById("view-suche"),
    collection: document.getElementById("view-collection"),
    decks: document.getElementById("view-decks"),
    account: document.getElementById("view-account")
  },
  deckOverview: document.getElementById("deckOverview"),
  deckEditor: document.getElementById("deckEditor"),
  deckList: document.getElementById("deckList"),
  deckCount: document.getElementById("deckCount"),
  deckStatus: document.getElementById("deckStatus"),
  newDeckName: document.getElementById("newDeckName"),
  newDeckFormat: document.getElementById("newDeckFormat"),
  createDeckBtn: document.getElementById("createDeckBtn"),
  deckLayout: document.querySelector(".deck-layout"),
  deckSplitter: document.getElementById("deckSplitter"),
  deckSearchInput: document.getElementById("deckSearchInput"),
  deckSearchBtn: document.getElementById("deckSearchBtn"),
  deckSearchResults: document.getElementById("deckSearchResults"),
  deckSearchCount: document.getElementById("deckSearchCount"),
  deckQueryBank: document.getElementById("deckQueryBank"),
  deckQueryNote: document.getElementById("deckQueryNote"),
  deckCardModal: document.getElementById("deckCardModal"),
  deckCardModalCloseBtn: document.getElementById("deckCardModalCloseBtn"),
  deckCardDetails: document.getElementById("deckCardDetails"),
  deckNameInput: document.getElementById("deckNameInput"),
  renameDeckBtn: document.getElementById("renameDeckBtn"),
  deleteDeckBtn: document.getElementById("deleteDeckBtn"),
  backToDecksBtn: document.getElementById("backToDecksBtn"),
  commanderSlot: document.getElementById("commanderSlot"),
  deckCards: document.getElementById("deckCards"),
  deckTotal: document.getElementById("deckTotal"),
  quickAddInput: document.getElementById("quickAddInput"),
  quickAddBtn: document.getElementById("quickAddBtn"),
  deckListText: document.getElementById("deckListText"),
  deckCopyBtn: document.getElementById("deckCopyBtn"),
  deckImportBtn: document.getElementById("deckImportBtn"),
  deckImportText: document.getElementById("deckImportText"),
  deckImportName: document.getElementById("deckImportName"),
  randomCommanderBtn: document.getElementById("randomCommanderBtn"),
  randomCommanderPill: document.getElementById("randomCommanderPill"),
  langToggle: document.getElementById("langToggle"),
  openImportBtn: document.getElementById("openImportBtn"),
  openExportBtn: document.getElementById("openExportBtn"),
  importModal: document.getElementById("importModal"),
  exportModal: document.getElementById("exportModal"),
  importModalCloseBtn: document.getElementById("importModalCloseBtn"),
  exportModalCloseBtn: document.getElementById("exportModalCloseBtn"),
  navLinks: document.querySelectorAll(".nav-link"),
  authStatus: document.getElementById("authStatus"),
  accountGuest: document.getElementById("accountGuest"),
  accountUser: document.getElementById("accountUser"),
  accountPanelTitle: document.getElementById("accountPanelTitle"),
  accountFooter: document.getElementById("accountFooter"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  recoverForm: document.getElementById("recoverForm"),
  recoveryPanel: document.getElementById("recoveryPanel"),
  recoveryCode: document.getElementById("recoveryCode"),
  copyRecoveryBtn: document.getElementById("copyRecoveryBtn"),
  dismissRecoveryBtn: document.getElementById("dismissRecoveryBtn"),
  newRecoveryBtn: document.getElementById("newRecoveryBtn"),
  profileForm: document.getElementById("profileForm"),
  profileEmail: document.getElementById("profileEmail"),
  profileCreated: document.getElementById("profileCreated"),
  profileName: document.getElementById("profileName"),
  logoutBtn: document.getElementById("logoutBtn"),
  authTabs: document.querySelectorAll("[data-auth-tab]"),
  collectionScopeLabel: document.getElementById("collectionScopeLabel"),
  collectionScopeNote: document.getElementById("collectionScopeNote")
};

function setStatus(text, type = "muted") {
  if (!els.status) {
    return;
  }

  els.status.textContent = text;
  els.status.className = `status ${type}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadCollection() {
  try {
    return JSON.parse(localStorage.getItem("remasurium.collection") || "[]");
  } catch {
    return [];
  }
}

// Ohne Konto ist localStorage die Quelle der Wahrheit, mit Konto der
// Server. Deshalb wird im Cloud-Modus bewusst nichts lokal gespiegelt:
// so bleibt nach dem Abmelden nichts aus der Cloud im Browser liegen.
function saveCollection() {
  if (state.user) {
    return;
  }
  localStorage.setItem("remasurium.collection", JSON.stringify(state.collection));
}

function entryFromCard(card, addedAt = null) {
  return {
    id: card.id,
    name: card.name,
    set_name: card.set_name ?? null,
    released_at: card.released_at ?? null,
    image: getCardPreviewUrl(card) || card.image || null,
    added_at: addedAt
  };
}

function normalizeRoute(hash) {
  const route = hash.replace(/^#\/?/, "").trim().toLowerCase();
  if (!route) {
    return "home";
  }
  if (route === "suche") {
    return "suche";
  }
  if (route === "collection") {
    return "collection";
  }
  if (route === "decks") {
    return "decks";
  }
  if (route === "account") {
    return "account";
  }
  return "home";
}

function setActiveNav(route) {
  for (const link of els.navLinks) {
    const target = normalizeRoute(link.getAttribute("href") || "");
    const active = route === target;
    link.classList.toggle("active", active);
    link.setAttribute("aria-current", active ? "page" : "false");
  }
}

function updateRouteChrome(route) {
  const labels = {
    home: "scry://remasurium/home",
    suche: "scry://remasurium/search",
    collection: "scry://remasurium/collection",
    decks: "scry://remasurium/decks",
    account: "scry://remasurium/account"
  };
  const label = labels[route] || labels.home;  if (els.routeFooter) {
    els.routeFooter.textContent = label;
  }
}

function renderRoute() {
  const route = normalizeRoute(window.location.hash);

  Object.entries(els.views).forEach(([name, node]) => {
    node.classList.toggle("active", name === route);
  });

  const titleMap = {
    home: "MTG Remasurium - Home",
    suche: "MTG Remasurium - Suche",
    collection: "MTG Remasurium - Collection",
    decks: "MTG Remasurium - Decks",
    account: "MTG Remasurium - Account"
  };

  document.title = titleMap[route] || "MTG Remasurium";

  if (route === "decks") {
    refreshDecks();
  }

  setActiveNav(route);
  updateRouteChrome(route);
  closeVersionModal();
  closeDeckCardModal();
  closeSearchModal();
  closeCollectionModal();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openSearchRoute() {
  if (normalizeRoute(window.location.hash) !== "suche") {
    window.location.hash = "#/suche";
  } else {
    renderRoute();
  }
}

function openSearchModal() {
  if (!els.searchModal) {
    return;
  }
  els.searchModal.classList.add("open");
  els.searchModal.setAttribute("aria-hidden", "false");
}

function closeSearchModal() {
  if (!els.searchModal) {
    return;
  }
  els.searchModal.classList.remove("open");
  els.searchModal.setAttribute("aria-hidden", "true");
}

function openCollectionModal() {
  if (!els.collectionModal) {
    return;
  }
  els.collectionModal.classList.add("open");
  els.collectionModal.setAttribute("aria-hidden", "false");
}

function closeCollectionModal() {
  if (!els.collectionModal) {
    return;
  }
  els.collectionModal.classList.remove("open");
  els.collectionModal.setAttribute("aria-hidden", "true");
}

// Scryfall bittet um 50 bis 100 ms Abstand zwischen Anfragen. Ohne
// Bremse laufen schnelle Klicks in ein 429, und die Versionsliste bleibt
// leer, obwohl es Versionen gibt. Darum laufen alle Aufrufe nacheinander
// durch diese Warteschlange.
const SCRYFALL_MIN_GAP_MS = 120;
const SCRYFALL_MAX_RETRIES = 3;

let scryfallQueue = Promise.resolve();
let lastScryfallCall = 0;

function queueScryfall(task) {
  const run = scryfallQueue.then(async () => {
    const wait = SCRYFALL_MIN_GAP_MS - (Date.now() - lastScryfallCall);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    try {
      return await task();
    } finally {
      lastScryfallCall = Date.now();
    }
  });

  // Der Fehler wird beim Aufrufer behandelt, die Kette darf daran nicht
  // zerbrechen.
  scryfallQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function scryfallFetch(url, options = {}, attempt = 0) {
  let response;

  try {
    response = await queueScryfall(() => fetch(url, options));
  } catch (error) {
    // Abgebrochene Verbindung, kein HTTP-Fehler. Kommt bei wackligem
    // WLAN vor und darf nicht sofort als "keine Versionen" enden.
    if (attempt < SCRYFALL_MAX_RETRIES) {
      setStatus("Verbindung zu Scryfall unterbrochen, neuer Versuch...", "muted");
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 700));
      return scryfallFetch(url, options, attempt + 1);
    }
    throw new Error("Scryfall ist gerade nicht erreichbar.");
  }

  if (response.status === 429 && attempt < SCRYFALL_MAX_RETRIES) {
    const retryAfter = Number(response.headers.get("Retry-After")) || 1;
    setStatus("Scryfall bremst gerade, versuche es gleich nochmal...", "muted");
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return scryfallFetch(url, options, attempt + 1);
  }

  return response;
}

async function fetchJson(url, options = {}) {
  const response = await scryfallFetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchRandomCard(query = "") {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const filter = query ? `q=${encodeURIComponent(query)}&` : "";
  return fetchJson(`https://api.scryfall.com/cards/random?${filter}__cb=${encodeURIComponent(nonce)}`, {
    cache: "no-store"
  });
}

async function searchCards(query) {
  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=released`;
  const response = await scryfallFetch(url);
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.data || [];
}

function hasAdvancedScryfallSyntax(query) {
  return /[:<>=!()"]/u.test(query);
}

async function searchCardsWithTolerance(query) {
  const directResults = await searchCards(query);
  if (directResults.length) {
    return { cards: directResults, mode: "direct" };
  }

  if (hasAdvancedScryfallSyntax(query)) {
    return { cards: [], mode: "none" };
  }

  try {
    const fuzzyCard = await fetchJson(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(query)}`);
    return { cards: [fuzzyCard], mode: "fuzzy", correctedName: fuzzyCard.name };
  } catch {
    try {
      const auto = await fetchJson(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`);
      const suggestion = auto?.data?.[0];
      if (!suggestion) {
        return { cards: [], mode: "none" };
      }

      const exactCard = await fetchJson(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(suggestion)}`);
      return { cards: [exactCard], mode: "autocomplete", correctedName: exactCard.name };
    } catch {
      return { cards: [], mode: "none" };
    }
  }
}

// Alle Prints einer Karte teilen sich dieselbe prints_search_uri, die
// taugt also als Schluessel. Gespeichert wird das Promise, damit zwei
// schnelle Klicks auf dieselbe Karte nur eine Anfrage ausloesen.
const printHistoryCache = new Map();

async function loadPrintHistory(card) {
  if (!card || !card.prints_search_uri) {
    return [];
  }

  const key = card.prints_search_uri;

  if (!printHistoryCache.has(key)) {
    const request = fetchJson(key)
      .then((data) =>
        (data.data || []).slice().sort((a, b) => new Date(a.released_at) - new Date(b.released_at))
      )
      .catch((error) => {
        // Fehlschlaege nicht behalten, sonst bleibt die Karte dauerhaft
        // ohne Versionen.
        printHistoryCache.delete(key);
        throw error;
      });

    printHistoryCache.set(key, request);
  }

  return printHistoryCache.get(key);
}

function isInCollection(id) {
  return state.collection.some((item) => item.id === id);
}

function getCardPreviewUrl(card) {
  return (
    card.image_uris?.normal ||
    card.image_uris?.large ||
    card.image_uris?.small ||
    card.card_faces?.[0]?.image_uris?.normal ||
    card.card_faces?.[0]?.image_uris?.large ||
    card.card_faces?.[0]?.image_uris?.small ||
    ""
  );
}

function updateResultCount() {
  const text = `${state.results.length} ${state.results.length === 1 ? "card" : "cards"}`;
  els.resultCountOutputs.forEach((node) => {
    node.textContent = text;
  });
}

function updateCollectionCount() {
  const text = `${state.collection.length}`;
  els.collectionCountOutputs.forEach((node) => {
    node.textContent = text;
  });
}

// Ein Versionswechsel an einer gespeicherten Karte tauscht den Eintrag
// aus, statt eine zweite Karte anzulegen. Der Platz in der Collection
// bleibt erhalten, weil das Hinzufuegedatum mitwandert.
async function replaceCollectionCard(previousId, nextCard) {
  const index = state.collection.findIndex((item) => item.id === previousId);
  if (index === -1) {
    return false;
  }

  const previous = state.collection;
  const entry = entryFromCard(nextCard, state.collection[index].added_at || null);

  const updated = state.collection.slice();
  updated[index] = entry;
  state.collection = updated;

  saveCollection();
  renderCollection();

  if (!state.user) {
    return true;
  }

  try {
    await api.putCard(entry);
    await api.deleteCard(previousId);
    return true;
  } catch (error) {
    state.collection = previous;
    saveCollection();
    renderCollection();
    setStatus(`Version konnte in der Cloud nicht geändert werden: ${error.message}`, "err");
    return false;
  }
}

function renderCollectionViews() {
  renderCollection();
  renderSearchDetails();
  renderCollectionDetails();
}

async function toggleCollection(card) {
  if (!card) {
    return;
  }

  const removing = isInCollection(card.id);
  const entry = entryFromCard(card);
  const previous = state.collection;

  if (removing) {
    state.collection = state.collection.filter((item) => item.id !== card.id);

    if (state.collectionSelection?.id === card.id) {
      state.collectionSelection = null;
      state.collectionPrints = [];
      closeCollectionModal();
    }
  } else {
    state.collection = [entry, ...state.collection];
  }

  saveCollection();
  renderCollectionViews();
  setStatus(
    removing ? `${card.name} aus Collection entfernt.` : `${card.name} zur Collection hinzugefügt.`,
    "ok"
  );

  if (!state.user) {
    return;
  }

  // Im Cloud-Modus zaehlt erst der Server. Schlaegt der Aufruf fehl,
  // wird die Anzeige zurueckgedreht statt etwas Falsches zu zeigen.
  try {
    if (removing) {
      await api.deleteCard(card.id);
    } else {
      await api.putCard(entry);
    }
  } catch (error) {
    state.collection = previous;
    renderCollectionViews();
    setStatus(`Konnte nicht in der Cloud gespeichert werden: ${error.message}`, "err");
  }
}

function renderResults() {
  updateResultCount();

  if (!state.results.length) {
    els.results.innerHTML = `<div class="empty-state">Noch keine Treffer. Starte eine Suche oder nutze ein Beispiel.</div>`;
    return;
  }

  els.results.innerHTML = `
    <div class="search-grid">
      ${state.results
        .map((card) => {
          const preview = getCardPreviewUrl(card);
          return `
            <button
              type="button"
              class="search-tile${state.searchSelection?.id === card.id ? " active" : ""}"
              data-select="${card.id}"
              title="${escapeHtml(card.name)}"
            >
              <span class="tile-frame">
                ${
                  preview
                    ? `<img src="${escapeHtml(preview)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
                    : `<span class="search-fallback">${escapeHtml(card.name)}</span>`
                }
              </span>
              <span class="tile-caption">${escapeHtml(card.name)}</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;

  for (const btn of els.results.querySelectorAll("button[data-select]")) {
    btn.addEventListener("click", () => {
      const card = state.results.find((item) => item.id === btn.dataset.select);
      if (card) {
        selectSearchCard(card);
      }
    });
  }
}

function renderCollection() {
  updateCollectionCount();

  if (!state.collection.length) {
    els.collection.innerHTML = `<div class="empty-state">Noch keine Karten gespeichert.</div>`;
    return;
  }

  els.collection.innerHTML = `
    <div class="collection-grid">
      ${state.collection
        .map(
          (card) => `
            <button
              type="button"
              class="collection-tile${state.collectionSelection?.id === card.id ? " active" : ""}"
              data-pick="${card.id}"
              title="${escapeHtml(card.name)}"
            >
              <span class="tile-frame">
                ${
                  card.image
                    ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
                    : `<span class="collection-fallback">${escapeHtml(card.name)}</span>`
                }
              </span>
              <span class="tile-caption">${escapeHtml(card.name)}</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;

  for (const entry of els.collection.querySelectorAll("button[data-pick]")) {
    entry.addEventListener("click", async () => {
      const id = entry.dataset.pick;
      try {
        setStatus("Lade Karte aus Collection...", "muted");
        const card = await fetchJson(`https://api.scryfall.com/cards/${id}`);
        await selectCollectionCard(card);
      } catch (error) {
        setStatus(`Karte konnte nicht geladen werden: ${error.message}`, "err");
      }
    });
  }
}

function updateCollectionPreview(card) {
  const image = getCardPreviewUrl(card);
  if (!image) {
    return;
  }

  let changed = false;
  state.collection = state.collection.map((item) => {
    if (item.id === card.id && item.image !== image) {
      changed = true;
      return { ...item, image };
    }
    return item;
  });

  if (!changed) {
    return;
  }

  saveCollection();
  renderCollection();

  if (state.user) {
    const entry = state.collection.find((item) => item.id === card.id);
    if (entry) {
      api.putCard(entry).catch(() => {
        // Nur das Vorschaubild, ein Fehlschlag darf die Ansicht nicht stoeren.
      });
    }
  }
}

// In der Detailansicht steht nur der Knopf. Die Versionen selbst
// kommen in ein eigenes Fenster, damit die Detailansicht nicht von
// einer langen Bilderliste erschlagen wird.
function renderVersionSection(prints) {
  if (!prints.length) {
    return `
      <div>
        <h3>Versionen</h3>
        <p class="small-note">Keine Versionsdaten vorhanden.</p>
      </div>
    `;
  }

  if (prints.length === 1) {
    return `
      <div>
        <h3>Versionen</h3>
        <p class="small-note">Von dieser Karte gibt es nur diesen einen Print.</p>
      </div>
    `;
  }

  return `
    <div>
      <div class="versions-head">
        <h3>Versionen</h3>
        <button type="button" class="retro-button version-toggle" data-open-versions="1">
          Version ändern (${prints.length})
        </button>
      </div>
      <p class="small-note">Öffnet alle ${prints.length} Prints in einem eigenen Fenster.</p>
    </div>
  `;
}

function createDetailsHtml(card, prints, context) {
  if (!card) {
    return context === "search"
      ? `<p class="small-note">Noch keine Karte ausgewählt.</p>`
      : `<p class="small-note">Noch keine Karte aus der Collection geöffnet.</p>`;
  }

  const faceIndexes = {
    search: state.searchFaceIndex,
    collection: state.collectionFaceIndex,
    deck: state.deckFaceIndex
  };
  const activeFaceIndex = faceIndexes[context] ?? 0;
  const inDeck = state.activeDeckCards.some((entry) => entry.id === card.id);
  const hasFaces = Array.isArray(card.card_faces) && card.card_faces.length > 1;
  const safeFaceIndex = hasFaces ? Math.max(0, Math.min(activeFaceIndex, card.card_faces.length - 1)) : 0;
  const face = hasFaces ? card.card_faces[safeFaceIndex] : null;
  const img = face?.image_uris?.normal || card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "";
  const oracleText =
    face?.oracle_text ||
    card.oracle_text ||
    card.card_faces?.map((entry) => entry.oracle_text || "").filter(Boolean).join("\n\n") ||
    "Kein Oracle Text vorhanden.";
  const cardName = face?.name || card.name;
  const typeLine = face?.type_line || card.type_line || "Unbekannter Typ";
  const canFlip =
    hasFaces &&
    card.card_faces.every((entry) => Boolean(entry.image_uris?.normal || entry.image_uris?.large || entry.image_uris?.small));

  return `
    <div class="details-grid">
      <div class="preview-wrap">
        ${img ? `<img class="preview" src="${escapeHtml(img)}" alt="${escapeHtml(cardName)}" />` : `<p class="small-note">Kein Bild vorhanden.</p>`}
        ${
          canFlip
            ? `<button type="button" class="flip-btn" data-flip-face="1" data-context="${context}" aria-label="Kartenseite wechseln" title="Kartenseite wechseln">↻</button>`
            : ""
        }
        <div class="details-actions">
          ${
            context === "deck"
              ? `<button type="button" class="retro-button collection-button${inDeck ? " is-saved" : ""}" data-toggle-deck="${card.id}">
                   <span class="collection-button-icon" aria-hidden="true">${inDeck ? "−" : "+"}</span>
                   <span>${inDeck ? "Aus dem Deck entfernen" : "Hinzufügen"}</span>
                 </button>`
              : `<button type="button" class="retro-button collection-button${isInCollection(card.id) ? " is-saved" : ""}" data-toggle-collection="${card.id}">
                   <span class="collection-button-icon" aria-hidden="true">${isInCollection(card.id) ? "★" : "☆"}</span>
                   <span>${isInCollection(card.id) ? "Aus Collection entfernen" : "In Collection speichern"}</span>
                 </button>`
          }
        </div>
      </div>

      <div class="meta">
        <div>
          <h3>${escapeHtml(cardName)}</h3>
          <p class="small-note">${escapeHtml(typeLine)}</p>
          <div class="pill-row details-pills">
            <span class="pill">Set: ${escapeHtml(card.set_name || "?")}</span>
            <span class="pill">Release: ${escapeHtml(card.released_at || "?")}</span>
            <span class="pill">Rarity: ${escapeHtml(card.rarity || "?")}</span>
          </div>
        </div>

        <div class="analysis">
          <h3>Oracle Text</h3>
          <div class="raw">${escapeHtml(oracleText)}</div>
        </div>

        ${renderVersionSection(prints)}
      </div>
    </div>
  `;
}

function bindDetailsEvents(container, context) {
  const toggleBtn = container.querySelector("button[data-toggle-collection]");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const card = context === "search" ? state.searchSelection : state.collectionSelection;
      toggleCollection(card);
    });
  }

  const openVersions = container.querySelector("button[data-open-versions]");
  if (openVersions) {
    openVersions.addEventListener("click", () => openVersionModal(context));
  }

  const deckToggle = container.querySelector("button[data-toggle-deck]");
  if (deckToggle) {
    deckToggle.addEventListener("click", async () => {
      const card = state.deckSelection;
      if (!card) {
        return;
      }
      if (state.activeDeckCards.some((entry) => entry.id === card.id)) {
        await removeDeckCard(card.id);
      } else {
        await addCardToDeck(card);
      }
      renderDeckCardDetails();
    });
  }

  const flipBtn = container.querySelector("button[data-flip-face]");
  if (flipBtn) {
    flipBtn.addEventListener("click", () => {
      if (context === "deck") {
        const faces = state.deckSelection?.card_faces || [];
        if (faces.length > 1) {
          state.deckFaceIndex = state.deckFaceIndex === 0 ? 1 : 0;
          renderDeckCardDetails();
        }
      } else if (context === "search") {
        const faces = state.searchSelection?.card_faces || [];
        if (faces.length > 1) {
          state.searchFaceIndex = state.searchFaceIndex === 0 ? 1 : 0;
          renderSearchDetails();
        }
      } else {
        const faces = state.collectionSelection?.card_faces || [];
        if (faces.length > 1) {
          state.collectionFaceIndex = state.collectionFaceIndex === 0 ? 1 : 0;
          renderCollectionDetails();
        }
      }
    });
  }
}

// Das Versionsfenster nutzt bewusst dieselben Klassen wie das
// Suchergebnis-Raster, damit die Karten dort gleich gross erscheinen.
function renderVersionModal() {
  const context = state.versionModalContext;
  if (!context || !els.versionList) {
    return;
  }

  const sources = {
    collection: [state.collectionSelection, state.collectionPrints],
    deck: [state.deckSelection, state.deckPrints]
  };
  const [card, prints] = sources[context] || [state.searchSelection, state.searchPrints];

  if (els.versionModalTitle) {
    els.versionModalTitle.textContent = card ? `versions - ${card.name.toLowerCase()}` : "card versions";
  }
  if (els.versionModalNote) {
    els.versionModalNote.textContent = `${prints.length} Prints. Klick auf ein Bild, um zu dieser Version zu wechseln.`;
  }

  els.versionList.innerHTML = prints
    .map((print) => {
      const preview = getCardPreviewUrl(print);
      const active = print.id === card?.id;
      return `
        <button
          type="button"
          class="search-tile version-tile${active ? " active" : ""}"
          data-print="${print.id}"
          data-context="${context}"
          title="${escapeHtml(print.set_name || "Unbekanntes Set")}"
          ${active ? 'aria-current="true"' : ""}
        >
          <span class="tile-frame">
            ${
              preview
                ? `<img src="${escapeHtml(preview)}" alt="${escapeHtml(print.set_name || print.name)}" loading="lazy" />`
                : `<span class="version-fallback">${escapeHtml(print.set_name || "?")}</span>`
            }
          </span>
          <span class="tile-caption">
            ${escapeHtml(print.set_name || "Unbekanntes Set")}
            <small>${escapeHtml(print.collector_number || "?")} - ${escapeHtml(print.released_at || "?")}</small>
          </span>
        </button>
      `;
    })
    .join("");

  for (const tile of els.versionList.querySelectorAll("button[data-print]")) {
    tile.addEventListener("click", async () => {
      const targetContext = tile.dataset.context;

      try {
        setStatus("Lade Version...", "muted");
        const selectedPrint = await fetchJson(`https://api.scryfall.com/cards/${tile.dataset.print}`);
        // Nach der Wahl schliesst sich das Fenster wieder, darum kuemmert
        // sich selectSearchCard bzw. selectCollectionCard.
        if (targetContext === "deck") {
          // Steht die Karte schon im Deck, wird dort die Ausgabe
          // getauscht. Sonst wird nur die Detailansicht umgestellt.
          const previous = state.deckSelection;
          const entry = state.activeDeckCards.find((card) => card.id === previous?.id);

          state.deckSelection = selectedPrint;
          state.deckFaceIndex = 0;
          closeVersionModal();

          if (entry) {
            state.deckVersionCard = entry;
            await applyDeckVersion(selectedPrint);
          }
          renderDeckCardDetails();
        } else if (targetContext === "deckcard") {
          closeVersionModal();
          await applyDeckVersion(selectedPrint);
        } else if (targetContext === "commander") {
          closeVersionModal();
          await applyCommanderVersion(selectedPrint);
        } else if (targetContext === "search") {
          await selectSearchCard(selectedPrint);
        } else {
          const previousId = state.collectionSelection?.id;
          const shouldReplace =
            previousId && previousId !== selectedPrint.id && isInCollection(previousId);
          const replaced = shouldReplace ? await replaceCollectionCard(previousId, selectedPrint) : false;

          await selectCollectionCard(selectedPrint);

          if (replaced) {
            setStatus(
              `Gespeicherte Karte auf ${selectedPrint.set_name || "andere Version"} umgestellt.`,
              "ok"
            );
          }
        }
      } catch (error) {
        setStatus(`Version konnte nicht geladen werden: ${error.message}`, "err");
      }
    });
  }
}

function openVersionModal(context) {
  if (!els.versionModal) {
    return;
  }
  state.versionModalContext = context;
  renderVersionModal();
  els.versionModal.classList.add("open");
  els.versionModal.setAttribute("aria-hidden", "false");
}

function closeVersionModal() {
  if (!els.versionModal) {
    return;
  }
  state.versionModalContext = null;
  els.versionModal.classList.remove("open");
  els.versionModal.setAttribute("aria-hidden", "true");
}

function renderSearchDetails() {
  els.searchDetails.innerHTML = createDetailsHtml(state.searchSelection, state.searchPrints, "search");
  bindDetailsEvents(els.searchDetails, "search");
}

function renderCollectionDetails() {
  els.collectionDetails.innerHTML = createDetailsHtml(state.collectionSelection, state.collectionPrints, "collection");
  bindDetailsEvents(els.collectionDetails, "collection");
}

async function selectSearchCard(card) {
  // Jede Auswahl bekommt eine Nummer. Trifft die Antwort einer aelteren
  // Auswahl spaeter ein, wird sie verworfen, statt die aktuelle Karte
  // mit fremden Versionen zu ueberschreiben.
  const requestId = ++selectionCounters.search;

  state.searchSelection = card;
  state.searchFaceIndex = 0;
  // Sofort leeren, sonst zeigt die Detailansicht bis zum Eintreffen der
  // neuen Liste noch die Versionen der vorherigen Karte an.
  state.searchPrints = [];
  closeVersionModal();
  renderResults();
  renderSearchDetails();
  openSearchModal();
  setStatus(`Lade Versionshistorie für ${card.name}...`, "muted");

  try {
    const prints = await loadPrintHistory(card);
    if (requestId !== selectionCounters.search) {
      return;
    }
    state.searchPrints = prints;
    renderSearchDetails();
    setStatus(`Karte geladen: ${card.name}`, "ok");
  } catch (error) {
    if (requestId !== selectionCounters.search) {
      return;
    }
    state.searchPrints = [];
    renderSearchDetails();
    setStatus(`Versionshistorie konnte nicht geladen werden: ${error.message}`, "err");
  }
}

async function selectCollectionCard(card) {
  const requestId = ++selectionCounters.collection;

  state.collectionSelection = card;
  state.collectionFaceIndex = 0;
  state.collectionPrints = [];
  closeVersionModal();
  updateCollectionPreview(card);
  renderCollection();
  renderCollectionDetails();
  openCollectionModal();
  setStatus(`Lade Versionshistorie für ${card.name}...`, "muted");

  try {
    const prints = await loadPrintHistory(card);
    if (requestId !== selectionCounters.collection) {
      return;
    }
    state.collectionPrints = prints;
    renderCollectionDetails();
    setStatus(`Collection-Karte geladen: ${card.name}`, "ok");
  } catch (error) {
    if (requestId !== selectionCounters.collection) {
      return;
    }
    state.collectionPrints = [];
    renderCollectionDetails();
    setStatus(`Versionshistorie konnte nicht geladen werden: ${error.message}`, "err");
  }
}

async function runSearch() {
  const query = els.searchInput.value.trim();
  if (!query) {
    setStatus("Bitte einen Suchbegriff eingeben.", "err");
    return;
  }

  setStatus(`Suche nach ${query}...`, "muted");
  try {
    const result = await searchCardsWithTolerance(query);
    state.results = result.cards;
    renderResults();

    if (state.results.length) {
      if (result.mode === "fuzzy" || result.mode === "autocomplete") {
        setStatus(`Kein exakter Treffer. Zeige ähnlichen Treffer: ${result.correctedName}`, "ok");
      } else {
        setStatus(`${state.results.length} Treffer gefunden.`, "ok");
      }
    } else {
      state.searchSelection = null;
      state.searchPrints = [];
      renderSearchDetails();
      setStatus("Keine Treffer gefunden.", "err");
    }
  } catch (error) {
    state.results = [];
    state.searchSelection = null;
    state.searchPrints = [];
    renderResults();
    renderSearchDetails();
    setStatus(`Fehler bei der Suche: ${error.message}`, "err");
  }
}

async function loadRandomCard() {
  openSearchRoute();
  setStatus("Ziehe Zufallskarte...", "muted");

  try {
    const card = await fetchRandomCard();
    state.results = [card];
    renderResults();
    await selectSearchCard(card);
    setStatus(`Zufallskarte geladen: ${card.name}`, "ok");
  } catch (error) {
    setStatus(`Zufallskarte konnte nicht geladen werden: ${error.message}`, "err");
  }
}

// is:commander deckt bei Scryfall genau die Karten ab, die Commander
// sein dürfen: legendäre Kreaturen und die Planeswalker und Karten, die
// es ausdrücklich erlauben.
async function loadRandomCommander() {
  openSearchRoute();
  setStatus("Ziehe zufälligen Commander...", "muted");

  try {
    const card = await fetchRandomCard("is:commander");
    state.results = [card];
    renderResults();
    await selectSearchCard(card);
    setStatus(`Zufälliger Commander: ${card.name}`, "ok");
  } catch (error) {
    setStatus(`Commander konnte nicht geladen werden: ${error.message}`, "err");
  }
}

// Wie loadRandomCommander, aber ohne die Detailansicht aufzureissen:
// Die Karte landet nur in der Trefferliste.
async function searchRandomCommander() {
  openSearchRoute();
  setStatus("Ziehe zufälligen Commander...", "muted");

  try {
    const card = await fetchRandomCard("is:commander");
    state.results = [card];
    state.searchSelection = null;
    state.searchPrints = [];
    renderResults();
    renderSearchDetails();
    setStatus(`Zufälliger Commander: ${card.name}`, "ok");
  } catch (error) {
    setStatus(`Commander konnte nicht geladen werden: ${error.message}`, "err");
  }
}

function bindQueryButtons() {
  els.queryButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const query = button.dataset.query || "";
      els.searchInput.value = query;
      openSearchRoute();

      if (button.dataset.autorun === "true") {
        await runSearch();
      }
    });
  });
}

function bindRandomButtons() {
  els.randomButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await loadRandomCard();
    });
  });
}

els.searchBtn.addEventListener("click", runSearch);
els.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    runSearch();
  }
});

window.addEventListener("hashchange", renderRoute);
// Escape schliesst zuerst nur das Versionsfenster, damit man nicht aus
// der Detailansicht fliegt, bloss weil man die Auswahl wegklicken will.
window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  if (state.versionModalContext) {
    closeVersionModal();
    return;
  }
  closeDeckCardModal();
  closeSearchModal();
  closeCollectionModal();
});

if (els.modalCloseBtn) {
  els.modalCloseBtn.addEventListener("click", closeSearchModal);
}

if (els.searchModal) {
  els.searchModal.addEventListener("click", (event) => {
    if (event.target === els.searchModal) {
      closeSearchModal();
    }
  });
}

if (els.deckCardModalCloseBtn) {
  els.deckCardModalCloseBtn.addEventListener("click", closeDeckCardModal);
}

if (els.deckCardModal) {
  els.deckCardModal.addEventListener("click", (event) => {
    if (event.target === els.deckCardModal) {
      closeDeckCardModal();
    }
  });
}

if (els.versionModalCloseBtn) {
  els.versionModalCloseBtn.addEventListener("click", closeVersionModal);
}

if (els.versionModal) {
  els.versionModal.addEventListener("click", (event) => {
    if (event.target === els.versionModal) {
      closeVersionModal();
    }
  });
}

if (els.collectionModalCloseBtn) {
  els.collectionModalCloseBtn.addEventListener("click", closeCollectionModal);
}

if (els.collectionModal) {
  els.collectionModal.addEventListener("click", (event) => {
    if (event.target === els.collectionModal) {
      closeCollectionModal();
    }
  });
}

function setDeckStatus(text, type = "muted") {
  if (!els.deckStatus) {
    return;
  }
  els.deckStatus.textContent = text;
  els.deckStatus.className = `status ${type}`;
}

// Karten, von denen ein Deck beliebig viele haben darf. Das sind
// Standardländer und die Relentless-Karten. Statt dafür pro Karte den
// Scryfall-Tag abzufragen, wird der Regeltext geprüft: Genau diese
// Karten tragen den Satz "A deck can have any number of cards named".
// Das spart eine Anfrage je Karte und funktioniert auch offline.
function allowsAnyNumber(card) {
  const type = card.type_line || "";
  if (/\bBasic\b/i.test(type) && /\bLand\b/i.test(type)) {
    return true;
  }

  const text = [card.oracle_text, ...(card.card_faces || []).map((face) => face.oracle_text)]
    .filter(Boolean)
    .join(" ");
  return /any number of cards named/i.test(text);
}

// Commander darf sein: jede legendäre Kreatur, dazu Karten, die es
// ausdrücklich erlauben. Das betrifft vor allem Planeswalker wie
// Commodore Guff, die keine Kreaturen sind.
function canBeCommander(card) {
  const text = [card.oracle_text, ...(card.card_faces || []).map((face) => face.oracle_text)]
    .filter(Boolean)
    .join(" ");
  if (/can be your commander/i.test(text)) {
    return true;
  }

  const type = card.type_line || "";
  return /Legendary/i.test(type) && /Creature/i.test(type);
}

function getCardArtUrl(card) {
  return card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop || null;
}

function deckCardFromScryfall(card) {
  return {
    id: card.id,
    name: card.name,
    set_name: card.set_name ?? null,
    image: getCardPreviewUrl(card) || card.image || null,
    unlimited: allowsAnyNumber(card)
  };
}

function renderDeckList() {
  const decks = state.decks;
  els.deckCount.textContent = `${decks.length} ${decks.length === 1 ? "deck" : "decks"}`;

  if (!decks.length) {
    els.deckList.innerHTML = `<div class="empty-state">Noch keine Decks. Gib oben einen Namen ein und leg los.</div>`;
    return;
  }

  const bild = (deck) =>
    deck.commander?.art || deck.commander?.image
      ? `<img class="${deck.commander.art ? "" : "is-full-card"}" src="${escapeHtml(
          deck.commander.art || deck.commander.image
        )}" alt="Artwork von ${escapeHtml(deck.commander.name || "")}" loading="lazy" />`
      : `<span class="deck-tile-empty">Kein Commander gewählt</span>`;

  els.deckList.innerHTML = decks
    .map((deck) => {
      const info = `${t(deck.cardCount === 1 ? "{count} Karte" : "{count} Karten", {
        count: deck.cardCount
      })}${deck.commander ? ` · ${escapeHtml(deck.commander.name)}` : ""}`;

      // Beim Umbenennen tritt an die Stelle des Namens ein Eingabefeld.
      // Der Öffnen-Knopf entfällt so lange, damit ein Klick ins Feld
      // nicht das Deck aufmacht.
      if (state.renamingDeckId === deck.id) {
        return `
          <div class="deck-tile is-renaming">
            <span class="deck-tile-open">${bild(deck)}</span>
            <span class="deck-tile-body">
              <input class="deck-rename-input" type="text" maxlength="80" value="${escapeHtml(deck.name)}" aria-label="Deckname" />
              <span>${info}</span>
            </span>
          </div>
        `;
      }

      return `
        <div class="deck-tile">
          <button type="button" class="deck-tile-open" data-deck="${escapeHtml(deck.id)}" title="${escapeHtml(deck.name)} öffnen">
            ${bild(deck)}
            <span class="deck-tile-body">
              <strong>${escapeHtml(deck.name)}</strong>
              <span>${info}</span>
            </span>
          </button>
          <button type="button" class="deck-tile-rename" data-rename="${escapeHtml(deck.id)}" title="Deck umbenennen" aria-label="${escapeHtml(deck.name)} umbenennen">✎</button>
        </div>
      `;
    })
    .join("");

  for (const tile of els.deckList.querySelectorAll("button[data-deck]")) {
    tile.addEventListener("click", () => openDeck(tile.dataset.deck));
  }

  for (const btn of els.deckList.querySelectorAll("button[data-rename]")) {
    btn.addEventListener("click", () => {
      state.renamingDeckId = btn.dataset.rename;
      renderDeckList();
    });
  }

  const input = els.deckList.querySelector(".deck-rename-input");
  if (input) {
    bindRenameInput(input);
  }
}

function bindRenameInput(input) {
  const deckId = state.renamingDeckId;
  let erledigt = false;

  input.focus();
  input.select();

  const abbrechen = () => {
    if (erledigt) {
      return;
    }
    erledigt = true;
    state.renamingDeckId = null;
    renderDeckList();
  };

  const speichern = async () => {
    if (erledigt) {
      return;
    }
    erledigt = true;

    const name = input.value.trim();
    state.renamingDeckId = null;

    if (!name || name === state.decks.find((deck) => deck.id === deckId)?.name) {
      renderDeckList();
      return;
    }

    try {
      await deckStore.update(deckId, { name });
      await refreshDecks();
      setDeckStatus(`Deck heisst jetzt "${name}".`, "ok");
    } catch (error) {
      renderDeckList();
      setDeckStatus(error.message, "err");
    }
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      speichern();
    } else if (event.key === "Escape") {
      event.preventDefault();
      abbrechen();
    }
  });
  input.addEventListener("blur", speichern);
}

async function refreshDecks() {
  try {
    state.decks = await deckStore.list();
    renderDeckList();
  } catch (error) {
    setDeckStatus(`Decks konnten nicht geladen werden: ${error.message}`, "err");
  }
}

function showDeckOverview() {
  state.activeDeck = null;
  state.activeDeckCards = [];
  els.deckOverview.hidden = false;
  els.deckEditor.hidden = true;
  renderDeckList();
}

function renderCommanderSlot() {
  const commander = state.activeDeck?.commander;

  els.commanderSlot.innerHTML = `
    ${
      commander?.image
        ? `<button type="button" class="deck-card-thumb" id="commanderVersionBtn" title="Version von ${escapeHtml(
            commander.name || "Commander"
          )} wechseln" aria-label="Version des Commanders wechseln"><img src="${escapeHtml(
            commander.image
          )}" alt="${escapeHtml(commander.name || "Commander")}" /></button>`
        : `<span class="commander-empty">?</span>`
    }
    <div>
      <span class="field-label">Commander</span>
      <strong>${commander ? escapeHtml(commander.name) : "Noch keiner gewählt"}</strong>
      <p class="small-note">${
        commander
          ? "Sein Bild steht in der Übersicht für dieses Deck."
          : "Mit dem Stern bei einer Karte im Deck festlegen."
      }</p>
      ${
        commander
          ? `<div class="button-row">
               <button type="button" id="demoteCommanderBtn" class="retro-button commander-star" title="${t("Als Commander entfernen")}" aria-label="${t("Als Commander entfernen")}">★</button>
               <button type="button" id="removeCommanderBtn" class="retro-button">Karte entfernen</button>
             </div>`
          : ""
      }
    </div>
  `;

  const demoteBtn = els.commanderSlot.querySelector("#demoteCommanderBtn");
  if (demoteBtn) {
    demoteBtn.addEventListener("click", demoteCommander);
  }

  const removeBtn = els.commanderSlot.querySelector("#removeCommanderBtn");
  if (removeBtn) {
    removeBtn.addEventListener("click", removeCommanderCard);
  }

  const versionBtn = els.commanderSlot.querySelector("#commanderVersionBtn");
  if (versionBtn) {
    versionBtn.addEventListener("click", () => openCommanderVersionPicker(commander));
  }
}

// Den Commander abzusetzen darf die Karte nicht aus dem Deck werfen.
// Sie wandert zurück in die Kartenliste, denn beim Ernennen war sie von
// dort gekommen.
async function demoteCommander() {
  const commander = state.activeDeck?.commander;
  if (!commander) {
    return;
  }

  setDeckStatus(`Setze ${commander.name} als Commander ab...`, "muted");

  // Die volle Karte liefert Set und Relentless-Eigenschaft für die
  // Deckzeile. Ohne Netz geht es auch mit dem, was am Deck steht.
  let entry = {
    id: commander.id,
    name: commander.name,
    set_name: null,
    image: commander.image ?? null,
    unlimited: false
  };
  try {
    entry = deckCardFromScryfall(
      await fetchJson(`https://api.scryfall.com/cards/${encodeURIComponent(commander.id)}`)
    );
  } catch {
    // Rückfall auf die gespeicherten Angaben.
  }

  try {
    await deckStore.putCard(state.activeDeck.id, entry, 1);
    applyDeckResult(await deckStore.update(state.activeDeck.id, { commander: null }));
    await refreshDecks();
    setDeckStatus(t("{name} steht wieder als Karte im Deck.", { name: commander.name }), "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

// Nimmt die Karte ganz aus dem Deck, im Gegensatz zum Stern, der sie
// nur vom Commander-Platz zurück in die Liste schiebt.
async function removeCommanderCard() {
  const commander = state.activeDeck?.commander;
  if (!commander) {
    return;
  }

  try {
    applyDeckResult(await deckStore.update(state.activeDeck.id, { commander: null }));
    await refreshDecks();
    setDeckStatus(t("{name} aus dem Deck entfernt.", { name: commander.name }), "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function openCommanderVersionPicker(commander) {
  if (!commander) {
    return;
  }

  setDeckStatus(`Lade Versionen von ${commander.name}...`, "muted");
  try {
    const full = await fetchJson(`https://api.scryfall.com/cards/${encodeURIComponent(commander.id)}`);
    const prints = await loadPrintHistory(full);
    if (prints.length < 2) {
      setDeckStatus(`Von ${commander.name} gibt es nur diesen einen Print.`, "muted");
      return;
    }
    state.searchPrints = prints;
    state.searchSelection = full;
    openVersionModal("commander");
    setDeckStatus(`${prints.length} Versionen von ${commander.name}.`, "ok");
  } catch (error) {
    setDeckStatus(`Versionen konnten nicht geladen werden: ${error.message}`, "err");
  }
}

// Beim Commander wird kein Eintrag getauscht, sondern das Deck
// aktualisiert. Das Artwork muss dabei mitwandern, sonst zeigt die
// Übersicht weiter das Bild der alten Ausgabe.
async function applyCommanderVersion(print) {
  await setCommander({
    id: print.id,
    name: print.name,
    image: getCardPreviewUrl(print),
    art: getCardArtUrl(print)
  });
}

function renderDeckCards() {
  const cards = state.activeDeckCards;
  const singleton = (state.activeDeck?.format || "commander") === "commander";
  // Der Commander zählt als Karte des Decks mit.
  const total =
    cards.reduce((sum, card) => sum + card.quantity, 0) + (state.activeDeck?.commander ? 1 : 0);
  els.deckTotal.textContent = t(total === 1 ? "{count} Karte" : "{count} Karten", { count: total });

  if (!cards.length) {
    els.deckCards.innerHTML = `<div class="empty-state">Noch keine Karten. Such links eine oder nutze Quick Add.</div>`;
    return;
  }

  els.deckCards.innerHTML = cards
    .map(
      (card) => `
        <div class="deck-card-row">
          <button type="button" class="deck-card-thumb" data-version="${escapeHtml(card.id)}" title="Version von ${escapeHtml(card.name)} wechseln" aria-label="Version von ${escapeHtml(card.name)} wechseln">
            ${
              card.image
                ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
                : `<span class="deck-card-thumb-empty">?</span>`
            }
          </button>
          <span class="deck-card-name">
            <strong>${escapeHtml(card.name)}</strong>
            <span>${escapeHtml(card.set_name || "?")}</span>
          </span>
          <span class="deck-card-actions">
            <button type="button" data-less="${escapeHtml(card.id)}" title="Eine weniger" aria-label="Eine weniger">-</button>
            <span class="quantity">${card.quantity}</span>
            <button type="button" data-more="${escapeHtml(card.id)}" title="${
              singleton && !card.unlimited
                ? "Im Commander ist nur ein Exemplar erlaubt"
                : "Eine mehr"
            }" aria-label="Eine mehr"${singleton && !card.unlimited ? " disabled" : ""}>+</button>
            <button type="button" data-commander="${escapeHtml(card.id)}" title="Als Commander festlegen" aria-label="Als Commander festlegen">★</button>
            <button type="button" data-remove="${escapeHtml(card.id)}" title="Aus dem Deck entfernen" aria-label="Entfernen">X</button>
          </span>
        </div>
      `
    )
    .join("");

  const find = (id) => state.activeDeckCards.find((card) => card.id === id);

  for (const btn of els.deckCards.querySelectorAll("button[data-more]")) {
    btn.addEventListener("click", () => {
      const card = find(btn.dataset.more);
      if (card) changeDeckQuantity(card, card.quantity + 1);
    });
  }
  for (const btn of els.deckCards.querySelectorAll("button[data-less]")) {
    btn.addEventListener("click", () => {
      const card = find(btn.dataset.less);
      if (!card) return;
      // Bei eins bedeutet ein weiteres Minus: raus aus dem Deck.
      if (card.quantity <= 1) removeDeckCard(card.id);
      else changeDeckQuantity(card, card.quantity - 1);
    });
  }
  for (const btn of els.deckCards.querySelectorAll("button[data-remove]")) {
    btn.addEventListener("click", () => removeDeckCard(btn.dataset.remove));
  }
  for (const btn of els.deckCards.querySelectorAll("button[data-commander]")) {
    btn.addEventListener("click", () => {
      const card = find(btn.dataset.commander);
      if (card) setCommanderFromDeckCard(card);
    });
  }
  // Auch bei Karten, die schon im Deck liegen, führt der Klick aufs Bild
  // in dieselbe Detailansicht wie bei den Suchtreffern.
  for (const btn of els.deckCards.querySelectorAll("button[data-version]")) {
    btn.addEventListener("click", async () => {
      const card = find(btn.dataset.version);
      if (!card) {
        return;
      }
      setDeckStatus(`Lade ${card.name}...`, "muted");
      try {
        await selectDeckSearchCard(
          await fetchJson(`https://api.scryfall.com/cards/${encodeURIComponent(card.id)}`)
        );
      } catch (error) {
        setDeckStatus(`Karte konnte nicht geladen werden: ${error.message}`, "err");
      }
    });
  }
}

// Tauscht die Ausgabe einer Karte im Deck. Die Menge bleibt erhalten.
async function applyDeckVersion(print) {
  const previous = state.deckVersionCard;
  if (!previous || !state.activeDeck) {
    return;
  }

  try {
    const entry = deckCardFromScryfall(print);
    await deckStore.putCard(state.activeDeck.id, entry, previous.quantity);
    if (previous.id !== entry.id) {
      applyDeckResult(await deckStore.removeCard(state.activeDeck.id, previous.id));
    } else {
      applyDeckResult(await deckStore.get(state.activeDeck.id));
    }
    setDeckStatus(`${entry.name}: Version ${print.set_name || "gewechselt"}.`, "ok");
  } catch (error) {
    setDeckStatus(`Version konnte nicht gewechselt werden: ${error.message}`, "err");
  }
}

async function setCommanderFromDeckCard(card) {
  // Für das Artwork in der Übersicht wird die vollständige Karte
  // gebraucht, die Deckzeile kennt nur das normale Bild.
  try {
    const full = await fetchJson(`https://api.scryfall.com/cards/${encodeURIComponent(card.id)}`);
    await setCommander({ ...card, art: getCardArtUrl(full) });
  } catch {
    await setCommander(card);
  }
}

const commanderCardCache = new Map();

async function loadCommanderCard(id) {
  if (!commanderCardCache.has(id)) {
    commanderCardCache.set(
      id,
      fetchJson(`https://api.scryfall.com/cards/${encodeURIComponent(id)}`).catch((error) => {
        commanderCardCache.delete(id);
        throw error;
      })
    );
  }
  return commanderCardCache.get(id);
}

const DEFAULT_DECK_QUERIES = [
  { query: "t:legendary t:creature", label: "legendary creature" },
  { query: "c:g t:creature mv<=3", label: "grün, klein" },
  { query: 'o:"draw a card"', label: "draw a card" }
];

function renderDeckQueries(entries, note) {
  els.deckQueryBank.innerHTML = entries
    .map(
      (entry) =>
        `<button type="button" class="query-pill" data-deck-query="${escapeHtml(entry.query)}" title="${escapeHtml(
          entry.query
        )}">${escapeHtml(entry.label)}</button>`
    )
    .join("");

  for (const button of els.deckQueryBank.querySelectorAll("[data-deck-query]")) {
    button.addEventListener("click", () => {
      els.deckSearchInput.value = button.dataset.deckQuery || "";
      runDeckSearch();
    });
  }

  if (els.deckQueryNote) {
    els.deckQueryNote.textContent = note;
  }
}

// Die Vorschläge richten sich nach dem Commander: Ein Deck darf nur
// Karten seiner Farbidentität enthalten, deshalb steckt id<= in jeder
// Abfrage. Dazu kommt sein Kreaturentyp als Stammes-Vorschlag.
async function updateDeckQueries() {
  const commander = state.activeDeck?.commander;

  if (!commander) {
    state.commanderCard = null;
    renderDeckQueries(DEFAULT_DECK_QUERIES, "Klick auf eine Karte öffnet ihre Details. Mit einem Commander passen sich die Vorschläge an.");
    return;
  }

  try {
    const card = await loadCommanderCard(commander.id);
    state.commanderCard = card;

    const letters = (card.color_identity || []).join("").toLowerCase();
    const identity = letters ? `id<=${letters}` : "id:colorless";
    const label = letters ? letters.toUpperCase() : "farblos";

    const entries = [
      { query: `${identity} t:creature`, label: `Kreaturen ${label}` },
      { query: `${identity} t:instant or ${identity} t:sorcery`, label: `Spells ${label}` },
      { query: `${identity} o:"draw a card"`, label: "Kartenziehen" },
      { query: `${identity} o:"add {c}" t:land`, label: "Länder" }
    ];

    // Kreaturentypen stehen hinter dem Gedankenstrich der Typzeile.
    const subtypes = (card.type_line || "").split("—")[1]?.trim().split(/\s+/) || [];
    if (subtypes.length) {
      entries.splice(1, 0, { query: `${identity} t:${subtypes[0].toLowerCase()}`, label: subtypes[0] });
    }

    renderDeckQueries(entries, `Vorschläge passend zu ${commander.name} (${label}).`);
  } catch {
    renderDeckQueries(DEFAULT_DECK_QUERIES, "Klick auf eine Karte öffnet ihre Details.");
  }
}

function renderDeckEditor() {
  if (!state.activeDeck) {
    return;
  }
  els.deckNameInput.value = state.activeDeck.name;
  renderCommanderSlot();
  renderDeckCards();
  updateDeckQueries();
}

function applyDeckResult(result) {
  state.activeDeck = result.deck;
  state.activeDeckCards = result.cards || [];
  renderDeckEditor();
}

async function openDeck(deckId) {
  setDeckStatus("Lade Deck...", "muted");
  try {
    const result = await deckStore.get(deckId);
    applyDeckResult(result);
    els.deckOverview.hidden = true;
    els.deckEditor.hidden = false;
    setDeckStatus(`Deck geöffnet: ${result.deck.name}`, "ok");
  } catch (error) {
    setDeckStatus(`Deck konnte nicht geöffnet werden: ${error.message}`, "err");
  }
}

async function createDeck() {
  const name = els.newDeckName.value.trim();
  const format = els.newDeckFormat.value || "commander";
  setDeckStatus("Lege Deck an...", "muted");
  try {
    const deck = await deckStore.create(name, format);
    els.newDeckName.value = "";
    await refreshDecks();
    setDeckStatus(`Deck "${deck.name}" angelegt.`, "ok");
    await openDeck(deck.id);
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function renameDeck() {
  if (!state.activeDeck) return;
  const name = els.deckNameInput.value.trim();
  try {
    applyDeckResult(await deckStore.update(state.activeDeck.id, { name }));
    await refreshDecks();
    setDeckStatus("Deckname gespeichert.", "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function deleteDeck() {
  if (!state.activeDeck) return;
  const name = state.activeDeck.name;
  if (!window.confirm(`Deck "${name}" wirklich löschen? Das lässt sich nicht rückgängig machen.`)) {
    return;
  }
  try {
    await deckStore.remove(state.activeDeck.id);
    showDeckOverview();
    await refreshDecks();
    setDeckStatus(`Deck "${name}" gelöscht.`, "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function addCardToDeck(card, quantity = 1) {
  if (!state.activeDeck) return;
  try {
    applyDeckResult(await deckStore.putCard(state.activeDeck.id, deckCardFromScryfall(card), quantity));
    setDeckStatus(`${card.name} ins Deck gelegt.`, "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function changeDeckQuantity(card, quantity) {
  try {
    applyDeckResult(await deckStore.putCard(state.activeDeck.id, card, quantity));
    setDeckStatus(`${card.name}: ${quantity}x`, "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function removeDeckCard(cardId) {
  try {
    applyDeckResult(await deckStore.removeCard(state.activeDeck.id, cardId));
    setDeckStatus("Karte entfernt.", "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function setCommander(card) {
  if (!state.activeDeck) return;
  try {
    const commander = card
      ? { id: card.id, name: card.name, image: card.image ?? null, art: card.art ?? null }
      : null;
    applyDeckResult(await deckStore.update(state.activeDeck.id, { commander }));
    await refreshDecks();
    setDeckStatus(card ? `${card.name} ist jetzt Commander.` : "Commander entfernt.", "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

// Format wie bei Moxfield und Arena: eine Karte pro Zeile, davor die
// Anzahl. Set-Angaben in Klammern und Kommentarzeilen werden überlesen.
function parseDeckList(text) {
  const entries = [];

  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("//") || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^(?:(\d+)\s*[xX]?\s+)?(.+)$/);
    if (!match) {
      continue;
    }

    const name = match[2]
      .replace(/\s*\([^)]*\)\s*[\w-]*\s*$/, "")
      .replace(/\s*\*[^*]*\*\s*$/, "")
      .trim();

    if (name) {
      entries.push({ name, quantity: Math.min(Math.max(Number(match[1]) || 1, 1), 99) });
    }
  }

  return entries;
}

function openModal(element) {
  element.classList.add("open");
  element.setAttribute("aria-hidden", "false");
}

function closeModal(element) {
  element.classList.remove("open");
  element.setAttribute("aria-hidden", "true");
}

function openImportModal() {
  openModal(els.importModal);
  els.deckImportName.focus();
}

function openExportModal() {
  exportDeckList();
  openModal(els.exportModal);
}

function exportDeckList() {
  if (!state.activeDeck) {
    return;
  }

  const lines = [];
  if (state.activeDeck.commander) {
    lines.push(`1 ${state.activeDeck.commander.name}`);
  }
  for (const card of state.activeDeckCards) {
    lines.push(`${card.quantity} ${card.name}`);
  }

  els.deckListText.value = lines.join("\n");
  setDeckStatus(t("{count} Zeilen exportiert.", { count: lines.length }), "ok");
}

async function copyDeckList() {
  if (!els.deckListText.value.trim()) {
    exportDeckList();
  }
  try {
    await navigator.clipboard.writeText(els.deckListText.value);
    setDeckStatus("Liste in die Zwischenablage kopiert.", "ok");
  } catch {
    setDeckStatus("Kopieren hat nicht geklappt, bitte von Hand markieren.", "err");
  }
}

// Scryfall nimmt bis zu 75 Karten je Anfrage entgegen. Das ist deutlich
// schonender, als jede Zeile einzeln abzufragen.
async function lookupCardsByName(names) {
  const found = new Map();
  const missing = [];

  for (let i = 0; i < names.length; i += 75) {
    const chunk = names.slice(i, i + 75);
    const response = await scryfallFetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: chunk.map((name) => ({ name })) })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    for (const card of data.data || []) {
      found.set(card.name.toLowerCase(), card);
      // Bei doppelseitigen Karten steht in der Liste oft nur die
      // Vorderseite.
      const front = card.name.split("//")[0].trim().toLowerCase();
      if (!found.has(front)) {
        found.set(front, card);
      }
    }
    for (const entry of data.not_found || []) {
      missing.push(entry.name);
    }
  }

  return { found, missing };
}

async function importDeckList(text) {
  if (!state.activeDeck) {
    return;
  }

  const entries = parseDeckList(text);
  if (!entries.length) {
    setDeckStatus("Die Liste ist leer.", "err");
    return;
  }

  setDeckStatus(`Suche ${entries.length} Karten...`, "muted");

  let found;
  let missing;
  try {
    ({ found, missing } = await lookupCardsByName(entries.map((entry) => entry.name)));
  } catch (error) {
    setDeckStatus(`Import fehlgeschlagen: ${error.message}`, "err");
    return;
  }

  // Was Scryfall exakt nicht kennt, bekommt eine zweite Chance mit
  // toleranter Suche - so überleben kleine Tippfehler.
  const stillMissing = [];
  for (const name of missing) {
    try {
      const card = await fetchJson(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
      found.set(name.toLowerCase(), card);
    } catch {
      stillMissing.push(name);
    }
  }

  let added = 0;
  let commanderSet = false;

  for (const entry of entries) {
    const card = found.get(entry.name.toLowerCase());
    if (!card) {
      continue;
    }

    // Die erste legendäre Kreatur wird Commander, sofern noch keiner
    // gewählt ist. Damit lässt sich ein exportiertes Deck unverändert
    // wieder einlesen.
    if (!commanderSet && !state.activeDeck.commander && canBeCommander(card)) {
      await setCommander({
        id: card.id,
        name: card.name,
        image: getCardPreviewUrl(card),
        art: getCardArtUrl(card)
      });
      commanderSet = true;
      added += 1;
      continue;
    }

    try {
      applyDeckResult(
        await deckStore.putCard(state.activeDeck.id, deckCardFromScryfall(card), entry.quantity)
      );
      added += 1;
    } catch {
      stillMissing.push(entry.name);
    }
  }

  await refreshDecks();

  const problem = stillMissing.length ? ` Nicht gefunden: ${stillMissing.join(", ")}.` : "";
  setDeckStatus(`${added} von ${entries.length} Karten übernommen.${problem}`, stillMissing.length ? "err" : "ok");
  return { added, total: entries.length, missing: stillMissing };
}

// Import läuft in der Übersicht und legt immer ein neues Deck an.
async function importDeckAsNew() {
  const text = els.deckImportText.value;
  const entries = parseDeckList(text);

  if (!entries.length) {
    setDeckStatus("Die Liste ist leer.", "err");
    return;
  }

  const wunschname = els.deckImportName.value.trim();
  setDeckStatus(`Lege Deck an und lese ${entries.length} Zeilen...`, "muted");

  try {
    const deck = await deckStore.create(wunschname || "Importiertes Deck");
    await openDeck(deck.id);
    const result = await importDeckList(text);

    // Ohne eigenen Namen bekommt das Deck den seines Commanders, das ist
    // brauchbarer als "Importiertes Deck".
    if (!wunschname && state.activeDeck?.commander) {
      applyDeckResult(
        await deckStore.update(state.activeDeck.id, { name: state.activeDeck.commander.name })
      );
      await refreshDecks();
    }

    els.deckImportText.value = "";
    els.deckImportName.value = "";
    closeModal(els.importModal);

    const problem = result?.missing.length ? ` Nicht gefunden: ${result.missing.join(", ")}.` : "";
    setDeckStatus(
      `Deck "${state.activeDeck.name}" angelegt, ${result?.added ?? 0} von ${entries.length} Karten übernommen.${problem}`,
      result?.missing.length ? "err" : "ok"
    );
  } catch (error) {
    setDeckStatus(`Import fehlgeschlagen: ${error.message}`, "err");
  }
}

function renderDeckCardDetails() {
  els.deckCardDetails.innerHTML = createDetailsHtml(state.deckSelection, state.deckPrints, "deck");
  bindDetailsEvents(els.deckCardDetails, "deck");
}

function openDeckCardModal() {
  els.deckCardModal.classList.add("open");
  els.deckCardModal.setAttribute("aria-hidden", "false");
}

function closeDeckCardModal() {
  els.deckCardModal.classList.remove("open");
  els.deckCardModal.setAttribute("aria-hidden", "true");
}

// Dieselbe Detailansicht wie in der Collection, nur legt der Knopf die
// Karte ins Deck statt in die Collection.
async function selectDeckSearchCard(card) {
  const requestId = ++selectionCounters.deck;

  state.deckSelection = card;
  state.deckFaceIndex = 0;
  state.deckPrints = [];
  renderDeckCardDetails();
  openDeckCardModal();
  setDeckStatus(`Lade Versionshistorie für ${card.name}...`, "muted");

  try {
    const prints = await loadPrintHistory(card);
    if (requestId !== selectionCounters.deck) {
      return;
    }
    state.deckPrints = prints;
    renderDeckCardDetails();
    setDeckStatus(`Karte geladen: ${card.name}`, "ok");
  } catch (error) {
    if (requestId !== selectionCounters.deck) {
      return;
    }
    renderDeckCardDetails();
    setDeckStatus(`Versionshistorie konnte nicht geladen werden: ${error.message}`, "err");
  }
}

function renderDeckSearchResults() {
  const results = state.deckResults;
  els.deckSearchCount.textContent = `${results.length} ${results.length === 1 ? "card" : "cards"}`;

  if (!results.length) {
    els.deckSearchResults.innerHTML = `<div class="empty-state">Noch keine Treffer.</div>`;
    return;
  }

  els.deckSearchResults.innerHTML = `
    <div class="search-grid">
      ${results
        .map((card) => {
          const preview = getCardPreviewUrl(card);
          return `
            <button type="button" class="search-tile" data-add="${escapeHtml(card.id)}" title="Details zu ${escapeHtml(card.name)}">
              <span class="tile-frame">
                ${
                  preview
                    ? `<img src="${escapeHtml(preview)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
                    : `<span class="search-fallback">${escapeHtml(card.name)}</span>`
                }
              </span>
              <span class="tile-caption">${escapeHtml(card.name)}</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;

  for (const tile of els.deckSearchResults.querySelectorAll("button[data-add]")) {
    tile.addEventListener("click", () => {
      const card = state.deckResults.find((entry) => entry.id === tile.dataset.add);
      if (card) selectDeckSearchCard(card);
    });
  }
}

async function runDeckSearch() {
  const query = els.deckSearchInput.value.trim();
  if (!query) {
    setDeckStatus("Bitte einen Suchbegriff eingeben.", "err");
    return;
  }

  setDeckStatus(`Suche nach ${query}...`, "muted");
  try {
    const result = await searchCardsWithTolerance(query);
    state.deckResults = result.cards;
    renderDeckSearchResults();
    setDeckStatus(
      state.deckResults.length ? `${state.deckResults.length} Treffer.` : "Keine Treffer gefunden.",
      state.deckResults.length ? "ok" : "err"
    );
  } catch (error) {
    state.deckResults = [];
    renderDeckSearchResults();
    setDeckStatus(`Fehler bei der Suche: ${error.message}`, "err");
  }
}

// Quick Add nimmt den besten Treffer zum Namen, damit man eine Karte
// eintippen kann, ohne den Umweg über die Suchergebnisse.
async function quickAdd() {
  const name = els.quickAddInput.value.trim();
  if (!name) {
    setDeckStatus("Bitte einen Kartennamen eingeben.", "err");
    return;
  }

  setDeckStatus(`Suche ${name}...`, "muted");
  try {
    const card = await fetchJson(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
    els.quickAddInput.value = "";
    await addCardToDeck(card);
  } catch (error) {
    setDeckStatus(`Keine Karte zu "${name}" gefunden.`, "err");
  }
}

function setAuthStatus(text, type = "muted") {
  if (!els.authStatus) {
    return;
  }
  els.authStatus.textContent = text;
  els.authStatus.className = `status ${type}`;
}

function showAuthTab(name) {
  els.authTabs.forEach((tab) => {
    const active = tab.dataset.authTab === name;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  els.loginForm.hidden = name !== "login";
  els.registerForm.hidden = name !== "register";
  els.recoverForm.hidden = name !== "recover";
}

// Der Code steht nur einmal zur Verfuegung, darum bleibt das Feld
// stehen, bis es aktiv weggeklickt wird.
function showRecoveryCode(code) {
  if (!code || !els.recoveryPanel) {
    return;
  }
  els.recoveryCode.textContent = code;
  els.recoveryPanel.hidden = false;
}

function hideRecoveryCode() {
  if (!els.recoveryPanel) {
    return;
  }
  els.recoveryPanel.hidden = true;
  els.recoveryCode.textContent = "-";
}

function renderAccount() {
  const user = state.user;

  els.accountGuest.hidden = Boolean(user);
  els.accountUser.hidden = !user;
  els.accountPanelTitle.textContent = user ? "profile" : "sign in";
  els.accountFooter.textContent = user
    ? `MTG Remasurium / cloud mode - ${user.displayName}`
    : "MTG Remasurium / local mode";

  if (user) {
    els.profileEmail.textContent = user.email;
    els.profileCreated.textContent = new Date(user.createdAt).toLocaleDateString("de-CH");
    els.profileName.value = user.displayName;
  }

  els.collectionScopeLabel.textContent = user
    ? "Karten in deiner Cloud-Collection"
    : "cards saved locally in your browser";
  els.collectionScopeNote.textContent = user
    ? "Deine Collection liegt auf deinem Konto und ist auf jedem Gerät gleich."
    : "Gespeicherte Karten bleiben nur in diesem Browser. Melde dich an, um sie in der Cloud zu sichern.";
}

// Nach Login oder Registrierung: lokale Karten hochschieben, danach
// gilt der Serverstand.
async function adoptSession(user, { mergeLocal = false } = {}) {
  state.user = user;

  try {
    const local = mergeLocal ? loadCollection() : [];
    const data = local.length ? await api.mergeCollection(local) : await api.getCollection();
    state.collection = data.cards || [];

    if (local.length) {
      localStorage.removeItem("remasurium.collection");
    }
  } catch (error) {
    state.collection = [];
    setAuthStatus(`Collection konnte nicht geladen werden: ${error.message}`, "err");
  }

  // Lokal angelegte Decks wandern beim Login mit hoch.
  try {
    const localDecks = mergeLocal ? deckStore.takeLocalDecks() : [];
    if (localDecks.length) {
      await api.mergeDecks(localDecks);
      deckStore.clearLocal();
    }
  } catch (error) {
    setAuthStatus(`Decks konnten nicht übernommen werden: ${error.message}`, "err");
  }

  showDeckOverview();
  await refreshDecks();
  renderAccount();
  renderCollectionViews();
}

async function handleLogin(event) {
  event.preventDefault();
  const email = els.loginForm.email.value.trim();
  const password = els.loginForm.password.value;

  setAuthStatus("Melde an...", "muted");
  try {
    const data = await api.login(email, password);
    await adoptSession(data.user, { mergeLocal: true });
    els.loginForm.reset();
    setAuthStatus(`Angemeldet als ${data.user.email}.`, "ok");
  } catch (error) {
    setAuthStatus(error.message, "err");
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const email = els.registerForm.email.value.trim();
  const password = els.registerForm.password.value;
  const displayName = els.registerForm.displayName.value.trim();

  setAuthStatus("Erstelle Konto...", "muted");
  try {
    const data = await api.register(email, password, displayName);
    await adoptSession(data.user, { mergeLocal: true });
    els.registerForm.reset();
    showRecoveryCode(data.recoveryCode);
    setAuthStatus(`Konto erstellt. Angemeldet als ${data.user.email}.`, "ok");
  } catch (error) {
    setAuthStatus(error.message, "err");
  }
}

async function handleRecover(event) {
  event.preventDefault();
  const email = els.recoverForm.email.value.trim();
  const code = els.recoverForm.recoveryCode.value.trim();
  const newPassword = els.recoverForm.newPassword.value;

  setAuthStatus("Setze Passwort zurück...", "muted");
  try {
    const data = await api.recover(email, code, newPassword);
    await adoptSession(data.user, { mergeLocal: true });
    els.recoverForm.reset();
    showAuthTab("login");
    showRecoveryCode(data.recoveryCode);
    setAuthStatus("Passwort geändert. Der alte Code ist verbraucht, hier ist der neue.", "ok");
  } catch (error) {
    setAuthStatus(error.message, "err");
  }
}

async function handleNewRecoveryCode() {
  setAuthStatus("Erzeuge neuen Code...", "muted");
  try {
    const data = await api.newRecoveryCode();
    showRecoveryCode(data.recoveryCode);
    setAuthStatus("Neuer Code erzeugt. Der alte gilt nicht mehr.", "ok");
  } catch (error) {
    setAuthStatus(error.message, "err");
  }
}

async function copyRecoveryCode() {
  try {
    await navigator.clipboard.writeText(els.recoveryCode.textContent);
    setAuthStatus("Code in die Zwischenablage kopiert.", "ok");
  } catch {
    setAuthStatus("Kopieren hat nicht geklappt, bitte von Hand abschreiben.", "err");
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  const displayName = els.profileName.value.trim();

  setAuthStatus("Speichere...", "muted");
  try {
    const data = await api.updateProfile(displayName);
    state.user = data.user;
    renderAccount();
    setAuthStatus("Profil gespeichert.", "ok");
  } catch (error) {
    setAuthStatus(error.message, "err");
  }
}

async function handleLogout() {
  setAuthStatus("Melde ab...", "muted");
  try {
    await api.logout();
  } catch {
    // Auch wenn der Server nicht antwortet, lokal abmelden.
  }

  state.user = null;
  state.collection = loadCollection();
  state.collectionSelection = null;
  state.collectionPrints = [];
  closeCollectionModal();

  renderAccount();
  renderCollectionViews();
  showDeckOverview();
  await refreshDecks();
  showAuthTab("login");
  // Keinen Code auf dem Bildschirm stehen lassen.
  hideRecoveryCode();
  setAuthStatus("Abgemeldet. Du siehst wieder die lokale Collection.", "ok");
}

// Laeuft die Seite ohne Worker (z.B. direkt als Datei geoeffnet),
// bleibt es beim lokalen Modus statt einer Fehlermeldung.
async function initAuth() {
  renderAccount();

  try {
    const data = await api.me();
    if (data.user) {
      await adoptSession(data.user);
      setAuthStatus(`Angemeldet als ${data.user.email}.`, "ok");
    }
  } catch {
    setAuthStatus("Offline-Modus: Die Collection bleibt in diesem Browser.", "muted");
  }
}

// Trennlinie zwischen Such- und Deckfenster. Die Breite wird als Anteil
// gespeichert, damit sie beim naechsten Besuch wieder stimmt.
const SPLIT_KEY = "remasurium.deckSplit";
const SPLIT_MIN = 25;
const SPLIT_MAX = 75;

function applyDeckSplit(percent) {
  const clamped = Math.min(Math.max(percent, SPLIT_MIN), SPLIT_MAX);
  els.deckLayout.style.setProperty("--deck-split", `${clamped}%`);
  return clamped;
}

function startSplitDrag(startEvent) {
  startEvent.preventDefault();
  document.body.classList.add("is-splitting");

  const move = (event) => {
    const box = els.deckLayout.getBoundingClientRect();
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - box.left;
    applyDeckSplit((x / box.width) * 100);
  };

  const stop = () => {
    document.body.classList.remove("is-splitting");
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", stop);
    window.removeEventListener("touchmove", move);
    window.removeEventListener("touchend", stop);
    const current = parseFloat(els.deckLayout.style.getPropertyValue("--deck-split")) || 52;
    localStorage.setItem(SPLIT_KEY, String(current));
  };

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", stop);
  window.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", stop);
}

if (els.deckSplitter) {
  els.deckSplitter.addEventListener("mousedown", startSplitDrag);
  els.deckSplitter.addEventListener("touchstart", startSplitDrag, { passive: false });
  // Mit den Pfeiltasten laesst sich die Linie ebenfalls verschieben.
  els.deckSplitter.addEventListener("keydown", (event) => {
    const step = event.key === "ArrowLeft" ? -4 : event.key === "ArrowRight" ? 4 : 0;
    if (!step) {
      return;
    }
    event.preventDefault();
    const current = parseFloat(els.deckLayout.style.getPropertyValue("--deck-split")) || 52;
    localStorage.setItem(SPLIT_KEY, String(applyDeckSplit(current + step)));
  });
  applyDeckSplit(Number(localStorage.getItem(SPLIT_KEY)) || 52);
}

els.createDeckBtn.addEventListener("click", createDeck);
els.newDeckName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") createDeck();
});
els.backToDecksBtn.addEventListener("click", showDeckOverview);
els.deleteDeckBtn.addEventListener("click", deleteDeck);
els.renameDeckBtn.addEventListener("click", renameDeck);
els.deckNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") renameDeck();
});
els.deckSearchBtn.addEventListener("click", runDeckSearch);
els.deckSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") runDeckSearch();
});
els.quickAddBtn.addEventListener("click", quickAdd);
els.quickAddInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") quickAdd();
});
els.deckCopyBtn.addEventListener("click", copyDeckList);
els.deckImportBtn.addEventListener("click", importDeckAsNew);
els.openImportBtn.addEventListener("click", openImportModal);
els.openExportBtn.addEventListener("click", openExportModal);
els.importModalCloseBtn.addEventListener("click", () => closeModal(els.importModal));
els.exportModalCloseBtn.addEventListener("click", () => closeModal(els.exportModal));
for (const modal of [els.importModal, els.exportModal]) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
}
els.randomCommanderBtn.addEventListener("click", loadRandomCommander);
els.randomCommanderPill.addEventListener("click", searchRandomCommander);

// Sprachumschaltung. Der Knopf zeigt die Sprache, in die er wechselt.
function updateLangToggle() {
  els.langToggle.textContent = getLang() === "de" ? "EN" : "DE";
}

els.langToggle.addEventListener("click", () => {
  setLang(getLang() === "de" ? "en" : "de");
  updateLangToggle();
});

els.authTabs.forEach((tab) => {
  tab.addEventListener("click", () => showAuthTab(tab.dataset.authTab));
});
els.loginForm.addEventListener("submit", handleLogin);
els.registerForm.addEventListener("submit", handleRegister);
els.recoverForm.addEventListener("submit", handleRecover);
els.profileForm.addEventListener("submit", handleProfileUpdate);
els.logoutBtn.addEventListener("click", handleLogout);
els.newRecoveryBtn.addEventListener("click", handleNewRecoveryCode);
els.copyRecoveryBtn.addEventListener("click", copyRecoveryCode);
els.dismissRecoveryBtn.addEventListener("click", hideRecoveryCode);

bindQueryButtons();
bindRandomButtons();
showDeckOverview();
renderDeckSearchResults();
renderResults();
renderSearchDetails();
renderCollection();
renderCollectionDetails();
renderRoute();
setStatus("Bereit. Gib einen Suchbegriff ein.", "muted");

// Sprache anwenden, bevor der Rest nachlädt. setLang setzt dabei auch
// das lang-Attribut des Dokuments.
setLang(getLang());
updateLangToggle();
watchForNewContent();

initAuth();
