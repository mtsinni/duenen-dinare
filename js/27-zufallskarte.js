/* =====================================================================
   27. ZUFÄLLIGE KARTEN
   Jedes Spiel kann eine eigene Wüste bekommen: andere Oasen, andere Waren,
   andere Gebirge. Alles hängt an einer „Kartennummer“ – dieselbe Nummer
   ergibt immer dieselbe Karte (zum Teilen mit Freunden).
   ===================================================================== */

const OASEN_NAMEN = ['Siwa', 'Ghadames', 'Taoudenni', 'Timbuktu', 'Agadez', 'Bilma', 'Kufra', 'Tamanrasset', 'Dakhla', 'Selima',
  'Ghat', 'Djanet', 'In Salah', 'Timimoun', 'Ouargla', 'Murzuk', 'Sebha', 'Faya', 'Arawan', 'Walata', 'Ouadane', 'Tichit',
  'Zinder', 'Kharga', 'Farafra', 'Bahariya', 'Awjila', 'Djado', 'Fachi', 'In Gall', 'Tindouf', 'Chinguetti', 'Ghardaïa', 'Gao'];
const HAFEN_NAMEN = ['Suakin', 'Berenike', 'Quseir', 'Aidhab'];
const GEBIRGS_NAMEN = ['Hoggar', 'Tibesti', 'Aïr', 'Tassili', 'Ennedi', 'Adrar', 'Djado', 'Uweinat', 'Acacus', 'Gilf Kebir'];
// Waren, die Oasen selbst herstellen können (Eisen kommt aus der Mine, Seide und Porzellan per Schiff)
const GRUNDWAREN = ['datteln', 'salz', 'indigo', 'gewuerze', 'weihrauch', 'teppiche', 'gold'];

function neueKartennummer() { return 10000 + Math.floor(Math.random() * 90000); }

// Erzeugt aus einer Kartennummer den kompletten Plan der Wüste
function kartenPlan(nr) {
  const rnd = zufallsFolge(nr * 7919 + 13);
  const zwischen = (a, b) => a + rnd() * (b - a);
  const mischen = liste => { const l = [...liste]; for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };
  const abstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // 1. Gebirge – nicht zu nah beieinander
  const namen = mischen(GEBIRGS_NAMEN);
  const gebirge = [];
  for (let versuch = 0; gebirge.length < 3 && versuch < 200; versuch++) {
    const breite = Math.round(zwischen(55, 120));
    const g = { name: namen[gebirge.length], x: Math.round(zwischen(170, 1120)), y: Math.round(zwischen(140, 600)), breite, huegel: Math.max(4, Math.round(breite / 10)) };
    if (g.x > kuesteX(g.y) - 200) continue;
    if (gebirge.every(x => abstand(x, g) > 230)) gebirge.push(g);
  }
  // 2. Sandmeere
  const sandmeere = [];
  for (let i = 0; i < 7; i++) sandmeere.push([Math.round(zwischen(80, 1180)), Math.round(zwischen(100, 650)), Math.round(zwischen(130, 230))]);

  // 3. Oasen: im Landesinneren verteilt, nicht in Gebirgen, nicht zu dicht
  const anzahl = 10 + Math.floor(rnd() * 2);
  const oasen = [];
  let mindest = 150;
  for (let versuch = 0; oasen.length < anzahl && versuch < 3000; versuch++) {
    if (versuch % 600 === 599) mindest -= 12;           // notfalls etwas dichter
    const p = { x: Math.round(zwischen(110, 1180)), y: Math.round(zwischen(95, 630)) };
    if (p.x > kuesteX(p.y) - 140) continue;
    if (gebirge.some(g => abstand(g, p) < g.breite * 0.85 + 30)) continue;
    if (oasen.some(o => abstand(o, p) < mindest)) continue;
    oasen.push(p);
  }
  const oasenNamen = mischen(OASEN_NAMEN);
  oasen.forEach((o, i) => { o.name = oasenNamen[i]; o.produziert = []; o.bev = Math.round(zwischen(250, 1150) / 50) * 50; });
  // eine große Stadt (dort gibt es Elefanten)
  oasen[Math.floor(rnd() * oasen.length)].bev = Math.round(zwischen(1300, 1600) / 50) * 50;

  // 4. Waren verteilen: jede Grundware wird mindestens an einem Ort hergestellt
  const reihenfolge = mischen(oasen);
  mischen(GRUNDWAREN).forEach((w, i) => reihenfolge[i % reihenfolge.length].produziert.push(w));
  for (const o of oasen) {
    if (rnd() < 0.5) o.produziert.push('wasser');
    if (rnd() < 0.35 && o.produziert.length < 3) {
      const w = GRUNDWAREN[Math.floor(rnd() * GRUNDWAREN.length)];
      if (!o.produziert.includes(w)) o.produziert.push(w);
    }
    if (!o.produziert.length) o.produziert.push(rnd() < 0.5 ? 'datteln' : 'wasser');
    o.produziert.sort((a, b) => (a === 'wasser' ? -1 : 0) - (b === 'wasser' ? -1 : 0));
  }

  // 5. Startoase: mittelgroß, möglichst in der Mitte – sie bekommt Wasser und Salz (für die Einführung)
  const mitte = { x: 620, y: 380 };
  const start = [...oasen].sort((a, b) => abstand(a, mitte) - abstand(b, mitte)).find(o => o.bev < 1300) || oasen[0];
  start.bev = Math.max(start.bev, 650);
  for (const w of ['wasser', 'salz']) if (!start.produziert.includes(w)) start.produziert.unshift(w);
  start.start = true;

  // 6. Hafenstadt an der Küste
  let hafen = null;
  for (let versuch = 0; versuch < 200 && !hafen; versuch++) {
    const y = Math.round(zwischen(160, 560)), p = { x: Math.round(kuesteX(y) - 45), y };
    if (oasen.every(o => abstand(o, p) > 140)) hafen = p;
  }
  if (!hafen) hafen = { x: 1255, y: 400 };
  Object.assign(hafen, { name: HAFEN_NAMEN[Math.floor(rnd() * HAFEN_NAMEN.length)], produziert: ['wasser'], bev: 1600, hafen: true });
  oasen.push(hafen);

  // 7. Salzpfanne bei einer Salz-Oase
  const salzOase = oasen.find(o => o.produziert.includes('salz') && !o.start && !o.hafen) || start;
  const salz = { x: salzOase.x + (rnd() < 0.5 ? -1 : 1) * 30, y: salzOase.y + 50, rx: 52, ry: 24 };

  return { nr, samen: nr, gebirge, sandmeere, salz, oasen };
}

// Der Plan der klassischen Karte (wie bisher)
function klassischerPlan() {
  const oasen = [...OASEN_START, ...OASEN_OSTEN].map(d => ({ ...d, produziert: [...d.produziert], start: d.name === 'Agadez' }));
  return { nr: 0, samen: 1923, gebirge: KLASSISCH_GELAENDE.gebirge, sandmeere: KLASSISCH_GELAENDE.sandmeere, salz: KLASSISCH_GELAENDE.salz, oasen };
}

function kartenPlanVon(karte) {
  return karte && karte.art === 'zufall' ? kartenPlan(karte.nr) : klassischerPlan();
}

// Oasen eines Plans im Spielstand anlegen
function kartenOasenAnlegen(plan) {
  let start = null;
  for (const d of plan.oasen) {
    const o = neueOase(d.name, d.x, d.y, d.produziert, d.bev);
    if (d.hafen) { o.hafen = true; o.wasser = 90; o.lager.seide = 30; o.lager.porzellan = 40; }
    S.oasen.push(o);
    if (d.start) start = o;
  }
  return start || S.oasen[0];
}

// Gelände zum aktuellen Spielstand malen
function kartenGelaendeAktualisieren() {
  if (typeof gelaendeSetzen !== 'function') return;
  gelaendeSetzen(S.karte && S.karte.art === 'zufall' ? kartenPlan(S.karte.nr) : null);
}

function kartenText(karte) {
  return karte && karte.art === 'zufall' ? T(`Zufallskarte Nr. ${karte.nr}`, `Random map no. ${karte.nr}`) : T('Klassische Karte', 'Classic map');
}
