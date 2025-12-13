const checklistItemsContainer = document.getElementById('checklistItems');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const resetButton = document.getElementById('resetButton');
const newTaskInput = document.getElementById('newTaskInput');
const addTaskButton = document.getElementById('addTaskButton');

let items = [];
let hasTriggeredConfetti = false;

// Charger checklist
function loadChecklist() {
  const saved = localStorage.getItem(`checklist_${checklistType}`);

  if (saved) {
    items = JSON.parse(saved);
  } else {
    items = checklistItems.map(text => ({
      text,
      done: false
    }));
  }

  renderChecklist();
  updateProgress();
}

// Sauvegarder
function saveChecklist() {
  localStorage.setItem(
    `checklist_${checklistType}`,
    JSON.stringify(items)
  );
}

// Toggle checkbox
function toggleItem(index) {
  items[index].done = !items[index].done;
  saveChecklist();
  renderChecklist();
  updateProgress();
}

// Ajouter tâche personnalisée
addTaskButton.addEventListener('click', () => {
  const value = newTaskInput.value.trim();
  if (!value) return;

  items.push({ text: value, done: false });
  newTaskInput.value = '';
  saveChecklist();
  renderChecklist();
  updateProgress();
});

// Reset
resetButton.addEventListener('click', () => {
  if (!items.length) return;

  if (confirm("Réinitialiser toute la checklist ?")) {
    items = checklistItems.map(text => ({
      text,
      done: false
    }));
    saveChecklist();
    renderChecklist();
    hasTriggeredConfetti = false; // Réinitialiser le flag
    updateProgress();
  }
});

// Rendu
function renderChecklist() {
  checklistItemsContainer.innerHTML = items.map((item, index) => `
    <div class="checklist-item ${item.done ? 'completed' : ''}">
      <input
        type="checkbox"
        ${item.done ? 'checked' : ''}
        onchange="toggleItem(${index})"
      />
      <span class="checklist-text">${escapeHtml(item.text)}</span>
    </div>
  `).join('');
}

// Animation confettis
function createConfetti() {
  const confettiCount = 30;
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#a855f7', '#eab308', '#22c55e'];
  const container = document.body;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
    confetti.style.setProperty('--drift', (Math.random() * 200 - 100) + 'px');
    confetti.style.animation = 'confetti-fall ' + confetti.style.animationDuration + ' linear ' + confetti.style.animationDelay + ' forwards';
    container.appendChild(confetti);
    
    // Supprimer après l'animation
    setTimeout(() => {
      confetti.remove();
    }, 5000);
  }
}

// Progression
function updateProgress() {
  const total = items.length;
  const completed = items.filter(i => i.done).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  progressText.textContent = `${percentage}%`;
  progressFill.style.width = `${percentage}%`;
  
  // Changer la couleur en vert à 100%
  if (percentage === 100) {
    progressFill.classList.add('complete');
    
    // Lancer les confettis une seule fois quand on atteint 100%
    if (!hasTriggeredConfetti) {
      hasTriggeredConfetti = true;
      createConfetti();
    }
  } else {
    progressFill.classList.remove('complete');
    // Réinitialiser le flag si on redescend sous 100%
    hasTriggeredConfetti = false;
  }
}

// Sécurité HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.toggleItem = toggleItem;
loadChecklist();
