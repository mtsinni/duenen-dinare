/* =====================================================================
   0. SPRACHE – Deutsch oder Englisch
   Jeder Text im Spiel steht als T('Deutsch', 'English') im Code.
   T() gibt einfach den Text der gerade gewählten Sprache zurück.
   ===================================================================== */

// Gewählte Sprache: gespeicherte Wahl – sonst die Sprache des Browsers
let SPRACHE = (() => {
  try { const s = localStorage.getItem('karawane-sprache'); if (s === 'de' || s === 'en') return s; } catch (e) {}
  const browser = (typeof navigator !== 'undefined' && navigator.language) || 'de';
  return browser.toLowerCase().startsWith('de') ? 'de' : 'en';
})();

function T(de, en) { return SPRACHE === 'en' ? en : de; }

// Zahlen schreibt man im Deutschen "1.234,5", im Englischen "1,234.5"
function gebietsschema() { return SPRACHE === 'en' ? 'en-US' : 'de-DE'; }
function zahlText(n, nachkomma) {
  const opt = nachkomma == null ? undefined : { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma };
  return Number(n).toLocaleString(gebietsschema(), opt);
}

// Daten mit zwei Sprachen: ein Feld "nameEn" neben "name" (ebenso textEn, titelEn …).
// Beim ersten Aufruf merken wir uns den deutschen Text in "nameDe" und setzen dann
// "name" auf die gewählte Sprache. So kann der restliche Code einfach w.name benutzen.
function uebersetzeObjekt(o) {
  for (const schluessel of Object.keys(o)) {
    if (schluessel.length < 3 || !schluessel.endsWith('En')) continue;
    const basis = schluessel.slice(0, -2);
    if (o[basis + 'De'] === undefined) o[basis + 'De'] = o[basis];
    o[basis] = SPRACHE === 'en' ? o[schluessel] : o[basis + 'De'];
  }
}

// Alle Datenlisten des Spiels übersetzen (wird beim Start und beim Umschalten aufgerufen)
function datenUebersetzen() {
  const listen = [WAREN, Object.values(TIERE), Object.values(WERKSTAETTEN), Object.values(SCHWIERIGKEITEN),
                  JAHRESZEITEN, RAENGE, AUFGABEN, Object.values(FUNDORT_ARTEN), EINFUEHRUNG, GEBIRGE];
  for (const liste of listen) for (const o of liste) uebersetzeObjekt(o);
  if (!BETRIEB_NAMEN_DE) BETRIEB_NAMEN_DE = { ...BETRIEB_NAMEN };
  Object.assign(BETRIEB_NAMEN, SPRACHE === 'en' ? BETRIEB_NAMEN_EN : BETRIEB_NAMEN_DE);
  if (typeof S !== 'undefined' && S) namenUebersetzen();
}
let BETRIEB_NAMEN_DE = null;

// Gespeicherte Namen im Spielstand ("Karawane 3", "Haus Kader") an die Sprache anpassen
function namenUebersetzen() {
  for (const k of S.karawanen) {
    const nr = (k.name.match(/\d+$/) || [''])[0];
    if (/^(Karawane|Caravan) \d+$/.test(k.name)) k.name = `${T('Karawane', 'Caravan')} ${nr}`;
  }
  for (const r of S.rivalen || []) r.name = r.name.replace(/^(Haus|House) /, T('Haus ', 'House '));
}

function spracheSetzen(code) {
  SPRACHE = code;
  try { localStorage.setItem('karawane-sprache', code); } catch (e) {}
  if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = code;
  datenUebersetzen();
  statischeTexte();
  zeichnePanel();
  if (menueOffen) zeichneMenue();
  if (statistikOffen) zeichneStatistik();
}
