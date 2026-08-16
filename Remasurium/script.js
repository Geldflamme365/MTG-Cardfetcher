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
  // Blättern in den Suchergebnissen: geladene Karten, aktuelle Seite und
  // die Adresse der nächsten Scryfall-Seite.
  searchPage: 0,
  searchNextUrl: null,
  searchTotal: 0,
  deckSearchPage: 0,
  deckSearchNextUrl: null,
  deckSearchTotal: 0,
  deckProblems: [],
  // Die Karten-Ids aus den Problemen, damit sie im Deck rot umrandet werden.
  deckProblemCards: new Set(),
  deckSearchCollapsed: false,
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
  openFeedbackBtn: document.getElementById("openFeedbackBtn"),
  feedbackModal: document.getElementById("feedbackModal"),
  feedbackModalCloseBtn: document.getElementById("feedbackModalCloseBtn"),
  feedbackForm: document.getElementById("feedbackForm"),
  feedbackStatus: document.getElementById("feedbackStatus"),
  adminReviews: document.getElementById("adminReviews"),
  reviewList: document.getElementById("reviewList"),
  toggleSearchBtn: document.getElementById("toggleSearchBtn"),
  legalityBadge: document.getElementById("legalityBadge"),
  deckStatsSummary: document.getElementById("deckStatsSummary"),
  manaCurve: document.getElementById("manaCurve"),
  manaColors: document.getElementById("manaColors"),
  openLandsBtn: document.getElementById("openLandsBtn"),
  landsModal: document.getElementById("landsModal"),
  landsModalCloseBtn: document.getElementById("landsModalCloseBtn"),
  landsTotal: document.getElementById("landsTotal"),
  landsRecalcBtn: document.getElementById("landsRecalcBtn"),
  landsFacts: document.getElementById("landsFacts"),
  landsSplit: document.getElementById("landsSplit"),
  landsStatus: document.getElementById("landsStatus"),
  landsApplyBtn: document.getElementById("landsApplyBtn"),
  legalityModal: document.getElementById("legalityModal"),
  legalityModalCloseBtn: document.getElementById("legalityModalCloseBtn"),
  legalitySummary: document.getElementById("legalitySummary"),
  legalityList: document.getElementById("legalityList"),
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
    // Der Rückmeldeknopf trägt zwar dieselbe Klasse, führt aber zu
    // keinem Ziel und darf deshalb nie als aktive Seite erscheinen.
    if (!link.getAttribute("href")) {
      continue;
    }
    const target = normalizeRoute(link.getAttribute("href"));
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

  // Der Tab führt immer auf die Übersicht. Ohne das bliebe das zuletzt
  // geöffnete Deck stehen, obwohl man den Menüpunkt angeklickt hat.
  if (route === "decks") {
    showDeckOverview();
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

// Scryfall liefert je Antwort höchstens 175 Karten und dazu die Adresse
// der nächsten Seite. Die wird mitgegeben, damit weitergeblättert werden
// kann, und total_cards sagt, wie viele es insgesamt sind.
async function searchCards(query) {
  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=released`;
  return ladeSuchseite(url);
}

async function ladeSuchseite(url) {
  const response = await scryfallFetch(url);
  if (response.status === 404) {
    return { cards: [], nextUrl: null, total: 0 };
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  return {
    cards: data.data || [],
    nextUrl: data.has_more ? data.next_page : null,
    total: data.total_cards ?? (data.data || []).length
  };
}

function hasAdvancedScryfallSyntax(query) {
  return /[:<>=!()"]/u.test(query);
}

async function searchCardsWithTolerance(query) {
  const direkt = await searchCards(query);
  if (direkt.cards.length) {
    return { ...direkt, mode: "direct" };
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

// Eine Ergebnisseite fasst 60 Karten, Scryfall liefert 175 je Antwort.
// Eine Abfrage reicht also für knapp drei Seiten.
const SEARCH_PAGE_SIZE = 60;

function setSearchResults(cards, { nextUrl = null, total = null } = {}) {
  state.results = cards;
  state.searchPage = 0;
  state.searchNextUrl = nextUrl;
  state.searchTotal = total ?? cards.length;
}

function searchPageCount() {
  const gesamt = Math.max(state.searchTotal, state.results.length);
  return Math.max(1, Math.ceil(gesamt / SEARCH_PAGE_SIZE));
}

function setDeckResults(cards, { nextUrl = null, total = null } = {}) {
  state.deckResults = cards;
  state.deckSearchPage = 0;
  state.deckSearchNextUrl = nextUrl;
  state.deckSearchTotal = total ?? cards.length;
}

function deckSearchPageCount() {
  const gesamt = Math.max(state.deckSearchTotal, state.deckResults.length);
  return Math.max(1, Math.ceil(gesamt / SEARCH_PAGE_SIZE));
}

// Blätterleiste für beide Suchen.
function pagerMarkup(seite, seiten) {
  if (seiten <= 1) {
    return "";
  }
  return `
    <div class="pager">
      <button type="button" class="retro-button" data-page="prev"${seite === 0 ? " disabled" : ""}>&lt; Zurück</button>
      <span class="pager-state">${escapeHtml(
        t("Seite {page} von {pages}", { page: seite + 1, pages: seiten })
      )}</span>
      <button type="button" class="retro-button" data-page="next"${seite >= seiten - 1 ? " disabled" : ""}>Weiter &gt;</button>
    </div>
    <p class="small-note pager-hint">Auf dem Handy kannst du auch seitwärts wischen.</p>
  `;
}

// Wischgesten für einen Ergebnisbereich. Nur deutlich waagrechte und lang
// genug gezogene Gesten zählen, sonst würde Scrollen umblättern.
function bindeWischen(bereich, blaettern) {
  let start = null;
  bereich.addEventListener(
    "touchstart",
    (event) => {
      start = event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null;
    },
    { passive: true }
  );
  bereich.addEventListener(
    "touchend",
    (event) => {
      if (!start) return;
      const punkt = event.changedTouches[0];
      const dx = punkt.clientX - start.x;
      const dy = punkt.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      blaettern(dx < 0 ? 1 : -1);
    },
    { passive: true }
  );
}

function updateResultCount() {
  // Angezeigt wird, was es insgesamt gibt, nicht was gerade geladen ist.
  const anzahl = Math.max(state.searchTotal, state.results.length);
  const text = `${anzahl} ${anzahl === 1 ? "card" : "cards"}`;
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

// Blättert auf eine Seite und lädt dafür so viele Scryfall-Seiten nach,
// wie es braucht. Eine Antwort deckt fast drei Ergebnisseiten ab.
async function gotoSearchPage(seite) {
  const ziel = Math.max(0, Math.min(seite, searchPageCount() - 1));
  if (ziel === state.searchPage) {
    return;
  }

  const gebraucht = (ziel + 1) * SEARCH_PAGE_SIZE;
  while (state.results.length < gebraucht && state.searchNextUrl) {
    setStatus(t("Lade weitere Treffer..."), "muted");
    try {
      const weitere = await ladeSuchseite(state.searchNextUrl);
      state.results = [...state.results, ...weitere.cards];
      state.searchNextUrl = weitere.nextUrl;
    } catch (error) {
      setStatus(t("Weitere Treffer konnten nicht geladen werden: {error}", { error: error.message }), "err");
      break;
    }
  }

  state.searchPage = ziel;
  renderResults();
  els.results.scrollIntoView({ block: "start", behavior: "smooth" });
  setStatus(
    t("Seite {page} von {pages}, {count} Treffer insgesamt.", {
      page: ziel + 1,
      pages: searchPageCount(),
      count: Math.max(state.searchTotal, state.results.length)
    }),
    "ok"
  );
}

function renderResults() {
  updateResultCount();

  if (!state.results.length) {
    els.results.innerHTML = `<div class="empty-state">Noch keine Treffer. Starte eine Suche oder nutze ein Beispiel.</div>`;
    return;
  }

  const seiten = searchPageCount();
  const start = state.searchPage * SEARCH_PAGE_SIZE;
  const aufDerSeite = state.results.slice(start, start + SEARCH_PAGE_SIZE);

  els.results.innerHTML = `
    <div class="search-grid">
      ${aufDerSeite
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
              <span class="tile-caption">
                ${escapeHtml(card.name)}
                ${preisSpanne(card)}
              </span>
            </button>
          `;
        })
        .join("")}
    </div>
    ${pagerMarkup(state.searchPage, seiten)}
  `;

  for (const btn of els.results.querySelectorAll("button[data-page]")) {
    btn.addEventListener("click", () => {
      gotoSearchPage(state.searchPage + (btn.dataset.page === "next" ? 1 : -1));
    });
  }

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
            ${preisSpanne(print)}
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
    setSearchResults(result.cards, { nextUrl: result.nextUrl, total: result.total });
    renderResults();

    if (state.results.length) {
      if (result.mode === "fuzzy" || result.mode === "autocomplete") {
        setStatus(`Kein exakter Treffer. Zeige ähnlichen Treffer: ${result.correctedName}`, "ok");
      } else if (searchPageCount() > 1) {
        setStatus(
          t("{count} Treffer gefunden, aufgeteilt auf {pages} Seiten.", {
            count: state.searchTotal,
            pages: searchPageCount()
          }),
          "ok"
        );
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
    setSearchResults([]);
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
    // Standardländer überspringen: Als Zufallsfund sind sie wertlos, und
    // es gibt sehr viele davon. -t:basic erfasst auch die verschneiten
    // Varianten, denn die tragen dieselbe Typangabe.
    const card = await fetchRandomCard("-t:basic");
    setSearchResults([card]);
    renderResults();
    await selectSearchCard(card);
    setStatus(t("Zufallskarte geladen: {name}", { name: card.name }), "ok");
  } catch (error) {
    setStatus(`Zufallskarte konnte nicht geladen werden: ${error.message}`, "err");
  }
}

// is:commander deckt bei Scryfall genau die Karten ab, die Commander
// sein dürfen: legendäre Kreaturen und die Planeswalker und Karten, die
// es ausdrücklich erlauben.
//
// game:paper hält die reinen Digitalkarten heraus, also die Alchemy-
// Varianten mit A- im Namen und Arena-eigene Karten. Auf Papier gibt es
// rund 3550 mögliche Commander, mit den digitalen wären es 3680.
async function loadRandomCommander() {
  openSearchRoute();
  setStatus("Ziehe zufälligen Commander...", "muted");

  try {
    const card = await fetchRandomCard("is:commander game:paper");
    setSearchResults([card]);
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
    const card = await fetchRandomCard("is:commander game:paper");
    setSearchResults([card]);
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

// Ein Klick auf den Menüpunkt, auf dem man schon steht, ändert die Adresse
// nicht, also meldet der Browser auch keinen Wechsel. Ohne das hier bliebe
// im Deck-Tab das offene Deck stehen, statt auf die Übersicht zu gehen.
for (const link of els.navLinks) {
  const href = link.getAttribute("href");
  if (!href) {
    continue;
  }
  link.addEventListener("click", () => {
    if (normalizeRoute(href) === normalizeRoute(window.location.hash)) {
      renderRoute();
    }
  });
}
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
      // Der Commander zählt beim Preis mit wie bei der Kartenzahl.
      const preis = preisSumme([
        ...(deck.cards || []),
        ...(deck.commander ? [{ id: deck.commander.id, quantity: 1 }] : [])
      ]);
      const info = `${t(deck.cardCount === 1 ? "{count} Karte" : "{count} Karten", {
        count: deck.cardCount
      })} · ${escapeHtml(preisText(preis))}${
        deck.commander ? ` · ${escapeHtml(deck.commander.name)}` : ""
      }`;

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
    ladeDeckPreise();
  } catch (error) {
    setDeckStatus(`Decks konnten nicht geladen werden: ${error.message}`, "err");
  }
}

// Die Übersicht steht sofort, die Preise kommen nach. Beim ersten Mal
// kostet das ein paar Abfragen, danach liegt alles im Cache.
async function ladeDeckPreise() {
  const ids = state.decks.flatMap((deck) => [
    ...(deck.cards || []).map((karte) => karte.id),
    ...(deck.commander ? [deck.commander.id] : [])
  ]);
  if (!ids.length) {
    return;
  }
  try {
    await ensureLegality(ids);
    renderDeckList();
  } catch {
    // Ohne Scryfall bleibt die Übersicht ohne Preise, sonst unverändert.
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

  const rot = commander && state.deckProblemCards.has(commander.id) ? " is-illegal" : "";

  els.commanderSlot.innerHTML = `
    ${
      commander?.image
        ? `<button type="button" class="deck-card-thumb${rot}" id="commanderVersionBtn" title="Version von ${escapeHtml(
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

// Reihenfolge wie in gängigen Deckbau-Seiten. Eine Karte mit mehreren
// Typen landet beim ersten Treffer dieser Liste: "Artifact Creature"
// zählt also als Kreatur.
const CARD_TYPES = [
  { key: "Creature", label: "Kreaturen" },
  { key: "Planeswalker", label: "Planeswalker" },
  { key: "Instant", label: "Spontanzauber" },
  { key: "Sorcery", label: "Hexereien" },
  { key: "Artifact", label: "Artefakte" },
  { key: "Enchantment", label: "Verzauberungen" },
  { key: "Battle", label: "Schlachten" },
  { key: "Land", label: "Länder" }
];

function hatTyp(typeLine, key) {
  return new RegExp(`\\b${key}\\b`, "i").test(typeLine);
}

function cardCategory(card) {
  const typeLine = cardInfoCache.get(card.id)?.typeLine || "";
  // Ein Land bleibt ein Land, auch wenn die Typzeile noch etwas anderes
  // nennt: Artefaktländer, Dryad Arbor, Kreaturenländer.
  if (hatTyp(typeLine, "Land")) {
    return CARD_TYPES.find((eintrag) => eintrag.key === "Land").label;
  }
  const treffer = CARD_TYPES.find((eintrag) => hatTyp(typeLine, eintrag.key));
  return treffer ? treffer.label : "Sonstige";
}

function groupCardsByType(cards) {
  const gruppen = new Map();
  for (const card of cards) {
    const label = cardCategory(card);
    if (!gruppen.has(label)) {
      gruppen.set(label, []);
    }
    gruppen.get(label).push(card);
  }

  const reihenfolge = [...CARD_TYPES.map((eintrag) => eintrag.label), "Sonstige"];
  return reihenfolge
    .filter((label) => gruppen.has(label))
    .map((label) => ({
      label,
      cards: gruppen.get(label),
      count: gruppen.get(label).reduce((summe, card) => summe + card.quantity, 0)
    }));
}

function renderDeckCards() {
  const cards = state.activeDeckCards;
  const singleton = (state.activeDeck?.format || "commander") === "commander";
  // Der Commander zählt als Karte des Decks mit.
  const commander = state.activeDeck?.commander;
  const total = cards.reduce((sum, card) => sum + card.quantity, 0) + (commander ? 1 : 0);
  // Der Commander zählt auch beim Preis mit.
  const preis = preisSumme([...cards, ...(commander ? [{ id: commander.id, quantity: 1 }] : [])]);
  els.deckTotal.textContent = `${t(total === 1 ? "{count} Karte" : "{count} Karten", {
    count: total
  })} · ${preisText(preis)}`;

  if (!cards.length) {
    els.deckCards.innerHTML = `<div class="empty-state">Noch keine Karten. Such links eine oder nutze Quick Add.</div>`;
    return;
  }

  const aktionen = (card) => `
    <button type="button" data-less="${escapeHtml(card.id)}" title="Eine weniger" aria-label="Eine weniger">-</button>
    <span class="quantity">${card.quantity}</span>
    <button type="button" data-more="${escapeHtml(card.id)}" title="${
      singleton && !card.unlimited ? "Im Commander ist nur ein Exemplar erlaubt" : "Eine mehr"
    }" aria-label="Eine mehr"${singleton && !card.unlimited ? " disabled" : ""}>+</button>
    <button type="button" data-commander="${escapeHtml(card.id)}" title="Als Commander festlegen" aria-label="Als Commander festlegen">★</button>
    <button type="button" data-remove="${escapeHtml(card.id)}" title="Aus dem Deck entfernen" aria-label="Entfernen">X</button>
  `;

  const bild = (card) => `
    <button type="button" class="deck-card-thumb" data-version="${escapeHtml(card.id)}" title="Version von ${escapeHtml(card.name)} wechseln" aria-label="Version von ${escapeHtml(card.name)} wechseln">
      ${
        card.image
          ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
          : `<span class="deck-card-thumb-empty">?</span>`
      }
    </button>
  `;

  // Karten, an denen die Regelprüfung hängt, bekommen einen roten Rand.
  const rot = (card) => (state.deckProblemCards.has(card.id) ? " is-illegal" : "");

  // Preis der Karte, bei mehreren Exemplaren die Summe.
  const preisZeile = (card) => {
    const preis = kartenPreis(card.id);
    if (preis === null) {
      return `<span class="deck-card-price is-unknown">${escapeHtml(t("kein Preis"))}</span>`;
    }
    const gesamt = preis * card.quantity;
    const text = card.quantity > 1
      ? `${formatPreis(gesamt)} (${card.quantity} x ${formatPreis(preis)})`
      : formatPreis(gesamt);
    return `<span class="deck-card-price">${escapeHtml(text)}</span>`;
  };

  const zeile = (card) => `
    <div class="deck-card-row${rot(card)}">
      ${bild(card)}
      <span class="deck-card-name">
        <strong>${escapeHtml(card.name)}</strong>
        <span>${escapeHtml(card.set_name || "?")}</span>
        ${preisZeile(card)}
      </span>
      <span class="deck-card-actions">${aktionen(card)}</span>
    </div>
  `;

  // Eingeklappt steht mehr Platz zur Verfügung. Dann liegen die Karten einer
  // Kategorie als Stapel untereinander: sichtbar bleibt nur der Namensbalken,
  // beim Überfahren rutscht die darunterliegende Karte nach unten weg.
  const kachel = (card) => `
    <div class="deck-card-tile${rot(card)}">
      ${bild(card)}
      ${card.quantity > 1 ? `<span class="deck-tile-count">${card.quantity}×</span>` : ""}
      <span class="deck-card-actions deck-tile-actions">${aktionen(card)}</span>
      ${preisZeile(card)}
    </div>
  `;

  const eingeklappt = state.deckSearchCollapsed;
  els.deckCards.classList.toggle("is-grid", eingeklappt);

  els.deckCards.innerHTML = groupCardsByType(cards)
    .map(
      (gruppe) => `
        <div class="deck-group">
          <h3 class="deck-group-head">
            ${escapeHtml(t(gruppe.label))}
            <span>${gruppe.count} &middot; ${escapeHtml(preisText(preisSumme(gruppe.cards)))}</span>
          </h3>
          <div class="${eingeklappt ? "deck-group-stack" : "deck-group-list"}">
            ${gruppe.cards.map(eingeklappt ? kachel : zeile).join("")}
          </div>
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

// Regelprüfung für das Commander-Format.
//
// Deckgrösse und Mengen stehen lokal zur Verfügung. Ob eine Karte
// verboten ist, weiss nur Scryfall, deshalb wird die Legalität einmal je
// Karte geholt und gemerkt.
const COMMANDER_DECK_SIZE = 100;
// Hält je Karte die Commander-Legalität, die Typzeile und die
// Farbidentität. Alles kommt aus derselben Abfrage, Gruppierung und
// Farbprüfung kosten also keine zusätzliche Anfrage.
const cardInfoCache = new Map();
const legalityCache = {
  get: (id) => cardInfoCache.get(id)?.legality,
  has: (id) => cardInfoCache.has(id)
};

// Diese Angaben ändern sich so gut wie nie: Typzeile und Farbidentität gar
// nicht, die Legalität nur wenn die Bannliste angepasst wird. Sie im
// Browser zu behalten spart nach jedem Neuladen die Abfrage an Scryfall.
const CARD_INFO_KEY = "remasurium.cardInfo";
const CARD_INFO_TTL = 30 * 24 * 60 * 60 * 1000;
const CARD_INFO_MAX = 4000;
// Hochzählen, sobald ein Feld dazukommt. Sonst behalten alte Einträge ihre
// frischen Preise, das neue Feld bleibt aber für immer leer, weil nur
// unbekannte Karten und veraltete Preise nachgefragt werden.
const CARD_INFO_VERSION = 2;
// Preise sind das Einzige, was sich täglich ändert. Sie bekommen deshalb
// eine eigene, kurze Haltbarkeit und einen eigenen Zeitstempel.
const PRICE_TTL = 24 * 60 * 60 * 1000;

function preisVeraltet(id) {
  const eintrag = cardInfoCache.get(id);
  return !eintrag || !eintrag.pt || Date.now() - eintrag.pt > PRICE_TTL;
}

// Cardmarket-Preis in Euro. Scryfall bezieht die eur-Preise von dort.
function kartenPreis(id) {
  const eintrag = cardInfoCache.get(id);
  const roh = eintrag?.price;
  const zahl = Number(roh);
  return roh != null && Number.isFinite(zahl) ? zahl : null;
}

function preisAusScryfall(card) {
  const roh = card?.prices?.eur ?? card?.prices?.eur_foil ?? null;
  const zahl = Number(roh);
  return roh != null && Number.isFinite(zahl) ? zahl : null;
}

// Cardmarket rechnet in Euro, angezeigt wird in Franken. Der Kurs kommt
// von den Referenzkursen der EZB, einmal am Tag.
const RATE_KEY = "remasurium.chfRate";
const RATE_TTL = 24 * 60 * 60 * 1000;
const RATE_URL = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=CHF";

let kurs = null;

function ladeKursAusAblage() {
  try {
    const roh = JSON.parse(localStorage.getItem(RATE_KEY) || "null");
    if (roh && Number.isFinite(Number(roh.rate))) {
      kurs = { rate: Number(roh.rate), date: roh.date, t: roh.t || 0 };
    }
  } catch {
    kurs = null;
  }
}

async function ensureKurs() {
  if (kurs && Date.now() - kurs.t < RATE_TTL) {
    return;
  }
  try {
    const response = await fetch(RATE_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const rate = Number(data?.rates?.CHF);
    if (!Number.isFinite(rate)) throw new Error("kein Kurs");
    kurs = { rate, date: data.date, t: Date.now() };
    localStorage.setItem(RATE_KEY, JSON.stringify(kurs));
  } catch {
    // Ohne frischen Kurs wird der zuletzt bekannte weiterverwendet. Gibt
    // es gar keinen, bleiben die Preise in Euro stehen: lieber eine
    // andere Währung als gar kein Preis.
  }
}

function formatPreis(betragEur) {
  if (!kurs) {
    return `${betragEur.toFixed(2)} €`;
  }
  return `${(betragEur * kurs.rate).toFixed(2)} CHF`;
}

ladeKursAusAblage();
ensureKurs();

// Summe über Karten mit Menge. Gibt zusätzlich zurück, wie viele Karten
// keinen Preis haben, damit die Anzeige das nicht verschweigt.
function preisSumme(karten) {
  let summe = 0;
  let ohnePreis = 0;
  for (const karte of karten) {
    const preis = kartenPreis(karte.id);
    if (preis === null) {
      ohnePreis += karte.quantity || 1;
      continue;
    }
    summe += preis * (karte.quantity || 1);
  }
  return { summe, ohnePreis };
}

// Preiszeile unter einer Karte in Suche und Versionsliste. Die Karte
// bringt ihre Preise selbst mit, dafür ist keine Abfrage nötig.
function preisSpanne(card) {
  const preis = preisAusScryfall(card);
  return preis === null
    ? `<span class="tile-price is-unknown">${escapeHtml(t("kein Preis"))}</span>`
    : `<span class="tile-price">${escapeHtml(formatPreis(preis))}</span>`;
}

function preisText({ summe, ohnePreis }) {
  return ohnePreis > 0
    ? t("{price} (+{count} ohne Preis)", { price: formatPreis(summe), count: ohnePreis })
    : formatPreis(summe);
}

function ladeCardInfo() {
  let roh;
  try {
    roh = JSON.parse(localStorage.getItem(CARD_INFO_KEY) || "null");
  } catch {
    return;
  }
  if (!roh || roh.v !== CARD_INFO_VERSION || typeof roh.cards !== "object") {
    return;
  }

  const grenze = Date.now() - CARD_INFO_TTL;
  const preisGrenze = Date.now() - PRICE_TTL;
  for (const [id, eintrag] of Object.entries(roh.cards)) {
    if (!eintrag || eintrag.t < grenze) continue;
    // Alte Preise werden verworfen, die Karte selbst bleibt.
    const preisFrisch = eintrag.pt > preisGrenze;
    cardInfoCache.set(id, {
      legality: eintrag.legality,
      typeLine: eintrag.typeLine,
      colorIdentity: eintrag.colorIdentity,
      manaCost: eintrag.manaCost,
      cmc: eintrag.cmc ?? null,
      price: preisFrisch ? eintrag.price : null,
      pt: preisFrisch ? eintrag.pt : 0,
      t: eintrag.t
    });
  }
}

let speicherLauf = null;

function speichereCardInfo() {
  // Gesammelt schreiben, sonst wird die ganze Ablage je Karte neu erzeugt.
  clearTimeout(speicherLauf);
  speicherLauf = setTimeout(() => {
    // Was Scryfall nicht kannte, wird nicht behalten: sonst bliebe eine
    // einmalige Fehlantwort dreissig Tage lang stehen.
    const brauchbar = [...cardInfoCache.entries()].filter(
      ([, eintrag]) => eintrag.colorIdentity !== null
    );
    // Bei Überlauf die ältesten Einträge fallen lassen.
    const behalten = brauchbar
      .sort((a, b) => (b[1].t || 0) - (a[1].t || 0))
      .slice(0, CARD_INFO_MAX);

    const cards = {};
    for (const [id, eintrag] of behalten) {
      cards[id] = eintrag;
    }
    try {
      localStorage.setItem(CARD_INFO_KEY, JSON.stringify({ v: CARD_INFO_VERSION, cards }));
    } catch {
      // Voller Speicher: die Ablage fliegt raus, im Arbeitsspeicher bleibt
      // alles erhalten. Beim nächsten Mal wird wieder gefragt.
      localStorage.removeItem(CARD_INFO_KEY);
    }
  }, 400);
}

ladeCardInfo();

async function ensureLegality(ids) {
  await ensureKurs();
  // Nachgefragt wird für unbekannte Karten und für alle, deren Preis
  // älter als einen Tag ist. Die übrigen Angaben stehen dann schon.
  const fehlende = [...new Set(ids)].filter(
    (id) => id && (!cardInfoCache.has(id) || preisVeraltet(id))
  );
  if (!fehlende.length) {
    return;
  }

  for (let i = 0; i < fehlende.length; i += 75) {
    const teil = fehlende.slice(i, i + 75);
    const response = await scryfallFetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: teil.map((id) => ({ id })) })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    for (const card of data.data || []) {
      cardInfoCache.set(card.id, {
        legality: card.legalities?.commander || "unknown",
        typeLine: card.type_line || "",
        colorIdentity: card.color_identity || [],
        // Bei doppelseitigen Karten steht oben keine Manakosten, nur je Seite.
        manaCost: card.mana_cost || card.card_faces?.[0]?.mana_cost || "",
        cmc: typeof card.cmc === "number" ? card.cmc : null,
        price: preisAusScryfall(card),
        pt: Date.now(),
        t: Date.now()
      });
    }
    // Was Scryfall nicht kennt, wird nicht als Fehler gewertet.
    for (const id of teil) {
      if (!cardInfoCache.has(id)) {
        cardInfoCache.set(id, {
          legality: "unknown",
          typeLine: "",
          colorIdentity: null,
          manaCost: "",
          price: null,
          pt: Date.now(),
          t: Date.now()
        });
      }
    }
  }

  speichereCardInfo();
}

// Die Farbidentität wird als WUBRG-Kürzel angezeigt, farblos als C.
function farbkuerzel(identitaet) {
  const reihenfolge = ["W", "U", "B", "R", "G"];
  const sortiert = reihenfolge.filter((farbe) => identitaet.includes(farbe));
  return sortiert.length ? sortiert.join("") : "C";
}

function collectDeckProblems() {
  const probleme = [];
  const karten = state.activeDeckCards;
  const commander = state.activeDeck?.commander;
  const gesamt = karten.reduce((summe, karte) => summe + karte.quantity, 0) + (commander ? 1 : 0);
  // Ein Problem kennt die Karten, die es ausgelöst haben. Damit lassen
  // sie sich im Deck rot umranden.
  const melde = (text, ...ids) => probleme.push({ text, ids });

  if (!commander) {
    melde(t("Dem Deck fehlt ein Commander."));
  }

  if (gesamt < COMMANDER_DECK_SIZE) {
    melde(
      t("Das Deck hat {count} Karten, es fehlen {diff} auf 100.", {
        count: gesamt,
        diff: COMMANDER_DECK_SIZE - gesamt
      })
    );
  } else if (gesamt > COMMANDER_DECK_SIZE) {
    melde(
      t("Das Deck hat {count} Karten, {diff} zu viel für 100.", {
        count: gesamt,
        diff: gesamt - COMMANDER_DECK_SIZE
      })
    );
  }

  for (const karte of karten) {
    if (karte.quantity > 1 && !karte.unlimited) {
      melde(
        t("{name}: {count} Exemplare, erlaubt ist eines.", { name: karte.name, count: karte.quantity }),
        karte.id
      );
    }
  }

  for (const karte of [commander, ...karten].filter(Boolean)) {
    const status = legalityCache.get(karte.id);
    if (status === "banned") {
      melde(t("{name} ist im Commander verboten.", { name: karte.name }), karte.id);
    } else if (status === "not_legal") {
      melde(t("{name} ist im Commander nicht zugelassen.", { name: karte.name }), karte.id);
    }
  }

  // Der Commander steckt den Farbrahmen ab: Jede Karte im Deck darf nur
  // Farben mitbringen, die auch er hat. Ohne Daten von Scryfall wird
  // nicht geraten.
  const rahmen = commander && cardInfoCache.get(commander.id)?.colorIdentity;
  if (rahmen) {
    for (const karte of karten) {
      const eigene = cardInfoCache.get(karte.id)?.colorIdentity;
      if (!eigene || eigene.every((farbe) => rahmen.includes(farbe))) {
        continue;
      }
      melde(
        t("{name} passt nicht zur Farbidentität {colors} des Commanders.", {
          name: karte.name,
          colors: farbkuerzel(rahmen)
        }),
        karte.id
      );
    }
  }

  return probleme;
}

function renderLegality(probleme) {
  state.deckProblems = probleme;
  state.deckProblemCards = new Set(probleme.flatMap((problem) => problem.ids));

  const inOrdnung = probleme.length === 0;
  els.legalityBadge.textContent = inOrdnung ? t("legal") : t("nicht legal");
  els.legalityBadge.classList.toggle("is-legal", inOrdnung);
  els.legalityBadge.classList.toggle("is-illegal", !inOrdnung);

  els.legalitySummary.textContent = inOrdnung
    ? t("Das Deck erfüllt die Commander-Regeln.")
    : t("{count} Punkte sprechen gegen ein legales Commander-Deck.", { count: probleme.length });
  els.legalitySummary.className = `status ${inOrdnung ? "ok" : "err"}`;

  els.legalityList.innerHTML = probleme
    .map((problem) => `<li>${escapeHtml(problem.text)}</li>`)
    .join("");
}

async function checkDeckLegality() {
  if (!state.activeDeck) {
    return;
  }

  // Erst das, was ohne Netz feststeht, damit die Anzeige sofort stimmt.
  renderLegality(collectDeckProblems());

  const ids = [state.activeDeck.commander?.id, ...state.activeDeckCards.map((karte) => karte.id)];
  try {
    await ensureLegality(ids.filter(Boolean));
    renderLegality(collectDeckProblems());
    // Mit der Legalität kommen auch Typzeile und Farbidentität. Erst jetzt
    // lässt sich eine frisch hinzugefügte Karte richtig einsortieren
    // (vorher stünde sie unter "Sonstige") und rot umranden.
    renderDeckCards();
    renderDeckStats();
    renderCommanderSlot();
  } catch {
    // Ohne Scryfall bleiben Grösse und Mengen geprüft, verbotene Karten
    // lassen sich dann nicht beurteilen.
  }
}

// --- Länder optimieren ---------------------------------------------------
// Die Standardländer werden nach den farbigen Manasymbolen im Deck verteilt.

const BASIC_LANDS = [
  { farbe: "W", name: "Plains", label: "Weiss" },
  { farbe: "U", name: "Island", label: "Blau" },
  { farbe: "B", name: "Swamp", label: "Schwarz" },
  { farbe: "R", name: "Mountain", label: "Rot" },
  { farbe: "G", name: "Forest", label: "Grün" }
];

// Ein farbloses Deck hat keine der fünf Farben, spielt aber Standardländer.
const WASTES = { farbe: "C", name: "Wastes", label: "Farblos" };

function landZuFarbe(farbe) {
  return farbe === WASTES.farbe ? WASTES : BASIC_LANDS.find((eintrag) => eintrag.farbe === farbe);
}

function istStandardland(karte) {
  const typ = cardInfoCache.get(karte.id)?.typeLine || "";
  return /\bBasic\b/i.test(typ) && hatTyp(typ, "Land");
}

function istLand(karte) {
  return hatTyp(cardInfoCache.get(karte.id)?.typeLine || "", "Land");
}

// Zählt die farbigen Symbole einer Manakosten-Zeichenkette. Hybride teilen
// sich ihr Gewicht, sonst würde {W/U} für beide Farben voll zählen.
function zaehlePips(manaCost) {
  const summe = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (const symbol of manaCost.match(/\{[^}]+\}/g) || []) {
    const teile = symbol.slice(1, -1).split("/");
    const farben = teile.filter((teil) => teil in summe);
    for (const farbe of farben) {
      summe[farbe] += 1 / farben.length;
    }
  }
  return summe;
}

function deckPips() {
  const summe = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  const commander = state.activeDeck?.commander;
  const alle = [
    ...(commander ? [{ id: commander.id, quantity: 1 }] : []),
    ...state.activeDeckCards
  ];
  for (const karte of alle) {
    const kosten = cardInfoCache.get(karte.id)?.manaCost || "";
    const einzeln = zaehlePips(kosten);
    for (const farbe of Object.keys(summe)) {
      summe[farbe] += einzeln[farbe] * karte.quantity;
    }
  }
  return summe;
}

// Welche Farben im Fenster auftauchen: die Farbidentität des Commanders,
// sonst die Farben, für die das Deck überhaupt Symbole hat. Dazu jede Farbe,
// von der schon Standardländer im Deck liegen, damit man sie leeren kann.
function landfarben() {
  const commander = state.activeDeck?.commander;
  const identitaet = commander && cardInfoCache.get(commander.id)?.colorIdentity;
  const pips = deckPips();
  const basis = identitaet?.length
    ? identitaet
    : BASIC_LANDS.filter((eintrag) => pips[eintrag.farbe] > 0).map((eintrag) => eintrag.farbe);

  const vorhanden = new Set(
    state.activeDeckCards
      .filter(istStandardland)
      .map((karte) => BASIC_LANDS.find((eintrag) => eintrag.name === karte.name)?.farbe)
      .filter(Boolean)
  );

  const liste = BASIC_LANDS.filter(
    (eintrag) => basis.includes(eintrag.farbe) || vorhanden.has(eintrag.farbe)
  );
  return liste.length ? liste : [WASTES];
}

// Grösste Reste: erst abrunden, dann die übrigen Plätze an die grössten
// Nachkommateile vergeben. So stimmt die Summe immer genau.
function verteileNachAnteil(gesamt, gewichte) {
  if (gesamt <= 0 || !gewichte.length) return gewichte.map(() => 0);

  const summe = gewichte.reduce((a, b) => a + b, 0);
  // Farben ohne ein einziges Symbol im Deck teilen sich gleichmässig auf.
  const anteile = summe > 0 ? gewichte : gewichte.map(() => 1);
  const teiler = summe > 0 ? summe : gewichte.length;

  const roh = anteile.map((gewicht) => (gewicht / teiler) * gesamt);
  const ganz = roh.map(Math.floor);
  let rest = gesamt - ganz.reduce((a, b) => a + b, 0);
  const reihenfolge = roh
    .map((wert, index) => ({ index, rest: wert - Math.floor(wert) }))
    .sort((a, b) => b.rest - a.rest);

  for (const eintrag of reihenfolge) {
    if (rest <= 0) break;
    ganz[eintrag.index] += 1;
    rest -= 1;
  }
  return ganz;
}

function landZahlen() {
  const karten = state.activeDeckCards;
  const laender = karten.filter(istLand);
  const standard = laender.filter(istStandardland);
  const menge = (liste) => liste.reduce((summe, karte) => summe + karte.quantity, 0);
  return {
    laenderGesamt: menge(laender),
    standard: menge(standard),
    nichtStandard: menge(laender) - menge(standard)
  };
}

function landsVorschlag(zielGesamt) {
  const farben = landfarben();
  const pips = deckPips();
  const { nichtStandard } = landZahlen();
  const zuVerteilen = Math.max(0, zielGesamt - nichtStandard);
  const anzahlen = verteileNachAnteil(
    zuVerteilen,
    farben.map((eintrag) => pips[eintrag.farbe] ?? 0)
  );
  return farben.map((eintrag, index) => ({
    ...eintrag,
    pips: pips[eintrag.farbe] ?? 0,
    anzahl: anzahlen[index]
  }));
}

function renderLandsFacts() {
  const { nichtStandard, standard } = landZahlen();
  const eingaben = [...els.landsSplit.querySelectorAll("input[data-farbe]")];
  const danach = eingaben.reduce((summe, feld) => summe + (Number(feld.value) || 0), 0);

  const zeilen = [
    [t("Länder ohne Standardländer"), nichtStandard],
    [t("Standardländer jetzt"), standard],
    [t("Standardländer danach"), danach],
    [t("Länder danach insgesamt"), nichtStandard + danach]
  ];
  els.landsFacts.innerHTML = zeilen
    .map(([begriff, wert]) => `<dt>${escapeHtml(begriff)}</dt><dd>${wert}</dd>`)
    .join("");
}

function renderLandsSplit(vorschlag) {
  // Farbloses Deck: es gibt keine Standardländer zu verteilen.
  if (!vorschlag.length) {
    els.landsSplit.innerHTML = `<div class="empty-state">Das Deck hat keine farbigen Manasymbole, es gibt nichts zu verteilen.</div>`;
    renderLandsFacts();
    return;
  }

  const gesamtPips = vorschlag.reduce((summe, eintrag) => summe + eintrag.pips, 0);
  els.landsSplit.innerHTML = vorschlag
    .map((eintrag) => {
      // Ohne farbige Symbole im Deck gibt es keinen Anteil zu zeigen.
      const anteil = gesamtPips > 0 ? `${Math.round((eintrag.pips / gesamtPips) * 100)}%` : "–";
      return `
        <label class="lands-row">
          <span class="lands-name">${escapeHtml(eintrag.name)}</span>
          <span class="lands-share">${anteil}</span>
          <input type="number" min="0" max="99" step="1" data-farbe="${eintrag.farbe}" value="${eintrag.anzahl}" />
        </label>
      `;
    })
    .join("");

  for (const feld of els.landsSplit.querySelectorAll("input[data-farbe]")) {
    feld.addEventListener("input", renderLandsFacts);
  }
  renderLandsFacts();
}

function openLandsModal() {
  if (!state.activeDeck) return;
  const { laenderGesamt } = landZahlen();
  // 36 ist der übliche Richtwert im Commander. Wer schon mehr Länder hat,
  // startet bei seiner eigenen Zahl und verliert so keine.
  els.landsTotal.value = Math.max(laenderGesamt, 36);
  setLandsStatus(t("Noch nichts geändert."), "muted");
  renderLandsSplit(landsVorschlag(Number(els.landsTotal.value)));
  openModal(els.landsModal);
  els.landsTotal.focus();
}

function setLandsStatus(text, art = "muted") {
  els.landsStatus.textContent = text;
  els.landsStatus.className = `status ${art}`;
}

async function applyLands() {
  if (!state.activeDeck) return;
  const wuensche = [...els.landsSplit.querySelectorAll("input[data-farbe]")].map((feld) => ({
    farbe: feld.dataset.farbe,
    name: landZuFarbe(feld.dataset.farbe).name,
    anzahl: Math.max(0, Math.min(99, Number(feld.value) || 0))
  }));

  setLandsStatus(t("Wird gesetzt..."), "muted");
  try {
    // Nur die Länder nachschlagen, die noch nicht im Deck liegen.
    const fehlende = wuensche
      .filter((wunsch) => wunsch.anzahl > 0)
      .filter((wunsch) => !state.activeDeckCards.some((karte) => karte.name === wunsch.name))
      .map((wunsch) => wunsch.name);
    const gefunden = fehlende.length ? (await lookupCardsByName(fehlende)).found : new Map();

    // Alles in einem Zug: eine Anfrage statt einer je Farbe.
    const stapel = [];
    for (const wunsch of wuensche) {
      const imDeck = state.activeDeckCards.find((karte) => karte.name === wunsch.name);
      if (wunsch.anzahl === 0) {
        if (imDeck) stapel.push({ card: imDeck, quantity: 0 });
        continue;
      }
      const treffer = gefunden.get(wunsch.name.toLowerCase());
      const karte = imDeck || (treffer ? deckCardFromScryfall(treffer) : null);
      if (karte) stapel.push({ card: karte, quantity: wunsch.anzahl });
    }

    if (stapel.length) {
      applyDeckResult(await deckStore.putCards(state.activeDeck.id, stapel));
    }
    const gesetzt = wuensche.reduce((summe, wunsch) => summe + wunsch.anzahl, 0);
    setLandsStatus(t("{count} Standardländer gesetzt.", { count: gesetzt }), "ok");
    renderLandsSplit(
      wuensche.map((wunsch) => ({
        ...landZuFarbe(wunsch.farbe),
        pips: deckPips()[wunsch.farbe] ?? 0,
        anzahl: wunsch.anzahl
      }))
    );
  } catch (error) {
    setLandsStatus(error.message, "err");
  }
}

// --- Statistik ------------------------------------------------------------

// Die Kurve endet bei 8, alles darüber landet im letzten Balken.
const CURVE_MAX = 8;

function deckStatistik() {
  const commander = state.activeDeck?.commander;
  const alle = [
    ...state.activeDeckCards,
    ...(commander ? [{ id: commander.id, quantity: 1 }] : [])
  ];

  const balken = Array.from({ length: CURVE_MAX + 1 }, () => 0);
  let summe = 0;
  let anzahl = 0;

  for (const karte of alle) {
    // Länder haben keine Manakosten und würden die Kurve nach unten ziehen.
    if (istLand(karte)) {
      continue;
    }
    const wert = cardInfoCache.get(karte.id)?.cmc;
    if (typeof wert !== "number") {
      continue;
    }
    const stufe = Math.min(Math.max(Math.round(wert), 0), CURVE_MAX);
    balken[stufe] += karte.quantity;
    summe += wert * karte.quantity;
    anzahl += karte.quantity;
  }

  return { balken, summe, anzahl, schnitt: anzahl ? summe / anzahl : 0, farben: deckPips() };
}

function renderDeckStats() {
  if (!state.activeDeck) {
    return;
  }
  const { balken, summe, anzahl, schnitt, farben } = deckStatistik();

  els.deckStatsSummary.textContent = anzahl
    ? t("Ø {avg} bei {count} Karten", { avg: schnitt.toFixed(2), count: anzahl })
    : t("{count} Karten", { count: 0 });

  const hoechster = Math.max(...balken, 1);
  els.manaCurve.innerHTML = balken
    .map(
      (wert, stufe) => `
        <div class="curve-column" title="${escapeHtml(
          t("{count} Karten mit Manawert {value}", {
            count: wert,
            value: stufe === CURVE_MAX ? `${CURVE_MAX}+` : stufe
          })
        )}">
          <span class="curve-count">${wert || ""}</span>
          <span class="curve-bar" style="height: ${Math.round((wert / hoechster) * 100)}%"></span>
          <span class="curve-label">${stufe === CURVE_MAX ? `${CURVE_MAX}+` : stufe}</span>
        </div>
      `
    )
    .join("");

  const gesamtPips = BASIC_LANDS.reduce((wert, eintrag) => wert + farben[eintrag.farbe], 0);
  if (!gesamtPips) {
    els.manaColors.innerHTML = `<div class="empty-state">${escapeHtml(
      t("Das Deck hat keine farbigen Manasymbole.")
    )}</div>`;
    return;
  }

  // Ein durchgehender Balken, je Farbe ein Abschnitt nach Anteil.
  const vertreten = BASIC_LANDS.filter((eintrag) => farben[eintrag.farbe] > 0).map((eintrag) => ({
    ...eintrag,
    anteil: (farben[eintrag.farbe] / gesamtPips) * 100
  }));

  els.manaColors.innerHTML = `
    <div class="color-bar">
      ${vertreten
        .map(
          (eintrag) => `
            <span
              class="color-seg is-${eintrag.farbe.toLowerCase()}"
              style="width: ${eintrag.anteil.toFixed(2)}%"
              title="${escapeHtml(t(eintrag.label))} ${Math.round(eintrag.anteil)}%"
            >${eintrag.farbe}</span>
          `
        )
        .join("")}
    </div>
    <div class="color-legend">
      ${vertreten
        .map(
          (eintrag) => `
            <span class="color-key">
              <span class="color-dot is-${eintrag.farbe.toLowerCase()}"></span>
              ${escapeHtml(t(eintrag.label))} ${Math.round(eintrag.anteil)}%
            </span>
          `
        )
        .join("")}
    </div>
  `;
}

function renderDeckEditor() {
  if (!state.activeDeck) {
    return;
  }
  els.deckNameInput.value = state.activeDeck.name;
  // Zuerst prüfen: der synchrone Teil setzt die Problemkarten, damit die
  // roten Ränder gleich beim ersten Zeichnen stimmen.
  checkDeckLegality();
  renderCommanderSlot();
  renderDeckCards();
  renderDeckStats();
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

// Blättert im Suchfenster des Deck-Editors und lädt dafür nach.
async function gotoDeckSearchPage(seite) {
  const ziel = Math.max(0, Math.min(seite, deckSearchPageCount() - 1));
  if (ziel === state.deckSearchPage) {
    return;
  }

  const gebraucht = (ziel + 1) * SEARCH_PAGE_SIZE;
  while (state.deckResults.length < gebraucht && state.deckSearchNextUrl) {
    setDeckStatus(t("Lade weitere Treffer..."), "muted");
    try {
      const weitere = await ladeSuchseite(state.deckSearchNextUrl);
      state.deckResults = [...state.deckResults, ...weitere.cards];
      state.deckSearchNextUrl = weitere.nextUrl;
    } catch (error) {
      setDeckStatus(t("Weitere Treffer konnten nicht geladen werden: {error}", { error: error.message }), "err");
      break;
    }
  }

  state.deckSearchPage = ziel;
  renderDeckSearchResults();
  els.deckSearchResults.scrollIntoView({ block: "start", behavior: "smooth" });
  setDeckStatus(
    t("Seite {page} von {pages}, {count} Treffer insgesamt.", {
      page: ziel + 1,
      pages: deckSearchPageCount(),
      count: Math.max(state.deckSearchTotal, state.deckResults.length)
    }),
    "ok"
  );
}

function renderDeckSearchResults() {
  const results = state.deckResults;
  // Angezeigt wird, was es insgesamt gibt, nicht was gerade geladen ist.
  const anzahl = Math.max(state.deckSearchTotal, results.length);
  els.deckSearchCount.textContent = `${anzahl} ${anzahl === 1 ? "card" : "cards"}`;

  if (!results.length) {
    els.deckSearchResults.innerHTML = `<div class="empty-state">Noch keine Treffer.</div>`;
    return;
  }

  const seiten = deckSearchPageCount();
  const start = state.deckSearchPage * SEARCH_PAGE_SIZE;

  els.deckSearchResults.innerHTML = `
    <div class="search-grid">
      ${results
        .slice(start, start + SEARCH_PAGE_SIZE)
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
              <span class="tile-caption">
                ${escapeHtml(card.name)}
                ${preisSpanne(card)}
              </span>
            </button>
          `;
        })
        .join("")}
    </div>
    ${pagerMarkup(state.deckSearchPage, seiten)}
  `;

  for (const btn of els.deckSearchResults.querySelectorAll("button[data-page]")) {
    btn.addEventListener("click", () => {
      gotoDeckSearchPage(state.deckSearchPage + (btn.dataset.page === "next" ? 1 : -1));
    });
  }

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
    setDeckResults(result.cards, { nextUrl: result.nextUrl, total: result.total });
    renderDeckSearchResults();
    if (!state.deckResults.length) {
      setDeckStatus("Keine Treffer gefunden.", "err");
    } else if (deckSearchPageCount() > 1) {
      setDeckStatus(
        t("{count} Treffer gefunden, aufgeteilt auf {pages} Seiten.", {
          count: state.deckSearchTotal,
          pages: deckSearchPageCount()
        }),
        "ok"
      );
    } else {
      setDeckStatus(`${state.deckResults.length} Treffer.`, "ok");
    }
  } catch (error) {
    setDeckResults([]);
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

function setFeedbackStatus(text, type = "muted") {
  els.feedbackStatus.textContent = text;
  els.feedbackStatus.className = `status ${type}`;
}

function renderReviews(reviews) {
  if (!reviews.length) {
    els.reviewList.innerHTML = `<div class="empty-state">${t("Noch kein Feedback.")}</div>`;
    return;
  }

  els.reviewList.innerHTML = reviews
    .map(
      (review) => `
        <div class="review-entry">
          <div>
            <div class="review-head">
              <strong>${escapeHtml(review.name)}</strong>
              <span>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span>
              <span>${escapeHtml(new Date(review.createdAt).toLocaleString("de-CH"))}</span>
              ${review.email ? `<span>${escapeHtml(review.email)}</span>` : ""}
            </div>
            <p class="review-text">${escapeHtml(review.message)}</p>
          </div>
          <button type="button" class="retro-button" data-delete-review="${escapeHtml(review.id)}" title="${t("Feedback löschen")}">X</button>
        </div>
      `
    )
    .join("");

  for (const btn of els.reviewList.querySelectorAll("button[data-delete-review]")) {
    btn.addEventListener("click", async () => {
      try {
        await api.deleteReview(btn.dataset.deleteReview);
        await loadReviews();
        setFeedbackStatus(t("Feedback gelöscht."), "ok");
      } catch (error) {
        setFeedbackStatus(error.message, "err");
      }
    });
  }
}

// Der Bereich erscheint nur für das Adminkonto. Die eigentliche Sperre
// sitzt im Worker, hier geht es allein um die Ansicht.
async function loadReviews() {
  if (!state.user?.isAdmin) {
    els.adminReviews.hidden = true;
    return;
  }

  els.adminReviews.hidden = false;
  try {
    const data = await api.listReviews();
    renderReviews(data.reviews || []);
  } catch (error) {
    els.reviewList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function openFeedbackModal() {
  openModal(els.feedbackModal);
  loadReviews();
}

async function submitFeedback(event) {
  event.preventDefault();

  const message = els.feedbackForm.message.value.trim();
  if (!message) {
    setFeedbackStatus(t("Bitte schreib etwas ins Feedback."), "err");
    return;
  }

  setFeedbackStatus(t("Wird gesendet..."), "muted");
  try {
    await api.sendReview(
      els.feedbackForm.name.value.trim(),
      Number(els.feedbackForm.rating.value),
      message
    );
    els.feedbackForm.reset();
    setFeedbackStatus(t("Danke für das Feedback."), "ok");
    await loadReviews();
  } catch (error) {
    setFeedbackStatus(error.message, "err");
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
els.openFeedbackBtn.addEventListener("click", openFeedbackModal);
els.feedbackForm.addEventListener("submit", submitFeedback);
els.feedbackModalCloseBtn.addEventListener("click", () => closeModal(els.feedbackModal));
els.feedbackModal.addEventListener("click", (event) => {
  if (event.target === els.feedbackModal) {
    closeModal(els.feedbackModal);
  }
});
// Suchfenster ein- und ausklappen. Der Pfeil zeigt die Richtung, in die
// es geht: <| schiebt nach links weg, |> holt es zurück.
const SEARCH_COLLAPSE_KEY = "remasurium.deckSearchCollapsed";

function applySearchCollapse() {
  const zu = state.deckSearchCollapsed;
  els.deckLayout.classList.toggle("is-collapsed", zu);
  els.toggleSearchBtn.textContent = zu ? "|>" : "<|";
  const titel = zu ? t("Suchfenster ausklappen") : t("Suchfenster einklappen");
  els.toggleSearchBtn.title = titel;
  els.toggleSearchBtn.setAttribute("aria-label", titel);
  els.toggleSearchBtn.setAttribute("aria-expanded", String(!zu));
}

els.toggleSearchBtn.addEventListener("click", () => {
  state.deckSearchCollapsed = !state.deckSearchCollapsed;
  localStorage.setItem(SEARCH_COLLAPSE_KEY, state.deckSearchCollapsed ? "1" : "0");
  applySearchCollapse();
  renderDeckCards();
});

state.deckSearchCollapsed = localStorage.getItem(SEARCH_COLLAPSE_KEY) === "1";
applySearchCollapse();

// Wischen blättert in beiden Suchen. Einmal verdrahtet, nicht bei jedem
// Zeichnen neu.
bindeWischen(els.results, (richtung) => gotoSearchPage(state.searchPage + richtung));
bindeWischen(els.deckSearchResults, (richtung) =>
  gotoDeckSearchPage(state.deckSearchPage + richtung)
);

els.openLandsBtn.addEventListener("click", openLandsModal);
els.landsModalCloseBtn.addEventListener("click", () => closeModal(els.landsModal));
els.landsApplyBtn.addEventListener("click", applyLands);
// Die Gesamtzahl verteilt neu, von Hand gesetzte Zahlen werden dabei ersetzt.
els.landsRecalcBtn.addEventListener("click", () => {
  renderLandsSplit(landsVorschlag(Number(els.landsTotal.value) || 0));
});
els.landsTotal.addEventListener("change", () => {
  renderLandsSplit(landsVorschlag(Number(els.landsTotal.value) || 0));
});

els.legalityBadge.addEventListener("click", () => openModal(els.legalityModal));
els.legalityModalCloseBtn.addEventListener("click", () => closeModal(els.legalityModal));
els.legalityModal.addEventListener("click", (event) => {
  if (event.target === els.legalityModal) {
    closeModal(els.legalityModal);
  }
});
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

// Texte mit eingesetzten Zahlen oder Namen sind nach dem Zusammenbauen
// keine Wörterbuch-Schlüssel mehr. Der Textknoten-Durchlauf erreicht sie
// deshalb nicht, sie müssen neu erzeugt werden.
function rerenderDynamicText() {
  renderResults();
  renderDeckSearchResults();
  renderCollection();
  renderDeckList();
  renderAccount();
  // Der Titel des Einklapp-Knopfs hängt am Zustand, nicht am Quelltext:
  // die Übersetzung würde sonst den ursprünglichen Text zurücksetzen.
  applySearchCollapse();
  if (state.activeDeck) {
    renderDeckEditor();
  }
}

els.langToggle.addEventListener("click", () => {
  setLang(getLang() === "de" ? "en" : "de");
  updateLangToggle();
  rerenderDynamicText();
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
