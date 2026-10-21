/* =====================================================================
   26. EFFEKTE – kleine Animationen, die Handlungen sichtbar machen
   Schwebende Gewinne, Münzen, Staub beim Aufbruch, Glanz bei der Ankunft,
   Funken im Kampf, glitzerndes Wasser in den Oasen und ein Kartenrahmen.
   Alle Effekte laufen in Echtzeit (auch in der Pause) und speichern nichts.
   ===================================================================== */

const EFFEKTE = [];
function effektNeu(e) {
  e.start = performance.now() / 1000;
  EFFEKTE.push(e);
  if (EFFEKTE.length > 160) EFFEKTE.splice(0, EFFEKTE.length - 160);
}

// „+340 🪙“ steigt über der Oase auf (grün-golden bei Einnahmen, rot bei Ausgaben)
function effektZahl(x, y, betrag) {
  if (!betrag) return;
  effektNeu({ art: 'zahl', x: x + (Math.random() - 0.5) * 16, y, betrag: Math.round(betrag), dauer: 1.8 });
}
// Ein paar Münzen springen hoch und fallen
function effektMuenzen(x, y, n) {
  for (let i = 0; i < n; i++) {
    effektNeu({ art: 'muenze', x, y, vx: (Math.random() - 0.5) * 70, vy: -60 - Math.random() * 60, dreh: Math.random() * 6, dauer: 0.9 + Math.random() * 0.3 });
  }
}
// Staubwolke beim Aufbruch
function effektStaub(x, y) {
  for (let i = 0; i < 12; i++) {
    const w = Math.random() * Math.PI * 2;
    effektNeu({ art: 'staub', x, y, vx: Math.cos(w) * (15 + Math.random() * 25), vy: Math.sin(w) * 8 - 6, r: 3 + Math.random() * 4, dauer: 1.2 + Math.random() * 0.6 });
  }
}
// Ankunft: ein goldener Ring breitet sich um die Oase aus
function effektAnkunft(x, y) { effektNeu({ art: 'ring', x, y, dauer: 1.1 }); }
// Kampf: gekreuzte Säbel und Funken
function effektKampf(x, y, abgewehrt) {
  if (x == null) return;
  effektNeu({ art: 'saebel', x, y: y - 26, gut: abgewehrt, dauer: 1.4 });
  for (let i = 0; i < 14; i++) {
    const w = Math.random() * Math.PI * 2, v = 40 + Math.random() * 60;
    effektNeu({ art: 'funke', x, y: y - 26, vx: Math.cos(w) * v, vy: Math.sin(w) * v - 20, dauer: 0.5 + Math.random() * 0.4 });
  }
}
// Bauen: kleine Holzspäne und ein Hammer-Symbol
function effektBauen(x, y) {
  effektNeu({ art: 'bau', x, y: y - 30, dauer: 1.2 });
  for (let i = 0; i < 8; i++) effektNeu({ art: 'span', x, y: y - 10, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, dauer: 0.8 });
}

function zeichneEffekte() {
  const jetzt = performance.now() / 1000;
  for (let i = EFFEKTE.length - 1; i >= 0; i--) {
    const e = EFFEKTE[i], t = jetzt - e.start, p = t / e.dauer;
    if (p >= 1) { EFFEKTE.splice(i, 1); continue; }
    const aus = 1 - p;
    if (e.art === 'zahl') {
      const y = e.y - 10 - 32 * (1 - Math.pow(1 - p, 2));
      const text = `${e.betrag > 0 ? '+' : '−'}${zahlText(Math.abs(e.betrag))} 🪙`;
      ctx.save(); ctx.globalAlpha = Math.min(1, aus * 2.2);
      const s = 1 + 0.25 * Math.max(0, 1 - p * 6);   // kurzer „Hüpfer“ am Anfang
      ctx.translate(e.x, y); ctx.scale(s, s);
      ctx.font = `700 15px ${SCHRIFT_KARTE}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(30,20,10,.75)';
      const nurText = text.replace(' 🪙', '');
      ctx.strokeText(nurText, -7, 0);
      ctx.fillStyle = e.betrag > 0 ? '#ffe08a' : '#ff9a85';
      ctx.fillText(nurText, -7, 0);
      const w = ctx.measureText(nurText).width;
      symbolMalen(ctx, '🪙', -7 + w / 2 + 8, 0, 13);
      ctx.restore();
    } else if (e.art === 'muenze') {
      const x = e.x + e.vx * t, y = e.y + e.vy * t + 160 * t * t;
      const breit = Math.abs(Math.cos(e.dreh + t * 14));
      ctx.fillStyle = `rgba(242,196,74,${aus.toFixed(2)})`; ctx.strokeStyle = `rgba(150,105,25,${aus.toFixed(2)})`; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.ellipse(x, y, 3.2 * Math.max(0.2, breit), 3.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (e.art === 'staub') {
      const x = e.x + e.vx * t, y = e.y + e.vy * t;
      ctx.fillStyle = `rgba(214,180,128,${(0.45 * aus).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, e.r * (1 + p * 1.8), 0, Math.PI * 2); ctx.fill();
    } else if (e.art === 'ring') {
      ctx.strokeStyle = `rgba(241,213,138,${(0.9 * aus).toFixed(2)})`; ctx.lineWidth = 2.5 * aus + 0.5;
      ctx.beginPath(); ctx.ellipse(e.x, e.y + 2, 20 + p * 46, (20 + p * 46) * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
      for (let k = 0; k < 8; k++) {
        const w = k / 8 * Math.PI * 2 + p, r = 18 + p * 40;
        ctx.fillStyle = `rgba(255,240,190,${aus.toFixed(2)})`;
        ctx.beginPath(); ctx.arc(e.x + Math.cos(w) * r, e.y + 2 + Math.sin(w) * r * 0.55 - p * 10, 1.6, 0, Math.PI * 2); ctx.fill();
      }
    } else if (e.art === 'saebel') {
      ctx.save(); ctx.globalAlpha = Math.min(1, aus * 2); ctx.translate(e.x, e.y - p * 8);
      const s = 1 + 0.4 * Math.max(0, 1 - p * 5);
      ctx.scale(s, s);
      ctx.fillStyle = e.gut ? 'rgba(60,110,40,.85)' : 'rgba(150,30,20,.85)';
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f4ead4'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      for (const sx of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(-6 * sx, 6); ctx.quadraticCurveTo(0, -2, 6 * sx, -7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-7.5 * sx, 3.5); ctx.lineTo(-3.5 * sx, 7.5); ctx.stroke();
      }
      ctx.restore();
    } else if (e.art === 'funke' || e.art === 'span') {
      const x = e.x + e.vx * t, y = e.y + e.vy * t + (e.art === 'span' ? 120 : 60) * t * t;
      ctx.fillStyle = e.art === 'funke' ? `rgba(255,${Math.round(200 * aus + 40)},80,${aus.toFixed(2)})` : `rgba(150,105,60,${aus.toFixed(2)})`;
      ctx.fillRect(x - 1, y - 1, 2.2, 2.2);
    } else if (e.art === 'bau') {
      ctx.save(); ctx.globalAlpha = Math.min(1, aus * 2); ctx.translate(e.x, e.y - p * 10);
      ctx.rotate(Math.sin(t * 16) * 0.5 * aus);
      ctx.fillStyle = '#7a5532'; ctx.fillRect(-1, -2, 2.2, 12);
      ctx.fillStyle = '#6b6b6b'; ctx.fillRect(-5, -5, 10, 4.5);
      ctx.restore();
    }
  }
}

// Glitzern auf den Oasen-Teichen und sanfte Wellenringe
function zeichneWasserGlitzern(echtzeit, nacht) {
  for (const o of S.oasen) {
    if (!o.aktiv) continue;
    const w = Math.round(Math.max(0, o.wasser) / 10) / 10, rx = 5 + 15 * w;
    if (rx < 7) continue;
    // Wellenring, der langsam wächst und verblasst
    const p = (echtzeit * 0.35 + o.id * 0.37) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${(0.35 * (1 - p)).toFixed(3)})`; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.ellipse(o.x + 2, o.y + 0.5, rx * (0.25 + 0.6 * p), rx * (0.25 + 0.6 * p) * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    // Lichtfunken auf dem Wasser (nachts: Mondlicht, bläulich)
    for (let i = 0; i < 4; i++) {
      const phase = (echtzeit * 0.8 + hash01(o.id * 7 + i, 41)) % 1;
      const a = Math.sin(phase * Math.PI);
      const x = o.x + (hash01(o.id * 7 + i, 42) - 0.5) * rx * 1.3, y = o.y + (hash01(o.id * 7 + i, 43) - 0.5) * rx * 0.5;
      ctx.strokeStyle = nacht > 0.5 ? `rgba(200,220,255,${(0.7 * a).toFixed(2)})` : `rgba(255,255,240,${(0.85 * a).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - 2.5 * a, y); ctx.lineTo(x + 2.5 * a, y); ctx.stroke();
    }
  }
}

// Ein kleiner Wimpel in Indigo und Messing über deinen Karawanen – so erkennt man sie sofort
function wimpel(x, y, rechts, groesse = 1.55) {
  const fx = x + (rechts ? 1 : -1) * 1.5 * groesse, fy = y - 30 * groesse;
  ctx.strokeStyle = '#4a3418'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(fx, fy + 12 * groesse); ctx.lineTo(fx, fy); ctx.stroke();
  const wehen = Math.sin(laufUhr * 6 + x * 0.1) * 1.5;
  const lang = (rechts ? -1 : 1) * 10 * groesse;
  ctx.fillStyle = FARBE.indigo;
  ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx + lang * 0.5, fy + 1 + wehen, fx + lang, fy + 2.5 + wehen);
  ctx.quadraticCurveTo(fx + lang * 0.5, fy + 4 + wehen, fx, fy + 5.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = FARBE.messing;
  ctx.beginPath(); ctx.arc(fx, fy - 0.8, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(fx + lang * 0.4, fy + 2.7 + wehen * 0.6, 1, 0, Math.PI * 2); ctx.fill();
}

// Ein verzierter Rahmen um die ganze Karte, wie bei einer alten Landkarte (ohne Zoom gezeichnet)
function zeichneKartenRahmen() {
  const B = KARTE_B, H = KARTE_H, r = 7;
  ctx.strokeStyle = 'rgba(92,60,24,.85)'; ctx.lineWidth = 2;
  ctx.strokeRect(r, r, B - 2 * r, H - 2 * r);
  ctx.strokeStyle = 'rgba(176,135,45,.75)'; ctx.lineWidth = 1;
  ctx.strokeRect(r + 4, r + 4, B - 2 * r - 8, H - 2 * r - 8);
  // Eckverzierungen: kleine Rauten mit Ranken
  for (const [x, y, sx, sy] of [[r, r, 1, 1], [B - r, r, -1, 1], [r, H - r, 1, -1], [B - r, H - r, -1, -1]]) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
    ctx.fillStyle = 'rgba(176,135,45,.95)'; ctx.strokeStyle = 'rgba(92,60,24,.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(20, 10); ctx.lineTo(10, 20); ctx.lineTo(0, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(92,60,24,.9)';
    ctx.beginPath(); ctx.arc(10, 10, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(176,135,45,.8)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(20, 10); ctx.bezierCurveTo(30, 4, 38, 14, 46, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, 20); ctx.bezierCurveTo(4, 30, 14, 38, 6, 46); ctx.stroke();
    ctx.restore();
  }
}

// Goldene Funken über den ganzen Bildschirm (Errungenschaft, Sieg)
function effektFunkeln(gross = false) {
  if (typeof document === 'undefined' || !document.body || !document.body.appendChild) return;
  const n = gross ? 70 : 26;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'funke-gold';
    s.style.left = (gross ? Math.random() * 100 : 35 + Math.random() * 30) + 'vw';
    s.style.top = (gross ? -5 : 4 + Math.random() * 6) + 'vh';
    s.style.setProperty('--dx', ((Math.random() - 0.5) * (gross ? 30 : 40)) + 'vw');
    s.style.setProperty('--dy', ((gross ? 80 : 25) + Math.random() * 25) + 'vh');
    s.style.animationDelay = (Math.random() * (gross ? 1.5 : 0.4)) + 's';
    s.style.animationDuration = (1.4 + Math.random() * 1.4) + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 4500);
  }
}

// Bauen bekommt Klang und Effekt: wir „umhüllen“ die vorhandenen Bau-Funktionen
function mitBauEffekt(fn) {
  return function (...args) {
    const vorher = S.gold;
    const ergebnis = fn.apply(this, args);
    if (S.gold < vorher) {
      ton('bauen');
      const o = oase(S.gewOase);
      if (o) effektBauen(o.x, o.y);
    }
    return ergebnis;
  };
}
lagerhausBauen = mitBauEffekt(lagerhausBauen);
betriebBauen = mitBauEffekt(betriebBauen);
gebaeudeAusbauen = mitBauEffekt(gebaeudeAusbauen);
werkstattBauen = mitBauEffekt(werkstattBauen);
brunnenBauen = mitBauEffekt(brunnenBauen);
karawansereiBauen = mitBauEffekt(karawansereiBauen);
