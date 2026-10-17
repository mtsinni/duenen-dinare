/* =====================================================================
   16. PREISGEDÄCHTNIS, GEBÄUDE UND HANDELSROUTEN
   ===================================================================== */

// --- Preisgedächtnis: aktuelle Preise kennt man nur, wenn man vor Ort ist ---

function merkePreise(o) {
  const p = { tag: S.tag, kauf: {}, verk: {}, lager: {} };
  for (const w of WAREN) {
    p.kauf[w.id] = kaufPreis(o, w);
    p.verk[w.id] = verkaufPreis(o, w);
    p.lager[w.id] = Math.floor(o.lager[w.id]);
  }
  S.wissen[o.id] = p;
}

// Eine eigene Karawane oder ein eigenes Gebäude vor Ort = man sieht die Preise live
function augenVorOrt(o) {
  return S.karawanen.some(k => k.ort === o.id) || !!S.gebaeude[o.id] || verbuendeteVorOrt(o);
}

function boteSenden() {
  const o = oase(S.gewOase);
  if (!o || !o.aktiv || S.gold < BOTE_PREIS) return;
  S.gold -= BOTE_PREIS;
  buche('Boten', -BOTE_PREIS);
  merkePreise(o);
  log(T(`🏃 Ein Bote bringt die aktuellen Preise aus ${o.name}.`, `🏃 A messenger brings the latest prices from ${o.name}.`));
  zeichnePanel();
}

// --- Gebäude: Lagerhaus und Betrieb ---

function lagerBestand(g) { return Object.values(g.lager).reduce((a, b) => a + b, 0); }
function lagerPlatz(g) { return AUSBAU[g.stufe || 1].platz; }
function ausbauFaktor(g) { return AUSBAU[g.stufe || 1].faktor; }

function lagerhausBauen() {
  const h = kannHandeln();
  if (!h || S.gebaeude[h.o.id] || S.gold < LAGERHAUS.preis) return;
  S.gold -= LAGERHAUS.preis;
  buche('Bauten', -LAGERHAUS.preis);
  const g = { lager: {}, betrieb: null, werkstatt: null, stufe: 1 };
  for (const w of WAREN) g.lager[w.id] = 0;
  S.gebaeude[h.o.id] = g;
  log(T(`🏛️ Dein Lagerhaus in ${h.o.name} ist fertig!`, `🏛️ Your warehouse in ${h.o.name} is finished!`), 'gut');
  ansehenAendern(h.o, 5);
  zeichnePanel();
}

function betriebBauen(wid) {
  const h = kannHandeln();
  const g = h && S.gebaeude[h.o.id];
  if (!g || g.betrieb || S.gold < BETRIEB.preis || !h.o.produziert.includes(wid)) return;
  S.gold -= BETRIEB.preis;
  buche('Bauten', -BETRIEB.preis);
  g.betrieb = wid;
  log(T(`${BETRIEB_NAMEN[wid]} in ${h.o.name} nimmt die Arbeit auf!`, `${BETRIEB_NAMEN[wid]} in ${h.o.name} starts work!`), 'gut');
  ansehenAendern(h.o, 8);
  zeichnePanel();
}

function gebaeudeAusbauen() {
  const h = kannHandeln();
  const g = h && S.gebaeude[h.o.id];
  const naechste = g && AUSBAU[(g.stufe || 1) + 1];
  if (!naechste || S.gold < naechste.preis) return;
  S.gold -= naechste.preis;
  buche('Bauten', -naechste.preis);
  g.stufe = (g.stufe || 1) + 1;
  log(T(`🏗️ Dein Standort in ${h.o.name} ist jetzt Stufe ${g.stufe}: ${naechste.platz} Lagerplätze, Betriebe arbeiten ${zahlText(naechste.faktor)}-mal so schnell.`,
        `🏗️ Your site in ${h.o.name} is now level ${g.stufe}: ${naechste.platz} storage spaces, businesses work ${zahlText(naechste.faktor)} times as fast.`), 'gut');
  ansehenAendern(h.o, 5);
  zeichnePanel();
}

function werkstattBauen(id) {
  const h = kannHandeln();
  const g = h && S.gebaeude[h.o.id], W = WERKSTAETTEN[id];
  if (!g || g.werkstatt || !W || S.gold < W.preis) return;
  S.gold -= W.preis;
  buche('Bauten', -W.preis);
  g.werkstatt = id;
  g.werkRest = 0;
  log(T(`${W.name} in ${h.o.name} öffnet! Bring die Rohstoffe ins Lagerhaus.`, `${W.name} in ${h.o.name} opens! Bring the raw materials to the warehouse.`), 'gut');
  ansehenAendern(h.o, 8);
  zeichnePanel();
}

function rezeptText(werte) {
  return Object.entries(werte).map(([id, n]) => `${n} ${ware(id).icon} ${ware(id).name}`).join(' + ');
}

// Ein Tag in der Werkstatt: so viele Durchgänge, wie Zeit und Rohstoffe erlauben
function werkstattTag(g, o) {
  const W = WERKSTAETTEN[g.werkstatt];
  g.werkGestern = 0;
  if (!o.aktiv) return;
  g.werkRest = (g.werkRest || 0) + W.proTag * ausbauFaktor(g);
  while (g.werkRest >= 1) {
    const genug = Object.entries(W.rezept).every(([id, n]) => g.lager[id] >= n);
    if (!genug) break;
    for (const [id, n] of Object.entries(W.rezept)) g.lager[id] -= n;
    for (const [id, n] of Object.entries(W.ergebnis)) g.lager[id] += n;
    g.werkRest -= 1;
    g.werkGestern++;
  }
  g.werkRest = Math.min(g.werkRest, W.proTag * ausbauFaktor(g));   // ungenutzte Zeit sammelt sich nicht an
}

// Ware von der Karawane ins Lagerhaus (gibt die Menge zurück)
function einlagern(k, o, wid, menge) {
  const g = S.gebaeude[o.id];
  if (!g || k.ort !== o.id) return 0;
  const n = Math.floor(Math.min(menge, k.ladung[wid], lagerPlatz(g) - lagerBestand(g)));
  if (n <= 0) return 0;
  k.ladung[wid] -= n; g.lager[wid] += n;
  return n;
}

// Ware aus dem Lagerhaus auf die Karawane
function auslagern(k, o, wid, menge) {
  const g = S.gebaeude[o.id];
  if (!g || k.ort !== o.id) return 0;
  const n = Math.floor(Math.min(menge, g.lager[wid], kapazitaet(k) - ladungGewicht(k)));
  if (n <= 0) return 0;
  // Eigene Ware hat keinen Einkaufspreis – der Einstand sinkt entsprechend
  const vorher = k.ladung[wid];
  k.einstand[wid] = ((k.einstand[wid] || 0) * vorher) / (vorher + n);
  k.herkunft[wid] = o.id;
  g.lager[wid] -= n; k.ladung[wid] += n;
  return n;
}

function lagerAktion(richtung, wid) {
  const k = karawane(S.gewKarawane), o = oase(S.gewOase);
  if (!k || !o) return;
  if (richtung === 'ein') einlagern(k, o, wid, Infinity);
  else auslagern(k, o, wid, Infinity);
  zeichnePanel();
}

// Läuft jeden Tag: Betriebe produzieren, Gebäude kosten Unterhalt
function gebaeudeTag() {
  let kosten = 0;
  for (const id in S.gebaeude) {
    const g = S.gebaeude[id], o = oase(+id);
    kosten += LAGERHAUS.unterhalt * (g.stufe || 1);
    if (g.werkstatt) { kosten += WERKSTAETTEN[g.werkstatt].unterhalt; werkstattTag(g, o); }
    if (g.betrieb) {
      kosten += BETRIEB.unterhalt;
      if (o.aktiv) {
        const menge = betriebProduktion(g.betrieb) * Math.min(1, o.wasser / 30) * ausbauFaktor(g);
        g.lager[g.betrieb] += Math.max(0, Math.min(menge, lagerPlatz(g) - lagerBestand(g)));
      }
    }
  }
  kosten += S.karawansereien.length * KARAWANSEREI.unterhalt;
  S.gold -= kosten;
  if (kosten) buche('Gebäude', -kosten);
}

// Verderbliche Waren (Datteln) werden jeden Tag weniger – unterwegs und im Lager
function verderben() {
  for (const w of WAREN) {
    if (!w.verderb) continue;
    for (const k of S.karawanen) k.ladung[w.id] *= 1 - w.verderb;
    for (const id in S.gebaeude) S.gebaeude[id].lager[w.id] *= 1 - w.verderb;
  }
}

// --- Handelsrouten: Karawanen fahren eine feste Runde selbstständig ab ---

const ROUTE_MENGEN = [10, 20, 30, 50, 'voll'];

// Wie viel Wasser braucht k von a nach b? Mit 80 % Reserve – ein Sandsturm kann die Reise stark verlängern
function wasserFuer(k, a, b) {
  const tage = entfernung(a, b) / Math.max(1, reiseTempo(k));
  return Math.max(3, Math.ceil(karawanenDurst(k) * tage * 1.8 * Math.max(1, jahreszeit().durst)));
}

function routeFortsetzen(k) {
  const r = k.route;
  if (!r.aktiv || r.stationen.length < 2 || k.ort == null) return;
  r.index %= r.stationen.length;

  // Steht die Karawane an ihrer aktuellen Station? Dann dort handeln und weiterzählen
  if (r.stationen[r.index].oase === k.ort) {
    stationAbarbeiten(k, r.stationen[r.index]);
    r.index = (r.index + 1) % r.stationen.length;
  }

  // Versiegte Oasen überspringen
  for (let i = 0; i < r.stationen.length && !oase(r.stationen[r.index].oase).aktiv; i++) {
    r.index = (r.index + 1) % r.stationen.length;
  }
  const hier = oase(k.ort), ziel = oase(r.stationen[r.index].oase);
  if (!ziel.aktiv || ziel.id === hier.id) {
    r.aktiv = false;
    log(T(`🔁 ${k.name}: Route angehalten – kein erreichbares Ziel.`, `🔁 ${k.name}: route paused – no reachable destination.`), 'schlecht');
    return;
  }

  // Wasser für die Etappe auffüllen
  const bedarf = wasserFuer(k, hier, ziel);
  if (bedarf > k.ladung.wasser && hier.aktiv) handelKaufen(k, hier, 'wasser', Math.ceil(bedarf - k.ladung.wasser));
  if (k.ladung.wasser < bedarf / 1.8) {
    log(T(`⚠️ ${k.name} bekommt in ${hier.name} nicht genug Wasser für die Reise nach ${ziel.name}!`, `⚠️ ${k.name} cannot get enough water in ${hier.name} for the journey to ${ziel.name}!`), 'schlecht');
  }
  reiseStarten(k, ziel);
}

function stationAbarbeiten(k, st) {
  const o = oase(k.ort);
  if (!o.aktiv) return;
  const g = S.gebaeude[o.id];
  const teile = [];

  // 1. Aufträge, die hierhin gehen, automatisch abliefern
  for (const a of [...S.auftraege]) {
    if (a.oase === o.id && k.ladung[a.ware] >= a.menge) auftragAbliefern(k, o, a);
  }

  // 2. Ladung abgeben: ins eigene Lagerhaus oder verkaufen
  for (const w of WAREN) {
    if (w.id === 'wasser' || w.id === st.kaufWare || k.ladung[w.id] < 1) continue;
    if (st.lagerAbgeben && g) {
      const n = einlagern(k, o, w.id, Infinity);
      if (n) teile.push(T(`${n} ${w.name} eingelagert`, `${n} ${w.name.toLowerCase()} stored`));
    } else if (st.verkaufen) {
      // Nie mit Verlust verkaufen – lieber zur nächsten Station mitnehmen
      const r = handelVerkaufen(k, o, w.id, Infinity, Math.ceil(k.einstand[w.id] || 0));
      if (r.anzahl) teile.push(T(`${r.anzahl} ${w.name} verkauft (+${r.betrag} 🪙)`, `${r.anzahl} ${w.name.toLowerCase()} sold (+${r.betrag} 🪙)`));
      if (k.ladung[w.id] >= 1) teile.push(T(`${Math.floor(k.ladung[w.id])} ${w.name} behalten (Preis zu niedrig)`, `${Math.floor(k.ladung[w.id])} ${w.name.toLowerCase()} kept (price too low)`));
    }
  }

  // Platz für das Wasser der nächsten Etappe freihalten
  const naechste = oase(k.route.stationen[(k.route.index + 1) % k.route.stationen.length].oase);
  const freierPlatz = () => kapazitaet(k) - ladungGewicht(k) -
                            Math.max(0, wasserFuer(k, o, naechste) - k.ladung.wasser);

  // 3. Aus dem eigenen Lagerhaus abholen
  if (st.lagerAbholen && g) {
    for (const w of WAREN) {
      if (w.id === 'wasser') continue;
      const n = auslagern(k, o, w.id, Math.max(0, freierPlatz()));
      if (n) teile.push(T(`${n} ${w.name} abgeholt`, `${n} ${w.name.toLowerCase()} collected`));
    }
  }

  // 4. Einkaufen – aber nur, wenn der Preis vernünftig ist (höchstens 30 % über Grundpreis)
  if (st.kaufWare) {
    const w = ware(st.kaufWare);
    const menge = Math.max(0, Math.min(freierPlatz(), st.kaufMenge === 'voll' ? Infinity : st.kaufMenge));
    if (kaufPreis(o, w) > w.basis * 1.3) {
      teile.push(T(`${w.name} zu teuer`, `${w.name} too expensive`));
    } else {
      const r = handelKaufen(k, o, w.id, menge);
      if (r.anzahl) teile.push(T(`${r.anzahl} ${w.name} gekauft (−${r.betrag} 🪙)`, `${r.anzahl} ${w.name.toLowerCase()} bought (−${r.betrag} 🪙)`));
    }
  }

  if (teile.length) log(T(`🔁 ${k.name} in ${o.name}: `, `🔁 ${k.name} in ${o.name}: `) + teile.join(', ') + '.');
}

function routeStationHinzu() {
  const k = karawane(S.gewKarawane), o = oase(S.gewOase);
  if (!k || !o || !o.aktiv || k.route.stationen.length >= 6) return;
  const letzte = k.route.stationen[k.route.stationen.length - 1];
  if (letzte && letzte.oase === o.id) return;
  k.route.stationen.push({ oase: o.id, kaufWare: null, kaufMenge: 20,
                           verkaufen: true, lagerAbgeben: false, lagerAbholen: false });
  zeichnePanel();
}

// Tippen auf einen Knopf einer Station schaltet die Einstellung weiter
function routeStationAendern(i, feld) {
  const k = karawane(S.gewKarawane);
  const st = k && k.route.stationen[i];
  if (!st) return;
  if (feld === 'weg') {
    k.route.stationen.splice(i, 1);
    if (k.route.stationen.length < 2) k.route.aktiv = false;
    k.route.index = 0;
  } else if (feld === 'ware') {
    const liste = [null, ...WAREN.filter(w => w.id !== 'wasser').map(w => w.id)];
    st.kaufWare = liste[(liste.indexOf(st.kaufWare) + 1) % liste.length];
  } else if (feld === 'menge') {
    st.kaufMenge = ROUTE_MENGEN[(ROUTE_MENGEN.indexOf(st.kaufMenge) + 1) % ROUTE_MENGEN.length];
  } else {
    st[feld] = !st[feld];   // verkaufen / lagerAbgeben / lagerAbholen an- oder ausschalten
  }
  zeichnePanel();
}

function routeUmschalten() {
  const k = karawane(S.gewKarawane);
  if (!k) return;
  if (!k.route.aktiv && k.route.stationen.length < 2) {
    log(T('Eine Route braucht mindestens 2 Stationen.', 'A route needs at least 2 stops.')); zeichnePanel(); return;
  }
  k.route.aktiv = !k.route.aktiv;
  if (k.route.aktiv) {
    log(T(`🔁 ${k.name} fährt jetzt selbstständig ihre Handelsroute.`, `🔁 ${k.name} now runs its trade route on its own.`), 'gut');
    S.ziel = null;
    routeFortsetzen(k);
  } else {
    log(T(`🔁 ${k.name}: Handelsroute angehalten.`, `🔁 ${k.name}: trade route paused.`));
  }
  zeichnePanel();
}

// --- Ansehen bei den Oasen ---

const ANSEHEN_STUFEN = [[0, 'Fremder', 'Stranger'], [25, 'Bekannter', 'Acquaintance'], [50, 'Freund', 'Friend'], [75, 'Ehrengast', 'Guest of honour']];
function ansehenTitel(wert) {
  let titel = ANSEHEN_STUFEN[0];
  for (const stufe of ANSEHEN_STUFEN) if (wert >= stufe[0]) titel = stufe;
  return T(titel[1], titel[2]);
}

function ansehenAendern(o, menge) {
  const vorher = ansehen(o);
  const nachher = Math.max(0, Math.min(100, vorher + menge));
  S.ansehen[o.id] = nachher;
  if (ansehenTitel(nachher) !== ansehenTitel(vorher)) {
    log(T(`🏅 In ${o.name} bist du jetzt: ${ansehenTitel(nachher)}.`, `🏅 In ${o.name} you are now: ${ansehenTitel(nachher)}.`), nachher > vorher ? 'gut' : 'schlecht');
  }
}
