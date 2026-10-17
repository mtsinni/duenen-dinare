/* =====================================================================
   14. BEWEGUNG – läuft jeden Bildschirm-Frame (flüssige Animation)
   dt = vergangene Zeit in Spieltagen (z. B. 0.008)
   ===================================================================== */

function aktualisiere(dt) {
  S.zeit += dt;
  bewegeKarawanen(dt);
  bewegeRivalen(dt);
  for (const s of S.stuerme) { s.x += s.dx * dt; s.y += s.dy * dt; }
  S.stuerme = S.stuerme.filter(s => s.x > -250 && s.x < KARTE_B + 250);
  S.regen = S.regen.filter(r => r.bis > S.zeit);
  if (S.bluete) S.bluete = S.bluete.filter(b => b.bis > S.zeit);
  while (S.zeit >= S.tag + 1) tagesWechsel();
}

function bewegeKarawanen(dt) {
  for (const k of [...S.karawanen]) {
    if (k.nach == null) continue;
    const start = oase(k.von), ziel = oase(k.nach);

    k.imSturm = S.stuerme.some(s => Math.hypot(k.x - s.x, k.y - s.y) < s.r);
    if (k.imSturm) k.sturmErlebt = true;

    // Tag und Nacht: Nachtmarsch-Karawanen rasten tagsüber im Schatten
    const nacht = istNacht();
    const rastet = k.nachtmarsch && !nacht;
    let durstFaktor = (rastet ? 0.15 : nacht ? 0.5 : istMittagshitze() ? 1.6 : 1.1) * jahreszeit().durst;

    let tempo = rastet ? 0 : reiseTempo(k);
    if (k.imSturm) tempo *= nurKamele(k) ? 0.6 : 0.3;   // Kamele kennen die Stürme
    if (k.durstig) tempo *= 0.5;
    if (k.verirrt > 0) tempo *= -0.3;                     // Fata Morgana: es geht sogar zurück!
    k.gereist = Math.max(0, k.gereist + tempo * dt);

    // Räuber lauern – nachts häufiger, rastende Lager werden seltener entdeckt
    const imRaeuberGebiet = aktiveRaeuber().some(g => Math.hypot(k.x - g.x, k.y - g.y) < g.r);
    const ueberfallProTag = (imRaeuberGebiet ? 0.3 : 0.02) * (nacht ? 1.6 : 0.7) * (rastet ? 0.4 : 1) * sw().raeuber * sereiSchutz(k);
    if (Math.random() < ueberfallProTag * dt) {
      ueberfall(k);
      if (!S.karawanen.includes(k)) continue;
    }

    // Wasser wird unterwegs verbraucht
    const bedarf = karawanenDurst(k) * durstFaktor * dt;
    if (k.ladung.wasser >= bedarf) {
      k.ladung.wasser -= bedarf;
      k.durstig = false;
    } else {
      k.ladung.wasser = 0;
      if (!k.durstig) {
        k.durstig = true;
        log(T(`💧 ${k.name} hat kein Wasser mehr! Die Tiere leiden.`, `💧 ${k.name} has run out of water! The animals are suffering.`), 'schlecht');
      }
    }

    const strecke = entfernung(start, ziel);
    const anteil = Math.min(1, k.gereist / strecke);
    k.x = start.x + (ziel.x - start.x) * anteil;
    k.y = start.y + (ziel.y - start.y) * anteil;
    karawansereiPruefen(k);
    if (anteil >= 1) ankunft(k, ziel);
  }
}

function ankunft(k, ziel) {
  const strecke = entfernung(oase(k.von), ziel);
  k.ort = ziel.id; k.von = null; k.nach = null; k.gereist = 0;
  k.durstig = false; k.imSturm = false; k.rastBei = null;
  log(T(`${hauptTier(k).icon} ${k.name} erreicht ${ziel.name}.`, `${hauptTier(k).icon} ${k.name} reaches ${ziel.name}.`), 'info');
  erkunden(ziel.x, ziel.y, 110, k.name);
  passagiereAbsetzen(k, ziel);

  // Jede Reise macht den Führer erfahrener – ein überstandener Sandsturm besonders
  epGeben(k, Math.round(strecke / 8) + (k.sturmErlebt ? 15 : 0));
  k.sturmErlebt = false;
  if (ziel.aktiv) merkePreise(ziel);    // vor Ort sieht man die aktuellen Preise
  if (S.gewKarawane === k.id) S.gewOase = ziel.id;
  // Von Hand geschickte Karawane angekommen: Spiel anhalten und den Markt der Oase zeigen.
  // Karawanen auf einer Handelsroute fahren von selbst weiter – die halten nicht an.
  if (!k.route.aktiv) {
    S.pause = true;
    S.gewKarawane = k.id; S.gewOase = ziel.id; S.ziel = null;
    if (typeof aktiverReiter !== 'undefined') { aktiverReiter = 'oase'; aktiverOasenReiter = 'markt'; }
  }
  routeFortsetzen(k);                   // fährt die Karawane eine Handelsroute?
  zeichnePanel();
}
