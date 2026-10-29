/* =====================================================================
   2. HILFSFUNKTIONEN
   ===================================================================== */

function zufall(a, b) { return a + Math.random() * (b - a); }
function zufallInt(a, b) { return Math.floor(zufall(a, b + 1)); }
function entfernung(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function ware(id) { return WAREN.find(w => w.id === id); }
function oase(id) { return S.oasen.find(o => o.id === id); }
function karawane(id) { return S.karawanen.find(k => k.id === id); }

function tierAnzahl(k) { return Object.values(k.tiere).reduce((a, b) => a + b, 0); }
function kapazitaet(k) { let s = 0; for (const t in k.tiere) s += k.tiere[t] * TIERE[t].kapazitaet; return s; }
function karawanenDurst(k) {
  let s = 0; for (const t in k.tiere) s += k.tiere[t] * TIERE[t].durst;
  s += 0.25 * passagierAnzahl(k);                    // Reisende trinken mit
  return s * (1 - 0.07 * (fuehrerStufe(k) - 1))    // erfahrene Führer kennen jede Wasserstelle
           * (1 - 0.08 * talentStufe(k, 'wasserkundig'));
}

// Stufe des Führers aus seinen Erfahrungspunkten
function fuehrerStufe(k) {
  let stufe = 0;
  for (const grenze of STUFEN_EP) if (k.fuehrer.ep >= grenze) stufe++;
  return stufe;
}

// Grundtempo der Tiere + Bonus des Führers (5 % pro Stufe)
function reiseTempo(k) {
  return karawanenTempo(k) * (1 + 0.05 * (fuehrerStufe(k) - 1)) * (1 + 0.06 * talentStufe(k, 'spurenleser')) * (1 + sereiNetzBonus() + familienBonus('wegfinder') * 0.04) * (k.krank ? 0.7 : 1);
}

function unterhaltKosten(k) {
  let s = k.wachen * WACHE_UNTERHALT + (k.spaeher ? SPAEHER.unterhalt : 0);
  for (const t in k.tiere) s += k.tiere[t] * TIERE[t].unterhalt;
  return Math.round(s * Math.max(0.5, 1 - 0.1 * familienBonus('sparsam')));
}

// Marktwert der Ladung (ohne Wasser) – danach richtet sich, wie gern Räuber zuschlagen
function ladungsWert(k) {
  return WAREN.filter(w => w.id !== 'wasser').reduce((s, w) => s + k.ladung[w.id] * w.basis, 0);
}

// Kürzester Abstand eines Punktes p zur Strecke von a nach b
function abstandPunktStrecke(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
  let t = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
// Ladung + Reisende (jeder Reisende braucht 2 Lastplätze)
function ladungGewicht(k) {
  const wasserRabatt = hatAusruestung(k, 'schlaeuche') ? k.ladung.wasser * 0.5 : 0;   // Wasserschläuche: Wasser wiegt halb
  return Object.values(k.ladung).reduce((a, b) => a + b, 0) - wasserRabatt + 2 * passagierAnzahl(k);
}
function nurKamele(k) { return tierAnzahl(k) > 0 && tierAnzahl(k) === k.tiere.kamel + (k.tiere.mehari || 0); }

// Eine Karawane ist nur so schnell wie ihr langsamstes Tier
function karawanenTempo(k) {
  let min = Infinity;
  for (const t in k.tiere) if (k.tiere[t] > 0) min = Math.min(min, TIERE[t].tempo);
  return min === Infinity ? 0 : min;
}

// Das Tier, von dem die Karawane die meisten hat (für das Symbol auf der Karte)
function hauptTier(k) {
  let bestes = 'kamel', max = -1;
  for (const t in k.tiere) if (k.tiere[t] > max) { max = k.tiere[t]; bestes = t; }
  return TIERE[bestes];
}

function wasserFarbe(w) {
  if (typeof farbenblind !== 'undefined' && farbenblind) return w > 50 ? '#56b4e9' : w > 20 ? '#f0e442' : '#e69f00';
  return w > 50 ? '#3fb4b0' : w > 20 ? '#e0a83c' : '#e8664c';
}
