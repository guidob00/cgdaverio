/* =========================================================
   CONFIGURAZIONE
   Aggiungi qui una riga per ogni nuova categoria/squadra:
   basta creare il relativo file CSV in data/ con le colonne
   nome,posizione,punti,golfatti,golsubiti
   ========================================================= */
const CATEGORIE_CLASSIFICA = [
  { label: "Open", file: "data/classifica_open.csv" },
  { label: "Under 12", file: "data/classifica_u12.csv" }
];

const NOME_NOSTRA_SQUADRA = "C.G. Daverio";

/* =========================================================
   PARSER CSV MINIMALE (uguale a quello del calendario)
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
let categoriaAttiva = CATEGORIE_CLASSIFICA[0]?.label || null;
const cacheClassifiche = {}; // label -> righe già caricate/parse-ate

/* =========================================================
   CARICAMENTO + RENDER
   ========================================================= */
async function caricaClassifica(label) {
  const container = document.getElementById("standings-container");
  if (!container) return;

  container.innerHTML = '<p class="matches-loading">Caricamento classifica&hellip;</p>';

  try {
    let righe = cacheClassifiche[label];

    if (!righe) {
      const config = CATEGORIE_CLASSIFICA.find(c => c.label === label);
      if (!config) throw new Error(`Categoria "${label}" non configurata`);

      const testo = await fetch(config.file).then(r => {
        if (!r.ok) throw new Error(`File non trovato: ${config.file}`);
        return r.text();
      });

      righe = parseCSV(testo).map(r => ({
        nome: r.nome,
        posizione: Number(r.posizione),
        punti: Number(r.punti),
        golfatti: Number(r.golfatti),
        golsubiti: Number(r.golsubiti)
      }));

      cacheClassifiche[label] = righe;
    }

    renderClassifica(label, righe);
  } catch (errore) {
    console.error("Errore nel caricamento della classifica:", errore);
    container.innerHTML = '<p class="matches-empty">Impossibile caricare la classifica. Riprova più tardi.</p>';
  }
}

function renderClassifica(label, righe) {
  const container = document.getElementById("standings-container");
  if (!container) return;

  const righeOrdinate = righe.slice().sort((a, b) => a.posizione - b.posizione);

  const tabella = document.createElement("table");
  tabella.className = "standings-table";
  tabella.innerHTML = `
    <caption>Classifica &mdash; ${label}</caption>
    <thead>
      <tr>
        <th scope="col">Pos</th>
        <th scope="col" class="col-squadra">Squadra</th>
        <th scope="col">Pt</th>
        <th scope="col">GF</th>
        <th scope="col">GS</th>
        <th scope="col">DR</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const corpo = tabella.querySelector("tbody");

  righeOrdinate.forEach(squadra => {
    const differenzaReti = squadra.golfatti - squadra.golsubiti;
    const classeDR = differenzaReti > 0 ? "is-positive" : (differenzaReti < 0 ? "is-negative" : "");
    const segnoDR = differenzaReti > 0 ? "+" : "";
    const eNostra = squadra.nome === NOME_NOSTRA_SQUADRA;

    const riga = document.createElement("tr");
    if (eNostra) riga.className = "is-nostra-squadra";

    riga.innerHTML = `
      <td class="standings-pos">${squadra.posizione}</td>
      <td class="col-squadra"><span class="standings-team">${squadra.nome}</span></td>
      <td class="standings-pt">${squadra.punti}</td>
      <td>${squadra.golfatti}</td>
      <td>${squadra.golsubiti}</td>
      <td class="standings-dr ${classeDR}">${segnoDR}${differenzaReti}</td>
    `;

    corpo.appendChild(riga);
  });

  container.innerHTML = "";
  container.appendChild(tabella);
}

/* =========================================================
   DROPDOWN SELEZIONE SQUADRA
   ========================================================= */
function inizializzaDropdownSquadra() {
  const lista = document.getElementById("team-dropdown-list");
  const label = document.getElementById("team-dropdown-label");
  if (!lista || !label) return;

  lista.innerHTML = "";

  CATEGORIE_CLASSIFICA.forEach(categoria => {
    const voce = document.createElement("li");
    const bottone = document.createElement("button");
    bottone.type = "button";
    bottone.className = "dropdown-option" + (categoria.label === categoriaAttiva ? " is-selected" : "");
    bottone.setAttribute("role", "option");
    bottone.textContent = categoria.label;

    bottone.addEventListener("click", () => {
      label.textContent = categoria.label;
      lista.querySelectorAll(".dropdown-option").forEach(o => o.classList.remove("is-selected"));
      bottone.classList.add("is-selected");
      chiudiTuttiIDropdown();
      categoriaAttiva = categoria.label;
      caricaClassifica(categoriaAttiva);
    });

    voce.appendChild(bottone);
    lista.appendChild(voce);
  });

  label.textContent = categoriaAttiva;
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
   TABELLONE DATA/ORA (identico alle altre pagine)
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

  inizializzaDropdownSquadra();
  collegaAperturaChiusuraDropdown();
  caricaClassifica(categoriaAttiva);
});
