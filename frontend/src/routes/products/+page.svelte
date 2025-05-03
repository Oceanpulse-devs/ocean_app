<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';

  let userStats = {
    posts: 46,
    followers: '2.8K',
    following: 200
  };

  let products = [
    {
      id: 1,
      name: 'Beauty Blk/whi iPhone 12 Case',
      seller: 'MTB CEO',
      price: 200,
      image: '/products/case-1.jpg'
    },
    {
      id: 2,
      name: 'Sky blue iPhone 11 pro case',
      seller: 'Jessy Stores',
      price: 200,
      image: '/products/case-2.jpg'
    },
    {
      id: 3,
      name: 'Ultraboost Head of charger',
      seller: 'Tola Thompson',
      price: 200,
      image: '/products/charger-1.jpg'
    },
    {
      id: 4,
      name: 'Unisex iPhone 13 pro case',
      seller: 'Cody Fisher Stores',
      price: 200,
      image: '/products/case-3.jpg'
    },
    {
      id: 5,
      name: 'Original White Apple earbuds',
      seller: 'Thompson Stores',
      price: 200,
      image: '/products/earbuds-1.jpg'
    },
    {
      id: 6,
      name: 'Original white iPhone Charger',
      seller: 'MTB CEO',
      price: 200,
      image: '/products/charger-2.jpg'
    }
  ];

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
</script>

<div class="page-wrapper">
  <Sidebar {userStats} />
  
  <main class="main-content">
    <div class="search-section">
      <div class="search-box">
        <input type="text" placeholder="Search by text or image" />
        <button class="camera-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/>
            <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
          </svg>
        </button>
      </div>
      <div class="filters">
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

  <aside class="categories">
    <nav class="categories-nav">
      {#each categories as category}
        <a href="#{category.id}" class="category-item">
          <span class="category-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d={category.icon} />
            </svg>
          </span>
          {category.name}
          <svg class="chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M9.4 18L8 16.6l4.6-4.6L8 7.4 9.4 6l6 6z"/>
          </svg>
        </a>
      {/each}
    </nav>
  </aside>
</div>

<style>
  .page-wrapper {
    display: flex;
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    background-color: #faf9f6;
  }

  .categories {
    width: 280px;
    background-color: white;
    padding: 2rem 1rem;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .search-section {
    margin-bottom: 2rem;
  }

  .search-box {
    position: relative;
    max-width: 600px;
    margin-bottom: 1rem;
  }

  .search-box input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 1rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 9999px;
    font-size: 0.95rem;
  }

  .camera-btn {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    padding: 0.25rem;
  }

  .camera-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .filters {
    display: flex;
    gap: 1rem;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    background-color: white;
    color: #2d3748;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .filter-btn svg {
    width: 1rem;
    height: 1rem;
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

  .category-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    color: #2d3748;
    text-decoration: none;
    border-radius: 0.5rem;
    transition: background-color 0.2s;
  }

  .category-item:hover {
    background-color: #f7fafc;
  }

  .category-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
  }

  .category-icon svg {
    width: 1.25rem;
    height: 1.25rem;
    color: #718096;
  }

  .chevron {
    width: 1.25rem;
    height: 1.25rem;
    color: #718096;
    margin-left: auto;
  }

  @media (max-width: 1400px) {
    .products-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 1280px) {
    .categories {
      display: none;
    }
    .main-content {
      width: calc(100% - 250px);
    }
  }

  @media (max-width: 768px) {
    :global(.sidebar) {
      display: none;
    }
    .main-content {
      width: 100%;
      margin-left: 0;
      padding: 1rem;
    }
    .products-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 