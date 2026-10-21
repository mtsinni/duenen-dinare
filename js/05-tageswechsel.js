/* =====================================================================
   5. DER TAGESWECHSEL – Wirtschaft, Wasser, Flucht, Kosten, Ereignisse
   ===================================================================== */

function tagesWechsel() {
  S.tag++;
  jahreszeitTag();

  for (const o of S.oasen) {
    if (!o.aktiv) continue;

    // Die Quelle wird langsam schwächer – je mehr Menschen, desto schneller
    // Jeder gebaute Brunnen bremst das Austrocknen
    o.wasser -= Math.max(0.03, 0.12 + o.bev / 8000 - 0.08 * (o.brunnen || 0)) * jahreszeit().austrocknen * (o.hafen ? 0.3 : 1);

    for (const w of WAREN) {
      const festVerbrauch = festFaktor(o, w) > 1 ? 3 : 1;   // beim Fest wird die Ware dreimal so schnell verbraucht
      o.lager[w.id] = Math.max(0, o.lager[w.id] * 0.98 + produktionProTag(o, w) - verbrauchProTag(o, w) * festVerbrauch);
    }

    // Wachstum bei gutem Wasser (kleine Oasen wachsen schneller)
    if (o.wasser > 60 && o.bev < 3000) o.bev *= 1.003 + (o.bev < 400 ? 0.01 : 0);

    // Wassermangel: Menschen fliehen
    if (o.wasser < 20) {
      if (!o.warnung) {
        log(T(`⚠️ In ${o.name} wird das Wasser knapp – die ersten Familien fliehen.`,
              `⚠️ Water is running low in ${o.name} – the first families are leaving.`), 'schlecht');
        o.warnung = true;
      }
      fluchtAus(o, o.bev * 0.04);
    } else if (o.wasser > 30) {
      o.warnung = false;
    }

    if (o.wasser <= 0) versiegen(o);
  }

  // Gefahren für Karawanen unterwegs
  for (const k of [...S.karawanen]) {
    if (k.nach == null) continue;
    const nochDa = () => S.karawanen.includes(k);   // ging die Karawane gerade verloren?

    if (k.durstig && Math.random() < 0.3) tierVerlieren(k, T('verdurstet', 'died of thirst'));
    if (!nochDa()) continue;

    const sturmChance = 0.35 * (1 - 0.12 * (fuehrerStufe(k) - 1));
    if (k.imSturm && !nurKamele(k) && Math.random() < sturmChance) ladungVerlieren(k);

    // Fata Morgana: erfahrene Führer fallen seltener darauf herein
    if (k.verirrt > 0) {
      k.verirrt--;
      if (k.verirrt === 0) log(T(`🧭 ${k.name} hat den richtigen Weg wiedergefunden.`, `🧭 ${k.name} has found the right path again.`));
    } else if (Math.random() < 0.012 * (1 - 0.15 * (fuehrerStufe(k) - 1))) {
      k.verirrt = zufallInt(1, 3);
      log(T(`🌫️ ${k.name} folgt einer Fata Morgana und verirrt sich!`, `🌫️ ${k.name} follows a mirage and gets lost!`), 'schlecht');
    }
  }
  krankheitenTag();

  // Futter, Pflege der Tiere und Sold der Wachen kosten jeden Tag
  let kosten = 0;
  for (const k of S.karawanen) { kosten += unterhaltKosten(k); k.bilanz -= unterhaltKosten(k); }
  S.gold -= kosten;
  if (kosten) buche('Unterhalt', -kosten);

  gebaeudeTag();
  verderben();
  // Wo eigene Leute sind, kennt man die Preise immer aktuell
  for (const o of S.oasen) if (o.aktiv && augenVorOrt(o)) merkePreise(o);

  pruefeAuftraege();
  errungenschaftenPruefen();
  siegPruefen();
  finanzen();
  if (S.bankrott) { speichern(); zeichnePanel(); return; }

  raeuberTag();
  pluendererTag();
  soeldnerTag();
  hafenTag();
  edelsteinTag();
  geruechtTag();
  reisendeTag();
  erkundenTag();
  diplomatieTag();
  festTag();
  rivalenTag();
  zieleTag();

  zufallsEreignisse();
  speichern();
  zeichnePanel();
}

function fluchtAus(o, anzahl) {
  anzahl = Math.min(anzahl, o.bev);
  o.bev -= anzahl;
  // Die Flüchtenden gehen zur nächsten Oase, die noch genug Wasser hat
  const ziele = S.oasen
    .filter(z => z.aktiv && z !== o && z.wasser > 35)
    .sort((a, b) => entfernung(a, o) - entfernung(b, o));
  if (!ziele.length) return null;
  ziele[0].bev += anzahl;
  return ziele[0];
}

function versiegen(o) {
  const ziel = fluchtAus(o, o.bev);
  o.aktiv = false; o.wasser = 0; o.bev = 0;
  for (const w of WAREN) o.lager[w.id] = 0;
  log(T(`🏜️ Die Oase ${o.name} ist versiegt!`, `🏜️ The oasis of ${o.name} has dried up!`) +
      (ziel ? T(` Die letzten Bewohner fliehen nach ${ziel.name}.`, ` The last inhabitants flee to ${ziel.name}.`) : ''), 'schlecht');
}

function tierVerlieren(k, grund) {
  const typen = Object.keys(k.tiere).filter(t => k.tiere[t] > 0);
  if (!typen.length) return;
  const t = typen[zufallInt(0, typen.length - 1)];
  k.tiere[t]--;
  // grund ist schon übersetzt: "verdurstet" bzw. "died of thirst"
  log(T(`☠️ ${k.name}: Ein ${TIERE[t].name} ist ${grund}.`, `☠️ ${k.name}: One ${TIERE[t].name.toLowerCase()} ${grund}.`), 'schlecht');
  if (tierAnzahl(k) === 0) {
    passagiereVerloren(k);
    S.karawanen = S.karawanen.filter(x => x !== k);
    if (S.gewKarawane === k.id) S.gewKarawane = null;
    log(T(`💀 ${k.name} ist in der Wüste verschollen.`, `💀 ${k.name} has been lost in the desert.`), 'schlecht');
  } else {
    ueberladungAbwerfen(k);
  }
}

// Wenn Tiere fehlen, muss Ladung zurückbleiben – zuerst billige Waren, Wasser zuletzt
function ueberladungAbwerfen(k) {
  let zuViel = ladungGewicht(k) - kapazitaet(k);
  const reihenfolge = WAREN.filter(w => w.id !== 'wasser').concat([ware('wasser')]);
  for (const w of reihenfolge) {
    if (zuViel <= 0) break;
    const weg = Math.min(k.ladung[w.id], zuViel);
    k.ladung[w.id] -= weg;
    zuViel -= weg;
  }
}

function ladungVerlieren(k) {
  const vorhanden = WAREN.filter(w => k.ladung[w.id] >= 1);
  if (!vorhanden.length) return;
  const w = vorhanden[zufallInt(0, vorhanden.length - 1)];
  const menge = Math.ceil(k.ladung[w.id] * zufall(0.1, 0.3));
  k.ladung[w.id] -= menge;
  log(T(`🌪️ ${k.name} verliert im Sandsturm ${menge} ${w.name}.`, `🌪️ ${k.name} loses ${menge} ${w.name.toLowerCase()} in the sandstorm.`), 'schlecht');
}
