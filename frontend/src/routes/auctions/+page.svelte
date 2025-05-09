<script lang="ts">
  import { onMount } from 'svelte';

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
    },
    {
      id: 2,
      seller: {
        name: "Jessy Stores",
        avatar: "/wrigglyLine2.png",
        username: "@jessy",
        timestamp: "22 February, 10 AM"
      },
      product: {
        name: "Apple AirPods Pro",
        location: "Lekki",
        brand: "Apple",
        price: 200,
        currentBid: 210,
        description: "Brand new AirPods Pro, sealed box. Auction ends soon!",
        images: [
          "/wrigglyLine2.png",
          "/test.jpg.jpg"
        ]
      }
    },
    {
      id: 3,
      seller: {
        name: "Tola Thompson",
        avatar: "/test.jpg.jpg",
        username: "@tola",
        timestamp: "23 February, 2 PM"
      },
      product: {
        name: "Samsung Galaxy S21",
        location: "Victoria Island",
        brand: "Samsung",
        price: 350,
        currentBid: 370,
        description: "Slightly used Galaxy S21, comes with box and charger.",
        images: [
          "/test.jpg.jpg",
          "/wrigglyLine2.png"
        ]
      }
    },
    {
      id: 4,
      seller: {
        name: "Cody Fisher Stores",
        avatar: "/wrigglyLine2.png",
        username: "@codyfisher",
        timestamp: "24 February, 11 AM"
      },
      product: {
        name: "Unisex iPhone 13 Pro Case",
        location: "Yaba",
        brand: "Apple",
        price: 30,
        currentBid: 35,
        description: "Trendy iPhone 13 Pro case, fits perfectly. Place your bid!",
        images: [
          "/wrigglyLine2.png",
          "/test.jpg.jpg"
        ]
      }
    },
    {
      id: 5,
      seller: {
        name: "Thompson Stores",
        avatar: "/test.jpg.jpg",
        username: "@thompson",
        timestamp: "25 February, 4 PM"
      },
      product: {
        name: "Original White Apple Earbuds",
        location: "Ikeja",
        brand: "Apple",
        price: 50,
        currentBid: 55,
        description: "Original Apple earbuds, barely used. Auction ends today!",
        images: [
          "/test.jpg.jpg",
          "/wrigglyLine2.png"
        ]
      }
    },
    {
      id: 6,
      seller: {
        name: "MTB CEO",
        avatar: "/wrigglyLine2.png",
        username: "@mbtceo",
        timestamp: "26 February, 9 AM"
      },
      product: {
        name: "Original White iPhone Charger",
        location: "Ajah",
        brand: "Apple",
        price: 25,
        currentBid: 28,
        description: "Genuine iPhone charger, fast charging. Place your bid now!",
        images: [
          "/wrigglyLine2.png",
          "/test.jpg.jpg"
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

<div class="auctions-content">
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

  <div class="auctions-grid">
    {#each auctions as auction (auction.id)}
      <div class="auction-card">
        <div class="auction-image">
          <img src={auction.product.images[0]} alt={auction.product.name} />
        </div>
        <div class="auction-info">
          <div class="auction-title">{auction.product.name}</div>
          <div class="auction-meta">
            <span class="current-bid">Current Bid: <b>${auction.product.currentBid}</b></span>
            <span class="time-left">
              <svg class="clock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.262 10.262 0 0 0 12 1.75zm0 18.5A8.25 8.25 0 1 1 20.25 12 8.26 8.26 0 0 1 12 20.25zm.75-8.5V7a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 .44.68l3.5 1.5a.75.75 0 1 0 .58-1.38z"/></svg>
              <span>Ends in: <b>01:23:45</b></span>
            </span>
          </div>
          <div class="auction-seller">
            <img src={auction.seller.avatar} alt={auction.seller.name} class="seller-avatar" />
            <span class="seller-name">{auction.seller.name}</span>
          </div>
          <button class="view-auction-btn">View Auction</button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .auctions-content {
    height: 100vh;
    overflow: auto;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    padding: 2rem;
  }

  @media (max-width: 768px) {
    .auctions-content {
      padding: 0;
    }

    .search-bar {
      margin-bottom: 1rem;
      padding: 0.5rem;
      top: 56px;
    }

    .auctions-grid {
      padding: 0;
    }

    .auction-post {
      border-radius: 0;
      margin-bottom: 1rem;
    }
  }

  .search-bar {
    margin-bottom: 2rem;
    position: sticky;
    top: 72px;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    z-index: 10;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .search-input {
    background: white;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
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

  .auctions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 2rem;
    padding: 1rem 1rem 8rem 1rem;
  }

  .auction-card {
    background: white;
    border-radius: 1rem;
    box-shadow: none;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 1rem 1rem 1rem;
    transition: transform 0.15s;
  }

  .auction-card:hover {
    transform: translateY(-2px) scale(1.02);
  }

  .auction-image img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: 0.75rem;
    background: #f7f7fa;
    margin-bottom: 1rem;
  }

  .auction-info {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .auction-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111;
    margin-bottom: 0.25rem;
  }

  .auction-meta {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
  }

  .current-bid b {
    color: orange;
    font-weight: 700;
  }

  .time-left b {
    color: #22c55e;
    font-weight: 700;
  }

  .time-left {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .clock-icon {
    width: 1em;
    height: 1em;
    fill: #22c55e;
    margin-right: 0.15em;
    flex-shrink: 0;
  }

  .auction-seller {
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
    font-size: 0.95rem;
    color: #444;
    font-weight: 500;
  }

  .view-auction-btn {
    margin-top: 0.5rem;
    width: 100%;
    padding: 0.75rem 0;
    background: linear-gradient(90deg, #6366F1 0%, #60A5FA 100%);
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .view-auction-btn:hover {
    background: linear-gradient(90deg, #60A5FA 0%, #6366F1 100%);
  }

  @media (max-width: 768px) {
    .auctions-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 0.5rem;
    }
    .auction-card {
      padding: 1rem 0.5rem 0.5rem 0.5rem;
    }
    .auction-image img {
      height: 120px;
    }
  }
</style> 