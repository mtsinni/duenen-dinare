/* =====================================================================
   38. KOMFORT
   A) Mini-Karte: die ganze Wüste klein in der Ecke – antippen springt hin
   B) Spielstand als Code: kopieren oder teilen, auf dem anderen Gerät einfügen
   C) Lesbarkeit: Schriftgröße und Farben für Farbenblinde
   ===================================================================== */

/* ---------------- A) Mini-Karte ---------------- */
let miniAn = einstellungLesen('karawane-minikarte', 'an') !== 'aus';
let miniZaehler = 0, miniZieht = false;
const miniCanvas = typeof document !== 'undefined' ? document.getElementById('miniKarte') : null;

function miniNoetig() { return KARTE_B > SICHT_B || ansicht.zoom > 1.05; }

function zeichneMiniKarte() {
  if (!miniCanvas || !miniCanvas.getContext) return;
  const zeigen = miniAn && miniNoetig() && S && !S.bankrott;
  miniCanvas.classList.toggle('aus', !zeigen);
  const knopf = document.getElementById('btnMini');
  if (knopf) knopf.classList.toggle('an', miniAn);
  if (!zeigen || (miniZaehler++ % 6 && !miniZieht)) return;
  const b = miniCanvas.clientWidth || 200, h = Math.round(b * KARTE_H / KARTE_B);
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  if (miniCanvas.width !== Math.round(b * dpr)) { miniCanvas.width = Math.round(b * dpr); miniCanvas.height = Math.round(h * dpr); }
  const g = miniCanvas.getContext('2d');
  const s = miniCanvas.width / KARTE_B;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(hintergrund, 0, 0, miniCanvas.width, miniCanvas.height);
  g.setTransform(s, 0, 0, s, 0, 0);
  if (typeof nebelBild !== 'undefined' && nebelBild) g.drawImage(nebelBild, 0, 0, KARTE_B, KARTE_H);
  // Räuberlager
  g.fillStyle = 'rgba(184,69,47,.45)';
  for (const r of aktiveRaeuber()) { if (erkundet(r)) { g.beginPath(); g.arc(r.x, r.y, r.r, 0, Math.PI * 2); g.fill(); } }
  const px = dpr / s;   // ein Bildschirmpunkt der Mini-Karte in Kartenpunkten
  // Oasen
  for (const o of S.oasen) {
    g.fillStyle = o.aktiv ? (o.hafen ? '#3aa3d6' : '#3f8f4a') : 'rgba(120,95,60,.7)';
    g.beginPath(); g.arc(o.x, o.y, (o.aktiv ? 2.6 : 1.8) * px, 0, Math.PI * 2); g.fill();
  }
  // Konkurrenz (klein) und eigene Karawanen (groß, golden)
  for (const r of S.rivalen) { g.fillStyle = r.farbe; for (const k of r.karawanen) { g.beginPath(); g.arc(k.x, k.y, 1.5 * px, 0, Math.PI * 2); g.fill(); } }
  g.fillStyle = '#ffd56a'; g.strokeStyle = '#2b1a0c'; g.lineWidth = px;
  for (const k of S.karawanen) { g.beginPath(); g.arc(k.x, k.y, 3.2 * px, 0, Math.PI * 2); g.fill(); g.stroke(); }
  // Der sichtbare Ausschnitt
  g.strokeStyle = '#fff3c8'; g.lineWidth = 1.6 * px;
  g.strokeRect(ansicht.x, ansicht.y, KARTE_B / ansicht.zoom, KARTE_H / ansicht.zoom);
}

function miniAufKarte(e) {
  const r = miniCanvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * KARTE_B, y: (e.clientY - r.top) / r.height * KARTE_H };
}
if (miniCanvas && miniCanvas.addEventListener) {
  miniCanvas.addEventListener('pointerdown', e => { miniZieht = true; miniCanvas.setPointerCapture && miniCanvas.setPointerCapture(e.pointerId); ansichtAuf(miniAufKarte(e)); e.preventDefault(); e.stopPropagation(); });
  miniCanvas.addEventListener('pointermove', e => { if (miniZieht) ansichtAuf(miniAufKarte(e)); });
  for (const art of ['pointerup', 'pointercancel']) miniCanvas.addEventListener(art, () => { miniZieht = false; });
  miniCanvas.addEventListener('click', e => e.stopPropagation());
}
function miniUmschalten() {
  miniAn = !miniAn;
  einstellungSchreiben('karawane-minikarte', miniAn ? 'an' : 'aus');
  miniZaehler = 0; zeichneMiniKarte();
  if (typeof menueOffen !== 'undefined' && menueOffen) zeichneMenue();
}

/* ---------------- B) Spielstand als Code ---------------- */
// Format: "DD1." + base64url(deflate(JSON)) – ohne Komprimierung (alte Browser): "DD0." + base64url(JSON)
function base64UrlAusBytes(bytes) {
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function bytesAusBase64Url(t) {
  const s = atob(t.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((t.length + 3) % 4));
  const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}
async function strom(daten, umwandler) {
  const antwort = new Response(new Blob([daten]).stream().pipeThrough(umwandler));
  return new Uint8Array(await antwort.arrayBuffer());
}
async function spielstandZuCode(daten) {
  const kopie = { ...daten, log: (daten.log || []).slice(0, 12), bluete: [], regen: [] };   // Kurzlebiges weglassen – der Code wird kürzer
  const text = new TextEncoder().encode(JSON.stringify(kopie));
  if (typeof CompressionStream !== 'undefined') return 'DD1.' + base64UrlAusBytes(await strom(text, new CompressionStream('deflate-raw')));
  return 'DD0.' + base64UrlAusBytes(text);
}
async function codeZuSpielstand(code) {
  const sauber = (code || '').replace(/\s+/g, '');
  const m = sauber.match(/^DD([01])\.([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  let bytes = bytesAusBase64Url(m[2]);
  if (m[1] === '1') {
    if (typeof DecompressionStream === 'undefined') return null;
    bytes = await strom(bytes, new DecompressionStream('deflate-raw'));
  }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch (e) { return null; }
}

// Ansicht im Menü: { art: 'export' | 'import', n, code, meldung }
let menueCode = null;

async function codeExportStarten(n) {
  if (n === S.slot) speichern();
  const daten = slotLesen(n);
  if (!daten) return;
  menueCode = { art: 'export', n, code: T('Wird erstellt …', 'Creating …'), meldung: '' };
  zeichneMenue();
  try { menueCode.code = await spielstandZuCode(daten); }
  catch (e) { menueCode.code = ''; menueCode.meldung = T('Der Code konnte nicht erstellt werden.', 'The code could not be created.'); }
  zeichneMenue();
}
function codeImportStarten(n) { menueCode = { art: 'import', n, code: '', meldung: '' }; zeichneMenue(); }

async function codeKopieren() {
  if (!menueCode || !menueCode.code) return;
  try { await navigator.clipboard.writeText(menueCode.code); menueCode.meldung = T('✅ Kopiert! Füge ihn auf dem anderen Gerät unter „Spielstände → Code einfügen“ ein.', '✅ Copied! Paste it on the other device under "Saves → Paste code".'); }
  catch (e) {
    const feld = document.getElementById('codeFeld');
    if (feld) { feld.select(); try { document.execCommand('copy'); menueCode.meldung = T('✅ Kopiert!', '✅ Copied!'); } catch (x) { menueCode.meldung = T('Bitte den Text markieren und selbst kopieren.', 'Please select the text and copy it yourself.'); } }
  }
  zeichneMenue();
}
async function codeTeilen() {
  if (!menueCode || !menueCode.code || !navigator.share) return;
  try { await navigator.share({ title: 'Dünen & Dinare', text: menueCode.code }); } catch (e) {}
}
async function codeLaden() {
  const feld = document.getElementById('codeFeld');
  const code = feld ? feld.value : '';
  const daten = await codeZuSpielstand(code);
  if (!daten || !istSpielstand(daten)) { menueCode.code = code; menueCode.meldung = T('❌ Das ist kein gültiger Spielstand-Code.', '❌ That is not a valid save code.'); zeichneMenue(); return; }
  const n = menueCode.n;
  if (slotLesen(n) && !confirm(T(`Platz ${n} ist belegt. Überschreiben?`, `Slot ${n} is in use. Overwrite it?`))) return;
  daten.slot = n;
  try { localStorage.setItem(slotSchluessel(n), JSON.stringify(daten)); } catch (e) {}
  menueCode = null;
  ladeSlot(n); speichern();
  menueSchliessenMitPause();
  log(T('🔗 Spielstand aus dem Code geladen – willkommen zurück!', '🔗 Game loaded from the code – welcome back!'), 'gut');
  zeichnePanel();
}

function htmlMenueCode() {
  const c = menueCode;
  if (c.art === 'export') {
    return `<div class="code-ansicht">
      <h3>🔗 ${T(`Platz ${c.n} als Code`, `Slot ${c.n} as a code`)}</h3>
      <p class="hinweis">${T('Kopiere den Code und schick ihn dir selbst – zum Beispiel per Nachricht oder E-Mail. Auf dem anderen Gerät öffnest du „Spielstände“ und tippst bei einem Platz auf <b>⋯ → Code einfügen</b>.',
                             'Copy the code and send it to yourself – e.g. by message or e-mail. On the other device open "Saves" and tap <b>⋯ → Paste code</b> on a slot.')}</p>
      <textarea id="codeFeld" readonly rows="5">${c.code}</textarea>
      <div class="hinweis">${c.code && c.code.startsWith('DD') ? T(`${zahl(c.code.length)} Zeichen`, `${zahl(c.code.length)} characters`) : ''}</div>
      <div class="code-knoepfe">
        <button data-m="codeKopieren" class="an" ${c.code.startsWith('DD') ? '' : 'disabled'}>📋 ${T('Kopieren', 'Copy')}</button>
        ${typeof navigator !== 'undefined' && navigator.share ? `<button data-m="codeTeilen" ${c.code.startsWith('DD') ? '' : 'disabled'}>📤 ${T('Teilen', 'Share')}</button>` : ''}
        <button data-m="codeZurueck">${T('Zurück', 'Back')}</button>
      </div>
      ${c.meldung ? `<p class="code-meldung">${c.meldung}</p>` : ''}
    </div>`;
  }
  return `<div class="code-ansicht">
      <h3>📋 ${T(`Code in Platz ${c.n} einfügen`, `Paste a code into slot ${c.n}`)}</h3>
      <p class="hinweis">${T('Füge hier den Code ein, den du auf dem anderen Gerät kopiert hast.', 'Paste the code you copied on the other device here.')}</p>
      <textarea id="codeFeld" rows="5" placeholder="DD1.…">${c.code}</textarea>
      <div class="code-knoepfe">
        <button data-m="codeLaden" class="an">✅ ${T('Spielstand laden', 'Load game')}</button>
        <button data-m="codeZurueck">${T('Zurück', 'Back')}</button>
      </div>
      ${c.meldung ? `<p class="code-meldung">${c.meldung}</p>` : ''}
    </div>`;
}

/* ---------------- C) Lesbarkeit ---------------- */
const SCHRIFTGROESSEN = [['klein', 0.9, 'A', 'Klein', 'Small'], ['normal', 1, 'A', 'Normal', 'Normal'], ['gross', 1.15, 'A', 'Groß', 'Large'], ['riesig', 1.3, 'A', 'Sehr groß', 'Very large']];
let schriftGroesse = einstellungLesen('karawane-schrift', 'normal');
let farbenblind = einstellungLesen('karawane-farbenblind', 'aus') === 'an';

function schriftFaktor() { return (SCHRIFTGROESSEN.find(s => s[0] === schriftGroesse) || SCHRIFTGROESSEN[1])[1]; }
// Kartenbeschriftung wächst etwas weniger stark mit als der Text in den Fenstern
function kartenSchriftFaktor() { return Math.sqrt(schriftFaktor()); }

function lesbarkeitAnwenden() {
  if (typeof document === 'undefined' || !document.documentElement || !document.documentElement.style) return;
  document.documentElement.style.fontSize = (16 * schriftFaktor()) + 'px';
  if (document.body && document.body.classList) document.body.classList.toggle('farbenblind', farbenblind);
}
function schriftSetzen(id) { schriftGroesse = id; einstellungSchreiben('karawane-schrift', id); lesbarkeitAnwenden(); zeichneMenue(); zeichnePanel(); }
function farbenblindUmschalten() { farbenblind = !farbenblind; einstellungSchreiben('karawane-farbenblind', farbenblind ? 'an' : 'aus'); lesbarkeitAnwenden(); zeichneMenue(); zeichnePanel(); }
lesbarkeitAnwenden();

function htmlLesbarkeit() {
  return `<div class="wahl-titel">${T('Lesbarkeit', 'Readability')}</div>
    <div class="einstellung"><label>🔠 ${T('Schrift', 'Text size')}</label>
      <span class="schrift-wahl">${SCHRIFTGROESSEN.map(([id, f, a, de, en]) => `<button data-m="schrift" data-n="${id}" class="${schriftGroesse === id ? 'an' : ''}" title="${T(de, en)}" style="font-size:${(0.8 * f).toFixed(2)}rem">${a}</button>`).join('')}</span></div>
    <div class="einstellung"><label>🎨 ${T('Farbenblind', 'Colour-blind')}</label><span class="hinweis" style="flex:1">${T('Blau/Orange statt Grün/Rot', 'blue/orange instead of green/red')}</span>
      <button data-m="farbenblind" class="${farbenblind ? 'an' : ''}">${farbenblind ? T('an', 'on') : T('aus', 'off')}</button></div>
    <div class="einstellung"><label>🗺 ${T('Mini-Karte', 'Mini-map')}</label><span class="hinweis" style="flex:1">${T('Übersicht in der Kartenecke', 'overview in the map corner')}</span>
      <button data-m="minikarte" class="${miniAn ? 'an' : ''}">${miniAn ? T('an', 'on') : T('aus', 'off')}</button></div>`;
}
