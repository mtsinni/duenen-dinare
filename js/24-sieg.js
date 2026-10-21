/* =====================================================================
   24. SPIELZIEL – Siegesbedingungen, beim neuen Spiel im Menü wählbar
   ===================================================================== */

const SIEGE = {
  frei: {
    icon: '🗺', name: 'Freies Spiel', nameEn: 'Free play',
    text: 'Kein festes Ziel – handle, solange du willst.', textEn: 'No fixed goal – trade as long as you like.',
  },
  reichtum: {
    icon: '💰', name: 'Reichtum', nameEn: 'Wealth',
    text: 'Erreiche ein Vermögen von 100.000 Dinar.', textEn: 'Reach a fortune of 100,000 dinars.',
    teile: () => [{ text: T('Vermögen', 'Fortune'), ist: vermoegen(), soll: 100000 }],
  },
  imperium: {
    icon: '🏛', name: 'Handelsimperium', nameEn: 'Trade empire',
    text: 'Besitze Lagerhäuser in 5 Oasen, 3 Betriebe und 6 Karawanen.', textEn: 'Own warehouses in 5 oases, 3 businesses and 6 caravans.',
    teile: () => [
      { text: T('Lagerhäuser', 'Warehouses'), ist: Object.keys(S.gebaeude).length, soll: 5 },
      { text: T('Betriebe', 'Businesses'), ist: Object.values(S.gebaeude).filter(g => g.betrieb).length, soll: 3 },
      { text: T('Karawanen', 'Caravans'), ist: S.karawanen.length, soll: 6 },
    ],
  },
  freund: {
    icon: '🤝', name: 'Freund der Wüste', nameEn: 'Friend of the desert',
    text: 'Werde in 6 Oasen „Freund“ (Ansehen 50).', textEn: 'Become a "Friend" (reputation 50) in 6 oases.',
    teile: () => [{ text: T('Oasen mit Ansehen 50', 'Oases with reputation 50'), ist: Object.values(S.ansehen).filter(a => a >= 50).length, soll: 6 }],
  },
  wettlauf: {
    icon: '⏳', name: 'Wettlauf', nameEn: 'Race',
    text: 'Sei nach 3 Spieljahren das reichste Handelshaus.', textEn: 'Be the richest trading house after 3 game years.',
    frist: 3 * JAHR_TAGE,
    teile: () => [{ text: T('Tage', 'Days'), ist: Math.min(S.tag, 3 * JAHR_TAGE), soll: 3 * JAHR_TAGE }],
  },
};

function siegArt() { return SIEGE[(S.sieg && S.sieg.art) || 'frei'] || SIEGE.frei; }

// Wie weit ist das Ziel erreicht? (0 … 1)
function siegFortschritt() {
  const z = siegArt();
  if (!z.teile) return 0;
  const teile = z.teile();
  return teile.reduce((n, t) => n + Math.min(1, t.ist / t.soll), 0) / teile.length;
}

// Täglich: Ziel erreicht – oder (beim Wettlauf) die Zeit um?
function siegPruefen() {
  if (!S.sieg || S.sieg.art === 'frei' || S.sieg.ende || S.bankrott) return;
  const z = siegArt();
  if (S.sieg.art === 'wettlauf') {
    if (S.tag < z.frist) return;
    const platz = 1 + S.rivalen.filter(r => rivalenVermoegen(r) >= vermoegen()).length;
    siegBeenden(platz === 1, platz);
    return;
  }
  if (siegFortschritt() >= 1) siegBeenden(true, 1);
}

function siegBeenden(gewonnen, platz) {
  S.sieg.ende = S.tag;
  S.sieg.gewonnen = gewonnen;
  S.sieg.platz = platz;
  log(gewonnen ? T(`👑 Du hast dein Ziel „${siegArt().name}“ erreicht!`, `👑 You have achieved your goal "${siegArt().nameEn}"!`)
               : T(`⏳ Die Zeit ist um – du bist auf Platz ${platz}.`, `⏳ Time is up – you finished in place ${platz}.`), gewonnen ? 'gut' : 'schlecht');
  ton(gewonnen ? 'sieg' : 'niederlage');
  if (gewonnen && typeof effektFunkeln === 'function') effektFunkeln(true);
  errungenschaftenPruefen();
  speichern();
  fensterArt = 'sieg';
  statistikUmschalten(true);
}

// Das Fenster am Ende
function htmlSiegFenster() {
  const z = siegArt(), g = S.sieg.gewonnen;
  const ich = vermoegen();
  const rangliste = [{ name: T('Du', 'You'), wert: ich, du: true }, ...S.rivalen.map(r => ({ name: r.name, wert: rivalenVermoegen(r) }))]
    .sort((a, b) => b.wert - a.wert);
  return `<div class="fenster sieg-fenster ${g ? 'gewonnen' : ''}">
    <div class="sieg-krone">${g ? '👑' : '⏳'}</div>
    <h2>${g ? T('Sieg!', 'Victory!') : T('Die Zeit ist um', 'Time is up')}</h2>
    <p class="untertitel">${z.icon} ${T(z.name, z.nameEn)} · ${(SCHWIERIGKEITEN[S.schwierigkeit] || SCHWIERIGKEITEN.normal).icon} ${(SCHWIERIGKEITEN[S.schwierigkeit] || SCHWIERIGKEITEN.normal).name}</p>
    <p>${g ? T(`Nach ${S.sieg.ende} Tagen hast du es geschafft. Die Händler der Wüste werden noch lange von dir erzählen!`,
               `After ${S.sieg.ende} days you made it. The merchants of the desert will tell of you for a long time!`)
           : T(`Du hast Platz ${S.sieg.platz} erreicht. Beim nächsten Mal klappt es!`, `You finished in place ${S.sieg.platz}. Better luck next time!`)}</p>
    <table>
      <tr><td>🏅 ${T('Rang', 'Rank')}</td><td><b>${RAENGE[S.rang].name}</b></td></tr>
      <tr><td>🪙 ${T('Vermögen', 'Fortune')}</td><td><b>${zahl(ich)}</b></td></tr>
      <tr><td>🐪 ${T('Karawanen', 'Caravans')}</td><td>${S.karawanen.length}</td></tr>
      <tr><td>🏛 ${T('Lagerhäuser', 'Warehouses')}</td><td>${Object.keys(S.gebaeude).length}</td></tr>
      <tr><td>📈 ${T('Handelsumsatz', 'Trade income')}</td><td>${zahl(handelsEinnahmen())}</td></tr>
    </table>
    <h3>${T('Rangliste', 'Ranking')}</h3>
    <table>${rangliste.map((r, i) => `<tr><td>${i + 1}. ${r.du ? `<b>${r.name}</b>` : r.name}</td><td>${zahl(r.wert)} 🪙</td></tr>`).join('')}</table>
    <div class="sieg-knoepfe">
      <button class="gross" data-a="siegWeiter">▶ ${T('Weiterspielen (freies Spiel)', 'Keep playing (free play)')}</button>
      <button data-a="siegMenue">${T('Neues Spiel', 'New game')}</button>
    </div>
  </div>`;
}

// Box im Ziele-Reiter: das gewählte Spielziel mit Fortschritt
function htmlSiegZiel() {
  if (!S.sieg || S.sieg.art === 'frei') return '';
  const z = siegArt();
  if (S.sieg.ende) {
    return `<div class="sieg-box">${z.icon} <b>${T(z.name, z.nameEn)}</b> – ${S.sieg.gewonnen ? T(`erreicht an Tag ${S.sieg.ende} 👑`, `achieved on day ${S.sieg.ende} 👑`) : T(`beendet auf Platz ${S.sieg.platz}`, `ended in place ${S.sieg.platz}`)}</div>`;
  }
  const teile = z.teile();
  return `<div class="sieg-box">
      <div>${z.icon} <b>${T('Spielziel', 'Game goal')}: ${T(z.name, z.nameEn)}</b></div>
      <div class="hinweis">${T(z.text, z.textEn)}</div>
      ${teile.map(t => `<div class="sieg-teil"><span>${t.text}</span><span>${zahlText(Math.min(t.ist, t.soll))} / ${zahlText(t.soll)}</span></div>
        <div class="bar"><div style="width:${Math.min(100, t.ist / t.soll * 100)}%;background:var(--messing)"></div></div>`).join('')}
    </div>`;
}
