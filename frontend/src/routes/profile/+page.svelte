<script lang="ts">
  import { onMount } from 'svelte';
  import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
  import { getProfile } from '$lib/api/auth';
  import { getFollowStats, followUser, unfollowUser, checkFollowStatus } from '$lib/api/follow';
  import { getUserPosts } from '$lib/api/feed';
  import { authStore } from '$lib/stores/auth';
  import EditProfile from '$lib/components/EditProfile.svelte';
  import AddFeed from '$lib/components/AddFeed.svelte';
  
  // Real user data from backend
  let userData: any = null;
  let loading = true;
  let error = '';
  let followStats: any = null;
  let isFollowing = false;
  let isOwnProfile = false;
  let currentUser: any = null;
  let showEditModal = false;

  // User posts state
  let userPosts: any[] = [];
  let postsLoading = false;
  let postsError = '';
  let showAddFeedModal = false;
  let editingPost: any = null;

  // Load user profile data
  async function loadProfile() {
    try {
      loading = true;
      error = '';
      const response = await getProfile();
      
      if (response.ok) {
        const data = await response.json();
        userData = {
          ...data.profileInfo,
          // Add mock stats for now
          sellerStats: {
            totalSales: data.profileInfo.totalSales || 0,
            activeListings: 12,
            rating: data.profileInfo.rating || 0,
            responseRate: "98%",
            responseTime: "< 1h",
            memberSince: data.profileInfo.joinDate?.split(' ')[1] || "2024"
          },
          buyerStats: {
            totalPurchases: 45,
            wishlistItems: 8,
            reviewsGiven: 32,
            memberSince: data.profileInfo.joinDate?.split(' ')[1] || "2024",
            savedSellers: 15,
            activeBids: 3
          }
        };

        // Get current user from auth store
        authStore.subscribe((state) => {
          if (state.user) {
            currentUser = state.user;
            isOwnProfile = currentUser.id === userData.id;
            
            // Load follow stats and status if not own profile
            if (!isOwnProfile) {
              loadFollowData();
            }
          }
        })();
      } else {
        error = 'Failed to load profile';
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      error = 'Failed to load profile';
    } finally {
      loading = false;
    }
  }

  // Load follow data for other users
  async function loadFollowData() {
    try {
      // Get follow stats
      const statsResponse = await getFollowStats(userData.id);
      if (statsResponse && statsResponse.message) {
        followStats = statsResponse.data || statsResponse;
      }

      // Check if current user is following this user
      const followStatusResponse = await checkFollowStatus(userData.id);
      if (followStatusResponse && followStatusResponse.message) {
        const statusData = followStatusResponse.data || followStatusResponse;
        isFollowing = statusData.isFollowing;
      }
    } catch (err: any) {
      console.error('Error loading follow data:', err);
    }
  }

  // Handle follow/unfollow
  async function handleFollowToggle() {
    try {
      if (isFollowing) {
        await unfollowUser(userData.id);
        isFollowing = false;
        if (followStats) {
          followStats.followersCount--;
        }
      } else {
        await followUser(userData.id);
        isFollowing = true;
        if (followStats) {
          followStats.followersCount++;
        }
      }
    } catch (err: any) {
      console.error('Error toggling follow:', err);
    }
  }

  // Handle profile update from modal
  function handleProfileUpdate(event: CustomEvent) {
    const updatedData = event.detail;
    // Update the userData with the new profile information
    userData = { ...userData, ...updatedData };
    showEditModal = false;
  }

  // Load user posts
  async function loadUserPosts() {
    if (!userData?.id) return;
    
    try {
      postsLoading = true;
      postsError = '';
      const response = await getUserPosts(userData.id, { limit: 20 });
      
      if (response && response.message) {
        userPosts = response.data.posts || [];
      } else {
        postsError = 'Failed to load posts';
      }
    } catch (err: any) {
      console.error('Error loading user posts:', err);
      postsError = 'Failed to load posts';
    } finally {
      postsLoading = false;
    }
  }

  // Handle feed actions (create, update, delete)
  function handleFeedSubmit(event: CustomEvent) {
    const { post, isEditing, action } = event.detail;
    
    if (action === 'created') {
      // Add new post to the beginning of the list
      userPosts = [post, ...userPosts];
    } else if (action === 'updated') {
      // Update existing post
      userPosts = userPosts.map(p => p.id === post.id ? post : p);
    } else if (action === 'deleted') {
      // Remove deleted post
      userPosts = userPosts.filter(p => p.id !== post.id);
    }
    
    showAddFeedModal = false;
    editingPost = null;
  }

  // Open edit post modal
  function editPost(post: any) {
    editingPost = post;
    showAddFeedModal = true;
  }

  // Open create post modal
  function createPost() {
    editingPost = null;
    showAddFeedModal = true;
  }

  onMount(() => {
    loadProfile();
  });

  // Watch for userData changes to load posts
  $: if (userData?.id && isOwnProfile) {
    loadUserPosts();
  }
</script>

<ProtectedRoute>
  <div class="profile-page">
    {#if loading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    {:else if error}
      <div class="error-container">
        <p>Error: {error}</p>
        <button on:click={loadProfile}>Retry</button>
      </div>
    {:else if userData}
      <div class="profile-container">
        <!-- Cover Photo Section -->
        <div class="cover-photo">
          <img src={userData.coverPicture || "/default-cover.jpg"} alt="Cover Photo" />
        </div>

        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-main">
            <div class="profile-image">
              <img src={userData.profilePicture || "/default-avatar.jpg"} alt="Profile" />
              {#if userData.verificationStatus === 'verified'}
                <div class="verified-badge" title="Verified">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
              {/if}
            </div>

            <div class="profile-info">
              <div class="user-name">
                <h1>{userData.fullName}</h1>
                {#if userData.role === 'seller' && userData.verificationStatus === 'verified'}
                  <span class="verified-text">Verified Business</span>
                {/if}
              </div>
              
              <!-- Edit Profile Button (only show for own profile) -->
              {#if isOwnProfile}
                <button class="edit-profile-button" on:click={() => showEditModal = true}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profile
                </button>
              {/if}

              {#if userData.role === 'seller'}
                <div class="business-category">{userData.category || 'General'}</div>
                <div class="business-location">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {userData.location || 'Location not specified'}
                </div>
                <div class="business-established">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                  </svg>
                  {userData.joinDate}
                </div>
              {:else}
                <div class="user-bio">{userData.bio}</div>
                <div class="user-meta">
                  <div class="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {userData.location || 'Location not specified'}
                  </div>
                  <div class="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                    </svg>
                    {userData.joinDate}
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Follow/Following Section -->
          <div class="follow-section">
            <!-- Follow Stats -->
            <div class="follow-stats">
              <div class="follow-stat">
                <span class="stat-number">{followStats?.followersCount || 0}</span>
                <span class="stat-label">Followers</span>
              </div>
              <div class="follow-stat">
                <span class="stat-number">{followStats?.followingCount || 0}</span>
                <span class="stat-label">Following</span>
              </div>
            </div>

            <!-- Follow Button (only show for other users) -->
            {#if !isOwnProfile && currentUser}
              <button 
                class="follow-button" 
                class:following={isFollowing}
                on:click={handleFollowToggle}
              >
                {#if isFollowing}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c-1 0-2-.4-2-1s1-2 2-2 2 1 2 2-1 1-2 1z"/>
                    <path d="M3 12c1 0 2-.4 2-1s-1-2-2-2-2 1-2 2 1 1 2 1z"/>
                  </svg>
                  Following
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  Follow
                {/if}
              </button>
            {/if}
          </div>

          <!-- Performance Metrics -->
          {#if userData.role === 'seller'}
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
        </div>

        <!-- Profile Content -->
        <div class="profile-content">
          <h2>Welcome to your profile!</h2>
          <p>Account Type: {userData.role}</p>
          <p>Email: {userData.email}</p>
          <p>Status: {userData.accountStatus}</p>
          {#if userData.role === 'seller'}
            <p>Business Name: {userData.businessName || 'Not set'}</p>
            <p>Category: {userData.category || 'Not set'}</p>
          {/if}
        </div>

        <!-- User Posts Section (only show for own profile) -->
        {#if isOwnProfile}
          <div class="user-posts-section">
            <div class="posts-header">
              <h3>My Posts</h3>
              <button class="create-post-btn" on:click={createPost}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14"/>
                  <path d="M5 12h14"/>
                </svg>
                Create Post
              </button>
            </div>

            {#if postsLoading}
              <div class="posts-loading">
                <div class="loading-spinner"></div>
                <p>Loading posts...</p>
              </div>
            {:else if postsError}
              <div class="posts-error">
                <p>{postsError}</p>
                <button on:click={loadUserPosts}>Retry</button>
              </div>
            {:else if userPosts.length === 0}
              <div class="no-posts">
                <p>You haven't created any posts yet.</p>
                <button class="create-first-post-btn" on:click={createPost}>
                  Create Your First Post
                </button>
              </div>
            {:else}
              <div class="posts-grid">
                {#each userPosts as post}
                  <div class="post-card">
                    {#if post.media && post.media.length > 0}
                      <div class="post-image">
                        <img src={post.media[0].mediaUrl} alt="Post media" />
                      </div>
                    {/if}
                    <div class="post-content">
                      <h4>{post.postType === 'product' ? post.productName || 'Product Post' : 'Post'}</h4>
                      <p class="post-text">{post.content}</p>
                      {#if post.postType === 'product' && post.price}
                        <div class="post-price">${post.price}</div>
                      {/if}
                      <div class="post-meta">
                        <span class="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span class="post-type">{post.postType}</span>
                      </div>
                      <div class="post-actions">
                        <button class="edit-post-btn" on:click={() => editPost(post)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- AddFeed Component Modal -->
  <AddFeed
    post={editingPost}
    isOpen={showAddFeedModal}
    onClose={() => {
      showAddFeedModal = false;
      editingPost = null;
    }}
    on:submit={handleFeedSubmit}
  />

  <style>
    .profile-page {
      min-height: 100vh;
      background-color: #f8fafc;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 1rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 1rem;
    }

    .error-container button {
      padding: 0.75rem 1.5rem;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .cover-photo {
      width: 100%;
      height: 200px;
      overflow: hidden;
    }

    .cover-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-header {
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

    .profile-info {
      flex: 1;
    }

    .user-name {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .user-name h1 {
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

    .meta-item svg {
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
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .follow-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 1.5rem 0;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 1rem;
    }

    .follow-stats {
      display: flex;
      gap: 2rem;
    }

    .follow-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-number {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .follow-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: 2px solid #3B82F6;
      border-radius: 0.75rem;
      background: #3B82F6;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .follow-button:hover {
      background: #2563EB;
      border-color: #2563EB;
      transform: translateY(-1px);
    }

    .follow-button.following {
      background: transparent;
      color: #3B82F6;
      border-color: #3B82F6;
    }

    .follow-button.following:hover {
      background: #FEF2F2;
      color: #DC2626;
      border-color: #DC2626;
    }

    .follow-button svg {
      width: 1rem;
      height: 1rem;
    }

    .profile-content {
      padding: 2rem;
      border-top: 1px solid #e2e8f0;
    }

    .profile-content h2 {
      margin: 0 0 1rem 0;
      color: #1a202c;
    }

    .profile-content p {
      margin: 0.5rem 0;
      color: #4a5568;
    }

    @media (max-width: 768px) {
      .profile-main {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .profile-image {
        margin-top: -60px;
      }

      .profile-image img {
        width: 120px;
        height: 120px;
      }

      .user-name h1 {
        font-size: 1.5rem;
      }

      .performance-metrics {
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        padding: 1rem;
      }

      .metric {
        padding: 0.75rem;
      }

      .metric-value {
        font-size: 1.25rem;
      }

      .metric-label {
        font-size: 0.75rem;
      }

      .follow-section {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .follow-stats {
        gap: 1.5rem;
      }

      .stat-number {
        font-size: 1.125rem;
      }

      .stat-label {
        font-size: 0.75rem;
      }

      .follow-button {
        padding: 0.625rem 1.25rem;
        font-size: 0.8125rem;
      }
    }
    
    .edit-profile-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      border-radius: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 0.5rem;
    }
    
    .edit-profile-button:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }
    
    .edit-profile-button svg {
      width: 1rem;
      height: 1rem;
    }

    /* User Posts Section Styles */
    .user-posts-section {
      padding: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    .posts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .posts-header h3 {
      margin: 0;
      font-size: 1.5rem;
      color: #111;
    }

    .create-post-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border: none;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .create-post-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .create-post-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .posts-loading,
    .posts-error,
    .no-posts {
      text-align: center;
      padding: 3rem 1rem;
      color: #6b7280;
    }

    .posts-loading .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    .posts-error button,
    .no-posts button {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
    }

    .create-first-post-btn {
      background: linear-gradient(135deg, #10b981, #059669) !important;
    }

    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .post-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 1rem;
      overflow: hidden;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .post-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .post-image {
      width: 100%;
      height: 200px;
      overflow: hidden;
    }

    .post-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .post-content {
      padding: 1.5rem;
    }

    .post-content h4 {
      margin: 0 0 0.75rem;
      font-size: 1.125rem;
      color: #111;
      font-weight: 600;
    }

    .post-text {
      margin: 0 0 1rem;
      color: #4b5563;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .post-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #059669;
      margin-bottom: 1rem;
    }

    .post-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .post-type {
      background: #f3f4f6;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      text-transform: capitalize;
    }

    .post-actions {
      display: flex;
      gap: 0.75rem;
    }

    .edit-post-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f59e0b;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .edit-post-btn:hover {
      background: #d97706;
      transform: translateY(-1px);
    }

    .edit-post-btn svg {
      width: 1rem;
      height: 1rem;
    }

    @media (max-width: 768px) {
      .posts-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .posts-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .post-card {
        margin: 0 1rem;
      }
    }
  </style>
  
  <!-- Edit Profile Modal -->
  <EditProfile 
    showModal={showEditModal} 
    userData={userData}
    on:submit={handleProfileUpdate}
  />

  <!-- AddFeed Component Modal -->
  <AddFeed
    post={editingPost}
    isOpen={showAddFeedModal}
    onClose={() => showAddFeedModal = false}
    on:submit={handleFeedSubmit}
  />
</ProtectedRoute>
