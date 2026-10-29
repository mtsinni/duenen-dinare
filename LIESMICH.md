# Dünen & Dinare – Karawanenhandel in der Wüste

(englisch: *Dunes & Dinars*)

Ein Handelsspiel im Browser: Schicke Karawanen von Oase zu Oase, trotze Sandstürmen,
Räubern und Dürre – und werde zum Herrn der Wüste.

## Spielen

`index.html` im Browser öffnen. Für GitHub Pages den ganzen Ordner (mit `style.css`
und dem Ordner `js`) ins Repository laden.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Gerüst der Seite: Kopfleiste, Karte, Seitenleiste, Fenster – und welche Skripte geladen werden |
| `style.css` | Aussehen: Indigo und Messing, Pergament für Menü, Einführung und Statistik, Handy-Ansicht. Alle Farben stehen oben unter `:root` |
| `js/00-symbole.js` | Eigener Symbolsatz (Vektorgrafiken) – ersetzt Emojis automatisch in der Oberfläche und auf der Karte |
| `js/00-sprache.js` | Sprachwahl Deutsch/Englisch: die Funktion `T()` und das Umschalten |
| `js/01-grunddaten.js` | **Hier lässt sich am leichtesten basteln:** Waren, Tiere, Oasen, Preise, Grenzwerte |
| `js/02-hilfsfunktionen.js` | Kleine Werkzeuge: Zufall, Entfernung, Tempo und Durst einer Karawane |
| `js/03-wirtschaft.js` | Produktion, Verbrauch und wie Preise entstehen |
| `js/04-spielstand.js` | Das Objekt `S` (der ganze Spielstand), neues Spiel, Speichern, alte Spielstände aufrüsten |
| `js/05-tageswechsel.js` | Was jeden Spieltag passiert: Wasser, Flucht, Kosten, Gefahren |
| `js/06-zufallsereignisse.js` | Sandsturm, Hitzewelle, Starkregen und neue Oasen |
| `js/07-raeuber-auftraege.js` | Überfälle, Erfahrung der Karawanenführer, Aufträge der Scheichs |
| `js/08-finanzen.js` | Geldverleiher, Zinsen, Pfändung, Bankrott |
| `js/09-lebendige-wueste.js` | Tag & Nacht, Tierseuchen, Fata Morgana, Feste, Brunnen, die Konkurrenz |
| `js/10-ziele-statistik.js` | Räuberlager angreifen, Ränge, Aufgaben, Statistik mit Diagramm |
| `js/11-menue-einfuehrung.js` | Startmenü, Speicherplätze, Schwierigkeitsgrade, Einführung |
| `js/12-jahreszeiten-ton.js` | Jahreszeiten und die selbst erzeugten Geräusche |
| `js/13-kueste-diplomatie.js` | Die Hafenstadt Suakin und Diplomatie mit den Handelshäusern |
| `js/14-bewegung.js` | Bewegung der Karawanen in jedem Bild (flüssige Animation) |
| `js/15-aktionen.js` | Was die Knöpfe tun: kaufen, verkaufen, losziehen … |
| `js/16-gebaeude-routen.js` | Preisgedächtnis, Lagerhaus, Betriebe, automatische Handelsrouten, Ansehen |
| `js/17-seitenleiste.js` | Die Seitenleiste als HTML, die Reiter (🌴 🐪 📜 🎯 🤝 📰) und die Oasen-Reiter (Markt, Gebäude …) – und welcher Knopf welche Funktion aufruft |
| `js/18-karte.js` | Die gezeichnete Karte: Dünen, Gebirge, Meer, Oasen mit Palmen und Häusern, laufende Tiere, Sandstürme, Nacht mit Laternen |
| `js/19-abenteuer.js` | Karawansereien, unerforschte Gebiete mit Fundorten, Pilger und Reisende |
| `js/20-soeldner.js` | Söldner gegen Räuberlager anheuern (ab Rang „Händler“, Lager auf der Karte antippen) |
| `js/22-pluenderer.js` | Plünderer: Räuberlager schicken Reiter los, die Karawanen jagen oder Oasen überfallen (wird vor 21 geladen) |
| `js/23-errungenschaften.js` | 25 Errungenschaften – bleiben über alle Spiele erhalten, mit Einblendung und Übersicht |
| `js/24-sieg.js` | Spielziele (Freies Spiel, Reichtum, Handelsimperium, Freund der Wüste, Wettlauf) und Siegfenster |
| `js/25-musik.js` | Live erzeugte orientalische Musik (Oud, Ney, Darbuka) – Stimmung je nach Lage: Titel, Tag, Nacht, Gefahr |
| `js/26-effekte.js` | Kleine Animationen: Gewinne, Münzen, Staub, Kampf, Bauen, glitzerndes Wasser, Kartenrahmen |
| `js/27-zufallskarte.js` | Zufällige Wüsten aus einer Kartennummer (Oasen, Waren, Gebirge) – oder die klassische Karte |
| `js/28-talente-ausruestung.js` | Talente der Karawanenführer (Feilscher, Spurenleser, Krieger, Wasserkundiger) und Ausrüstung |
| `js/29-entscheidungen.js` | Ereignisse mit Entscheidungen und ihre späteren Folgen |
| `js/30-berater.js` | Handelsberater (lohnende Geschäfte) und Preisverlauf je Ware |
| `js/31-hilfe-tasten.js` | Tastenkürzel (Taste ? zeigt alle) und Erklärungen beim Drüberfahren |
| `js/32-benachrichtigungen.js` | Kleine Meldungen am Rand (Ankunft, Plünderer, Wasser leer, Auftrag läuft ab) – auf Wunsch auch im Hintergrund |
| `js/33-app.js` | „Als App installieren“: Knopf im Menü, Anmeldung des Service Workers |
| `js/34-welt.js` | Wünsche der Oasen, Handelsposten & Karawanserei-Netz, Wanderdünen, junge Siedlungen |
| `js/35-familie.js` | Familie & Nachfolger: Alter, Hochzeit, Kinder, Ruhestand, Familienboni |
| `js/36-landschaft.js` | Große Wüste: klassische Karte mit 36 Oasen, große Zufallskarten, Flüsse & Wadis, Gebirge mit Wirkung, Karawanenpfade |
| `js/37-leben.js` | Leben in der Wüste: Gazellen, Nomadenlager, Fata Morgana, Vogelschwärme, wehender Sand |
| `js/38-komfort.js` | Mini-Karte, Spielstand als Code übertragen, Schriftgröße & Farbenblind-Modus |
| `js/39-zucht-spaeher.js` | Kundschafter für Karawanen, Zuchtstall mit Mehari-Rennkamelen |
| `js/40-atmosphaere.js` | Umgebungsgeräusche (Wind, Glocken, Markt, Grillen), lebendige Städte |
| `js/21-steuerung.js` | Tastatur, Kopfleisten-Knöpfe und die Spielschleife – hier startet alles |

**Wichtig:** Die Reihenfolge der `<script>`-Zeilen in `index.html` zählt. Spätere Dateien
benutzen, was frühere anlegen – und `21-steuerung.js` startet das Spiel, darum kommt sie zuletzt.

## Spieltempo

Wie lange ein Spieltag dauert, steht ganz oben in `js/01-grunddaten.js`:
`const SEK_PRO_TAG = 60;` – also 60 echte Sekunden (1 Minute) pro Tag bei Tempo 1×. Größere Zahl = langsameres Spiel.

## Ränge und die Gunst des Sultans

Der Rang richtet sich nach dem **besten Vermögen**, das du je erreicht hast – Einkäufe, Bauten oder Schulden
nehmen dir den Fortschritt nicht weg. Herabstufen kann dich nur der Sultan: wenn du zu lange zu wenig Handel
treibst oder zu lange Schulden hast (vorher gibt es Warnungen). Die Grenzen stehen in `js/10-ziele-statistik.js`
im Abschnitt `const SULTAN = { … }`.

## Sprache (Deutsch / English)

Im Menü oben rechts kann man jederzeit zwischen **Deutsch** und **English** wechseln – auch mitten im Spiel.
Die Wahl wird gespeichert; beim allerersten Start nimmt das Spiel die Sprache des Browsers.

Jeder Text steht im Code so: `T('Deutscher Text', 'English text')`. `T()` gibt den Text der gewählten Sprache zurück.
Bei Daten (Waren, Tiere, Ziele …) steht die englische Fassung in einem eigenen Feld daneben,
z. B. `name: 'Datteln', nameEn: 'Dates'`.
Wer einen neuen Text einbaut, schreibt ihn also einfach gleich in beiden Sprachen.
Einträge im Ereignis-Log bleiben in der Sprache, in der sie geschrieben wurden.

## Schriften

Das Spiel nutzt **Amiri** (Überschriften und Ortsnamen) und **Alegreya Sans** (Text), beide von
Google Fonts. Ohne Internet fällt es auf Georgia und die Systemschrift zurück und funktioniert weiter.
Wer die Schriften lieber selbst ausliefern möchte, lädt sie bei fonts.google.com herunter, legt sie
in einen Ordner `fonts/` und ersetzt den Google-Link in `index.html` durch eigene `@font-face`-Regeln.


## Eigene Internetadresse

| Datei / Ordner | Wofür? |
|---|---|
| `fonts/` | Die Schriften (Alegreya Sans, Amiri) – lokal, damit keine Verbindung zu Google entsteht |
| `impressum.html` | Impressum – **die gelb markierten Stellen mit deinen Daten ausfüllen** |
| `datenschutz.html` | Datenschutzerklärung – ebenfalls die gelben Stellen ausfüllen |
| `seiten.css` | Aussehen der beiden Seiten |

Im Menü gibt es „Alle Spielstände sichern“ und „Alle aus Datei wiederherstellen“ – damit nehmen
Spieler ihre Spielstände auf eine neue Adresse mit.

## Als App installieren

| Datei / Ordner | Wofür? |
|---|---|
| `manifest.webmanifest` | Name, Farben und Symbole der App |
| `icons/` | App-Symbole (Startbildschirm) |
| `sw.js` | Service Worker: speichert alle Dateien, damit das Spiel offline läuft. **Kommt eine neue Datei dazu, gehört sie in die Liste `DATEIEN`.** |

Das funktioniert nur über `https://` (z. B. GitHub Pages oder eigene Domain), nicht beim Öffnen der Datei direkt vom PC.
