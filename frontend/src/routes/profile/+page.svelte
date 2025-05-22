<script lang="ts">
  import { onMount } from 'svelte';
  import Upload from '$lib/components/Upload.svelte';
  import Post from '$lib/components/Post.svelte';
  import EditProfile from '$lib/components/EditProfile.svelte';
  
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
  let showEditProfileModal = false;
  
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

  function handleProfileSubmit(event: CustomEvent) {
    console.log('Profile updated:', event.detail);
    // Here you would typically update the user data
    userData = { ...userData, ...event.detail };
    showEditProfileModal = false;
  }

  function toggleAccountType() {
    userData.accountType = userData.accountType === 'buyer' ? 'seller' : 'buyer';
  }

  let businessInfo = {
    name: "Fashion House",
    category: "Fashion & Apparel",
    location: "Lagos, Nigeria",
    contact: {
      phone: "+234 123 456 7890",
      email: "contact@fashionhouse.com",
      website: "www.fashionhouse.com"
    },
    businessHours: {
      weekdays: "9:00 AM - 6:00 PM",
      weekend: "10:00 AM - 4:00 PM"
    },
    established: "2018",
    isVerified: true
  };

  let performanceMetrics = {
    responseRate: "98%",
    responseTime: "< 1 hour",
    orderCompletion: "99.5%",
    onTimeDelivery: "97%",
    customerSatisfaction: "4.9/5",
    totalTransactions: "1.2K+",
    memberSince: "Jan 2018"
  };

  let isFollowing = false;
  let showContactForm = false;
  let showBusinessHours = false;

  function toggleFollow() {
    isFollowing = !isFollowing;
  }

  function toggleContactForm() {
    showContactForm = !showContactForm;
  }

  function toggleBusinessHours() {
    showBusinessHours = !showBusinessHours;
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
  <EditProfile 
    bind:showModal={showEditProfileModal} 
    bind:userData={userData}
    on:submit={handleProfileSubmit} 
  />

  <div class="profile-container">
    <!-- Cover Photo Section -->
    <div class="cover-photo">
      <img src={userData.coverImage || "/default-cover.jpg"} alt="Business Cover Photo" />
      <button class="edit-cover">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Change Cover
      </button>
    </div>

    <!-- Profile Header -->
    <div class="profile-header">
      <div class="profile-main">
        <div class="profile-image">
          <img src={userData.avatar || "/default-avatar.jpg"} alt="Business Profile" />
          {#if businessInfo.isVerified}
            <div class="verified-badge" title="Verified Business">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          {/if}
          <button class="edit-profile" on:click={() => showEditProfileModal = true}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
        </div>

        <div class="profile-info">
          <div class="business-name">
            <h1>{userData.name}</h1>
            {#if userData.accountType === 'seller' && businessInfo.isVerified}
              <span class="verified-text">Verified Business</span>
            {/if}
          </div>
          
          {#if userData.accountType === 'seller'}
            <div class="business-category">{businessInfo.category}</div>
            <div class="business-location">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {userData.location}
            </div>
            <div class="business-established">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
              Established {businessInfo.established}
            </div>
          {:else}
            <div class="user-bio">{userData.bio}</div>
            <div class="user-meta">
              <div class="meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {userData.location}
              </div>
              <div class="meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                </svg>
                {userData.joinDate}
              </div>
              <a href={userData.website} class="meta-item website" target="_blank" rel="noopener">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c-.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                </svg>
                {userData.website}
              </a>
            </div>
          {/if}

          <!-- Account Type Switch -->
          <div class="account-toggle">
            <button 
              class="toggle-button" 
              class:seller-active={userData.accountType === 'seller'}
              on:click={toggleAccountType}
            >
              <span class="toggle-option" class:active={userData.accountType === 'buyer'}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Buyer
              </span>
              <span class="toggle-option" class:active={userData.accountType === 'seller'}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                Seller
              </span>
            </button>
          </div>
        </div>

        <div class="profile-actions">
          <button class="follow-btn" class:following={isFollowing} on:click={toggleFollow}>
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <button class="message-btn" on:click={toggleContactForm}>
            Message
          </button>
          <button class="share-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Share
          </button>
        </div>
      </div>

      <!-- Performance Metrics -->
      {#if userData.accountType === 'seller'}
        <div class="performance-metrics">
          <div class="metric">
            <span class="metric-value">{userData.sellerStats.responseRate}</span>
            <span class="metric-label">Response Rate</span>
          </div>
          <div class="metric">
            <span class="metric-value">{userData.sellerStats.responseTime}</span>
            <span class="metric-label">Response Time</span>
          </div>
          <div class="metric">
            <span class="metric-value">{userData.sellerStats.totalSales}</span>
            <span class="metric-label">Total Sales</span>
          </div>
          <div class="metric">
            <span class="metric-value">{userData.sellerStats.activeListings}</span>
            <span class="metric-label">Active Listings</span>
          </div>
          <div class="metric">
            <span class="metric-value">{userData.sellerStats.rating}</span>
            <span class="metric-label">Rating</span>
          </div>
          <div class="metric">
            <span class="metric-value">{userData.sellerStats.memberSince}</span>
            <span class="metric-label">Member Since</span>
          </div>
        </div>
      {:else}
        <div class="performance-metrics">
          <div class="metric">
            <span class="metric-value">{userData.buyerStats.totalPurchases}</span>
            <span class="metric-label">Total Purchases</span>
          </div>
          <div class="metric">
            <span class="metric-value">{userData.buyerStats.wishlistItems}</span>
            <span class="metric-label">Wishlist Items</span>
          </div>
          <div class="metric">
            <span class="metric-value">{userData.buyerStats.reviewsGiven}</span>
            <span class="metric-label">Reviews Given</span>
          </div>
          <div class="metric">
            <span class="metric-value">{userData.buyerStats.savedSellers}</span>
            <span class="metric-label">Saved Sellers</span>
          </div>
          <div class="metric">
            <span class="metric-value">{userData.buyerStats.activeBids}</span>
            <span class="metric-label">Active Bids</span>
          </div>
          <div class="metric">
            <span class="metric-value">{userData.buyerStats.memberSince}</span>
            <span class="metric-label">Member Since</span>
          </div>
        </div>
      {/if}

      <!-- Business Hours -->
      <div class="business-hours">
        <button class="hours-toggle" on:click={toggleBusinessHours}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
          </svg>
          Business Hours
        </button>
        {#if showBusinessHours}
          <div class="hours-details">
            <div class="hours-row">
              <span class="day">Weekdays</span>
              <span class="time">{businessInfo.businessHours.weekdays}</span>
            </div>
            <div class="hours-row">
              <span class="day">Weekend</span>
              <span class="time">{businessInfo.businessHours.weekend}</span>
            </div>
          </div>
        {/if}
      </div>
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

  .profile-container {
    width: 100%;
    background: #fff;
  }

  .cover-photo {
    position: relative;
    width: 100%;
    height: 300px;
    overflow: hidden;
  }

  .cover-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .edit-cover {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .edit-cover:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .edit-cover svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .profile-header {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .profile-main {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .profile-image {
    position: relative;
    margin-top: -80px;
  }

  .profile-image img {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    border: 4px solid white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .verified-badge {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    background: #2563eb;
    color: white;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }

  .verified-badge svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .edit-profile {
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  }

  .edit-profile:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .edit-profile svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .profile-info {
    flex: 1;
  }

  .business-name {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .business-name h1 {
    margin: 0;
    font-size: 2rem;
    color: #111;
  }

  .verified-text {
    background: #2563eb;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .business-category {
    color: #64748b;
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
  }

  .business-location,
  .business-established {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
  }

  .business-location svg,
  .business-established svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .profile-actions {
    display: flex;
    gap: 1rem;
  }

  .follow-btn,
  .message-btn,
  .share-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .follow-btn {
    background: none;
    border: 1px solid #2563eb;
    color: #2563eb;
  }

  .follow-btn:hover {
    background: rgba(37, 99, 235, 0.08);
  }

  .follow-btn.following {
    background: #2563eb;
    color: white;
  }

  .message-btn {
    background: linear-gradient(135deg, #0EA5E9, #7C3AED);
    border: none;
    color: white;
  }

  .message-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(37,99,235,0.12);
  }

  .share-btn {
    background: none;
    border: 1px solid #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .share-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .share-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .performance-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 1rem;
    margin-bottom: 2rem;
  }

  .metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111;
    margin-bottom: 0.25rem;
  }

  .metric-label {
    font-size: 0.875rem;
    color: #64748b;
  }

  .business-hours {
    margin-bottom: 2rem;
  }

  .hours-toggle {
    background: none;
    border: none;
    color: #64748b;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: background 0.2s;
  }

  .hours-toggle:hover {
    background: #f8fafc;
  }

  .hours-toggle svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .hours-details {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.75rem;
  }

  .hours-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
  }

  .hours-row:not(:last-child) {
    border-bottom: 1px solid #e2e8f0;
  }

  .day {
    font-weight: 500;
    color: #111;
  }

  .time {
    color: #64748b;
  }

  @media (max-width: 1024px) {
    .profile-header {
      padding: 1.5rem;
    }

    .profile-main {
      gap: 1.5rem;
    }

    .profile-image img {
      width: 140px;
      height: 140px;
    }
  }

  @media (max-width: 768px) {
    .profile-main {
      flex-direction: row;
      align-items: flex-start;
      text-align: left;
      gap: 1rem;
      padding: 0 1rem;
    }

    .profile-image {
      margin-top: -60px;
      flex-shrink: 0;
    }

    .profile-image img {
      width: 100px;
      height: 100px;
    }

    .profile-info {
      flex: 1;
      min-width: 0;
    }

    .business-name {
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .business-name h1 {
      font-size: 1.5rem;
      margin-right: 0.5rem;
    }

    .verified-text {
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
    }

    .business-category,
    .user-bio {
      font-size: 0.9rem;
      margin: 0.5rem 0;
    }

    .business-location,
    .business-established,
    .user-meta {
      font-size: 0.85rem;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .profile-actions {
      flex-wrap: nowrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .follow-btn,
    .message-btn,
    .share-btn {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      white-space: nowrap;
    }

    .performance-metrics {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      padding: 1rem;
      margin: 1rem;
    }

    .metric {
      padding: 0.5rem;
    }

    .metric-value {
      font-size: 1.1rem;
    }

    .metric-label {
      font-size: 0.75rem;
    }

    .profile-tabs {
      padding: 0.5rem;
      overflow-x: auto;
      white-space: nowrap;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .profile-tabs::-webkit-scrollbar {
      display: none;
    }

    .tab-btn {
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
    }

    .listings-grid,
    .sales-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      padding: 0.75rem;
    }

    .listing-card,
    .sale-card {
      border-radius: 0.75rem;
    }

    .listing-image,
    .sale-image {
      height: 120px;
    }

    .listing-content,
    .sale-content {
      padding: 0.5rem;
    }

    .listing-content h3,
    .sale-content h3 {
      font-size: 0.85rem;
    }

    .price {
      font-size: 0.9rem;
    }

    .listing-meta {
      gap: 0.25rem;
    }

    .category,
    .condition {
      font-size: 0.65rem;
      padding: 0.1rem 0.25rem;
    }

    .listing-stats {
      font-size: 0.65rem;
    }

    .reviews-list {
      padding: 0.75rem;
    }

    .review-card {
      padding: 1rem;
      border-radius: 0.75rem;
    }

    .review-header {
      gap: 0.75rem;
    }

    .review-avatar {
      width: 40px;
      height: 40px;
    }

    .review-user-info h4 {
      font-size: 0.9rem;
    }

    .review-date {
      font-size: 0.75rem;
    }

    .review-product {
      font-size: 0.8rem;
    }

    .review-comment {
      font-size: 0.85rem;
    }

    .action-button {
      bottom: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .action-button .icon {
      width: 1.25rem;
      height: 1.25rem;
    }

    .account-toggle {
      margin: 0.75rem 0;
    }

    .toggle-button {
      min-width: 180px;
    }

    .toggle-option {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }

    .toggle-option svg {
      width: 1.1rem;
      height: 1.1rem;
    }
  }

  @media (max-width: 480px) {
    .profile-main {
      flex-direction: row;
      align-items: flex-start;
      text-align: left;
      padding: 0 0.75rem;
    }

    .profile-image {
      margin-top: -40px;
    }

    .profile-image img {
      width: 80px;
      height: 80px;
    }

    .business-name {
      justify-content: flex-start;
    }

    .business-location,
    .business-established,
    .user-meta {
      justify-content: flex-start;
    }

    .profile-actions {
      flex-wrap: nowrap;
      justify-content: flex-start;
    }

    .follow-btn,
    .message-btn,
    .share-btn {
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
    }

    .performance-metrics {
      grid-template-columns: repeat(3, 1fr);
      margin: 0.75rem;
    }

    .listings-grid,
    .sales-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .listing-image,
    .sale-image {
      height: 100px;
    }

    .cover-photo {
      height: 120px;
    }

    .edit-cover {
      padding: 0.35rem 0.75rem;
      font-size: 0.85rem;
    }

    .edit-cover svg {
      width: 1rem;
      height: 1rem;
    }

    .metric-value {
      font-size: 1rem;
    }

    .metric-label {
      font-size: 0.7rem;
    }

    .tab-btn {
      padding: 0.6rem 0.8rem;
      font-size: 0.8rem;
    }
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

  .user-bio {
    color: #4a5568;
    font-size: 1.1rem;
    line-height: 1.6;
    margin: 1rem 0;
  }

  .user-meta {
    display: flex;
    gap: 1.5rem;
    margin: 1rem 0;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.95rem;
  }

  .meta-item.website {
    color: #2563eb;
    text-decoration: none;
  }

  .meta-item.website:hover {
    text-decoration: underline;
  }

  .meta-item svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  @media (max-width: 768px) {
    .user-meta {
      justify-content: center;
      gap: 1rem;
    }
  }

  .account-toggle {
    margin: 1rem 0;
  }

  .toggle-button {
    display: flex;
    background: #f8fafc;
    border-radius: 1.5rem;
    padding: 0.25rem;
    position: relative;
    cursor: pointer;
    border: 1px solid #e2e8f0;
    min-width: 200px;
    transition: all 0.3s ease;
  }

  .toggle-option {
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    border-radius: 1.25rem;
    transition: all 0.3s ease;
    z-index: 1;
    flex: 1;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .toggle-option svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .toggle-option.active {
    color: #2563eb;
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
    transition: all 0.3s ease;
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