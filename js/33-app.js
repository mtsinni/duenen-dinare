/* =====================================================================
   33. ALS APP INSTALLIEREN
   Mit Manifest (manifest.webmanifest) und Service Worker (sw.js) lässt
   sich das Spiel auf dem Handy wie eine App auf den Startbildschirm legen.
   Es startet dann im Vollbild und läuft auch ohne Internet.
   ===================================================================== */

let installAnfrage = null;   // vom Browser bereitgestellte Installations-Anfrage (Chrome, Edge, Android)

function alsAppGestartet() {
  return (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
         (typeof navigator !== 'undefined' && navigator.standalone === true);
}
function istIOS() { return typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent); }

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();          // eigenen Knopf im Menü anbieten statt der Browser-Leiste
    installAnfrage = e;
    if (menueOffen) zeichneMenue();
  });
  window.addEventListener('appinstalled', () => {
    installAnfrage = null;
    log(T('📲 Dünen & Dinare ist jetzt als App installiert.', '📲 Dunes & Dinars is now installed as an app.'), 'gut');
    if (menueOffen) zeichneMenue();
  });
  // Service Worker anmelden – nur über http(s), nicht beim Öffnen als lokale Datei
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
}

function htmlApp() {
  if (alsAppGestartet()) return `<div class="einstellung"><label>📲 App</label><span class="hinweis" style="flex:1">${T('Läuft als installierte App.', 'Running as an installed app.')}</span></div>`;
  let hinweis;
  if (installAnfrage) hinweis = T('Auf den Startbildschirm legen – startet im Vollbild und läuft auch offline.', 'Add to your home screen – starts full-screen and works offline.');
  else if (istIOS()) hinweis = T('In Safari: Teilen-Symbol □↑ antippen → „Zum Home-Bildschirm“.', 'In Safari: tap the share icon □↑ → "Add to Home Screen".');
  else hinweis = T('Im Browser-Menü (⋮) „App installieren“ oder „Zum Startbildschirm hinzufügen“ wählen.', 'Choose "Install app" or "Add to Home screen" in the browser menu (⋮).');
  return `<div class="einstellung"><label>📲 ${T('Als App', 'As an app')}</label><span class="hinweis" style="flex:1">${hinweis}</span>
    ${installAnfrage ? `<button data-m="installieren" class="an">${T('Installieren', 'Install')}</button>` : ''}</div>`;
}

function appInstallieren() {
  if (!installAnfrage) return;
  installAnfrage.prompt();
  installAnfrage.userChoice.finally(() => { installAnfrage = null; zeichneMenue(); });
}
