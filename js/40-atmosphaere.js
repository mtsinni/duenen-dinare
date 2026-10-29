/* =====================================================================
   40. ATMOSPHÄRE
   A) Umgebungsgeräusche: Wind, Kamelglocken, Marktgewimmel, Grillen bei Nacht
   B) Lebendige Städte: Menschen in den Gassen, Wellen im Teich, Küchenrauch
   ===================================================================== */

/* ---------------- A) Umgebungsgeräusche ---------------- */
let umgebungAn = einstellungLesen('karawane-umgebung', 'an') !== 'aus';
let umgebungLautstaerke = +einstellungLesen('karawane-umgebung-laut', 0.6);
const UMG = { bus: null, wind: null, windFilter: null, markt: null, marktFilter: null, naechsteGlocke: 0, naechsteGrille: 0, naechsterTakt: 0, laeuft: false };

// Rauschen als Grundlage für Wind und Stimmengewirr
function umgebungsRauschen(sek = 2) {
  const b = audio.createBuffer(1, Math.round(audio.sampleRate * sek), audio.sampleRate);
  const d = b.getChannelData(0);
  let rot = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; rot = (rot + 0.02 * w) / 1.02; d[i] = rot * 3.5; }   // „braunes“, weiches Rauschen
  return b;
}

function umgebungStarten() {
  if (UMG.laeuft || !audio) return;
  UMG.laeuft = true;
  UMG.bus = audio.createGain(); UMG.bus.gain.value = 0; UMG.bus.connect(sfxBus);
  // Wind: Rauschen durch einen wandernden Bandpass
  const w = audio.createBufferSource(); w.buffer = umgebungsRauschen(3); w.loop = true;
  UMG.windFilter = audio.createBiquadFilter(); UMG.windFilter.type = 'bandpass'; UMG.windFilter.frequency.value = 500; UMG.windFilter.Q.value = 0.7;
  UMG.wind = audio.createGain(); UMG.wind.gain.value = 0;
  w.connect(UMG.windFilter).connect(UMG.wind).connect(UMG.bus); w.start();
  // Markt: Rauschen im Sprachbereich, das in kurzen Stößen an- und abschwillt
  const m = audio.createBufferSource(); m.buffer = umgebungsRauschen(2.5); m.loop = true;
  UMG.marktFilter = audio.createBiquadFilter(); UMG.marktFilter.type = 'bandpass'; UMG.marktFilter.frequency.value = 650; UMG.marktFilter.Q.value = 1.6;
  UMG.markt = audio.createGain(); UMG.markt.gain.value = 0;
  m.connect(UMG.marktFilter).connect(UMG.markt).connect(UMG.bus); m.start();
}

// Eine kleine Kamelglocke: zwei unharmonische Teiltöne mit kurzem Nachklang
function kamelglocke(lautstaerke) {
  const t = audio.currentTime, grund = 900 + Math.random() * 500;
  for (const [f, l] of [[1, 1], [2.76, 0.45], [5.4, 0.2]]) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine'; o.frequency.value = grund * f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1 * l * lautstaerke, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.5 + Math.random() * 0.3);
    o.connect(g).connect(UMG.bus); o.start(t); o.stop(t + 0.9);
  }
}
// Grillen: schnelle, hohe Zirplaute
function grille(lautstaerke) {
  const t = audio.currentTime, f = 4200 + Math.random() * 600;
  for (let i = 0; i < 3; i++) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    const s = t + i * 0.055;
    g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.012 * lautstaerke, s + 0.01); g.gain.linearRampToValueAtTime(0, s + 0.035);
    o.connect(g).connect(UMG.bus); o.start(s); o.stop(s + 0.05);
  }
}

// Läuft mit jedem Bild – rechnet aber nur ein paar Mal pro Sekunde
function umgebungAktualisieren() {
  if (!audio || audio.state !== 'running') return;
  const jetzt = audio.currentTime;
  if (jetzt < UMG.naechsterTakt) return;
  UMG.naechsterTakt = jetzt + 0.25;
  const still = !umgebungAn || !tonAn || (typeof startOffen !== 'undefined' && startOffen) || (typeof menueOffen !== 'undefined' && menueOffen) || !S;
  if (!UMG.laeuft) { if (still) return; umgebungStarten(); }
  UMG.bus.gain.setTargetAtTime(still ? 0 : umgebungLautstaerke, jetzt, 0.4);
  if (still) return;

  const relativ = ansicht.zoom * SICHT_B / KARTE_B;           // 1 = normale Größe
  const mitte = { x: ansicht.x + KARTE_B / ansicht.zoom / 2, y: ansicht.y + KARTE_H / ansicht.zoom / 2 };
  const nacht = nachtStaerke();
  // Wind: immer leise da, stärker bei Sandsturm in der Nähe und im Hochsommer
  const sturmNah = S.stuerme.reduce((m, s) => Math.max(m, 1 - Math.min(1, Math.max(0, Math.hypot(s.x - mitte.x, s.y - mitte.y) - s.r) / 500)), 0);
  const wind = 0.1 + 0.06 * (jahreszeitIndex() === 1 ? 1 : 0) + 0.5 * sturmNah + (relativ < 0.8 ? 0.04 : 0);
  UMG.wind.gain.setTargetAtTime(wind, jetzt, 0.8);
  UMG.windFilter.frequency.setTargetAtTime(350 + 450 * Math.abs(Math.sin(jetzt * 0.13)) + 500 * sturmNah, jetzt, 1.2);
  // Markt: nah an einer belebten Oase, tagsüber
  let markt = 0;
  if (relativ >= 1.6) {
    const o = S.oasen.filter(o => o.aktiv && o.bev >= 200).sort((a, b) => entfernung(a, mitte) - entfernung(b, mitte))[0];
    if (o) markt = Math.max(0, 1 - entfernung(o, mitte) / (KARTE_B / ansicht.zoom * 0.45)) * Math.min(1, o.bev / 900) * (1 - nacht * 0.8) * Math.min(1, (relativ - 1.4) / 0.8);
  }
  const schwanken = 0.6 + 0.4 * Math.random();
  UMG.markt.gain.setTargetAtTime(0.38 * markt * schwanken, jetzt, 0.15);
  UMG.marktFilter.frequency.setTargetAtTime(500 + Math.random() * 400, jetzt, 0.1);
  // Kamelglocken: eigene Karawanen in Bewegung, im Bild
  if (relativ >= 1.1 && jetzt >= UMG.naechsteGlocke && !S.pause) {
    const laufend = S.karawanen.filter(k => k.nach != null && k.x > ansicht.x && k.x < ansicht.x + KARTE_B / ansicht.zoom && k.y > ansicht.y && k.y < ansicht.y + KARTE_H / ansicht.zoom);
    if (laufend.length) {
      kamelglocke(Math.min(1, 0.5 + laufend.length * 0.15) * Math.min(1, relativ / 2));
      UMG.naechsteGlocke = jetzt + Math.max(0.35, 1.6 / laufend.length) * (0.6 + Math.random() * 0.8);
    }
  }
  // Grillen bei Nacht
  if (nacht > 0.5 && jetzt >= UMG.naechsteGrille) {
    grille(nacht);
    UMG.naechsteGrille = jetzt + 0.3 + Math.random() * 1.4;
  }
}

function umgebungUmschalten() { umgebungAn = !umgebungAn; einstellungSchreiben('karawane-umgebung', umgebungAn ? 'an' : 'aus'); audioBereit(); zeichneMenue(); }
function umgebungLautSetzen(wert) { umgebungLautstaerke = wert; einstellungSchreiben('karawane-umgebung-laut', wert); }

function htmlUmgebung() {
  return `<div class="einstellung"><label>🌬️ ${T('Umgebung', 'Ambience')}</label>
    <input type="range" min="0" max="100" value="${Math.round(umgebungLautstaerke * 100)}" data-laut="umgebung">
    <button data-m="umgebung" class="${umgebungAn ? 'an' : ''}">${umgebungAn ? T('an', 'on') : T('aus', 'off')}</button></div>`;
}

/* ---------------- B) Lebendige Städte ---------------- */
const KLEIDER = ['#283463', '#f1e6d0', '#b8452f', '#3f6e2f', '#c8a04a', '#6b4a8a'];

function zeichneStadtleben(echtzeit, nacht) {
  if (!S) return;
  const relativ = ansicht.zoom * SICHT_B / KARTE_B;
  if (relativ < 1.5) return;
  const h = tagesAnteil() * 24;
  for (const o of S.oasen) {
    if (!o.aktiv || !imBlick(o.x, o.y, 60)) continue;
    const w = Math.max(0, o.wasser) / 100, rx = 5 + 15 * w;
    // Wellen im Teich: sanfte Ringe, die sich ausbreiten
    if (w > 0.1) {
      for (let i = 0; i < 2; i++) {
        const p = (echtzeit * 0.35 + i * 0.5 + hash01(o.id, 7)) % 1;
        const ox = o.x + (hash01(o.id * 3 + i, 8) - 0.5) * rx * 0.8, oy = o.y + (hash01(o.id * 5 + i, 9) - 0.5) * rx * 0.3;
        ctx.strokeStyle = `rgba(255,255,255,${(0.45 * (1 - p)).toFixed(2)})`; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.ellipse(ox, oy, 1 + p * rx * 0.45, (1 + p * rx * 0.45) * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    // Küchenrauch am Morgen und Abend
    const kochen = Math.max(0, 1 - Math.abs(h - 7.5) / 2) + Math.max(0, 1 - Math.abs(h - 18.5) / 2);
    if (kochen > 0) {
      const schornsteine = Math.min(3, 1 + Math.floor(o.bev / 600));
      for (let s = 0; s < schornsteine; s++) {
        const winkel = -0.4 + hash01(o.id * 11 + s, 12) * 2.2, abst = 30 + hash01(o.id * 13 + s, 13) * 10;
        const sx = o.x + Math.cos(winkel) * abst, sy = o.y + Math.sin(winkel) * abst * 0.55 - 2;
        for (let i = 0; i < 4; i++) {
          const p = (echtzeit * 0.18 + i / 4 + s * 0.3) % 1;
          ctx.fillStyle = `rgba(235,228,215,${(0.32 * kochen * (1 - p)).toFixed(2)})`;
          ctx.beginPath(); ctx.arc(sx + Math.sin(p * 4 + s) * 1.5 + p * 5, sy - 6 - p * 16, 0.9 + p * 2.6, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    // Menschen: tagsüber unterwegs zwischen Häusern und Wasser
    if (nacht > 0.7) continue;
    const anzahl = Math.min(9, 2 + Math.floor(o.bev / 160));
    for (let i = 0; i < anzahl; i++) {
      const z = hash01(o.id * 17 + i, 14), tempo = 0.04 + hash01(o.id * 19 + i, 15) * 0.05;
      const hin = Math.sin(echtzeit * tempo + z * 6.28);                 // laufen hin und zurück
      const winkel = -0.5 + z * 2.4 + hin * 0.35, r = rx + 4 + hash01(o.id * 23 + i, 16) * 8;
      const px = o.x + Math.cos(winkel) * r, py = o.y + Math.sin(winkel) * r * 0.55 + 1;
      const geht = Math.abs(Math.cos(echtzeit * tempo + z * 6.28)) > 0.15;
      const wippen = geht ? Math.abs(Math.sin(echtzeit * 7 + i)) * 0.35 : 0;
      ctx.save(); ctx.translate(px, py); ctx.scale(1.45, 1.45);
      ctx.fillStyle = 'rgba(60,35,15,.25)'; ctx.beginPath(); ctx.ellipse(0.4, 0.2, 1, 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = KLEIDER[Math.floor(hash01(o.id * 29 + i, 17) * KLEIDER.length)];
      ctx.beginPath(); ctx.moveTo(-0.9, 0); ctx.lineTo(-0.5, -2.6 - wippen); ctx.lineTo(0.5, -2.6 - wippen); ctx.lineTo(0.9, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a5a34'; ctx.beginPath(); ctx.arc(0, -3.1 - wippen, 0.55, 0, Math.PI * 2); ctx.fill();
      if (hash01(o.id * 31 + i, 18) < 0.3) { ctx.fillStyle = '#c99a5a'; ctx.fillRect(-0.6, -4.1 - wippen, 1.2, 0.6); }   // trägt einen Krug auf dem Kopf
      ctx.restore();
    }
  }
}
