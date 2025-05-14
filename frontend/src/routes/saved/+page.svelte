<script lang="ts">
  interface SavedProduct {
    id: number;
    name: string;
    price: number;
    image: string;
    seller: {
      name: string;
      avatar: string;
    };
  }

  let savedProducts: SavedProduct[] = [
    {
      id: 1,
      name: "Beauty Blw/whi iPhone 12 Case",
      price: 200,
      image: "/test.jpg.jpg",
      seller: {
        name: "MTS CEO",
        avatar: "/wrigglyLine2.png"
      }
    },
    {
      id: 2,
      name: "Beauty Blw/whi iPhone 12 Case",
      price: 200,
      image: "/wrigglyLine2.png",
      seller: {
        name: "MTS CEO",
        avatar: "/test.jpg.jpg"
      }
    },
    {
      id: 3,
      name: "Beauty Blw/whi iPhone 12 Case",
      price: 200,
      image: "/test.jpg.jpg",
      seller: {
        name: "MTS CEO",
        avatar: "/wrigglyLine2.png"
      }
    },
    {
      id: 4,
      name: "Beauty Blw/whi iPhone 12 Case",
      price: 200,
      image: "/test.jpg.jpg",
      seller: {
        name: "MTS CEO",
        avatar: "/wrigglyLine2.png"
      }
    },
    {
      id: 5,
      name: "Beauty Blw/whi iPhone 12 Case",
      price: 200,
      image: "/test.jpg.jpg",
      seller: {
        name: "MTS CEO",
        avatar: "/wrigglyLine2.png"
      }
    },
    {
      id: 6,
      name: "Beauty Blw/whi iPhone 12 Case",
      price: 200,
      image: "/test.jpg.jpg",
      seller: {
        name: "MTS CEO",
        avatar: "/wrigglyLine2.png"
      }
    },
    {
      id: 7,
      name: "Beauty Blw/whi iPhone 12 Case",
      price: 200,
      image: "/test.jpg.jpg",
      seller: {
        name: "MTS CEO",
        avatar: "/wrigglyLine2.png"
      }
    }
  ];

  function removeFromSaved(productId: number) {
    savedProducts = savedProducts.filter(p => p.id !== productId);
  }
</script>

<main class="main-container">
  <div class="saved-content">
    <div class="search-bar">
      <div class="search-input">
        <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input type="text" placeholder="Search for product by text or image" />
        <button class="camera-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/>
            <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="products-grid">
      {#each savedProducts as product (product.id)}
        <div class="product-card">
          <div class="product-image">
            <img src={product.image} alt={product.name} />
          </div>

          <div class="product-info">
            <div class="seller-info">
              <img src={product.seller.avatar} alt={product.seller.name} class="seller-avatar" />
              <span class="seller-name">{product.seller.name}</span>
            </div>

            <h3 class="product-name">{product.name}</h3>
            <div class="price-row">
              <span class="price">${product.price}</span>
            </div>
          </div>

          <div class="product-actions">
            <button class="view-btn">View</button>
            <button class="remove-btn" on:click={() => removeFromSaved(product.id)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
    </div>
  </main>

<style>
  .main-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
  }

  .saved-content {
    min-height: calc(100vh - 65px);
    display: flex;
    flex-direction: column;
    padding: 2rem;
    padding-top: 88px; /* 72px navbar + 16px gap */
  }

  @media (max-width: 768px) {
    .saved-content {
      padding: 0;
      padding-top: 64px; /* 56px navbar + 8px gap for mobile */
    }

    .search-bar {
      top: 64px;
      padding: 0.5rem;
    }

    .search-input {
      border-radius: 1rem;
      padding: 0.5rem 1rem;
    }

    .products-grid {
      padding: 0.5rem;
      gap: 0.5rem;
      grid-template-columns: 1fr;
    }

    .product-card {
      border-radius: 0;
      margin-bottom: 0.5rem;
    }

    .product-image {
      aspect-ratio: 16/9;
    }
  }

  .search-bar {
    position: sticky;
    top: 88px; /* 72px navbar + 16px gap */
    z-index: 10;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    padding: 1rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .search-input {
    background: white;
    border-radius: 2rem;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    max-width: 800px;
    margin: 0 auto;
  }

  .search-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: #718096;
  }

  .search-input input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
    color: #2D3748;
    background: transparent;
  }

  .camera-btn {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
  }

  .camera-btn svg {
    width: 1.5rem;
    height: 1.5rem;
    color: #718096;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 1rem 1rem 4rem 1rem;
    align-items: stretch;
  }

  /* Custom Scrollbar Styling */
  .products-grid::-webkit-scrollbar {
    width: 4px;
  }

  .products-grid::-webkit-scrollbar-track {
    background: transparent;
  }

  .products-grid::-webkit-scrollbar-thumb {
    background-color: rgba(203, 213, 225, 0.4);
    border-radius: 20px;
  }

  .products-grid::-webkit-scrollbar-thumb:hover {
    background-color: rgba(148, 163, 184, 0.5);
  }

  /* Firefox */
  .products-grid {
    scrollbar-width: thin;
    scrollbar-color: rgba(203, 213, 225, 0.4) transparent;
  }

  .product-card {
    background: white;
    border-radius: 0.75rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .product-image {
    width: 100%;
    aspect-ratio: 1;
    background: white;
    flex-shrink: 0;
  }

  .product-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .product-info {
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .seller-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .seller-avatar {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    object-fit: cover;
  }

  .seller-name {
    font-size: 0.875rem;
    color: #4A5568;
  }

  .product-name {
    font-size: 1rem;
    font-weight: 500;
    color: #2D3748;
    margin: 0;
    margin-bottom: 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .price-row {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .price {
    font-weight: 600;
    color: #2D3748;
  }

  .product-actions {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #E2E8F0;
    flex-shrink: 0;
  }

  .view-btn {
    flex: 1;
    padding: 0.5rem;
    background: #6366F1;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .view-btn:hover {
    background: #4F46E5;
  }

  .remove-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F3F4F6;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .remove-btn:hover {
    background: #FEE2E2;
  }

  .remove-btn:hover svg {
    color: #EF4444;
  }

  .remove-btn svg {
    width: 1.25rem;
    height: 1.25rem;
    color: #6B7280;
    transition: color 0.2s;
  }

  @media (max-width: 1024px) {
    .products-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style> 