/* =====================================================================
   32. BENACHRICHTIGUNGEN
   Wichtige Ereignisse erscheinen als kleine Karte am Rand – egal welcher
   Reiter gerade offen ist. Antippen springt zur Karawane oder Oase.
   Ist das Spiel im Hintergrund (anderer Tab), kann der Browser zusätzlich
   eine System-Benachrichtigung zeigen – wenn du das erlaubst.
   ===================================================================== */

let meldungenAn = einstellungLesen('karawane-meldungen', 'an') !== 'aus';
let systemMeldungen = einstellungLesen('karawane-systemmeldungen', 'aus') === 'an';
let meldungNr = 0;

// art: 'gut' | 'schlecht' | 'info' · ziel: { karawane: id } oder { oase: id }
function melden(icon, text, art = 'info', ziel = null) {
  if (!meldungenAn || typeof document === 'undefined' || !document.body || !document.body.appendChild) return;
  // Im Hintergrund: System-Benachrichtigung (nur wenn erlaubt)
  if (systemMeldungen && document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try { new Notification('Dünen & Dinare', { body: text.replace(/<[^>]+>/g, ''), tag: 'dd-' + (++meldungNr), icon: 'icons/icon-192.png' }); } catch (e) {}
  }
  let stapel = document.getElementById('meldungen');
  if (!stapel) { stapel = document.createElement('div'); stapel.id = 'meldungen'; document.body.appendChild(stapel); }
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `meldung ${art}`;
  el.innerHTML = symbole(`<span class="meldung-icon">${icon}</span><span class="meldung-text">${text}</span>`);
  el.addEventListener('click', () => { meldungZiel(ziel); weg(); });
  stapel.prepend(el);
  // höchstens 4 gleichzeitig
  while (stapel.children.length > 4) stapel.lastChild.remove();
  requestAnimationFrame(() => el.classList.add('da'));
  let fort = false;
  function weg() { if (fort) return; fort = true; el.classList.remove('da'); setTimeout(() => el.remove(), 350); }
  setTimeout(weg, art === 'schlecht' ? 8000 : 5500);
}

function meldungZiel(ziel) {
  if (!ziel) return;
  if (ziel.karawane != null && karawane(ziel.karawane)) {
    const k = karawane(ziel.karawane);
    S.gewKarawane = k.id;
    ansichtZeigen(k);
    if (k.ort != null) { S.gewOase = k.ort; reiterWaehlen('oase'); } else reiterWaehlen('karawanen');
  } else if (ziel.oase != null && oase(ziel.oase)) {
    S.gewOase = ziel.oase; reiterWaehlen('oase');
    ansichtZeigen(oase(ziel.oase));
  }
  zeichnePanel();
}

// Täglich: Aufträge, deren Frist bald abläuft
function meldungenTag() {
  for (const a of S.auftraege) {
    const rest = a.bisTag - S.tag;
    if (rest === 3 || rest === 1) {
      const w = ware(a.ware), o = oase(a.oase);
      melden('📜', T(`Auftrag für ${o.name}: noch ${rest} ${rest === 1 ? 'Tag' : 'Tage'} für ${a.menge} ${w.name}!`,
                     `Contract for ${o.name}: ${rest} ${rest === 1 ? 'day' : 'days'} left for ${a.menge} ${w.nameEn.toLowerCase()}!`), 'schlecht', { oase: o.id });
    }
  }
  for (const k of S.karawanen) {
    for (const p of k.passagiere || []) {
      if (p.bisTag - S.tag === 2) melden('🧕', T(`${k.name}: Die Reisenden müssen in 2 Tagen in ${oase(p.ziel).name} sein.`,
                                                `${k.name}: the passengers must reach ${oase(p.ziel).name} within 2 days.`), 'info', { karawane: k.id });
    }
  }
}

// Erlaubnis für System-Benachrichtigungen anfragen (aus den Einstellungen)
function systemMeldungenUmschalten() {
  if (systemMeldungen) { systemMeldungen = false; einstellungSchreiben('karawane-systemmeldungen', 'aus'); zeichneMenue(); return; }
  if (typeof Notification === 'undefined') { alert(T('Dein Browser unterstützt keine Benachrichtigungen.', 'Your browser does not support notifications.')); return; }
  Notification.requestPermission().then(erlaubt => {
    systemMeldungen = erlaubt === 'granted';
    einstellungSchreiben('karawane-systemmeldungen', systemMeldungen ? 'an' : 'aus');
    if (!systemMeldungen) alert(T('Benachrichtigungen wurden im Browser nicht erlaubt.', 'Notifications were not allowed in the browser.'));
    zeichneMenue();
  });
}
function meldungenUmschalten() {
  meldungenAn = !meldungenAn;
  einstellungSchreiben('karawane-meldungen', meldungenAn ? 'an' : 'aus');
  zeichneMenue();
}
