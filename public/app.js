/* Browser code: save as public/app.js, not server/app.js. */
(() => {
  'use strict';
  const main = document.getElementById('main');
  if (!main) return;
  let products = [];
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const savedFavorites = read('caavon-favorites', []);
  const favorites = new Set(Array.isArray(savedFavorites) ? savedFavorites : []);
  const savedBag = read('caavon-bag', []);
  let bag = Array.isArray(savedBag) ? savedBag.filter(item => item && typeof item.id === 'string' && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const imageUrl = value => {
    try {
      const url = new URL(value, location.href);
      return ['http:', 'https:'].includes(url.protocol) ? escape(url.href) : '';
    } catch { return ''; }
  };
  function persist() {
    try {
      localStorage.setItem('caavon-favorites', JSON.stringify([...favorites]));
      localStorage.setItem('caavon-bag', JSON.stringify(bag));
    } catch { /* Shopping still works when browser storage is unavailable. */ }
    updateCounts();
  }
  function updateCounts() {
    const favoriteCount = document.getElementById('fav-count');
    const bagCount = document.getElementById('bag-count');
    if (favoriteCount) favoriteCount.textContent = favorites.size;
    if (bagCount) bagCount.textContent = bag.reduce((sum, item) => sum + item.quantity, 0);
  }
  function announce(message) {
    const toast = document.getElementById('toast');
    if (toast) toast.textContent = message;
  }
  function card(product) {
    const id = escape(product.id);
    return `<article class="product-card">
      <a href="#product/${encodeURIComponent(product.id)}"><img src="${imageUrl(product.images[0])}" alt="${escape(product.name)}" loading="lazy" width="300" height="360" style="max-width:100%;object-fit:cover"></a>
      <h3><a href="#product/${encodeURIComponent(product.id)}">${escape(product.name)}</a></h3>
      <p>${money(product.price)} ${product.isSale && product.originalPrice > product.price ? `<del>${money(product.originalPrice)}</del>` : ''}</p>
      <button type="button" data-action="favorite" data-id="${id}" aria-pressed="${favorites.has(product.id)}">${favorites.has(product.id) ? '♥ Saved' : '♡ Save'}</button>
      <a href="#product/${encodeURIComponent(product.id)}">Choose options</a>
    </article>`;
  }
  function collection(title, items) {
    main.innerHTML = `<section><h1>${escape(title)}</h1><div class="product-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:24px">${items.length ? items.map(card).join('') : '<p>No products here yet.</p>'}</div></section>`;
  }
  function render() {
    const [route, query = ''] = (location.hash.slice(1) || 'home').split('?');
    if (route === 'main') return;
    if (route === 'home' || route.startsWith('shop/')) {
      const gender = route.split('/')[1] || 'all';
      const saleOnly = new URLSearchParams(query).get('sale') === 'true';
      collection(saleOnly ? 'Sale' : gender === 'women' ? 'Women' : gender === 'men' ? 'Men' : 'Shop all', products.filter(p => (gender === 'all' || p.gender === gender) && (!saleOnly || p.isSale)));
    } else if (route === 'favorites') {
      collection('Your favorites', products.filter(p => favorites.has(p.id)));
    } else if (route.startsWith('product/')) {
      let id;
      try { id = decodeURIComponent(route.slice(8)); } catch { id = ''; }
      const product = products.find(p => p.id === id);
      if (!product) { main.innerHTML = '<h1>Product not found</h1><a href="#shop/all">Back to shop</a>'; return; }
      main.innerHTML = `<section class="product-details">
        <a href="#shop/all">Back to shop</a><h1>${escape(product.name)}</h1>
        <img src="${imageUrl(product.images[0])}" alt="${escape(product.name)}" width="400" style="max-width:100%">
        <p>${escape(product.description)}</p><p>${money(product.price)}</p><p>${escape(product.material)}</p>
        <form id="add-to-bag" data-id="${escape(product.id)}">
          <label>Size <select name="size" required>${product.sizes.map(size => `<option value="${escape(size)}">${escape(size)}</option>`).join('')}</select></label>
          <label>Color <select name="color" required>${product.colors.map(color => `<option value="${escape(color.name)}">${escape(color.name)}</option>`).join('')}</select></label>
          <button type="submit">Add to bag</button>
        </form>
        <h2>Care</h2><ul>${product.care.map(line => `<li>${escape(line)}</li>`).join('')}</ul>
      </section>`;
    } else if (route === 'bag') {
      let total = 0;
      const rows = bag.map((item, index) => {
        const product = products.find(p => p.id === item.id);
        if (!product) return '';
        total += product.price * item.quantity;
        return `<li><h2>${escape(product.name)}</h2><p>${escape(item.size)} / ${escape(item.color)} · Quantity: ${item.quantity} · ${money(product.price * item.quantity)}</p><button type="button" data-action="remove" data-index="${index}">Remove</button></li>`;
      }).join('');
      main.innerHTML = `<section><h1>Your bag</h1>${rows ? `<ul>${rows}</ul><p><strong>Subtotal: ${money(total)}</strong></p><p>Checkout is not available yet.</p>` : '<p>Your bag is empty.</p>'}<a href="#shop/all">Continue shopping</a></section>`;
    } else if (route === 'account') {
      main.innerHTML = `<section class="auth-section">
        <div class="auth-container">
          <div class="auth-content">
            <p class="eyebrow">Welcome back</p>
            <h1>Sign in</h1>
            <p>Sign in to access your CAAVON account.</p>
            <form id="login-form">
              <div class="form-group">
                <label for="login-email">Email address</label>
                <input id="login-email" name="email" type="email" autocomplete="email" required>
              </div>
              <div class="form-group">
                <label for="login-password">Password</label>
                <input id="login-password" name="password" type="password" autocomplete="current-password" required>
              </div>
              <button class="btn-primary" type="submit">Sign in</button>
              <p id="login-message" class="form-hint" role="status" aria-live="polite"></p>
            </form>
            <a href="#shop/all">Continue shopping</a>
          </div>
        </div>
      </section>`;
    } else {
      main.innerHTML = '<h1>Page not found</h1><a href="#shop/all">Back to shop</a>';
    }
  }
  main.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'favorite') {
      const id = button.dataset.id;
      if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    } else if (button.dataset.action === 'remove') {
      bag.splice(Number(button.dataset.index), 1);
    }
    persist();
    render();
  });
  main.addEventListener('submit', event => {
    if (event.target.id !== 'add-to-bag') return;
    event.preventDefault();
    const form = event.target;
    const values = new FormData(form);
    const item = { id: form.dataset.id, size: values.get('size'), color: values.get('color'), quantity: 1 };
    const existing = bag.find(row => row.id === item.id && row.size === item.size && row.color === item.color);
    if (existing) existing.quantity += 1; else bag.push(item);
    persist();
    announce('Added to your bag.');
  });
  async function init() {
    main.innerHTML = '<p role="status">Loading products…</p>';
    try {
      const response = await fetch('/products.json');
      if (!response.ok) throw new Error(`products.json returned HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('products.json must contain an array of products.');
      const ids = new Set();
      for (const product of data) {
        if (!product || typeof product.id !== 'string' || ids.has(product.id) || typeof product.name !== 'string' || typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0 || !Array.isArray(product.images) || !product.images.length || !Array.isArray(product.sizes) || !Array.isArray(product.colors) || !Array.isArray(product.care)) {
          throw new Error('A product has missing or invalid fields.');
        }
        ids.add(product.id);
      }
      products = data;
      bag = bag.filter(item => ids.has(item.id));
      for (const id of favorites) if (!ids.has(id)) favorites.delete(id);
      persist();
      window.addEventListener('hashchange', render);
      if (location.hash === '#main') collection('Shop all', products); else render();
    } catch (error) {
      console.error('Product loading failed:', error);
      main.innerHTML = `<h1>Unable to load products</h1><p>${escape(error.message)}</p><p>Check that products.json is inside your public folder and open the site through your server.</p><button type="button" id="retry-products">Try again</button>`;
      document.getElementById('retry-products').addEventListener('click', init);
    }
  }
  updateCounts();
  init();
})();
