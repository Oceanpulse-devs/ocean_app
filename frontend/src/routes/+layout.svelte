<script lang="ts">
  import { page } from '$app/stores';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  
  // Pages that use transparent navbar (landing) or no navbar (auth pages)
  const specialNavbarRoutes = ['/'];
  const noNavbarRoutes = ['/', '/login', '/signup', '/forgot-password', '/verify-email'];
  const noSidebarRoutes = ['/', '/login', '/signup', '/forgot-password', '/verify-email', '/products'];
  
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

  $: isFullWidth = $page.url.pathname === '/products';
</script>

<div class="layout" class:with-sidebar={shouldShowSidebar}>
  {#if shouldShowSidebar}
    <Sidebar {userStats} />
  {/if}
  <main class="main-content" class:scrollable={shouldScroll}>
  {#if shouldShowNavbar}
      <Navbar {activePage} {isLandingPage} isFullWidth={isFullWidth} />
  {/if}
  
    <slot />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    min-height: 100vh;
  }

  :global(html) {
    min-height: 100vh;
  }
  
  .layout {
    display: flex;
    min-height: 100vh;
    background: linear-gradient(135deg, #fff 60%, #f9fafb 100%);
  }
  
  .main-content {
    background: transparent;
    min-height: 100vh;
    position: relative;
    flex: 1;
  }

  .main-content.scrollable {
    overflow-y: auto;
  }

  .layout.with-sidebar .main-content {
    margin-left: 280px;
  }
  .layout:not(.with-sidebar) .main-content {
    margin-left: 0;
  }

  @media (max-width: 768px) {
    .layout.with-sidebar .main-content {
      margin-left: 0;
    }
    :global(body), :global(html), .layout, .main-content {
      overflow: visible !important;
      height: auto !important;
      min-height: 100vh !important;
    }
  }
</style> 