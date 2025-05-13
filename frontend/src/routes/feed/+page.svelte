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
      shares: 200,
      saved: 15
    }
  };

  // Modal state for image zoom
  let isModalOpen = false;
  let modalIndex = 0;
  function openModal(index: number) {
    modalIndex = index;
    isModalOpen = true;
  }
  function closeModal() {
    isModalOpen = false;
  }
  function prevImage() {
    modalIndex = (modalIndex - 1 + feedPost.images.length) % feedPost.images.length;
  }
  function nextImage() {
    modalIndex = (modalIndex + 1) % feedPost.images.length;
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
              <div class="featured-image" on:click={() => openModal(0)}>
                <img src={feedPost.images[0]} alt="Featured product image" />
              </div>
              {#if feedPost.images.length > 1}
                <div class="featured-image second" on:click={() => openModal(1)}>
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
            <div class="featured-image" on:click={() => openModal(0)}>
              <img src={feedPost.images[0]} alt="Featured product image" />
          </div>
            <div class="thumbnails">
              {#each feedPost.images.slice(1, 3) as image, i}
                <div class="thumbnail-item" on:click={() => openModal(i+1)}>
                  <img src={image} alt={`Product thumbnail ${i + 2}`} />
          </div>
              {/each}
              {#if feedPost.images.length > 3}
                <div class="thumbnail-item overlay-item" on:click={() => openModal(2)}>
                  <img src={feedPost.images[2]} alt="Product thumbnail 3" />
                  <div class="more-overlay">+{feedPost.images.length - 3}</div>
        </div>
              {/if}
            </div>
          </div>
        {/if}

        {#if isModalOpen}
          <div class="modal-backdrop" on:click={closeModal}></div>
          <div class="modal">
            <button class="modal-close" on:click={closeModal}>&times;</button>
            <button class="modal-nav left" on:click={prevImage}>&lt;</button>
            <img class="modal-img" src={feedPost.images[modalIndex]} alt="Zoomed image" />
            <button class="modal-nav right" on:click={nextImage}>&gt;</button>
            <div class="modal-thumbs">
              {#each feedPost.images as img, idx}
                <img src={img} alt={`Thumb ${idx+1}`} class:active-thumb={idx === modalIndex} on:click={() => modalIndex = idx} />
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
</style> 