<script>
  import { slide } from 'svelte/transition';
  import { goto } from '$app/navigation';
  
  export let activePage = "home";
  export let isLandingPage = false;
  
  // Define navigation items - only show these when not on landing page
  const navItems = [
    { id: "feed", label: "Feed", href: "/feed" },
    { id: "messages", label: "Messages", href: "/messages" },
    { id: "notifications", label: "Notifications", href: "/notifications" },
    { id: "products", label: "Shop", href: "/products" },
    { id: "auctions", label: "Auctions", href: "/auctions" }
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

<nav class="navbar" class:landing-navbar={isLandingPage}>
  <div class="navbar-container">
    <div class="logo">
      <a href={isLandingPage ? '/' : '/feed'}>Ocean</a>
    </div>
    
    {#if !isLandingPage}
      <div class="search-bar">
        <input type="text" placeholder="Search..." />
        <button type="button" class="search-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
          </svg>
        </button>
      </div>
      
      <div class="desktop-menu">
        {#each navItems as item}
          <a href={item.href} class:active={activePage === item.id}>
            {item.label}
          </a>
        {/each}
      </div>
      
      <div class="user-actions">
        <button class="profile-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
          </svg>
        </button>
        
        <button class="mobile-menu-btn" on:click={toggleMenu}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
          </svg>
        </button>
      </div>
    {:else}
      <!-- Landing page nav options -->
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
    background-color: #faf9f6;  /* Warmer white */
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
    position: sticky;
    top: 0;
    width: 100%;
    z-index: 100;
  }
  
  .landing-navbar {
    background-color: transparent;
    box-shadow: none;
    position: absolute;
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
  }
  
  .logo a {
    font-size: 1.5rem;
    font-weight: bold;
    color: #2563eb;
    text-decoration: none;
  }
  
  .search-bar {
    display: flex;
    flex: 1;
    max-width: 400px;
    margin: 0 1.5rem;
    position: relative;
  }
  
  .search-bar input {
    width: 100%;
    padding: 0.5rem 2.5rem 0.5rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    font-size: 0.875rem;
    background-color: #ffffff;
    color: #4b5563;
  }
  
  .search-button {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
  }
  
  .desktop-menu {
    display: none;
  }
  
  @media (min-width: 768px) {
    .desktop-menu {
      display: flex;
      gap: 1.5rem;
    }
    
    .mobile-menu-btn {
      display: none;
    }
  }
  
  .desktop-menu a, .mobile-menu a {
    color: #4b5563;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
  }
  
  .desktop-menu a:hover, .mobile-menu a:hover {
    background-color: #f3f4f6;
  }
  
  .desktop-menu a.active, .mobile-menu a.active {
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
    color: #4b5563;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 9999px;
    transition: background-color 0.2s;
  }
  
  .profile-btn:hover, .mobile-menu-btn:hover {
    background-color: #f3f4f6;
  }
  
  .mobile-menu {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
    background-color: #faf9f6;  /* Match navbar background */
  }
  
  .mobile-menu a {
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
  }
  
  /* Landing page specific styles */
  .btn-primary {
    background-color: #4299e1;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
    font-weight: 500;
  }
  
  .btn-primary:hover {
    background-color: #3182ce;
  }
  
  .btn-secondary {
    background-color: transparent;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: 1px solid rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: background-color 0.2s;
    font-weight: 500;
  }
  
  .btn-secondary:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
</style> 