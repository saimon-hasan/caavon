// CAAVON storefront — runs in the browser; Express remains in server/app.js.
(() => {
  const main = document.getElementById('main');
  let products = [];
  let bag = JSON.parse(localStorage.getItem('caavon-bag') || '[]');
  let favorites = JSON.parse(localStorage.getItem('caavon-favorites') || '[]');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => '$' + Number(n).toFixed(2);
  const save = () => {
    localStorage.setItem('caavon-bag', JSON.stringify(bag));
    localStorage.setItem('caavon-favorites', JSON.stringify(favorites));
    document.getElementById('bag-count').textContent = bag.reduce((n, item) => n + item.quantity, 0);
    document.getElementById('fav-count').textContent = favorites.length;
  };
  const card = p => `<article class="product-card"><div class="product-image">
    <a href="#product/${encodeURIComponent(p.id)}"><img src="${escapeHtml(p.images?.[0])}" alt="${escapeHtml(p.name)}" loading="lazy"></a>
    ${p.isSale ? '<span class="badge">Sale</span>' : p.isNew ? '<span class="badge">New</span>' : ''}
    <button class="heart" data-favorite="${escapeHtml(p.id)}" aria-label="Toggle favorite">${favorites.includes(p.id) ? '♥' : '♡'}</button></div>
    <div class="product-info"><h3><a href="#product/${encodeURIComponent(p.id)}">${escapeHtml(p.name)}</a></h3>
    <div class="product-price">${money(p.price)} ${p.originalPrice ? `<del>${money(p.originalPrice)}</del>` : ''}</div>
    <p>${escapeHtml(p.category)}</p></div></article>`;
  const grid = items => items.length ? `<div class="products-grid">${items.map(card).join('')}</div>` : '<p>No products found.</p>';
  function collection(category, sale = false) {
    const names = {women:'Women', men:'Men', kids:'Kids', all:'Shop All'};
    const name = names[category] || names.all;
    const items = products.filter(p => (category === 'all' || p.gender === category) && (!sale || p.isSale));
    main.innerHTML = `<section class="shop-header"><h1>${sale ? 'Sale · ' : ''}${name}</h1><p>Carefully curated essentials for everyday style.</p></section>
      <section class="products-section"><div class="section-header"><h2>${name} Collection</h2><p>${items.length} products</p></div>
      <div class="filter-tabs">${Object.entries(names).map(([key,label]) => `<a class="filter-tab" href="#shop/${key}">${label}</a>`).join('')}</div>
      ${grid(items)}</section>`;
  }
  function home() {
    main.innerHTML = `<section class="hero-section"><div class="hero-content"><span class="eyebrow">A STUDY IN SIMPLICITY</span>
      <h1>Premium Fashion Essentials</h1><p>Timeless clothing for women, men, and kids.</p>
      <div class="hero-buttons"><a class="btn-primary" href="#shop/all">Shop All</a><a class="btn-secondary" href="#shop/kids">Shop Kids</a></div></div>
      <div class="hero-image"><img src="${escapeHtml(products[0]?.images?.[0])}" alt="CAAVON clothing"></div></section>
      <section class="products-section"><div class="section-header"><h2>Featured Products</h2><a href="#shop/all">View All</a></div>
      ${grid(products.slice(0,8))}</section>
      <section class="products-section" id="kids-collection"><div class="section-header"><h2>Kids Collection</h2><a href="#shop/kids">Shop All Kids</a></div>
      ${grid(products.filter(p => String(p.gender).toLowerCase() === "kids").slice(0,4))}</section>`;
  }
  function productPage(id) {
    const p = products.find(x => x.id === id);
    if (!p) { main.innerHTML = '<section class="products-section"><h1>Product not found</h1></section>'; return; }
    main.innerHTML = `<section class="products-section"><a href="#shop/${escapeHtml(p.gender)}">← Back to ${escapeHtml(p.gender)}</a>
      <div class="hero-section"><div class="hero-image"><img src="${escapeHtml(p.images?.[0])}" alt="${escapeHtml(p.name)}"></div>
      <div class="hero-content"><h1>${escapeHtml(p.name)}</h1><p class="product-price">${money(p.price)}</p>
      <p>${escapeHtml(p.description)}</p><p>Material: ${escapeHtml(p.material)}</p>
      <label for="product-size">Size</label> <select id="product-size">${p.sizes.map(s => `<option>${escapeHtml(s)}</option>`).join('')}</select>
      <p><button class="btn-primary" data-add="${escapeHtml(p.id)}">Add to Bag</button></p></div></div></section>`;
  }
  function bagPage() {
    const items = bag.map(item => ({...item, product:products.find(p => p.id === item.id)})).filter(item => item.product);
    main.innerHTML = `<section class="products-section"><h1>Shopping Bag</h1>
      ${items.length ? items.map(item => `<p>${escapeHtml(item.product.name)} · ${escapeHtml(item.size)} · Qty ${item.quantity} · ${money(item.product.price * item.quantity)}
      <button data-remove="${escapeHtml(item.id)}" data-size="${escapeHtml(item.size)}">Remove</button></p>`).join('') +
      `<h2>Subtotal: ${money(items.reduce((sum,item) => sum + item.product.price * item.quantity,0))}</h2><p>Checkout is not yet configured.</p>`
      : '<p>Your shopping bag is empty.</p>'}</section>`;
  }
  function render() {
    const hash = decodeURIComponent(location.hash.slice(1) || 'home');
    if (hash.startsWith('shop/')) {
      const [category, query] = hash.slice(5).split('?');
      collection(['women','men','kids','all'].includes(category) ? category : 'all', new URLSearchParams(query).get('sale') === 'true');
    } else if (hash.startsWith('product/')) productPage(hash.slice(8));
    else if (hash === 'favorites') main.innerHTML = `<section class="products-section"><h1>Favorites</h1>${grid(products.filter(p => favorites.includes(p.id)))}</section>`;
    else if (hash === 'bag') bagPage();
    else if (hash === 'account') main.innerHTML = '<section class="products-section"><h1>Account</h1><p>Account login is not configured yet.</p></section>';
    else home();
    save();
  }
  document.addEventListener('click', event => {
    const fav = event.target.closest('[data-favorite]');
    if (fav) { const id = fav.dataset.favorite; favorites = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites,id]; render(); }
    const add = event.target.closest('[data-add]');
    if (add) {
      const id = add.dataset.add, size = document.getElementById('product-size').value;
      const item = bag.find(x => x.id === id && x.size === size);
      if (item) item.quantity++; else bag.push({id,size,quantity:1});
      save(); document.getElementById('toast').textContent = 'Added to bag';
    }
    const remove = event.target.closest('[data-remove]');
    if (remove) { bag = bag.filter(x => x.id !== remove.dataset.remove || x.size !== remove.dataset.size); render(); }
  });
  window.addEventListener('hashchange', render);
  fetch(new URL('products.json', document.currentScript.src)).then(r => {
    if (!r.ok) throw new Error('Products HTTP ' + r.status);
    return r.json();
  }).then(data => { products = data; render(); }).catch(error => {
    console.error(error);
    main.innerHTML = '<section class="products-section"><h1>Unable to load products</h1></section>';
  });
})();
