<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { apiRequest } from '$lib/api/base';
  import { getUserPosts } from '$lib/api/feed';
  import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
  import AddFeed from '$lib/components/AddFeed.svelte';

  // Get userId from URL params
  const userId = $page.params.userId;
  
  // State variables
  let userData: any = null;
  let currentUser: any = null;
  let loading = true;
  let error = '';
  let isOwnProfile = false;
  
  // Posts
  let userPosts: any[] = [];
  let postsLoading = false;
  let postsError = '';
  
  // Modal states
  let showEditProfile = false;
  let showAddFeed = false;
  let editingPost: any = null;

  // Load profile data
  async function loadProfile() {
    try {
      loading = true;
      error = '';
      
      console.log('Loading profile for userId:', userId);
      
      // Get current user from auth store
      authStore.subscribe((state) => {
        if (state.user) {
          currentUser = state.user;
          isOwnProfile = currentUser.id === userId;
          console.log('Current user:', currentUser);
          console.log('Is own profile:', isOwnProfile);
        }
      })();

      // Fetch user profile data
      console.log('Fetching profile data from API...');
      const response = await apiRequest(`/users/${userId}`);
      console.log('API response:', response);
      
      if (response && response.message) {
        userData = response.data || response;
        console.log('User data loaded:', userData);
        
        // Load user posts
        await loadUserPosts();
      } else {
        error = 'Failed to load profile';
        console.error('No message in response:', response);
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      error = 'Failed to load profile';
    } finally {
      loading = false;
    }
  }

  // Load user posts
  async function loadUserPosts() {
    if (!userId) return;
    
    try {
      postsLoading = true;
      postsError = '';
      const response = await getUserPosts(userId);
      
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

  // Handle post actions
  function handleEditPost(post: any) {
    editingPost = post;
    showAddFeed = true;
  }

  function handleDeletePost(postId: string) {
    // Remove post from local state
    userPosts = userPosts.filter(p => p.id !== postId);
  }

  function handleCloseAddFeed() {
    showAddFeed = false;
    editingPost = null;
    // Reload posts to get updated data
    loadUserPosts();
  }

  // Navigate to own profile
  function goToOwnProfile() {
    goto('/profile');
  }

  // Load profile on mount
  onMount(() => {
    loadProfile();
  });
</script>

<ProtectedRoute>
  <div class="profile-container">
    {#if loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <p>{error}</p>
        <button on:click={loadProfile}>Try Again</button>
      </div>
    {:else if userData}
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-cover">
          <div class="profile-picture-container">
            <img 
              src={userData.profilePicture || '/test.jpg.jpg'} 
              alt={userData.fullName || 'Profile Picture'} 
              class="profile-picture"
            />
          </div>
        </div>
        
        <div class="profile-info">
          <div class="profile-main">
            <h1 class="profile-name">{userData.fullName || 'Unknown User'}</h1>
            <div class="profile-meta">
              <span class="location">
                📍 {userData.location || 'Location not set'}
              </span>
              <span class="joined-date">
                📅 Joined {userData.joinDate ? new Date(userData.joinDate).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
          
          {#if !isOwnProfile}
            <div class="profile-actions">
              <button class="message-btn">Message</button>
            </div>
          {:else}
            <div class="profile-actions">
              <button class="edit-profile-btn" on:click={() => showEditProfile = true}>
                Edit Profile
              </button>
              <button class="add-post-btn" on:click={() => showAddFeed = true}>
                Create Post
              </button>
            </div>
          {/if}
        </div>
      </div>

      <!-- Follow Stats -->
      <div class="follow-stats">
        <div class="stat-item">
          <span class="stat-number">{userPosts.length}</span>
          <span class="stat-label">Posts</span>
        </div>
      </div>

      <!-- User Posts Section -->
      <div class="posts-section">
        <h2>Posts</h2>
        
        {#if postsLoading}
          <div class="loading-state">Loading posts...</div>
        {:else if postsError}
          <div class="error-state">{postsError}</div>
        {:else if userPosts.length === 0}
          <div class="empty-state">
            {#if isOwnProfile}
              <p>You haven't posted anything yet.</p>
              <button class="add-post-btn" on:click={() => showAddFeed = true}>
                Create Your First Post
              </button>
            {:else}
              <p>This user hasn't posted anything yet.</p>
            {/if}
          </div>
        {:else}
          <div class="posts-grid">
            {#each userPosts as post}
              <div class="post-card">
                {#if post.media && post.media.length > 0}
                  <div class="post-image">
                    <img src={post.media[0].mediaUrl} alt="Post image" />
                  </div>
                {/if}
                <div class="post-content">
                  <h3>{post.title || 'Untitled'}</h3>
                  <p>{post.content}</p>
                  <div class="post-meta">
                    <span class="post-type">{post.postType}</span>
                    <span class="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  {#if isOwnProfile}
                    <div class="post-actions">
                      <button class="edit-btn" on:click={() => handleEditPost(post)}>
                        Edit
                      </button>
                      <button class="delete-btn" on:click={() => handleDeletePost(post.id)}>
                        Delete
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Navigation to Own Profile -->
      {#if !isOwnProfile}
        <div class="navigation-section">
          <button class="nav-btn" on:click={goToOwnProfile}>
            ← Back to My Profile
          </button>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Modals -->
  {#if showAddFeed}
    <AddFeed 
      isOpen={showAddFeed}
      onClose={handleCloseAddFeed}
      post={editingPost}
    />
  {/if}
</ProtectedRoute>

<style>
  .profile-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .profile-header {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin-bottom: 24px;
  }

  .profile-cover {
    height: 200px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
  }

  .profile-picture-container {
    position: absolute;
    bottom: -50px;
    left: 30px;
  }

  .profile-picture {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 4px solid white;
    object-fit: cover;
  }

  .profile-info {
    padding: 60px 30px 30px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .profile-main h1 {
    margin: 0 0 10px 0;
    font-size: 2rem;
    color: #1f2937;
  }

  .profile-meta {
    display: flex;
    gap: 20px;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .profile-actions {
    display: flex;
    gap: 12px;
  }

  .follow-btn, .message-btn, .edit-profile-btn, .add-post-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .follow-btn {
    background: #3b82f6;
    color: white;
  }

  .follow-btn:hover {
    background: #2563eb;
  }

  .follow-btn.following {
    background: #6b7280;
  }

  .follow-btn.loading {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .message-btn {
    background: #10b981;
    color: white;
  }

  .edit-profile-btn {
    background: #f59e0b;
    color: white;
  }

  .add-post-btn {
    background: #8b5cf6;
    color: white;
  }

  .follow-stats {
    display: flex;
    gap: 40px;
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
  }

  .stat-item {
    text-align: center;
  }

  .stat-number {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
  }

  .stat-label {
    color: #6b7280;
    font-size: 0.9rem;
  }

  .follow-lists-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
  }

  .follow-tabs {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
  }

  .follow-tab {
    flex: 1;
    padding: 16px;
    border: none;
    background: none;
    cursor: pointer;
    font-weight: 600;
    color: #6b7280;
    transition: all 0.2s;
  }

  .follow-tab.active {
    color: #3b82f6;
    border-bottom: 2px solid #3b82f6;
  }

  .follow-content {
    padding: 24px;
  }

  .followers-grid, .following-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }

  .follower-card, .following-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .follower-card:hover, .following-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }

  .follower-avatar, .following-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .follower-info h4, .following-info h4 {
    margin: 0 0 4px 0;
    color: #1f2937;
  }

  .follower-info span, .following-info span {
    color: #6b7280;
    font-size: 0.9rem;
  }

  .posts-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 24px;
    margin-bottom: 24px;
  }

  .posts-section h2 {
    margin: 0 0 20px 0;
    color: #1f2937;
  }

  .posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .post-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .post-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .post-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .post-content {
    padding: 16px;
  }

  .post-content h3 {
    margin: 0 0 8px 0;
    color: #1f2937;
  }

  .post-content p {
    color: #6b7280;
    margin: 0 0 12px 0;
    line-height: 1.5;
  }

  .post-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .post-type {
    background: #e5e7eb;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #374151;
  }

  .post-date {
    color: #9ca3af;
    font-size: 0.8rem;
  }

  .post-actions {
    display: flex;
    gap: 8px;
  }

  .edit-btn, .delete-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .edit-btn {
    background: #f59e0b;
    color: white;
  }

  .delete-btn {
    background: #ef4444;
    color: white;
  }

  .navigation-section {
    text-align: center;
    margin-top: 24px;
  }

  .nav-btn {
    padding: 12px 24px;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-btn:hover {
    background: #4b5563;
  }

  .loading-state, .error-state, .empty-state {
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .profile-info {
      flex-direction: column;
      gap: 20px;
    }

    .profile-actions {
      justify-content: center;
    }

    .follow-stats {
      flex-direction: column;
      gap: 20px;
    }

    .followers-grid, .following-grid {
      grid-template-columns: 1fr;
    }

    .posts-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
