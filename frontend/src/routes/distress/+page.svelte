<script lang="ts">
  import { onMount } from 'svelte';
  import { getDistressSales, getDistressSaleStats, type DistressSale, type DistressSaleFilters } from '../../lib/api/distress';

  // State management
  let products: DistressSale[] = [];
  let isLoading = true;
  let errorMessage = '';
  let searchQuery = '';
  let selectedCategory = '';
  let selectedLocation = '';
  let selectedUrgency = '';
  let selectedSortBy = 'createdAt';
  let selectedSortOrder: 'ASC' | 'DESC' = 'DESC';
  
  // Pagination
  let currentPage = 1;
  let totalPages = 1;
  let totalItems = 0;
  let itemsPerPage = 20;

  // Featured slider state
  let featuredIndex = 0;
  let featuredImages = [
    "/test.jpg.jpg",
    "/wrigglyLine2.png",
    "/test.jpg.jpg",
    "/wrigglyLine2.png"
  ];

  // Image slider state
  let currentImageIndex = 0;
  let isModalOpen = false;
  let modalIndex = 0;

  // Categories and locations for filters
  let categories = [
    'Electronics & Technology', 'Fashion & Apparel', 'Home & Garden',
    'Automotive', 'Health & Beauty', 'Sports & Outdoors', 'Books & Media',
    'Food & Beverages', 'Jewelry & Accessories', 'Toys & Games',
    'Industrial & Business', 'Other'
  ];

  let locations = [
    'Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Kaduna',
    'Ondo', 'Oyo', 'Rivers', 'Delta', 'Imo', 'Anambra',
    'Enugu', 'Ebonyi', 'Abia', 'Akwa Ibom', 'Cross River'
  ];

  let urgencyLevels = [
    { value: 'low', label: 'Low Urgency' },
    { value: 'medium', label: 'Medium Urgency' },
    { value: 'high', label: 'High Urgency' },
    { value: 'urgent', label: 'Urgent' }
  ];

  let sortOptions = [
    { value: 'createdAt', label: 'Latest' },
    { value: 'price', label: 'Price' },
    { value: 'discountPercentage', label: 'Discount' },
    { value: 'urgencyLevel', label: 'Urgency' },
    { value: 'views', label: 'Most Viewed' }
  ];

  onMount(async () => {
    // Initialize products array
    products = [];
    await loadDistressSales();
  });

  async function loadDistressSales() {
    try {
      isLoading = true;
      errorMessage = '';

      const filters: DistressSaleFilters = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: selectedSortBy,
        sortOrder: selectedSortOrder
      };

      if (selectedCategory) filters.category = selectedCategory;
      if (selectedLocation) filters.location = selectedLocation;
      if (selectedUrgency) filters.urgencyLevel = selectedUrgency;

      const response = await getDistressSales(filters);
      
      if (response.success) {
        // Filter out products without valid seller data
        products = response.data?.filter(product => product.seller && product.seller.id) || [];
        console.log('Loaded distress sales:', products);
        totalPages = response.pagination?.totalPages || 1;
        totalItems = response.pagination?.totalItems || 0;
        currentPage = response.pagination?.currentPage || 1;
      } else {
        errorMessage = 'Failed to load distress sales';
        products = [];
      }
    } catch (error: unknown) {
      console.error('Error loading distress sales:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to load distress sales';
      
      // Log additional error details for debugging
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response: { data: any; status: number } };
        console.error('Response data:', apiError.response.data);
        console.error('Response status:', apiError.response.status);
      }
    } finally {
      isLoading = false;
    }
  }

  // Search and filter functions
  function handleSearch() {
    currentPage = 1;
    loadDistressSales();
  }

  function handleFilterChange() {
    currentPage = 1;
    loadDistressSales();
  }

  function handleSortChange() {
    loadDistressSales();
  }

  function handlePageChange(page: number) {
    currentPage = page;
    loadDistressSales();
  }

  // Utility functions
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  function getUrgencyColor(urgency: string) {
    switch (urgency) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  }

  // Modal functions
  function openModal(index: number) {
    modalIndex = index;
    isModalOpen = true;
  }

  function closeModal() {
    isModalOpen = false;
  }

  function prevImage() {
    if (products.length > 0) {
      modalIndex = (modalIndex - 1 + products[0].images.length) % products[0].images.length;
    }
  }

  function nextImage() {
    if (products.length > 0) {
      modalIndex = (modalIndex + 1) % products[0].images.length;
    }
  }

  // Featured slider functions
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

  // Watch for filter changes
  $: if (selectedCategory || selectedLocation || selectedUrgency) {
    handleFilterChange();
  }

  $: if (selectedSortBy || selectedSortOrder) {
    handleSortChange();
  }
</script>

<svelte:head>
  <title>Distress Sales - Ocean App</title>
</svelte:head>

<div class="distress-content">
  <div class="sticky-search">
    <div class="search-bar">
      <div class="search-input">
        <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
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
          {#each locations as location}
            <option value={location}>{location}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <select bind:value={selectedUrgency} on:change={handleFilterChange}>
          <option value="">All Urgency Levels</option>
          {#each urgencyLevels as urgency}
            <option value={urgency.value}>{urgency.label}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <select bind:value={selectedSortBy} on:change={handleSortChange}>
          {#each sortOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <select bind:value={selectedSortOrder} on:change={handleSortChange}>
          <option value="DESC">Newest First</option>
          <option value="ASC">Oldest First</option>
        </select>
      </div>
    </div>
  </div>

  <div class="scrollable-content">
    <!-- Error Message -->
    {#if errorMessage}
      <div class="error-message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        {errorMessage}
        <button class="retry-btn" on:click={loadDistressSales}>Retry</button>
      </div>
    {/if}

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
                <div class="stats-info">
                  <span>{totalItems} active distress sales</span>
                </div>
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

    <!-- Loading State -->
    {#if isLoading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading distress sales...</p>
      </div>
    {:else if products.length === 0}
      <div class="no-results">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <h3>No distress sales found</h3>
        <p>Try adjusting your search criteria or check back later</p>
      </div>
    {:else}
      <div class="products-grid">
        {#each products.filter(product => product.seller) as product (product.id)}
          <div class="product-card">
            <div class="seller-info">
              <img src={product.seller?.profilePicture || '/wrigglyLine2.png'} alt={product.seller?.fullName || 'Seller'} class="seller-avatar" />
              <div class="seller-details">
                <span class="seller-name">{product.seller?.fullName || 'Unknown Seller'}</span>
                <span class="post-time">{formatDate(product.createdAt)}</span>
              </div>
              <div class="urgency-badge" style="background-color: {product.urgencyLevel ? getUrgencyColor(product.urgencyLevel) : '#6b7280'}">
                {product.urgencyLevel ? product.urgencyLevel.toUpperCase() : 'REGULAR'}
              </div>
            </div>

            <div class="product-image">
              <img 
                src={product.images?.[0] || '/test.jpg.jpg'} 
                alt={product.title}
                on:click={() => openModal(0)}
              />
              <div class="discount-badge">
                {product.discountPercentage ? Math.round(product.discountPercentage) + '% OFF' : 'SALE'}
              </div>
              {#if product.distressExpiryDate}
                <div class="expiry-badge">
                  Expires: {formatDate(product.distressExpiryDate)}
                </div>
              {/if}
            </div>

            <div class="product-info">
              <h3 class="product-title">{product.title}</h3>
              <div class="product-description">{product.description}</div>
              
              <div class="price-info">
                <span class="current-price">{formatCurrency(product.price)}</span>
                {#if product.originalPrice && product.originalPrice > product.price}
                  <span class="original-price">{formatCurrency(product.originalPrice)}</span>
                {/if}
              </div>

              <div class="product-meta">
                <div class="product-location">
                  <svg class="location-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>{product.location}</span>
                </div>
                
                <div class="product-stats">
                  <span class="stat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    {product.views}
                  </span>
                  <span class="stat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                    {product.saves}
                  </span>
                </div>
              </div>

              {#if product.distressReason}
                <div class="distress-reason">
                  <strong>Reason:</strong> {product.distressReason}
                </div>
              {/if}

              <div class="product-actions">
                <button class="message-btn">Message</button>
                <button class="save-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>
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

  {#if isModalOpen && products.length > 0}
    <div class="modal-backdrop" on:click={closeModal}></div>
    <div class="modal">
      <button class="modal-close" on:click={closeModal}>&times;</button>
      <button class="modal-nav left" on:click={prevImage}>&lt;</button>
      <img class="modal-img" src={products[0].images?.[modalIndex] || '/test.jpg.jpg'} alt="Zoomed image" />
      <button class="modal-nav right" on:click={nextImage}>&gt;</button>
      <div class="modal-thumbs">
        {#each products[0].images || [] as img, idx}
          <img 
            src={img} 
            alt={`Thumb ${idx+1}`} 
            class:active-thumb={idx === modalIndex} 
            on:click={() => modalIndex = idx} 
          />
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
    padding-top: 88px;
  }

  .sticky-search {
    position: sticky;
    top: 0;
    z-index: 10;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    padding: 0.5rem 2rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .filters-section {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .filter-group select {
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    background: white;
    font-size: 0.875rem;
    min-width: 120px;
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 2rem 2rem;
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
    margin-bottom: 1rem;
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

  .product-card {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: none;
    border: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .seller-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    position: relative;
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
    flex: 1;
  }

  .seller-name {
    font-weight: 600;
    color: #2D3748;
  }

  .post-time {
    font-size: 0.875rem;
    color: #718096;
  }

  .urgency-badge {
    position: absolute;
    top: 0;
    right: 0;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .product-image {
    position: relative;
    width: 100%;
    aspect-ratio: 16/10;
    border-radius: 1rem;
    overflow: hidden;
    margin-bottom: 1rem;
    cursor: pointer;
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

  .expiry-badge {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }

  .product-info {
    margin-top: 1rem;
  }

  .product-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .product-description {
    color: #475569;
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1rem;
  }

  .price-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .current-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #ef4444;
  }

  .original-price {
    font-size: 1rem;
    color: #6b7280;
    text-decoration: line-through;
  }

  .product-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .product-location {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6366F1;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .location-icon {
    width: 1rem;
    height: 1rem;
    fill: #6366F1;
  }

  .product-stats {
    display: flex;
    gap: 1rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #6b7280;
    font-size: 0.75rem;
  }

  .distress-reason {
    background: #f3f4f6;
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    color: #374151;
    margin-bottom: 1rem;
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

  .pagination {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 2rem;
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

  /* Featured slider styles */
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
    margin-bottom: 1rem;
  }

  .stats-info {
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.5s ease forwards;
    animation-delay: 0.6s;
    font-size: 0.875rem;
    opacity: 0.8;
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
      padding-top: 64px;
    }

    .sticky-search {
      padding: 0.5rem;
    }

    .scrollable-content {
      padding: 0 0.5rem 0.5rem;
    }

    .filters-section {
      flex-direction: column;
    }

    .filter-group select {
      width: 100%;
    }

    .featured-slider {
      border-radius: 0;
      margin: 0 0 0.5rem 0;
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

    .slider-nav.left {
      left: 1rem;
    }

    .slider-nav.right {
      right: 1rem;
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

    .products-grid {
      grid-template-columns: 1fr;
      padding: 0.5rem;
    }

    .pagination {
      flex-wrap: wrap;
    }
  }
</style>
