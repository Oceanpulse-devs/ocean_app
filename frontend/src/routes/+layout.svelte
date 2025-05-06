<script lang="ts">
  import { page } from '$app/stores';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  
  // Pages that use transparent navbar (landing) or no navbar (auth pages)
  const specialNavbarRoutes = ['/'];
  const noNavbarRoutes = ['/login', '/signup', '/forgot-password', '/verify-email'];
  const noSidebarRoutes = ['/', '/login', '/signup', '/forgot-password', '/verify-email'];
  
  // Determine if we're on a special page
  $: isLandingPage = specialNavbarRoutes.includes($page.url.pathname);
  $: shouldShowNavbar = !noNavbarRoutes.includes($page.url.pathname);
  $: shouldShowSidebar = !noSidebarRoutes.includes($page.url.pathname);
  $: shouldScroll = noSidebarRoutes.includes($page.url.pathname);
  
  // Get the current route for active page highlighting
  $: activePage = $page.url.pathname.split('/')[1] || 'home';

  let userStats = {
    posts: 46,
    followers: '2.8K',
    following: 200
  };
</script>

<div class="layout" class:with-sidebar={shouldShowSidebar}>
  {#if shouldShowSidebar}
    <Sidebar {userStats} />
  {/if}
  <main class="main-content" class:scrollable={shouldScroll}>
    {#if shouldShowNavbar}
      <Navbar {activePage} {isLandingPage} />
    {/if}
    
    <slot />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    overflow: hidden;
    height: 100vh;
  }

  :global(html) {
    overflow: hidden;
    height: 100%;
  }
  
  .layout {
    display: flex;
    height: 100vh;
    background-color: #f8f7f4;
    overflow: hidden;
  }

  .main-content {
    background-color: #faf9f6;
    height: 100vh;
    position: relative;
    overflow: hidden;
    flex: 1;
  }

  .main-content.scrollable {
    overflow-y: auto;
  }

  .layout.with-sidebar .main-content {
    margin-left: 280px;
  }

  @media (max-width: 768px) {
    .layout.with-sidebar .main-content {
      margin-left: 0;
    }
  }
</style> 