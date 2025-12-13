/***************************************************
 * PLANNING DE LA SEMAINE – Organise-Moi
 * Stockage local uniquement (localStorage)
 ***************************************************/

let currentWeekStart = getMonday(new Date());
let planningData = loadData();

const days = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche"
];

const calendarGrid = document.getElementById("calendarGrid");
const dateRangeEl = document.getElementById("dateRange");

/* =========================
   OUTILS DATE
========================= */

// Retourne le lundi de la semaine donnée
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Clé YYYY-MM-DD
function getDateKey(date) {
  return date.toISOString().split("T")[0];
}

// Libellé semaine
function getWeekLabel(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const f1 = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
  const f2 = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return `${f1.format(start)} – ${f2.format(end)}`;
}

/* =========================
   STOCKAGE
========================= */

function loadData() {
  return JSON.parse(localStorage.getItem("planning_semaine")) || {};
}

function saveData() {
  localStorage.setItem("planning_semaine", JSON.stringify(planningData));
}

/* =========================
   RENDU
========================= */

function render() {
  calendarGrid.innerHTML = "";
  dateRangeEl.textContent = getWeekLabel(currentWeekStart);

  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);

    const dateKey = getDateKey(date);
    const events = planningData[dateKey] || [];

    const column = document.createElement("div");
    column.className = "day-column";

    column.innerHTML = `
      <div class="day-header">
        ${days[i]} ${date.getDate()}
      </div>
      <div class="day-events"></div>
    `;

    const eventsContainer = column.querySelector(".day-events");

    // Trier les événements par heure (chronologique) avec leur index original
    const eventsWithIndex = events.map((event, index) => ({ event, originalIndex: index }));
    const sortedEvents = eventsWithIndex.sort((a, b) => {
      return convertToMinutes(a.event.time) - convertToMinutes(b.event.time);
    });

    sortedEvents.forEach(({ event, originalIndex }) => {
        const eventEl = document.createElement("div");
        eventEl.className = "event";
        // Utiliser l'index original pour identifier l'événement
        eventEl.innerHTML = `
          <div class="event-time">${escapeHtml(event.time)}</div>
          <div class="event-text">${escapeHtml(event.text)}</div>
          <button class="event-delete" data-date="${dateKey}" data-index="${originalIndex}" title="Supprimer">×</button>
        `;
        
        // Ajouter l'event listener pour la suppression
        const deleteBtn = eventEl.querySelector('.event-delete');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteEvent(dateKey, originalIndex);
        });
        
        eventsContainer.appendChild(eventEl);
      });

    // Clic dans la zone vide de la colonne = ajout
    eventsContainer.addEventListener("click", (e) => {
      // Ne pas déclencher l'ajout si on clique sur un événement
      if (e.target.classList.contains('event') || e.target.closest('.event')) {
        return;
      }
      addEvent(dateKey);
    });

    calendarGrid.appendChild(column);
  }
}

/* =========================
   CONVERSION HEURE
========================= */

// Convertir une heure en minutes pour le tri (gère plusieurs formats)
function convertToMinutes(timeStr) {
  if (!timeStr) return 0;
  
  // Nettoyer la chaîne
  let cleaned = timeStr.trim().toLowerCase();
  
  // Supprimer "h" ou ":" et extraire heures et minutes
  let hours = 0;
  let minutes = 0;
  
  // Format "14:00" ou "14h00" ou "9:00" ou "9h00"
  const match = cleaned.match(/(\d{1,2})[h:](\d{2})/);
  if (match) {
    hours = parseInt(match[1]);
    minutes = parseInt(match[2]);
  } else {
    // Format "14" ou "9" (juste l'heure)
    const hourMatch = cleaned.match(/(\d{1,2})/);
    if (hourMatch) {
      hours = parseInt(hourMatch[1]);
    }
  }
  
  return hours * 60 + minutes;
}

/* =========================
   AJOUT D'ÉVÉNEMENT (V1)
========================= */

function addEvent(dateKey) {
  const time = prompt("Heure (ex : 14:00 ou 9h00)");
  if (!time) return;

  const text = prompt("Description");
  if (!text) return;

  planningData[dateKey] ||= [];
  planningData[dateKey].push({ time, text });

  saveData();
  render();
}

/* =========================
   SUPPRESSION D'ÉVÉNEMENT
========================= */

function deleteEvent(dateKey, index) {
  if (!planningData[dateKey] || index < 0 || index >= planningData[dateKey].length) return;
  
  if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
    planningData[dateKey].splice(index, 1);
    
    // Supprimer la clé si plus d'événements
    if (planningData[dateKey].length === 0) {
      delete planningData[dateKey];
    }
    
    saveData();
    render();
  }
}

/* =========================
   ACTIONS
========================= */

document.getElementById("prevWeek").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  render();
});

document.getElementById("nextWeek").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  render();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("Supprimer tous les événements ?")) {
    planningData = {};
    saveData();
    render();
  }
});

document.getElementById("printBtn").addEventListener("click", () => {
  window.print();
});

/* =========================
   SÉCURITÉ
========================= */

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Exposer la fonction globalement
window.deleteEvent = deleteEvent;

/* =========================
   INIT
========================= */

render();
