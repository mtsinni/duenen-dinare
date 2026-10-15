/* =====================================================================
   12. JAHRESZEITEN UND GERÄUSCHE
   ===================================================================== */

// --- Jahreszeiten: ein Wüstenjahr hat 120 Tage, jede Jahreszeit 30 ---
const JAHR_TAGE = 120;
const JAHRESZEITEN = [
  { name: 'Frühling',   artikel: 'Der', icon: '🌸', text: 'Milde Tage – die beste Reisezeit.',
    nameEn: 'Spring', textEn: 'Mild days – the best time to travel.',
    durst: 1,    hitze: 1,   sturm: 1,   regen: 1,   datteln: 1,   feste: 1,   austrocknen: 1 },
  { name: 'Hochsommer', artikel: 'Der', icon: '🔥', text: 'Gnadenlose Hitze: mehr Durst, Hitzewellen und Sandstürme.',
    nameEn: 'High summer', textEn: 'Merciless heat: more thirst, heat waves and sandstorms.',
    durst: 1.2,  hitze: 1.5, sturm: 1.4, regen: 0.5, datteln: 1,   feste: 1,   austrocknen: 1.15 },
  { name: 'Erntezeit',  artikel: 'Die', icon: '🌴', text: 'Die Dattelernte ist da – Datteln werden billig, überall wird gefeiert.',
    nameEn: 'Harvest', textEn: 'The date harvest is in – dates get cheap and there are festivals everywhere.',
    durst: 1.05, hitze: 1,   sturm: 1,   regen: 0.8, datteln: 3,   feste: 2.5, austrocknen: 1 },
  { name: 'Regenzeit',  artikel: 'Die', icon: '🌧️', text: 'Häufiger Regen füllt die Quellen, die Tage sind kühler.',
    nameEn: 'Rainy season', textEn: 'Frequent rain fills the springs, the days are cooler.',
    durst: 0.8,  hitze: 0.2, sturm: 0.7, regen: 2.5, datteln: 0.5, feste: 1,   austrocknen: 0.4 },
];

function jahreszeitIndex(tag = S.tag) { return Math.floor(((tag - 1) % JAHR_TAGE) / (JAHR_TAGE / 4)); }
function jahreszeit() { return JAHRESZEITEN[jahreszeitIndex()]; }
function jahr() { return Math.floor((S.tag - 1) / JAHR_TAGE) + 1; }

function jahreszeitTag() {
  if (S.tag > 1 && jahreszeitIndex(S.tag) !== jahreszeitIndex(S.tag - 1)) {
    const j = jahreszeit();
    log(T(`${j.icon} ${j.artikel} ${j.name} beginnt: ${j.text}`, `${j.icon} ${j.name} begins: ${j.text}`));
  }
}

// --- Geräusche ---
// Alle Klänge werden mit der Web-Audio-Schnittstelle des Browsers erzeugt –
// so braucht das Spiel keine einzige Sounddatei.

let audio = null, letzterTon = 0;
let tonAn = (() => { try { return localStorage.getItem('karawane-ton') !== 'aus'; } catch (e) { return true; } })();

function audioBereit() {
  if (!audio) {
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    audio = new AC();
  }
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

// Ein einzelner Ton mit sanftem Ein- und Ausklingen
function piep(frequenz, start, dauer, form = 'sine', lautstaerke = 0.15) {
  const a = audio, t = a.currentTime + start;
  const osz = a.createOscillator(), laut = a.createGain();
  osz.type = form;
  osz.frequency.value = frequenz;
  laut.gain.setValueAtTime(0.0001, t);
  laut.gain.exponentialRampToValueAtTime(lautstaerke, t + 0.01);
  laut.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
  osz.connect(laut).connect(a.destination);
  osz.start(t);
  osz.stop(t + dauer + 0.05);
}

// Rauschen durch einen wandernden Filter – klingt wie Wind oder Regen
function rauschen(dauer, lautstaerke, von, bis) {
  const a = audio, t = a.currentTime;
  const puffer = a.createBuffer(1, Math.floor(a.sampleRate * dauer), a.sampleRate);
  const daten = puffer.getChannelData(0);
  for (let i = 0; i < daten.length; i++) daten[i] = Math.random() * 2 - 1;
  const quelle = a.createBufferSource();
  quelle.buffer = puffer;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(von, t);
  filter.frequency.exponentialRampToValueAtTime(bis, t + dauer);
  const laut = a.createGain();
  laut.gain.setValueAtTime(0.0001, t);
  laut.gain.exponentialRampToValueAtTime(lautstaerke, t + dauer * 0.3);
  laut.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
  quelle.connect(filter).connect(laut).connect(a.destination);
  quelle.start(t);
}

function ton(art) {
  if (!tonAn) return;
  const jetzt = Date.now();
  if (jetzt - letzterTon < 150) return;   // nicht zu viele Töne auf einmal
  letzterTon = jetzt;
  try {
    if (!audioBereit()) return;
    if (art === 'muenze')   { piep(1320, 0, 0.08, 'triangle', 0.1); piep(1760, 0.06, 0.14, 'triangle', 0.08); }
    if (art === 'glocke')   { piep(660, 0, 0.6, 'sine', 0.14); piep(1320, 0, 0.3, 'sine', 0.04); piep(587, 0.28, 0.6, 'sine', 0.1); }
    if (art === 'erfolg')   { [523, 659, 784, 1047].forEach((f, i) => piep(f, i * 0.09, 0.28, 'triangle', 0.1)); }
    if (art === 'schlecht') { piep(196, 0, 0.35, 'sawtooth', 0.05); piep(147, 0.16, 0.5, 'sawtooth', 0.05); }
    if (art === 'wind')     { rauschen(1.8, 0.12, 300, 1200); }
    if (art === 'regen')    { rauschen(1.4, 0.07, 2500, 4000); }
  } catch (e) {}
}

// Passende Töne zu wichtigen Meldungen im Ereignis-Log
function tonZuMeldung(text, art) {
  if (/^🎯|^🏅|^⭐|Sieg!|Victory!|schuldenfrei|free of debt|^🤝|^🌱/.test(text)) ton('erfolg');
  else if (/^🌪️ (Ein Sandsturm zieht|A sandstorm is rising)/.test(text)) ton('wind');
  else if (/^🌧️/.test(text)) ton('regen');
  else if (art === 'schlecht' && /überfallen|raid|^☠️|^💀|scheitert|fails|^⚖️/.test(text)) ton('schlecht');
  else if (/ (erreicht|reaches) /.test(text)) ton('glocke');
}

function tonUmschalten() {
  tonAn = !tonAn;
  try { localStorage.setItem('karawane-ton', tonAn ? 'an' : 'aus'); } catch (e) {}
  if (tonAn) ton('muenze');
  zeichnePanel();
}
