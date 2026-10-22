/* =====================================================================
   29. EREIGNISSE MIT ENTSCHEIDUNGEN
   Ab und zu passiert unterwegs oder in einer Oase etwas, bei dem du
   entscheiden musst. Manche Folgen zeigen sich erst Tage später.
   ===================================================================== */

const ENTSCHEIDUNG_CHANCE = 0.08;    // pro Tag
const ENTSCHEIDUNG_PAUSE = 14;       // dasselbe Ereignis frühestens nach so vielen Tagen wieder

function unterwegs() { return S.karawanen.filter(k => k.nach != null && tierAnzahl(k) > 0); }
function anOase() { return S.karawanen.filter(k => k.ort != null && oase(k.ort).aktiv && tierAnzahl(k) > 0); }
function irgendeine(liste) { return liste.length ? liste[zufallInt(0, liste.length - 1)] : null; }
function freiePlaetze(k) { return Math.floor(kapazitaet(k) - ladungGewicht(k)); }
function teuersteLadung(k) {
  return WAREN.filter(w => w.id !== 'wasser' && k.ladung[w.id] >= 1).sort((a, b) => b.basis - a.basis)[0] || null;
}
function verlorenerFundort() { return (S.fundorte || []).find(f => !f.entdeckt) || null; }

const ENTSCHEIDUNGEN = [
  { id: 'wanderer', icon: '🧕',
    finden: () => { const k = irgendeine(unterwegs().filter(k => k.ladung.wasser >= 5)); return k && { k: k.id }; },
    titel: () => T('Ein Wanderer im Sand', 'A wanderer in the sand'),
    text: c => T(`Am Wegesrand von ${karawane(c.k).name} liegt ein erschöpfter Wanderer. Seine Lippen sind aufgesprungen, sein Gewand ist edel, aber zerrissen. „Wasser …“, flüstert er.`,
                 `Beside the path of ${karawane(c.k).name} lies an exhausted wanderer. His lips are cracked, his robe fine but torn. "Water…", he whispers.`),
    optionen: [
      { text: () => T('💧 Wasser geben und mitnehmen (−5 Wasser)', '💧 Give water and take him along (−5 water)'),
        wirkung: c => {
          const k = karawane(c.k); k.ladung.wasser = Math.max(0, k.ladung.wasser - 5);
          const r = Math.random();
          if (r < 0.45) { folgeNeu(zufallInt(4, 8), 'wandererDank', {}); return T('Er erholt sich und dankt dir überschwänglich. „Das werde ich nicht vergessen“, sagt er geheimnisvoll.', 'He recovers and thanks you profusely. "I will not forget this," he says mysteriously.'); }
          const f = verlorenerFundort();
          if (r < 0.75 && f) { erkunden(f.x, f.y, 90, k.name); return T('Zum Dank erzählt er von einem verborgenen Ort in der Wüste – und zeichnet den Weg in den Sand!', 'In gratitude he tells of a hidden place in the desert – and draws the way in the sand!'); }
          epGeben(k, 20);
          return T('Er erholt sich und zieht bei der nächsten Gelegenheit seiner Wege. Dein Führer hat etwas über die Wüste gelernt.', 'He recovers and goes his own way at the next opportunity. Your guide has learned something about the desert.');
        } },
      { text: () => T('🐪 Weiterziehen', '🐪 Move on'),
        wirkung: c => { if (Math.random() < 0.3) folgeNeu(zufallInt(3, 6), 'wandererGeruecht', { ziel: karawane(c.k).nach });
          return T('Ihr zieht weiter. Die Wüste ist hart – aber war das richtig?', 'You move on. The desert is harsh – but was that right?'); } },
    ] },

  { id: 'haendler', icon: '🧺',
    finden: () => { const k = irgendeine(unterwegs().filter(k => freiePlaetze(k) >= 10)); if (!k) return null;
      const w = irgendeine(WAREN.filter(w => ['gewuerze', 'weihrauch', 'teppiche', 'gold', 'indigo'].includes(w.id)));
      const menge = Math.min(freiePlaetze(k), zufallInt(8, 16));
      return { k: k.id, w: w.id, menge, preis: Math.round(w.basis * 0.5 * menge) }; },
    titel: () => T('Ein Händler in Eile', 'A merchant in a hurry'),
    text: c => { const w = ware(c.w); return T(`Ein nervöser Händler hält ${karawane(c.k).name} an. Er bietet ${c.menge} ${w.name} für nur ${c.preis} Dinar – die Hälfte des üblichen Preises. Er schaut sich ständig um.`,
                                         `A nervous merchant stops ${karawane(c.k).name}. He offers ${c.menge} ${w.nameEn.toLowerCase()} for only ${c.preis} dinars – half the usual price. He keeps looking over his shoulder.`); },
    optionen: [
      { text: c => T(`🪙 Kaufen (${c.preis} Dinar)`, `🪙 Buy (${c.preis} dinars)`), geht: c => S.gold >= c.preis,
        wirkung: c => { const k = karawane(c.k); S.gold -= c.preis; buche('Handel', -c.preis); k.ladung[c.w] += c.menge; k.einstand[c.w] = ware(c.w).basis * 0.5;
          if (Math.random() < 0.35) folgeNeu(zufallInt(2, 5), 'diebesgut', { k: c.k, w: c.w, menge: c.menge });
          return T('Das Geschäft ist schnell gemacht. Der Händler verschwindet eilig in den Dünen …', 'The deal is quickly done. The merchant hurries off into the dunes…'); } },
      { text: () => T('✋ Ablehnen', '✋ Decline'), wirkung: () => T('Du traust dem Angebot nicht und ziehst weiter.', 'You do not trust the offer and move on.') },
    ] },

  { id: 'sturmwarnung', icon: '🌪',
    finden: () => { const k = irgendeine(unterwegs().filter(k => !k.imSturm)); return k && { k: k.id }; },
    titel: () => T('Der Himmel färbt sich gelb', 'The sky turns yellow'),
    text: c => T(`Ein alter Nomade warnt ${karawane(c.k).name}: „Der Wind dreht. Bald kommt Sand.“ Der Horizont flimmert seltsam.`,
                 `An old nomad warns ${karawane(c.k).name}: "The wind is turning. Sand is coming soon." The horizon shimmers strangely.`),
    optionen: [
      { text: () => T('⛺ Lager aufschlagen und abwarten (½ Tag)', '⛺ Make camp and wait (½ day)'),
        wirkung: c => { const k = karawane(c.k); k.gereist = Math.max(0, k.gereist - reiseTempo(k) * 0.5);
          return T('Ihr wartet hinter einer Düne. Der Sturm zieht vorüber – alle sind wohlauf.', 'You wait behind a dune. The storm passes by – everyone is safe.'); } },
      { text: () => T('🐪 Weiterziehen', '🐪 Keep going'),
        wirkung: c => { const k = karawane(c.k), w = teuersteLadung(k);
          if (Math.random() < 0.4 && w) { const weg = Math.ceil(k.ladung[w.id] * zufall(0.1, 0.25)); k.ladung[w.id] -= weg;
            return T(`Der Sturm erwischt euch doch! ${weg} ${w.name} gehen im Sand verloren.`, `The storm catches you after all! ${weg} ${w.nameEn.toLowerCase()} are lost in the sand.`); }
          return T('Glück gehabt – der Sturm zieht in eine andere Richtung.', 'Lucky – the storm moves off in another direction.'); } },
    ] },

  { id: 'karte', icon: '🗺',
    finden: () => { const k = irgendeine(anOase()); return k && verlorenerFundort() && S.gold >= 150 && { k: k.id, o: k.ort }; },
    titel: () => T('Eine geheimnisvolle Karte', 'A mysterious map'),
    text: c => T(`Auf dem Basar von ${oase(c.o).name} flüstert dir ein Mann zu: „Eine alte Karte. Sie zeigt einen Ort, den niemand kennt. 150 Dinar.“`,
                 `In the bazaar of ${oase(c.o).name} a man whispers to you: "An old map. It shows a place nobody knows. 150 dinars."`),
    optionen: [
      { text: () => T('🪙 Kaufen (150 Dinar)', '🪙 Buy (150 dinars)'), geht: () => S.gold >= 150,
        wirkung: c => { S.gold -= 150; buche('Kundschafter', -150); const f = verlorenerFundort();
          if (f && Math.random() < 0.65) { erkunden(f.x, f.y, 90, T('eine alte Karte', 'an old map')); return T('Die Karte ist echt! Der verborgene Ort ist jetzt auf deiner Karte zu sehen.', 'The map is genuine! The hidden place now shows on your map.'); }
          return T('Zu Hause merkst du: Die „alte“ Karte ist mit frischer Tinte gezeichnet. Betrogen!', 'Back home you notice: the "old" map is drawn in fresh ink. Swindled!'); } },
      { text: () => T('✋ Ablehnen', '✋ Decline'), wirkung: () => T('Du lässt den Mann stehen.', 'You leave the man standing.') },
    ] },

  { id: 'krankheit', icon: '🤒',
    finden: () => { const k = irgendeine(unterwegs().filter(k => !k.krank && tierAnzahl(k) >= 2)); return k && { k: k.id }; },
    titel: () => T('Ein Tier lahmt', 'An animal is limping'),
    text: c => T(`Bei ${karawane(c.k).name} lahmt ein Tier und frisst nicht mehr. Der Führer kennt ein Heilkraut – aber es kostet Zeit und Datteln.`,
                 `In ${karawane(c.k).name} an animal is limping and has stopped eating. The guide knows a healing herb – but it costs time and dates.`),
    optionen: [
      { text: c => karawane(c.k).ladung.datteln >= 4 ? T('🌿 Pflegen (−4 Datteln)', '🌿 Tend to it (−4 dates)') : T('🌿 Pflegen (−40 Dinar)', '🌿 Tend to it (−40 dinars)'),
        wirkung: c => { const k = karawane(c.k); if (k.ladung.datteln >= 4) k.ladung.datteln -= 4; else { S.gold -= 40; buche('Heiler', -40); }
          return T('Nach einer Nacht ist das Tier wieder auf den Beinen.', 'After one night the animal is back on its feet.'); } },
      { text: () => T('🐪 Weiter, es wird schon', '🐪 Carry on, it will be fine'),
        wirkung: c => { const k = karawane(c.k); if (Math.random() < 0.55) { k.krank = true; return T('Es wird schlimmer – die Krankheit breitet sich aus. Ein Tierheiler in einer Oase kann helfen.', 'It gets worse – the illness spreads. An animal healer in an oasis can help.'); }
          return T('Am nächsten Morgen läuft das Tier wieder normal.', 'The next morning the animal walks normally again.'); } },
    ] },

  { id: 'hochzeit', icon: '🎉',
    finden: () => { const k = irgendeine(anOase().filter(k => ansehen(oase(k.ort)) >= 10)); return k && { k: k.id, o: k.ort }; },
    titel: () => T('Eine Hochzeit', 'A wedding'),
    text: c => T(`Der Scheich von ${oase(c.o).name} verheiratet seine Tochter. Als angesehener Händler bist du eingeladen. Ein Geschenk wäre angemessen …`,
                 `The sheikh of ${oase(c.o).name} is marrying off his daughter. As a respected merchant you are invited. A gift would be appropriate…`),
    optionen: [
      { text: () => T('🪙 Großzügiges Geschenk (250 Dinar)', '🪙 Generous gift (250 dinars)'), geht: () => S.gold >= 250,
        wirkung: c => { S.gold -= 250; buche('Diplomatie', -250); ansehenAendern(oase(c.o), 20); return T('Der Scheich ist gerührt. Dein Ansehen in der Oase steigt stark.', 'The sheikh is moved. Your reputation in the oasis rises sharply.'); } },
      { text: c => { const w = teuersteLadung(karawane(c.k)); return w ? T(`🎁 ${Math.min(5, Math.floor(karawane(c.k).ladung[w.id]))} ${w.name} schenken`, `🎁 Give ${Math.min(5, Math.floor(karawane(c.k).ladung[w.id]))} ${w.nameEn.toLowerCase()}`) : T('🎁 Waren schenken', '🎁 Give goods'); },
        geht: c => !!teuersteLadung(karawane(c.k)),
        wirkung: c => { const k = karawane(c.k), w = teuersteLadung(k), n = Math.min(5, Math.floor(k.ladung[w.id])); k.ladung[w.id] -= n;
          ansehenAendern(oase(c.o), 8 + Math.min(12, Math.round(n * w.basis / 60)));
          return T(`Dein Geschenk – ${n} ${w.name} – wird bewundert.`, `Your gift – ${n} ${w.nameEn.toLowerCase()} – is admired.`); } },
      { text: () => T('✋ Höflich absagen', '✋ Politely decline'), wirkung: c => { ansehenAendern(oase(c.o), -5); return T('Der Scheich nickt kühl.', 'The sheikh nods coolly.'); } },
    ] },

  { id: 'wegzoll', icon: '⚔',
    finden: () => { const k = irgendeine(unterwegs().filter(k => aktiveRaeuber().some(g => Math.hypot(k.x - g.x, k.y - g.y) < g.r + 140)));
      return k && { k: k.id, zoll: Math.max(50, Math.min(400, Math.round(S.gold * 0.1))) }; },
    titel: () => T('Wegzoll', 'Toll'),
    text: c => T(`Bewaffnete Reiter versperren ${karawane(c.k).name} den Weg. „Diese Straße gehört uns. ${c.zoll} Dinar – oder ihr kehrt um.“`,
                 `Armed riders block the way of ${karawane(c.k).name}. "This road belongs to us. ${c.zoll} dinars – or you turn back."`),
    optionen: [
      { text: c => T(`🪙 Zahlen (${c.zoll} Dinar)`, `🪙 Pay (${c.zoll} dinars)`), geht: c => S.gold >= c.zoll,
        wirkung: c => { S.gold -= c.zoll; buche('Strafen', -c.zoll); return T('Die Reiter lassen euch passieren.', 'The riders let you pass.'); } },
      { text: () => T('⚔️ Kämpfen', '⚔️ Fight'),
        wirkung: c => { const k = karawane(c.k);
          const chance = Math.min(0.9, 0.2 + 0.15 * k.wachen + 0.08 * talentStufe(k, 'krieger') + (hatAusruestung(k, 'waffen') ? 0.1 : 0));
          effektKampf(k.x, k.y, true);
          if (Math.random() < chance) { const beute = zufallInt(100, 300); S.gold += beute; buche('Beute', beute); epGeben(k, 40); zaehle('abgewehrt');
            return T(`Sieg! Die Reiter fliehen und lassen ${beute} Dinar zurück.`, `Victory! The riders flee and leave ${beute} dinars behind.`); }
          const w = teuersteLadung(k); let verlust = '';
          if (w) { const n = Math.ceil(k.ladung[w.id] * zufall(0.3, 0.5)); k.ladung[w.id] -= n; verlust = T(` Sie nehmen ${n} ${w.name} mit.`, ` They take ${n} ${w.nameEn.toLowerCase()}.`); }
          return T('Die Reiter sind zu stark.' + verlust, 'The riders are too strong.' + verlust); } },
      { text: () => T('↩️ Umweg nehmen (1 Tag)', '↩️ Take a detour (1 day)'),
        wirkung: c => { const k = karawane(c.k); k.gereist = Math.max(0, k.gereist - reiseTempo(k)); return T('Ihr umgeht die Reiter in weitem Bogen.', 'You give the riders a wide berth.'); } },
    ] },

  { id: 'wahrsager', icon: '🔮',
    finden: () => { const k = irgendeine(anOase()); return k && S.gold >= 60 && { k: k.id, o: k.ort }; },
    titel: () => T('Die Wahrsagerin', 'The fortune teller'),
    text: c => T(`Eine alte Frau in ${oase(c.o).name} greift nach deiner Hand: „Für 60 Dinar sage ich dir, wo dein Gold wartet.“`,
                 `An old woman in ${oase(c.o).name} reaches for your hand: "For 60 dinars I will tell you where your gold awaits."`),
    optionen: [
      { text: () => T('🪙 Zuhören (60 Dinar)', '🪙 Listen (60 dinars)'), geht: () => S.gold >= 60,
        wirkung: c => { S.gold -= 60; buche('Boten', -60);
          // Sie verrät die Oase, die gerade am meisten für eine Ware zahlt – mit den echten Preisen
          let bester = null;
          for (const o of S.oasen) if (o.aktiv && o.id !== c.o) for (const w of WAREN) {
            if (w.id === 'wasser' || w.veredelt || w.see) continue;
            const gewinn = verkaufPreis(o, w) - kaufPreis(oase(c.o), w);
            if (!bester || gewinn > bester.gewinn) bester = { o, w, gewinn };
          }
          if (!bester) return T('Sie murmelt Unverständliches.', 'She mumbles something incomprehensible.');
          merkePreise(bester.o);
          return T(`„${bester.w.name} von hier … nach ${bester.o.name}!“ Die Preise von ${bester.o.name} sind jetzt in deinem Gedächtnis.`,
                   `"${bester.w.nameEn} from here… to ${bester.o.name}!" The prices of ${bester.o.name} are now in your memory.`); } },
      { text: () => T('✋ Weitergehen', '✋ Walk on'), wirkung: () => T('Sie lacht leise hinter dir her.', 'She laughs softly behind you.') },
    ] },

  { id: 'lehrling', icon: '🧑',
    finden: () => { const k = irgendeine(anOase().filter(k => fuehrerStufe(k) < 5)); return k && { k: k.id }; },
    titel: () => T('Ein junger Führer', 'A young guide'),
    text: c => T(`Ein junger Mann möchte bei ${karawane(c.k).fuehrer.name} in die Lehre gehen. Er kennt alte Pfade, braucht aber eine Ausrüstung.`,
                 `A young man wants to apprentice with ${karawane(c.k).fuehrer.name}. He knows old trails but needs equipment.`),
    optionen: [
      { text: () => T('🎒 Aufnehmen (100 Dinar)', '🎒 Take him on (100 dinars)'), geht: () => S.gold >= 100,
        wirkung: c => { S.gold -= 100; buche('Unterhalt', -100); epGeben(karawane(c.k), 150); return T('Er erweist sich als Gewinn – dein Führer lernt viel von seinen Pfaden.', 'He proves an asset – your guide learns a lot from his trails.'); } },
      { text: () => T('✋ Ablehnen', '✋ Decline'), wirkung: () => T('Er zieht enttäuscht davon.', 'He leaves, disappointed.') },
    ] },

  { id: 'durstigeOase', icon: '💧',
    finden: () => { const k = irgendeine(anOase().filter(k => oase(k.ort).wasser < 35 && k.ladung.wasser >= 20)); return k && { k: k.id, o: k.ort }; },
    titel: () => T('Die Brunnen versiegen', 'The wells run dry'),
    text: c => T(`In ${oase(c.o).name} wird das Wasser knapp. Mütter mit Krügen sehen auf die Schläuche deiner Karawane.`,
                 `In ${oase(c.o).name} water is running short. Mothers with jugs look at your caravan's water skins.`),
    optionen: [
      { text: () => T('💧 20 Wasser verschenken', '💧 Give away 20 water'),
        wirkung: c => { karawane(c.k).ladung.wasser -= 20; ansehenAendern(oase(c.o), 12); return T('Die Menschen segnen dich. Man wird sich an dich erinnern.', 'The people bless you. You will be remembered.'); } },
      { text: () => T('🪙 Für 6 Dinar je Einheit verkaufen', '🪙 Sell for 6 dinars each'),
        wirkung: c => { karawane(c.k).ladung.wasser -= 20; S.gold += 120; buche('Handel', 120); ansehenAendern(oase(c.o), -4); return T('Du verdienst 120 Dinar – aber manche Blicke sind kühl.', 'You earn 120 dinars – but some looks are cool.'); } },
      { text: () => T('✋ Nichts geben', '✋ Give nothing'), wirkung: c => { ansehenAendern(oase(c.o), -3); return T('Du wendest dich ab.', 'You turn away.'); } },
    ] },
];

// --- Spätere Folgen ---
const FOLGEN = {
  wandererDank: () => {
    const o = irgendeine(S.oasen.filter(o => o.aktiv && !o.hafen));
    if (!o) return;
    const gold = zufallInt(300, 600);
    S.gold += gold; buche('Belohnungen', gold); ansehenAendern(o, 15);
    log(T(`🧕 Ein Bote aus ${o.name}: Der Wanderer, den du gerettet hast, ist der Sohn des Scheichs! Er schickt ${gold} Dinar, und man spricht dort gut von dir.`,
          `🧕 A messenger from ${o.name}: the wanderer you saved is the sheikh's son! He sends ${gold} dinars, and people there speak well of you.`), 'gut');
  },
  wandererGeruecht: d => {
    const o = oase(d.ziel); if (!o) return;
    ansehenAendern(o, -6);
    log(T(`🗣️ In ${o.name} erzählt man sich, deine Karawane habe einen Verdurstenden liegen lassen. Dein Ansehen leidet.`,
          `🗣️ In ${o.name} people say your caravan left a man to die of thirst. Your reputation suffers.`), 'schlecht');
  },
  diebesgut: d => {
    const k = karawane(d.k);
    if (k && k.ladung[d.w] >= 1) {
      const n = Math.min(d.menge, Math.floor(k.ladung[d.w])); k.ladung[d.w] -= n;
      log(T(`👑 Wachen des Sultans durchsuchen ${k.name}: Die billig gekauften Waren waren gestohlen! ${n} ${ware(d.w).name} werden beschlagnahmt.`,
            `👑 The Sultan's guards search ${k.name}: the cheaply bought goods were stolen! ${n} ${ware(d.w).nameEn.toLowerCase()} are confiscated.`), 'schlecht');
    } else {
      S.gold -= 150; buche('Strafen', -150);
      log(T('👑 Die Wachen des Sultans fordern 150 Dinar Strafe – du hattest gestohlene Ware gekauft.', '👑 The Sultan\'s guards demand a 150 dinar fine – you had bought stolen goods.'), 'schlecht');
    }
  },
};

function folgeNeu(tage, art, daten) {
  if (!S.folgen) S.folgen = [];
  S.folgen.push({ tag: S.tag + tage, art, daten });
}

// Täglich: fällige Folgen ausführen, vielleicht ein neues Ereignis auslösen
function entscheidungenTag() {
  if (!S.folgen) S.folgen = [];
  for (const f of S.folgen.filter(f => f.tag <= S.tag)) { try { FOLGEN[f.art] && FOLGEN[f.art](f.daten); } catch (e) {} }
  S.folgen = S.folgen.filter(f => f.tag > S.tag);
  if (S.entscheidung) { entscheidungZeigen(); return; }   // noch offen (z. B. Fenster war zu)
  if ( S.bankrott || S.tag < 4 || Math.random() > ENTSCHEIDUNG_CHANCE) return;
  if (!S.ereignisZuletzt) S.ereignisZuletzt = {};
  const moeglich = ENTSCHEIDUNGEN.filter(e => S.tag - (S.ereignisZuletzt[e.id] || -99) >= ENTSCHEIDUNG_PAUSE)
    .map(e => ({ e, c: e.finden() })).filter(x => x.c);
  const wahl = irgendeine(moeglich);
  if (!wahl) return;
  S.ereignisZuletzt[wahl.e.id] = S.tag;
  S.entscheidung = { id: wahl.e.id, c: wahl.c, ergebnis: null };
  entscheidungZeigen();
}

function entscheidungZeigen() {
  if (!S.entscheidung || (typeof startOffen !== 'undefined' && startOffen) || menueOffen) return;
  if (statistikOffen && fensterArt !== 'entscheidung') return;   // später, wenn das andere Fenster zu ist
  ton('glocke');
  fensterArt = 'entscheidung';
  statistikUmschalten(true);
}

function htmlEntscheidung() {
  const z = S.entscheidung, e = z && ENTSCHEIDUNGEN.find(x => x.id === z.id);
  if (!e) return `<div class="fenster"><button data-s="zu">✕</button></div>`;
  let h = `<div class="fenster entscheidung"><div class="ent-icon">${e.icon}</div><h2>${e.titel(z.c)}</h2>`;
  if (z.ergebnis) {
    h += `<p class="ent-text">${z.ergebnis}</p><button class="gross" data-a="entscheidungOk">${T('Weiter', 'Continue')}</button>`;
  } else {
    h += `<p class="ent-text">${e.text(z.c)}</p><div class="ent-optionen">`;
    e.optionen.forEach((o, i) => {
      const geht = !o.geht || o.geht(z.c);
      h += `<button data-a="entscheidungWahl" data-v="${i}" ${geht ? '' : 'disabled'}>${o.text(z.c)}</button>`;
    });
    h += '</div>';
  }
  return h + '</div>';
}

function entscheidungWaehlen(i) {
  const z = S.entscheidung, e = z && ENTSCHEIDUNGEN.find(x => x.id === z.id);
  if (!e || z.ergebnis) return;
  // Ist die betroffene Karawane inzwischen weg? Dann verpufft das Ereignis.
  if (z.c.k != null && !karawane(z.c.k)) { z.ergebnis = T('Die Gelegenheit ist vorbei.', 'The moment has passed.'); zeichneStatistik(); return; }
  try { z.ergebnis = e.optionen[+i].wirkung(z.c); } catch (x) { z.ergebnis = T('Die Gelegenheit ist vorbei.', 'The moment has passed.'); }
  log(`${e.icon} ${e.titel(z.c)}: ${z.ergebnis}`, 'info');
  zeichneStatistik();
  zeichnePanel();
}

function entscheidungFertig() {
  S.entscheidung = null;
  fensterArt = 'statistik';
  statistikUmschalten(false);
}
