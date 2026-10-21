/* =====================================================================
   23. ERRUNGENSCHAFTEN – Meilensteine, die über alle Spiele hinweg bleiben
   Sie werden im Browser gespeichert (nicht im Spielstand): Was einmal
   erreicht ist, bleibt erreicht – auch nach einem neuen Spiel.
   Später lassen sie sich 1:1 als Steam-Errungenschaften übernehmen.
   ===================================================================== */

// Zähler für Dinge, die das Spiel sonst nicht festhält (im Spielstand)
function zaehle(name, n = 1) {
  if (!S.zaehler) S.zaehler = {};
  S.zaehler[name] = (S.zaehler[name] || 0) + n;
}
function zaehler(name) { return (S.zaehler && S.zaehler[name]) || 0; }

function tiereGesamt(typ) { return S.karawanen.reduce((n, k) => n + (k.tiere[typ] || 0), 0); }
function handelsEinnahmen() { return (S.statistik && S.statistik.einnahmen.Handel) || 0; }

const ERRUNGENSCHAFTEN = [
  { id: 'aufbruch',   icon: '🐪', name: 'Aufbruch',               nameEn: 'Setting out',
    text: 'Erreiche mit einer Karawane eine andere Oase.', textEn: 'Reach another oasis with a caravan.',
    pruefen: () => zaehler('ankuenfte') >= 1 },
  { id: 'handel1',    icon: '🪙', name: 'Erstes Geschäft',         nameEn: 'First deal',
    text: 'Verkaufe Waren für insgesamt 1.000 Dinar.', textEn: 'Sell goods worth 1,000 dinars in total.',
    pruefen: () => handelsEinnahmen() >= 1000 },
  { id: 'handel2',    icon: '💰', name: 'Basarkönig',              nameEn: 'King of the bazaar',
    text: 'Verkaufe Waren für insgesamt 100.000 Dinar.', textEn: 'Sell goods worth 100,000 dinars in total.',
    pruefen: () => handelsEinnahmen() >= 100000 },
  { id: 'reich1',     icon: '📈', name: 'Wohlhabend',              nameEn: 'Well-off',
    text: 'Erreiche ein Vermögen von 10.000 Dinar.', textEn: 'Reach a fortune of 10,000 dinars.',
    pruefen: () => vermoegen() >= 10000 },
  { id: 'reich2',     icon: '👑', name: 'Herr der Wüste',          nameEn: 'Lord of the Desert',
    text: 'Erreiche den höchsten Rang.', textEn: 'Reach the highest rank.',
    pruefen: () => S.rang >= RAENGE.length - 1 },
  { id: 'nummer1',    icon: '🏆', name: 'Die Nummer eins',         nameEn: 'Number one',
    text: 'Sei das reichste aller Handelshäuser (ab 25.000 Dinar).', textEn: 'Be the richest trading house (from 25,000 dinars).',
    pruefen: () => vermoegen() >= 25000 && S.rivalen.every(r => vermoegen() > rivalenVermoegen(r)) },
  { id: 'flotte',     icon: '🐫', name: 'Karawanenflotte',         nameEn: 'Caravan fleet',
    text: 'Besitze 5 Karawanen gleichzeitig.', textEn: 'Own 5 caravans at the same time.',
    pruefen: () => S.karawanen.length >= 5 },
  { id: 'elefant',    icon: '🐘', name: 'Dickhäuter',              nameEn: 'Pachyderm',
    text: 'Besitze einen Elefanten.', textEn: 'Own an elephant.',
    pruefen: () => tiereGesamt('elefant') >= 1 },
  { id: 'arche',      icon: '🐾', name: 'Arche der Wüste',         nameEn: 'Ark of the desert',
    text: 'Besitze gleichzeitig Kamele, Pferde, Esel und Elefanten.', textEn: 'Own camels, horses, donkeys and elephants at once.',
    pruefen: () => ['kamel', 'pferd', 'esel', 'elefant'].every(t => tiereGesamt(t) >= 1) },
  { id: 'lager3',     icon: '🏛', name: 'Netz der Lagerhäuser',    nameEn: 'Network of warehouses',
    text: 'Besitze 3 Lagerhäuser.', textEn: 'Own 3 warehouses.',
    pruefen: () => Object.keys(S.gebaeude).length >= 3 },
  { id: 'betrieb',    icon: '🏭', name: 'Fabrikant',               nameEn: 'Manufacturer',
    text: 'Errichte einen Betrieb.', textEn: 'Set up a business.',
    pruefen: () => Object.values(S.gebaeude).some(g => g.betrieb) },
  { id: 'route',      icon: '🔁', name: 'Läuft wie geschmiert',    nameEn: 'Running smoothly',
    text: 'Lass eine Handelsroute mit 4 Stationen fahren.', textEn: 'Run a trade route with 4 stops.',
    pruefen: () => S.karawanen.some(k => k.route.aktiv && k.route.stationen.length >= 4) },
  { id: 'sturm',      icon: '🌪', name: 'Sturmerprobt',            nameEn: 'Storm-tested',
    text: 'Komm 5-mal durch einen Sandsturm ans Ziel.', textEn: 'Make it through a sandstorm 5 times.',
    pruefen: () => zaehler('stuerme') >= 5 },
  { id: 'wehrhaft',   icon: '🛡', name: 'Wehrhaft',                nameEn: 'Hard to rob',
    text: 'Schlage 5 Überfälle zurück.', textEn: 'Fight off 5 raids.',
    pruefen: () => zaehler('abgewehrt') >= 5 },
  { id: 'entkommen',  icon: '🏃', name: 'Schneller als der Wind',  nameEn: 'Faster than the wind',
    text: 'Entkomme Plünderern, indem du rechtzeitig eine Oase erreichst.', textEn: 'Escape raiders by reaching an oasis in time.',
    pruefen: () => zaehler('entkommen') >= 1 },
  { id: 'raeuber',    icon: '⚔', name: 'Räuberschreck',            nameEn: 'Scourge of robbers',
    text: 'Zerschlage 3 Räuberlager.', textEn: 'Destroy 3 robber camps.',
    pruefen: () => (S.erfolge.lagerZerstoert || 0) >= 3 },
  { id: 'entdecker',  icon: '🧭', name: 'Entdecker',               nameEn: 'Explorer',
    text: 'Finde 3 verborgene Orte.', textEn: 'Find 3 hidden places.',
    pruefen: () => (S.erfolge.funde || 0) >= 3 },
  { id: 'brunnen',    icon: '💧', name: 'Brunnenbauer',            nameEn: 'Well builder',
    text: 'Vertiefe 3 Brunnen.', textEn: 'Deepen 3 wells.',
    pruefen: () => (S.erfolge.brunnen || 0) >= 3 },
  { id: 'freund',     icon: '🤝', name: 'Freund aller Oasen',      nameEn: 'Friend of all oases',
    text: 'Werde in 5 Oasen „Freund“ (Ansehen 50).', textEn: 'Become a "Friend" (reputation 50) in 5 oases.',
    pruefen: () => Object.values(S.ansehen).filter(a => a >= 50).length >= 5 },
  { id: 'fuehrer',    icon: '⭐', name: 'Meisterführer',           nameEn: 'Master guide',
    text: 'Ein Karawanenführer erreicht Stufe 5.', textEn: 'A caravan leader reaches level 5.',
    pruefen: () => S.karawanen.some(k => fuehrerStufe(k) >= 5) },
  { id: 'pilger',     icon: '🧕', name: 'Pilgerführer',            nameEn: 'Pilgrim guide',
    text: 'Verdiene 5.000 Dinar mit Reisenden.', textEn: 'Earn 5,000 dinars from passengers.',
    pruefen: () => (S.statistik.einnahmen.Reisende || 0) >= 5000 },
  { id: 'schuldenfrei', icon: '⚖', name: 'Aus den Miesen',         nameEn: 'Out of the red',
    text: 'Zahle Schulden von mindestens 1.000 Dinar vollständig zurück.', textEn: 'Fully repay debts of at least 1,000 dinars.',
    pruefen: () => (S.hoechsteSchulden || 0) >= 1000 && S.schulden <= 0 },
  { id: 'jahr',       icon: '🌙', name: 'Ein Jahr in der Wüste',   nameEn: 'A year in the desert',
    text: 'Spiele ein ganzes Spieljahr.', textEn: 'Play a whole game year.',
    pruefen: () => typeof jahr === 'function' && jahr() >= 2 },
  { id: 'sieg',       icon: '🏅', name: 'Sieger',                  nameEn: 'Victor',
    text: 'Erreiche ein Spielziel.', textEn: 'Achieve a game goal.',
    pruefen: () => !!(S.sieg && S.sieg.gewonnen) },
  { id: 'legende',    icon: '🦂', name: 'Wüstenlegende',           nameEn: 'Legend of the desert',
    text: 'Erreiche ein Spielziel auf „Schwer“.', textEn: 'Achieve a game goal on "Hard".',
    pruefen: () => !!(S.sieg && S.sieg.gewonnen && S.schwierigkeit === 'schwer') },
];

// --- Speichern im Browser ---
function errungenschaftenLesen() {
  try { return JSON.parse(localStorage.getItem('karawane-errungenschaften') || '{}') || {}; } catch (e) { return {}; }
}
function errungenschaftenSchreiben(e) {
  try { localStorage.setItem('karawane-errungenschaften', JSON.stringify(e)); } catch (x) {}
}

// Prüft alle noch offenen Errungenschaften (täglich und bei wichtigen Ereignissen)
function errungenschaftenPruefen() {
  if (!S || S.bankrott) return;
  if (S.schulden > (S.hoechsteSchulden || 0)) S.hoechsteSchulden = S.schulden;
  const erreicht = errungenschaftenLesen();
  let neu = false;
  for (const e of ERRUNGENSCHAFTEN) {
    if (erreicht[e.id]) continue;
    let ok = false;
    try { ok = e.pruefen(); } catch (x) { ok = false; }
    if (!ok) continue;
    erreicht[e.id] = new Date().toISOString().slice(0, 10);
    neu = true;
    errungenschaftZeigen(e);
    log(T(`🏆 Errungenschaft: „${e.name}“ – ${e.text}`, `🏆 Achievement: "${e.nameEn}" – ${e.textEn}`), 'gut');
  }
  if (neu) errungenschaftenSchreiben(erreicht);
}

// --- Die Einblendung oben am Bildschirm ---
const toastWarteschlange = [];
let toastLaeuft = false;
function errungenschaftZeigen(e) {
  toastWarteschlange.push(e);
  if (!toastLaeuft) naechsterToast();
}
function naechsterToast() {
  const e = toastWarteschlange.shift();
  if (!e) { toastLaeuft = false; return; }
  toastLaeuft = true;
  ton('errungenschaft');
  if (typeof document === 'undefined' || !document.body || !document.body.appendChild) { toastLaeuft = false; return; }
  let el = document.getElementById('erfolgToast');
  if (!el || !el.parentNode) {
    el = document.createElement('div');
    el.id = 'erfolgToast';
    document.body.appendChild(el);
  }
  el.innerHTML = symbole(`<div class="toast-icon">${e.icon}</div>
    <div><div class="toast-klein">🏆 ${T('Errungenschaft freigeschaltet', 'Achievement unlocked')}</div>
    <div class="toast-name">${T(e.name, e.nameEn)}</div><div class="toast-text">${T(e.text, e.textEn)}</div></div>`);
  el.classList.remove('zeigen'); void el.offsetWidth; el.classList.add('zeigen');
  if (typeof effektFunkeln === 'function') effektFunkeln();
  setTimeout(() => { el.classList.remove('zeigen'); setTimeout(naechsterToast, 500); }, 4200);
}

// --- Übersicht (im großen Fenster) ---
function htmlErrungenschaften() {
  const erreicht = errungenschaftenLesen();
  const anzahl = ERRUNGENSCHAFTEN.filter(e => erreicht[e.id]).length;
  let h = `<div class="fenster">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <h2 style="margin:0">🏆 ${T('Errungenschaften', 'Achievements')}</h2>
      <button data-s="zu">✕ ${T('Schließen', 'Close')}</button>
    </div>
    <p class="info">${T(`${anzahl} von ${ERRUNGENSCHAFTEN.length} freigeschaltet – sie bleiben auch in neuen Spielen erhalten.`,
                        `${anzahl} of ${ERRUNGENSCHAFTEN.length} unlocked – they carry over into new games.`)}</p>
    <div class="balken-erfolge"><div style="width:${Math.round(anzahl / ERRUNGENSCHAFTEN.length * 100)}%"></div></div>
    <div class="erfolge-liste">`;
  for (const e of ERRUNGENSCHAFTEN) {
    const datum = erreicht[e.id];
    h += `<div class="erfolg ${datum ? 'erreicht' : ''}">
        <div class="erfolg-icon">${e.icon}</div>
        <div><b>${T(e.name, e.nameEn)}</b><div class="hinweis">${T(e.text, e.textEn)}</div>
        ${datum ? `<div class="erfolg-datum">✅ ${new Date(datum + 'T12:00').toLocaleDateString(gebietsschema())}</div>` : ''}</div>
      </div>`;
  }
  return h + '</div></div>';
}
function errungenschaftenOeffnen() {
  if (menueOffen) menueSchliessen(false);
  fensterArt = 'erfolge';
  statistikUmschalten(true);
}
