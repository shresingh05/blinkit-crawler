const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const vanillaPuppeteer = require('puppeteer');
const path = require('path');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Crawl state
let crawlState = {
  status: 'idle',
  currentCategory: '',
  progress: 0,
  totalCategories: 3,
  categoriesDone: 0,
  products: [],
  error: null,
  startTime: null,
  endTime: null,
  pincode: ''
};

// Default categories (used if none specified)
const DEFAULT_CATEGORIES = [
  { name: 'Milk', searchQuery: 'milk' },
  { name: 'Bread & Pav', searchQuery: 'bread' },
  { name: 'Eggs', searchQuery: 'eggs' }
];

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ── Enhanced auto-scroll for infinite scroll pages ──
async function autoScroll(page) {
  let previousHeight = 0;
  let noChangeCount = 0;
  let productCountBefore = 0;

  for (let i = 0; i < 150; i++) {
    // Count products before scroll
    const currentProducts = await page.evaluate(() => {
      return document.querySelectorAll('div[role="button"][id]').length +
             document.querySelectorAll('a[href*="/prn/"]').length;
    });

    // Scroll down aggressively
    await page.evaluate(() => window.scrollBy(0, 800));
    await wait(800);

    const currentHeight = await page.evaluate(() => document.body.scrollHeight);

    if (currentHeight === previousHeight && currentProducts === productCountBefore) {
      noChangeCount++;
      if (noChangeCount >= 6) {
        console.log(`    ✔ Scroll complete (no new content after ${noChangeCount} attempts, ${currentProducts} products loaded)`);
        break;
      }
      // Wait longer to give infinite scroll time to trigger
      await wait(1500);
    } else {
      noChangeCount = 0;
      previousHeight = currentHeight;
      productCountBefore = currentProducts;
    }

    if (i % 15 === 0 && i > 0) {
      console.log(`    📜 Scrolled ${i} times, ${currentProducts} products loaded...`);
    }
  }

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(1000);
}

// ── Extract products from the current page ──
async function extractProducts(page, category) {
  return await page.evaluate((cat) => {
    const products = [];
    const seen = new Set();

    // Find product cards — use multiple strategies
    let cards = [];

    // Strategy 1: divs with numeric IDs (most reliable)
    const numericIdCards = Array.from(document.querySelectorAll('div[id]'))
      .filter(el => /^\d+$/.test(el.id) && el.querySelector('img'));
    cards.push(...numericIdCards);

    // Strategy 2: div[role="button"] with images inside plpContainer or search results
    if (cards.length === 0) {
      const roleCards = Array.from(document.querySelectorAll('div[role="button"]'))
        .filter(el => el.querySelector('img') && el.id && /^\d+$/.test(el.id));
      cards.push(...roleCards);
    }

    // Strategy 3: product links
    if (cards.length === 0) {
      const linkCards = Array.from(document.querySelectorAll('a[href*="/prn/"]'));
      cards.push(...linkCards);
    }

    cards.forEach(card => {
      try {
        const id = card.getAttribute('id') || card.getAttribute('href') || Math.random().toString(36).substr(2, 9);
        if (seen.has(id)) return;
        seen.add(id);

        // Get all leaf text nodes
        const leafTexts = [];
        const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null, false);
        while (walker.nextNode()) {
          const txt = walker.currentNode.textContent.trim();
          if (txt) leafTexts.push({ text: txt, el: walker.currentNode.parentElement });
        }
        if (leafTexts.length === 0) return;

        // Product Name — look for line-clamp elements first
        let name = '';
        const lineClamp = card.querySelector('[class*="line-clamp"]');
        if (lineClamp) {
          name = lineClamp.textContent.trim();
        } else {
          const candidates = leafTexts.filter(n =>
            !n.text.startsWith('₹') &&
            !/^(ADD|NOTIFY|ADDED|Out of stock|\d+)$/i.test(n.text) &&
            n.text.length > 3
          );
          if (candidates.length > 0) {
            name = candidates.sort((a, b) => b.text.length - a.text.length)[0].text;
          }
        }
        if (!name || name.length < 2) return;

        // Weight / Quantity
        const wgtRe = /^\d+(\.\d+)?\s*(ml|l|g|kg|gm|pcs|pc|pieces?|pack|ltr|litres?|litre|eggs?)\b/i;
        const wgtReLoose = /\d+(\.\d+)?\s*(ml|l|g|kg|gm|pcs|pc|pieces?|pack|ltr|litres?|litre|eggs?)\b/i;
        let weight = '';
        for (const n of leafTexts) {
          if (wgtRe.test(n.text) && n.text.length < 30) { weight = n.text; break; }
        }
        if (!weight) {
          for (const n of leafTexts) {
            if (wgtReLoose.test(n.text) && n.text.length < 30 && !n.text.startsWith('₹')) { weight = n.text; break; }
          }
        }

        // Prices
        const priceParts = leafTexts.filter(n => n.text.includes('₹'));
        let sellingPrice = '', mrp = '';
        for (const pt of priceParts) {
          const s = window.getComputedStyle(pt.el);
          const struck = s.textDecorationLine?.includes('line-through') ||
            s.textDecoration?.includes('line-through') ||
            pt.el.closest('s, del') !== null;
          if (struck) mrp = pt.text;
          else if (!sellingPrice) sellingPrice = pt.text;
        }

        const parsePrice = (p) => { const m = p.match(/₹?\s*(\d+(\.\d+)?)/); return m ? parseFloat(m[1]) : null; };
        const sp = parsePrice(sellingPrice);
        const mp = parsePrice(mrp);
        const discount = (mp && sp && mp > sp) ? Math.round(((mp - sp) / mp) * 100) + '%' : '0%';

        // Brand — first word(s) of name
        const words = name.split(' ');
        const brand = words.length > 1
          ? words.slice(0, words[0].length <= 3 ? 2 : 1).join(' ')
          : words[0];

        // Image
        const img = card.querySelector('img');
        const imageUrl = img ? (img.src || img.getAttribute('data-src') || '') : '';

        // Availability
        const ct = card.textContent.toLowerCase();
        const outOfStock = ct.includes('out of stock') || ct.includes('notify') || ct.includes('sold out');

        products.push({
          productName: name,
          brand: brand,
          sellingPrice: sp || '',
          mrp: mp || sp || '',
          discount: discount,
          weight: weight,
          category: cat,
          imageUrl: imageUrl,
          availability: outOfStock ? 'Out of Stock' : 'In Stock',
          productId: String(id)
        });
      } catch (e) { /* skip */ }
    });

    return products;
  }, category);
}

// ── Main crawl function ──
async function crawl(pincode, categories) {
  const cats = categories || DEFAULT_CATEGORIES;
  crawlState = {
    status: 'crawling', currentCategory: '', progress: 0,
    totalCategories: cats.length, categoriesDone: 0, products: [],
    error: null, startTime: Date.now(), endTime: null,
    pincode: pincode
  };

  let browser;
  try {
    console.log(`🚀 Starting crawl for pincode: ${pincode}`);
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || vanillaPuppeteer.executablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--window-size=1280,900'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    // Step 1: Set location on Blinkit
    crawlState.currentCategory = 'Setting location...';
    console.log('📍 Setting location...');
    await page.goto('https://blinkit.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(3000);

    // Set pincode
    const inputSet = await page.evaluate((pc) => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        const rect = input.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          input.focus();
          const nativeSet = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value').set;
          nativeSet.call(input, pc);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    }, pincode);

    if (!inputSet) {
      const inputs = await page.$$('input');
      for (const input of inputs) {
        const visible = await input.evaluate(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        if (visible) {
          await input.click();
          await input.type(pincode, { delay: 60 });
          break;
        }
      }
    }

    await wait(3000);

    // Check if there are suggestions (validates pincode)
    const hasSuggestions = await page.evaluate(() => {
      const selectors = ['[class*="LocationSearchList"] > div', '[class*="suggestion"]', '[role="option"]'];
      for (const sel of selectors) {
        if (document.querySelector(sel)) return true;
      }
      return false;
    });

    if (!hasSuggestions) {
      console.log('❌ Invalid pincode — Blinkit not available in this area');
      crawlState.status = 'error';
      crawlState.error = 'Wrong pincode selected — Blinkit does not serve this area';
      crawlState.endTime = Date.now();
      await browser.close();
      return;
    }

    // Click first suggestion
    await page.evaluate(() => {
      const selectors = ['[class*="LocationSearchList"] > div', '[class*="suggestion"]', '[role="option"]'];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) { el.click(); return; }
      }
    });

    await wait(5000);
    console.log(`✅ Location set to pincode ${pincode}`);

    // Step 2: Crawl each category using SEARCH
    for (let i = 0; i < cats.length; i++) {
      const cat = cats[i];
      console.log(`\n📦 Crawling category: ${cat.name}`);
      crawlState.currentCategory = cat.name;
      crawlState.progress = Math.round((i / cats.length) * 100);

      try {
        // Navigate to search URL
        const query = cat.searchQuery || cat.query || cat.name;
        const searchUrl = `https://blinkit.com/s/?q=${encodeURIComponent(query)}`;
        console.log(`  🔍 Searching: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(4000);

        // Check if location is still set
        const needsLocation = await page.evaluate(() => {
          return document.body.innerText.includes('provide your delivery location');
        });

        if (needsLocation) {
          console.log('  ⚠️ Location lost, skipping. Try a different pincode.');
          continue;
        }

        // Scroll extensively to load ALL products
        console.log('  ⏬ Scrolling to load all products...');
        await autoScroll(page);

        // Extract products
        const products = await extractProducts(page, cat.name);
        console.log(`  ✅ Found ${products.length} products in ${cat.name}`);

        // Deduplicate by product ID
        const existingIds = new Set(crawlState.products.map(p => p.productId));
        const newProducts = products.filter(p => !existingIds.has(p.productId));
        crawlState.products.push(...newProducts);
        crawlState.categoriesDone = i + 1;
      } catch (catErr) {
        console.error(`  ❌ Error crawling ${cat.name}:`, catErr.message);
      }
    }

    crawlState.status = 'done';
    crawlState.progress = 100;
    crawlState.endTime = Date.now();
    console.log(`\n🎉 Crawl complete! Total products: ${crawlState.products.length}`);

  } catch (err) {
    console.error('❌ Crawl error:', err.message);
    crawlState.status = 'error';
    crawlState.error = err.message;
  } finally {
    if (browser) await browser.close();
  }
}

// ── API Routes ──

app.post('/api/crawl', (req, res) => {
  if (crawlState.status === 'crawling') {
    return res.json({ success: false, message: 'Crawl already in progress' });
  }

  const pincode = (req.body.pincode || '110048').trim();
  const categories = req.body.categories; // [{name, query}]

  if (!/^\d{6}$/.test(pincode)) {
    return res.json({ success: false, message: 'Invalid pincode format. Please enter a 6-digit pincode.' });
  }

  if (categories && categories.length === 0) {
    return res.json({ success: false, message: 'Please select at least one category.' });
  }

  // Map frontend format to server format
  const cats = categories ? categories.map(c => ({
    name: c.name,
    searchQuery: c.query || c.name
  })) : null;

  crawl(pincode, cats);
  res.json({ success: true, message: `Crawl started for pincode ${pincode} (${(cats || DEFAULT_CATEGORIES).length} categories)` });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: crawlState.status,
    currentCategory: crawlState.currentCategory,
    progress: crawlState.progress,
    categoriesDone: crawlState.categoriesDone,
    totalCategories: crawlState.totalCategories,
    productCount: crawlState.products.length,
    error: crawlState.error,
    pincode: crawlState.pincode,
    duration: crawlState.startTime
      ? ((crawlState.endTime || Date.now()) - crawlState.startTime) / 1000
      : 0
  });
});

app.get('/api/data', (req, res) => {
  res.json({ products: crawlState.products });
});

app.get('/api/download', (req, res) => {
  if (crawlState.products.length === 0) {
    return res.status(404).json({ error: 'No data available. Run a crawl first.' });
  }

  const headers = ['Product Name', 'Brand', 'Selling Price (₹)', 'MRP (₹)', 'Discount', 'Weight/Quantity', 'Category', 'Image URL', 'Availability', 'Product ID'];
  const csvRows = [headers.join(',')];

  crawlState.products.forEach(p => {
    const row = [
      `"${(p.productName || '').replace(/"/g, '""')}"`,
      `"${(p.brand || '').replace(/"/g, '""')}"`,
      p.sellingPrice,
      p.mrp,
      `"${p.discount}"`,
      `"${(p.weight || '').replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.imageUrl}"`,
      `"${p.availability}"`,
      `"${p.productId}"`
    ];
    csvRows.push(row.join(','));
  });

  const csv = csvRows.join('\n');
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `blinkit_products_${crawlState.pincode || 'unknown'}_${timestamp}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

app.listen(PORT, HOST, () => {
  console.log(`\n🌐 Blinkit Crawler running at http://${HOST}:${PORT}\n`);
});
