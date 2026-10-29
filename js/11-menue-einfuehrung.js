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
  kartenGelaendeAktualisieren();
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
const menueWahl = { schwierigkeit: 'normal', slot: 1, einfuehrung: true, sieg: 'frei', karte: 'klassisch', kartenNr: '' };

function menueOeffnen(reiter) {
  menueReiter = reiter || null; menueSlotOffen = 0; if (typeof menueCode !== 'undefined') menueCode = null;
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

// Das Menü hat vier Reiter, damit nicht alles auf einer langen Seite steht
let menueReiter = null;          // 'neu' | 'staende' | 'einst' | 'mehr' – null = passend wählen
let menueSlotOffen = 0;          // bei welchem Spielstand die Zusatzknöpfe (⋯) offen sind

function zeichneMenue() {
  const laeuft = !!slotLesen(S.slot) && !S.bankrott;
  if (!menueReiter) menueReiter = laeuft ? 'staende' : 'neu';
  const erreicht = errungenschaftenLesen();
  const anzahlErfolge = ERRUNGENSCHAFTEN.filter(e => erreicht[e.id]).length;
  const belegt = [1, 2, 3].filter(n => slotLesen(n)).length;

  let h = `<div class="fenster menue-neu">
    <div class="menue-kopf">
      <div><h2>🐪 ${T('Dünen & Dinare', 'Dunes & Dinars')}</h2>
        <p class="untertitel">${T('Karawanenhandel in der Wüste', 'Caravan trading in the desert')}</p></div>
      <div class="sprachwahl">${htmlFlaggen('data-m="sprache"')}</div>
    </div>`;
  if (laeuft) h += `<button class="gross weiter-knopf" data-m="weiter">▶ ${T('Weiterspielen', 'Continue')} <small>${T(`Platz ${S.slot} · Tag ${S.tag}`, `Slot ${S.slot} · day ${S.tag}`)}</small></button>`;

  const reiter = [
    ['neu', '🐪', T('Neues Spiel', 'New game'), ''],
    ['staende', '💾', T('Spielstände', 'Saves'), belegt ? `${belegt}/${SLOT_ANZAHL}` : ''],
    ['einst', '⚙️', T('Einstellungen', 'Settings'), ''],
    ['mehr', '🏆', T('Erfolge', 'Achievements'), `${anzahlErfolge}`],
  ];
  h += `<div class="menue-reiter">${reiter.map(([id, icon, name, zahl]) =>
    `<button data-m="reiter" data-n="${id}" class="${menueReiter === id ? 'an' : ''}"><span class="mr-icon">${icon}</span><span class="mr-name">${name}</span>${zahl ? `<span class="mr-zahl">${zahl}</span>` : ''}</button>`).join('')}</div>`;

  h += `<div class="menue-inhalt">`;
  if (menueCode) h += htmlMenueCode();
  else if (menueReiter === 'neu') h += htmlMenueNeu();
  else if (menueReiter === 'staende') h += htmlMenueStaende();
  else if (menueReiter === 'einst') h += htmlMenueEinstellungen();
  else h += htmlMenueMehr(anzahlErfolge);
  h += `</div>${htmlRechtliches('menue-rechtliches')}</div>`;
  document.getElementById('menue').innerHTML = symbole(h);
}

// Eine Auswahl-Gruppe: Überschrift, Knöpfe nebeneinander, kurzer Hinweis darunter
function menueGruppe(titel, knoepfe, hinweis = '') {
  return `<div class="wahl-gruppe"><div class="wahl-titel">${titel}</div><div class="wahl-knoepfe">${knoepfe}</div>${hinweis ? `<div class="hinweis">${hinweis}</div>` : ''}</div>`;
}

function htmlMenueNeu() {
  const sw = SCHWIERIGKEITEN[menueWahl.schwierigkeit];
  let h = menueGruppe(T('Schwierigkeit', 'Difficulty'),
    Object.entries(SCHWIERIGKEITEN).map(([id, s]) => `<button data-m="sw" data-n="${id}" class="${menueWahl.schwierigkeit === id ? 'an' : ''}">${s.icon} ${s.name}</button>`).join(''),
    `${sw.text} ${T('Startgold', 'Starting gold')}: ${sw.startGold} 🪙`);
  h += menueGruppe(T('Karte', 'Map'),
    `<button data-m="kartewahl" data-n="klassisch" class="${menueWahl.karte === 'klassisch' ? 'an' : ''}">🗺 ${T('Klassisch', 'Classic')}</button>
     <button data-m="kartewahl" data-n="zufall" class="${menueWahl.karte === 'zufall' ? 'an' : ''}">🎲 ${T('Zufällig', 'Random')}</button>`,
    menueWahl.karte === 'zufall'
      ? `<span class="kartennr"><label>${T('Kartennummer', 'Map number')}:</label>
          <input type="text" inputmode="numeric" maxlength="6" placeholder="${T('leer = zufällig', 'empty = random')}" value="${menueWahl.kartenNr}" data-kartennr="1">
          <span>${T('Gleiche Nummer = gleiche Karte.', 'Same number = same map.')}</span></span>`
      : T('Die große Wüste von Walata bis ans Rote Meer – mit Niger, Nil und 36 Oasen.', 'The great desert from Walata to the Red Sea – with the Niger, the Nile and 36 oases.'));
  h += menueGruppe(T('Spielziel', 'Game goal'),
    Object.entries(SIEGE).map(([id, z]) => `<button data-m="siegwahl" data-n="${id}" class="${menueWahl.sieg === id ? 'an' : ''}">${z.icon} ${T(z.name, z.nameEn)}</button>`).join(''),
    T(SIEGE[menueWahl.sieg].text, SIEGE[menueWahl.sieg].textEn));
  let plaetze = '';
  for (let n = 1; n <= SLOT_ANZAHL; n++) {
    plaetze += `<button data-m="slot" data-n="${n}" class="${menueWahl.slot === n ? 'an' : ''}">${T('Platz', 'Slot')} ${n}${slotLesen(n) ? `<small>${T('belegt', 'in use')}</small>` : ''}</button>`;
  }
  h += `<div class="wahl-zwei">` +
    menueGruppe(T('Speicherplatz', 'Save slot'), plaetze) +
    menueGruppe(T('Einführung', 'Tutorial'), `<button data-m="einf" class="${menueWahl.einfuehrung ? 'an' : ''}">💡 ${menueWahl.einfuehrung ? T('an', 'on') : T('aus', 'off')}</button>`) +
    `</div>`;
  if (slotLesen(menueWahl.slot)) h += `<div class="hinweis warnung-hinweis">⚠️ ${T(`Platz ${menueWahl.slot} ist belegt – der alte Spielstand wird überschrieben.`, `Slot ${menueWahl.slot} is in use – the old game will be overwritten.`)}</div>`;
  h += `<button class="gross" data-m="neu">🐪 ${T('Neues Spiel starten', 'Start new game')}</button>
        <p class="hinweis mitte">${T('Dein Spiel wird jeden Spieltag automatisch gespeichert.', 'Your game is saved automatically every game day.')}</p>`;
  return h;
}

function htmlMenueStaende() {
  let h = '';
  for (let n = 1; n <= SLOT_ANZAHL; n++) {
    const d = slotLesen(n);
    if (!d) {
      h += `<div class="slot leer"><div class="slot-zeile"><span class="slot-nr">${n}</span>
              <span class="slot-text hinweis">${T('Leer', 'Empty')}</span>
              <button data-m="codeImport" data-n="${n}" title="${T('Spielstand-Code einfügen', 'Paste a save code')}">📋 Code</button>
              <button data-m="import" data-n="${n}" title="${T('Spielstand aus einer Datei laden', 'Load a game from a file')}">📂 ${T('Datei', 'File')}</button></div></div>`;
      continue;
    }
    const z = d.zusammenfassung || {};
    const s = SCHWIERIGKEITEN[d.schwierigkeit] || SCHWIERIGKEITEN.normal;
    const offen = menueSlotOffen === n;
    h += `<div class="slot ${n === S.slot ? 'aktuell' : ''}">
        <div class="slot-zeile"><span class="slot-nr">${n}</span>
          <span class="slot-text"><span><b>${T('Tag', 'Day')} ${d.tag}</b>${z.vermoegen != null ? ` · ${zahl(z.vermoegen)} 🪙` : ''}${d.bankrott ? ' · 💀' : ''}</span>
            <small>${s.icon} ${s.name}${d.karte && d.karte.art === 'zufall' ? ' · 🎲 ' + d.karte.nr : ''}${RAENGE[d.rang] ? ' · ' + RAENGE[d.rang].name : ''}${n === S.slot ? ' · ' + T('läuft gerade', 'current') : ''}</small></span>
          ${n === S.slot && !S.bankrott ? '' : `<button data-m="laden" data-n="${n}" class="an">${T('Laden', 'Load')}</button>`}
          <button data-m="slotmehr" data-n="${n}" class="slot-mehr ${offen ? 'offen' : ''}" title="${T('Weitere Möglichkeiten', 'More options')}">⋯</button></div>
        ${offen ? `<div class="slot-extra">
          <button data-m="codeExport" data-n="${n}">🔗 ${T('Als Code', 'As code')}</button>
          <button data-m="codeImport" data-n="${n}">📋 ${T('Code einfügen', 'Paste code')}</button>
          <button data-m="export" data-n="${n}">💾 ${T('Als Datei sichern', 'Save as file')}</button>
          <button data-m="import" data-n="${n}">📂 ${T('Aus Datei laden', 'Load from file')}</button>
          <button data-m="loeschen" data-n="${n}" class="gefahr">🗑 ${T('Löschen', 'Delete')}</button></div>` : ''}
      </div>`;
  }
  h += `<details class="alle-staende"><summary>💾 ${T('Sicherung für alle Spielstände', 'Backup of all saved games')}</summary>
          <div class="hinweis">${T('Praktisch für einen Gerätewechsel oder wenn das Spiel umzieht.', 'Handy for switching devices or when the game moves to a new address.')}</div>
          <button data-m="exportAlle" ${[1, 2, 3].some(n => slotLesen(n)) ? '' : 'disabled'}>💾 ${T('Alle sichern', 'Back up all')}</button>
          <button data-m="importAlle">📂 ${T('Alle wiederherstellen', 'Restore all')}</button>
        </details>`;
  return h;
}

function htmlMenueEinstellungen() {
  const schalter = (m, an) => `<button data-m="${m}" class="${an ? 'an' : ''}">${an ? T('an', 'on') : T('aus', 'off')}</button>`;
  return `<div class="wahl-titel">${T('Ton', 'Sound')}</div>
      <div class="einstellung"><label>🎵 ${T('Musik', 'Music')}</label>
        <input type="range" min="0" max="100" value="${Math.round(musikLautstaerke * 100)}" data-laut="musik">${schalter('musik', musikAn)}</div>
      <div class="einstellung"><label>🔊 ${T('Geräusche', 'Sounds')}</label>
        <input type="range" min="0" max="100" value="${Math.round(tonLautstaerke * 100)}" data-laut="ton">${schalter('ton', tonAn)}</div>
      ${htmlUmgebung()}
      <div class="wahl-titel">${T('Meldungen', 'Alerts')}</div>
      <div class="einstellung"><label>🔔 ${T('Im Spiel', 'In game')}</label><span class="hinweis" style="flex:1">${T('kleine Karten am Rand', 'small cards at the edge')}</span>${schalter('meldungen', meldungenAn)}</div>
      <div class="einstellung"><label>📣 ${T('Im Hintergrund', 'In background')}</label><span class="hinweis" style="flex:1">${T('wenn der Tab nicht sichtbar ist', 'when the tab is hidden')}</span>${schalter('systemmeldungen', systemMeldungen)}</div>
      ${htmlLesbarkeit()}
      <div class="wahl-titel">${T('App', 'App')}</div>
      ${htmlApp()}`;
}

function htmlMenueMehr(anzahl) {
  const gesamt = ERRUNGENSCHAFTEN.length;
  return `<button class="menue-karte" data-m="erfolge">
        <span class="mk-icon">🏆</span><span class="mk-text"><b>${T('Errungenschaften', 'Achievements')}</b>
          <span class="bar"><span style="width:${Math.round(anzahl / gesamt * 100)}%"></span></span>
          <small>${T(`${anzahl} von ${gesamt} erreicht`, `${anzahl} of ${gesamt} unlocked`)}</small></span><span class="mk-pfeil">›</span></button>
      <button class="menue-karte" data-m="hilfe">
        <span class="mk-icon">⌨️</span><span class="mk-text"><b>${T('Tastenkürzel', 'Keyboard shortcuts')}</b>
          <small>${T('Schneller spielen am Computer', 'Play faster on a computer')}</small></span><span class="mk-pfeil">›</span></button>`;
}


function menueAktion(m, n) {
  if (m === 'reiter') { menueReiter = n; menueSlotOffen = 0; menueCode = null; zeichneMenue(); return; }
  if (m === 'codeExport') { codeExportStarten(+n); return; }
  if (m === 'codeImport') { codeImportStarten(+n); return; }
  if (m === 'codeKopieren') { codeKopieren(); return; }
  if (m === 'codeTeilen') { codeTeilen(); return; }
  if (m === 'codeLaden') { codeLaden(); return; }
  if (m === 'codeZurueck') { menueCode = null; zeichneMenue(); return; }
  if (m === 'schrift') { schriftSetzen(n); return; }
  if (m === 'farbenblind') { farbenblindUmschalten(); return; }
  if (m === 'minikarte') { miniUmschalten(); return; }
  if (m === 'umgebung') { umgebungUmschalten(); return; }
  if (m === 'slotmehr') { menueSlotOffen = menueSlotOffen === +n ? 0 : +n; zeichneMenue(); return; }
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
  if (m === 'exportAlle') alleSpielstaendeExportieren();
  if (m === 'musik') { musikUmschalten(); zeichneMenue(); }
  if (m === 'ton') { tonUmschalten(); zeichneMenue(); }
  if (m === 'importAlle') alleSpielstaendeImportieren();
  if (m === 'sw') { menueWahl.schwierigkeit = n; zeichneMenue(); }
  if (m === 'siegwahl') { menueWahl.sieg = n; zeichneMenue(); }
  if (m === 'kartewahl') { menueWahl.karte = n; zeichneMenue(); }
  if (m === 'erfolge') errungenschaftenOeffnen();
  if (m === 'hilfe') hilfeOeffnen();
  if (m === 'meldungen') meldungenUmschalten();
  if (m === 'systemmeldungen') systemMeldungenUmschalten();
  if (m === 'installieren') appInstallieren();
  if (m === 'slot') { menueWahl.slot = +n; zeichneMenue(); }
  if (m === 'einf') { menueWahl.einfuehrung = !menueWahl.einfuehrung; zeichneMenue(); }
  if (m === 'neu') {
    if (slotLesen(menueWahl.slot) && !confirm(T(`Platz ${menueWahl.slot} ist belegt. Überschreiben?`, `Slot ${menueWahl.slot} is in use. Overwrite it?`))) return;
    neuesSpiel(menueWahl.schwierigkeit, menueWahl.slot, menueWahl.einfuehrung, menueWahl.sieg,
               { art: menueWahl.karte, nr: parseInt(menueWahl.kartenNr, 10) || null });
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
      if (istSammlung(daten)) daten = Object.values(daten.slots)[0] || null;   // Sammeldatei: den ersten nehmen
      // Kurz prüfen, ob das wirklich ein Karawane-Spielstand ist
      if (!istSpielstand(daten)) {
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


// --- Alle Spielstände in EINER Datei (z. B. für den Umzug auf eine neue Internetadresse) ---
// Aufbau: { art: 'duenen-dinare-spielstaende', version: 1, slots: { "1": {...}, "3": {...} } }

function istSpielstand(d) {
  return !!d && Array.isArray(d.oasen) && Array.isArray(d.karawanen) && typeof d.tag === 'number';
}
function istSammlung(d) {
  return !!d && d.art === 'duenen-dinare-spielstaende' && d.slots && typeof d.slots === 'object';
}

function dateiHerunterladen(name, inhalt) {
  const datei = new Blob([inhalt], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(datei);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

function alleSpielstaendeExportieren() {
  if (slotLesen(S.slot)) speichern();
  const slots = {};
  for (let n = 1; n <= SLOT_ANZAHL; n++) { const d = slotLesen(n); if (d) slots[n] = d; }
  if (!Object.keys(slots).length) return;
  const heute = new Date().toISOString().slice(0, 10);
  dateiHerunterladen(T(`duenen-dinare-spielstaende-${heute}.json`, `dunes-dinars-saves-${heute}.json`),
                     JSON.stringify({ art: 'duenen-dinare-spielstaende', version: 1, slots }));
}

function alleSpielstaendeImportieren() {
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
      // Eine einzelne Spielstand-Datei geht auch: sie kommt auf ihren alten Platz (oder Platz 1)
      if (istSpielstand(daten)) daten = { slots: { [daten.slot || 1]: daten } };
      if (!daten || !daten.slots) { alert(T('Diese Datei enthält keine Spielstände.', 'This file contains no saved games.')); return; }
      const plaetze = Object.keys(daten.slots).map(Number).filter(n => n >= 1 && n <= SLOT_ANZAHL && istSpielstand(daten.slots[n]));
      if (!plaetze.length) { alert(T('Diese Datei enthält keine Spielstände.', 'This file contains no saved games.')); return; }
      const belegt = plaetze.filter(n => slotLesen(n));
      if (belegt.length && !confirm(T(`Die Datei enthält ${plaetze.length} Spielstand/-stände. Platz ${belegt.join(', ')} ist schon belegt und wird überschrieben. Fortfahren?`,
                                       `The file contains ${plaetze.length} saved game(s). Slot ${belegt.join(', ')} is already in use and will be overwritten. Continue?`))) return;
      for (const n of plaetze) {
        const d = daten.slots[n]; d.slot = n;
        try { localStorage.setItem(slotSchluessel(n), JSON.stringify(d)); } catch (e) {}
      }
      alert(T(`${plaetze.length} Spielstand/-stände wiederhergestellt (Platz ${plaetze.join(', ')}).`,
              `${plaetze.length} saved game(s) restored (slot ${plaetze.join(', ')}).`));
      zeichneMenue();
    };
    leser.readAsText(datei);
  });
  eingabe.click();
}

// Links zu Impressum und Datenschutz (öffnen sich in einem neuen Tab – das Spiel läuft weiter)
function htmlRechtliches(klasse) {
  return `<div class="${klasse}">
      <a href="impressum.html" target="_blank" rel="noopener">${T('Impressum', 'Legal notice')}</a> ·
      <a href="datenschutz.html" target="_blank" rel="noopener">${T('Datenschutz', 'Privacy')}</a>
    </div>`;
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
      Mit zwei Fingern, dem Mausrad oder den Knöpfen <b>+ / −</b> kannst du die Karte vergrößern, durch Ziehen verschieben – und mit <b>⤢</b> die ganze Wüste sehen.`,
    textEn: `Now you need a destination. Tap another oasis on the map, for example <b>Tamanrasset</b> –
      no salt is made there, so they pay more. You only know distant prices once you have been there or sent a messenger.
      Zoom the map with two fingers, the mouse wheel or the <b>+ / −</b> buttons, drag it to move around – and tap <b>⤢</b> to see the whole desert.`,
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

// Ein gutes erstes Ziel für die Einführung: die nächste Oase, die kein Salz herstellt
function tippZielName() {
  const start = oase(S.startOase);
  if (!start) return 'Tamanrasset';
  const ziel = S.oasen.filter(o => o.aktiv && o !== start && !o.hafen && !o.produziert.includes('salz'))
    .sort((a, b) => entfernung(a, start) - entfernung(b, start))[0];
  return ziel ? ziel.name : 'Tamanrasset';
}

function htmlTipp() {
  const t = S.tutorial;
  if (!t || t.schritt < 0 || t.schritt >= EINFUEHRUNG.length) return '';
  if (letzterTippSchritt !== t.schritt) { letzterTippSchritt = t.schritt; aktiverReiter = EINFUEHRUNG_REITER[t.schritt] || aktiverReiter;
    if (aktiverReiter === 'oase') aktiverOasenReiter = 'markt'; }
  const schritt = EINFUEHRUNG[t.schritt];
  return `<div class="tipp">
    <div class="tipp-kopf">💡 ${T('Einführung', 'Tutorial')} · ${T('Schritt', 'Step')} ${t.schritt + 1} ${T('von', 'of')} ${EINFUEHRUNG.length}</div>
    <div>${schritt.text.replace(/Agadez/g, (oase(S.startOase) || { name: 'Agadez' }).name).replace(/Tamanrasset/g, tippZielName())}</div>
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
    <div class="start-sprache">${htmlFlaggen('data-st="sprache"')}</div>
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
    </div>
    ${htmlRechtliches('start-rechtliches')}`);
}

function startAktion(art, n) {
  if (art === 'sprache') { spracheSetzen(n); zeichneStartInhalt(); return; }
  startseiteSchliessen();
  if (art === 'weiter') { geradeGeladen = false; S.pause = true; zeichnePanel(); }   // angehalten – Leertaste/▶ startet
  if (art === 'menue') menueOeffnen(startSpielGeladen ? null : 'neu');
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
const START_RAST = 8;     // so viele Sekunden rastet die Karawane an der Oase (Zelt aufbauen, Feuer machen)

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
    const ergebnis = { reihe: a.reihe, s: a.s, richtung: a.richtung, figuren: figurenZug, wartet: -1 };
    // Das Lager an der Oase: seit = Sekunden seit der Ankunft, uebrig = Sekunden bis dieser Abschnitt endet
    if (a.rast >= 0) ergebnis.lager = { x: a.rast, s: a.s, seit: tt - Math.abs(a.rast - a.von) / a.v, uebrig: a.dauer - tt };
    return ergebnis;
  }
  return { reihe: -1, figuren: [] };
}

// Das kleine Lager bei den Palmen: erst wird das Zelt aufgestellt, dann das Feuer angezündet, und Rauch steigt auf.
// Beim Aufbruch wird das Zelt abgebaut; das Feuer glimmt noch etwas nach und raucht, bis es ausgeht.
const LAGER = { zeltAuf: [0.3, 1.9], feuer: 2.2, zeltAb: 1.1, glimmen: 4 };
function startLagerMalen(g, lager, b, h, t) {
  const d = START_DUENEN[0], s = lager.s, seit = lager.seit;
  if (seit < 0) return;
  const zeltX = lager.x - 46 * s, feuerX = lager.x - 25 * s;
  const boden = x => duenenKamm(x, b, h, d.basis, d.wellen) + s;
  const weg = Math.max(0, seit - START_RAST);                     // Sekunden seit dem Aufbruch
  const klamm = v => Math.max(0, Math.min(1, v));
  const ausblenden = klamm(lager.uebrig / 1.5);                   // vor dem Ende des Abschnitts ist alles verschwunden

  // 1. Das Zelt: wächst aus dem Boden, wird beim Aufbruch wieder eingeholt
  let zelt = klamm((seit - LAGER.zeltAuf[0]) / (LAGER.zeltAuf[1] - LAGER.zeltAuf[0]));
  zelt = 1 - Math.pow(1 - zelt, 3);                               // erst schnell, dann sanft
  if (weg > 0) zelt *= 1 - klamm(weg / LAGER.zeltAb);
  if (zelt > 0) {
    g.save(); g.translate(zeltX, boden(zeltX)); g.scale(s * 1.35, s * 1.35 * zelt);   // etwa so hoch wie ein Kamel
    g.fillStyle = '#6e3440';                                       // Zeltbahn
    g.beginPath(); g.moveTo(-11, 0); g.lineTo(-8, -7.5); g.quadraticCurveTo(-3, -6, 0, -9.5);
    g.quadraticCurveTo(3, -6, 8, -7.5); g.lineTo(11, 0); g.closePath(); g.fill();
    g.fillStyle = '#3b1a2a';                                       // dunkler Eingang
    g.beginPath(); g.moveTo(-2.6, 0); g.lineTo(0, -6); g.lineTo(2.6, 0); g.closePath(); g.fill();
    g.strokeStyle = '#4a2232'; g.lineWidth = 0.7;                  // Spannseile
    g.beginPath(); g.moveTo(-8, -7.5); g.lineTo(-13.5, 0); g.moveTo(8, -7.5); g.lineTo(13.5, 0); g.stroke();
    g.restore();
  }

  // 2. Das Feuer: Holzscheite, Flammen, warmes Leuchten
  const anSeit = seit - LAGER.feuer;
  if (anSeit < 0) return;
  let flamme = klamm(anSeit / 0.8);                               // Feuer kommt in Gang
  if (weg > 0) flamme *= 1 - klamm(weg / LAGER.glimmen);           // glimmt nach dem Aufbruch aus
  flamme *= ausblenden;
  const fy = boden(feuerX);
  // Holzscheite
  g.save(); g.translate(feuerX, fy); g.scale(s * 1.3, s * 1.3);
  g.strokeStyle = '#3a1a22'; g.lineWidth = 1.3; g.lineCap = 'round';
  g.globalAlpha = ausblenden;
  g.beginPath(); g.moveTo(-3, 0); g.lineTo(3, -1.2); g.moveTo(3, 0); g.lineTo(-3, -1.2); g.stroke();
  g.restore();
  if (flamme > 0.01) {
    // Lichtschein auf dem Sand
    const r = (20 + Math.sin(t * 9) * 1.5) * s;
    const schein = g.createRadialGradient(feuerX, fy - 2 * s, 0, feuerX, fy - 2 * s, r);
    schein.addColorStop(0, `rgba(255,190,90,${(0.55 * flamme).toFixed(2)})`); schein.addColorStop(1, 'rgba(255,160,70,0)');
    g.fillStyle = schein; g.fillRect(feuerX - r, fy - 2 * s - r, r * 2, r * 2);
    // drei flackernde Flammenzungen
    g.save(); g.translate(feuerX, fy - 1 * s); g.scale(s * 1.4, s * 1.4);
    [['#e8641f', 2.6, 6, 0], ['#ffa531', 1.8, 4.6, 1.7], ['#ffe08a', 1, 2.8, 3.1]].forEach(([farbe, breit, hoch, v]) => {
      const hh = hoch * flamme * (0.85 + 0.15 * Math.sin(t * 13 + v) + 0.08 * Math.sin(t * 23 + v * 2));
      const kipp = Math.sin(t * 7 + v) * 0.6;
      g.fillStyle = farbe;
      g.beginPath(); g.moveTo(-breit, 0);
      g.quadraticCurveTo(-breit * 0.9, -hh * 0.55, kipp, -hh);
      g.quadraticCurveTo(breit * 0.9, -hh * 0.55, breit, 0); g.closePath(); g.fill();
    });
    g.restore();
  }

  // 3. Rauchwolken: alle 0,3 s steigt ein Wölkchen auf, treibt leicht nach links (weg von den Tieren), wird größer und blasser
  const ABSTAND = 0.28, LEBEN = 5;
  const jetzt = anSeit;
  for (let k = Math.max(0, Math.floor((jetzt - LEBEN) / ABSTAND)); k * ABSTAND <= jetzt; k++) {
    const geboren = k * ABSTAND, alter = jetzt - geboren;
    if (alter < 0 || alter > LEBEN) continue;
    // Wie stark brannte das Feuer, als das Wölkchen entstand?
    const wegDamals = Math.max(0, geboren + LAGER.feuer - START_RAST);
    const staerke = klamm(geboren / 0.8) * (1 - klamm(wegDamals / LAGER.glimmen));
    if (staerke <= 0) continue;
    const p = alter / LEBEN;
    const x = feuerX - (alter * 2.5 + alter * alter * 1.1 - Math.sin(geboren * 7 + alter * 1.8) * 1.8) * s;
    const y = fy - (7 + alter * 11 - alter * alter * 0.5) * s;
    const r = (2.2 + alter * 3) * s;
    const a = staerke * ausblenden * Math.min(1, alter / 0.3) * Math.pow(1 - p, 1.3) * 0.6;
    g.fillStyle = `rgba(226,206,210,${a.toFixed(3)})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
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

// Die Milchstraße wird nur einmal (pro Bildschirmgröße) in ein eigenes Bild gemalt – das spart Rechenzeit.
let milchCache = null;
function startMilchstrasse(b, horizont, dpr) {
  const schluessel = `${b}x${horizont}x${dpr}`;
  if (milchCache && milchCache.schluessel === schluessel) return milchCache.bild;
  const bild = document.createElement('canvas');
  bild.width = Math.round(b * dpr); bild.height = Math.round(horizont * dpr);
  const m = bild.getContext('2d');
  m.scale(dpr, dpr);
  // Das Band läuft schräg von links unten nach rechts oben und wird zum Horizont hin blasser
  const x0 = -0.05 * b, y0 = horizont * 0.62, x1 = 1.05 * b, y1 = -horizont * 0.05;
  const lang = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / lang, uy = (y1 - y0) / lang;
  const breite = Math.max(40, Math.min(b, horizont) * 0.16);
  const sicht = y => Math.max(0, 1 - y / (horizont * 0.7));   // unten überstrahlt das Abendrot
  // a) weiches Leuchten aus vielen großen, ganz blassen Flecken
  for (let i = 0; i < 70; i++) {
    const d = hash01(i, 81) * lang, quer = (hash01(i, 82) - 0.5) * breite * 0.9;
    const x = x0 + ux * d - uy * quer, y = y0 + uy * d + ux * quer;
    const r = breite * (0.35 + hash01(i, 83) * 0.5), a = 0.09 * sicht(y);
    if (a <= 0.005) continue;
    const f = m.createRadialGradient(x, y, 0, x, y, r);
    const farbe = i % 3 ? '220,205,255' : '255,225,235';
    f.addColorStop(0, `rgba(${farbe},${a.toFixed(3)})`); f.addColorStop(1, `rgba(${farbe},0)`);
    m.fillStyle = f; m.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // b) ein dunkler Staubstreifen in der Mitte des Bandes
  m.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 30; i++) {
    const d = (0.1 + hash01(i, 84) * 0.8) * lang, quer = (hash01(i, 85) - 0.45) * breite * 0.25;
    const x = x0 + ux * d - uy * quer, y = y0 + uy * d + ux * quer, r = breite * (0.15 + hash01(i, 86) * 0.15);
    const f = m.createRadialGradient(x, y, 0, x, y, r);
    f.addColorStop(0, 'rgba(0,0,0,.35)'); f.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = f; m.fillRect(x - r, y - r, r * 2, r * 2);
  }
  m.globalCompositeOperation = 'source-over';
  // c) viele winzige Sterne, dicht in der Mitte des Bandes
  for (let i = 0; i < 700; i++) {
    const d = hash01(i, 87) * lang;
    const quer = (hash01(i, 88) + hash01(i, 89) + hash01(i, 90) - 1.5) * breite * 0.8;   // Glockenkurve
    const x = x0 + ux * d - uy * quer, y = y0 + uy * d + ux * quer;
    const a = (0.25 + hash01(i, 91) * 0.55) * sicht(y);
    if (a <= 0.02 || x < 0 || x > b || y < 0) continue;
    m.fillStyle = `rgba(255,248,240,${a.toFixed(2)})`;
    const gr = hash01(i, 92) < 0.08 ? 1.4 : 0.8;
    m.fillRect(x, y, gr, gr);
  }
  milchCache = { schluessel, bild };
  return bild;
}

// Sternschnuppen, solange die Karawane an der Oase rastet – seit = Sekunden seit der Ankunft.
// Die erste zieht groß von links nach rechts über den Himmel, danach folgen kleinere an wechselnden Stellen.
const SCHNUPPE = { ab: 1.1, dauer: 1.5, abstand: [0.9, 1.6] };
function startSternschnuppe(g, seit, b, horizont, samen) {
  if (seit >= START_RAST) return;
  // Fahrplan der Schnuppen dieser Rast (bei jeder Rast etwas anders, aber ohne Zufall pro Bild)
  let start = SCHNUPPE.ab, nr = 0;
  while (start < START_RAST - 0.6) {
    const z = k => hash01(samen * 13 + nr, 120 + k);
    const gross = nr === 0;
    const dauer = gross ? SCHNUPPE.dauer : 0.8 + z(0) * 0.6;
    if (seit >= start && seit < start + dauer) {
      const x0 = gross ? 0.06 : 0.05 + z(1) * 0.55, y0 = gross ? 0.12 : 0.04 + z(2) * 0.3;
      const weit = gross ? 0.84 : 0.25 + z(3) * 0.3;               // wie weit (Anteil der Bildbreite)
      const fall = gross ? 0.38 : 0.2 + z(4) * 0.5;                // wie steil sie absinkt
      schnuppeMalen(g, (seit - start) / dauer, b * x0, horizont * y0, b * weit, b * weit * fall * (horizont / b),
                    Math.min(b * (gross ? 0.28 : 0.16), gross ? 240 : 140), gross ? 1.8 : 1.3);
    }
    start += SCHNUPPE.abstand[0] + hash01(samen * 13 + nr, 130) * (SCHNUPPE.abstand[1] - SCHNUPPE.abstand[0]);
    nr++;
  }
}

// Außerhalb der Rast: etwa alle 7 Sekunden zieht eine einzelne Sternschnuppe vorbei
const EINZEL_SCHNUPPE = { abstand: 7, dauer: [0.9, 1.4] };
function einzelneSternschnuppe(g, t, b, horizont) {
  const nr = Math.floor(t / EINZEL_SCHNUPPE.abstand);
  const z = k => hash01(nr, 150 + k);
  const start = nr * EINZEL_SCHNUPPE.abstand + z(0) * (EINZEL_SCHNUPPE.abstand - 2);   // zufälliger Moment im Abschnitt
  const dauer = EINZEL_SCHNUPPE.dauer[0] + z(1) * (EINZEL_SCHNUPPE.dauer[1] - EINZEL_SCHNUPPE.dauer[0]);
  const p = (t - start) / dauer;
  if (p <= 0 || p >= 1) return;
  const weit = 0.22 + z(2) * 0.3, fall = 0.25 + z(3) * 0.5;
  schnuppeMalen(g, p, b * (0.05 + z(4) * 0.6), horizont * (0.04 + z(5) * 0.28), b * weit, b * weit * fall * (horizont / b),
                Math.min(b * 0.15, 130), 1.2);
}

function schnuppeMalen(g, p, x0, y0, vx, vy, laenge, dicke) {
  const lauf = 1 - Math.pow(1 - p, 1.6);                            // anfangs flott, am Ende langsamer
  const x = x0 + vx * lauf, y = y0 + vy * lauf;
  const vl = Math.hypot(vx, vy) || 1;
  const schweif = laenge * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, p * 1.3)));
  const hell = Math.sin(Math.PI * p);                              // blendet ein und wieder aus
  const ex = x - vx / vl * schweif, ey = y - vy / vl * schweif;
  const verlauf = g.createLinearGradient(ex, ey, x, y);
  verlauf.addColorStop(0, 'rgba(255,240,220,0)');
  verlauf.addColorStop(1, `rgba(255,248,235,${(0.9 * hell).toFixed(2)})`);
  g.strokeStyle = verlauf; g.lineWidth = dicke; g.lineCap = 'round';
  g.beginPath(); g.moveTo(ex, ey); g.lineTo(x, y); g.stroke();
  // heller Kopf mit kleinem Glühen
  const r = dicke * 4;
  const glow = g.createRadialGradient(x, y, 0, x, y, r);
  glow.addColorStop(0, `rgba(255,252,240,${hell.toFixed(2)})`); glow.addColorStop(1, 'rgba(255,240,220,0)');
  g.fillStyle = glow; g.fillRect(x - r, y - r, r * 2, r * 2);
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

  // 2. Sterne erscheinen langsam – dazu die Milchstraße als zartes, schräges Lichtband
  const sternLicht = Math.min(1, t / 6);
  if (sternLicht > 0) {
    g.globalAlpha = sternLicht;
    g.drawImage(startMilchstrasse(b, horizont, dpr), 0, 0, b, horizont);
    g.globalAlpha = 1;
  }
  for (let i = 0; i < 90; i++) {
    const x = hash01(i, 71) * b, y = hash01(i, 72) * horizont * 0.55;
    const a = sternLicht * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 5.3))) * (1 - y / (horizont * 0.55));
    g.fillStyle = `rgba(255,248,230,${a.toFixed(2)})`;
    g.fillRect(x, y, i % 9 === 0 ? 2 : 1.2, i % 9 === 0 ? 2 : 1.2);
  }

  // Wo ist die Karawane gerade? (Sie wird weiter unten zusammen mit ihrer Düne gemalt.)
  const gr = Math.max(1.3, Math.min(b, h) / 290);   // Größe der Tiere: auf dem Handy etwas kleiner
  const zug = startAblauf(t, b, h, gr);

  // Sternschnuppe: während an der Oase das Lager aufgebaut wird, zieht sie von links nach rechts
  const rastet = zug.lager && zug.lager.seit >= 0 && zug.lager.seit < START_RAST;
  if (rastet) startSternschnuppe(g, zug.lager.seit, b, horizont, Math.floor(t - zug.lager.seit));
  else if (sternLicht > 0.6) einzelneSternschnuppe(g, t, b, horizont);   // sonst ab und zu eine einzelne

  // 3. Die tief stehende Sonne mit weichem Glühen – sie sinkt ganz langsam
  const sx = b * 0.7, sy = horizont - h * 0.03 + Math.min(t * 0.6, h * 0.04), sr = Math.min(b, h) * 0.085;
  const glut = g.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 6);
  glut.addColorStop(0, 'rgba(255,190,110,.55)'); glut.addColorStop(1, 'rgba(255,150,80,0)');
  g.fillStyle = glut; g.fillRect(0, 0, b, h);
  const sonne = g.createLinearGradient(0, sy - sr, 0, sy + sr);
  sonne.addColorStop(0, '#ffe39a'); sonne.addColorStop(1, '#ff8c4a');
  g.fillStyle = sonne; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill();


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
    if (zug.reihe === nr) {
      if (zug.lager) startLagerMalen(g, zug.lager, b, h, t);
      startZugMalen(g, zug, b, h);
    }
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
