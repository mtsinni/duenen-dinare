/* =====================================================================
   20. SÖLDNER – Räuberlager gegen Bezahlung bekämpfen lassen
   Ab dem Rang „Händler“ kann man auf der Karte ein Räuberlager antippen
   und eine Truppe anheuern. Bezahlt wird im Voraus; nach ein paar Tagen
   Marsch kommt es zum Kampf – mit Glück ist das Lager danach zerschlagen.
   ===================================================================== */

const SOELDNER_AB_RANG = 2;   // 0 Wasserträger, 1 Kleinhändler, 2 Händler, 3 Karawanenmeister …

// preis = Grundpreis für eine kleine Bande, chance = Erfolgschance gegen eine kleine Bande
const SOELDNER_TRUPPEN = [
  { id: 'miliz',    icon: '🛡️', name: 'Miliz',               nameEn: 'Militia',            preis: 600,  chance: 0.55, abRang: 2, extraTage: 0 },
  { id: 'soeldner', icon: '⚔️', name: 'Söldnertrupp',        nameEn: 'Mercenary band',     preis: 1300, chance: 0.75, abRang: 2, extraTage: 1 },
  { id: 'elite',    icon: '🐎', name: 'Reiterei des Sultans', nameEn: "The Sultan's cavalry", preis: 2600, chance: 0.92, abRang: 3, extraTage: 2 },
];
const SOELDNER_BANDEN = [
  ['Wüstenwölfe', 'Desert Wolves'], ['Schwarze Falken', 'Black Falcons'],
  ['Söhne des Sandes', 'Sons of the Sand'], ['Rote Schakale', 'Red Jackals'],
];

// Wie stark ist eine Bande? 1 = klein, 2 = mittel, 3 = groß (ältere Lager: nach ihrer Größe)
function lagerStaerke(g) { return g.staerke || (g.r < 90 ? 1 : g.r < 102 ? 2 : 3); }
function lagerStaerkeText(g) {
  return [T('kleine Bande', 'small band'), T('mittelgroße Bande', 'medium band'), T('große Bande', 'large band')][lagerStaerke(g) - 1];
}
function lagerNaechsteOase(g) {
  let beste = null, d = Infinity;
  for (const o of S.oasen) if (o.aktiv && entfernung(o, g) < d) { d = entfernung(o, g); beste = o; }
  return beste;
}
function lagerName(g) {
  const o = lagerNaechsteOase(g);
  return o ? T(`Räuberlager bei ${o.name}`, `Robber camp near ${o.name}`) : T('Räuberlager', 'Robber camp');
}
function lagerVertrag(g) { return (S.soeldner || []).find(v => v.lager === g.id); }

// Name einer Truppe – immer in der gerade gewählten Sprache
function truppenTitel(truppeId, oasenId, lagerId) {
  const t = SOELDNER_TRUPPEN.find(x => x.id === truppeId), o = oase(oasenId);
  const bande = SOELDNER_BANDEN[(lagerId || 0) % SOELDNER_BANDEN.length];
  if (t.id === 'miliz' && o) return T(`Miliz von ${o.name}`, `Militia of ${o.name}`);
  if (t.id === 'soeldner') return T(`Söldnertrupp „${bande[0]}“`, `Mercenaries "${bande[1]}"`);
  return T(t.name, t.nameEn);
}
function vertragTitel(v) { return truppenTitel(v.truppe, v.oase, v.lager); }

// Die Angebote für ein Lager: Preis, Chance und Marschdauer hängen von der Bande ab
function soeldnerAngebote(g) {
  const s = lagerStaerke(g), o = lagerNaechsteOase(g);
  const weg = o ? Math.ceil(entfernung(o, g) / 70) : 2;
  return SOELDNER_TRUPPEN.map(t => ({
    ...t,
    oase: o ? o.id : null,
    titel: truppenTitel(t.id, o ? o.id : null, g.id),
    preis: Math.round(t.preis * (0.7 + 0.3 * s) / 10) * 10,
    chance: Math.max(0.2, t.chance - 0.07 * (s - 1)),
    tage: weg + 1 + t.extraTage,
    frei: S.rang >= t.abRang,
  }));
}

// --- Das Fenster (es nutzt denselben Pergament-Rahmen wie die Statistik) ---
let gewLagerId = null;

function lagerFensterOeffnen(id) {
  gewLagerId = id;
  fensterArt = 'lager';
  statistikUmschalten(true);
}

function htmlLagerFenster() {
  const g = S.raeuber.find(x => x.id === gewLagerId);
  let h = `<div class="fenster"><button data-s="zu" style="float:right">✕</button>`;
  if (!g || S.tag < g.ruhtBis) {
    return h + `<h2>⚔️ ${T('Räuberlager', 'Robber camp')}</h2><p>${T('Hier ist es gerade ruhig.', 'It is quiet here for now.')}</p></div>`;
  }
  h += `<h2>⚔️ ${lagerName(g)}</h2>
        <p class="info">🏕️ ${lagerStaerkeText(g)} · ${T('Karawanen in der Nähe werden überfallen.', 'Caravans nearby get raided.')}</p>`;

  const vertrag = lagerVertrag(g);
  if (vertrag) {
    const rest = Math.max(0, vertrag.bisTag - S.tag);
    return h + `<p>${T('Unterwegs', 'On the way')}: ${vertrag.icon} <b>${vertragTitel(vertrag)}</b> –
                ${rest === 0 ? T('der Angriff steht unmittelbar bevor.', 'the attack is imminent.')
                             : T(`Angriff in etwa ${rest} Tag${rest > 1 ? 'en' : ''}.`, `attack in about ${rest} day${rest > 1 ? 's' : ''}.`)}
                (${T('Erfolgschance', 'chance of success')} ~${Math.round(vertrag.chance * 100)} %)</p></div>`;
  }

  if (S.rang < SOELDNER_AB_RANG) {
    return h + `<p>${T(`Noch nimmt dich niemand ernst genug, um für dich zu kämpfen. Ab dem Rang <b>„${RAENGE[SOELDNER_AB_RANG].name}“</b>
                   (${zahlText(RAENGE[SOELDNER_AB_RANG].ab)} 🪙 Vermögen) kannst du hier Truppen anheuern.`,
                   `Nobody takes you seriously enough to fight for you yet. From the rank <b>"${RAENGE[SOELDNER_AB_RANG].name}"</b>
                   (${zahlText(RAENGE[SOELDNER_AB_RANG].ab)} 🪙 fortune) you can hire troops here.`)}</p>
                <p class="hinweis">${T('Bis dahin kannst du ein Lager mit eigenen Wachen angreifen (Reiter 🐪 Karawanen, in einer Oase nahe dem Lager).',
                   'Until then you can attack a camp with your own guards (🐪 Caravans tab, in an oasis near the camp).')}</p></div>`;
  }

  h += `<h3>${T('Truppe anheuern', 'Hire a troop')}</h3>`;
  for (const a of soeldnerAngebote(g)) {
    h += `<div class="truppe ${a.frei ? '' : 'gesperrt'}">
            <div><b>${a.icon} ${a.titel}</b><br>
              <span class="hinweis">${T('Erfolg', 'Success')} ~${Math.round(a.chance * 100)} % · ${T(`${a.tage} Tage Marsch`, `${a.tage} days' march`)}</span></div>
            <div>${a.frei ? `<button data-a="soeldner" data-v="${a.id}" ${S.gold < a.preis ? 'disabled' : ''}>${zahlText(a.preis)} 🪙</button>`
                          : `<small>${T(`ab „${RAENGE[a.abRang].name}“`, `from "${RAENGE[a.abRang].name}"`)}</small>`}</div>
          </div>`;
  }
  h += `<p class="hinweis">${T('Bezahlt wird im Voraus. Siegt die Truppe, ist hier für 40–60 Tage Ruhe, die Oasen ringsum danken es dir mit Ansehen und du bekommst einen Anteil an der Beute. Scheitert sie, ist das Geld verloren.',
                               'Payment is up front. If the troop wins, there is peace here for 40–60 days, nearby oases reward you with reputation and you get a share of the loot. If it fails, the money is lost.')}</p></div>`;
  return h;
}

function soeldnerBeauftragen(truppeId) {
  const g = S.raeuber.find(x => x.id === gewLagerId);
  if (!g || S.tag < g.ruhtBis || lagerVertrag(g) || S.rang < SOELDNER_AB_RANG) return;
  const a = soeldnerAngebote(g).find(x => x.id === truppeId);
  if (!a || !a.frei || S.gold < a.preis) return;
  S.gold -= a.preis;
  buche('Söldner', -a.preis);
  S.soeldner.push({ id: S.naechsteId++, lager: g.id, truppe: a.id, oase: a.oase, icon: a.icon,
                    preis: a.preis, chance: a.chance, bisTag: S.tag + a.tage });
  ton('muenze');
  log(T(`${a.icon} Angeheuert: ${a.titel} für ${a.preis} Dinar. In etwa ${a.tage} Tagen kommt es zum Angriff auf das ${lagerName(g)}.`,
        `${a.icon} Hired: ${a.titel} for ${a.preis} dinars. In about ${a.tage} days they will attack the ${lagerName(g).toLowerCase()}.`));
  zeichneStatistik();
  zeichnePanel();
}

// Läuft jeden Tag: Ist eine Truppe am Ziel, kommt es zum Kampf
function soeldnerTag() {
  if (!S.soeldner) return;
  for (const v of [...S.soeldner]) {
    if (S.tag < v.bisTag) continue;
    S.soeldner.splice(S.soeldner.indexOf(v), 1);
    const g = S.raeuber.find(x => x.id === v.lager && S.tag >= x.ruhtBis);
    if (!g) {
      // Die Bande ist weitergezogen oder schon zerschlagen – die Truppe kehrt um
      const zurueck = Math.round(v.preis / 2);
      S.gold += zurueck; buche('Söldner', zurueck);
      log(T(`${v.icon} Die Räuber sind fort, bevor die Truppe (${vertragTitel(v)}) eintrifft. Du bekommst die Hälfte zurück: ${zurueck} Dinar.`,
            `${v.icon} The robbers are gone before the troop (${vertragTitel(v)}) arrives. You get half back: ${zurueck} dinars.`));
      continue;
    }
    if (Math.random() < v.chance) {
      g.ruhtBis = S.tag + zufallInt(40, 60);
      S.erfolge.lagerZerstoert = (S.erfolge.lagerZerstoert || 0) + 1;
      const anteil = zufallInt(150, 400) * lagerStaerke(g);
      S.gold += anteil; buche('Beute', anteil);
      for (const z of S.oasen) if (z.aktiv && entfernung(z, g) < 350) ansehenAendern(z, 10);
      log(T(`${v.icon} Sieg! Das ${lagerName(g)} ist zerschlagen (${vertragTitel(v)}). Dein Anteil an der Beute: ${anteil} Dinar – und die Oasen ringsum sind dir dankbar.`,
            `${v.icon} Victory! The ${lagerName(g).toLowerCase()} has been smashed (${vertragTitel(v)}). Your share of the loot: ${anteil} dinars – and the nearby oases are grateful.`), 'gut');
    } else {
      log(T(`${v.icon} Der Angriff auf das ${lagerName(g)} scheitert (${vertragTitel(v)}). Die Räuber feiern – dein Geld ist verloren.`,
            `${v.icon} The attack on the ${lagerName(g).toLowerCase()} fails (${vertragTitel(v)}). The robbers celebrate – your money is lost.`), 'schlecht');
    }
  }
}

// Für den Reiter „Aufträge“: laufende Söldner-Aufträge und ein Hinweis, wie man sie bekommt
function htmlSoeldnerAuftraege() {
  let h = '';
  for (const v of S.soeldner || []) {
    const g = S.raeuber.find(x => x.id === v.lager);
    const rest = Math.max(0, v.bisTag - S.tag);
    h += `<div class="info">${v.icon} <b>${vertragTitel(v)}</b> → ${g ? lagerName(g) : T('Räuberlager', 'robber camp')} ·
          ${T(`Angriff in ~${rest} Tag${rest === 1 ? '' : 'en'}`, `attack in ~${rest} day${rest === 1 ? '' : 's'}`)} · ~${Math.round(v.chance * 100)} %</div>`;
  }
  h += `<div class="hinweis">⚔️ ${S.rang >= SOELDNER_AB_RANG
        ? T('Tippe auf der Karte auf ein Räuberlager, um Söldner gegen die Bande anzuheuern.', 'Tap a robber camp on the map to hire mercenaries against the band.')
        : T(`Ab dem Rang „${RAENGE[SOELDNER_AB_RANG].name}“ kannst du Söldner gegen Räuberlager anheuern – tippe das Lager auf der Karte an.`,
            `From the rank "${RAENGE[SOELDNER_AB_RANG].name}" you can hire mercenaries against robber camps – tap the camp on the map.`)}</div>`;
  return h;
}

// Auf der Karte: unter einem Lager mit angeheuerter Truppe ein kleiner Hinweis
function zeichneSoeldnerMarke(g) {
  const v = lagerVertrag(g);
  if (!v) return;
  const rest = Math.max(0, v.bisTag - S.tag);
  const text = rest ? T(`in ${rest} T.`, `in ${rest} d`) : '!';
  beschriftung(text, g.x + 8, g.y - 22, 12, '#7a2a18');
  const breite = ctx.measureText(text).width;
  if (!symbolMalen(ctx, v.icon, g.x + 8 - breite / 2 - 9, g.y - 22, 15, '#7a2a18')) beschriftung(v.icon, g.x + 8 - breite / 2 - 9, g.y - 22, 12, '#7a2a18');
}
