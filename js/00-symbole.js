/* =====================================================================
   0b. SYMBOLE – ein eigener, einheitlicher Symbolsatz statt bunter Emojis
   Emojis sehen auf jedem Handy anders aus. Darum zeichnen wir die wichtigsten
   Zeichen selbst (als kleine Vektorgrafiken, 24 × 24 Einheiten groß).

   Der Code im Spiel schreibt weiterhin Emojis (z. B. '💧'). Erst bevor ein Text
   auf dem Bildschirm landet, tauscht symbole(html) sie gegen diese Grafiken aus.
   So bleiben Spielstände, Meldungen und Übersetzungen unverändert.

   Jeder Teil eines Symbols hat eine Art:
     'a' = volle Farbe        'c' = halbe Farbe (für Dinge im Hintergrund)
     'h' = Glanzlicht (hell)  'd' = Schatten (dunkel)
     'e' = volle Farbe mit Löchern (z. B. Ringe)   's' = Linie (Breite optional)
   ===================================================================== */

// Kleine Helfer, um Kreise, Ellipsen und Sterne als Pfad zu schreiben
function K(cx, cy, r) { return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`; }
function E(cx, cy, rx, ry) { return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`; }
function STERN(cx, cy, R, r, n = 5) {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const w = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R;
    d += (i ? 'L' : 'M') + (cx + Math.cos(w) * rr).toFixed(2) + ' ' + (cy + Math.sin(w) * rr).toFixed(2);
  }
  return d + 'z';
}

// farbe: eigener Farbton (Waren, Tiere) – ohne farbe nimmt das Symbol die Schriftfarbe der Umgebung (Messing)
const SYMBOLE = {
  // --- Waren ---
  '💧': { farbe: '#6fc4c6', teile: [['a', 'M12 2.6C9 7 5.8 10.6 5.8 14.6a6.2 6.2 0 0 0 12.4 0C18.2 10.6 15 7 12 2.6z'],
                                     ['h', 'M8.7 14.4c0 2 1.2 3.6 3 4.1-2.6.5-4.4-1.6-3-4.1z']] },
  '🌴': { farbe: '#8fbf5a', teile: [['s', 'M12.6 21.5c.4-3.8 0-7.4-1-10.6', 2],
                                     ['a', 'M11.6 10.2C9.4 6.8 5.6 6.1 2.6 7.9c3.3-.2 6 .7 9 2.3zM11.6 10.2c1.2-3.9 5-6 8.8-5.2-3.2.7-5.9 2.4-8.8 5.2zM11.6 10.2c-3.6-.6-6.7 1.2-7.9 4.3 2.2-2.1 4.8-3.4 7.9-4.3zM11.6 10.2c3.6-.2 6.6 1.9 7.4 5-2.1-2.3-4.6-3.9-7.4-5zM11.6 10.2c-.3-3.4 1.2-6.4 3.9-7.8-1.7 2.4-3 4.9-3.9 7.8z'],
                                     ['d', K(10.4, 12.2, 1.1) + K(12.6, 12.5, 1.1) + K(11.4, 13.9, 1.1)]] },
  '🧂': { farbe: '#e9e2d4', teile: [['a', 'M3.5 9.5L12 5l8.5 4.5v6L12 20l-8.5-4.5z'], ['h', 'M3.5 9.5L12 5l8.5 4.5L12 14z'],
                                     ['d', 'M12 14l8.5-4.5v6L12 20z'], ['d', 'M7 11.3l2.4 1.3-.5 1.6 1.4.9-.3.4-1.9-1.1.5-1.6-2-1.1z']] },
  '🌿': { farbe: '#7f95e0', teile: [['s', 'M7 21c2-5 5-10 10.5-16', 1.6],
                                     ['a', 'M9.6 15.4c-3-.4-5-2.4-5.4-5.2 2.8.3 5 2 5.4 5.2zM12.6 10.6c-2.6-.8-4-3-3.9-5.6 2.5.9 3.9 3 3.9 5.6zM14.6 8.2c.8-2.6 3-4 5.6-3.9-.9 2.5-3 3.9-5.6 3.9zM10.8 14c2.8-.6 5.2.6 6.4 3-2.8.5-5.2-.6-6.4-3zM12.6 11.6c2.6-1 5-.2 6.4 2-2.6.8-5 0-6.4-2z']] },
  '🌶': { farbe: '#de6a45', teile: [['a', 'M16 8c1.5 1 1.6 3 .6 5.2C14.8 17 10 20.4 4.5 20.6c4-1.8 7-5.2 8.4-9.6.6-2 1.8-3.4 3.1-3z'],
                                     ['h', 'M12.2 11.8c-1 2.6-3 4.8-5.4 6.2 2-.6 4.2-2.6 5.4-6.2z'],
                                     ['s', 'M15.8 8.2c.2-1.8 1.2-3.2 3-3.6', 1.6], ['c', 'M13.4 8.6c1.4-1.3 3.4-1.3 4.6 0-1.5.7-3.1.7-4.6 0z']] },
  '⚒': { farbe: '#b9bec7', teile: [['a', 'M3 7.5h12.5c.3 2.3 2.6 3.8 5.5 3.8v1.2h-5.5c-1.3 0-2.2.9-2.2 2.1v1.2h2.5V19H6.2v-3.2h2.5v-1.2c0-1.2-.9-2.1-2.2-2.1H5.2A2.2 2.2 0 0 1 3 10.3z'],
                                    ['h', 'M3.6 8.1h11.4v.9H3.6z'], ['d', 'M6.2 17.6h9.6V19H6.2z']] },
  '🔥': { farbe: '#f0a04a', teile: [['a', 'M12 2.5c.6 3.4 5.6 5.6 5.6 11a5.6 5.6 0 0 1-11.2 0c0-2.6 1.4-4.4 2.6-5.6.2 1.6.8 2.6 1.8 3.2-.4-3.2.2-6.2 1.2-8.6z'],
                                     ['h', 'M12 12c.4 1.8 2.6 2.6 2.6 5a2.6 2.6 0 0 1-5.2 0c0-1.4.8-2.4 1.6-3 .1.8.4 1.2.8 1.4-.1-1.4 0-2.4.2-3.4z']] },
  '🧶': { farbe: '#d0675a', teile: [['a', 'M5 4.2h14v15.6H5z'], ['d', 'M12 7l4 5-4 5-4-5z'], ['h', K(12, 12, 1.3) + 'M7 6.2h10v.9H7zM7 16.9h10v.9H7z'],
                                     ['s', 'M6.5 2v2.2M9.5 2v2.2M12 2v2.2M14.5 2v2.2M17.5 2v2.2M6.5 19.8V22M9.5 19.8V22M12 19.8V22M14.5 19.8V22M17.5 19.8V22', 1.1]] },
  '✨': { farbe: '#ecc659', teile: [['a', 'M3 19.5c1.5-4.5 5-7 9-7s7.5 2.5 9 7z'], ['h', 'M7.6 16.6c1.3-1.4 2.8-2.1 4.4-2.2-1.1.8-2 1.6-2.6 2.6z'],
                                     ['a', STERN(17.5, 6, 3.6, 1) + STERN(7, 6.5, 2.3, .7, 4)]] },
  '💎': { farbe: '#86d6e6', teile: [['a', 'M7 4h10l4 5-9 11L3 9z'], ['h', 'M3 9l4-5h10l4 5z'], ['d', 'M3 9h5.2L12 20zM21 9h-5.2L12 20z'],
                                     ['h', 'M8.2 9L12 4l3.8 5z']] },
  '💍': { farbe: '#ecc659', teile: [['e', K(12, 15, 6.4) + K(12, 15, 4.5)], ['a', 'M9.2 6.4L10.6 4h2.8l1.4 2.4L12 9.2z'],
                                     ['h', 'M10.6 4h2.8l1.4 2.4H9.2z'], ['d', 'M8.6 9.4c1.8-.6 5-.6 6.8 0l-.6 1c-1.8-.4-3.8-.4-5.6 0z']] },
  '🧵': { farbe: '#c07ad8', teile: [['a', 'M3.5 14.5h17v5h-17zM4.5 9.5h15v5h-15zM5.5 4.5h13v5h-13z'], ['d', 'M3.5 14.5h17v1h-17zM4.5 9.5h15v1h-15z'],
                                     ['h', 'M5.5 4.5h13v1h-13zM15 6.5h2.5v2H15zM16.5 11.5H19v2h-2.5zM17.5 16.5H20v2h-2.5z']] },
  '🧣': { farbe: '#e58aaa', teile: [['a', 'M5.5 6.5h11a3.6 5.5 0 0 1 0 11h-11z'], ['h', E(5.5, 12, 3.6, 5.5)], ['d', E(5.5, 12, 1.4, 2.2)],
                                     ['a', 'M16.5 15.5c2.2.3 3.8 2.2 4.4 4.8-2.2-1.6-3.8-2.2-6-2.2z']] },
  '🏺': { farbe: '#a6cbe8', teile: [['a', 'M9 3h6v1.5c0 1-.8 1.6-.8 2.6 0 1.4 4.3 3 4.3 7.4 0 3.6-2.4 6-6.5 6.5-4.1-.5-6.5-2.9-6.5-6.5 0-4.4 4.3-6 4.3-7.4 0-1-.8-1.6-.8-2.6z'],
                                     ['d', 'M6.1 12.5h11.8v1.4H6.1z'], ['h', 'M8 15c.3 2 1.5 3.4 3 4-2.1 0-3.4-1.6-3-4z']] },

  // --- Tiere ---
  '🐪': { farbe: '#d3a067', teile: [['s', 'M7.4 14.6V20.5M9.2 15V20.5M13.8 15V20.5M15.6 14.6V20.5', 1.6], ['a', E(11.4, 12.6, 6, 3.2)],
                                     ['a', 'M7.6 11.2c.4-3 1.8-4.6 3.6-4.6s3.2 1.6 3.6 4.6z'], ['s', 'M16.4 11.6c1.6-.6 2.4-2.4 2.6-5', 2.4],
                                     ['a', E(19.9, 6.4, 2.1, 1.25)], ['s', 'M5.4 12.2c-.8.8-1 2-.8 3', 1], ['h', E(10.9, 8.6, 2, .9)]] },
  '🐎': { farbe: '#b67a4a', teile: [['s', 'M7.2 14.4l-.6 6M8.8 14.8l.2 5.6M13.4 14.8l-.2 5.6M15 14.4l.8 5.8', 1.4], ['a', E(10.8, 12.4, 5.4, 2.8)],
                                     ['s', 'M14.6 11.2l3-4.4', 2.8], ['a', 'M16.6 6.4c1.4-1.4 3.4-1.4 4.6.2l1 1.8c.2.5-.2 1-.7.9l-2.4-.5-2 1.2zM17.5 6l.3-2 1.1 1.7z'],
                                     ['d', 'M13.9 10.4l3.1-4.6.9.4-3.1 4.7z'], ['s', 'M5.4 11.2c-1.9.3-2.7 2.8-2 5.8', 1.7], ['h', E(10.4, 10.6, 3.6, .8)]] },
  '🫏': { farbe: '#b3a99c', teile: [['s', 'M7.8 15.6V20.5M9.4 15.8V20.5M12.8 15.8V20.5M14.4 15.6V20.5', 1.5], ['a', E(11, 13.6, 5, 2.7)],
                                     ['s', 'M15 12.4l2-3', 2.2], ['a', E(18.2, 9.3, 2.1, 1.2)], ['s', 'M17.4 8.4l-.6-3.4M18.6 8.2l.4-3.4', 1.1],
                                     ['h', E(11, 15, 3.4, .9)]] },
  '🐘': { farbe: '#aaa49d', teile: [['a', E(10.4, 11.6, 7, 5) + K(17, 9.6, 3.6) + 'M5 14h2.6v6.4H5zM8.6 14.6h2.6v5.8H8.6zM12.4 14.6H15v5.8h-2.6z'],
                                     ['s', 'M19.8 10.6c1.6 2.4 1.8 5 .4 7.2', 2], ['d', E(15.8, 10.2, 2, 3)], ['h', E(9, 7.6, 4.4, 1.2)]] },

  // --- Geld ---
  '🪙': { farbe: '#ecc659', teile: [['a', K(12, 12, 9.5)], ['d', K(12, 12, 7.2)], ['a', K(12, 12, 6.4)],
                                     ['d', 'M13.4 8.4a3.8 3.8 0 1 0 0 7.2 4.6 4.6 0 1 1 0-7.2z'], ['h', 'M6.2 9.4a6.6 6.6 0 0 1 3.4-3.2l.4.8a5.6 5.6 0 0 0-3 2.8z']] },
  '💰': { teile: [['a', 'M9 7.5h6c3.5 2.6 5.5 6 5.5 9 0 2.5-2.3 4-8.5 4s-8.5-1.5-8.5-4c0-3 2-6.4 5.5-9z'], ['d', 'M9 7.5h6v1.4H9z'],
                  ['a', 'M9.5 7.5L8 4.2c1.3.4 2.6.4 4-.4 1.4.8 2.7.8 4 .4l-1.5 3.3z'], ['h', K(12, 15, 2.7)]] },

  // --- Reiter, Knöpfe, Kopfleiste ---
  '📜': { teile: [['a', 'M6.5 6h11v12.5h-11z'], ['a', 'M5 4.5h13.5a1.5 1.5 0 0 1 0 3H5a1.5 1.5 0 0 1 0-3zM5.5 17h13.5a1.5 1.5 0 0 1 0 3H5.5a1.5 1.5 0 0 1 0-3z'],
                  ['d', 'M8.5 10h7v1h-7zM8.5 12.4h7v1h-7zM8.5 14.8h5v1h-5z'], ['h', 'M5 5.4h13v.8H5z']] },
  '🎯': { teile: [['e', K(12, 12, 9.5) + K(12, 12, 7.4) + K(12, 12, 5.3) + K(12, 12, 3.2) + K(12, 12, 1.4)]] },
  '🤝': { teile: [['a', 'M4 20.5V11h16v9.5z'], ['a', 'M7 11a5 5 0 0 1 10 0z'], ['s', 'M12 6V3', 1.4], ['a', K(12, 2.6, .9)],
                  ['d', 'M10.5 20.5v-4a1.5 1.5 0 0 1 3 0v4zM5.8 13h2v3h-2zM16.2 13h2v3h-2z'], ['h', 'M8.4 10.2a3.6 3.6 0 0 1 2.4-3l.3.7a2.8 2.8 0 0 0-1.9 2.3z']] },
  '📰': { teile: [['a', 'M4 4.5h13v14.6a1 1 0 0 0 1 .9H6a2 2 0 0 1-2-2z'], ['c', 'M17.5 8H20v11a1.2 1.2 0 0 1-2.5 0z'],
                  ['d', 'M6.4 7h8.4v3.4H6.4zM6.4 12h8.4v1H6.4zM6.4 14.4h8.4v1H6.4zM6.4 16.8h5.4v1H6.4z']] },
  'ℹ': { teile: [['e', K(12, 12, 9.5) + 'M10.9 10.4h2.2v6.8h-2.2z' + K(12, 7.6, 1.3)]] },
  '🔭': { teile: [['a', 'M3.5 12.6l12.6-5.4 1.7 3.9-12.6 5.4z'], ['a', 'M17.6 6.5l2.3-1 1.8 4.2-2.3 1z'], ['h', 'M4 12.8l12.3-5.3.3.7-12.3 5.3z'],
                  ['s', 'M11 13.6l-3 7M11 13.6l3 7M11 13.6v7', 1.3]] },
  '🏛': { teile: [['a', 'M3 9l9-5 9 5z'], ['a', 'M4 9.2h16v1.3H4zM3.5 19h17v2h-17zM5.5 10.5h2.2V19H5.5zM10.9 10.5h2.2V19h-2.2zM16.3 10.5h2.2V19h-2.2z'],
                  ['h', 'M5.5 10.5h.7V19h-.7zM10.9 10.5h.7V19h-.7zM16.3 10.5h.7V19h-.7z']] },
  '🏗': { teile: [['a', 'M3.5 8.2L12 4l8.5 4.2z'], ['a', 'M5.4 8.2h1.5v6H5.4zM17.1 8.2h1.5v6h-1.5zM4 14h16v6.5H4z'],
                  ['d', 'M4 16.9h16v.8H4zM9 14v2.9h.8V14zM14.2 17.7v2.8h.8v-2.8z'], ['s', 'M12 8.2v3.4', 1], ['a', 'M10.6 11.4h2.8l-.4 2.2h-2z']] },
  '🐾': { teile: [['a', 'M12 12.5c2.6 0 5 2.6 5 4.8 0 1.6-1.3 2.4-2.6 2.2-1-.2-1.6-.6-2.4-.6s-1.4.4-2.4.6C8.3 19.7 7 18.9 7 17.3c0-2.2 2.4-4.8 5-4.8z' +
                  E(7.2, 10.5, 1.6, 2.1) + E(10.2, 7.4, 1.6, 2.2) + E(13.8, 7.4, 1.6, 2.2) + E(16.8, 10.5, 1.6, 2.1)]] },
  '🧕': { teile: [['a', K(12, 6.6, 3.1) + 'M5.6 21c0-6 2.8-10 6.4-10s6.4 4 6.4 10z'], ['d', 'M8.9 6.6a3.1 3.1 0 0 1 6.2 0c0 2.6-1.4 4.4-3.1 4.4s-3.1-1.8-3.1-4.4z'],
                  ['h', K(12, 7.2, 1.7)]] },
  '🌸': { farbe: '#f0a6bf', teile: [['a', K(12, 7, 3) + K(16.8, 10.5, 3) + K(15, 16, 3) + K(9, 16, 3) + K(7.2, 10.5, 3)], ['h', K(12, 11.6, 2.3)]] },
  '🌧': { farbe: '#9db3d6', teile: [['a', 'M7 15a4 4 0 0 1-.4-8 5.5 5.5 0 0 1 10.6 1.6A3.3 3.3 0 0 1 17.5 15z'], ['h', 'M7.4 9a3.4 3.4 0 0 1 3-2.2v1a2.4 2.4 0 0 0-2.1 1.6z'],
                                     ['s', 'M8.5 17.5l-1 3M12.5 17.5l-1 3M16.5 17.5l-1 3', 1.5]] },
  '☀': { farbe: '#f3c35a', teile: [['a', K(12, 12, 4.6)], ['s', 'M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8', 1.8],
                                    ['h', 'M9.2 10.4a3.4 3.4 0 0 1 2.4-2.1l.2.9a2.4 2.4 0 0 0-1.7 1.5z']] },
  '🌙': { farbe: '#e8dcae', teile: [['a', 'M15.5 3.2a9 9 0 1 0 5.3 12.7A7.2 7.2 0 0 1 15.5 3.2z'], ['d', K(9, 14, 1.2) + K(12.5, 17.5, .8)]] },
  '🏅': { teile: [['c', 'M7.2 2.5h3.4l2.6 6.2-2.8 1.4zM16.8 2.5h-3.4L12 5.8l1.6 4.2 1.6-.6z'], ['a', K(12, 15, 5.8)], ['d', K(12, 15, 4.4)],
                  ['h', STERN(12, 15.3, 3.6, 1.5)]] },
  '📊': { teile: [['a', 'M4 19.6h16v1.4H4zM5.5 13h3v6.6h-3zM10.5 8h3v11.6h-3zM15.5 11h3v8.6h-3z'], ['h', 'M5.5 13h1v6.6h-1zM10.5 8h1v11.6h-1zM15.5 11h1v8.6h-1z']] },
  '⏸': { teile: [['a', 'M7 5h3.6v14H7zM13.4 5H17v14h-3.6z']] },
  '▶': { teile: [['a', 'M7.5 4.8l11 7.2-11 7.2z']] },
  '🔊': { teile: [['a', 'M4 9.5h3.5L12 5.5v13l-4.5-4H4z'], ['s', 'M15 9a4.2 4.2 0 0 1 0 6M17.6 6.6a7.6 7.6 0 0 1 0 10.8', 1.8]] },
  '🔇': { teile: [['a', 'M4 9.5h3.5L12 5.5v13l-4.5-4H4z'], ['s', 'M15.5 9.5l5 5M20.5 9.5l-5 5', 1.8]] },
  '☰': { teile: [['a', 'M4 6h16v2.2H4zM4 10.9h16v2.2H4zM4 15.8h16V18H4z']] },
  '⚖': { teile: [['a', 'M11.2 4h1.6v15h-1.6zM7 19h10v1.8H7zM4.5 6.5h15v1.4h-15z' + K(12, 4.4, 1.4)],
                 ['s', 'M5.5 7.9L3.2 13M5.5 7.9L7.8 13M18.5 7.9L16.2 13M18.5 7.9l2.3 5.1', .9],
                 ['a', 'M2.6 13h5.8a2.9 2.9 0 0 1-5.8 0zM15.6 13h5.8a2.9 2.9 0 0 1-5.8 0z']] },
  '🏭': { teile: [['a', 'M3 20.5V11l5 3v-3l5 3v-3l5 3V5h3v15.5z'], ['d', 'M6 16.4h2v2H6zM11 16.4h2v2h-2zM16 16.4h2v2h-2z'], ['c', E(19.5, 3.2, 1.6, 1)]] },
  '⏳': { teile: [['a', 'M6 3h12v1.8H6zM6 19.2h12V21H6z'], ['s', 'M7.5 4.8c0 4.4 4.5 5.2 4.5 7.2s-4.5 2.8-4.5 7.2M16.5 4.8c0 4.4-4.5 5.2-4.5 7.2s4.5 2.8 4.5 7.2', 1.3],
                  ['c', 'M9 7.5h6c-.6 1.4-3 2.6-3 3.6 0-1-2.4-2.2-3-3.6zM8.6 19.2c.6-2.4 3.4-3.2 3.4-4.8 0 1.6 2.8 2.4 3.4 4.8z']] },
  '🎉': { farbe: '#f0b54a', teile: [['s', 'M12 1v2.2', 1.2], ['a', 'M10 3h4l1 2.4H9zM8 6h8l1.6 4.2-1.6 6.1H8l-1.6-6.1zM9.5 17h5l-1 2.6h-3z'],
                                     ['h', 'M10 8h4l.9 2.4-.9 3.8h-4l-.9-3.8z'], ['d', 'M11.6 8h.8v6.2h-.8z']] },
  '⚔': { teile: [['s', 'M4.5 4.5L16 16M19.5 4.5L8 16', 1.9], ['s', 'M13.8 18.2l4.4-4.4M10.2 18.2l-4.4-4.4', 1.7], ['s', 'M16 16l3 3M8 16l-3 3', 2.2]] },
  '🛡': { teile: [['a', 'M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z'], ['d', 'M12 2.5v19c4.6-1.4 8-5 8-10v-6z'], ['h', 'M12 6.5l1 2.4 2.6.2-2 1.6.7 2.5-2.3-1.4-2.3 1.4.7-2.5-2-1.6 2.6-.2z']] },
  '🏕': { teile: [['s', 'M12 5V2.5', 1.3], ['a', 'M2.5 19.5L12 5l9.5 14.5z'], ['d', 'M12 11l3.4 8.5H8.6z'], ['h', 'M12 5L6 14.2l.8.4L12 6.6z']] },
  '👑': { teile: [['a', 'M3.5 8l4.3 3.8L12 5l4.2 6.8L20.5 8l-1.6 10H5.1z' + K(3.5, 7.2, 1.2) + K(12, 4.2, 1.2) + K(20.5, 7.2, 1.2)],
                  ['d', 'M5.1 16h13.8l-.3 2H5.4z'], ['h', K(12, 13, 1.2) + K(8.2, 13.6, .8) + K(15.8, 13.6, .8)]] },
  '⭐': { farbe: '#f0c75a', teile: [['a', STERN(12, 12.6, 9.6, 4)], ['h', 'M12 3l2.2 6.8L12 12.6z']] },
  '🧭': { teile: [['e', K(12, 12, 9.5) + K(12, 12, 7.8)], ['a', 'M12 5.6l2.2 6.4L12 18.4 9.8 12z'], ['h', 'M12 5.6l2.2 6.4H9.8z'], ['d', K(12, 12, .9)]] },
  '📈': { teile: [['a', 'M4 4h1.6v14.4H20V20H4z'], ['s', 'M7.5 15l3.5-4 3 2.5L18.5 8', 1.8], ['a', 'M19.6 6.4l-.4 4.2-3.8-3.8z']] },
  '📉': { teile: [['a', 'M4 4h1.6v14.4H20V20H4z'], ['s', 'M7.5 8l3.5 4 3-2.5 4.5 5', 1.8], ['a', 'M19.6 16.6l-.4-4.2-3.8 3.8z']] },
  '👥': { teile: [['c', K(16.2, 8.4, 2.6) + 'M15 13.2c3.3 0 6 2.2 6 5.8h-4.6c0-2.4-.6-4.3-1.4-5.8z'], ['a', K(9, 8, 3) + 'M3 19.5c0-3.6 2.7-6 6-6s6 2.4 6 6z']] },
  '📦': { farbe: '#c99a5e', teile: [['a', 'M4 7l8-3.5L20 7v10l-8 3.5L4 17z'], ['h', 'M4 7l8-3.5L20 7l-8 3.5z'], ['d', 'M12 10.5L20 7v10l-8 3.5z'],
                                     ['d', 'M7.6 5.4l8 3.5.1 2.5-1.6.7-.1-2.5-8-3.5z']] },
  '⚓': { teile: [['e', K(12, 4.8, 2.3) + K(12, 4.8, 1)], ['a', 'M11.2 7h1.6v12.6h-1.6zM8 9h8v1.5H8z'],
                  ['s', 'M4.5 13c.5 4 3.6 6.8 7.5 6.8s7-2.8 7.5-6.8', 1.6], ['a', 'M3 13.8l1.5-2.8 1.7 2.6zM21 13.8l-1.5-2.8-1.7 2.6z']] },
  '🔁': { teile: [['s', 'M5 10.5a7 6 0 0 1 12.5-3.4M19 13.5a7 6 0 0 1-12.5 3.4', 1.9], ['a', 'M19.2 3.4l.2 4.6-4.4-.8zM4.8 20.6l-.2-4.6 4.4.8z']] },
  '⚠': { farbe: '#f0b54a', teile: [['e', 'M12 3l10 17.5H2z' + 'M11 9h2v6h-2z' + K(12, 17.3, 1.15)]] },
  '✅': { farbe: '#a9d98f', teile: [['s', 'M4.5 12.5l4.5 4.5 10-10', 2.8]] },
  '❌': { farbe: '#ff9b84', teile: [['s', 'M6 6l12 12M18 6L6 18', 2.8]] },
  '🗡': { teile: [['a', 'M12 2l1.6 3v9h-3.2V5zM7.5 14h9v1.6h-9zM11 15.6h2V20h-2z' + K(12, 20.8, 1.3)], ['h', 'M12 2l.6 1.2V14H12z']] },
  '🎁': { teile: [['a', 'M4 11h16v9.5H4zM3 7.5h18V11H3z'], ['d', 'M11 7.5h2v13h-2z'], ['s', 'M12 7.5c-1-2.5-4.5-3.5-4.5-1.5S10.5 7.5 12 7.5c1.5 0 4.5 0 4.5-1.5S13 5 12 7.5', 1.3]] },
  '💡': { farbe: '#ecc659', teile: [['a', 'M3 14c3 0 5-1.5 9-1.5s5.5 1 7 1c1 0 1.5-.6 2-1.4l.5.5c-.4 1.8-1.5 3-3 3.4-1.5 2-4 3-6.5 3s-4.5-1-5.5-2.5C4.6 16 3.6 15 3 14z'],
                                     ['a', 'M9 12.5c.4-1.6 1.6-2.5 3-2.5s2.6.9 3 2.5z' + K(12, 9.2, .9) + 'M9.5 19h5l1 1.5h-7z'],
                                     ['h', 'M8 14.4c1.4-.4 2.6-.6 4-.6v.8c-1.4 0-2.6.2-4 .6z'], ['a', 'M4 13.2c-.9-1.3-.4-2.8.7-3.8 0 1.1.6 1.5 1 2 .4.6.2 1.4-.4 1.8z']] },
  '🏰': { teile: [['a', 'M3 20.5V9h3v2h2V9h3v2h2V9h3v2h2V9h3v11.5z'], ['d', 'M10 20.5v-4a2 2 0 0 1 4 0v4zM5.4 13.5h1.4v2.4H5.4zM17.2 13.5h1.4v2.4h-1.4z']] },
  '🌪': { farbe: '#d6b07a', teile: [['s', 'M3.5 5.5h17M5.5 9.5h13M7.5 13.5h9M9.5 17.5h5M11 21h2', 2]] },
  '🌫': { teile: [['s', 'M4 8h16M3 12h14M6 16h14', 1.8]] },
  '🏃': { teile: [['a', K(14.5, 4.4, 2.1)], ['s', 'M13 7.6l-2 6 3 3-1 4.6M11 13.6l-4.2 1.4M12.6 8.6l3.4 2.6 2.6-1M12.6 8.6l-3 1-2 2.6', 2]] },
  '📂': { teile: [['a', 'M3 6.5A1.5 1.5 0 0 1 4.5 5h5l2 2h8A1.5 1.5 0 0 1 21 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z'], ['h', 'M3 9.6h18v1H3z']] },
  '🏆': { farbe: '#ecc659', teile: [['a', 'M7 3h10v5a5 5 0 0 1-10 0zM11 12.8h2V17h-2zM8 17h8v3H8z'], ['s', 'M7 5H4.5c0 3 1.2 4.5 3.2 4.8M17 5h2.5c0 3-1.2 4.5-3.2 4.8', 1.4],
                                     ['h', 'M8.6 4h1.2v4a3 3 0 0 0 1.2 2.4l-.6.9A4 4 0 0 1 8.6 8z']] },
  '🗺': { teile: [['a', 'M3 6l6-2.5 6 2.5 6-2.5v14.5L15 20.5 9 18l-6 2.5z'], ['d', 'M9 3.5V18l6 2.5V6z'], ['s', 'M5 14l2-2 2 1M16.5 9.5l2 2m0-2l-2 2', .9]] },
};

// Suchmuster für alle Emojis, die wir ersetzen (mit oder ohne Variationszeichen U+FE0F)
const SYMBOL_MUSTER = new RegExp('(' + Object.keys(SYMBOLE).sort((a, b) => b.length - a.length)
  .map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\uFE0F?', 'gu');

function teilSvg([art, d, breite]) {
  if (art === 's') return `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${breite || 1.8}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (art === 'h') return `<path d="${d}" fill="#fff" fill-opacity=".38"/>`;
  if (art === 'd') return `<path d="${d}" fill="#000" fill-opacity=".28"/>`;
  if (art === 'c') return `<path d="${d}" fill="currentColor" fill-opacity=".6"/>`;
  if (art === 'e') return `<path d="${d}" fill="currentColor" fill-rule="evenodd"/>`;
  return `<path d="${d}" fill="currentColor"/>`;
}

// Fertige SVG-Texte merken – jedes Symbol wird nur einmal zusammengebaut
const symbolCache = new Map();
function symbolSvg(emoji) {
  if (symbolCache.has(emoji)) return symbolCache.get(emoji);
  const s = SYMBOLE[emoji];
  const svg = `<svg class="sym${s.farbe ? ' getoent' : ''}" viewBox="0 0 24 24" aria-hidden="true"${s.farbe ? ` style="color:${s.farbe}"` : ''}>` +
              s.teile.map(teilSvg).join('') + '</svg>';
  symbolCache.set(emoji, svg);
  return svg;
}

// Emojis in einem HTML-Text gegen Symbole tauschen – aber nie innerhalb von <…> (Attribute bleiben unberührt)
function symbole(html) {
  if (!html) return html;
  return String(html).split(/(<[^>]*>)/).map(stueck =>
    stueck.startsWith('<') ? stueck : stueck.replace(SYMBOL_MUSTER, (_, e) => symbolSvg(e))).join('');
}

// --- Dieselben Symbole auf der Karte (Canvas) zeichnen ---
const symbolPfade = new Map();
// Farbton abdunkeln (für Symbole auf hellem Pergament)
function dunkler(hex, f = 0.58) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  return '#' + [m[1], m[2], m[3]].map(x => Math.round(parseInt(x, 16) * f).toString(16).padStart(2, '0')).join('');
}

function symbolMalen(g, emoji, x, y, groesse, farbe, aufHell = false) {
  const s = SYMBOLE[emoji.replace('️', '')];
  if (!s || typeof Path2D === 'undefined') return false;
  if (!symbolPfade.has(emoji)) symbolPfade.set(emoji, s.teile.map(([art, d, breite]) => ({ art, pfad: new Path2D(d), breite })));
  let grund = s.farbe || farbe || '#c8a04a';
  if (aufHell && s.farbe) grund = dunkler(s.farbe);
  g.save();
  g.translate(x - groesse / 2, y - groesse / 2);
  g.scale(groesse / 24, groesse / 24);
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const t of symbolPfade.get(emoji)) {
    if (t.art === 's') { g.strokeStyle = grund; g.lineWidth = t.breite || 1.8; g.stroke(t.pfad); continue; }
    g.fillStyle = t.art === 'h' ? 'rgba(255,255,255,.38)' : t.art === 'd' ? 'rgba(0,0,0,.28)' : grund;
    g.globalAlpha = t.art === 'c' ? 0.6 : 1;
    g.fill(t.pfad, t.art === 'e' ? 'evenodd' : 'nonzero');
    g.globalAlpha = 1;
  }
  g.restore();
  return true;
}
