<script>
  import { slide } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { toggleSidebar } from '$lib/stores/sidebarStore';
  
  export let activePage = "home";
  export let isLandingPage = false;
  export let isFullWidth = false;
  
  // Define navigation items with icons for mobile
  const navItems = [
    { 
      id: "notifications", 
      label: "Notifications", 
      href: "/notifications",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
      </svg>`
    },
    { 
      id: "messages", 
      label: "Messages", 
      href: "/messages",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>`
    }
  ];
  
  // Toggle mobile menu
  let isMenuOpen = false;
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
  
  // Landing page auth navigation
  function navigateToLogin() {
    goto('/login');
  }
  
  function navigateToSignup() {
    goto('/signup');
  }
</script>

<nav class="navbar" class:landing-navbar={isLandingPage} class:full-width={isFullWidth}>
  <div class="navbar-container" class:full-width={isFullWidth}>
    {#if !isLandingPage}
      <!-- Mobile Menu Toggle -->
      <button class="mobile-sidebar-toggle" on:click={toggleSidebar}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      <!-- Desktop Navigation -->
      <div class="desktop-menu">
        <a href="/feed" class:active={activePage === "feed"}>Feed</a>
        <a href="/messages" class:active={activePage === "messages"}>Messages</a>
        <a href="/notifications" class:active={activePage === "notifications"}>Notifications</a>
        <a href="/products" class:active={activePage === "products"}>Shop</a>
        <a href="/auctions" class:active={activePage === "auctions"}>Auctions</a>
      </div>
      
      <!-- Mobile Navigation -->
      <div class="mobile-nav">
        {#each navItems as item}
          <a href={item.href} class:active={activePage === item.id}>
            {@html item.icon}
            <span class="sr-only">{item.label}</span>
          </a>
        {/each}
        <a href="/profile" class:active={activePage === "profile"} class="profile-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="sr-only">Profile</span>
        </a>
      </div>
    {:else}
      <!-- Landing page nav options -->
      <div class="logo">
        <a href="/">OCEAN</a>
      </div>
      <div class="auth-buttons">
        <button class="btn-secondary" on:click={navigateToLogin}>Sign In</button>
        <button class="btn-primary" on:click={navigateToSignup}>Sign Up</button>
      </div>
    {/if}
  </div>
  
  {#if isMenuOpen && !isLandingPage}
    <div class="mobile-menu" transition:slide={{ duration: 300 }}>
      {#each navItems as item}
        <a href={item.href} class:active={activePage === item.id}>
          {item.label}
        </a>
      {/each}
    </div>
  {/if}
</nav>

<style>
  .navbar {
    width: 100%;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    padding: 0 2rem;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 200;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .navbar.full-width {
    left: 0;
    width: 100%;
  }
  
  .landing-navbar {
    background-color: transparent;
    box-shadow: none;
    position: absolute;
    border-bottom: none;
  }
  
  .landing-navbar .logo a {
    color: white;
  }
  
  .navbar-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .navbar-container.full-width {
    max-width: none;
    margin: 0;
    padding: 0.75rem 2rem;
    width: 100%;
    justify-content: center;
  }
  
  .logo a {
    font-size: 1.5rem;
    font-weight: bold;
    color: #111;
    text-decoration: none;
  }
  
  .desktop-menu {
    display: none;
  }
  
  @media (min-width: 768px) {
    .navbar {
      left: 280px;
      width: calc(100% - 280px);
    }
    .navbar.full-width {
      left: 0;
      width: 100%;
    }
    .navbar-container.full-width {
      max-width: none;
      margin: 0;
      padding: 0.75rem 2rem;
      width: 100%;
    }
    .desktop-menu {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }
    .navbar-container.full-width .desktop-menu {
      margin-left: 0;
      justify-content: center;
      width: 100%;
    }
    
    .mobile-menu-btn,
    .mobile-nav {
      display: none;
    }

    .navbar-container {
      padding: 0.75rem 2rem;
    }
  }
  
  .desktop-menu a {
    color: #111;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }
  
  .desktop-menu a:hover {
    background-color: #f7f7fa;
    color: #2563eb;
  }
  
  .desktop-menu a.active {
    color: #2563eb;
    font-weight: 600;
  }
  
  .user-actions, .auth-buttons {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .profile-btn, .mobile-menu-btn {
    background: none;
    border: none;
    color: #111;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 9999px;
    transition: background-color 0.2s;
  }
  
  .profile-btn:hover, .mobile-menu-btn:hover {
    background-color: #f7f7fa;
  }
  
  .mobile-menu {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    border-top: 1px solid #e2e8f0;
    background-color: #fff;
  }
  
  .mobile-menu a {
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    color: #111;
  }

  .mobile-menu a:hover {
    background-color: #f7f7fa;
    color: #2563eb;
  }
  
  /* Landing page specific styles */
  .btn-primary, .btn-secondary {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-primary {
    background-color: #2563eb;
    color: white;
    border: none;
  }
  
  .btn-primary:hover {
    background-color: #1d4ed8;
  }
  
  .btn-secondary {
    background-color: transparent;
    color: white;
    border: 1px solid white;
  }
  
  .btn-secondary:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .mobile-sidebar-toggle {
    display: none;
    background: none;
    border: none;
    color: #111;
    padding: 0.5rem;
    cursor: pointer;
    margin-right: 0.5rem;
  }

  @media (max-width: 768px) {
    .mobile-sidebar-toggle {
      display: block;
    }

    .desktop-menu {
      display: none;
    }

    .navbar {
      padding: 0.25rem 0.5rem;
      height: 52px;
    }

    .navbar-container {
      padding: 0.25rem 0.5rem;
      gap: 0.5rem;
    }

    .search-bar input {
      font-size: 0.875rem;
      padding: 0.375rem 2rem 0.375rem 1rem;
    }

    .mobile-nav {
      gap: 1rem;
    }

    .mobile-nav a, .mobile-nav button {
      padding: 0.35rem;
      font-size: 0.95rem;
    }

    .mobile-nav svg, .profile-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .mobile-menu {
      padding: 0.5rem;
    }

    .user-actions {
      display: none;
    }
  }

  .mobile-nav {
    display: none;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 768px) {
    .mobile-nav {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      padding: 0 0.5rem;
    }

    .mobile-nav a, .mobile-nav button {
      color: #111;
      padding: 0.5rem;
      border-radius: 0.375rem;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
    }

    .mobile-nav a:hover, .mobile-nav button:hover {
      background-color: #f7f7fa;
      color: #2563eb;
    }

    .mobile-nav a.active {
      color: #2563eb;
    }

    .mobile-nav svg {
      width: 24px;
      height: 24px;
    }

    .desktop-menu {
      display: none;
    }

    .navbar-container {
      padding: 0.5rem 1rem;
    }

    .search-bar input {
      font-size: 0.875rem;
      padding: 0.375rem 2rem 0.375rem 1rem;
    }

    .user-actions {
      display: none;
    }
  }

  .navbar-title, .navbar-link, .navbar-icon {
    color: #111;
  }
</style> 