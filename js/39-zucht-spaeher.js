/* =====================================================================
   39. KUNDSCHAFTER UND KAMELZUCHT
   A) Kundschafter: reitet voraus, warnt vor Gefahren, schützt vor Hinterhalten
   B) Zuchtstall: Kamele vermehren sich – und aus guten Linien werden Rennkamele (Mehari)
   ===================================================================== */

/* ---------------- A) Kundschafter ---------------- */
const SPAEHER = { preis: 150, unterhalt: 3, schutz: 0.65, sicht: 130 };

function spaeherAnheuern() {
  const k = karawane(S.gewKarawane), o = k && oase(k.ort);
  if (!k || !o || !o.aktiv || k.spaeher || S.gold < SPAEHER.preis) return;
  S.gold -= SPAEHER.preis; buche('Personal', -SPAEHER.preis);
  k.spaeher = { name: FUEHRER_NAMEN[zufallInt(0, FUEHRER_NAMEN.length - 1)], gewarnt: {} };
  log(T(`🔭 ${k.spaeher.name} reitet ab jetzt als Kundschafter vor ${k.name} her.`, `🔭 ${k.spaeher.name} now rides ahead of ${k.name} as a scout.`), 'gut');
  zeichnePanel();
}
function spaeherEntlassen() {
  const k = karawane(S.gewKarawane);
  if (!k || !k.spaeher) return;
  log(T(`🔭 ${k.name} verabschiedet den Kundschafter ${k.spaeher.name}.`, `🔭 ${k.name} bids farewell to the scout ${k.spaeher.name}.`));
  k.spaeher = null;
  zeichnePanel();
}

// Was liegt auf dem Weg? (wird beim Aufbruch gemeldet)
function spaeherBericht(k, a, b) {
  const funde = [];
  const lager = aktiveRaeuber().filter(g => abstandPunktStrecke(g, a, b) < g.r + 15).length;
  if (lager) funde.push(lager > 1 ? T(`⚔️ ${lager} Räuberlager`, `⚔️ ${lager} robber camps`) : T('⚔️ ein Räuberlager', '⚔️ a robber camp'));
  for (const s of S.stuerme) if (abstandPunktStrecke(s, a, b) < s.r + 120) { funde.push(T('🌪️ ein Sandsturm', '🌪️ a sandstorm')); break; }
  if (routeDurchDuene(a, b)) funde.push(T('🏜️ eine Wanderdüne', '🏜️ a shifting dune'));
  const info = streckenInfo(a, b);
  for (const f of info.fluesse) if (hochwasser(f)) funde.push(T(`🌊 Hochwasser am ${flussName(f)}`, `🌊 floods on the ${flussName(f)}`));
  if ((S.pluenderer || []).some(p => abstandPunktStrecke(p, a, b) < 120)) funde.push(T('🐎 Plünderer in der Nähe', '🐎 raiders nearby'));
  return funde;
}

function spaeherAufbruch(k) {
  if (!k.spaeher) return;
  k.spaeher.gewarnt = {};
  const a = oase(k.von), b = oase(k.nach);
  const funde = spaeherBericht(k, a, b);
  if (!funde.length && k.route && k.route.aktiv) return;   // auf Routen nur melden, wenn es etwas zu melden gibt
  if (funde.length) {
    const text = funde.join(', ');
    log(T(`🔭 ${k.spaeher.name} kundschaftet den Weg nach ${b.name} aus: ${text}!`, `🔭 ${k.spaeher.name} scouts the way to ${b.name}: ${text}!`), 'schlecht');
    melden('🔭', T(`Kundschafter: Auf dem Weg nach ${b.name} – ${text}.`, `Scout: on the way to ${b.name} – ${text}.`), 'schlecht', { karawane: k.id });
  } else {
    log(T(`🔭 ${k.spaeher.name}: „Der Weg nach ${b.name} ist frei.“`, `🔭 ${k.spaeher.name}: "The way to ${b.name} is clear."`), 'gut');
  }
}

// Jedes Bild: nahende Stürme und Plünderer früh bemerken (einmal je Gefahr)
function spaeherPruefen(k) {
  if (!k.spaeher || k.nach == null) return;
  const w = k.spaeher.gewarnt;
  for (const s of S.stuerme) {
    const d = Math.hypot(k.x - s.x, k.y - s.y);
    const id = 's' + Math.round(s.dx) + Math.round(s.dy);
    if (d < s.r + SPAEHER.sicht && d > s.r && !w[id]) {
      w[id] = 1;
      melden('🔭', T(`${k.name}: Der Kundschafter sieht einen Sandsturm kommen!`, `${k.name}: the scout sees a sandstorm coming!`), 'schlecht', { karawane: k.id });
    }
  }
  for (const p of S.pluenderer || []) {
    const d = Math.hypot(k.x - p.x, k.y - p.y);
    if (d < SPAEHER.sicht * 1.4 && !w['p' + p.id]) {
      w['p' + p.id] = 1;
      melden('🔭', T(`${k.name}: Reiter am Horizont – Plünderer!`, `${k.name}: riders on the horizon – raiders!`), 'schlecht', { karawane: k.id });
    }
  }
}

// Der Kundschafter auf der Karte: ein kleiner Reiter ein Stück voraus
function zeichneSpaeher(k, x, y, rx, ry, laeuft) {
  if (!k.spaeher || k.nach == null) return;
  const l = Math.hypot(rx, ry) || 1;
  const sx = x + rx / l * 26, sy = y + ry / l * 26 - 2;
  zeichneZug(['pferd'], sx, sy, rx, ry, laeuft, FARBE.tinte, FARBE.indigo, 1.2, {});
  ctx.strokeStyle = 'rgba(40,52,99,.4)'; ctx.lineWidth = 0.8; ctx.setLineDash([1.5, 2.5]);
  ctx.beginPath(); ctx.moveTo(x + rx / l * 6, y + ry / l * 6); ctx.lineTo(sx - rx / l * 6, sy - ry / l * 6); ctx.stroke(); ctx.setLineDash([]);
}

function htmlSpaeher(k) {
  const anOase = k.ort != null && oase(k.ort).aktiv;
  if (k.spaeher) {
    return `<div class="info">🔭 ${T('Kundschafter', 'Scout')}: <b>${k.spaeher.name}</b> · ${SPAEHER.unterhalt} 🪙/${T('Tag', 'day')}
      ${anOase ? `<button data-a="spaeherWeg">${T('entlassen', 'dismiss')}</button>` : ''}</div>`;
  }
  if (!anOase) return '';
  return `<div class="info">🔭 ${T('Kundschafter', 'Scout')}: <button data-a="spaeher" ${S.gold < SPAEHER.preis ? 'disabled' : ''}>${T('anheuern', 'hire')} (${SPAEHER.preis} 🪙)</button>
    <span class="hinweis">${T('warnt vor Räubern, Stürmen und Hochwasser auf dem Weg, ⅓ weniger Überfälle', 'warns of robbers, storms and floods on the way, ⅓ fewer ambushes')}</span></div>`;
}

/* ---------------- B) Kamelzucht ---------------- */
const ZUCHT = {
  preis: 2000, ausbau: 3000, unterhalt: 6, futter: 1,
  platz: [0, 8, 14], tageBisReif: 20,
  chance: 0.045,          // pro Tag und Paar
  meharAnteil: 0.3,       // ab Stufe 2: so viele Kamelfohlen sind Rennkamele
};
const ZUCHT_TYPEN = ['kamel', 'mehari'];

function zuchtBelegt(z = S.zucht) { return z ? ZUCHT_TYPEN.reduce((s, t) => s + (z.tiere[t] || 0), 0) + z.fohlen.length : 0; }

function zuchtBauen() {
  const o = oase(S.gewOase);
  if (S.zucht || !o || !o.aktiv || o.bev < 300 || S.gold < ZUCHT.preis) return;
  S.gold -= ZUCHT.preis; buche('Bauten', -ZUCHT.preis);
  S.zucht = { oase: o.id, stufe: 1, tiere: { kamel: 0, mehari: 0 }, fohlen: [] };
  log(T(`🐪 In ${o.name} steht jetzt dein Zuchtstall! Bring mindestens zwei Kamele hin, dann gibt es bald Nachwuchs.`,
        `🐪 Your breeding stable now stands in ${o.name}! Bring at least two camels and there will soon be young ones.`), 'gut');
  if (typeof effektBauen === 'function') try { effektBauen(o.x, o.y); } catch (e) {}
  zeichnePanel();
}
function zuchtAusbauen() {
  const z = S.zucht;
  if (!z || z.stufe >= 2 || S.gold < ZUCHT.ausbau) return;
  S.gold -= ZUCHT.ausbau; buche('Bauten', -ZUCHT.ausbau);
  z.stufe = 2;
  log(T('🐪 Der Zuchtstall ist ausgebaut: mehr Platz – und mit etwas Glück werden aus deinen Kamelen nun Mehari, schnelle Rennkamele!',
        '🐪 The stable has been expanded: more room – and with luck your camels now give birth to Mehari, swift racing camels!'), 'gut');
  zeichnePanel();
}

// Tiere zwischen Karawane und Stall hin- und herbringen
function zuchtEinstellen(typ) {
  const z = S.zucht, k = karawane(S.gewKarawane);
  if (!z || !k || k.ort !== z.oase || !(k.tiere[typ] > 0) || zuchtBelegt() >= ZUCHT.platz[z.stufe]) return;
  if (tierAnzahl(k) <= 1) { log(T('Die Karawane braucht mindestens ein Tier.', 'The caravan needs at least one animal.')); zeichnePanel(); return; }
  k.tiere[typ]--; z.tiere[typ] = (z.tiere[typ] || 0) + 1;
  zeichnePanel();
}
function zuchtAbholen(typ) {
  const z = S.zucht, k = karawane(S.gewKarawane);
  if (!z || !k || k.ort !== z.oase || !(z.tiere[typ] > 0)) return;
  z.tiere[typ]--; k.tiere[typ] = (k.tiere[typ] || 0) + 1;
  ton('tier');
  zeichnePanel();
}
function zuchtVerkaufen(typ) {
  const z = S.zucht;
  if (!z || !(z.tiere[typ] > 0)) return;
  z.tiere[typ]--;
  const erloes = Math.round(TIERE[typ].preis * 0.6);
  S.gold += erloes; buche('Handel', erloes);
  log(T(`🐪 Ein ${TIERE[typ].name} aus deiner Zucht wird für ${erloes} Dinar verkauft.`, `🐪 A ${TIERE[typ].nameEn.toLowerCase()} from your stable is sold for ${erloes} dinars.`));
  zeichnePanel();
}

function zuchtUnterhalt() {
  const z = S.zucht;
  return z ? ZUCHT.unterhalt + ZUCHT.futter * zuchtBelegt(z) : 0;
}

function zuchtTag() {
  const z = S.zucht;
  if (!z) return;
  const kosten = zuchtUnterhalt();
  S.gold -= kosten; buche('Unterhalt', -kosten);
  const o = oase(z.oase);
  // Fohlen werden erwachsen
  for (const f of z.fohlen.filter(f => S.tag >= f.reifTag)) {
    z.tiere[f.typ] = (z.tiere[f.typ] || 0) + 1;
    log(T(`🐪 In deinem Zuchtstall ist ein junges ${TIERE[f.typ].name} herangewachsen.`, `🐪 A young ${TIERE[f.typ].nameEn.toLowerCase()} has grown up in your stable.`), 'gut');
  }
  z.fohlen = z.fohlen.filter(f => S.tag < f.reifTag);
  if (!o || !o.aktiv) return;
  // Nachwuchs: je Paar eine kleine Chance pro Tag – solange Platz ist
  for (const typ of ZUCHT_TYPEN) {
    const paare = Math.floor((z.tiere[typ] || 0) / 2);
    for (let i = 0; i < paare; i++) {
      if (zuchtBelegt(z) >= ZUCHT.platz[z.stufe] || Math.random() > ZUCHT.chance * (z.stufe === 2 ? 1.25 : 1)) continue;
      const kind = typ === 'kamel' && z.stufe >= 2 && Math.random() < ZUCHT.meharAnteil ? 'mehari' : typ;
      z.fohlen.push({ typ: kind, reifTag: S.tag + ZUCHT.tageBisReif });
      log(T(`🐣 Nachwuchs im Zuchtstall von ${o.name}: ein ${kind === 'mehari' ? 'Mehari-Fohlen – ein künftiges Rennkamel' : 'Kamelfohlen'}!`,
            `🐣 New arrival in the stable at ${o.name}: a ${kind === 'mehari' ? 'Mehari foal – a future racing camel' : 'camel foal'}!`), 'gut');
      melden('🐪', T(`Ein ${kind === 'mehari' ? 'Mehari' : 'Kamel'}fohlen ist geboren!`, `A ${kind === 'mehari' ? 'Mehari' : 'camel'} foal has been born!`), 'gut', { oase: o.id });
      zaehle(kind === 'mehari' ? 'mehari' : 'fohlen');
    }
  }
}

function zuchtWert() {
  const z = S.zucht;
  if (!z) return 0;
  let w = ZUCHT.preis * 0.6 + (z.stufe >= 2 ? ZUCHT.ausbau * 0.6 : 0);
  for (const t of ZUCHT_TYPEN) w += (z.tiere[t] || 0) * TIERE[t].preis * 0.6;
  for (const f of z.fohlen) w += TIERE[f.typ].preis * 0.3;
  return w;
}

function htmlZucht(o) {
  const z = S.zucht, k = karawane(S.gewKarawane), hier = k && k.ort === o.id;
  if (!z) {
    if (o.bev < 300) return `<p class="hinweis">${T('Ein Zuchtstall braucht eine Oase mit mindestens 300 Einwohnern.', 'A breeding stable needs an oasis with at least 300 inhabitants.')}</p>`;
    return `<p class="hinweis">${T(`Hier könntest du Kamele züchten: Je Paar gibt es ab und zu ein Fohlen, das nach ${ZUCHT.tageBisReif} Tagen erwachsen ist. Ausgebaut entstehen sogar <b>Mehari</b> – schnelle Rennkamele, die es nirgends zu kaufen gibt.`,
                                    `You could breed camels here: each pair now and then has a foal that grows up within ${ZUCHT.tageBisReif} days. Once expanded, you even get <b>Mehari</b> – swift racing camels that cannot be bought anywhere.`)}</p>
      <button data-a="zuchtBauen" ${S.gold < ZUCHT.preis ? 'disabled' : ''}>🐪 ${T('Zuchtstall bauen', 'Build breeding stable')} (${zahl(ZUCHT.preis)} 🪙)</button>
      <span class="hinweis">${ZUCHT.unterhalt} 🪙/${T('Tag', 'day')} + ${T('Futter', 'feed')}</span>`;
  }
  if (z.oase !== o.id) return `<p class="hinweis">${T(`Dein Zuchtstall steht in ${oase(z.oase).name}.`, `Your breeding stable is in ${oase(z.oase).name}.`)}</p>`;
  let h = `<div class="info">🐪 ${T('Zuchtstall', 'Breeding stable')} · ${T('Stufe', 'level')} ${z.stufe} · ${T('Platz', 'room')} ${zuchtBelegt()}/${ZUCHT.platz[z.stufe]} · ${zuchtUnterhalt()} 🪙/${T('Tag', 'day')}</div>`;
  h += `<table class="ruhig zucht"><tr><th>${T('Tier', 'Animal')}</th><th>${T('im Stall', 'in stable')}</th><th></th></tr>`;
  for (const t of ZUCHT_TYPEN) {
    if (t === 'mehari' && z.stufe < 2 && !(z.tiere.mehari > 0)) continue;
    const da = z.tiere[t] || 0, dabei = hier ? (k.tiere[t] || 0) : 0;
    h += `<tr><td>${TIERE[t].icon} ${TIERE[t].name}</td><td>${da}</td><td class="zucht-knoepfe">
      ${hier ? `<button data-a="zuchtRein" data-v="${t}" ${dabei < 1 || zuchtBelegt() >= ZUCHT.platz[z.stufe] ? 'disabled' : ''} title="${T('aus der Karawane in den Stall', 'from caravan into stable')}">⬇ ${T('einstellen', 'stable')}</button>
               <button data-a="zuchtRaus" data-v="${t}" ${da < 1 ? 'disabled' : ''} title="${T('aus dem Stall in die Karawane', 'from stable into caravan')}">⬆ ${T('abholen', 'take')}</button>` : ''}
      <button data-a="zuchtVerkauf" data-v="${t}" ${da < 1 ? 'disabled' : ''}>${T('verkaufen', 'sell')} (${Math.round(TIERE[t].preis * 0.6)} 🪙)</button></td></tr>`;
  }
  h += '</table>';
  if (z.fohlen.length) h += `<div class="hinweis">🐣 ${T('Fohlen', 'Foals')}: ${z.fohlen.map(f => `${f.typ === 'mehari' ? T('Mehari', 'Mehari') : T('Kamel', 'camel')} (${T(`noch ${f.reifTag - S.tag} T.`, `${f.reifTag - S.tag} d left`)})`).join(', ')}</div>`;
  if ((z.tiere.kamel || 0) + (z.tiere.mehari || 0) < 2) h += `<div class="hinweis">${T('Für Nachwuchs braucht es mindestens zwei Tiere einer Art.', 'Breeding needs at least two animals of a kind.')}</div>`;
  if (!hier) h += `<div class="hinweis">${T('Zum Einstellen und Abholen muss eine Karawane hier stehen.', 'To stable or take animals, a caravan must be here.')}</div>`;
  if (z.stufe < 2) h += `<div style="margin-top:6px"><button data-a="zuchtAusbau" ${S.gold < ZUCHT.ausbau ? 'disabled' : ''}>⬆ ${T('Ausbauen: Mehari-Zucht & mehr Platz', 'Expand: Mehari breeding & more room')} (${zahl(ZUCHT.ausbau)} 🪙)</button></div>`;
  else h += `<div class="hinweis">🏇 ${T(`Mehari: Tempo ${TIERE.mehari.tempo}, Last ${TIERE.mehari.kapazitaet}, sehr genügsam – die schnellsten Kamele der Wüste.`, `Mehari: speed ${TIERE.mehari.tempo}, load ${TIERE.mehari.kapazitaet}, very frugal – the fastest camels in the desert.`)}</div>`;
  return h;
}
