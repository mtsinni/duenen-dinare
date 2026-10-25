/* =====================================================================
   6. ZUFALLSEREIGNISSE – Sandsturm, Hitze, Starkregen
   ===================================================================== */

function zufallsEreignisse() {
  const j = jahreszeit(), wetter = sw().wetter;
  if (Math.random() < 0.05 * j.sturm * wetter && S.stuerme.length < 2) sandsturm();
  if (Math.random() < 0.02 * j.hitze * wetter) hitzewelle();
  if (Math.random() < 0.042 * j.regen / wetter) starkregen();   // die Karte ist seit der Küste größer – mehr Regen
}

function sandsturm() {
  const vonWesten = Math.random() < 0.5;
  S.stuerme.push({
    x: vonWesten ? -120 : KARTE_B + 120,
    y: zufall(100, 600),
    r: zufall(90, 150),
    dx: (vonWesten ? 1 : -1) * zufall(60, 110),  // Bewegung pro Tag
    dy: zufall(-25, 25),
  });
  log(vonWesten ? T('🌪️ Ein Sandsturm zieht von Westen auf!', '🌪️ A sandstorm is rising in the west!')
                : T('🌪️ Ein Sandsturm zieht von Osten auf!', '🌪️ A sandstorm is rising in the east!'), 'schlecht');
}

function hitzewelle() {
  const kandidaten = S.oasen.filter(o => o.aktiv && !o.hafen);   // der Hafen hat große Zisternen
  if (!kandidaten.length) return;
  const o = kandidaten[zufallInt(0, kandidaten.length - 1)];
  o.wasser = Math.max(0, o.wasser - zufall(25, 45));
  log(T(`☀️ Gnadenlose Hitze! Die Quellen von ${o.name} gehen stark zurück.`, `☀️ Merciless heat! The springs of ${o.name} are drying up fast.`), 'schlecht');
}

function starkregen() {
  const x = zufall(80, KARTE_B - 170), y = zufall(80, KARTE_H - 80), r = 230;
  S.regen.push({ x, y, r, bis: S.zeit + 2 });
  // Nach dem Regen blüht die Wüste: Gras und Blumen für etwa zwei Wochen
  if (!S.bluete) S.bluete = [];
  S.bluete.push({ x, y, r: r * 0.85, von: S.zeit + 0.6, bis: S.zeit + 15 });
  log(T('🌧️ Starke Regenfälle gehen über der Wüste nieder!', '🌧️ Heavy rain is falling over the desert!'), 'gut');

  for (const o of S.oasen) {
    if (Math.hypot(o.x - x, o.y - y) > r) continue;
    if (o.aktiv) {
      o.wasser = Math.min(100, o.wasser + zufall(25, 45));
    } else if (Math.random() < 0.5) {
      o.aktiv = true; o.wasser = 45; o.bev = 40; delete o.verlassen;
      log(T(`💧 Die Quelle von ${o.name} sprudelt wieder! Erste Siedler kehren zurück.`, `💧 The spring of ${o.name} is flowing again! The first settlers return.`), 'gut');
    }
  }

  // Vielleicht entsteht eine ganz neue Oase
  const aktive = S.oasen.filter(o => o.aktiv);
  const platzFrei = S.oasen.every(o => Math.hypot(o.x - x, o.y - y) > 120);
  if (aktive.length < 12 && platzFrei && Math.random() < 0.5) {
    const benutzt = S.oasen.map(o => o.name);
    const name = NEUE_NAMEN.find(n => !benutzt.includes(n)) || 'Neue Quelle ' + S.naechsteId;
    const auswahl = WAREN.filter(w => w.id !== 'gold' && w.id !== 'wasser' && !w.see && !w.mine && !w.veredelt);
    const produkt = auswahl[zufallInt(0, auswahl.length - 1)].id;

    const quelle = aktive.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    let siedler = 60;
    if (quelle) { siedler = Math.min(120, quelle.bev * 0.1); quelle.bev -= siedler; }

    S.oasen.push(neueOase(name, x, y, ['wasser', produkt], siedler));
    log(T(`🌱 Wo der Regen fiel, ist eine neue Oase entstanden: ${name}!`, `🌱 Where the rain fell, a new oasis has appeared: ${name}!`) +
        (quelle ? T(` Siedler aus ${quelle.name} ziehen dorthin.`, ` Settlers from ${quelle.name} are moving there.`) : ''), 'gut');
  }
}
