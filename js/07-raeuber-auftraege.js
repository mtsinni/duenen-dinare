/* =====================================================================
   7. RÄUBER, KARAWANENFÜHRER UND AUFTRÄGE DER SCHEICHS
   ===================================================================== */

function ueberfall(k) {
  if (ladungsWert(k) < 50) return;   // Nichts zu holen – die Räuber lassen sie ziehen

  // Abwehrchance: jede Wache 18 %, jede Führerstufe über 1 weitere 8 %, höchstens 90 %
  const abwehr = Math.min(0.9, 0.18 * k.wachen + 0.08 * (fuehrerStufe(k) - 1));
  if (Math.random() < abwehr) {
    log(T(`⚔️ Räuber greifen ${k.name} an – ${k.fuehrer.name} und die Wachen schlagen sie in die Flucht!`,
          `⚔️ Robbers attack ${k.name} – ${k.fuehrer.name} and the guards drive them off!`), 'gut');
    epGeben(k, 30);
    if (k.wachen > 0 && Math.random() < 0.2) {
      k.wachen--;
      log(T(`${k.name}: Eine Wache ist im Kampf gefallen.`, `${k.name}: A guard fell in the fight.`), 'schlecht');
    }
    return;
  }

  const beute = [];
  for (const w of WAREN) {
    if (w.id === 'wasser' || k.ladung[w.id] < 1) continue;
    const menge = Math.ceil(k.ladung[w.id] * zufall(0.25, 0.5));
    k.ladung[w.id] -= menge;
    beute.push(`${menge} ${w.name}`);
  }
  log(T(`🗡️ Räuber überfallen ${k.name} und erbeuten ${beute.join(', ')}!`, `🗡️ Robbers raid ${k.name} and make off with ${beute.join(', ')}!`), 'schlecht');
  if (Math.random() < 0.15) tierVerlieren(k, T('von den Räubern gestohlen worden', 'was stolen by the robbers'));
}

function epGeben(k, ep) {
  const vorher = fuehrerStufe(k);
  k.fuehrer.ep += ep;
  const nachher = fuehrerStufe(k);
  if (nachher > vorher) {
    log(T(`⭐ ${k.fuehrer.name} (${k.name}) ist jetzt Karawanenführer der Stufe ${nachher}!`,
          `⭐ ${k.fuehrer.name} (${k.name}) is now a level ${nachher} caravan leader!`), 'gut');
  }
}

function neuesAngebot() {
  const kandidaten = S.oasen.filter(o => o.aktiv && o.bev >= 150 &&
                                         !S.angebote.some(a => a.oase === o.id));
  if (!kandidaten.length) return;
  const o = kandidaten[zufallInt(0, kandidaten.length - 1)];

  // Der Scheich verlangt eine Ware, die seine Oase selbst nicht herstellt
  const moeglich = WAREN.filter(w => w.id !== 'wasser' && !w.selten && !w.veredelt && !o.produziert.includes(w.id));
  const w = moeglich[zufallInt(0, moeglich.length - 1)];
  const menge = Math.max(3, Math.round(zufall(300, 800) / w.basis));
  // Wer hohes Ansehen genießt, bekommt besser bezahlte Aufträge (bis +50 %)
  const lohn = Math.round(menge * w.basis * zufall(1.8, 2.5) * (1 + ansehen(o) / 200) / 10) * 10;

  S.angebote.push({ id: S.naechsteId++, oase: o.id, ware: w.id, menge, lohn,
                    frist: zufallInt(15, 30), ablauf: S.tag + zufallInt(6, 12) });
  log(T(`📜 Der Scheich von ${o.name} sucht einen Händler: ${menge} ${w.name} für ${lohn} Dinar.`,
        `📜 The sheikh of ${o.name} seeks a merchant: ${menge} ${w.name.toLowerCase()} for ${lohn} dinars.`));
}

// Läuft jeden Tag: Angebote verfallen, Fristen laufen ab, neue Angebote kommen
// --- Gerüchte aus dem Basar ---
// Manche stimmen (dann ändert sich wirklich etwas), manche nicht.
// Ein erfahrener Karawanenführer (ab Stufe 4) kann sie einschätzen.
function geruechtTag() {
  if (Math.random() > 0.22) return;
  const oasen = S.oasen.filter(o => o.aktiv);
  const waren = WAREN.filter(w => w.id !== 'wasser' && !w.selten && !w.veredelt && !w.see);
  const o = oasen[zufallInt(0, oasen.length - 1)], w = waren[zufallInt(0, waren.length - 1)];
  const mangel = Math.random() < 0.55, wahr = Math.random() < 0.6;
  if (wahr) {
    if (mangel) o.lager[w.id] *= 0.15;
    else o.lager[w.id] += normBestand(o, w) * 4;
  }
  let text = mangel ? T(`In ${o.name} angeblich knapp: ${w.icon} ${w.name} – man zahle dort Höchstpreise.`,
                        `${w.icon} ${w.name} is said to be scarce in ${o.name} – they pay top prices there.`)
                    : T(`In ${o.name} angeblich spottbillig: ${w.icon} ${w.name} – die Speicher seien übervoll.`,
                        `${w.icon} ${w.name} is said to be dirt cheap in ${o.name} – the stores are overflowing.`);
  const kenner = S.karawanen.filter(k => fuehrerStufe(k) >= 4).sort((a, b) => b.fuehrer.ep - a.fuehrer.ep)[0];
  if (kenner) text += wahr ? T(` ${kenner.fuehrer.name} hält das für glaubwürdig.`, ` ${kenner.fuehrer.name} believes it.`)
                           : T(` ${kenner.fuehrer.name} winkt ab: „Basargeschwätz.“`, ` ${kenner.fuehrer.name} waves it off: "Bazaar gossip."`);
  log(T('🗣️ Gerücht: ', '🗣️ Rumour: ') + text);
}

function pruefeAuftraege() {
  S.angebote = S.angebote.filter(a => a.ablauf >= S.tag && oase(a.oase).aktiv);

  for (const a of [...S.auftraege]) {
    const o = oase(a.oase);
    if (!o.aktiv) {
      S.auftraege = S.auftraege.filter(x => x !== a);
      log(T(`📜 ${o.name} ist versiegt – der Auftrag ist hinfällig.`, `📜 ${o.name} has dried up – the contract is void.`));
    } else if (S.tag > a.bisTag) {
      const strafe = Math.round(a.lohn * 0.25);
      S.gold -= strafe;
      buche('Strafen', -strafe);
      S.auftraege = S.auftraege.filter(x => x !== a);
      log(T(`📜 Frist verpasst! Der Scheich von ${o.name} verlangt ${strafe} Dinar Vertragsstrafe.`,
            `📜 Deadline missed! The sheikh of ${o.name} demands a ${strafe} dinar penalty.`), 'schlecht');
      ansehenAendern(o, -15);
    }
  }

  if (Math.random() < 0.25 && S.angebote.length < 4) neuesAngebot();
}
