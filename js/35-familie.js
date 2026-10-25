/* =====================================================================
   35. FAMILIE UND NACHFOLGER
   Dein Händler wird älter, heiratet vielleicht und bekommt Kinder.
   Irgendwann übernimmt ein Kind das Geschäft – mit seinem eigenen Talent.
   Die Talente aller Generationen addieren sich zu einem Familienbonus.
   ===================================================================== */

const ALTER_TAGE = 20;           // so viele Spieltage dauert ein Lebensjahr
const FAMILIE = { startAlter: 25, heiratAb: 27, kinderBis: 46, ruhestandAb: 55, spaetestens: 68, erwachsen: 16, maxKinder: 3 };

const VORNAMEN = {
  m: ['Yusuf', 'Karim', 'Tariq', 'Idris', 'Malik', 'Samir', 'Nasir', 'Hamza', 'Rashid', 'Omar', 'Zayd', 'Bilal'],
  w: ['Amina', 'Layla', 'Nour', 'Salma', 'Yasmin', 'Zahra', 'Mariam', 'Hana', 'Rania', 'Samira', 'Leila', 'Farah'],
};
const FAMILIENNAMEN = ['al-Tadschir', 'al-Harun', 'al-Sahrawi', 'al-Battuti', 'al-Qafila', 'al-Rashidi', 'al-Wahid'];

const ERBTALENTE = {
  kaufmann:  { icon: '⚖', name: 'Kaufmann',  nameEn: 'Merchant',  text: '+2 % bessere Preise',            textEn: '+2% better prices' },
  diplomat:  { icon: '🤝', name: 'Diplomat',  nameEn: 'Diplomat',  text: '+25 % mehr Ansehen',             textEn: '+25% more reputation' },
  wegfinder: { icon: '🧭', name: 'Wegfinder', nameEn: 'Pathfinder', text: '+4 % Tempo für alle Karawanen',  textEn: '+4% speed for all caravans' },
  sparsam:   { icon: '💰', name: 'Sparsam',   nameEn: 'Thrifty',   text: '−10 % Unterhalt',               textEn: '−10% upkeep' },
};

function zufallsName(geschlecht) { const l = VORNAMEN[geschlecht]; return l[zufallInt(0, l.length - 1)]; }
function zufallsTalent() { const l = Object.keys(ERBTALENTE); return l[zufallInt(0, l.length - 1)]; }

function familieAnlegen() {
  if (S.familie) return;
  S.familie = {
    name: zufallsName('m'), nachname: FAMILIENNAMEN[zufallInt(0, FAMILIENNAMEN.length - 1)],
    startAlter: FAMILIE.startAlter, startTag: S.tag, partner: null, kinder: [], generation: 1,
    boni: {}, ahnen: [], naechsteFrage: 0,
  };
}

function haendlerAlter() { const f = S.familie; return f.startAlter + (S.tag - f.startTag) / ALTER_TAGE; }
function kindAlter(k) { return (S.tag - k.geboren) / ALTER_TAGE; }
function hatErben() { return S.familie.kinder.some(k => kindAlter(k) >= FAMILIE.erwachsen); }
function familienBonus(id) { return (S.familie && S.familie.boni && S.familie.boni[id]) || 0; }
function haendlerName() { return S.familie ? `${S.familie.name} ${S.familie.nachname}` : ''; }

// Täglich: Hochzeit, Kinder, Ruhestand
function familieTag() {
  familieAnlegen();
  const f = S.familie, alter = haendlerAlter();
  // Kinder: nach der Hochzeit ab und zu ein Kind
  if (f.partner && f.kinder.length < FAMILIE.maxKinder && alter < FAMILIE.kinderBis && Math.random() < 1 / (ALTER_TAGE * 2.2)) {
    const g = Math.random() < 0.5 ? 'm' : 'w';
    const kind = { name: zufallsName(g), geschlecht: g, geboren: S.tag, talent: zufallsTalent() };
    f.kinder.push(kind);
    log(T(`👶 Freudige Nachricht: ${haendlerName()} und ${f.partner.name} bekommen ein Kind – ${kind.geschlecht === 'm' ? 'einen Sohn' : 'eine Tochter'} namens ${kind.name}!`,
          `👶 Joyful news: ${haendlerName()} and ${f.partner.name} have a child – a ${kind.geschlecht === 'm' ? 'son' : 'daughter'} named ${kind.name}!`), 'gut');
    melden('👶', T(`${kind.name} ist geboren!`, `${kind.name} has been born!`), 'gut');
  }
  if (S.entscheidung || S.tag < f.naechsteFrage) return;
  // Hochzeit
  if (!f.partner && alter >= FAMILIE.heiratAb && Math.random() < 0.06) {
    const scheich = [...S.oasen].filter(o => o.aktiv).sort((a, b) => ansehen(b) - ansehen(a))[0];
    const andere = S.oasen.filter(o => o.aktiv && o !== scheich);
    const kaufleute = andere[zufallInt(0, andere.length - 1)] || scheich;
    S.entscheidung = { id: 'heirat', c: { scheich: scheich.id, kaufleute: kaufleute.id, n1: zufallsName('w'), n2: zufallsName('w') }, ergebnis: null };
    entscheidungZeigen();
    return;
  }
  // Ruhestand
  const erben = f.kinder.filter(k => kindAlter(k) >= FAMILIE.erwachsen);
  if (alter >= FAMILIE.spaetestens || (alter >= FAMILIE.ruhestandAb && erben.length && Math.random() < 0.05)) {
    S.entscheidung = { id: 'ruhestand', c: { zwang: alter >= FAMILIE.spaetestens }, ergebnis: null };
    entscheidungZeigen();
  }
}

// Das Geschäft an die nächste Generation übergeben
function nachfolgerEinsetzen(erbe) {
  const f = S.familie;
  f.ahnen.push({ name: haendlerName(), generation: f.generation, bisTag: S.tag, alter: Math.floor(haendlerAlter()) });
  const talent = erbe.talent || zufallsTalent();
  f.boni[talent] = (f.boni[talent] || 0) + 1;
  f.name = erbe.name;
  if (erbe.nachname) f.nachname = erbe.nachname;
  f.startAlter = erbe.alter != null ? erbe.alter : Math.max(FAMILIE.erwachsen, Math.floor(kindAlter(erbe)));
  f.startTag = S.tag;
  f.partner = null;
  f.kinder = [];
  f.generation++;
  f.naechsteFrage = S.tag + ALTER_TAGE;
  zaehle('generationen');
  return talent;
}

// Diese Entscheidungen werden nicht zufällig gezogen (finden → null), sondern vom Familienleben ausgelöst
ENTSCHEIDUNGEN.push(
  { id: 'heirat', icon: '💍', finden: () => null,
    titel: () => T('Ein Heiratsantrag', 'A marriage proposal'),
    text: c => T(`${haendlerName()} ist im besten Alter. Zwei Familien bieten eine Verbindung an: die Familie des Scheichs von ${oase(c.scheich).name} mit ${c.n1} – oder eine wohlhabende Kaufmannsfamilie aus ${oase(c.kaufleute).name} mit ${c.n2}.`,
                 `${haendlerName()} is in the prime of life. Two families offer a match: the family of the sheikh of ${oase(c.scheich).name} with ${c.n1} – or a wealthy merchant family from ${oase(c.kaufleute).name} with ${c.n2}.`),
    optionen: [
      { text: c => T(`💍 ${c.n1} heiraten (Familie des Scheichs)`, `💍 Marry ${c.n1} (the sheikh's family)`),
        wirkung: c => { const o = oase(c.scheich); S.familie.partner = { name: c.n1, herkunft: o.name }; ansehenAendern(o, 20); S.gold += 300; buche('Belohnungen', 300);
          return T(`Ein rauschendes Fest in ${o.name}! Die Mitgift beträgt 300 Dinar, und der Scheich ist nun dein Verwandter.`, `A splendid feast in ${o.name}! The dowry is 300 dinars, and the sheikh is now your kin.`); } },
      { text: c => T(`💍 ${c.n2} heiraten (Kaufmannsfamilie)`, `💍 Marry ${c.n2} (merchant family)`),
        wirkung: c => { const o = oase(c.kaufleute); S.familie.partner = { name: c.n2, herkunft: o.name }; S.gold += 800; buche('Belohnungen', 800);
          return T(`Die Kaufleute aus ${o.name} geben eine reiche Mitgift: 800 Dinar!`, `The merchants of ${o.name} give a rich dowry: 800 dinars!`); } },
      { text: () => T('⏳ Noch nicht – das Geschäft geht vor', '⏳ Not yet – business comes first'),
        wirkung: () => { S.familie.naechsteFrage = S.tag + ALTER_TAGE * 2; return T('Vielleicht ein andermal.', 'Perhaps another time.'); } },
    ] },
  { id: 'ruhestand', icon: '👴', finden: () => null,
    titel: c => c.zwang ? T('Zeit, Abschied zu nehmen', 'Time to say farewell') : T('Zeit für den Ruhestand?', 'Time to retire?'),
    text: c => {
      const f = S.familie, erben = f.kinder.filter(k => kindAlter(k) >= FAMILIE.erwachsen);
      const basis = c.zwang
        ? T(`${haendlerName()} ist ${Math.floor(haendlerAlter())} Jahre alt und kann die Karawanen nicht mehr führen. Wer übernimmt das Haus?`,
            `${haendlerName()} is ${Math.floor(haendlerAlter())} years old and can no longer lead the caravans. Who takes over the house?`)
        : T(`${haendlerName()} ist ${Math.floor(haendlerAlter())} Jahre alt. Soll ein Kind das Geschäft übernehmen? Sein Talent stärkt die ganze Familie – für immer.`,
            `${haendlerName()} is ${Math.floor(haendlerAlter())} years old. Should a child take over the business? Their talent strengthens the whole family – for good.`);
      return basis + (erben.length ? '' : T(' Es gibt kein erwachsenes Kind – dein bester Karawanenführer wird dein Nachfolger.', ' There is no grown-up child – your best caravan leader becomes your successor.'));
    },
    optionen: [0, 1, 2].map(i => ({
      text: () => { const e = S.familie.kinder.filter(k => kindAlter(k) >= FAMILIE.erwachsen)[i]; if (!e) return '–';
        const t = ERBTALENTE[e.talent]; return `${e.geschlecht === 'm' ? '👦' : '👧'} ${e.name} (${Math.floor(kindAlter(e))}) – ${t.icon} ${T(t.name, t.nameEn)}: ${T(t.text, t.textEn)}`; },
      geht: () => !!S.familie.kinder.filter(k => kindAlter(k) >= FAMILIE.erwachsen)[i], verbergen: true,
      wirkung: () => { const e = S.familie.kinder.filter(k => kindAlter(k) >= FAMILIE.erwachsen)[i]; const alt = haendlerName(); const t = nachfolgerEinsetzen(e);
        return T(`${alt} übergibt das Haus an ${e.name}. Generation ${S.familie.generation} beginnt! Familienbonus: ${ERBTALENTE[t].text}.`,
                 `${alt} hands the house to ${e.name}. Generation ${S.familie.generation} begins! Family bonus: ${ERBTALENTE[t].textEn}.`); },
    })).concat([
      { text: () => hatErben() ? T('⏳ Noch nicht', '⏳ Not yet') : T('🧭 Den besten Führer einsetzen', '🧭 Appoint the best guide'),
        geht: c => !hatErben() || !c.zwang, verbergen: true,
        wirkung: () => {
          if (hatErben()) { S.familie.naechsteFrage = S.tag + ALTER_TAGE * 2; return T('Noch hält der alte Händler die Zügel in der Hand.', 'The old merchant still holds the reins.'); }
          const besten = [...S.karawanen].sort((a, b) => b.fuehrer.ep - a.fuehrer.ep)[0];
          const name = besten ? besten.fuehrer.name : zufallsName('m');
          const alt = haendlerName();
          nachfolgerEinsetzen({ name, nachname: S.familie.nachname, alter: 32, talent: 'wegfinder' });
          return T(`${alt} setzt den treuen Führer ${name} als Nachfolger ein. Generation ${S.familie.generation} beginnt!`, `${alt} appoints the loyal guide ${name} as successor. Generation ${S.familie.generation} begins!`);
        } },
    ]) },
);

function familieUmbenennen() {
  if (typeof prompt === 'undefined') return;
  const neu = prompt(T('Vorname deines Händlers:', "Your merchant's first name:"), S.familie.name);
  if (neu == null) return;
  const sauber = neu.replace(/[<>&"'`]/g, '').trim().slice(0, 20);
  if (sauber) { S.familie.name = sauber; zeichnePanel(); }
}

// Übersicht im Reiter „Häuser“: dein eigenes Haus
function htmlFamilie() {
  familieAnlegen();
  const f = S.familie, alter = Math.floor(haendlerAlter());
  let h = `<div class="familie">
    <div class="familie-kopf"><div><b>${haendlerName()}</b> · ${alter} ${T('Jahre', 'years')}
      <span class="hinweis">· ${T(`Generation ${f.generation}`, `generation ${f.generation}`)}</span></div>
      <button data-a="familieName" title="${T('Namen ändern', 'Change name')}">✏️</button></div>`;
  h += f.partner ? `<div class="info">💍 ${T(`verheiratet mit ${f.partner.name} aus ${f.partner.herkunft}`, `married to ${f.partner.name} of ${f.partner.herkunft}`)}</div>`
                 : `<div class="hinweis">${alter < FAMILIE.heiratAb ? T('Noch jung und ungebunden.', 'Still young and unattached.') : T('Noch unverheiratet – vielleicht kommt bald ein Antrag.', 'Not yet married – perhaps a proposal will come soon.')}</div>`;
  if (f.kinder.length) {
    h += `<div class="familie-kinder">${f.kinder.map(k => { const t = ERBTALENTE[k.talent], a = Math.floor(kindAlter(k));
      return `<span class="extra-marke" title="${T(t.text, t.textEn)}">${k.geschlecht === 'm' ? '👦' : '👧'} ${k.name}, ${a} · ${t.icon} ${T(t.name, t.nameEn)}</span>`; }).join(' ')}</div>`;
  }
  const boni = Object.keys(f.boni).filter(id => f.boni[id]);
  if (boni.length) h += `<div class="info">🏛 ${T('Familienbonus', 'Family bonus')}: ${boni.map(id => `${ERBTALENTE[id].icon} ${T(ERBTALENTE[id].text, ERBTALENTE[id].textEn)}${f.boni[id] > 1 ? ' ×' + f.boni[id] : ''}`).join(' · ')}</div>`;
  if (f.ahnen.length) h += `<div class="hinweis">${T('Vorfahren', 'Ancestors')}: ${f.ahnen.map(a => `${a.name} (${T('bis Tag', 'until day')} ${a.bisTag})`).join(' · ')}</div>`;
  if (alter >= FAMILIE.ruhestandAb - 5) h += `<div class="hinweis">${T(`Ab ${FAMILIE.ruhestandAb} Jahren kann ein erwachsenes Kind (ab ${FAMILIE.erwachsen}) das Geschäft übernehmen.`, `From age ${FAMILIE.ruhestandAb} a grown-up child (${FAMILIE.erwachsen}+) can take over the business.`)}</div>`;
  return h + '</div>';
}
