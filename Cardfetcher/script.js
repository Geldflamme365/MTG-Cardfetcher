const state = {
  results: [],
  searchSelection: null,
  searchPrints: [],
  collectionSelection: null,
  collectionPrints: [],
  collection: loadCollection()
};

const els = {
  status: document.getElementById("status"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  results: document.getElementById("results"),
  searchDetails: document.getElementById("searchDetails"),
  collection: document.getElementById("collection"),
  collectionDetails: document.getElementById("collectionDetails"),
  views: {
    home: document.getElementById("view-home"),
    suche: document.getElementById("view-suche"),
    collection: document.getElementById("view-collection")
  },
  navLinks: document.querySelectorAll(".nav-link")
};

function setStatus(text, type = "muted") {
  if (!els.status) {
    return;
  }
  els.status.textContent = text;
  els.status.className = `status ${type}`;
}

function escapeHtml(valü) {
  return String(valü)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadCollection() {
  try {
    return JSON.parse(localStorage.getItem("cardfetcher.collection") || "[]");
  } catch {
    return [];
  }
}

function saveCollection() {
  localStorage.setItem("cardfetcher.collection", JSON.stringify(state.collection));
}

function normalizeRoute(hash) {
  const route = hash.replace(/^#\/?/, "").trim().toLowerCase();
  if (!route) return "home";
  if (route === "suche") return "suche";
  if (route === "collection") return "collection";
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

function renderRoute() {
  const route = normalizeRoute(window.location.hash);

  Object.entries(els.views).forEach(([name, node]) => {
    node.classList.toggle("active", name === route);
  });

  const titleMap = {
    home: "MTG Cardfetcher - Home",
    suche: "MTG Cardfetcher - Suche",
    collection: "MTG Cardfetcher - Collection"
  };

  document.title = titleMap[route] || "MTG Cardfetcher";
  setActiveNav(route);
  if (route === "collection") {
    void ensureCollectionSelection();
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function searchCards(qüry) {
  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(qüry)}&unique=cards&order=released`;
  const response = await fetch(url);
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.data || [];
}

async function loadPrintHistory(card) {
  if (!card || !card.prints_search_uri) {
    return [];
  }
  const data = await fetchJson(card.prints_search_uri);
  return (data.data || []).slice().sort((a, b) => new Date(a.released_at) - new Date(b.released_at));
}

function isInCollection(id) {
  return state.collection.some((item) => item.id === id);
}

function getCardPreviewUrl(card) {
  return card.image_uris?.small
    || card.image_uris?.normal
    || card.card_faces?.[0]?.image_uris?.small
    || card.card_faces?.[0]?.image_uris?.normal
    || "";
}

function toggleCollection(card) {
  if (!card) return;

  if (isInCollection(card.id)) {
    state.collection = state.collection.filter((item) => item.id !== card.id);
    setStatus(`${card.name} aus Collection entfernt.`, "ok");

    if (state.collectionSelection?.id === card.id) {
      state.collectionSelection = null;
      state.collectionPrints = [];
    }
  } else {
    state.collection.unshift({
      id: card.id,
      name: card.name,
      set_name: card.set_name,
      released_at: card.released_at,
      image: getCardPreviewUrl(card)
    });
    setStatus(`${card.name} zur Collection hinzugefügt.`, "ok");
  }

  saveCollection();
  renderCollection();
  renderSearchDetails();
  renderCollectionDetails();
}

function renderResults() {
  if (!state.results.length) {
    els.results.innerHTML = `<p class="muted">Keine Treffer.</p>`;
    return;
  }

  els.results.innerHTML = state.results.map((card) => {
    const subtitle = `${card.set_name || "Unbekanntes Set"} - ${card.released_at || "?"}`;
    return `
      <div class="result-item">
        <div>
          <strong>${escapeHtml(card.name)}</strong><br />
          <small>${escapeHtml(subtitle)}</small>
        </div>
        <button type="button" data-select="${card.id}">Anzeigen</button>
      </div>
    `;
  }).join("");

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
  if (!state.collection.length) {
    els.collection.innerHTML = `<p class="muted">Noch keine Karten gespeichert.</p>`;
    return;
  }

  els.collection.innerHTML = `
    <div class="collection-grid">
      ${state.collection.map((card) => `
        <button
          type="button"
          class="collection-tile${state.collectionSelection?.id === card.id ? " active" : ""}"
          data-pick="${card.id}"
          title="${escapeHtml(card.name)}"
        >
          ${card.image
            ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
            : `<span class="collection-fallback">${escapeHtml(card.name)}</span>`
          }
        </button>
      `).join("")}
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

  void ensureCollectionSelection();
}

async function ensureCollectionSelection() {
  if (!state.collection.length) {
    if (state.collectionSelection) {
      state.collectionSelection = null;
      state.collectionPrints = [];
      renderCollectionDetails();
    }
    return;
  }

  if (state.collectionSelection?.id && isInCollection(state.collectionSelection.id)) {
    return;
  }

  try {
    const first = state.collection[0];
    const card = await fetchJson(`https://api.scryfall.com/cards/${first.id}`);
    await selectCollectionCard(card);
  } catch (error) {
    setStatus(`Collection-Karte konnte nicht geladen werden: ${error.message}`, "err");
  }
}

function updateCollectionPreview(card) {
  const image = getCardPreviewUrl(card);
  if (!image) return;

  let changed = false;
  state.collection = state.collection.map((item) => {
    if (item.id === card.id && item.image !== image) {
      changed = true;
      return { ...item, image };
    }
    return item;
  });

  if (changed) {
    saveCollection();
    renderCollection();
  }
}

function renderVersionList(prints, context) {
  if (!prints.length) {
    return `<p class="muted">Keine Versionsdaten vorhanden.</p>`;
  }

  return `
    <div class="versions">
      ${prints.map((print) => `
        <div class="entry">
          <div>
            <strong>${escapeHtml(print.set_name || "Unbekanntes Set")}</strong><br />
            <small class="muted">${escapeHtml(print.collector_number || "?")} - ${escapeHtml(print.released_at || "?")}</small>
          </div>
          <button type="button" data-print="${print.id}" data-context="${context}">Öffnen</button>
        </div>
      `).join("")}
    </div>
  `;
}

function createDetailsHtml(card, prints, context) {
  if (!card) {
    return context === "search"
      ? `<p class="muted">Noch keine Karte ausgewählt.</p>`
      : `<p class="muted">Noch keine Karte aus der Collection geöffnet.</p>`;
  }

  const img = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "";
  const oracleText = card.oracle_text
    || card.card_faces?.map((face) => face.oracle_text || "").filter(Boolean).join("\n\n")
    || "Kein Oracle Text vorhanden.";

  return `
    <div class="details-grid">
      <div>
        ${img ? `<img class="preview" src="${escapeHtml(img)}" alt="${escapeHtml(card.name)}" />` : `<p class="muted">Kein Bild vorhanden.</p>`}
        <div class="details-actions">
          <button type="button" data-toggle-collection="${card.id}">
            ${isInCollection(card.id) ? "Aus Collection entfernen" : "In Collection speichern"}
          </button>
        </div>
      </div>
      <div class="meta">
        <div>
          <h3>${escapeHtml(card.name)}</h3>
          <p class="muted">${escapeHtml(card.type_line || "Unbekannter Typ")}</p>
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

        <div>
          <h3>Vergangene Versionen</h3>
          ${renderVersionList(prints, context)}
        </div>
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

  for (const btn of container.querySelectorAll("button[data-print]")) {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.print;
      const targetContext = btn.dataset.context;

      try {
        setStatus("Lade Version...", "muted");
        const selectedPrint = await fetchJson(`https://api.scryfall.com/cards/${id}`);
        if (targetContext === "search") {
          await selectSearchCard(selectedPrint);
        } else {
          await selectCollectionCard(selectedPrint);
        }
      } catch (error) {
        setStatus(`Version konnte nicht geladen werden: ${error.message}`, "err");
      }
    });
  }
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
  state.searchSelection = card;
  renderSearchDetails();
  setStatus(`Lade Versionshistorie für ${card.name}...`, "muted");

  try {
    state.searchPrints = await loadPrintHistory(card);
    renderSearchDetails();
    setStatus(`Karte geladen: ${card.name}`, "ok");
  } catch (error) {
    state.searchPrints = [];
    renderSearchDetails();
    setStatus(`Versionshistorie konnte nicht geladen werden: ${error.message}`, "err");
  }
}

async function selectCollectionCard(card) {
  state.collectionSelection = card;
  updateCollectionPreview(card);
  renderCollectionDetails();
  setStatus(`Lade Versionshistorie für ${card.name}...`, "muted");

  try {
    state.collectionPrints = await loadPrintHistory(card);
    renderCollection();
    renderCollectionDetails();
    setStatus(`Collection-Karte geladen: ${card.name}`, "ok");
  } catch (error) {
    state.collectionPrints = [];
    renderCollectionDetails();
    setStatus(`Versionshistorie konnte nicht geladen werden: ${error.message}`, "err");
  }
}

async function runSearch() {
  const qüry = els.searchInput.value.trim();
  if (!qüry) {
    setStatus("Bitte einen Suchbegriff eingeben.", "err");
    return;
  }

  setStatus(`Suche nach ${qüry}...`, "muted");
  try {
    state.results = await searchCards(qüry);
    renderResults();

    if (state.results.length) {
      await selectSearchCard(state.results[0]);
      setStatus(`${state.results.length} Treffer gefunden.`, "ok");
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

els.searchBtn.addEventListener("click", runSearch);
els.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    runSearch();
  }
});

window.addEventListener("hashchange", renderRoute);

renderResults();
renderSearchDetails();
renderCollection();
renderCollectionDetails();
renderRoute();

