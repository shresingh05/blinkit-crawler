// ── Blinkit Crawler — Frontend Logic ──

let pollInterval = null;

// ── All Blinkit Categories ──
const ALL_CATEGORIES = [
  // Dairy, Bread & Eggs
  { group: '🥛 Dairy, Bread & Eggs', name: 'Milk', query: 'milk', icon: '🥛' },
  { group: '🥛 Dairy, Bread & Eggs', name: 'Bread & Pav', query: 'bread', icon: '🍞' },
  { group: '🥛 Dairy, Bread & Eggs', name: 'Eggs', query: 'eggs', icon: '🥚' },
  { group: '🥛 Dairy, Bread & Eggs', name: 'Paneer & Tofu', query: 'paneer', icon: '🧀' },
  { group: '🥛 Dairy, Bread & Eggs', name: 'Curd & Yogurt', query: 'curd yogurt', icon: '🥣' },
  { group: '🥛 Dairy, Bread & Eggs', name: 'Butter & Cream', query: 'butter cream', icon: '🧈' },
  { group: '🥛 Dairy, Bread & Eggs', name: 'Cheese', query: 'cheese', icon: '🧀' },

  // Fruits & Vegetables
  { group: '🥬 Fruits & Vegetables', name: 'Fresh Vegetables', query: 'vegetables', icon: '🥬' },
  { group: '🥬 Fruits & Vegetables', name: 'Fresh Fruits', query: 'fruits', icon: '🍎' },
  { group: '🥬 Fruits & Vegetables', name: 'Herbs & Seasoning', query: 'herbs seasoning', icon: '🌿' },
  { group: '🥬 Fruits & Vegetables', name: 'Exotic Fruits', query: 'exotic fruits', icon: '🥝' },

  // Cold Drinks & Juices
  { group: '🥤 Cold Drinks & Juices', name: 'Soft Drinks', query: 'soft drinks', icon: '🥤' },
  { group: '🥤 Cold Drinks & Juices', name: 'Juices', query: 'juice', icon: '🧃' },
  { group: '🥤 Cold Drinks & Juices', name: 'Energy Drinks', query: 'energy drinks', icon: '⚡' },
  { group: '🥤 Cold Drinks & Juices', name: 'Water & Soda', query: 'water soda', icon: '💧' },

  // Snacks & Munchies
  { group: '🍿 Snacks & Munchies', name: 'Chips & Crisps', query: 'chips crisps', icon: '🍟' },
  { group: '🍿 Snacks & Munchies', name: 'Namkeen & Bhujia', query: 'namkeen bhujia', icon: '🥜' },
  { group: '🍿 Snacks & Munchies', name: 'Biscuits & Cookies', query: 'biscuits cookies', icon: '🍪' },
  { group: '🍿 Snacks & Munchies', name: 'Nuts & Seeds', query: 'nuts seeds dry fruits', icon: '🌰' },
  { group: '🍿 Snacks & Munchies', name: 'Popcorn', query: 'popcorn', icon: '🍿' },

  // Breakfast & Instant Food
  { group: '🥣 Breakfast & Instant Food', name: 'Noodles & Pasta', query: 'noodles pasta', icon: '🍜' },
  { group: '🥣 Breakfast & Instant Food', name: 'Cereals & Muesli', query: 'cereals muesli', icon: '🥣' },
  { group: '🥣 Breakfast & Instant Food', name: 'Oats', query: 'oats', icon: '🌾' },
  { group: '🥣 Breakfast & Instant Food', name: 'Ready to Cook', query: 'ready to cook', icon: '🍳' },
  { group: '🥣 Breakfast & Instant Food', name: 'Ready to Eat', query: 'ready to eat', icon: '🥘' },

  // Sweet Tooth
  { group: '🍫 Sweet Tooth', name: 'Chocolates', query: 'chocolates', icon: '🍫' },
  { group: '🍫 Sweet Tooth', name: 'Ice Cream', query: 'ice cream', icon: '🍦' },
  { group: '🍫 Sweet Tooth', name: 'Sweets & Mithai', query: 'sweets mithai', icon: '🍬' },
  { group: '🍫 Sweet Tooth', name: 'Candy & Gum', query: 'candy gum', icon: '🍭' },

  // Tea, Coffee & Health Drinks
  { group: '☕ Tea, Coffee & Health Drinks', name: 'Tea', query: 'tea', icon: '🍵' },
  { group: '☕ Tea, Coffee & Health Drinks', name: 'Coffee', query: 'coffee', icon: '☕' },
  { group: '☕ Tea, Coffee & Health Drinks', name: 'Health Drinks', query: 'health drinks bournvita horlicks', icon: '🥤' },

  // Atta, Rice & Dal
  { group: '🌾 Atta, Rice & Dal', name: 'Atta & Flour', query: 'atta flour', icon: '🌾' },
  { group: '🌾 Atta, Rice & Dal', name: 'Rice', query: 'rice basmati', icon: '🍚' },
  { group: '🌾 Atta, Rice & Dal', name: 'Dal & Pulses', query: 'dal pulses', icon: '🫘' },

  // Masala, Oil & More
  { group: '🫒 Masala, Oil & More', name: 'Cooking Oil & Ghee', query: 'cooking oil ghee', icon: '🫒' },
  { group: '🫒 Masala, Oil & More', name: 'Masala & Spices', query: 'masala spices', icon: '🌶️' },
  { group: '🫒 Masala, Oil & More', name: 'Salt & Sugar', query: 'salt sugar', icon: '🧂' },

  // Sauces & Spreads
  { group: '🫙 Sauces & Spreads', name: 'Ketchup & Sauce', query: 'ketchup sauce', icon: '🍅' },
  { group: '🫙 Sauces & Spreads', name: 'Jam & Honey', query: 'jam honey spread', icon: '🍯' },
  { group: '🫙 Sauces & Spreads', name: 'Mayonnaise & Dips', query: 'mayonnaise dips', icon: '🫙' },

  // Chicken, Meat & Fish
  { group: '🍗 Chicken, Meat & Fish', name: 'Chicken', query: 'chicken', icon: '🍗' },
  { group: '🍗 Chicken, Meat & Fish', name: 'Fish & Seafood', query: 'fish seafood', icon: '🐟' },
  { group: '🍗 Chicken, Meat & Fish', name: 'Mutton', query: 'mutton', icon: '🥩' },

  // Frozen Food
  { group: '🧊 Frozen Food', name: 'Frozen Snacks', query: 'frozen snacks', icon: '🧊' },
  { group: '🧊 Frozen Food', name: 'Frozen Vegetables', query: 'frozen vegetables', icon: '🥦' },
  { group: '🧊 Frozen Food', name: 'Frozen Non-Veg', query: 'frozen chicken nuggets', icon: '🍗' },

  // Paan Corner
  { group: '🚬 Paan Corner', name: 'Cigarettes', query: 'cigarettes', icon: '🚬' },
  { group: '🚬 Paan Corner', name: 'Mouth Freshener', query: 'mouth freshener paan', icon: '🌿' },

  // Baby Care
  { group: '👶 Baby Care', name: 'Diapers & Wipes', query: 'diapers wipes', icon: '👶' },
  { group: '👶 Baby Care', name: 'Baby Food', query: 'baby food cerelac', icon: '🍼' },

  // Pharma & Wellness
  { group: '💊 Pharma & Wellness', name: 'Health Supplements', query: 'health supplements vitamins', icon: '💊' },
  { group: '💊 Pharma & Wellness', name: 'Pain Relief', query: 'pain relief medicines', icon: '🩹' },
  { group: '💊 Pharma & Wellness', name: 'Ayurvedic Care', query: 'ayurvedic care', icon: '🌿' },

  // Cleaning Essentials
  { group: '🧹 Cleaning Essentials', name: 'Detergent', query: 'detergent washing', icon: '🧴' },
  { group: '🧹 Cleaning Essentials', name: 'Dishwash', query: 'dishwash', icon: '🍽️' },
  { group: '🧹 Cleaning Essentials', name: 'Floor & Toilet Cleaner', query: 'floor cleaner toilet cleaner', icon: '🧹' },
  { group: '🧹 Cleaning Essentials', name: 'Fresheners & Repellents', query: 'freshener repellent', icon: '🌸' },

  // Home & Office
  { group: '🏠 Home & Office', name: 'Tissues & Napkins', query: 'tissues napkins', icon: '🧻' },
  { group: '🏠 Home & Office', name: 'Garbage Bags', query: 'garbage bags', icon: '🗑️' },
  { group: '🏠 Home & Office', name: 'Stationery', query: 'stationery pens', icon: '✏️' },
  { group: '🏠 Home & Office', name: 'Batteries & Electricals', query: 'batteries bulb', icon: '🔋' },

  // Personal Care
  { group: '🧴 Personal Care', name: 'Shampoo & Conditioner', query: 'shampoo conditioner', icon: '🧴' },
  { group: '🧴 Personal Care', name: 'Body Wash & Soap', query: 'body wash soap', icon: '🧼' },
  { group: '🧴 Personal Care', name: 'Face Care', query: 'face wash cream', icon: '✨' },
  { group: '🧴 Personal Care', name: 'Oral Care', query: 'toothpaste toothbrush', icon: '🪥' },
  { group: '🧴 Personal Care', name: 'Deodorant & Perfume', query: 'deodorant perfume', icon: '💐' },
  { group: '🧴 Personal Care', name: 'Hair Care', query: 'hair oil hair color', icon: '💇' },

  // Pet Care
  { group: '🐾 Pet Care', name: 'Pet Food', query: 'pet food dog cat', icon: '🐕' },
  { group: '🐾 Pet Care', name: 'Pet Accessories', query: 'pet accessories', icon: '🐾' },
];

let selectedCategories = new Set();

// ── Build Category Selector ──
function buildCategorySelector() {
  const container = document.getElementById('categorySelector');
  container.innerHTML = '';

  // Group categories
  const groups = {};
  ALL_CATEGORIES.forEach(cat => {
    if (!groups[cat.group]) groups[cat.group] = [];
    groups[cat.group].push(cat);
  });

  Object.entries(groups).forEach(([groupName, cats]) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'category-group';

    const groupHeader = document.createElement('div');
    groupHeader.className = 'category-group-header';
    groupHeader.innerHTML = `<span>${groupName}</span><button class="group-select-btn" onclick="toggleGroup('${groupName}')">Select group</button>`;
    groupDiv.appendChild(groupHeader);

    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'category-items';

    cats.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = 'category-chip';
      chip.dataset.query = cat.query;
      chip.dataset.name = cat.name;
      chip.dataset.group = cat.group;
      chip.innerHTML = `<span class="chip-icon">${cat.icon}</span><span class="chip-label">${cat.name}</span>`;
      chip.onclick = () => toggleCategory(chip, cat);
      itemsDiv.appendChild(chip);
    });

    groupDiv.appendChild(itemsDiv);
    container.appendChild(groupDiv);
  });
}

function toggleCategory(chip, cat) {
  const key = cat.query;
  if (selectedCategories.has(key)) {
    selectedCategories.delete(key);
    chip.classList.remove('selected');
  } else {
    selectedCategories.add(key);
    chip.classList.add('selected');
  }
  updateSelectedCount();
}

function toggleGroup(groupName) {
  const chips = document.querySelectorAll(`.category-chip[data-group="${groupName}"]`);
  const allSelected = Array.from(chips).every(c => c.classList.contains('selected'));

  chips.forEach(chip => {
    const query = chip.dataset.query;
    if (allSelected) {
      selectedCategories.delete(query);
      chip.classList.remove('selected');
    } else {
      selectedCategories.add(query);
      chip.classList.add('selected');
    }
  });
  updateSelectedCount();
}

function selectAll() {
  document.querySelectorAll('.category-chip').forEach(chip => {
    selectedCategories.add(chip.dataset.query);
    chip.classList.add('selected');
  });
  updateSelectedCount();
}

function deselectAll() {
  document.querySelectorAll('.category-chip').forEach(chip => {
    selectedCategories.delete(chip.dataset.query);
    chip.classList.remove('selected');
  });
  updateSelectedCount();
}

function updateSelectedCount() {
  document.getElementById('selectedCount').textContent = selectedCategories.size;
}

function getSelectedCategories() {
  const cats = [];
  document.querySelectorAll('.category-chip.selected').forEach(chip => {
    cats.push({ name: chip.dataset.name, query: chip.dataset.query });
  });
  return cats;
}

// ── Start Crawl ──
async function startCrawl() {
  const pincodeInput = document.getElementById('pincodeInput');
  const pincodeError = document.getElementById('pincodeError');
  const pincode = pincodeInput.value.trim();

  pincodeError.classList.add('hidden');
  pincodeInput.classList.remove('input-error');

  if (!/^\d{6}$/.test(pincode)) {
    pincodeError.textContent = '⚠️ Please enter a valid 6-digit pincode';
    pincodeError.classList.remove('hidden');
    pincodeInput.classList.add('input-error');
    return;
  }

  const categories = getSelectedCategories();
  if (categories.length === 0) {
    alert('Please select at least one category to crawl.');
    return;
  }

  const btn = document.getElementById('crawlBtn');
  btn.disabled = true;
  btn.classList.add('crawling');
  btn.innerHTML = '<span class="spinner"></span><span>Crawling...</span>';

  document.getElementById('progress-section').classList.remove('hidden');
  document.getElementById('data-section').classList.add('hidden');
  document.getElementById('downloadBtn').disabled = true;

  try {
    const res = await fetch('/api/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pincode, categories })
    });
    const data = await res.json();

    if (!data.success) {
      alert(data.message);
      resetUI();
      return;
    }

    pollInterval = setInterval(pollStatus, 1500);
  } catch (err) {
    console.error('Failed to start crawl:', err);
    alert('Failed to start crawl. Make sure the server is running.');
    resetUI();
  }
}

// ── Poll Status ──
async function pollStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    updateProgress(data);

    if (data.status === 'done' || data.status === 'error') {
      clearInterval(pollInterval);
      pollInterval = null;

      if (data.status === 'done') {
        onCrawlComplete();
      } else {
        const errMsg = data.error || 'Unknown error';
        if (errMsg.toLowerCase().includes('wrong pincode') || errMsg.toLowerCase().includes('invalid pincode')) {
          const pincodeError = document.getElementById('pincodeError');
          pincodeError.textContent = '⚠️ ' + errMsg;
          pincodeError.classList.remove('hidden');
          document.getElementById('pincodeInput').classList.add('input-error');
          document.getElementById('progress-section').classList.add('hidden');
        } else {
          alert('Crawl failed: ' + errMsg);
        }
        resetUI();
      }
    }
  } catch (err) {
    console.error('Poll error:', err);
  }
}

// ── Update Progress UI ──
function updateProgress(data) {
  const pctEl = document.getElementById('progressPercent');
  const barEl = document.getElementById('progressBar');
  const pct = data.status === 'done' ? 100 : data.progress;
  pctEl.textContent = pct + '%';
  barEl.style.width = pct + '%';

  document.getElementById('currentCategory').textContent = data.currentCategory || '—';
  document.getElementById('productCount').textContent = data.productCount;
  document.getElementById('catProgress').textContent = `${data.categoriesDone} / ${data.totalCategories}`;
  document.getElementById('duration').textContent = Math.round(data.duration) + 's';
}

// ── Crawl Complete ──
async function onCrawlComplete() {
  const btn = document.getElementById('crawlBtn');
  btn.disabled = false;
  btn.classList.remove('crawling');
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-2.2-5.9"/><polyline points="21 3 21 9 15 9"/></svg>
    <span>Re-Crawl</span>
  `;

  document.getElementById('downloadBtn').disabled = false;

  document.querySelector('.progress-card').classList.add('celebrate');

  await loadDataTable();
}

// ── Load Data Table ──
async function loadDataTable() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    const products = data.products || [];

    if (products.length === 0) {
      document.getElementById('data-section').classList.remove('hidden');
      document.getElementById('tableBody').innerHTML = `
        <tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">
          No products found. Try re-crawling.
        </td></tr>`;
      return;
    }

    document.getElementById('totalProducts').textContent = `${products.length} products`;

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    products.forEach((p, idx) => {
      const row = document.createElement('tr');
      const discountHTML = p.discount && p.discount !== '0%'
        ? `<span class="discount-badge">${p.discount}</span>`
        : '<span style="color:var(--text-muted)">—</span>';

      const stockClass = p.availability === 'In Stock' ? 'stock-in' : 'stock-out';
      const imgHTML = p.imageUrl
        ? `<img src="${p.imageUrl}" alt="${p.productName}" loading="lazy" onerror="this.style.display='none'">`
        : '<div style="width:42px;height:42px;background:rgba(255,255,255,0.05);border-radius:8px;"></div>';

      row.innerHTML = `
        <td style="color:var(--text-muted);font-size:0.78rem;">${idx + 1}</td>
        <td>${imgHTML}</td>
        <td title="${p.productName}">${p.productName}</td>
        <td>${p.brand || '—'}</td>
        <td style="color:var(--green);font-weight:600;">₹${p.sellingPrice || '—'}</td>
        <td style="text-decoration:${p.mrp !== p.sellingPrice ? 'line-through' : 'none'};color:var(--text-muted);">₹${p.mrp || '—'}</td>
        <td>${discountHTML}</td>
        <td>${p.weight || '—'}</td>
        <td><span style="color:var(--accent-light)">${p.category}</span></td>
        <td class="${stockClass}">${p.availability}</td>
      `;
      tbody.appendChild(row);
    });

    document.getElementById('data-section').classList.remove('hidden');
    document.getElementById('data-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

// ── Download CSV ──
function downloadCSV() {
  window.location.href = '/api/download';
}

// ── Reset UI ──
function resetUI() {
  const btn = document.getElementById('crawlBtn');
  btn.disabled = false;
  btn.classList.remove('crawling');
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    <span>Start Crawling</span>
  `;
}

// ── Initialize ──
async function init() {
  buildCategorySelector();

  // Pre-select Milk, Bread, Eggs
  document.querySelectorAll('.category-chip').forEach(chip => {
    if (['milk', 'bread', 'eggs'].includes(chip.dataset.query)) {
      selectedCategories.add(chip.dataset.query);
      chip.classList.add('selected');
    }
  });
  updateSelectedCount();

  // Check for existing data
  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    if (data.status === 'done' && data.productCount > 0) {
      document.getElementById('progress-section').classList.remove('hidden');
      updateProgress(data);
      await onCrawlComplete();
    } else if (data.status === 'crawling') {
      document.getElementById('progress-section').classList.remove('hidden');
      const btn = document.getElementById('crawlBtn');
      btn.disabled = true;
      btn.classList.add('crawling');
      btn.innerHTML = '<span class="spinner"></span><span>Crawling...</span>';
      pollInterval = setInterval(pollStatus, 1500);
    }
  } catch (err) {
    console.log('Server not reachable, waiting for user action.');
  }
}

window.addEventListener('DOMContentLoaded', init);
