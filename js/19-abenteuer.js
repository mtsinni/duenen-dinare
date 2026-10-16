/* =====================================================================
   19. ABENTEUER – Karawansereien, unerforschte Gebiete mit Fundorten, Pilger
   ===================================================================== */

/* ---------------------------------------------------------------------
   A) KARAWANSEREIEN – Rastplätze mit Brunnen auf halber Strecke
   --------------------------------------------------------------------- */

const KARAWANSEREI = { preis: 2500, unterhalt: 8, mindestStrecke: 220, radius: 24 };
const SEREI_NAMEN = ['Han al-Ma', 'Han Nadschm', 'Han Rimal', 'Han Qamar', 'Han Sabil', 'Han Ghurub', 'Han Fadschr', 'Han Nachla'];

function karawanserei(id) { return S.karawansereien.find(s => s.id === id); }

// Wo würde die Karawanserei zwischen zwei Oasen stehen? Und darf sie dort hin?
function sereiPlatz(a, b) {
  const p = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  if (entfernung(a, b) < KARAWANSEREI.mindestStrecke) return { p, grund: T('Die Strecke ist zu kurz für eine Karawanserei.', 'The route is too short for a caravanserai.') };
  if (S.karawansereien.some(s => entfernung(s, p) < 80)) return { p, grund: T('Hier steht schon eine Karawanserei.', 'There is already a caravanserai here.') };
  if (S.oasen.some(o => entfernung(o, p) < 80)) return { p, grund: T('Zu nah an einer Oase.', 'Too close to an oasis.') };
  return { p, grund: null };
}

function karawansereiBauen() {
  const k = karawane(S.gewKarawane), a = k && oase(k.ort), b = oase(S.ziel);
  if (!a || !b || S.gold < KARAWANSEREI.preis) return;
  const { p, grund } = sereiPlatz(a, b);
  if (grund) { log(grund); zeichnePanel(); return; }
  S.gold -= KARAWANSEREI.preis;
  buche('Bauten', -KARAWANSEREI.preis);
  const benutzt = S.karawansereien.map(s => s.name);
  const name = SEREI_NAMEN.find(n => !benutzt.includes(n)) || 'Han ' + S.naechsteId;
  S.karawansereien.push({ id: S.naechsteId++, name, x: p.x, y: p.y });
  erkunden(p.x, p.y, 90);
  log(T(`🏰 Die Karawanserei ${name} zwischen ${a.name} und ${b.name} ist fertig! Durchziehende Karawanen füllen dort Wasser auf.`,
        `🏰 The caravanserai ${name} between ${a.name} and ${b.name} is finished! Passing caravans refill their water there.`), 'gut');
  ansehenAendern(a, 6); ansehenAendern(b, 6);
  zeichnePanel();
}

// Läuft jeden Frame für jede reisende Karawane (aus der Bewegung heraus)
function karawansereiPruefen(k) {
  for (const s of S.karawansereien) {
    if (k.rastBei === s.id || Math.hypot(k.x - s.x, k.y - s.y) > KARAWANSEREI.radius) continue;
    k.rastBei = s.id;
    const ziel = oase(k.nach);
    const rest = Math.max(0, entfernung(oase(k.von), ziel) - k.gereist);
    const bedarf = Math.ceil(karawanenDurst(k) * rest / Math.max(1, reiseTempo(k)) * 1.8) + 2;
    const platz = kapazitaet(k) - ladungGewicht(k);
    const auffuellen = Math.max(0, Math.min(bedarf - k.ladung.wasser, platz));
    k.ladung.wasser += auffuellen;
    k.durstig = false;
    if (auffuellen >= 1) log(T(`🏰 ${k.name} rastet in ${s.name} und füllt ${Math.round(auffuellen)} Wasser auf.`, `🏰 ${k.name} rests at ${s.name} and takes on ${Math.round(auffuellen)} water.`));
  }
}

// Wachen der Karawanserei halten Räuber fern: in der Nähe viel weniger Überfälle
function sereiSchutz(k) {
  return S.karawansereien.some(s => Math.hypot(k.x - s.x, k.y - s.y) < 70) ? 0.4 : 1;
}

function htmlKarawansereiBau(k) {
  const a = oase(k.ort), b = oase(S.ziel);
  if (!a || !b) return '';
  const { p, grund } = sereiPlatz(a, b);
  const unterwegs = S.karawansereien.filter(s => abstandPunktStrecke(s, a, b) < KARAWANSEREI.radius);
  let h = unterwegs.length ? `<div class="info">🏰 ${T('Unterwegs', 'On the way')}: ${unterwegs.map(s => s.name).join(', ')} – ${T('dort wird Wasser aufgefüllt.', 'water is refilled there.')}</div>` : '';
  if (!grund) {
    h += `<div class="info"><button data-a="serei" ${S.gold < KARAWANSEREI.preis ? 'disabled' : ''}>🏰 ${T('Karawanserei auf halber Strecke bauen', 'Build a caravanserai halfway')} (${KARAWANSEREI.preis} D)</button>
          <span class="hinweis">${T(`Brunnen zum Auffüllen und Wachen gegen Räuber, ${KARAWANSEREI.unterhalt} D/Tag.`, `A well for refilling and guards against robbers, ${KARAWANSEREI.unterhalt} D/day.`)}</span></div>`;
  }
  return h;
}

/* ---------------------------------------------------------------------
   B) UNERFORSCHTE GEBIETE UND FUNDORTE
      Die Wüste zwischen den Oasen liegt anfangs im Nebel. Reisende Karawanen
      und Kundschafter decken sie auf – und finden dabei vielleicht etwas.
   --------------------------------------------------------------------- */

const KUNDSCHAFTER_PREIS = 150;
const FUNDORT_ARTEN = {
  ruine:  { name: 'Ruinenstadt',        nameEn: 'Ruined city',      icon: '🏛️' },
  quelle: { name: 'Vergessene Quelle',  nameEn: 'Forgotten spring', icon: '💧' },
  schatz: { name: 'Vergrabener Schatz', nameEn: 'Buried treasure',  icon: '💰' },
};
const QUELLEN_NAMEN = ['Ain Sirr', 'Bir Chafi', 'Ain Hadiya', 'Bir Mansi', 'Ain Nadira'];

// Seltene oder veredelte Waren nur zeigen, wenn es sie hier gibt oder du welche besitzt
function besitztWare(id) {
  return S.karawanen.some(k => k.ladung[id] >= 1) || Object.values(S.gebaeude).some(g => g.lager[id] >= 1) ||
         Object.values(S.gebaeude).some(g => g.werkstatt && WERKSTAETTEN[g.werkstatt].ergebnis[id]);
}
function wareZeigen(w, lagerHier, o) {
  return !(w.selten || w.veredelt) || lagerHier >= 1 || besitztWare(w.id) || (o && o.hafen && w.nurHafen);
}

function imLand(p, rand = 50) {
  return p.x > rand && p.y > rand && p.y < KARTE_H - rand && p.x < kuesteX(p.y) - rand;
}

function erkundet(p) { return S.erkundet.some(e => Math.hypot(e.x - p.x, e.y - p.y) < e.r); }

// Ein Gebiet aufdecken – und schauen, ob dabei ein Fundort zum Vorschein kommt
function erkunden(x, y, r, durch = null) {
  if (S.erkundet.some(e => Math.hypot(e.x - x, e.y - y) < e.r * 0.35 && e.r >= r)) return;   // schon bekannt
  S.erkundet.push({ x: Math.round(x), y: Math.round(y), r });
  nebelGeaendert = true;
  for (const f of S.fundorte) {
    if (!f.entdeckt && Math.hypot(f.x - x, f.y - y) < r) fundortEntdecken(f, durch);
  }
}

function fundortEntdecken(f, durch) {
  f.entdeckt = true;
  const wer = durch ? durch : T('deine Kundschafter', 'your scouts');
  if (f.art === 'ruine') {
    const gold = zufallInt(500, 1100);
    S.gold += gold; buche('Funde', gold);
    erkunden(f.x, f.y, 260, durch);   // eine alte Karte in den Ruinen zeigt die Umgebung
    log(T(`🏛️ Entdeckung durch ${wer}: eine versunkene Ruinenstadt! Zwischen den Säulen liegen ${gold} Dinar – und eine alte Karte der Umgebung.`,
          `🏛️ Discovered by ${wer}: a lost ruined city! Among the columns lie ${gold} dinars – and an old map of the area.`), 'gut');
  } else if (f.art === 'schatz') {
    const gold = zufallInt(1500, 3000);
    S.gold += gold; buche('Funde', gold);
    log(T(`💰 Entdeckung durch ${wer}: ein vergrabener Schatz mit ${gold} Dinar!`, `💰 Discovered by ${wer}: a buried treasure worth ${gold} dinars!`), 'gut');
  } else if (f.art === 'quelle') {
    const benutzt = S.oasen.map(o => o.name);
    const name = QUELLEN_NAMEN.find(n => !benutzt.includes(n)) || 'Ain ' + S.naechsteId;
    const auswahl = WAREN.filter(w => !['wasser', 'gold'].includes(w.id) && !w.see && !w.mine && !w.veredelt);
    const o = neueOase(name, f.x, f.y, ['wasser', auswahl[zufallInt(0, auswahl.length - 1)].id], 60);
    o.wasser = 80;
    S.oasen.push(o);
    f.oase = o.id;
    log(T(`💧 Entdeckung durch ${wer}: eine vergessene Quelle! Daraus wird die neue Oase ${name}, erste Siedler sind schon unterwegs.`,
          `💧 Discovered by ${wer}: a forgotten spring! It becomes the new oasis of ${name}, and the first settlers are on their way.`), 'gut');
  }
  S.erfolge.funde = (S.erfolge.funde || 0) + 1;
}

// Kundschafter: decken ein Stück Wüste in der Richtung auf, die am wenigsten bekannt ist
function kundschafterAussenden() {
  const o = oase(S.gewOase);
  if (!o || !o.aktiv || S.gold < KUNDSCHAFTER_PREIS) return;
  S.gold -= KUNDSCHAFTER_PREIS;
  buche('Kundschafter', -KUNDSCHAFTER_PREIS);
  let bester = null;
  for (let i = 0; i < 12; i++) {
    const w = i / 12 * Math.PI * 2, d = zufall(150, 230);
    const p = { x: o.x + Math.cos(w) * d, y: o.y + Math.sin(w) * d * 0.8 };
    if (!imLand(p, 30)) continue;
    const neu = erkundet(p) ? 0 : 1 + Math.random();
    if (!bester || neu > bester.neu) bester = { p, neu };
  }
  if (!bester) { log(T('Die Kundschafter finden keinen Weg in unbekanntes Land.', 'The scouts find no way into unknown land.')); zeichnePanel(); return; }
  const vorher = S.fundorte.filter(f => f.entdeckt).length;
  erkunden(bester.p.x, bester.p.y, 130, T('deine Kundschafter aus ', 'your scouts from ') + o.name);
  if (S.fundorte.filter(f => f.entdeckt).length === vorher) log(T(`🔭 Deine Kundschafter aus ${o.name} kehren zurück und haben ein neues Stück Wüste kartiert.`, `🔭 Your scouts from ${o.name} return, having mapped a new stretch of desert.`));
  zeichnePanel();
}

// Zu Spielbeginn (oder in alten Spielständen): bekannte Gebiete und versteckte Fundorte anlegen
function abenteuerAnlegen() {
  if (!S.erkundet) {
    S.erkundet = [];
    for (const o of S.oasen) S.erkundet.push({ x: o.x, y: o.y, r: o.hafen ? 150 : 110 });
    for (const k of S.karawanen) S.erkundet.push({ x: k.x, y: k.y, r: 80 });
    if (S.eisenmine) S.erkundet.push({ x: S.eisenmine.x, y: S.eisenmine.y, r: 70 });
  }
  if (!S.fundorte) {
    S.fundorte = [];
    const arten = ['ruine', 'quelle', 'schatz', ['ruine', 'schatz', 'quelle'][zufallInt(0, 2)]];
    for (const art of arten) {
      for (let versuch = 0; versuch < 60; versuch++) {
        const p = { x: zufall(70, KARTE_B - 150), y: zufall(70, KARTE_H - 70) };
        const frei = imLand(p, 60) && !erkundet(p) &&
                     S.oasen.every(o => entfernung(o, p) > 160) &&
                     S.fundorte.every(f => entfernung(f, p) > 170);
        if (frei) { S.fundorte.push({ id: S.naechsteId++, art, x: p.x, y: p.y, entdeckt: false }); break; }
      }
    }
  }
  if (!S.karawansereien) S.karawansereien = [];
  if (!S.reisende) S.reisende = [];
}

// Täglich: reisende Karawanen erkunden ihre Umgebung
function erkundenTag() {
  for (const k of S.karawanen) if (k.nach != null) erkunden(k.x, k.y, 80, k.name);
}

/* ---------------------------------------------------------------------
   C) PILGER UND REISENDE – Passagiere statt Waren
   --------------------------------------------------------------------- */

function passagierAnzahl(k) { return (k.passagiere || []).reduce((s, p) => s + p.anzahl, 0); }

function reisendeTag() {
  S.reisende = S.reisende.filter(r => r.ablauf >= S.tag && oase(r.von).aktiv);
  if (Math.random() > 0.14 || S.reisende.length >= 4) return;
  const starts = S.oasen.filter(o => o.aktiv && !o.hafen && o.bev >= 400 && !S.reisende.some(r => r.von === o.id));
  if (!starts.length) return;
  const von = starts[zufallInt(0, starts.length - 1)];
  const hafen = S.oasen.find(o => o.hafen && o.aktiv);
  let ziel, art;
  if (hafen && Math.random() < 0.65) { ziel = hafen; art = 'pilger'; }
  else {
    const andere = S.oasen.filter(o => o.aktiv && o !== von && o.bev >= 500);
    if (!andere.length) return;
    ziel = andere[zufallInt(0, andere.length - 1)]; art = 'reisende';
  }
  const anzahl = zufallInt(4, 12);
  const weg = entfernung(von, ziel);
  const lohn = Math.round(anzahl * weg * 0.32 / 10) * 10;
  const frist = Math.ceil(weg / 45) + zufallInt(10, 18);
  S.reisende.push({ id: S.naechsteId++, von: von.id, ziel: ziel.id, anzahl, lohn, frist, art, ablauf: S.tag + zufallInt(6, 10) });
  log(art === 'pilger'
    ? T(`🧕 In ${von.name} sammeln sich ${anzahl} Pilger, die über ${ziel.name} nach Mekka reisen wollen. Sie zahlen ${lohn} Dinar.`,
        `🧕 ${anzahl} pilgrims are gathering in ${von.name}, bound for Mecca via ${ziel.name}. They pay ${lohn} dinars.`)
    : T(`🧳 ${anzahl} Reisende in ${von.name} suchen eine Karawane nach ${ziel.name} – ${lohn} Dinar Lohn.`,
        `🧳 ${anzahl} travellers in ${von.name} are looking for a caravan to ${ziel.name} – ${lohn} dinars.`));
}

// "Pilger" / "Reisende" in der gewählten Sprache
function reisendeWort(art) { return art === 'pilger' ? T('Pilger', 'pilgrims') : T('Reisende', 'travellers'); }
function reisendeIcon(art) { return art === 'pilger' ? '🧕' : '🧳'; }

function reisendeMitnehmen(id) {
  const r = S.reisende.find(x => x.id === id);
  const h = kannHandeln();
  if (!r || !h || h.o.id !== r.von) return;
  if (kapazitaet(h.k) - ladungGewicht(h.k) < r.anzahl * 2) {
    log(T(`${h.k.name} hat nicht genug Platz – jeder Reisende braucht 2 Lastplätze.`, `${h.k.name} does not have enough room – each traveller needs 2 load spaces.`)); zeichnePanel(); return;
  }
  S.reisende = S.reisende.filter(x => x !== r);
  h.k.passagiere.push({ ziel: r.ziel, von: r.von, anzahl: r.anzahl, lohn: r.lohn, bisTag: S.tag + r.frist, art: r.art });
  log(T(`${reisendeIcon(r.art)} ${r.anzahl} ${reisendeWort(r.art)} steigen in ${h.k.name} zu. Ziel: ${oase(r.ziel).name}, bis Tag ${S.tag + r.frist}.`,
        `${reisendeIcon(r.art)} ${r.anzahl} ${reisendeWort(r.art)} join ${h.k.name}. Destination: ${oase(r.ziel).name}, by day ${S.tag + r.frist}.`));
  zeichnePanel();
}

// Bei jeder Ankunft: Wer hier aussteigen möchte, zahlt
function passagiereAbsetzen(k, o) {
  for (const p of [...k.passagiere]) {
    if (p.ziel !== o.id) continue;
    const puenktlich = S.tag <= p.bisTag;
    const lohn = puenktlich ? p.lohn : Math.round(p.lohn / 2);
    S.gold += lohn; k.bilanz += lohn; buche('Reisende', lohn);
    k.passagiere = k.passagiere.filter(x => x !== p);
    epGeben(k, 20);
    ansehenAendern(o, puenktlich ? 6 : 1);
    const herkunft = oase(p.von);
    if (herkunft && puenktlich) ansehenAendern(herkunft, 6);
    log(puenktlich
      ? T(`${reisendeIcon(p.art)} ${p.anzahl} ${reisendeWort(p.art)} erreichen ${o.name} und zahlen dankbar ${lohn} Dinar.`,
          `${reisendeIcon(p.art)} ${p.anzahl} ${reisendeWort(p.art)} reach ${o.name} and gratefully pay ${lohn} dinars.`)
      : T(`${reisendeIcon(p.art)} Die ${p.art === 'pilger' ? 'Pilger' : 'Reisenden'} kommen zu spät in ${o.name} an und zahlen nur ${lohn} Dinar.`,
          `${reisendeIcon(p.art)} The ${reisendeWort(p.art)} reach ${o.name} late and pay only ${lohn} dinars.`), puenktlich ? 'gut' : 'schlecht');
  }
}

// Wenn eine Karawane verschollen ist, sind auch ihre Reisenden verloren
function passagiereVerloren(k) {
  for (const p of k.passagiere || []) {
    const herkunft = oase(p.von);
    if (herkunft) ansehenAendern(herkunft, -20);
    log(T(`🕯️ Mit ${k.name} sind auch ${p.anzahl} Reisende verschollen. In ${herkunft ? herkunft.name : 'ihrer Heimat'} trauert man.`,
          `🕯️ ${p.anzahl} travellers were lost with ${k.name}. ${herkunft ? herkunft.name : 'Their home'} is in mourning.`), 'schlecht');
  }
}

function htmlReisende(o, handel) {
  const liste = S.reisende.filter(r => r.von === o.id);
  if (!liste.length) return '';
  let s = '';
  for (const r of liste) {
    const platz = handel ? kapazitaet(handel.k) - ladungGewicht(handel.k) : 0;
    s += `<div class="info">${reisendeIcon(r.art)} <b>${r.anzahl} ${reisendeWort(r.art)}</b> ${T('nach', 'to')} ${oase(r.ziel).name}
          · ${r.lohn} D · ${T(`${r.frist} Tage Zeit`, `${r.frist} days`)}
          ${handel ? `<button data-a="reisende" data-v="${r.id}" ${platz < r.anzahl * 2 ? 'disabled' : ''}>${T('Mitnehmen', 'Take along')}</button>` : ''}</div>`;
  }
  s += `<div class="hinweis">${T('Jeder Reisende braucht 2 Lastplätze und trinkt unterwegs mit. Wer zu spät ankommt, zahlt nur die Hälfte.',
                                 'Each traveller needs 2 load spaces and drinks on the way. Late arrivals pay only half.')}</div>`;
  return s;
}

function htmlPassagiere(k) {
  return (k.passagiere || []).map(p => {
    const rest = p.bisTag - S.tag;
    return `<div class="info">${reisendeIcon(p.art)} ${p.anzahl} ${reisendeWort(p.art)} ${T('nach', 'to')} <b>${oase(p.ziel).name}</b> ·
            ${p.lohn} D · <span class="${rest <= 3 ? 'warnung' : ''}">${rest >= 0 ? T(`noch ${rest} Tage`, `${rest} days left`) : T('verspätet', 'late')}</span></div>`;
  }).join('');
}

/* ---------------------------------------------------------------------
   D) AUF DER KARTE: Nebel, Karawansereien, entdeckte Fundorte
   --------------------------------------------------------------------- */

let nebelBild = null, nebelGeaendert = true;

function zeichneNebel() {
  if (!S.erkundet) return;
  if (!nebelBild || nebelGeaendert) {
    // Halbe Auflösung reicht – der Nebel ist ohnehin weich
    if (!nebelBild) { nebelBild = document.createElement('canvas'); nebelBild.width = KARTE_B / 2; nebelBild.height = KARTE_H / 2; }
    const g = nebelBild.getContext('2d');
    g.setTransform(0.5, 0, 0, 0.5, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, KARTE_B, KARTE_H);
    g.fillStyle = 'rgba(214,190,148,.9)';
    g.fillRect(0, 0, KARTE_B, KARTE_H);
    g.strokeStyle = 'rgba(120,88,48,.26)'; g.lineWidth = 2;   // Schraffur wie auf alten Karten
    for (let x = -KARTE_H; x < KARTE_B; x += 14) { g.beginPath(); g.moveTo(x, KARTE_H); g.lineTo(x + KARTE_H, 0); g.stroke(); }
    g.globalCompositeOperation = 'destination-out';            // erkundete Kreise "radieren" den Nebel weg
    for (const e of S.erkundet) {
      const v = g.createRadialGradient(e.x, e.y, e.r * 0.55, e.x, e.y, e.r);
      v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = v;
      g.beginPath(); g.arc(e.x, e.y, e.r, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    nebelGeaendert = false;
  }
  // Das Meer ist bekannt – darum nur die Landfläche benebeln
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0, 0);
  for (let y = 0; y <= KARTE_H; y += 10) ctx.lineTo(kuesteX(y) - 4, y);
  ctx.lineTo(0, KARTE_H); ctx.closePath(); ctx.clip();
  ctx.drawImage(nebelBild, 0, 0, KARTE_B, KARTE_H);
  ctx.restore();
}

function zeichneKarawanserei(s) {
  const x = s.x, y = s.y;
  ctx.fillStyle = 'rgba(60,35,15,.25)';
  ctx.beginPath(); ctx.ellipse(x + 3, y + 9, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Innenhof von oben schräg gesehen: hintere Mauer, Hof, vordere Mauer, Ecktürme
  ctx.fillStyle = '#b8895a'; ctx.fillRect(x - 16, y - 12, 32, 5);                       // hintere Mauer
  ctx.fillStyle = '#d9b98a'; ctx.fillRect(x - 16, y - 7, 32, 12);                       // Hof
  ctx.fillStyle = '#2c4f5a'; ctx.beginPath(); ctx.ellipse(x, y - 1, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();   // Brunnen
  ctx.strokeStyle = '#8f7a63'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#c4965e'; ctx.fillRect(x - 16, y + 5, 32, 6);                        // vordere Mauer
  ctx.fillStyle = '#4a2f1a'; ctx.fillRect(x - 3, y + 6, 6, 5);                          // Tor
  for (const tx of [-17, 13]) {                                                         // Ecktürme
    ctx.fillStyle = '#a37443'; ctx.fillRect(x + tx, y - 15, 4, 26);
    ctx.fillStyle = '#ebcf9f'; ctx.fillRect(x + tx - 0.5, y - 16, 5, 2);
  }
  ctx.strokeStyle = '#3b2a20'; ctx.lineWidth = 1;                                       // Fahne in Indigo und Messing
  ctx.beginPath(); ctx.moveTo(x + 15, y - 16); ctx.lineTo(x + 15, y - 28); ctx.stroke();
  ctx.fillStyle = FARBE.indigo; ctx.fillRect(x + 15, y - 28, 9, 5);
  ctx.fillStyle = FARBE.messing; ctx.fillRect(x + 15, y - 24, 9, 1.2);
  beschriftung(s.name, x, y + 22, 12, 'rgba(60,35,18,.95)', true);
}

function zeichneFundort(f) {
  if (!f.entdeckt || f.art === 'quelle') return;   // aus Quellen sind Oasen geworden
  const x = f.x, y = f.y;
  if (f.art === 'ruine') {
    ctx.fillStyle = 'rgba(60,35,15,.2)';
    ctx.beginPath(); ctx.ellipse(x, y + 4, 24, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d8c4a0';
    for (const [dx, h] of [[-16, 14], [-8, 8], [0, 17], [8, 5], [15, 11]]) ctx.fillRect(x + dx - 2, y + 3 - h, 4, h);   // Säulenstümpfe
    ctx.fillRect(x - 18, y - 13, 20, 3);                                                      // Architrav
    ctx.fillStyle = 'rgba(90,70,50,.6)';
    for (let i = 0; i < 6; i++) ctx.fillRect(x - 20 + i * 7, y + 3, 4, 2);                    // Trümmer
  } else if (f.art === 'schatz') {
    ctx.fillStyle = '#6b4423'; ctx.fillRect(x - 8, y - 6, 16, 9);                             // offene Truhe
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(x - 8, y - 12, 16, 5);
    ctx.fillStyle = '#e8c45a';
    ctx.beginPath(); ctx.arc(x - 3, y - 6, 2.5, 0, Math.PI * 2); ctx.arc(x + 2, y - 7, 2.5, 0, Math.PI * 2); ctx.arc(x + 5, y - 5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = FARBE.messing; ctx.fillRect(x - 8, y - 3, 16, 1.2);
  }
  beschriftung(FUNDORT_ARTEN[f.art].name, x, y + 16, 11, 'rgba(70,45,20,.9)', true);
}

function zeichneAbenteuer() {
  for (const s of S.karawansereien || []) zeichneKarawanserei(s);
  for (const f of S.fundorte || []) zeichneFundort(f);
}

function abenteuerLichter(nacht) {
  for (const s of S.karawansereien || []) leuchten(s.x, s.y - 2, 26, '255,180,80', 0.55 * nacht);
}
