<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';

  let userStats = {
    posts: 46,
    followers: '2.8K',
    following: 200
  };

  // Mock data - will be replaced with actual API calls
  let auctions = [
    {
      id: 1,
      seller: {
        name: "MBT CEO",
        avatar: "/test.jpg.jpg",
        username: "@mbtceo",
        timestamp: "21 February, 05 PM"
      },
      product: {
        name: "Nike Sneakers",
        location: "Ikeja",
        brand: "Nike",
        price: 120,
        currentBid: 120,
        description: "Don't miss out! 🔥 Place your bid now and grab this deal before it's gone! 🔥 The best offer wins—will it be yours?",
        images: [
          "/test.jpg.jpg",
          "/wrigglyLine2.png",
          "/test.jpg.jpg",
          "/wrigglyLine2.png"
        ]
      }
    }
  ];

  let currentBid = 120;
  let bidAmount = "";
  let selectedAuction = auctions[0]; // For demo, showing first auction
  let currentImageIndex = 0;

  function handleBid() {
    if (parseFloat(bidAmount) > currentBid) {
      currentBid = parseFloat(bidAmount);
      bidAmount = "";
    }
  }

  function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % selectedAuction.product.images.length;
  }

  function previousImage() {
    currentImageIndex = (currentImageIndex - 1 + selectedAuction.product.images.length) % selectedAuction.product.images.length;
  }
</script>

<div class="layout">
  <Sidebar {userStats} />

  <main class="main-content">
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

    <div class="auction-post">
      <!-- Seller Info -->
      <div class="seller-info">
        <img src={selectedAuction.seller.avatar} alt={selectedAuction.seller.name} class="seller-avatar" />
        <div class="seller-details">
          <div class="seller-name-row">
            <h2>{selectedAuction.seller.name}</h2>
            <button class="follow-btn">Follow</button>
          </div>
          <span class="timestamp">{selectedAuction.seller.timestamp}</span>
        </div>
      </div>

      <!-- Product Details -->
      <div class="product-details">
        <div class="info-row">
          <span class="label">PRODUCT NAME:</span>
          <span class="value">{selectedAuction.product.name}</span>
        </div>
        <div class="info-row">
          <span class="label">LOCATION:</span>
          <span class="value">{selectedAuction.product.location}</span>
        </div>
        <div class="info-row">
          <span class="label">BRAND:</span>
          <span class="value">{selectedAuction.product.brand}</span>
        </div>
        <div class="info-row">
          <span class="label">PRICE:</span>
          <span class="value">${selectedAuction.product.price}</span>
        </div>
      </div>

      <p class="product-description">{selectedAuction.product.description}</p>

      <!-- Product Images and Bidding -->
      <div class="auction-content">
        <div class="product-images">
          <button class="nav-btn prev" on:click={previousImage}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <div class="image-grid">
            {#each selectedAuction.product.images as image, i}
              <div class="image-container" class:active={i === currentImageIndex}>
                <img src={image} alt="Product view {i + 1}" />
              </div>
            {/each}
          </div>
          <button class="nav-btn next" on:click={nextImage}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>

        <div class="bidding-section">
          <div class="current-price">
            <span class="label">CURRENT PRICE</span>
            <span class="price">${currentBid}</span>
          </div>

          <div class="bid-history">
            <div class="bid-row">
              <span class="bid-amount">$120</span>
              <span class="bid-label">BID</span>
            </div>
          </div>

          <div class="place-bid">
            <div class="bid-input">
              <span class="currency">$</span>
              <input 
                type="number" 
                bind:value={bidAmount}
                placeholder="0.0"
                min={currentBid + 1}
                step="0.01"
              />
            </div>
            <button 
              class="bid-btn"
              disabled={!bidAmount || parseFloat(bidAmount) <= currentBid}
              on:click={handleBid}
            >
              Bid Accepted
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: 250px 1fr;
    min-height: 100vh;
    background: #FAF9F6;
  }

  .main-content {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .search-bar {
    margin-bottom: 2rem;
  }

  .search-input {
    background: white;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

  .auction-post {
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
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .seller-details {
    flex: 1;
  }

  .seller-name-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .seller-name-row h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2D3748;
  }

  .follow-btn {
    background: #6366F1;
    color: white;
    border: none;
    padding: 0.5rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
  }

  .timestamp {
    color: #718096;
    font-size: 0.875rem;
  }

  .product-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .info-row {
    display: flex;
    gap: 0.5rem;
  }

  .label {
    color: #6366F1;
    font-weight: 500;
  }

  .value {
    color: #2D3748;
  }

  .product-description {
    color: #4A5568;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .auction-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

  .product-images {
    position: relative;
    background: #FDF6E3;
    border-radius: 1rem;
    padding: 1rem;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .image-container {
    aspect-ratio: 1;
    border-radius: 0.5rem;
    overflow: hidden;
    opacity: 0.7;
    transition: opacity 0.3s;
  }

  .image-container.active {
    opacity: 1;
  }

  .image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.9);
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
  }

  .nav-btn svg {
    width: 24px;
    height: 24px;
    fill: #4A5568;
  }

  .nav-btn.prev {
    left: 1rem;
  }

  .nav-btn.next {
    right: 1rem;
  }

  .bidding-section {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid #E2E8F0;
  }

  .current-price {
    text-align: center;
    margin-bottom: 2rem;
  }

  .current-price .label {
    display: block;
    margin-bottom: 0.5rem;
  }

  .current-price .price {
    font-size: 2rem;
    font-weight: 700;
    color: #2D3748;
  }

  .bid-history {
    margin-bottom: 2rem;
  }

  .bid-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #E2E8F0;
  }

  .bid-amount {
    font-weight: 500;
    color: #2D3748;
  }

  .bid-label {
    color: #718096;
  }

  .place-bid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .bid-input {
    display: flex;
    align-items: center;
    background: #F7FAFC;
    border-radius: 0.5rem;
    padding: 0.75rem;
  }

  .currency {
    color: #718096;
    margin-right: 0.5rem;
  }

  .bid-input input {
    background: none;
    border: none;
    color: #2D3748;
    font-size: 1rem;
    width: 100%;
    outline: none;
  }

  .bid-input input::placeholder {
    color: #A0AEC0;
  }

  .bid-btn {
    background: #6366F1;
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .bid-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 1024px) {
    .layout {
      grid-template-columns: 1fr;
    }

    .auction-content {
      grid-template-columns: 1fr;
    }

    .product-details {
      grid-template-columns: 1fr;
    }
  }
</style> 