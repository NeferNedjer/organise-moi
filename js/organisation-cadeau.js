// ============================================
// ORGANISATION CADEAU COLLECTIF - Organise-Moi
// ============================================

// Éléments DOM
const createEventScreen = document.getElementById('createEventScreen');
const eventScreen = document.getElementById('eventScreen');
const createEventForm = document.getElementById('createEventForm');
const eventTitleInput = document.getElementById('eventTitle');
const eventDateInput = document.getElementById('eventDate');
const eventDescriptionInput = document.getElementById('eventDescription');
const eventTitleDisplay = document.getElementById('eventTitleDisplay');
const eventDateDisplay = document.getElementById('eventDateDisplay');
const eventDescriptionDisplay = document.getElementById('eventDescriptionDisplay');
const exportButton = document.getElementById('exportButton');
const importButton = document.getElementById('importButton');
const importButtonCreate = document.getElementById('importButtonCreate');
const importFileInput = document.getElementById('importFileInput');
const importFileInputCreate = document.getElementById('importFileInputCreate');
const participantInput = document.getElementById('participantInput');
const addParticipantButton = document.getElementById('addParticipantButton');
const participantsList = document.getElementById('participantsList');
const ideaTitleInput = document.getElementById('ideaTitleInput');
const ideaPriceInput = document.getElementById('ideaPriceInput');
const ideaCommentInput = document.getElementById('ideaCommentInput');
const addIdeaButton = document.getElementById('addIdeaButton');
const ideasList = document.getElementById('ideasList');

// État
let currentEvent = null;
let currentEventId = null;

// ============================================
// INITIALISATION
// ============================================

// Vérifier si un ID d'événement est présent dans l'URL
function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (eventId) {
        loadEvent(eventId);
    } else {
        showCreateScreen();
    }
}

// ============================================
// GESTION DES ÉCRANS
// ============================================

function showCreateScreen() {
    createEventScreen.style.display = 'block';
    eventScreen.style.display = 'none';
    currentEvent = null;
    currentEventId = null;
}

function showEventScreen() {
    createEventScreen.style.display = 'none';
    eventScreen.style.display = 'block';
    updateEventDisplay();
    renderParticipants();
    renderIdeas();
}

// ============================================
// LOCALSTORAGE
// ============================================

function getStorageKey(eventId) {
    return `giftEvent_${eventId}`;
}

function saveEvent() {
    if (!currentEventId || !currentEvent) return;
    const key = getStorageKey(currentEventId);
    localStorage.setItem(key, JSON.stringify(currentEvent));
}

function loadEvent(eventId) {
    const key = getStorageKey(eventId);
    const saved = localStorage.getItem(key);
    
    if (saved) {
        try {
            currentEvent = JSON.parse(saved);
            currentEventId = eventId;
            showEventScreen();
        } catch (e) {
            console.error('Erreur lors du chargement de l\'événement:', e);
            showCreateScreen();
        }
    } else {
        showCreateScreen();
    }
}

// ============================================
// CRÉATION D'ÉVÉNEMENT
// ============================================

function createEvent() {
    const title = eventTitleInput.value.trim();
    if (!title) {
        alert('Le titre est obligatoire');
        return;
    }
    
    // Générer un ID unique
    const eventId = generateEventId();
    
    currentEvent = {
        id: eventId,
        title: title,
        date: eventDateInput.value || null,
        description: eventDescriptionInput.value.trim() || null,
        participants: [],
        ideas: []
    };
    
    currentEventId = eventId;
    saveEvent();
    
    // Mettre à jour l'URL avec l'ID
    updateURL(eventId);
    
    // Réinitialiser le formulaire
    createEventForm.reset();
    
    showEventScreen();
}

function generateEventId() {
    // Générer un ID aléatoire de 8 caractères
    return Math.random().toString(36).substring(2, 10);
}

function updateURL(eventId) {
    const newURL = new URL(window.location.href);
    newURL.searchParams.set('id', eventId);
    window.history.pushState({}, '', newURL);
}

// ============================================
// AFFICHAGE DE L'ÉVÉNEMENT
// ============================================

function updateEventDisplay() {
    if (!currentEvent) return;
    
    eventTitleDisplay.textContent = currentEvent.title;
    
    if (currentEvent.date) {
        const date = new Date(currentEvent.date);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        eventDateDisplay.textContent = formattedDate;
        eventDateDisplay.style.display = 'block';
    } else {
        eventDateDisplay.style.display = 'none';
    }
    
    if (currentEvent.description) {
        eventDescriptionDisplay.textContent = currentEvent.description;
        eventDescriptionDisplay.style.display = 'block';
    } else {
        eventDescriptionDisplay.style.display = 'none';
    }
}

// ============================================
// GESTION DES PARTICIPANTS
// ============================================

function addParticipant() {
    const name = participantInput.value.trim();
    if (!name) return;
    
    // Vérifier si le participant existe déjà
    const exists = currentEvent.participants.some(p => 
        p.name.toLowerCase() === name.toLowerCase()
    );
    
    if (exists) {
        alert('Ce participant existe déjà');
        return;
    }
    
    const participant = {
        id: `p${Date.now()}`,
        name: name
    };
    
    currentEvent.participants.push(participant);
    participantInput.value = '';
    saveEvent();
    renderParticipants();
}

function deleteParticipant(participantId) {
    if (!confirm('Supprimer ce participant ?')) return;
    
    // Supprimer le participant
    currentEvent.participants = currentEvent.participants.filter(
        p => p.id !== participantId
    );
    
    // Libérer les idées réservées par ce participant
    currentEvent.ideas.forEach(idea => {
        if (idea.reservedBy === participantId) {
            idea.reservedBy = null;
        }
    });
    
    saveEvent();
    renderParticipants();
    renderIdeas();
}

function renderParticipants() {
    if (!currentEvent) return;
    
    if (currentEvent.participants.length === 0) {
        participantsList.innerHTML = '<li class="empty-state">Aucun participant pour le moment</li>';
        return;
    }
    
    participantsList.innerHTML = currentEvent.participants.map(participant => `
        <li class="list-item participant-item">
            <div class="list-item-content">
                <span class="list-item-text participant-name">${escapeHtml(participant.name)}</span>
            </div>
            <div class="list-item-actions">
                <button class="list-item-delete" data-participant-id="${participant.id}" title="Supprimer">×</button>
            </div>
        </li>
    `).join('');
    
    // Attacher les event listeners
    participantsList.querySelectorAll('.list-item-delete').forEach(button => {
        button.addEventListener('click', () => {
            const participantId = button.dataset.participantId;
            deleteParticipant(participantId);
        });
    });
}

// ============================================
// GESTION DES IDÉES
// ============================================

function addIdea() {
    const title = ideaTitleInput.value.trim();
    if (!title) {
        alert('Le nom du cadeau est obligatoire');
        return;
    }
    
    const price = ideaPriceInput.value ? parseFloat(ideaPriceInput.value) : null;
    const comment = ideaCommentInput.value.trim() || null;
    
    const idea = {
        id: `i${Date.now()}`,
        title: title,
        comment: comment,
        price: price,
        reservedBy: null
    };
    
    currentEvent.ideas.push(idea);
    
    // Réinitialiser le formulaire
    ideaTitleInput.value = '';
    ideaPriceInput.value = '';
    ideaCommentInput.value = '';
    
    saveEvent();
    renderIdeas();
}

function deleteIdea(ideaId) {
    if (!confirm('Supprimer cette idée ?')) return;
    
    currentEvent.ideas = currentEvent.ideas.filter(i => i.id !== ideaId);
    saveEvent();
    renderIdeas();
}

function reserveIdea(ideaId) {
    if (!currentEvent.participants.length) {
        alert('Ajoutez d\'abord au moins un participant');
        return;
    }
    
    const idea = currentEvent.ideas.find(i => i.id === ideaId);
    if (!idea) return;
    
    if (idea.reservedBy) {
        // Libérer la réservation
        idea.reservedBy = null;
    } else {
        // Demander quel participant réserve
        const participantNames = currentEvent.participants.map(p => p.name);
        const participantName = prompt(
            `Qui s'occupe de ce cadeau ?\n\nParticipants: ${participantNames.join(', ')}`
        );
        
        if (!participantName) return;
        
        const participant = currentEvent.participants.find(
            p => p.name.toLowerCase() === participantName.trim().toLowerCase()
        );
        
        if (!participant) {
            alert('Participant non trouvé. Utilisez exactement le nom affiché.');
            return;
        }
        
        // Vérifier si ce participant a déjà réservé une autre idée
        const alreadyReserved = currentEvent.ideas.some(
            i => i.id !== ideaId && i.reservedBy === participant.id
        );
        
        if (alreadyReserved) {
            if (!confirm(`${participant.name} a déjà réservé un cadeau. Continuer quand même ?`)) {
                return;
            }
        }
        
        idea.reservedBy = participant.id;
    }
    
    saveEvent();
    renderIdeas();
}

function renderIdeas() {
    if (!currentEvent) return;
    
    if (currentEvent.ideas.length === 0) {
        ideasList.innerHTML = '<li class="empty-state">Aucune idée de cadeau pour le moment</li>';
        return;
    }
    
    ideasList.innerHTML = currentEvent.ideas.map(idea => {
        const reservedBy = idea.reservedBy 
            ? currentEvent.participants.find(p => p.id === idea.reservedBy)
            : null;
        
        const reservedClass = idea.reservedBy ? 'reserved' : '';
        const priceDisplay = idea.price ? `${idea.price.toFixed(2)} €` : '';
        
        return `
            <li class="idea-item ${reservedClass}">
                <div class="idea-header">
                    <span class="idea-title">${escapeHtml(idea.title)}</span>
                    ${priceDisplay ? `<span class="idea-price">${priceDisplay}</span>` : ''}
                </div>
                ${idea.comment ? `<div class="idea-comment">${escapeHtml(idea.comment)}</div>` : ''}
                <div class="idea-footer">
                    ${reservedBy 
                        ? `<div class="idea-reserved">
                            <span class="idea-reserved-icon">✓</span>
                            <span>Pris par ${escapeHtml(reservedBy.name)}</span>
                           </div>`
                        : '<div></div>'
                    }
                    <div class="idea-actions">
                        <button class="idea-reserve-button" data-idea-id="${idea.id}">
                            ${idea.reservedBy ? 'Libérer' : 'Je m\'en occupe'}
                        </button>
                        <button class="list-item-delete" data-idea-id="${idea.id}" title="Supprimer">×</button>
                    </div>
                </div>
            </li>
        `;
    }).join('');
    
    // Attacher les event listeners
    ideasList.querySelectorAll('.idea-reserve-button').forEach(button => {
        button.addEventListener('click', () => {
            const ideaId = button.dataset.ideaId;
            reserveIdea(ideaId);
        });
    });
    
    ideasList.querySelectorAll('.list-item-delete').forEach(button => {
        button.addEventListener('click', () => {
            const ideaId = button.dataset.ideaId;
            deleteIdea(ideaId);
        });
    });
}

// ============================================
// EXPORT / IMPORT
// ============================================

function exportEvent() {
    if (!currentEvent) return;
    
    const json = JSON.stringify(currentEvent, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evenement-cadeau-${currentEvent.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importEvent() {
    importFileInput.click();
}

function importEventCreate() {
    importFileInputCreate.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedEvent = JSON.parse(e.target.result);
            
            // Valider la structure
            if (!importedEvent.id || !importedEvent.title) {
                alert('Format de fichier invalide');
                return;
            }
            
            // Adapter le message selon le contexte
            const isCreating = !currentEvent;
            const confirmMessage = isCreating 
                ? `Importer l'événement "${importedEvent.title}" ?`
                : `Importer l'événement "${importedEvent.title}" ? Cela remplacera l'événement actuel.`;
            
            // Demander confirmation
            if (!confirm(confirmMessage)) {
                return;
            }
            
            currentEvent = importedEvent;
            currentEventId = importedEvent.id;
            saveEvent();
            updateURL(currentEventId);
            showEventScreen();
            
            alert('Événement importé avec succès !');
        } catch (err) {
            console.error('Erreur lors de l\'import:', err);
            alert('Erreur lors de l\'import du fichier');
        }
    };
    reader.readAsText(file);
    
    // Réinitialiser l'input pour permettre de réimporter le même fichier
    event.target.value = '';
}

// ============================================
// UTILITAIRES
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EVENT LISTENERS
// ============================================

createEventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    createEvent();
});

addParticipantButton.addEventListener('click', addParticipant);
participantInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addParticipant();
    }
});

addIdeaButton.addEventListener('click', addIdea);
ideaTitleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addIdea();
    }
});

exportButton.addEventListener('click', exportEvent);
importButton.addEventListener('click', importEvent);
if (importButtonCreate) {
    importButtonCreate.addEventListener('click', importEventCreate);
}
importFileInput.addEventListener('change', handleFileImport);
if (importFileInputCreate) {
    importFileInputCreate.addEventListener('change', handleFileImport);
}

// Gérer les changements d'URL (retour en arrière)
window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (eventId) {
        loadEvent(eventId);
    } else {
        showCreateScreen();
    }
});

// ============================================
// LANCEMENT
// ============================================

init();
