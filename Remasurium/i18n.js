// Sprachumschaltung Deutsch/Englisch.
//
// Schlüssel ist der deutsche Text selbst. Deutsch ist damit die Vorgabe
// und funktioniert auch dann, wenn im Wörterbuch etwas fehlt: Ohne
// Eintrag bleibt schlicht der deutsche Satz stehen.
//
// Die englischen Brocken im Retro-Rahmen ("search console", "start
// page") bleiben in beiden Sprachen gleich, sie gehören zum Look.

const STORAGE_KEY = "remasurium.lang";

const EN = {
  // Navigation und Rahmen
  "Suche": "Search",
  "Sprache wechseln": "Switch language",
  "Ziehen, um die Breite zu ändern": "Drag to change the width",
  "Schließen": "Close",

  // Startseite
  "Ein reduzierter Old-School-Cardfinder für Magic: The Gathering. Suche Karten, lies Oracle-Text, springe durch Prints und speichere Karten lokal.":
    "A stripped-down old-school card finder for Magic: The Gathering. Search cards, read the Oracle text, jump through printings and keep cards locally.",
  "Name oder Scryfall Query": "Name or Scryfall query",
  "Kartensuche": "Card search",
  "Direkte Suche über Scryfall, inklusive toleranter Suche bei kleinen Tippfehlern.":
    "Searches Scryfall directly and forgives small typos.",
  "Öffnet den offiziellen Regeltext einer Karte in einer lesbaren Detailansicht.":
    "Shows a card's official rules text in a readable detail view.",
  "Wechsle durch frühere Versionen und Sets derselben Karte.":
    "Move through earlier printings and sets of the same card.",
  "Speichere Karten lokal im Browser und rufe sie später wieder auf.":
    "Keep cards in your browser and come back to them later.",
  "Oracle Text ist der aktuelle offizielle Regeltext einer Karte. Gerade bei älteren Prints ist das oft hilfreicher als nur das Bild.":
    "The Oracle text is a card's current official wording. On older printings that is often more use than the picture alone.",

  // Suche
  "Suchen": "Search",
  "Status": "Status",
  "Bereit. Gib einen Suchbegriff ein.": "Ready. Type something to search for.",
  "Tip": "Tip",
  "Normale Namen werden tolerant gesucht. Wenn du Scryfall-Syntax nutzt, bleibt die Suche exakt.":
    "Plain names are matched loosely. Use Scryfall syntax and the search stays exact.",
  "z.B. commodore guff": "e.g. commodore guff",
  "z.B. c:g t:creature": "e.g. c:g t:creature",
  "Kartenname, z.B. sol ring": "Card name, e.g. sol ring",
  "Noch keine Treffer. Starte eine Suche oder nutze ein Beispiel.":
    "No hits yet. Start a search or try an example.",
  "Noch keine Karte ausgewählt.": "No card picked yet.",
  "Noch keine Karte aus der Collection geöffnet.": "No collection card opened yet.",
  "Keine Treffer gefunden.": "Nothing found.",
  "Bitte einen Suchbegriff eingeben.": "Please type something to search for.",
  "Ziehe Zufallskarte...": "Drawing a random card...",
  "Ziehe zufälligen Commander...": "Drawing a random commander...",

  // Kartendetails
  "Oracle Text": "Oracle text",
  "Versionen": "Printings",
  "Kein Bild vorhanden.": "No picture available.",
  "Kein Oracle Text vorhanden.": "No Oracle text available.",
  "Unbekannter Typ": "Unknown type",
  "Unbekanntes Set": "Unknown set",
  "Keine Versionsdaten vorhanden.": "No printing data available.",
  "Kartenseite wechseln": "Turn the card over",
  "In Collection speichern": "Save to collection",
  "Aus Collection entfernen": "Remove from collection",
  "Ins Deck legen": "Put in the deck",
  "Hinzufügen": "Add",
  "Aus dem Deck entfernen": "Take out of the deck",

  // Collection
  "cards saved locally in your browser": "cards saved locally in your browser",
  "Karten in deiner Cloud-Collection": "cards in your cloud collection",
  "Gespeicherte Karten bleiben nur in diesem Browser. Melde dich an, um sie in der Cloud zu sichern.":
    "Saved cards stay in this browser only. Sign in to keep them in the cloud.",
  "Deine Collection liegt auf deinem Konto und ist auf jedem Gerät gleich.":
    "Your collection lives on your account and is the same on every device.",
  "Noch keine Karten gespeichert.": "No cards saved yet.",
  "Mehr Karten suchen": "Search for more cards",

  // Decks
  "Neues Deck": "New deck",
  "Erstellen": "Create",
  "Format": "Format",
  "Bisher gibt es nur Commander: eine Karte je Exemplar, ausser bei Standardländern und Karten wie Relentless Rats. An den übrigen Formaten wird noch gearbeitet.":
    "Only Commander so far: one copy of each card, except basic lands and cards like Relentless Rats. The other formats are still being worked on.",
  "Deck importieren": "Import a deck",
  "Deck exportieren": "Export the deck",
  "deck importieren": "import a deck",
  "deck exportieren": "export a deck",
  "Bereit.": "Ready.",
  "Noch keine Decks. Gib oben einen Namen ein und leg los.":
    "No decks yet. Put a name in above and get going.",
  "Kein Commander gewählt": "No commander picked",
  "Zurück zur Übersicht": "Back to the overview",
  "Deck löschen": "Delete deck",
  "Deckname": "Deck name",
  "Speichern": "Save",
  "Commander": "Commander",
  "Noch keiner gewählt": "None picked yet",
  "Sein Bild steht in der Übersicht für dieses Deck.":
    "Its artwork stands for this deck in the overview.",
  "Mit dem Stern bei einer Karte im Deck festlegen.":
    "Use the star on a card in the deck to pick one.",
  "Als Commander entfernen": "Step down as commander",
  "Karte entfernen": "Remove the card",
  "Quick Add": "Quick add",
  "Nimmt den besten Treffer zum Namen, auch bei kleinen Tippfehlern.":
    "Takes the best match for the name, even with small typos.",
  "Noch keine Karten. Such links eine oder nutze Quick Add.":
    "No cards yet. Find one on the left or use quick add.",
  "Klick auf eine Karte öffnet ihre Details.": "Click a card to see its details.",
  "Klick auf eine Karte öffnet ihre Details. Mit einem Commander passen sich die Vorschläge an.":
    "Click a card to see its details. With a commander the suggestions follow it.",
  "Eine weniger": "One fewer",
  "Eine mehr": "One more",
  "Im Commander ist nur ein Exemplar erlaubt": "Commander allows only one copy",
  "Als Commander festlegen": "Make this the commander",
  "Entfernen": "Remove",
  "Deck umbenennen": "Rename deck",
  "Kartenliste": "Card list",
  "Name (optional)": "Name (optional)",
  "Als neues Deck importieren": "Import as a new deck",
  "Kopieren": "Copy",
  "Eine Karte pro Zeile, davor die Anzahl. Set-Angaben in Klammern und Kommentarzeilen werden überlesen. Die erste Karte, die Commander sein darf, wird dazu. Danach öffnet sich das Deck, wo du den Namen jederzeit ändern kannst.":
    "One card per line, the number first. Sets in brackets and comment lines are skipped. The first card allowed to be a commander becomes one. The deck opens right after, where you can change the name at any time.",
  "Eine Karte pro Zeile, davor die Anzahl. Der Commander steht vorn, damit sich die Liste unverändert wieder einlesen lässt.":
    "One card per line, the number first. The commander goes first so the list can be read back unchanged.",
  "Die Liste ist leer.": "The list is empty.",

  // Kartentypen und Einklappen
  "Suchfenster einklappen": "Collapse the search panel",
  "Suchfenster ausklappen": "Open the search panel",
  "Kreaturen": "Creatures",
  "Spontanzauber": "Instants",
  "Hexereien": "Sorceries",
  "Artefakte": "Artifacts",
  "Verzauberungen": "Enchantments",
  "Schlachten": "Battles",
  "Sonstige": "Other",

  // Dev-Notiz auf der Startseite
  "Das Projekt wird laufend weitergebaut. Was als Nächstes ansteht:":
    "The project keeps growing. What is coming next:",
  "Die Deck-Ansicht ist noch in Arbeit, der Deck-Editor wird optisch überarbeitet.":
    "The deck section is still being built, and the deck editor is due a visual pass.",
  "Weitere Formate neben Commander: Standard, Modern und Pauper.":
    "More formats besides Commander: Standard, Modern and Pauper.",
  "Ein Login-Limit gegen Passwort-Raten steht, ein Passwort-Reset per Mail fehlt noch.":
    "A login limit against password guessing is in place, a password reset by email is still missing.",
  "Rückmeldung": "Feedback",
  "Was fehlt dir? Sag es über „Rückmeldung“ oben in der Leiste.":
    "Missing something? Tell us through “Feedback” up in the bar.",

  // Rückmeldungen
  "rückmeldung": "feedback",
  "Bewertung": "Rating",
  "5 – sehr gut": "5 – very good",
  "4 – gut": "4 – good",
  "3 – geht so": "3 – so-so",
  "2 – schwach": "2 – weak",
  "1 – schlecht": "1 – bad",
  "Was ist dir aufgefallen?": "What did you notice?",
  "Was gefällt dir, was fehlt, was ist kaputt?":
    "What do you like, what is missing, what is broken?",
  "Anonym": "Anonymous",
  "Absenden": "Send",
  "Noch nichts abgeschickt.": "Nothing sent yet.",
  "Wird gesendet...": "Sending...",
  "Danke für die Rückmeldung.": "Thanks for the feedback.",
  "Bitte schreib etwas in die Rückmeldung.": "Please write something in the feedback.",
  "Alle Rückmeldungen": "All feedback",
  "Nur für das Adminkonto sichtbar.": "Only visible to the admin account.",
  "Noch keine Rückmeldungen.": "No feedback yet.",
  "Rückmeldung löschen": "Delete feedback",
  "Rückmeldung gelöscht.": "Feedback deleted.",

  // Regelprüfung
  "legal": "legal",
  "nicht legal": "not legal",
  "wird geprüft": "checking",
  "Regelprüfung anzeigen": "Show the rules check",
  "regelprüfung commander": "commander rules check",
  "Das Deck erfüllt die Commander-Regeln.": "The deck meets the Commander rules.",
  "{count} Punkte sprechen gegen ein legales Commander-Deck.":
    "{count} things stand in the way of a legal Commander deck.",
  "Dem Deck fehlt ein Commander.": "The deck has no commander.",
  "Das Deck hat {count} Karten, es fehlen {diff} auf 100.":
    "The deck has {count} cards, {diff} short of 100.",
  "Das Deck hat {count} Karten, {diff} zu viel für 100.":
    "The deck has {count} cards, {diff} too many for 100.",
  "{name}: {count} Exemplare, erlaubt ist eines.":
    "{name}: {count} copies, only one is allowed.",
  "{name} ist im Commander verboten.": "{name} is banned in Commander.",
  "{name} ist im Commander nicht zugelassen.": "{name} is not allowed in Commander.",
  "{name} passt nicht zur Farbidentität {colors} des Commanders.":
    "{name} does not fit the commander's colour identity {colors}.",
  "Geprüft werden die Deckgrösse von genau 100 Karten inklusive Commander, ein Exemplar je Karte ausser bei Standardländern und Relentless-Karten, im Commander verbotene Karten sowie die Farbidentität des Commanders. Karten, an denen etwas hängt, sind im Deck rot umrandet.":
    "Checked are the deck size of exactly 100 cards including the commander, one copy of each card apart from basic lands and Relentless cards, cards banned in Commander, and the commander's colour identity. Cards that cause a problem get a red border in the deck.",
  "Kreaturen": "Creatures",
  "Spells": "Spells",
  "Kartenziehen": "Card draw",
  "Länder": "Lands",
  "farblos": "colourless",

  // Konto
  "Anmelden": "Sign in",
  "Konto erstellen": "Create account",
  "Passwort vergessen": "Forgot password",
  "E-Mail": "Email",
  "Passwort": "Password",
  "Anzeigename": "Display name",
  "optional": "optional",
  "Mindestens 8 Zeichen.": "At least 8 characters.",
  "Passwort zurücksetzen": "Reset password",
  "Wiederherstellungscode": "Recovery code",
  "Gib deinen Wiederherstellungscode ein. Den hast du bei der Registrierung bekommen.":
    "Enter your recovery code. You got it when you signed up.",
  "Neues Passwort": "New password",
  "Angemeldet als": "Signed in as",
  "Dabei seit": "Member since",
  "Karten in der Cloud": "Cards in the cloud",
  "Abmelden": "Sign out",
  "Damit kommst du wieder an dein Konto, wenn du das Passwort vergisst. Ein neuer Code macht den alten ungültig.":
    "This gets you back into your account if you forget the password. A new code makes the old one useless.",
  "Neuen Code erzeugen": "Make a new code",
  "Dein Wiederherstellungscode": "Your recovery code",
  "Schreib ihn auf oder speichere ihn. Er wird nur dieses eine Mal angezeigt und ist der einzige Weg zurück ins Konto, wenn du dein Passwort vergisst.":
    "Write it down or save it. It is shown this one time only and is the only way back into your account if you forget your password.",
  "Habe ich gespeichert": "I have saved it",
  "Nicht angemeldet.": "Not signed in.",
  "Collection in der Cloud": "Collection in the cloud",
  "Mit Konto liegt deine Collection auf Cloudflare statt nur im Browser. Gleicher Stand auf Handy und Laptop.":
    "With an account your collection sits on Cloudflare instead of just in the browser. Same on phone and laptop.",
  "Nichts geht verloren": "Nothing gets lost",
  "Beim ersten Login werden die Karten aus diesem Browser automatisch übernommen.":
    "The cards from this browser are taken over automatically the first time you sign in.",
  "Ohne Konto nutzbar": "Works without an account",
  "Suche und lokale Collection funktionieren weiter ohne Anmeldung.":
    "Search and the local collection keep working without signing in.",
  "Später: Decks": "Later: decks",
  "Auf dem Konto sollen künftig auch Decks aus deiner Collection gebaut werden können.":
    "Building decks from your collection is meant to come to the account too.",

  // Meldungen mit Platzhaltern
  "{name} zur Collection hinzugefügt.": "{name} added to the collection.",
  "{name} aus Collection entfernt.": "{name} removed from the collection.",
  "{name} ins Deck gelegt.": "{name} put in the deck.",
  "Karte entfernt.": "Card removed.",
  "{count} Treffer.": "{count} hits.",
  "{count} Treffer gefunden.": "{count} hits found.",
  "Karte geladen: {name}": "Card loaded: {name}",
  "Zufälliger Commander: {name}": "Random commander: {name}",
  "Zufallskarte geladen: {name}": "Random card loaded: {name}",
  "Deck geöffnet: {name}": "Deck opened: {name}",
  'Deck "{name}" angelegt.': 'Deck "{name}" created.',
  'Deck "{name}" gelöscht.': 'Deck "{name}" deleted.',
  "Deckname gespeichert.": "Deck name saved.",
  'Deck heisst jetzt "{name}".': 'The deck is now called "{name}".',
  "{name} ist jetzt Commander.": "{name} is the commander now.",
  "{name} steht wieder als Karte im Deck.": "{name} is back in the deck as a card.",
  "{name} aus dem Deck entfernt.": "{name} taken out of the deck.",
  "Lade Deck...": "Loading deck...",
  "Lege Deck an...": "Creating deck...",
  "Vorschläge passend zu {name} ({colors}).": "Suggestions to match {name} ({colors}).",
  "{count} von {total} Karten übernommen.": "{count} of {total} cards taken over.",
  " Nicht gefunden: {names}.": " Not found: {names}.",
  "{count} Zeilen exportiert.": "{count} lines exported.",
  "Liste in die Zwischenablage kopiert.": "List copied to the clipboard.",
  "Scryfall ist gerade nicht erreichbar.": "Scryfall cannot be reached right now.",
  "Verbindung zu Scryfall unterbrochen, neuer Versuch...":
    "Connection to Scryfall dropped, trying again...",
  "Scryfall bremst gerade, versuche es gleich nochmal...":
    "Scryfall is throttling us, trying again shortly...",
  "{count} Karte": "{count} card",
  "{count} Karten": "{count} cards"
};

let lang = localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "de";
const originals = new WeakMap();

export function getLang() {
  return lang;
}

// Übersetzt einen Text und setzt Platzhalter der Form {name} ein.
export function t(text, params) {
  let out = lang === "en" ? EN[text] ?? text : text;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      out = out.replaceAll(`{${key}}`, value);
    }
  }
  return out;
}

function translateNode(node) {
  if (!originals.has(node)) {
    originals.set(node, node.nodeValue);
  }
  const source = originals.get(node);
  // Im Markup umbrochene Absätze kommen mit Zeilenumbrüchen und
  // Einrückung an. Für den Schlüssel zählt nur der Text selbst.
  const key = source.replace(/\s+/g, " ").trim();
  if (!key) {
    return;
  }
  const replacement = lang === "en" ? EN[key] : null;
  node.nodeValue = replacement || source;
}

// Die Originale liegen in einer Map statt in data-Attributen: dataset
// verbietet Bindestriche im Namen, "aria-label" wäre dort nicht
// speicherbar.
const originalAttributes = new WeakMap();

function translateAttributes(element) {
  for (const attribute of ["placeholder", "title", "aria-label"]) {
    if (!element.hasAttribute(attribute)) {
      continue;
    }

    let saved = originalAttributes.get(element);
    if (!saved) {
      saved = {};
      originalAttributes.set(element, saved);
    }
    if (saved[attribute] === undefined) {
      saved[attribute] = element.getAttribute(attribute);
    }

    const source = saved[attribute];
    const key = source.replace(/\s+/g, " ").trim();
    element.setAttribute(attribute, (lang === "en" && EN[key]) || source);
  }
}

// Läuft über alle Textknoten und Attribute unterhalb von root. Dadurch
// braucht das Markup keine Marker, und frisch gerenderte Inhalte lassen
// sich mit demselben Aufruf nachziehen.
export function translateTree(root) {
  if (!root) {
    return;
  }

  if (root.nodeType === Node.TEXT_NODE) {
    translateNode(root);
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  nodes.forEach(translateNode);

  if (root.nodeType === Node.ELEMENT_NODE) {
    translateAttributes(root);
  }
  root.querySelectorAll?.("[placeholder], [title], [aria-label]").forEach(translateAttributes);
}

export function setLang(next) {
  lang = next === "en" ? "en" : "de";
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  translateTree(document.body);
}

// Neu eingefügte Knoten werden automatisch mitübersetzt, damit jede
// dynamisch erzeugte Liste ohne eigenen Aufruf richtig erscheint.
export function watchForNewContent() {
  new MutationObserver((records) => {
    if (lang === "de") {
      return;
    }
    for (const record of records) {
      for (const node of record.addedNodes) {
        translateTree(node);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}
