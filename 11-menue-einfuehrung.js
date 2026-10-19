/* =====================================================================
   11. MENÜ – Speicherplätze, Schwierigkeitsgrade und Einführung
   ===================================================================== */

const SCHWIERIGKEITEN = {
  leicht: { name: 'Leicht', nameEn: 'Easy', icon: '🌴', startGold: 3500, raeuber: 0.6, seuchen: 0.6, zins: 0.003, wetter: 0.7, rivalen: 0.8,
            text: 'Mehr Startgold, weniger Räuber und Seuchen, günstige Kredite.',
            textEn: 'More starting gold, fewer robbers and plagues, cheap loans.' },
  normal: { name: 'Normal', nameEn: 'Normal', icon: '🐪', startGold: 2000, raeuber: 1,   seuchen: 1,   zins: 0.005, wetter: 1,   rivalen: 1,
            text: 'Das ausgewogene Wüstenabenteuer.', textEn: 'The balanced desert adventure.' },
  schwer: { name: 'Schwer', nameEn: 'Hard', icon: '🦂', startGold: 1200, raeuber: 1.5, seuchen: 1.5, zins: 0.008, wetter: 1.3, rivalen: 1.3,
            text: 'Wenig Geld, gefährliche Wege, gierige Geldverleiher und starke Konkurrenz.',
            textEn: 'Little money, dangerous trails, greedy moneylenders and strong rivals.' },
};
function sw() { return SCHWIERIGKEITEN[S.schwierigkeit] || SCHWIERIGKEITEN.normal; }
function zinsSatz() { return sw().zins; }

// --- Speicherplätze ---

const SLOT_ANZAHL = 3;
function slotSchluessel(n) { return 'karawane-slot-' + n; }

function slotLesen(n) {
  try { const text = localStorage.getItem(slotSchluessel(n)); return text ? JSON.parse(text) : null; }
  catch (e) { return null; }
}

function ladeSlot(n) {
  const daten = slotLesen(n);
  if (!daten) return false;
  S = daten;
  S.slot = n;
  aufruesten();
  namenUebersetzen();   // "Karawane 2" ↔ "Caravan 2" passend zur gewählten Sprache
  return true;
}

function slotLoeschen(n) {
  try { localStorage.removeItem(slotSchluessel(n)); } catch (e) {}
}

function zuletztGespielt() {
  try { return +(localStorage.getItem('karawane-zuletzt') || 1); } catch (e) { return 1; }
}

// Frühere Versionen hatten nur EINEN Spielstand – er wandert auf Platz 1
function alterSpielstandUebernehmen() {
  try {
    const alt = localStorage.getItem('karawane-spielstand');
    if (alt && !localStorage.getItem(slotSchluessel(1))) {
      localStorage.setItem(slotSchluessel(1), alt);
      localStorage.setItem('karawane-zuletzt', '1');
    }
    if (alt) localStorage.removeItem('karawane-spielstand');
  } catch (e) {}
}

// --- Das Menü-Fenster ---

let menueOffen = false, pauseVorMenue = false;
// Direkt nach dem Öffnen der Seite ist der letzte Spielstand gerade erst geladen –
// dann bleibt das Spiel auch nach „Weiter“ angehalten.
let geradeGeladen = true;
const menueWahl = { schwierigkeit: 'normal', slot: 1, einfuehrung: true };

function menueOeffnen() {
  if (statistikOffen) statistikUmschalten(false);
  menueOffen = true;
  pauseVorMenue = S.pause;
  S.pause = true;
  // Vorschlag für ein neues Spiel: der erste freie Platz
  const frei = [1, 2, 3].find(n => !slotLesen(n));
  menueWahl.slot = frei || S.slot || 1;
  zeichneMenue();
  document.getElementById('menue').classList.add('offen');
  zeichnePanel();
}

function menueSchliessen(weiterLaufen) {
  menueOffen = false;
  document.getElementById('menue').classList.remove('offen');
  S.pause = weiterLaufen ? false : pauseVorMenue;
  if (geradeGeladen) { S.pause = true; geradeGeladen = false; }
  zeichnePanel();
}

// Neues oder geladenes Spiel: immer erst einmal angehalten, damit man sich umschauen kann
function menueSchliessenMitPause() {
  pauseVorMenue = true;
  menueSchliessen(false);
}

function zeichneMenue() {
  const laeuft = !!slotLesen(S.slot) && !S.bankrott;
  let h = `<div class="fenster">
    <div class="sprachwahl">
      <button data-m="sprache" data-n="de" class="${SPRACHE === 'de' ? 'an' : ''}" lang="de">Deutsch</button>
      <button data-m="sprache" data-n="en" class="${SPRACHE === 'en' ? 'an' : ''}" lang="en">English</button>
    </div>
    <h2 style="margin-top:0; margin-bottom:2px">🐪 ${T('Dünen & Dinare', 'Dunes & Dinars')}</h2>
    <p class="untertitel">${T('Karawanenhandel in der Wüste', 'Caravan trading in the desert')}</p>`;
  if (laeuft) {
    h += `<button class="gross" data-m="weiter">▶ ${T(`Weiterspielen (Platz ${S.slot}, Tag ${S.tag})`, `Continue (slot ${S.slot}, day ${S.tag})`)}</button>`;
  }

  h += `<h3>${T('Spielstände', 'Saved games')}</h3>`;
  for (let n = 1; n <= SLOT_ANZAHL; n++) {
    const d = slotLesen(n);
    if (!d) {
      h += `<div class="slot"><b>${T('Platz', 'Slot')} ${n}</b> · <span class="hinweis">${T('leer', 'empty')}</span>
              <div style="margin-top:4px"><button data-m="import" data-n="${n}">📂 ${T('Aus Datei laden', 'Load from file')}</button></div></div>`;
      continue;
    }
    const z = d.zusammenfassung || {};
    const s = SCHWIERIGKEITEN[d.schwierigkeit] || SCHWIERIGKEITEN.normal;
    h += `<div class="slot ${n === S.slot ? 'aktuell' : ''}">
            <b>${T('Platz', 'Slot')} ${n}</b> · ${s.icon} ${s.name} · ${T('Tag', 'Day')} ${d.tag}${RAENGE[d.rang] ? ' · 🏅 ' + RAENGE[d.rang].name : ''}${z.vermoegen != null ? ' · ' + zahl(z.vermoegen) + ' 🪙' : ''}${d.bankrott ? ' · 💀 ' + T('bankrott', 'bankrupt') : ''}
            <div style="margin-top:4px">
              <button data-m="laden" data-n="${n}">${T('Laden', 'Load')}</button>
              <button data-m="export" data-n="${n}">💾 ${T('Als Datei sichern', 'Save as file')}</button>
              <button data-m="import" data-n="${n}">📂 ${T('Aus Datei laden', 'Load from file')}</button>
              <button data-m="loeschen" data-n="${n}">${T('Löschen', 'Delete')}</button>
            </div>
          </div>`;
  }

  h += `<h3>${T('Neues Spiel', 'New game')}</h3><div class="info">${T('Schwierigkeit', 'Difficulty')}:</div><div>`;
  for (const id in SCHWIERIGKEITEN) {
    const s = SCHWIERIGKEITEN[id];
    h += `<button data-m="sw" data-n="${id}" class="${menueWahl.schwierigkeit === id ? 'an' : ''}">${s.icon} ${s.name}</button> `;
  }
  h += `</div><div class="hinweis">${SCHWIERIGKEITEN[menueWahl.schwierigkeit].text}
        ${T('Startgold', 'Starting gold')}: ${SCHWIERIGKEITEN[menueWahl.schwierigkeit].startGold} 🪙.</div>
        <div class="info" style="margin-top:8px">${T('Speicherplatz', 'Save slot')}:</div><div>`;
  for (let n = 1; n <= SLOT_ANZAHL; n++) {
    h += `<button data-m="slot" data-n="${n}" class="${menueWahl.slot === n ? 'an' : ''}">${T('Platz', 'Slot')} ${n}${slotLesen(n) ? T(' (belegt)', ' (in use)') : ''}</button> `;
  }
  h += `</div><div style="margin-top:8px">
          <button data-m="einf" class="${menueWahl.einfuehrung ? 'an' : ''}">💡 ${T('Einführung', 'Tutorial')}: ${menueWahl.einfuehrung ? T('an', 'on') : T('aus', 'off')}</button>
        </div>
        <button class="gross" data-m="neu" style="margin-top:10px">🐪 ${T('Neues Spiel starten', 'Start new game')}</button>
        <p class="hinweis">${T('Dein Spiel wird jeden Spieltag automatisch auf seinem Platz gespeichert.', 'Your game is saved to its slot automatically every game day.')}</p>
      </div>`;
  document.getElementById('menue').innerHTML = symbole(h);
}

function menueAktion(m, n) {
  if (m === 'sprache') spracheSetzen(n);
  if (m === 'weiter') menueSchliessen(true);
  if (m === 'laden' && ladeSlot(+n)) { speichern(); menueSchliessenMitPause(); }
  if (m === 'loeschen') {
    if (confirm(T(`Spielstand auf Platz ${n} wirklich löschen?`, `Really delete the game in slot ${n}?`))) {
      slotLoeschen(+n);
      if (+n === S.slot) S.bankrott = false;   // das laufende Spiel ist nicht mehr gespeichert
    }
    zeichneMenue();
  }
  if (m === 'export') spielstandExportieren(+n);
  if (m === 'import') spielstandImportieren(+n);
  if (m === 'sw') { menueWahl.schwierigkeit = n; zeichneMenue(); }
  if (m === 'slot') { menueWahl.slot = +n; zeichneMenue(); }
  if (m === 'einf') { menueWahl.einfuehrung = !menueWahl.einfuehrung; zeichneMenue(); }
  if (m === 'neu') {
    if (slotLesen(menueWahl.slot) && !confirm(T(`Platz ${menueWahl.slot} ist belegt. Überschreiben?`, `Slot ${menueWahl.slot} is in use. Overwrite it?`))) return;
    neuesSpiel(menueWahl.schwierigkeit, menueWahl.slot, menueWahl.einfuehrung);
    speichern();
    menueSchliessenMitPause();
  }
}

// --- Spielstand als Datei: zum Sichern oder um auf einem anderen Gerät weiterzuspielen ---

function spielstandExportieren(n) {
  if (n === S.slot) speichern();               // das laufende Spiel vorher frisch speichern
  const daten = slotLesen(n);
  if (!daten) return;
  // Eine "Blob"-Datei im Speicher erzeugen und den Browser sie herunterladen lassen
  const datei = new Blob([JSON.stringify(daten)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(datei);
  link.download = T(`duenen-dinare-platz${n}-tag${daten.tag}.json`, `dunes-dinars-slot${n}-day${daten.tag}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

function spielstandImportieren(n) {
  const eingabe = document.createElement('input');
  eingabe.type = 'file';
  eingabe.accept = '.json,application/json';
  eingabe.addEventListener('change', () => {
    const datei = eingabe.files[0];
    if (!datei) return;
    const leser = new FileReader();
    leser.onload = () => {
      let daten;
      try { daten = JSON.parse(leser.result); } catch (e) { daten = null; }
      // Kurz prüfen, ob das wirklich ein Karawane-Spielstand ist
      if (!daten || !Array.isArray(daten.oasen) || !Array.isArray(daten.karawanen) || typeof daten.tag !== 'number') {
        alert(T('Diese Datei ist kein Karawane-Spielstand.', 'This file is not a Caravan saved game.'));
        return;
      }
      if (slotLesen(n) && !confirm(T(`Platz ${n} ist belegt. Mit dem Spielstand aus der Datei überschreiben?`, `Slot ${n} is in use. Overwrite it with the game from the file?`))) return;
      daten.slot = n;
      try { localStorage.setItem(slotSchluessel(n), JSON.stringify(daten)); } catch (e) {}
      ladeSlot(n);
      speichern();
      menueSchliessenMitPause();
      log(T(`📂 Spielstand aus „${datei.name}“ geladen.`, `📂 Game loaded from "${datei.name}".`), 'gut');
      zeichnePanel();
    };
    leser.readAsText(datei);
  });
  eingabe.click();
}

// --- Einführung für Einsteiger ---
// Jeder Schritt ist entweder mit "Weiter" zu bestätigen oder endet von selbst,
// sobald seine Bedingung (fertig) erfüllt ist.

const EINFUEHRUNG = [
  { weiter: true, text: `Willkommen, Händler! Deine erste Karawane mit 3 Kamelen steht in <b>Agadez</b>.
      Darunter siehst du den Markt der Oase: was sie im Lager hat, was du zahlst (<b>Kauf</b>) und was du bekommst (<b>Verk.</b>).
      Die Zeit ist angehalten, solange du dich umschaust.`,
    textEn: `Welcome, merchant! Your first caravan with 3 camels is in <b>Agadez</b>.
      Below you see the oasis market: what it has in stock, what you pay (<b>Buy</b>) and what you get (<b>Sell</b>).
      Time stands still while you look around.` },
  { text: 'Ohne Wasser verdursten deine Tiere unterwegs. Kaufe <b>Wasser</b>: Tippe in der Wasser-Zeile auf <b>+10</b>.',
    textEn: 'Without water your animals die of thirst on the way. Buy <b>water</b>: tap <b>+10</b> in the water row.',
    fertig: k => k.ladung.wasser >= 25 },
  { text: 'Agadez stellt <b>Salz</b> her – deshalb ist es hier billig. Kaufe mindestens 10 Salz (zweimal +10 geht auch).',
    textEn: 'Agadez produces <b>salt</b> – that is why it is cheap here. Buy at least 10 salt.',
    fertig: k => WAREN.some(w => w.id !== 'wasser' && k.ladung[w.id] >= 10) },
  { text: `Jetzt brauchst du ein Ziel. Tippe auf der Karte auf eine andere Oase, zum Beispiel <b>Tamanrasset</b> –
      dort wird kein Salz hergestellt, also zahlt man mehr. Fremde Preise kennst du erst, wenn du dort warst oder einen Boten schickst.
      Mit zwei Fingern, dem Mausrad oder den Knöpfen <b>+ / −</b> kannst du die Karte vergrößern.`,
    textEn: `Now you need a destination. Tap another oasis on the map, for example <b>Tamanrasset</b> –
      no salt is made there, so they pay more. You only know distant prices once you have been there or sent a messenger.
      Zoom the map with two fingers, the mouse wheel or the <b>+ / −</b> buttons.`,
    fertig: () => S.ziel != null },
  { text: 'Im Reiter <b>🐪 Karawanen</b> siehst du Reisedauer und Wasserbedarf. Reicht dein Wasser? Dann tippe auf <b>Aufbrechen</b>.',
    textEn: 'The <b>🐪 Caravans</b> tab shows the travel time and the water needed. Enough water? Then tap <b>Set out</b>.',
    fertig: k => k.nach != null },
  { text: `Deine Karawane ist unterwegs – die Zeit läuft jetzt! Mit <b>0,5× bis 5×</b> oben änderst du das Tempo,
      <b>Pause</b> (oder die Leertaste) hält sie an. Meide Sandstürme 🌪️ und rote Räubergebiete ⚔️.`,
    textEn: `Your caravan is on its way – time is running now! Change the speed with <b>0.5× to 5×</b> at the top,
      <b>Pause</b> (or the space bar) stops it. Avoid sandstorms 🌪️ and red robber areas ⚔️.`,
    fertig: k => k.ort != null },
  { text: 'Angekommen! Verkaufe deine Ware mit <b>alle</b>. Ist der Preis höher als in Agadez, hast du Gewinn gemacht.',
    textEn: 'You have arrived! Sell your goods with <b>all</b>. If the price is higher than in Agadez, you have made a profit.',
    fertig: k => WAREN.every(w => w.id === 'wasser' || k.ladung[w.id] < 1) },
  { weiter: true, text: `Geschafft – dein erstes Geschäft! Wie es weitergeht: Nimm <b>Aufträge</b> der Scheichs an (📜),
      heuere <b>Wachen</b> gegen Räuber an und kaufe weitere Tiere. Später helfen <b>Lagerhäuser</b> und automatische
      <b>Handelsrouten</b>. Im Reiter <b>🎯 Ziele</b> siehst du, was sich als Nächstes lohnt. Viel Erfolg!`,
    textEn: `Done – your first deal! What next: accept the sheikhs' <b>contracts</b> (📜),
      hire <b>guards</b> against robbers and buy more animals. Later, <b>warehouses</b> and automatic
      <b>trade routes</b> help. The <b>🎯 Goals</b> tab shows what is worth doing next. Good luck!` },
];

function einfuehrungPruefen() {
  const t = S.tutorial;
  if (!t || t.schritt < 0 || t.schritt >= EINFUEHRUNG.length) return;
  const k = karawane(S.gewKarawane) || S.karawanen[0];
  const schritt = EINFUEHRUNG[t.schritt];
  if (k && schritt.fertig && schritt.fertig(k)) {
    t.schritt++;
    ton('erfolg');
    if (t.schritt === 5) S.pause = false;   // die erste Reise beginnt: Zeit läuft
    einfuehrungPruefen();                   // vielleicht ist der nächste Schritt auch schon erledigt
  }
}

function einfuehrungWeiter() {
  const t = S.tutorial;
  t.schritt++;
  if (t.schritt >= EINFUEHRUNG.length) { t.schritt = -1; log(T('💡 Die Einführung ist beendet. Viel Erfolg in der Wüste!', '💡 The tutorial is over. Good luck in the desert!'), 'gut'); }
  zeichnePanel();
}

function einfuehrungBeenden() { S.tutorial.schritt = -1; zeichnePanel(); }

// Welcher Reiter zu welchem Schritt der Einführung gehört
const EINFUEHRUNG_REITER = ['oase', 'oase', 'oase', 'oase', 'karawanen', 'karawanen', 'oase', 'ziele'];
let letzterTippSchritt = null;

function htmlTipp() {
  const t = S.tutorial;
  if (!t || t.schritt < 0 || t.schritt >= EINFUEHRUNG.length) return '';
  if (letzterTippSchritt !== t.schritt) { letzterTippSchritt = t.schritt; aktiverReiter = EINFUEHRUNG_REITER[t.schritt] || aktiverReiter;
    if (aktiverReiter === 'oase') aktiverOasenReiter = 'markt'; }
  const schritt = EINFUEHRUNG[t.schritt];
  return `<div class="tipp">
    <div class="tipp-kopf">💡 ${T('Einführung', 'Tutorial')} · ${T('Schritt', 'Step')} ${t.schritt + 1} ${T('von', 'of')} ${EINFUEHRUNG.length}</div>
    <div>${schritt.text}</div>
    <div style="margin-top:6px">
      ${schritt.weiter ? `<button data-a="tippweiter" class="an">${T('Weiter', 'Next')}</button>` : ''}
      <button data-a="tippende">${T('Einführung beenden', 'End tutorial')}</button>
    </div></div>`;
}

// =====================================================================
// --- Die Startseite: Abendstimmung über den Dünen, eine Karawane zieht vorbei ---
// =====================================================================

let startOffen = false, startSpielGeladen = false, startBeginn = 0;

function startseiteOeffnen(gespeichert) {
  startOffen = true;
  startSpielGeladen = gespeichert;
  startBeginn = performance.now();
  S.pause = true;
  document.getElementById('startseite').classList.add('offen');
  zeichneStartInhalt();
  requestAnimationFrame(startMalen);
}

function startseiteSchliessen() {
  startOffen = false;
  document.getElementById('startseite').classList.remove('offen');
}

function zeichneStartInhalt() {
  let weiter = '';
  if (startSpielGeladen) {
    const s = SCHWIERIGKEITEN[S.schwierigkeit] || SCHWIERIGKEITEN.normal;
    weiter = `<button class="start-haupt" data-st="weiter">▶ ${T('Weiterspielen', 'Continue')}
                <small>${T('Platz', 'Slot')} ${S.slot} · ${T('Tag', 'Day')} ${S.tag} · 🏅 ${RAENGE[S.rang].name} · ${s.icon} ${s.name}</small></button>`;
  }
  document.getElementById('startInhalt').innerHTML = symbole(`
    <div class="start-sprache">
      <button data-st="sprache" data-n="de" class="${SPRACHE === 'de' ? 'an' : ''}">Deutsch</button>
      <button data-st="sprache" data-n="en" class="${SPRACHE === 'en' ? 'an' : ''}">English</button>
    </div>
    <div class="start-mitte">
      <div class="start-zier">✦ ✦ ✦</div>
      <h1 class="start-titel">${T('Dünen <span>&amp;</span> Dinare', 'Dunes <span>&amp;</span> Dinars')}</h1>
      <div class="start-unter">${T('Karawanenhandel in der Wüste', 'Caravan trading in the desert')}</div>
      <p class="start-text">${T('Führe deine Karawanen von Oase zu Oase, handle mit Salz, Weihrauch und Gold, trotze Sandstürmen und Räubern – und werde Herr der Wüste.',
                                'Lead your caravans from oasis to oasis, trade salt, frankincense and gold, brave sandstorms and robbers – and become Lord of the Desert.')}</p>
      <div class="start-knoepfe">
        ${weiter}
        <button class="${startSpielGeladen ? 'start-neben' : 'start-haupt'}" data-st="menue">${startSpielGeladen
          ? T('Neues Spiel · Spielstände', 'New game · Saved games')
          : T('🐪 Neues Spiel beginnen', '🐪 Start a new game')}</button>
      </div>
    </div>`);
}

function startAktion(art, n) {
  if (art === 'sprache') { spracheSetzen(n); zeichneStartInhalt(); return; }
  startseiteSchliessen();
  if (art === 'weiter') { geradeGeladen = false; S.pause = true; zeichnePanel(); }   // angehalten – Leertaste/▶ startet
  if (art === 'menue') menueOeffnen();
}

// Silhouetten-Farben für die Karawane vor dem Abendhimmel
const START_SCHATTEN = { grund: '#1d1020', schatten: '#140a18', licht: '#2b1a2c' };

// Höhe eines Dünenkamms an der Stelle x (aus ein paar Sinuswellen zusammengesetzt)
function duenenKamm(x, b, h, basis, wellen) {
  let y = basis * h;
  for (const [hoch, laenge, versatz] of wellen) y -= Math.sin(x / (b * laenge) + versatz) * hoch * h;
  return y;
}

// Die Dünenreihen der Startseite, von hinten nach vorne – je näher, desto dunkler.
// zug: Farben und Größe der Karawane, wenn sie auf dieser Düne läuft (weiter hinten = kleiner und blasser)
const START_DUENEN = [
  { farbe: '#a4524a', basis: 0.66, wellen: [[0.025, 0.11, 1], [0.012, 0.05, 2]], gross: 0.34, richtung: -1,
    zug: { grund: '#62293a', schatten: '#4e2030', licht: '#74343f' }, decke: '#55223a' },
  { farbe: '#77394a', basis: 0.72, wellen: [[0.035, 0.16, 3], [0.015, 0.07, 1]], gross: 0.46, richtung: 1,
    zug: { grund: '#47203a', schatten: '#381830', licht: '#552a42' }, decke: '#3e1b33' },
  { farbe: '#4a2440', basis: 0.8,  wellen: [[0.04, 0.2, 5], [0.02, 0.08, 2]], gross: 0.62, richtung: -1,
    zug: { grund: '#2b1428', schatten: '#200e1e', licht: '#3a1d34' }, decke: '#2a1430' },
];
const START_VORN = { basis: 0.88, wellen: [[0.05, 0.25, 0.6], [0.015, 0.09, 4]] };
const START_RAST = 5;     // so viele Sekunden rastet die Karawane an der Oase

// Wo die Palmen der Oase stehen (auf der hintersten Düne) – Mitte und Breite
function startOase(b, h) {
  const m = Math.min(h, b * 1.4);
  return { x: b * 0.22, abstand: m * 0.022, m };
}

// Die Reihenfolge der Tiere: der Elefant läuft hinten
const START_FIGUREN = ['kamel', 'pferd', 'kamel', 'esel', 'elefant'];
// Wie weit ragt jedes Tier nach vorne (Kopf, Rüssel) und nach hinten (Schwanz)? Dazwischen kommt eine Lücke.
const START_VORNE = { kamel: 12.8, pferd: 10.8, esel: 8.8, elefant: 14 }, START_HINTEN = { kamel: 7.4, pferd: 8.2, esel: 5.2, elefant: 9 };
const START_ABSTAENDE = (() => {
  const a = []; let summe = 0;
  START_FIGUREN.forEach((typ, i) => {
    if (i) summe += START_HINTEN[START_FIGUREN[i - 1]] + START_VORNE[typ] + 5;
    a.push(summe);
  });
  return a;
})();

// Berechnet aus der Zeit, wo die Karawane gerade ist. Die Reise hat vier Abschnitte:
//  0. vorderste Düne, links → rechts – vorne wartet man auf den bummelnden Elefanten („?“)
//  1. eine Düne weiter oben, rechts → links
//  2. noch eine Düne weiter oben, links → rechts
//  3. hinterste Düne, rechts → links – Rast bei den Palmen, dann weiter aus dem Bild
// Danach beginnt alles von vorn.
function startAblauf(t, b, h, gr) {
  const tempo = 22 * gr, elefantTempo = tempo * 0.7;   // Pixel pro Sekunde
  const elefantAbstand = START_ABSTAENDE[START_ABSTAENDE.length - 1] * gr;
  const figurenZug = []; // Ergebnis: [{typ, x, laeuft, schritt}]

  // --- Abschnitt 0 (die Szene mit dem Elefanten) ---
  const start = -100, halt = b * 0.6, ende = b + elefantAbstand + 120;
  const FRAGE = 2.6;                                     // so lange wundert sich die Karawane, bevor der Elefant auftaucht
  const ziel = halt - elefantAbstand;
  const elefantBeiHalt = -(START_VORNE.elefant + 2) * gr - elefantTempo * FRAGE;
  const t1 = (halt - start) / tempo, t2 = (ziel - elefantBeiHalt) / elefantTempo, t3 = (ende - halt) / tempo;
  const dauer0 = t1 + t2 + t3;

  // --- Abschnitte 1–3: die Karawane läuft geschlossen auf den hinteren Dünen ---
  const weitere = [2, 1, 0].map(reihe => {
    const d = START_DUENEN[reihe], s = d.gross * gr;
    const v = tempo * (0.7 + 0.3 * d.gross);             // weiter weg wirkt langsamer
    const laenge = elefantAbstand * d.gross, rand = 30 * s;
    const von = d.richtung > 0 ? -rand : b + rand;
    const bis = d.richtung > 0 ? b + laenge + rand : -laenge - rand;
    const a = { reihe, s, v, von, bis, richtung: d.richtung, rast: -1 };
    if (reihe === 0) {
      // Rast: die Karawane steht so, dass sie zwischen den Palmen ist
      a.rast = startOase(b, h).x - laenge * 0.4;
      a.dauer = Math.abs(a.rast - von) / v + START_RAST + Math.abs(bis - a.rast) / v;
    } else a.dauer = Math.abs(bis - von) / v;
    return a;
  });
  const gesamt = dauer0 + weitere.reduce((n, a) => n + a.dauer, 0);
  let tt = t % gesamt;

  if (tt < dauer0) {
    let kopfX, elefantX, vorneLaeuft, vorneGelaufen, elefantGelaufen, wartet = -1;
    if (tt < t1) {
      kopfX = start + tempo * tt; elefantX = elefantBeiHalt - elefantTempo * (t1 - tt);
      vorneLaeuft = true; vorneGelaufen = tt; elefantGelaufen = tt;
    } else if (tt < t1 + t2) {
      wartet = tt - t1;
      kopfX = halt; elefantX = elefantBeiHalt + elefantTempo * wartet;
      vorneLaeuft = false; vorneGelaufen = t1; elefantGelaufen = tt;
    } else {
      const nach = tt - t1 - t2;
      kopfX = halt + tempo * nach; elefantX = kopfX - elefantAbstand;
      vorneLaeuft = true; vorneGelaufen = t1 + nach; elefantGelaufen = t1 + t2 + nach;
    }
    START_FIGUREN.forEach((typ, i) => {
      const elefant = typ === 'elefant';
      figurenZug.push({ typ, x: elefant ? elefantX : kopfX - START_ABSTAENDE[i] * gr, laeuft: elefant || vorneLaeuft,
        schritt: (elefant ? elefantGelaufen * 4.2 : vorneGelaufen * 6.5) + i * 1.7 });
    });
    return { reihe: 'vorn', s: gr, richtung: 1, figuren: figurenZug, wartet, frage: FRAGE, kopfX };
  }
  tt -= dauer0;
  for (const a of weitere) {
    if (tt >= a.dauer) { tt -= a.dauer; continue; }
    let kopfX, laeuft = true, gelaufen;
    if (a.rast >= 0) {
      const hin = Math.abs(a.rast - a.von) / a.v;
      if (tt < hin) { kopfX = a.von + a.richtung * a.v * tt; gelaufen = tt; }
      else if (tt < hin + START_RAST) { kopfX = a.rast; laeuft = false; gelaufen = hin; }
      else { kopfX = a.rast + a.richtung * a.v * (tt - hin - START_RAST); gelaufen = tt - START_RAST; }
    } else { kopfX = a.von + a.richtung * a.v * tt; gelaufen = tt; }
    // Schrittfolge passend zum Tempo, damit die kleinen Tiere nicht trippeln
    const takt = 6.5 * Math.min(1.5, (a.v / a.s) / 22);
    START_FIGUREN.forEach((typ, i) => {
      figurenZug.push({ typ, x: kopfX - a.richtung * START_ABSTAENDE[i] * a.s, laeuft,
        schritt: gelaufen * (typ === 'elefant' ? takt * 0.65 : takt) + i * 1.7 });
    });
    return { reihe: a.reihe, s: a.s, richtung: a.richtung, figuren: figurenZug, wartet: -1 };
  }
  return { reihe: -1, figuren: [] };
}

// Malt die Karawane auf den Kamm ihrer Düne (gespiegelt, wenn sie nach links läuft)
function startZugMalen(g, zug, b, h) {
  const d = zug.reihe === 'vorn' ? START_VORN : START_DUENEN[zug.reihe];
  const farben = zug.reihe === 'vorn' ? START_SCHATTEN : d.zug;
  const decke = zug.reihe === 'vorn' ? '#24162c' : d.decke;
  zug.figuren.forEach((f, i) => {
    if (f.x < -60 * zug.s || f.x > b + 60 * zug.s) return;   // außerhalb des Bildes: nicht malen
    const y = duenenKamm(f.x, b, h, d.basis, d.wellen) + zug.s * 0.8;
    let schritt = f.schritt;
    if (!f.laeuft) schritt = Math.round(schritt / Math.PI) * Math.PI;   // wer steht, steht auf allen vier Beinen
    g.save(); g.translate(f.x, y - (f.laeuft ? Math.abs(Math.sin(schritt)) * 0.5 * zug.s : 0));
    g.scale(zug.s * zug.richtung, zug.s);
    zeichneTier(g, f.typ, { schritt, farben, decke, reiter: i === 0, last: -1 });
    g.restore();
  });
}

// Eine runde Sprechblase mit Fragezeichen (für die wartende Karawane auf der Startseite)
function fragezeichenBlase(g, x, y, r, neigung, sicht) {
  g.save();
  g.globalAlpha = sicht;
  g.translate(x, y);
  // Blase mit kleinem Zipfel nach unten
  g.fillStyle = '#f6e7c4'; g.strokeStyle = '#3a1d2c'; g.lineWidth = Math.max(1.2, r * 0.12);
  g.beginPath();
  g.moveTo(-r * 0.25, r * 0.8); g.lineTo(-r * 0.45, r * 1.45); g.lineTo(r * 0.2, r * 0.9);
  g.arc(0, 0, r, Math.PI * 0.3, Math.PI * 0.62, true);
  g.closePath(); g.fill(); g.stroke();
  // das Fragezeichen wackelt leicht hin und her
  g.rotate(neigung);
  g.fillStyle = '#7a2e1f';
  g.font = `700 ${Math.round(r * 1.5)}px Amiri, Georgia, serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('?', 0, r * 0.08);
  g.restore();
}

function startMalen(jetzt) {
  if (!startOffen) return;
  const c = document.getElementById('startHimmel'), g = c.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const b = c.clientWidth, h = c.clientHeight;
  if (c.width !== Math.round(b * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(b * dpr); c.height = Math.round(h * dpr); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const t = (jetzt - startBeginn) / 1000;
  const horizont = h * 0.64;

  // 1. Himmel: oben tiefes Indigo, am Horizont glühendes Orange
  const himmel = g.createLinearGradient(0, 0, 0, horizont);
  himmel.addColorStop(0, '#11163a'); himmel.addColorStop(0.45, '#4a2a5c'); himmel.addColorStop(0.78, '#c4613f'); himmel.addColorStop(1, '#f2b25c');
  g.fillStyle = himmel; g.fillRect(0, 0, b, h);

  // 2. Sterne erscheinen langsam
  const sternLicht = Math.min(1, t / 6);
  for (let i = 0; i < 90; i++) {
    const x = hash01(i, 71) * b, y = hash01(i, 72) * horizont * 0.55;
    const a = sternLicht * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 5.3))) * (1 - y / (horizont * 0.55));
    g.fillStyle = `rgba(255,248,230,${a.toFixed(2)})`;
    g.fillRect(x, y, i % 9 === 0 ? 2 : 1.2, i % 9 === 0 ? 2 : 1.2);
  }

  // 3. Die tief stehende Sonne mit weichem Glühen – sie sinkt ganz langsam
  const sx = b * 0.7, sy = horizont - h * 0.03 + Math.min(t * 0.6, h * 0.04), sr = Math.min(b, h) * 0.085;
  const glut = g.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 6);
  glut.addColorStop(0, 'rgba(255,190,110,.55)'); glut.addColorStop(1, 'rgba(255,150,80,0)');
  g.fillStyle = glut; g.fillRect(0, 0, b, h);
  const sonne = g.createLinearGradient(0, sy - sr, 0, sy + sr);
  sonne.addColorStop(0, '#ffe39a'); sonne.addColorStop(1, '#ff8c4a');
  g.fillStyle = sonne; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill();

  // Wo ist die Karawane gerade? (Sie wird gleich zusammen mit ihrer Düne gemalt.)
  const gr = Math.max(1.3, Math.min(b, h) / 290);   // Größe der Tiere: auf dem Handy etwas kleiner
  const zug = startAblauf(t, b, h, gr);

  // 4. Dünenreihen von hinten nach vorne
  START_DUENEN.forEach((r, nr) => {
    g.fillStyle = r.farbe;
    g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= b + 10; x += 8) g.lineTo(x, duenenKamm(x, b, h, r.basis, r.wellen));
    g.lineTo(b, h); g.closePath(); g.fill();
    if (nr === 0) {
      // eine Oase am Horizont: Palmen-Silhouetten und warme Lichter – jede Palme steht auf dem Kamm
      const oase = startOase(b, h), m = oase.m;
      g.fillStyle = '#5a2c3c';
      for (let i = 0; i < 5; i++) {
        const px = oase.x + (i - 2) * oase.abstand, ph = m * (0.035 + hash01(i, 73) * 0.02);
        const py = duenenKamm(px, b, h, r.basis, r.wellen) + 2;
        g.fillRect(px - 0.8, py - ph, 1.6, ph);
        for (let j = 0; j < 6; j++) {
          const w = j / 6 * Math.PI * 2;
          g.beginPath(); g.ellipse(px + Math.cos(w) * m * 0.008, py - ph + Math.sin(w) * m * 0.003, m * 0.01, m * 0.0025, w, 0, Math.PI * 2); g.fill();
        }
      }
      for (let i = 0; i < 4; i++) {
        const f = 0.6 + 0.4 * Math.sin(t * 3 + i * 2);
        const lx = oase.x - m * 0.03 + i * m * 0.018;
        g.fillStyle = `rgba(255,200,110,${(0.8 * f).toFixed(2)})`;
        g.fillRect(lx, duenenKamm(lx, b, h, r.basis, r.wellen) - 1, 1.8, 1.8);
      }
    }
    if (zug.reihe === nr) startZugMalen(g, zug, b, h);
  });

  // 5. Vorderste Düne
  g.fillStyle = '#26132a';
  g.beginPath(); g.moveTo(0, h);
  for (let x = 0; x <= b + 10; x += 6) g.lineTo(x, duenenKamm(x, b, h, START_VORN.basis, START_VORN.wellen));
  g.lineTo(b, h); g.closePath(); g.fill();

  if (zug.reihe === 'vorn') {
    startZugMalen(g, zug, b, h);
    // Während des Wartens: Fragezeichen-Blasen über dem Reiter und dem Esel („Wo bleibt der Elefant?“)
    if (zug.wartet >= 0) {
      const wartet = zug.wartet;
      const blasen = [{ nr: 0, ab: 0.25, hoehe: 40, gross: 1 }, { nr: 3, ab: 0.75, hoehe: 25, gross: 0.8 }];
      blasen.forEach(bl => {
        const seit = wartet - bl.ab;
        if (seit <= 0) return;
        // erscheint mit einem kleinen Hüpfer, verblasst, sobald der Elefant zu sehen ist
        const auf = Math.min(1, seit / 0.35);
        const hupf = 1 + 0.35 * Math.sin(auf * Math.PI) * (1 - auf * 0.4);
        const weg = Math.max(0, Math.min(1, (wartet - zug.frage - 0.4) / 0.6));
        const sicht = (1 - weg) * Math.min(1, seit / 0.15);
        if (sicht <= 0) return;
        const x = zug.kopfX - START_ABSTAENDE[bl.nr] * gr + 2 * gr;
        const y = duenenKamm(x, b, h, START_VORN.basis, START_VORN.wellen) - bl.hoehe * gr + Math.sin(wartet * 3 + bl.nr) * 1.5 * gr;
        fragezeichenBlase(g, x, y, 8 * gr * bl.gross * hupf, Math.sin(wartet * 2.4 + bl.nr) * 0.12, sicht);
      });
    }
  }

  // 6. Dunkler Rand, damit die Mitte leuchtet
  const rand = g.createRadialGradient(b / 2, h * 0.45, Math.min(b, h) * 0.3, b / 2, h * 0.45, Math.max(b, h) * 0.8);
  rand.addColorStop(0, 'rgba(10,8,25,0)'); rand.addColorStop(1, 'rgba(10,8,25,.55)');
  g.fillStyle = rand; g.fillRect(0, 0, b, h);

  requestAnimationFrame(startMalen);
}

document.getElementById('startInhalt').addEventListener('click', e => {
  const k = e.target.closest('[data-st]');
  if (k) startAktion(k.dataset.st, k.dataset.n);
});
