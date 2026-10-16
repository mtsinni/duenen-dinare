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
  zeichnePanel();
}

function zeichneMenue() {
  const laeuft = !!slotLesen(S.slot) && !S.bankrott;
  let h = `<div class="fenster">
    <div class="sprachwahl">
      <button data-m="sprache" data-n="de" class="${SPRACHE === 'de' ? 'an' : ''}" lang="de">Deutsch</button>
      <button data-m="sprache" data-n="en" class="${SPRACHE === 'en' ? 'an' : ''}" lang="en">English</button>
    </div>
    <h2 style="margin-top:0">🐪 ${T('Karawane – Handel in der Wüste', 'Caravan – Trading in the Desert')}</h2>`;
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
            <b>${T('Platz', 'Slot')} ${n}</b> · ${s.icon} ${s.name} · ${T('Tag', 'Day')} ${d.tag}${RAENGE[d.rang] ? ' · 🏅 ' + RAENGE[d.rang].name : ''}${z.vermoegen != null ? ' · ' + zahl(z.vermoegen) + ' D' : ''}${d.bankrott ? ' · 💀 ' + T('bankrott', 'bankrupt') : ''}
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
        ${T('Startgold', 'Starting gold')}: ${SCHWIERIGKEITEN[menueWahl.schwierigkeit].startGold} D.</div>
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
  document.getElementById('menue').innerHTML = h;
}

function menueAktion(m, n) {
  if (m === 'sprache') spracheSetzen(n);
  if (m === 'weiter') menueSchliessen(true);
  if (m === 'laden' && ladeSlot(+n)) { speichern(); menueSchliessen(true); }
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
    menueSchliessen(false);
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
  link.download = T(`karawane-platz${n}-tag${daten.tag}.json`, `caravan-slot${n}-day${daten.tag}.json`);
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
      menueSchliessen(false);
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
  { text: `Deine Karawane ist unterwegs – die Zeit läuft jetzt! Mit <b>0,5× / 1× / 1,5×</b> oben änderst du das Tempo,
      <b>Pause</b> (oder die Leertaste) hält sie an. Meide Sandstürme 🌪️ und rote Räubergebiete ⚔️.`,
    textEn: `Your caravan is on its way – time is running now! Change the speed with <b>0.5× / 1× / 1.5×</b> at the top,
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
