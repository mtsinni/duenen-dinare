/* =====================================================================
   28. TALENTE DER FÜHRER UND AUSRÜSTUNG DER KARAWANEN
   Talente: Steigt ein Führer eine Stufe auf, darf er sich spezialisieren.
   Ausrüstung: einmal kaufen, gilt für die ganze Karawane.
   ===================================================================== */

const TALENTE = {
  feilscher:   { icon: '⚖', name: 'Feilscher',     nameEn: 'Haggler',
                 text: 'Kauft 3 % billiger und verkauft 3 % teurer (pro Stufe).', textEn: 'Buys 3% cheaper and sells 3% dearer (per level).' },
  spurenleser: { icon: '🧭', name: 'Spurenleser',   nameEn: 'Tracker',
                 text: '+6 % Tempo und viel seltener von einer Fata Morgana getäuscht (pro Stufe).', textEn: '+6% speed and fooled by mirages far less often (per level).' },
  krieger:     { icon: '⚔', name: 'Krieger',       nameEn: 'Warrior',
                 text: '+8 % Abwehr gegen Räuber und Plünderer (pro Stufe).', textEn: '+8% defence against robbers and raiders (per level).' },
  wasserkundig:{ icon: '💧', name: 'Wasserkundiger', nameEn: 'Water finder',
                 text: '−8 % Wasserverbrauch der Tiere (pro Stufe).', textEn: '−8% water use by the animals (per level).' },
};
const TALENT_MAX = 3;

function talentStufe(k, id) { return (k && k.fuehrer && k.fuehrer.talente && k.fuehrer.talente[id]) || 0; }
function offeneTalente(k) { return (k.fuehrer && k.fuehrer.offeneTalente) || 0; }

// Aufruf bei jedem Stufenaufstieg (aus epGeben)
function talentGewinnen(k, anzahl) {
  if (!k.fuehrer.talente) k.fuehrer.talente = {};
  k.fuehrer.offeneTalente = offeneTalente(k) + anzahl;
  // Ist gerade kein anderes Fenster offen, gleich zur Wahl einladen
  if (typeof statistikOffen !== 'undefined' && !statistikOffen && !menueOffen && !(typeof startOffen !== 'undefined' && startOffen)) {
    talentFensterOeffnen(k.id);
  }
}

let talentKarawane = null;
function talentFensterOeffnen(kid) {
  talentKarawane = kid;
  fensterArt = 'talent';
  statistikUmschalten(true);
}

function htmlTalentFenster() {
  const k = karawane(talentKarawane);
  if (!k) return `<div class="fenster"><button data-s="zu">✕</button></div>`;
  let h = `<div class="fenster talent-fenster">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <h2 style="margin:0">⭐ ${T('Ein Talent wählen', 'Choose a talent')}</h2>
      <button data-s="zu">✕ ${T('Später', 'Later')}</button>
    </div>
    <p>${T(`<b>${k.fuehrer.name}</b> (${k.name}) ist jetzt Stufe ${fuehrerStufe(k)}. Worauf soll er sich spezialisieren?`,
           `<b>${k.fuehrer.name}</b> (${k.name}) is now level ${fuehrerStufe(k)}. What should he specialise in?`)}
       ${offeneTalente(k) > 1 ? `<span class="hinweis">(${T(`${offeneTalente(k)} Wahlen offen`, `${offeneTalente(k)} picks open`)})</span>` : ''}</p>
    <div class="talent-liste">`;
  for (const id in TALENTE) {
    const t = TALENTE[id], st = talentStufe(k, id), voll = st >= TALENT_MAX;
    h += `<button class="talent-karte" data-a="talentWahl" data-v="${id}" ${voll ? 'disabled' : ''}>
        <span class="talent-icon">${t.icon}</span>
        <b>${T(t.name, t.nameEn)}</b> <span class="talent-stufe">${'●'.repeat(st)}${'○'.repeat(TALENT_MAX - st)}</span>
        <span class="hinweis">${T(t.text, t.textEn)}</span>
      </button>`;
  }
  return h + '</div></div>';
}

function talentWaehlen(id) {
  const k = karawane(talentKarawane);
  if (!k || offeneTalente(k) < 1 || !TALENTE[id] || talentStufe(k, id) >= TALENT_MAX) return;
  k.fuehrer.talente[id] = talentStufe(k, id) + 1;
  k.fuehrer.offeneTalente--;
  ton('erfolg');
  log(T(`⭐ ${k.fuehrer.name} wird ${TALENTE[id].name} (Stufe ${k.fuehrer.talente[id]}).`,
        `⭐ ${k.fuehrer.name} becomes a ${TALENTE[id].nameEn.toLowerCase()} (level ${k.fuehrer.talente[id]}).`), 'gut');
  if (offeneTalente(k) > 0) zeichneStatistik();
  else { statistikUmschalten(false); fensterArt = 'statistik'; }
  zeichnePanel();
}

// --- Wirkungen der Talente (werden an den passenden Stellen im Spiel abgefragt) ---
function kaufPreisFuer(k, o, w) { const st = talentStufe(k, 'feilscher'); const p = kaufPreis(o, w); return st ? Math.max(1, Math.floor(p * (1 - 0.03 * st))) : p; }
function verkaufPreisFuer(k, o, w) { const st = talentStufe(k, 'feilscher'); const p = verkaufPreis(o, w); return st && p > 0 ? Math.ceil(p * (1 + 0.03 * st)) : p; }

// --- Ausrüstung ---
const AUSRUESTUNG = {
  schlaeuche: { icon: '💧', preis: 300, name: 'Wasserschläuche', nameEn: 'Water skins',
                text: 'Wasser wiegt nur noch halb so viel – mehr Platz für Waren.', textEn: 'Water weighs only half as much – more room for goods.' },
  segel:      { icon: '☀', preis: 250, name: 'Sonnensegel', nameEn: 'Sun awnings',
                text: 'Weniger Durst am Tag, besonders in der Mittagshitze.', textEn: 'Less thirst by day, especially in the midday heat.' },
  laternen:   { icon: '🌙', preis: 200, name: 'Laternen', nameEn: 'Lanterns',
                text: 'Nachts 15 % schneller.', textEn: '15% faster at night.' },
  waffen:     { icon: '🗡', preis: 400, name: 'Säbel & Schilde', nameEn: 'Sabres & shields',
                text: '+10 % Abwehr bei Überfällen.', textEn: '+10% defence against raids.' },
};
function hatAusruestung(k, id) { return !!(k && k.ausruestung && k.ausruestung[id]); }

function ausruestungKaufen(id) {
  const k = karawane(S.gewKarawane), a = AUSRUESTUNG[id];
  if (!k || !a || k.ort == null || hatAusruestung(k, id) || S.gold < a.preis) return;
  if (!k.ausruestung) k.ausruestung = {};
  k.ausruestung[id] = true;
  S.gold -= a.preis;
  buche('Gebäude', -a.preis);
  ton('kaufen');
  log(T(`🎒 ${k.name} hat jetzt ${a.name}.`, `🎒 ${k.name} now has ${a.nameEn.toLowerCase()}.`), 'gut');
  zeichnePanel();
}

function htmlAusruestung(o) {
  const k = karawane(S.gewKarawane);
  if (!k || k.ort !== o.id) return `<div class="hinweis">${T('Ausrüstung kauft man für die ausgewählte Karawane – sie muss hier stehen.', 'Equipment is bought for the selected caravan – it has to be here.')}</div>`;
  let h = `<div class="hinweis">${T(`Für ${k.name}:`, `For ${k.name}:`)}</div>`;
  for (const id in AUSRUESTUNG) {
    const a = AUSRUESTUNG[id], hat = hatAusruestung(k, id);
    h += `<div class="zeile-karte"><div>${a.icon} <b>${T(a.name, a.nameEn)}</b><div class="hinweis">${T(a.text, a.textEn)}</div></div>
      ${hat ? `<span class="vorhanden">✅ ${T('vorhanden', 'owned')}</span>`
            : `<button data-a="ausruestung" data-v="${id}" ${S.gold < a.preis ? 'disabled' : ''}>${a.preis} 🪙</button>`}</div>`;
  }
  return h;
}

// Kurzübersicht im Karawanen-Reiter: Talente und Ausrüstung
function htmlKarawanenExtras(k) {
  let h = '';
  const talente = Object.keys(TALENTE).filter(id => talentStufe(k, id));
  if (talente.length || offeneTalente(k)) {
    h += `<div class="info extras-zeile">${talente.map(id => `<span class="extra-marke" title="${T(TALENTE[id].text, TALENTE[id].textEn)}">${TALENTE[id].icon} ${T(TALENTE[id].name, TALENTE[id].nameEn)} ${'●'.repeat(talentStufe(k, id))}</span>`).join(' ')}
      ${offeneTalente(k) ? `<button data-a="talentFenster" data-v="${k.id}" class="an">⭐ ${T('Talent wählen', 'Choose talent')} (${offeneTalente(k)})</button>` : ''}</div>`;
  }
  const ausr = Object.keys(AUSRUESTUNG).filter(id => hatAusruestung(k, id));
  if (ausr.length) h += `<div class="info extras-zeile">🎒 ${ausr.map(id => `<span class="extra-marke" title="${T(AUSRUESTUNG[id].text, AUSRUESTUNG[id].textEn)}">${AUSRUESTUNG[id].icon} ${T(AUSRUESTUNG[id].name, AUSRUESTUNG[id].nameEn)}</span>`).join(' ')}</div>`;
  return h;
}
