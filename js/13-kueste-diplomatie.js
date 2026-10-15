/* =====================================================================
   13. DIE KÜSTE IM OSTEN UND DIPLOMATIE MIT DEN HANDELSHÄUSERN
   ===================================================================== */

// --- Die neue Region: zwei Oasen auf dem Weg und die Hafenstadt Suakin ---
const OASEN_OSTEN = [
  { name: 'Dakhla', x: 1060, y: 250, produziert: ['datteln', 'wasser'], bev: 500 },
  { name: 'Selima', x: 1050, y: 570, produziert: ['salz'],              bev: 250 },
  { name: 'Suakin', x: 1255, y: 400, produziert: ['wasser'],            bev: 1600, hafen: true },
];

function ostenHinzufuegen() {
  if (S.oasen.some(o => o.name === 'Suakin')) return;
  for (const d of OASEN_OSTEN) {
    const o = neueOase(d.name, d.x, d.y, d.produziert, d.bev);
    if (d.hafen) {
      o.hafen = true;
      o.wasser = 90;
      o.lager.seide = 30; o.lager.porzellan = 40;
    }
    S.oasen.push(o);
  }
}

// Täglich: Schiffe laufen ein – sie bringen Seide und Porzellan
function hafenTag() {
  for (const o of S.oasen) {
    if (!o.hafen || !o.aktiv) continue;
    o.wasser = Math.max(o.wasser, 40);   // Zisternen und Wasserschiffe: der Hafen trocknet nie ganz aus
    if (Math.random() < 0.12) {
      o.lager.seide += zufall(30, 55);
      o.lager.porzellan += zufall(35, 65);
      o.schiffBis = S.tag + 2;
      log(T(`⛵ Ein Handelsschiff aus Indien ist in ${o.name} eingelaufen – frische Seide und Porzellan!`,
            `⛵ A merchant ship from India has docked in ${o.name} – fresh silk and porcelain!`), 'gut');
    } else if (Math.random() < 0.01 && !S.feste.some(f => f.oase === o.id)) {
      // Ein Gruß an das Hanse-Spiel …
      S.feste.push({ oase: o.id, ware: 'weihrauch', bis: S.tag + 6 });
      o.schiffBis = S.tag + 6;
      log(T(`⛵ Eine Kogge aus Lübeck hat sich bis nach ${o.name} verirrt! Die Hansekaufleute zahlen 6 Tage lang Höchstpreise für Weihrauch.`,
            `⛵ A cog from Lübeck has strayed all the way to ${o.name}! The Hanseatic merchants pay top prices for frankincense for 6 days.`), 'gut');
    }
  }
}

// --- Diplomatie ---

const BEZIEHUNG_STUFEN = [[-100, 'Feindselig', 'Hostile'], [-50, 'Misstrauisch', 'Suspicious'], [-10, 'Neutral', 'Neutral'],
                          [25, 'Freundlich', 'Friendly'], [50, 'Vertraut', 'Trusted']];
function beziehungTitel(r) {
  if (r.buendnis) return T('Verbündet', 'Allied');
  let titel = BEZIEHUNG_STUFEN[0];
  for (const stufe of BEZIEHUNG_STUFEN) if (r.beziehung >= stufe[0]) titel = stufe;
  return T(titel[1], titel[2]);
}

const DIPLO = { geschenk: 500, buendnis: 1500, absprache: 1000, sabotage: 800 };

function hausAktion(art, index) {
  const r = S.rivalen[index];
  if (!r) return;
  const kosten = DIPLO[art];
  if (S.gold < kosten) { log(T('Dafür fehlt dir das Geld.', 'You do not have enough money for that.')); zeichnePanel(); return; }

  if (art === 'geschenk') {
    S.gold -= kosten; buche('Diplomatie', -kosten);
    const plus = Math.max(3, 15 * (1 - r.beziehung / 120));   // je besser die Beziehung, desto weniger bewirkt ein Geschenk
    r.beziehung = Math.min(100, r.beziehung + plus);
    log(T(`🎁 ${r.name} nimmt dein Geschenk freundlich an.`, `🎁 ${r.name} graciously accepts your gift.`));
  }

  if (art === 'buendnis' && r.beziehung >= 50 && !r.buendnis) {
    S.gold -= kosten; buche('Diplomatie', -kosten);
    r.buendnis = true;
    log(T(`🤝 Bündnis mit ${r.name}! Ihre Karawanen teilen nun die Preise jeder Oase, in der sie Halt machen.`,
          `🤝 Alliance with ${r.name}! Their caravans now share the prices of every oasis they stop at.`), 'gut');
  }

  if (art === 'absprache' && r.beziehung >= 25) {
    // Gesperrt werden alle Waren, die du gerade transportierst oder auf deinen Routen kaufst
    const waren = new Set();
    for (const k of S.karawanen) {
      for (const w of WAREN) if (w.id !== 'wasser' && k.ladung[w.id] >= 1) waren.add(w.id);
      for (const st of k.route.stationen) if (st.kaufWare) waren.add(st.kaufWare);
    }
    if (!waren.size) { log(T('Für eine Preisabsprache musst du erst Waren transportieren oder eine Route mit Einkäufen haben.', 'For a price agreement you first need to carry goods or have a route with purchases.')); zeichnePanel(); return; }
    S.gold -= kosten; buche('Diplomatie', -kosten);
    r.absprache = { bis: S.tag + 30, waren: [...waren] };
    log(T(`📉 ${r.name} verzichtet 30 Tage lang auf den Handel mit ${[...waren].map(id => ware(id).name).join(', ')}.`,
          `📉 ${r.name} will stay out of trading ${[...waren].map(id => ware(id).name.toLowerCase()).join(', ')} for 30 days.`), 'gut');
  }

  if (art === 'sabotage' && S.tag >= (r.sabotageBis || 0)) {
    S.gold -= kosten; buche('Diplomatie', -kosten);
    r.sabotageBis = S.tag + 15;
    if (Math.random() < 0.6) {
      let beute = 0;
      for (const k of r.karawanen) if (k.nach != null && k.ware) { beute += k.menge; k.menge = Math.floor(k.menge / 3); }
      r.gold = Math.max(0, r.gold - 1000);
      r.beziehung = Math.max(-100, r.beziehung - 10);   // Gerüchte machen die Runde …
      log(T(`🗡️ Deine angeheuerten Räuber plündern ${r.name}: ${beute} Lasten Ware und 1000 Dinar sind fort.`,
            `🗡️ Your hired robbers plunder ${r.name}: ${beute} loads of goods and 1000 dinars are gone.`), 'gut');
    } else {
      r.beziehung = Math.max(-100, r.beziehung - 60);
      if (r.buendnis) { r.buendnis = false; log(T(`💔 Das Bündnis mit ${r.name} ist zerbrochen.`, `💔 The alliance with ${r.name} is broken.`), 'schlecht'); }
      for (const o of S.oasen) if (ansehen(o) >= 1) ansehenAendern(o, -10);
      log(T(`⚖️ Die Sabotage gegen ${r.name} fliegt auf! Dein Ruf in allen Oasen leidet – und ${r.name} sinnt auf Rache.`,
            `⚖️ The sabotage against ${r.name} is exposed! Your reputation suffers in every oasis – and ${r.name} plots revenge.`), 'schlecht');
    }
  }
  zeichnePanel();
}

// Täglich: Beziehungen verändern sich, verfeindete Häuser schlagen zurück
function diplomatieTag() {
  for (const r of S.rivalen) {
    if (r.buendnis) r.beziehung = Math.min(100, r.beziehung + 0.2);
    else r.beziehung += r.beziehung > 0 ? -0.3 : r.beziehung < 0 ? 0.3 : 0;   // ohne Pflege wird man sich wieder fremd

    if (r.buendnis && r.beziehung < 30) {
      r.buendnis = false;
      log(T(`💔 Das Bündnis mit ${r.name} ist zerbrochen – die Beziehung war zu schlecht.`, `💔 The alliance with ${r.name} is broken – relations had become too poor.`), 'schlecht');
    }
    if (r.absprache && S.tag > r.absprache.bis) {
      r.absprache = null;
      log(T(`📉 Die Preisabsprache mit ${r.name} ist ausgelaufen.`, `📉 The price agreement with ${r.name} has expired.`));
    }
    if (r.beziehung < -50 && Math.random() < 0.04) {
      const unterwegs = S.karawanen.filter(k => k.nach != null);
      if (unterwegs.length) {
        log(T(`🗡️ ${r.name} hat Räuber auf dich angesetzt!`, `🗡️ ${r.name} has set robbers on you!`), 'schlecht');
        ueberfall(unterwegs[zufallInt(0, unterwegs.length - 1)]);
      }
    }
  }
}

// Darf ein Handelshaus diese Ware gerade handeln? (Preisabsprache)
function hausDarfHandeln(r, wid) {
  return !(r.absprache && S.tag <= r.absprache.bis && r.absprache.waren.includes(wid));
}

// Verbündete Karawanen in einer Oase verraten dir die Preise
function verbuendeteVorOrt(o) {
  return S.rivalen.some(r => r.buendnis && r.karawanen.some(k => k.ort === o.id));
}

function htmlHaeuser() {
  let h = `<h2>🤝 ${T('Handelshäuser', 'Trading houses')}</h2>`;
  S.rivalen.forEach((r, i) => {
    const kannSabotage = S.tag >= (r.sabotageBis || 0);
    let s = `<div class="info">${T('Vermögen', 'Fortune')} ≈ ${zahl(rivalenVermoegen(r))} D · ${r.karawanen.length} ${T('Karawane(n)', 'caravan(s)')}</div>
             <div class="info">${T('Beziehung', 'Relations')}: <b>${beziehungTitel(r)}</b> (${Math.round(r.beziehung)})</div>`;
    if (r.absprache) s += `<div class="hinweis">📉 ${T(`Preisabsprache bis Tag ${r.absprache.bis}`, `Price agreement until day ${r.absprache.bis}`)}: ${r.absprache.waren.map(id => ware(id).name).join(', ')}</div>`;
    s += `<div>
      <button data-a="haus" data-v="geschenk" data-n="${i}" ${S.gold < DIPLO.geschenk ? 'disabled' : ''}>🎁 ${T('Geschenk', 'Gift')} (${DIPLO.geschenk} D)</button>
      ${r.buendnis ? '' : `<button data-a="haus" data-v="buendnis" data-n="${i}" ${r.beziehung < 50 || S.gold < DIPLO.buendnis ? 'disabled' : ''}>🤝 ${T('Bündnis', 'Alliance')} (${DIPLO.buendnis} D)</button>`}
      <button data-a="haus" data-v="absprache" data-n="${i}" ${r.beziehung < 25 || r.absprache || S.gold < DIPLO.absprache ? 'disabled' : ''}>📉 ${T('Preisabsprache', 'Price agreement')} (${DIPLO.absprache} D)</button>
      <button data-a="haus" data-v="sabotage" data-n="${i}" ${!kannSabotage || S.gold < DIPLO.sabotage ? 'disabled' : ''}>🗡️ Sabotage (${DIPLO.sabotage} D)</button>
    </div>`;
    h += bereich('haus' + i, `<span class="punkt" style="background:${r.farbe}"></span>${r.name} · ${beziehungTitel(r)}`, s);
  });
  h += `<div class="hinweis">${T(`Bündnis ab „Vertraut“ (50): Verbündete verraten dir die Preise, wo sie Halt machen.
        Preisabsprache ab „Freundlich“ (25): Das Haus meidet 30 Tage lang deine Waren.
        Sabotage gelingt in 60 % der Fälle – fliegt sie auf, leidet dein Ruf und das Haus rächt sich.`,
        `Alliance from "Trusted" (50): allies tell you the prices wherever they stop.
        Price agreement from "Friendly" (25): the house avoids your goods for 30 days.
        Sabotage succeeds 60% of the time – if it is exposed, your reputation suffers and the house takes revenge.`)}</div>`;
  return h;
}
