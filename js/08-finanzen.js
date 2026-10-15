/* =====================================================================
   8. GELDVERLEIHER, PFÄNDUNG UND BANKROTT
   ===================================================================== */

// Was eine Karawane bei einer Pfändung einbringt (Gläubiger zahlen schlecht!)
function karawanenWert(k) {
  let wert = 0;
  for (const w of WAREN) wert += k.ladung[w.id] * w.basis * 0.5;
  for (const t in k.tiere) wert += k.tiere[t] * TIERE[t].preis * 0.4;
  return wert;
}

// Läuft jeden Tag nach allen Ausgaben
function finanzen() {
  // 1. Zinsen wachsen auf die Schulden ("Zinseszins")
  if (S.schulden > 0) {
    buche('Zinsen', -S.schulden * zinsSatz());
    S.schulden *= 1 + zinsSatz();
  }

  // 2. Leere Kasse? Der Verleiher deckt das Minus – gegen Gebühr
  if (S.gold < 0) {
    const fehlbetrag = -S.gold;
    S.schulden += fehlbetrag * (1 + UEBERZIEHUNG_GEBUEHR);
    S.gold = 0;
    if (!S.ueberzogen) {
      log(T('💸 Deine Kasse ist leer! Der Geldverleiher deckt deine Ausgaben – mit 10 % Aufschlag.',
            '💸 Your purse is empty! The moneylender covers your costs – with a 10% surcharge.'), 'schlecht');
      S.ueberzogen = true;
    }
  } else if (S.gold > 200) {
    S.ueberzogen = false;
  }

  // 3. Warnung und Pfändung
  if (S.schulden >= SCHULDEN_WARNUNG && !S.schuldenWarnung) {
    log(T(`⚠️ Deine Schulden betragen ${Math.round(S.schulden)} Dinar. Ab ${PFAENDUNG_AB} wird gepfändet!`,
          `⚠️ Your debts amount to ${Math.round(S.schulden)} dinars. Above ${PFAENDUNG_AB}, your goods will be seized!`), 'schlecht');
    S.schuldenWarnung = true;
  } else if (S.schulden < SCHULDEN_WARNUNG * 0.9) {
    S.schuldenWarnung = false;
  }
  if (S.schulden > PFAENDUNG_AB) pfaendung();
}

function pfaendung() {
  log(T('⚖️ Die Geldverleiher verlieren die Geduld und pfänden deinen Besitz!', '⚖️ The moneylenders lose patience and seize your property!'), 'schlecht');

  // Die wertvollsten Karawanen werden zuerst genommen
  const liste = [...S.karawanen].sort((a, b) => karawanenWert(b) - karawanenWert(a));
  for (const k of liste) {
    if (S.schulden <= PFAENDUNG_ZIEL) break;
    const wert = karawanenWert(k);
    S.schulden -= wert;
    S.karawanen = S.karawanen.filter(x => x !== k);
    if (S.gewKarawane === k.id) S.gewKarawane = null;
    log(T(`⚖️ ${k.name} wurde gepfändet – ${Math.round(wert)} Dinar werden angerechnet.`, `⚖️ ${k.name} was seized – ${Math.round(wert)} dinars are credited.`), 'schlecht');
  }
  if (S.schulden < 0) { S.gold += -S.schulden; S.schulden = 0; }   // Überschuss zurück

  // Ohne Karawane und ohne Geld für ein neues Tier ist das Spiel vorbei
  const billigstesTier = Math.min(...Object.values(TIERE).map(t => t.preis));
  if (!S.karawanen.length && S.gold < billigstesTier) {
    S.bankrott = true;
    S.pause = true;
    log(T(`💀 BANKROTT an Tag ${S.tag}! Deine Handelsgeschäfte sind am Ende.`, `💀 BANKRUPT on day ${S.tag}! Your trading days are over.`), 'schlecht');
  }
}

function verleiherHier() {
  const o = oase(S.gewOase);
  return o && o.aktiv && o.bev >= VERLEIHER_AB_BEV ? o : null;
}

function leihen(betrag) {
  if (!verleiherHier() || S.schulden + betrag > KREDIT_RAHMEN) return;
  S.gold += betrag;
  S.schulden += betrag;
  log(T(`💰 Du leihst dir ${betrag} Dinar beim Geldverleiher von ${verleiherHier().name}.`, `💰 You borrow ${betrag} dinars from the moneylender of ${verleiherHier().name}.`));
  zeichnePanel();
}

function tilgen(betrag) {
  if (!verleiherHier() || S.schulden <= 0) return;
  betrag = Math.min(betrag, Math.ceil(S.schulden), Math.floor(S.gold));
  if (betrag <= 0) return;
  S.gold -= betrag;
  S.schulden = Math.max(0, S.schulden - betrag);
  if (S.schulden < 1) S.schulden = 0;   // kleine Kommareste nicht stehen lassen
  log(S.schulden === 0 ? T('🎉 Du bist schuldenfrei!', '🎉 You are free of debt!') : T(`Du zahlst ${betrag} Dinar zurück.`, `You repay ${betrag} dinars.`),
      S.schulden === 0 ? 'gut' : 'info');
  zeichnePanel();
}
