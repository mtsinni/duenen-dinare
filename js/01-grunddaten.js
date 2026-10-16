/* =====================================================================
   1. GRUNDDATEN – Waren, Tiere, Start-Oasen
   Hier kannst du das Spiel am leichtesten anpassen (Preise, Tempo ...).
   ===================================================================== */

const SEK_PRO_TAG = 3;          // Wie viele echte Sekunden ein Spieltag bei Tempo 1× dauert
const KARTE_B = 1350, KARTE_H = 700;   // seit v5 mit der Küste im Osten

// basis = Grundpreis in Dinar
const WAREN = [
  { id: 'wasser',    name: 'Wasser',    nameEn: 'Water',      basis: 4,   icon: '💧' },
  { id: 'datteln',   name: 'Datteln',   nameEn: 'Dates',      basis: 10,  icon: '🌴', verderb: 0.03 },  // 3 % verderben pro Tag
  { id: 'salz',      name: 'Salz',      nameEn: 'Salt',       basis: 18,  icon: '🧂' },
  { id: 'indigo',    name: 'Indigo',    nameEn: 'Indigo',     basis: 25,  icon: '🌿' },   // Farbpflanze aus dem Süden
  { id: 'gewuerze',  name: 'Gewürze',   nameEn: 'Spices',     basis: 40,  icon: '🌶️' },
  { id: 'eisen',     name: 'Eisenwaren', nameEn: 'Ironware', basis: 45, icon: '⚒️', mine: true },  // nur aus der Eisenmine
  { id: 'weihrauch', name: 'Weihrauch', nameEn: 'Frankincense', basis: 60,  icon: '🔥' },
  { id: 'teppiche',  name: 'Teppiche',  nameEn: 'Carpets',    basis: 80,  icon: '🧶' },
  { id: 'gold',      name: 'Goldstaub', nameEn: 'Gold dust',  basis: 150, icon: '✨' },
  // Edelsteine: selten, nur als Fund in der Eisenmine. Die Seehändler im Hafen zahlen viel,
  // im Landesinneren will sie kaum jemand haben (nurHafen).
  { id: 'edelsteine', name: 'Edelsteine', nameEn: 'Gemstones', basis: 200, icon: '💎', mine: true, selten: true, nurHafen: true },
  // Veredelte Waren entstehen nur in deinen Werkstätten
  { id: 'schmuck',     name: 'Schmuck',     nameEn: 'Jewellery',  basis: 520, icon: '💍', veredelt: true },
  { id: 'prunkstoffe', name: 'Prunkstoffe', nameEn: 'Fine cloth', basis: 220, icon: '🧵', veredelt: true },
  { id: 'seide',     name: 'Seide',     nameEn: 'Silk',       basis: 120, icon: '🧣', see: true },   // kommt nur per Schiff
  { id: 'porzellan', name: 'Porzellan', nameEn: 'Porcelain',  basis: 100, icon: '🏺', see: true },
];

// Die "Schiffe" der Wüste.
// kapazitaet = Lasteinheiten, tempo = Karteneinheiten pro Tag,
// durst = Wasser pro Tag, unterhalt = Dinar pro Tag
const TIERE = {
  esel:    { name: 'Esel',    nameEn: 'Donkey',   icon: '🫏', kapazitaet: 15, tempo: 45, durst: 0.5, unterhalt: 2,  preis: 120 },
  pferd:   { name: 'Pferd',   nameEn: 'Horse',    icon: '🐎', kapazitaet: 10, tempo: 90, durst: 1.2, unterhalt: 5,  preis: 350 },
  kamel:   { name: 'Kamel',   nameEn: 'Camel',    icon: '🐪', kapazitaet: 30, tempo: 55, durst: 0.2, unterhalt: 4,  preis: 500 },
  elefant: { name: 'Elefant', nameEn: 'Elephant', icon: '🐘', kapazitaet: 80, tempo: 35, durst: 3,   unterhalt: 12, preis: 1400 },
};

const OASEN_START = [
  { name: 'Siwa',        x: 820, y: 150, produziert: ['datteln', 'wasser'],     bev: 900 },
  { name: 'Ghadames',    x: 430, y: 110, produziert: ['teppiche', 'datteln'],   bev: 700 },
  { name: 'Taoudenni',   x: 190, y: 250, produziert: ['salz'],                  bev: 300 },
  { name: 'Timbuktu',    x: 150, y: 560, produziert: ['gold', 'gewuerze', 'indigo'], bev: 1400 },
  { name: 'Agadez',      x: 470, y: 530, produziert: ['wasser', 'salz', 'indigo'], bev: 800 },
  { name: 'Bilma',       x: 640, y: 380, produziert: ['salz', 'datteln'],       bev: 400 },
  { name: 'Kufra',       x: 870, y: 480, produziert: ['weihrauch', 'wasser'],   bev: 500 },
  { name: 'Tamanrasset', x: 360, y: 330, produziert: ['gewuerze', 'teppiche'],  bev: 600 },
];

const NEUE_NAMEN = ['Bir Salam', 'Ain Amal', 'Wadi Nur', 'Bir Rahma', 'Ain Zahra',
                    'Wadi Hayat', 'Bir Jadid', 'Ain Safra', 'Wadi Barid', 'Bir Ghazal'];

// Karawanenführer: sammeln Erfahrung (EP) und steigen bis Stufe 5 auf
const FUEHRER_NAMEN = ['Yusuf', 'Hassan', 'Amina', 'Tariq', 'Leila', 'Omar',
                       'Fatima', 'Karim', 'Zahra', 'Idris', 'Malik', 'Samira'];
const STUFEN_EP = [0, 60, 160, 320, 560];   // ab so vielen EP gilt Stufe 1, 2, 3, 4, 5

// Bewaffnete Wachen schützen vor Räubern
const WACHE_PREIS = 100, WACHE_UNTERHALT = 3;

// Geldverleiher und Bankrott
const KREDIT_RAHMEN = 5000;          // so viel leiht dir der Verleiher freiwillig höchstens
const UEBERZIEHUNG_GEBUEHR = 0.1;    // leere Kasse: der Verleiher springt ein, nimmt aber 10 % extra
const SCHULDEN_WARNUNG = 6500;       // ab hier wird gewarnt
const PFAENDUNG_AB = 8000;           // ab hier wird gepfändet ...
const PFAENDUNG_ZIEL = 4000;         // ... bis die Schulden wieder darunter liegen
const VERLEIHER_AB_BEV = 600;        // Geldverleiher gibt es nur in größeren Oasen

// Eigene Gebäude
const LAGERHAUS = { preis: 1500, unterhalt: 5, platz: 300 };
const BETRIEB   = { preis: 3000, unterhalt: 10 };

// Ausbaustufen eines Standorts: mehr Lagerplatz, Betrieb und Werkstatt arbeiten schneller
const AUSBAU = [
  null,
  { platz: 300, faktor: 1 },
  { platz: 500, faktor: 1.7, preis: 2500 },
  { platz: 750, faktor: 2.4, preis: 4000 },
];

// Werkstätten verarbeiten Waren aus deinem Lagerhaus zu wertvolleren Waren.
// rezept = was für EINEN Durchgang verbraucht wird, ergebnis = was dabei entsteht
const WERKSTAETTEN = {
  juwelier:  { name: '💍 Juwelier',  nameEn: '💍 Jeweller', preis: 4000, unterhalt: 12, proTag: 1,
               rezept: { edelsteine: 1, gold: 1 }, ergebnis: { schmuck: 1 } },
  faerberei: { name: '🎨 Färberei',  nameEn: '🎨 Dye works', preis: 3500, unterhalt: 10, proTag: 1,
               rezept: { teppiche: 2, indigo: 3 }, ergebnis: { prunkstoffe: 2 } },
};
const BETRIEB_NAMEN = {
  datteln: '🌴 Dattelplantage', salz: '⛏️ Salzmine', gewuerze: '🌶️ Gewürzgarten',
  weihrauch: '🔥 Weihrauchhain', teppiche: '🧶 Teppichweberei', gold: '✨ Goldwäscherei',
  eisen: '🔨 Schmiede', indigo: '🌿 Indigofeld',
};
const BETRIEB_NAMEN_EN = {
  datteln: '🌴 Date plantation', salz: '⛏️ Salt mine', gewuerze: '🌶️ Spice garden',
  weihrauch: '🔥 Frankincense grove', teppiche: '🧶 Carpet weavery', gold: '✨ Gold panning',
  eisen: '🔨 Smithy', indigo: '🌿 Indigo field',
};
function betriebProduktion(wid) { return 120 / ware(wid).basis; }   // ≈ 120 Dinar Warenwert pro Tag

const BOTE_PREIS = 40;               // Ein Bote holt aktuelle Preise einer fernen Oase
