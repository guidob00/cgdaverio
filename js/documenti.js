/* =========================================================
   PARSER CSV MINIMALE (uguale alle altre pagine)
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
   ICONA DOCUMENTO (PDF), riusata per ogni card
   ========================================================= */
const ICONA_DOCUMENTO_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
    <path d="M14 3v5h5"/>
    <path d="M9 13h6M9 17h6"/>
  </svg>
`;

/* =========================================================
   CARICAMENTO + RENDER
   ========================================================= */
async function caricaDocumenti() {
  const container = document.getElementById("documents-container");
  if (!container) return;

  try {
    const testo = await fetch("data/documenti.csv").then(r => {
      if (!r.ok) throw new Error("File data/documenti.csv non trovato");
      return r.text();
    });

    const documenti = parseCSV(testo);

    if (documenti.length === 0) {
      container.innerHTML = '<p class="matches-empty">Nessun documento disponibile al momento.</p>';
      return;
    }

    container.innerHTML = "";
    documenti.forEach(doc => container.appendChild(creaCardDocumento(doc)));
  } catch (errore) {
    console.error("Errore nel caricamento dei documenti:", errore);
    container.innerHTML = '<p class="matches-empty">Impossibile caricare i documenti. Riprova più tardi.</p>';
  }
}

function formattaDataBreve(isoDate) {
  if (!isoDate) return "";
  const data = new Date(isoDate + "T00:00:00");
  return data.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function creaCardDocumento(doc) {
  const card = document.createElement("article");
  card.className = "document-card";

  card.innerHTML = `
    <span class="document-icon" aria-hidden="true">${ICONA_DOCUMENTO_SVG}</span>
    <div class="document-info">
      <h2 class="document-title">${doc.nome}</h2>
      <p class="document-meta">Pubblicato il ${formattaDataBreve(doc.data)}</p>
      <div class="document-actions">
        <a class="document-btn document-btn--visualizza" href="${doc.file}" target="_blank" rel="noopener">Visualizza</a>
        <a class="document-btn document-btn--scarica" href="${doc.file}" download>Scarica</a>
      </div>
    </div>
  `;

  return card;
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

  caricaDocumenti();
});
