
/*
 * CAAVON Storefront
 * Frontend JavaScript for GitHub Pages and Express.
 * Uses the existing public/styles.css.
 */

(() => {
  "use strict";

  const main = document.getElementById("main");
  const scriptUrl = document.currentScript?.src;

  if (!main) {
    console.error("CAAVON: Missing #main element.");
    return;
  }

  let products = [];

  // Safely read saved browser data.
  function readStorage(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.warn("CAAVON: Invalid saved data:", key);
      return [];
    }
  }

  let bag = readStorage("caavon-bag");
  let favorites = readStorage("caavon-favorites");

  // Protect text inserted into HTML.
  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]
    );
  }

  function money(value) {
    return "$" + Number(value || 0).toFixed(2);
  }

  function categoryOf(product) {
    return String(product.gender || "").toLowerCase();
  }

  function productImage(product) {
    return escapeHtml(product.images?.[0] || "");
  }

  function save() {
    try {
      localStorage.setItem("caavon-bag", JSON.stringify(bag));
      localStorage.setItem(
        "caavon-favorites",
        JSON.stringify(favorites)
      );
    } catch (error) {
      console.warn("CAAVON: Unable to save browser data.", error);
    }

    const bagCount = document.getElementById("bag-count");
    const favCount = document.getElementById("fav-count");

    if (bagCount) {
      bagCount.textContent = bag.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      );
    }

    if (favCount) {
      favCount.textContent = favorites.length;
    }
  }

  function notify(message) {
    const toast = document.getElementById("toast");

    if (toast) {
      toast.textContent = message;
    }
  }

  // Product card using the existing CSS classes.
  function card(product) {
    const id = escapeHtml(product.id);
    const name = escapeHtml(product.name);
    const image = productImage(product);

    const badge = product.isSale
      ? '<span class="badge">Sale</span>'
      : product.isNew
        ? '<span class="badge">New</span>'
        : "";

    const heart = favorites.includes(product.id)
      ? "♥"
      : "♡";

    const oldPrice = product.originalPrice
      ? `<del>${money(product.originalPrice)}</del>`
      : "";

    return `
      <article class="product-card">
        <div class="product-image">
          <a href="#product/${encodeURIComponent(product.id)}">
            <img
              src="${image}"
              alt="${name}"
              loading="lazy"
            >
          </a>

          ${badge}

          <button
            type="button"
            class="heart"
            data-favorite="${id}"
            aria-label="Toggle favorite"
            aria-pressed="${favorites.includes(product.id)}"
          >${heart}</button>
        </div>

        <div class="product-info">
          <h3>
            <a href="#product/${encodeURIComponent(product.id)}">
              ${name}
            </a>
          </h3>

          <div class="product-price">
            ${money(product.price)}
            ${oldPrice}
          </div>

          <p>${escapeHtml(product.category)}</p>
        </div>
      </article>
    `;
  }

  function grid(items) {
    if (!items.length) {
      return "<p>No products found.</p>";
    }

    return `
      <div class="products-grid">
        ${items.map(card).join("")}
      </div>
    `;
  }

  // Women, Men, Kids, All and Sale collections.
  function collection(category, sale = false, search = "") {
    const names = {
      women: "Women",
      men: "Men",
      kids: "Kids",
      all: "Shop All"
    };

    const name = names[category] || "Shop All";

    let items = products.filter(product => {
      const gender = categoryOf(product);

      const matchesCategory =
        category === "all" ||
        gender === category ||
        (category === "men" && gender === "unisex") ||
        (category === "women" && gender === "unisex");

      return matchesCategory && (!sale || product.isSale);
    });

    if (search) {
      const term = search.toLowerCase();

      items = items.filter(product =>
        [
          product.name,
          product.category,
          product.description
        ].some(value =>
          String(value || "").toLowerCase().includes(term)
        )
      );
    }

    main.innerHTML = `
      <section class="shop-header">
        <h1>${sale ? "Sale · " : ""}${name}</h1>
        <p>Carefully curated essentials for everyday style.</p>
      </section>

      <section class="products-section">
        <div class="section-header">
          <h2>${name} Collection</h2>
          <p>${items.length} products</p>
        </div>

        <form id="shop-search-form">
          <label for="shop-search">Search products</label>
          <input
            id="shop-search"
            name="search"
            type="search"
            value="${escapeHtml(search)}"
            placeholder="Search clothing..."
          >
          <button type="submit">Search</button>
        </form>

        <div class="filter-tabs">
          ${Object.entries(names).map(([key, label]) => `
            <a class="filter-tab" href="#shop/${key}">
              ${label}
            </a>
          `).join("")}
        </div>

        ${grid(items)}
      </section>
    `;
  }

  // Homepage.
  function home() {
    const kids = products.filter(
      product => categoryOf(product) === "kids"
    );

    main.innerHTML = `
      <section class="hero-section">
        <div class="hero-content">
          <span class="eyebrow">A STUDY IN SIMPLICITY</span>

          <h1>Premium Fashion Essentials</h1>

          <p>Timeless clothing for women, men, and kids.</p>

          <div class="hero-buttons">
            <a class="btn-primary" href="#shop/all">
              Shop All
            </a>

            <a class="btn-secondary" href="#shop/kids">
              Shop Kids
            </a>
          </div>
        </div>

        <div class="hero-image">
          <img
            src="${productImage(products[0] || {})}"
            alt="CAAVON clothing"
          >
        </div>
      </section>

      <section class="products-section">
        <div class="section-header">
          <h2>Featured Products</h2>
          <a href="#shop/all">View All</a>
        </div>

        ${grid(products.slice(0, 8))}
      </section>

      <section class="products-section" id="kids-collection">
        <div class="section-header">
          <h2>Kids Collection</h2>
          <a href="#shop/kids">Shop All Kids</a>
        </div>

        ${grid(kids.slice(0, 4))}
      </section>
    `;
  }

  // Individual product page.
  function productPage(id) {
    const product = products.find(item => item.id === id);

    if (!product) {
      main.innerHTML = `
        <section class="products-section">
          <h1>Product not found</h1>
          <a href="#shop/all">Back to Shop</a>
        </section>
      `;
      return;
    }

    const sizes = Array.isArray(product.sizes) &&
      product.sizes.length
      ? product.sizes
      : ["One Size"];

    const gender = categoryOf(product);
    const backCategory = ["women", "men", "kids"].includes(gender)
      ? gender
      : "all";

    main.innerHTML = `
      <section class="products-section">
        <a href="#shop/${backCategory}">
          ← Back to ${escapeHtml(backCategory)}
        </a>

        <div class="hero-section">
          <div class="hero-image">
            <img
              src="${productImage(product)}"
              alt="${escapeHtml(product.name)}"
            >
          </div>

          <div class="hero-content">
            <h1>${escapeHtml(product.name)}</h1>

            <p class="product-price">
              ${money(product.price)}
            </p>

            <p>${escapeHtml(product.description)}</p>

            <p>
              Material: ${escapeHtml(product.material)}
            </p>

            <label for="product-size">Size</label>

            <select id="product-size">
              ${sizes.map(size => `
                <option value="${escapeHtml(size)}">
                  ${escapeHtml(size)}
                </option>
              `).join("")}
            </select>

            <p>
              <button
                type="button"
                class="btn-primary"
                data-add="${escapeHtml(product.id)}"
              >
                Add to Bag
              </button>
            </p>
          </div>
        </div>
      </section>
    `;
  }

  // Shopping bag.
  function bagPage() {
    const items = bag.map(item => ({
      ...item,
      product: products.find(product => product.id === item.id)
    })).filter(item => item.product);

    if (!items.length) {
      main.innerHTML = `
        <section class="products-section">
          <h1>Shopping Bag</h1>
          <p>Your shopping bag is empty.</p>
          <a href="#shop/all">Continue Shopping</a>
        </section>
      `;
      return;
    }

    const subtotal = items.reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0
    );

    main.innerHTML = `
      <section class="products-section">
        <h1>Shopping Bag</h1>

        ${items.map(item => `
          <div class="product-info">
            <h3>${escapeHtml(item.product.name)}</h3>

            <p>Size: ${escapeHtml(item.size)}</p>
            <p>Quantity: ${item.quantity}</p>

            <p>
              ${money(item.product.price * item.quantity)}
            </p>

            <button
              type="button"
              data-remove="${escapeHtml(item.id)}"
              data-size="${escapeHtml(item.size)}"
            >
              Remove
            </button>
          </div>
        `).join("")}

        <h2>Subtotal: ${money(subtotal)}</h2>

        <p>Checkout is not yet configured.</p>
      </section>
    `;
  }

  // Hash-based page routing.
  function render() {
    const hash = decodeURIComponent(
      location.hash.slice(1) || "home"
    );

    if (hash.startsWith("shop/")) {
      const [category, query = ""] = hash.slice(5).split("?");
      const params = new URLSearchParams(query);

      const allowed = ["women", "men", "kids", "all"];

      collection(
        allowed.includes(category) ? category : "all",
        params.get("sale") === "true",
        params.get("search") || ""
      );
    } else if (hash.startsWith("product/")) {
      productPage(hash.slice(8));
    } else if (hash === "favorites") {
      main.innerHTML = `
        <section class="products-section">
          <h1>Favorites</h1>
          ${grid(products.filter(product =>
            favorites.includes(product.id)
          ))}
        </section>
      `;
    } else if (hash === "bag") {
      bagPage();
    } else if (hash === "account") {
      main.innerHTML = `
        <section class="products-section">
          <h1>Account</h1>
          <p>Account login is not configured yet.</p>
        </section>
      `;
    } else {
      home();
    }

    save();
  }

  // Click handling.
  document.addEventListener("click", event => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const favoriteButton = target.closest("[data-favorite]");

    if (favoriteButton) {
      const id = favoriteButton.dataset.favorite;

      favorites = favorites.includes(id)
        ? favorites.filter(item => item !== id)
        : [...favorites, id];

      render();
      notify("Favorites updated");
      return;
    }

    const addButton = target.closest("[data-add]");

    if (addButton) {
      const id = addButton.dataset.add;
      const sizeSelector = document.getElementById("product-size");
      const size = sizeSelector?.value || "One Size";

      const item = bag.find(
        entry => entry.id === id && entry.size === size
      );

      if (item) {
        item.quantity += 1;
      } else {
        bag.push({
          id,
          size,
          quantity: 1
        });
      }

      save();
      notify("Added to bag");
      return;
    }

    const removeButton = target.closest("[data-remove]");

    if (removeButton) {
      const id = removeButton.dataset.remove;
      const size = removeButton.dataset.size;

      bag = bag.filter(
        item => !(item.id === id && item.size === size)
      );

      render();
      notify("Removed from bag");
    }
  });

  // Search form handling.
  document.addEventListener("submit", event => {
    if (event.target.id !== "shop-search-form") {
      return;
    }

    event.preventDefault();

    const form = event.target;
    const search = form.querySelector("#shop-search")?.value.trim() || "";

    const currentHash = location.hash.slice(1);
    const currentCategory = currentHash.split("?")[0]
      .replace("shop/", "");

    const category = ["women", "men", "kids", "all"]
      .includes(currentCategory)
      ? currentCategory
      : "all";

    const query = new URLSearchParams();

    if (search) {
      query.set("search", search);
    }

    location.hash = `shop/${category}${
      query.toString() ? "?" + query.toString() : ""
    }`;

    // Refresh when submitting the same search twice.
    render();
  });

  window.addEventListener("hashchange", render);

  // Load product catalog relative to this JavaScript file.
  const productsUrl = scriptUrl
    ? new URL("products.json", scriptUrl)
    : "products.json";

  fetch(productsUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(
          `Unable to load products: HTTP ${response.status}`
        );
      }

      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        throw new Error("Product catalog must be an array.");
      }

      products = data;
      render();
    })
    .catch(error => {
      console.error("CAAVON product loading error:", error);

      main.innerHTML = `
        <section class="products-section">
          <h1>Unable to load products</h1>
          <p>Please refresh the page or try again later.</p>
        </section>
      `;
    });
})();
