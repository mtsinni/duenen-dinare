/* =====================================================================
   36. DIE GROSSE WÜSTE – Landschaft mit Wirkung
   A) Die große klassische Karte (≈35 echte Sahara-Orte)
   B) Große Zufallskarten
   C) Flüsse und Wadis: Wasser auffüllen, Furten, Hochwasser
   D) Gebirge: langsamer, aber kein Sandsturm und weniger Hitze
   E) Reiseplanung: was liegt auf dem Weg?
   ===================================================================== */

/* ---------------- A) Die große klassische Karte ---------------- */
const KLASSISCH_GROSS = {
  oasen: [
    // die bekannten Orte – an denselben Stellen, nur auf der größeren Karte
    { name: 'Siwa',        x: 1458, y: 267,  produziert: ['datteln', 'wasser'],          bev: 900 },
    { name: 'Ghadames',    x: 764,  y: 196,  produziert: ['teppiche', 'datteln'],        bev: 700 },
    { name: 'Taoudenni',   x: 338,  y: 444,  produziert: ['salz'],                       bev: 300 },
    { name: 'Timbuktu',    x: 267,  y: 995,  produziert: ['gold', 'gewuerze', 'indigo'], bev: 1400 },
    { name: 'Agadez',      x: 836,  y: 942,  produziert: ['wasser', 'salz', 'indigo'],   bev: 800, start: true },
    { name: 'Bilma',       x: 1138, y: 675,  produziert: ['salz', 'datteln'],            bev: 400 },
    { name: 'Kufra',       x: 1547, y: 853,  produziert: ['weihrauch', 'wasser'],        bev: 500 },
    { name: 'Tamanrasset', x: 640,  y: 587,  produziert: ['gewuerze', 'teppiche'],       bev: 600 },
    { name: 'Dakhla',      x: 1884, y: 444,  produziert: ['datteln', 'wasser'],          bev: 500 },
    { name: 'Selima',      x: 1867, y: 1013, produziert: ['salz'],                       bev: 250 },
    { name: 'Suakin',      x: 2303, y: 711,  produziert: ['wasser'],                     bev: 1600, hafen: true },
    // neu entdeckte Orte
    { name: 'Tindouf',     x: 170,  y: 200,  produziert: ['datteln', 'teppiche'],        bev: 450 },
    { name: 'Ghardaïa',    x: 520,  y: 120,  produziert: ['teppiche', 'wasser'],         bev: 800 },
    { name: 'Timimoun',    x: 470,  y: 310,  produziert: ['datteln'],                    bev: 400 },
    { name: 'In Salah',    x: 650,  y: 370,  produziert: ['salz', 'datteln'],            bev: 350 },
    { name: 'Ghat',        x: 990,  y: 420,  produziert: ['datteln', 'indigo'],          bev: 450 },
    { name: 'Djanet',      x: 900,  y: 610,  produziert: ['wasser', 'datteln'],          bev: 350 },
    { name: 'Murzuk',      x: 1200, y: 330,  produziert: ['datteln', 'gewuerze'],        bev: 500 },
    { name: 'Sebha',       x: 1060, y: 170,  produziert: ['salz', 'wasser'],             bev: 600 },
    { name: 'Awjila',      x: 1720, y: 180,  produziert: ['datteln'],                    bev: 400 },
    { name: 'Bahariya',    x: 2060, y: 250,  produziert: ['datteln', 'wasser'],          bev: 450 },
    { name: 'Farafra',     x: 1700, y: 560,  produziert: ['datteln'],                    bev: 300 },
    { name: 'Kharga',      x: 2080, y: 620,  produziert: ['datteln', 'wasser'],          bev: 550 },
    { name: 'Faya',        x: 1340, y: 960,  produziert: ['datteln', 'salz'],            bev: 400 },
    { name: 'Fachi',       x: 1010, y: 830,  produziert: ['salz'],                       bev: 250 },
    { name: 'In Gall',     x: 640,  y: 800,  produziert: ['salz', 'datteln'],            bev: 300 },
    { name: 'Zinder',      x: 1060, y: 1120, produziert: ['gewuerze', 'indigo'],         bev: 900 },
    { name: 'Gao',         x: 560,  y: 1070, produziert: ['gold', 'wasser'],             bev: 900 },
    { name: 'Arawan',      x: 290,  y: 760,  produziert: ['salz'],                       bev: 250 },
    { name: 'Walata',      x: 110,  y: 860,  produziert: ['gold', 'teppiche'],           bev: 500 },
    { name: 'Chinguetti',  x: 130,  y: 560,  produziert: ['datteln', 'teppiche'],        bev: 450 },
    { name: 'Dongola',     x: 2080, y: 1010, produziert: ['datteln', 'gewuerze'],        bev: 900 },
    { name: 'Fada',        x: 1560, y: 1100, produziert: ['salz', 'datteln'],            bev: 300 },
    { name: 'Assuan',      x: 2140, y: 820,  produziert: ['gewuerze', 'wasser'],         bev: 1000 },
    { name: 'Quseir',      x: 2314, y: 330,  produziert: ['wasser'],                     bev: 1100, hafen: true },
    { name: 'Djenné',      x: 210,  y: 1180, produziert: ['datteln', 'gewuerze'],        bev: 800 },
  ],
  gebirge: [
    { name: 'Hoggar',  x: 730,  y: 470, breite: 150, huegel: 30 },
    { name: 'Tibesti', x: 1360, y: 560, breite: 140, huegel: 28 },
    { name: 'Aïr',     x: 840,  y: 760, breite: 80,  huegel: 14 },
    { name: 'Tassili', x: 1110, y: 520, breite: 95,  huegel: 18 },
    { name: 'Ennedi',  x: 1640, y: 980, breite: 85,  huegel: 16 },
    { name: 'Uweinat', x: 1760, y: 760, breite: 80,  huegel: 14 },
    { name: 'Adrar',   x: 300,  y: 600, breite: 80,  huegel: 14 },
  ],
  salz: { x: 390, y: 505, rx: 70, ry: 30 },
  sandmeere: [[1102, 267, 290], [1653, 604, 280], [213, 213, 210], [1280, 1084, 320], [640, 1155, 225], [2027, 231, 195],
              [2062, 1138, 180], [450, 900, 220], [1000, 980, 230], [1450, 400, 240], [880, 420, 200], [1800, 300, 220]],
  fluesse: [
    { name: 'Niger', nameEn: 'Niger', art: 'fluss',
      punkte: [[-10, 1180], [120, 1090], [230, 1050], [330, 1050], [440, 1060], [560, 1125], [660, 1180], [720, 1255]] },
    { name: 'Nil', nameEn: 'Nile', art: 'fluss',
      punkte: [[2000, 1255], [2050, 1120], [2140, 1040], [2160, 930], [2210, 820], [2200, 700], [2180, 560], [2190, 420], [2170, 280], [2140, 140], [2150, -10]] },
    { name: 'Wadi Draa', nameEn: 'Wadi Draa', art: 'wadi',
      punkte: [[440, -10], [360, 90], [270, 150], [250, 260], [150, 330], [-10, 380]] },
    { name: 'Wadi Howar', nameEn: 'Wadi Howar', art: 'wadi',
      punkte: [[1450, 1255], [1560, 1205], [1700, 1110], [1800, 1080], [1950, 1130], [2050, 1120]] },
    { name: 'Wadi al-Adschal', nameEn: 'Wadi al-Ajal', art: 'wadi',
      punkte: [[860, 290], [980, 300], [1100, 260], [1220, 230], [1320, 180]] },
  ],
};

const punkteAus = liste => liste.map(([x, y]) => ({ x, y }));

function klassischerPlanGross() {
  const d = KLASSISCH_GROSS;
  return {
    nr: 0, samen: 2024, gebirge: d.gebirge, sandmeere: d.sandmeere, salz: d.salz,
    fluesse: d.fluesse.map(f => ({ ...f, punkte: punkteAus(f.punkte) })),
    oasen: d.oasen.map(o => ({ ...o, produziert: [...o.produziert] })),
  };
}

/* ---------------- B) Große Zufallskarten ---------------- */
const FLUSS_NAMEN = [['Niger', 'Niger'], ['Nil', 'Nile'], ['Schari', 'Chari'], ['Senegal', 'Senegal'], ['Benue', 'Benue']];
const WADI_NAMEN = ['Wadi Draa', 'Wadi Howar', 'Wadi Saura', 'Wadi Tafassasset', 'Wadi Azaouak', 'Wadi Ighargar', 'Wadi Tilemsi', 'Wadi Kufra'];

function kartenPlanGross(nr) {
  const rnd = zufallsFolge(nr * 7919 + 29);
  const zwischen = (a, b) => a + rnd() * (b - a);
  const mischen = liste => { const l = [...liste]; for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };
  const abstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const B = KARTE_B, H = KARTE_H;

  // 1. Gebirge
  const gNamen = mischen(GEBIRGS_NAMEN), gebirge = [];
  for (let versuch = 0; gebirge.length < 7 && versuch < 400; versuch++) {
    const breite = Math.round(zwischen(70, 150));
    const g = { name: gNamen[gebirge.length], x: Math.round(zwischen(200, B - 260)), y: Math.round(zwischen(170, H - 170)), breite, huegel: Math.max(10, Math.round(breite / 5)) };
    if (g.x > kuesteX(g.y) - 280) continue;
    if (gebirge.every(x => abstand(x, g) > (x.breite + g.breite) * 1.1 + 60)) gebirge.push(g);
  }

  // 2. Flüsse: ein großer Strom und zwei bis drei Wadis – als geschwungene Linie von Rand zu Rand
  const fluesse = [];
  const linie = (von, nach, schritte, schwung) => {
    const punkte = [von];
    const nx = -(nach.y - von.y), ny = nach.x - von.x, l = Math.hypot(nx, ny) || 1;
    let seite = 0;
    for (let i = 1; i < schritte; i++) {
      const t = i / schritte;
      seite = seite * 0.55 + (rnd() - 0.5) * schwung;
      punkte.push({ x: Math.round(von.x + (nach.x - von.x) * t + nx / l * seite), y: Math.round(von.y + (nach.y - von.y) * t + ny / l * seite) });
    }
    punkte.push(nach);
    return punkte.filter(p => p.x < kuesteX(Math.max(0, Math.min(H, p.y))) - 70 || p === nach);
  };
  const [fName, fNameEn] = FLUSS_NAMEN[Math.floor(rnd() * FLUSS_NAMEN.length)];
  if (rnd() < 0.5) {   // vom Westrand zum Südrand (wie der Niger)
    const von = { x: -10, y: Math.round(zwischen(H * 0.55, H * 0.8)) }, nach = { x: Math.round(zwischen(B * 0.3, B * 0.55)), y: H + 10 };
    fluesse.push({ name: fName, nameEn: fNameEn, art: 'fluss', punkte: linie(von, nach, 9, 160) });
  } else {             // vom Südrand nach Norden, nicht weit von der Küste (wie der Nil)
    const x = Math.round(zwischen(B * 0.72, B * 0.82));
    fluesse.push({ name: fName, nameEn: fNameEn, art: 'fluss', punkte: linie({ x: x - 60, y: H + 10 }, { x: x + 20, y: -10 }, 11, 110) });
  }
  const wNamen = mischen(WADI_NAMEN), wadis = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < wadis; i++) {
    const w = rnd() * Math.PI * 2, mitte = { x: zwischen(B * 0.15, B * 0.75), y: zwischen(H * 0.15, H * 0.85) }, l = zwischen(380, 620);
    const von = { x: Math.round(mitte.x - Math.cos(w) * l / 2), y: Math.round(mitte.y - Math.sin(w) * l / 2) };
    const nach = { x: Math.round(mitte.x + Math.cos(w) * l / 2), y: Math.round(mitte.y + Math.sin(w) * l / 2) };
    const pkt = linie(von, nach, 6, 120).filter(p => p.x > -20 && p.y > -20 && p.y < H + 20);
    if (pkt.length >= 3 && !pkt.some(p => gebirge.some(g => abstand(g, p) < g.breite * 0.7))) fluesse.push({ name: wNamen[i], nameEn: wNamen[i], art: 'wadi', punkte: pkt });
  }

  // 3. Sandmeere
  const sandmeere = [];
  for (let i = 0; i < 14; i++) sandmeere.push([Math.round(zwischen(80, B - 170)), Math.round(zwischen(100, H - 60)), Math.round(zwischen(150, 290))]);

  // 4. Oasen
  const anzahl = 30 + Math.floor(rnd() * 5);
  const oasen = [];
  let mindest = 200;
  const amFluss = p => fluesse.some(f => abstandZuLinie(p, f.punkte) < 48);
  for (let versuch = 0; oasen.length < anzahl && versuch < 8000; versuch++) {
    if (versuch % 1500 === 1499) mindest -= 12;
    const p = { x: Math.round(zwischen(110, B - 170)), y: Math.round(zwischen(100, H - 90)) };
    if (p.x > kuesteX(p.y) - 150) continue;
    if (gebirge.some(g => ((p.x - g.x) / (g.breite * 0.85 + 25)) ** 2 + ((p.y - g.y) / (g.breite * 0.38 + 25)) ** 2 < 1)) continue;
    if (amFluss(p)) continue;
    if (oasen.some(o => abstand(o, p) < mindest)) continue;
    oasen.push(p);
  }
  const oNamen = mischen(OASEN_NAMEN);
  oasen.forEach((o, i) => { o.name = oNamen[i] || NEUE_NAMEN[i - oNamen.length] || 'Ain ' + (i + 1); o.produziert = []; o.bev = Math.round(zwischen(250, 1150) / 50) * 50; });
  for (let i = 0; i < 2; i++) oasen[Math.floor(rnd() * oasen.length)].bev = Math.round(zwischen(1300, 1600) / 50) * 50;
  // Oasen nahe am großen Fluss sind fruchtbar
  for (const o of oasen) if (abstandZuLinie(o, fluesse[0].punkte) < 110) { o.bev = Math.max(o.bev, 700); o.produziert.push('datteln'); }

  // 5. Waren verteilen
  const reihenfolge = mischen(oasen);
  mischen([...GRUNDWAREN, ...GRUNDWAREN]).forEach((w, i) => { const o = reihenfolge[i % reihenfolge.length]; if (!o.produziert.includes(w)) o.produziert.push(w); });
  for (const o of oasen) {
    if (rnd() < 0.45 && !o.produziert.includes('wasser')) o.produziert.push('wasser');
    if (!o.produziert.length) o.produziert.push(rnd() < 0.5 ? 'datteln' : 'wasser');
    o.produziert = o.produziert.slice(0, 3);
    o.produziert.sort((a, b) => (a === 'wasser' ? -1 : 0) - (b === 'wasser' ? -1 : 0));
  }

  // 6. Startoase in der Mitte
  const mitte = { x: B * 0.46, y: H * 0.55 };
  const start = [...oasen].sort((a, b) => abstand(a, mitte) - abstand(b, mitte)).find(o => o.bev < 1300) || oasen[0];
  start.bev = Math.max(start.bev, 650);
  for (const w of ['wasser', 'salz']) if (!start.produziert.includes(w)) start.produziert.unshift(w);
  start.produziert = start.produziert.slice(0, 3);
  if (!start.produziert.includes('salz')) start.produziert[2] = 'salz';
  start.start = true;

  // 7. Zwei Hafenstädte an der Küste
  const hNamen = mischen(HAFEN_NAMEN);
  for (const [von, bis] of [[H * 0.15, H * 0.45], [H * 0.55, H * 0.85]]) {
    let hafen = null;
    for (let versuch = 0; versuch < 200 && !hafen; versuch++) {
      const y = Math.round(zwischen(von, bis)), p = { x: Math.round(kuesteX(y) - 45), y };
      if (oasen.every(o => abstand(o, p) > 170) && !amFluss(p)) hafen = p;
    }
    if (hafen) { Object.assign(hafen, { name: hNamen.pop(), produziert: ['wasser'], bev: 1400, hafen: true }); oasen.push(hafen); }
  }

  // 8. Salzpfanne bei einer Salz-Oase
  const salzOase = oasen.find(o => o.produziert.includes('salz') && !o.start && !o.hafen) || start;
  const salz = { x: salzOase.x + (rnd() < 0.5 ? -1 : 1) * 40, y: salzOase.y + 60, rx: 66, ry: 28 };

  return { nr, samen: nr, gebirge, sandmeere, salz, fluesse, oasen };
}

/* ---------------- C) Flüsse und Wadis ---------------- */
const FLUSS = {
  band: { fluss: 16, wadi: 11 },          // so nah heran gilt man als „am Wasser“
  tempo: { furt: 0.7, hochwasser: 0.35, schlamm: 0.6 },
  hochwasserVerlust: 0.25,                // Chance, beim Durchqueren im Hochwasser Ladung zu verlieren
};

function abstandZuLinie(p, punkte) {
  let min = Infinity;
  for (let i = 0; i < punkte.length - 1; i++) min = Math.min(min, abstandPunktStrecke(p, punkte[i], punkte[i + 1]));
  return min;
}

// Führt ein Fluss oder Wadi gerade Wasser? Flüsse immer; Wadis nicht im Hochsommer
function flussHatWasser(f) { return f.art === 'fluss' || jahreszeitIndex() !== 1; }
function hochwasser(f) { return f.art === 'fluss' && jahreszeitIndex() === 3; }
function flussTempo(f) {
  if (f.art === 'fluss') return hochwasser(f) ? FLUSS.tempo.hochwasser : FLUSS.tempo.furt;
  return jahreszeitIndex() === 3 ? FLUSS.tempo.schlamm : 1;
}
function flussBei(p) { return FLUESSE.find(f => abstandZuLinie(p, f.punkte) < FLUSS.band[f.art]) || null; }
function flussName(f) { return T(f.name, f.nameEn || f.name); }

// Jedes Bild für jede reisende Karawane: kommt sie an einen Fluss?
function flussPruefen(k) {
  if (!FLUESSE.length) return;
  const f = flussBei(k);
  if (!f) {
    if (k.flussBei && !FLUESSE.some(x => x.name === k.flussBei && abstandZuLinie(k, x.punkte) < FLUSS.band[x.art] + 14)) k.flussBei = null;
    return;
  }
  if (k.flussBei === f.name) return;
  k.flussBei = f.name;
  // Wasser auffüllen – so viel, wie für den Rest der Reise sinnvoll ist
  if (flussHatWasser(f)) {
    const ziel = oase(k.nach);
    const rest = Math.max(0, entfernung(oase(k.von), ziel) - k.gereist);
    const bedarf = Math.ceil(karawanenDurst(k) * rest / Math.max(1, reiseTempo(k)) * 1.8) + 2;
    const platz = kapazitaet(k) - ladungGewicht(k);
    const auffuellen = Math.max(0, Math.min(bedarf - k.ladung.wasser, platz));
    k.ladung.wasser += auffuellen;
    k.durstig = false;
    if (auffuellen >= 1) log(T(`🌊 ${k.name} erreicht den ${flussName(f)} und füllt ${Math.round(auffuellen)} Wasser auf.`,
                               `🌊 ${k.name} reaches the ${flussName(f)} and takes on ${Math.round(auffuellen)} water.`));
  }
  if (hochwasser(f)) {
    melden('🌊', T(`${k.name}: Der ${flussName(f)} führt Hochwasser – die Furt ist gefährlich!`, `${k.name}: the ${flussName(f)} is in flood – the ford is dangerous!`), 'schlecht', { karawane: k.id });
    if (Math.random() < FLUSS.hochwasserVerlust && typeof ladungVerlieren === 'function') {
      log(T(`🌊 Die Strömung des ${flussName(f)} reißt ${k.name} einen Teil der Ladung fort!`, `🌊 The current of the ${flussName(f)} sweeps away part of ${k.name}'s cargo!`), 'schlecht');
      ladungVerlieren(k);
    }
  }
}

// Täglich: Oasen an einem großen Fluss trocknen nicht aus
function flussTag() {
  if (!FLUESSE.length) return;
  for (const o of S.oasen) {
    if (!o.aktiv) continue;
    if (FLUESSE.some(f => f.art === 'fluss' && abstandZuLinie(o, f.punkte) < 110)) o.wasser = Math.min(100, o.wasser + 3);
  }
  // Beginn der Regenzeit: Warnung vor Hochwasser
  if (S.tag > 1 && jahreszeitIndex(S.tag) === 3 && jahreszeitIndex(S.tag - 1) !== 3 && FLUESSE.some(f => f.art === 'fluss')) {
    log(T('🌊 Die Flüsse schwellen an: Furten werden langsam und gefährlich, die Wadis füllen sich mit Wasser.',
          '🌊 The rivers are rising: fords become slow and dangerous, and the wadis fill with water.'), 'info');
  }
  if (S.tag > 1 && jahreszeitIndex(S.tag) === 1 && jahreszeitIndex(S.tag - 1) !== 1 && FLUESSE.some(f => f.art === 'wadi')) {
    log(T('🏜️ Die Wadis trocknen aus – dort gibt es bis zur Erntezeit kein Wasser mehr.', '🏜️ The wadis are drying up – no water there until the harvest season.'), 'info');
  }
}

// Jedes Bild: Wasser in den Wadis, Hochwasser und Glitzern auf den Flüssen
function zeichneFluesseLive(echtzeit) {
  const jz = jahreszeitIndex();
  for (const f of FLUESSE) {
    if (f.art === 'wadi') {
      if (jz === 1) continue;                                   // ausgetrocknet
      ctx.strokeStyle = jz === 3 ? 'rgba(88,160,170,.85)' : 'rgba(95,165,175,.6)';
      ctx.lineWidth = jz === 3 ? 5 : jz === 2 ? 1.6 : 2.6;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      flussPfad(ctx, f.punkte); ctx.stroke();
    } else if (jz === 3) {                                      // Hochwasser: breiter, trüber Strom
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [breite, farbe] of [[54, 'rgba(105,118,90,.34)'], [34, 'rgba(84,128,128,.62)'], [18, 'rgba(62,140,150,.92)']]) {
        ctx.strokeStyle = farbe; ctx.lineWidth = breite; flussPfad(ctx, f.punkte); ctx.stroke();
      }
    }
    if (f.art === 'fluss' || jz === 3) {                        // kleine, wandernde Lichtreflexe
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1;
      for (let i = 0; i < f.punkte.length - 1; i++) {
        const a = f.punkte[i], b = f.punkte[i + 1];
        for (let j = 0; j < 3; j++) {
          const t = (hash01(i * 3 + j, 71) + echtzeit * 0.03) % 1;
          const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
          if (Math.sin(echtzeit * 2 + i + j * 2) < 0.2) continue;
          ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.stroke();
        }
      }
    }
  }
}

function beschrifteFluesse() {
  for (const f of FLUESSE) {
    // Name an einer gut sichtbaren Stelle im Landesinneren
    const innen = f.punkte.filter(p => p.x > 40 && p.y > 40 && p.x < KARTE_B - 80 && p.y < KARTE_H - 40);
    const p = innen[Math.floor(innen.length / 2)] || f.punkte[1];
    if (!p) continue;
    beschriftung(flussName(f) + (hochwasser(f) ? T(' · Hochwasser', ' · in flood') : ''), p.x + 16, p.y - 14, f.art === 'fluss' ? 14 : 12, f.art === 'fluss' ? 'rgba(28,80,104,.85)' : 'rgba(92,70,40,.75)', true, null);
  }
}

/* ---------------- D) Gebirge ---------------- */
const GEBIRGE_WIRKUNG = { tempo: 0.6, durst: 0.8 };

function gebirgeBei(p) {
  return GEBIRGE.find(g => ((p.x - g.x) / (g.breite * 0.85)) ** 2 + ((p.y - g.y) / (g.breite * 0.4)) ** 2 < 1) || null;
}

/* ---------------- E) Reiseplanung ---------------- */
// Was liegt zwischen a und b? Liefert Zeit- und Durst-Faktor sowie Gebirge und Flüsse auf dem Weg.
function streckenInfo(a, b) {
  const laenge = entfernung(a, b);
  const n = Math.max(12, Math.ceil(laenge / 8));
  let zeit = 0, durst = 0;
  const gebirge = new Set(), fluesse = new Map();
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    let m = 1, d = 1;
    const g = gebirgeBei(p);
    if (g) { m *= GEBIRGE_WIRKUNG.tempo; d *= GEBIRGE_WIRKUNG.durst; gebirge.add(g.name); }
    const f = flussBei(p);
    if (f) { m *= flussTempo(f); fluesse.set(f.name, f); }
    if (inWanderduene(p)) m *= WANDERDUENE.tempo;
    zeit += 1 / m; durst += d / m;
  }
  return { zeit: zeit / n, durst: durst / Math.max(1e-9, zeit), gebirge: [...gebirge], fluesse: [...fluesse.values()] };
}

function htmlStreckenInfo(info) {
  let h = '';
  for (const name of info.gebirge) {
    h += `<div class="hinweis">⛰️ ${T(`Durch das ${name}-Gebirge: langsamer, aber kein Sandsturm und weniger Durst.`, `Through the ${name} mountains: slower, but no sandstorms and less thirst.`)}</div>`;
  }
  for (const f of info.fluesse) {
    const n = flussName(f);
    let text;
    if (hochwasser(f)) text = T(`🌊 Furt über den ${n}: <b>Hochwasser!</b> Sehr langsam, die Strömung kann Ladung mitreißen – aber Wasser gibt es reichlich.`, `🌊 Ford across the ${n}: <b>in flood!</b> Very slow, the current may sweep away cargo – but there is plenty of water.`);
    else if (f.art === 'fluss') text = T(`🌊 Furt über den ${n}: etwas langsamer, dafür kostenlos Wasser auffüllen.`, `🌊 Ford across the ${n}: a little slower, but free water.`);
    else if (flussHatWasser(f)) text = T(`💧 Über das ${n}: führt gerade Wasser – kostenlos auffüllen.`, `💧 Across the ${n}: carrying water right now – free refill.`);
    else text = T(`🏜️ Über das ${n}: ausgetrocknet, kein Wasser.`, `🏜️ Across the ${n}: dried up, no water.`);
    h += `<div class="hinweis">${text}</div>`;
  }
  return h;
}

/* ---------------- F) Karawanenpfade ---------------- */
// Ausgetretene Pfade verbinden jede Oase mit ihren nächsten Nachbarn
let pfadCache = { schluessel: '', pfade: [] };
function pfadeBerechnen() {
  const aktive = S.oasen.filter(o => o.aktiv);
  const schluessel = aktive.map(o => o.id).join(',');
  if (schluessel === pfadCache.schluessel) return pfadCache.pfade;
  const paare = new Map();
  for (const a of aktive) {
    const nahe = aktive.filter(b => b !== a).map(b => ({ b, d: entfernung(a, b) })).filter(x => x.d < 320).sort((x, y) => x.d - y.d).slice(0, 2);
    for (const { b } of nahe) {
      const k = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
      if (!paare.has(k)) paare.set(k, { a, b, bogen: (hash01(a.id * 31 + b.id, 5) - 0.5) * 0.18 });
    }
  }
  pfadCache = { schluessel, pfade: [...paare.values()] };
  return pfadCache.pfade;
}
function zeichnePfade() {
  if (!S || !S.oasen) return;
  const x0 = ansicht.x - 50, y0 = ansicht.y - 50, x1 = ansicht.x + KARTE_B / ansicht.zoom + 50, y1 = ansicht.y + KARTE_H / ansicht.zoom + 50;
  ctx.save(); ctx.lineCap = 'round';
  for (const p of pfadeBerechnen()) {
    const { a, b } = p;
    if (Math.max(a.x, b.x) < x0 || Math.min(a.x, b.x) > x1 || Math.max(a.y, b.y) < y0 || Math.min(a.y, b.y) > y1) continue;
    const mx = (a.x + b.x) / 2 - (b.y - a.y) * p.bogen, my = (a.y + b.y) / 2 + (b.x - a.x) * p.bogen;
    ctx.strokeStyle = 'rgba(150,108,62,.10)'; ctx.lineWidth = 4; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke();
    ctx.strokeStyle = 'rgba(115,78,40,.2)'; ctx.lineWidth = 0.9; ctx.setLineDash([2, 5]);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke();
  }
  ctx.setLineDash([]); ctx.restore();
}
