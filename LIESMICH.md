# Karawane – Handel in der Wüste

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
| `js/17-seitenleiste.js` | Die Seitenleiste als HTML, die Reiter (🌴 🐪 📜 🎯 🤝 📰) – und welcher Knopf welche Funktion aufruft |
| `js/18-karte.js` | Die gezeichnete Karte: Dünen, Gebirge, Meer, Oasen mit Palmen und Häusern, laufende Tiere, Sandstürme, Nacht mit Laternen |
| `js/19-abenteuer.js` | Karawansereien, unerforschte Gebiete mit Fundorten, Pilger und Reisende |
| `js/20-steuerung.js` | Tastatur, Kopfleisten-Knöpfe und die Spielschleife – hier startet alles |

**Wichtig:** Die Reihenfolge der `<script>`-Zeilen in `index.html` zählt. Spätere Dateien
benutzen, was frühere anlegen – und `20-steuerung.js` startet das Spiel, darum kommt sie zuletzt.

## Spieltempo

Wie lange ein Spieltag dauert, steht ganz oben in `js/01-grunddaten.js`:
`const SEK_PRO_TAG = 3;` – also 3 echte Sekunden pro Tag bei Tempo 1×. Größere Zahl = langsameres Spiel.

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
