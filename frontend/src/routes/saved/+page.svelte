<script lang="ts">
  import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
  import { onMount } from 'svelte';
  import { getSavedPosts } from '$lib/api/feed';
  import { getSavedProducts } from '$lib/api/products';
  import { authStore } from '$lib/stores/auth';
  import { toggleSave } from '$lib/api/feed';
  import { toggleSaveProduct } from '$lib/api/products';
  
  interface SavedPost {
    id: string;
    collectionName: string;
    createdAt: string;
    post: {
      id: string;
      content: string;
      media?: Array<{
        id: string;
        mediaType: string;
        mediaUrl: string;
        thumbnailUrl?: string;
      }>;
      user: {
        id: string;
        fullName: string;
        profilePicture?: string;
        accountType: string;
      };
      createdAt: string;
      likesCount: number;
      commentsCount: number;
      savedCount: number;
    };
  }
  
  interface SavedProduct {
    id: string;
    collectionName: string;
    createdAt: string;
    product: {
      id: string;
      title: string;
      description: string;
      price: string;
      currency: string;
      brand: string;
      category: string;
      condition: string;
      location: string;
      images: string[];
      views: number;
      saves: number;
    seller: {
        id: string;
        fullName: string;
        profilePicture?: string;
      };
    };
  }

  let savedPosts: SavedPost[] = [];
  let savedProducts: SavedProduct[] = [];
  let activeTab: 'posts' | 'products' = 'posts';
  let loading = true;
  let error: string | null = null;
  let currentPage = 1;
  let hasMore = true;
  let postsLoading = false;
  let productsLoading = false;

  // Load saved items on mount
  onMount(async () => {
    await loadSavedItems();
  });

  async function loadSavedItems() {
    try {
      loading = true;
      error = null;
      
      // Load both saved posts and products
      const [postsResponse, productsResponse] = await Promise.all([
        getSavedPosts({ page: 1, limit: 20 }),
        getSavedProducts({ page: 1, limit: 20 })
      ]);

      savedPosts = postsResponse.data.savedPosts || [];
      savedProducts = productsResponse.data.savedProducts || [];
      
    } catch (err) {
      console.error('Error loading saved items:', err);
      error = 'Failed to load saved items';
    } finally {
      loading = false;
    }
  }

  async function loadMorePosts() {
    if (postsLoading || !hasMore) return;
    
    try {
      postsLoading = true;
      const response = await getSavedPosts({ 
        page: currentPage + 1, 
        limit: 20 
      });
      
      if (response.data.savedPosts.length > 0) {
        savedPosts = [...savedPosts, ...response.data.savedPosts];
        currentPage++;
        hasMore = response.data.pagination.hasNextPage;
      } else {
        hasMore = false;
      }
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      postsLoading = false;
    }
  }

  async function loadMoreProducts() {
    if (productsLoading || !hasMore) return;
    
    try {
      productsLoading = true;
      const response = await getSavedProducts({ 
        page: currentPage + 1, 
        limit: 20 
      });
      
      if (response.data.savedProducts.length > 0) {
        savedProducts = [...savedProducts, ...response.data.savedProducts];
        currentPage++;
        hasMore = response.data.pagination.hasNextPage;
      } else {
        hasMore = false;
      }
    } catch (err) {
      console.error('Error loading more products:', err);
    } finally {
      productsLoading = false;
    }
  }

  async function unsavePost(postId: string) {
    try {
      await toggleSave(postId);
      // Remove from local state
      savedPosts = savedPosts.filter(post => post.post.id !== postId);
    } catch (err) {
      console.error('Error unsaving post:', err);
    }
  }

  async function unsaveProduct(productId: string) {
    try {
      await toggleSaveProduct(productId);
      // Remove from local state
      savedProducts = savedProducts.filter(product => product.product.id !== productId);
    } catch (err) {
      console.error('Error unsaving product:', err);
    }
  }

  async function refreshSavedItems() {
    currentPage = 1;
    hasMore = true;
    await loadSavedItems();
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  }

  function getFirstImage(images: string[] | undefined) {
    if (!images || images.length === 0) return '/test.jpg.jpg';
    return images[0];
  }

  function getFirstMediaUrl(media: any[] | undefined) {
    if (!media || media.length === 0) return '/test.jpg.jpg';
    return media[0].thumbnailUrl || media[0].mediaUrl;
  }
</script>

<ProtectedRoute>
  <main class="main-container">
    <div class="saved-content">
      <div class="search-bar">
        <div class="search-input">
          <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input type="text" placeholder="Search your saved items..." />
          <button class="camera-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 21H5V3H13V9H19V21Z"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="saved-header">
        <div class="header-content">
          <div class="header-text">
        <h1>Saved Items</h1>
            <p>Your saved posts and products</p>
          </div>
          <button class="refresh-btn" on:click={refreshSavedItems} title="Refresh saved items">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs">
        <button 
          class="tab-btn {activeTab === 'posts' ? 'active' : ''}"
          on:click={() => activeTab = 'posts'}
        >
          Posts ({savedPosts.length})
        </button>
        <button 
          class="tab-btn {activeTab === 'products' ? 'active' : ''}"
          on:click={() => activeTab = 'products'}
        >
          Products ({savedProducts.length})
        </button>
      </div>

      <!-- Loading State -->
      {#if loading}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading your saved items...</p>
        </div>
      {:else if error}
        <div class="error-state">
          <p>{error}</p>
          <button class="retry-btn" on:click={loadSavedItems}>Try Again</button>
        </div>
      {:else if activeTab === 'posts' && savedPosts.length === 0}
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No saved posts yet</h3>
          <p>Posts you save will appear here</p>
        </div>
      {:else if activeTab === 'products' && savedProducts.length === 0}
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <h3>No saved products yet</h3>
          <p>Products you save will appear here</p>
        </div>
      {:else}
        <!-- Saved Posts Tab -->
        {#if activeTab === 'posts'}
          <div class="saved-grid posts-grid">
            {#each savedPosts as savedPost}
              <div class="saved-item post-item">
                <div class="post-header">
                  <div class="user-info">
                    <img 
                      src={savedPost.post.user.profilePicture || '/wrigglyLine2.png'} 
                      alt={savedPost.post.user.fullName}
                      class="user-avatar"
                    />
                    <div class="user-details">
                      <span class="user-name">{savedPost.post.user.fullName}</span>
                      <span class="post-time">{formatDate(savedPost.post.createdAt)}</span>
                    </div>
                  </div>
                  <div class="header-actions">
                    <div class="collection-badge">
                      {savedPost.collectionName}
                    </div>
                    <button 
                      class="unsave-btn"
                      on:click={() => unsavePost(savedPost.post.id)}
                      title="Remove from saved"
                    >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
                </div>
                
                <div class="post-content">
                  <p class="post-text">{savedPost.post.content}</p>
                  {#if savedPost.post.media && savedPost.post.media.length > 0}
                    <div class="post-media">
                      <img 
                        src={getFirstMediaUrl(savedPost.post.media)} 
                        alt="Post media"
                        class="media-image"
                      />
                    </div>
                  {/if}
                </div>

                <div class="post-stats">
                  <span class="stat">❤️ {savedPost.post.likesCount}</span>
                  <span class="stat">💬 {savedPost.post.commentsCount}</span>
                  <span class="stat">🔖 {savedPost.post.savedCount}</span>
                </div>

                <div class="post-actions">
                  <button class="view-btn" on:click={() => window.location.href = '/feed'}>
                    View in Feed
                  </button>
                  <p class="action-hint">You'll see this post in your main feed</p>
                </div>
              </div>
            {/each}
          </div>

          {#if hasMore && savedPosts.length > 0}
            <div class="load-more">
              <button 
                class="load-more-btn"
                on:click={loadMorePosts}
                disabled={postsLoading}
              >
                {postsLoading ? 'Loading...' : 'Load More Posts'}
              </button>
            </div>
          {/if}
        {/if}

        <!-- Saved Products Tab -->
        {#if activeTab === 'products'}
          <div class="saved-grid products-grid">
            {#each savedProducts as savedProduct}
              <div class="saved-item product-item">
                <div class="product-image">
                  <img 
                    src={getFirstImage(savedProduct.product.images)} 
                    alt={savedProduct.product.title}
                  />
                  <div class="image-overlay">
                    <div class="collection-badge">
                      {savedProduct.collectionName}
                    </div>
                    <button 
                      class="unsave-btn"
                      on:click={() => unsaveProduct(savedProduct.product.id)}
                      title="Remove from saved"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div class="product-info">
                  <h3 class="product-title">{savedProduct.product.title}</h3>
                  <p class="product-brand">{savedProduct.product.brand}</p>
                  <div class="product-meta">
                    <span class="condition">{savedProduct.product.condition}</span>
                    <span class="location">📍 {savedProduct.product.location}</span>
                  </div>
                  <div class="price-row">
                    <p class="price">${savedProduct.product.price}</p>
                  </div>
                  
                  <div class="seller-info">
                                    <img 
                  src={savedProduct.product.seller.profilePicture || '/wrigglyLine2.png'}
                  alt={savedProduct.product.seller.fullName}
                  class="seller-avatar"
                />
                <span class="seller-name">{savedProduct.product.seller.fullName}</span>
                  </div>

                  <div class="product-stats">
                    <span class="stat">👁️ {savedProduct.product.views}</span>
                    <span class="stat">🔖 {savedProduct.product.saves}</span>
                  </div>
                </div>

                <div class="product-actions">
                  <button class="view-btn" on:click={() => window.location.href = `/products/${savedProduct.product.id}`}>
                    View Product Details
                  </button>
                  <p class="action-hint">See full product information and contact seller</p>
            </div>
          </div>
        {/each}
      </div>

          {#if hasMore && savedProducts.length > 0}
            <div class="load-more">
              <button 
                class="load-more-btn"
                on:click={loadMoreProducts}
                disabled={productsLoading}
              >
                {productsLoading ? 'Loading...' : 'Load More Products'}
              </button>
            </div>
          {/if}
        {/if}
      {/if}
    </div>
  </main>
</ProtectedRoute>

<style>
  .main-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
  }

  .saved-content {
    min-height: calc(100vh - 65px);
    display: flex;
    flex-direction: column;
    padding: 2rem;
    padding-top: 88px; /* 72px navbar + 16px gap */
  }

  .saved-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 800px;
    margin: 0 auto;
  }

  .header-text {
    text-align: left;
  }

  .header-text h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1F2937;
    margin: 0 0 0.5rem 0;
  }

  .header-text p {
    font-size: 1.125rem;
    color: #6B7280;
    margin: 0;
  }

  .refresh-btn {
    background: #F3F4F6;
    border: none;
    padding: 0.75rem;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6B7280;
  }

  .refresh-btn:hover {
    background: #E5E7EB;
    color: #374151;
    transform: rotate(180deg);
  }

  .refresh-btn svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid #F3F4F6;
    padding-bottom: 0.5rem;
  }

  .tab-btn {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: #6B7280;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .tab-btn:hover {
    background: #F9FAFB;
    color: #374151;
  }

  .tab-btn.active {
    background: #3B82F6;
    color: white;
  }

  .tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 2rem;
    height: 3px;
    background: #3B82F6;
    border-radius: 2px;
  }

  /* Loading, Error, and Empty States */
  .loading-state,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #6B7280;
  }

  .spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid #F3F4F6;
    border-top: 3px solid #3B82F6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .retry-btn {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #3B82F6;
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .retry-btn:hover {
    background: #2563EB;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    display: block;
  }

  .empty-state h3 {
    color: #374151;
    margin: 0 0 0.5rem 0;
  }

  /* Grid Layouts */
  .saved-grid {
    display: grid;
    gap: 1.5rem;
    padding: 1rem 0;
  }

  .posts-grid {
    grid-template-columns: 1fr;
    }

    .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  /* Saved Item Styles */
  .saved-item {
    background: white;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }

  .saved-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
  }

  /* Post Item Styles */
  .post-item {
    padding: 1.5rem;
  }

  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .image-overlay {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: flex;
    flex-direction: column;
      gap: 0.5rem;
    align-items: flex-end;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #F3F4F6;
  }

  .user-details {
    display: flex;
    flex-direction: column;
  }

  .user-name {
    font-weight: 600;
    color: #1F2937;
    font-size: 0.875rem;
  }

  .post-time {
    font-size: 0.75rem;
    color: #6B7280;
  }

  .collection-badge {
    background: #FEF3C7;
    color: #92400E;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .post-content {
    margin-bottom: 1rem;
  }

  .post-text {
    color: #374151;
    line-height: 1.6;
    margin: 0 0 1rem 0;
  }

  .post-media {
    margin-top: 1rem;
  }

  .media-image {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: 0.75rem;
  }

  .post-stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 1rem 0;
    border-top: 1px solid #F3F4F6;
  }

  .stat {
    font-size: 0.875rem;
    color: #6B7280;
  }

  /* Product Item Styles */
  .product-item {
    display: flex;
    flex-direction: column;
    height: 100%;
    }

    .product-image {
    width: 100%;
    aspect-ratio: 1;
    position: relative;
    background: white;
  }

  .product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-image .collection-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
  }

  .product-info {
    padding: 1.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .product-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1F2937;
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .product-brand {
    font-size: 0.875rem;
    color: #6B7280;
    margin: 0 0 0.75rem 0;
    font-weight: 500;
  }

  .product-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .condition {
    background: #DBEAFE;
    color: #1E40AF;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .location {
    font-size: 0.75rem;
    color: #6B7280;
  }

  .price-row {
    margin-bottom: 1rem;
  }

  .price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #059669;
    margin: 0;
  }

  .seller-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 1rem 0;
    border-top: 1px solid #F3F4F6;
  }

  .seller-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #F3F4F6;
  }

  .seller-name {
    font-size: 0.875rem;
    color: #6B7280;
    font-weight: 500;
  }

  .product-stats {
    display: flex;
    gap: 1rem;
    margin-top: auto;
  }

  /* Common Actions */
  .post-actions,
  .product-actions {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.5rem 1.5rem;
    border-top: 1px solid #F3F4F6;
    flex-shrink: 0;
  }

  .view-btn {
    flex: 1;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #3B82F6, #2563EB);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-btn:hover {
    background: linear-gradient(135deg, #2563EB, #1D4ED8);
    transform: translateY(-1px);
  }

  .action-hint {
    font-size: 0.75rem;
    color: #6B7280;
    text-align: center;
    margin: 0.5rem 0 0 0;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .action-hint {
      font-size: 0.7rem;
      margin: 0.25rem 0 0 0;
    }
  }

  /* Load More */
  .load-more {
    text-align: center;
    padding: 2rem 0;
  }

  .load-more-btn {
    padding: 0.75rem 2rem;
    background: #F3F4F6;
    color: #374151;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .load-more-btn:hover:not(:disabled) {
    background: #E5E7EB;
  }

  .load-more-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .unsave-btn {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: #6B7280;
    transition: color 0.2s;
  }

  .unsave-btn:hover {
    color: #EF4444; /* Red color for unsave */
  }

  .unsave-btn svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  /* Search Bar Styles */
  .search-bar {
    position: sticky;
    top: 88px; /* 72px navbar + 16px gap */
    z-index: 10;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    padding: 1rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
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

  /* Responsive Design */
  @media (max-width: 1024px) {
    .saved-grid {
      gap: 1rem;
      padding: 1rem 0;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .saved-content {
      padding: 1rem;
      padding-top: 80px;
    }

    .header-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .header-text {
      text-align: center;
    }

    .saved-grid {
      gap: 1rem;
      padding: 1rem 0;
    }

  .products-grid {
      grid-template-columns: 1fr;
  }

    .saved-item {
    border-radius: 0.75rem;
    }

    .post-item {
      padding: 1rem;
  }

  .product-info {
    padding: 1rem;
    }

    .post-actions,
    .product-actions {
      padding: 1rem;
    }

    .search-bar {
      top: 80px;
      padding: 0.75rem 0;
    }

    .search-input {
      border-radius: 1rem;
      padding: 0.5rem 1rem;
      margin: 0 1rem;
    }

    .tabs {
      margin-bottom: 1.5rem;
      gap: 0.25rem;
    }

    .tab-btn {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .saved-content {
      padding: 0.75rem;
      padding-top: 72px;
    }

    .saved-header h1 {
      font-size: 1.5rem;
    }

    .saved-header p {
      font-size: 0.875rem;
    }

    .post-item {
      padding: 0.75rem;
    }

    .product-info {
      padding: 0.75rem;
    }

    .post-actions,
    .product-actions {
      padding: 0.75rem;
    }

    .product-title {
      font-size: 1rem;
    }

    .price {
      font-size: 1.125rem;
    }

    .tabs {
      flex-direction: column;
      gap: 0.5rem;
    }

    .tab-btn {
      width: 100%;
      text-align: center;
    }
  }
</style> 