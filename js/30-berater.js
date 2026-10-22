/* =====================================================================
   30. HANDELSBERATER UND PREISVERLAUF
   Der Berater rechnet mit den Preisen, die du kennst, und schlägt
   lohnende Geschäfte vor. Der Preisverlauf merkt sich, wie sich die
   Preise in einer Oase über die Tage entwickelt haben.
   ===================================================================== */

const VERLAUF_TAGE = 40;

// Wird bei jedem merkePreise() aufgerufen: ein Eintrag pro Oase und Tag
function preisVerlaufMerken(o) {
  if (!S.preisVerlauf) S.preisVerlauf = {};
  const liste = S.preisVerlauf[o.id] || (S.preisVerlauf[o.id] = []);
  const eintrag = { t: S.tag, k: {}, v: {} };
  for (const w of WAREN) {
    if (o.lager[w.id] < 1 && !o.produziert.includes(w.id)) continue;
    eintrag.k[w.id] = kaufPreis(o, w);
    eintrag.v[w.id] = verkaufPreis(o, w);
  }
  if (liste.length && liste[liste.length - 1].t === S.tag) liste[liste.length - 1] = eintrag;
  else liste.push(eintrag);
  while (liste.length && liste[0].t < S.tag - VERLAUF_TAGE) liste.shift();
}

// Ein kleines Liniendiagramm: Kaufpreis (gold) und Verkaufspreis (grün) der letzten Tage
function htmlPreisVerlauf(o, w) {
  const liste = ((S.preisVerlauf || {})[o.id] || []).filter(e => e.k[w.id] != null);
  if (liste.length < 2) return `<div class="verlauf-leer">${T('📈 Noch kein Preisverlauf – er entsteht, solange du hier Augen und Ohren hast (Karawane oder Lagerhaus).',
                                                              '📈 No price history yet – it builds up while you have eyes and ears here (caravan or warehouse).')}</div>`;
  const B = 300, H = 64, rand = 4;
  const werte = liste.flatMap(e => [e.k[w.id], e.v[w.id]]);
  const min = Math.min(...werte), max = Math.max(...werte), spanne = Math.max(1, max - min);
  const t0 = liste[0].t, t1 = liste[liste.length - 1].t, dauer = Math.max(1, t1 - t0);
  const punkt = (e, wert) => `${(rand + (e.t - t0) / dauer * (B - 2 * rand)).toFixed(1)},${(H - rand - (wert - min) / spanne * (H - 2 * rand)).toFixed(1)}`;
  const linie = feld => liste.map(e => punkt(e, e[feld][w.id])).join(' ');
  const jetzt = liste[liste.length - 1], schnitt = Math.round(liste.reduce((s, e) => s + e.k[w.id], 0) / liste.length);
  const lage = jetzt.k[w.id] < schnitt * 0.92 ? T('günstig – unter dem Schnitt', 'cheap – below average')
             : jetzt.k[w.id] > schnitt * 1.08 ? T('teuer – über dem Schnitt', 'expensive – above average') : T('normal', 'normal');
  return `<div class="verlauf">
      <div class="verlauf-kopf"><span>📈 ${T(`Preise der letzten ${t1 - t0 + 1} Tage`, `Prices over the last ${t1 - t0 + 1} days`)}</span>
        <span class="verlauf-lage">${T('Kauf jetzt', 'Buy now')}: ${lage}</span></div>
      <svg class="verlauf-bild" viewBox="0 0 ${B} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="${linie('k')}" fill="none" stroke="#e9c46f" stroke-width="2" vector-effect="non-scaling-stroke"/>
        <polyline points="${linie('v')}" fill="none" stroke="#7fc47a" stroke-width="2" vector-effect="non-scaling-stroke"/>
      </svg>
      <div class="verlauf-fuss"><span><i class="farbe-kauf"></i>${T('Kauf', 'Buy')}</span><span><i class="farbe-verk"></i>${T('Verkauf', 'Sell')}</span>
        <span>${T('tief', 'low')} ${min} · ${T('hoch', 'high')} ${max} 🪙</span></div>
    </div>`;
}

// --- Handelsberater ---
// Bekannter Verkaufspreis in einer Oase (live, wenn man vor Ort Augen hat)
function bekannterPreis(o, w, art) {
  if (augenVorOrt(o)) return art === 'kauf' ? kaufPreis(o, w) : verkaufPreis(o, w);
  const p = S.wissen[o.id];
  const wert = p && p[art === 'kauf' ? 'kauf' : 'verk'][w.id];
  return typeof wert === 'number' ? wert : null;
}

function beraterVorschlaege(k) {
  const o = oase(k.ort);
  if (!o || !o.aktiv) return { einkauf: [], ladung: [] };
  const tempo = Math.max(1, reiseTempo(k));
  const frei = Math.max(0, Math.floor(kapazitaet(k) - ladungGewicht(k)));
  const feilschen = 0.03 * talentStufe(k, 'feilscher');
  const einkauf = [], ladung = [];
  for (const z of S.oasen) {
    if (z === o || !z.aktiv) continue;
    const tage = entfernung(o, z) / tempo;
    const wissen = S.wissen[z.id];
    const alter = augenVorOrt(z) ? 0 : wissen ? S.tag - wissen.tag : null;
    if (alter == null) continue;
    for (const w of WAREN) {
      if (w.id === 'wasser') continue;
      const verk = bekannterPreis(z, w, 'verk');
      if (verk == null) continue;
      const verkauf = verk * (1 + feilschen);
      // 1. Einkaufen hier, verkaufen dort
      const kauf = o.lager[w.id] >= 1 ? kaufPreis(o, w) * (1 - feilschen) : null;
      if (kauf != null && frei > 0) {
        const proStueck = verkauf - kauf;
        const menge = Math.min(frei, Math.floor(o.lager[w.id]), Math.floor(S.gold / Math.max(1, kauf)));
        if (proStueck > 2 && menge > 0) {
          const gesamt = proStueck * menge * 0.75;          // Preise bewegen sich beim Handeln – vorsichtig rechnen
          einkauf.push({ z, w, proStueck: Math.round(proStueck), menge, gesamt: Math.round(gesamt), tage, alter, wert: gesamt / (tage + 0.6) });
        }
      }
      // 2. Was ich schon dabei habe: wo bringt es am meisten?
      if (k.ladung[w.id] >= 1) {
        const hier = verkaufPreis(o, w) * (1 + feilschen);
        const mehr = verkauf - hier;
        if (mehr > 1) ladung.push({ z, w, mehr: Math.round(mehr), menge: Math.floor(k.ladung[w.id]), tage, alter, wert: mehr * k.ladung[w.id] / (tage + 0.6) });
      }
    }
  }
  einkauf.sort((a, b) => b.wert - a.wert);
  // Abwechslung: je Ware höchstens zwei Vorschläge
  const vielfalt = [];
  for (const v of einkauf) if (vielfalt.filter(x => x.w === v.w).length < 2) vielfalt.push(v);
  // Bei der Ladung je Ware nur den besten Ort
  const besteLadung = [];
  for (const v of ladung.sort((a, b) => b.wert - a.wert)) if (!besteLadung.some(x => x.w === v.w)) besteLadung.push(v);
  return { einkauf: vielfalt.slice(0, 5), ladung: besteLadung.slice(0, 4) };
}

function htmlBerater(o, handel) {
  if (!handel) return `<div class="hinweis">${T('Der Berater hilft, sobald deine ausgewählte Karawane in dieser Oase steht.', 'The adviser helps as soon as your selected caravan is in this oasis.')}</div>`;
  const k = handel.k, v = beraterVorschlaege(k);
  const alterText = a => a === 0 ? T('Preise aktuell', 'current prices') : T(`Preise von vor ${a} Tagen`, `prices from ${a} days ago`);
  const zielKnopf = z => `<button data-a="beraterZiel" data-v="${z.id}" class="${S.ziel === z.id ? 'an' : ''}">🎯 ${z.name}</button>`;
  let h = '';
  if (v.ladung.length) {
    h += `<div class="berater-titel">${T('Für deine Ladung', 'For your cargo')}</div>`;
    for (const x of v.ladung) {
      h += `<div class="berater-zeile"><div>${x.w.icon} <b>${x.menge} ${x.w.name}</b> → ${x.z.name}: <b class="plus">+${x.mehr}</b> 🪙/${T('Stk.', 'pc')}
              <div class="hinweis">${T(`ca. ${zahlText(x.tage, 1)} Tage · ${alterText(x.alter)}`, `about ${zahlText(x.tage, 1)} days · ${alterText(x.alter)}`)}</div></div>${zielKnopf(x.z)}</div>`;
    }
  }
  h += `<div class="berater-titel">${T('Lohnende Einkäufe hier', 'Profitable purchases here')}</div>`;
  if (!v.einkauf.length) {
    h += `<div class="hinweis">${T('Mit den Preisen, die du kennst, lohnt sich gerade nichts. Erkunde mehr Oasen oder schicke Boten – je mehr Preise du kennst, desto besser der Rat.',
                                  'With the prices you know, nothing pays right now. Visit more oases or send messengers – the more prices you know, the better the advice.')}</div>`;
  }
  for (const x of v.einkauf) {
    h += `<div class="berater-zeile"><div>${x.w.icon} <b>${x.w.name}</b> → ${x.z.name}: <b class="plus">+${x.proStueck}</b> 🪙/${T('Stk.', 'pc')}
            <div class="hinweis">${T(`${x.menge} Stk. ≈ +${zahlText(x.gesamt)} 🪙 · ${zahlText(x.tage, 1)} Tage · ${alterText(x.alter)}`,
                                     `${x.menge} pcs ≈ +${zahlText(x.gesamt)} 🪙 · ${zahlText(x.tage, 1)} days · ${alterText(x.alter)}`)}</div></div>${zielKnopf(x.z)}</div>`;
  }
  h += `<div class="hinweis berater-fuss">${T('Schätzung – Preise ändern sich, und beim Handeln bewegen sie sich.', 'An estimate – prices change, and they move as you trade.')}</div>`;
  return h;
}
