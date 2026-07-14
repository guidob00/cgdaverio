/* =========================================================
   PARSER CSV MINIMALE
   Gestisce campi tra virgolette con virgole al loro interno
   (es. gli indirizzi). Non serve una libreria esterna per
   file semplici come i nostri.
   ========================================================= */
function parseCSV(testo) {
  const righe = testo.trim().split(/\r?\n/);
  const intestazioni = splitRigaCSV(righe[0]);

  return righe.slice(1).filter(r => r.trim() !== "").map(riga => {
    const valori = splitRigaCSV(riga);
    const oggetto = {};
    intestazioni.forEach((chiave, i) => { oggetto[chiave.trim()] = (valori[i] || "").trim(); });
    return oggetto;
  });
}

function splitRigaCSV(riga) {
  const risultato = [];
  let corrente = "";
  let dentroVirgolette = false;

  for (let i = 0; i < riga.length; i++) {
    const carattere = riga[i];

    if (carattere === '"') {
      dentroVirgolette = !dentroVirgolette;
    } else if (carattere === "," && !dentroVirgolette) {
      risultato.push(corrente);
      corrente = "";
    } else {
      corrente += carattere;
    }
  }
  risultato.push(corrente);
  return risultato.map(v => v.replace(/^"|"$/g, ""));
}

/* =========================================================
   STATO
   ========================================================= */
let squadre = {};      // id -> { nome_breve, nome_lungo, logo }
let partite = [];       // elenco completo, con oggetti squadra risolti
let categoriaAttiva = null;
let giornataAttiva = "tutte";

/* =========================================================
   CARICAMENTO DATI
   ========================================================= */
async function caricaDati() {
  try {
    const [testoSquadre, testoPartite] = await Promise.all([
      fetch("data/squadre.csv").then(r => r.text()),
      fetch("data/partite.csv").then(r => r.text())
    ]);

    parseCSV(testoSquadre).forEach(s => { squadre[s.id] = s; });

    partite = parseCSV(testoPartite).map(p => ({
      categoria: p.categoria,
      giornata: p.giornata,
      data: p.data,
      ora: p.ora,
      indirizzo: p.indirizzo,
      casa: squadre[p.squadra_casa],
      trasferta: squadre[p.squadra_trasferta],
      golCasa: p.gol_casa === "" ? null : Number(p.gol_casa),
      golTrasferta: p.gol_trasferta === "" ? null : Number(p.gol_trasferta)
    }));

    inizializzaControlli();
  } catch (errore) {
    console.error("Errore nel caricamento dei dati del calendario:", errore);
    const container = document.getElementById("matches-container");
    if (container) {
      container.innerHTML = '<p class="matches-empty">Impossibile caricare il calendario. Riprova più tardi.</p>';
    }
  }
}

/* =========================================================
   CONTROLLI: dropdown squadra + giornata
   ========================================================= */
function inizializzaControlli() {
  const categorie = [...new Set(partite.map(p => p.categoria))];
  categoriaAttiva = categorie[0] || null;

  popolaDropdown({
    listaId: "team-dropdown-list",
    labelId: "team-dropdown-label",
    opzioni: categorie,
    selezionata: categoriaAttiva,
    onSelect: (valore) => {
      categoriaAttiva = valore;
      giornataAttiva = "tutte";
      aggiornaDropdownGiornata();
      renderPartite();
    }
  });

  aggiornaDropdownGiornata();
  collegaAperturaChiusuraDropdown();
  renderPartite();

  document.getElementById("matches-loading")?.remove();
}

function aggiornaDropdownGiornata() {
  const giornate = [...new Set(
    partite.filter(p => p.categoria === categoriaAttiva).map(p => p.giornata)
  )].sort((a, b) => Number(a) - Number(b));

  popolaDropdown({
    listaId: "giornata-dropdown-list",
    labelId: "giornata-dropdown-label",
    opzioni: ["tutte", ...giornate],
    selezionata: "tutte",
    etichette: { tutte: "Tutte le giornate" },
    prefissoEtichetta: "Giornata ",
    onSelect: (valore) => {
      giornataAttiva = valore;
      renderPartite();
    }
  });
}

function popolaDropdown({ listaId, labelId, opzioni, selezionata, onSelect, etichette = {}, prefissoEtichetta = "" }) {
  const lista = document.getElementById(listaId);
  const label = document.getElementById(labelId);
  if (!lista || !label) return;

  lista.innerHTML = "";

  opzioni.forEach(valore => {
    const testoOpzione = etichette[valore] || `${prefissoEtichetta}${valore}`;

    const voce = document.createElement("li");
    const bottone = document.createElement("button");
    bottone.type = "button";
    bottone.className = "dropdown-option" + (valore === selezionata ? " is-selected" : "");
    bottone.setAttribute("role", "option");
    bottone.textContent = testoOpzione;

    bottone.addEventListener("click", () => {
      label.textContent = testoOpzione;
      lista.querySelectorAll(".dropdown-option").forEach(o => o.classList.remove("is-selected"));
      bottone.classList.add("is-selected");
      chiudiTuttiIDropdown();
      onSelect(valore);
    });

    voce.appendChild(bottone);
    lista.appendChild(voce);

    if (valore === selezionata) label.textContent = testoOpzione;
  });
}

function collegaAperturaChiusuraDropdown() {
  document.querySelectorAll(".dropdown").forEach(dropdown => {
    const bottoneApertura = dropdown.querySelector(".dropdown-btn");
    const lista = dropdown.querySelector(".dropdown-list");
    if (!bottoneApertura || !lista) return;

    bottoneApertura.addEventListener("click", () => {
      const eraAperto = dropdown.classList.contains("is-open");
      chiudiTuttiIDropdown();
      if (!eraAperto) {
        dropdown.classList.add("is-open");
        lista.hidden = false;
        bottoneApertura.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", (evento) => {
    if (!evento.target.closest(".dropdown")) chiudiTuttiIDropdown();
  });
}

function chiudiTuttiIDropdown() {
  document.querySelectorAll(".dropdown").forEach(dropdown => {
    dropdown.classList.remove("is-open");
    const lista = dropdown.querySelector(".dropdown-list");
    const bottone = dropdown.querySelector(".dropdown-btn");
    if (lista) lista.hidden = true;
    if (bottone) bottone.setAttribute("aria-expanded", "false");
  });
}

/* =========================================================
   RENDER PARTITE
   ========================================================= */
function formattaDataLunga(isoDate) {
  if (!isoDate) return "";
  const data = new Date(isoDate + "T00:00:00");
  return data.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}

function creaCardPartita(partita) {
  const card = document.createElement("article");
  card.className = "match-card";

  card.appendChild(creaBloccoSquadra(partita.casa, "casa"));
  card.appendChild(creaBloccoRisultato(partita));
  card.appendChild(creaBloccoSquadra(partita.trasferta, "trasferta"));

  const meta = document.createElement("div");
  meta.className = "match-meta";
  meta.innerHTML = `
    <span class="match-meta-luogo">${partita.indirizzo || "Campo da definire"}</span>
    <span class="match-meta-sep">&middot;</span>
    <span class="match-meta-data">${formattaDataLunga(partita.data)}</span>
    <span class="match-meta-sep">&middot;</span>
    <span class="match-meta-ora">${partita.ora ? "ore " + partita.ora : "orario da definire"}</span>
  `;
  card.appendChild(meta);

  return card;
}

function creaBloccoSquadra(squadra, ruolo) {
  const blocco = document.createElement("div");
  blocco.className = `match-team match-team--${ruolo}`;

  if (!squadra) {
    blocco.textContent = "Squadra da definire";
    return blocco;
  }

  const logo = document.createElement("img");
  logo.className = "match-team-logo";
  logo.src = squadra.logo;
  logo.alt = squadra.nome_lungo || squadra.nome_breve;
  logo.onerror = () => { logo.src = "imgs/logo.png"; };

  const nome = document.createElement("span");
  nome.className = "match-team-name";
  nome.innerHTML = `
    <span class="team-name-short">${squadra.nome_breve}</span>
    <span class="team-name-long">${squadra.nome_lungo}</span>
  `;

  blocco.appendChild(logo);
  blocco.appendChild(nome);
  return blocco;
}

function creaBloccoRisultato(partita) {
  const blocco = document.createElement("div");

  const giocata = partita.golCasa !== null && partita.golTrasferta !== null;

  if (!giocata) {
    blocco.className = "match-score is-scheduled";
    blocco.textContent = "-:-";
    return blocco;
  }

  blocco.className = "match-score";

  const pareggio = partita.golCasa === partita.golTrasferta;
  const vinceCasa = partita.golCasa > partita.golTrasferta;

  const numCasa = document.createElement("span");
  numCasa.className = "score-num" + (!pareggio ? (vinceCasa ? " is-winner" : " is-loser") : "");
  numCasa.textContent = partita.golCasa;

  const separatore = document.createElement("span");
  separatore.className = "score-sep";
  separatore.textContent = "-";

  const numTrasferta = document.createElement("span");
  numTrasferta.className = "score-num" + (!pareggio ? (!vinceCasa ? " is-winner" : " is-loser") : "");
  numTrasferta.textContent = partita.golTrasferta;

  blocco.appendChild(numCasa);
  blocco.appendChild(separatore);
  blocco.appendChild(numTrasferta);
  return blocco;
}

function renderPartite() {
  const container = document.getElementById("matches-container");
  if (!container) return;
  container.innerHTML = "";

  const partiteCategoria = partite
    .filter(p => p.categoria === categoriaAttiva)
    .filter(p => giornataAttiva === "tutte" || p.giornata === giornataAttiva)
    .sort((a, b) => Number(a.giornata) - Number(b.giornata) || a.data.localeCompare(b.data));

  if (partiteCategoria.length === 0) {
    container.innerHTML = '<p class="matches-empty">Nessuna partita trovata per questa selezione.</p>';
    return;
  }

  let giornataCorrente = null;

  partiteCategoria.forEach(partita => {
    if (partita.giornata !== giornataCorrente) {
      giornataCorrente = partita.giornata;
      const intestazione = document.createElement("h2");
      intestazione.className = "giornata-heading";
      intestazione.textContent = `Giornata ${giornataCorrente}`;
      container.appendChild(intestazione);
    }
    container.appendChild(creaCardPartita(partita));
  });
}

/* =========================================================
   TABELLONE DATA/ORA + NAV ATTIVA (identico alla home)
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
   INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  aggiornaTabellone();
  setInterval(aggiornaTabellone, 30 * 1000);

  const anno = document.getElementById("anno-corrente");
  if (anno) anno.textContent = new Date().getFullYear();

  caricaDati();
});
