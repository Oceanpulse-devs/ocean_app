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
    },
    {
      id: 2,
      title: "MacBook Pro 2023 - 16GB RAM",
      price: 1299,
      image: "/test.jpg.jpg",
      status: "Active",
      views: 189,
      likes: 32,
      category: "Electronics",
      condition: "New"
    },
    {
      id: 3,
      title: "Sony WH-1000XM4 Headphones",
      price: 299,
      image: "/test.jpg.jpg",
      status: "Active",
      views: 156,
      likes: 28,
      category: "Electronics",
      condition: "Like New"
    },
    {
      id: 4,
      title: "Nintendo Switch OLED",
      price: 349,
      image: "/test.jpg.jpg",
      status: "Active",
      views: 278,
      likes: 67,
      category: "Gaming",
      condition: "New"
    },
    {
      id: 5,
      title: "Samsung Galaxy S23 Ultra",
      price: 1199,
      image: "/test.jpg.jpg",
      status: "Active",
      views: 312,
      likes: 89,
      category: "Electronics",
      condition: "New"
    }
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
    },
    {
      id: 2,
      user: {
        name: "Sarah Wilson",
        avatar: "/test.jpg.jpg"
      },
      rating: 4,
      comment: "Good communication and quick response. The item arrived in perfect condition. Would buy from again!",
      date: "2 weeks ago",
      product: "MacBook Pro 2023"
    },
    {
      id: 3,
      user: {
        name: "Michael Chen",
        avatar: "/test.jpg.jpg"
      },
      rating: 5,
      comment: "Excellent service! The seller went above and beyond to ensure I was satisfied with my purchase.",
      date: "3 weeks ago",
      product: "Sony WH-1000XM4"
    },
    {
      id: 4,
      user: {
        name: "Emma Thompson",
        avatar: "/test.jpg.jpg"
      },
      rating: 4,
      comment: "Very professional seller. The product was well-packaged and arrived earlier than expected.",
      date: "1 month ago",
      product: "Nintendo Switch OLED"
    },
    {
      id: 5,
      user: {
        name: "David Rodriguez",
        avatar: "/test.jpg.jpg"
      },
      rating: 5,
      comment: "Best buying experience ever! The seller was extremely helpful and the product exceeded my expectations.",
      date: "1 month ago",
      product: "Samsung Galaxy S23 Ultra"
    },
    {
      id: 6,
      user: {
        name: "Lisa Anderson",
        avatar: "/test.jpg.jpg"
      },
      rating: 4,
      comment: "Great price and fast shipping. The item was exactly as described. Very satisfied with my purchase.",
      date: "2 months ago",
      product: "iPhone 12 Pro Max"
    }
  ];

  let sales = [
    {
      id: 1,
      title: "iPhone 12 Pro Max",
      price: 899,
      image: "/test.jpg.jpg",
      date: "2 days ago",
      status: "Completed"
    },
    {
      id: 2,
      title: "MacBook Pro 2023",
      price: 1299,
      image: "/test.jpg.jpg",
      date: "1 week ago",
      status: "Completed"
    },
    {
      id: 3,
      title: "Sony WH-1000XM4 Headphones",
      price: 299,
      image: "/test.jpg.jpg",
      date: "2 weeks ago",
      status: "Completed"
    },
    {
      id: 4,
      title: "Nintendo Switch OLED",
      price: 349,
      image: "/test.jpg.jpg",
      date: "3 weeks ago",
      status: "Completed"
    },
    {
      id: 5,
      title: "Samsung Galaxy S23 Ultra",
      price: 1199,
      image: "/test.jpg.jpg",
      date: "1 month ago",
      status: "Completed"
    },
    {
      id: 6,
      title: "iPad Pro 12.9-inch",
      price: 999,
      image: "/test.jpg.jpg",
      date: "1 month ago",
      status: "Completed"
    },
    {
      id: 7,
      title: "AirPods Pro 2nd Gen",
      price: 249,
      image: "/test.jpg.jpg",
      date: "2 months ago",
      status: "Completed"
    },
    {
      id: 8,
      title: "PlayStation 5",
      price: 499,
      image: "/test.jpg.jpg",
      date: "2 months ago",
      status: "Completed"
    },
    {
      id: 9,
      title: "DJI Mini 3 Pro Drone",
      price: 759,
      image: "/test.jpg.jpg",
      date: "3 months ago",
      status: "Completed"
    },
    {
      id: 10,
      title: "GoPro Hero 11",
      price: 499,
      image: "/test.jpg.jpg",
      date: "3 months ago",
      status: "Completed"
    }
  ];

  let purchases = [
    {
      id: 1,
      title: "iPhone 13 Pro",
      price: 999,
      image: "/test.jpg.jpg",
      date: "2 days ago",
      status: "Delivered",
      seller: "TechStore"
    },
    {
      id: 2,
      title: "Nike Air Max 270",
      price: 150,
      image: "/test.jpg.jpg",
      date: "1 week ago",
      status: "Delivered",
      seller: "SneakerHead"
    },
    {
      id: 3,
      title: "Samsung 4K Smart TV",
      price: 799,
      image: "/test.jpg.jpg",
      date: "2 weeks ago",
      status: "Delivered",
      seller: "ElectroWorld"
    },
    {
      id: 4,
      title: "Sony PlayStation 5",
      price: 499,
      image: "/test.jpg.jpg",
      date: "1 month ago",
      status: "Delivered",
      seller: "GameZone"
    },
    {
      id: 5,
      title: "Apple Watch Series 7",
      price: 399,
      image: "/test.jpg.jpg",
      date: "2 months ago",
      status: "Delivered",
      seller: "TechStore"
    }
  ];

  let wishlist = [
    {
      id: 1,
      title: "MacBook Pro M2",
      price: 1299,
      image: "/test.jpg.jpg",
      addedDate: "2 days ago",
      seller: "Apple Store",
      category: "Electronics"
    },
    {
      id: 2,
      title: "Nike Air Jordan 1",
      price: 179,
      image: "/test.jpg.jpg",
      addedDate: "1 week ago",
      seller: "SneakerHead",
      category: "Fashion"
    },
    {
      id: 3,
      title: "Sony WH-1000XM5",
      price: 399,
      image: "/test.jpg.jpg",
      addedDate: "2 weeks ago",
      seller: "AudioWorld",
      category: "Electronics"
    },
    {
      id: 4,
      title: "Canon EOS R6",
      price: 2499,
      image: "/test.jpg.jpg",
      addedDate: "1 month ago",
      seller: "PhotoPro",
      category: "Photography"
    },
    {
      id: 5,
      title: "Rolex Submariner",
      price: 8999,
      image: "/test.jpg.jpg",
      addedDate: "2 months ago",
      seller: "LuxuryWatches",
      category: "Luxury"
    }
  ];

  let activeBids = [
    {
      id: 1,
      title: "Vintage Rolex Daytona",
      currentBid: 8500,
      yourBid: 8200,
      timeLeft: "2 days 5 hours",
      image: "/test.jpg.jpg",
      seller: "LuxuryWatches",
      totalBids: 12,
      status: "Outbid"
    },
    {
      id: 2,
      title: "Limited Edition Nike Dunk Low",
      currentBid: 250,
      yourBid: 250,
      timeLeft: "5 hours 30 mins",
      image: "/test.jpg.jpg",
      seller: "SneakerHead",
      totalBids: 8,
      status: "Highest Bidder"
    },
    {
      id: 3,
      title: "Sony A7IV Camera",
      currentBid: 2200,
      yourBid: 2100,
      timeLeft: "1 day 12 hours",
      image: "/test.jpg.jpg",
      seller: "PhotoPro",
      totalBids: 15,
      status: "Outbid"
    },
    {
      id: 4,
      title: "Apple Mac Studio",
      currentBid: 1800,
      yourBid: 1800,
      timeLeft: "3 hours 45 mins",
      image: "/test.jpg.jpg",
      seller: "TechStore",
      totalBids: 6,
      status: "Highest Bidder"
    },
    {
      id: 5,
      title: "Designer Leather Bag",
      currentBid: 450,
      yourBid: 400,
      timeLeft: "8 hours 20 mins",
      image: "/test.jpg.jpg",
      seller: "FashionHouse",
      totalBids: 9,
      status: "Outbid"
    }
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
    // Automatically switch to appropriate tab based on account type
    if (userData.accountType === 'buyer') {
      activeTab = 'purchases';
    } else {
      activeTab = 'listings';
    }
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
            <div class="see-more-card">
              <button class="see-more-btn" on:click={() => console.log('See more clicked')}>
                <span class="see-more-text">See More</span>
                <span class="see-more-count">+{Math.floor(Math.random() * 50)} items</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="see-more-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
      </div>
              </div>
        {:else if activeTab === 'sales'}
          <div class="sales-list">
            {#each sales as sale}
              <div class="sale-item">
                <div class="sale-info">
                  <h3>{sale.title}</h3>
                  <div class="sale-details">
                    <span class="sale-price">${sale.price}</span>
                    <span class="sale-date">{sale.date}</span>
                    <span class="sale-status {sale.status.toLowerCase()}">{sale.status}</span>
                  </div>
                </div>
                <div class="sale-actions">
                  <button class="view-details-btn">View Details</button>
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
          <div class="purchases-list">
            {#each purchases as purchase}
              <div class="purchase-item">
                <div class="purchase-info">
                  <h3>{purchase.title}</h3>
                  <div class="purchase-details">
                    <span class="purchase-price">${purchase.price}</span>
                    <span class="purchase-date">{purchase.date}</span>
                    <span class="purchase-status {purchase.status.toLowerCase()}">{purchase.status}</span>
                    <span class="purchase-seller">Seller: {purchase.seller}</span>
                  </div>
                </div>
                <div class="purchase-actions">
                  <button class="view-details-btn">View Details</button>
                  <button class="track-order-btn">Track Order</button>
                </div>
              </div>
            {/each}
          </div>
        {:else if activeTab === 'wishlist'}
          <div class="wishlist-grid">
            {#each wishlist as item}
              <div class="wishlist-item">
                <div class="wishlist-image-container">
                  <img src={item.image} alt={item.title} class="wishlist-image" />
                  <button class="remove-wishlist-btn" title="Remove from wishlist">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div class="wishlist-content">
                  <h3>{item.title}</h3>
                  <p class="price">${item.price}</p>
                  <div class="wishlist-meta">
                    <span class="category">{item.category}</span>
                    <span class="seller">Seller: {item.seller}</span>
                  </div>
                  <div class="wishlist-footer">
                    <span class="added-date">Added {item.addedDate}</span>
                    <button class="buy-now-btn">Buy Now</button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="bids-list">
            {#each activeBids as bid}
              <div class="bid-item">
                <div class="bid-image-container">
                  <img src={bid.image} alt={bid.title} class="bid-image" />
                  <span class="bid-status {bid.status.toLowerCase().replace(' ', '-')}">
                    {bid.status}
                  </span>
                </div>
                <div class="bid-content">
                  <div class="bid-header">
                    <h3>{bid.title}</h3>
                    <span class="seller">Seller: {bid.seller}</span>
                  </div>
                  <div class="bid-details">
                    <div class="bid-amounts">
                      <div class="amount-group">
                        <span class="label">Current Bid</span>
                        <span class="value">${bid.currentBid}</span>
                      </div>
                      <div class="amount-group">
                        <span class="label">Your Bid</span>
                        <span class="value">${bid.yourBid}</span>
                      </div>
                    </div>
                    <div class="bid-meta">
                      <div class="time-left">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                        </svg>
                        {bid.timeLeft}
                      </div>
                      <div class="total-bids">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
                        </svg>
                        {bid.totalBids} bids
                      </div>
                    </div>
                  </div>
                  <div class="bid-actions">
                    <button class="increase-bid-btn">Increase Bid</button>
                    <button class="cancel-bid-btn">Cancel Bid</button>
                  </div>
                </div>
              </div>
            {/each}
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
    width: 100%;
    max-width: 100vw;
    position: relative;
  }

  .profile-container {
    width: 100%;
    background: #fff;
    overflow-x: hidden;
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
    padding: 1rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .metric:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  /* Seller Stats Colors */
  .metric:nth-child(1) .metric-value {
    background: linear-gradient(135deg, #10B981, #059669); /* Response Rate - Green */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .metric:nth-child(2) .metric-value {
    background: linear-gradient(135deg, #3B82F6, #2563EB); /* Response Time - Blue */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .metric:nth-child(3) .metric-value {
    background: linear-gradient(135deg, #F59E0B, #D97706); /* Total Sales - Orange */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .metric:nth-child(4) .metric-value {
    background: linear-gradient(135deg, #8B5CF6, #7C3AED); /* Active Listings - Purple */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .metric:nth-child(5) .metric-value {
    background: linear-gradient(135deg, #EC4899, #DB2777); /* Rating - Pink */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .metric:nth-child(6) .metric-value {
    background: linear-gradient(135deg, #6366F1, #4F46E5); /* Member Since - Indigo */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Buyer Stats Colors */
  .metric:nth-child(1) .metric-value {
    background: linear-gradient(135deg, #F59E0B, #D97706); /* Total Purchases - Orange */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .metric:nth-child(2) .metric-value {
    background: linear-gradient(135deg, #EC4899, #DB2777); /* Wishlist Items - Pink */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .metric:nth-child(3) .metric-value {
    background: linear-gradient(135deg, #8B5CF6, #7C3AED); /* Reviews Given - Purple */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .metric:nth-child(4) .metric-value {
    background: linear-gradient(135deg, #3B82F6, #2563EB); /* Saved Sellers - Blue */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .metric:nth-child(5) .metric-value {
    background: linear-gradient(135deg, #10B981, #059669); /* Active Bids - Green */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .metric:nth-child(6) .metric-value {
    background: linear-gradient(135deg, #6366F1, #4F46E5); /* Member Since - Indigo */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .metric-label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
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
    .profile-page {
      min-height: 100vh;
      width: 100vw;
      overflow-x: hidden;
    }

    .profile-container {
      width: 100%;
      overflow-x: hidden;
    }

    .profile-main {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
      padding: 0 1rem;
      width: 100%;
      max-width: 100%;
    }

    .profile-image {
      margin-top: -60px;
      margin-bottom: 1rem;
      width: 120px;
      height: 120px;
    }

    .profile-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-info {
      width: 100%;
      text-align: center;
      padding: 0 0.5rem;
    }

    .business-name {
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      width: 100%;
    }

    .business-name h1 {
      font-size: 1.5rem;
      margin-right: 0.5rem;
      width: 100%;
    }

    .profile-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
      justify-content: center;
      width: 100%;
      padding: 0 0.5rem;
    }

    .follow-btn,
    .message-btn,
    .share-btn {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      white-space: nowrap;
      flex: 1;
      min-width: 120px;
      max-width: 150px;
    }

    .performance-metrics {
      grid-template-columns: repeat(6, 1fr);
      gap: 0.5rem;
      padding: 0.75rem;
      margin: 0.75rem;
      width: calc(100% - 1.5rem);
      background: transparent;
    }

    .metric {
      padding: 0.5rem 0.25rem;
      min-width: 0;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .metric:hover {
      transform: none;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .metric-value {
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.15rem;
    }

    .metric-label {
      font-size: 0.65rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #64748b;
    }

    .listings-grid,
    .sales-grid {
      grid-auto-columns: 180px;
      gap: 0.75rem;
  }

  .profile-tabs {
      width: 100%;
      padding: 0.5rem;
      overflow-x: auto;
      white-space: nowrap;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;
      justify-content: center;
    }

    .profile-content {
      width: 100%;
      padding: 0.5rem;
      overflow-x: hidden;
    }

    .cover-photo {
      height: 200px;
      width: 100%;
    }

    .cover-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  @media (max-width: 480px) {
    .profile-page {
      min-height: 100vh;
      width: 100vw;
      overflow-x: hidden;
    }

    .profile-main {
      padding: 0 0.5rem;
    }

    .profile-image {
      width: 100px;
      height: 100px;
    }

    .profile-info {
      padding: 0 0.25rem;
    }

    .business-name h1 {
      font-size: 1.25rem;
    }

    .follow-btn,
    .message-btn,
    .share-btn {
      min-width: 100px;
      max-width: 120px;
      font-size: 0.8rem;
      padding: 0.4rem 0.75rem;
    }

    .performance-metrics {
      grid-template-columns: repeat(6, 1fr);
      gap: 0.35rem;
      padding: 0.5rem;
      margin: 0.5rem;
      width: calc(100% - 1rem);
    }

    .metric {
      padding: 0.35rem 0.2rem;
      border-radius: 0.35rem;
    }

    .metric-value {
      font-size: 0.8rem;
      margin-bottom: 0.1rem;
    }

    .metric-label {
      font-size: 0.6rem;
    }

    .listings-grid,
    .sales-grid {
      grid-auto-columns: 160px;
      gap: 0.5rem;
    }

    .listing-image,
    .sale-image {
      height: 180px;
    }

    .cover-photo {
      height: 150px;
    }

    .profile-header {
      padding: 0.5rem;
    }

    .profile-content {
      padding: 0.25rem;
    }

    .profile-tabs {
      padding: 0.25rem;
    }

    .tab-btn {
      padding: 0.5rem 0.75rem;
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
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    justify-content: center;
    width: 100%;
  }

  .profile-tabs::-webkit-scrollbar {
    display: none;
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
    white-space: nowrap;
    min-width: fit-content;
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
    padding: 1rem;
    padding-bottom: 8rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .tab-content {
    width: 100%;
    overflow-x: hidden;
  }

  .listings-grid,
  .sales-grid {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 220px;
    gap: 1rem;
    width: 100%;
    padding: 0.5rem;
    box-sizing: border-box;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-bottom: 1rem;
    position: relative;
  }

  .listing-card,
  .sale-card,
  .see-more-card {
    width: 220px;
    flex: 0 0 220px;
    scroll-snap-align: start;
    position: relative;
    background: white;
    border-radius: 0.75rem;
    overflow: hidden;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
  }

  .listing-card:hover,
  .sale-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .listing-status {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
    background: white;
    z-index: 1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .listing-status.active {
    color: white;
    background: #2F855A;
  }

  .listing-status.sold {
    color: white;
    background: #E53E3E;
  }

  .listing-status.pending {
    color: white;
    background: #D69E2E;
  }

  .listing-image-container {
    position: relative;
    width: 100%;
    padding-top: 75%; /* 4:3 Aspect Ratio */
    flex-shrink: 0;
  }

  .listing-image,
  .sale-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .listing-content,
  .sale-content {
    padding: 0.75rem;
    width: 100%;
    box-sizing: border-box;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .listing-content h3,
  .sale-content h3 {
    margin: 0 0 0.25rem;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
    height: 2.6em;
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
    margin-top: auto;
    padding-top: 0.25rem;
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
    gap: 1rem;
    padding: 0.5rem;
    width: 100%;
  }

  .review-card {
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    width: 100%;
  }

  .review-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .review-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .review-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .review-user-info {
    flex: 1;
    min-width: 200px;
  }

  .review-user-info h4 {
    margin: 0 0 0.25rem 0;
    font-weight: 600;
    color: #1a202c;
  }

  .rating {
    display: flex;
    gap: 0.25rem;
    color: #ECC94B;
  }

  .star {
    color: #E2E8F0;
  }

  .star.filled {
    color: #ECC94B;
  }

  .review-date {
    color: #718096;
    font-size: 0.875rem;
    margin-left: auto;
  }

  .review-comment {
    color: #4A5568;
    line-height: 1.6;
    margin: 0.75rem 0 0 0;
    font-size: 0.95rem;
  }

  @media (max-width: 768px) {
    .review-card {
      padding: 1.25rem;
    }

    .review-header {
      gap: 0.75rem;
    }

    .review-avatar {
      width: 40px;
      height: 40px;
    }

    .review-user-info h4 {
      font-size: 0.95rem;
    }

    .review-date {
      font-size: 0.8rem;
    }

    .review-product {
      font-size: 0.8rem;
      padding: 0.4rem 0.75rem;
    }

    .review-comment {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .review-card {
      padding: 1rem;
    }

    .review-header {
      gap: 0.5rem;
    }

    .review-avatar {
      width: 36px;
      height: 36px;
    }

    .review-user-info {
      min-width: 150px;
    }

    .review-user-info h4 {
      font-size: 0.9rem;
    }

    .rating {
      font-size: 0.9rem;
    }

    .review-date {
      font-size: 0.75rem;
      margin-left: 0;
      width: 100%;
    }

    .review-product {
      font-size: 0.75rem;
      padding: 0.35rem 0.6rem;
    }

    .review-comment {
      font-size: 0.85rem;
    }
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      padding: 0 0.5rem;
    }
  }

  @media (max-width: 768px) {
    .profile-content {
      padding: 1rem;
    }

    .listings-grid,
    .sales-grid {
      grid-auto-columns: 180px;
      gap: 0.75rem;
    }

    .listing-card,
    .sale-card,
    .see-more-card {
      width: 180px;
      flex: 0 0 180px;
    }

    .listing-content h3,
    .sale-content h3 {
      font-size: 0.9rem;
    }

    .price {
      font-size: 1.1rem;
    }
  }

  @media (max-width: 480px) {
    .profile-content {
      padding: 0.5rem;
    }

    .listings-grid,
    .sales-grid {
      grid-auto-columns: 160px;
      gap: 0.5rem;
    }

    .listing-card,
    .sale-card,
    .see-more-card {
      width: 160px;
      flex: 0 0 160px;
    }

    .listing-content h3,
    .sale-content h3 {
      font-size: 0.85rem;
    }

    .price {
      font-size: 1rem;
    }

    .category,
    .condition {
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
    }

    .listing-stats {
      font-size: 0.7rem;
      gap: 0.5rem;
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
    position: fixed;
    top: 5rem;  /* Moved down to avoid nav bars */
    right: 2rem;
    z-index: 1000;
    background: white;
    border-radius: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    .account-toggle {
      top: 4rem;  /* Adjusted for mobile nav */
      right: 1rem;
    }
  }

  @media (max-width: 480px) {
    .account-toggle {
      top: 3.5rem;  /* Further adjusted for smaller screens */
      right: 0.75rem;
    }

    .toggle-button {
      min-width: 110px;
      padding: 0.25rem;
    }

    .toggle-option {
      padding: 0.25rem 0.4rem;
      font-size: 0.65rem;
    }

    .toggle-option svg {
      width: 0.7rem;
      height: 0.7rem;
    }
  }

  .toggle-button {
    display: flex;
    background: white;
    border-radius: 2rem;
    padding: 0.5rem;
    position: relative;
    cursor: pointer;
    border: 1px solid #e2e8f0;
    min-width: 200px;
    transition: all 0.3s ease;
  }

  @media (max-width: 768px) {
    .account-toggle {
      top: 4rem;
      right: 1rem;
    }

    .toggle-button {
      min-width: 160px;
      padding: 0.4rem;
    }

    .toggle-option {
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
    }

    .toggle-option svg {
      width: 0.9rem;
      height: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .account-toggle {
      top: 3.5rem;
      right: 0.75rem;
    }

    .toggle-button {
      min-width: 140px;
      padding: 0.35rem;
    }

    .toggle-option {
      padding: 0.35rem 0.6rem;
      font-size: 0.75rem;
    }

    .toggle-option svg {
      width: 0.8rem;
      height: 0.8rem;
    }
  }

  .toggle-option {
    padding: 0.75rem 1.25rem;
    font-size: 0.95rem;
    font-weight: 500;
    color: #64748b;
    border-radius: 1.5rem;
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
    background: #f8fafc;
    border-radius: 1.5rem;
    transition: all 0.3s ease;
    transform: translateX(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .toggle-button.seller-active::before {
    transform: translateX(100%);
  }

  @media (max-width: 768px) {
    .toggle-option {
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .toggle-option {
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
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

  .see-more-btn {
    width: 100%;
    height: 100%;
    background: white;
    border: 2px dashed #e2e8f0;
    border-radius: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0.75rem;
    position: relative;
    z-index: 2;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .see-more-btn:hover {
    border-color: #2563eb;
    background: #f8fafc;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .see-more-text {
    font-size: 0.9rem;
    font-weight: 600;
    color: #2563eb;
  }

  .see-more-count {
    font-size: 0.8rem;
    color: #64748b;
  }

  .see-more-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: #2563eb;
    margin-top: 0.25rem;
  }

  @media (max-width: 768px) {
    .see-more-card {
      width: 180px;
    }
  }

  @media (max-width: 480px) {
    .see-more-card {
      width: 160px;
    }
    .see-more-text {
      font-size: 0.85rem;
    }
    .see-more-count {
      font-size: 0.7rem;
    }
    .see-more-icon {
      width: 1.1rem;
      height: 1.1rem;
    }
  }

  .sales-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem;
  }

  .sale-item {
    background: white;
    border-radius: 0.75rem;
      padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .sale-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .sale-info {
    flex: 1;
  }

  .sale-info h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1a202c;
  }

  .sale-details {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .sale-price {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2d3748;
  }

  .sale-date {
    color: #718096;
    font-size: 0.9rem;
  }

  .sale-status {
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .sale-status.completed {
    background: #C6F6D5;
    color: #2F855A;
  }

  .sale-status.pending {
    background: #FEFCBF;
    color: #D69E2E;
  }

  .sale-status.cancelled {
    background: #FED7D7;
    color: #E53E3E;
  }

  .sale-actions {
    margin-left: 1rem;
  }

  .view-details-btn {
    padding: 0.5rem 1rem;
    background: #EBF8FF;
    color: #3182CE;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-details-btn:hover {
    background: #BEE3F8;
  }

  @media (max-width: 768px) {
    .sale-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .sale-actions {
      margin-left: 0;
      width: 100%;
    }

    .view-details-btn {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .sale-details {
      gap: 0.5rem;
    }

    .sale-price {
      font-size: 1rem;
    }

    .sale-date {
      font-size: 0.8rem;
    }

    .sale-status {
      font-size: 0.7rem;
    }
  }

  .purchases-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem;
  }

  .purchase-item {
    background: white;
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .purchase-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .purchase-info {
    flex: 1;
  }

  .purchase-info h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1a202c;
  }

  .purchase-details {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .purchase-price {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2d3748;
  }

  .purchase-date {
    color: #718096;
    font-size: 0.9rem;
  }

  .purchase-status {
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .purchase-status.delivered {
    background: #C6F6D5;
    color: #2F855A;
  }

  .purchase-status.processing {
    background: #FEFCBF;
    color: #D69E2E;
  }

  .purchase-status.cancelled {
    background: #FED7D7;
    color: #E53E3E;
  }

  .purchase-seller {
    color: #4A5568;
    font-size: 0.9rem;
  }

  .purchase-actions {
    display: flex;
    gap: 0.5rem;
    margin-left: 1rem;
  }

  .track-order-btn {
    padding: 0.5rem 1rem;
    background: #EBF8FF;
    color: #3182CE;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .track-order-btn:hover {
    background: #BEE3F8;
  }

  @media (max-width: 768px) {
    .purchase-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .purchase-actions {
      margin-left: 0;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .view-details-btn,
    .track-order-btn {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .purchase-details {
      gap: 0.5rem;
    }

    .purchase-price {
      font-size: 1rem;
    }

    .purchase-date,
    .purchase-seller {
      font-size: 0.8rem;
    }

    .purchase-status {
      font-size: 0.7rem;
    }
  }

  .wishlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 0.5rem;
  }

  .wishlist-item {
    background: white;
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
  }

  .wishlist-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .wishlist-image-container {
    position: relative;
    width: 100%;
    padding-top: 75%;
  }

  .wishlist-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-wishlist-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .remove-wishlist-btn:hover {
    background: white;
    transform: scale(1.1);
  }

  .remove-wishlist-btn svg {
    width: 1.25rem;
    height: 1.25rem;
    color: #E53E3E;
  }

  .wishlist-content {
    padding: 1rem;
  }

  .wishlist-content h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1a202c;
    line-height: 1.4;
  }

  .wishlist-meta {
    display: flex;
    gap: 0.5rem;
    margin: 0.5rem 0;
    flex-wrap: wrap;
  }

  .category {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    background: #F7FAFC;
    color: #4A5568;
    border-radius: 0.25rem;
  }

  .seller {
    font-size: 0.8rem;
    color: #718096;
  }

  .wishlist-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #EDF2F7;
  }

  .added-date {
    font-size: 0.8rem;
    color: #718096;
  }

  .buy-now-btn {
    padding: 0.5rem 1rem;
    background: #4299E1;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .buy-now-btn:hover {
    background: #3182CE;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    .wishlist-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }
  }

  @media (max-width: 480px) {
    .wishlist-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .wishlist-content h3 {
      font-size: 0.95rem;
    }

    .category,
    .seller,
    .added-date {
      font-size: 0.75rem;
    }

    .buy-now-btn {
      padding: 0.4rem 0.75rem;
      font-size: 0.85rem;
    }
  }

  .bids-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 0.5rem;
  }

  .bid-item {
    background: white;
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    gap: 1.5rem;
  }

  .bid-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .bid-image-container {
    position: relative;
    width: 200px;
    flex-shrink: 0;
  }

  .bid-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .bid-status {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.35rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .bid-status.highest-bidder {
    color: #2F855A;
    background: #C6F6D5;
  }

  .bid-status.outbid {
    color: #E53E3E;
    background: #FED7D7;
  }

  .bid-content {
    flex: 1;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .bid-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .bid-header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a202c;
    line-height: 1.4;
  }

  .seller {
    font-size: 0.9rem;
    color: #718096;
    white-space: nowrap;
  }

  .bid-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .bid-amounts {
    display: flex;
    gap: 2rem;
  }

  .amount-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .label {
    font-size: 0.85rem;
    color: #718096;
  }

  .value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #2d3748;
  }

  .bid-meta {
    display: flex;
    gap: 1.5rem;
    color: #718096;
    font-size: 0.9rem;
  }

  .time-left,
  .total-bids {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .time-left svg,
  .total-bids svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .bid-actions {
    display: flex;
    gap: 1rem;
    margin-top: auto;
  }

  .increase-bid-btn,
  .cancel-bid-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .increase-bid-btn {
    background: #4299E1;
    color: white;
    border: none;
  }

  .increase-bid-btn:hover {
    background: #3182CE;
    transform: translateY(-1px);
  }

  .cancel-bid-btn {
    background: none;
    color: #E53E3E;
    border: 1px solid #E53E3E;
  }

  .cancel-bid-btn:hover {
    background: #FED7D7;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    .bid-item {
      flex-direction: column;
      gap: 1rem;
    }

    .bid-image-container {
      width: 100%;
    }

    .bid-image {
      height: 250px;
    }

    .bid-content {
      padding: 1rem;
    }

    .bid-header {
      flex-direction: column;
      gap: 0.5rem;
    }

    .bid-amounts {
      gap: 1rem;
    }

    .bid-meta {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .bid-actions {
      flex-direction: column;
    }

    .increase-bid-btn,
    .cancel-bid-btn {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .bids-list {
      gap: 1rem;
    }

    .bid-item {
      border-radius: 0.5rem;
    }

    .bid-image {
      height: 200px;
    }

    .bid-content {
      padding: 0.75rem;
    }

    .bid-header h3 {
      font-size: 1rem;
    }

    .value {
      font-size: 1.1rem;
    }

    .time-left,
    .total-bids {
      font-size: 0.85rem;
    }

    .increase-bid-btn,
    .cancel-bid-btn {
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
    }
  }
</style> 