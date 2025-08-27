<script lang="ts">
  import { onMount } from 'svelte';
  import { getAuctions, getAuctionCategories, type Auction } from '../../lib/api/auctions';

  // State management
  let auctions: Auction[] = [];
  let isLoading = true;
  let errorMessage = '';
  let searchQuery = '';
  let selectedCategory = '';
  let selectedLocation = '';
  let selectedStatus = '';
  let selectedSortBy: 'currentPrice' | 'endTime' | 'totalBids' | 'views' = 'endTime';
  let selectedSortOrder: 'ASC' | 'DESC' = 'ASC';
  
  // Pagination
  let currentPage = 1;
  let totalPages = 1;
  let totalItems = 0;
  let itemsPerPage = 20;

  // Categories for filters
  let categories: string[] = [];

  let currentBid = 120;
  let bidAmount = "";
  let selectedAuction: Auction | null = null;
  let currentImageIndex = 0;
  let autoplayInterval: ReturnType<typeof setInterval>;

  onMount(async () => {
    await loadAuctions();
    await loadCategories();
  });

  async function loadAuctions() {
    try {
      isLoading = true;
      errorMessage = '';

      const response = await getAuctions({
        page: currentPage,
        limit: itemsPerPage,
        status: selectedStatus || undefined,
        category: selectedCategory || undefined,
        location: selectedLocation || undefined,
        search: searchQuery || undefined,
        sortBy: selectedSortBy,
        sortOrder: selectedSortOrder
      });

      // Backend returns data directly without success field
      if (response.auctions) {
        auctions = response.auctions || [];
        totalItems = response.total || 0;
        totalPages = response.totalPages || 1;
        currentPage = response.currentPage || 1;
        
        // Set selected auction for slider
        if (auctions.length > 0) {
          selectedAuction = auctions[0];
        }
        
        console.log('Loaded auctions:', auctions);
      } else if (response.message) {
        // Backend returned an error message
        errorMessage = response.message;
        auctions = [];
      } else {
        errorMessage = 'Failed to load auctions';
        auctions = [];
      }
    } catch (error: unknown) {
      console.error('Error loading auctions:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to load auctions';
      auctions = [];
    } finally {
      isLoading = false;
    }
  }

  async function loadCategories() {
    try {
      const response = await getAuctionCategories();
      // Backend returns data directly without success field
      if (response.categories) {
        categories = response.categories?.map((cat: { name: string; count: number }) => cat.name) || [];
      } else if (response.message) {
        console.error('Error loading categories:', response.message);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  // Search and filter functions
  function handleSearch() {
    currentPage = 1;
    loadAuctions();
  }

  function handleFilterChange() {
    currentPage = 1;
    loadAuctions();
  }

  function handleSortChange() {
    loadAuctions();
  }

  function handlePageChange(page: number) {
    currentPage = page;
    loadAuctions();
  }

  // Watch for filter changes
  $: if (selectedCategory || selectedLocation || selectedStatus) {
    handleFilterChange();
  }

  $: if (selectedSortBy || selectedSortOrder) {
    handleSortChange();
  }

  // Utility functions
  function formatTimeLeft(endTime: string): string {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Ended';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }

  function handleBid() {
    if (parseFloat(bidAmount) > currentBid) {
      currentBid = parseFloat(bidAmount);
      bidAmount = "";
    }
  }

  function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % auctions.length;
  }

  function previousImage() {
    currentImageIndex = (currentImageIndex - 1 + auctions.length) % auctions.length;
  }

  onMount(() => {
    autoplayInterval = setInterval(() => {
      nextImage();
    }, 3000);
    return () => clearInterval(autoplayInterval);
  });
</script>

<div class="auctions-content">
    <div class="search-bar">
      <div class="search-input">
        <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input 
          type="text" 
          placeholder="Search for product by text or image" 
          bind:value={searchQuery}
          on:input={handleSearch}
        />
        <button class="camera-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/>
            <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <select bind:value={selectedCategory} on:change={handleFilterChange}>
          <option value="">All Categories</option>
          {#each categories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <select bind:value={selectedLocation} on:change={handleFilterChange}>
          <option value="">All Locations</option>
          <option value="Lagos">Lagos</option>
          <option value="Abuja">Abuja</option>
          <option value="Kano">Kano</option>
          <option value="Port Harcourt">Port Harcourt</option>
          <option value="Kaduna">Kaduna</option>
        </select>
      </div>

      <div class="filter-group">
        <select bind:value={selectedStatus} on:change={handleFilterChange}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      <div class="filter-group">
        <select bind:value={selectedSortBy} on:change={handleSortChange}>
          <option value="endTime">End Time</option>
          <option value="currentPrice">Price</option>
          <option value="totalBids">Most Bids</option>
          <option value="views">Most Viewed</option>
        </select>
      </div>

      <div class="filter-group">
        <select bind:value={selectedSortOrder} on:change={handleSortChange}>
          <option value="ASC">Ascending</option>
          <option value="DESC">Descending</option>
        </select>
      </div>
    </div>

  <div class="auction-slider">
    <div class="slider-image-wrapper">
      {#if auctions && auctions.length > 0}
        <img src={auctions[currentImageIndex].images?.[0] || '/test.jpg.jpg'} alt="Auction Banner" class="slider-image" />
        <div class="slider-text-overlay">
          <h2>{auctions[currentImageIndex].title}</h2>
          <p>{auctions[currentImageIndex].description}</p>
        </div>
        <button class="slider-arrow left" on:click={previousImage}>&lt;</button>
        <button class="slider-arrow right" on:click={nextImage}>&gt;</button>
      {:else}
        <div class="slider-fallback">No auctions available for the slider.</div>
      {/if}
      </div>
    <div class="slider-dots">
      {#each auctions as _, idx}
        <span class:active={idx === currentImageIndex} on:click={() => currentImageIndex = idx}></span>
      {/each}
        </div>
      </div>

    <!-- Error Message -->
    {#if errorMessage}
      <div class="error-message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        {errorMessage}
        <button class="retry-btn" on:click={loadAuctions}>Retry</button>
      </div>
    {/if}

    <!-- Loading State -->
    {#if isLoading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading auctions...</p>
      </div>
    {:else if auctions.length === 0}
      <div class="no-results">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <h3>No auctions found</h3>
        <p>Try adjusting your search criteria or check back later</p>
      </div>
    {:else}
      <div class="auctions-grid">
    {#each auctions as auction (auction.id)}
      <div class="auction-card">
        <div class="auction-image">
          <img src={auction.images?.[0] || '/test.jpg.jpg'} alt={auction.title} />
        </div>
        <div class="auction-info">
          <div class="auction-title">{auction.title}</div>
          <div class="auction-meta">
            <span class="current-bid">Current Bid: <b>{formatCurrency(auction.currentPrice)}</b></span>
            <span class="time-left">
              <svg class="clock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.262 10.262 0 0 0 12 1.75zm0 18.5A8.25 8.25 0 1 1 20.25 12 8.26 8.26 0 0 1 12 20.25zm.75-8.5V7a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 .44.68l3.5 1.5a.75.75 0 1 0 .58-1.38z"/></svg>
              <span>Ends in: <b>{formatTimeLeft(auction.endTime)}</b></span>
            </span>
          </div>
          <div class="auction-seller">
            <img src={auction.seller?.profilePicture || '/wrigglyLine2.png'} alt={auction.seller?.fullName || 'Seller'} class="seller-avatar" />
            <span class="seller-name">{auction.seller?.fullName || 'Unknown Seller'}</span>
          </div>
          <a class="view-auction-btn" href={`/auctions/${auction.id}`}>View Auction</a>
        </div>
      </div>
    {/each}
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="pagination">
          <button 
            class="pagination-btn" 
            disabled={currentPage === 1}
            on:click={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>
          
          {#each Array(totalPages) as _, i}
            <button 
              class="pagination-btn {i + 1 === currentPage ? 'active' : ''}"
              on:click={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          {/each}
          
          <button 
            class="pagination-btn" 
            disabled={currentPage === totalPages}
            on:click={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      {/if}
    {/if}
  </div>

<style>
  .auctions-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .auction-banner {
    background: linear-gradient(135deg, #6366F1 0%, #60A5FA 100%);
    padding: 3rem 2rem;
    color: white;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .auction-banner::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.5;
  }

  .banner-content {
    position: relative;
    z-index: 1;
    max-width: 800px;
    margin: 0 auto;
  }

  .banner-content h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 1rem;
    line-height: 1.2;
  }

  .banner-content p {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-bottom: 2rem;
    line-height: 1.5;
  }

  .banner-stats {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin-top: 2rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .stat-value {
    font-size: 1.8rem;
    font-weight: 700;
  }

  .stat-label {
    font-size: 0.95rem;
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    .auction-banner {
      padding: 2rem 1rem;
    }

    .banner-content h1 {
      font-size: 2rem;
    }

    .banner-content p {
      font-size: 1rem;
    }

    .banner-stats {
      gap: 2rem;
      flex-wrap: wrap;
    }

    .stat-value {
      font-size: 1.5rem;
    }

    .filters-section {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-group select {
      width: 100%;
    }

    .search-input {
      flex-direction: column;
      gap: 0.5rem;
    }

    .search-input input {
      width: 100%;
    }

    .stat-label {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 768px) {
    .auctions-content {
      padding: 0;
    }

    .search-bar {
      margin-bottom: 1rem;
      padding: 0.5rem;
      top: 56px;
      width: 100%;
    }

    .auctions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 0.5rem;
      width: 100%;
    }

    .auction-card {
      flex: none;
      width: 100%;
      scroll-snap-align: none;
      padding: 1rem 0.75rem 0.75rem 0.75rem;
      height: auto;
    }

    .auction-image img {
      height: 140px;
    }
  }

  @media (max-width: 480px) {
    .auctions-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .auction-card {
      padding: 0.75rem 0.5rem 0.5rem 0.5rem;
    }

    .auction-image img {
      height: 120px;
    }
  }

  .search-bar {
    margin-bottom: 2.5rem;
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
    background: transparent;
  }

  .filters-section {
    display: flex;
    gap: 1rem;
    margin: 1rem 0;
    flex-wrap: wrap;
    justify-content: center;
  }

  .filter-group select {
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    background: white;
    font-size: 0.875rem;
    min-width: 120px;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1rem 0;
    max-width: 600px;
    width: 100%;
  }

  .retry-btn {
    margin-left: auto;
    background: #dc2626;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .loading-state {
    text-align: center;
    padding: 3rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .no-results {
    text-align: center;
    padding: 3rem;
    color: #64748b;
  }

  .no-results svg {
    margin-bottom: 1rem;
    color: #cbd5e1;
  }

  .no-results h3 {
    margin-bottom: 0.5rem;
    color: #475569;
  }

  .pagination {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin: 2rem 0;
    padding: 1rem;
  }

  .pagination-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    background: white;
    color: #374151;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pagination-btn:hover:not(:disabled) {
    background: #f3f4f6;
  }

  .pagination-btn.active {
    background: #6366F1;
    color: white;
    border-color: #6366F1;
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    grid-template-columns: repeat(5, 1fr);
    gap: 1.5rem;
    padding: 1rem 2rem 8rem 2rem;
    width: 100%;
    box-sizing: border-box;
    max-width: 1400px;
  }

  @media (max-width: 1024px) {
    .auctions-grid {
      grid-template-columns: repeat(3, 1fr);
      padding: 1rem 1.5rem 8rem 1.5rem;
    }
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
    height: 380px;
  }

  .auction-card:hover {
    transform: translateY(-2px) scale(1.02);
  }

  .auction-image {
    width: 100%;
    height: 160px;
    margin-bottom: 1rem;
  }

  .auction-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 0.75rem;
    background: #f7f7fa;
  }

  .auction-info {
    width: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.5rem;
  }

  .auction-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111;
    margin-bottom: 0.25rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.3;
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
    margin-top: auto;
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
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }

  .view-auction-btn:hover {
    background: linear-gradient(90deg, #60A5FA 0%, #6366F1 100%);
  }

  @media (max-width: 768px) {
    .auction-card {
      height: 340px;
      padding: 1rem 0.75rem 0.75rem 0.75rem;
  }

    .auction-image {
      height: 120px;
    }
  }

  .auction-slider {
    width: 100%;
    max-width: 900px;
    margin: 3rem auto 2.5rem auto;
    position: relative;
    border-radius: 1.25rem;
    overflow: hidden;
    box-shadow: 0 4px 24px 0 rgba(60, 80, 180, 0.08);
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
  }

  .slider-image-wrapper {
    position: relative;
    width: 100%;
    height: 420px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #f3f4f6;
  }

  .slider-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.85) saturate(1.1);
    transition: opacity 0.4s;
  }

  .slider-text-overlay {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(0deg, rgba(30,41,59,0.85) 60%, rgba(30,41,59,0.2) 100%);
    color: #fff;
    padding: 2rem 2rem 1.5rem 2rem;
    text-align: left;
  }

  .slider-text-overlay h2 {
    font-size: 1.7rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    line-height: 1.2;
  }

  .slider-text-overlay p {
    font-size: 1.05rem;
    opacity: 0.95;
    line-height: 1.5;
    margin-bottom: 0;
  }

  .slider-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255,255,255,0.7);
    border: none;
    border-radius: 50%;
    width: 2.2rem;
    height: 2.2rem;
    font-size: 1.5rem;
    color: #6366F1;
    cursor: pointer;
    z-index: 2;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .slider-arrow.left { left: 1rem; }
  .slider-arrow.right { right: 1rem; }
  .slider-arrow:hover { background: #fff; }

  .slider-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin: 0.5rem 0 1rem 0;
  }
  .slider-dots span {
    display: inline-block;
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    background: #c7d2fe;
    cursor: pointer;
    transition: background 0.2s;
  }
  .slider-dots span.active {
    background: #6366F1;
  }

  @media (max-width: 768px) {
    .auction-slider {
      max-width: 100vw;
      margin: 1rem 0 1.5rem 0;
      border-radius: 0.75rem;
  }
    .slider-image-wrapper {
      height: 220px;
  }
    .slider-text-overlay {
      padding: 1rem 1rem 0.75rem 1rem;
  }
    .slider-text-overlay h2 {
      font-size: 1.1rem;
  }
    .slider-text-overlay p {
      font-size: 0.95rem;
    }
    .slider-arrow {
      width: 1.5rem;
      height: 1.5rem;
      font-size: 1rem;
    }
  }

  .slider-fallback {
    color: #fff;
    background: #f87171;
    padding: 2rem;
    text-align: center;
    width: 100%;
  }

  @media (max-width: 1200px) {
    .auctions-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 768px) {
    .auctions-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 0.5rem 1.5rem 4rem 1.5rem;
      width: 100%;
      max-width: 100vw;
    }
    .auction-card {
      width: 100%;
      min-width: 0;
      max-width: 100%;
      margin: 0 auto;
    }
  }
</style> 