/* =====================================================================
   10. ZIELE – Räuberlager angreifen, Ränge, Aufgaben und Statistik
   ===================================================================== */

// --- Räuberlager angreifen ---

// Ein aktives Lager in der Nähe der Oase, in der die Karawane steht?
function lagerInReichweite(k) {
  if (k.ort == null) return null;
  const o = oase(k.ort);
  return aktiveRaeuber().find(g => entfernung(o, g) < g.r + 180) || null;
}

function angriffsChance(k) { return Math.min(0.9, 0.12 * k.wachen + 0.06 * (fuehrerStufe(k) - 1) + 0.06 * talentStufe(k, 'krieger') + (hatAusruestung(k, 'waffen') ? 0.08 : 0)); }

function lagerAngreifen() {
  const k = karawane(S.gewKarawane);
  const g = k && lagerInReichweite(k);
  if (!g || k.wachen < 2) return;

  if (Math.random() < angriffsChance(k)) {
    const beute = zufallInt(600, 1500);
    S.gold += beute; k.bilanz += beute;
    buche('Beute', beute);
    g.ruhtBis = S.tag + zufallInt(25, 45);   // eine Weile ist hier Ruhe
    S.erfolge.lagerZerstoert = (S.erfolge.lagerZerstoert || 0) + 1;
    epGeben(k, 60);
    log(T(`⚔️ Sieg! ${k.fuehrer.name} und die Wachen von ${k.name} zerschlagen das Räuberlager und erbeuten ${beute} Dinar!`,
          `⚔️ Victory! ${k.fuehrer.name} and the guards of ${k.name} smash the robber camp and seize ${beute} dinars!`), 'gut');
    for (const z of S.oasen) if (z.aktiv && entfernung(z, g) < 350) ansehenAendern(z, 15);
    if (k.wachen > 0 && Math.random() < 0.3) { k.wachen--; log(T('Eine Wache ist im Kampf gefallen.', 'A guard fell in the fight.'), 'schlecht'); }
  } else {
    const verluste = Math.min(k.wachen, zufallInt(1, 3));
    k.wachen -= verluste;
    epGeben(k, 15);
    log(T(`⚔️ Der Angriff auf das Räuberlager scheitert! ${verluste} Wache(n) fallen.`, `⚔️ The attack on the robber camp fails! ${verluste} guard(s) fall.`), 'schlecht');
    if (Math.random() < 0.3) tierVerlieren(k, T('im Kampf verloren gegangen', 'was lost in the fight'));
  }
  zeichnePanel();
}

function htmlKarawanenAktionen(k) {
  const g = lagerInReichweite(k);
  if (!g) return '';
  const chance = Math.round(angriffsChance(k) * 100);
  return `<div class="info" style="margin-top:6px">⚔️ <b>${T('Ein Räuberlager ist in der Nähe!', 'A robber camp is nearby!')}</b>
          <button data-a="angriff" ${k.wachen < 2 ? 'disabled' : ''}>${T('Angreifen', 'Attack')} (${T('Erfolg', 'success')} ~${chance} %)</button>
          <div class="hinweis">${k.wachen < 2 ? T('Dafür brauchst du mindestens 2 Wachen. ', 'You need at least 2 guards for this. ') : ''}${T(
          'Jede Wache +12 %, jede Führerstufe +6 %. Ein Sieg bringt Beute, Ansehen in den Oasen ringsum und für eine Weile Ruhe.',
          'Each guard +12%, each leader level +6%. Victory brings loot, reputation in nearby oases and peace for a while.')}</div></div>`;
}

// --- Vermögen und Ränge ---

const RAENGE = [
  { ab: 0,      name: 'Wasserträger',     nameEn: 'Water carrier' },
  { ab: 5000,   name: 'Kleinhändler',     nameEn: 'Peddler' },
  { ab: 12000,  name: 'Händler',          nameEn: 'Merchant' },
  { ab: 25000,  name: 'Karawanenmeister', nameEn: 'Caravan master' },
  { ab: 50000,  name: 'Handelsfürst',     nameEn: 'Merchant prince' },
  { ab: 100000, name: 'Herr der Wüste',   nameEn: 'Lord of the Desert' },
];

// Alles, was dir gehört, minus Schulden
function vermoegen() {
  let wert = S.gold - S.schulden + (typeof zuchtWert === 'function' ? zuchtWert() : 0);
  for (const k of S.karawanen) {
    wert += ladungsWert(k) + k.ladung.wasser * 4;
    for (const t in k.tiere) wert += k.tiere[t] * TIERE[t].preis * 0.6;
  }
  for (const id in S.gebaeude) {
    const g = S.gebaeude[id];
    wert += LAGERHAUS.preis * 0.6 + (g.betrieb ? BETRIEB.preis * 0.6 : 0) + (g.werkstatt ? WERKSTAETTEN[g.werkstatt].preis * 0.6 : 0);
    for (let s = 2; s <= (g.stufe || 1); s++) wert += AUSBAU[s].preis * 0.6;
    for (const w of WAREN) wert += g.lager[w.id] * w.basis;
  }
  wert += (S.karawansereien || []).length * KARAWANSEREI.preis * 0.6;
  return Math.round(wert);
}

function rangVon(wert) {
  let rang = 0;
  RAENGE.forEach((r, i) => { if (wert >= r.ab) rang = i; });
  return rang;
}

// --- Aufgaben (Kampagne) ---

const AUFGABEN = [
  { id: 'start',      titel: 'Erste Geschäfte',      text: 'Erreiche ein Vermögen von 5.000 Dinar.',
    titelEn: 'First deals', textEn: 'Reach a fortune of 5,000 dinars.',
    erfuellt: () => vermoegen() >= 5000, lohn: 300 },
  { id: 'lager',      titel: 'Ein fester Stützpunkt', text: 'Baue ein Lagerhaus.',
    titelEn: 'A firm foothold', textEn: 'Build a warehouse.',
    erfuellt: () => Object.keys(S.gebaeude).length >= 1, lohn: 400 },
  { id: 'flotte',     titel: 'Wachsende Flotte',      text: 'Besitze 3 Karawanen gleichzeitig.',
    titelEn: 'Growing fleet', textEn: 'Own 3 caravans at the same time.',
    erfuellt: () => S.karawanen.length >= 3, lohn: 500 },
  { id: 'route',      titel: 'Es läuft von allein',   text: 'Lass eine Karawane eine Handelsroute mit mindestens 3 Stationen fahren.',
    titelEn: 'It runs by itself', textEn: 'Have a caravan run a trade route with at least 3 stops.',
    erfuellt: () => S.karawanen.some(k => k.route.aktiv && k.route.stationen.length >= 3), lohn: 600 },
  { id: 'freund',     titel: 'Freund der Oasen',      text: 'Erreiche in einer Oase das Ansehen „Freund“ (50).',
    titelEn: 'Friend of the oases', textEn: 'Reach the reputation "Friend" (50) in an oasis.',
    erfuellt: () => Object.values(S.ansehen).some(a => a >= 50), lohn: 700 },
  { id: 'betrieb',    titel: 'Eigene Herstellung',    text: 'Errichte einen Betrieb.',
    titelEn: 'Own production', textEn: 'Set up a business.',
    erfuellt: () => Object.values(S.gebaeude).some(g => g.betrieb), lohn: 800 },
  { id: 'retter',     titel: 'Wasser ist Leben',      text: 'Vertiefe einen Brunnen in einer Oase, deren Wasser unter 35 % gefallen ist.',
    titelEn: 'Water is life', textEn: 'Deepen a well in an oasis whose water has fallen below 35%.',
    erfuellt: () => (S.erfolge.retter || 0) >= 1, lohn: 800 },
  { id: 'entdecker',  titel: 'Entdecker',             text: 'Finde zwei verborgene Orte in der unerforschten Wüste.',
    titelEn: 'Explorer', textEn: 'Find two hidden places in the unexplored desert.',
    erfuellt: () => (S.erfolge.funde || 0) >= 2, lohn: 800 },
  { id: 'raeuber',    titel: 'Räuberjäger',           text: 'Zerschlage ein Räuberlager.',
    titelEn: 'Robber hunter', textEn: 'Destroy a robber camp.',
    erfuellt: () => (S.erfolge.lagerZerstoert || 0) >= 1, lohn: 1000 },
  { id: 'meister',    titel: 'Meister der Wege',      text: 'Ein Karawanenführer erreicht Stufe 5.',
    titelEn: 'Master of the trails', textEn: 'A caravan leader reaches level 5.',
    erfuellt: () => S.karawanen.some(k => fuehrerStufe(k) >= 5), lohn: 1000 },
  { id: 'nummer1',    titel: 'Die Nummer eins',       text: 'Werde mit mindestens 25.000 Dinar Vermögen das reichste aller Handelshäuser.',
    titelEn: 'Number one', textEn: 'Become the richest trading house with a fortune of at least 25,000 dinars.',
    erfuellt: () => vermoegen() >= 25000 && S.rivalen.every(r => vermoegen() > rivalenVermoegen(r)), lohn: 2000 },
  { id: 'herr',       titel: 'Herr der Wüste',        text: 'Erreiche 50.000 Dinar Vermögen bis Tag 365.',
    titelEn: 'Lord of the Desert', textEn: 'Reach a fortune of 50,000 dinars by day 365.',
    erfuellt: () => vermoegen() >= 50000, lohn: 5000, frist: 365 },
];

function aufgabeVerpasst(a) { return a.frist && S.tag > a.frist && !S.erledigt.includes(a.id); }

function pruefeAufgaben() {
  if (S.bankrott) return;
  for (const a of AUFGABEN) {
    if (S.erledigt.includes(a.id) || aufgabeVerpasst(a) || !a.erfuellt()) continue;
    S.erledigt.push(a.id);
    S.gold += a.lohn;
    buche('Belohnungen', a.lohn);
    log(T(`🎯 Aufgabe erfüllt: „${a.titel}“! Belohnung: ${a.lohn} Dinar.`, `🎯 Quest complete: "${a.titel}"! Reward: ${a.lohn} dinars.`), 'gut');
  }
  // Aufstieg im Rang: zählt das beste je erreichte Vermögen. Einkäufe, Bauten oder
  // Schulden nehmen dir den Fortschritt also nicht weg – nur der Sultan kann dich herabstufen.
  S.rekordVermoegen = Math.max(S.rekordVermoegen || 0, vermoegen());
  const rang = rangVon(S.rekordVermoegen);
  if (rang > S.rang && S.tag >= (S.rangSperreBis || 0)) {
    S.rang = rang;
    S.rangSeitTag = S.tag; S.schwacheTage = 0;
    log(T(`🏅 Dein Ruf eilt dir voraus: Man nennt dich jetzt „${RAENGE[rang].name}“!`, `🏅 Your reputation precedes you: they now call you "${RAENGE[rang].name}"!`), 'gut');
  }
}

// Wie weit ist es bis zum nächsten Rang? (0 … 1)
function rangFortschritt() {
  const naechster = RAENGE[S.rang + 1];
  if (!naechster) return 1;
  return Math.max(0, Math.min(1, ((S.rekordVermoegen || 0) - RAENGE[S.rang].ab) / (naechster.ab - RAENGE[S.rang].ab)));
}

// --- Die Gunst des Sultans ---
// Wer einen Rang trägt, muss ihm auch gerecht werden: genug Handel treiben und
// nicht ewig in der Kreide stehen. Sonst setzt der Sultan den Rang herab – nach einer Warnung.
const SULTAN = {
  tage: 30,             // Umsatz wird über die letzten 30 Tage gezählt
  umsatzAnteil: 0.2,    // nötiger Umsatz = 20 % der Schwelle des Rangs (Händler: 2.400 🪙 in 30 Tagen)
  schwachBis: 30,       // so viele Tage in Folge zu wenig Umsatz → Herabstufung
  schuldenWarnung: 25,  // nach so vielen Tagen mit Schulden: Warnung
  schuldenBis: 40,      // … und hier die Herabstufung
  sperre: 30,           // nach einer Herabstufung: so lange kein neuer Aufstieg
};
function umsatzNoetig() { return Math.round(RAENGE[S.rang].ab * SULTAN.umsatzAnteil); }
function umsatzZuletzt() { return Math.round((S.umsatzVerlauf || []).reduce((a, b) => a + b, 0)); }
function umsatzWirdGeprueft() { return S.rang > 0 && S.tag - (S.rangSeitTag || 0) >= SULTAN.tage && (S.umsatzVerlauf || []).length >= SULTAN.tage; }

function sultanTag() {
  // Umsatz des Tages festhalten (nur die letzten 30 Tage)
  S.umsatzVerlauf.push(Math.round(S.umsatzHeute || 0));
  if (S.umsatzVerlauf.length > SULTAN.tage) S.umsatzVerlauf.shift();
  S.umsatzHeute = 0;
  S.schuldenTage = S.schulden > 0 ? (S.schuldenTage || 0) + 1 : 0;
  if (S.rang === 0) { S.schwacheTage = 0; return; }

  // 1. Zu wenig Handel?
  if (umsatzWirdGeprueft() && umsatzZuletzt() < umsatzNoetig()) {
    S.schwacheTage = (S.schwacheTage || 0) + 1;
    if (S.schwacheTage === 1) {
      log(T(`👑 Am Hof des Sultans wundert man sich: Für einen „${RAENGE[S.rang].name}“ treibst du erstaunlich wenig Handel (${zahlText(umsatzZuletzt())} von ${zahlText(umsatzNoetig())} 🪙 in 30 Tagen).`,
            `👑 The Sultan's court is surprised: for a "${RAENGE[S.rang].name}" you trade remarkably little (${zahlText(umsatzZuletzt())} of ${zahlText(umsatzNoetig())} 🪙 in 30 days).`), 'schlecht');
    } else if (S.schwacheTage === Math.round(SULTAN.schwachBis * 2 / 3)) {
      log(T(`👑 Letzte Warnung vom Hof: Belebe deinen Handel, sonst verlierst du deinen Titel!`,
            `👑 Final warning from the court: revive your trade or you will lose your title!`), 'schlecht');
    } else if (S.schwacheTage >= SULTAN.schwachBis) {
      rangHerabsetzen(T('weil du kaum noch Handel treibst', 'because you hardly trade any more'));
      return;
    }
  } else {
    S.schwacheTage = 0;
  }

  // 2. Zu lange verschuldet?
  if (S.schuldenTage === SULTAN.schuldenWarnung) {
    log(T(`👑 Der Sultan hört, dass du seit ${S.schuldenTage} Tagen bei den Geldverleihern in der Kreide stehst. Begleiche deine Schulden!`,
          `👑 The Sultan hears that you have owed the moneylenders for ${S.schuldenTage} days. Settle your debts!`), 'schlecht');
  } else if (S.schuldenTage >= SULTAN.schuldenBis) {
    rangHerabsetzen(T('weil deine Schulden schon viel zu lange offen sind', 'because your debts have been open far too long'));
  }
}

function rangHerabsetzen(grund) {
  const alt = RAENGE[S.rang].name;
  S.rang--;
  // Der Fortschritt beginnt im niedrigeren Rang dort, wo dein Vermögen heute steht
  const neu = RAENGE[S.rang], naechster = RAENGE[S.rang + 1];
  S.rekordVermoegen = Math.max(neu.ab, Math.min(vermoegen(), naechster.ab - 1));
  S.rangSperreBis = S.tag + SULTAN.sperre;
  S.rangSeitTag = S.tag; S.schwacheTage = 0; S.schuldenTage = 0;
  ton('schlecht');
  log(T(`👑 Der Sultan ist verärgert: Er nimmt dir den Titel „${alt}“, ${grund}. Man nennt dich nur noch „${neu.name}“ – frühestens in ${SULTAN.sperre} Tagen kannst du wieder aufsteigen.`,
        `👑 The Sultan is displeased: he strips you of the title "${alt}" ${grund}. You are now only a "${neu.name}" – you can rise again in ${SULTAN.sperre} days at the earliest.`), 'schlecht');
}

// Für die Ziele: wie steht es um die Gunst des Sultans?
function htmlSultan() {
  if (S.rang === 0) return '';
  let h = `<div class="info" style="margin-top:8px">👑 <b>${T('Gunst des Sultans', "The Sultan's favour")}</b></div>`;
  const u = umsatzZuletzt(), n = umsatzNoetig();
  h += `<div class="hinweis">${u >= n ? '✅' : '⚠️'} ${T('Handel der letzten 30 Tage', 'Trade over the last 30 days')}: ${zahlText(u)} / ${zahlText(n)} 🪙` +
       (!umsatzWirdGeprueft() ? T(' (wird ab 30 Tagen im Rang geprüft)', ' (checked after 30 days at this rank)')
        : S.schwacheTage ? T(` – seit ${S.schwacheTage} Tagen zu wenig, nach ${SULTAN.schwachBis} wird herabgestuft`, ` – too little for ${S.schwacheTage} days, demotion after ${SULTAN.schwachBis}`) : '') + '</div>';
  h += `<div class="hinweis">${S.schuldenTage ? '⚠️' : '✅'} ${S.schuldenTage
        ? T(`Schulden seit ${S.schuldenTage} Tagen – nach ${SULTAN.schuldenBis} Tagen wird herabgestuft`, `In debt for ${S.schuldenTage} days – demotion after ${SULTAN.schuldenBis} days`)
        : T('Keine Schulden', 'No debts')}</div>`;
  if (S.tag < (S.rangSperreBis || 0)) h += `<div class="hinweis">⏳ ${T(`Der Sultan ist verstimmt – Aufstieg frühestens an Tag ${S.rangSperreBis}.`, `The Sultan is displeased – no promotion before day ${S.rangSperreBis}.`)}</div>`;
  return h;
}

// Läuft jeden Tag: Statistik aufzeichnen, Aufgaben prüfen
function zieleTag() {
  const v = S.statistik.verlauf;
  if (S.tag % 2 === 0) {
    v.push({ tag: S.tag, ich: vermoegen(), rivalen: S.rivalen.map(r => Math.round(rivalenVermoegen(r))) });
    // Sehr lange Spiele: jeden zweiten alten Punkt weglassen, damit der Speicher klein bleibt
    if (v.length > 400) S.statistik.verlauf = v.filter((e, i) => i % 2 === 0 || i > v.length - 50);
  }
  sultanTag();
  pruefeAufgaben();
  if (statistikOffen) zeichneStatistik();
}

function htmlZiele() {
  const naechster = RAENGE[S.rang + 1];
  let h = `<h2>🎯 ${T('Ziele', 'Goals')}</h2>
           ${htmlSiegZiel()}
           <div class="info">🏅 ${T('Rang', 'Rank')}: <b>${RAENGE[S.rang].name}</b> · ${T('Vermögen', 'Fortune')} ${zahlText(vermoegen())} 🪙</div>`;
  if (naechster) {
    h += `<div class="hinweis">${T(`Nächster Rang „${naechster.name}“ ab ${zahlText(naechster.ab)} 🪙 – dein bester Stand: ${zahlText(S.rekordVermoegen || 0)} 🪙`,
                                   `Next rank "${naechster.name}" from ${zahlText(naechster.ab)} 🪙 – your best so far: ${zahlText(S.rekordVermoegen || 0)} 🪙`)}</div>
          <div class="bar"><div style="width:${rangFortschritt() * 100}%;background:var(--akzent)"></div></div>`;
  }
  h += htmlSultan();
  const offen = AUFGABEN.filter(a => !S.erledigt.includes(a.id) && !aufgabeVerpasst(a));
  let liste = '';
  for (const a of offen.slice(0, 3)) {
    liste += `<div class="info">⏳ <b>${a.titel}</b> – ${a.text} <span class="hinweis">(+${a.lohn} 🪙${a.frist ? T(`, noch ${Math.max(0, a.frist - S.tag)} Tage`, `, ${Math.max(0, a.frist - S.tag)} days left`) : ''})</span></div>`;
  }
  if (offen.length > 3) liste += `<div class="hinweis">${T(`… und ${offen.length - 3} weitere Aufgaben.`, `… and ${offen.length - 3} more quests.`)}</div>`;
  for (const a of AUFGABEN.filter(a => S.erledigt.includes(a.id))) liste += `<div class="hinweis">✅ ${a.titel}</div>`;
  for (const a of AUFGABEN.filter(aufgabeVerpasst)) liste += `<div class="hinweis">❌ ${a.titel} (${T('Frist verpasst', 'deadline missed')})</div>`;
  if (!offen.length) liste += `<div class="info">${T('🏆 Du hast alle Aufgaben gemeistert!', '🏆 You have mastered every quest!')}</div>`;
  h += bereich('aufgaben', `${T('Aufgaben', 'Quests')} (${S.erledigt.length}/${AUFGABEN.length})`, liste);
  const erreicht = errungenschaftenLesen();
  h += `<button data-a="erfolge" style="margin-top:10px">🏆 ${T('Errungenschaften', 'Achievements')} (${ERRUNGENSCHAFTEN.filter(e => erreicht[e.id]).length}/${ERRUNGENSCHAFTEN.length})</button>`;
  return h;
}

// --- Statistik-Fenster ---

let statistikOffen = false, pauseVorStatistik = false;
let fensterArt = 'statistik';   // dasselbe Fenster zeigt die Statistik oder ein Räuberlager

function statistikUmschalten(offen) {
  if (offen && statistikOffen) { zeichneStatistik(); return; }
  statistikOffen = offen;
  document.getElementById('statistik').classList.toggle('offen', offen);
  if (offen) { pauseVorStatistik = S.pause; S.pause = true; zeichneStatistik(); }
  else { S.pause = pauseVorStatistik; }
  zeichnePanel();
}

function zahl(n) { return zahlText(Math.round(n)); }

// Die Buchungsarten sind auf Deutsch gespeichert – für die Anzeige übersetzen
const BUCHUNGSARTEN_EN = {
  'Aufträge': 'Contracts', 'Bauten': 'Construction', 'Belohnungen': 'Rewards', 'Beute': 'Loot', 'Söldner': 'Mercenaries', 'Handelsposten': 'Trading posts', 'Boten': 'Messengers',
  'Diplomatie': 'Diplomacy', 'Funde': 'Finds', 'Gebäude': 'Buildings', 'Handel': 'Trade', 'Heiler': 'Healer',
  'Kundschafter': 'Scouts', 'Reisende': 'Passengers', 'Strafen': 'Penalties', 'Unterhalt': 'Upkeep', 'Zinsen': 'Interest',
};
function buchungsart(a) { return T(a, BUCHUNGSARTEN_EN[a] || a); }

function zeichneStatistik() {
  if (fensterArt === 'lager') { document.getElementById('statistik').innerHTML = symbole(htmlLagerFenster()); return; }
  if (fensterArt === 'erfolge') { document.getElementById('statistik').innerHTML = symbole(htmlErrungenschaften()); return; }
  if (fensterArt === 'hilfe') { document.getElementById('statistik').innerHTML = symbole(htmlHilfe()); return; }
  if (fensterArt === 'entscheidung') { document.getElementById('statistik').innerHTML = symbole(htmlEntscheidung()); return; }
  if (fensterArt === 'talent') { document.getElementById('statistik').innerHTML = symbole(htmlTalentFenster()); return; }
  if (fensterArt === 'sieg') { document.getElementById('statistik').innerHTML = symbole(htmlSiegFenster()); return; }
  const ich = vermoegen();
  const rangliste = [{ name: T('Du', 'You'), du: true, wert: ich, farbe: '#b5651d' },
                     ...S.rivalen.map(r => ({ name: r.name, wert: rivalenVermoegen(r), farbe: r.farbe }))]
                     .sort((a, b) => b.wert - a.wert);

  let h = `<div class="fenster">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2 style="margin:0">📊 ${T('Statistik', 'Statistics')} – ${T('Tag', 'Day')} ${S.tag}</h2>
      <span class="hinweis">${S.karte && S.karte.art === 'zufall' ? '🎲 ' : '🗺 '}${kartenText(S.karte)}</span>
      <button data-s="zu">✕ ${T('Schließen', 'Close')}</button>
    </div>
    <p class="info">🏅 <b>${RAENGE[S.rang].name}</b> · ${T('Vermögen', 'Fortune')} <b>${zahl(ich)} 🪙</b>
       (${T('Gold', 'Gold')} ${zahl(S.gold)} 🪙${S.schulden > 0 ? `, ${T('Schulden', 'debts')} ${zahl(S.schulden)} 🪙` : ''})</p>

    <h3>${T('Vermögensverlauf', 'Fortune over time')}</h3>${htmlVerlaufsDiagramm()}

    <h3>${T('Rangliste der Handelshäuser', 'Ranking of the trading houses')}</h3><table>`;
  rangliste.forEach((r, i) => {
    h += `<tr><td>${i + 1}. <span class="punkt" style="background:${r.farbe}"></span> ${r.du ? `<b>${r.name}</b>` : r.name}</td><td>${zahl(r.wert)} 🪙</td></tr>`;
  });
  h += '</table>';

  // Einnahmen und Ausgaben nach Art
  const ein = S.statistik.einnahmen, aus = S.statistik.ausgaben;
  const arten = [...new Set([...Object.keys(ein), ...Object.keys(aus)])].sort();
  h += `<h3>${T('Einnahmen & Ausgaben (gesamt)', 'Income & expenses (total)')}</h3><table><tr><th>${T('Art', 'Type')}</th><th>${T('Einnahmen', 'Income')}</th><th>${T('Ausgaben', 'Expenses')}</th></tr>`;
  for (const a of arten) h += `<tr><td>${buchungsart(a)}</td><td>${ein[a] ? zahl(ein[a]) : '–'}</td><td>${aus[a] ? zahl(aus[a]) : '–'}</td></tr>`;
  h += '</table>';

  // Karawanen
  h += `<h3>${T('Gewinn pro Karawane', 'Profit per caravan')}</h3><table><tr><th>${T('Karawane', 'Caravan')}</th><th>${T('Führer', 'Leader')}</th><th>${T('Bilanz', 'Balance')}</th></tr>`;
  for (const k of [...S.karawanen].sort((a, b) => b.bilanz - a.bilanz)) {
    h += `<tr><td>${k.name}${k.route.aktiv ? ' 🔁' : ''}</td><td>${k.fuehrer.name} ${'⭐'.repeat(fuehrerStufe(k))}</td><td>${k.bilanz >= 0 ? '+' : ''}${zahl(k.bilanz)} 🪙</td></tr>`;
  }
  h += '</table>';

  // Beste Handelsrouten
  const routen = Object.entries(S.statistik.routen).sort((a, b) => b[1] - a[1]).slice(0, 5);
  h += `<h3>${T('Beste Handelsrouten', 'Best trade routes')}</h3>`;
  if (routen.length) {
    h += `<table><tr><th>${T('Route', 'Route')}</th><th>${T('Gewinn', 'Profit')}</th></tr>`;
    for (const [name, gewinn] of routen) h += `<tr><td>${name}</td><td>${gewinn >= 0 ? '+' : ''}${zahl(gewinn)} 🪙</td></tr>`;
    h += '</table>';
  } else {
    h += `<p class="hinweis">${T('Noch keine Waren von einer Oase in eine andere gebracht.', 'No goods carried from one oasis to another yet.')}</p>`;
  }

  // Ansehen
  const bekannt = S.oasen.filter(o => ansehen(o) >= 1).sort((a, b) => ansehen(b) - ansehen(a));
  if (bekannt.length) {
    h += `<h3>${T('Ansehen', 'Reputation')}</h3><table>`;
    for (const o of bekannt) h += `<tr><td>${o.name}</td><td>${ansehenTitel(ansehen(o))} (${Math.round(ansehen(o))})</td></tr>`;
    h += '</table>';
  }
  h += '</div>';

  document.getElementById('statistik').innerHTML = symbole(h);
  diagrammInteraktiv();
}

// Liniendiagramm als SVG: du + die drei Handelshäuser, direkt beschriftet
let diagramm = null;

function htmlVerlaufsDiagramm() {
  const v = S.statistik.verlauf;
  if (v.length < 2) { diagramm = null; return `<p class="hinweis">${T('Der Verlauf erscheint nach ein paar Tagen.', 'The chart appears after a few days.')}</p>`; }

  const B = 680, H = 260, L = 52, R = 118, O = 14, U = 26;
  const reihen = [{ name: T('Du', 'You'), farbe: '#b5651d', dicke: 3, werte: v.map(e => e.ich) },
                  ...S.rivalen.map((r, i) => ({ name: r.name, farbe: r.farbe, dicke: 2,
                                                werte: v.map(e => e.rivalen[i] != null ? e.rivalen[i] : null) }))];
  const alle = reihen.flatMap(r => r.werte.filter(x => x != null));
  const minW = Math.min(0, ...alle);
  const roh = Math.max(1000, ...alle);
  const schritt = Math.pow(10, Math.floor(Math.log10(roh)));
  const maxW = Math.ceil(roh / (schritt / 2)) * (schritt / 2);   // „runde“ Obergrenze

  const x = i => L + i / (v.length - 1) * (B - L - R);
  const y = w => O + (1 - (w - minW) / (maxW - minW)) * (H - O - U);
  diagramm = { v, reihen, x, y, B, H, L, R, O, U };

  let s = `<svg id="verlauf" viewBox="0 0 ${B} ${H}" width="100%" role="img" aria-label="${T('Vermögensverlauf', 'Fortune over time')}">`;
  // Zurückhaltendes Raster mit 4 Linien
  for (let i = 0; i <= 4; i++) {
    const w = minW + (maxW - minW) * i / 4, yy = y(w);
    s += `<line x1="${L}" x2="${B - R}" y1="${yy}" y2="${yy}" stroke="#e2d2ac" stroke-width="1"/>
          <text x="${L - 6}" y="${yy + 4}" text-anchor="end" font-size="11" fill="#7a5a3a">${w >= 1000 || w <= -1000 ? Math.round(w / 1000) + 'k' : Math.round(w)}</text>`;
  }
  s += `<text x="${L}" y="${H - 6}" font-size="11" fill="#7a5a3a">${T('Tag', 'Day')} ${v[0].tag}</text>
        <text x="${B - R}" y="${H - 6}" font-size="11" fill="#7a5a3a" text-anchor="end">${T('Tag', 'Day')} ${v[v.length - 1].tag}</text>`;

  // Linien (die eigene zuletzt, damit sie oben liegt)
  for (const r of [...reihen].reverse()) {
    const punkte = r.werte.map((w, i) => w == null ? null : `${x(i).toFixed(1)},${y(w).toFixed(1)}`).filter(Boolean).join(' ');
    s += `<polyline points="${punkte}" fill="none" stroke="${r.farbe}" stroke-width="${r.dicke}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }

  // Direkte Beschriftung am Linienende – Etiketten auseinanderschieben, damit nichts überlappt
  const etiketten = reihen.map(r => ({ r, yy: y(r.werte[r.werte.length - 1] ?? 0) })).sort((a, b) => a.yy - b.yy);
  for (let i = 1; i < etiketten.length; i++) {
    if (etiketten[i].yy - etiketten[i - 1].yy < 15) etiketten[i].yy = etiketten[i - 1].yy + 15;
  }
  for (const e of etiketten) {
    s += `<circle cx="${B - R + 10}" cy="${e.yy}" r="4" fill="${e.r.farbe}"/>
          <text x="${B - R + 18}" y="${e.yy + 4}" font-size="12" fill="#3b2a1a">${e.r.name}</text>`;
  }
  s += `<line id="fadenkreuz" y1="${O}" y2="${H - U}" stroke="#7a5a3a" stroke-width="1" visibility="hidden"/>
        <rect x="${L}" y="${O}" width="${B - L - R}" height="${H - O - U}" fill="transparent"/></svg>`;

  // Legende (zusätzlich zu den Beschriftungen) und Tabellenansicht
  const legende = reihen.map(r => `<span><span class="punkt" style="background:${r.farbe}"></span>${r.name}</span>`).join('');
  let tabelle = `<table><tr><th>${T('Tag', 'Day')}</th>` + reihen.map(r => `<th>${r.name}</th>`).join('') + '</tr>';
  const schrittweite = Math.max(1, Math.floor(v.length / 12));
  for (let i = v.length - 1; i >= 0; i -= schrittweite) {
    tabelle += `<tr><td>${v[i].tag}</td>` + reihen.map(r => `<td>${r.werte[i] != null ? zahl(r.werte[i]) : '–'}</td>`).join('') + '</tr>';
  }
  tabelle += '</table>';
  return `<div class="legende">${legende}</div>
          <div class="diagramm">${s}<div class="tooltip" id="tooltip"></div></div>
          <details><summary>${T('Werte als Tabelle', 'Values as a table')}</summary>${tabelle}</details>`;
}

// Fadenkreuz und Tooltip beim Überfahren mit Maus oder Finger
function diagrammInteraktiv() {
  const svg = document.getElementById('verlauf');
  if (!svg || !diagramm) return;
  const tip = document.getElementById('tooltip'), linie = document.getElementById('fadenkreuz');
  const zeige = e => {
    const d = diagramm, box = svg.getBoundingClientRect();
    const px = (e.clientX - box.left) / box.width * d.B;
    const i = Math.max(0, Math.min(d.v.length - 1, Math.round((px - d.L) / (d.B - d.L - d.R) * (d.v.length - 1))));
    const xx = d.x(i);
    linie.setAttribute('x1', xx); linie.setAttribute('x2', xx); linie.setAttribute('visibility', 'visible');
    tip.innerHTML = `<b>${T('Tag', 'Day')} ${d.v[i].tag}</b>` + d.reihen
      .map(r => ({ r, w: r.werte[i] })).filter(z => z.w != null).sort((a, b) => b.w - a.w)
      .map(z => `<div><span class="punkt" style="background:${z.r.farbe}"></span>${z.r.name}: ${zahl(z.w)} 🪙</div>`).join('');
    tip.style.display = 'block';
    const links = xx / d.B * box.width;
    tip.style.left = (links > box.width / 2 ? links - tip.offsetWidth - 12 : links + 12) + 'px';
    tip.style.top = '8px';
  };
  svg.addEventListener('pointermove', zeige);
  svg.addEventListener('pointerdown', zeige);
  svg.addEventListener('pointerleave', () => { tip.style.display = 'none'; linie.setAttribute('visibility', 'hidden'); });
}
