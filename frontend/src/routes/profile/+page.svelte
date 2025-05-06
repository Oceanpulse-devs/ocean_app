<script lang="ts">
  import { onMount } from 'svelte';
  
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
    stats: {
      posts: 46,
      followers: "2.8K",
      following: 200,
      totalSales: 156,
      activeListings: 12,
      rating: 4.9
    }
  };

  let activeTab = 'posts';
  
  let posts = [
    {
      id: 1,
      content: "Just listed a new iPhone case! Check it out in my store 📱✨",
      image: "/test.jpg.jpg",
      likes: 24,
      comments: 8,
      timestamp: "2h ago"
    }
    // More posts will be added
  ];

  let products = [
    {
      id: 1,
      name: "iPhone 12 Case",
      price: 200,
      image: "/wrigglyLine2.png",
      status: "Active",
      likes: 45
    }
    // More products will be added
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
      date: "1 week ago"
    }
    // More reviews will be added
  ];
</script>

<div class="profile-page">
  <div class="profile-header-section">
    <!-- Cover Image -->
    <div class="cover-image" style="background-image: url({userData.coverImage})">
      <button class="edit-cover-btn">Edit Cover</button>
    </div>

    <!-- Profile Header -->
    <div class="profile-header">
      <div class="profile-avatar-container">
        <img src={userData.avatar} alt={userData.name} class="profile-avatar" />
        <button class="edit-avatar-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
      </div>

      <div class="profile-info">
        <div class="profile-name-section">
          <h1>{userData.name}</h1>
          <p class="username">{userData.username}</p>
          <button class="edit-profile-btn">Edit Profile</button>
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

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{userData.stats.posts}</span>
            <span class="stat-label">Posts</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{userData.stats.followers}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{userData.stats.following}</span>
            <span class="stat-label">Following</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{userData.stats.totalSales}</span>
            <span class="stat-label">Sales</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{userData.stats.activeListings}</span>
            <span class="stat-label">Active Listings</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{userData.stats.rating}</span>
            <span class="stat-label">Rating</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Tabs -->
    <div class="profile-tabs">
      <button 
        class="tab-btn" 
        class:active={activeTab === 'posts'}
        on:click={() => activeTab = 'posts'}
      >
        Posts
      </button>
      <button 
        class="tab-btn" 
        class:active={activeTab === 'products'}
        on:click={() => activeTab = 'products'}
      >
        Products
      </button>
      <button 
        class="tab-btn" 
        class:active={activeTab === 'reviews'}
        on:click={() => activeTab = 'reviews'}
      >
        Reviews
      </button>
    </div>
  </div>

  <!-- Scrollable Content -->
  <div class="profile-content">
    <div class="tab-content">
      {#if activeTab === 'posts'}
        <div class="posts-grid">
          {#each posts as post}
            <div class="post-card">
              <img src={post.image} alt="" class="post-image" />
              <div class="post-content">
                <p>{post.content}</p>
                <div class="post-meta">
                  <span>{post.likes} likes</span>
                  <span>{post.comments} comments</span>
                  <span>{post.timestamp}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else if activeTab === 'products'}
        <div class="products-grid">
          {#each products as product}
            <div class="product-card">
              <img src={product.image} alt={product.name} class="product-image" />
              <div class="product-content">
                <h3>{product.name}</h3>
                <p class="price">${product.price}</p>
                <div class="product-meta">
                  <span class="status {product.status.toLowerCase()}">{product.status}</span>
                  <span>{product.likes} likes</span>
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
              <p class="review-comment">{review.comment}</p>
            </div>
          {/each}
        </div>
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
    background-color: #FAF9F6;
  }

  @media (max-width: 768px) {
    .profile-page {
      background-color: white;
    }

    .profile-header-section {
      padding: 0;
    }

    .cover-image {
      height: 200px;
    }

    .profile-header {
      padding: 1rem;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-top: -50px;
    }

    .profile-avatar-container {
      margin-bottom: 1rem;
    }

    .profile-info {
      width: 100%;
      padding: 0;
    }

    .profile-meta {
      justify-content: center;
      flex-wrap: wrap;
    }

    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      padding: 1rem 0;
    }

    .profile-tabs {
      position: sticky;
      top: 0;
      background-color: white;
      z-index: 20;
      padding: 0;
      border-bottom: 1px solid #E2E8F0;
    }

    .profile-content {
      padding: 1rem 0;
    }

    .posts-grid, .products-grid {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .post-card, .product-card, .review-card {
      border-radius: 0;
      margin-bottom: 1rem;
      box-shadow: none;
      border-bottom: 1px solid #E2E8F0;
    }

    .review-card {
      padding: 1rem;
    }
  }

  .profile-header-section {
    background-color: #FAF9F6;
    position: relative;
    z-index: 10;
  }

  .profile-content {
    padding: 2rem;
    padding-bottom: 8rem;
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
    gap: 2rem;
  }

  .profile-avatar-container {
    margin-top: -6rem;
    position: relative;
  }

  .profile-avatar {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    border: 4px solid white;
    object-fit: cover;
  }

  .edit-avatar-btn {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    background: white;
    border: none;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .profile-info {
    flex: 1;
  }

  .profile-name-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
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

  .edit-profile-btn {
    margin-left: auto;
    background: #4299e1;
    color: white;
    border: none;
    padding: 0.5rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
  }

  .bio {
    font-size: 1.1rem;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  .profile-meta {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #718096;
  }

  .meta-item.website {
    color: #4299e1;
    text-decoration: none;
  }

  .icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1.5rem;
    padding: 1.5rem;
    background: #f7fafc;
    border-radius: 1rem;
  }

  .stat-item {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #2d3748;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #718096;
  }

  .profile-tabs {
    background: #FAF9F6;
    z-index: 10;
    padding: 1rem;
    margin: 0 auto;
    max-width: 1200px;
    display: flex;
    gap: 1rem;
    border-bottom: 1px solid #e2e8f0;
    border-radius: 0 0 1rem 1rem;
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

  .tab-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .posts-grid,
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
  }

  .post-card,
  .product-card {
    background: white;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .post-image,
  .product-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .post-content,
  .product-content {
    padding: 1rem;
  }

  .post-meta,
  .product-meta {
    display: flex;
    gap: 1rem;
    color: #718096;
    font-size: 0.875rem;
  }

  .status {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status.active {
    background: #C6F6D5;
    color: #2F855A;
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
</style> 