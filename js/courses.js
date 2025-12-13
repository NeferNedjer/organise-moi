// ============================================
// LISTE DE COURSES - Organise-Moi
// ============================================

// Éléments DOM
const itemInput = document.getElementById('itemInput');
const addButton = document.getElementById('addButton');
const itemsList = document.getElementById('itemsList');
const clearCompletedButton = document.getElementById('clearCompletedButton');
const clearAllButton = document.getElementById('clearAllButton');
const uncheckAllButton = document.getElementById('uncheckAllButton');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');
const storeModeToggle = document.getElementById('storeModeToggle');
const counter = document.getElementById('counter');
const suggestions = document.getElementById('suggestions');

// État
let items = [];
let currentFilter = 'all';
let storeMode = false;

// Catégories disponibles
const CATEGORIES = [
    'Fruits & légumes',
    'Viandes / poissons',
    'Produits laitiers',
    'Épicerie',
    'Hygiène',
    'Entretien',
    'Boissons',
    'Divers'
];

// Dictionnaire de catégorisation automatique
const CATEGORY_KEYWORDS = {
    'Fruits & légumes': ['pomme', 'banane', 'orange', 'fraise', 'tomate', 'carotte', 'salade', 'courgette', 'poivron', 'oignon', 'ail', 'citron', 'légume', 'fruit', 'avocat', 'concombre', 'champignon', 'épinard', 'brocoli'],
    'Viandes / poissons': ['viande', 'poulet', 'bœuf', 'porc', 'saumon', 'thon', 'poisson', 'steak', 'jambon', 'bacon', 'saucisse', 'crevette', 'cabillaud'],
    'Produits laitiers': ['lait', 'yaourt', 'fromage', 'beurre', 'crème', 'fromage blanc', 'ricotta', 'mozzarella', 'emmental'],
    'Épicerie': ['pâtes', 'riz', 'farine', 'sucre', 'huile', 'vinaigre', 'sel', 'poivre', 'épice', 'céréale', 'pain', 'biscuit', 'chocolat', 'conserve'],
    'Hygiène': ['savon', 'shampoing', 'dentifrice', 'brosse', 'déodorant', 'gel douche', 'papier toilette', 'serviette', 'mouchoir', 'couche'],
    'Entretien': ['lessive', 'adoucissant', 'produit vaisselle', 'éponge', 'serpillère', 'détergent', 'nettoyant', 'javel'],
    'Boissons': ['eau', 'jus', 'soda', 'café', 'thé', 'bière', 'vin', 'limonade', 'boisson'],
    'Divers': []
};

// ============================================
// MIGRATION DES DONNÉES
// ============================================

function migrateOldData() {
    // Vérifier l'ancien format (listeCourses)
    const oldData = localStorage.getItem('listeCourses');
    if (oldData) {
        try {
            const oldItems = JSON.parse(oldData);
            if (Array.isArray(oldItems) && oldItems.length > 0) {
                // Vérifier si c'est l'ancien format (strings ou objets simples)
                const firstItem = oldItems[0];
                if (typeof firstItem === 'string' || (firstItem.text && !firstItem.name)) {
                    // Migrer vers le nouveau format
                    items = oldItems.map(oldItem => {
                        const name = typeof oldItem === 'string' ? oldItem : oldItem.text;
                        const parsed = parseQuantity(name);
                        return {
                            id: oldItem.id || Date.now() + Math.random(),
                            name: parsed.name,
                            qty: parsed.qty,
                            category: detectCategory(parsed.name),
                            done: oldItem.completed || false,
                            createdAt: oldItem.createdAt || Date.now()
                        };
                    });
                    saveItems();
                    // Supprimer l'ancienne clé
                    localStorage.removeItem('listeCourses');
                } else if (firstItem.name) {
                    // Déjà au nouveau format mais peut-être sans certaines propriétés
                    items = oldItems.map(item => ({
                        id: item.id || Date.now() + Math.random(),
                        name: item.name || item.text || '',
                        qty: item.qty || 1,
                        category: item.category || detectCategory(item.name || item.text || ''),
                        done: item.done !== undefined ? item.done : (item.completed || false),
                        createdAt: item.createdAt || Date.now()
                    }));
                    saveItems();
                }
            }
        } catch (e) {
            console.error('Erreur migration:', e);
        }
    }
}

// ============================================
// LOCALSTORAGE
// ============================================

function loadItems() {
    migrateOldData();
    const savedItems = localStorage.getItem('courses_items');
    if (savedItems) {
        try {
            items = JSON.parse(savedItems);
        } catch (e) {
            items = [];
        }
    }
    renderItems();
}

function saveItems() {
    localStorage.setItem('courses_items', JSON.stringify(items));
}

function loadStoreMode() {
    const saved = localStorage.getItem('courses_store_mode');
    storeMode = saved === '1';
    updateStoreModeUI();
}

function saveStoreMode() {
    localStorage.setItem('courses_store_mode', storeMode ? '1' : '0');
}

function loadHistory() {
    const saved = localStorage.getItem('courses_history');
    return saved ? JSON.parse(saved) : [];
}

function saveHistory(history) {
    localStorage.setItem('courses_history', JSON.stringify(history));
}

// ============================================
// PARSING QUANTITÉ
// ============================================

function parseQuantity(input) {
    const trimmed = input.trim();
    
    // Patterns: "tomates x3", "tomates 3", "tomates (3)", "3 tomates"
    const patterns = [
        /^(.+?)\s*x\s*(\d+)$/i,           // "tomates x3"
        /^(.+?)\s+(\d+)$/,                // "tomates 3"
        /^(.+?)\s*\((\d+)\)$/,           // "tomates (3)"
        /^(\d+)\s+(.+)$/                  // "3 tomates"
    ];
    
    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
            if (pattern === /^(\d+)\s+(.+)$/) {
                // Format "3 tomates"
                return { name: match[2].trim(), qty: parseInt(match[1], 10) };
            } else {
                // Autres formats
                return { name: match[1].trim(), qty: parseInt(match[2], 10) };
            }
        }
    }
    
    // Pas de quantité trouvée
    return { name: trimmed, qty: 1 };
}

// ============================================
// CATÉGORISATION
// ============================================

function detectCategory(name) {
    const lowerName = name.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => lowerName.includes(keyword))) {
            return category;
        }
    }
    
    return 'Divers';
}

// ============================================
// SUGGESTIONS
// ============================================

function showSuggestions(input) {
    if (!input || input.length < 2) {
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';
        return;
    }
    
    const history = loadHistory();
    const lowerInput = input.toLowerCase();
    const matches = history
        .filter(item => item.toLowerCase().includes(lowerInput))
        .slice(0, 5);
    
    if (matches.length === 0) {
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';
        return;
    }
    
    suggestions.innerHTML = matches.map(item => 
        `<div class="suggestion-item" data-suggestion="${escapeHtml(item)}">${escapeHtml(item)}</div>`
    ).join('');
    suggestions.style.display = 'block';
    
    // Event listeners pour les suggestions
    suggestions.querySelectorAll('.suggestion-item').forEach(el => {
        el.addEventListener('click', () => {
            itemInput.value = el.dataset.suggestion;
            itemInput.focus();
            suggestions.style.display = 'none';
        });
    });
}

function hideSuggestions() {
    suggestions.style.display = 'none';
}

// ============================================
// AJOUT D'ARTICLE
// ============================================

function addItem() {
    const inputText = itemInput.value.trim();
    if (inputText === '') return;
    
    const parsed = parseQuantity(inputText);
    const newItem = {
        id: Date.now() + Math.random(),
        name: parsed.name,
        qty: parsed.qty,
        category: detectCategory(parsed.name),
        done: false,
        createdAt: Date.now()
    };
    
    items.push(newItem);
    
    // Ajouter à l'historique (sans quantité)
    const history = loadHistory();
    const nameLower = parsed.name.toLowerCase();
    if (!history.some(h => h.toLowerCase() === nameLower)) {
        history.unshift(parsed.name);
        // Garder max 50 items
        if (history.length > 50) {
            history.pop();
        }
        saveHistory(history);
    }
    
    itemInput.value = '';
    hideSuggestions();
    saveItems();
    renderItems();
}

// ============================================
// ACTIONS SUR LES ITEMS
// ============================================

function toggleItem(id) {
    // Convertir l'ID en nombre si c'est une string (depuis onclick)
    const numId = typeof id === 'string' ? parseFloat(id) : id;
    const item = items.find(i => i.id === numId || i.id === id);
    if (item) {
        item.done = !item.done;
        saveItems();
        renderItems();
    }
}

function deleteItem(id) {
    // Convertir l'ID en nombre si c'est une string (depuis onclick)
    const numId = typeof id === 'string' ? parseFloat(id) : id;
    items = items.filter(i => i.id !== numId && i.id !== id);
    saveItems();
    renderItems();
}

function changeCategory(id, newCategory) {
    // Convertir l'ID en nombre si c'est une string (depuis onclick)
    const numId = typeof id === 'string' ? parseFloat(id) : id;
    const item = items.find(i => i.id === numId || i.id === id);
    if (item) {
        item.category = newCategory;
        saveItems();
        renderItems();
    }
}

function clearCompleted() {
    const completedCount = items.filter(i => i.done).length;
    if (completedCount === 0) return;
    
    if (confirm(`Supprimer ${completedCount} article(s) acheté(s) ?`)) {
        items = items.filter(i => !i.done);
        saveItems();
        renderItems();
    }
}

function clearAll() {
    if (items.length === 0) return;
    
    if (confirm('Supprimer tous les articles ? Cette action est irréversible.')) {
        items = [];
        saveItems();
        renderItems();
    }
}

function uncheckAll() {
    const checkedCount = items.filter(i => i.done).length;
    if (checkedCount === 0) return;
    
    items.forEach(item => item.done = false);
    saveItems();
    renderItems();
}

// ============================================
// FILTRAGE
// ============================================

function filterItems(filter) {
    currentFilter = filter;
    filterButtons.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderItems();
}

function getFilteredItems() {
    let filtered = items;
    
    switch(currentFilter) {
        case 'active':
            filtered = items.filter(i => !i.done);
            break;
        case 'completed':
            filtered = items.filter(i => i.done);
            break;
    }
    
    return filtered;
}

// ============================================
// MODE MAGASIN
// ============================================

function toggleStoreMode() {
    storeMode = !storeMode;
    saveStoreMode();
    updateStoreModeUI();
    renderItems();
}

function updateStoreModeUI() {
    if (storeMode) {
        storeModeToggle.classList.add('active');
        document.body.classList.add('store-mode');
    } else {
        storeModeToggle.classList.remove('active');
        document.body.classList.remove('store-mode');
    }
}

// ============================================
// COMPTEUR
// ============================================

function updateCounter() {
    const total = items.length;
    const done = items.filter(i => i.done).length;
    counter.textContent = `Achetés : ${done} / Total : ${total}`;
}

// ============================================
// RENDU
// ============================================

function renderItems() {
    const filteredItems = getFilteredItems();
    updateCounter();
    
    if (filteredItems.length === 0) {
        emptyState.style.display = 'flex';
        itemsList.innerHTML = '';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Grouper par catégorie
    const grouped = {};
    filteredItems.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });
    
    // Trier les catégories (ordre défini)
    const sortedCategories = CATEGORIES.filter(cat => grouped[cat] && grouped[cat].length > 0);
    const otherCategories = Object.keys(grouped).filter(cat => !CATEGORIES.includes(cat));
    
    let html = '';
    
    // Afficher les catégories dans l'ordre
    sortedCategories.forEach(category => {
        html += renderCategory(category, grouped[category]);
    });
    
    // Afficher les autres catégories
    otherCategories.forEach(category => {
        html += renderCategory(category, grouped[category]);
    });
    
    itemsList.innerHTML = html;
    
    // Attacher les event listeners après le rendu
    attachItemEventListeners();
}

function attachItemEventListeners() {
    // Checkboxes
    itemsList.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const id = parseFloat(this.dataset.itemId);
            toggleItem(id);
        });
    });
    
    // Selects de catégorie
    itemsList.querySelectorAll('.item-category-select').forEach(select => {
        select.addEventListener('change', function() {
            const id = parseFloat(this.dataset.itemId);
            changeCategory(id, this.value);
        });
    });
    
    // Boutons de suppression
    itemsList.querySelectorAll('.item-delete').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseFloat(this.dataset.itemId);
            deleteItem(id);
        });
    });
}

function renderCategory(category, items) {
    let html = `<div class="category-section">
        <h3 class="category-title">${escapeHtml(category)}</h3>
        <ul class="category-items">`;
    
    items.forEach(item => {
        const qtyDisplay = item.qty > 1 ? ` × ${item.qty}` : '';
        html += `
            <li class="item-item ${item.done ? 'completed' : ''}">
                <input type="checkbox" class="item-checkbox" data-item-id="${item.id}" ${item.done ? 'checked' : ''} />
                <span class="item-text">${escapeHtml(item.name)}${qtyDisplay}</span>
                <select class="item-category-select" data-item-id="${item.id}">
                    ${CATEGORIES.map(cat => 
                        `<option value="${escapeHtml(cat)}" ${item.category === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`
                    ).join('')}
                </select>
                <button class="item-delete" data-item-id="${item.id}" title="Supprimer">×</button>
            </li>
        `;
    });
    
    html += `</ul></div>`;
    return html;
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

addButton.addEventListener('click', addItem);

itemInput.addEventListener('input', (e) => {
    showSuggestions(e.target.value);
});

itemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addItem();
    }
});

itemInput.addEventListener('blur', () => {
    // Délai pour permettre le clic sur suggestion
    setTimeout(hideSuggestions, 200);
});

clearCompletedButton.addEventListener('click', clearCompleted);
clearAllButton.addEventListener('click', clearAll);
uncheckAllButton.addEventListener('click', uncheckAll);
storeModeToggle.addEventListener('click', toggleStoreMode);

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterItems(btn.dataset.filter);
    });
});

// Les fonctions sont maintenant appelées via event listeners, pas besoin de les exposer globalement
// (gardées pour compatibilité si nécessaire)
window.toggleItem = toggleItem;
window.deleteItem = deleteItem;
window.changeCategory = changeCategory;

// ============================================
// INITIALISATION
// ============================================

loadStoreMode();
loadItems();
