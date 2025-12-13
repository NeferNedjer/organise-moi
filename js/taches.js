const taskInput = document.getElementById('taskInput');
const personInput = document.getElementById('personInput');
const frequencyInput = document.getElementById('frequencyInput');
const addButton = document.getElementById('addButton');
const tachesList = document.getElementById('tachesList');
const clearCompletedButton = document.getElementById('clearCompletedButton');
const resetWeekButton = document.getElementById('resetWeekButton');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');
const personFilter = document.getElementById('personFilter');
const peopleList = document.getElementById('peopleList');

let taches = [];
let currentFilter = 'all';
let currentPersonFilter = 'all';

// Charger les personnes depuis localStorage
function loadPeople() {
    const savedPeople = localStorage.getItem('household_people');
    if (savedPeople) {
        const people = JSON.parse(savedPeople);
        updatePeopleList(people);
        updatePersonFilter(people);
        return people;
    }
    return [];
}

// Sauvegarder les personnes dans localStorage
function savePeople(people) {
    localStorage.setItem('household_people', JSON.stringify(people));
}

// Normaliser un nom (trim + capitalisation)
function normalizeName(name) {
    return name.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Ajouter une personne si elle n'existe pas déjà
function addPersonIfNeeded(name) {
    const normalizedName = normalizeName(name);
    if (!normalizedName) return normalizedName;
    
    let people = loadPeople();
    if (!people.includes(normalizedName)) {
        people.push(normalizedName);
        people.sort();
        savePeople(people);
        updatePeopleList(people);
        updatePersonFilter(people);
    }
    return normalizedName;
}

// Mettre à jour la liste des personnes dans le datalist
function updatePeopleList(people) {
    peopleList.innerHTML = people.map(person => 
        `<option value="${escapeHtml(person)}">`
    ).join('');
}

// Mettre à jour le filtre par personne
function updatePersonFilter(people) {
    const currentValue = personFilter.value;
    personFilter.innerHTML = '<option value="all">Toutes les personnes</option>' +
        people.map(person => 
            `<option value="${escapeHtml(person)}">${escapeHtml(person)}</option>`
        ).join('');
    
    // Restaurer la sélection si elle existe toujours
    if (people.includes(currentValue)) {
        personFilter.value = currentValue;
    }
}

// Charger les tâches depuis localStorage
function loadTaches() {
    const savedTaches = localStorage.getItem('tachesMenageres');
    if (savedTaches) {
        taches = JSON.parse(savedTaches);
        // Migration : ajouter la fréquence si absente
        taches = taches.map(tache => {
            if (!tache.frequency) {
                tache.frequency = 'once';
            }
            // Migration : normaliser les noms des personnes existantes
            if (tache.person) {
                const normalizedName = normalizeName(tache.person);
                if (normalizedName) {
                    addPersonIfNeeded(normalizedName);
                    tache.person = normalizedName;
                }
            }
            return tache;
        });
        saveTaches();
    }
    // Charger les personnes après migration
    loadPeople();
    renderTaches();
}

// Sauvegarder les tâches dans localStorage
function saveTaches() {
    localStorage.setItem('tachesMenageres', JSON.stringify(taches));
}

// Obtenir le libellé de fréquence
function getFrequencyLabel(frequency) {
    const labels = {
        'daily': 'Quotidien',
        'weekly': 'Hebdomadaire',
        'monthly': 'Mensuel',
        'once': 'Ponctuel'
    };
    return labels[frequency] || 'Ponctuel';
}

// Ajouter une tâche
function addTache() {
    const taskText = taskInput.value.trim();
    const personText = personInput.value.trim();
    const frequency = frequencyInput.value || 'once';
    
    if (taskText === '' || personText === '') {
        alert('Veuillez remplir les deux champs.');
        return;
    }

    // Normaliser le nom de la personne et l'ajouter à la liste si nécessaire
    const normalizedPerson = addPersonIfNeeded(personText);

    taches.push({
        id: Date.now(),
        task: taskText,
        person: normalizedPerson,
        completed: false,
        frequency: frequency
    });

    taskInput.value = '';
    personInput.value = '';
    frequencyInput.value = 'weekly'; // Réinitialiser à hebdomadaire par défaut
    saveTaches();
    renderTaches();
}

// Toggle complétion d'une tâche
function toggleTache(id) {
    const tache = taches.find(t => t.id === id);
    if (tache) {
        tache.completed = !tache.completed;
        saveTaches();
        renderTaches();
    }
}

// Supprimer une tâche
function deleteTache(id) {
    taches = taches.filter(t => t.id !== id);
    saveTaches();
    renderTaches();
}

// Effacer les tâches terminées
function clearCompleted() {
    const completedCount = taches.filter(t => t.completed).length;
    if (completedCount === 0) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${completedCount} tâche(s) terminée(s) ?`)) {
        taches = taches.filter(t => !t.completed);
        saveTaches();
        renderTaches();
    }
}

// Réinitialiser la semaine (remettre toutes les tâches à non complétées)
function resetWeek() {
    const activeCount = taches.filter(t => !t.completed).length;
    const completedCount = taches.filter(t => t.completed).length;
    
    if (completedCount === 0) {
        alert('Aucune tâche terminée à réinitialiser.');
        return;
    }
    
    if (confirm(`Réinitialiser la semaine ? Toutes les tâches terminées (${completedCount}) seront remises à "À faire".`)) {
        taches.forEach(tache => {
            tache.completed = false;
        });
        saveTaches();
        renderTaches();
    }
}

// Filtrer les tâches par statut
function filterTaches(filter) {
    currentFilter = filter;
    filterButtons.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderTaches();
}

// Filtrer les tâches par personne
function filterByPerson(person) {
    currentPersonFilter = person;
    renderTaches();
}

// Obtenir les tâches filtrées
function getFilteredTaches() {
    let filtered = taches;
    
    // Filtre par statut
    switch(currentFilter) {
        case 'active':
            filtered = filtered.filter(t => !t.completed);
            break;
        case 'completed':
            filtered = filtered.filter(t => t.completed);
            break;
        default:
            // 'all' - pas de filtre
            break;
    }
    
    // Filtre par personne
    if (currentPersonFilter !== 'all') {
        filtered = filtered.filter(t => t.person === currentPersonFilter);
    }
    
    return filtered;
}

// Obtenir toutes les personnes des tâches actuelles
function getAllPeopleFromTaches() {
    const peopleSet = new Set();
    taches.forEach(tache => {
        if (tache.person) {
            peopleSet.add(tache.person);
        }
    });
    return Array.from(peopleSet).sort();
}

// Afficher les tâches
function renderTaches() {
    const filteredTaches = getFilteredTaches();
    const allCompleted = taches.length > 0 && taches.every(t => t.completed);
    
    // Mettre à jour la liste des personnes dans le filtre avec celles des tâches
    const peopleFromTaches = getAllPeopleFromTaches();
    const savedPeople = loadPeople();
    const allPeople = [...new Set([...savedPeople, ...peopleFromTaches])].sort();
    if (allPeople.length > 0) {
        updatePersonFilter(allPeople);
    }
    
    if (allCompleted && currentFilter === 'all' && currentPersonFilter === 'all') {
        emptyState.style.display = 'flex';
        tachesList.innerHTML = '';
    } else if (filteredTaches.length === 0) {
        emptyState.style.display = 'flex';
        tachesList.innerHTML = '';
    } else {
        emptyState.style.display = 'none';
        tachesList.innerHTML = filteredTaches.map(tache => `
            <li class="tache-item ${tache.completed ? 'completed' : ''}">
                <input type="checkbox" class="tache-checkbox" ${tache.completed ? 'checked' : ''} 
                       onchange="toggleTache(${tache.id})" />
                <div class="tache-content">
                    <span class="tache-text">${escapeHtml(tache.task)}</span>
                    <div class="tache-meta">
                        <span class="tache-person">Responsable : ${escapeHtml(tache.person)}</span>
                        <span class="tache-frequency">${escapeHtml(getFrequencyLabel(tache.frequency))}</span>
                    </div>
                </div>
                <button class="tache-delete" onclick="deleteTache(${tache.id})" title="Supprimer">×</button>
            </li>
        `).join('');
    }
}

// Échapper le HTML pour éviter les injections
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exposer les fonctions globalement pour les onclick
window.toggleTache = toggleTache;
window.deleteTache = deleteTache;

// Event listeners
addButton.addEventListener('click', addTache);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        personInput.focus();
    }
});
personInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        frequencyInput.focus();
    }
});
frequencyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTache();
    }
});
clearCompletedButton.addEventListener('click', clearCompleted);
resetWeekButton.addEventListener('click', resetWeek);

// Filtres par statut
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterTaches(btn.dataset.filter);
    });
});

// Filtre par personne
personFilter.addEventListener('change', (e) => {
    filterByPerson(e.target.value);
});

// Charger au démarrage
loadTaches();
