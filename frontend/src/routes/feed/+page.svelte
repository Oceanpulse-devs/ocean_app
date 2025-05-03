<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';

  let userStats = {
    posts: 46,
    followers: '2.8K',
    following: 200
  };

  let feedPost = {
    author: {
      name: 'MBT CEO',
      avatar: '/avatars/mbt.jpg',
      timestamp: '1st February, 03:PM'
    },
    product: {
      name: 'Nike Sneakers',
      location: 'Ikeja',
      price: '$120',
      brand: 'Nike'
    },
    images: [
      '/products/sneakers-1.jpg',
      '/products/sneakers-2.jpg',
      '/products/sneakers-3.jpg'
    ],
    description: 'Step up your style with top-quality sneakers! 🔥 From classic kicks to the latest trends, I\'ve got the perfect pair for you. Comfort, style, and affordability—all in one place!',
    engagement: {
      comments: 25,
      likes: '120K',
      shares: 200,
      saved: 15
    }
  };
</script>

<div class="feed-layout">
  <Sidebar {userStats} />

  <!-- Main Content -->
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

    <div class="feed-posts">
      <article class="post">
        <div class="post-header">
          <div class="post-author">
            <img src={feedPost.author.avatar} alt={feedPost.author.name} class="author-avatar" />
            <div class="author-info">
              <h3>{feedPost.author.name}</h3>
              <span class="timestamp">{feedPost.author.timestamp}</span>
            </div>
          </div>
          <div class="post-actions">
            <button class="follow-btn">Follow</button>
            <button class="message-btn">Message Me</button>
          </div>
        </div>

        <div class="product-info">
          <div class="info-row">
            <span class="label">PRODUCT NAME:</span>
            <span class="value">{feedPost.product.name}</span>
          </div>
          <div class="info-row">
            <span class="label">LOCATION:</span>
            <span class="value">{feedPost.product.location}</span>
          </div>
          <div class="info-row">
            <span class="label">PRICE:</span>
            <span class="value">{feedPost.product.price}</span>
          </div>
          <div class="info-row">
            <span class="label">BRAND:</span>
            <span class="value">{feedPost.product.brand}</span>
          </div>
        </div>

        <div class="image-gallery">
          {#each feedPost.images as image, i}
            <div class="gallery-item">
              <img src={image} alt="Product image {i + 1}" />
            </div>
          {/each}
        </div>

        <p class="post-description">{feedPost.description}</p>

        <div class="post-engagement">
          <button class="engage-btn">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
            </svg>
            {feedPost.engagement.comments} Comments
          </button>
          <button class="engage-btn">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {feedPost.engagement.likes} Likes
          </button>
          <button class="engage-btn">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
            {feedPost.engagement.shares} Shares
          </button>
          <button class="engage-btn">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            {feedPost.engagement.saved} Saved
          </button>
        </div>
      </article>
    </div>
  </main>
</div>

<style>
  .feed-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    min-height: 100vh;
    background-color: #f8f7f4;
  }

  /* Sidebar Styles */
  .sidebar {
    background-color: #faf9f6;
    border-right: 1px solid rgba(0, 0, 0, 0.05);
    padding: 2rem;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }

  .profile-section {
    text-align: center;
    margin-bottom: 2rem;
  }

  .avatar-container {
    width: 100px;
    height: 100px;
    margin: 0 auto 1rem;
  }

  .avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .profile-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0;
  }

  .profile-username {
    color: #718096;
    margin: 0.25rem 0 1.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-value {
    font-weight: 600;
    color: #2d3748;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #718096;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    color: #4a5568;
    text-decoration: none;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }

  .nav-item:hover {
    background-color: rgba(66, 153, 225, 0.1);
  }

  .nav-item.active {
    background-color: #4299e1;
    color: white;
  }

  .nav-item .icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .ocean-logo {
    margin-top: auto;
    padding-top: 2rem;
    text-align: center;
  }

  /* Main Content Styles */
  .main-content {
    padding: 2rem 4rem;
    max-width: 100%;
    width: calc(100vw - 280px);
    margin-left: 280px;
    height: 100vh;
    overflow-y: auto;
    position: fixed;
    top: 0;
    right: 0;
    background-color: #f8f7f4;
    box-sizing: border-box;
  }

  .feed-posts {
    max-width: 800px;
    margin: 0 auto;
    padding-top: 1rem;
    width: 100%;
  }

  .search-bar {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    background-color: #f8f7f4;
    padding: 1.5rem 0;
    z-index: 10;
    max-width: 800px;
    margin: 0 auto 2rem;
    width: 100%;
  }

  .search-input {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input input {
    width: 100%;
    padding: 0.75rem 3rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 9999px;
    font-size: 0.95rem;
    background-color: white;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    width: 1.25rem;
    height: 1.25rem;
    color: #718096;
  }

  .camera-btn {
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    padding: 0.25rem;
  }

  .camera-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  /* Post Styles */
  .post {
    background-color: white;
    border-radius: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .post-author {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .author-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .author-info h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #2d3748;
  }

  .timestamp {
    font-size: 0.875rem;
    color: #718096;
  }

  .post-actions {
    display: flex;
    gap: 1rem;
  }

  .follow-btn, .message-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .follow-btn {
    background: none;
    border: 1px solid #4299e1;
    color: #4299e1;
  }

  .message-btn {
    background-color: #4299e1;
    border: none;
    color: white;
  }

  .product-info {
    margin-bottom: 1.5rem;
  }

  .info-row {
    display: flex;
    margin-bottom: 0.5rem;
  }

  .label {
    width: 120px;
    font-size: 0.875rem;
    color: #718096;
  }

  .value {
    font-weight: 500;
    color: #2d3748;
  }

  .image-gallery {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .gallery-item img {
    width: 100%;
    height: 300px;
    object-fit: cover;
    border-radius: 0.5rem;
  }

  .gallery-item:first-child {
    grid-column: 1 / -1;
  }

  .post-description {
    color: #4a5568;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  .post-engagement {
    display: flex;
    gap: 2rem;
    padding: 1rem 0;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    margin-bottom: 0;
  }

  .engage-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    color: #718096;
    font-size: 0.875rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }

  .engage-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .engage-btn .icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  @media (max-width: 1280px) {
    .main-content {
      padding: 2rem;
    }
  }

  @media (max-width: 1024px) {
    .feed-layout {
      grid-template-columns: 1fr;
    }

    .main-content {
      padding: 1.5rem;
      width: 100vw;
      margin-left: 0;
    }

    .feed-posts,
    .search-bar {
      max-width: 100%;
    }
  }
</style> 