/* =====================================================================
   31. TOOLTIPS UND TASTENKÜRZEL
   Kurze Erklärungen beim Drüberfahren mit der Maus und Tasten für
   alles, was man oft braucht. „?“ zeigt die Übersicht.
   ===================================================================== */

const TEMPO_TASTEN = { Digit1: 0.5, Digit2: 1, Digit3: 1.5, Digit4: 3, Digit5: 5, Numpad1: 0.5, Numpad2: 1, Numpad3: 1.5, Numpad4: 3, Numpad5: 5 };
const REITER_TASTEN = { KeyO: 'oase', KeyK: 'karawanen', KeyA: 'auftraege', KeyZ: 'ziele', KeyH: 'haeuser', KeyE: 'ereignisse' };

function tastenListe() {
  return [
    [T('Leertaste', 'Space'), T('Pause / weiter', 'Pause / resume')],
    ['1 – 5', T('Tempo 0,5× · 1× · 1,5× · 3× · 5×', 'Speed 0.5× · 1× · 1.5× · 3× · 5×')],
    ['O · K · A · Z · H · E', T('Reiter: Oase, Karawanen, Aufträge, Ziele, Häuser, Ereignisse', 'Tabs: oasis, caravans, contracts, goals, houses, events')],
    ['N', T('Nächste Karawane auswählen', 'Select next caravan')],
    ['G', T('Ausgewählte Karawane zum Ziel aufbrechen lassen', 'Send the selected caravan to its destination')],
    ['+ · − · 0', T('Karte vergrößern, verkleinern, ganze Karte', 'Zoom in, zoom out, whole map')],
    ['S', T('Statistik', 'Statistics')],
    ['M · Esc', T('Menü öffnen / Fenster schließen', 'Open menu / close window')],
    ['?', T('Diese Übersicht', 'This overview')],
  ];
}

function htmlHilfe() {
  return `<div class="fenster">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <h2 style="margin:0">⌨️ ${T('Tastenkürzel', 'Keyboard shortcuts')}</h2>
      <button data-s="zu">✕ ${T('Schließen', 'Close')}</button>
    </div>
    <table class="tasten">${tastenListe().map(([t, w]) => `<tr><td><kbd>${t}</kbd></td><td>${w}</td></tr>`).join('')}</table>
    <p class="hinweis">${T('Tipp: Fährst du mit der Maus über Kästchen und Knöpfe, erscheint eine kurze Erklärung.', 'Tip: hover over boxes and buttons to see a short explanation.')}</p>
  </div>`;
}
function hilfeOeffnen() {
  if (menueOffen) menueSchliessen(false);
  fensterArt = 'hilfe';
  statistikUmschalten(true);
}

function naechsteKarawane() {
  if (!S.karawanen.length) return;
  const i = S.karawanen.findIndex(k => k.id === S.gewKarawane);
  const k = S.karawanen[(i + 1) % S.karawanen.length];
  S.gewKarawane = k.id;
  if (k.ort != null) S.gewOase = k.ort;
  reiterWaehlen('karawanen');
  zeichnePanel();
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const ziel = e.target;
  if (ziel && (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA' || ziel.tagName === 'SELECT')) return;
  if (e.code === 'Escape') {
    if (statistikOffen && !(fensterArt === 'entscheidung' && S.entscheidung)) { statistikUmschalten(false); e.preventDefault(); }
    else if (menueOffen) { menueSchliessen(false); e.preventDefault(); }
    return;
  }
  if (startOffen || menueOffen) return;
  if (e.key === '?') { hilfeOeffnen(); e.preventDefault(); return; }
  if (statistikOffen) return;     // in Fenstern keine weiteren Kürzel
  if (TEMPO_TASTEN[e.code]) { S.tempo = TEMPO_TASTEN[e.code]; S.pause = false; zeichnePanel(); e.preventDefault(); return; }
  if (REITER_TASTEN[e.code]) { reiterWaehlen(REITER_TASTEN[e.code]); e.preventDefault(); return; }
  if (e.code === 'KeyN') { naechsteKarawane(); e.preventDefault(); return; }
  if (e.code === 'KeyG') { losziehen(); e.preventDefault(); return; }
  if (e.code === 'KeyS') { fensterArt = 'statistik'; statistikUmschalten(true); e.preventDefault(); return; }
  if (e.code === 'KeyM') { menueOeffnen(); e.preventDefault(); return; }
  if (e.key === '+' || e.code === 'NumpadAdd') { zoomen(1.5); e.preventDefault(); return; }
  if (e.key === '-' || e.code === 'NumpadSubtract') { zoomen(1 / 1.5); e.preventDefault(); return; }
  if (e.code === 'Digit0' || e.code === 'Numpad0') { zoomZuruecksetzen(); e.preventDefault(); }
});

// Erklärungen beim Drüberfahren für die festen Elemente der Kopfleiste
function tooltipsSetzen() {
  const tipp = (sel, text) => { const el = typeof sel === 'string' ? document.querySelector(sel) : sel; if (el) el.title = text; };
  tipp('#anzeigeTag', T('Spieltag – ein Jahr hat 120 Tage', 'Game day – a year has 120 days'));
  tipp('#anzeigeUhr', T('Uhrzeit – nachts trinken die Tiere weniger, mittags am meisten', 'Time of day – animals drink less at night and most at noon'));
  tipp('#anzeigeJahreszeit', T('Jahreszeit – im Sommer ist der Durst größer, im Winter regnet es öfter', 'Season – thirst is higher in summer, rain more frequent in winter'));
  tipp('header .k-gold', T('Dein Gold in Dinar', 'Your gold in dinars'));
  tipp('#btnPause', T('Pause / weiter (Leertaste)', 'Pause / resume (Space)'));
  tipp('#btnStatistik', T('Statistik (S)', 'Statistics (S)'));
  tipp('#btnMenue', T('Menü – Spielstände, neues Spiel, Einstellungen (M)', 'Menu – saved games, new game, settings (M)'));
  document.querySelectorAll('[data-tempo]').forEach((b, i) => { b.title = T(`Tempo ${zahlText(+b.dataset.tempo)}× (Taste ${i + 1})`, `Speed ${zahlText(+b.dataset.tempo)}× (key ${i + 1})`); });
}
