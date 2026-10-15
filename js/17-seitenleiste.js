/* =====================================================================
   17. SEITENLEISTE (HTML) – wird nach Aktionen und jeden Tag neu aufgebaut
   ===================================================================== */

function zeichnePanel() {
  pruefeAufgaben();
  einfuehrungPruefen();
  document.getElementById('panelTipp').innerHTML = htmlTipp();
  const j = jahreszeit();
  document.getElementById('anzeigeJahreszeit').textContent = `${j.icon} ${j.name}, ${T('Jahr', 'year')} ${jahr()}`;
  document.getElementById('btnTon').textContent = tonAn ? '🔊' : '🔇';
  document.getElementById('anzeigeTag').textContent = T('Tag ', 'Day ') + S.tag;
  document.getElementById('anzeigeRang').textContent = RAENGE[S.rang].name;
  const gold = document.getElementById('anzeigeGold');
  gold.textContent = zahlText(Math.floor(S.gold)) + T(' Dinar', ' dinars');
  gold.classList.toggle('minus', S.gold < 0);
  document.getElementById('anzeigeSchulden').textContent =
    S.schulden > 0 ? `📉 ${zahlText(Math.round(S.schulden))} ${T('Schulden', 'debt')}` : '';

  document.getElementById('btnPause').classList.toggle('an', S.pause);
  document.querySelectorAll('[data-tempo]').forEach(b =>
    b.classList.toggle('an', !S.pause && +b.dataset.tempo === S.tempo));

  document.getElementById('panelOase').innerHTML = htmlOase();
  document.getElementById('panelKarawanen').innerHTML = htmlKarawanen();
  document.getElementById('panelAuftraege').innerHTML = htmlAuftraege();
  document.getElementById('panelZiele').innerHTML = htmlZiele();
  document.getElementById('panelHaeuser').innerHTML = htmlHaeuser();
  document.getElementById('log').innerHTML =
    S.log.map(e => `<div class="${e.art}">${T('Tag', 'Day')} ${e.tag}: ${e.text}</div>`).join('');
}

// Aufklappbare Abschnitte. Welche offen sind, merken wir uns hier –
// sonst würden sie beim täglichen Neuzeichnen wieder zuklappen.
const offeneBereiche = new Set(['markt', 'karawane', 'aufgaben']);
function bereich(id, titel, inhalt) {
  return `<details data-bereich="${id}" ${offeneBereiche.has(id) ? 'open' : ''}>
            <summary>${titel}</summary>${inhalt}</details>`;
}

function htmlOase() {
  if (S.bankrott) {
    return `<h2>💀 ${T('Bankrott', 'Bankrupt')}</h2>
            <p>${T(`Die Geldverleiher haben alles gepfändet. Deine Handelsgeschichte endet an Tag ${S.tag}.`, `The moneylenders have seized everything. Your trading story ends on day ${S.tag}.`)}</p>
            <button data-a="neu">${T('Neues Spiel beginnen', 'Start a new game')}</button>`;
  }
  const o = oase(S.gewOase);
  if (!o) return `<h2>${T('Oase', 'Oasis')}</h2><p class="hinweis">${T('Tippe auf eine Oase auf der Karte.', 'Tap an oasis on the map.')}</p>`;
  let h = `<h2>🌴 ${o.name}</h2>`;
  if (!o.aktiv) {
    h += `<p>${T('Diese Oase ist versiegt. Nur Ruinen und Sand sind geblieben – vielleicht bringt Regen sie zurück.', 'This oasis has dried up. Only ruins and sand remain – perhaps rain will bring it back.')}</p>`;
    if (S.gebaeude[o.id]) h += bereich('gebaeude', T('🏛️ Deine Gebäude', '🏛️ Your buildings'), htmlGebaeude(o));
    return h;
  }

  const handel = kannHandeln();
  h += `<div class="info">👥 ${Math.round(o.bev)} ${T('Einwohner', 'people')} · ${T('erzeugt', 'produces')} ${o.produziert.map(id => ware(id).icon + ' ' + ware(id).name).join(', ')}</div>`;
  h += `<div class="info">🏅 ${T('Ansehen', 'Reputation')}: ${ansehenTitel(ansehen(o))} (${Math.round(ansehen(o))}/100)` +
       (ansehenVorteil(o) >= 0.005 ? ` · ${Math.round(ansehenVorteil(o) * 100)} % ${T('bessere Preise', 'better prices')}` : '') + '</div>';
  h += `<div class="info">${T('Wasserstand', 'Water level')} ${Math.round(o.wasser)} %</div>
        <div class="bar"><div style="width:${Math.max(0, o.wasser)}%;background:${wasserFarbe(o.wasser)}"></div></div>`;
  h += htmlOasenExtras(o);

  h += bereich('markt', T('📊 Markt', '📊 Market'), htmlMarkt(o, handel));

  // Der Scheich: Angebote annehmen und eigene Aufträge hier abliefern
  const angebote = S.angebote.filter(a => a.oase === o.id);
  const auftraege = S.auftraege.filter(a => a.oase === o.id);
  if (angebote.length || auftraege.length) {
    let s = '';
    for (const a of angebote) {
      const w = ware(a.ware);
      s += `<div class="info">${T('Sucht', 'Wants')} <b>${a.menge} ${w.icon} ${w.name}</b> · ${T('Lohn', 'pay')} ${a.lohn} D · ${T(`Frist ${a.frist} Tage`, `${a.frist} days`)}
            <button data-a="annehmen" data-v="${a.id}" ${S.auftraege.length >= 3 ? 'disabled' : ''}>${T('Annehmen', 'Accept')}</button></div>`;
    }
    if (angebote.length && S.auftraege.length >= 3) s += `<p class="hinweis">${T('Du hast schon 3 offene Aufträge.', 'You already have 3 open contracts.')}</p>`;
    for (const a of auftraege) {
      const w = ware(a.ware);
      const kannLiefern = handel && handel.k.ladung[w.id] >= a.menge;
      s += `<div class="info">${T('Dein Auftrag', 'Your contract')}: <b>${a.menge} ${w.icon} ${w.name}</b> · ${a.lohn} D · ${T(`noch ${a.bisTag - S.tag} Tage`, `${a.bisTag - S.tag} days left`)}
            <button data-a="erfuellen" data-v="${a.id}" ${kannLiefern ? '' : 'disabled'}>${T('Abliefern', 'Deliver')}</button></div>`;
    }
    h += bereich('scheich', `📜 ${T(`Der Scheich von ${o.name}`, `The sheikh of ${o.name}`)} (${angebote.length + auftraege.length})`, s);
  }

  h += htmlReisende(o, handel);
  if (augenVorOrt(o)) {
    h += `<div class="info" style="margin:6px 0"><button data-a="kundschafter" ${S.gold < KUNDSCHAFTER_PREIS ? 'disabled' : ''}>🔭 ${T('Kundschafter aussenden', 'Send out scouts')} (${KUNDSCHAFTER_PREIS} D)</button>
          <span class="hinweis">${T('kartieren unbekannte Wüste in der Nähe – vielleicht finden sie etwas.', 'they map unknown desert nearby – maybe they find something.')}</span></div>`;
  }
  h += bereich('gebaeude', T('🏛️ Deine Gebäude', '🏛️ Your buildings'), htmlGebaeude(o));
  h += htmlDienste(o, handel);

  // Geldverleiher (nur in größeren Oasen)
  if (o.bev >= VERLEIHER_AB_BEV) {
    const rest = KREDIT_RAHMEN - S.schulden;
    h += bereich('verleiher', T('💰 Geldverleiher', '💰 Moneylender'), `
          <div class="info">${T('Deine Schulden', 'Your debt')}: <b>${Math.round(S.schulden)} D</b> · ${T('Zinsen', 'interest')} ${zahlText(zinsSatz() * 100)} % ${T('pro Tag', 'per day')}
            (≈ ${Math.round(S.schulden * zinsSatz())} D ${T('täglich', 'daily')})</div>
          <div class="info">
            <button data-a="leihen" data-v="500" ${rest < 500 ? 'disabled' : ''}>${T('500 leihen', 'Borrow 500')}</button>
            <button data-a="leihen" data-v="1000" ${rest < 1000 ? 'disabled' : ''}>${T('1000 leihen', 'Borrow 1000')}</button>
            <button data-a="tilgen" data-v="500" ${S.schulden <= 0 || S.gold < 1 ? 'disabled' : ''}>${T('500 zurück', 'Repay 500')}</button>
            <button data-a="tilgen" data-v="999999" ${S.schulden <= 0 || S.gold < 1 ? 'disabled' : ''}>${T('alles zurück', 'Repay all')}</button>
          </div>
          <div class="hinweis">${T(`Kreditrahmen ${KREDIT_RAHMEN} D. Über ${PFAENDUNG_AB} D Schulden wird gepfändet.`, `Credit limit ${KREDIT_RAHMEN} D. Debts above ${PFAENDUNG_AB} D lead to seizure.`)}</div>`);
  }

  // Tiermarkt
  const k = karawane(S.gewKarawane);
  const fuer = (k && k.ort === o.id) ? T(`Kauf für ${k.name}`, `Buying for ${k.name}`) : T('Kauf gründet eine neue Karawane', 'Buying founds a new caravan');
  let t = `<div class="hinweis">${fuer}</div><table>
        <tr><th>${T('Tier', 'Animal')}</th><th>${T('Last', 'Load')}</th><th>${T('Tempo', 'Speed')}</th><th>${T('Durst', 'Thirst')}</th><th></th></tr>`;
  for (const typ in TIERE) {
    const tier = TIERE[typ];
    const verfuegbar = typ !== 'elefant' || o.bev >= 1000;
    t += `<tr><td>${tier.icon} ${tier.name}</td><td>${tier.kapazitaet}</td><td>${tier.tempo}</td><td>${zahlText(tier.durst)}</td>
          <td>${verfuegbar
              ? `<button data-a="tier" data-v="${typ}" ${S.gold < tier.preis ? 'disabled' : ''}>${tier.preis} D</button>`
              : `<small>${T('nur in Städten', 'cities only')}</small>`}</td></tr>`;
  }
  h += bereich('tiere', T('🐾 Tiermarkt', '🐾 Animal market'), t + '</table>');
  return h;
}

// Der Markt – live, wenn eigene Leute vor Ort sind, sonst aus dem Gedächtnis
function schmal() { return window.innerWidth < 600; }

function htmlMarkt(o, handel) {
  const live = augenVorOrt(o);
  if (live) merkePreise(o);
  const p = S.wissen[o.id];
  const bote = `<button data-a="bote" ${S.gold < BOTE_PREIS ? 'disabled' : ''}>🏃 ${T('Boten schicken', 'Send a messenger')} (${BOTE_PREIS} D)</button>`;
  if (!p) return `<p class="hinweis">${T('Die Preise hier kennst du noch nicht – du warst noch nie hier.', 'You do not know the prices here yet – you have never been here.')}</p>${bote}`;

  let h = '';
  if (!live) {
    const alter = S.tag - p.tag;
    h += `<div class="hinweis">${T(`Preise von Tag ${p.tag} (${alter === 0 ? 'heute' : 'vor ' + alter + ' Tagen'}) – können sich geändert haben.`,
                                  `Prices from day ${p.tag} (${alter === 0 ? 'today' : alter + ' days ago'}) – they may have changed.`)} ${bote}</div>`;
  }
  h += `<table class="${schmal() ? 'markt-schmal' : ''}"><tr><th>${T('Ware', 'Goods')}</th><th>${T('Lager', 'Stock')}</th><th>${T('Kauf', 'Buy')}</th><th>${T('Verk.', 'Sell')}</th>` +
       (handel ? `<th>${T('Dabei', 'Carried')}</th>` + (schmal() ? '' : '<th></th>') : '') + '</tr>';
  for (const w of WAREN) {
    if (!wareZeigen(w, p.lager[w.id], o)) continue;   // seltene Waren nur, wenn es sie gibt
    const fest = festFaktor(o, w) > 1 ? ' 🎉' : '';
    h += `<tr><td>${w.icon} ${w.name}${w.verderb ? ' ⏳' : ''}${fest}</td><td>${p.lager[w.id]}</td>
          <td>${p.kauf[w.id]}</td><td>${p.verk[w.id]}</td>`;
    if (handel) {
      const dabei = Math.floor(handel.k.ladung[w.id]);
      const knoepfe = `<button data-a="kauf" data-v="${w.id}" data-n="1">+1</button>
              <button data-a="kauf" data-v="${w.id}" data-n="10">+10</button>
              <button data-a="verk" data-v="${w.id}" data-n="1" ${dabei < 1 ? 'disabled' : ''}>−1</button>
              <button data-a="verk" data-v="${w.id}" data-n="9999" ${dabei < 1 ? 'disabled' : ''}>${T('alle', 'all')}</button>`;
      // Auf dem Handy kommen die Knöpfe in eine eigene Zeile darunter
      h += schmal() ? `<td>${dabei}</td></tr><tr class="knopfzeile"><td colspan="5">${knoepfe}</td>`
                    : `<td>${dabei}</td><td style="white-space:nowrap">${knoepfe}</td>`;
    }
    h += '</tr>';
  }
  h += '</table>';
  if (WAREN.some(w => w.verderb)) h += `<div class="hinweis">${T('⏳ = verdirbt mit der Zeit (3 % pro Tag)', '⏳ = spoils over time (3% per day)')}</div>`;
  if (!handel) h += `<p class="hinweis">${T('Zum Handeln muss die ausgewählte Karawane hier stehen.', 'To trade, the selected caravan must be here.')}</p>`;
  return h;
}

function htmlGebaeude(o) {
  const g = S.gebaeude[o.id];
  const k = karawane(S.gewKarawane);
  const vorOrt = k && k.ort === o.id;
  if (!g) {
    if (!vorOrt || !o.aktiv) return `<p class="hinweis">${T('Mit einer Karawane vor Ort kannst du hier ein Lagerhaus bauen.', 'With a caravan here you can build a warehouse.')}</p>`;
    return `<div class="info">${T(`Ein Lagerhaus fasst ${AUSBAU[1].platz} Einheiten, zeigt dir immer die aktuellen Preise
              und kostet ${LAGERHAUS.unterhalt} D/Tag. Danach kannst du hier einen Betrieb und eine Werkstatt errichten.`,
              `A warehouse holds ${AUSBAU[1].platz} units, always shows you the current prices
              and costs ${LAGERHAUS.unterhalt} D/day. Afterwards you can set up a business and a workshop here.`)}</div>
            <button data-a="lagerhaus" ${S.gold < LAGERHAUS.preis ? 'disabled' : ''}>🏛️ ${T('Lagerhaus bauen', 'Build warehouse')} (${LAGERHAUS.preis} D)</button>`;
  }

  let h = `<div class="info">🏛️ ${T(`Lagerhaus Stufe ${g.stufe || 1}`, `Warehouse level ${g.stufe || 1}`)}: ${Math.floor(lagerBestand(g))}/${lagerPlatz(g)} ${T('belegt', 'used')}</div>`;
  const zeilen = WAREN.filter(w => g.lager[w.id] >= 1 || (vorOrt && k.ladung[w.id] >= 1));
  if (zeilen.length) {
    h += `<table><tr><th>${T('Ware', 'Goods')}</th><th>${T('Im Lager', 'Stored')}</th>` + (vorOrt ? `<th>${T('Dabei', 'Carried')}</th><th></th>` : '') + '</tr>';
    for (const w of zeilen) {
      h += `<tr><td>${w.icon} ${w.name}</td><td>${Math.floor(g.lager[w.id])}</td>`;
      if (vorOrt) {
        h += `<td>${Math.floor(k.ladung[w.id])}</td><td style="white-space:nowrap">
                <button data-a="lager" data-v="${w.id}" data-n="ein" ${k.ladung[w.id] < 1 ? 'disabled' : ''}>⬇ ${T('einlagern', 'store')}</button>
                <button data-a="lager" data-v="${w.id}" data-n="aus" ${g.lager[w.id] < 1 ? 'disabled' : ''}>⬆ ${T('holen', 'take')}</button></td>`;
      }
      h += '</tr>';
    }
    h += '</table>';
  } else {
    h += `<p class="hinweis">${T('Das Lagerhaus ist leer.', 'The warehouse is empty.')}</p>`;
  }

  if (g.betrieb) {
    const w = ware(g.betrieb);
    const menge = betriebProduktion(w.id) * Math.min(1, o.wasser / 30) * ausbauFaktor(g);
    h += `<div class="info">${BETRIEB_NAMEN[w.id]} · ≈ ${zahlText(menge, 1)} ${w.name} ${T('pro Tag ins Lagerhaus', 'per day into the warehouse')}` +
         (!o.aktiv ? ` – <span class="warnung">${T('steht still, kein Wasser!', 'standing still, no water!')}</span>` : '') + '</div>';
  } else if (o.aktiv) {
    const moeglich = o.produziert.filter(id => BETRIEB_NAMEN[id]);   // nur Waren, für die es einen Betrieb gibt
    if (vorOrt) {
      h += `<div class="info">${T(`Betrieb errichten (${BETRIEB.preis} D, ${BETRIEB.unterhalt} D/Tag) – liefert täglich Ware ins Lagerhaus:`,
                                  `Set up a business (${BETRIEB.preis} D, ${BETRIEB.unterhalt} D/day) – delivers goods to the warehouse daily:`)}</div>`;
      for (const id of moeglich) {
        h += `<button data-a="betrieb" data-v="${id}" ${S.gold < BETRIEB.preis ? 'disabled' : ''}>${BETRIEB_NAMEN[id]}</button> `;
      }
    } else {
      h += `<p class="hinweis">${T('Hier könntest du einen Betrieb errichten', 'You could set up a business here')}: ${moeglich.map(id => BETRIEB_NAMEN[id]).join(', ')}.</p>`;
    }
  }
  h += htmlWerkstatt(g, o, vorOrt);

  // Ausbau
  const naechste = AUSBAU[(g.stufe || 1) + 1];
  if (naechste && vorOrt && o.aktiv) {
    h += `<div class="info" style="margin-top:6px">🏗️ ${T(`Ausbau auf Stufe ${(g.stufe || 1) + 1}: ${naechste.platz} Lagerplätze,
          Betrieb und Werkstatt ${zahlText(naechste.faktor)}× so schnell`, `Upgrade to level ${(g.stufe || 1) + 1}: ${naechste.platz} storage spaces,
          business and workshop ${zahlText(naechste.faktor)}× as fast`)}
          <button data-a="ausbau" ${S.gold < naechste.preis ? 'disabled' : ''}>${T('Ausbauen', 'Upgrade')} (${naechste.preis} D)</button></div>`;
  } else if (!naechste) {
    h += `<div class="hinweis">${T('🏗️ Voll ausgebaut.', '🏗️ Fully upgraded.')}</div>`;
  }
  return h;
}

function htmlWerkstatt(g, o, vorOrt) {
  if (g.werkstatt) {
    const W = WERKSTAETTEN[g.werkstatt];
    const fehlt = Object.entries(W.rezept).filter(([id, n]) => g.lager[id] < n).map(([id]) => ware(id).name);
    return `<div class="info" style="margin-top:6px">${W.name}: ${rezeptText(W.rezept)} → ${rezeptText(W.ergebnis)},
              ${T('bis', 'up to')} ${zahlText(W.proTag * ausbauFaktor(g))}× ${T('pro Tag', 'per day')}</div>` +
           (fehlt.length ? `<div class="warnung">${T('Wartet auf Rohstoffe im Lagerhaus', 'Waiting for raw materials in the warehouse')}: ${fehlt.join(', ')}</div>`
                         : `<div class="hinweis">${T(`Gestern ${g.werkGestern || 0}× hergestellt.`, `Made ${g.werkGestern || 0}× yesterday.`)}</div>`);
  }
  if (!vorOrt || !o.aktiv) return `<p class="hinweis">${T('Werkstätten (Juwelier, Färberei) kannst du mit einer Karawane vor Ort bauen.', 'You can build workshops (jeweller, dye works) with a caravan here.')}</p>`;
  let h = `<div class="info" style="margin-top:6px">${T('Werkstatt errichten – verarbeitet Waren aus deinem Lagerhaus:', 'Set up a workshop – it processes goods from your warehouse:')}</div>`;
  for (const [id, W] of Object.entries(WERKSTAETTEN)) {
    h += `<div class="info"><button data-a="werkstatt" data-v="${id}" ${S.gold < W.preis ? 'disabled' : ''}>${W.name} (${W.preis} D)</button>
          <span class="hinweis">${rezeptText(W.rezept)} → ${rezeptText(W.ergebnis)}, ${W.unterhalt} D/${T('Tag', 'day')}</span></div>`;
  }
  return h;
}

function htmlKarawanen() {
  let h = `<h2>🐪 ${T('Deine Karawanen', 'Your caravans')}</h2>`;
  if (!S.karawanen.length) return h + `<p class="hinweis">${T('Keine Karawanen mehr. Kaufe Tiere in einer Oase!', 'No caravans left. Buy animals in an oasis!')}</p>`;

  for (const k of S.karawanen) {
    const status = k.ort != null ? T('in ', 'in ') + oase(k.ort).name : '→ ' + oase(k.nach).name;
    const symbole = Object.keys(k.tiere).filter(t => k.tiere[t] > 0)
      .map(t => TIERE[t].icon + k.tiere[t]).join(' ');
    h += `<button class="karawanenZeile ${k.id === S.gewKarawane ? 'an' : ''}" data-a="wk" data-v="${k.id}">
            <b>${k.name}</b>${k.route.aktiv ? ' 🔁' : ''}${k.krank ? ' 🤒' : ''} ${symbole} · ${status} · 📦 ${Math.floor(ladungGewicht(k))}/${kapazitaet(k)}
          </button>`;
  }

  const k = karawane(S.gewKarawane);
  if (!k) return h;

  // --- Übersicht der ausgewählten Karawane ---
  const tempo = reiseTempo(k), durst = karawanenDurst(k);
  let d = `<div class="info">${T('Tempo', 'Speed')} ${Math.round(tempo)} · ${T('Durst', 'Thirst')} ${zahlText(durst, 1)} 💧/${T('Tag', 'day')} · ${T('Unterhalt', 'Upkeep')} ${unterhaltKosten(k)} D/${T('Tag', 'day')}</div>`;
  d += `<div class="info">📈 ${T('Bilanz bisher', 'Balance so far')}: <b class="${k.bilanz < 0 ? 'warnung' : ''}">${k.bilanz >= 0 ? '+' : ''}${Math.round(k.bilanz)} D</b></div>`;

  const stufe = fuehrerStufe(k);
  const naechste = STUFEN_EP[stufe];   // undefined, wenn schon Stufe 5
  d += `<div class="info">🧭 ${T('Führer', 'Leader')} <b>${k.fuehrer.name}</b>, ${T('Stufe', 'level')} ${'⭐'.repeat(stufe)} ` +
       (naechste != null ? `(${k.fuehrer.ep}/${naechste} ${T('EP', 'XP')})` : T('(Meister)', '(master)')) + '</div>';
  if (stufe > 1) {
    d += `<div class="hinweis">${T(`+${(stufe - 1) * 5} % Tempo · −${(stufe - 1) * 7} % Durst · bessere Abwehr`, `+${(stufe - 1) * 5}% speed · −${(stufe - 1) * 7}% thirst · better defence`)}</div>`;
  }
  d += htmlKarawanenZustand(k);

  const anOase = k.ort != null && oase(k.ort).aktiv;
  d += `<div class="info">⚔️ ${T('Wachen', 'Guards')}: ${k.wachen}` + (anOase
       ? ` <button data-a="wache" data-v="1" ${S.gold < WACHE_PREIS ? 'disabled' : ''}>${T('+1 anheuern', 'Hire +1')} (${WACHE_PREIS} D)</button>
           <button data-a="wache" data-v="-1" ${k.wachen < 1 ? 'disabled' : ''}>${T('entlassen', 'dismiss')}</button>`
       : '') + '</div>';

  if (anOase) {
    for (const t in k.tiere) if (k.tiere[t] > 0) {
      d += `<div class="info">${TIERE[t].icon} ${k.tiere[t]}× ${TIERE[t].name}
            <button data-a="tierv" data-v="${t}">${T('verkaufen', 'sell')} (${Math.floor(TIERE[t].preis * 0.5)} D)</button></div>`;
    }
  }

  const ladung = WAREN.filter(w => k.ladung[w.id] >= 1).map(w => `${w.icon} ${Math.floor(k.ladung[w.id])} ${w.name}`);
  d += `<div class="info">${T('Ladung', 'Cargo')}: ${ladung.length ? ladung.join(', ') : T('leer', 'empty')}</div>`;
  d += htmlPassagiere(k);

  // --- Reise ---
  if (k.ort != null) {
    const ziel = oase(S.ziel);
    if (ziel) {
      const tage = entfernung(oase(k.ort), ziel) / tempo;
      const bedarf = Math.ceil(durst * tage);
      d += `<div class="info">${T('Ziel', 'Destination')} <b>${ziel.name}</b>: ${T(`ca. ${zahlText(tage, 1)} Tage, braucht ~${bedarf} 💧`, `about ${zahlText(tage, 1)} days, needs ~${bedarf} 💧`)}</div>`;
      if (k.ladung.wasser < bedarf * 1.3) {
        d += `<div class="warnung">${T(`Zu wenig Wasser dabei! Nimm lieber ${Math.ceil(bedarf * 1.3)} mit (Reserve für Sandstürme).`, `Not enough water! Better take ${Math.ceil(bedarf * 1.3)} (a reserve for sandstorms).`)}</div>`;
      }
      const start = oase(k.ort);
      if (aktiveRaeuber().some(g => abstandPunktStrecke(g, start, ziel) < g.r)) {
        d += `<div class="warnung">${T('⚔️ Die Route führt durch Räubergebiet!', '⚔️ The route passes through robber territory!')}${k.wachen === 0 ? T(' Wachen wären klug.', ' Guards would be wise.') : ''}</div>`;
      }
      d += htmlKarawansereiBau(k);
      d += `<button data-a="los">🚶 ${T(`Nach ${ziel.name} aufbrechen`, `Set out for ${ziel.name}`)}</button>`;
    } else if (!k.route.aktiv) {
      d += `<p class="hinweis">${T('Tippe auf der Karte auf eine andere Oase, um ein Reiseziel zu wählen.', 'Tap another oasis on the map to choose a destination.')}</p>`;
    }
  } else {
    const ziel = oase(k.nach);
    const rest = (entfernung(oase(k.von), ziel) - k.gereist) / Math.max(1, tempo);
    d += `<div class="info">${T(`Unterwegs nach <b>${ziel.name}</b>, noch ca. ${zahlText(rest, 1)} Tage.`, `On the way to <b>${ziel.name}</b>, about ${zahlText(rest, 1)} days left.`)}</div>`;
    if (k.durstig) d += `<div class="warnung">${T('Die Tiere verdursten!', 'The animals are dying of thirst!')}</div>`;
    if (k.imSturm) d += `<div class="warnung">${T('Mitten im Sandsturm!', 'In the middle of a sandstorm!')}</div>`;
  }
  d += htmlKarawanenAktionen(k);

  h += bereich('karawane', `${hauptTier(k).icon} ${k.name}`, d);
  h += bereich('route', `🔁 ${T('Handelsroute', 'Trade route')}${k.route.aktiv ? T(' (läuft)', ' (running)') : ''}`, htmlRoute(k));
  return h;
}

function htmlRoute(k) {
  const r = k.route;
  let h = '';
  if (!r.stationen.length) {
    h += `<p class="hinweis">${T(`Tippe auf der Karte eine Oase an und füge sie als Station hinzu.
          Ab 2 Stationen fährt die Karawane die Runde selbstständig – inklusive Wasser für jede Etappe.`,
          `Tap an oasis on the map and add it as a stop.
          From 2 stops on, the caravan runs the round by itself – including water for every leg.`)}</p>`;
  }
  r.stationen.forEach((st, i) => {
    const o = oase(st.oase);
    const aktuell = r.aktiv && i === r.index;
    const w = st.kaufWare ? ware(st.kaufWare) : null;
    const hatLager = !!S.gebaeude[st.oase];
    const knopf = (feld, text, an) =>
      `<button data-a="rs" data-v="${i}" data-n="${feld}" class="${an ? 'an' : ''}">${text}</button>`;
    h += `<div class="station ${aktuell ? 'aktuell' : ''}">
            <b>${i + 1}. ${o.name}</b>${aktuell ? T(' ◀ nächstes Ziel', ' ◀ next stop') : ''}${!o.aktiv ? ` <span class="warnung">${T('versiegt', 'dried up')}</span>` : ''}
            ${knopf('weg', '✕', false)}<br>
            ${knopf('verkaufen', T('Ladung verkaufen', 'Sell cargo'), st.verkaufen)}
            ${knopf('ware', T('Kaufe: ', 'Buy: ') + (w ? w.icon + ' ' + w.name : T('nichts', 'nothing')), !!w)}
            ${w ? knopf('menge', st.kaufMenge === 'voll' ? T('so viel wie passt', 'as much as fits') : st.kaufMenge + T(' Stück', ' units'), true) : ''}
            ${hatLager ? knopf('lagerAbgeben', T('⬇ ins Lager', '⬇ to storage'), st.lagerAbgeben) + knopf('lagerAbholen', T('⬆ aus Lager', '⬆ from storage'), st.lagerAbholen) : ''}
          </div>`;
  });
  const o = oase(S.gewOase);
  if (o && o.aktiv && r.stationen.length < 6) h += `<button data-a="rsplus">＋ ${T(`${o.name} als Station`, `${o.name} as a stop`)}</button> `;
  if (r.stationen.length >= 2) {
    h += `<button data-a="route" class="${r.aktiv ? 'an' : ''}">${r.aktiv ? T('⏸ Route anhalten', '⏸ Pause route') : T('▶ Route starten', '▶ Start route')}</button>`;
  }
  h += `<div class="hinweis">${T('Tippe auf die Knöpfe einer Station, um sie umzuschalten. Gekauft wird nur, wenn der Preis höchstens 30 % über dem Grundpreis liegt – verkauft nur ohne Verlust.',
                                 'Tap a stop\'s buttons to switch them. Goods are only bought at no more than 30% above the base price – and only sold without a loss.')}</div>`;
  return h;
}

function htmlAuftraege() {
  let h = `<h2>📜 ${T('Aufträge', 'Contracts')}</h2>`;
  if (!S.auftraege.length) {
    h += `<p class="hinweis">${T('Keine offenen Aufträge. Oasen mit 📜 auf der Karte haben Angebote – tippe sie an.', 'No open contracts. Oases marked 📜 on the map have offers – tap them.')}</p>`;
  }
  for (const a of S.auftraege) {
    const w = ware(a.ware), rest = a.bisTag - S.tag;
    h += `<div class="info">${w.icon} ${a.menge} ${w.name} → <b>${oase(a.oase).name}</b> · ${a.lohn} D ·
          <span class="${rest <= 3 ? 'warnung' : ''}">${T(`noch ${rest} Tage`, `${rest} days left`)}</span></div>`;
  }
  if (S.angebote.length) h += `<div class="hinweis">${T(`${S.angebote.length} Angebot(e) warten auf Händler.`, `${S.angebote.length} offer(s) waiting for a merchant.`)}</div>`;
  return h;
}

// Welche Funktion gehört zu welchem Knopf? Im HTML steht data-a="…" (Aktion),
// dazu optional data-v="…" und data-n="…" (Werte, die die Funktion braucht).
const AKTIONEN = {
  kauf:       (v, n) => kaufen(v, +n),
  verk:       (v, n) => verkaufen(v, +n),
  tier:       v => tierKaufen(v),
  tierv:      v => tierVerkaufen(v),
  wk:         v => waehleKarawane(+v),
  los:        () => losziehen(),
  wache:      v => wachenAendern(+v),
  annehmen:   v => auftragAnnehmen(+v),
  erfuellen:  v => auftragErfuellen(+v),
  leihen:     v => leihen(+v),
  tilgen:     v => tilgen(+v),
  neu:        () => menueOeffnen(),
  tippweiter: () => einfuehrungWeiter(),
  tippende:   () => einfuehrungBeenden(),
  bote:       () => boteSenden(),
  lagerhaus:  () => lagerhausBauen(),
  betrieb:    v => betriebBauen(v),
  lager:      (v, n) => lagerAktion(n, v),
  rs:         (v, n) => routeStationAendern(+v, n),
  rsplus:     () => routeStationHinzu(),
  route:      () => routeUmschalten(),
  brunnen:    () => brunnenBauen(),
  heilen:     () => heilen(),
  nacht:      () => nachtmarschUmschalten(),
  angriff:    () => lagerAngreifen(),
  haus:       (v, n) => hausAktion(v, +n),
  ausbau:     () => gebaeudeAusbauen(),
  werkstatt:  v => werkstattBauen(v),
  serei:      () => karawansereiBauen(),
  reisende:   v => reisendeMitnehmen(+v),
  kundschafter: () => kundschafterAussenden(),
};

// Ein einziger Klick-Empfänger für alle Knöpfe der Seitenleiste ("Event Delegation")
document.getElementById('seite').addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  const { a, v, n } = b.dataset;
  if (AKTIONEN[a]) AKTIONEN[a](v, n);
});

// Auf-/Zuklappen merken ("toggle" sprudelt nicht nach oben, darum "capture" = true)
document.getElementById('seite').addEventListener('toggle', e => {
  const id = e.target.dataset && e.target.dataset.bereich;
  if (!id) return;
  if (e.target.open) offeneBereiche.add(id); else offeneBereiche.delete(id);
}, true);
