<script lang="ts">
  export let userStats = {
    posts: 46,
    followers: '2.8K',
    following: 200
  };
</script>

<aside class="sidebar">
  <div class="profile-section">
    <div class="avatar-container">
      <img src="/avatars/abbey.jpg" alt="Abbey Lincoln" class="avatar" />
    </div>
    <h2 class="profile-name">Abbey Lincoln</h2>
    <p class="profile-username">@abbeylin</p>
    
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">{userStats.posts}</span>
        <span class="stat-label">Posts</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{userStats.followers}</span>
        <span class="stat-label">Followers</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{userStats.following}</span>
        <span class="stat-label">Following</span>
      </div>
    </div>
  </div>

  <nav class="sidebar-nav">
    <a href="/feed" class="nav-item">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
      </svg>
      Feed
    </a>
    <a href="/messages" class="nav-item">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
      Message
    </a>
    <a href="/products" class="nav-item">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-8-2h2v-4h4v-2h-4V7h-2v4H7v2h4z"/>
      </svg>
      Product
    </a>
    <a href="/profile" class="nav-item">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
      Profile
    </a>
    <a href="/settings" class="nav-item">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
      </svg>
      Settings
    </a>
    <button class="nav-item logout-btn">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
      </svg>
      Logout
    </button>
  </nav>

  <div class="ocean-logo">
    <img src="/logo.svg" alt="Ocean" />
  </div>
</aside>

<style>
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

  .logout-btn {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    margin-top: auto;
  }

  .logout-btn:hover {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .logout-btn:hover .icon {
    color: #ef4444;
  }

  @media (max-width: 1024px) {
    .sidebar {
      display: none;
    }
  }
</style> 