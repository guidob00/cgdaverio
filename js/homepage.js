/* =========================================================
   DATI DI ESEMPIO
   Sostituisci questi array con i dati reali della squadra
   (in futuro potranno arrivare da un file JSON o da un backend).
   ========================================================= */

const NEWS = [
  {
    data: "2026-07-10",
    titolo: "Raduno estivo: si riparte il 20 luglio",
    testo: "La squadra si ritroverà al campo comunale per dare il via alla preparazione della nuova stagione.",
    link: "#"
  },
  {
    data: "2026-07-05",
    titolo: "Nuovo mister per la stagione 2026/2027",
    testo: "La società annuncia il nuovo allenatore che guiderà la prima squadra nel prossimo campionato.",
    link: "#"
  },
  {
    data: "2026-06-28",
    titolo: "Aperte le iscrizioni al settore giovanile",
    testo: "Da lunedì è possibile iscrivere i propri figli alle categorie Pulcini ed Esordienti.",
    link: "#"
  }
];

const INIZIATIVE = [
  {
    data: "2026-07-01",
    titolo: "Raccolta materiale sportivo usato",
    testo: "Fino al 31 luglio raccogliamo scarpini e materiale in buono stato da donare alle famiglie del settore giovanile.",
    link: "#"
  },
  {
    data: "2026-06-15",
    titolo: "Open day: prova gratuita per i più piccoli",
    testo: "Due sabati dedicati ai bambini che vogliono provare il calcio per la prima volta.",
    link: "#"
  }
];

const RISULTATI = [
  {
    data: "2026-05-18",
    avversario: "Vs Polisportiva Rivalta",
    risultato: "3 - 1",
    testo: "Vittoria convincente nell'ultima giornata di campionato.",
    link: "#"
  },
  {
    data: "2026-05-11",
    avversario: "Vs A.C. Borgo Nuovo",
    risultato: "1 - 1",
    testo: "Pareggio in rimonta dopo essere andati sotto nel primo tempo.",
    link: "#"
  }
];

/* =========================================================
   UTILITY
   ========================================================= */

function formattaData(isoDate) {
  const [anno, mese, giorno] = isoDate.split("-");
  return `${giorno}/${mese}/${anno}`;
}

function creaCardNews(item, variante) {
  const card = document.createElement("a");
  card.className = "news-card" + (variante ? ` news-card--${variante}` : "");
  card.href = item.link || "#";

  const top = document.createElement("div");
  top.className = "news-card-top";

  const badge = document.createElement("span");
  badge.className = "news-card-badge";
  badge.textContent = formattaData(item.data);
  top.appendChild(badge);

  if (item.risultato) {
    const score = document.createElement("span");
    score.className = "news-card-score";
    score.textContent = item.risultato;
    top.appendChild(score);
  }

  card.appendChild(top);

  const titolo = document.createElement("h3");
  titolo.className = "news-card-title";
  titolo.textContent = item.titolo || item.avversario;
  card.appendChild(titolo);

  const testo = document.createElement("p");
  testo.className = "news-card-excerpt";
  testo.textContent = item.testo;
  card.appendChild(testo);

  return card;
}

function popolaLista(containerId, dati, variante) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!dati || dati.length === 0) {
    const vuoto = document.getElementById("news-empty");
    if (vuoto) vuoto.hidden = false;
    return;
  }

  dati
    .slice()
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .forEach(item => container.appendChild(creaCardNews(item, variante)));
}

/* =========================================================
   TABELLONE DATA / ORA (mobile)
   ========================================================= */
function aggiornaTabellone() {
  const dateEl = document.getElementById("scoreboard-date");
  const timeEl = document.getElementById("scoreboard-time");
  if (!dateEl || !timeEl) return;

  const ora = new Date();
  const gg = String(ora.getDate()).padStart(2, "0");
  const mm = String(ora.getMonth() + 1).padStart(2, "0");
  const aaaa = ora.getFullYear();
  const hh = String(ora.getHours()).padStart(2, "0");
  const min = String(ora.getMinutes()).padStart(2, "0");

  dateEl.textContent = `${gg}-${mm}-${aaaa}`;
  timeEl.textContent = `${hh}:${min}`;
}

/* =========================================================
   NAV ATTIVA (evidenzia la pagina corrente)
   ========================================================= */
function evidenziaPaginaCorrente() {
  const paginaAttuale = window.location.pathname.split("/").pop() || "homepage.html";

  document.querySelectorAll(".top-nav-link, .bottom-nav-item").forEach(link => {
    const href = link.getAttribute("href");
    link.classList.toggle("is-active", href === paginaAttuale);
  });
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  popolaLista("news-list", NEWS);
  popolaLista("iniziative-list", INIZIATIVE, "iniziativa");
  popolaLista("risultati-list", RISULTATI, "risultato");

  aggiornaTabellone();
  setInterval(aggiornaTabellone, 30 * 1000);

  evidenziaPaginaCorrente();

  const anno = document.getElementById("anno-corrente");
  if (anno) anno.textContent = new Date().getFullYear();
});
