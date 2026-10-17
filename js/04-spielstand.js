/* =====================================================================
   4. SPIELSTAND ANLEGEN
   Alles, was sich im Spiel verändert, steckt im Objekt S ("State").
   So lässt es sich mit einer Zeile speichern und laden.
   ===================================================================== */

let S;

function neueOase(name, x, y, produziert, bev) {
  // [...produziert] macht eine Kopie – sonst würden Änderungen (z. B. durch die Eisenmine)
  // die Vorlage in den Grunddaten verändern und in jedes neue Spiel mitwandern.
  const o = { id: S.naechsteId++, name, x, y, produziert: [...produziert], bev,
              wasser: zufall(60, 95), aktiv: true, warnung: false, lager: {} };
  for (const w of WAREN) {
    o.lager[w.id] = (w.selten || w.veredelt) ? 0 : normBestand(o, w) * (produziert.includes(w.id) ? 3 : zufall(0.3, 1.2));
  }
  return o;
}

function neueKarawane(o) {
  const k = {
    id: S.naechsteId++, name: T('Karawane ', 'Caravan ') + (++S.karawanenZaehler),
    tiere: { esel: 0, pferd: 0, kamel: 0, elefant: 0 }, ladung: {},
    ort: o.id, von: null, nach: null, gereist: 0, x: o.x, y: o.y,
    durstig: false, imSturm: false, sturmErlebt: false,
  };
  for (const w of WAREN) k.ladung[w.id] = 0;
  karawaneAufruesten(k);
  S.karawanen.push(k);
  return k;
}

// Alle Felder, die eine Karawane braucht – fehlt eines (alter Spielstand), wird es ergänzt
function karawaneAufruesten(k) {
  if (!k.fuehrer) k.fuehrer = neuerFuehrer();
  if (k.wachen == null) k.wachen = 0;
  if (!k.route) k.route = { stationen: [], index: 0, aktiv: false };
  if (!k.einstand) k.einstand = {};     // durchschnittlicher Einkaufspreis je Ware
  if (!k.herkunft) k.herkunft = {};     // wo die Ware zuletzt gekauft wurde
  if (k.bilanz == null) k.bilanz = 0;   // Gewinn/Verlust dieser Karawane
  if (k.krank == null) k.krank = 0;     // Tage, die die Krankheit noch dauert
  if (k.verirrt == null) k.verirrt = 0; // Tage, die sie noch einer Fata Morgana folgt
  if (k.nachtmarsch == null) k.nachtmarsch = false;
  if (!k.passagiere) k.passagiere = [];
}

function neuerFuehrer() {
  return { name: FUEHRER_NAMEN[zufallInt(0, FUEHRER_NAMEN.length - 1)], ep: 0 };
}

// Ein Räuberlager an zufälliger Stelle – aber nicht direkt in einer Oase
function neuesRaeuberGebiet() {
  let g;
  for (let versuch = 0; versuch < 30; versuch++) {
    g = { x: zufall(150, KARTE_B - 220), y: zufall(120, KARTE_H - 120), r: zufall(80, 110), ruhtBis: 0 };
    g.staerke = g.r < 90 ? 1 : g.r < 102 ? 2 : 3;   // kleine, mittlere oder große Bande
    if (S.oasen.every(o => entfernung(o, g) > g.r * 0.6 + 40)) break;
  }
  g.id = S.naechsteId++;
  return g;
}

// Zu Spielbeginn wird zufällig eine Oase ausgewählt, in deren Nähe Eisen gefunden wird.
// Die Mine liegt vor der Oase (große Oasen: weiter weg) – nicht im Meer und nicht zu nah an anderen Oasen.
function eisenmineAnlegen() {
  const kandidaten = S.oasen.filter(o => o.aktiv && !o.hafen);
  if (!kandidaten.length) return;
  const o = kandidaten[zufallInt(0, kandidaten.length - 1)];
  let ort = null;
  for (let versuch = 0; versuch < 40 && !ort; versuch++) {
    const mindest = 62 + o.bev / 60;   // Timbuktu (1400 Einwohner) ≈ 85, Taoudenni (300) ≈ 67
    const w = zufall(0, Math.PI * 2), d = zufall(mindest, mindest + 20);
    const p = { x: o.x + Math.cos(w) * d, y: o.y + Math.sin(w) * d * 0.75 };
    const passt = entfernung(o, p) >= mindest * 0.85 && p.x > 50 && p.x < KARTE_B - 120 && p.y > 40 && p.y < KARTE_H - 40 &&
                  S.oasen.every(z => z === o || entfernung(z, p) > 90);
    if (passt) ort = p;
  }
  if (!ort) ort = { x: o.x - 80, y: o.y - 15 };
  S.eisenmine = { oase: o.id, x: ort.x, y: ort.y };
  if (!o.produziert.includes('eisen')) o.produziert.push('eisen');
  o.lager.eisen = normBestand(o, ware('eisen')) * 3;
  return o;
}

// Jeden Tag: Mit geringer Chance stoßen die Bergleute auf Edelsteine.
// Die Mine selbst bietet sie auf dem Markt ihrer Oase an – deine eigene Schmiede legt sie ins Lagerhaus.
function edelsteinTag() {
  if (!S.eisenmine) return;
  const o = oase(S.eisenmine.oase);
  if (!o.aktiv) return;
  if (Math.random() < 0.06) {
    const anzahl = zufallInt(2, 5);
    o.lager.edelsteine += anzahl;
    S.eisenmine.funkelnBis = S.tag + 4;
    log(T(`💎 In der Eisenmine bei ${o.name} wurden ${anzahl} Edelsteine gefunden! Sie liegen jetzt auf dem Markt.`,
          `💎 Miners at ${o.name} found ${anzahl} gemstones! They are now for sale at the market.`), 'gut');
  }
  const g = S.gebaeude[o.id];
  if (g && g.betrieb === 'eisen' && Math.random() < 0.05) {
    const anzahl = zufallInt(1, 3);
    g.lager.edelsteine += anzahl;
    S.eisenmine.funkelnBis = S.tag + 4;
    log(T(`💎 Deine Schmiede in ${o.name} hat beim Erzschmelzen ${anzahl} Edelstein${anzahl > 1 ? 'e' : ''} entdeckt – ab ins Lagerhaus!`,
          `💎 Your smithy in ${o.name} found ${anzahl} gemstone${anzahl > 1 ? 's' : ''} while smelting ore – straight into the warehouse!`), 'gut');
  }
}

function neuesSpiel(schwierigkeit = 'normal', slot = 1, einfuehrung = false) {
  S = { tag: 1, zeit: 1.25, gold: SCHWIERIGKEITEN[schwierigkeit].startGold, tempo: 1, pause: false,
        schwierigkeit, slot, tutorial: { schritt: einfuehrung ? 0 : -1 },
        oasen: [], karawanen: [], stuerme: [], regen: [], log: [],
        raeuber: [], angebote: [], auftraege: [],
        schulden: 0, ueberzogen: false, schuldenWarnung: false, bankrott: false,
        naechsteId: 1, karawanenZaehler: 0,
        gewOase: null, gewKarawane: null, ziel: null };
  for (const d of OASEN_START) S.oasen.push(neueOase(d.name, d.x, d.y, d.produziert, d.bev));
  S.raeuber.push(neuesRaeuberGebiet(), neuesRaeuberGebiet());
  aufruesten();
  const start = S.oasen.find(o => o.name === 'Agadez');
  const k = neueKarawane(start);
  k.tiere.kamel = 3;
  k.ladung.wasser = 20;
  S.gewOase = start.id;
  S.gewKarawane = k.id;
  merkePreise(start);
  if (einfuehrung) S.pause = true;   // in Ruhe umschauen
  log(T(`Willkommen, Händler! Deine erste Karawane wartet in Agadez. Vergiss das Wasser nicht!`,
        `Welcome, merchant! Your first caravan is waiting in Agadez. Don't forget the water!`) +
      ` (${SCHWIERIGKEITEN[schwierigkeit].icon} ${SCHWIERIGKEITEN[schwierigkeit].name})`, 'info');
}

function speichern() {
  try {
    S.zusammenfassung = { rang: RAENGE[S.rang].name, vermoegen: vermoegen() };
    localStorage.setItem(slotSchluessel(S.slot || 1), JSON.stringify(S));
    localStorage.setItem('karawane-zuletzt', String(S.slot || 1));
  } catch (e) {}
}
function laden() {
  alterSpielstandUebernehmen();
  return ladeSlot(zuletztGespielt());
}

// Ältere Spielstände kennen die neuen Funktionen noch nicht – wir ergänzen sie
function aufruesten() {
  if (!S.angebote) S.angebote = [];
  if (!S.auftraege) S.auftraege = [];
  if (!S.raeuber) S.raeuber = [neuesRaeuberGebiet(), neuesRaeuberGebiet()];
  if (S.schulden == null) S.schulden = 0;
  // Altes Minus aus früheren Versionen wird zu Schulden
  if (S.gold < 0) { S.schulden += -S.gold; S.gold = 0; }
  if (!S.wissen) S.wissen = {};         // gemerkte Preise: { oasenId: { tag, kauf, verk, lager } }
  if (!S.gebaeude) S.gebaeude = {};     // { oasenId: { lager: {ware: menge}, betrieb: wareId|null } }
  if (!S.ansehen) S.ansehen = {};       // { oasenId: 0..100 }
  if (!S.feste) S.feste = [];
  if (!S.rivalen || !S.rivalen.length) S.rivalen = neueRivalen();
  for (const r of S.rivalen) { const v = RIVALEN_START.find(x => x.name === r.name); if (v) r.farbe = v.farbe; }
  if (!S.statistik) S.statistik = { verlauf: [], routen: {}, einnahmen: {}, ausgaben: {} };
  if (!S.erledigt) S.erledigt = [];     // erledigte Aufgaben der Kampagne
  if (!S.erfolge) S.erfolge = {};       // Zähler wie gebauteBrunnen, zerstoerteLager ...
  if (S.rang == null) S.rang = 0;
  if (!S.schwierigkeit) S.schwierigkeit = 'normal';
  if (!S.slot) S.slot = 1;
  if (!S.tutorial) S.tutorial = { schritt: -1 };
  // Neue Waren überall eintragen (Lager, Ladung, Gebäude, gemerkte Preise)
  for (const w of WAREN) {
    for (const o of S.oasen) if (o.lager[w.id] == null) o.lager[w.id] = (w.see || w.selten || w.veredelt) ? 0 : normBestand(o, w);
    for (const k of S.karawanen) if (k.ladung[w.id] == null) k.ladung[w.id] = 0;
    for (const id in S.gebaeude) if (S.gebaeude[id].lager[w.id] == null) S.gebaeude[id].lager[w.id] = 0;
    for (const id in S.wissen) for (const teil of ['kauf', 'verk', 'lager']) if (S.wissen[id][teil][w.id] == null) S.wissen[id][teil][w.id] = '?';
  }
  if (!S.oasen.some(o => o.name === 'Suakin')) {
    ostenHinzufuegen();
    if (S.tag > 1) log(T('🗺️ Kundschafter haben den Osten erkundet: Hinter Dakhla und Selima liegt die Hafenstadt Suakin am Meer!',
                       '🗺️ Scouts have explored the east: beyond Dakhla and Selima lies the port of Suakin on the sea!'), 'gut');
  }
  // Indigo wächst seit v9 in Agadez und Timbuktu
  for (const o of S.oasen) {
    if (['Agadez', 'Timbuktu'].includes(o.name) && !o.produziert.includes('indigo')) {
      o.produziert.push('indigo');
      o.lager.indigo = normBestand(o, ware('indigo')) * 3;
    }
  }
  for (const id in S.gebaeude) if (!S.gebaeude[id].stufe) S.gebaeude[id].stufe = 1;
  if (!S.eisenmine || !oase(S.eisenmine.oase)) {
    const o = eisenmineAnlegen();
    if (o && S.tag > 1) log(T(`⚒️ Bei ${o.name} wurde Eisen gefunden! Die neue Mine liefert Eisenwaren.`,
                              `⚒️ Iron has been found near ${o.name}! The new mine supplies ironware.`), 'gut');
  }
  abenteuerAnlegen();
  for (const r of S.rivalen) {
    if (r.beziehung == null) r.beziehung = 0;
    if (r.buendnis == null) r.buendnis = false;
  }
  for (const g of S.raeuber) {
    if (g.ruhtBis == null) g.ruhtBis = 0;
    if (g.id == null) g.id = S.naechsteId++;
  }
  if (!S.soeldner) S.soeldner = [];   // angeheuerte Truppen gegen Räuberlager
  // Rang-System: bestes Vermögen, Umsatz der letzten 30 Tage, Zähler für den Sultan
  if (S.rekordVermoegen == null) S.rekordVermoegen = Math.max(RAENGE[S.rang || 0].ab, S.karawanen.length ? vermoegen() : S.gold);
  if (!S.umsatzVerlauf) S.umsatzVerlauf = [];
  if (S.rangSeitTag == null) S.rangSeitTag = S.tag;
  if (S.schwacheTage == null) S.schwacheTage = 0;
  if (S.schuldenTage == null) S.schuldenTage = 0;
  for (const k of S.karawanen) karawaneAufruesten(k);
}

function log(text, art = 'info') {
  tonZuMeldung(text, art);
  S.log.unshift({ tag: S.tag, text, art });
  if (typeof aktiverReiter !== 'undefined' && aktiverReiter !== 'ereignisse') ungeleseneMeldungen++;
  S.log = S.log.slice(0, 60);
}
