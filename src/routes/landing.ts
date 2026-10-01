import { Router, Request, Response } from 'express';

export const landingRouter = Router();

landingRouter.get('/', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hotel Offer Orchestrator | Temporal & Redis</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #111827;
      --card-border: #1f2937;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --accent-a: #6366f1;
      --accent-b: #10b981;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --danger: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', sans-serif;
      line-height: 1.5;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.3);
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
      max-width: 650px;
      margin: 0 auto;
    }

    .health-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
      margin: 1.5rem 0;
      padding: 1rem;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
    }

    .health-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--text-muted);
    }
    .dot.up { background: var(--success); box-shadow: 0 0 8px var(--success); }
    .dot.down { background: var(--danger); box-shadow: 0 0 8px var(--danger); }

    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 840px) {
      .grid {
        grid-template-columns: 340px 1fr;
      }
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
    }

    input, select {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #0b0f19;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      color: var(--text);
      font-family: inherit;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .quick-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.5rem;
    }

    .chip {
      padding: 0.2rem 0.6rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      font-size: 0.75rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s;
    }

    .chip:hover {
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      border-color: var(--primary);
    }

    button.btn {
      width: 100%;
      padding: 0.85rem 1.25rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
    }

    button.btn:hover {
      background: var(--primary-hover);
    }

    .toggle-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--card-border);
    }

    .toggle-btn {
      width: 100%;
      padding: 0.6rem;
      margin-bottom: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: var(--text);
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    }

    .toggle-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .toggle-btn.down {
      border-color: var(--danger);
      color: #fca5a5;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .result-count {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .hotels-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-height: 200px;
    }

    .hotel-card {
      background: #0b0f19;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: transform 0.15s, border-color 0.15s;
    }

    .hotel-card:hover {
      transform: translateY(-2px);
      border-color: #374151;
    }

    .hotel-info h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.25rem;
    }

    .hotel-badges {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .supplier-pill {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }

    .supplier-pill.supplier-a {
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .supplier-pill.supplier-b {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .comm-pill {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .price-box {
      text-align: right;
    }

    .price-val {
      font-size: 1.35rem;
      font-weight: 800;
      color: #38bdf8;
    }

    .price-sub {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }

    .link-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 1rem;
      text-decoration: none;
      color: var(--text);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      transition: all 0.2s;
    }

    .link-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
    }

    .link-card span:first-child {
      font-weight: 600;
      font-size: 0.95rem;
      color: #93c5fd;
    }

    .link-card span:last-child {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .loading-spinner {
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top: 3px solid var(--primary);
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 0.8s linear infinite;
      margin: 2rem auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">🚀 Temporal.io Orchestration + Redis Price Filtering</div>
      <h1>Hotel Offer Orchestrator</h1>
      <p class="subtitle">Aggregate overlapping supplier offers, deduplicate listings, and filter best deals dynamically.</p>

      <div class="health-bar" id="healthBar">
        <div class="health-item"><span class="dot" id="dotSupplierA"></span> Supplier A: <b id="textSupplierA">Checking...</b></div>
        <div class="health-item"><span class="dot" id="dotSupplierB"></span> Supplier B: <b id="textSupplierB">Checking...</b></div>
        <div class="health-item"><span class="dot" id="dotRedis"></span> Redis: <b id="textRedis">Checking...</b></div>
        <div class="health-item"><span class="dot" id="dotTemporal"></span> Temporal: <b id="textTemporal">Checking...</b></div>
      </div>
    </header>

    <div class="grid">
      <!-- Search & Controls -->
      <aside class="card">
        <div class="card-title">🔍 Search & Filter</div>
        <form id="searchForm">
          <div class="form-group">
            <label for="cityInput">Destination City</label>
            <input type="text" id="cityInput" value="delhi" required placeholder="e.g. delhi, mumbai">
            <div class="quick-chips">
              <span class="chip" onclick="setCity('delhi')">Delhi</span>
              <span class="chip" onclick="setCity('mumbai')">Mumbai</span>
              <span class="chip" onclick="setCity('atlantis')">Atlantis (Empty)</span>
            </div>
          </div>

          <div class="form-group">
            <label for="minPrice">Min Price (₹)</label>
            <input type="number" id="minPrice" placeholder="No min">
          </div>

          <div class="form-group">
            <label for="maxPrice">Max Price (₹)</label>
            <input type="number" id="maxPrice" placeholder="No max">
            <div class="quick-chips">
              <span class="chip" onclick="setRange(null, null)">All</span>
              <span class="chip" onclick="setRange(5000, 6000)">₹5k - ₹6k</span>
              <span class="chip" onclick="setRange(7000, 10000)">₹7k - ₹10k</span>
            </div>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
            <input type="checkbox" id="freshCheck" style="width: auto;">
            <label for="freshCheck" style="margin-bottom: 0; cursor: pointer;">Force Fresh Orchestration (Bypass Cache)</label>
          </div>

          <button type="submit" class="btn" id="searchBtn">
            <span>Find Best Offers</span>
          </button>
        </form>

        <div class="toggle-section">
          <label style="margin-bottom: 0.8rem;">⚡ Fault Tolerance & Outage Simulator</label>
          <button class="toggle-btn" id="btnToggleA" onclick="toggleSupplier('supplierA')">
            <span>Supplier A</span>
            <span id="badgeA">ONLINE</span>
          </button>
          <button class="toggle-btn" id="btnToggleB" onclick="toggleSupplier('supplierB')">
            <span>Supplier B</span>
            <span id="badgeB">ONLINE</span>
          </button>
          <button class="toggle-btn" onclick="resetSuppliers()" style="justify-content: center; font-size: 0.8rem; margin-top: 0.5rem;">
            🔄 Reset Both to Online
          </button>
        </div>
      </aside>

      <!-- Results Display -->
      <main class="card">
        <div class="results-header">
          <div class="card-title" style="margin-bottom: 0;">🏨 Best Price Deals</div>
          <span class="result-count" id="resultCount">Loading offers...</span>
        </div>

        <div id="hotelsList" class="hotels-list">
          <div class="loading-spinner"></div>
        </div>
      </main>
    </div>

    <!-- Quick API Reference Links -->
    <div class="links-grid">
      <a href="/api/hotels?city=delhi" target="_blank" class="link-card">
        <span>GET /api/hotels?city=delhi</span>
        <span>Live JSON response for Delhi</span>
      </a>
      <a href="/api/hotels?city=delhi&minPrice=5000&maxPrice=6000" target="_blank" class="link-card">
        <span>GET /api/hotels?min=5k&max=6k</span>
        <span>Redis Sorted Set price filter</span>
      </a>
      <a href="/health" target="_blank" class="link-card">
        <span>GET /health</span>
        <span>Live supplier & cluster health</span>
      </a>
      <a href="http://localhost:8080" target="_blank" class="link-card">
        <span>Temporal Web UI</span>
        <span>Inspect workflows on port 8080</span>
      </a>
    </div>
  </div>

  <script>
    let supplierAHealthy = true;
    let supplierBHealthy = true;

    async function checkHealth() {
      try {
        const res = await fetch('/health');
        const data = await res.json();
        
        updateDot('dotSupplierA', 'textSupplierA', data.services.supplierA);
        updateDot('dotSupplierB', 'textSupplierB', data.services.supplierB);
        updateDot('dotRedis', 'textRedis', data.services.redis);
        updateDot('dotTemporal', 'textTemporal', data.services.temporal);

        supplierAHealthy = data.services.supplierA.status === 'UP';
        supplierBHealthy = data.services.supplierB.status === 'UP';

        document.getElementById('badgeA').innerText = supplierAHealthy ? 'ONLINE' : 'DOWN';
        document.getElementById('btnToggleA').classList.toggle('down', !supplierAHealthy);

        document.getElementById('badgeB').innerText = supplierBHealthy ? 'ONLINE' : 'DOWN';
        document.getElementById('btnToggleB').classList.toggle('down', !supplierBHealthy);
      } catch (e) {
        console.warn('Health check error:', e);
      }
    }

    function updateDot(dotId, textId, svc) {
      const dot = document.getElementById(dotId);
      const text = document.getElementById(textId);
      if (svc.status === 'UP') {
        dot.className = 'dot up';
        text.innerText = 'UP' + (svc.latencyMs !== undefined ? ' (' + svc.latencyMs + 'ms)' : '');
      } else {
        dot.className = 'dot down';
        text.innerText = 'DOWN';
      }
    }

    async function fetchHotels() {
      const city = document.getElementById('cityInput').value.trim();
      const minPrice = document.getElementById('minPrice').value.trim();
      const maxPrice = document.getElementById('maxPrice').value.trim();
      const fresh = document.getElementById('freshCheck').checked;

      const listEl = document.getElementById('hotelsList');
      const countEl = document.getElementById('resultCount');

      listEl.innerHTML = '<div class="loading-spinner"></div>';
      countEl.innerText = 'Fetching & orchestrating...';

      let url = '/api/hotels?city=' + encodeURIComponent(city);
      if (minPrice) url += '&minPrice=' + encodeURIComponent(minPrice);
      if (maxPrice) url += '&maxPrice=' + encodeURIComponent(maxPrice);
      if (fresh) url += '&fresh=true';

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          listEl.innerHTML = '<div class="empty-state">❌ ' + (data.error || 'Failed to fetch hotels') + '</div>';
          countEl.innerText = 'Error';
          return;
        }

        if (data.length === 0) {
          listEl.innerHTML = '<div class="empty-state">No hotels found matching criteria for "' + city + '".</div>';
          countEl.innerText = '0 hotels found';
          return;
        }

        countEl.innerText = data.length + ' deduplicated best offer(s)';

        listEl.innerHTML = data.map(hotel => {
          const isA = hotel.supplier.toLowerCase().includes('a');
          const pillClass = isA ? 'supplier-a' : 'supplier-b';
          return \`
            <div class="hotel-card">
              <div class="hotel-info">
                <h3>\${hotel.name}</h3>
                <div class="hotel-badges">
                  <span class="supplier-pill \${pillClass}">🏆 \${hotel.supplier}</span>
                  <span class="comm-pill">Comm: \${hotel.commissionPct}%</span>
                </div>
              </div>
              <div class="price-box">
                <div class="price-val">₹\${hotel.price.toLocaleString()}</div>
                <div class="price-sub">Best Price</div>
              </div>
            </div>
          \`;
        }).join('');
      } catch (err) {
        listEl.innerHTML = '<div class="empty-state">Connection error to API.</div>';
        countEl.innerText = 'Failed';
      }
    }

    async function toggleSupplier(name) {
      const endpoint = name === 'supplierA' ? '/supplierA/simulate-down' : '/supplierB/simulate-down';
      const isCurrentlyHealthy = name === 'supplierA' ? supplierAHealthy : supplierBHealthy;
      
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ down: isCurrentlyHealthy })
      });

      await checkHealth();
      fetchHotels();
    }

    async function resetSuppliers() {
      await fetch('/suppliers/reset', { method: 'POST' });
      await checkHealth();
      fetchHotels();
    }

    function setCity(city) {
      document.getElementById('cityInput').value = city;
      fetchHotels();
    }

    function setRange(min, max) {
      document.getElementById('minPrice').value = min !== null ? min : '';
      document.getElementById('maxPrice').value = max !== null ? max : '';
      fetchHotels();
    }

    document.getElementById('searchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      fetchHotels();
    });

    checkHealth();
    fetchHotels();
    setInterval(checkHealth, 5000);
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});
