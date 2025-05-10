<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';

  // Mock data (in real app, fetch from API or store)
  const mockAuctions = [
    {
      id: '1',
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
      },
      bids: [
        { user: 'Jessy', amount: 120, time: '2m ago' },
        { user: 'Tola', amount: 110, time: '10m ago' }
      ]
    },
    // Add more mock auctions as needed
  ];

  // Get auction id from URL
  let auctionId = '';
  $: auctionId = $page.params.id;

  // Find auction by id
  let auction = mockAuctions.find(a => a.id === auctionId);
  // If not found, use the first mock auction as a fallback
  if (!auction) auction = mockAuctions[0];

  // Carousel state
  let currentImage = 0;
  let showZoomModal = false;
  let zoomedImage = '';

  function openZoomModal(image: string) {
    zoomedImage = image;
    showZoomModal = true;
    document.body.style.overflow = 'hidden';
  }

  function closeZoomModal() {
    showZoomModal = false;
    document.body.style.overflow = '';
  }

  function nextImage() {
    if (!auction) return;
    currentImage = (currentImage + 1) % auction.product.images.length;
  }
  function prevImage() {
    if (!auction) return;
    currentImage = (currentImage - 1 + auction.product.images.length) % auction.product.images.length;
  }

  // Countdown (mocked for now)
  let timeLeft = '01:23:45';

  // Bid form
  let bidAmount = '';
  let bidError = '';
  let isPulsing = false;
  function placeBid() {
    if (!auction) return;
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= auction.product.currentBid) {
      bidError = 'Bid must be higher than current bid.';
      return;
    }
    bidError = '';
    isPulsing = true;
    // In real app, send bid to server
    auction.bids.unshift({ user: 'You', amount, time: 'now' });
    auction.product.currentBid = amount;
    bidAmount = '';
    setTimeout(() => isPulsing = false, 1000);
  }
</script>

<div class="auction-detail-container shiny-bg">
  <div class="auction-main">
    <div class="auction-images">
      <button class="carousel-btn prev" on:click={prevImage}>&lt;</button>
      <img 
        src={auction.product.images[currentImage]} 
        alt={auction.product.name} 
        class="main-image" 
        on:click={() => openZoomModal(auction.product.images[currentImage])}
      />
      <button class="carousel-btn next" on:click={nextImage}>&gt;</button>
      <div class="image-thumbs">
        {#each auction.product.images as img, i}
          <img 
            src={img} 
            alt="thumb" 
            class:active={i === currentImage} 
            on:click={() => {
              currentImage = i;
              openZoomModal(img);
            }} 
          />
        {/each}
      </div>
    </div>
    <div class="auction-info-block">
      <h1 class="product-title">{auction.product.name}</h1>
      <div class="brand-location">
        <span class="brand">{auction.product.brand}</span>
        <span class="location">
          <svg class="location-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          {auction.product.location}
        </span>
      </div>
      <div class="product-description">{auction.product.description}</div>
      <div class="seller-info">
        <img src={auction.seller.avatar} alt={auction.seller.name} class="seller-avatar" />
        <div class="seller-details">
          <div class="seller-name">{auction.seller.name}</div>
          <div class="seller-username">{auction.seller.username}</div>
          <div class="seller-timestamp">{auction.seller.timestamp}</div>
        </div>
      </div>
      <div class="current-bid-row">
        <span class="current-bid-label">Current Bid:</span>
        <span class="current-bid-value">₦{auction.product.currentBid}</span>
      </div>
      <div class="countdown-row">
        <svg class="clock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.262 10.262 0 0 0 12 1.75zm0 18.5A8.25 8.25 0 1 1 20.25 12 8.26 8.26 0 0 1 12 20.25zm.75-8.5V7a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 .44.68l3.5 1.5a.75.75 0 1 0 .58-1.38z"/></svg>
        <span class="countdown">Ends in: {timeLeft}</span>
      </div>
      <form class="bid-form" on:submit|preventDefault={placeBid}>
        <input type="number" min={auction.product.currentBid + 1} bind:value={bidAmount} placeholder="Enter your bid" />
        <button type="submit" class:is-pulsing={isPulsing}>Place Bid</button>
      </form>
      {#if bidError}
        <div class="bid-error">{bidError}</div>
      {/if}
      <div class="bid-history">
        <h3>Bid History</h3>
        {#each auction.bids as bid}
          <div class="bid-row">
            <span class="bid-user">{bid.user}</span>
            <span class="bid-amount">₦{bid.amount}</span>
            <span class="bid-time">{bid.time}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

{#if showZoomModal}
  <div class="zoom-modal" on:click={closeZoomModal}>
    <button class="close-zoom" on:click={closeZoomModal}>×</button>
    <img 
      src={zoomedImage} 
      alt="Zoomed product" 
      class="zoomed-image"
      on:click|stopPropagation
    />
  </div>
{/if}

<style>
  :global(html), :global(body), :global(#svelte) {
    background: linear-gradient(135deg, #fff 60%, #f9fafb 100%) !important;
    min-height: 100vh;
  }
  .shiny-bg {
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    min-height: 100vh;
    padding: 5rem 1rem 2rem 1rem;
  }
  .auction-detail-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  .auction-main {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }
  .auction-images {
    flex: 1 1 350px;
    min-width: 320px;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    background: #fff;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  .main-image {
    width: 100%;
    max-width: 350px;
    height: 260px;
    object-fit: contain;
    border-radius: 0.75rem;
    background: #f7f7fa;
    margin-bottom: 1rem;
    cursor: zoom-in;
    transition: transform 0.2s ease;
  }
  .main-image:hover {
    transform: scale(1.02);
  }
  .carousel-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: #f3f4f6;
    border: none;
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.5rem;
    color: #6366F1;
    cursor: pointer;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .carousel-btn.prev { left: 0.5rem; }
  .carousel-btn.next { right: 0.5rem; }
  .carousel-btn:hover { background: #e0e7ff; }
  .image-thumbs {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    justify-content: center;
  }
  .image-thumbs img {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 0.5rem;
    background: #f7f7fa;
    cursor: pointer;
    opacity: 0.7;
    border: 2px solid transparent;
    transition: all 0.2s ease;
  }
  .image-thumbs img:hover {
    opacity: 0.9;
    transform: scale(1.05);
  }
  .image-thumbs img.active {
    opacity: 1;
    border: 2px solid #6366F1;
  }
  .auction-info-block {
    flex: 2 1 400px;
    background: #fff;
    border-radius: 1rem;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 320px;
    max-width: 600px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  .product-title {
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: 800;
    color: #111;
    margin-bottom: 0.5rem;
    line-height: 1.2;
  }
  .brand-location {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    font-size: clamp(0.9rem, 2vw, 1.1rem);
    color: #6366F1;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }
  .brand {
    font-weight: 600;
  }
  .location {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .location-icon {
    width: 1.1rem;
    height: 1.1rem;
    fill: #6366F1;
  }
  .product-description {
    color: #444;
    font-size: clamp(0.95rem, 2vw, 1.1rem);
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  .seller-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
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
    gap: 0.2rem;
  }
  .seller-name {
    font-weight: 700;
    color: #222;
    font-size: 1.1rem;
  }
  .seller-username {
    color: #6366F1;
    font-size: 1rem;
  }
  .seller-timestamp {
    color: #888;
    font-size: 0.95rem;
  }
  .current-bid-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }
  .current-bid-label {
    color: #888;
    font-weight: 500;
  }
  .current-bid-value {
    color: orange;
    font-weight: 700;
    font-size: 1.3rem;
  }
  .countdown-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }
  .clock-icon {
    width: 1.2em;
    height: 1.2em;
    fill: #22c55e;
  }
  .countdown {
    color: #22c55e;
    font-weight: 700;
  }
  .bid-form {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }
  .bid-form input[type="number"] {
    flex: 1;
    min-width: 200px;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    font-size: 1.1rem;
    outline: none;
    background: #f7f7fa;
    color: #222;
  }
  .bid-form button {
    padding: 0.75rem 2rem;
    min-width: 120px;
    background: linear-gradient(90deg, #ff9800 0%, #ffb347 100%);
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.10);
    transition: all 0.3s ease;
  }
  .bid-form button:hover {
    background: linear-gradient(90deg, #ffb347 0%, #ff9800 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.20);
  }
  .bid-form button.is-pulsing {
    animation: pulse 1s ease;
  }
  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.10);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(255, 152, 0, 0.40);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.10);
    }
  }
  .bid-error {
    color: #ef4444;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  .bid-history {
    margin-top: 1.5rem;
    background: #fff;
    border-radius: 1rem;
    padding: 1.25rem;
    max-height: 280px;
    overflow-y: auto;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(99, 102, 241, 0.1);
  }
  .bid-history h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: #6366F1;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .bid-history h3::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 16px;
    background: #6366F1;
    border-radius: 2px;
  }
  .bid-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    font-size: clamp(0.9rem, 2vw, 1rem);
    transition: all 0.2s ease;
    background: #f8fafc;
    margin-bottom: 0.5rem;
  }
  .bid-row:last-child {
    margin-bottom: 0;
  }
  .bid-row:hover {
    background: #f1f5f9;
    transform: translateX(4px);
  }
  .bid-user {
    color: #1e293b;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .bid-user::before {
    content: '👤';
    font-size: 0.9em;
  }
  .bid-amount {
    color: #f97316;
    font-weight: 700;
    white-space: nowrap;
    background: rgba(249, 115, 22, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.95rem;
  }
  .bid-time {
    color: #64748b;
    font-size: 0.9rem;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .bid-time::before {
    content: '🕒';
    font-size: 0.9em;
  }
  @media (max-width: 900px) {
    .shiny-bg {
      padding: 4rem 1rem 2rem 1rem;
    }
    .auction-main {
      flex-direction: column;
      gap: 1.5rem;
    }
    .auction-images, .auction-info-block {
      max-width: 100%;
      min-width: 0;
    }
    .auction-info-block {
      padding: 1.5rem;
    }
    .main-image {
      height: 220px;
    }
    .image-thumbs {
      flex-wrap: wrap;
      justify-content: center;
    }
    .bid-form {
      flex-direction: column;
    }
    .bid-form input[type="number"],
    .bid-form button {
      width: 100%;
    }
  }
  @media (max-width: 480px) {
    .shiny-bg {
      padding: 3.5rem 0.75rem 1.5rem 0.75rem;
    }
    .auction-images {
      padding: 1rem;
    }
    .auction-info-block {
      padding: 1.25rem;
    }
    .main-image {
      height: 200px;
    }
    .product-title {
      font-size: 1.5rem;
    }
    .brand-location {
      font-size: 0.9rem;
    }
    .product-description {
      font-size: 0.95rem;
    }
    .bid-history {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 0.75rem;
    }
    .bid-history h3 {
      font-size: 1rem;
      margin-bottom: 0.75rem;
    }
    .bid-row {
      grid-template-columns: 1fr auto auto;
      text-align: left;
      gap: 0.5rem;
      padding: 0.6rem 0.75rem;
      font-size: 0.9rem;
      margin-bottom: 0.4rem;
    }
    .bid-user {
      font-size: 0.9rem;
      max-width: 100px;
    }
    .bid-amount {
      font-size: 0.85rem;
      padding: 0.2rem 0.6rem;
    }
    .bid-time {
      font-size: 0.8rem;
    }
  }
  .zoom-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
    animation: fadeIn 0.2s ease;
  }
  .zoomed-image {
    max-width: 90%;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 0.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: zoomIn 0.3s ease;
  }
  .close-zoom {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
  }
  .close-zoom:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes zoomIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
</style> 