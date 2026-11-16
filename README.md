# Queer lo sa? — Trivia Night

Questa cartella contiene il gioco completo e funziona da sola, senza installare niente.
Puoi aprire `index.html` con un doppio clic oppure pubblicarla gratis online.

## Comandi durante la serata
| Tasto | Cosa fa |
|---|---|
| **Tab / Spazio / Invio / →** oppure **clic** | gira la ruota → mostra le opzioni → rivela la risposta → torna alla ruota |
| **R** (o clic sul vinile) | riascolta lo spezzone (categoria Musica) |
| **M** | attiva/disattiva gli effetti sonori |
| **F** | schermo intero |

In basso a sinistra (semitrasparenti) trovi:
- **⚙️ Impostazioni**: numero di set, domande per set, ogni quante domande arriva una «Coatta vegana», durata della pausa e secondi per rispondere. Le scelte restano salvate nel browser; salvando parte una nuova partita.
- **Elenco domande…**: anteprima di tutte le domande della serata divise per set, con le opzioni ma senza la risposta. Con *Vai ▸* salti a una domanda, con *▶ Ascolta* senti lo spezzone delle canzoni.
- *Vai in pausa*, *Fine pausa*, audio e schermo intero.

## File da modificare
- `data/domande.js`: tutte le categorie, compresa **Coatta vegana** (stesso formato di prima: `q`, `o`, `a`)
- `data/musica.js`: le canzoni della categoria **Musica**
- `app.js`, in alto (`CONFIG`): valori predefiniti (quelli di ⚙️ Impostazioni hanno la precedenza), durata dello spezzone

### Categoria Musica
Gli spezzoni vengono presi dalle **anteprime ufficiali di iTunes** (30 secondi), quindi serve una connessione internet.
Per ogni canzone puoi impostare:
- `inizio`: da che secondo dell'anteprima partire (0–25)
- `durata`: quanti secondi far sentire (5–10)
- `audio`: (facoltativo) un tuo file, ad es. `"audio/vogue.mp3"` messo nella cartella `audio/`. Se c'è, viene usato al posto di iTunes, anche senza internet.

## Pubblicarlo gratis online (scegli uno)

### A) Netlify Drop (il più veloce, 2 minuti)
1. Vai su https://app.netlify.com/drop e crea un account gratuito.
2. Trascina **questa cartella** (`sito`) nella pagina.
3. Ricevi subito un indirizzo tipo `https://nome-a-caso.netlify.app`. In *Site settings* puoi cambiarlo, ad es. `queerlosa.netlify.app`.
Per aggiornare: *Deploys* → trascina di nuovo la cartella.

### B) GitHub Pages
1. Crea un account su https://github.com e un nuovo repository pubblico, ad es. `queer-lo-sa`.
2. *Add file → Upload files*: carica il contenuto di questa cartella (index.html, style.css, app.js, data/, immagini/).
3. *Settings → Pages → Branch: main / (root) → Save*.
4. Dopo un minuto il sito è su `https://TUO-UTENTE.github.io/queer-lo-sa/`.

### C) Cloudflare Pages
https://pages.cloudflare.com → *Create project → Direct upload* → carica la cartella.

> Nota: il sito pubblicato è visibile a chiunque abbia il link, comprese le risposte contenute in `data/`. Se vuoi, non condividere l'indirizzo con le giocatrici.
