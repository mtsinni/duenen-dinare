/* =====================================================================
   9. LEBENDIGE WÜSTE – Tag & Nacht, Krankheiten, Fata Morgana,
       Feste, Brunnen, Tierheiler, Räuberlager und die Konkurrenz
   ===================================================================== */

// --- Tag und Nacht ---
function tagesAnteil() { return S.zeit - Math.floor(S.zeit); }   // 0 = Mitternacht, 0.5 = Mittag
function stunde() { return Math.floor(tagesAnteil() * 24); }
function istNacht() { const h = tagesAnteil() * 24; return h < 6 || h >= 20; }
function istMittagshitze() { const h = tagesAnteil() * 24; return h >= 10 && h < 17; }

// --- Tierseuchen ---
const HEILER_AB_BEV = 800, HEILER_PREIS = 50;   // Preis pro Tier

function krankheitenTag() {
  for (const k of [...S.karawanen]) {
    if (k.krank > 0) {
      k.krank--;
      if (Math.random() < 0.12) tierVerlieren(k, T('an der Seuche gestorben', 'died of the plague'));
      if (!S.karawanen.includes(k)) continue;
      // Ansteckung: andere Karawanen in derselben Oase
      if (k.ort != null) {
        for (const a of S.karawanen) {
          if (a !== k && a.ort === k.ort && !a.krank && Math.random() < 0.2) {
            a.krank = zufallInt(8, 14);
            log(T(`🤒 Die Seuche springt auf ${a.name} über!`, `🤒 The plague spreads to ${a.name}!`), 'schlecht');
          }
        }
      }
      if (k.krank === 0) log(T(`💚 Die Tiere von ${k.name} sind wieder gesund.`, `💚 The animals of ${k.name} are healthy again.`), 'gut');
    } else if (Math.random() < Math.min(0.04, tierAnzahl(k) * 0.003) * sw().seuchen) {
      // Je mehr Tiere, desto eher bricht etwas aus
      k.krank = zufallInt(8, 14);
      log(T(`🤒 In ${k.name} ist eine Tierseuche ausgebrochen! Ein Tierheiler in einer großen Oase kann helfen.`,
            `🤒 A plague has broken out in ${k.name}! An animal healer in a large oasis can help.`), 'schlecht');
    }
  }
}

function heilen() {
  const h = kannHandeln();
  if (!h || !h.k.krank || h.o.bev < HEILER_AB_BEV) return;
  const preis = HEILER_PREIS * tierAnzahl(h.k);
  if (S.gold < preis) return;
  S.gold -= preis;
  buche('Heiler', -preis);
  h.k.krank = 0;
  log(T(`💚 Der Tierheiler von ${h.o.name} kuriert die Tiere von ${h.k.name}.`, `💚 The animal healer of ${h.o.name} cures the animals of ${h.k.name}.`), 'gut');
  zeichnePanel();
}

// --- Brunnen bauen ---
function brunnenPreis(o) { return 800 * ((o.brunnen || 0) + 1); }

function brunnenBauen() {
  const h = kannHandeln();
  if (!h) return;
  const o = h.o, preis = brunnenPreis(o);
  if ((o.brunnen || 0) >= 3 || S.gold < preis) return;
  const inNot = o.wasser < 35;
  S.gold -= preis;
  buche('Bauten', -preis);
  o.brunnen = (o.brunnen || 0) + 1;
  o.wasser = Math.min(100, o.wasser + 30);
  o.warnung = false;
  S.erfolge.brunnen = (S.erfolge.brunnen || 0) + 1;
  if (inNot) S.erfolge.retter = (S.erfolge.retter || 0) + 1;
  ansehenAendern(o, inNot ? 30 : 15);
  log(inNot ? T(`💧 In letzter Not lässt du in ${o.name} einen Brunnen vertiefen – die Menschen feiern dich als Retter!`,
                `💧 In the nick of time you have a well deepened in ${o.name} – the people hail you as their saviour!`)
            : T(`💧 Du lässt in ${o.name} einen Brunnen vertiefen.`, `💧 You have a well deepened in ${o.name}.`), 'gut');
  zeichnePanel();
}

// --- Feste und Märkte ---
function festTag() {
  S.feste = S.feste.filter(f => f.bis >= S.tag && oase(f.oase).aktiv);
  if (Math.random() < 0.04 * jahreszeit().feste && S.feste.length < 2) {
    const kandidaten = S.oasen.filter(o => o.aktiv && o.bev >= 300 && !S.feste.some(f => f.oase === o.id));
    if (!kandidaten.length) return;
    const o = kandidaten[zufallInt(0, kandidaten.length - 1)];
    const waren = WAREN.filter(w => w.id !== 'wasser' && !o.produziert.includes(w.id));
    const w = waren[zufallInt(0, waren.length - 1)];
    const dauer = zufallInt(5, 8);
    S.feste.push({ oase: o.id, ware: w.id, bis: S.tag + dauer });
    log(T(`🎉 In ${o.name} beginnt ein großes Fest! ${dauer} Tage lang wird ${w.name} dort besonders gut bezahlt.`,
          `🎉 A great festival begins in ${o.name}! For ${dauer} days, ${w.name.toLowerCase()} fetches top prices there.`), 'gut');
  }
}

// --- Räuberlager ---
function aktiveRaeuber() { return S.raeuber.filter(g => S.tag >= g.ruhtBis); }

function raeuberTag() {
  for (let i = 0; i < S.raeuber.length; i++) {
    const g = S.raeuber[i];
    if (g.ruhtBis && S.tag >= g.ruhtBis) {
      // Ein zerstörtes Lager: nach einer Weile sammelt sich eine neue Bande
      S.raeuber[i] = neuesRaeuberGebiet();
      log(T('⚔️ Eine neue Räuberbande hat sich in der Wüste festgesetzt!', '⚔️ A new band of robbers has settled in the desert!'), 'schlecht');
    } else if (S.tag >= g.ruhtBis && Math.random() < 0.02) {
      S.raeuber[i] = neuesRaeuberGebiet();
      log(T('⚔️ Kundschafter berichten: Eine Räuberbande hat ein neues Lager bezogen.', '⚔️ Scouts report: a band of robbers has moved to a new camp.'), 'schlecht');
    }
  }
}

// --- Die Konkurrenz: andere Handelshäuser ---
const RIVALEN_START = [
  { name: 'Al-Farsi', farbe: '#7b3fa0' },
  { name: 'Kader',    farbe: '#0f8a5f' },
  { name: 'Nadir',    farbe: '#a8322b' },
];

function neueRivalen() {
  return RIVALEN_START.map(r => ({ ...r, name: T('Haus ', 'House ') + r.name, gold: 3000, karawanen: [rivalenKarawane()] }));
}

function rivalenKarawane() {
  const aktive = S.oasen.filter(o => o.aktiv);
  const o = aktive[zufallInt(0, aktive.length - 1)];
  return { ort: o.id, von: null, nach: null, gereist: 0, x: o.x, y: o.y,
           tempo: zufall(45, 60), kap: Math.round(25 * sw().rivalen), ware: null, menge: 0, warten: zufall(0, 2) };
}

function rivalenVermoegen(r) {
  let wert = r.gold + r.karawanen.length * 2000;
  for (const k of r.karawanen) if (k.ware) wert += k.menge * ware(k.ware).basis;
  return wert;
}

// Läuft jeden Frame: Konkurrenz-Karawanen reisen und handeln
function bewegeRivalen(dt) {
  for (const r of S.rivalen) {
    for (const k of r.karawanen) {
      if (k.nach == null) {
        k.warten -= dt;
        if (k.warten <= 0) rivaleHandelt(r, k);
        continue;
      }
      const a = oase(k.von), b = oase(k.nach);
      const sturm = S.stuerme.some(s => Math.hypot(k.x - s.x, k.y - s.y) < s.r);
      k.gereist += k.tempo * dt * (sturm ? 0.4 : 1);
      const anteil = Math.min(1, k.gereist / entfernung(a, b));
      k.x = a.x + (b.x - a.x) * anteil;
      k.y = a.y + (b.y - a.y) * anteil;
      if (anteil >= 1) {
        k.ort = b.id; k.von = null; k.nach = null; k.gereist = 0;
        rivaleVerkauft(r, k, b);
        k.warten = zufall(0.5, 1.5);
      }
    }
  }
}

function rivaleVerkauft(r, k, o) {
  if (!k.ware) return;
  const w = ware(k.ware);
  if (o.aktiv) {
    while (k.menge >= 1) { r.gold += grundVerkaufPreis(o, w); o.lager[w.id] += 1; k.menge--; }
  }
  k.ware = null; k.menge = 0;
}

// Die Konkurrenz sucht das lohnendste Geschäft (Gewinn pro Reisetag)
function rivaleHandelt(r, k) {
  const o = oase(k.ort);
  let bester = null;
  if (o.aktiv) {
    for (const w of WAREN) {
      if (w.id === 'wasser' || o.lager[w.id] < 10 || !hausDarfHandeln(r, w.id)) continue;
      const kp = grundKaufPreis(o, w);
      for (const z of S.oasen) {
        if (!z.aktiv || z === o) continue;
        const d = entfernung(o, z);
        if (d > 450) continue;
        const menge = Math.min(k.kap, Math.floor(o.lager[w.id] * 0.5), Math.floor(r.gold / kp));
        if (menge < 5) continue;
        const gewinn = (grundVerkaufPreis(z, w) * 0.7 - kp) * menge / (d / k.tempo + 1);
        if (!bester || gewinn > bester.gewinn) bester = { w, z, menge, gewinn };
      }
    }
  }

  let ziel;
  if (bester && bester.gewinn > 0) {
    for (let i = 0; i < bester.menge; i++) {
      const p = grundKaufPreis(o, bester.w);
      if (r.gold < p || o.lager[bester.w.id] < 1) break;
      r.gold -= p; o.lager[bester.w.id] -= 1; k.menge++;
    }
    k.ware = bester.w.id;
    ziel = bester.z;
  } else {
    // Nichts Lohnendes hier – leer zu einer anderen Oase weiterziehen
    const nahe = S.oasen.filter(z => z.aktiv && z !== o && entfernung(o, z) < 400);
    if (!nahe.length) { k.warten = 2; return; }
    ziel = nahe[zufallInt(0, nahe.length - 1)];
  }
  k.von = o.id; k.nach = ziel.id; k.ort = null; k.gereist = 0;
}

// Täglich: Konkurrenz wächst – oder wird ausgeraubt
function rivalenTag() {
  for (const r of S.rivalen) {
    r.gold = Math.max(0, r.gold - 25 * r.karawanen.length);   // auch die Konkurrenz muss ihre Tiere füttern
    // Knapp bei Kasse? Dann wird eine Karawane verkauft – oder kleine Geschäfte in der Heimat helfen über die Runden
    if (r.gold < 400 && r.karawanen.length > 1) {
      r.karawanen.pop();
      r.gold += 1500;
      log(T(`📣 ${r.name} ist knapp bei Kasse und verkauft eine Karawane.`, `📣 ${r.name} is short of money and sells a caravan.`));
    } else if (r.gold < 400) {
      r.gold += 40;
    }
    r.gold -= Math.max(0, (r.gold - 10000 * sw().rivalen) * 0.01);   // Abgaben, Familie, Paläste … großes Vermögen wächst langsamer
    if (r.gold > 7000 && r.karawanen.length < 3) {
      r.gold -= 2500;
      r.karawanen.push(rivalenKarawane());
      log(T(`📣 ${r.name} schickt eine weitere Karawane in die Wüste.`, `📣 ${r.name} sends another caravan into the desert.`));
    }
    for (const k of r.karawanen) {
      if (k.nach == null || !k.menge) continue;
      if (aktiveRaeuber().some(g => Math.hypot(k.x - g.x, k.y - g.y) < g.r) && Math.random() < 0.15) {
        k.menge = Math.floor(k.menge / 2);
        log(T(`🗡️ Räuber plündern eine Karawane von ${r.name}.`, `🗡️ Robbers plunder a caravan of ${r.name}.`));
      }
    }
  }
}

// --- Anzeige-Bausteine für die Seitenleiste ---

function htmlOasenExtras(o) {
  let h = '';
  const f = S.feste.find(f => f.oase === o.id);
  if (f) h += `<div class="info">` + T(`🎉 <b>Fest!</b> ${ware(f.ware).icon} ${ware(f.ware).name} wird noch ${f.bis - S.tag + 1} Tage besonders gut bezahlt (+80 %).`,
                                         `🎉 <b>Festival!</b> ${ware(f.ware).icon} ${ware(f.ware).name} fetches top prices for ${f.bis - S.tag + 1} more days (+80%).`) + '</div>';
  if (o.hafen) h += '<div class="hinweis">' + T('⚓ Die Seehändler hier zahlen für 💎 Edelsteine weit mehr als irgendwo in der Wüste.',
                                                '⚓ The sea traders here pay far more for 💎 gemstones than anyone in the desert.') + '</div>';
  if (o.brunnen) h += '<div class="hinweis">' + T(`🏗️ Brunnen Stufe ${o.brunnen} – die Quelle versiegt langsamer.`,
                                                  `🏗️ Well level ${o.brunnen} – the spring dries up more slowly.`) + '</div>';
  if (S.eisenmine && S.eisenmine.oase === o.id) {
    h += '<div class="info">' + T('⚒️ Vor den Toren liegt die <b>Eisenmine</b> – nur hier gibt es Eisenwaren aus erster Hand.',
                                  '⚒️ The <b>iron mine</b> lies outside the gates – the only place to get ironware first-hand.') +
         (o.aktiv ? T(' Mit einem Lagerhaus kannst du eine eigene Schmiede bauen.', ' With a warehouse you can build your own smithy.')
                  : T(' Ohne Wasser ruht der Abbau.', ' Without water, mining has stopped.')) +
         T(' Manchmal finden die Bergleute 💎 Edelsteine – die zahlt man im Hafen am besten.',
           ' Sometimes the miners find 💎 gemstones – the harbour pays best for them.') + '</div>';
  }
  return h;
}

function htmlDienste(o, handel) {
  if (!handel) return '';
  let s = '';
  if ((o.brunnen || 0) < 3) {
    s += `<div class="info">` + T(`🏗️ <b>Brunnen vertiefen:</b> sofort +30 % Wasser, danach versiegt die Quelle langsamer.
            Die Bewohner werden es dir danken – besonders, wenn das Wasser knapp ist.`,
            `🏗️ <b>Deepen the well:</b> +30% water at once, and the spring dries up more slowly afterwards.
            The people will thank you – especially when water is scarce.`) +
         ` <button data-a="brunnen" ${S.gold < brunnenPreis(o) ? 'disabled' : ''}>${T('Bauen', 'Build')} (${brunnenPreis(o)} D)</button></div>`;
  } else {
    s += '<div class="hinweis">' + T('Die Brunnen hier sind voll ausgebaut.', 'The wells here are fully built.') + '</div>';
  }
  if (o.bev >= HEILER_AB_BEV) {
    const k = handel.k, preis = HEILER_PREIS * tierAnzahl(k);
    s += `<div class="info">🩺 <b>${T('Tierheiler', 'Animal healer')}:</b> ` + (k.krank
         ? `<button data-a="heilen" ${S.gold < preis ? 'disabled' : ''}>${T(`Tiere von ${k.name} heilen`, `Heal the animals of ${k.name}`)} (${preis} D)</button>`
         : T('Deine Tiere sind gesund.', 'Your animals are healthy.')) + '</div>';
  }
  return bereich('dienste', T('🏗️ Dienste', '🏗️ Services'), s);
}

function htmlKarawanenZustand(k) {
  let h = '';
  if (k.krank) {
    h += '<div class="warnung">' + T(`🤒 Tierseuche! Noch ~${k.krank} Tage · Tempo −30 % · Tiere können sterben.
          Ein Tierheiler (Oasen ab ${HEILER_AB_BEV} Einwohnern) hilft sofort.`,
          `🤒 Plague! ~${k.krank} more days · speed −30% · animals may die.
          An animal healer (oases with ${HEILER_AB_BEV}+ people) helps at once.`) + '</div>';
  }
  if (k.verirrt) h += '<div class="warnung">' + T('🌫️ Folgt einer Fata Morgana und kommt vom Weg ab …', '🌫️ Following a mirage and straying from the path …') + '</div>';
  h += `<div class="info"><button data-a="nacht" class="${k.nachtmarsch ? 'an' : ''}">🌙 ${T('Nachtmarsch', 'Night march')}: ${k.nachtmarsch ? T('an', 'on') : T('aus', 'off')}</button>
        <span class="hinweis">${T('Nur nachts reisen: rund 30 % weniger Wasser, aber deutlich langsamer – und nachts sind Räuber aktiver.',
                                  'Travel only at night: about 30% less water, but much slower – and robbers are more active at night.')}</span></div>`;
  return h;
}

function nachtmarschUmschalten() {
  const k = karawane(S.gewKarawane);
  if (!k) return;
  k.nachtmarsch = !k.nachtmarsch;
  zeichnePanel();
}
