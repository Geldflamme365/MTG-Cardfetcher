// Prüfungen für die Regellogik. Laufen ohne Browser und ohne Netz:
//   node --test tests/
import test from "node:test";
import assert from "node:assert/strict";

import {
  typKategorie,
  istStandardlandTyp,
  zaehlePips,
  farbkuerzel,
  passtInFarbidentitaet,
  verteileNachAnteil,
  manaKurve,
  mischen,
  landZuFarbe
} from "../Remasurium/regeln.js";

test("Ein Land bleibt ein Land, auch mit weiteren Typen", () => {
  assert.equal(typKategorie("Land Creature — Forest Dryad"), "Länder");
  assert.equal(typKategorie("Artifact Land"), "Länder");
  assert.equal(typKategorie("Enchantment Land — Urza's Saga"), "Länder");
  assert.equal(typKategorie("Instant // Land"), "Länder");
});

test("Sonst zählt der erste Typ der Reihenfolge", () => {
  assert.equal(typKategorie("Artifact Creature — Myr"), "Kreaturen");
  assert.equal(typKategorie("Legendary Creature — Human Shaman"), "Kreaturen");
  assert.equal(typKategorie("Instant"), "Spontanzauber");
  assert.equal(typKategorie("Sorcery"), "Hexereien");
  assert.equal(typKategorie("Was auch immer"), "Sonstige");
});

test("Standardländer werden erkannt", () => {
  assert.equal(istStandardlandTyp("Basic Land — Forest"), true);
  assert.equal(istStandardlandTyp("Land — Swamp Forest"), false);
});

test("Farbige Symbole zählen, Hybride je zur Hälfte", () => {
  assert.deepEqual(zaehlePips("{2}{B}{G}"), { W: 0, U: 0, B: 1, R: 0, G: 1 });
  assert.deepEqual(zaehlePips("{U}{U}"), { W: 0, U: 2, B: 0, R: 0, G: 0 });
  assert.deepEqual(zaehlePips("{W/U}"), { W: 0.5, U: 0.5, B: 0, R: 0, G: 0 });
  // Phyrexianisch und Zwei-Generisch sind ganze farbige Symbole.
  assert.deepEqual(zaehlePips("{W/P}"), { W: 1, U: 0, B: 0, R: 0, G: 0 });
  assert.deepEqual(zaehlePips("{2/W}"), { W: 1, U: 0, B: 0, R: 0, G: 0 });
  // Generisch und leer bringen nichts ein.
  assert.deepEqual(zaehlePips("{15}"), { W: 0, U: 0, B: 0, R: 0, G: 0 });
  assert.deepEqual(zaehlePips(""), { W: 0, U: 0, B: 0, R: 0, G: 0 });
});

test("Farbkürzel folgen der WUBRG-Reihenfolge", () => {
  assert.equal(farbkuerzel(["G", "B"]), "BG");
  assert.equal(farbkuerzel(["R"]), "R");
  assert.equal(farbkuerzel([]), "C");
});

test("Farbidentität: farblose Karten passen überall", () => {
  assert.equal(passtInFarbidentitaet([], ["B", "G"]), true);
  assert.equal(passtInFarbidentitaet(["G"], ["B", "G"]), true);
  assert.equal(passtInFarbidentitaet(["R"], ["B", "G"]), false);
  assert.equal(passtInFarbidentitaet(["B", "R"], ["B", "G"]), false);
});

test("Verteilung trifft die Vorgabe genau", () => {
  // 5 zu 2 Symbole auf 34 Länder: 24 und 10, zusammen genau 34.
  const v = verteileNachAnteil(34, [5, 2]);
  assert.deepEqual(v, [24, 10]);
  assert.equal(v.reduce((a, b) => a + b, 0), 34);
});

test("Verteilung: Reste gehen an die grössten Nachkommateile", () => {
  // Drei gleiche Gewichte auf 10: 4/3/3, nicht 3/3/3 mit verlorenem Rest.
  const v = verteileNachAnteil(10, [1, 1, 1]);
  assert.equal(v.reduce((a, b) => a + b, 0), 10);
  assert.deepEqual(v.slice().sort(), [3, 3, 4]);
});

test("Verteilung: Grenzfälle stürzen nicht ab", () => {
  assert.deepEqual(verteileNachAnteil(0, [1, 2]), [0, 0]);
  assert.deepEqual(verteileNachAnteil(10, []), []);
  // Ohne farbige Symbole gleichmässig aufteilen, nicht in eine Endlosschleife.
  assert.deepEqual(verteileNachAnteil(4, [0, 0]), [2, 2]);
});

test("Manakurve: Länder raus, Deckel bei 8, echter Durchschnitt", () => {
  const kurve = manaKurve([
    { manaValue: 1, quantity: 4, istLand: false },
    { manaValue: 2, quantity: 1, istLand: false },
    { manaValue: 4, quantity: 2, istLand: false },
    { manaValue: 5, quantity: 1, istLand: false },
    { manaValue: 15, quantity: 1, istLand: false },
    { manaValue: 0, quantity: 6, istLand: true }
  ]);
  assert.deepEqual(kurve.balken, [0, 4, 1, 0, 2, 1, 0, 0, 1]);
  assert.equal(kurve.anzahl, 9);
  // 1*4 + 2 + 4*2 + 5 + 15 = 34, geteilt durch 9.
  assert.equal(kurve.summe, 34);
  assert.equal(kurve.schnitt.toFixed(2), "3.78");
});

test("Mischen behält alle Karten und ändert das Original nicht", () => {
  const stapel = Array.from({ length: 40 }, (_, i) => i);
  const gemischt = mischen(stapel);
  assert.equal(gemischt.length, 40);
  assert.deepEqual([...gemischt].sort((a, b) => a - b), stapel);
  assert.deepEqual(stapel, Array.from({ length: 40 }, (_, i) => i));
});

test("Mischen liefert nicht immer dieselbe Reihenfolge", () => {
  const stapel = Array.from({ length: 40 }, (_, i) => i);
  const ergebnisse = new Set(Array.from({ length: 20 }, () => mischen(stapel).join(",")));
  assert.ok(ergebnisse.size > 1, "20 Ziehungen ergaben immer dieselbe Reihenfolge");
});

test("Farbe zu Standardland", () => {
  assert.equal(landZuFarbe("B").name, "Swamp");
  assert.equal(landZuFarbe("C").name, "Wastes");
});
