<script lang="ts">
  interface Product {
    id: number;
    name: string;
    originalPrice: number;
    discountedPrice: number;
    location: string;
    brand: string;
    images: string[];
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
      images: [
        "/test.jpg.jpg",
        "/wrigglyLine2.png",
        "/test.jpg.jpg",
        "/wrigglyLine2.png"
      ],
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
      images: [
        "/test.jpg.jpg",
        "/wrigglyLine2.png",
        "/test.jpg.jpg"
      ],
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
      images: [
        "/test.jpg.jpg",
        "/wrigglyLine2.png",
        "/test.jpg.jpg"
      ],
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
      images: [
        "/test.jpg.jpg",
        "/wrigglyLine2.png",
        "/test.jpg.jpg"
      ],
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
      images: [
        "/test.jpg.jpg",
        "/wrigglyLine2.png",
        "/test.jpg.jpg"
      ],
      description: "Moving out sale! Grab these Air Jordans at a discount.",
      seller: {
        name: "Tola Thompson",
        avatar: "/test.jpg.jpg",
        timestamp: "2nd February, 05 PM"
      }
    }
    // Add more products as needed
  ];

  // Image slider state
  let currentImageIndex = 0;
  let isModalOpen = false;
  let modalIndex = 0;

  // Add featured slider state
  let featuredIndex = 0;
  let featuredImages = [
    "/test.jpg.jpg",
    "/wrigglyLine2.png",
    "/test.jpg.jpg",
    "/wrigglyLine2.png"
  ];

  function openModal(index: number) {
    modalIndex = index;
    isModalOpen = true;
  }

  function closeModal() {
    isModalOpen = false;
  }

  function prevImage() {
    modalIndex = (modalIndex - 1 + products[0].images.length) % products[0].images.length;
  }

  function nextImage() {
    modalIndex = (modalIndex + 1) % products[0].images.length;
  }

  function nextFeatured() {
    featuredIndex = (featuredIndex + 1) % featuredImages.length;
  }

  function prevFeatured() {
    featuredIndex = (featuredIndex - 1 + featuredImages.length) % featuredImages.length;
  }

  // Auto-advance featured slider
  setInterval(() => {
    nextFeatured();
  }, 5000);
</script>

<div class="distress-content">
    <div class="sticky-search">
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
    </div>

    <div class="scrollable-content">
      <div class="featured-slider">
        <button class="slider-nav left" on:click={prevFeatured}>&lt;</button>
        <div class="slider-container">
          <div class="slider-track" style="transform: translateX(-{featuredIndex * 100}%)">
            {#each featuredImages as image}
              <div class="featured-image">
                <img src={image} alt="Featured product" />
                <div class="featured-overlay">
                  <h2>Featured Distress Sales</h2>
                  <p>Find the best deals on quality products</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
        <button class="slider-nav right" on:click={nextFeatured}>&gt;</button>
        <div class="slider-dots">
          {#each featuredImages as _, i}
            <button class="dot" class:active={i === featuredIndex} on:click={() => featuredIndex = i} />
          {/each}
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
              <img src={product.images[0]} alt={product.name} />
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

    {#if isModalOpen}
      <div class="modal-backdrop" on:click={closeModal}></div>
      <div class="modal">
        <button class="modal-close" on:click={closeModal}>&times;</button>
        <button class="modal-nav left" on:click={prevImage}>&lt;</button>
        <img class="modal-img" src={products[0].images[modalIndex]} alt="Zoomed image" />
        <button class="modal-nav right" on:click={nextImage}>&gt;</button>
        <div class="modal-thumbs">
          {#each products[0].images as img, idx}
            <img src={img} alt={`Thumb ${idx+1}`} class:active-thumb={idx === modalIndex} on:click={() => modalIndex = idx} />
          {/each}
        </div>
      </div>
    {/if}
</div>

<style>
  .distress-content {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    padding-top: 88px; /* 72px navbar + 16px gap */
  }

  .sticky-search {
    position: sticky;
    top: 0;
    z-index: 10;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    padding: 0.5rem 2rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 2rem 2rem;
  }

  .featured-slider {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto 1rem;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .search-bar {
    margin: 0;
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
    width: 100%;
    aspect-ratio: 16/10;
    border-radius: 1rem;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .product-image:hover img {
    transform: scale(1.05);
  }

  .discount-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: #ef4444;
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

  /* Modal styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
  }

  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .modal-img {
    max-width: 90vw;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 1rem;
  }

  .modal-close {
    position: absolute;
    top: -2rem;
    right: 0;
    background: none;
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
  }

  .modal-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    font-size: 2rem;
    padding: 1rem;
    cursor: pointer;
    border-radius: 50%;
  }

  .modal-nav.left {
    left: -4rem;
  }

  .modal-nav.right {
    right: -4rem;
  }

  .modal-thumbs {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .modal-thumbs img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 0.5rem;
    cursor: pointer;
    opacity: 0.7;
    transition: all 0.2s ease;
  }

  .modal-thumbs img.active-thumb {
    opacity: 1;
    border: 2px solid #2563eb;
  }

  @media (max-width: 768px) {
    .distress-content {
      padding-top: 64px; /* 56px navbar + 8px gap for mobile */
    }

    .sticky-search {
      padding: 0.5rem;
    }

    .scrollable-content {
      padding: 0 0.5rem 0.5rem;
    }

    .featured-slider {
      border-radius: 0;
      margin: 0 0 0.5rem 0;
    }

    .search-bar {
      margin-bottom: 0;
    }

    .search-input {
      border-radius: 1rem;
      padding: 0.5rem 1rem;
    }

    .product-image {
      aspect-ratio: 16/10;
    }

    .modal-nav {
      font-size: 1.5rem;
      padding: 0.75rem;
    }

    .modal-nav.left {
      left: 1rem;
    }

    .modal-nav.right {
      right: 1rem;
    }

    .modal-close {
      top: 1rem;
      right: 1rem;
    }
  }

  .slider-container {
    width: 100%;
    overflow: hidden;
  }

  .slider-track {
    display: flex;
    width: 100%;
    transition: transform 0.5s ease-in-out;
  }

  .featured-image {
    width: 100%;
    flex-shrink: 0;
    aspect-ratio: 16/6;
    position: relative;
  }

  .featured-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .featured-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3));
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2rem;
    color: white;
  }

  .featured-overlay h2 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.5s ease forwards;
    animation-delay: 0.2s;
  }

  .featured-overlay p {
    font-size: 1.1rem;
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.5s ease forwards;
    animation-delay: 0.4s;
  }

  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .slider-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 1.5rem;
    padding: 1rem;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.3s ease;
    z-index: 2;
  }

  .slider-nav:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-50%) scale(1.1);
  }

  .slider-nav.left {
    left: 1rem;
  }

  .slider-nav.right {
    right: 1rem;
  }

  .slider-dots {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.5rem;
    z-index: 2;
  }

  .dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .dot:hover {
    transform: scale(1.2);
  }

  .dot.active {
    background: white;
    transform: scale(1.2);
  }

  @media (max-width: 768px) {
    .featured-slider {
      margin: 0 0 1rem;
      border-radius: 0;
    }

    .featured-image {
      aspect-ratio: 16/9;
    }

    .featured-overlay h2 {
      font-size: 1.5rem;
    }

    .featured-overlay p {
      font-size: 1rem;
    }

    .slider-nav {
      font-size: 1.25rem;
      padding: 0.75rem;
    }
  }
</style> 