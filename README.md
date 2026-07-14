# Sito per la squadra di calcio amatoriale C.G. Daverio

Sito web ufficiale della società, pensato per tenere aggiornati soci, giocatori e famiglie su news, calendario partite, classifiche e documenti/normative interne.

Realizzato in **HTML, CSS e JavaScript puri** (nessun framework, nessuna build), completamente **responsive** (mobile-first, con vista dedicata anche da PC) e ospitato su **GitHub Pages**.

---

## Sezioni

| Sezione | Cosa contiene |
|---|---|
| **Home** | News della società, iniziative in corso, ultimi risultati |
| **Calendario** | Partite di tutte le categorie della società, filtrabili per squadra (e per giornata da PC), con risultati ed esito evidenziato |
| **Classifiche** | Classifica aggiornata di ogni categoria, con differenza reti calcolata automaticamente |
| **Documenti** | Regolamenti, moduli e normative in PDF, consultabili e scaricabili |

Su mobile, header e barra di navigazione in basso restano sempre fissi in cima e in fondo allo schermo, mentre il contenuto scorre liberamente in mezzo.

---

## Stack usato

- HTML5 semantico
- CSS3 (custom properties, Flexbox, Grid, media query per il responsive)
- JavaScript vanilla (nessuna libreria esterna, nessun bundler)
- Dati in formato CSV, letti a runtime con un piccolo parser scritto ad hoc

