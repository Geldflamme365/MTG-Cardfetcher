// Die Regeln von Magic, soweit das Programm sie braucht.
//
// Hier steht bewusst nichts über Fenster, Knöpfe oder Netzwerk: jede
// Funktion bekommt ihre Daten als Argument und gibt ein Ergebnis zurück.
// Deshalb lässt sich dieser Teil ohne Browser prüfen, siehe
// tests/regeln.test.mjs.

// Reihenfolge der Kartentypen. Eine Karte kann mehrere tragen
// ("Artifact Creature"), gezählt wird der erste Treffer von oben.
export const CARD_TYPES = [
  { key: "Creature", label: "Kreaturen" },
  { key: "Planeswalker", label: "Planeswalker" },
  { key: "Instant", label: "Spontanzauber" },
  { key: "Sorcery", label: "Hexereien" },
  { key: "Artifact", label: "Artefakte" },
  { key: "Enchantment", label: "Verzauberungen" },
  { key: "Battle", label: "Schlachten" },
  { key: "Land", label: "Länder" }
];

export const BASIC_LANDS = [
  { farbe: "W", name: "Plains", label: "Weiss" },
  { farbe: "U", name: "Island", label: "Blau" },
  { farbe: "B", name: "Swamp", label: "Schwarz" },
  { farbe: "R", name: "Mountain", label: "Rot" },
  { farbe: "G", name: "Forest", label: "Grün" }
];

// Ein farbloses Deck hat keine der fünf Farben, spielt aber Standardländer.
export const WASTES = { farbe: "C", name: "Wastes", label: "Farblos" };

// Die Manakurve endet bei 8, alles darüber fällt in den letzten Balken.
export const CURVE_MAX = 8;

export function landZuFarbe(farbe) {
  return farbe === WASTES.farbe ? WASTES : BASIC_LANDS.find((eintrag) => eintrag.farbe === farbe);
}

export function hatTyp(typeLine, key) {
  return new RegExp(`\\b${key}\\b`, "i").test(typeLine);
}

// Ein Land bleibt ein Land, auch wenn die Typzeile noch etwas anderes
// nennt: Artefaktländer, Dryad Arbor, Kreaturenländer.
export function typKategorie(typeLine) {
  if (hatTyp(typeLine, "Land")) {
    return CARD_TYPES.find((eintrag) => eintrag.key === "Land").label;
  }
  const treffer = CARD_TYPES.find((eintrag) => hatTyp(typeLine, eintrag.key));
  return treffer ? treffer.label : "Sonstige";
}

export function istStandardlandTyp(typeLine) {
  return hatTyp(typeLine, "Basic") && hatTyp(typeLine, "Land");
}

// Zählt die farbigen Symbole einer Manakosten-Zeichenkette. Hybride teilen
// sich ihr Gewicht, sonst würde {W/U} für beide Farben voll zählen.
// {2/W} und {W/P} sind dagegen ganze weisse Symbole, weil die zweite
// Hälfte keine Farbe ist.
export function zaehlePips(manaCost) {
  const summe = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (const symbol of (manaCost || "").match(/\{[^}]+\}/g) || []) {
    const teile = symbol.slice(1, -1).split("/");
    const farben = teile.filter((teil) => teil in summe);
    for (const farbe of farben) {
      summe[farbe] += 1 / farben.length;
    }
  }
  return summe;
}

// Die Farbidentität als WUBRG-Kürzel, farblos als C.
export function farbkuerzel(identitaet) {
  const reihenfolge = ["W", "U", "B", "R", "G"];
  const sortiert = reihenfolge.filter((farbe) => identitaet.includes(farbe));
  return sortiert.length ? sortiert.join("") : "C";
}

// Passt die Karte in die Farbidentität des Commanders?
export function passtInFarbidentitaet(karteIdentitaet, commanderIdentitaet) {
  return karteIdentitaet.every((farbe) => commanderIdentitaet.includes(farbe));
}

// Grösste Reste: erst abrunden, dann die übrigen Plätze an die grössten
// Nachkommateile vergeben. So ergibt die Summe immer genau die Vorgabe,
// statt durch Rundung daneben zu liegen.
export function verteileNachAnteil(gesamt, gewichte) {
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

// Manakurve über eine Liste aus { manaValue, quantity, istLand }.
// Länder bleiben draussen, sie haben keine Kosten und würden die Kurve
// nach unten ziehen. Der Durchschnitt rechnet mit dem echten Manawert,
// nicht mit dem gedeckelten, sonst wäre er geschönt.
export function manaKurve(karten) {
  const balken = Array.from({ length: CURVE_MAX + 1 }, () => 0);
  let summe = 0;
  let anzahl = 0;

  for (const karte of karten) {
    if (karte.istLand || typeof karte.manaValue !== "number") continue;
    const stufe = Math.min(Math.max(Math.round(karte.manaValue), 0), CURVE_MAX);
    balken[stufe] += karte.quantity;
    summe += karte.manaValue * karte.quantity;
    anzahl += karte.quantity;
  }

  return { balken, summe, anzahl, schnitt: anzahl ? summe / anzahl : 0 };
}

// Fisher-Yates: jede Reihenfolge ist gleich wahrscheinlich.
export function mischen(liste) {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}
