import { api } from "./api.js";

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
  user: null
};

// Laufende Nummer je Ansicht, um veraltete Antworten zu erkennen.
const selectionCounters = {
  search: 0,
  collection: 0
};

const els = {
  status: document.getElementById("status"),
  routeAddress: document.getElementById("routeAddress"),
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
    account: document.getElementById("view-account")
  },
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
    account: "scry://remasurium/account"
  };
  const label = labels[route] || labels.home;

  if (els.routeAddress) {
    els.routeAddress.textContent = label;
  }
  if (els.routeFooter) {
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
    account: "MTG Remasurium - Account"
  };

  document.title = titleMap[route] || "MTG Remasurium";
  setActiveNav(route);
  updateRouteChrome(route);
  closeVersionModal();
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

async function fetchRandomCard() {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return fetchJson(`https://api.scryfall.com/cards/random?__cb=${encodeURIComponent(nonce)}`, {
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

  const activeFaceIndex = context === "search" ? state.searchFaceIndex : state.collectionFaceIndex;
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
          <button
            type="button"
            class="retro-button collection-button${isInCollection(card.id) ? " is-saved" : ""}"
            data-toggle-collection="${card.id}"
          >
            <span class="collection-button-icon" aria-hidden="true">${isInCollection(card.id) ? "★" : "☆"}</span>
            <span>${isInCollection(card.id) ? "Aus Collection entfernen" : "In Collection speichern"}</span>
          </button>
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

  const flipBtn = container.querySelector("button[data-flip-face]");
  if (flipBtn) {
    flipBtn.addEventListener("click", () => {
      if (context === "search") {
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

  const card = context === "search" ? state.searchSelection : state.collectionSelection;
  const prints = context === "search" ? state.searchPrints : state.collectionPrints;

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
        if (targetContext === "search") {
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
renderResults();
renderSearchDetails();
renderCollection();
renderCollectionDetails();
renderRoute();
setStatus("Bereit. Gib einen Suchbegriff ein.", "muted");
initAuth();
