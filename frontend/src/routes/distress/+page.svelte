<script lang="ts">
  interface Product {
    id: number;
    name: string;
    originalPrice: number;
    discountedPrice: number;
    location: string;
    brand: string;
    image: string;
    seller: {
      name: string;
      avatar: string;
      timestamp: string;
    };
  }

  let products: Product[] = [
    {
      id: 1,
      name: "Nike Sneakers",
      originalPrice: 120,
      discountedPrice: 90,
      location: "Ikeja",
      brand: "Nike",
      image: "/test.jpg.jpg",
      seller: {
        name: "MBT CEO",
        avatar: "/wrigglyLine2.png",
        timestamp: "1st February, 03 PM"
      }
    },
    {
      id: 2,
      name: "Air Jordan 1",
      originalPrice: 150,
      discountedPrice: 110,
      location: "Lagos",
      brand: "Nike",
      image: "/test.jpg.jpg",
      seller: {
        name: "Tola Thompson",
        avatar: "/test.jpg.jpg",
        timestamp: "2nd February, 05 PM"
      }
    }
    // Add more products as needed
  ];
</script>

<div class="distress-content">
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
    {#each products as product (product.id)}
      <div class="product-card">
        <div class="seller-info">
          <img src={product.seller.avatar} alt={product.seller.name} class="seller-avatar" />
          <div class="seller-details">
            <span class="seller-name">{product.seller.name}</span>
            <span class="post-time">{product.seller.timestamp}</span>
          </div>
        </div>

        <div class="product-info">
          <div class="info-row">
            <span class="label">PRODUCT NAME:</span>
            <span class="value">{product.name}</span>
          </div>
          <div class="info-row">
            <span class="label">LOCATION:</span>
            <span class="value">{product.location}</span>
          </div>
          <div class="info-row">
            <span class="label">BRAND:</span>
            <span class="value">{product.brand}</span>
          </div>
          <div class="info-row">
            <span class="label">PRICE:</span>
            <span class="value price">
              <span class="discounted">${product.discountedPrice}</span>
              <span class="original">${product.originalPrice}</span>
            </span>
          </div>
        </div>

        <div class="product-image">
          <img src={product.image} alt={product.name} />
          <div class="discount-badge">
            {Math.round((1 - product.discountedPrice / product.originalPrice) * 100)}% OFF
          </div>
        </div>

        <div class="product-actions">
          <button class="message-btn">Message</button>
          <button class="save-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .distress-content {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #FAF9F6;
    padding: 2rem;
  }

  .search-bar {
    margin-bottom: 2rem;
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
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
    padding: 1rem 1rem 8rem 1rem;
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
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .seller-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .seller-avatar {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    object-fit: cover;
  }

  .seller-details {
    display: flex;
    flex-direction: column;
  }

  .seller-name {
    font-weight: 600;
    color: #2D3748;
  }

  .post-time {
    font-size: 0.875rem;
    color: #718096;
  }

  .product-info {
    margin-bottom: 1.5rem;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .label {
    color: #6366F1;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .value {
    color: #2D3748;
    font-size: 0.875rem;
  }

  .price .discounted {
    font-weight: 600;
    color: #2D3748;
    margin-right: 0.5rem;
  }

  .price .original {
    text-decoration: line-through;
    color: #718096;
  }

  .product-image {
    position: relative;
    margin-bottom: 1.5rem;
    border-radius: 0.75rem;
    overflow: hidden;
    background: #FDF6E3;
  }

  .product-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .discount-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: #EF4444;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .product-actions {
    display: flex;
    gap: 1rem;
  }

  .message-btn {
    flex: 1;
    padding: 0.75rem;
    background: #6366F1;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .message-btn:hover {
    background: #4F46E5;
  }

  .save-btn {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F3F4F6;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .save-btn:hover {
    background: #E5E7EB;
  }

  .save-btn svg {
    width: 1.25rem;
    height: 1.25rem;
    color: #6B7280;
  }

  @media (max-width: 768px) {
    .distress-content {
      padding: 1rem;
    }

    .products-grid {
      grid-template-columns: 1fr;
    }

    .search-input {
      margin: 0 1rem;
    }
  }
</style> 