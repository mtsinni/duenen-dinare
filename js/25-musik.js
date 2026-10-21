/* =====================================================================
   25. MUSIK – wird beim Spielen live erzeugt (keine Musikdateien nötig)
   Orientalische Tonleitern (Maqam), eine Laute (Oud), eine Rohrflöte (Ney),
   ein tiefer Halteton (Bordun) und eine Bechertrommel (Darbuka).
   Die Stimmung passt sich dem Spiel an: Titelbild, Tag, Nacht und Gefahr.
   ===================================================================== */

// Tonleitern in Halbtönen über dem Grundton (x.5 = Viertelton, typisch für arabische Musik)
const MUSIK_SKALEN = {
  hijaz:  [0, 1, 4, 5, 7, 8, 10],
  rast:   [0, 2, 3.5, 5, 7, 9, 10.5],
  bayati: [0, 1.5, 3, 5, 7, 8, 10],
  kurd:   [0, 1, 3, 5, 7, 8, 10],
};

// Rhythmen über einen Takt aus 8 Achteln: D = Dum (tief), T = Tek (hell), k = leises Ka, . = Pause
const MUSIK_RHYTHMEN = {
  maqsum: 'DT.TD.T.',
  baladi: 'DD.TD.T.',
  saidi:  'DT.DD.T.',
  leise:  'D...T..k',
  ayyub:  'D.kTD.kT',
};

const MUSIK_STIMMUNGEN = {
  start:  { tempo: 72,  skala: 'hijaz',  rhythmus: ['leise'],            instrumente: ['ney', 'oud'], dichte: 0.55, lage: 0 },
  tag:    { tempo: 96,  skala: 'rast',   rhythmus: ['maqsum', 'baladi'],  instrumente: ['oud', 'oud', 'ney'], dichte: 0.72, lage: 0 },
  nacht:  { tempo: 60,  skala: 'bayati', rhythmus: [null, 'leise'],       instrumente: ['ney'], dichte: 0.4, lage: 0 },
  gefahr: { tempo: 128, skala: 'hijaz',  rhythmus: ['saidi', 'ayyub'],    instrumente: ['oud'], dichte: 0.85, lage: -1 },
};

const MUSIK = { laeuft: false, timer: null, naechsteZeit: 0, schritt: 0, stimmung: null, phrase: null, nr: 0 };
const MUSIK_GRUNDTON = 146.83;   // D

// Frequenz einer Tonleiterstufe (stufe darf auch negativ oder größer als 6 sein)
function musikFrequenz(skala, stufe) {
  const leiter = MUSIK_SKALEN[skala], okt = Math.floor(stufe / leiter.length);
  const halbtoene = leiter[((stufe % leiter.length) + leiter.length) % leiter.length] + okt * 12;
  return MUSIK_GRUNDTON * Math.pow(2, halbtoene / 12);
}

// Welche Stimmung passt gerade?
function musikStimmungWaehlen() {
  if (typeof startOffen !== 'undefined' && startOffen) return 'start';
  if (!S) return 'tag';
  const gejagt = (S.pluenderer || []).some(p => p.phase === 'jagd' && p.ziel.art === 'karawane');
  if (gejagt || S.karawanen.some(k => k.imSturm)) return 'gefahr';
  return istNacht() ? 'nacht' : 'tag';
}

function musikStarten() {
  if (!musikAn || MUSIK.laeuft || !audioBereit()) return;
  MUSIK.laeuft = true;
  MUSIK.naechsteZeit = audio.currentTime + 0.15;
  MUSIK.schritt = 0; MUSIK.phrase = null;
  MUSIK.timer = setInterval(musikPlanen, 90);
}
function musikStoppen() {
  MUSIK.laeuft = false;
  if (MUSIK.timer) clearInterval(MUSIK.timer);
  MUSIK.timer = null;
}

// Plant immer ein Stück im Voraus – so bleibt der Takt auch bei ruckelnder Seite sauber
function musikPlanen() {
  if (!musikAn || !audio) { musikStoppen(); return; }
  while (MUSIK.naechsteZeit < audio.currentTime + 0.45) {
    // Am Taktanfang prüfen, ob sich die Stimmung geändert hat – dann beginnt eine neue Phrase
    if (MUSIK.schritt % 8 === 0) {
      const neu = musikStimmungWaehlen();
      if (!MUSIK.phrase || MUSIK.schritt >= 32 || neu !== MUSIK.stimmung) {
        if (neu !== MUSIK.stimmung) MUSIK.nr = 0;
        MUSIK.stimmung = neu; MUSIK.schritt = 0; MUSIK.nr++;
        MUSIK.phrase = musikPhrase(MUSIK_STIMMUNGEN[neu], MUSIK.nr);
        musikBordun(MUSIK_STIMMUNGEN[neu], MUSIK.naechsteZeit);
      }
    }
    musikSchritt(MUSIK.naechsteZeit);
    const st = MUSIK_STIMMUNGEN[MUSIK.stimmung];
    // leichtes „Swing“-Gefühl: lange und kurze Achtel abwechselnd
    const achtel = 60 / st.tempo / 2;
    MUSIK.naechsteZeit += achtel * (MUSIK.schritt % 2 === 0 ? 1.08 : 0.92);
    MUSIK.schritt++;
  }
}

// Eine Phrase aus 4 Takten: Motiv, Wiederholung mit Abwandlung, Aufschwung, Rückkehr zum Grundton
function musikPhrase(st, nr) {
  const zufall = () => Math.random();
  const noten = [];
  const instrument = st.instrumente[nr % st.instrumente.length];
  const rhythmus = st.rhythmus[Math.floor(nr / 2) % st.rhythmus.length];
  let stufe = zufall() < 0.5 ? 0 : 4;
  // Motiv für Takt 1 erzeugen
  const motiv = [];
  for (let i = 0; i < 8; i++) {
    if (zufall() > st.dichte && i > 0) { motiv.push(null); continue; }
    stufe += [-2, -1, -1, 0, 1, 1, 2][Math.floor(zufall() * 7)];
    stufe = Math.max(-2, Math.min(9, stufe));
    motiv.push(stufe);
  }
  for (let takt = 0; takt < 4; takt++) {
    for (let i = 0; i < 8; i++) {
      let n = motiv[i];
      if (n == null) { noten.push(null); continue; }
      if (takt === 1 && i >= 5) n += zufall() < 0.5 ? 1 : -1;      // Abwandlung am Ende
      if (takt === 2) n += 2;                                      // höher – Spannung
      if (takt === 3) n = i < 6 ? Math.round(n * (1 - i / 7)) : (i === 6 ? 1 : 0);   // zurück zum Grundton
      noten.push(n + st.lage * 7);
    }
  }
  // Längere Töne: eine Note klingt bis zur nächsten
  return { instrument, rhythmus, noten };
}

function musikSchritt(t) {
  const st = MUSIK_STIMMUNGEN[MUSIK.stimmung], p = MUSIK.phrase, i = MUSIK.schritt;
  // Trommel
  if (p.rhythmus) {
    const zeichen = MUSIK_RHYTHMEN[p.rhythmus][i % 8];
    if (zeichen === 'D') musikDum(t, MUSIK.stimmung === 'gefahr' ? 0.5 : 0.36);
    if (zeichen === 'T') musikTek(t, 0.16);
    if (zeichen === 'k') musikTek(t, 0.07);
    // in der Gefahr zusätzliche Wirbel am Phrasenende
    if (MUSIK.stimmung === 'gefahr' && i >= 28) musikTek(t + 60 / st.tempo / 4, 0.08);
  }
  // Melodie
  const note = p.noten[i];
  if (note == null) return;
  let laenge = 1;
  while (i + laenge < p.noten.length && p.noten[i + laenge] == null && laenge < 4) laenge++;
  const dauer = laenge * 60 / st.tempo / 2;
  const f = musikFrequenz(st.skala, note) * 2;
  if (p.instrument === 'ney') musikNey(t, f, dauer * 1.05);
  else musikOud(t, f, Math.min(dauer, 0.9));
}

// --- Die Instrumente ---

// Laute (Oud): gezupft – ein heller Anschlag, der schnell weich wird
function musikOud(t, f, dauer) {
  const a = audio, laut = a.createGain(), filter = a.createBiquadFilter();
  filter.type = 'lowpass'; filter.Q.value = 2;
  filter.frequency.setValueAtTime(3200, t); filter.frequency.exponentialRampToValueAtTime(500, t + 0.35);
  laut.gain.setValueAtTime(0.0001, t);
  laut.gain.exponentialRampToValueAtTime(0.13, t + 0.005);
  laut.gain.exponentialRampToValueAtTime(0.0001, t + dauer + 0.5);
  filter.connect(laut).connect(musikBus);
  for (const verstimmt of [0.997, 1.003]) {
    const o = a.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = f * verstimmt;
    o.connect(filter); o.start(t); o.stop(t + dauer + 0.6);
  }
}

// Rohrflöte (Ney): weicher, hauchiger Ton mit leichtem Vibrato
function musikNey(t, f, dauer) {
  const a = audio, laut = a.createGain();
  const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f;
  const o2 = a.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2;
  const g2 = a.createGain(); g2.gain.value = 0.15;
  const vib = a.createOscillator(), vibTiefe = a.createGain();
  vib.frequency.value = 5.2; vibTiefe.gain.setValueAtTime(0, t); vibTiefe.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.4, dauer));
  vib.connect(vibTiefe); vibTiefe.connect(o.frequency); vibTiefe.connect(o2.frequency);
  laut.gain.setValueAtTime(0.0001, t);
  laut.gain.exponentialRampToValueAtTime(0.09, t + 0.09);
  laut.gain.setValueAtTime(0.09, t + Math.max(0.1, dauer - 0.12));
  laut.gain.exponentialRampToValueAtTime(0.0001, t + dauer + 0.25);
  o.connect(laut); o2.connect(g2).connect(laut); laut.connect(musikBus);
  [o, o2, vib].forEach(x => { x.start(t); x.stop(t + dauer + 0.3); });
  // Hauch
  rauschen(Math.min(0.35, dauer), 0.012, f * 2, f * 1.5, t - audio.currentTime, musikBus, 'bandpass', 0.2);
}

// Bechertrommel: Dum (tief, voll) und Tek (hell, trocken)
function musikDum(t, laut) {
  const a = audio, o = a.createOscillator(), g = a.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.18);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(laut, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.connect(g).connect(musikBus); o.start(t); o.stop(t + 0.4);
}
function musikTek(t, laut) {
  rauschen(0.06, laut, 4200, 2600, t - audio.currentTime, musikBus, 'bandpass', 0.05);
  const a = audio, o = a.createOscillator(), g = a.createGain();
  o.type = 'triangle'; o.frequency.value = 820;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(laut * 0.35, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(musikBus); o.start(t); o.stop(t + 0.07);
}

// Bordun: Grundton und Quinte klingen eine ganze Phrase lang leise mit
function musikBordun(st, t) {
  const a = audio, achtel = 60 / st.tempo / 2, dauer = achtel * 32;
  const laut = a.createGain(), filter = a.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 420;
  const staerke = MUSIK.stimmung === 'gefahr' ? 0.06 : 0.045;
  laut.gain.setValueAtTime(0.0001, t);
  laut.gain.exponentialRampToValueAtTime(staerke, t + 1.2);
  laut.gain.setValueAtTime(staerke, t + dauer - 0.6);
  laut.gain.exponentialRampToValueAtTime(0.0001, t + dauer + 1.2);
  filter.connect(laut).connect(musikBus);
  const tief = musikFrequenz(st.skala, st.lage * 7) / 2;
  for (const f of [tief, tief * 1.5, tief * 1.003]) {
    const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    o.connect(filter); o.start(t); o.stop(t + dauer + 1.3);
  }
}
