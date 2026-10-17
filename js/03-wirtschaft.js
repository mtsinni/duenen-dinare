/* =====================================================================
   3. WIRTSCHAFT – Produktion, Verbrauch und Preise
   Preis hängt davon ab, wie viel im Lager ist im Vergleich zum "Normalbestand".
   Volles Lager = billig, leeres Lager = teuer.
   ===================================================================== */

function verbrauchProTag(o, w) {
  const ausfuhr = o.hafen && !w.see ? 2.5 : 1;   // Schiffe nehmen Wüstenwaren mit
  return o.bev / 100 * 20 / w.basis * ausfuhr;
}

function produktionProTag(o, w) {
  const wasserFaktor = Math.min(1, o.wasser / 30); // wenig Wasser = weniger Produktion
  if (w.id === 'wasser') {
    // Jede Oase hat etwas Wasser – Wasser-Oasen besonders viel
    return o.wasser / 100 * o.bev / 100 * (o.produziert.includes('wasser') ? 15 : 7);
  }
  if (!o.produziert.includes(w.id)) return 0;
  const ernte = w.id === 'datteln' ? jahreszeit().datteln : 1;   // Erntezeit: viel mehr Datteln
  return o.bev / 100 * 60 / w.basis * wasserFaktor * ernte;
}

function normBestand(o, w) {
  // Seltene Funde: im Landesinneren gelten schon 3 Stück als "normal viel" – die Bergleute verkaufen günstig
  if (w.selten && !o.hafen) return 3;
  return Math.max(2, verbrauchProTag(o, w) * 8);
}

function preisFaktor(o, w) {
  const verhaeltnis = o.lager[w.id] / normBestand(o, w);
  return Math.max(0.35, Math.min(1.6, 1.6 - 0.6 * verhaeltnis));
}
// Bei einem Fest ist eine Ware besonders gefragt
function festFaktor(o, w) { return S.feste.some(f => f.oase === o.id && f.ware === w.id) ? 1.8 : 1; }

// Grundpreise (gelten für alle, auch für die Konkurrenz)
function grundKaufPreis(o, w)    { return Math.ceil(w.basis * preisFaktor(o, w) * 1.1); }
function hafenFaktor(o, w) { return w.nurHafen ? (o.hafen ? 1.6 : 0.5) : 1; }
function grundVerkaufPreis(o, w) { return Math.max(1, Math.floor(w.basis * preisFaktor(o, w) * 0.9 * festFaktor(o, w) * hafenFaktor(o, w))); }

// Deine Preise: hohes Ansehen bringt bis zu 8 % Vorteil
function ansehen(o) { return S.ansehen[o.id] || 0; }
function ansehenVorteil(o) { return ansehen(o) / 100 * 0.08; }
function kaufPreis(o, w)    { return Math.ceil(grundKaufPreis(o, w) * (1 - ansehenVorteil(o))); }
function verkaufPreis(o, w) { return Math.max(1, Math.floor(grundVerkaufPreis(o, w) * (1 + ansehenVorteil(o)))); }

// Einnahmen und Ausgaben für die Statistik verbuchen
function buche(art, betrag) {
  const topf = betrag >= 0 ? S.statistik.einnahmen : S.statistik.ausgaben;
  topf[art] = (topf[art] || 0) + Math.abs(betrag);
  if (art === 'Handel') S.umsatzHeute = (S.umsatzHeute || 0) + Math.abs(betrag);   // für die Gunst des Sultans
}
