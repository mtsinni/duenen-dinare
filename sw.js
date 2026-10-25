/* =====================================================================
   Service Worker – macht das Spiel offline spielbar und installierbar.
   Strategie „erst Netz, dann Speicher“: Online gibt es immer die neueste
   Version, ohne Internet die zuletzt geladene.
   Kommen neue Dateien dazu, gehören sie in die Liste DATEIEN.
   ===================================================================== */
const SPEICHER = 'duenen-dinare-v4';
const DATEIEN = [
  "./",
  "index.html",
  "style.css",
  "seiten.css",
  "impressum.html",
  "datenschutz.html",
  "manifest.webmanifest",
  "js/00-sprache.js",
  "js/00-symbole.js",
  "js/01-grunddaten.js",
  "js/02-hilfsfunktionen.js",
  "js/03-wirtschaft.js",
  "js/04-spielstand.js",
  "js/05-tageswechsel.js",
  "js/06-zufallsereignisse.js",
  "js/07-raeuber-auftraege.js",
  "js/08-finanzen.js",
  "js/09-lebendige-wueste.js",
  "js/10-ziele-statistik.js",
  "js/11-menue-einfuehrung.js",
  "js/12-jahreszeiten-ton.js",
  "js/13-kueste-diplomatie.js",
  "js/14-bewegung.js",
  "js/15-aktionen.js",
  "js/16-gebaeude-routen.js",
  "js/17-seitenleiste.js",
  "js/18-karte.js",
  "js/19-abenteuer.js",
  "js/20-soeldner.js",
  "js/21-steuerung.js",
  "js/22-pluenderer.js",
  "js/23-errungenschaften.js",
  "js/24-sieg.js",
  "js/25-musik.js",
  "js/26-effekte.js",
  "js/27-zufallskarte.js",
  "js/28-talente-ausruestung.js",
  "js/29-entscheidungen.js",
  "js/30-berater.js",
  "js/31-hilfe-tasten.js",
  "js/32-benachrichtigungen.js",
  "js/33-app.js",
  "js/34-welt.js",
  "js/35-familie.js",
  "fonts/AlegreyaSans-Bold.woff",
  "fonts/AlegreyaSans-Italic.woff",
  "fonts/AlegreyaSans-Medium.woff",
  "fonts/AlegreyaSans-Regular.woff",
  "fonts/Amiri-Bold.woff",
  "fonts/Amiri-BoldItalic.woff",
  "fonts/Amiri-Regular.woff",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SPEICHER).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(namen => Promise.all(namen.filter(n => n !== SPEICHER).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const anfrage = e.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== location.origin) return;
  e.respondWith(
    fetch(anfrage)
      .then(antwort => {
        if (antwort.ok) { const kopie = antwort.clone(); caches.open(SPEICHER).then(c => c.put(anfrage, kopie)); }
        return antwort;
      })
      .catch(() => caches.match(anfrage, { ignoreSearch: true }).then(t => t || caches.match('index.html')))
  );
});
