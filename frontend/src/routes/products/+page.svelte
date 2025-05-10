<script lang="ts">
  let userStats = {
    posts: 46,
    followers: '2.8K',
    following: 200
  };

  let showSearchOptions = false;
  let searchQuery = '';
  let selectedSearchOption = 'all';

  const searchOptions = [
    { id: 'all', label: 'All' },
    { id: 'products', label: 'Products' },
    { id: 'sellers', label: 'Sellers' },
    { id: 'descriptions', label: 'Descriptions' }
  ];

  function toggleSearchOptions() {
    showSearchOptions = !showSearchOptions;
  }

  function selectSearchOption(option: string) {
    selectedSearchOption = option;
    showSearchOptions = false;
  }

  let products = [
    {
      id: 1,
      name: 'Beauty Blk/whi iPhone 12 Case',
      seller: 'MTB CEO',
      price: 200,
      image: '/test.jpg.jpg'
    },
    {
      id: 2,
      name: 'Sky blue iPhone 11 pro case',
      seller: 'Jessy Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 3,
      name: 'Ultraboost Head of charger',
      seller: 'Tola Thompson',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 4,
      name: 'Unisex iPhone 13 pro case',
      seller: 'Cody Fisher Stores',
      price: 200,
      image: '/test.jpg.jpg'
    },
    {
      id: 5,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 6,
      name: 'Original white iPhone Charger',
      seller: 'MTB CEO',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 7,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 8,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 9,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 10,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 11,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 12,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 13,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 14,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 15,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 16,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 17,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    },
    {
      id: 18,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/wrigglyLine2.png'
    }
  ];

  let showCategories = false;
  let selectedCategory = 'all';

  let categories = [
    { id: 'all', name: 'All Categories', icon: 'grid' },
    { id: 'home', name: 'Home & Office', icon: 'home' },
    { id: 'phones', name: 'Phones & Tablets', icon: 'phone' },
    { id: 'fashion', name: 'Fashion', icon: 'shirt' },
    { id: 'health', name: 'Health & Beauty', icon: 'heart' },
    { id: 'electronics', name: 'Electronics', icon: 'cpu' },
    { id: 'computing', name: 'Computing', icon: 'laptop' },
    { id: 'grocery', name: 'Grocery', icon: 'shopping-cart' },
    { id: 'garden', name: 'Garden & Outdoors', icon: 'tree' },
    { id: 'automobile', name: 'Automobile', icon: 'car' },
    { id: 'sports', name: 'Sporting Goods', icon: 'activity' },
    { id: 'gaming', name: 'Gaming', icon: 'gamepad' },
    { id: 'baby', name: 'Baby Products', icon: 'baby' }
  ];

  function toggleCategories() {
    showCategories = !showCategories;
  }

  function selectCategory(categoryId: string) {
    selectedCategory = categoryId;
    showCategories = false;
  }

  let bannerImages = [
    { src: '/wrigglyLine2.png', text: 'Welcome to the Ocean Market! Discover the best deals, new arrivals, and trending products.' },
    { src: '/test.jpg.jpg', text: 'Shop now and enjoy a premium experience.' },
    { src: '/wrigglyLine2.png', text: 'Don\'t miss out on exclusive offers!' }
  ];
  let currentBanner = 0;
  let bannerInterval: ReturnType<typeof setInterval>;

  import { onMount, onDestroy } from 'svelte';

  onMount(() => {
    bannerInterval = setInterval(() => {
      currentBanner = (currentBanner + 1) % bannerImages.length;
    }, 3500);
  });
  onDestroy(() => {
    clearInterval(bannerInterval);
  });

  let showBrandFilter = false;
  let showPriceFilter = false;

  function toggleFilter(filter: 'brand' | 'price') {
    if (filter === 'brand') {
      showBrandFilter = !showBrandFilter;
      showPriceFilter = false;
    } else {
      showPriceFilter = !showPriceFilter;
      showBrandFilter = false;
    }
  }

  // Mapping of icon names to SVG path data
  const iconPaths = {
    grid: "M3 3h18v18H3V3zm2 2v14h14V5H5zm4 4h6v6H9V9z",
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    phone: "M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.21.49 2.53.76 3.88.76a1 1 0 011 1v3.5a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.27 1.11l-2.2 2.2z",
    shirt: "M16.7 4.29l-2.39-.8a2 2 0 00-1.32 0l-2.39.8A2 2 0 008 6.09V20a1 1 0 001 1h6a1 1 0 001-1V6.09a2 2 0 00-1.3-1.8zM12 2a2 2 0 012 2v2h-4V4a2 2 0 012-2z",
    heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    cpu: "M9 9h6v6H9V9zm13 3h-2V8a2 2 0 00-2-2h-4V4a1 1 0 00-2 0v2H6a2 2 0 00-2 2v4H2a1 1 0 000 2h2v4a2 2 0 002 2h4v2a1 1 0 002 0v-2h4a2 2 0 002-2v-4h2a1 1 0 000-2zM6 8h12v8H6V8z",
    laptop: "M20 18v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8H0v2a2 2 0 002 2h20a2 2 0 002-2v-2h-4zm-2 0H6v-8h12v8z",
    'shopping-cart': "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14.26l.03-.12L7.9 12h8.45c.75 0 1.41-.41 1.75-1.03l3.24-5.88A1 1 0 0020.45 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.26-.25z",
    tree: "M12 2C10.34 2 9 3.34 9 5c0 .88.39 1.67 1 2.22V9H7.5C6.12 9 5 10.12 5 11.5c0 .83.34 1.58.88 2.12C5.34 14.42 5 15.17 5 16c0 1.38 1.12 2.5 2.5 2.5h9c1.38 0 2.5-1.12 2.5-2.5 0-.83-.34-1.58-.88-2.12.54-.54.88-1.29.88-2.12C19 10.12 17.88 9 16.5 9H15V7.22c.61-.55 1-1.34 1-2.22 0-1.66-1.34-3-3-3z",
    car: "M5 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm14 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM18.92 6.01C18.72 5.42 18.15 5 17.5 5h-11c-.65 0-1.22.42-1.42 1.01L3 9v8c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-1h6v1c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2V9l-1.08-2.99zM6.5 7h11l.94 2.5H5.56L6.5 7z",
    activity: "M22 12h-4l-3 9L9 3l-3 9H2",
    gamepad: "M6.94 6.94a8 8 0 1110.12 0M15 12h.01M9 12h.01M12 15v.01M12 9V9.01",
    baby: "M12 2a5 5 0 00-5 5v1a5 5 0 0010 0V7a5 5 0 00-5-5zm0 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z"
  };
</script>

<main class="main-container shiny-bg">
  <!-- Mobile Category Bar -->
  <div class="category-bar mobile-only">
    <ul>
      {#each categories as category}
        <li class="category-pill" class:selected={selectedCategory === category.id} on:click={() => selectCategory(category.id)}>
          <span class="category-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d={iconPaths[category.icon as keyof typeof iconPaths] || ""} />
            </svg>
          </span>
          {category.name}
        </li>
      {/each}
    </ul>
  </div>

  <div class="main-content">
    <div class="top-section">
      <!-- Desktop Side Category Panel -->
      <div class="side-category-panel desktop-only">
        <h3 class="panel-title">Categories</h3>
        <ul class="category-list">
          {#each categories as category}
            <li class="category-item" class:selected={selectedCategory === category.id} on:click={() => selectCategory(category.id)}>
              <span class="category-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d={iconPaths[category.icon as keyof typeof iconPaths] || ""} />
                </svg>
              </span>
              {category.name}
            </li>
          {/each}
        </ul>
      </div>

      <div class="banner-section">
        <div class="banner-slider">
          <img src={bannerImages[currentBanner].src} alt="Market Banner" class="banner-img" />
          <div class="banner-text">
            <h2>Ocean Market</h2>
            <p>{bannerImages[currentBanner].text}</p>
          </div>
          <div class="banner-dots">
            {#each bannerImages as _, i}
              <span class="dot" class:active={i === currentBanner} on:click={() => currentBanner = i}></span>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <div class="products-layout">
      <div class="products-main">
        <div class="section-heading">Products</div>
    <div class="search-section">
      <div class="search-box">
            <div class="search-input-wrapper">
              <input 
                type="text" 
                placeholder="Search by text or image" 
                bind:value={searchQuery}
              />
              <div class="search-type" on:click={toggleSearchOptions}>
                <span class="selected-option">
                  {searchOptions.find(opt => opt.id === selectedSearchOption)?.label}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="dropdown-icon">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
        <button class="camera-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/>
            <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
          </svg>
        </button>
      </div>
            
            {#if showSearchOptions}
              <div class="search-options">
                {#each searchOptions as option}
                  <button 
                    class="option-btn" 
                    class:selected={selectedSearchOption === option.id}
                    on:click={() => selectSearchOption(option.id)}
                  >
                    {option.label}
                  </button>
                {/each}
              </div>
            {/if}

      <div class="filters">
              <div class="filter-dropdown">
                <button class="filter-btn" on:click={() => toggleFilter('brand')}>
                  <span class="filter-label">Brand</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-icon" class:open={showBrandFilter} viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
                
                {#if showBrandFilter}
                  <div class="filter-options">
                    <button class="filter-option">All Brands</button>
                    <button class="filter-option">Apple</button>
                    <button class="filter-option">Samsung</button>
                    <button class="filter-option">Nike</button>
                    <button class="filter-option">Adidas</button>
                  </div>
                {/if}
              </div>

              <div class="filter-dropdown">
                <button class="filter-btn" on:click={() => toggleFilter('price')}>
                  <span class="filter-label">Price</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-icon" class:open={showPriceFilter} viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
                
                {#if showPriceFilter}
                  <div class="filter-options">
                    <button class="filter-option">All Prices</button>
                    <button class="filter-option">Under ₦1,000</button>
                    <button class="filter-option">₦1,000 - ₦5,000</button>
                    <button class="filter-option">₦5,000 - ₦10,000</button>
                    <button class="filter-option">Over ₦10,000</button>
                  </div>
                {/if}
              </div>
            </div>
      </div>
    </div>

    <div class="products-grid">
          <div class="category-section">
            <h2 class="category-header">Featured Products</h2>
            <div class="products-row">
              {#each products.slice(0, 6) as product}
                <div class="product-card">
                  <img src={product.image} alt={product.name} class="product-image" />
                  <div class="product-info">
                    <div class="product-name">{product.name}</div>
                    <div class="product-seller">{product.seller}</div>
                    <div class="product-pricing">
                      <span class="product-price">₦{product.price}</span>
                      <span class="product-old-price">₦{product.price * 1.5}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div class="category-section">
            <h2 class="category-header">New Arrivals</h2>
            <div class="products-row">
              {#each products.slice(6, 12) as product}
                <div class="product-card">
                  <img src={product.image} alt={product.name} class="product-image" />
                  <div class="product-info">
                    <div class="product-name">{product.name}</div>
                    <div class="product-seller">{product.seller}</div>
                    <div class="product-pricing">
                      <span class="product-price">₦{product.price}</span>
                      <span class="product-old-price">₦{product.price * 1.5}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div class="category-section">
            <h2 class="category-header">Best Sellers</h2>
            <div class="products-row">
              {#each products.slice(12) as product}
        <div class="product-card">
                  <img src={product.image} alt={product.name} class="product-image" />
          <div class="product-info">
                    <div class="product-name">{product.name}</div>
                    <div class="product-seller">{product.seller}</div>
                    <div class="product-pricing">
                      <span class="product-price">₦{product.price}</span>
                      <span class="product-old-price">₦{product.price * 1.5}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </main>

<style>
  .shiny-bg {
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    min-height: 100vh;
    padding-bottom: 2rem;
  }
  .category-bar {
    width: 100%;
    background: #fff;
    border-radius: 0 0 1rem 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    margin-bottom: 1.5rem;
    padding: 0.5rem 2rem 0.5rem 2rem;
    overflow-x: auto;
    display: flex;
    align-items: center;
  }
  .category-bar ul {
    display: flex;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0;
    width: 100%;
  }
  .category-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    background: #f7f7fa;
    color: #222;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    border: none;
    white-space: nowrap;
  }
  .category-pill.selected, .category-pill:hover {
    background: #111;
    color: #fff;
  }
  .category-icon svg {
    width: 1.1rem;
    height: 1.1rem;
    fill: #bbb;
  }
  .banner-section {
    width: 100%;
    background: #fff;
    border-radius: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    margin-bottom: 2rem;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .banner-slider {
    width: 100%;
    max-width: 900px;
    min-height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    position: relative;
    padding: 2rem 2rem 2rem 2rem;
  }
  .banner-img {
    height: 120px;
    width: 120px;
    object-fit: contain;
    border-radius: 1rem;
    background: #f7f7fa;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    flex-shrink: 0;
  }
  .banner-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }
  .banner-text h2 {
    font-size: 2rem;
    font-weight: 800;
    color: #111;
    margin: 0 0 0.5rem 0;
  }
  .banner-text p {
    font-size: 1.1rem;
    color: #333;
    margin: 0;
    font-weight: 400;
  }
  .banner-dots {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.5rem;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #e2e8f0;
    cursor: pointer;
    transition: background 0.2s;
  }
  .dot.active {
    background: #111;
  }
  .products-layout {
    display: flex;
    gap: 2rem;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
  }
  .products-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .section-heading {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111;
    margin: 0 0 1.5rem 0;
    padding-left: 0;
    letter-spacing: 0.01em;
  }
  .search-section {
    margin-bottom: 2rem;
    width: 100%;
    display: flex;
    justify-content: flex-start;
  }
  .search-box {
    width: 100%;
    max-width: 500px;
    margin: 0;
    position: relative;
  }
  .search-input-wrapper {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 9999px;
    padding-right: 0.5rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  }
  .search-input-wrapper input {
    flex: 1;
    padding: 0.75rem 0.5rem 0.75rem 1.25rem;
    border: none;
    font-size: 1rem;
    background: transparent;
    color: #111;
  }
  .search-input-wrapper input:focus {
    outline: none;
  }
  .search-type {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem 0.75rem;
    border-left: 1px solid #e2e8f0;
    cursor: pointer;
    color: #444;
    background: none;
  }
  .dropdown-icon {
    width: 1rem;
    height: 1rem;
    display: inline-block;
    vertical-align: middle;
  }
  .camera-btn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background 0.15s;
    margin-left: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .camera-btn:hover {
    background: #f3f4f6;
  }
  .camera-btn svg {
    width: 1.1rem;
    height: 1.1rem;
  }
  .search-options {
    position: absolute;
    top: 110%;
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    margin-top: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07);
    z-index: 50;
  }
  .option-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    color: #222;
    font-size: 1rem;
    text-align: left;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: background 0.15s;
  }
  .option-btn.selected, .option-btn:hover {
    background: #f3f4f6;
    color: #111;
  }
  .products-grid {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 0 0.5rem;
  }
  .category-section {
    width: 100%;
  }
  .category-header {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    padding: 1rem 1.5rem;
    margin: 0 0 1rem 0;
    background: linear-gradient(135deg, #111 0%, #333 100%);
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
  }
  .category-header::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
    animation: shine 2s infinite;
  }
  @keyframes shine {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  .products-row {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
  }
  .product-card {
    background: #fff;
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    min-height: 200px;
    min-width: 120px;
    box-shadow: none;
    border: none;
    transition: transform 0.15s;
  }
  .product-card:hover {
    transform: translateY(-2px) scale(1.02);
  }
  .product-image {
    width: 100%;
    height: 120px;
    object-fit: contain;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    background: #f7f7fa;
    min-height: 80px;
    min-width: 80px;
    display: block;
  }
  .product-info {
    width: 100%;
    text-align: left;
  }
  .product-name {
    font-size: 1rem;
    font-weight: 700;
    color: #111;
    margin-bottom: 0.15rem;
    line-height: 1.2;
  }
  .product-seller {
    font-size: 0.85rem;
    color: #888;
    margin-bottom: 0.15rem;
  }
  .product-pricing {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }
  .product-price {
    font-size: 1.05rem;
    font-weight: 700;
    color: #111;
  }
  .product-old-price {
    font-size: 0.9rem;
    color: #bbb;
    text-decoration: line-through;
    font-weight: 400;
  }
  @media (max-width: 1200px) {
    .products-row {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  @media (max-width: 900px) {
    .products-row {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  @media (max-width: 768px) {
    .products-layout {
      flex-direction: column;
      gap: 0;
    }
    .category-bar {
      padding: 0.5rem 0.5rem 0.5rem 0.5rem;
      border-radius: 0 0 0.7rem 0.7rem;
    }
    .banner-section {
      padding: 0;
      border-radius: 0 0 1rem 1rem;
      width: 100%;
      min-width: 0;
      display: flex;
      justify-content: center;
      align-items: stretch;
    }
    .banner-slider {
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      min-height: 100px;
      padding: 1rem 0.5rem 1rem 0.5rem;
      width: 100%;
      box-sizing: border-box;
    }
    .banner-img {
      height: 56px;
      width: 56px;
      margin-bottom: 0.5rem;
    }
    .banner-text {
      align-items: center;
      text-align: center;
      width: 100%;
    }
    .banner-text h2 {
      font-size: 1.15rem;
      margin-bottom: 0.25rem;
    }
    .banner-text p {
      font-size: 0.95rem;
    }
    .section-heading {
      font-size: 1.1rem;
      padding-left: 0.5rem;
    }
    .search-section {
      margin-bottom: 1rem;
    }
    .products-row {
      display: flex;
      overflow-x: auto;
      gap: 1rem;
      padding: 0.5rem 0;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }
    .product-card {
      flex: 0 0 calc(50% - 0.5rem);
      scroll-snap-align: start;
      min-width: 160px;
    }
    .category-header {
      font-size: 1.25rem;
      padding: 0.75rem 1rem;
    }
  }

  .main-container {
    padding: 1rem;
    position: relative;
  }

  .main-content {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
  }

  .top-section {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .side-category-panel {
    width: 280px;
    background: #fff;
    border-radius: 1rem;
    padding: 1.5rem;
    height: fit-content;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    flex-shrink: 0;
  }

  .panel-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111;
    margin: 0 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .category-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .category-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    color: #444;
    cursor: pointer;
    transition: all 0.15s;
    font-size: 0.95rem;
  }

  .category-item:hover {
    background: #f7f7fa;
    color: #111;
  }

  .category-item.selected {
    background: #111;
    color: #fff;
  }

  .category-item .category-icon svg {
    width: 1.1rem;
    height: 1.1rem;
    fill: currentColor;
  }

  .mobile-only {
    display: none;
  }

  .desktop-only {
    display: block;
  }

  @media (max-width: 1024px) {
    .top-section {
      flex-direction: column;
      gap: 1rem;
    }

    .side-category-panel {
      display: none;
    }

    .mobile-only {
      display: block;
    }

    .desktop-only {
      display: none;
    }

    .banner-section {
      width: 100%;
    }
  }

  .filters {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    padding: 0 0.5rem;
  }

  .filter-dropdown {
    position: relative;
    flex: 1;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    color: #444;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.15s;
    width: 100%;
  }

  .filter-btn:hover {
    background: #f7f7fa;
    border-color: #cbd5e1;
  }

  .filter-label {
    font-weight: 500;
  }

  .dropdown-icon {
    width: 1rem;
    height: 1rem;
    transition: transform 0.2s;
  }

  .dropdown-icon.open {
    transform: rotate(180deg);
  }

  .filter-options {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 0.5rem;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07);
    z-index: 50;
  }

  .filter-option {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    background: none;
    border: none;
    color: #444;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .filter-option:hover {
    background: #f7f7fa;
    color: #111;
  }

  .filter-option:first-child {
    border-radius: 0.5rem 0.5rem 0 0;
  }

  .filter-option:last-child {
    border-radius: 0 0 0.5rem 0.5rem;
  }

  @media (max-width: 768px) {
    .filters {
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-btn {
      width: 100%;
    }

    .filter-options {
      width: 100%;
    }
  }
</style> 