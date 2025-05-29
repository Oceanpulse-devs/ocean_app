<script lang="ts">
  import { isSidebarOpen, closeSidebar } from '$lib/stores/sidebarStore';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';

  export let userStats = {
    posts: 46,
    followers: '2.8K',
    following: 200
  };

  // Close sidebar after navigation on mobile
  if (browser) {
    afterNavigate(() => {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  }
</script>

{#if $isSidebarOpen}
  <div 
    class="sidebar-overlay"
    on:click={closeSidebar}
    transition:slide={{duration: 200, easing: quintOut}}
  ></div>
{/if}

<aside class="sidebar" class:open={$isSidebarOpen}>
  <div class="ocean-logo">
    <img src="/logoopacity.png" alt="Ocean" />
    <h1 class="ocean-title">OCEAN</h1>
  </div>

  <div class="profile-section">
    <div class="avatar-container">
      <img src="/test.jpg.jpg" alt="Abbey Lincoln" class="avatar" />
    </div>
    <a href="/profile" class="profile-link">
    <h2 class="profile-name">Abbey Lincoln</h2>
    <p class="profile-username">@abbeylin</p>
    </a>
    
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
    <a href="/distress" class="nav-item">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
      </svg>
      Distress Sale
    </a>
    <a href="/auctions" class="nav-item">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.31-.94-2.31-1.68 0-.84.79-1.43 2-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2 1.39-1.53 0-2.13-.6-2.21-1.64H8.24c.09 1.7 1.37 2.66 2.87 2.97V19h2.25v-1.69c1.52-.29 2.72-1.16 2.72-2.77-.01-2.2-1.9-2.96-3.77-3.4z"/>
      </svg>
      Auctions
    </a>
    <a href="/saved" class="nav-item">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/>
      </svg>
      Saved
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
</aside>

<style>
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    background: #fff;
    box-shadow: 2px 0 16px 0 rgba(0,0,0,0.08);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    transition: left 0.3s cubic-bezier(0.4,0,0.2,1);
    overflow-y: auto;
  }

  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9998;
    display: none;
  }

  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
      will-change: transform;
      height: 100%;
      padding-bottom: 80px;
      -webkit-overflow-scrolling: touch;
      width: 100vw;
      left: 0;
    }

    .sidebar.open {
      transform: translateX(0);
      width: 100vw;
      left: 0;
      position: fixed;
      top: 0;
      height: 100vh;
    }

    .sidebar-overlay {
      display: block;
    }

    .sidebar-nav {
      padding-bottom: 2rem;
    }
  }

  /* Custom Scrollbar Styling */
  .sidebar::-webkit-scrollbar {
    width: 8px;
  }

  .sidebar::-webkit-scrollbar-track {
    background: #f7f7fa;
  }

  .sidebar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 8px;
  }

  .sidebar::-webkit-scrollbar-thumb:hover {
    background-color: #cbd5e1;
  }

  /* Firefox */
  .sidebar {
    scrollbar-width: thin;
    scrollbar-color: #e2e8f0 #f7f7fa;
  }

  .ocean-logo {
    padding: 2rem 1.5rem 1.25rem 1.5rem;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #fff;
    color: #111;
    border-bottom: 1px solid #e2e8f0;
  }

  .ocean-logo img {
    width: 40px;
    height: 40px;
    opacity: 0.9;
    transition: opacity 0.2s ease;
  }

  .ocean-title {
    font-size: 1.7rem;
    font-weight: 800;
    color: #111;
    margin: 0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-family: 'Montserrat', 'Inter', Arial, sans-serif;
  }

  .ocean-logo:hover img {
    opacity: 1;
  }

  .profile-section {
    padding: 1.25rem 1rem 1.25rem 1rem;
    background: #f7f7fa;
    border-radius: 1.25rem;
    margin: 1.5rem 1.5rem 1.25rem 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .avatar-container {
    width: 120px;
    height: 120px;
    margin: 0 auto 1rem;
    position: relative;
    overflow: hidden;
  }

  .avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .profile-link {
    text-decoration: none;
    color: #111;
    text-align: center;
    margin-bottom: 1rem;
  }

  .profile-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: #111;
  }

  .profile-username {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0.25rem 0 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    width: 100%;
    padding: 0.5rem;
  }

  .stat-item {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 1.125rem;
    font-weight: 600;
    color: #111;
  }

  .stat-label {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  .sidebar-nav {
    padding: 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: #111;
    text-decoration: none;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .nav-item:hover {
    background: #f7f7fa;
    color: #2563eb;
  }

  .nav-item.active {
    background: #f7f7fa;
    color: #2563eb;
  }

  .icon {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }

  .logout-btn {
    margin-top: auto;
    background: none;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    color: #ef4444;
  }

  .logout-btn:hover {
    background: #fef2f2;
    color: #dc2626;
  }
</style> 