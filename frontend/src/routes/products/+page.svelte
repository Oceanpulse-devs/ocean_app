<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';

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
</script>

<div class="page-wrapper">
  <Sidebar {userStats} />
  
  <main class="main-content">
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
      </div>

      <div class="filters">
        <div class="category-dropdown">
          <button class="category-btn" on:click={toggleCategories}>
            <span class="category-label">
              {categories.find(cat => cat.id === selectedCategory)?.name || 'Select Category'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-icon" class:open={showCategories} viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {#if showCategories}
            <div class="categories-dropdown">
              {#each categories as category}
                <button 
                  class="category-option" 
                  class:selected={selectedCategory === category.id}
                  on:click={() => selectCategory(category.id)}
                >
                  <span class="category-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d={category.icon} />
                    </svg>
                  </span>
                  {category.name}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <button class="filter-btn">
          Brand
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
        <button class="filter-btn">
          Price
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="products-grid">
      {#each products as product}
        <div class="product-card">
          <img src={product.image} alt={product.name} />
          <div class="product-info">
            <h3>{product.name}</h3>
            <p class="seller">{product.seller}</p>
            <div class="price-row">
              <span class="price">${product.price}</span>
              <button class="bookmark-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                </svg>
              </button>
            </div>
            <button class="view-btn">View</button>
          </div>
        </div>
      {/each}
    </div>
  </main>
</div>

<style>
  .page-wrapper {
    display: grid;
    grid-template-columns: 250px 1fr;
    height: 100vh;
    background-color: #f8f7f4;
    overflow: hidden;
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
  }

  .main-content {
    padding: 3rem 2rem 4rem 2rem;
    background-color: #faf9f6;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .search-section {
    background-color: #faf9f6;
    padding: 1rem 0;
    margin-bottom: 2rem;
  }

  .search-box {
    position: relative;
    max-width: 800px;
    margin: 0 auto 1rem;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 9999px;
    padding-right: 0.5rem;
  }

  .search-box input {
    flex: 1;
    padding: 1rem 0.5rem 1rem 1.5rem;
    border: none;
    font-size: 1rem;
    background: transparent;
  }

  .search-box input:focus {
    outline: none;
  }

  .search-input-wrapper:focus-within {
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  .search-type {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-left: 1px solid rgba(0, 0, 0, 0.1);
    cursor: pointer;
    color: #4a5568;
  }

  .dropdown-icon {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.2s;
  }

  .search-options {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    margin-top: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 50;
  }

  .option-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    background: none;
    border: none;
    color: #4a5568;
    cursor: pointer;
    transition: all 0.2s;
  }

  .option-btn:hover {
    background-color: #f7fafc;
  }

  .option-btn.selected {
    background-color: #ebf8ff;
    color: #4299e1;
  }

  .camera-btn {
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
  }

  .camera-btn svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .filters {
    display: flex;
    gap: 1rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .category-dropdown {
    position: relative;
    flex: 1;
  }

  .category-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    color: #2d3748;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .category-btn:hover {
    border-color: #4299e1;
  }

  .dropdown-icon {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.2s;
  }

  .dropdown-icon.open {
    transform: rotate(180deg);
  }

  .categories-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    max-height: 300px;
    overflow-y: auto;
    z-index: 50;
  }

  .category-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    color: #4a5568;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
  }

  .category-option:hover {
    background-color: #f7fafc;
  }

  .category-option.selected {
    background-color: #ebf8ff;
    color: #4299e1;
  }

  .category-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
  }

  .category-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    background-color: white;
    color: #2d3748;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-btn:hover {
    border-color: #4299e1;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
    padding-top: 1rem;
  }

  .product-card {
    background-color: white;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .product-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .product-info {
    padding: 1rem;
  }

  .product-info h3 {
    margin: 0;
    font-size: 1rem;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .seller {
    color: #718096;
    font-size: 0.875rem;
    margin: 0;
  }

  .price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 1rem 0;
  }

  .price {
    color: #2d3748;
    font-weight: 600;
  }

  .bookmark-btn {
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    padding: 0.25rem;
  }

  .bookmark-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .view-btn {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 0.5rem;
    background-color: #4299e1;
    color: white;
    font-weight: 500;
    cursor: pointer;
  }

  @media (max-width: 1024px) {
    .page-wrapper {
      grid-template-columns: 1fr;
      position: fixed;
    }

    :global(.sidebar) {
      display: none;
    }

    .main-content {
      padding: 1rem;
    }

    .search-box,
    .filters {
      max-width: 100%;
    }
  }
</style> 