// ============================================================
// CATEGORIA MUSICA 🎵
// Ogni canzone:
//   titolo / artista : mostrati dopo la risposta
//   cerca   : testo usato per trovare l'anteprima su iTunes (30 s)
//   inizio  : secondo dell'anteprima da cui partire (0-25)
//   durata  : quanti secondi far ascoltare (5-10)
//   audio   : (facoltativo) file locale, es. "audio/girls.mp3":
//             se presente viene usato al posto di iTunes
//   o / a   : opzioni e risposta corretta (stesso formato delle altre categorie)
// ============================================================
window.MUSIC_DATA = [
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - It's Raining Men",
   "B - Girls Like Girls",
   "C - Kobra",
   "D - Don't Leave Me This Way"
  ],
  "a": "B - Girls Like Girls",
  "titolo": "Girls Like Girls",
  "artista": "Hayley Kiyoko",
  "cerca": "Hayley Kiyoko Girls Like Girls",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Rumore",
   "B - Believe",
   "C - Constant Craving",
   "D - Good Luck, Babe!"
  ],
  "a": "C - Constant Craving",
  "titolo": "Constant Craving",
  "artista": "k.d. lang",
  "cerca": "k.d. lang Constant Craving",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - I'm Coming Out",
   "B - Y.M.C.A.",
   "C - Dancing On My Own",
   "D - Born This Way"
  ],
  "a": "D - Born This Way",
  "titolo": "Born This Way",
  "artista": "Lady Gaga",
  "cerca": "Lady Gaga Born This Way",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - It's Raining Men",
   "B - Good Luck, Babe!",
   "C - Silk Chiffon",
   "D - I'm Coming Out"
  ],
  "a": "D - I'm Coming Out",
  "titolo": "I'm Coming Out",
  "artista": "Diana Ross",
  "cerca": "Diana Ross I'm Coming Out",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Pink Pony Club",
   "B - Smalltown Boy",
   "C - Don't Leave Me This Way",
   "D - Constant Craving"
  ],
  "a": "B - Smalltown Boy",
  "titolo": "Smalltown Boy",
  "artista": "Bronski Beat",
  "cerca": "Bronski Beat Smalltown Boy",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Don't Leave Me This Way",
   "B - Dancing On My Own",
   "C - I Will Survive",
   "D - It's Raining Men"
  ],
  "a": "B - Dancing On My Own",
  "titolo": "Dancing On My Own",
  "artista": "Robyn",
  "cerca": "Robyn Dancing On My Own",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Don't Leave Me This Way",
   "B - Believe",
   "C - Y.M.C.A.",
   "D - Good Luck, Babe!"
  ],
  "a": "D - Good Luck, Babe!",
  "titolo": "Good Luck, Babe!",
  "artista": "Chappell Roan",
  "cerca": "Chappell Roan Good Luck, Babe!",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Closer",
   "B - It's Raining Men",
   "C - Freedom! '90",
   "D - Pink Pony Club"
  ],
  "a": "D - Pink Pony Club",
  "titolo": "Pink Pony Club",
  "artista": "Chappell Roan",
  "cerca": "Chappell Roan Pink Pony Club",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - I Will Survive",
   "B - Rumore",
   "C - Rush",
   "D - Pink Pony Club"
  ],
  "a": "C - Rush",
  "titolo": "Rush",
  "artista": "Troye Sivan",
  "cerca": "Troye Sivan Rush",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Make Me Feel",
   "B - I'm Coming Out",
   "C - we fell in love in october",
   "D - Freedom! '90"
  ],
  "a": "D - Freedom! '90",
  "titolo": "Freedom! '90",
  "artista": "George Michael",
  "cerca": "George Michael Freedom! '90",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Silk Chiffon",
   "B - Girls Like Girls",
   "C - Y.M.C.A.",
   "D - Born This Way"
  ],
  "a": "C - Y.M.C.A.",
  "titolo": "Y.M.C.A.",
  "artista": "Village People",
  "cerca": "Village People Y.M.C.A.",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Believe",
   "B - Make Me Feel",
   "C - I Will Survive",
   "D - Silk Chiffon"
  ],
  "a": "C - I Will Survive",
  "titolo": "I Will Survive",
  "artista": "Gloria Gaynor",
  "cerca": "Gloria Gaynor I Will Survive",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Born This Way",
   "B - Vogue",
   "C - Rush",
   "D - Y.M.C.A."
  ],
  "a": "B - Vogue",
  "titolo": "Vogue",
  "artista": "Madonna",
  "cerca": "Madonna Vogue",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Smalltown Boy",
   "B - Make Me Feel",
   "C - I'm Coming Out",
   "D - Closer"
  ],
  "a": "B - Make Me Feel",
  "titolo": "Make Me Feel",
  "artista": "Janelle Monáe",
  "cerca": "Janelle Monáe Make Me Feel",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Girls Like Girls",
   "B - Constant Craving",
   "C - Closer",
   "D - It's Raining Men"
  ],
  "a": "C - Closer",
  "titolo": "Closer",
  "artista": "Tegan and Sara",
  "cerca": "Tegan and Sara Closer",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - It's Raining Men",
   "B - Rumore",
   "C - Good Luck, Babe!",
   "D - Closer"
  ],
  "a": "A - It's Raining Men",
  "titolo": "It's Raining Men",
  "artista": "The Weather Girls",
  "cerca": "The Weather Girls It's Raining Men",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Vogue",
   "B - Make Me Feel",
   "C - Believe",
   "D - I'm Coming Out"
  ],
  "a": "C - Believe",
  "titolo": "Believe",
  "artista": "Cher",
  "cerca": "Cher Believe",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Freedom! '90",
   "B - Girls Like Girls",
   "C - Rumore",
   "D - we fell in love in october"
  ],
  "a": "C - Rumore",
  "titolo": "Rumore",
  "artista": "Raffaella Carrà",
  "cerca": "Raffaella Carrà Rumore",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Silk Chiffon",
   "B - we fell in love in october",
   "C - I'm Coming Out",
   "D - Kobra"
  ],
  "a": "D - Kobra",
  "titolo": "Kobra",
  "artista": "Rettore",
  "cerca": "Rettore Kobra",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - we fell in love in october",
   "B - Girls Like Girls",
   "C - Closer",
   "D - Rush"
  ],
  "a": "A - we fell in love in october",
  "titolo": "we fell in love in october",
  "artista": "girl in red",
  "cerca": "girl in red we fell in love in october",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - we fell in love in october",
   "B - Silk Chiffon",
   "C - Don't Leave Me This Way",
   "D - Born This Way"
  ],
  "a": "B - Silk Chiffon",
  "titolo": "Silk Chiffon",
  "artista": "MUNA",
  "cerca": "MUNA Silk Chiffon",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Don't Leave Me This Way",
   "B - Girls Like Girls",
   "C - I Will Survive",
   "D - we fell in love in october"
  ],
  "a": "A - Don't Leave Me This Way",
  "titolo": "Don't Leave Me This Way",
  "artista": "The Communards",
  "cerca": "The Communards Don't Leave Me This Way",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Pynk",
   "B - Kobra",
   "C - Believe",
   "D - Smalltown Boy"
  ],
  "a": "A - Pynk",
  "titolo": "Pynk",
  "artista": "Janelle Monáe",
  "cerca": "Janelle Monáe Pynk",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Pink Pony Club",
   "B - Closer",
   "C - we fell in love in october",
   "D - Femininomenon"
  ],
  "a": "D - Femininomenon",
  "titolo": "Femininomenon",
  "artista": "Chappell Roan",
  "cerca": "Chappell Roan Femininomenon",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Silk Chiffon",
   "B - Good Luck, Babe!",
   "C - LUNCH",
   "D - Constant Craving"
  ],
  "a": "C - LUNCH",
  "titolo": "LUNCH",
  "artista": "Billie Eilish",
  "cerca": "Billie Eilish LUNCH",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - LUNCH",
   "B - Boyfriend",
   "C - Silk Chiffon",
   "D - Closer"
  ],
  "a": "B - Boyfriend",
  "titolo": "Boyfriend",
  "artista": "Tegan and Sara",
  "cerca": "Tegan and Sara Boyfriend",
  "inizio": 0,
  "durata": 8
 },
 {
  "q": "Ascolta e indovina il titolo!",
  "o": [
   "A - Believe",
   "B - Curious",
   "C - Silk Chiffon",
   "D - Smalltown Boy"
  ],
  "a": "B - Curious",
  "titolo": "Curious",
  "artista": "Hayley Kiyoko",
  "cerca": "Hayley Kiyoko Curious",
  "inizio": 0,
  "durata": 8
 }
];
