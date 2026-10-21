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
// Es gibt zwei getrennte „Kanäle“: Geräusche (sfxBus) und Musik (musikBus), jeweils mit eigener Lautstärke.

function einstellungLesen(schluessel, standard) {
  try { const w = localStorage.getItem(schluessel); return w == null ? standard : w; } catch (e) { return standard; }
}
function einstellungSchreiben(schluessel, wert) { try { localStorage.setItem(schluessel, String(wert)); } catch (e) {} }

let audio = null, letzterTon = 0, letzterKlick = 0, sfxBus = null, musikBus = null;
let tonAn = einstellungLesen('karawane-ton', 'an') !== 'aus';
let musikAn = einstellungLesen('karawane-musik', 'an') !== 'aus';
let tonLautstaerke = +einstellungLesen('karawane-ton-laut', 0.8);
let musikLautstaerke = +einstellungLesen('karawane-musik-laut', 0.5);

function audioBereit() {
  if (!audio) {
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    audio = new AC();
    // Ein sanfter Begrenzer am Ende verhindert Übersteuern, wenn viel gleichzeitig klingt
    const begrenzer = audio.createDynamicsCompressor();
    begrenzer.threshold.value = -14; begrenzer.ratio.value = 6;
    begrenzer.connect(audio.destination);
    sfxBus = audio.createGain(); sfxBus.connect(begrenzer);
    musikBus = audio.createGain(); musikBus.connect(begrenzer);
    lautstaerkenSetzen();
  }
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

function lautstaerkenSetzen() {
  if (!audio) return;
  sfxBus.gain.value = tonAn ? tonLautstaerke : 0;
  musikBus.gain.setTargetAtTime(musikAn ? musikLautstaerke * 0.6 : 0, audio.currentTime, 0.3);
}

// Ein einzelner Ton mit sanftem Ein- und Ausklingen
function piep(frequenz, start, dauer, form = 'sine', lautstaerke = 0.15, ziel = sfxBus, bisFrequenz = null) {
  const a = audio, t = a.currentTime + start;
  const osz = a.createOscillator(), laut = a.createGain();
  osz.type = form;
  osz.frequency.setValueAtTime(frequenz, t);
  if (bisFrequenz) osz.frequency.exponentialRampToValueAtTime(bisFrequenz, t + dauer);
  laut.gain.setValueAtTime(0.0001, t);
  laut.gain.exponentialRampToValueAtTime(lautstaerke, t + 0.01);
  laut.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
  osz.connect(laut).connect(ziel);
  osz.start(t);
  osz.stop(t + dauer + 0.05);
}

// Rauschen durch einen wandernden Filter – klingt wie Wind, Regen, Schritte oder Schläge
let rauschPuffer = null;
function rauschen(dauer, lautstaerke, von, bis, start = 0, ziel = sfxBus, filterArt = 'bandpass', anschlag = 0.3) {
  const a = audio, t = a.currentTime + start;
  if (!rauschPuffer) {            // einmal 2 Sekunden Rauschen erzeugen und immer wieder benutzen
    rauschPuffer = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const daten = rauschPuffer.getChannelData(0);
    for (let i = 0; i < daten.length; i++) daten[i] = Math.random() * 2 - 1;
  }
  const quelle = a.createBufferSource();
  quelle.buffer = rauschPuffer; quelle.loop = true;
  const filter = a.createBiquadFilter();
  filter.type = filterArt;
  filter.frequency.setValueAtTime(von, t);
  filter.frequency.exponentialRampToValueAtTime(bis, t + dauer);
  const laut = a.createGain();
  laut.gain.setValueAtTime(0.0001, t);
  laut.gain.exponentialRampToValueAtTime(lautstaerke, t + Math.max(0.003, dauer * anschlag));
  laut.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
  quelle.connect(filter).connect(laut).connect(ziel);
  quelle.start(t, Math.random());
  quelle.stop(t + dauer + 0.05);
}

// Ein dumpfer Schlag (Trommel, Hammer, Hufe)
function schlag(frequenz, start, dauer, lautstaerke, ziel = sfxBus) {
  piep(frequenz, start, dauer, 'sine', lautstaerke, ziel, frequenz * 0.5);
}

const TOENE = {
  klick:     () => { piep(1900, 0, 0.035, 'triangle', 0.035); },
  muenze:    () => { piep(1320, 0, 0.08, 'triangle', 0.1); piep(1760, 0.06, 0.14, 'triangle', 0.08); },
  // Kaufen: Münzen wandern über den Tisch – zwei, drei dumpfere Klicks
  kaufen:    () => { [0, 0.07, 0.13].forEach((t, i) => { piep(1100 - i * 90, t, 0.07, 'triangle', 0.07); rauschen(0.04, 0.05, 5000, 4000, t, sfxBus, 'highpass', 0.1); }); },
  // Verkaufen: ein kleiner Münzregen in den Beutel
  verkaufen: () => { for (let i = 0; i < 6; i++) { const t = i * 0.05 + Math.random() * 0.02; piep(1500 + Math.random() * 900, t, 0.09, 'triangle', 0.06); }
                     piep(2093, 0.33, 0.25, 'sine', 0.05); },
  glocke:    () => { piep(660, 0, 0.6, 'sine', 0.14); piep(1320, 0, 0.3, 'sine', 0.04); piep(587, 0.28, 0.6, 'sine', 0.1); },
  // Aufbruch: Kamelglocke und ein paar dumpfe Schritte im Sand
  aufbruch:  () => { piep(784, 0, 0.5, 'sine', 0.1); piep(1568, 0, 0.2, 'sine', 0.03);
                     [0.15, 0.45, 0.75, 1.05].forEach(t => rauschen(0.12, 0.08, 600, 250, t, sfxBus, 'lowpass', 0.15)); },
  // Bauen: drei Hammerschläge auf Holz
  bauen:     () => { [0, 0.22, 0.44].forEach(t => { schlag(180, t, 0.12, 0.2); rauschen(0.06, 0.08, 2500, 1500, t, sfxBus, 'bandpass', 0.05); }); },
  // Tier gekauft: ein tiefes, brummiges Grunzen
  tier:      () => { piep(110, 0, 0.45, 'sawtooth', 0.05, sfxBus, 85); rauschen(0.4, 0.04, 500, 300, 0, sfxBus, 'lowpass', 0.2); },
  erfolg:    () => { [523, 659, 784, 1047].forEach((f, i) => piep(f, i * 0.09, 0.28, 'triangle', 0.1)); },
  // Rangaufstieg: kleine Fanfare
  fanfare:   () => { [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.6], [1047, 0.72]].forEach(([f, t]) => { piep(f, t, t > 0.5 ? 0.6 : 0.2, 'sawtooth', 0.045); piep(f * 2, t, 0.15, 'triangle', 0.03); }); },
  // Errungenschaft: helles Glitzern
  errungenschaft: () => { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => piep(f, i * 0.06, 0.5, 'sine', 0.06)); piep(523, 0, 0.8, 'triangle', 0.05); },
  schlecht:  () => { piep(196, 0, 0.35, 'sawtooth', 0.05); piep(147, 0.16, 0.5, 'sawtooth', 0.05); },
  // Kampf: Klirren von Säbeln
  kampf:     () => { [0, 0.18, 0.31].forEach(t => { rauschen(0.18, 0.12, 6000, 2500, t, sfxBus, 'bandpass', 0.02); piep(2400 + Math.random() * 600, t, 0.2, 'square', 0.025); }); },
  // Plünderer: ein dunkles Horn
  horn:      () => { piep(147, 0, 1.1, 'sawtooth', 0.05, sfxBus, 155); piep(220, 0.05, 1.0, 'sawtooth', 0.03, sfxBus, 233); },
  wind:      () => { rauschen(1.8, 0.12, 300, 1200); },
  regen:     () => { rauschen(1.4, 0.07, 2500, 4000); },
  sieg:      () => { [[392, 0], [523, 0.18], [659, 0.36], [784, 0.54], [1047, 0.8]].forEach(([f, t]) => { piep(f, t, t > 0.7 ? 1.4 : 0.3, 'sawtooth', 0.05); piep(f / 2, t, 0.4, 'triangle', 0.06); });
                     [0, 0.18, 0.36, 0.54, 0.8].forEach(t => schlag(120, t, 0.2, 0.18)); },
  niederlage: () => { [[392, 0], [349, 0.4], [311, 0.8], [262, 1.2]].forEach(([f, t]) => piep(f, t, 0.7, 'triangle', 0.08)); },
};

function ton(art) {
  if (!tonAn || !TOENE[art]) return;
  const jetzt = Date.now();
  if (art === 'klick') { if (jetzt - letzterKlick < 60) return; letzterKlick = jetzt; }
  else { if (jetzt - letzterTon < 150) return; letzterTon = jetzt; }   // nicht zu viele Töne auf einmal
  try { if (audioBereit()) TOENE[art](); } catch (e) {}
}

// Passende Töne zu wichtigen Meldungen im Ereignis-Log
function tonZuMeldung(text, art) {
  if (/^🏅/.test(text)) ton('fanfare');
  else if (/^🎯|^⭐|Sieg!|Victory!|schuldenfrei|free of debt|^🤝|^🌱/.test(text)) ton('erfolg');
  else if (/^🌪️ (Ein Sandsturm zieht|A sandstorm is rising)/.test(text)) ton('wind');
  else if (/^🌧️/.test(text)) ton('regen');
  else if (/^🐎 (Aus dem Räuberlager|Raiders ride out|Plünderer aus|Raiders from)/.test(text)) ton('horn');
  else if (/^⚔️|^🗡️|^🔥|^🛡️/.test(text)) ton('kampf');
  else if (art === 'schlecht' && /überfallen|raid|^☠️|^💀|scheitert|fails|^⚖️/.test(text)) ton('schlecht');
  else if (/ (erreicht|reaches) /.test(text)) ton('glocke');
}

function tonUmschalten() {
  tonAn = !tonAn;
  einstellungSchreiben('karawane-ton', tonAn ? 'an' : 'aus');
  lautstaerkenSetzen();
  if (tonAn) ton('muenze');
  zeichnePanel();
}

function musikUmschalten() {
  musikAn = !musikAn;
  einstellungSchreiben('karawane-musik', musikAn ? 'an' : 'aus');
  if (musikAn) { audioBereit(); musikStarten(); } else musikStoppen();
  lautstaerkenSetzen();
  zeichnePanel();
}

// Jeder Knopfdruck klickt leise (die Klänge der Aktionen kommen zusätzlich)
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('button');
    if (b && !b.disabled) ton('klick');
  }, true);
  // Browser erlauben Klang erst nach der ersten Berührung – dann startet auch die Musik
  const ersteBeruehrung = () => {
    if (audioBereit() && musikAn) musikStarten();
    document.removeEventListener('pointerdown', ersteBeruehrung, true);
    document.removeEventListener('keydown', ersteBeruehrung, true);
  };
  document.addEventListener('pointerdown', ersteBeruehrung, true);
  document.addEventListener('keydown', ersteBeruehrung, true);
}
