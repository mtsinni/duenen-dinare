/* =====================================================================
   15. AKTIONEN DES SPIELERS
   ===================================================================== */

function kannHandeln() {
  const k = karawane(S.gewKarawane), o = oase(S.gewOase);
  return (k && o && k.ort === o.id && o.aktiv) ? { k, o } : null;
}

// --- Grundfunktionen: funktionieren für JEDE Karawane (auch automatische Routen) ---

// hoechstPreis: darüber wird nicht gekauft (wichtig für automatische Routen)
function handelKaufen(k, o, wid, menge, hoechstPreis = Infinity) {
  const w = ware(wid);
  let anzahl = 0, kosten = 0;
  for (let i = 0; i < menge; i++) {
    if (o.lager[wid] < 1 || ladungGewicht(k) + 1 > kapazitaet(k)) break;
    const preis = kaufPreisFuer(k, o, w);  // Preis jedes Mal neu – er steigt beim Kaufen (Feilscher: billiger)
    if (S.gold < preis || preis > hoechstPreis) break;
    // Durchschnittlicher Einkaufspreis ("Einstand") – damit wir später den Gewinn kennen
    const vorher = k.ladung[wid];
    k.einstand[wid] = ((k.einstand[wid] || 0) * vorher + preis) / (vorher + 1);
    S.gold -= preis; o.lager[wid] -= 1; k.ladung[wid] += 1;
    anzahl++; kosten += preis;
  }
  if (anzahl) {
    k.herkunft[wid] = o.id;
    k.bilanz -= kosten;
    buche('Handel', -kosten);
    ansehenAendern(o, kosten / 2500);       // wer viel handelt, wird bekannt
  }
  return { anzahl, betrag: kosten };
}

// mindestPreis: darunter wird nicht verkauft (wichtig für automatische Routen)
function handelVerkaufen(k, o, wid, menge, mindestPreis = 0) {
  const w = ware(wid);
  let anzahl = 0, erloes = 0, gewinn = 0;
  for (let i = 0; i < menge && k.ladung[wid] >= 1; i++) {
    const preis = verkaufPreisFuer(k, o, w); // Preis sinkt mit jeder verkauften Einheit (Feilscher: teurer)
    if (preis < mindestPreis) break;
    S.gold += preis; o.lager[wid] += 1; k.ladung[wid] -= 1;
    anzahl++; erloes += preis; gewinn += preis - (k.einstand[wid] || 0);
  }
  if (anzahl) {
    wunschLieferung(o, wid, anzahl);     // wünscht sich die Oase diese Ware?
    k.bilanz += erloes;
    buche('Handel', erloes);
    ansehenAendern(o, erloes / 2500);
    // Gewinn der Route "Einkaufsort → Verkaufsort" für die Statistik merken
    const von = oase(k.herkunft[wid]);
    if (wid !== 'wasser' && von && von.id !== o.id) {
      const name = `${von.name} → ${o.name}`;
      S.statistik.routen[name] = (S.statistik.routen[name] || 0) + gewinn;
    }
  }
  return { anzahl, betrag: erloes };
}

function reiseStarten(k, ziel) {
  k.von = k.ort; k.nach = ziel.id; k.ort = null; k.gereist = 0;
  if (k.spaeher && typeof spaeherAufbruch === 'function') spaeherAufbruch(k);
}

// --- Buttons: arbeiten mit der ausgewählten Karawane ---

function kaufen(wid, menge) {
  const h = kannHandeln(); if (!h) return;
  const r = handelKaufen(h.k, h.o, wid, menge);
  if (r.anzahl) { ton('kaufen'); effektZahl(h.o.x, h.o.y - 30, -r.betrag); }
  if (r.anzahl < menge && h.o.lager[wid] >= 1) {
    log(ladungGewicht(h.k) + 1 > kapazitaet(h.k) ? T(`${h.k.name} ist voll beladen.`, `${h.k.name} is fully loaded.`) : T('Nicht genug Dinar.', 'Not enough dinars.'));
  }
  zeichnePanel();
}

function verkaufen(wid, menge) {
  const h = kannHandeln(); if (!h) return;
  const r = handelVerkaufen(h.k, h.o, wid, menge);
  if (r.anzahl) { ton('verkaufen'); effektZahl(h.o.x, h.o.y - 30, r.betrag); effektMuenzen(h.o.x, h.o.y - 20, Math.min(12, 3 + Math.round(r.betrag / 150))); }
  zeichnePanel();
}

function tierKaufen(typ) {
  const o = oase(S.gewOase); if (!o || !o.aktiv) return;
  const tier = TIERE[typ];
  if (S.gold < tier.preis) { log(T(`Nicht genug Dinar für ein ${tier.name}.`, `Not enough dinars for a ${tier.name.toLowerCase()}.`)); zeichnePanel(); return; }
  let k = karawane(S.gewKarawane);
  if (!k || k.ort !== o.id) {
    k = neueKarawane(o);
    S.gewKarawane = k.id;
    log(T(`Neue Karawane gegründet: ${k.name} in ${o.name}.`, `New caravan founded: ${k.name} in ${o.name}.`), 'gut');
  }
  S.gold -= tier.preis;
  k.tiere[typ]++;
  ton('tier');
  zeichnePanel();
}

function tierVerkaufen(typ) {
  const h = kannHandeln(); if (!h || h.k.tiere[typ] < 1) return;
  if (ladungGewicht(h.k) > kapazitaet(h.k) - TIERE[typ].kapazitaet) {
    log(T('Erst Ladung verkaufen – sonst kann die Karawane nicht alles tragen.', 'Sell some cargo first – otherwise the caravan cannot carry it all.'));
    zeichnePanel(); return;
  }
  h.k.tiere[typ]--;
  S.gold += Math.floor(TIERE[typ].preis * 0.5);
  if (tierAnzahl(h.k) === 0) {
    S.karawanen = S.karawanen.filter(x => x !== h.k);
    S.gewKarawane = null;
    log(T(`${h.k.name} wurde aufgelöst.`, `${h.k.name} has been disbanded.`));
  }
  zeichnePanel();
}

function wachenAendern(anzahl) {
  const h = kannHandeln(); if (!h) return;
  if (anzahl > 0) {
    if (S.gold < WACHE_PREIS) { log(T('Nicht genug Dinar, um eine Wache anzuheuern.', 'Not enough dinars to hire a guard.')); zeichnePanel(); return; }
    S.gold -= WACHE_PREIS;
    h.k.wachen++;
  } else if (h.k.wachen > 0) {
    h.k.wachen--;   // Entlassen kostet nichts, bringt aber auch nichts zurück
  }
  zeichnePanel();
}

function auftragAnnehmen(id) {
  const a = S.angebote.find(x => x.id === id);
  if (!a || S.auftraege.length >= 3) return;
  S.angebote = S.angebote.filter(x => x !== a);
  S.auftraege.push({ ...a, bisTag: S.tag + a.frist });   // "...a" kopiert alle Felder des Angebots
  log(T(`📜 Auftrag angenommen: ${a.menge} ${ware(a.ware).name} nach ${oase(a.oase).name} bis Tag ${S.tag + a.frist}.`,
        `📜 Contract accepted: ${a.menge} ${ware(a.ware).name.toLowerCase()} to ${oase(a.oase).name} by day ${S.tag + a.frist}.`));
  zeichnePanel();
}

function auftragAbliefern(k, o, a) {
  k.ladung[a.ware] -= a.menge;
  o.lager[a.ware] += a.menge;
  S.gold += a.lohn;
  k.bilanz += a.lohn;
  buche('Aufträge', a.lohn);
  S.auftraege = S.auftraege.filter(x => x !== a);
  log(T(`🤝 Der Scheich von ${o.name} ist zufrieden und zahlt ${a.lohn} Dinar!`, `🤝 The sheikh of ${o.name} is pleased and pays ${a.lohn} dinars!`), 'gut');
  epGeben(k, 40);
  ansehenAendern(o, 10);
}

function auftragErfuellen(id) {
  const a = S.auftraege.find(x => x.id === id);
  const h = kannHandeln();
  if (!a || !h || h.o.id !== a.oase || h.k.ladung[a.ware] < a.menge) return;
  auftragAbliefern(h.k, h.o, a);
  zeichnePanel();
}

function losziehen() {
  const k = karawane(S.gewKarawane), ziel = oase(S.ziel);
  if (!k || !ziel || k.ort == null || tierAnzahl(k) === 0) return;
  if (!ziel.aktiv && !ziel.verlassen) { log(T(`${ziel.name} ist versiegt – dort gibt es nichts mehr.`, `${ziel.name} has dried up – there is nothing left there.`)); zeichnePanel(); return; }
  if (k.route.aktiv) { k.route.aktiv = false; log(T(`🔁 ${k.name}: Handelsroute angehalten (Reise von Hand).`, `🔁 ${k.name}: trade route paused (manual journey).`)); }
  const startOase = oase(k.ort);
  reiseStarten(k, ziel);
  ton('aufbruch');
  if (startOase) effektStaub(startOase.x, startOase.y - 10);
  log(T(`${hauptTier(k).icon} ${k.name} bricht nach ${ziel.name} auf.`, `${hauptTier(k).icon} ${k.name} sets out for ${ziel.name}.`));
  S.ziel = null;
  // Wartet keine andere Karawane mehr auf Befehle (z. B. weil es nur diese eine gibt),
  // läuft die Zeit nach dem Aufbruch von selbst weiter – im zuletzt gewählten Tempo.
  const wartendeAndere = S.karawanen.some(x => x !== k && x.ort != null && !x.route.aktiv && tierAnzahl(x) > 0);
  if (!wartendeAndere) S.pause = false;
  zeichnePanel();
}

// Eigener Name für die ausgewählte Karawane (höchstens 24 Zeichen, ohne Zeichen, die HTML stören)
function karawaneUmbenennen() {
  const k = karawane(S.gewKarawane);
  if (!k || typeof prompt === 'undefined') return;
  const eingabe = prompt(T(`Neuer Name für „${k.name}“:`, `New name for "${k.name}":`), k.name);
  if (eingabe == null) return;                               // abgebrochen
  const neu = eingabe.replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  if (!neu || neu === k.name) return;
  log(T(`✏️ ${k.name} heißt jetzt „${neu}“.`, `✏️ ${k.name} is now called "${neu}".`));
  k.name = neu;
  zeichnePanel();
}

function waehleOase(id) {
  S.gewOase = id;
  const k = karawane(S.gewKarawane);
  // Steht die gewählte Karawane woanders, wird die angetippte Oase zum Reiseziel
  if (k && k.ort != null && k.ort !== id) S.ziel = id;
  else if (k && k.ort === id) S.ziel = null;
  // Neues Reiseziel → Karawanen-Reiter (dort ist „Aufbrechen“), sonst der Markt der Oase
  aktiverReiter = S.ziel === id ? 'karawanen' : 'oase';
  zeichnePanel();
}

function waehleKarawane(id) {
  S.gewKarawane = id; S.ziel = null;
  const k = karawane(id);
  if (k && k.ort != null) S.gewOase = k.ort;
  if (k) ansichtZeigen(k);
  aktiverReiter = 'karawanen';
  zeichnePanel();
}
