// Global State Management
let state = {
  wage: parseFloat(localStorage.getItem('ps_wage')) || 20.0,
  totalSaved: parseFloat(localStorage.getItem('ps_totalSaved')) || 0.0,
  streak: parseInt(localStorage.getItem('ps_streak')) || 0,
  items: JSON.parse(localStorage.getItem('ps_items')) || [],
  history: JSON.parse(localStorage.getItem('ps_history')) || []
};

// DOM Selectors
const wageDisplay = document.getElementById('wageDisplay');
const totalSavedDisplay = document.getElementById('totalSavedDisplay');
const activeCountDisplay = document.getElementById('activeCountDisplay');
const streakDisplay = document.getElementById('streakDisplay');
const workPreview = document.getElementById('workPreview');
const itemForm = document.getElementById('itemForm');
const itemPriceInput = document.getElementById('itemPrice');
const itemsContainer = document.getElementById('itemsContainer');
const historyContainer = document.getElementById('historyContainer');
const listBadge = document.getElementById('listBadge');

// Initialization
function init() {
  updateDashboardUI();
  renderItems();
  renderHistory();
  
  // Real-time ticker: Updates countdowns and progress bars every second
  setInterval(renderItems, 1000);
}

// Update Header & Dashboard Totals
function updateDashboardUI() {
  wageDisplay.textContent = state.wage.toFixed(2);
  totalSavedDisplay.textContent = state.totalSaved.toFixed(2);
  activeCountDisplay.textContent = state.items.length;
  streakDisplay.textContent = state.streak;
  listBadge.textContent = `${state.items.length} Active`;
}

// Edit Wage Action
document.getElementById('editWageBtn').addEventListener('click', () => {
  const input = prompt("Enter your hourly wage ($):", state.wage);
  if (input && !isNaN(input) && parseFloat(input) > 0) {
    state.wage = parseFloat(input);
    localStorage.setItem('ps_wage', state.wage);
    updateDashboardUI();
    updateWorkPreview();
  }
});

// Live Preview Hours of Work Equivalent on input change
itemPriceInput.addEventListener('input', updateWorkPreview);

function updateWorkPreview() {
  const price = parseFloat(itemPriceInput.value) || 0;
  const hours = (price / state.wage).toFixed(1);
  workPreview.innerHTML = `<i class="fa-solid fa-briefcase"></i> Costs roughly <strong>${hours} hours</strong> of work`;
}

// Form Submission: Add Item
itemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('itemName').value;
  const price = parseFloat(document.getElementById('itemPrice').value);
  const days = parseInt(document.getElementById('itemDays').value);

  const now = new Date();
  const unlockTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const newItem = {
    id: Date.now(),
    name,
    price,
    createdAt: now.toISOString(),
    unlockTime: unlockTime.toISOString(),
    totalDurationMs: days * 24 * 60 * 60 * 1000
  };

  state.items.push(newItem);
  saveState('ps_items', state.items);
  
  itemForm.reset();
  updateWorkPreview();
  updateDashboardUI();
  renderItems();
});

// Calculate Time Remaining and Percentage Progress
function getTimerData(item) {
  const now = new Date().getTime();
  const unlock = new Date(item.unlockTime).getTime();
  const created = new Date(item.createdAt).getTime();

  const totalTime = unlock - created;
  const remainingTime = unlock - now;

  if (remainingTime <= 0) {
    return { expired: true, text: "Cooling period complete!", percent: 100 };
  }

  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

  const elapsed = totalTime - remainingTime;
  const percent = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));

  let timeText = `${seconds}s`;
  if (minutes > 0 || hours > 0 || days > 0) timeText = `${minutes}m ${seconds}s`;
  if (hours > 0 || days > 0) timeText = `${hours}h ${minutes}m`;
  if (days > 0) timeText = `${days}d ${hours}h`;

  return { expired: false, text: `${timeText} left`, percent };
}

// Render Active Items List
function renderItems() {
  if (state.items.length === 0) {
    itemsContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary); padding: 30px 0;">
        <i class="fa-solid fa-shield-halved" style="font-size: 2rem; margin-bottom: 8px;"></i>
        <p>No active cooldowns. Enter an item above to resist impulse buys!</p>
      </div>`;
    return;
  }

  itemsContainer.innerHTML = '';

  state.items.forEach(item => {
    const timer = getTimerData(item);
    const hoursWorked = (item.price / state.wage).toFixed(1);

    const itemCard = document.createElement('div');
    itemCard.className = `item-card ${timer.expired ? 'unlocked' : ''}`;

    itemCard.innerHTML = `
      <div class="item-top">
        <div>
          <div class="item-title">${item.name}</div>
          <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">$${item.price.toFixed(2)}</div>
        </div>
        <span class="labor-badge">⏱️ ${hoursWorked} hrs labor</span>
      </div>

      <div class="progress-container">
        <div class="progress-bar" style="width: ${timer.percent}%"></div>
      </div>

      <div class="item-bottom">
        <span class="timer-text"><i class="fa-regular fa-clock"></i> ${timer.text}</span>
        <div class="action-btns">
          <button onclick="passAndSave(${item.id})" class="btn-pass"><i class="fa-solid fa-check"></i> Pass & Save</button>
          <button onclick="markBought(${item.id})" class="btn-buy ${timer.expired ? 'active' : ''}">
            ${timer.expired ? 'Bought' : 'Locked'}
          </button>
        </div>
      </div>
    `;
    itemsContainer.appendChild(itemCard);
  });
}

// User Action: Pass and Save Money
function passAndSave(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  state.totalSaved += item.price;
  state.streak += 1;
  
  // Log to history
  state.history.unshift({
    name: item.name,
    price: item.price,
    date: new Date().toLocaleDateString()
  });

  saveState('ps_totalSaved', state.totalSaved);
  saveState('ps_streak', state.streak);
  saveState('ps_history', state.history);

  removeItemFromList(id);
  renderHistory();
}

// User Action: Bought Item (Resisted period ended, but bought anyway)
function markBought(id) {
  state.streak = 0; // Reset streak on purchase
  saveState('ps_streak', state.streak);
  removeItemFromList(id);
}

function removeItemFromList(id) {
  state.items = state.items.filter(i => i.id !== id);
  saveState('ps_items', state.items);
  updateDashboardUI();
  renderItems();
}

// Render Saved History
function renderHistory() {
  if (state.history.length === 0) {
    historyContainer.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem;">No saved items recorded yet.</p>`;
    return;
  }

  historyContainer.innerHTML = '';
  state.history.slice(0, 5).forEach(entry => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <span><strong>${entry.name}</strong> (${entry.date})</span>
      <span style="color: var(--success-color); font-weight: 700;">+$${entry.price.toFixed(2)}</span>
    `;
    historyContainer.appendChild(div);
  });
}

// Clear History Button
document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  state.history = [];
  saveState('ps_history', state.history);
  renderHistory();
});

// LocalStorage Helper
function saveState(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Run App
init();
