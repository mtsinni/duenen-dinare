/* =====================================================================
   34. LEBENDIGE WELT
   A) Oasen mit Wünschen – wer liefert, lässt die Oase wachsen
   B) Karawanserei-Netz und Handelsposten
   C) Wanderdünen – Sandfelder, die eine Zeit lang Wege versperren
   D) Siedler ziehen fort und gründen junge Siedlungen
   ===================================================================== */

/* ---------------- A) Wünsche der Oasen ---------------- */
const WUNSCH = { aufschlag: 1.2, tageMin: 25, tageMax: 35 };

function wunschWaren(o) {
  return WAREN.filter(w => w.id !== 'wasser' && !w.selten && !w.veredelt && !o.produziert.includes(w.id) && (!w.see || o.hafen));
}

function wunschNeu(o, ersterTag = false) {
  let liste = wunschWaren(o);
  if (!liste.length) { o.wunsch = null; return; }
  // Junge Siedlungen brauchen je nach Stufe ganz bestimmte Dinge
  const sd = jungeSiedlung(o);
  if (sd) {
    const passend = liste.filter(w => SIEDLER.bedarf[Math.min(2, sd.erfuellt)].includes(w.id));
    if (passend.length) liste = passend;
  }
  // nicht zweimal hintereinander dieselbe Ware
  if (o.wunsch && liste.length > 1) liste = liste.filter(w => w.id !== o.wunsch.ware);
  const w = liste[zufallInt(0, liste.length - 1)];
  const menge = Math.max(4, Math.round(zufall(350, 750) / w.basis * Math.max(0.6, o.bev / 700)));
  const dauer = sd ? zufallInt(SIEDLER.tageMin, SIEDLER.tageMax) : zufallInt(WUNSCH.tageMin, WUNSCH.tageMax);
  if (sd) ersterTag = false;
  o.wunsch = { ware: w.id, menge, geliefert: 0, bisTag: S.tag + (ersterTag ? zufallInt(10, dauer) : dauer), erfuellt: false };
}

function wunschOffen(o, wid) { return !!(o.wunsch && o.wunsch.ware === wid && !o.wunsch.erfuellt); }
// Gewünschte Ware wird besser bezahlt (gilt für alle, die dort verkaufen)
function wunschFaktor(o, w) { return wunschOffen(o, w.id) ? (jungeSiedlung(o) ? SIEDLER.aufschlag : WUNSCH.aufschlag) : 1; }

// Aufruf aus handelVerkaufen: Lieferung zählt nur für deine Karawanen
function wunschLieferung(o, wid, anzahl) {
  if (!wunschOffen(o, wid)) return;
  o.wunsch.geliefert += anzahl;
  if (o.wunsch.geliefert >= o.wunsch.menge) {
    o.wunsch.erfuellt = true;
    if (jungeSiedlung(o)) { siedlungGeholfen(o); return; }
    o.bev = Math.round(o.bev * 1.06);
    ansehenAendern(o, 8);
    const w = ware(wid);
    log(T(`🙏 ${o.name} hat genug ${w.name} bekommen! Die Oase blüht auf und wächst – man ist dir dankbar.`,
          `🙏 ${o.name} has received enough ${w.nameEn.toLowerCase()}! The oasis flourishes and grows – the people are grateful.`), 'gut');
    melden('🙏', T(`Wunsch von ${o.name} erfüllt – die Oase wächst!`, `${o.name}'s wish fulfilled – the oasis grows!`), 'gut', { oase: o.id });
    zaehle('wuensche');
  }
}

function wuenscheTag() {
  for (const o of S.oasen) {
    if (!o.aktiv) continue;
    if (!o.wunsch) { wunschNeu(o, true); continue; }
    if (S.tag < o.wunsch.bisTag) continue;
    const z = o.wunsch, anteil = z.geliefert / z.menge;
    if (!z.erfuellt && jungeSiedlung(o)) { if (siedlungVerpasst(o, anteil)) continue; }
    else if (!z.erfuellt) {
      if (anteil >= 0.5) { o.bev = Math.round(o.bev * 1.02); ansehenAendern(o, 3); }
      else if (o.bev > 200) {
        o.bev = Math.round(o.bev * 0.97);
        if (anteil > 0 || S.karawanen.some(k => k.ort === o.id) || S.gebaeude[o.id]) {
          log(T(`😔 In ${o.name} fehlte es an ${ware(z.ware).name} – einige Familien ziehen fort.`, `😔 ${o.name} lacked ${ware(z.ware).nameEn.toLowerCase()} – some families move away.`), 'info');
        }
      }
    }
    wunschNeu(o);
  }
}

function htmlWunsch(o) {
  const z = o.wunsch;
  if (!z) return '';
  const w = ware(z.ware), rest = Math.max(0, z.bisTag - S.tag);
  if (jungeSiedlung(o)) return htmlSiedlung(o);
  if (z.erfuellt) return `<div class="wunsch erfuellt">🙏 ${T(`Wunsch erfüllt: ${w.icon} ${w.name}. Danke!`, `Wish fulfilled: ${w.icon} ${w.nameEn}. Thank you!`)}</div>`;
  return `<div class="wunsch">
      <div>🙏 ${T('Die Oase wünscht sich', 'The oasis wishes for')} <b>${z.menge} ${w.icon} ${T(w.name, w.nameEn)}</b>
        <span class="hinweis">· ${T(`noch ${rest} Tage · zahlt +20 %`, `${rest} days left · pays +20%`)}</span></div>
      <div class="bar"><div style="width:${Math.min(100, z.geliefert / z.menge * 100)}%;background:var(--gruen)"></div></div>
      <div class="hinweis">${T(`${Math.min(z.menge, z.geliefert)} von ${z.menge} geliefert. Erfüllt: Die Oase wächst und du gewinnst Ansehen. Sonst ziehen Bewohner fort.`,
                               `${Math.min(z.menge, z.geliefert)} of ${z.menge} delivered. Fulfilled: the oasis grows and you gain reputation. Otherwise people move away.`)}</div>
    </div>`;
}

/* ---------------- B) Karawanserei-Netz und Handelsposten ---------------- */
const HANDELSPOSTEN = { preis: 1500, unterhalt: 4, grund: 12, proKarawane: 10 };

function sereiNetzBonus() { return (S.karawansereien || []).length >= 3 ? 0.05 : 0; }

function handelspostenBauen(id) {
  const s = karawanserei(+id);
  if (!s || s.posten || S.gold < HANDELSPOSTEN.preis) return;
  S.gold -= HANDELSPOSTEN.preis; buche('Bauten', -HANDELSPOSTEN.preis);
  s.posten = true; s.einnahmen = 0;
  ton('bauen');
  log(T(`🏪 In ${s.name} öffnet dein Handelsposten. Fremde Karawanen rasten hier – und zahlen.`, `🏪 Your trading post opens in ${s.name}. Other caravans rest here – and pay.`), 'gut');
  zeichnePanel();
}

// Täglich: Einnahmen der Handelsposten (je mehr fremde Karawanen vorbeiziehen, desto mehr)
function handelspostenTag() {
  for (const s of S.karawansereien || []) {
    if (!s.posten) continue;
    let fremde = 0;
    for (const r of S.rivalen) for (const k of r.karawanen) {
      if (k.nach == null) continue;
      if (abstandPunktStrecke(s, oase(k.von), oase(k.nach)) < 45) fremde++;
    }
    const betrag = HANDELSPOSTEN.grund + HANDELSPOSTEN.proKarawane * fremde - HANDELSPOSTEN.unterhalt;
    S.gold += betrag; buche('Handelsposten', betrag);
    s.einnahmen = (s.einnahmen || 0) + betrag;
    s.heute = fremde;
  }
}

// Eigene Karawanen, die an einem Handelsposten rasten, werden gepflegt
function handelspostenRast(k, s) {
  if (s.posten && k.krank) {
    k.krank = false;
    log(T(`🏪 Im Handelsposten ${s.name} werden die kranken Tiere von ${k.name} gepflegt.`, `🏪 At the trading post ${s.name} the sick animals of ${k.name} are tended.`), 'gut');
  }
}

function htmlSereiNetz() {
  const liste = S.karawansereien || [];
  if (!liste.length) return '';
  let h = `<div class="info">${T(`${liste.length} Karawanserei${liste.length > 1 ? 'en' : ''}`, `${liste.length} caravanserai${liste.length > 1 ? 's' : ''}`)}` +
    (sereiNetzBonus() ? ` · <b>${T('Netz-Bonus: +5 % Tempo für alle Karawanen', 'Network bonus: +5% speed for all caravans')}</b>`
                      : ` · <span class="hinweis">${T(`Ab 3 Karawansereien: +5 % Tempo für alle Karawanen`, `From 3 caravanserais: +5% speed for all caravans`)}</span>`) + '</div>';
  for (const s of liste) {
    h += `<div class="zeile-karte"><div>🏰 <b>${s.name}</b>${s.posten
        ? `<div class="hinweis">🏪 ${T(`Handelsposten · heute ${s.heute || 0} fremde Karawanen · bisher +${zahl(s.einnahmen || 0)} 🪙`, `Trading post · ${s.heute || 0} other caravans today · +${zahl(s.einnahmen || 0)} 🪙 so far`)}</div>`
        : `<div class="hinweis">${T('Wasser und Wachen für durchziehende Karawanen', 'Water and guards for passing caravans')}</div>`}</div>
      ${s.posten ? '' : `<button data-a="posten" data-v="${s.id}" ${S.gold < HANDELSPOSTEN.preis ? 'disabled' : ''} title="${T('Fremde Karawanen zahlen fürs Rasten, deine kranken Tiere werden gepflegt', 'Other caravans pay to rest, your sick animals are tended')}">🏪 ${HANDELSPOSTEN.preis} 🪙</button>`}</div>`;
  }
  return h;
}

/* ---------------- C) Wanderdünen ---------------- */
const WANDERDUENE = { chance: 0.035, max: 2, tempo: 0.55 };

function wanderduenenTag() {
  if (!S.wanderduenen) S.wanderduenen = [];
  S.wanderduenen = S.wanderduenen.filter(d => {
    if (d.bis > S.tag) return true;
    if (d.gemeldet) log(T('🏜️ Die Wanderdüne ist weitergezogen – der Weg ist wieder frei.', '🏜️ The shifting dune has moved on – the way is clear again.'));
    return false;
  });
  if (S.tag < 8 || S.wanderduenen.length >= WANDERDUENE.max || Math.random() > WANDERDUENE.chance) return;
  for (let versuch = 0; versuch < 40; versuch++) {
    const p = { x: zufall(120, KARTE_B - 200), y: zufall(100, KARTE_H - 100) };
    if (!imLand(p, 80) || S.oasen.some(o => entfernung(o, p) < 90)) continue;
    const d = { id: S.naechsteId++, x: Math.round(p.x), y: Math.round(p.y), r: zufallInt(55, 85), bis: S.tag + zufallInt(12, 24) };
    S.wanderduenen.push(d);
    // Betrifft es eine deiner Reisen? Dann Bescheid sagen
    const betroffen = S.karawanen.find(k => k.nach != null && abstandPunktStrecke(d, oase(k.von), oase(k.nach)) < d.r);
    d.gemeldet = true;
    log(T('🏜️ Ein Sturm hat eine Wanderdüne aufgeworfen – wer hindurchzieht, kommt nur langsam voran.', '🏜️ A storm has thrown up a shifting dune – anyone crossing it moves slowly.'), betroffen ? 'schlecht' : 'info');
    if (betroffen) melden('🏜', T(`Eine Wanderdüne liegt auf dem Weg von ${betroffen.name}.`, `A shifting dune lies on ${betroffen.name}'s path.`), 'schlecht', { karawane: betroffen.id });
    break;
  }
}

function inWanderduene(p) { return (S.wanderduenen || []).some(d => Math.hypot(p.x - d.x, p.y - d.y) < d.r); }
function routeDurchDuene(a, b) { return (S.wanderduenen || []).some(d => abstandPunktStrecke(d, a, b) < d.r); }

function zeichneWanderduenen(echtzeit) {
  for (const d of S.wanderduenen || []) {
    // weicher, sandiger Fleck
    const f = ctx.createRadialGradient(d.x, d.y, d.r * 0.2, d.x, d.y, d.r);
    f.addColorStop(0, 'rgba(226,186,120,.55)'); f.addColorStop(1, 'rgba(226,186,120,0)');
    ctx.fillStyle = f; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    // Kämme, die langsam mit dem Wind wandern
    ctx.save(); ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 0.85, 0, Math.PI * 2); ctx.clip();
    ctx.lineWidth = 1.4;
    for (let i = -4; i <= 4; i++) {
      const y = d.y + i * 9, wandern = (echtzeit * 6 + d.id * 13) % 40;
      ctx.strokeStyle = i % 2 ? 'rgba(150,95,45,.35)' : 'rgba(255,240,205,.55)';
      ctx.beginPath();
      for (let x = d.x - d.r; x <= d.x + d.r; x += 6) {
        const yy = y + Math.sin((x + wandern) / 11) * 3;
        x === d.x - d.r ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(150,95,45,.5)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 0.88, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    beschriftung(T('Wanderdüne', 'Shifting dune'), d.x, d.y + d.r * 0.88 + 12, 11, 'rgba(110,70,30,.9)', true, null);
  }
}

/* ---------------- D) Siedler gründen junge Siedlungen ---------------- */
// Wird eine Oase groß, ziehen manchmal Familien fort und gründen in der Nähe eine eigene kleine
// Siedlung. Die braucht Hilfe: Sie äußert nacheinander drei Wünsche. Wer sie erfüllt, lässt
// die Siedlung zu einer richtigen Oase heranwachsen. Zweimal im Stich gelassen – und sie gibt auf.
const SIEDLER = {
  abBev: 600, chance: 0.012, maxOasen: 16, maxJung: 2, ab: 20,
  abstandMin: 140, abstandMax: 260, anteil: 0.1,
  aufschlag: 1.3, tageMin: 30, tageMax: 42, stufen: 3,
  bedarf: [['datteln', 'eisenwaren', 'salz'], ['teppiche', 'indigo', 'eisenwaren', 'salz'], ['gewuerze', 'weihrauch', 'teppiche', 'indigo']],
  lohn: 600, verwehenMin: 30, verwehenMax: 40,
};
const SIEDLUNG_NAMEN = ['Bir Hilal', 'Ain Sabr', 'Wadi Salam', 'Bir Amin', 'Ain Nasim', 'Wadi Ward', 'Bir Sahra', 'Ain Layali',
                        'Wadi Rih', 'Bir Faraj', 'Ain Hadiya', 'Wadi Qamar'];
const STUFEN_NAMEN = [['Zeltlager', 'Tent camp'], ['Weiler', 'Hamlet'], ['Dorf', 'Village']];

function jungeSiedlung(o) { return o && o.aktiv && o.siedlung && !o.siedlung.fertig ? o.siedlung : null; }

function himmelsrichtung(von, nach) {
  const w = Math.atan2(nach.y - von.y, nach.x - von.x) * 180 / Math.PI;   // 0 = Osten, 90 = Süden
  const i = Math.round(((w + 360) % 360) / 45) % 8;
  return [['Osten', 'east'], ['Südosten', 'south-east'], ['Süden', 'south'], ['Südwesten', 'south-west'],
          ['Westen', 'west'], ['Nordwesten', 'north-west'], ['Norden', 'north'], ['Nordosten', 'north-east']][i];
}

function siedlungsPlatzFrei(p) {
  if (!imLand(p, 70)) return false;
  if (S.oasen.some(o => entfernung(o, p) < 130)) return false;
  if (S.karawansereien.some(s => entfernung(s, p) < 70)) return false;
  if (S.raeuber.some(g => entfernung(g, p) < g.r + 40)) return false;
  if (GEBIRGE.some(g => Math.hypot(g.x - p.x, g.y - p.y) < g.breite * 0.75)) return false;
  if (((p.x - SALZPFANNE.x) / (SALZPFANNE.rx + 30)) ** 2 + ((p.y - SALZPFANNE.y) / (SALZPFANNE.ry + 30)) ** 2 < 1) return false;
  return !inWanderduene(p);
}

function siedlerTag() {
  if (S.tag < SIEDLER.ab || Math.random() > SIEDLER.chance) return;
  const aktive = S.oasen.filter(o => o.aktiv);
  if (aktive.length >= SIEDLER.maxOasen || aktive.filter(o => jungeSiedlung(o)).length >= SIEDLER.maxJung) return;
  const muetter = aktive.filter(o => o.bev >= SIEDLER.abBev && !jungeSiedlung(o));
  if (!muetter.length) return;
  const mutter = muetter[zufallInt(0, muetter.length - 1)];
  siedlungGruenden(mutter);
}

function siedlungGruenden(mutter) {
  let p = null;
  for (let versuch = 0; versuch < 60 && !p; versuch++) {
    const winkel = Math.random() * Math.PI * 2, abst = zufall(SIEDLER.abstandMin, SIEDLER.abstandMax);
    const q = { x: Math.round(mutter.x + Math.cos(winkel) * abst), y: Math.round(mutter.y + Math.sin(winkel) * abst) };
    if (siedlungsPlatzFrei(q)) p = q;
  }
  if (!p) return null;
  const benutzt = S.oasen.map(o => o.name);
  const name = [...SIEDLUNG_NAMEN, ...NEUE_NAMEN].find(n => !benutzt.includes(n)) || 'Bir ' + S.naechsteId;
  // Die Siedler nehmen das Handwerk ihrer Heimat mit
  const handwerk = mutter.produziert.filter(id => id !== 'wasser' && !ware(id).see && !ware(id).mine && !ware(id).veredelt);
  const auswahl = handwerk.length ? handwerk : WAREN.filter(w => w.id !== 'gold' && w.id !== 'wasser' && !w.see && !w.mine && !w.veredelt).map(w => w.id);
  const produkt = auswahl[zufallInt(0, auswahl.length - 1)];
  const siedler = Math.round(Math.min(140, Math.max(50, mutter.bev * SIEDLER.anteil)));
  mutter.bev -= siedler;
  const o = neueOase(name, p.x, p.y, ['wasser', produkt], siedler);
  o.wasser = zufall(65, 85);
  o.siedlung = { mutter: mutter.id, seit: S.tag, erfuellt: 0, verpasst: 0, fertig: false };
  S.oasen.push(o);
  S.ansehen[o.id] = Math.max(0, Math.round(ansehen(mutter) / 2));   // man kennt dich aus der alten Heimat
  wunschNeu(o);
  erkunden(o.x, o.y, 70);   // die Siedler schicken Nachricht – ihr Lager ist jetzt auf der Karte
  const [de, en] = himmelsrichtung(mutter, o);
  log(T(`🏕️ ${siedler} Siedler aus ${mutter.name} ziehen fort und gründen im ${de} die Siedlung ${name}. Sie brauchen ${zahl(o.wunsch.menge)} ${ware(o.wunsch.ware).name} – und zahlen gut dafür!`,
        `🏕️ ${siedler} settlers from ${mutter.name} move away and found the settlement of ${name} to the ${en}. They need ${zahl(o.wunsch.menge)} ${ware(o.wunsch.ware).nameEn.toLowerCase()} – and pay well for it!`), 'gut');
  melden('🏕', T(`Neue Siedlung ${name} im ${de} von ${mutter.name} – sie bittet um Hilfe.`, `New settlement ${name} to the ${en} of ${mutter.name} – it asks for help.`), 'info', { oase: o.id });
  if (typeof nebelGeaendert !== 'undefined') nebelGeaendert = true;
  return o;
}

// Ein Wunsch der Siedlung wurde erfüllt
function siedlungGeholfen(o) {
  const sd = o.siedlung;
  sd.erfuellt++;
  o.bev = Math.round(o.bev * 1.3 + 40);
  o.wasser = Math.min(100, o.wasser + 10);
  ansehenAendern(o, 12);
  zaehle('wuensche');
  if (sd.erfuellt >= SIEDLER.stufen) {
    sd.fertig = true;
    o.bev = Math.max(o.bev, 280);
    S.gold += SIEDLER.lohn; buche('Belohnungen', SIEDLER.lohn);
    ansehenAendern(o, 15);
    zaehle('siedlungen');
    log(T(`🌴 ${o.name} ist zu einer richtigen Oase herangewachsen! Die Ältesten danken dir mit ${SIEDLER.lohn} Dinar – hier wirst du immer willkommen sein.`,
          `🌴 ${o.name} has grown into a proper oasis! The elders thank you with ${SIEDLER.lohn} dinars – you will always be welcome here.`), 'gut');
    melden('🌴', T(`${o.name} ist jetzt eine Oase – dank dir!`, `${o.name} is now an oasis – thanks to you!`), 'gut', { oase: o.id });
    if (typeof effektFunkeln === 'function') try { effektFunkeln(o.x, o.y); } catch (e) {}
    return;
  }
  const stufe = STUFEN_NAMEN[sd.erfuellt];
  log(T(`🏕️ ${o.name} hat bekommen, was es brauchte – aus dem Lager wird ein ${stufe[0]}! Bald äußern die Siedler den nächsten Wunsch.`,
        `🏕️ ${o.name} got what it needed – the camp becomes a ${stufe[1].toLowerCase()}! The settlers will soon ask for the next thing.`), 'gut');
  melden('🏕', T(`${o.name} wächst: jetzt ein ${stufe[0]} (${sd.erfuellt}/${SIEDLER.stufen})`, `${o.name} grows: now a ${stufe[1].toLowerCase()} (${sd.erfuellt}/${SIEDLER.stufen})`), 'gut', { oase: o.id });
  o.wunsch.bisTag = S.tag + zufallInt(3, 6);   // der nächste Wunsch kommt bald
}

// Ein Wunsch ist abgelaufen. true = die Siedlung hat aufgegeben
function siedlungVerpasst(o, anteil) {
  const sd = o.siedlung, mutter = oase(sd.mutter);
  if (anteil >= 0.5) { ansehenAendern(o, 2); return false; }   // halb geliefert: man hält durch
  sd.verpasst++;
  o.bev = Math.max(30, Math.round(o.bev * 0.85));
  if (sd.verpasst < 2) {
    log(T(`😟 ${o.name} wartet vergeblich auf ${ware(o.wunsch.ware).name}. Die Siedler sind enttäuscht – noch einmal halten sie nicht durch.`,
          `😟 ${o.name} waited in vain for ${ware(o.wunsch.ware).nameEn.toLowerCase()}. The settlers are disappointed – they won't hold out a second time.`), 'schlecht');
    melden('🏕', T(`${o.name} ist enttäuscht – beim nächsten Mal geben die Siedler auf.`, `${o.name} is disappointed – next time the settlers will give up.`), 'schlecht', { oase: o.id });
    return false;
  }
  // Aufgeben: zurück in die alte Heimat. Die leeren Zelte stehen noch eine Weile –
  // wer in dieser Zeit das Gewünschte bringt, holt die Siedler zurück.
  const heim = mutter && mutter.aktiv ? mutter : null;
  if (heim) heim.bev += o.bev;
  const z = o.wunsch;
  o.verlassen = { seit: S.tag, bis: S.tag + zufallInt(SIEDLER.verwehenMin, SIEDLER.verwehenMax), mutter: sd.mutter,
                  stufe: sd.erfuellt, ware: z.ware, menge: Math.max(4, Math.round(z.menge * 0.6)), geliefert: 0 };
  o.aktiv = false; o.bev = 0; o.wasser = 0; o.wunsch = null; delete o.siedlung;
  for (const w of WAREN) o.lager[w.id] = 0;
  log(T(`🏚️ Die Siedler von ${o.name} geben auf${heim ? ` und kehren nach ${heim.name} zurück` : ''}. Nur die leeren Zelte bleiben – noch. Bringst du bald ${o.verlassen.menge} ${ware(z.ware).name} hin, kommen sie vielleicht wieder.`,
        `🏚️ The settlers of ${o.name} give up${heim ? ` and return to ${heim.name}` : ''}. Only the empty tents remain – for now. Bring ${o.verlassen.menge} ${ware(z.ware).nameEn.toLowerCase()} there soon and they might come back.`), 'schlecht');
  melden('🏚', T(`${o.name} ist verlassen – rund ${o.verlassen.bis - S.tag} Tage Zeit, die Siedler zurückzuholen.`, `${o.name} has been abandoned – about ${o.verlassen.bis - S.tag} days to bring the settlers back.`), 'schlecht', { oase: o.id });
  return true;
}

/* ---- Verlassene Lager: verwehen mit der Zeit – oder die Siedler kehren zurück ---- */
function verlasseneTag() {
  for (const o of [...S.oasen]) {
    const v = o.verlassen;
    if (!v) continue;
    if (o.aktiv) { delete o.verlassen; continue; }            // z. B. durch Regen wieder belebt
    if (v.bis - S.tag === 7) melden('🏚', T(`Die Zelte von ${o.name} sind bald verweht – noch 7 Tage.`, `The tents of ${o.name} will soon be buried – 7 days left.`), 'info', { oase: o.id });
    if (S.tag >= v.bis) verwehen(o);
  }
}

// Ist der Ort noch irgendwo in Gebrauch? Dann wartet der Sand noch einen Tag.
function oaseInGebrauch(id) {
  if (S.gebaeude[id]) return true;
  if (S.karawanen.some(k => k.ort === id || k.von === id || k.nach === id)) return true;
  return S.rivalen.some(r => r.karawanen.some(k => k.ort === id || k.von === id || k.nach === id));
}

function verwehen(o) {
  const id = o.id;
  if (oaseInGebrauch(id)) { o.verlassen.bis = S.tag + 1; return; }
  S.oasen = S.oasen.filter(x => x.id !== id);
  for (const k of S.karawanen) {
    if (!k.route) continue;
    const vorher = k.route.stationen.length;
    k.route.stationen = k.route.stationen.filter(st => st.oase !== id);
    if (k.route.stationen.length !== vorher) {
      if (k.route.stationen.length < 2) k.route.aktiv = false;
      k.route.index = Math.min(k.route.index, Math.max(0, k.route.stationen.length - 1));
    }
  }
  S.auftraege = S.auftraege.filter(a => a.oase !== id);
  S.angebote = S.angebote.filter(a => a.oase !== id);
  S.feste = S.feste.filter(f => f.oase !== id);
  if (S.pluenderer) S.pluenderer = S.pluenderer.filter(p => !(p.ziel && p.ziel.art === 'oase' && p.ziel.id === id));
  delete S.wissen[id]; delete S.ansehen[id];
  if (S.preisVerlauf) delete S.preisVerlauf[id];
  if (S.ziel === id) S.ziel = null;
  if (S.gewOase === id) { const k = karawane(S.gewKarawane); S.gewOase = k && k.ort != null ? k.ort : S.oasen[0].id; }
  log(T(`🌬️ Der Wind hat die letzten Zelte von ${o.name} unter dem Sand begraben. Von der Siedlung ist nichts mehr zu sehen.`,
        `🌬️ The wind has buried the last tents of ${o.name} under the sand. Nothing of the settlement can be seen any more.`), 'info');
  if (typeof nebelGeaendert !== 'undefined') nebelGeaendert = true;
  zeichnePanel();
}

// Deine Karawane steht im verlassenen Lager und lädt die gewünschte Ware ab
function siedlerZurueckholen(id) {
  const o = oase(id), v = o && o.verlassen;
  if (!v) return;
  const k = [karawane(S.gewKarawane), ...S.karawanen].find(x => x && x.ort === id && x.nach == null);
  if (!k) return;
  const w = ware(v.ware), anzahl = Math.min(k.ladung[v.ware] || 0, v.menge - v.geliefert);
  if (anzahl <= 0) return;
  k.ladung[v.ware] -= anzahl;
  v.geliefert += anzahl;
  const lohn = Math.round(w.basis * anzahl);   // die Familien in der alten Heimat bezahlen
  S.gold += lohn; buche('Handel', lohn);
  if (v.geliefert < v.menge) {
    log(T(`📦 ${k.name} lädt ${anzahl} ${w.name} im verlassenen ${o.name} ab (+${zahl(lohn)} Dinar). Es fehlen noch ${v.menge - v.geliefert}.`,
          `📦 ${k.name} unloads ${anzahl} ${w.nameEn.toLowerCase()} at abandoned ${o.name} (+${zahl(lohn)} dinars). ${v.menge - v.geliefert} still missing.`), 'info');
    zeichnePanel(); return;
  }
  // Genug geliefert: Die Siedler kehren zurück – mit dem alten Fortschritt
  const mutter = oase(v.mutter);
  let siedler = 60;
  if (mutter && mutter.aktiv) { siedler = Math.round(Math.min(120, Math.max(50, mutter.bev * 0.08))); mutter.bev = Math.max(50, mutter.bev - siedler); }
  o.aktiv = true; o.bev = siedler; o.wasser = zufall(60, 75);
  for (const x of WAREN) o.lager[x.id] = (x.selten || x.veredelt) ? 0 : normBestand(o, x) * (o.produziert.includes(x.id) ? 2 : zufall(0.2, 0.6));
  o.siedlung = { mutter: v.mutter, seit: S.tag, erfuellt: v.stufe, verpasst: 0, fertig: false };
  delete o.verlassen;
  o.wunsch = null; wunschNeu(o);
  ansehenAendern(o, 15);
  if (k.ort === o.id) merkePreise(o);
  log(T(`🏕️ Die Nachricht spricht sich herum: ${o.name} hat wieder, was es braucht! ${siedler} Siedler kehren zurück und schlagen ihre Zelte erneut auf.`,
        `🏕️ Word gets around: ${o.name} has what it needs again! ${siedler} settlers return and pitch their tents once more.`), 'gut');
  melden('🏕', T(`Die Siedler kehren nach ${o.name} zurück!`, `The settlers return to ${o.name}!`), 'gut', { oase: o.id });
  if (typeof effektFunkeln === 'function') try { effektFunkeln(o.x, o.y); } catch (e) {}
  zaehle('rueckkehr');
  zeichnePanel();
}

function htmlVerlassen(o) {
  const v = o.verlassen, w = ware(v.ware), rest = Math.max(0, v.bis - S.tag), fehlt = v.menge - v.geliefert;
  const k = [karawane(S.gewKarawane), ...S.karawanen].find(x => x && x.ort === o.id && x.nach == null);
  const dabei = k ? Math.min(k.ladung[v.ware] || 0, fehlt) : 0;
  let h = `<div class="wunsch siedlung verlassen">
    <div class="siedlung-kopf">🏚 <b>${T('Verlassenes Lager', 'Abandoned camp')}</b>
      <span class="hinweis" style="margin-left:auto">${T(`verweht in ${rest} Tagen`, `buried in ${rest} days`)}</span></div>
    <div class="bar"><div style="width:${Math.max(0, rest / (v.bis - v.seit) * 100)}%;background:#c8a04a"></div></div>
    <div>${T('Die Siedler sind fortgezogen. Bring', 'The settlers have left. Bring')} <b>${fehlt} ${w.icon} ${T(w.name, w.nameEn)}</b>
      ${T('hierher, dann kehren sie zurück – und machen dort weiter, wo sie aufgehört haben.', 'here and they will return – picking up where they left off.')}</div>
    <div class="hinweis">${T(`Die Familien in der alten Heimat zahlen den Grundpreis (${w.basis} Dinar pro Stück).`, `The families back home pay the base price (${w.basis} dinars each).`)}</div>`;
  if (k) {
    h += dabei > 0
      ? `<button class="gross" data-a="siedlerZurueck" data-v="${o.id}">📦 ${T(`${dabei} ${w.name} abladen`, `Unload ${dabei} ${w.nameEn.toLowerCase()}`)}</button>`
      : `<div class="hinweis">${T(`${k.name} hat keine ${w.name} dabei.`, `${k.name} carries no ${w.nameEn.toLowerCase()}.`)}</div>`;
  } else {
    h += `<div class="hinweis">🐪 ${T('Schicke eine Karawane mit der Ware hierher.', 'Send a caravan here with the goods.')}</div>`;
  }
  return h + '</div>';
}

function htmlSiedlung(o) {
  const sd = o.siedlung, z = o.wunsch, mutter = oase(sd.mutter);
  const stufe = STUFEN_NAMEN[Math.min(2, sd.erfuellt)];
  let pips = '';
  for (let i = 0; i < SIEDLER.stufen; i++) pips += `<span class="pip ${i < sd.erfuellt ? 'an' : ''}"></span>`;
  let h = `<div class="wunsch siedlung">
    <div class="siedlung-kopf">🏕 <b>${T('Junge Siedlung', 'Young settlement')}</b> · ${T(stufe[0], stufe[1])}
      <span class="pips">${pips}</span></div>
    <div class="hinweis">${T(`Gegründet von Siedlern aus ${mutter ? mutter.name : '?'}. Erfülle ${SIEDLER.stufen} Wünsche, dann wird ${o.name} eine richtige Oase – und die Ältesten belohnen dich mit ${SIEDLER.lohn} Dinar.`,
                             `Founded by settlers from ${mutter ? mutter.name : '?'}. Fulfil ${SIEDLER.stufen} wishes and ${o.name} becomes a proper oasis – the elders will reward you with ${SIEDLER.lohn} dinars.`)}</div>`;
  if (z && !z.erfuellt) {
    const w = ware(z.ware), rest = Math.max(0, z.bisTag - S.tag);
    h += `<div>🙏 ${T('Die Siedler brauchen', 'The settlers need')} <b>${z.menge} ${w.icon} ${T(w.name, w.nameEn)}</b>
        <span class="hinweis">· ${T(`noch ${rest} Tage · zahlt +30 %`, `${rest} days left · pays +30%`)}</span></div>
      <div class="bar"><div style="width:${Math.min(100, z.geliefert / z.menge * 100)}%;background:var(--gruen)"></div></div>
      <div class="hinweis">${T(`${Math.min(z.menge, z.geliefert)} von ${z.menge} geliefert.`, `${Math.min(z.menge, z.geliefert)} of ${z.menge} delivered.`)}
        ${sd.verpasst ? `<b class="warnung-text">${T('Schon einmal enttäuscht – noch ein verpasster Wunsch, und die Siedler geben auf!', 'Already let down once – one more missed wish and the settlers give up!')}</b>` : ''}</div>`;
  } else {
    h += `<div class="hinweis">✅ ${T('Geliefert! Die Siedler bauen fleißig – bald äußern sie den nächsten Wunsch.', 'Delivered! The settlers are busy building – they will soon ask for the next thing.')}</div>`;
  }
  return h + '</div>';
}

// Übersicht im Reiter „Aufträge“: alle bekannten Wünsche, junge Siedlungen zuerst
function htmlWunschListe() {
  const liste = S.oasen.filter(o => o.aktiv && o.wunsch && !o.wunsch.erfuellt && erkundet(o))
    .sort((a, b) => (jungeSiedlung(b) ? 1 : 0) - (jungeSiedlung(a) ? 1 : 0) || a.wunsch.bisTag - b.wunsch.bisTag);
  let h = `<h3 style="margin-top:12px">🙏 ${T('Wünsche der Oasen', 'Oasis wishes')}</h3>`;
  if (!liste.length) return h + `<p class="hinweis">${T('Gerade wünscht sich keine bekannte Oase etwas.', 'No known oasis is wishing for anything right now.')}</p>`;
  for (const o of liste) {
    const z = o.wunsch, w = ware(z.ware), rest = Math.max(0, z.bisTag - S.tag), sd = jungeSiedlung(o);
    h += `<button class="wunsch-zeile${sd ? ' siedlung' : ''}" data-a="zeigeOase" data-v="${o.id}">
      <span>${sd ? '🏕' : '🌴'} <b>${o.name}</b>${sd ? ` <small>(${T('Siedlung', 'settlement')} ${sd.erfuellt}/${SIEDLER.stufen})</small>` : ''}</span>
      <span>${w.icon} ${Math.max(0, z.menge - z.geliefert)} ${T(w.name, w.nameEn)} · <span class="${rest <= 5 ? 'warnung' : ''}">${T(`${rest} T.`, `${rest} d`)}</span> · +${sd ? 30 : 20} %</span>
    </button>`;
  }
  return h;
}
