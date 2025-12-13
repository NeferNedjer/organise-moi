// ============================================
// TO-DO LIST - Organise-Moi
// ============================================

// Éléments DOM
const taskInput = document.getElementById('taskInput');
const addButton = document.getElementById('addButton');
const tasksList = document.getElementById('tasksList');
const clearCompletedButton = document.getElementById('clearCompletedButton');
const uncheckAllButton = document.getElementById('uncheckAllButton');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');
const tasksCounter = document.getElementById('tasksCounter');

// État
let tasks = [];
let currentFilter = 'all';

// ============================================
// LOCALSTORAGE
// ============================================

// Charger les tâches depuis localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('todoTasks');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
            // Migration : ajouter 'important' si manquant
            tasks = tasks.map(task => ({
                ...task,
                important: task.important !== undefined ? task.important : false
            }));
            saveTasks();
        } catch (e) {
            tasks = [];
        }
    }
    renderTasks();
}

// Sauvegarder les tâches dans localStorage
function saveTasks() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

// ============================================
// GESTION DES TÂCHES
// ============================================

// Ajouter une tâche
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') return;

    tasks.push({
        id: Date.now(),
        text: taskText,
        completed: false,
        important: false
    });

    taskInput.value = '';
    saveTasks();
    renderTasks();
}

// Toggle complétion d'une tâche
function toggleTask(id) {
    const numId = typeof id === 'string' ? parseFloat(id) : id;
    const task = tasks.find(t => t.id === numId || t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// Toggle importance d'une tâche
function toggleImportant(id) {
    const numId = typeof id === 'string' ? parseFloat(id) : id;
    const task = tasks.find(t => t.id === numId || t.id === id);
    if (task) {
        task.important = !task.important;
        saveTasks();
        renderTasks();
    }
}

// Supprimer une tâche
function deleteTask(id) {
    const numId = typeof id === 'string' ? parseFloat(id) : id;
    tasks = tasks.filter(t => t.id !== numId && t.id !== id);
    saveTasks();
    renderTasks();
}

// ============================================
// ACTIONS GLOBALES
// ============================================

// Effacer les tâches terminées
function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;
    
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
}

// Tout décocher
function uncheckAll() {
    const checkedCount = tasks.filter(t => t.completed).length;
    if (checkedCount === 0) return;
    
    tasks.forEach(task => {
        task.completed = false;
    });
    saveTasks();
    renderTasks();
}

// ============================================
// FILTRAGE
// ============================================

// Filtrer les tâches
function filterTasks(filter) {
    currentFilter = filter;
    filterButtons.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderTasks();
}

// Obtenir les tâches filtrées
function getFilteredTasks() {
    switch(currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

// ============================================
// COMPTEUR
// ============================================

// Mettre à jour le compteur
function updateCounter() {
    const filteredTasks = getFilteredTasks();
    const total = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    
    let counterText = '';
    
    switch(currentFilter) {
        case 'active':
            counterText = `${filteredTasks.length} tâche${filteredTasks.length > 1 ? 's' : ''} active${filteredTasks.length > 1 ? 's' : ''}`;
            break;
        case 'completed':
            counterText = `${filteredTasks.length} tâche${filteredTasks.length > 1 ? 's' : ''} terminée${filteredTasks.length > 1 ? 's' : ''}`;
            break;
        default:
            counterText = `${active} tâche${active > 1 ? 's' : ''} active${active > 1 ? 's' : ''} / ${total} au total`;
    }
    
    tasksCounter.textContent = counterText;
}

// ============================================
// RENDU
// ============================================

// Afficher les tâches
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    updateCounter();
    
    // Afficher le message "Tout est fait !" si toutes les tâches sont complétées
    if (tasks.length > 0 && tasks.every(t => t.completed) && currentFilter === 'all') {
        emptyState.style.display = 'flex';
        tasksList.innerHTML = '';
    } else if (filteredTasks.length === 0) {
        emptyState.style.display = 'flex';
        tasksList.innerHTML = '';
    } else {
        emptyState.style.display = 'none';
        tasksList.innerHTML = filteredTasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''} ${task.important ? 'important' : ''}">
                <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${task.completed ? 'checked' : ''} />
                <button class="task-important" data-task-id="${task.id}" title="${task.important ? 'Marquer comme non importante' : 'Marquer comme importante'}" aria-label="Importance">
                    ${task.important ? '⭐' : '☆'}
                </button>
                <span class="task-text">${escapeHtml(task.text)}</span>
                <button class="task-delete" data-task-id="${task.id}" title="Supprimer">×</button>
            </li>
        `).join('');
        
        // Attacher les event listeners après le rendu
        attachTaskEventListeners();
    }
}

// Attacher les event listeners aux tâches
function attachTaskEventListeners() {
    // Checkboxes
    tasksList.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const id = parseFloat(this.dataset.taskId);
            toggleTask(id);
        });
    });
    
    // Boutons importance
    tasksList.querySelectorAll('.task-important').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseFloat(this.dataset.taskId);
            toggleImportant(id);
        });
    });
    
    // Boutons de suppression
    tasksList.querySelectorAll('.task-delete').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseFloat(this.dataset.taskId);
            deleteTask(id);
        });
    });
}

// ============================================
// UTILITAIRES
// ============================================

// Échapper le HTML pour éviter les injections
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EVENT LISTENERS
// ============================================

addButton.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

clearCompletedButton.addEventListener('click', clearCompleted);
uncheckAllButton.addEventListener('click', uncheckAll);

// Filtres
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterTasks(btn.dataset.filter);
    });
});

// ============================================
// INITIALISATION
// ============================================

loadTasks();
