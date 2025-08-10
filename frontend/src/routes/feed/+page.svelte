<script lang="ts">
  import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
  import { getFeed, createPost, toggleLike, toggleSave, createComment, getComments, deleteComment, type Comment } from '$lib/api/feed';
  import { onMount } from 'svelte';
  import AddFeed from '$lib/components/AddFeed.svelte';
  
  // Feed data state
  let posts: any[] = [];
  let isLoading = true;
  let error: string | null = null;
  let selectedRegion = 'all';
  let searchQuery = '';

  // UI state
  let showComments = false;
  let commentText = '';
  let showShareMenu = false;
  let comments: Comment[] = [];
  let isLoadingComments = false;
  let commentingPostId = '';
  let isModalOpen = false;
  let modalIndex = 0;
  let currentPostId = '';
  let showReportModal = false;
  let currentReportStep = 0;
  let selectedReportReason = '';
  let reportDetails = '';
  let isMobile = false;

  // Post creation state
  let showCreatePost = false;
  let newPost = {
    content: '',
    media: [] as string[],
    tags: [] as string[],
    location: ''
  };

  // AddFeed component state
  let showAddFeedModal = false;

  interface Region {
    id: string;
    name: string;
  }

  interface RegionGroup {
    group: string;
    regions: Region[];
  }

  const regions: (Region | RegionGroup)[] = [
    { id: 'all', name: 'All Regions' },
    { 
      group: 'Nigeria',
      regions: [
        { id: 'nigeria-all', name: 'All Nigeria' },
        { id: 'lagos', name: 'Lagos' },
        { id: 'abuja', name: 'Abuja' },
        { id: 'port-harcourt', name: 'Port Harcourt' },
        { id: 'ibadan', name: 'Ibadan' },
        { id: 'benin', name: 'Benin' },
        { id: 'calabar', name: 'Calabar' },
        { id: 'enugu', name: 'Enugu' },
        { id: 'kano', name: 'Kano' }
      ]
    },
    {
      group: 'Africa',
      regions: [
        { id: 'africa-all', name: 'All Africa' },
        { id: 'ghana', name: 'Ghana' },
        { id: 'kenya', name: 'Kenya' },
        { id: 'south-africa', name: 'South Africa' },
        { id: 'egypt', name: 'Egypt' },
        { id: 'ethiopia', name: 'Ethiopia' },
        { id: 'morocco', name: 'Morocco' }
      ]
    },
    {
      group: 'Europe',
      regions: [
        { id: 'europe-all', name: 'All Europe' },
        { id: 'uk', name: 'United Kingdom' },
        { id: 'france', name: 'France' },
        { id: 'germany', name: 'Germany' },
        { id: 'spain', name: 'Spain' },
        { id: 'italy', name: 'Italy' },
        { id: 'netherlands', name: 'Netherlands' }
      ]
    },
    {
      group: 'North America',
      regions: [
        { id: 'north-america-all', name: 'All North America' },
        { id: 'usa', name: 'United States' },
        { id: 'canada', name: 'Canada' },
        { id: 'mexico', name: 'Mexico' }
      ]
    },
    {
      group: 'Asia',
      regions: [
        { id: 'asia-all', name: 'All Asia' },
        { id: 'china', name: 'China' },
        { id: 'india', name: 'India' },
        { id: 'japan', name: 'Japan' },
        { id: 'singapore', name: 'Singapore' },
        { id: 'uae', name: 'United Arab Emirates' }
      ]
    }
  ];

  const shareOptions = [
    { name: 'Copy Link', icon: 'link' },
    { name: 'WhatsApp', icon: 'whatsapp' },
    { name: 'Facebook', icon: 'facebook' },
    { name: 'Twitter', icon: 'twitter' },
    { name: 'Email', icon: 'email' }
  ];

  const reportQuestions = [
    {
      id: 'spam',
      question: 'Is this post spam or misleading?',
      description: 'Contains false information or promotional content'
    },
    {
      id: 'inappropriate',
      question: 'Is this content inappropriate?',
      description: 'Contains offensive, violent, or adult content'
    },
    {
      id: 'harassment',
      question: 'Is this post harassing someone?',
      description: 'Contains bullying, threats, or personal attacks'
    },
    {
      id: 'copyright',
      question: 'Is this post violating copyright?',
      description: 'Contains unauthorized use of protected content'
    },
    {
      id: 'other',
      question: 'Other reason',
      description: 'Select if none of the above apply'
    }
  ];

  // Load feed data
  async function loadFeed() {
    try {
      isLoading = true;
      error = null;
      
      const response = await getFeed({
        region: selectedRegion === 'all' ? undefined : selectedRegion,
        page: 1,
        limit: 20
      });
      
      posts = response.data?.posts || [];
    } catch (err: any) {
      console.error('Feed loading error:', err);
      error = err.message || 'Failed to load feed';
    } finally {
      isLoading = false;
    }
  }

  // Load comments for a post
  async function loadComments(postId: string) {
    try {
      isLoadingComments = true;
      const response = await getComments(postId);
      comments = response.data.comments || [];
    } catch (err: any) {
      console.error('Error loading comments:', err);
    } finally {
      isLoadingComments = false;
    }
  }

  // Handle comment submit
  async function handleCommentSubmit() {
    if (commentText.trim() && commentingPostId) {
      try {
        const response = await createComment(commentingPostId, commentText.trim());
        
        // Add new comment to the list
        comments = [response.data, ...comments];
        
        // Update comment count on the post
        const postIndex = posts.findIndex(p => p.id === commentingPostId);
        if (postIndex !== -1) {
          posts[postIndex].commentsCount = (posts[postIndex].commentsCount || 0) + 1;
          posts = [...posts]; // Trigger reactivity
        }
        
        commentText = '';
      } catch (err: any) {
        console.error('Error submitting comment:', err);
      }
    }
  }

  // Delete a comment
  async function handleDeleteComment(commentId: string) {
    try {
      await deleteComment(commentId);
      
      // Remove comment from list
      comments = comments.filter(c => c.id !== commentId);
      
      // Update comment count on the post
      const postIndex = posts.findIndex(p => p.id === commentingPostId);
      if (postIndex !== -1) {
        posts[postIndex].commentsCount = Math.max(0, (posts[postIndex].commentsCount || 0) - 1);
        posts = [...posts]; // Trigger reactivity
      }
    } catch (err: any) {
      console.error('Error deleting comment:', err);
    }
  }

  // Toggle comments
  async function toggleComments(postId: string) {
    if (!showComments) {
      commentingPostId = postId;
      await loadComments(postId);
    }
    showComments = !showComments;
  }

  // Toggle share menu
  function toggleShareMenu() {
    showShareMenu = !showShareMenu;
  }

  // Handle region change
  async function handleRegionChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selectedRegion = select.value;
    await loadFeed();
  }

  // Handle search
  async function handleSearch() {
    await loadFeed();
  }

  // Toggle like
  async function handleToggleLike(postId: string) {
    try {
      const response = await toggleLike(postId);
      // Update local state based on backend response
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
        posts[postIndex].isLiked = response.data.isLiked;
        posts[postIndex].likesCount = response.data.isLiked 
          ? (posts[postIndex].likesCount || 0) + 1 
          : Math.max(0, (posts[postIndex].likesCount || 0) - 1);
        posts = [...posts]; // Trigger reactivity
      }
    } catch (err: any) {
      console.error('Like toggle error:', err);
    }
  }

  // Toggle save
  async function handleToggleSave(postId: string) {
    try {
      const response = await toggleSave(postId);
      // Update local state based on backend response
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
        posts[postIndex].isSaved = response.data.isSaved;
        posts[postIndex].savedCount = response.data.isSaved 
          ? (posts[postIndex].savedCount || 0) + 1 
          : Math.max(0, (posts[postIndex].savedCount || 0) - 1);
        posts = [...posts]; // Trigger reactivity
      }
    } catch (err: any) {
      console.error('Save toggle error:', err);
    }
  }

  // Handle share
  function handleShare(option: string) {
    console.log(`Sharing via ${option}`);
    showShareMenu = false;
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
    if (currentPostId) {
      const post = posts.find(p => p.id === currentPostId);
      if (post && post.media) {
        modalIndex = (modalIndex - 1 + post.media.length) % post.media.length;
      }
    }
  }

  function nextImage() {
    if (currentPostId) {
      const post = posts.find(p => p.id === currentPostId);
      if (post && post.media) {
        modalIndex = (modalIndex + 1) % post.media.length;
      }
    }
  }

  // Report functions
  function handleReport(postId: string) {
    currentPostId = postId;
    showReportModal = true;
    currentReportStep = 0;
    selectedReportReason = '';
    reportDetails = '';
  }

  function handleReportReasonSelect(reason: string) {
    selectedReportReason = reason;
    currentReportStep = 1;
  }

  function handleReportSubmit() {
    console.log('Submitting report:', {
      postId: currentPostId,
      reason: selectedReportReason,
      details: reportDetails
    });
    showReportModal = false;
    currentReportStep = 0;
    selectedReportReason = '';
    reportDetails = '';
  }

  function closeReportModal() {
    showReportModal = false;
    currentReportStep = 0;
    selectedReportReason = '';
    reportDetails = '';
  }

  // Mobile detection
  if (typeof window !== 'undefined') {
    isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      isMobile = window.innerWidth <= 768;
    });
  }

  // Scroll detection for search bar
  let isSearchBarVisible = true;



  // Load feed on mount
  onMount(() => {
    loadFeed();
    
    // Cleanup function
    return () => {
      // Cleanup if needed in the future
    };
  });
</script>

<ProtectedRoute>
  <div class="feed-layout">

    <!-- Search Bar (Fixed Position) -->
    <div class="search-bar" class:search-bar-hidden={!isSearchBarVisible}>

              <div class="search-input">
          <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search for product by text or image" 
            bind:value={searchQuery}
            on:keydown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button class="camera-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/>
              <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
          </button>
        </div>
      <div class="region-filter">
        <select 
          bind:value={selectedRegion} 
          on:change={handleRegionChange}
          class="region-select"
        >
          <option value="all">All Regions</option>
          {#each regions.filter((r): r is RegionGroup => 'group' in r) as group}
            <optgroup label={group.group}>
              {#each group.regions as region}
                <option value={region.id}>{region.name}</option>
              {/each}
            </optgroup>
          {/each}
        </select>
      </div>
      
      <!-- Toggle Button -->
      <button 
        class="search-toggle-btn"
        class:search-toggle-visible={isSearchBarVisible}
        on:click={() => isSearchBarVisible = !isSearchBarVisible}
        title={isSearchBarVisible ? "Hide Search Bar" : "Show Search Bar"}
        aria-label={isSearchBarVisible ? "Hide Search Bar" : "Show Search Bar"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          {#if isSearchBarVisible}
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          {:else}
            <path d="M12 5v14"/>
            <path d="M5 12h14"/>
          {/if}
        </svg>
      </button>

      <!-- Create Post Button -->
      <button 
        class="create-post-btn"
        on:click={() => showAddFeedModal = true}
        title="Create New Post"
        aria-label="Create New Post"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14"/>
          <path d="M5 12h14"/>
        </svg>
      </button>
    </div>

    <!-- Floating Search Button (appears when search bar is hidden) -->
    {#if !isSearchBarVisible}
      <button 
        class="floating-search-btn" 
        on:click={() => isSearchBarVisible = true}
        title="Show Search Bar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </button>
    {/if}

    <!-- Main Content -->
    <main class="main-content">
      <div class="feed-posts">
      {#if isLoading}
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading feed...</p>
        </div>
      {:else if error}
        <div class="error-state">
          <p>{error}</p>
          <button on:click={loadFeed}>Try Again</button>
        </div>
      {:else if posts.length === 0}
        <div class="empty-state">
          <p>No posts found. Be the first to share something!</p>
        </div>
      {:else}
        {#each posts as post}
          <article class="post">
                     <div class="post-header">
             <div class="post-author">
               <img src={post.user?.profilePicture || '/test.jpg.jpg'} alt={post.user?.fullName || 'User'} class="author-avatar" />
               <div class="author-info">
                 <h3>{post.user?.fullName || 'Unknown User'}</h3>
                 <span class="timestamp">{new Date(post.createdAt).toLocaleDateString()}</span>
               </div>
             </div>
            <div class="post-actions">
              <button class="follow-btn">Follow</button>
              <button class="message-btn">Message Me</button>
              <div class="post-menu">
                <button class="menu-btn" on:click={() => handleReport(post.id)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Report Post
                </button>
              </div>
            </div>
          </div>

                     {#if post.media && post.media.length > 0}
             {#if isMobile}
               <div class="image-gallery-mobile">
                 <div class="mobile-row">
                   <div class="featured-image" on:click={() => openModal(0)}>
                     <img src={post.media[0].mediaUrl} alt="Featured product image" />
               </div>
                   {#if post.media.length > 1}
                     <div class="featured-image second" on:click={() => openModal(1)}>
                       <img src={post.media[1].mediaUrl} alt="Second product image" />
                       {#if post.media.length > 2}
                         <div class="more-overlay">+{post.media.length - 2}</div>
                       {/if}
               </div>
                   {/if}
               </div>
               </div>
             {:else}
               <div class="image-gallery-modern">
                 <div class="featured-image" on:click={() => openModal(0)}>
                   <img src={post.media[0].mediaUrl} alt="Featured product image" />
             </div>
                 <div class="thumbnails">
                   {#each post.media.slice(1, 3) as image, i}
                     <div class="thumbnail-item" on:click={() => openModal(i+1)}>
                       <img src={image.mediaUrl} alt={`Product thumbnail ${i + 2}`} />
                 </div>
               {/each}
                   {#if post.media.length > 3}
                     <div class="thumbnail-item overlay-item" on:click={() => openModal(2)}>
                       <img src={post.media[2].mediaUrl} alt="Product thumbnail 3" />
                       <div class="more-overlay">+{post.media.length - 3}</div>
             </div>
                   {/if}
                 </div>
               </div>
             {/if}
           {/if}

                         {#if isModalOpen && post.media && post.media.length > 0}
               <div class="modal-backdrop" on:click={closeModal}></div>
               <div class="modal">
                 <button class="modal-close" on:click={closeModal}>&times;</button>
                 <button class="modal-nav left" on:click={prevImage}>&lt;</button>
                 <img class="modal-img" src={post.media[modalIndex].mediaUrl} alt="Zoomed image" />
                 <button class="modal-nav right" on:click={nextImage}>&gt;</button>
                 <div class="modal-thumbs">
                   {#each post.media as img, idx}
                     <img src={img.mediaUrl} alt={`Thumb ${idx+1}`} class:active-thumb={idx === modalIndex} on:click={() => modalIndex = idx} />
                   {/each}
                 </div>
               </div>
             {/if}

                         <p class="post-description">{post.content}</p>
             {#if post.location}
               <div class="post-location">
                 <svg class="location-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                 <span class="location-text">{post.location}</span>
               </div>
             {/if}

             <div class="post-engagement">
               <button class="engage-btn" on:click={() => handleToggleLike(post.id)}>
                 <svg class="icon" class:liked={post.isLiked} viewBox="0 0 24 24">
                   <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                 </svg>
                 {post.likesCount || 0} Likes
               </button>
               <button class="engage-btn" on:click={() => toggleComments(post.id)}>
                 <svg class="icon" viewBox="0 0 24 24">
                   <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
                 </svg>
                 {post.commentsCount || 0} Comments
               </button>
                             <button class="engage-btn" on:click={() => handleToggleSave(post.id)}>
                 <svg class="icon" class:saved={post.isSaved} viewBox="0 0 24 24">
                   {#if post.isSaved}
                     <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                   {:else}
                     <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/>
                   {/if}
                 </svg>
                                  {post.savedCount || 0} Saved
               </button>
               <button class="engage-btn" on:click={() => toggleShareMenu()}>
                 <svg class="icon" viewBox="0 0 24 24">
                   <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                 </svg>
                 {post.sharesCount || 0} Shares
               </button>
               {#if showShareMenu}
                <div class="share-menu">
                  {#each shareOptions as option}
                    <button class="share-option" on:click={() => handleShare(option.name)}>
                      <svg class="share-icon" viewBox="0 0 24 24">
                        {#if option.icon === 'link'}
                          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                        {:else if option.icon === 'whatsapp'}
                          <path d="M16.75 13.96c.25.13.41.2.46.3.06.11.04.61-.21 1.18-.2.56-1.24 1.1-1.7 1.12-.46.02-.47.36-2.96-.73-2.49-1.09-3.99-3.75-4.11-3.92-.12-.17-.96-1.38-.92-2.61.05-1.22.69-1.8.95-2.04.24-.26.51-.29.68-.26h.47c.15 0 .36-.06.55.45l.69 1.87c.06.13.1.28.01.44l-.27.41-.39.42c-.12.12-.12.78.28 1.32.4.54.89.95 1.17 1.02.28.08.47.04.64-.02l1.97-.92M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10c-1.97 0-3.8-.57-5.35-1.55L2 22l1.55-4.65A9.969 9.969 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8c0 1.72.54 3.31 1.46 4.61L4.5 19.5l2.89-.96A7.95 7.95 0 0 0 12 20a8 8 0 0 0 8-8 8 8 0 0 0-8-8z"/>
                        {:else if option.icon === 'facebook'}
                          <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
                        {:else if option.icon === 'twitter'}
                          <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                        {:else if option.icon === 'email'}
                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        {/if}
                      </svg>
                      {option.name}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>

            {#if showComments}
              <div class="comments-section">
                <div class="comments-list">
                  {#if isLoadingComments}
                    <div class="loading-comments">Loading comments...</div>
                  {:else if comments.length === 0}
                    <p class="no-comments">No comments yet. Be the first to comment!</p>
                  {:else}
                    {#each comments as comment}
                      <div class="comment">
                        <img 
                          src={comment.user.profilePicture || "/test.jpg.jpg"} 
                          alt={comment.user.fullName} 
                          class="comment-avatar" 
                        />
                        <div class="comment-content">
                          <div class="comment-header">
                            <span class="comment-author">{comment.user.fullName}</span>
                            <span class="comment-timestamp">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p class="comment-text">{comment.content}</p>
                          <button 
                            class="delete-comment-btn" 
                            on:click={() => handleDeleteComment(comment.id)}
                            title="Delete comment"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0h10"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    {/each}
                  {/if}
                </div>
                <div class="comment-input">
                  <img src="/test.jpg.jpg" alt="Your avatar" class="comment-avatar" />
                  <input 
                    type="text" 
                    placeholder="Write a comment..." 
                    bind:value={commentText}
                    on:keydown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                  />
                  <button class="send-btn" on:click={handleCommentSubmit}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            {/if}
           </article>
         {/each}
       {/if}
     </div>
   </main>
 </div>

  {#if showReportModal}
    <div class="modal-backdrop" on:click={closeReportModal}></div>
    <div class="report-modal">
      <button class="modal-close" on:click={closeReportModal}>&times;</button>
      <div class="report-content">
        {#if currentReportStep === 0}
          <h3>Why are you reporting this post?</h3>
          <div class="report-options">
            {#each reportQuestions as reason}
              <button 
                class="report-option" 
                on:click={() => handleReportReasonSelect(reason.id)}
              >
                <div class="report-option-content">
                  <h4>{reason.question}</h4>
                  <p>{reason.description}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            {/each}
          </div>
        {:else}
          <h3>Additional Details</h3>
          <p class="report-subtitle">Please provide more information about your report</p>
          <textarea 
            bind:value={reportDetails}
            placeholder="Describe the issue in detail..."
            rows="4"
          ></textarea>
          <div class="report-actions">
            <button class="cancel-btn" on:click={closeReportModal}>Cancel</button>
            <button 
              class="submit-btn" 
              on:click={handleReportSubmit}
              disabled={!reportDetails.trim()}
            >
              Submit Report
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <style>
    .feed-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: 100vh;
      background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    }

    @media (max-width: 768px) {
      .feed-layout {
        display: block;
      }

      .main-content {
        padding: 6rem 1rem 1rem; /* Adjust for mobile search bar */
        width: 100%;
        margin-left: 0;
        position: relative;
      }

      .feed-posts {
        padding: 0;
      }

      .post {
        border-radius: 0;
        margin-bottom: 1rem;
        padding: 1rem;
      }

      .search-bar {
      margin: 0;
        padding: 0.75rem;
      }

      .product-info {
        grid-template-columns: 1fr;
      gap: 0.75rem;
      }
    }

    /* Main Content Styles */
    .main-content {
      padding: 8rem 4rem 2rem; /* Add top padding for fixed search bar */
      max-width: 100%;
      width: calc(100vw - 280px);
      margin-left: 280px;
      height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      position: fixed;
      top: 0;
      right: 0;
      background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
      box-sizing: border-box;
    }

    .feed-posts {
      max-width: 800px;
      margin: 0 auto;
      padding-top: 1rem;
      width: 100%;
      box-sizing: border-box;
    }

    .search-bar {
      position: fixed;
      top: 80px; /* Add space for the nav bar */
      left: 280px; /* Align with main content */
      right: 0;
      background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
      padding: 1.5rem 4rem;
      z-index: 100; /* Increase z-index to be above nav */
      max-width: 800px;
      margin: 0 auto;
      width: calc(100vw - 280px);
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin-top: 0;
      opacity: 1;
      box-sizing: border-box;

    }

    .search-bar.search-bar-hidden {
      margin-top: -100px;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }

    /* Search Toggle Button */
    .search-toggle-btn {
      position: fixed;
      top: 100px; /* Position below the search bar */
      right: 2rem;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border: none;
      color: white;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 101;
      opacity: 0;
      transform: scale(0.8);
      pointer-events: none;
    }

    .search-toggle-btn.search-toggle-visible:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
    }

    .search-toggle-btn.search-toggle-visible:active {
      transform: scale(0.95);
    }

    .search-toggle-btn svg {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      stroke-width: 2.5;
    }

    /* Toggle button visibility states */
    .search-toggle-btn.search-toggle-visible {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }

    .floating-search-btn {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border: none;
      color: white;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: float-in 0.3s ease-out;
    }

    .floating-search-btn:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
    }

    .floating-search-btn:active {
      transform: translateY(0) scale(0.95);
    }

    .floating-search-btn svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    @keyframes float-in {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.8);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (max-width: 768px) {
      .search-bar {
        top: 60px; /* Adjust for mobile nav height */
        left: 0;
        width: 100vw;
        flex-direction: column;
        padding: 1rem;
        margin: 0;
        gap: 0.75rem;
      }

      .search-toggle-btn {
        top: 80px; /* Position below mobile search bar */
        right: 1rem;
        width: 36px;
        height: 36px;
      }

      .search-toggle-btn svg {
        width: 16px;
        height: 16px;
      }

      .floating-search-btn {
        bottom: 1.5rem;
        right: 1.5rem;
        width: 48px;
        height: 48px;
      }

      .floating-search-btn svg {
        width: 1.25rem;
        height: 1.25rem;
      }
    }

    @media (max-width: 480px) {
      .search-bar {
        top: 50px; /* Further adjust for smaller mobile nav */
        margin: 0;
      }

      .search-toggle-btn {
        top: 70px; /* Position below smaller mobile search bar */
        right: 0.75rem;
        width: 32px;
        height: 32px;
      }

      .search-toggle-btn svg {
        width: 14px;
        height: 14px;
      }

      /* Extra small mobile styles for Create Post button */
      .create-post-btn {
        top: 120px;
        right: 0.75rem;
        width: 44px;
        height: 44px;
      }

      .create-post-btn svg {
        width: 18px;
        height: 18px;
      }
    }

    .search-input {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
    }

    .search-input input {
      width: 100%;
      padding: 0.75rem 3rem;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      font-size: 0.95rem;
      background-color: #fff;
      color: #111;
      transition: all 0.2s ease;
    }

    .search-input input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
    }

    .search-input input::placeholder {
      color: #a1a1aa;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      width: 1.25rem;
      height: 1.25rem;
      color: #111;
    }

    .camera-btn {
      position: absolute;
      right: 1rem;
      background: none;
      border: none;
      color: #111;
      cursor: pointer;
      padding: 0.25rem;
      transition: color 0.2s ease;
    }

    .camera-btn:hover {
      color: #2563eb;
    }

    .camera-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .region-filter {
      position: relative;
      min-width: 160px;
    }

    .region-select {
      width: 100%;
      padding: 0.75rem 2.5rem 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      font-size: 0.95rem;
      background-color: #fff;
      color: #111;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 1.25rem;
      transition: all 0.2s ease;
    }

    .region-select optgroup {
      font-weight: 600;
      color: #64748b;
      background-color: #f8fafc;
    }

    .region-select option {
      font-weight: normal;
      color: #111;
      padding: 0.5rem;
    }

    .region-select option[value$="-all"] {
      font-weight: 600;
      color: #2563eb;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 0.25rem;
    }

    .region-select option:checked {
      background: linear-gradient(135deg, #0EA5E9, #7C3AED);
      color: white;
    }

    .region-select:hover {
      border-color: #cbd5e1;
    }

    .region-select:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
    }

    @media (max-width: 768px) {
      .search-bar {
        flex-direction: column;
        padding: 1rem;
        margin: 3rem auto 1rem;
        gap: 0.75rem;
      }

      .region-filter {
        width: 100%;
      }

      .region-select {
        padding: 0.625rem 2.5rem 0.625rem 1rem;
        font-size: 0.875rem;
      }
    }

    @media (max-width: 380px) {
      .search-bar {
        padding: 0.75rem;
        margin: 0.75rem auto;
      }

      .region-select {
        padding: 0.5rem 2.25rem 0.5rem 0.875rem;
        font-size: 0.8125rem;
      }
    }

    /* Modern Post Card Styles */
    .post {
      background: #fff;
      border-radius: 1.5rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      color: #111;
    }

    .post:hover {
      background: #f7f7fa;
      transform: translateY(-2px);
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
      border: 2px solid #e2e8f0;
      box-shadow: 0 0 0 2px rgba(37,99,235,0.08);
    }

    .author-info h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #111;
      font-weight: 600;
    }

    .timestamp {
      font-size: 0.875rem;
      color: #64748b;
    }

    .post-actions {
      display: flex;
      gap: 0.75rem;
    }

    .follow-btn, .message-btn {
      padding: 0.5rem 1rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #fff;
    }

    .follow-btn {
      background: none;
      border: 1px solid #2563eb;
      color: #2563eb;
    }

    .follow-btn:hover {
      background: rgba(37, 99, 235, 0.08);
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

    .image-gallery-modern {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .featured-image {
      flex: 2;
      border-radius: 1rem;
      overflow: hidden;
      aspect-ratio: 16/10;
      box-shadow: 0 2px 8px rgba(37,99,235,0.07);
      position: relative;
    }
    .featured-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
      border-radius: 1rem;
    }
    .featured-image:hover img {
      transform: scale(1.04);
    }
    .thumbnails {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      justify-content: stretch;
    }
    .thumbnail-item {
      position: relative;
      border-radius: 0.75rem;
      overflow: hidden;
      aspect-ratio: 16/10;
      box-shadow: 0 1px 4px rgba(37,99,235,0.05);
      cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .thumbnail-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 0.75rem;
      transition: transform 0.2s;
    }
    .thumbnail-item:hover img {
      transform: scale(1.06);
    }
    .more-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(30, 41, 59, 0.65);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 600;
      border-radius: 0.75rem;
      letter-spacing: 0.03em;
    }
    @media (max-width: 768px) {
      .image-gallery-modern {
        flex-direction: column;
        gap: 0.5rem;
      }
      .featured-image, .thumbnail-item {
        aspect-ratio: 16/10;
      }
      .thumbnails {
        flex-direction: row;
        gap: 0.5rem;
      }
    }

    .post-description {
      color: #222;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }

    .post-location {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #222;
      font-size: 0.95rem;
      margin-bottom: 1.25rem;
      margin-top: -0.5rem;
      padding-left: 2px;
    }
    .location-icon {
      width: 1.15rem;
      height: 1.15rem;
      color: #111;
      fill: #111;
      stroke: #111;
      flex-shrink: 0;
    }
    .location-text {
      font-weight: 500;
      color: #222;
      letter-spacing: 0.01em;
    }

    .post-engagement {
      display: flex;
      gap: 2rem;
      padding: 1rem 0;
      border-top: 1px solid #e2e8f0;
      margin-bottom: 0;
      position: relative;
      flex-wrap: wrap;
    }

    .engage-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: #111;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.75rem;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .engage-btn:hover {
      background-color: #f7f7fa;
      color: #2563eb;
    }

    .engage-btn .icon {
      width: 1.25rem;
      height: 1.25rem;
      transition: transform 0.2s ease;
      color: #111;
      fill: #111;
      stroke: #111;
    }

    .engage-btn:hover .icon {
      transform: scale(1.1);
      color: #2563eb;
      fill: #2563eb;
      stroke: #2563eb;
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
        overflow-x: hidden;
      }

      .feed-posts,
      .search-bar {
        max-width: 100%;
        padding-left: 0;
        padding-right: 0;
      }
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 1rem;
      }

      .feed-posts {
        padding: 0;
      }

      .post {
        border-radius: 0;
        margin-bottom: 1rem;
        padding: 1rem;
      }
    }

    /* Remove product-info styles */
    .product-info, .info-row, .label, .value {
      display: none !important;
    }

    .overlay-item {
      position: relative;
      cursor: pointer;
    }
    .more-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(30, 41, 59, 0.65);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 600;
      border-radius: 0.75rem;
      letter-spacing: 0.03em;
      z-index: 2;
    }
    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(30,41,59,0.65);
      z-index: 1000;
    }
    .modal {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: #000;
      border-radius: 1.25rem;
      box-shadow: 0 8px 32px rgba(30,41,59,0.18);
      z-index: 1001;
      padding: 2rem 2.5rem 1.5rem 2.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 320px;
      max-width: 90vw;
      max-height: 90vh;
    }
    .modal-img {
      max-width: 60vw;
      max-height: 60vh;
      border-radius: 1rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 12px rgba(14,165,233,0.08);
      object-fit: contain;
      background: #000;
    }
    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1.5rem;
      background: none;
      border: none;
      font-size: 2rem;
      color: #64748B;
      cursor: pointer;
      z-index: 2;
    }
    .modal-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,0.8);
      border: none;
      font-size: 2rem;
      color: #0EA5E9;
      cursor: pointer;
      z-index: 2;
      padding: 0.25rem 0.75rem;
      border-radius: 0.75rem;
      transition: background 0.2s;
    }
    .modal-nav.left { left: 1rem; }
    .modal-nav.right { right: 1rem; }
    .modal-thumbs {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      overflow-x: auto;
      max-width: 80vw;
    }
    .modal-thumbs img {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 0.5rem;
      cursor: pointer;
      opacity: 0.7;
      border: 2px solid transparent;
      transition: border 0.2s, opacity 0.2s;
    }
    .modal-thumbs img.active-thumb {
      opacity: 1;
      border: 2px solid #0EA5E9;
    }
    @media (max-width: 768px) {
      .modal {
        padding: 0;
        min-width: 0;
        max-width: 100vw;
        max-height: 100vh;
        border-radius: 0;
        background: #000;
        box-shadow: none;
        justify-content: center;
      }
      .modal-img {
        max-width: 100vw;
        max-height: 100vh;
        border-radius: 0;
        margin-bottom: 0;
        box-shadow: none;
        background: #000;
      }
      .modal-close {
        top: 0.5rem;
        right: 1rem;
        font-size: 2.2rem;
        color: #fff;
        background: rgba(30,41,59,0.5);
        border-radius: 50%;
        padding: 0.25rem 0.5rem;
      }
      .modal-thumbs {
        display: none;
      }
      .modal-nav {
        background: rgba(30,41,59,0.5);
        color: #fff;
        font-size: 2.2rem;
        border-radius: 50%;
        padding: 0.25rem 0.7rem;
      }
    }

    .image-gallery-mobile {
      margin-bottom: 1.5rem;
    }
    .image-gallery-mobile .mobile-row {
      display: flex;
      gap: 0.5rem;
    }
    .image-gallery-mobile .featured-image {
      position: relative;
      border-radius: 1rem;
      overflow: hidden;
      aspect-ratio: 16/10;
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.07);
      cursor: pointer;
      flex: 1;
    }
    .image-gallery-mobile .featured-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 1rem;
      transition: transform 0.3s ease;
    }
    .image-gallery-mobile .featured-image:hover img {
      transform: scale(1.04);
    }
    .image-gallery-mobile .featured-image.second {
      position: relative;
    }
    .image-gallery-mobile .more-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(30, 41, 59, 0.65);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 600;
      border-radius: 1rem;
      letter-spacing: 0.03em;
      z-index: 2;
    }

    .single-image-container {
      margin-bottom: 1.5rem;
    }

    .single-image-container .featured-image {
      width: 100%;
      border-radius: 1rem;
      overflow: hidden;
      aspect-ratio: 16/10;
      box-shadow: 0 2px 8px rgba(37,99,235,0.07);
      cursor: pointer;
    }

    .single-image-container .featured-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .single-image-container .featured-image:hover img {
      transform: scale(1.04);
    }

    @media (max-width: 768px) {
      .single-image-container .featured-image {
        aspect-ratio: 16/10;
      }
    }

    @media (max-width: 768px) {
      .post-author {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .author-avatar {
        width: 40px;
        height: 40px;
      }

      .author-info h3 {
        font-size: 0.95rem;
      }

      .timestamp {
        font-size: 0.8rem;
      }

      .post-header {
        align-items: flex-start;
      }

      .post-actions {
        margin-top: 0.5rem;
      }
    }

    .comments-section {
      margin-top: 1rem;
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .comment {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .comment-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .comment-content {
      flex: 1;
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .comment-author {
      font-weight: 600;
      color: #111;
    }

    .comment-timestamp {
      font-size: 0.8rem;
      color: #666;
    }

    .comment-text {
      margin: 0;
      color: #333;
      line-height: 1.4;
    }

    .comment-input {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 9999px;
    }

    .comment-input input {
      flex: 1;
      border: none;
      background: none;
      padding: 0.5rem;
      font-size: 0.95rem;
      color: #111;
    }

    .comment-input input:focus {
      outline: none;
    }

    .send-btn {
      background: none;
      border: none;
      color: #3b82f6;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }

    .send-btn:hover {
      background-color: #e0e7ff;
    }

    .send-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .share-menu {
      position: absolute;
      bottom: 100%;
      right: 0;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      z-index: 50;
      min-width: 200px;
      max-width: calc(100% - 1rem);
      transform: translateX(0);
    }

    .share-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      background: none;
      color: #111;
      font-size: 0.95rem;
      cursor: pointer;
      border-radius: 0.5rem;
      transition: background-color 0.2s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
      .share-menu {
        right: -0.5rem;
        max-width: calc(100% - 0.5rem);
      }

      .share-option {
        padding: 0.625rem 0.875rem;
        font-size: 0.875rem;
      }
    }

    @media (max-width: 480px) {
      .post-engagement {
        gap: 0.75rem;
        justify-content: space-between;
      }

      .engage-btn {
        font-size: 0.75rem;
        padding: 0.25rem;
      }

      .engage-btn .icon {
        width: 1.125rem;
        height: 1.125rem;
      }
    }

    .share-option:hover {
      background-color: #f3f4f6;
    }

    .share-icon {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .post-engagement {
      position: relative;
    }

       .icon.liked {
     color: #ef4444;
     fill: #ef4444;
     animation: likeAnimation 0.3s ease;
   }

   .icon.saved {
     color: #f59e0b;
     fill: #f59e0b;
   }

    @keyframes likeAnimation {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .post-menu {
      position: relative;
    }

    .menu-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .menu-btn:hover {
      background: #f1f5f9;
      color: #111;
    }

    .menu-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .menu-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 0.5rem;
      margin-top: 0.5rem;
      z-index: 50;
      min-width: 160px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      background: none;
      color: #ef4444;
      font-size: 0.95rem;
      cursor: pointer;
      border-radius: 0.5rem;
      transition: background-color 0.2s;
    }

    .menu-item:hover {
      background-color: #fee2e2;
    }

    .menu-item svg {
      width: 1.25rem;
      height: 1.25rem;
      stroke: currentColor;
    }

    @media (max-width: 768px) {
      .menu-btn {
        padding: 0.375rem;
      }

      .menu-btn svg {
        width: 1.125rem;
        height: 1.125rem;
      }

      .menu-dropdown {
        right: -0.5rem;
      }

      .menu-item {
        padding: 0.625rem 0.875rem;
        font-size: 0.875rem;
      }

      .menu-item svg {
        width: 1.125rem;
        height: 1.125rem;
      }
    }

    .report-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 1.25rem;
      box-shadow: 0 8px 32px rgba(30,41,59,0.18);
      z-index: 1001;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .report-content {
      padding: 2rem;
    }

    .report-content h3 {
      margin: 0 0 1.5rem;
      font-size: 1.25rem;
      color: #111;
    }

    .report-subtitle {
      color: #64748b;
      margin: -1rem 0 1rem;
      font-size: 0.95rem;
    }

    .report-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .report-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      background: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .report-option:hover {
      background-color: #f8fafc;
      border-color: #cbd5e1;
    }

    .report-option-content {
      text-align: left;
    }

    .report-option-content h4 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      color: #111;
    }

    .report-option-content p {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .report-option svg {
      width: 1.25rem;
      height: 1.25rem;
      color: #64748b;
    }

    textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      font-size: 0.95rem;
      resize: vertical;
      min-height: 100px;
      margin-bottom: 1.5rem;
    }

    textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
    }

    .report-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .cancel-btn, .submit-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cancel-btn {
      background: none;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }

    .cancel-btn:hover {
      background-color: #f8fafc;
      border-color: #cbd5e1;
    }

    .submit-btn {
      background: #ef4444;
      border: none;
      color: white;
    }

    .submit-btn:hover:not(:disabled) {
      background: #dc2626;
    }

    .submit-btn:disabled {
      background: #fecaca;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .report-modal {
        width: 100%;
        max-width: none;
        height: 100vh;
        max-height: none;
        border-radius: 0;
      }

      .report-content {
        padding: 1.5rem;
      }

      .report-content h3 {
        font-size: 1.125rem;
      }

      .report-option {
        padding: 0.875rem;
      }

      .report-option-content h4 {
        font-size: 0.95rem;
      }

      .report-option-content p {
        font-size: 0.8125rem;
      }

      .cancel-btn, .submit-btn {
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
      }

      /* Mobile styles for Create Post button */
      .create-post-btn {
        top: 140px;
        right: 1rem;
        width: 48px;
        height: 48px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      }

      .create-post-btn svg {
        width: 20px;
        height: 20px;
      }
    }

   /* Loading, Error, and Empty States */
   .loading-state, .error-state, .empty-state {
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
     padding: 3rem 1rem;
     text-align: center;
   }

   .loading-spinner {
     width: 40px;
     height: 40px;
     border: 3px solid #e2e8f0;
     border-top: 3px solid #2563eb;
     border-radius: 50%;
     animation: spin 1s linear infinite;
     margin-bottom: 1rem;
   }

   @keyframes spin {
     0% { transform: rotate(0deg); }
     100% { transform: rotate(360deg); }
   }

   .error-state p {
     color: #ef4444;
     margin-bottom: 1rem;
   }

   .error-state button {
     background: #2563eb;
     color: white;
     border: none;
     padding: 0.75rem 1.5rem;
     border-radius: 0.5rem;
     cursor: pointer;
     font-weight: 500;
   }

   .error-state button:hover {
     background: #1d4ed8;
   }

   .empty-state p {
     color: #64748b;
     font-size: 1.1rem;
   }

       .no-comments {
      color: #64748b;
      font-style: italic;
      text-align: center;
      padding: 1rem;
    }

    .loading-comments {
      text-align: center;
      color: #6b7280;
      padding: 2rem;
    }

    .delete-comment-btn {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .comment:hover .delete-comment-btn {
      opacity: 1;
    }

    .delete-comment-btn:hover {
      background: #fef2f2;
    }

    /* Create Post Button */
    .create-post-btn {
      position: fixed;
      top: 160px; /* Position below the search toggle button */
      right: 2rem;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      color: white;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 101;
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }

    .create-post-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
      background: linear-gradient(135deg, #059669, #047857);
    }

    .create-post-btn:active {
      transform: scale(0.95);
    }

    .create-post-btn svg {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      stroke-width: 2.5;
    }

    /* Toggle button visibility states */
  </style>

  <!-- AddFeed Component Modal -->
  <AddFeed
    isOpen={showAddFeedModal}
    onClose={() => showAddFeedModal = false}
    on:submit={(event) => {
      const { post, action } = event.detail;
      if (action === 'created') {
        // Add new post to the beginning of the feed
        posts = [post, ...posts];
      }
      showAddFeedModal = false;
    }}
  />
</ProtectedRoute> 