/* =====================================================================
   18. KARTE ZEICHNEN (Canvas)
   Alles auf der Karte wird mit Linien und Flächen gezeichnet – keine Bilddateien.
   Was sich nie ändert (Dünen, Berge, Meer), wird EINMAL in ein unsichtbares
   Canvas gemalt und danach nur noch kopiert. Das spart sehr viel Rechenzeit.
   ===================================================================== */

const canvas = document.getElementById('karte');
const ctx = canvas.getContext('2d');

// Auflösung passend zur angezeigten Größe: Auf großen, scharfen Bildschirmen bis zu doppelt
// so viele Pixel – auf dem Handy (Karte nur ~400 Pixel breit) reicht die einfache Auflösung.
const DPR = (() => {
  const breite = canvas.clientWidth || KARTE_B;
  const pixel = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  return Math.min(2, Math.max(1, Math.round(breite * pixel / KARTE_B * 4) / 4));
})();
canvas.width = KARTE_B * DPR;
canvas.height = KARTE_H * DPR;

const FARBE = {
  tinte:    '#2f2113',   // dunkles Braun für Schrift und Tiere
  sand:     '#e6c48c',
  messing:  '#c8a04a',
  indigo:   '#283463',
  henna:    '#b8452f',
  palme:    '#3f6e2f',
  palmeHell:'#6a9a43',
  wasser:   '#3aa3a6',
  lehm:     '#c4965e',
};

const SCHRIFT_KARTE = '"Amiri", Georgia, serif';

// Zufall mit festem Startwert: die Wüste sieht bei jedem Laden gleich aus
function zufallsFolge(start) {
  let s = start >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Feste "Zufallszahl" zwischen 0 und 1 für Nummer i (für Sandkörner, Sterne, Wellen …)
function hash01(i, salz = 0) {
  const x = Math.sin(i * 127.1 + salz * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function neuesCanvas(b, h) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(b * DPR); c.height = Math.ceil(h * DPR);
  const g = c.getContext('2d');
  g.scale(DPR, DPR);
  return [c, g];
}

/* ---------------------------------------------------------------------
   A) DAS GELÄNDE – wird einmal gemalt
   --------------------------------------------------------------------- */

// Wo beginnt das Meer? (x-Wert der Küste für eine bestimmte Höhe y)
function kuesteX(y) { return 1300 + 14 * Math.sin(y / 45) + 8 * Math.sin(y / 17); }

const GEBIRGE = [
  { name: 'Hoggar',  x: 255, y: 405, breite: 115, huegel: 11 },
  { name: 'Tibesti', x: 765, y: 300, breite: 95,  huegel: 7 },
  { name: 'Aïr',     x: 520, y: 455, breite: 55,  huegel: 4 },
];
const SALZPFANNE = { x: 215, y: 300, rx: 52, ry: 24 };

const [hintergrund, hg] = neuesCanvas(KARTE_B, KARTE_H);

(function maleGelaende() {
  const g = hg, rnd = zufallsFolge(1923);

  // 1. Grundfarbe: Licht kommt von links oben
  const grund = g.createLinearGradient(0, 0, KARTE_B, KARTE_H);
  grund.addColorStop(0, '#efd3a0');
  grund.addColorStop(0.55, '#e3bd83');
  grund.addColorStop(1, '#d4a46a');
  g.fillStyle = grund;
  g.fillRect(0, 0, KARTE_B, KARTE_H);

  // 2. Weiche helle und dunkle Flecken: ein winziges Rauschbild, stark vergrößert
  for (const [farbe, staerke] of [['150,95,45', 0.22], ['255,242,210', 0.28]]) {
    const [rausch, rg] = [document.createElement('canvas'), null];
    rausch.width = 54; rausch.height = 28;
    const r2 = rausch.getContext('2d');
    for (let x = 0; x < 54; x++) for (let y = 0; y < 28; y++) {
      r2.fillStyle = `rgba(${farbe},${(rnd() * staerke).toFixed(3)})`;
      r2.fillRect(x, y, 1, 1);
    }
    g.imageSmoothingEnabled = true;
    g.drawImage(rausch, 0, 0, KARTE_B, KARTE_H);
  }

  // 3. Feine Sandkörnung
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(120,75,35,.10)' : 'rgba(255,248,230,.16)';
    g.fillRect(rnd() * KARTE_B, rnd() * KARTE_H, 1, 1);
  }

  // 4. Salzpfanne bei Taoudenni: weißliche Kruste mit Rissen
  const sp = SALZPFANNE;
  const salz = g.createRadialGradient(sp.x, sp.y, 2, sp.x, sp.y, sp.rx);
  salz.addColorStop(0, 'rgba(250,246,236,.85)'); salz.addColorStop(1, 'rgba(250,246,236,0)');
  g.fillStyle = salz;
  g.beginPath(); g.ellipse(sp.x, sp.y, sp.rx, sp.ry, -0.2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(150,135,110,.35)'; g.lineWidth = 0.7;
  for (let i = 0; i < 26; i++) {
    let x = sp.x + (rnd() - 0.5) * sp.rx * 1.3, y = sp.y + (rnd() - 0.5) * sp.ry * 1.2;
    g.beginPath(); g.moveTo(x, y);
    for (let j = 0; j < 3; j++) { x += (rnd() - 0.5) * 14; y += (rnd() - 0.5) * 8; g.lineTo(x, y); }
    g.stroke();
  }

  // 5. Dünen in mehreren "Sandmeeren" (Ergs): lange, flache Kämme, die sich überlagern.
  //    Von oben nach unten gemalt, damit vordere Dünen die hinteren überdecken.
  const ergs = [[620, 150, 210], [930, 340, 200], [120, 120, 150], [720, 610, 230], [360, 650, 160], [1140, 130, 140], [1160, 640, 130]];
  const duenen = [];
  for (const [ex, ey, er] of ergs) {
    for (let i = 0; i < er / 5; i++) {
      const w = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * er;
      duenen.push({ x: ex + Math.cos(w) * d - 60, y: ey + Math.sin(w) * d * 0.55, l: 70 + rnd() * 150 });
    }
  }
  for (let i = 0; i < 45; i++) duenen.push({ x: rnd() * KARTE_B, y: rnd() * KARTE_H, l: 35 + rnd() * 70 });
  duenen.sort((a, b) => a.y - b.y);

  for (const d of duenen) {
    if (d.x + d.l > kuesteX(d.y) - 15) continue;   // keine Dünen im Meer
    const a = d.l * (0.05 + rnd() * 0.05);          // Höhe des Kamms: flach
    const neig = (rnd() - 0.5) * 0.5;               // schräg
    const welle = rnd() * 0.6;                      // geschwungener Kamm statt glattem Bogen
    const phase = rnd() * 6;
    const kamm = t => [d.x + d.l * t,
                       d.y - a * Math.sin(Math.PI * t) * (1 + welle * Math.sin(t * 9 + phase)) + neig * d.l * t];
    const schritte = 24;
    const hoehe = t => Math.pow(Math.sin(Math.PI * t), 0.7);

    // Schattenseite (vom Licht abgewandt): weich auslaufend
    let grad = g.createLinearGradient(0, d.y - a, 0, d.y + a * 2.2);
    grad.addColorStop(0, 'rgba(140,86,40,.30)'); grad.addColorStop(1, 'rgba(140,86,40,0)');
    g.fillStyle = grad;
    g.beginPath();
    for (let s = 0; s <= schritte; s++) { const [x, y] = kamm(s / schritte); s ? g.lineTo(x, y) : g.moveTo(x, y); }
    for (let s = schritte; s >= 0; s--) {
      const t = s / schritte, [x, y] = kamm(t);
      g.lineTo(x + a * 0.6 * hoehe(t), y + a * 2.2 * hoehe(t));
    }
    g.fill();

    // Sonnenseite: nur ein Hauch
    grad = g.createLinearGradient(0, d.y - a * 2.2, 0, d.y);
    grad.addColorStop(0, 'rgba(255,245,220,0)'); grad.addColorStop(1, 'rgba(255,245,220,.22)');
    g.fillStyle = grad;
    g.beginPath();
    for (let s = 0; s <= schritte; s++) { const [x, y] = kamm(s / schritte); s ? g.lineTo(x, y) : g.moveTo(x, y); }
    for (let s = schritte; s >= 0; s--) {
      const t = s / schritte, [x, y] = kamm(t);
      g.lineTo(x - a * 0.3, y - a * 1.1 * hoehe(t));
    }
    g.fill();

    // feiner, heller Grat
    g.strokeStyle = 'rgba(255,250,235,.38)'; g.lineWidth = 0.8;
    g.beginPath();
    for (let s = 3; s <= schritte - 3; s++) { const [x, y] = kamm(s / schritte); s > 3 ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }

  // 5b. Windrippel: feine, gewellte Linien im Sand, die der Wind formt
  g.lineWidth = 0.6;
  for (const [ex, ey, er] of ergs) {
    for (let i = 0; i < er * 0.9; i++) {
      const w = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * er * 1.1;
      const x = ex + Math.cos(w) * d - 40, y = ey + Math.sin(w) * d * 0.6;
      if (x > kuesteX(y) - 25) continue;
      const l = 10 + rnd() * 18;
      g.strokeStyle = rnd() < 0.5 ? 'rgba(140,90,45,.14)' : 'rgba(255,246,222,.22)';
      g.beginPath(); g.moveTo(x, y);
      g.bezierCurveTo(x + l * 0.3, y - 1.6, x + l * 0.6, y + 1.6, x + l, y - 0.4 + (rnd() - 0.5));
      g.stroke();
    }
  }

  // 6. Gebirge: viele runde Felskuppen aus dunklem Gestein, Licht von links, Schraffur rechts
  for (const geb of GEBIRGE) {
    const kuppen = [];
    for (let i = 0; i < geb.huegel * 2; i++) {
      const w = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
      kuppen.push({ x: geb.x + Math.cos(w) * d * geb.breite * 0.8, y: geb.y + Math.sin(w) * d * geb.breite * 0.3,
                    s: 7 + rnd() * 11 * (1.2 - d * 0.5) });
    }
    kuppen.sort((a, b) => a.y - b.y);
    for (const k of kuppen) {
      const h = k.s * (0.55 + rnd() * 0.35), versatz = (rnd() - 0.5) * k.s * 0.5;
      const umriss = () => {
        g.beginPath();
        g.moveTo(k.x - k.s, k.y);
        g.bezierCurveTo(k.x - k.s * 0.7, k.y - h * 0.9, k.x + versatz - k.s * 0.35, k.y - h * 1.15, k.x + versatz, k.y - h);
        g.bezierCurveTo(k.x + versatz + k.s * 0.4, k.y - h * 0.9, k.x + k.s * 0.8, k.y - h * 0.5, k.x + k.s * 1.1, k.y);
        g.closePath();
      };
      g.fillStyle = 'rgba(60,32,15,.22)';
      g.beginPath(); g.ellipse(k.x + k.s * 0.45, k.y + 1.5, k.s * 1.15, k.s * 0.22, 0, 0, Math.PI * 2); g.fill();
      const fels = g.createLinearGradient(k.x - k.s, 0, k.x + k.s, 0);
      fels.addColorStop(0, '#b8865a'); fels.addColorStop(0.45, '#97633d'); fels.addColorStop(1, '#5e3a22');
      g.fillStyle = fels; umriss(); g.fill();
      g.save(); umriss(); g.clip();                 // Schraffur nur innerhalb der Kuppe
      g.strokeStyle = 'rgba(45,25,12,.32)'; g.lineWidth = 0.7;
      for (let j = 0; j < 7; j++) {
        const x = k.x + versatz + j * k.s * 0.17;
        g.beginPath(); g.moveTo(x, k.y - h * 1.1); g.lineTo(x + k.s * 0.25, k.y); g.stroke();
      }
      g.restore();
      g.strokeStyle = 'rgba(255,235,200,.45)'; g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(k.x - k.s * 0.9, k.y - h * 0.2);
      g.bezierCurveTo(k.x - k.s * 0.7, k.y - h * 0.9, k.x + versatz - k.s * 0.35, k.y - h * 1.15, k.x + versatz, k.y - h); g.stroke();
    }
  }

  // 7. Verstreute Steine
  for (let i = 0; i < 260; i++) {
    const x = rnd() * KARTE_B, y = rnd() * KARTE_H;
    if (x > kuesteX(y) - 8) continue;
    const r = 0.6 + rnd() * 1.8;
    g.fillStyle = 'rgba(95,60,30,.35)';
    g.beginPath(); g.ellipse(x, y, r * 1.3, r, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,240,215,.35)';
    g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.3, r * 0.6, r * 0.45, 0, 0, Math.PI * 2); g.fill();
  }

  // 8. Das Rote Meer: flaches Türkis an der Küste, tiefes Blau draußen
  const kuestenLinie = (versatz) => {
    g.beginPath(); g.moveTo(KARTE_B + 5, -5);
    for (let y = -5; y <= KARTE_H + 5; y += 4) g.lineTo(kuesteX(y) + versatz, y);
    g.lineTo(KARTE_B + 5, KARTE_H + 5); g.closePath();
  };
  g.fillStyle = '#f2dcae'; kuestenLinie(-5); g.fill();           // heller Strand
  g.fillStyle = '#6cc2bd'; kuestenLinie(0); g.fill();            // flaches Wasser
  const tief = g.createLinearGradient(1300, 0, KARTE_B, 0);
  tief.addColorStop(0, 'rgba(31,95,134,0)'); tief.addColorStop(0.35, 'rgba(31,95,134,.85)'); tief.addColorStop(1, '#1b4f75');
  g.fillStyle = tief; kuestenLinie(6); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.4;     // Schaumlinie
  g.beginPath();
  for (let y = 0; y <= KARTE_H; y += 4) y ? g.lineTo(kuesteX(y) + 2.5, y) : g.moveTo(kuesteX(y) + 2.5, y);
  g.stroke();

  // 9. Windrose oben links, in Messing – mit Gradring, 16 Spitzen und „N“
  const [rx, ry] = [70, 72];
  g.save(); g.translate(rx, ry);
  g.fillStyle = 'rgba(246,232,200,.35)';
  g.beginPath(); g.arc(0, 0, 38, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(120,85,35,.7)'; g.lineWidth = 1.2;
  g.beginPath(); g.arc(0, 0, 38, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 0.7;
  g.beginPath(); g.arc(0, 0, 33, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 64; i++) {                       // Gradstriche zwischen den Ringen
    const w = i / 64 * Math.PI * 2, l = i % 4 === 0 ? 5 : 2.5;
    g.beginPath(); g.moveTo(Math.cos(w) * 33, Math.sin(w) * 33); g.lineTo(Math.cos(w) * (33 + l), Math.sin(w) * (33 + l)); g.stroke();
  }
  for (const [n, lang, breit] of [[16, 16, 2.2], [8, 24, 3.2], [4, 40, 5]]) {
    for (let i = 0; i < n; i++) {
      g.save(); g.rotate(i / n * Math.PI * 2 + (n === 8 ? Math.PI / 8 * 0 + Math.PI / 4 : n === 16 ? Math.PI / 16 : 0));
      g.fillStyle = n === 4 ? 'rgba(150,104,36,.95)' : 'rgba(120,85,35,.8)';
      g.beginPath(); g.moveTo(0, -lang); g.lineTo(breit, 0); g.lineTo(0, breit); g.closePath(); g.fill();
      g.fillStyle = n === 4 ? 'rgba(240,214,150,.95)' : 'rgba(225,195,130,.85)';
      g.beginPath(); g.moveTo(0, -lang); g.lineTo(-breit, 0); g.lineTo(0, breit); g.closePath(); g.fill();
      g.restore();
    }
  }
  g.fillStyle = 'rgba(92,60,24,.95)'; g.beginPath(); g.arc(0, 0, 2.6, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(92,60,24,.9)'; g.font = `700 13px ${SCHRIFT_KARTE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('N', 0, -48);
  g.restore();

  // 10. Dunkler Rand wie bei einer alten, gealterten Karte
  const rand = g.createRadialGradient(KARTE_B / 2, KARTE_H / 2, KARTE_H * 0.45, KARTE_B / 2, KARTE_H / 2, KARTE_B * 0.72);
  rand.addColorStop(0, 'rgba(60,35,15,0)'); rand.addColorStop(1, 'rgba(60,35,15,.32)');
  g.fillStyle = rand;
  g.fillRect(0, 0, KARTE_B, KARTE_H);
})();

/* ---------------------------------------------------------------------
   B) OASEN – jede Oase wird als kleines Bild gemalt und zwischengespeichert.
      Neu gemalt wird sie nur, wenn sich Wasserstand oder Größe merklich ändern.
   --------------------------------------------------------------------- */

const OASE_B = 170, OASE_H = 120;   // Größe des Oasen-Bildchens
const oasenBilder = new Map();

function oasenRadius(o) { return o.aktiv ? Math.min(34, 18 + o.bev / 110) : 18; }

function zeichnePalme(g, x, y, hoehe, neigung, rnd, tot = false) {
  g.fillStyle = 'rgba(60,35,15,.22)';
  g.beginPath(); g.ellipse(x + hoehe * 0.35, y + 1, hoehe * 0.45, 1.8, 0, 0, Math.PI * 2); g.fill();
  const kx = x + neigung * hoehe, ky = y - hoehe;
  g.strokeStyle = tot ? '#7d6a55' : '#6b4a2b'; g.lineWidth = 2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + neigung * hoehe * 0.2, y - hoehe * 0.6, kx, tot ? y - hoehe * 0.6 : ky); g.stroke();
  if (tot) return;
  // Palmwedel: gebogene Blätter in zwei Grüntönen
  const anzahl = 7;
  for (let i = 0; i < anzahl; i++) {
    const w = (i / anzahl) * Math.PI * 2 + rnd() * 0.4;
    const l = 7 + rnd() * 4;
    const ex = kx + Math.cos(w) * l, ey = ky + Math.sin(w) * l * 0.55 + 3;
    g.strokeStyle = i % 2 ? FARBE.palme : FARBE.palmeHell;
    g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(kx, ky);
    g.quadraticCurveTo(kx + Math.cos(w) * l * 0.6, ky + Math.sin(w) * l * 0.3 - 3, ex, ey);
    g.stroke();
  }
  g.fillStyle = '#5a3a1e';
  g.beginPath(); g.arc(kx, ky + 1, 1.5, 0, Math.PI * 2); g.fill();   // Datteln
}

// Ein Lehmhaus als kleiner Würfel: Dach hell, Vorderseite mittel, Seite dunkel
function zeichneHaus(g, x, y, b, h, fenster, verfallen = false) {
  const tiefe = b * 0.45;
  g.fillStyle = verfallen ? '#b8a68c' : '#a37443';   // Seite
  g.beginPath(); g.moveTo(x + b, y); g.lineTo(x + b + tiefe * 0.6, y - tiefe * 0.5); g.lineTo(x + b + tiefe * 0.6, y - h - tiefe * 0.5); g.lineTo(x + b, y - h); g.closePath(); g.fill();
  g.fillStyle = verfallen ? '#cbbba2' : FARBE.lehm;  // Vorderseite
  if (verfallen) {
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + b, y); g.lineTo(x + b, y - h * 0.5); g.lineTo(x + b * 0.6, y - h); g.lineTo(x, y - h * 0.7); g.closePath(); g.fill();
    return;
  }
  g.fillRect(x, y - h, b, h);
  g.fillStyle = '#ebcf9f';                           // flaches Dach
  g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + b, y - h); g.lineTo(x + b + tiefe * 0.6, y - h - tiefe * 0.5); g.lineTo(x + tiefe * 0.6, y - h - tiefe * 0.5); g.closePath(); g.fill();
  g.fillStyle = '#5b3a1f';                           // Tür
  g.fillRect(x + b * 0.4, y - h * 0.55, b * 0.22, h * 0.55);
  fenster.push({ x: x + b * 0.51, y: y - h * 0.3 });
}

function zeichneMoschee(g, x, y, fenster) {
  zeichneHaus(g, x, y, 13, 9, fenster);
  g.fillStyle = '#ebcf9f';
  g.beginPath(); g.arc(x + 7.5, y - 10.5, 4.5, Math.PI, 0); g.fill();   // Kuppel
  g.fillStyle = '#d9b27a';
  g.fillRect(x - 4, y - 22, 4, 22);                                    // Minarett
  g.fillStyle = '#ebcf9f';
  g.fillRect(x - 5, y - 23, 6, 2);
  fenster.push({ x: x - 2, y: y - 18 });
}

// Nomadenzelt (für kleine Weiler): dunkles Ziegenhaar, helle Öffnung
function zeltKlein(g, x, y, s) {
  g.fillStyle = 'rgba(60,35,15,.22)'; g.beginPath(); g.ellipse(x + s * 0.3, y + 0.8, s * 1.1, 1.6, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#5b4232'; g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s * 0.4, y - s * 0.9, x, y - s * 0.95);
  g.quadraticCurveTo(x + s * 0.5, y - s * 0.9, x + s, y); g.closePath(); g.fill();
  g.fillStyle = '#7a5c44'; g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s * 0.4, y - s * 0.9, x, y - s * 0.95); g.lineTo(x - s * 0.2, y); g.closePath(); g.fill();
  g.fillStyle = '#d9b47c'; g.beginPath(); g.moveTo(x + s * 0.1, y); g.lineTo(x + s * 0.35, y - s * 0.55); g.lineTo(x + s * 0.6, y); g.closePath(); g.fill();
}

// Bewässerter Garten: Beete in Streifen, leicht schräg wie die übrige Karte
function zeichneGarten(g, x, y, b, h, rnd) {
  g.fillStyle = '#6f5a36'; g.fillRect(x - 0.6, y - 0.6, b + 1.2, h + 1.2);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i % 2 ? '#7fa64a' : '#5f8a3a';
    g.fillRect(x, y + i * h / 4, b, h / 4 - 0.4);
  }
  g.fillStyle = 'rgba(80,170,190,.8)'; g.fillRect(x - 0.6, y + h, b + 1.2, 0.8);   // Bewässerungsgraben
}

// Marktstand mit gestreiftem Sonnendach
function zeichneMarktstand(g, x, y, farbe) {
  g.fillStyle = '#7a5532'; g.fillRect(x - 3.4, y - 4, 0.7, 4); g.fillRect(x + 2.8, y - 4, 0.7, 4);
  g.fillStyle = '#c9a26a'; g.fillRect(x - 3, y - 1.6, 6, 1.6);                         // Ware auf dem Tisch
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#f3e6cc' : farbe; g.fillRect(x - 3.8 + i * 1.95, y - 6, 1.95, 2.2); }
}

// Stadtmauer um große Städte: Bogen hinter der Stadt mit Zinnen und Ecktürmen
function zeichneStadtmauer(g, cx, cy, rx, ry, vorne) {
  const von = vorne ? 0.08 : Math.PI + 0.08, bis = vorne ? Math.PI - 0.08 : Math.PI * 2 - 0.08;
  g.strokeStyle = '#b48a55'; g.lineWidth = 3.2; g.lineCap = 'butt';
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, von, bis); g.stroke();
  g.strokeStyle = '#d8b27a'; g.lineWidth = 1.2;
  g.beginPath(); g.ellipse(cx, cy - 1.6, rx, ry, 0, von, bis); g.stroke();
  g.fillStyle = '#c99f68';
  for (let w = von; w <= bis; w += 0.16) {                        // Zinnen
    g.fillRect(cx + Math.cos(w) * rx - 0.8, cy + Math.sin(w) * ry - 3.6, 1.6, 1.6);
  }
  for (const w of [von, (von + bis) / 2, bis]) {                  // Türme
    const tx = cx + Math.cos(w) * rx, ty = cy + Math.sin(w) * ry;
    g.fillStyle = '#a77d4a'; g.fillRect(tx - 2.6, ty - 7, 5.2, 7.5);
    g.fillStyle = '#e2c08a'; g.fillRect(tx - 3.2, ty - 8, 6.4, 1.6);
  }
}

// Dein Lagerhaus: großes Haus mit Indigo-Fahne – größer mit jeder Ausbaustufe
function zeichneLagerhaus(g, x, y, stufe, fenster) {
  zeichneHaus(g, x, y, 11 + stufe * 2, 7 + stufe, fenster);
  g.strokeStyle = '#5b3a1f'; g.lineWidth = 0.8;
  g.beginPath(); g.moveTo(x + 2, y - 7 - stufe); g.lineTo(x + 2, y - 17 - stufe); g.stroke();
  g.fillStyle = FARBE.indigo; g.beginPath(); g.moveTo(x + 2, y - 17 - stufe); g.lineTo(x + 9, y - 15.5 - stufe); g.lineTo(x + 2, y - 13.5 - stufe); g.fill();
  g.fillStyle = FARBE.messing; g.fillRect(x + 2, y - 15.9 - stufe, 5, 0.6);
}

function oasenBild(o) {
  const wasserStufe = Math.round(Math.max(0, o.wasser) / 10);
  const haeuser = Math.max(1, Math.min(14, Math.round(o.bev / 200)));
  // Größenstufe: 0 Weiler, 1 Dorf, 2 Stadt, 3 große Stadt
  const groesse = o.bev < 250 ? 0 : o.bev < 700 ? 1 : o.bev < 1400 ? 2 : 3;
  const lagerhaus = S.gebaeude && S.gebaeude[o.id] ? (S.gebaeude[o.id].stufe || 1) : 0;
  const schluessel = `${o.id}|${o.aktiv}|${wasserStufe}|${haeuser}|${o.brunnen || 0}|${groesse}|${lagerhaus}`;
  let bild = oasenBilder.get(schluessel);
  if (bild) return bild;
  if (oasenBilder.size > 300) oasenBilder.clear();

  const [c, g] = neuesCanvas(OASE_B, OASE_H);
  const rnd = zufallsFolge(o.id * 7919 + 17);
  const cx = OASE_B / 2, cy = OASE_H / 2 + 4;
  const fenster = [];
  const w = wasserStufe / 10;

  if (o.aktiv) {
    // grüner Gürtel um das Wasser
    const gr = (26 + Math.min(20, o.bev / 70)) * (0.65 + 0.35 * Math.min(1, w * 1.6));
    const gruen = g.createRadialGradient(cx, cy, 4, cx, cy, gr);
    const satt = Math.min(1, w * 1.5);                                  // wenig Wasser → gelblich-braun
    const r1 = Math.round(150 - 58 * satt), g1 = Math.round(130 + 5 * satt), b1 = Math.round(60 - 2 * satt);
    gruen.addColorStop(0, `rgba(${r1},${g1},${b1},.75)`); gruen.addColorStop(0.7, `rgba(${r1 + 18},${g1 + 5},${b1},.35)`); gruen.addColorStop(1, `rgba(${r1 + 18},${g1 + 5},${b1},0)`);
    g.fillStyle = gruen;
    g.beginPath(); g.ellipse(cx, cy, gr * 1.2, gr * 0.75, 0, 0, Math.PI * 2); g.fill();
    // nasser, dunkler Uferrand – zeigt, wie viel Wasser fehlt
    const rxVoll = 20, rx = 5 + 15 * w;
    g.fillStyle = 'rgba(120,90,50,.35)';
    g.beginPath(); g.ellipse(cx, cy, rxVoll + 2, (rxVoll + 2) * 0.5, 0, 0, Math.PI * 2); g.fill();
    // der Teich
    const teich = g.createRadialGradient(cx - 3, cy - 2, 1, cx, cy, rx);
    teich.addColorStop(0, '#1e7586'); teich.addColorStop(1, '#4cbcb4');
    g.fillStyle = teich;
    g.beginPath(); g.ellipse(cx, cy, rx, rx * 0.5, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(cx, cy, rx * 0.8, rx * 0.36, 0, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
    // Bei wenig Wasser: rissiger Schlamm am Ufer
    if (w < 0.3) {
      g.strokeStyle = 'rgba(95,70,40,.55)'; g.lineWidth = 0.6;
      for (let i = 0; i < 8; i++) {
        const a = rnd() * Math.PI * 2; let x = cx + Math.cos(a) * (rx + 3), y = cy + Math.sin(a) * (rx + 3) * 0.5;
        g.beginPath(); g.moveTo(x, y);
        for (let j = 0; j < 3; j++) { x += (rnd() - 0.5) * 6; y += (rnd() - 0.5) * 3; g.lineTo(x, y); }
        g.stroke();
      }
    }
    if (groesse === 3) zeichneStadtmauer(g, cx, cy + 2, 58, 32, false);   // hintere Hälfte der Mauer
    // Brunnen (gebaut vom Spieler): kleine runde Steinmauer
    for (let i = 0; i < (o.brunnen || 0); i++) {
      const bx = cx - 26 + i * 9, by = cy + 13;
      g.fillStyle = '#9b8f80'; g.beginPath(); g.ellipse(bx, by, 3.5, 2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2c4f5a'; g.beginPath(); g.ellipse(bx, by - 0.3, 2, 1, 0, 0, Math.PI * 2); g.fill();
    }

    // Häuser rechts/unten, Palmen links/oben – nach Höhe sortiert für die richtige Überdeckung
    const dinge = [];
    for (let i = 0; i < haeuser; i++) {
      const winkel = -0.5 + (i / Math.max(1, haeuser - 1)) * 2.3 + (rnd() - 0.5) * 0.3;
      const abst = 26 + rnd() * 12 + (i % 3) * 5;
      dinge.push({ art: i === 0 && o.bev > 900 ? 'moschee' : 'haus', x: cx + Math.cos(winkel) * abst, y: cy + Math.sin(winkel) * abst * 0.55 + 4,
                   b: 7 + rnd() * 4, h: 5 + rnd() * 3 });
    }
    const palmen = Math.max(3, Math.min(9, 3 + Math.round(o.bev / 300))) + Math.round(w * 2);
    const totAnteil = w < 0.35 ? (0.35 - w) / 0.35 * 0.6 : 0;          // Trockenheit: ein Teil der Palmen verdorrt
    for (let i = 0; i < palmen; i++) {
      const winkel = Math.PI * 0.75 + (i / palmen) * Math.PI * 1.3 + (rnd() - 0.5) * 0.4;
      const abst = 20 + rnd() * 10;
      dinge.push({ art: 'palme', x: cx + Math.cos(winkel) * abst, y: cy + Math.sin(winkel) * abst * 0.55 + 2,
                   hoehe: 12 + rnd() * 7, neigung: (rnd() - 0.5) * 0.5, tot: rnd() < totAnteil });
    }
    // Weiler: Nomadenzelte am Rand
    if (groesse === 0) for (let i = 0; i < 3; i++) {
      const winkel = 0.1 + i * 0.75 + rnd() * 0.3;
      dinge.push({ art: 'zelt', x: cx + Math.cos(winkel) * 36, y: cy + Math.sin(winkel) * 20 + 4, s: 4.5 + rnd() * 1.5 });
    }
    // Ab dem Dorf und mit genug Wasser: Gärten
    if (groesse >= 1 && w > 0.45) for (let i = 0; i < Math.min(4, groesse + 1); i++) {
      const winkel = 2.35 + i * 0.32;
      dinge.push({ art: 'garten', x: cx + Math.cos(winkel) * (44 + (i % 2) * 6), y: cy + Math.sin(winkel) * 24 + 6, b: 11 + rnd() * 3, h: 5 + rnd() * 2 });
    }
    // Ab der Stadt: Marktstände am Ufer
    if (groesse >= 2) for (let i = 0; i < groesse + 1; i++) {
      dinge.push({ art: 'markt', x: cx - 10 + i * 8, y: cy + 15 + (i % 2) * 2, farbe: ['#b8452f', '#283463', '#3f6e2f', '#c8a04a'][i % 4] });
    }
    // Dein Lagerhaus
    if (lagerhaus) dinge.push({ art: 'lagerhaus', x: cx - 44, y: cy + 16, stufe: lagerhaus });
    dinge.sort((a, b) => a.y - b.y);
    for (const d of dinge) {
      if (d.art === 'palme') zeichnePalme(g, d.x, d.y, d.hoehe, d.neigung, rnd, d.tot);
      else if (d.art === 'moschee') zeichneMoschee(g, d.x - 6, d.y, fenster);
      else if (d.art === 'zelt') zeltKlein(g, d.x, d.y, d.s);
      else if (d.art === 'garten') zeichneGarten(g, d.x - d.b / 2, d.y - d.h, d.b, d.h, rnd);
      else if (d.art === 'markt') zeichneMarktstand(g, d.x, d.y, d.farbe);
      else if (d.art === 'lagerhaus') zeichneLagerhaus(g, d.x, d.y, d.stufe, fenster);
      else zeichneHaus(g, d.x - d.b / 2, d.y, d.b, d.h, fenster);
    }
    if (groesse === 3) zeichneStadtmauer(g, cx, cy + 2, 58, 32, true);    // vordere Hälfte der Mauer
    // Hafen: Bootssteg ins Meer
    if (o.hafen) {
      g.fillStyle = '#7a5532';
      g.fillRect(cx + 30, cy - 2, 44, 4);
      g.fillStyle = '#5b3d22';
      for (let i = 0; i < 5; i++) g.fillRect(cx + 32 + i * 10, cy + 2, 1.5, 4);
    }
  } else {
    // Versiegt: rissiger, trockener Boden, tote Palmen, verfallene Mauern
    g.fillStyle = 'rgba(205,184,145,.9)';
    g.beginPath(); g.ellipse(cx, cy, 22, 11, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(110,85,55,.55)'; g.lineWidth = 0.7;
    for (let i = 0; i < 9; i++) {
      let x = cx + (rnd() - 0.5) * 30, y = cy + (rnd() - 0.5) * 14;
      g.beginPath(); g.moveTo(x, y);
      for (let j = 0; j < 3; j++) { x += (rnd() - 0.5) * 10; y += (rnd() - 0.5) * 5; g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 3; i++) zeichnePalme(g, cx - 24 + i * 9, cy - 6 + (i % 2) * 6, 10 + rnd() * 4, (rnd() - 0.5) * 0.6, rnd, true);
    for (let i = 0; i < 3; i++) zeichneHaus(g, cx + 12 + i * 9, cy + 6 - (i % 2) * 7, 8, 6, [], true);
  }

  bild = { canvas: c, fenster: fenster.map(f => ({ x: f.x - cx, y: f.y - cy })) };
  oasenBilder.set(schluessel, bild);
  return bild;
}

/* ---------------------------------------------------------------------
   C) TIERE – kleine bemalte Figuren, die beim Laufen die Beine bewegen
      (Koordinaten: Blick nach rechts, Boden bei y = 0, ca. 14 Einheiten lang)
   --------------------------------------------------------------------- */

// Eigene Uhr für Bewegungen: läuft in Echtzeit (auch bei 60 Sekunden pro Spieltag
// bewegen sich die Beine flüssig), steht aber in der Pause still.
let laufUhr = 0;
function laufUhrWeiter(dtSek) { laufUhr += dtSek * (0.75 + 0.25 * Math.min(S.tempo, 5)); }

// Natürliche Fellfarben: Grundton, Schatten (ferne Beine, Bauch), Licht (Rücken)
const TIER_FARBEN = {
  kamel:   { grund: '#b98149', schatten: '#7c5127', licht: '#dcae73' },
  pferd:   { grund: '#7d4b2a', schatten: '#4b2a15', licht: '#a8703f' },
  esel:    { grund: '#918679', schatten: '#5e554b', licht: '#bdb3a6' },
  elefant: { grund: '#8a847e', schatten: '#5c5752', licht: '#b0aaa3' },
};

// Ein Bein mit Knie: schwingt vor und zurück und hebt den Huf beim Vorschwingen
function bein(g, x, y, laenge, phase, dicke, farbe) {
  const schwung = Math.sin(phase), heben = Math.max(0, Math.cos(phase)) * laenge * 0.18;
  const kx = x + schwung * laenge * 0.16, ky = y + laenge * 0.5;
  const fx = x + schwung * laenge * 0.34, fy = y + laenge - heben;
  g.strokeStyle = farbe; g.lineWidth = dicke; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
}

// Vier Beine: die hinteren (fernen) dunkler, damit die Figur Tiefe bekommt
function vierBeine(g, f, xs, y, laenge, schritt, dicke, vorne) {
  xs.forEach((x, i) => {
    const fern = i % 2 === 1;
    if (fern === vorne) return;
    const phase = schritt + (i < 2 ? 0 : Math.PI) + (fern ? Math.PI : 0);
    bein(g, x, y, laenge, phase, dicke, fern ? f.schatten : f.grund);
  });
}

// Reiter mit indigo Turban (Tuareg) – sitzt auf dem vordersten Tier
function reiter(g, x, y, decke) {
  g.fillStyle = decke;
  g.beginPath(); g.moveTo(x - 2.2, y); g.lineTo(x + 2.2, y); g.lineTo(x + 1.2, y - 4.6); g.lineTo(x - 1.2, y - 4.6); g.closePath(); g.fill();
  g.fillStyle = '#6b4a2e'; g.beginPath(); g.arc(x + 0.3, y - 5.6, 1.25, 0, Math.PI * 2); g.fill();       // Gesicht
  g.fillStyle = '#1f2a55'; g.beginPath(); g.arc(x, y - 6.2, 1.45, Math.PI * 0.95, Math.PI * 2.1); g.fill(); // Turban
  g.fillRect(x - 1.5, y - 6.3, 2.4, 1.2);
}

// Gepäck: zwei Bündel über dem Rücken, in Teppich- und Stofffarben
function gepaeck(g, x, y, breite, nr) {
  const farben = [['#9b3b2a', '#d9a441'], ['#355e8a', '#e2c27a'], ['#6e7d3a', '#c98a3a']][nr % 3];
  g.fillStyle = farben[0]; g.beginPath(); g.roundRect ? g.roundRect(x - breite / 2, y - 3.2, breite * 0.48, 4.2, 1.2) : g.rect(x - breite / 2, y - 3.2, breite * 0.48, 4.2); g.fill();
  g.fillStyle = farben[1]; g.beginPath(); g.roundRect ? g.roundRect(x + 0.2, y - 3.6, breite * 0.48, 4.6, 1.2) : g.rect(x + 0.2, y - 3.6, breite * 0.48, 4.6); g.fill();
  g.strokeStyle = 'rgba(40,25,10,.55)'; g.lineWidth = 0.5;
  g.beginPath(); g.moveTo(x - breite / 2 + 1, y - 1.2); g.lineTo(x + breite / 2 - 0.5, y - 1.2); g.stroke();
}

// opt: { schritt, decke, reiter: true/false, last: Nummer oder -1 }
function zeichneTier(g, typ, opt) {
  const f = opt.farben || TIER_FARBEN[typ], schritt = opt.schritt;   // opt.farben: z. B. Scherenschnitt auf der Startseite
  if (typ === 'kamel') {
    const nicken = Math.sin(schritt * 2) * 0.6;
    vierBeine(g, f, [-4.2, -2.8, 3, 4.4], -7.5, 7.5, schritt, 1.25, false);
    g.fillStyle = f.grund;
    g.beginPath(); g.ellipse(0, -8.8, 6.2, 3, 0, 0, Math.PI * 2); g.fill();                    // Körper
    g.beginPath(); g.ellipse(-0.6, -11.2, 3.3, 2.6, 0, Math.PI, 0); g.fill();                 // Höcker
    g.fillStyle = f.licht;
    g.beginPath(); g.ellipse(-0.8, -12.4, 2.2, 1, 0, Math.PI, 0); g.fill();                   // Licht auf dem Höcker
    g.strokeStyle = f.grund; g.lineWidth = 2.3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(5, -9.3); g.quadraticCurveTo(8.6, -10, 8.4, -15 + nicken); g.stroke();   // Hals
    g.fillStyle = f.grund;
    g.beginPath(); g.ellipse(10, -15.4 + nicken, 2.6, 1.35, 0.2, 0, Math.PI * 2); g.fill();     // Kopf
    g.fillStyle = f.schatten; g.beginPath(); g.arc(9.7, -16 + nicken, 0.35, 0, Math.PI * 2); g.fill();  // Auge
    g.strokeStyle = f.schatten; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(-6.1, -9.4); g.quadraticCurveTo(-7.4, -7.5, -6.8, -5.6); g.stroke();  // Schwanz
    g.fillStyle = f.schatten; g.globalAlpha = 0.35;
    g.beginPath(); g.ellipse(0.3, -7.2, 5.2, 1.3, 0, 0, Math.PI); g.fill(); g.globalAlpha = 1;  // Bauch im Schatten
    vierBeine(g, f, [-4.2, -2.8, 3, 4.4], -7.5, 7.5, schritt, 1.35, true);
    if (opt.decke) { g.fillStyle = opt.decke; g.fillRect(-3.8, -11.6, 6.2, 3.4); g.fillStyle = FARBE.messing; g.fillRect(-3.8, -8.6, 6.2, 0.7); }
    if (opt.last >= 0) gepaeck(g, -0.8, -12.6, 7, opt.last);
    if (opt.reiter) reiter(g, 0.4, -13.6, opt.decke || FARBE.indigo);
  } else if (typ === 'pferd') {
    vierBeine(g, f, [-3.8, -2.5, 3, 4.2], -7.2, 7.2, schritt * 1.2, 1.15, false);
    g.fillStyle = f.grund;
    g.beginPath(); g.ellipse(0, -8.6, 5.6, 2.6, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = f.grund; g.lineWidth = 2.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(4, -9.6); g.lineTo(6.4, -13.6); g.stroke();
    g.beginPath(); g.ellipse(7.9, -13.3, 2.7, 1.25, 0.5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = f.schatten; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(4.2, -10.4); g.lineTo(6.2, -14.4); g.stroke();                     // Mähne
    g.lineWidth = 1.4; g.beginPath(); g.moveTo(-5.4, -9.4); g.quadraticCurveTo(-8, -8, -7.4, -4.6); g.stroke();  // Schweif
    g.fillStyle = f.licht; g.beginPath(); g.ellipse(-0.5, -10.4, 3.4, 0.7, 0, 0, Math.PI * 2); g.fill();
    vierBeine(g, f, [-3.8, -2.5, 3, 4.2], -7.2, 7.2, schritt * 1.2, 1.25, true);
    if (opt.decke) { g.fillStyle = opt.decke; g.fillRect(-2.6, -11.6, 4.6, 3); }
    if (opt.last >= 0) gepaeck(g, -0.4, -11.2, 5.5, opt.last);
    if (opt.reiter) reiter(g, -0.2, -11.2, opt.decke || FARBE.indigo);
  } else if (typ === 'esel') {
    vierBeine(g, f, [-3, -2, 2.5, 3.4], -5.8, 5.8, schritt * 1.3, 1.05, false);
    g.fillStyle = f.grund;
    g.beginPath(); g.ellipse(0, -7.2, 4.6, 2.4, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = f.grund; g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(3.6, -8.2); g.lineTo(5.4, -10.6); g.stroke();
    g.beginPath(); g.ellipse(6.6, -10.5, 2.1, 1.25, 0.3, 0, Math.PI * 2); g.fill();
    g.lineWidth = 1; g.beginPath(); g.moveTo(5.6, -11.2); g.lineTo(5.1, -14.4); g.moveTo(6.4, -11.3); g.lineTo(6.7, -14.4); g.stroke();   // lange Ohren
    g.fillStyle = f.licht; g.beginPath(); g.ellipse(0.3, -6, 3.2, 0.8, 0, 0, Math.PI * 2); g.fill();   // heller Bauch
    vierBeine(g, f, [-3, -2, 2.5, 3.4], -5.8, 5.8, schritt * 1.3, 1.1, true);
    if (opt.decke) { g.fillStyle = opt.decke; g.fillRect(-2.6, -10.1, 4.4, 2.8); }
    if (opt.last >= 0) gepaeck(g, -0.3, -9.4, 6, opt.last);
    if (opt.reiter) reiter(g, -0.2, -9.6, opt.decke || FARBE.indigo);
  } else if (typ === 'elefant') {
    const s = schritt * 0.7;
    vierBeine(g, f, [-5, -3.2, 3, 5], -6.5, 6.5, s, 2.8, false);
    g.fillStyle = f.grund;
    g.beginPath(); g.ellipse(0, -10.2, 8.6, 5.6, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(8, -12, 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = f.licht; g.beginPath(); g.ellipse(-1, -14, 6, 1.6, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = f.grund; g.lineWidth = 2; g.lineCap = 'round';
    const ruessel = Math.sin(s * 1.5) * 0.8;
    g.beginPath(); g.moveTo(11, -11); g.quadraticCurveTo(13.5 + ruessel, -6, 11.5 + ruessel, -2); g.stroke();   // Rüssel
    g.fillStyle = f.schatten; g.beginPath(); g.ellipse(6.4, -12, 2.5, 3.3, 0, 0, Math.PI * 2); g.fill();   // Ohr
    g.fillStyle = '#efe6d2'; g.beginPath(); g.moveTo(10.5, -9.5); g.quadraticCurveTo(12.5, -8.5, 13, -10); g.lineTo(11, -10.3); g.fill();  // Stoßzahn
    vierBeine(g, f, [-5, -3.2, 3, 5], -6.5, 6.5, s, 3, true);
    if (opt.decke) { g.fillStyle = opt.decke; g.fillRect(-4.5, -16, 8, 4.5); g.fillStyle = FARBE.messing; g.fillRect(-4.5, -12.2, 8, 0.9); }
    if (opt.last >= 0) gepaeck(g, -0.5, -15.6, 8, opt.last);
    if (opt.reiter) reiter(g, 0.5, -15.8, opt.decke || FARBE.indigo);
  }
}

// Aus der Tierliste einer Karawane höchstens 5 Figuren machen (größte Tiere vorne)
function karawanenFiguren(tiere) {
  const liste = [];
  for (const typ of ['elefant', 'kamel', 'pferd', 'esel']) for (let i = 0; i < (tiere[typ] || 0); i++) liste.push(typ);
  if (liste.length <= 5) return liste;
  const auswahl = [];
  for (let i = 0; i < 5; i++) auswahl.push(liste[Math.floor(i * liste.length / 5)]);
  return auswahl;
}

// Schatten nach dem Stand der Sonne: morgens lang nach Westen, mittags kurz, abends lang nach Osten
function sonnenSchatten() {
  const h = tagesAnteil() * 24;
  if (h < 6 || h >= 20) return { dx: 0, laenge: 1, staerke: 0.12 };   // nachts nur ein schwacher Mondschatten
  const t = (h - 6) / 14;                       // 0 = Sonnenaufgang, 1 = Sonnenuntergang
  return { dx: (t - 0.5) * 2 * 7, laenge: 1 + Math.abs(t - 0.5) * 1.6, staerke: 0.3 };
}

// Staubwölkchen hinter laufenden Tieren (ohne gespeicherten Zustand: Alter aus der Uhr)
function staub(x, y, ux, groesse, nr) {
  for (let j = 0; j < 3; j++) {
    const alter = (laufUhr * 1.3 + j / 3 + nr * 0.37) % 1;
    const px = x - ux * (4 + alter * 12) * groesse, py = y - alter * 6 * groesse;
    ctx.fillStyle = `rgba(214,180,128,${(0.32 * (1 - alter)).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(px, py, (1.5 + alter * 4) * groesse, 0, Math.PI * 2); ctx.fill();
  }
}

// Eine ganze Karawane: Tiere hintereinander, entlang der Laufrichtung, mit Führstrick
// opt: { beladen: true/false, fremd: true für Karawanen anderer Handelshäuser }
function zeichneZug(figuren, x, y, richtungX, richtungY, laeuft, koerper, decke, groesse = 1.55, opt = {}) {
  const laenge = Math.hypot(richtungX, richtungY) || 1;
  const ux = richtungX / laenge, uy = richtungY / laenge;
  const nachRechts = ux >= 0;
  const zeit = laufUhr * 7;
  const sonne = sonnenSchatten();
  const pos = figuren.map((_, i) => ({ x: x - ux * i * 13.5 * groesse, y: y - uy * i * 13.5 * groesse * 0.8 }));
  if (opt.fremd) ctx.globalAlpha = 0.9;

  // 1. Schatten und Staub unter allen Tieren
  pos.forEach((p, i) => {
    ctx.fillStyle = `rgba(60,35,15,${sonne.staerke})`;
    ctx.beginPath(); ctx.ellipse(p.x + sonne.dx * groesse * 0.5, p.y + 0.6, 7.5 * groesse * sonne.laenge, 1.7 * groesse, 0, 0, Math.PI * 2); ctx.fill();
    if (laeuft) staub(p.x, p.y, nachRechts ? 1 : -1, groesse * 0.8, i);
  });

  // 2. Führstrick von Tier zu Tier
  if (figuren.length > 1) {
    ctx.strokeStyle = 'rgba(70,45,20,.6)'; ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = 0; i < pos.length - 1; i++) {
      const vx = pos[i].x - (nachRechts ? 5 : -5) * groesse, vy = pos[i].y - 9 * groesse;
      const hx = pos[i + 1].x + (nachRechts ? 9 : -9) * groesse, hy = pos[i + 1].y - 14 * groesse;
      ctx.moveTo(vx, vy); ctx.quadraticCurveTo((vx + hx) / 2, Math.max(vy, hy) + 2 * groesse, hx, hy);
    }
    ctx.stroke();
  }

  // 3. Die Tiere – von hinten nach vorne, damit vordere oben liegen
  for (let i = figuren.length - 1; i >= 0; i--) {
    ctx.save();
    ctx.translate(pos[i].x, pos[i].y);
    ctx.scale(nachRechts ? groesse : -groesse, groesse);
    const schritt = laeuft ? zeit + i * 1.7 : 0;
    // laufend: Wippen im Schritt; stehend: ruhiges Atmen
    const wippen = laeuft ? Math.abs(Math.sin(schritt)) * 0.55 : (0.5 + 0.5 * Math.sin(laufUhr * 1.7 + i * 1.9 + x * 0.05)) * 0.35;
    ctx.translate(0, -wippen);
    zeichneTier(ctx, figuren[i], { schritt, decke, reiter: i === 0, last: opt.beladen && i > 0 ? i : -1 });
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // 4. Nachts trägt der Führer eine Laterne
  const nacht = nachtStaerke();
  if (nacht > 0.2) {
    const lx = pos[0].x + (nachRechts ? 9 : -9) * groesse, ly = pos[0].y - 12 * groesse;
    leuchten(lx, ly, 14 * groesse, '255,190,90', nacht * 0.8);
    ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.arc(lx, ly, 1.1 * groesse, 0, Math.PI * 2); ctx.fill();
  }
}

/* ---------------------------------------------------------------------
   D) KLEINE HILFEN: Abzeichen, Beschriftungen, Zelte
   --------------------------------------------------------------------- */

// Rundes Indigo-Abzeichen mit Messingrand – für Hinweise an Oasen und Karawanen
function abzeichen(x, y, zeichen, r = 9.5) {
  ctx.fillStyle = FARBE.indigo;
  ctx.strokeStyle = FARBE.messing; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (symbolMalen(ctx, zeichen, x, y, r * 1.45, '#ecd08a')) return;   // eigenes Symbol, wenn es eins gibt
  ctx.font = `${Math.round(r * 1.15)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(zeichen, x, y + 0.5);
}

// Text mit Symbol am Anfang ("💧 Wasser") oder Ende ("12 🪙"): das Emoji wird durch unser Symbol ersetzt
function textMitSymbol(text, x, y, gr, ausrichtung, aufHell = false) {
  const vorne = text.match(/^(\S+)\s+(.*)$/), hinten = text.match(/^(.*\S)\s+(\S+)$/);
  const istSymbol = e => e && SYMBOLE[e.replace(/\uFE0F/g, '')];
  ctx.textAlign = ausrichtung;
  if (ausrichtung === 'left' && vorne && istSymbol(vorne[1])) {
    symbolMalen(ctx, vorne[1], x + gr * 0.55, y, gr * 1.15, ctx.fillStyle, aufHell); ctx.textAlign = 'left'; ctx.fillText(vorne[2], x + gr * 1.3, y); return;
  }
  if (ausrichtung === 'right' && hinten && istSymbol(hinten[2])) {
    symbolMalen(ctx, hinten[2], x - gr * 0.55, y, gr * 1.1, ctx.fillStyle, aufHell); ctx.textAlign = 'right'; ctx.fillText(hinten[1], x - gr * 1.25, y); return;
  }
  if (ausrichtung === 'right' && vorne && istSymbol(vorne[1])) {
    ctx.fillText(vorne[2], x, y);
    symbolMalen(ctx, vorne[1], x - ctx.measureText(vorne[2]).width - gr * 0.7, y, gr * 1.1, ctx.fillStyle, aufHell); return;
  }
  ctx.fillText(text, x, y);
}

function beschriftung(text, x, y, groesse, farbe, kursiv = false, halo = 'rgba(246,232,200,.9)') {
  ctx.font = `${kursiv ? 'italic ' : ''}700 ${groesse}px ${SCHRIFT_KARTE}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (halo) { ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = halo; ctx.strokeText(text, x, y); }
  ctx.fillStyle = farbe;
  ctx.fillText(text, x, y);
}

function zelt(x, y, s) {
  ctx.fillStyle = '#2a1d14';
  ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x, y - s * 0.9); ctx.lineTo(x + s * 0.4, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4a3324';
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.9); ctx.lineTo(x + s, y); ctx.lineTo(x + s * 0.4, y); ctx.closePath(); ctx.fill();
}

// Weiches Leuchten (Laterne, Lagerfeuer, Staub). Jede Farbe wird nur EINMAL als
// kleines Bild vorgemalt und danach in beliebiger Größe und Stärke kopiert – viel schneller,
// als jedes Mal einen neuen Farbverlauf zu berechnen.
const leuchtBilder = {};
function leuchtBild(farbe) {
  if (!leuchtBilder[farbe]) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const v = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    v.addColorStop(0, `rgba(${farbe},1)`); v.addColorStop(0.5, `rgba(${farbe},.45)`); v.addColorStop(1, `rgba(${farbe},0)`);
    g.fillStyle = v; g.fillRect(0, 0, 64, 64);
    leuchtBilder[farbe] = c;
  }
  return leuchtBilder[farbe];
}
function leuchten(x, y, r, farbe, staerke) {
  if (staerke <= 0.01) return;
  ctx.globalAlpha = Math.min(1, staerke);
  ctx.drawImage(leuchtBild(farbe), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

function nachtStaerke() {
  // 0 am Mittag, 1 um Mitternacht – mit weichem Übergang in der Dämmerung
  const roh = (1 + Math.cos(2 * Math.PI * tagesAnteil())) / 2;
  return Math.max(0, Math.min(1, (roh - 0.35) / 0.5));
}

/* ---------------------------------------------------------------------
   D2) DIE EISENMINE – Felshügel mit Stollen, Halde, Schienen und Lore
   --------------------------------------------------------------------- */

let mineBild = null, mineSchluessel = '';

function eisenmineBild(aktiv) {
  const schluessel = `${S.eisenmine.x}|${S.eisenmine.y}|${aktiv}`;
  if (mineBild && mineSchluessel === schluessel) return mineBild;
  const [c, g] = neuesCanvas(90, 70);
  const cx = 45, cy = 46;

  // Schatten und ein Felsen aus drei unregelmäßigen Brocken eisenhaltigen Gesteins
  g.fillStyle = 'rgba(50,28,15,.25)';
  g.beginPath(); g.ellipse(cx + 6, cy + 3, 36, 7, 0, 0, Math.PI * 2); g.fill();
  const brocken = [[-17, 14, 12, -3], [3, 22, 24, 5], [22, 13, 11, -2]];   // Versatz, Breite, Höhe, Spitze
  for (const [dx, s, hoehe, sp] of brocken) {
    const x = cx + dx;
    const umriss = () => {
      g.beginPath();
      g.moveTo(x - s, cy);
      g.lineTo(x - s * 0.75, cy - hoehe * 0.55);
      g.lineTo(x - s * 0.3 + sp, cy - hoehe * 0.95);
      g.lineTo(x + sp, cy - hoehe);
      g.lineTo(x + s * 0.4 + sp, cy - hoehe * 0.8);
      g.lineTo(x + s * 0.8, cy - hoehe * 0.35);
      g.lineTo(x + s, cy);
      g.closePath();
    };
    const fels = g.createLinearGradient(x - s, 0, x + s, 0);
    fels.addColorStop(0, '#a5745a'); fels.addColorStop(0.45, '#73463a'); fels.addColorStop(1, '#3d2420');
    g.fillStyle = fels; umriss(); g.fill();
    g.save(); umriss(); g.clip();
    g.strokeStyle = 'rgba(30,15,10,.35)'; g.lineWidth = 0.7;
    for (let j = 0; j < 6; j++) { const hx = x + sp + j * s * 0.17; g.beginPath(); g.moveTo(hx, cy - hoehe); g.lineTo(hx + s * 0.25, cy); g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(255,225,190,.4)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(x - s, cy); g.lineTo(x - s * 0.75, cy - hoehe * 0.55); g.lineTo(x - s * 0.3 + sp, cy - hoehe * 0.95); g.lineTo(x + sp, cy - hoehe); g.stroke();
  }
  g.fillStyle = 'rgba(160,62,35,.5)';                       // rostrote Erzadern
  for (const [x, y, r] of [[-15, -6, 2.4], [6, -17, 2.6], [20, -6, 1.8], [-2, -10, 1.6]]) {
    g.beginPath(); g.ellipse(cx + x, cy + y, r * 1.7, r, 0.5, 0, Math.PI * 2); g.fill();
  }

  // Stolleneingang mit Holzrahmen
  g.fillStyle = '#140c08';
  g.beginPath(); g.moveTo(cx - 7, cy); g.lineTo(cx - 7, cy - 10); g.quadraticCurveTo(cx, cy - 16, cx + 7, cy - 10); g.lineTo(cx + 7, cy); g.closePath(); g.fill();
  g.strokeStyle = '#8a5a2b'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx - 8, cy); g.lineTo(cx - 8, cy - 12); g.lineTo(cx + 8, cy - 12); g.lineTo(cx + 8, cy); g.stroke();

  // Abraumhalde links: grauer Schutt
  g.fillStyle = '#5d5853';
  g.beginPath(); g.moveTo(cx - 40, cy + 4); g.quadraticCurveTo(cx - 32, cy - 9, cx - 22, cy + 4); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.15)';
  g.beginPath(); g.moveTo(cx - 37, cy + 2); g.quadraticCurveTo(cx - 32, cy - 6, cx - 29, cy - 1); g.lineTo(cx - 33, cy + 2); g.closePath(); g.fill();

  // Schienen aus dem Stollen und eine Lore mit Erz
  g.strokeStyle = '#3b2a20'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(cx - 3, cy); g.lineTo(cx + 8, cy + 12); g.moveTo(cx + 3, cy); g.lineTo(cx + 15, cy + 11); g.stroke();
  g.strokeStyle = '#6b4a2b'; g.lineWidth = 1.2;
  for (let i = 1; i < 5; i++) { const t = i / 5; g.beginPath(); g.moveTo(cx - 3 + 11 * t, cy + 12 * t); g.lineTo(cx + 3 + 12 * t, cy + 11 * t); g.stroke(); }
  if (aktiv) {
    g.fillStyle = '#4a4440';
    g.beginPath(); g.moveTo(cx + 6, cy + 4); g.lineTo(cx + 15, cy + 4); g.lineTo(cx + 13.5, cy + 9); g.lineTo(cx + 7.5, cy + 9); g.closePath(); g.fill();
    g.fillStyle = '#7a3a24';
    g.beginPath(); g.arc(cx + 10.5, cy + 4, 3.5, Math.PI, 0); g.fill();   // rotbraunes Erz in der Lore
    g.fillStyle = '#222';
    g.beginPath(); g.arc(cx + 8.5, cy + 9.5, 1.2, 0, Math.PI * 2); g.arc(cx + 12.5, cy + 9.5, 1.2, 0, Math.PI * 2); g.fill();
  }
  mineBild = c; mineSchluessel = schluessel;
  return c;
}

function zeichneEisenmine() {
  if (!S.eisenmine) return;
  const m = S.eisenmine, o = oase(m.oase);
  // Fahrweg von der Mine zur Oase
  ctx.strokeStyle = 'rgba(95,60,30,.45)'; ctx.lineWidth = 2; ctx.setLineDash([1, 4]); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(m.x, m.y + 4);
  ctx.quadraticCurveTo((m.x + o.x) / 2 + 8, (m.y + o.y) / 2 + 10, o.x, o.y);
  ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
  ctx.drawImage(eisenmineBild(o.aktiv), m.x - 45, m.y - 46, 90, 70);
  beschriftung(T('Eisenmine', 'Iron mine'), m.x, m.y + 22, 12, o.aktiv ? 'rgba(70,40,22,.9)' : 'rgba(110,95,80,.8)', true);

  // Frischer Edelsteinfund: ein paar Tage lang funkelt es am Stollen
  if (o.aktiv && S.tag <= (m.funkelnBis || 0)) {
    const t = performance.now() / 1000;
    const farben = ['#7fe3ff', '#ff6f91', '#b8ff8a', '#fff1a8'];
    for (let i = 0; i < 4; i++) {
      const glanz = Math.max(0, Math.sin(t * 2.6 + i * 1.7));
      if (glanz < 0.15) continue;
      const x = m.x - 16 + i * 10 + Math.sin(i * 3.1) * 4, y = m.y - 26 + Math.cos(i * 2.3) * 6;
      const r = 3 + glanz * 5;
      ctx.fillStyle = farben[i];
      ctx.globalAlpha = glanz;
      ctx.beginPath();                          // vierzackiger Stern
      ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.25, y - r * 0.25); ctx.lineTo(x + r, y);
      ctx.lineTo(x + r * 0.25, y + r * 0.25); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.25, y + r * 0.25);
      ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.25, y - r * 0.25); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

/* ---------------------------------------------------------------------
   E) JEDES BILD: alles Bewegliche über das Gelände malen
   --------------------------------------------------------------------- */

const anzeigeUhr = document.getElementById('anzeigeUhr');

function zeichne() {
  const echtzeit = performance.now() / 1000;   // für Wellen und Funkeln, auch in der Pause
  const nacht = nachtStaerke();
  // Die "Kamera": vergrößern und den sichtbaren Ausschnitt verschieben
  ctx.setTransform(DPR * ansicht.zoom, 0, 0, DPR * ansicht.zoom, -ansicht.x * DPR * ansicht.zoom, -ansicht.y * DPR * ansicht.zoom);
  ctx.drawImage(hintergrund, 0, 0, KARTE_B, KARTE_H);

  // Glitzern auf dem Meer
  for (let i = 0; i < 60; i++) {
    const y = hash01(i, 1) * KARTE_H, x = kuesteX(y) + 12 + hash01(i, 2) * 40;
    const a = Math.max(0, Math.sin(echtzeit * 1.5 + i * 2.3)) * 0.55;
    if (a < 0.05) continue;
    ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(2)})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x, y - 2, x + 4, y); ctx.stroke();
  }

  // Namen der Landschaften
  for (const geb of GEBIRGE) beschriftung(geb.name, geb.x, geb.y + geb.breite * 0.42, 13, 'rgba(92,58,28,.75)', true, null);
  beschriftung(T('Salzpfanne', 'Salt flat'), SALZPFANNE.x, SALZPFANNE.y + 1, 11, 'rgba(110,95,75,.8)', true, null);
  ctx.save(); ctx.translate(1328, 520); ctx.rotate(-Math.PI / 2);
  beschriftung(T('Rotes Meer', 'Red Sea'), 0, 0, 16, 'rgba(235,248,250,.75)', true, null);
  ctx.restore();

  zeichneWolkenschatten(echtzeit, nacht);
  zeichneBluete();

  // Regen: nasser, dunkler Boden, Wolken, fallende Striche und kleine Spritzer
  for (const r of S.regen) {
    const staerke = Math.max(0, Math.min(1, (r.bis - S.zeit) * 2, (S.zeit - (r.bis - 2)) * 4 + 0.2));
    leuchten(r.x, r.y, r.r * 1.05, '80,62,40', 0.32 * staerke);          // nasser Sand
    leuchten(r.x, r.y, r.r, '60,110,170', 0.22 * staerke);
    ctx.save();
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r * 0.85, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = `rgba(225,238,250,${(0.5 * staerke).toFixed(2)})`; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 160; i++) {
      const x = r.x - r.r + hash01(i, 3) * r.r * 2;
      const y = r.y - r.r + ((hash01(i, 4) * r.r * 2 + echtzeit * 260) % (r.r * 2));
      ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 9);
    }
    ctx.stroke();
    // Spritzer: kleine Ringe, die aufgehen und verblassen (in vier Helligkeitsstufen gesammelt)
    ctx.lineWidth = 0.8;
    const ringe = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    for (let i = 0; i < 32; i++) {
      const lauf = echtzeit * 1.6 + hash01(i, 21), alter = lauf % 1, nr = i + Math.floor(lauf) * 7;
      const x = r.x - r.r * 0.8 + hash01(nr, 22) * r.r * 1.6, y = r.y - r.r * 0.8 + hash01(nr, 23) * r.r * 1.6;
      const rx = 1 + alter * 4;
      ringe[Math.min(3, Math.floor(alter * 4))].moveTo(x + rx, y);
      ringe[Math.min(3, Math.floor(alter * 4))].ellipse(x, y, rx, 0.5 + alter * 2, 0, 0, Math.PI * 2);
    }
    ringe.forEach((p, i) => { ctx.strokeStyle = `rgba(230,240,250,${(0.45 * (1 - (i + 0.5) / 4) * staerke).toFixed(2)})`; ctx.stroke(p); });
    ctx.restore();
    // Regenwolken ziehen langsam über das Gebiet
    for (let i = 0; i < 3; i++) {
      const w = echtzeit * 0.05 + i * 2.1;
      leuchten(r.x + Math.cos(w) * r.r * 0.4, r.y + Math.sin(w) * r.r * 0.28, r.r * 0.62, '55,62,78', 0.26 * staerke);
    }
  }

  // Räuberlager: Gebiet mit Henna-Rand, in der Mitte Zelte und ein Feuer
  for (const g of aktiveRaeuber()) {
    ctx.fillStyle = 'rgba(184,69,47,.10)';
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(150,45,25,.75)'; ctx.lineWidth = 2;
    ctx.setLineDash([2, 6]); ctx.lineDashOffset = -S.zeit * 6;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
    zelt(g.x - 14, g.y + 2, 9); zelt(g.x + 4, g.y - 6, 8); zelt(g.x + 10, g.y + 8, 7);
    const flackern = 0.75 + 0.25 * Math.sin(echtzeit * 13 + g.x);
    ctx.fillStyle = `rgba(255,${Math.round(140 + 60 * flackern)},60,.95)`;
    ctx.beginPath(); ctx.arc(g.x - 3, g.y + 7, 1.8 + flackern, 0, Math.PI * 2); ctx.fill();
    if (nacht < 0.6) geier(g, echtzeit);
  }

  zeichneNebel();
  for (const g of aktiveRaeuber()) zeichneSoeldnerMarke(g);   // über dem Nebel: dort kämpfen deine Leute

  // Spuren: hinter jeder reisenden Karawane Fußabdrücke, vor ihr eine dünne Linie zum Ziel
  for (const k of S.karawanen) {
    if (k.nach == null) continue;
    const a = oase(k.von), b = oase(k.nach);
    const ges = entfernung(a, b), weit = Math.min(ges, k.gereist);
    ctx.fillStyle = 'rgba(80,50,22,.4)';
    for (let d = 8; d < weit; d += 7) {
      const t = d / ges, seite = (d / 7) % 2 ? 1.6 : -1.6;
      const nx = -(b.y - a.y) / ges, ny = (b.x - a.x) / ges;
      ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * t + nx * seite, a.y + (b.y - a.y) * t + ny * seite, 1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(80,50,22,.35)'; ctx.lineWidth = 1; ctx.setLineDash([2, 6]);
    ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
  }

  // Handelsroute der ausgewählten Karawane: Messinglinie mit nummerierten Medaillons
  const gk = karawane(S.gewKarawane);
  if (gk && gk.route.stationen.length) {
    const punkte = gk.route.stationen.map(st => oase(st.oase));
    ctx.strokeStyle = 'rgba(176,135,45,.9)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = gk.route.aktiv ? -S.zeit * 20 : 0;
    ctx.beginPath();
    punkte.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    if (punkte.length > 2) ctx.closePath();
    ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
  }

  zeichneEisenmine();
  zeichneAbenteuer();

  // Oasen
  const oasenListe = [...S.oasen].sort((a, b) => a.y - b.y);
  for (const o of oasenListe) {
    const bild = oasenBild(o);
    ctx.drawImage(bild.canvas, o.x - OASE_B / 2, o.y - OASE_H / 2 - 4, OASE_B, OASE_H);
  }
  zeichneWasserGlitzern(echtzeit, nacht);

  // Auswahl- und Zielringe
  const zeitRing = echtzeit;
  for (const o of S.oasen) {
    const r = oasenRadius(o) + 8;
    if (o.id === S.gewOase) {
      ctx.strokeStyle = FARBE.messing; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(o.x, o.y + 2, r * 1.25, r * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) {                       // kleine Messingzacken drehen sich langsam
        const w = zeitRing * 0.4 + i * Math.PI / 4;
        const x1 = o.x + Math.cos(w) * r * 1.25, y1 = o.y + 2 + Math.sin(w) * r * 0.7;
        ctx.fillStyle = '#f1d58a';
        ctx.beginPath(); ctx.arc(x1, y1, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (o.id === S.ziel) {
      ctx.strokeStyle = FARBE.henna; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = zeitRing * 12;
      ctx.beginPath(); ctx.ellipse(o.x, o.y + 2, r * 1.45, r * 0.85, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }
  }

  // Medaillons der Handelsroute über den Oasen
  if (gk && gk.route.stationen.length) {
    gk.route.stationen.forEach((st, i) => {
      const p = oase(st.oase), x = p.x + oasenRadius(p) + 12, y = p.y - 6;
      ctx.fillStyle = FARBE.messing; ctx.strokeStyle = FARBE.indigo; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = FARBE.indigo; ctx.font = `700 12px ${SCHRIFT_KARTE}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), x, y + 1);
    });
  }

  // Hinweise an den Oasen (als Abzeichen) und Namen
  for (const o of oasenListe) {
    const r = oasenRadius(o);
    const links = [], rechts = [];
    if (S.angebote.some(a => a.oase === o.id)) links.push('📜');
    if (S.auftraege.some(a => a.oase === o.id)) links.push('📦');
    if (S.gebaeude[o.id]) {
      const g = S.gebaeude[o.id];
      rechts.push(g.betrieb ? '🏭' : '🏛️');
      if (g.werkstatt) rechts.push(g.werkstatt === 'juwelier' ? '💍' : '🎨');
    }
    if (S.feste.some(f => f.oase === o.id)) rechts.push('🎉');
    links.forEach((z, i) => abzeichen(o.x - r - 14, o.y - 12 + i * 21, z));
    rechts.forEach((z, i) => abzeichen(o.x + r + 14, o.y + 10 + i * 21, z));

    // Schiff im Hafen: eine Dau mit Dreieckssegel, die sanft schaukelt
    if (o.hafen && S.tag <= (o.schiffBis || 0)) {
      const sx = o.x + 82, sy = o.y + 4 + Math.sin(echtzeit * 1.6) * 1.2;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.sin(echtzeit * 1.2) * 0.04);
      ctx.fillStyle = '#5b3a1f';
      ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(14, -2); ctx.quadraticCurveTo(10, 5, -9, 4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3d2614'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -24); ctx.stroke();
      ctx.fillStyle = '#f4ead4';
      ctx.beginPath(); ctx.moveTo(-12, -6); ctx.lineTo(4, -26); ctx.lineTo(6, -5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    beschriftung(o.name, o.x, o.y + r * 0.6 + 22, o.hafen ? 17 : 15, o.aktiv ? FARBE.tinte : '#7a6650', !o.aktiv);
  }

  // Karawanen der Konkurrenz (nur unterwegs), Satteldecke in der Farbe ihres Hauses
  for (const r of S.rivalen) {
    for (const k of r.karawanen) {
      if (k.nach == null) continue;
      const a = oase(k.von), b = oase(k.nach);
      zeichneZug(['kamel', 'kamel'], k.x, k.y, b.x - a.x, b.y - a.y, true, '#5a4632', r.farbe, 1.3, { beladen: k.menge > 0, fremd: true });
    }
  }

  // Rauch über überfallenen Oasen und die Plünderer-Reiter (22-pluenderer.js)
  zeichneBraende();
  zeichnePluenderer();

  // Deine Karawanen – wartende neben ihrer Oase, reisende auf dem Weg
  const proOase = {};
  for (const k of S.karawanen) {
    let x = k.x, y = k.y, rx = 1, ry = 0, laeuft = false;
    if (k.ort != null) {
      const o = oase(k.ort);
      const i = (proOase[k.ort] = (proOase[k.ort] || 0) + 1) - 1;
      x = o.x - 20 + i * 18;
      y = o.y - oasenRadius(o) * 0.55 - 14 - i * 12;
    } else {
      const a = oase(k.von), b = oase(k.nach);
      rx = b.x - a.x; ry = b.y - a.y;
      laeuft = !(k.nachtmarsch && !istNacht());
      if (k.verirrt) rx = -rx;
    }
    k.x = x; k.y = y;   // für das Antippen merken
    const figuren = karawanenFiguren(k.tiere);
    if (k.id === S.gewKarawane) {
      ctx.strokeStyle = '#f1d58a'; ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(241,213,138,.25)';
      ctx.beginPath(); ctx.ellipse(x - 6, y + 1, 22, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    const beladen = WAREN.some(w => w.id !== 'wasser' && k.ladung[w.id] >= 1);
    zeichneZug(figuren, x, y, rx, ry, laeuft, FARBE.tinte, FARBE.indigo, 1.55, { beladen });
    wimpel(x, y, rx >= 0);
    if (k.nach != null && k.nachtmarsch && !istNacht()) zelt(x - 4, y + 1, 8);

    const zeichen = [];
    if (k.durstig) zeichen.push('💧');
    if (k.krank) zeichen.push('🤒');
    if (k.verirrt) zeichen.push('🌫️');
    if (passagierAnzahl(k)) zeichen.push('🧕');
    zeichen.forEach((z, i) => abzeichen(x + 14 + i * 20, y - 26, z, 8.5));
  }

  // Sandstürme: Staubwolken, Wirbelbänder und Tausende Sandkörner
  for (const s of S.stuerme) {
    const dreh = S.zeit * 2.2 + echtzeit * 0.25;
    for (let i = 0; i < 5; i++) {                       // Staubwolken kreisen um die Mitte
      const w = dreh * 0.6 + i * 1.26, abst = s.r * (0.25 + 0.15 * (i % 2));
      leuchten(s.x + Math.cos(w) * abst, s.y + Math.sin(w) * abst * 0.7, s.r * 0.75, '168,112,55', 0.38);
    }
    leuchten(s.x, s.y, s.r * 0.6, '125,80,38', 0.35);    // dichtes Auge in der Mitte
    for (let i = 0; i < 5; i++) {                       // breite Wirbelbänder
      const start = -dreh * (1 + i * 0.15) + i * 1.3;
      ctx.strokeStyle = `rgba(${i % 2 ? '120,75,35' : '235,200,150'},.28)`;
      ctx.lineWidth = 4 + (i % 3) * 3;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r * (0.3 + i * 0.14), s.r * (0.3 + i * 0.14) * 0.72, 0, start, start + 1.9); ctx.stroke();
    }
    const koerner = Math.round(s.r * 3);
    for (let i = 0; i < koerner; i++) {
      const abst = s.r * (0.1 + 0.95 * Math.sqrt(hash01(i, 5)));
      const tempo = 2.6 / (0.3 + abst / s.r);
      const w = -(hash01(i, 6) * Math.PI * 2 + S.zeit * tempo + echtzeit * 0.4);
      const x = s.x + Math.cos(w) * abst, y = s.y + Math.sin(w) * abst * 0.72;
      const l = 4 + hash01(i, 7) * 7;
      const hell = hash01(i, 8) < 0.3;
      ctx.strokeStyle = hell ? 'rgba(252,232,192,.75)' : 'rgba(105,62,25,.6)';
      ctx.lineWidth = hell ? 1.1 : 1.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(w) * l, y - Math.cos(w) * l * 0.72); ctx.stroke();
    }
  }

  zeichneTageslicht(echtzeit, nacht);

  // Nacht: tiefes Indigo legt sich über die Wüste, Sterne funkeln, Laternen leuchten
  if (nacht > 0) {
    ctx.fillStyle = `rgba(16,22,58,${(nacht * 0.5).toFixed(3)})`;
    ctx.fillRect(0, 0, KARTE_B, KARTE_H);
    for (let i = 0; i < 110; i++) {
      const funkeln = 0.5 + 0.5 * Math.sin(echtzeit * 2 + i * 7.1);
      ctx.fillStyle = `rgba(255,250,230,${(nacht * funkeln * 0.7).toFixed(2)})`;
      ctx.fillRect(hash01(i, 9) * KARTE_B, hash01(i, 10) * KARTE_H, 1.2, 1.2);
    }
    zeichneNachthimmel(echtzeit, nacht);
    ctx.globalCompositeOperation = 'lighter';
    for (const o of S.oasen) {
      if (!o.aktiv) continue;
      const bild = oasenBild(o);
      leuchten(o.x, o.y, 46, '255,170,70', 0.18 * nacht);
      for (const f of bild.fenster) {
        const flackern = 0.8 + 0.2 * Math.sin(echtzeit * 6 + f.x * 3);
        leuchten(o.x + f.x, o.y - 4 + f.y, 6, '255,190,90', 0.75 * nacht * flackern);
      }
    }
    for (const g of aktiveRaeuber()) leuchten(g.x - 3, g.y + 7, 22, '255,120,40', 0.5 * nacht);
    abenteuerLichter(nacht);
    if (S.eisenmine && oase(S.eisenmine.oase).aktiv) {    // Grubenlampe am Stolleneingang
      leuchten(S.eisenmine.x, S.eisenmine.y - 6, 18, '255,180,80', 0.7 * nacht);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  zeichneEffekte();
  const uhrText = `${istNacht() ? '🌙' : '☀️'} ` + `${String(stunde()).padStart(2, '0')}:00`;
  if (anzeigeUhr.dataset.text !== uhrText) { anzeigeUhr.dataset.text = uhrText; anzeigeUhr.innerHTML = symbole(uhrText); }

  // Ab hier ohne Zoom: Schriftzüge sollen immer gleich groß und mittig sein
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  zeichneKartenRahmen();

  // Pause und Bankrott: ein Schleier und ein gerahmter Schriftzug
  if ((S.bankrott || S.pause) && !infoKarteSichtbar()) {
    ctx.fillStyle = S.bankrott ? 'rgba(30,12,10,.62)' : 'rgba(20,26,60,.32)';
    ctx.fillRect(0, 0, KARTE_B, KARTE_H);
    const titel = S.bankrott ? T('Bankrott', 'Bankrupt') : T('Pause', 'Paused');
    const mx = KARTE_B / 2, my = KARTE_H / 2 - (S.bankrott ? 16 : 0);
    ctx.font = `700 52px ${SCHRIFT_KARTE}`;
    const breite = ctx.measureText(titel).width;
    ctx.strokeStyle = FARBE.messing; ctx.lineWidth = 1.5;
    for (const seite of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(mx + seite * (breite / 2 + 16), my); ctx.lineTo(mx + seite * (breite / 2 + 90), my); ctx.stroke();
      ctx.fillStyle = FARBE.messing;
      ctx.beginPath(); ctx.arc(mx + seite * (breite / 2 + 16), my, 3, 0, Math.PI * 2); ctx.fill();
    }
    beschriftung(titel, mx, my, 52, '#f3e3bd', false, 'rgba(20,26,60,.6)');
    if (S.bankrott) beschriftung(T(`Deine Karawanen zogen ${S.tag} Tage durch die Wüste.`, `Your caravans crossed the desert for ${S.tag} days.`), mx, my + 46, 20, '#f3e3bd', true, null);
  }
  zeichneInfoKarte();
}

/* ---------------------------------------------------------------------
   F) ZOOMEN, VERSCHIEBEN UND ANTIPPEN
      ansicht.x / ansicht.y = linke obere Ecke des sichtbaren Ausschnitts (in Kartenkoordinaten)
   --------------------------------------------------------------------- */

const ansicht = { zoom: 1, x: 0, y: 0 };
const ZOOM_MAX = 3;

function ansichtBegrenzen() {
  ansicht.zoom = Math.max(1, Math.min(ZOOM_MAX, ansicht.zoom));
  ansicht.x = Math.max(0, Math.min(KARTE_B - KARTE_B / ansicht.zoom, ansicht.x));
  ansicht.y = Math.max(0, Math.min(KARTE_H - KARTE_H / ansicht.zoom, ansicht.y));
  // Ungezoomt darf der Finger die Seite scrollen; gezoomt verschiebt er die Karte
  canvas.style.touchAction = ansicht.zoom > 1.01 ? 'none' : 'pan-y';
  const anzeige = document.getElementById('zoomStufe');
  if (anzeige) anzeige.textContent = ansicht.zoom > 1.01 ? `${zahlText(ansicht.zoom, 1)}×` : '';
}

// Bildschirmpunkt (z. B. Mausposition) in Kartenkoordinaten umrechnen
function aufKarte(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ansicht.x + (clientX - r.left) / r.width * KARTE_B / ansicht.zoom,
    y: ansicht.y + (clientY - r.top) / r.height * KARTE_H / ansicht.zoom,
  };
}

// Zoomen so, dass der Punkt unter dem Finger/der Maus an seiner Stelle bleibt
function zoomen(faktor, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  if (clientX == null) { clientX = r.left + r.width / 2; clientY = r.top + r.height / 2; }
  const vorher = aufKarte(clientX, clientY);
  ansicht.zoom *= faktor;
  ansichtBegrenzen();
  ansicht.x = vorher.x - (clientX - r.left) / r.width * KARTE_B / ansicht.zoom;
  ansicht.y = vorher.y - (clientY - r.top) / r.height * KARTE_H / ansicht.zoom;
  ansichtBegrenzen();
}

function zoomZuruecksetzen() { ansicht.zoom = 1; ansicht.x = 0; ansicht.y = 0; ansichtBegrenzen(); }

// Mausrad
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  zoomen(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
}, { passive: false });

// Finger und Maus: ein Zeiger verschiebt, zwei Zeiger zoomen ("Pinch")
const zeiger = new Map();
let gezogen = false, pinchAbstand = 0, startPunkt = null;

canvas.addEventListener('pointerdown', e => {
  zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (zeiger.size === 1) { gezogen = false; startPunkt = { x: e.clientX, y: e.clientY }; }
  if (zeiger.size === 2) {
    const [a, b] = [...zeiger.values()];
    pinchAbstand = Math.hypot(a.x - b.x, a.y - b.y);
  }
});

canvas.addEventListener('pointermove', e => {
  const alt = zeiger.get(e.pointerId);
  if (!alt) return;
  const neu = { x: e.clientX, y: e.clientY };
  zeiger.set(e.pointerId, neu);
  const r = canvas.getBoundingClientRect();
  if (zeiger.size === 1) {
    if (Math.hypot(neu.x - startPunkt.x, neu.y - startPunkt.y) > 6) gezogen = true;
    if (gezogen && ansicht.zoom > 1.01) {
      ansicht.x -= (neu.x - alt.x) / r.width * KARTE_B / ansicht.zoom;
      ansicht.y -= (neu.y - alt.y) / r.height * KARTE_H / ansicht.zoom;
      ansichtBegrenzen();
    }
  } else if (zeiger.size === 2) {
    gezogen = true;
    const [a, b] = [...zeiger.values()];
    const abstand = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchAbstand > 0) zoomen(abstand / pinchAbstand, (a.x + b.x) / 2, (a.y + b.y) / 2);
    pinchAbstand = abstand;
  }
});

for (const art of ['pointerup', 'pointercancel', 'pointerleave']) {
  canvas.addEventListener(art, e => {
    zeiger.delete(e.pointerId);
    if (zeiger.size < 2) pinchAbstand = 0;
  });
}

// Antippen: Karawane oder Oase auswählen (aber nicht nach dem Verschieben)
canvas.addEventListener('click', e => {
  if (gezogen) { gezogen = false; return; }
  const { x, y } = aufKarte(e.clientX, e.clientY);
  const reichweite = 1 / Math.sqrt(ansicht.zoom);   // gezoomt muss man genauer treffen
  for (const k of S.karawanen) {
    if (Math.hypot(k.x - 8 - x, k.y - 10 - y) < 22 * reichweite) { waehleKarawane(k.id); infoKarte.oase = null; return; }
  }
  let beste = null, besteD = 50 * reichweite;
  for (const o of S.oasen) {
    const d = Math.hypot(o.x - x, o.y - y);
    if (d < besteD) { besteD = d; beste = o; }
  }
  if (beste) {
    waehleOase(beste.id);
    infoKarte.oase = beste.id;
    infoKarte.bis = performance.now() + 7000;
  } else {
    infoKarte.oase = null;   // Tippen ins Leere schließt das Infoschild
    // Ein Räuberlager angetippt? Dann das Fenster mit den Söldnern öffnen
    const lager = aktiveRaeuber().find(g => Math.hypot(g.x - x, g.y - y) < g.r);
    if (lager) lagerFensterOeffnen(lager.id);
  }
});

/* ---------------------------------------------------------------------
   G) INFOSCHILD – ein kleines Pergament mit den wichtigsten Preisen,
      direkt neben der angetippten Oase (in Bildschirmgröße, damit es lesbar bleibt)
   --------------------------------------------------------------------- */

const infoKarte = { oase: null, bis: 0 };
function infoKarteSichtbar() { return infoKarte.oase != null && performance.now() < infoKarte.bis; }

function zeichneInfoKarte() {
  if (!infoKarteSichtbar()) return;
  const o = oase(infoKarte.oase);
  if (!o) return;
  const r = canvas.getBoundingClientRect();
  if (!r.width) return;
  const pxProCss = canvas.width / r.width;
  ctx.setTransform(pxProCss, 0, 0, pxProCss, 0, 0);   // ab jetzt: Einheiten = Bildschirmpixel

  // Position der Oase auf dem Bildschirm
  const sx = (o.x - ansicht.x) * ansicht.zoom * r.width / KARTE_B;
  const sy = (o.y - ansicht.y) * ansicht.zoom * r.height / KARTE_H;

  // Inhalt zusammenstellen
  const zeilen = [];
  const p = S.wissen[o.id];
  const live = augenVorOrt(o);
  if (!o.aktiv) {
    zeilen.push([T('Versiegt – hier gibt es nichts mehr.', 'Dried up – nothing left here.'), '']);
  } else if (!p) {
    zeilen.push([T('Preise unbekannt', 'Prices unknown'), '']);
    zeilen.push([T('Schicke einen Boten oder reise hin.', 'Send a messenger or travel there.'), '']);
  } else {
    // "gut verkaufen": Preis deutlich über dem Grundpreis; "günstig": Einkauf unter dem Grundpreis
    const waren = WAREN.filter(w => w.id !== 'wasser' && typeof p.verk[w.id] === 'number' && wareZeigen(w, p.lager[w.id], o));
    const teuer = waren.map(w => ({ w, v: p.verk[w.id] / w.basis })).sort((a, b) => b.v - a.v).slice(0, 3);
    const billig = waren.filter(w => p.lager[w.id] >= 3).map(w => ({ w, v: p.kauf[w.id] / w.basis })).sort((a, b) => a.v - b.v).slice(0, 2);
    zeilen.push([T('Hier gut verkaufen:', 'Good to sell here:'), '', 'titel']);
    for (const t of teuer) zeilen.push([`${t.w.icon} ${t.w.name}`, `${p.verk[t.w.id]} 🪙`]);
    if (billig.length) {
      zeilen.push([T('Hier günstig kaufen:', 'Cheap to buy here:'), '', 'titel']);
      for (const t of billig) zeilen.push([`${t.w.icon} ${t.w.name}`, `${p.kauf[t.w.id]} 🪙`]);
    }
    zeilen.push([live ? T('Preise von heute', 'Today\'s prices') : T(`Preise von Tag ${p.tag}`, `Prices from day ${p.tag}`), '', 'klein']);
  }

  const breite = 178, zeilenHoehe = 17, kopf = 26;
  const hoehe = kopf + zeilen.length * zeilenHoehe + 10;
  let x = sx + 26, y = sy - hoehe / 2;
  if (x + breite > r.width - 6) x = sx - 26 - breite;            // rechts kein Platz: links anzeigen
  x = Math.max(6, Math.min(r.width - breite - 6, x));
  y = Math.max(6, Math.min(r.height - hoehe - 6, y));

  // Pergament mit Messingrand und kleinem Schatten
  ctx.fillStyle = 'rgba(20,15,10,.25)';
  ctx.fillRect(x + 3, y + 4, breite, hoehe);
  ctx.fillStyle = '#f2e4c4';
  ctx.strokeStyle = FARBE.messing; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.rect(x, y, breite, hoehe); ctx.fill(); ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#3a2a12';
  ctx.font = `700 16px ${SCHRIFT_KARTE}`;
  ctx.fillText(o.name, x + 10, y + 15);
  if (o.aktiv) {
    ctx.font = '12px "Alegreya Sans", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = wasserFarbe(o.wasser) === '#e8664c' ? '#a33a24' : '#2c6f74';
    textMitSymbol(`💧 ${Math.round(o.wasser)} %`, x + breite - 10, y + 15, 12, 'right', true);
  }
  zeilen.forEach(([links, rechts, art], i) => {
    const zy = y + kopf + i * zeilenHoehe + 8;
    ctx.textAlign = 'left';
    ctx.fillStyle = art === 'klein' ? '#7a6650' : '#2a2238';
    ctx.font = art === 'titel' ? '700 12px "Alegreya Sans", system-ui, sans-serif'
             : art === 'klein' ? 'italic 11px "Alegreya Sans", system-ui, sans-serif'
             : '13px "Alegreya Sans", system-ui, sans-serif';
    textMitSymbol(links, x + 10, zy, 13, 'left', true);
    if (rechts) { ctx.font = '700 13px "Alegreya Sans", system-ui, sans-serif'; textMitSymbol(rechts, x + breite - 10, zy, 13, 'right', true); }
  });
}

/* ---------------------------------------------------------------------
   H) ATMOSPHÄRE – Licht der Tageszeit, Hitzeflimmern, Wolkenschatten,
      Wüstenblüte nach dem Regen, Mond und Sternschnuppen, Geier
   --------------------------------------------------------------------- */

// Morgenrot, Mittagsglut und Abendrot als hauchdünner Farbschleier über der Karte
function zeichneTageslicht(echtzeit, nacht) {
  const h = tagesAnteil() * 24;
  const glocke = (mitte, breite) => Math.max(0, 1 - Math.abs(h - mitte) / breite);
  const morgen = glocke(6.2, 1.6), abend = glocke(18.8, 1.8), mittag = glocke(13, 3);
  if (morgen > 0) { ctx.fillStyle = `rgba(255,150,175,${(0.13 * morgen).toFixed(3)})`; ctx.fillRect(0, 0, KARTE_B, KARTE_H); }
  if (abend > 0)  { ctx.fillStyle = `rgba(255,128,50,${(0.16 * abend).toFixed(3)})`;  ctx.fillRect(0, 0, KARTE_B, KARTE_H); }
  if (mittag > 0) {
    ctx.fillStyle = `rgba(255,240,205,${(0.07 * mittag).toFixed(3)})`; ctx.fillRect(0, 0, KARTE_B, KARTE_H);
    // Hitzeflimmern: feine, wabernde Linien, die langsam nach oben steigen
    ctx.strokeStyle = `rgba(255,252,240,${(0.09 * mittag).toFixed(3)})`; ctx.lineWidth = 1.4;
    for (let i = 0; i < 14; i++) {
      const y = KARTE_H - ((hash01(i, 31) * KARTE_H + echtzeit * 9) % KARTE_H);
      const x0 = hash01(i, 32) * KARTE_B * 0.7, laenge = 140 + hash01(i, 33) * 220;
      ctx.beginPath();
      for (let x = 0; x <= laenge; x += 12) {
        const yy = y + Math.sin(x / 18 + echtzeit * 3 + i) * 1.6;
        x ? ctx.lineTo(x0 + x, yy) : ctx.moveTo(x0 + x, yy);
      }
      ctx.stroke();
    }
  }
}

// Große, weiche Wolkenschatten ziehen tagsüber langsam nach Osten
function zeichneWolkenschatten(echtzeit, nacht) {
  if (nacht > 0.6) return;
  for (let i = 0; i < 4; i++) {
    const x = ((hash01(i, 41) * (KARTE_B + 600) + echtzeit * (5 + i)) % (KARTE_B + 600)) - 300;
    const y = 80 + hash01(i, 42) * (KARTE_H - 160);
    leuchten(x, y, 160 + hash01(i, 43) * 90, '70,45,20', 0.1 * (1 - nacht));
  }
}

// Wüstenblüte: nach dem Regen sprießen Gras und Blumen – erst zart, dann voll, dann verblassend.
// Alle Halme einer Farbe werden zu EINEM Pfad gesammelt und auf einmal gezeichnet – das ist viel schneller.
const BLUETE_FARBEN = ['#f4d35e', '#f29bb5', '#fbf3e4', '#c9a0ea'];
function zeichneBluete() {
  for (const b of S.bluete || []) {
    const alter = (S.zeit - b.von) / (b.bis - b.von);
    if (alter <= 0 || alter >= 1) continue;
    const staerke = Math.min(1, alter * 5) * Math.min(1, (1 - alter) * 3);
    leuchten(b.x, b.y, b.r, '110,165,60', 0.42 * staerke);
    const gras = [new Path2D(), new Path2D()], blumen = BLUETE_FARBEN.map(() => new Path2D());
    for (let i = 0; i < 320; i++) {
      if (hash01(i, 53) > staerke + 0.1) continue;          // am Anfang und Ende weniger
      const w = hash01(i, 51) * Math.PI * 2, d = Math.sqrt(hash01(i, 52)) * b.r;
      const x = b.x + Math.cos(w) * d, y = b.y + Math.sin(w) * d * 0.8;
      if (x > kuesteX(y) - 6) continue;                    // nicht im Meer
      if (i % 4 === 0) {
        const p = blumen[(i % 16) >> 2];
        p.moveTo(x + 1.7, y); p.arc(x, y, 1.7, 0, Math.PI * 2);
      } else {
        const p = gras[i % 3 ? 0 : 1];
        p.moveTo(x - 2.2, y - 3.4); p.lineTo(x, y); p.lineTo(x + 2.2, y - 3.6); p.moveTo(x, y); p.lineTo(x + 0.2, y - 4.4);
      }
    }
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(80,135,45,.9)'; ctx.stroke(gras[0]);
    ctx.strokeStyle = 'rgba(125,170,60,.9)'; ctx.stroke(gras[1]);
    blumen.forEach((p, i) => { ctx.fillStyle = BLUETE_FARBEN[i]; ctx.fill(p); });
  }
}

// Mondlicht, helle funkelnde Sterne und ab und zu eine Sternschnuppe
function zeichneNachthimmel(echtzeit, nacht) {
  // kühles Mondlicht von Nordosten: ein einfacher Farbverlauf (viel schneller als ein großes Leuchten)
  const mond = ctx.createLinearGradient(KARTE_B, 0, KARTE_B * 0.4, KARTE_H);
  mond.addColorStop(0, `rgba(150,175,240,${(0.12 * nacht).toFixed(3)})`); mond.addColorStop(1, 'rgba(150,175,240,0)');
  ctx.fillStyle = mond; ctx.fillRect(0, 0, KARTE_B, KARTE_H);
  // ein paar große Sterne mit Strahlenkreuz
  for (let i = 0; i < 16; i++) {
    const x = hash01(i, 61) * KARTE_B, y = hash01(i, 62) * KARTE_H;
    const f = (0.55 + 0.45 * Math.sin(echtzeit * 1.3 + i * 3.7)) * nacht;
    const l = 2 + hash01(i, 63) * 2.5;
    ctx.strokeStyle = `rgba(255,248,225,${(0.75 * f).toFixed(2)})`; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - l, y); ctx.lineTo(x + l, y); ctx.moveTo(x, y - l); ctx.lineTo(x, y + l); ctx.stroke();
    ctx.fillStyle = `rgba(255,252,240,${f.toFixed(2)})`; ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
  }
  // Sternschnuppe: etwa alle 11 Sekunden, für einen Augenblick
  const runde = Math.floor(echtzeit / 11), t = (echtzeit % 11) / 0.9;
  if (t < 1 && nacht > 0.5) {
    const x0 = 100 + hash01(runde, 64) * (KARTE_B - 300), y0 = 40 + hash01(runde, 65) * 220;
    const x = x0 + t * 160, y = y0 + t * 70;
    const verlauf = ctx.createLinearGradient(x - 60, y - 26, x, y);
    verlauf.addColorStop(0, 'rgba(255,250,230,0)'); verlauf.addColorStop(1, `rgba(255,250,230,${(0.9 * (1 - t) * nacht).toFixed(2)})`);
    ctx.strokeStyle = verlauf; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x - 60, y - 26); ctx.lineTo(x, y); ctx.stroke();
  }
}

// Zwei Geier kreisen über einem Räuberlager
function geier(g, echtzeit) {
  ctx.strokeStyle = 'rgba(45,30,20,.75)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const w = echtzeit * (0.45 + i * 0.12) + i * Math.PI + g.x;
    const x = g.x + Math.cos(w) * g.r * 0.45, y = g.y - 18 + Math.sin(w) * g.r * 0.22;
    const schlag = Math.sin(echtzeit * 4 + i) * 1.2;
    ctx.beginPath(); ctx.moveTo(x - 5, y - 1.5 + schlag); ctx.quadraticCurveTo(x - 2, y - 2.5, x, y); ctx.quadraticCurveTo(x + 2, y - 2.5, x + 5, y - 1.5 + schlag); ctx.stroke();
  }
}
