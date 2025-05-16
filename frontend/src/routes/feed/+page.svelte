<script lang="ts">
  

  let userStats = {
    posts: 46,
    followers: '2.8K',
    following: 200
  };

  let feedPost = {
    author: {
      name: 'MBT CEO',
      avatar: '/test.jpg.jpg',
      timestamp: '1st February, 03:PM'
    },
    product: {
      name: 'Nike Sneakers',
      location: 'Ikeja',
      price: '$120',
      brand: 'Nike'
    },
    images: [
      '/wrigglyLine2.png',
      '/test.jpg.jpg',
      '/wrigglyLine2.png',
      '/test.jpg.jpg',
      '/wrigglyLine2.png',
      '/test.jpg.jpg',
      '/wrigglyLine2.png'
    ],
    description: 'Step up your style with top-quality sneakers! 🔥 From classic kicks to the latest trends, I\'ve got the perfect pair for you. Comfort, style, and affordability—all in one place!',
    engagement: {
      comments: 25,
      likes: '120K',
      shares: 200
    }
  };

  let singlePhotoPost = {
    author: {
      name: 'Fashion Designer',
      avatar: '/test.jpg.jpg',
      timestamp: '2nd February, 10:AM'
    },
    product: {
      name: 'Designer Watch',
      location: 'Victoria Island',
      price: '$350',
      brand: 'Rolex'
    },
    images: [
      '/test.jpg.jpg'
    ],
    description: 'Luxury timepiece in pristine condition. Perfect for special occasions and professional settings. Limited edition piece with authentic certification.',
    engagement: {
      comments: 12,
      likes: '45K',
      shares: 89
    }
  };

  // Add these variables at the top of the script section
  let showComments = false;
  let commentText = '';
  let comments = [
    {
      author: 'John Doe',
      avatar: '/test.jpg.jpg',
      text: 'This looks amazing! How much is it?',
      timestamp: '2 hours ago'
    },
    {
      author: 'Jane Smith',
      avatar: '/wrigglyLine2.png',
      text: 'Great quality! Is it still available?',
      timestamp: '1 hour ago'
    }
  ];

  let showShareMenu = false;
  let shareOptions = [
    { name: 'Copy Link', icon: 'link' },
    { name: 'WhatsApp', icon: 'whatsapp' },
    { name: 'Facebook', icon: 'facebook' },
    { name: 'Twitter', icon: 'twitter' },
    { name: 'Email', icon: 'email' }
  ];

  let isLikedFirst = false;
  let isLikedSecond = false;
  let likeCountFirst = feedPost.engagement.likes;
  let likeCountSecond = singlePhotoPost.engagement.likes;

  let isModalOpenFirst = false;
  let isModalOpenSecond = false;
  let modalIndexFirst = 0;
  let modalIndexSecond = 0;

  // Add these variables at the top of the script section
  let showShareMenuFirst = false;
  let showShareMenuSecond = false;
  let showCommentsFirst = false;
  let showCommentsSecond = false;

  function toggleComments() {
    showComments = !showComments;
  }

  function handleCommentSubmit() {
    if (commentText.trim()) {
      comments = [
        {
          author: 'You',
          avatar: '/test.jpg.jpg',
          text: commentText,
          timestamp: 'Just now'
        },
        ...comments
      ];
      commentText = '';
    }
  }

  function toggleShareMenu() {
    showShareMenu = !showShareMenu;
  }

  function handleShare(option: string) {
    // Here you would implement the actual sharing functionality
    console.log(`Sharing via ${option}`);
    showShareMenu = false;
  }

  function openModalFirst(index: number) {
    modalIndexFirst = index;
    isModalOpenFirst = true;
  }

  function openModalSecond(index: number) {
    modalIndexSecond = index;
    isModalOpenSecond = true;
  }

  function closeModalFirst() {
    isModalOpenFirst = false;
  }

  function closeModalSecond() {
    isModalOpenSecond = false;
  }

  function prevImageFirst() {
    modalIndexFirst = (modalIndexFirst - 1 + feedPost.images.length) % feedPost.images.length;
  }

  function nextImageFirst() {
    modalIndexFirst = (modalIndexFirst + 1) % feedPost.images.length;
  }

  function prevImageSecond() {
    modalIndexSecond = (modalIndexSecond - 1 + singlePhotoPost.images.length) % singlePhotoPost.images.length;
  }

  function nextImageSecond() {
    modalIndexSecond = (modalIndexSecond + 1) % singlePhotoPost.images.length;
  }

  function toggleLikeFirst() {
    isLikedFirst = !isLikedFirst;
    if (isLikedFirst) {
      likeCountFirst = (parseInt(likeCountFirst) + 1).toString();
    } else {
      likeCountFirst = (parseInt(likeCountFirst) - 1).toString();
    }
  }

  function toggleLikeSecond() {
    isLikedSecond = !isLikedSecond;
    if (isLikedSecond) {
      likeCountSecond = (parseInt(likeCountSecond) + 1).toString();
    } else {
      likeCountSecond = (parseInt(likeCountSecond) - 1).toString();
    }
  }

  function toggleShareMenuFirst() {
    showShareMenuFirst = !showShareMenuFirst;
    showShareMenuSecond = false; // Close other share menu
  }

  function toggleShareMenuSecond() {
    showShareMenuSecond = !showShareMenuSecond;
    showShareMenuFirst = false; // Close other share menu
  }

  function toggleCommentsFirst() {
    showCommentsFirst = !showCommentsFirst;
    showCommentsSecond = false; // Close other comments
  }

  function toggleCommentsSecond() {
    showCommentsSecond = !showCommentsSecond;
    showCommentsFirst = false; // Close other comments
  }

  let isMobile = false;
  function checkMobile() {
    isMobile = window.innerWidth <= 768;
  }
  if (typeof window !== 'undefined') {
    checkMobile();
    window.addEventListener('resize', checkMobile);
  }
</script>

<div class="feed-layout">

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

        {#if isMobile}
          <div class="image-gallery-mobile">
            <div class="mobile-row">
              <div class="featured-image" on:click={() => openModalFirst(0)}>
                <img src={feedPost.images[0]} alt="Featured product image" />
          </div>
              {#if feedPost.images.length > 1}
                <div class="featured-image second" on:click={() => openModalFirst(1)}>
                  <img src={feedPost.images[1]} alt="Second product image" />
                  {#if feedPost.images.length > 2}
                    <div class="more-overlay">+{feedPost.images.length - 2}</div>
                  {/if}
          </div>
              {/if}
          </div>
          </div>
        {:else}
          <div class="image-gallery-modern">
            <div class="featured-image" on:click={() => openModalFirst(0)}>
              <img src={feedPost.images[0]} alt="Featured product image" />
        </div>
            <div class="thumbnails">
              {#each feedPost.images.slice(1, 3) as image, i}
                <div class="thumbnail-item" on:click={() => openModalFirst(i+1)}>
                  <img src={image} alt={`Product thumbnail ${i + 2}`} />
            </div>
          {/each}
              {#if feedPost.images.length > 3}
                <div class="thumbnail-item overlay-item" on:click={() => openModalFirst(2)}>
                  <img src={feedPost.images[2]} alt="Product thumbnail 3" />
                  <div class="more-overlay">+{feedPost.images.length - 3}</div>
        </div>
              {/if}
            </div>
          </div>
        {/if}

        {#if isModalOpenFirst}
          <div class="modal-backdrop" on:click={closeModalFirst}></div>
          <div class="modal">
            <button class="modal-close" on:click={closeModalFirst}>&times;</button>
            <button class="modal-nav left" on:click={prevImageFirst}>&lt;</button>
            <img class="modal-img" src={feedPost.images[modalIndexFirst]} alt="Zoomed image" />
            <button class="modal-nav right" on:click={nextImageFirst}>&gt;</button>
            <div class="modal-thumbs">
              {#each feedPost.images as img, idx}
                <img src={img} alt={`Thumb ${idx+1}`} class:active-thumb={idx === modalIndexFirst} on:click={() => modalIndexFirst = idx} />
              {/each}
            </div>
          </div>
        {/if}

        <p class="post-description">{feedPost.description}</p>
        <div class="post-location">
          <svg class="location-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span class="location-text">Lagos</span>
        </div>

        <div class="post-engagement">
          <button class="engage-btn" on:click={toggleCommentsFirst}>
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
            </svg>
            {feedPost.engagement.comments} Comments
          </button>
          <button class="engage-btn" on:click={toggleLikeFirst}>
            <svg class="icon" class:liked={isLikedFirst} viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {likeCountFirst} Likes
          </button>
          <button class="engage-btn" on:click={toggleShareMenuFirst}>
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
            {feedPost.engagement.shares} Shares
          </button>
          {#if showShareMenuFirst}
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

        {#if showCommentsFirst}
          <div class="comments-section">
            <div class="comments-list">
              {#each comments as comment}
                <div class="comment">
                  <img src={comment.avatar} alt={comment.author} class="comment-avatar" />
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{comment.author}</span>
                      <span class="comment-timestamp">{comment.timestamp}</span>
                    </div>
                    <p class="comment-text">{comment.text}</p>
                  </div>
                </div>
              {/each}
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

      <!-- Single Photo Post -->
      <article class="post">
        <div class="post-header">
          <div class="post-author">
            <img src={singlePhotoPost.author.avatar} alt={singlePhotoPost.author.name} class="author-avatar" />
            <div class="author-info">
              <h3>{singlePhotoPost.author.name}</h3>
              <span class="timestamp">{singlePhotoPost.author.timestamp}</span>
            </div>
          </div>
          <div class="post-actions">
            <button class="follow-btn">Follow</button>
            <button class="message-btn">Message Me</button>
          </div>
        </div>

        <div class="single-image-container">
          <div class="featured-image" on:click={() => openModalSecond(0)}>
            <img src={singlePhotoPost.images[0]} alt="Featured product image" />
          </div>
        </div>

        <p class="post-description">{singlePhotoPost.description}</p>
        <div class="post-location">
          <svg class="location-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span class="location-text">Victoria Island</span>
        </div>

        <div class="post-engagement">
          <button class="engage-btn" on:click={toggleCommentsSecond}>
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
            </svg>
            {singlePhotoPost.engagement.comments} Comments
          </button>
          <button class="engage-btn" on:click={toggleLikeSecond}>
            <svg class="icon" class:liked={isLikedSecond} viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {likeCountSecond} Likes
          </button>
          <button class="engage-btn" on:click={toggleShareMenuSecond}>
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
            {singlePhotoPost.engagement.shares} Shares
          </button>
          {#if showShareMenuSecond}
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

        {#if showCommentsSecond}
          <div class="comments-section">
            <div class="comments-list">
              {#each comments as comment}
                <div class="comment">
                  <img src={comment.avatar} alt={comment.author} class="comment-avatar" />
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{comment.author}</span>
                      <span class="comment-timestamp">{comment.timestamp}</span>
                    </div>
                    <p class="comment-text">{comment.text}</p>
                  </div>
                </div>
              {/each}
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
    </div>
  </main>
</div>

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
      padding: 0;
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
    padding: 2rem 4rem;
    max-width: 100%;
    width: calc(100vw - 280px);
    margin-left: 280px;
    height: 100vh;
    overflow-y: auto;
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
  }

  .search-bar {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #fff 80%, #f3f4f6 100%);
    padding: 1.5rem 0;
    z-index: 10;
    max-width: 800px;
    margin: 2rem auto 2rem;
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
    }

    .feed-posts,
    .search-bar {
      max-width: 100%;
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

  @keyframes likeAnimation {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
</style> 