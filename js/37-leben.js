/* =====================================================================
   37. LEBEN IN DER WÜSTE – kleine Details, die nur zur Zierde da sind
   Gazellen, Nomadenlager, Fata Morgana, Vogelschwärme und wehender Sand.
   Gezeichnet wird nur, was gerade im sichtbaren Ausschnitt liegt.
   ===================================================================== */

let lebenCache = { schluessel: '', herden: [], lager: [] };

// Ein freier Platz in der Wüste: nicht in Oasen, Gebirgen, Flüssen oder im Meer
function lebenPlatzFrei(p, abstand = 90) {
  return imLand(p, 60) &&
    !S.oasen.some(o => entfernung(o, p) < abstand) &&
    !GEBIRGE.some(g => ((p.x - g.x) / (g.breite * 1.1)) ** 2 + ((p.y - g.y) / (g.breite * 0.6)) ** 2 < 1) &&
    !FLUESSE.some(f => abstandZuLinie(p, f.punkte) < 30);
}

// Herden und Lager hängen an der Karte – gleiche Karte, gleiche Plätze
function lebenAnlegen() {
  const schluessel = `${gelaendeSchluessel}|${S.oasen.length}`;
  if (lebenCache.schluessel === schluessel) return lebenCache;
  const rnd = zufallsFolge(GELAENDE_SAMEN + 4711);
  const platz = (abstand) => {
    for (let i = 0; i < 80; i++) {
      const p = { x: 80 + rnd() * (KARTE_B - 200), y: 70 + rnd() * (KARTE_H - 140) };
      if (lebenPlatzFrei(p, abstand)) return p;
    }
    return null;
  };
  const herden = [], lager = [];
  for (let i = 0; i < Math.round(5 * flaeche()); i++) {
    const p = platz(110); if (!p) continue;
    const tiere = [];
    const n = 3 + Math.floor(rnd() * 4);
    for (let j = 0; j < n; j++) tiere.push({ dx: (rnd() - 0.5) * 34, dy: (rnd() - 0.5) * 14, ph: rnd() * 6.28, gr: 1.5 + rnd() * 0.45 });
    herden.push({ x: p.x, y: p.y, ph: rnd() * 6.28, weit: 40 + rnd() * 50, tiere, flucht: { x: 0, y: 0 } });
  }
  for (let i = 0; i < Math.round(4 * flaeche()); i++) {
    const p = platz(130); if (!p) continue;
    const ziegen = [];
    for (let j = 0; j < 4 + Math.floor(rnd() * 5); j++) ziegen.push({ dx: 14 + rnd() * 34, dy: (rnd() - 0.3) * 16, ph: rnd() * 6.28, hell: rnd() < 0.4 });
    lager.push({ x: p.x, y: p.y, zelte: 1 + Math.floor(rnd() * 3), ziegen });
  }
  lebenCache = { schluessel, herden, lager };
  return lebenCache;
}

function imBlick(x, y, rand = 40) {
  return x > ansicht.x - rand && x < ansicht.x + KARTE_B / ansicht.zoom + rand &&
         y > ansicht.y - rand && y < ansicht.y + KARTE_H / ansicht.zoom + rand;
}

// Eine Gazelle von der Seite: schlanker Körper, heller Bauch, gebogene Hörner
function gazelle(x, y, gr, richtung, schritt, springt) {
  ctx.save(); ctx.translate(x, y - springt); ctx.scale(richtung * gr, gr);
  ctx.fillStyle = 'rgba(60,35,15,.2)'; ctx.beginPath(); ctx.ellipse(0, springt / gr + 0.5, 4, 0.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6b4526'; ctx.lineWidth = 0.55; ctx.lineCap = 'round';
  const b = Math.sin(schritt) * 1.2;
  ctx.beginPath();
  ctx.moveTo(-2.2, -2.2); ctx.lineTo(-2.2 - b * 0.5, 0); ctx.moveTo(-1.6, -2.2); ctx.lineTo(-1.6 + b * 0.5, 0);
  ctx.moveTo(1.8, -2.2); ctx.lineTo(1.8 + b * 0.5, 0); ctx.moveTo(2.3, -2.2); ctx.lineTo(2.3 - b * 0.5, 0);
  ctx.stroke();
  ctx.fillStyle = '#c48a52'; ctx.beginPath(); ctx.ellipse(0, -3, 3.2, 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f3e4c8'; ctx.beginPath(); ctx.ellipse(0, -2.3, 2.6, 0.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a2e18'; ctx.fillRect(-1.6, -3, 3.4, 0.35);                 // dunkler Seitenstreifen
  ctx.fillStyle = '#c48a52';
  ctx.beginPath(); ctx.moveTo(2.4, -3.6); ctx.lineTo(3.6, -5.6); ctx.lineTo(4.6, -5.2); ctx.lineTo(3.4, -3.2); ctx.fill();   // Hals und Kopf
  ctx.beginPath(); ctx.ellipse(4.4, -5.6, 1, 0.55, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3b2412'; ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.moveTo(3.9, -6); ctx.quadraticCurveTo(3.4, -7.6, 2.6, -8); ctx.stroke();   // Hörner
  ctx.restore();
}

function zeichneHerden(echtzeit, nacht) {
  if (nacht > 0.75) return;
  const { herden } = lebenAnlegen();
  const t = laufUhr * 0.05;
  for (const h of herden) {
    // Die Herde zieht langsam umher …
    const hx = h.x + Math.sin(t * 0.13 + h.ph) * h.weit, hy = h.y + Math.cos(t * 0.09 + h.ph) * h.weit * 0.45;
    if (!imBlick(hx, hy, 60)) continue;
    // … und flieht, wenn eine Karawane zu nah kommt
    let fx = 0, fy = 0;
    for (const k of S.karawanen) {
      const d = Math.hypot(k.x - hx, k.y - hy);
      if (d < 55 && d > 0.1) { fx += (hx - k.x) / d * (55 - d); fy += (hy - k.y) / d * (55 - d) * 0.6; }
    }
    h.flucht.x += (fx - h.flucht.x) * 0.04; h.flucht.y += (fy - h.flucht.y) * 0.04;
    const angst = Math.min(1, Math.hypot(h.flucht.x, h.flucht.y) / 20);
    const richtung = Math.cos(t * 0.13 + h.ph) >= 0 ? 1 : -1;
    const fliehRichtung = Math.abs(h.flucht.x) > 2 ? Math.sign(h.flucht.x) : richtung;
    ctx.globalAlpha = 1 - nacht * 0.6;
    for (const g of h.tiere) {
      const sx = hx + h.flucht.x + g.dx, sy = hy + h.flucht.y + g.dy;
      const tempo = 3 + angst * 9;
      const springt = angst > 0.2 ? Math.max(0, Math.sin(echtzeit * tempo + g.ph)) * 2.2 : 0;
      gazelle(sx, sy, g.gr, fliehRichtung, echtzeit * tempo + g.ph, springt);
    }
    ctx.globalAlpha = 1;
  }
}

// Nomadenlager: schwarze Zelte, Ziegen, abends ein Feuer mit Rauch
function zeichneNomaden(echtzeit, nacht) {
  const { lager } = lebenAnlegen();
  for (const l of lager) {
    if (!imBlick(l.x, l.y, 60)) continue;
    for (const z of l.ziegen) {
      const zx = l.x + z.dx + Math.sin(laufUhr * 0.02 + z.ph) * 5, zy = l.y + z.dy + Math.cos(laufUhr * 0.017 + z.ph) * 2.5;
      ctx.save(); ctx.translate(zx, zy); ctx.scale(1.6, 1.6);
      ctx.fillStyle = 'rgba(60,35,15,.2)'; ctx.beginPath(); ctx.ellipse(0.6, 0.4, 1.8, 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = z.hell ? '#e8dcc6' : '#3d2c22';
      ctx.beginPath(); ctx.ellipse(0, -1.4, 1.6, 0.9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(1.6, -2.2, 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-1, -0.8, 0.35, 0.9); ctx.fillRect(0.7, -0.8, 0.35, 0.9);
      ctx.restore();
    }
    for (let i = 0; i < l.zelte; i++) zeltKlein(ctx, l.x - i * 17, l.y + (i % 2) * 5, 8.5);
    // Feuerstelle: abends und nachts brennt sie, tagsüber nur ein Rauchfaden
    const fx = l.x + 9, fy = l.y + 8;
    ctx.fillStyle = 'rgba(70,50,40,.7)'; ctx.beginPath(); ctx.ellipse(fx, fy, 2.2, 0.9, 0, 0, Math.PI * 2); ctx.fill();
    const brennt = nacht > 0.15;
    if (brennt) {
      leuchten(fx, fy - 1, 16, '255,140,50', 0.5 * nacht);
      const f = 1 + Math.sin(echtzeit * 13) * 0.25;
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(fx - 1.2, fy); ctx.quadraticCurveTo(fx, fy - 4 * f, fx + 1.2, fy); ctx.fill();
      ctx.fillStyle = '#fff1a8'; ctx.beginPath(); ctx.moveTo(fx - 0.5, fy); ctx.quadraticCurveTo(fx, fy - 2 * f, fx + 0.5, fy); ctx.fill();
    }
    for (let i = 0; i < 4; i++) {
      const p = ((echtzeit * 0.25 + i / 4) % 1);
      ctx.fillStyle = `rgba(${brennt ? '200,200,210' : '230,220,200'},${(0.35 * (1 - p)).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(fx + Math.sin(p * 5 + i) * 2 + p * 6, fy - 3 - p * 18, 1.2 + p * 3.5, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// Fata Morgana: zur Mittagszeit flimmert irgendwo ein See, den es gar nicht gibt
function zeichneFataMorgana(echtzeit) {
  const h = tagesAnteil() * 24;
  if (h < 11 || h > 16.5 || hash01(S.tag, 81) < 0.4) return;
  const staerke = Math.min(1, (h - 11) / 1.2, (16.5 - h) / 1.2) * (0.75 + 0.25 * Math.sin(echtzeit * 0.9));
  let p = null;
  for (let i = 0; i < 12 && !p; i++) {
    const q = { x: 120 + hash01(S.tag * 13 + i, 82) * (KARTE_B - 300), y: 100 + hash01(S.tag * 17 + i, 83) * (KARTE_H - 200) };
    if (lebenPlatzFrei(q, 150)) p = q;
  }
  if (!p || !imBlick(p.x, p.y, 80)) return;
  ctx.save();
  ctx.globalAlpha = staerke * 0.95;
  const see = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 60);
  see.addColorStop(0, 'rgba(110,190,220,.95)'); see.addColorStop(0.55, 'rgba(150,205,228,.6)'); see.addColorStop(1, 'rgba(200,225,235,0)');
  ctx.fillStyle = see; ctx.beginPath(); ctx.ellipse(p.x, p.y, 64, 14, 0, 0, Math.PI * 2); ctx.fill();
  // flimmernde Lichtstreifen
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.8;
  for (let i = 0; i < 6; i++) {
    const y = p.y - 6 + i * 2.4, versatz = Math.sin(echtzeit * 4 + i * 1.7) * 6;
    ctx.beginPath(); ctx.moveTo(p.x - 34 + versatz + i * 3, y); ctx.lineTo(p.x + 22 + versatz - i * 2, y); ctx.stroke();
  }
  // gespiegelte „Palmen“ am Horizont, die beim Hinsehen zittern
  ctx.strokeStyle = 'rgba(70,110,90,.45)'; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const x = p.x - 20 + i * 18 + Math.sin(echtzeit * 3 + i) * 1.2;
    ctx.beginPath(); ctx.moveTo(x, p.y - 2); ctx.lineTo(x + 0.5, p.y - 10); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 0.5, p.y - 11, 3, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// Vogelschwärme ziehen über die Flüsse
function zeichneVoegel(echtzeit, nacht) {
  if (nacht > 0.5 || !FLUESSE.length) return;
  FLUESSE.forEach((f, fi) => {
    if (f.art !== 'fluss') return;
    for (let s = 0; s < 2; s++) {
      const p = f.punkte, t = ((echtzeit * 0.012 + s * 0.5 + fi * 0.3) % 1) * (p.length - 1);
      const i = Math.floor(t), r = t - i, a = p[i], b = p[Math.min(p.length - 1, i + 1)];
      const x = a.x + (b.x - a.x) * r + 30, y = a.y + (b.y - a.y) * r - 40;
      if (!imBlick(x, y, 40)) continue;
      ctx.strokeStyle = 'rgba(40,30,25,.65)'; ctx.lineWidth = 0.8;
      for (let v = 0; v < 7; v++) {
        const seite = v % 2 ? 1 : -1, reihe = Math.ceil(v / 2);
        const vx = x - reihe * 6, vy = y + seite * reihe * 4;
        const flug = Math.sin(echtzeit * 8 + v) * 1.4;
        ctx.beginPath(); ctx.moveTo(vx - 2.4, vy - flug); ctx.quadraticCurveTo(vx - 1, vy - 1.5, vx, vy); ctx.quadraticCurveTo(vx + 1, vy - 1.5, vx + 2.4, vy - flug); ctx.stroke();
      }
    }
  });
}

// Wehender Sand: im Hochsommer ziehen feine Sandschleier über die Dünen
function zeichneSandwehen(echtzeit, nacht) {
  if (jahreszeitIndex() !== 1 || nacht > 0.6) return;
  const x0 = ansicht.x, y0 = ansicht.y, b = KARTE_B / ansicht.zoom, h = KARTE_H / ansicht.zoom;
  ctx.lineWidth = 1;
  for (let i = 0; i < 22; i++) {
    const y = y0 + hash01(i, 91) * h;
    const x = x0 + ((hash01(i, 92) * (b + 300) + echtzeit * (40 + hash01(i, 93) * 30)) % (b + 300)) - 150;
    const l = 40 + hash01(i, 94) * 70;
    const g = ctx.createLinearGradient(x, 0, x + l, 0);
    g.addColorStop(0, 'rgba(255,240,210,0)'); g.addColorStop(0.5, 'rgba(255,240,210,.35)'); g.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.strokeStyle = g;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l / 2, y - 2 + Math.sin(echtzeit + i) * 2, x + l, y); ctx.stroke();
  }
}

// Alles zusammen – unter den Oasen und Karawanen
function zeichneLeben(echtzeit, nacht) {
  if (!S || !S.oasen || typeof laufUhr === 'undefined') return;
  zeichneFataMorgana(echtzeit);
  zeichneNomaden(echtzeit, nacht);
  zeichneHerden(echtzeit, nacht);
}
// Über allem (aber unter Nacht und Nebel)
function zeichneLebenOben(echtzeit, nacht) {
  if (!S || !S.oasen) return;
  zeichneVoegel(echtzeit, nacht);
  zeichneSandwehen(echtzeit, nacht);
}
