let wage = parseFloat(localStorage.getItem('userWage')) || 15;
let totalSaved = parseFloat(localStorage.getItem('totalSaved')) || 0;
let items = JSON.parse(localStorage.getItem('cooldownItems')) || [];

const wageDisplay = document.getElementById('wageDisplay');
const totalSavedDisplay = document.getElementById('totalSavedDisplay');
const itemForm = document.getElementById('itemForm');
const itemsContainer = document.getElementById('itemsContainer');

function init() {
  wageDisplay.textContent = wage.toFixed(2);
  totalSavedDisplay.textContent = totalSaved.toFixed(2);
  renderItems();
}

function setWagePrompt() {
  const input = prompt("Enter your hourly wage ($):", wage);
  if (input && !isNaN(input) && parseFloat(input) > 0) {
    wage = parseFloat(input);
    localStorage.setItem('userWage', wage);
    wageDisplay.textContent = wage.toFixed(2);
    renderItems();
  }
}

itemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('itemName').value;
  const price = parseFloat(document.getElementById('itemPrice').value);
  const days = parseInt(document.getElementById('itemDays').value);

  const unlockDate = new Date();
  unlockDate.setDate(unlockDate.getDate() + days);

  const newItem = {
    id: Date.now(),
    name,
    price,
    unlockDate: unlockDate.toISOString()
  };

  items.push(newItem);
  localStorage.setItem('cooldownItems', JSON.stringify(items));
  itemForm.reset();
  renderItems();
});

function calculateHours(price) {
  return (price / wage).toFixed(1);
}

function getTimeRemaining(unlockDateStr) {
  const total = Date.parse(unlockDateStr) - Date.parse(new Date());
  if (total <= 0) return { expired: true, text: "Cooling period complete!" };
  
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  return { expired: false, text: `${days}d ${hours}h remaining` };
}

function renderItems() {
  itemsContainer.innerHTML = '';

  if (items.length === 0) {
    itemsContainer.innerHTML = '<p style="color: #a0aec0; text-align: center;">No active items in cooldown.</p>';
    return;
  }

  items.forEach(item => {
    const timeInfo = getTimeRemaining(item.unlockDate);
    const hoursWorked = calculateHours(item.price);

    const card = document.createElement('div');
    card.className = `item-card ${timeInfo.expired ? 'unlocked' : ''}`;
    
    card.innerHTML = `
      <div class="item-header">
        <span class="item-title">${item.name} ($${item.price.toFixed(2)})</span>
        <span class="hours-badge">⏱️ ${hoursWorked} hrs of work</span>
      </div>
      <div class="time-remaining">
        <strong>Status:</strong> ${timeInfo.text}
      </div>
      <div class="item-actions">
        <button onclick="skipAndSave(${item.id})" class="btn-save">Pass & Save Money</button>
        <button onclick="markPurchased(${item.id})" class="btn-buy" ${!timeInfo.expired ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          ${timeInfo.expired ? 'Buy Item' : 'Locked'}
        </button>
      </div>
    `;
    itemsContainer.appendChild(card);
  });
}

function skipAndSave(id) {
  const item = items.find(i => i.id === id);
  if (item) {
    totalSaved += item.price;
    localStorage.setItem('totalSaved', totalSaved);
    totalSavedDisplay.textContent = totalSaved.toFixed(2);
    removeItem(id);
  }
}

function markPurchased(id) {
  removeItem(id);
}

function removeItem(id) {
  items = items.filter(i => i.id !== id);
  localStorage.setItem('cooldownItems', JSON.stringify(items));
  renderItems();
}

init();
  
