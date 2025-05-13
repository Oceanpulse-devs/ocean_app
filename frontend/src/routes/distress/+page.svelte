<script lang="ts">
  interface Product {
    id: number;
    name: string;
    originalPrice: number;
    discountedPrice: number;
    location: string;
    brand: string;
    image: string;
    description: string;
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
      description: "Gently used Nike sneakers, perfect for running and casual wear.",
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
      description: "Classic Air Jordan 1, lightly worn, still in great condition!",
      seller: {
        name: "Tola Thompson",
        avatar: "/test.jpg.jpg",
        timestamp: "2nd February, 05 PM"
      }
    },
    {
      id: 3,
      name: "Air Jordan 1",
      originalPrice: 150,
      discountedPrice: 110,
      location: "Lagos",
      brand: "Nike",
      image: "/test.jpg.jpg",
      description: "Selling my Air Jordans, barely used. DM for more info.",
      seller: {
        name: "Tola Thompson",
        avatar: "/test.jpg.jpg",
        timestamp: "2nd February, 05 PM"
      }
    },
    {
      id: 4,
      name: "Air Jordan 1",
      originalPrice: 150,
      discountedPrice: 110,
      location: "Lagos",
      brand: "Nike",
      image: "/test.jpg.jpg",
      description: "Great deal on these Jordans! Only worn a few times.",
      seller: {
        name: "Tola Thompson",
        avatar: "/test.jpg.jpg",
        timestamp: "2nd February, 05 PM"
      }
    },
    {
      id: 5,
      name: "Air Jordan 1",
      originalPrice: 150,
      discountedPrice: 110,
      location: "Lagos",
      brand: "Nike",
      image: "/test.jpg.jpg",
      description: "Moving out sale! Grab these Air Jordans at a discount.",
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

          <div class="product-image">
            <img src={product.image} alt={product.name} />
            <div class="discount-badge">
              {Math.round((1 - product.discountedPrice / product.originalPrice) * 100)}% OFF
            </div>
          </div>

        <div class="product-description">{product.description}</div>
        <div class="product-location">
          <svg class="location-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span>{product.location}</span>
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
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    padding: 2rem;
    padding-top: 88px; /* 72px navbar + 16px gap */
  }

  @media (max-width: 768px) {
  .distress-content {
      padding: 0;
      padding-top: 64px; /* 56px navbar + 8px gap for mobile */
    }

    .search-bar {
      margin-bottom: 1rem;
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
      padding: 1rem;
    }
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
    box-shadow: none;
    border: none;
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

  .product-description {
    margin: 1rem 0 0.5rem 0;
    color: #444;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    word-break: break-word;
    }

  .product-location {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6366F1;
    font-size: 0.95rem;
    margin-bottom: 1rem;
    margin-top: 0.25rem;
    font-weight: 500;
  }

  .location-icon {
    width: 1.1rem;
    height: 1.1rem;
    fill: #6366F1;
    flex-shrink: 0;
  }
</style> 