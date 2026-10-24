/* =====================================================================
   22. PLÜNDERER – Räuber verlassen ihr Lager
   Ab und zu schickt ein Räuberlager eine Reiterschar los. Sie jagt eine
   Karawane, die gerade durch die Wüste zieht (auch außerhalb des Lagers),
   oder überfällt – seltener – eine Oase in der Nähe.
   Danach reiten die Plünderer zurück in ihr Lager.
   ===================================================================== */

const PLUENDERER = {
  chanceProTag: 0.09,   // pro Lager und Tag (mal Schwierigkeit)
  reichweite: 430,      // so weit reiten sie höchstens für eine Beute
  tempo: 85,            // Kartenpunkte pro Tag – schneller als Kamele (55), langsamer als Pferde (90)
  ausdauer: 6,          // nach so vielen Tagen ohne Erfolg geben sie die Jagd auf
  oasenAnteil: 0.22,    // so oft wählen sie eine Oase statt einer Karawane
  ruheTage: 4,          // so lange bleibt die Schar danach im Lager
};

function plKarawaneZiel(p) {
  if (p.ziel.art === 'karawane') return karawane(p.ziel.id);
  if (p.ziel.art === 'rivale') {
    const r = S.rivalen[p.ziel.r];
    return r && r.karawanen[p.ziel.k];
  }
  return null;
}
function plZielPunkt(p) {
  if (p.ziel.art === 'oase') return oase(p.ziel.id);
  const k = plKarawaneZiel(p);
  return k && k.nach != null ? k : null;   // angekommen = in Sicherheit
}

// --- Jeden Tag: schickt ein Lager Plünderer los? ---
function pluendererTag() {
  S.braende = (S.braende || []).filter(b => b.bis > S.zeit);
  if (S.tag < 6) return;   // die ersten Tage hat man Ruhe
  for (const g of aktiveRaeuber()) {
    if (S.pluenderer.some(p => p.lager === g.id)) continue;           // ihre Schar ist schon unterwegs
    if (g.plRuheBis && S.tag < g.plRuheBis) continue;
    if (Math.random() > PLUENDERER.chanceProTag * sw().raeuber) continue;
    pluendererLosschicken(g);
  }
}

function pluendererLosschicken(g) {
  const nah = x => entfernung(x, g) > g.r && entfernung(x, g) < PLUENDERER.reichweite;
  const eigene = S.karawanen.filter(k => k.nach != null && nah(k) && ladungsWert(k) >= 80);
  const fremde = [];
  S.rivalen.forEach((r, ri) => r.karawanen.forEach((k, ki) => { if (k.nach != null && k.menge > 0 && nah(k)) fremde.push({ ri, ki, k }); }));
  const oasen = S.oasen.filter(o => o.aktiv && entfernung(o, g) < PLUENDERER.reichweite);

  let ziel = null;
  const wurf = Math.random();
  if (oasen.length && wurf < PLUENDERER.oasenAnteil) {
    // lieber kleine, nahe Oasen – die wehren sich weniger
    oasen.sort((a, b) => entfernung(a, g) * (1 + a.bev / 1500) - entfernung(b, g) * (1 + b.bev / 1500));
    ziel = { art: 'oase', id: oasen[zufallInt(0, Math.min(1, oasen.length - 1))].id };
  } else if (eigene.length && (wurf < 0.8 || !fremde.length)) {
    eigene.sort((a, b) => ladungsWert(b) - ladungsWert(a));          // die reichste Beute zuerst
    ziel = { art: 'karawane', id: eigene[0].id };
  } else if (fremde.length) {
    const f = fremde[zufallInt(0, fremde.length - 1)];
    ziel = { art: 'rivale', r: f.ri, k: f.ki };
  }
  if (!ziel) return;

  const staerke = lagerStaerke(g);
  const p = { id: S.naechsteId++, lager: g.id, x: g.x, y: g.y, heimX: g.x, heimY: g.y,
              ziel, phase: 'jagd', start: S.zeit, reiter: 2 + staerke, staerke };
  S.pluenderer.push(p);

  const lagerOase = lagerNaechsteOase(g), bei = lagerOase ? lagerOase.name : '?';
  if (ziel.art === 'karawane') {
    const k = karawane(ziel.id);
    melden('🐎', T(`Plünderer jagen ${k.name}! Schnell zur nächsten Oase?`, `Raiders are hunting ${k.name}! Make for the nearest oasis?`), 'schlecht', { karawane: k.id });
    log(T(`🐎 Aus dem Räuberlager bei ${bei} brechen Plünderer auf – sie jagen deine Karawane ${k.name}!`,
          `🐎 Raiders ride out from the robber camp near ${bei} – they are hunting your caravan ${k.name}!`), 'schlecht');
  } else if (ziel.art === 'oase') {
    const o = oase(ziel.id), betroffen = S.gebaeude[o.id] || S.karawanen.some(k => k.ort === o.id && k.nach == null);
    if (betroffen) melden('🐎', T(`Plünderer reiten auf ${o.name} zu – dort sind deine Leute!`, `Raiders are riding towards ${o.name} – your people are there!`), 'schlecht', { oase: o.id });
    log(T(`🐎 Plünderer aus dem Lager bei ${bei} reiten auf ${o.name} zu!`,
          `🐎 Raiders from the camp near ${bei} are riding towards ${o.name}!`), betroffen ? 'schlecht' : 'info');
  }
}

// --- Jeden Frame: die Reiter bewegen sich ---
function bewegePluenderer(dt) {
  if (!S.pluenderer || !S.pluenderer.length) return;
  for (const p of [...S.pluenderer]) {
    const sturm = S.stuerme.some(s => Math.hypot(p.x - s.x, p.y - s.y) < s.r);
    const schritt = PLUENDERER.tempo * dt * (sturm ? 0.4 : 1) * (istNacht() ? 1.15 : 1);
    let zx, zy;
    if (p.phase === 'jagd') {
      const z = plZielPunkt(p);
      if (!z) { plAufgeben(p, true); continue; }
      if (S.zeit - p.start > PLUENDERER.ausdauer) { plAufgeben(p, false); continue; }
      zx = z.x; zy = z.y;
    } else { zx = p.heimX; zy = p.heimY; }

    const d = Math.hypot(zx - p.x, zy - p.y);
    p.rx = zx - p.x; p.ry = zy - p.y;   // Blickrichtung fürs Zeichnen
    if (d <= Math.max(schritt, 8)) {
      p.x = zx; p.y = zy;
      if (p.phase === 'jagd') plZuschlagen(p);
      else plHeimgekehrt(p);
    } else {
      p.x += (zx - p.x) / d * schritt;
      p.y += (zy - p.y) / d * schritt;
    }
  }
}

function plAufgeben(p, entkommen) {
  if (p.ziel.art === 'karawane') {
    const k = karawane(p.ziel.id);
    if (k && entkommen) zaehle('entkommen');
    if (k && entkommen) log(T(`🏁 ${k.name} hat ${k.ort != null ? oase(k.ort).name : T('ihr Ziel', 'its destination')} erreicht – die Plünderer drehen ab.`,
                              `🏁 ${k.name} reached ${k.ort != null ? oase(k.ort).name : 'its destination'} – the raiders turn back.`), 'gut');
    else if (k) log(T(`🏁 Die Plünderer verlieren die Spur von ${k.name} und reiten zurück.`,
                      `🏁 The raiders lose the trail of ${k.name} and ride back.`), 'gut');
  }
  p.phase = 'heim';
}

function plHeimgekehrt(p) {
  S.pluenderer = S.pluenderer.filter(x => x !== p);
  const g = S.raeuber.find(x => x.id === p.lager);
  if (g) g.plRuheBis = S.tag + PLUENDERER.ruheTage;
}

function plZuschlagen(p) {
  p.phase = 'heim';
  if (p.ziel.art === 'karawane') {
    const k = karawane(p.ziel.id);
    if (ladungsWert(k) < 50) {
      log(T(`🐎 Plünderer stellen ${k.name} – finden aber nichts Lohnendes und ziehen ab.`,
            `🐎 Raiders catch ${k.name} – but find nothing worth taking and leave.`), 'info');
      return;
    }
    const abgewehrt = ueberfall(k);
    if (abgewehrt) {
      log(T('🐎 Die geschlagenen Plünderer zerstreuen sich in alle Winde.', '🐎 The beaten raiders scatter to the winds.'), 'gut');
      S.pluenderer = S.pluenderer.filter(x => x !== p);
    }
  } else if (p.ziel.art === 'rivale') {
    const k = plKarawaneZiel(p), r = S.rivalen[p.ziel.r];
    if (k && k.menge > 0) {
      k.menge = Math.floor(k.menge * zufall(0.3, 0.6));
      log(T(`🐎 Plünderer haben eine Karawane des Hauses ${r.name} ausgeraubt.`, `🐎 Raiders have robbed a caravan of the House of ${r.name}.`), 'info');
    }
  } else plOaseUeberfallen(p, oase(p.ziel.id));
}

// Eine Oase wird überfallen. Große Oasen und deine Wachen vor Ort wehren sich besser.
function plOaseUeberfallen(p, o) {
  const vorOrt = S.karawanen.filter(k => k.ort === o.id && k.nach == null);
  const wachen = vorOrt.reduce((n, k) => n + k.wachen, 0);
  const abwehr = Math.min(0.9, 0.3 + o.bev / 2500 + 0.08 * wachen - 0.07 * (p.staerke - 1));
  if (Math.random() < abwehr) {
    S.braende.push({ oase: o.id, bis: S.zeit + 0.6, klein: true });
    log(wachen > 0
      ? T(`🛡️ Plünderer greifen ${o.name} an – die Bewohner und deine Wachen schlagen sie zurück!`,
          `🛡️ Raiders attack ${o.name} – the townsfolk and your guards drive them off!`)
      : T(`🛡️ Plünderer greifen ${o.name} an, doch die Bewohner schlagen sie zurück.`,
          `🛡️ Raiders attack ${o.name}, but the townsfolk drive them off.`), wachen > 0 ? 'gut' : 'info');
    if (wachen > 0) {
      vorOrt.forEach(k => { if (k.wachen > 0) epGeben(k, 20); });
      if (typeof S.ansehen === 'object') S.ansehen[o.id] = (S.ansehen[o.id] || 0) + 5;   // die Oase ist dir dankbar
    }
    return;
  }

  // Der Überfall gelingt: Vorräte werden geplündert, ein paar Häuser brennen
  S.braende.push({ oase: o.id, bis: S.zeit + 2.5 });
  const waren = WAREN.filter(w => w.id !== 'wasser' && o.lager[w.id] >= 3);
  for (let i = 0; i < Math.min(3, waren.length); i++) {
    const w = waren.splice(zufallInt(0, waren.length - 1), 1)[0];
    o.lager[w.id] *= zufall(0.4, 0.7);
  }
  o.bev = Math.max(50, Math.round(o.bev * zufall(0.93, 0.97)));
  log(T(`🔥 Plünderer überfallen ${o.name}! Vorräte werden geraubt, Häuser brennen.`,
        `🔥 Raiders sack ${o.name}! Supplies are stolen and houses burn.`), 'schlecht');

  // Dein Lagerhaus dort?
  const g = S.gebaeude[o.id];
  if (g) {
    const beute = [];
    for (const w of WAREN) {
      if (!g.lager[w.id] || g.lager[w.id] < 1) continue;
      const menge = Math.ceil(g.lager[w.id] * zufall(0.2, 0.4));
      g.lager[w.id] -= menge;
      beute.push(`${menge} ${T(w.name, w.nameEn || w.name)}`);
    }
    if (beute.length) log(T(`🏚️ Dein Lagerhaus in ${o.name} wurde geplündert: ${beute.join(', ')} sind weg.`,
                            `🏚️ Your warehouse in ${o.name} was looted: ${beute.join(', ')} gone.`), 'schlecht');
  }
}

/* --- Zeichnen ---------------------------------------------------- */

// Eine Schar Reiter mit roten Umhängen; bei eigenen Zielen eine gestrichelte Linie dorthin
function zeichnePluenderer() {
  if (!S.pluenderer) return;
  for (const p of S.pluenderer) {
    const z = p.phase === 'jagd' ? plZielPunkt(p) : null;
    if (z && p.ziel.art !== 'rivale') {
      ctx.strokeStyle = 'rgba(150,30,20,.55)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 5]);
      ctx.lineDashOffset = -laufUhr * 14;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(z.x, z.y); ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }
    const lang = Math.hypot(p.rx || 1, p.ry || 0) || 1;
    const ux = (p.rx || 1) / lang, uy = (p.ry || 0) / lang;
    const rechts = ux >= 0, gr = 1.25;
    // lockere Formation: der Anführer vorne, die anderen versetzt dahinter
    const pos = [];
    for (let i = 0; i < p.reiter; i++) {
      const hinten = i ? Math.ceil(i / 2) * 11 * gr : 0, seite = i ? (i % 2 ? -1 : 1) * 6 * gr : 0;
      pos.push({ x: p.x - ux * hinten - uy * seite, y: p.y - uy * hinten * 0.8 + ux * seite * 0.6, i });
    }
    pos.sort((a, b) => a.y - b.y);
    for (const q of pos) {
      ctx.fillStyle = 'rgba(60,35,15,.3)';
      ctx.beginPath(); ctx.ellipse(q.x, q.y + 0.6, 7 * gr, 1.6 * gr, 0, 0, Math.PI * 2); ctx.fill();
      staub(q.x, q.y, rechts ? 1 : -1, gr, q.i + 3);
    }
    for (const q of pos) {
      const schritt = laufUhr * 10 + q.i * 1.3;
      ctx.save();
      ctx.translate(q.x, q.y - Math.abs(Math.sin(schritt)) * 0.7);
      ctx.scale(rechts ? gr : -gr, gr);
      zeichneTier(ctx, 'pferd', { schritt, decke: '#8e2115', reiter: true, last: -1 });
      ctx.restore();
    }
    // ein kleiner roter Wimpel über dem Anführer
    const fx = p.x + (rechts ? -2 : 2), fy = p.y - 30;
    ctx.strokeStyle = '#3a2414'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx, fy + 12); ctx.lineTo(fx, fy); ctx.stroke();
    const wehen = Math.sin(laufUhr * 8) * 1.5;
    ctx.fillStyle = '#b3261a';
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + (rechts ? -11 : 11), fy + 2.5 + wehen); ctx.lineTo(fx, fy + 5); ctx.closePath(); ctx.fill();
  }
}

// Rauch (und am Anfang Flammen) über einer überfallenen Oase
function zeichneBraende() {
  if (!S.braende) return;
  for (const b of S.braende) {
    const o = oase(b.oase);
    if (!o || b.bis <= S.zeit) continue;
    const rest = b.bis - S.zeit, staerke = Math.min(1, rest / 0.8) * (b.klein ? 0.5 : 1);
    const herde = b.klein ? 1 : 3;
    for (let h = 0; h < herde; h++) {
      const bx = o.x + (h - 1) * 14 + hash01(b.oase, h) * 6, by = o.y - 2 + hash01(b.oase, h + 9) * 6;
      // Flammen, solange es richtig brennt
      if (rest > 1) {
        const f = 0.7 + 0.3 * Math.sin(laufUhr * 14 + h * 2);
        ctx.fillStyle = `rgba(255,${Math.round(120 + 70 * f)},40,.9)`;
        ctx.beginPath(); ctx.moveTo(bx - 3, by); ctx.quadraticCurveTo(bx - 2, by - 5 * f, bx, by - 8 * f);
        ctx.quadraticCurveTo(bx + 2, by - 5 * f, bx + 3, by); ctx.closePath(); ctx.fill();
      }
      // aufsteigende Rauchwolken
      for (let i = 0; i < 7; i++) {
        const alter = ((laufUhr * 0.45 + i / 7 + h * 0.31) % 1);
        const x = bx + alter * 16 + Math.sin(alter * 5 + i) * 3, y = by - 6 - alter * 46;
        const a = staerke * (1 - alter) * Math.min(1, alter * 5) * 0.6;
        ctx.fillStyle = `rgba(70,62,60,${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, 3 + alter * 9, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}
