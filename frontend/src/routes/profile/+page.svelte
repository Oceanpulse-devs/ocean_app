<script lang="ts">
  import { onMount } from 'svelte';
  import Upload from '$lib/components/Upload.svelte';
  import Post from '$lib/components/Post.svelte';
  
  // Mock data - will be replaced with actual API calls
  let userData = {
    name: "Abbey Lincoln",
    username: "@abbeylin",
    bio: "Digital entrepreneur | Tech enthusiast | Creating value through innovation",
    website: "www.abbeylincoln.com",
    location: "San Francisco, CA",
    joinDate: "Joined March 2024",
    coverImage: "/test.jpg.jpg",
    avatar: "/wrigglyLine2.png",
    accountType: "seller", // 'buyer' or 'seller'
    // Seller specific stats
    sellerStats: {
      totalSales: 156,
      activeListings: 12,
      rating: 4.9,
      responseRate: "98%",
      responseTime: "< 1h",
      memberSince: "2024"
    },
    // Buyer specific stats
    buyerStats: {
      totalPurchases: 45,
      wishlistItems: 8,
      reviewsGiven: 32,
      memberSince: "2024",
      savedSellers: 15,
      activeBids: 3
    }
  };

  let activeTab = 'listings';
  let showUploadModal = false;
  let showPostModal = false;
  
  let listings = [
    {
      id: 1,
      title: "iPhone 12 Pro Max - Mint Condition",
      price: 899,
      image: "/test.jpg.jpg",
      status: "Active",
      views: 245,
      likes: 45,
      category: "Electronics",
      condition: "Like New"
    }
    // More listings will be added
  ];

  let reviews = [
    {
      id: 1,
      user: {
        name: "John Doe",
        avatar: "/test.jpg.jpg"
      },
      rating: 5,
      comment: "Great seller! Fast shipping and product exactly as described.",
      date: "1 week ago",
      product: "iPhone 12 Pro Max"
    }
    // More reviews will be added
  ];

  let sales = [
    {
      id: 1,
      title: "iPhone 12 Pro Max",
      price: 899,
      image: "/test.jpg.jpg",
      date: "2 days ago",
      status: "Completed"
    }
    // More sales will be added
  ];

  function handleAction() {
    if (userData.accountType === 'buyer') {
      // Show post modal
      showPostModal = true;
    } else {
      // Show upload modal
      showUploadModal = true;
    }
  }

  function handleProductSubmit(event: CustomEvent) {
    console.log('Product submitted:', event.detail);
    showUploadModal = false;
    // Here you would typically handle the product submission
  }

  function handlePostSubmit(event: CustomEvent) {
    console.log('Post submitted:', event.detail);
    showPostModal = false;
    // Here you would typically handle the post submission
  }

  function toggleAccountType() {
    userData.accountType = userData.accountType === 'buyer' ? 'seller' : 'buyer';
  }
</script>

<div class="profile-page">
  <!-- Floating Action Button -->
  <button 
    class="action-button" 
    on:click={handleAction}
    title={userData.accountType === 'buyer' ? 'Create Post' : 'Upload Product'}
  >
    {#if userData.accountType === 'buyer'}
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 16H6v-2h12v2zm0-4H6v-2h12v2zm-3-5V3.5L18.5 9H15z"/>
      </svg>
      <span>Post</span>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
      <span>Upload</span>
    {/if}
  </button>

  <Upload bind:showModal={showUploadModal} on:submit={handleProductSubmit} />
  <Post bind:showModal={showPostModal} on:submit={handlePostSubmit} />

  <div class="profile-header-section">
  <!-- Cover Image -->
  <div class="cover-image" style="background-image: url({userData.coverImage})">
    <button class="edit-cover-btn">Edit Cover</button>
  </div>

  <!-- Profile Header -->
  <div class="profile-header">
    <div class="profile-avatar-container">
      <img src={userData.avatar} alt={userData.name} class="profile-avatar" />
    </div>

    <div class="profile-info">
      <div class="profile-name-section">
        <h1>{userData.name}</h1>
        <p class="username">{userData.username}</p>
      </div>

      <p class="bio">{userData.bio}</p>

      <div class="profile-meta">
        <span class="meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          {userData.location}
        </span>
        <span class="meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
            <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          {userData.joinDate}
        </span>
        <a href={userData.website} class="meta-item website">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
          </svg>
          {userData.website}
        </a>
      </div>

      <div class="account-toggle">
        <button 
          class="toggle-button" 
          class:seller-active={userData.accountType === 'seller'}
          on:click={toggleAccountType}
        >
          <span class="toggle-option" class:active={userData.accountType === 'buyer'}>Buyer</span>
          <span class="toggle-option" class:active={userData.accountType === 'seller'}>Seller</span>
        </button>
      </div>

      <button class="edit-profile-btn">Edit Profile</button>
    </div>
  </div>

  <!-- Profile Tabs -->
  <div class="profile-tabs">
      {#if userData.accountType === 'seller'}
    <button 
      class="tab-btn" 
          class:active={activeTab === 'listings'}
          on:click={() => activeTab = 'listings'}
    >
          Active Listings
    </button>
    <button 
      class="tab-btn" 
          class:active={activeTab === 'sales'}
          on:click={() => activeTab = 'sales'}
    >
          Sales History
    </button>
    <button 
      class="tab-btn" 
      class:active={activeTab === 'reviews'}
      on:click={() => activeTab = 'reviews'}
    >
      Reviews
    </button>
      {:else}
        <button 
          class="tab-btn" 
          class:active={activeTab === 'purchases'}
          on:click={() => activeTab = 'purchases'}
        >
          My Purchases
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'wishlist'}
          on:click={() => activeTab = 'wishlist'}
        >
          Wishlist
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'bids'}
          on:click={() => activeTab = 'bids'}
        >
          Active Bids
        </button>
      {/if}
    </div>
  </div>

  <!-- Scrollable Content -->
  <div class="profile-content">
  <div class="tab-content">
      {#if userData.accountType === 'seller'}
        {#if activeTab === 'listings'}
          <div class="listings-grid">
            {#each listings as listing}
              <div class="listing-card">
                <div class="listing-image-container">
                  <img src={listing.image} alt={listing.title} class="listing-image" />
                  <span class="listing-status {listing.status.toLowerCase()}">{listing.status}</span>
                </div>
                <div class="listing-content">
                  <h3>{listing.title}</h3>
                  <p class="price">${listing.price}</p>
                  <div class="listing-meta">
                    <span class="category">{listing.category}</span>
                    <span class="condition">{listing.condition}</span>
                  </div>
                  <div class="listing-stats">
                    <span><i class="fas fa-eye"></i> {listing.views}</span>
                    <span><i class="fas fa-heart"></i> {listing.likes}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
        {:else if activeTab === 'sales'}
          <div class="sales-grid">
            {#each sales as sale}
              <div class="sale-card">
                <img src={sale.image} alt={sale.title} class="sale-image" />
                <div class="sale-content">
                  <h3>{sale.title}</h3>
                  <p class="price">${sale.price}</p>
                  <div class="sale-meta">
                    <span class="date">{sale.date}</span>
                    <span class="status {sale.status.toLowerCase()}">{sale.status}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
        {:else}
      <div class="reviews-list">
        {#each reviews as review}
          <div class="review-card">
            <div class="review-header">
              <img src={review.user.avatar} alt={review.user.name} class="review-avatar" />
              <div class="review-user-info">
                <h4>{review.user.name}</h4>
                <div class="rating">
                  {#each Array(5) as _, i}
                    <span class="star" class:filled={i < review.rating}>★</span>
                  {/each}
                </div>
              </div>
              <span class="review-date">{review.date}</span>
            </div>
                <p class="review-product">Product: {review.product}</p>
            <p class="review-comment">{review.comment}</p>
          </div>
        {/each}
      </div>
    {/if}
      {:else}
        {#if activeTab === 'purchases'}
          <div class="purchases-grid">
            <!-- Similar to sales grid but for purchases -->
          </div>
        {:else if activeTab === 'wishlist'}
          <div class="wishlist-grid">
            <!-- Similar to listings grid but for wishlist items -->
          </div>
        {:else}
          <div class="bids-list">
            <!-- List of active bids -->
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .profile-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background-color: white;
  }

  .profile-header-section {
    background-color: white;
    position: relative;
    z-index: 10;
  }

  .cover-image {
    height: 300px;
    background-size: cover;
    background-position: center;
    border-radius: 1rem 1rem 0 0;
    position: relative;
    margin: 0 auto;
    max-width: 1200px;
    padding: 0 1rem;
  }

  .profile-header {
    max-width: 1200px;
    margin: -4rem auto 0;
    padding: 0 1rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-avatar-container {
    margin-top: -6rem;
    position: relative;
    z-index: 2;
  }

  .profile-avatar {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    border: 4px solid white;
    object-fit: cover;
  }

  .profile-info {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding-top: 2rem;
    position: relative;
    z-index: 1;
  }

  .profile-name-section {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .profile-name-section h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
  }

  .username {
    color: #718096;
    margin: 0;
  }

  .bio {
    font-size: 1.1rem;
    color: #2d3748;
    margin: 1rem 0;
    line-height: 1.6;
    padding: 0 1rem;
  }

  .profile-meta {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin: 1.5rem 0;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #718096;
    font-size: 0.875rem;
  }

  .profile-tabs {
    background: white;
    z-index: 10;
    padding: 1rem;
    margin: 0 auto;
    max-width: 1200px;
    display: flex;
    gap: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .tab-btn {
    padding: 1rem 2rem;
    background: none;
    border: none;
    font-size: 1rem;
    font-weight: 500;
    color: #718096;
    cursor: pointer;
    position: relative;
  }

  .tab-btn.active {
    color: #4299e1;
  }

  .tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: #4299e1;
  }

  .profile-content {
    padding: 2rem;
    padding-bottom: 8rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .listings-grid,
  .sales-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
    width: 100%;
  }

  .listing-card,
  .sale-card {
    background: white;
    border-radius: 1rem;
    overflow: hidden;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    height: 100%;
  }

  .listing-image-container {
    position: relative;
  }

  .listing-image,
  .sale-image {
    width: 100%;
    height: 140px;
    object-fit: cover;
  }

  .listing-status {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: white;
  }

  .listing-status.active {
    color: #2F855A;
  }

  .listing-content,
  .sale-content {
    padding: 0.75rem;
  }

  .listing-content h3,
  .sale-content h3 {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .price {
    font-size: 1rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0.25rem 0;
  }

  .listing-meta {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
    flex-wrap: wrap;
  }

  .category,
  .condition {
    font-size: 0.7rem;
    padding: 0.15rem 0.35rem;
    border-radius: 0.25rem;
    background: #f8fafc;
    color: #4a5568;
  }

  .listing-stats {
    display: flex;
    gap: 0.5rem;
    color: #718096;
    font-size: 0.7rem;
  }

  .review-product {
    color: #4a5568;
    font-size: 0.875rem;
    margin: 0.5rem 0;
    font-weight: 500;
  }

  .reviews-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .review-card {
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
  }

  .review-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .review-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .review-user-info h4 {
    margin: 0;
    font-weight: 600;
  }

  .rating {
    color: #ECC94B;
  }

  .star {
    color: #E2E8F0;
  }

  .star.filled {
    color: #ECC94B;
  }

  .review-date {
    margin-left: auto;
    color: #718096;
    font-size: 0.875rem;
  }

  .review-comment {
    color: #4A5568;
    line-height: 1.6;
    margin: 0;
  }

  /* Custom Scrollbar Styling */
  .profile-page::-webkit-scrollbar {
    width: 8px;
  }

  .profile-page::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .profile-page::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 4px;
  }

  .profile-page::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }

  /* Firefox */
  .profile-page {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f1f1;
  }

  .action-button {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 2rem;
    font-weight: 500;
    cursor: pointer;
    z-index: 100;
    transition: transform 0.2s ease;
    box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
  }

  .action-button:hover {
    transform: translateY(-2px);
  }

  .action-button .icon {
    width: 1.5rem;
    height: 1.5rem;
    fill: currentColor;
  }

  .action-button span {
    font-size: 1rem;
  }

  @media (max-width: 1200px) {
    .profile-content {
      padding: 1.5rem;
    }

    .listings-grid,
    .sales-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 768px) {
    .profile-content {
      padding: 1rem;
    }

    .listings-grid,
    .sales-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .listing-image,
    .sale-image {
      height: 120px;
    }
  }

  @media (max-width: 480px) {
    .listings-grid,
    .sales-grid {
      grid-template-columns: 1fr;
    }

    .listing-image,
    .sale-image {
      height: 180px;
    }
  }

  .edit-cover-btn {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    background: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
  }

  .edit-profile-btn {
    margin: 1rem auto;
    background: #4299e1;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    display: block;
  }

  .profile-meta {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin: 1.5rem 0;
    flex-wrap: wrap;
  }

  .meta-item.website {
    color: #4299e1;
    text-decoration: none;
  }

  .icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .account-toggle {
    margin: 0.5rem 0;
  }

  .toggle-button {
    display: flex;
    background: white;
    border-radius: 1.5rem;
    padding: 0.25rem;
    position: relative;
    cursor: pointer;
    border: 1px solid #e2e8f0;
    min-width: 200px;
  }

  .toggle-option {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #4a5568;
    border-radius: 1.25rem;
    transition: all 0.2s ease;
    z-index: 1;
    flex: 1;
      text-align: center;
    }

  .toggle-option.active {
    color: black;
    font-weight: 600;
  }

  .toggle-button::before {
    content: '';
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    width: calc(50% - 0.25rem);
    height: calc(100% - 0.5rem);
    background: white;
    border-radius: 1.25rem;
    transition: all 0.2s ease;
    transform: translateX(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .toggle-button.seller-active::before {
    transform: translateX(100%);
  }

  .toggle-button:hover::before {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    .toggle-button {
      width: 100%;
      max-width: 200px;
    }
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 1rem;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2rem;
  }
</style> 