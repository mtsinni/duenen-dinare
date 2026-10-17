/* =====================================================================
   17. SEITENLEISTE (HTML) – wird nach Aktionen und jeden Tag neu aufgebaut
   ===================================================================== */

function zeichnePanel() {
  pruefeAufgaben();
  einfuehrungPruefen();
  document.getElementById('panelTipp').innerHTML = symbole(htmlTipp());
  const j = jahreszeit();
  document.getElementById('anzeigeJahreszeit').innerHTML = symbole(`${j.icon} ${j.name}, ${T('Jahr', 'year')} ${jahr()}`);
  document.getElementById('btnTon').innerHTML = symbole(tonAn ? '🔊' : '🔇');
  document.getElementById('anzeigeTag').textContent = T('Tag ', 'Day ') + S.tag;
  document.getElementById('anzeigeRang').textContent = RAENGE[S.rang].name;
  // Fortschrittsbalken im Rang-Kästchen: wie weit ist es noch bis zum nächsten Rang?
  const rk = document.getElementById('rangKasten'), naechster = RAENGE[S.rang + 1];
  const anteil = rangFortschritt();
  rk.style.setProperty('--fortschritt', (anteil * 100).toFixed(1) + '%');
  rk.title = naechster
    ? T(`Noch ${zahlText(Math.max(0, Math.ceil(naechster.ab - S.rekordVermoegen)))} 🪙 Vermögen bis „${naechster.name}“ (${Math.floor(anteil * 100)} %)`,
        `${zahlText(Math.max(0, Math.ceil(naechster.ab - S.rekordVermoegen)))} 🪙 more fortune until "${naechster.name}" (${Math.floor(anteil * 100)}%)`)
    : T('Höchster Rang erreicht!', 'Highest rank reached!');
  const gold = document.getElementById('anzeigeGold');
  gold.textContent = zahlText(Math.floor(S.gold));
  gold.classList.toggle('minus', S.gold < 0);
  document.getElementById('anzeigeSchulden').innerHTML = symbole(
    S.schulden > 0 ? `📉 ${zahlText(Math.round(S.schulden))} 🪙 ${T('Schulden', 'debt')}` : '');

  // Pause-Knopf: zeigt „Weiter“, solange angehalten ist. Der Tempo-Knopf, mit dem es
  // danach weitergeht, bleibt während der Pause schwach markiert.
  const pk = document.getElementById('btnPause');
  pk.classList.toggle('an', S.pause);
  pk.innerHTML = symbole(S.pause ? `▶<span class="txt"> ${T('Weiter', 'Resume')}</span>` : `⏸<span class="txt"> ${T('Pause', 'Pause')}</span>`);
  document.querySelectorAll('[data-tempo]').forEach(b => {
    b.classList.toggle('an', !S.pause && +b.dataset.tempo === S.tempo);
    b.classList.toggle('gemerkt', S.pause && +b.dataset.tempo === S.tempo);
  });

  if (!schieber.zieht) document.getElementById('panelOase').innerHTML = symbole(htmlOase());
  // Ist gerade eine Auswahlliste geöffnet, die Karawanen nicht neu zeichnen (sonst klappt sie zu)
  const offeneListe = typeof document.activeElement !== 'undefined' && document.activeElement && document.activeElement.tagName === 'SELECT';
  if (!offeneListe) document.getElementById('panelKarawanen').innerHTML = symbole(htmlKarawanen());
  document.getElementById('panelAuftraege').innerHTML = symbole(htmlAuftraege());
  document.getElementById('panelZiele').innerHTML = symbole(htmlZiele());
  document.getElementById('panelHaeuser').innerHTML = symbole(htmlHaeuser());
  document.getElementById('log').innerHTML =
    symbole(S.log.map(e => `<div class="${e.art}">${T('Tag', 'Day')} ${e.tag}: ${e.text}</div>`).join(''));
  const neueste = S.log[0];
  document.getElementById('ticker').innerHTML = neueste
    ? symbole(`<span class="${neueste.art}">${T('Tag', 'Day')} ${neueste.tag}: ${neueste.text}</span>`) : '';
  zeichneReiter();
}

// --- Reiter: immer nur ein Bereich der Seitenleiste ist sichtbar ---
const REITER = [
  { id: 'oase',       icon: '🌴', de: 'Oase',       en: 'Oasis',     panel: 'panelOase' },
  { id: 'karawanen',  icon: '🐪', de: 'Karawanen',  en: 'Caravans',  panel: 'panelKarawanen' },
  { id: 'auftraege',  icon: '📜', de: 'Aufträge',   en: 'Contracts', panel: 'panelAuftraege' },
  { id: 'ziele',      icon: '🎯', de: 'Ziele',      en: 'Goals',     panel: 'panelZiele' },
  { id: 'haeuser',    icon: '🤝', de: 'Häuser',     en: 'Houses',    panel: 'panelHaeuser' },
  { id: 'ereignisse', icon: '📰', de: 'Ereignisse', en: 'Events',    panel: 'logKasten' },
];
let aktiverReiter = (() => {
  try { const r = localStorage.getItem('karawane-reiter'); if (REITER.some(x => x.id === r)) return r; } catch (e) {}
  return 'oase';
})();
let ungeleseneMeldungen = 0;

function reiterWaehlen(id) {
  aktiverReiter = id;
  try { localStorage.setItem('karawane-reiter', id); } catch (e) {}
  zeichneReiter();
  // Auf dem Handy: Reiterleiste nach oben holen, damit man den Inhalt sieht
  const leiste = document.getElementById('reiter');
  if (leiste.getBoundingClientRect && leiste.getBoundingClientRect().top < 0) leiste.scrollIntoView({ block: 'start' });
}

function zeichneReiter() {
  if (aktiverReiter === 'ereignisse') ungeleseneMeldungen = 0;
  document.getElementById('reiter').innerHTML = symbole(REITER.map(r => {
    const zahl = r.id === 'ereignisse' && ungeleseneMeldungen > 0
      ? `<span class="punkt">${ungeleseneMeldungen > 9 ? '9+' : ungeleseneMeldungen}</span>` : '';
    return `<button data-reiter="${r.id}" class="${r.id === aktiverReiter ? 'an' : ''}" title="${T(r.de, r.en)}">
              <span class="r-icon">${r.icon}</span><small>${T(r.de, r.en)}</small>${zahl}</button>`;
  }).join(''));
  for (const r of REITER) document.getElementById(r.panel).classList.toggle('versteckt', r.id !== aktiverReiter);
}

// Aufklappbare Abschnitte. Welche offen sind, merken wir uns hier –
// sonst würden sie beim täglichen Neuzeichnen wieder zuklappen.
const offeneBereiche = new Set(['markt', 'karawane', 'aufgaben']);
function bereich(id, titel, inhalt) {
  return `<details data-bereich="${id}" ${offeneBereiche.has(id) ? 'open' : ''}>
            <summary>${titel}</summary>${inhalt}</details>`;
}

// --- Die Oase: oben Name und Wasser, darunter eigene Reiter für Markt, Gebäude usw. ---
let aktiverOasenReiter = (() => { try { return localStorage.getItem('karawane-oasenreiter') || 'markt'; } catch (e) { return 'markt'; } })();

function oasenReiterWaehlen(id) {
  aktiverOasenReiter = id;
  try { localStorage.setItem('karawane-oasenreiter', id); } catch (e) {}
  zeichnePanel();
}

function htmlOase() {
  if (S.bankrott) {
    return `<h2>💀 ${T('Bankrott', 'Bankrupt')}</h2>
            <p>${T(`Die Geldverleiher haben alles gepfändet. Deine Handelsgeschichte endet an Tag ${S.tag}.`, `The moneylenders have seized everything. Your trading story ends on day ${S.tag}.`)}</p>
            <button data-a="neu">${T('Neues Spiel beginnen', 'Start a new game')}</button>`;
  }
  const o = oase(S.gewOase);
  if (!o) return `<h2>${T('Oase', 'Oasis')}</h2><p class="hinweis">${T('Tippe auf eine Oase auf der Karte.', 'Tap an oasis on the map.')}</p>`;
  if (!o.aktiv) {
    let h = `<h2>🌴 ${o.name}</h2>
      <p>${T('Diese Oase ist versiegt. Nur Ruinen und Sand sind geblieben – vielleicht bringt Regen sie zurück.', 'This oasis has dried up. Only ruins and sand remain – perhaps rain will bring it back.')}</p>`;
    if (S.gebaeude[o.id]) h += `<h3>🏛️ ${T('Deine Gebäude', 'Your buildings')}</h3>` + htmlGebaeude(o);
    return h;
  }

  const handel = kannHandeln();
  // Kopf: Name und Wasserstand – bleibt in jedem Reiter sichtbar
  let h = `<div class="oasen-kopf"><h2>🌴 ${o.name}</h2>
             <span class="wasser-pille" title="${T('Wasserstand', 'Water level')}">💧 ${Math.round(o.wasser)} %</span></div>
           <div class="bar"><div style="width:${Math.max(0, o.wasser)}%;background:${wasserFarbe(o.wasser)}"></div></div>`;

  // Alle Abschnitte sammeln. Abschnitte ohne Inhalt bekommen keinen Reiter.
  const abschnitte = [];
  const dazu = (id, icon, de, en, inhalt, zahl = 0) => { if (inhalt) abschnitte.push({ id, icon, name: T(de, en), inhalt, zahl }); };

  dazu('markt', '📊', 'Markt', 'Market', htmlMarkt(o, handel) + htmlOasenExtras(o));

  // Übersicht: Einwohner, Waren, Ansehen
  dazu('info', 'ℹ️', 'Oase', 'Oasis',
    `<div class="info">👥 ${Math.round(o.bev)} ${T('Einwohner', 'people')}</div>
     <div class="info">🏭 ${T('erzeugt', 'produces')} ${o.produziert.map(id => ware(id).icon + ' ' + ware(id).name).join(', ')}</div>
     <div class="info">🏅 ${T('Ansehen', 'Reputation')}: ${ansehenTitel(ansehen(o))} (${Math.round(ansehen(o))}/100)` +
       (ansehenVorteil(o) >= 0.005 ? ` · ${Math.round(ansehenVorteil(o) * 100)} % ${T('bessere Preise', 'better prices')}` : '') + `</div>
     <div class="info">💧 ${T('Wasserstand', 'Water level')} ${Math.round(o.wasser)} %</div>`);

  // Der Scheich: Angebote annehmen und eigene Aufträge hier abliefern
  const angebote = S.angebote.filter(a => a.oase === o.id);
  const auftraege = S.auftraege.filter(a => a.oase === o.id);
  if (angebote.length || auftraege.length) {
    let s = '';
    for (const a of angebote) {
      const w = ware(a.ware);
      s += `<div class="info">${T('Sucht', 'Wants')} <b>${a.menge} ${w.icon} ${w.name}</b> · ${T('Lohn', 'pay')} ${a.lohn} 🪙 · ${T(`Frist ${a.frist} Tage`, `${a.frist} days`)}
            <button data-a="annehmen" data-v="${a.id}" ${S.auftraege.length >= 3 ? 'disabled' : ''}>${T('Annehmen', 'Accept')}</button></div>`;
    }
    if (angebote.length && S.auftraege.length >= 3) s += `<p class="hinweis">${T('Du hast schon 3 offene Aufträge.', 'You already have 3 open contracts.')}</p>`;
    for (const a of auftraege) {
      const w = ware(a.ware);
      const kannLiefern = handel && handel.k.ladung[w.id] >= a.menge;
      s += `<div class="info">${T('Dein Auftrag', 'Your contract')}: <b>${a.menge} ${w.icon} ${w.name}</b> · ${a.lohn} 🪙 · ${T(`noch ${a.bisTag - S.tag} Tage`, `${a.bisTag - S.tag} days left`)}
            <button data-a="erfuellen" data-v="${a.id}" ${kannLiefern ? '' : 'disabled'}>${T('Abliefern', 'Deliver')}</button></div>`;
    }
    dazu('scheich', '📜', 'Scheich', 'Sheikh', `<h3>${T(`Der Scheich von ${o.name}`, `The sheikh of ${o.name}`)}</h3>` + s, angebote.length + auftraege.length);
  }

  const reisende = S.reisende.filter(r => r.von === o.id).length;
  dazu('reisende', '🧕', 'Reisende', 'Travellers',
       reisende ? `<h3>${T('Reisende suchen eine Karawane', 'Travellers looking for a caravan')}</h3>` + htmlReisende(o, handel) : '', reisende);

  if (augenVorOrt(o)) {
    dazu('kundschafter', '🔭', 'Kundschafter', 'Scouts',
      `<div class="info">${T('Kundschafter kartieren unbekannte Wüste in der Nähe – vielleicht finden sie etwas.', 'Scouts map unknown desert nearby – maybe they find something.')}</div>
       <button data-a="kundschafter" ${S.gold < KUNDSCHAFTER_PREIS ? 'disabled' : ''}>🔭 ${T('Kundschafter aussenden', 'Send out scouts')} (${KUNDSCHAFTER_PREIS} 🪙)</button>`);
  }
  dazu('gebaeude', '🏛️', 'Gebäude', 'Buildings', htmlGebaeude(o));
  dazu('dienste', '🏗️', 'Dienste', 'Services', htmlDienste(o, handel));

  // Geldverleiher (nur in größeren Oasen)
  if (o.bev >= VERLEIHER_AB_BEV) {
    const rest = KREDIT_RAHMEN - S.schulden;
    dazu('verleiher', '💰', 'Geldverleiher', 'Moneylender', `
          <div class="info">${T('Deine Schulden', 'Your debt')}: <b>${Math.round(S.schulden)} 🪙</b> · ${T('Zinsen', 'interest')} ${zahlText(zinsSatz() * 100)} % ${T('pro Tag', 'per day')}
            (≈ ${Math.round(S.schulden * zinsSatz())} 🪙 ${T('täglich', 'daily')})</div>
          <div class="info">
            <button data-a="leihen" data-v="500" ${rest < 500 ? 'disabled' : ''}>${T('500 leihen', 'Borrow 500')}</button>
            <button data-a="leihen" data-v="1000" ${rest < 1000 ? 'disabled' : ''}>${T('1000 leihen', 'Borrow 1000')}</button>
            <button data-a="tilgen" data-v="500" ${S.schulden <= 0 || S.gold < 1 ? 'disabled' : ''}>${T('500 zurück', 'Repay 500')}</button>
            <button data-a="tilgen" data-v="999999" ${S.schulden <= 0 || S.gold < 1 ? 'disabled' : ''}>${T('alles zurück', 'Repay all')}</button>
          </div>
          <div class="hinweis">${T(`Kreditrahmen ${KREDIT_RAHMEN} 🪙. Über ${PFAENDUNG_AB} 🪙 Schulden wird gepfändet.`, `Credit limit ${KREDIT_RAHMEN} 🪙. Debts above ${PFAENDUNG_AB} 🪙 lead to seizure.`)}</div>`);
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
              ? `<button data-a="tier" data-v="${typ}" ${S.gold < tier.preis ? 'disabled' : ''}>${tier.preis} 🪙</button>`
              : `<small>${T('nur in Städten', 'cities only')}</small>`}</td></tr>`;
  }
  dazu('tiere', '🐾', 'Tiermarkt', 'Animals', t + '</table>');

  // Gewählten Reiter zeigen – gibt es ihn in dieser Oase nicht, dann den Markt
  const aktiv = abschnitte.find(a => a.id === aktiverOasenReiter) || abschnitte[0];
  h += '<div class="oasen-reiter">' + abschnitte.map(a =>
    `<button data-a="oasenreiter" data-v="${a.id}" class="${a === aktiv ? 'an' : ''}">${a.icon} ${a.name}` +
    (a.zahl ? ` <span class="zahl">${a.zahl}</span>` : '') + '</button>').join('') + '</div>';
  h += `<div class="oasen-inhalt">${aktiv.inhalt}</div>`;
  return h;
}

// Der Markt – live, wenn eigene Leute vor Ort sind, sonst aus dem Gedächtnis
// Ist die Seitenleiste zu schmal für eine Zeile pro Ware, kommen die Knöpfe in eine eigene Zeile
function schmal() {
  const seite = document.getElementById('seite');
  const breite = seite && seite.clientWidth ? seite.clientWidth : window.innerWidth;
  return breite < 600;
}

// --- Schieber: beliebige Menge kaufen (nach rechts) oder verkaufen (nach links) ---
const schieber = { ware: null, menge: 0, zieht: false };

// Was würde der Handel kosten / bringen? Wir rechnen jede Einheit einzeln durch –
// genau wie beim echten Kauf, denn der Preis ändert sich mit jeder Einheit.
// Das Lager wird dafür nur kurz verändert und sofort wiederhergestellt.
function handelVorschau(k, o, wid, menge) {
  const w = ware(wid), lagerVorher = o.lager[wid];
  let anzahl = 0, betrag = 0;
  if (menge > 0) {
    let gold = S.gold, platz = kapazitaet(k) - ladungGewicht(k);
    for (let i = 0; i < menge; i++) {
      if (o.lager[wid] < 1 || platz < 1) break;
      const preis = kaufPreis(o, w);
      if (gold < preis) break;
      gold -= preis; platz--; o.lager[wid]--; anzahl++; betrag += preis;
    }
  } else {
    for (let i = 0; i < -menge && i < Math.floor(k.ladung[wid]); i++) {
      const preis = verkaufPreis(o, w);
      o.lager[wid]++; anzahl++; betrag += preis;
    }
  }
  o.lager[wid] = lagerVorher;
  return { anzahl, betrag };
}

// Wie viel geht höchstens? (Kaufen: Geld, Platz und Vorrat der Oase – Verkaufen: was dabei ist)
function schieberGrenzen(k, o, wid) {
  return { maxKauf: handelVorschau(k, o, wid, 9999).anzahl, maxVerk: Math.floor(k.ladung[wid]) };
}

function htmlSchieber(k, o, w) {
  const g = schieberGrenzen(k, o, w.id);
  schieber.menge = Math.max(-g.maxVerk, Math.min(g.maxKauf, schieber.menge));
  return `<div class="schieber">
      <span class="s-grenze s-verk">${g.maxVerk ? '−' + g.maxVerk : '0'}</span>
      <button data-a="schieberSchritt" data-v="-1" title="−1">‹</button>
      <input type="range" id="schieberRegler" min="${-g.maxVerk}" max="${g.maxKauf}" step="1" value="${schieber.menge}" style="--null:${g.maxVerk + g.maxKauf ? (g.maxVerk / (g.maxVerk + g.maxKauf) * 100).toFixed(1) : 50}%"
             aria-label="${T('Menge', 'Amount')}">
      <button data-a="schieberSchritt" data-v="1" title="+1">›</button>
      <span class="s-grenze s-kauf">${g.maxKauf ? '+' + g.maxKauf : '0'}</span>
    </div>
    <div class="schieber-fuss">
      <span id="schieberInfo">${schieberText(k, o, w.id, schieber.menge)}</span>
      <span>
        <button data-a="schieberOk" id="schieberOk" class="an" ${schieber.menge ? '' : 'disabled'}>${T('Handeln', 'Trade')}</button>
        <button data-a="schieber" data-v="${w.id}" title="${T('Schließen', 'Close')}">✕</button>
      </span>
    </div>`;
}

function schieberText(k, o, wid, menge) {
  const w = ware(wid);
  if (!menge) return `<span class="hinweis">${T('← verkaufen · kaufen →', '← sell · buy →')}</span>`;
  const v = handelVorschau(k, o, wid, menge);
  const schnitt = v.anzahl ? Math.round(v.betrag / v.anzahl) : 0;
  return (menge > 0 ? T('Kaufen', 'Buy') : T('Verkaufen', 'Sell')) +
    `: <b>${v.anzahl} ${w.icon} ${w.name}</b> ${menge > 0 ? T('für', 'for') : T('bringt', 'earns')} <b>${zahlText(v.betrag)}</b>${DINAR}` +
    ` <span class="hinweis">(Ø ${schnitt}${DINAR})</span>`;
}

// Nur die Anzeige unter dem Regler auffrischen – nicht das ganze Panel,
// sonst würde der Regler beim Ziehen neu gebaut und "losgelassen".
function schieberAnzeigen() {
  const h = kannHandeln(); if (!h || !schieber.ware) return;
  const info = document.getElementById('schieberInfo'), ok = document.getElementById('schieberOk');
  if (info) info.innerHTML = symbole(schieberText(h.k, h.o, schieber.ware, schieber.menge));
  if (ok) ok.disabled = !schieber.menge;
}

function schieberUmschalten(wid) {
  schieber.ware = schieber.ware === wid ? null : wid;
  schieber.menge = 0;
  zeichnePanel();
}

function schieberSchritt(d) {
  const r = document.getElementById('schieberRegler'); if (!r) return;
  schieber.menge = Math.max(+r.min, Math.min(+r.max, schieber.menge + d));
  r.value = schieber.menge;
  schieberAnzeigen();
}

function schieberHandeln() {
  const wid = schieber.ware, menge = schieber.menge;
  schieber.ware = null; schieber.menge = 0;
  if (menge > 0) kaufen(wid, menge);
  else if (menge < 0) verkaufen(wid, -menge);
  else zeichnePanel();
}

// Kleine Münze hinter jedem Preis
const DINAR = ' <span class="waehrung">🪙</span>';

function htmlMarkt(o, handel) {
  const live = augenVorOrt(o);
  if (live) merkePreise(o);
  const p = S.wissen[o.id];
  const bote = `<button data-a="bote" ${S.gold < BOTE_PREIS ? 'disabled' : ''}>🏃 ${T('Boten schicken', 'Send a messenger')} (${BOTE_PREIS} 🪙)</button>`;
  // Was stellt die Oase selbst her? Diese Waren sind hier meist günstig.
  const prodZeile = `<div class="produktion">🏭 ${T('Hier hergestellt', 'Made here')}: ` +
    o.produziert.map(id => `<span class="prod-ware">${ware(id).icon} ${ware(id).name}</span>`).join(' ') + '</div>';
  if (!p) return prodZeile + `<p class="hinweis">${T('Die Preise hier kennst du noch nicht – du warst noch nie hier.', 'You do not know the prices here yet – you have never been here.')}</p>${bote}`;

  let h = prodZeile;
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
    const hier = o.produziert.includes(w.id);
    h += `<tr class="${hier ? 'hergestellt' : ''}"><td>${w.icon} ${w.name}${hier ? ' <span class="prod-marke" title="' + T('wird hier hergestellt', 'made here') + '">🏭</span>' : ''}${w.verderb ? ' ⏳' : ''}${fest}</td><td>${p.lager[w.id]}</td>
          <td>${p.kauf[w.id]}${DINAR}</td><td>${p.verk[w.id]}${DINAR}</td>`;
    if (handel) {
      const dabei = Math.floor(handel.k.ladung[w.id]);
      const offen = schieber.ware === w.id;
      const knoepfe = `<button data-a="schieber" data-v="${w.id}" class="${offen ? 'an' : ''}" title="${T('Menge frei wählen', 'Choose any amount')}">⚖️</button>
              <button data-a="kauf" data-v="${w.id}" data-n="1">+1</button>
              <button data-a="kauf" data-v="${w.id}" data-n="10">+10</button>
              <button data-a="verk" data-v="${w.id}" data-n="1" ${dabei < 1 ? 'disabled' : ''}>−1</button>
              <button data-a="verk" data-v="${w.id}" data-n="9999" ${dabei < 1 ? 'disabled' : ''}>${T('alle', 'all')}</button>`;
      // Auf dem Handy kommen die Knöpfe in eine eigene Zeile darunter
      h += schmal() ? `<td>${dabei}</td></tr><tr class="knopfzeile"><td colspan="5">${knoepfe}</td>`
                    : `<td>${dabei}</td><td style="white-space:nowrap">${knoepfe}</td>`;
      if (offen) h += `</tr><tr class="schieberzeile"><td colspan="${schmal() ? 5 : 6}">${htmlSchieber(handel.k, o, w)}</td>`;
    }
    h += '</tr>';
  }
  h += '</table>';
  h += `<div class="hinweis">${T('🏭 = wird hier hergestellt, meist günstig', '🏭 = made here, usually cheap')} · ${T('⏳ = verdirbt mit der Zeit (3 % pro Tag)', '⏳ = spoils over time (3% per day)')}</div>`;
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
              und kostet ${LAGERHAUS.unterhalt} 🪙/Tag. Danach kannst du hier einen Betrieb und eine Werkstatt errichten.`,
              `A warehouse holds ${AUSBAU[1].platz} units, always shows you the current prices
              and costs ${LAGERHAUS.unterhalt} 🪙/day. Afterwards you can set up a business and a workshop here.`)}</div>
            <button data-a="lagerhaus" ${S.gold < LAGERHAUS.preis ? 'disabled' : ''}>🏛️ ${T('Lagerhaus bauen', 'Build warehouse')} (${LAGERHAUS.preis} 🪙)</button>`;
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
      h += `<div class="info">${T(`Betrieb errichten (${BETRIEB.preis} 🪙, ${BETRIEB.unterhalt} 🪙/Tag) – liefert täglich Ware ins Lagerhaus:`,
                                  `Set up a business (${BETRIEB.preis} 🪙, ${BETRIEB.unterhalt} 🪙/day) – delivers goods to the warehouse daily:`)}</div>`;
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
          <button data-a="ausbau" ${S.gold < naechste.preis ? 'disabled' : ''}>${T('Ausbauen', 'Upgrade')} (${naechste.preis} 🪙)</button></div>`;
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
    h += `<div class="info"><button data-a="werkstatt" data-v="${id}" ${S.gold < W.preis ? 'disabled' : ''}>${W.name} (${W.preis} 🪙)</button>
          <span class="hinweis">${rezeptText(W.rezept)} → ${rezeptText(W.ergebnis)}, ${W.unterhalt} 🪙/${T('Tag', 'day')}</span></div>`;
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
  let d = `<div class="info"><button data-a="umbenennen">✏️ ${T('Umbenennen', 'Rename')}</button></div>`;
  d += `<div class="info">${T('Tempo', 'Speed')} ${Math.round(tempo)} · ${T('Durst', 'Thirst')} ${zahlText(durst, 1)} 💧/${T('Tag', 'day')} · ${T('Unterhalt', 'Upkeep')} ${unterhaltKosten(k)} 🪙/${T('Tag', 'day')}</div>`;
  d += `<div class="info">📈 ${T('Bilanz bisher', 'Balance so far')}: <b class="${k.bilanz < 0 ? 'warnung' : ''}">${k.bilanz >= 0 ? '+' : ''}${Math.round(k.bilanz)} 🪙</b></div>`;

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
       ? ` <button data-a="wache" data-v="1" ${S.gold < WACHE_PREIS ? 'disabled' : ''}>${T('+1 anheuern', 'Hire +1')} (${WACHE_PREIS} 🪙)</button>
           <button data-a="wache" data-v="-1" ${k.wachen < 1 ? 'disabled' : ''}>${T('entlassen', 'dismiss')}</button>`
       : '') + '</div>';

  if (anOase) {
    for (const t in k.tiere) if (k.tiere[t] > 0) {
      d += `<div class="info">${TIERE[t].icon} ${k.tiere[t]}× ${TIERE[t].name}
            <button data-a="tierv" data-v="${t}">${T('verkaufen', 'sell')} (${Math.floor(TIERE[t].preis * 0.5)} 🪙)</button></div>`;
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
    stationAufruesten(st);
    const o = oase(st.oase);
    const aktuell = r.aktiv && i === r.index;
    const hatLager = !!S.gebaeude[st.oase];
    const knopf = (feld, text, an) =>
      `<button data-a="rs" data-v="${i}" data-n="${feld}" class="${an ? 'an' : ''}">${text}</button>`;
    // Auswahlliste (Optionen ohne Emojis – in <option> können keine Symbole stehen)
    const wahl = (feld, wert, optionen) => `<select data-w="rs" data-v="${i}" data-n="${feld}">` +
      optionen.map(([v, t]) => `<option value="${v}"${String(v) === String(wert) ? ' selected' : ''}>${t}</option>`).join('') + '</select>';
    const warenListe = WAREN.filter(w => w.id !== 'wasser').map(w => [w.id, w.name]);
    const stueck = n => `${n} ${T('Stück', 'units')}`;
    const kaufMengen = ROUTE_KAUF_MENGEN.map(m => [m, m === 'voll' ? T('so viel wie passt', 'as much as fits') : stueck(m)]);
    const verkaufMengen = ROUTE_VERKAUF_MENGEN.map(m => [m, m === 'alle' ? T('alles', 'all') : m === 'haelfte' ? T('die Hälfte', 'half') : stueck(m)]);

    let v = `<div class="st-zeile"><span class="st-titel">${T('Verkaufen', 'Sell')}</span>` +
      wahl('modus', st.verkaufModus, [['alles', T('alles (außer Einkäufe hier)', 'everything (except purchases here)')],
                                      ['auswahl', T('nur bestimmte Waren', 'only selected goods')], ['nichts', T('nichts', 'nothing')]]) + '</div>';
    if (st.verkaufModus === 'auswahl') {
      st.verkauf.forEach((e, j) => {
        v += `<div class="st-zeile st-unter">${wahl('verkaufWare:' + j, e.ware, warenListe)}${wahl('verkaufMenge:' + j, e.menge, verkaufMengen)}${knopf('verkaufWeg:' + j, '✕', false)}</div>`;
      });
      if (st.verkauf.length < 6) v += `<div class="st-zeile st-unter">${knopf('verkaufPlus', T('＋ Ware', '＋ Goods'), false)}</div>`;
    }
    if (st.verkaufModus !== 'nichts') {
      v += `<div class="st-zeile st-unter"><span class="hinweis">${T('Preis:', 'Price:')}</span>` +
        wahl('mindest', st.mindest, [['egal', T('zu jedem Preis', 'at any price')], ['verlust', T('nur ohne Verlust', 'only without a loss')],
                                     ['g10', T('mind. 10 % Gewinn', 'at least 10% profit')], ['g25', T('mind. 25 % Gewinn', 'at least 25% profit')],
                                     ['g50', T('mind. 50 % Gewinn', 'at least 50% profit')]]) + '</div>';
    }

    let k2 = `<div class="st-zeile"><span class="st-titel">${T('Einkaufen', 'Buy')}</span>${st.kauf.length ? '' : `<span class="hinweis">${T('nichts', 'nothing')}</span>`}</div>`;
    st.kauf.forEach((e, j) => {
      k2 += `<div class="st-zeile st-unter">${wahl('kaufWare:' + j, e.ware, warenListe)}${wahl('kaufMenge:' + j, e.menge, kaufMengen)}${knopf('kaufWeg:' + j, '✕', false)}</div>`;
    });
    if (st.kauf.length < 4) k2 += `<div class="st-zeile st-unter">${knopf('kaufPlus', T('＋ Ware', '＋ Goods'), false)}</div>`;
    if (st.kauf.length) {
      k2 += `<div class="st-zeile st-unter"><span class="hinweis">${T('Preis:', 'Price:')}</span>` +
        wahl('hoechst', st.hoechst, [['p0', T('höchstens Grundpreis', 'at most base price')], ['p15', T('bis Grundpreis +15 %', 'up to base price +15%')],
                                     ['p30', T('bis Grundpreis +30 %', 'up to base price +30%')], ['p60', T('bis Grundpreis +60 %', 'up to base price +60%')],
                                     ['egal', T('zu jedem Preis', 'at any price')]]) + '</div>';
    }

    h += `<div class="station ${aktuell ? 'aktuell' : ''}">
            <div class="st-kopf"><b>${i + 1}. ${o.name}</b>${aktuell ? T(' ◀ nächstes Ziel', ' ◀ next stop') : ''}${!o.aktiv ? ` <span class="warnung">${T('versiegt', 'dried up')}</span>` : ''}
            ${knopf('weg', '✕', false)}</div>
            ${v}${k2}
            ${hatLager ? `<div class="st-zeile"><span class="st-titel">${T('Lagerhaus', 'Warehouse')}</span>${knopf('lagerAbgeben', T('⬇ einlagern', '⬇ store'), st.lagerAbgeben)}${knopf('lagerAbholen', T('⬆ abholen', '⬆ collect'), st.lagerAbholen)}</div>` : ''}
          </div>`;
  });
  const o = oase(S.gewOase);
  if (o && o.aktiv && r.stationen.length < 6) h += `<button data-a="rsplus">＋ ${T(`${o.name} als Station`, `${o.name} as a stop`)}</button> `;
  if (r.stationen.length >= 2) {
    h += `<button data-a="route" class="${r.aktiv ? 'an' : ''}">${r.aktiv ? T('⏸ Route anhalten', '⏸ Pause route') : T('▶ Route starten', '▶ Start route')}</button>`;
  }
  h += `<div class="hinweis">${T('Pro Station kannst du bis zu 4 Waren einkaufen und festlegen, was und wie viel verkauft wird. Mit den Preisgrenzen kauft die Karawane nie zu teuer und verkauft nie zu billig. Wasser für die nächste Etappe kauft sie immer selbst.',
                                 'At each stop you can buy up to 4 goods and set what and how much is sold. With the price limits the caravan never buys too dear or sells too cheap. It always buys water for the next leg by itself.')}</div>`;
  return h;
}

function htmlAuftraege() {
  let h = `<h2>📜 ${T('Aufträge', 'Contracts')}</h2>`;
  if (!S.auftraege.length) {
    h += `<p class="hinweis">${T('Keine offenen Aufträge. Oasen mit 📜 auf der Karte haben Angebote – tippe sie an.', 'No open contracts. Oases marked 📜 on the map have offers – tap them.')}</p>`;
  }
  for (const a of S.auftraege) {
    const w = ware(a.ware), rest = a.bisTag - S.tag;
    h += `<div class="info">${w.icon} ${a.menge} ${w.name} → <b>${oase(a.oase).name}</b> · ${a.lohn} 🪙 ·
          <span class="${rest <= 3 ? 'warnung' : ''}">${T(`noch ${rest} Tage`, `${rest} days left`)}</span></div>`;
  }
  if (S.angebote.length) h += `<div class="hinweis">${T(`${S.angebote.length} Angebot(e) warten auf Händler.`, `${S.angebote.length} offer(s) waiting for a merchant.`)}</div>`;
  h += `<h3 style="margin-top:12px">⚔️ ${T('Söldner', 'Mercenaries')}</h3>` + htmlSoeldnerAuftraege();
  return h;
}

// Welche Funktion gehört zu welchem Knopf? Im HTML steht data-a="…" (Aktion),
// dazu optional data-v="…" und data-n="…" (Werte, die die Funktion braucht).
const AKTIONEN = {
  kauf:       (v, n) => kaufen(v, +n),
  schieber:   v => schieberUmschalten(v),
  schieberSchritt: v => schieberSchritt(+v),
  schieberOk: () => schieberHandeln(),
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
  rsw:        (v, n, w) => routeStationWahl(+v, n, w),
  rsplus:     () => routeStationHinzu(),
  umbenennen: () => karawaneUmbenennen(),
  route:      () => routeUmschalten(),
  brunnen:    () => brunnenBauen(),
  heilen:     () => heilen(),
  nacht:      () => nachtmarschUmschalten(),
  angriff:    () => lagerAngreifen(),
  soeldner:   v => soeldnerBeauftragen(v),
  haus:       (v, n) => hausAktion(v, +n),
  ausbau:     () => gebaeudeAusbauen(),
  werkstatt:  v => werkstattBauen(v),
  serei:      () => karawansereiBauen(),
  reisende:   v => reisendeMitnehmen(+v),
  kundschafter: () => kundschafterAussenden(),
  oasenreiter: v => oasenReiterWaehlen(v),
};

// Ein einziger Klick-Empfänger für alle Knöpfe der Seitenleiste ("Event Delegation")
document.getElementById('seite').addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  const { a, v, n } = b.dataset;
  if (AKTIONEN[a]) AKTIONEN[a](v, n);
});

// Auf-/Zuklappen merken ("toggle" sprudelt nicht nach oben, darum "capture" = true)
document.getElementById('seite').addEventListener('change', e => {
  const s = e.target.closest && e.target.closest('select[data-w="rs"]');
  if (s) { s.blur(); routeStationWahl(+s.dataset.v, s.dataset.n, s.value); }
});
document.getElementById('seite').addEventListener('input', e => {
  if (e.target.id !== 'schieberRegler') return;
  schieber.menge = +e.target.value;
  schieberAnzeigen();
});
document.getElementById('seite').addEventListener('pointerdown', e => {
  if (e.target.id === 'schieberRegler') schieber.zieht = true;
});
document.addEventListener('pointerup', () => { schieber.zieht = false; });
document.addEventListener('pointercancel', () => { schieber.zieht = false; });

document.getElementById('seite').addEventListener('toggle', e => {
  const id = e.target.dataset && e.target.dataset.bereich;
  if (!id) return;
  if (e.target.open) offeneBereiche.add(id); else offeneBereiche.delete(id);
}, true);
