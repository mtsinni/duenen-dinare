/* =====================================================================
   20. STEUERUNG & SPIELSCHLEIFE
   ===================================================================== */

// Feste Texte der Seite (Kopfleiste, Knöpfe) in der gewählten Sprache setzen
function statischeTexte() {
  const setze = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  document.title = T('Karawane – Handel in der Wüste', 'Caravan – Trading in the Desert');
  document.querySelector('header h1').textContent = T('Karawane', 'Caravan');
  setze('btnStatistik', T('📊 Statistik', '📊 Statistics'));
  setze('btnPause', T('⏸ Pause', '⏸ Pause'));
  setze('btnMenue', T('☰ Menü', '☰ Menu'));
  setze('logTitel', T('Ereignisse', 'Events'));
  document.querySelectorAll('[data-tempo]').forEach(b => { b.textContent = zahlText(+b.dataset.tempo) + '×'; });
  const titel = { btnTon: T('Ton an/aus', 'Sound on/off'), btnZoomRein: T('Hineinzoomen', 'Zoom in'),
                  btnZoomRaus: T('Herauszoomen', 'Zoom out'), btnZoomGanz: T('Ganze Karte zeigen', 'Show whole map') };
  for (const id in titel) { const el = document.getElementById(id); el.title = titel[id]; el.setAttribute('aria-label', titel[id]); }
}

document.getElementById('btnStatistik').addEventListener('click', () => statistikUmschalten(!statistikOffen));
document.getElementById('statistik').addEventListener('click', e => {
  // Schließen über den Knopf oder einen Klick auf den dunklen Hintergrund
  if (e.target.id === 'statistik' || e.target.closest('[data-s="zu"]')) statistikUmschalten(false);
});

document.getElementById('btnPause').addEventListener('click', () => { S.pause = !S.pause; zeichnePanel(); });
document.querySelectorAll('[data-tempo]').forEach(b => b.addEventListener('click', () => {
  S.tempo = +b.dataset.tempo; S.pause = false; zeichnePanel();
}));
document.getElementById('btnMenue').addEventListener('click', () => menueOffen ? menueSchliessen(false) : menueOeffnen());
document.getElementById('btnTon').addEventListener('click', tonUmschalten);
document.getElementById('btnZoomRein').addEventListener('click', () => zoomen(1.5));
document.getElementById('btnZoomRaus').addEventListener('click', () => zoomen(1 / 1.5));
document.getElementById('btnZoomGanz').addEventListener('click', zoomZuruecksetzen);
document.getElementById('menue').addEventListener('click', e => {
  const b = e.target.closest('[data-m]');
  if (b) menueAktion(b.dataset.m, b.dataset.n);
});
// Browser erlauben Töne erst nach der ersten Berührung – dann den Audio-Kanal wecken
document.addEventListener('pointerdown', () => { if (tonAn) audioBereit(); }, { once: true });
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !menueOffen) { e.preventDefault(); S.pause = !S.pause; zeichnePanel(); }
});

let letzteZeit = performance.now();
function schleife(jetzt) {
  const dtSek = Math.min((jetzt - letzteZeit) / 1000, 0.25); // max. 0,25 s, falls der Tab im Hintergrund war
  letzteZeit = jetzt;
  if (!S.pause && !S.bankrott) aktualisiere(dtSek * S.tempo / SEK_PRO_TAG);
  zeichne();
  requestAnimationFrame(schleife);
}

ansichtBegrenzen();
datenUebersetzen();
statischeTexte();
if (!laden()) neuesSpiel('normal', 1, true);   // vorläufiges Spiel, bis im Menü gewählt wird
zeichnePanel();
menueOeffnen();
requestAnimationFrame(schleife);
