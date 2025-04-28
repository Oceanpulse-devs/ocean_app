<script>
  import { page } from '$app/stores';
  import Navbar from '$lib/components/Navbar.svelte';
  
  // Pages that use transparent navbar (landing) or no navbar (auth pages)
  const specialNavbarRoutes = ['/'];
  const noNavbarRoutes = ['/login', '/signup', '/forgot-password', '/verify-email'];
  
  // Determine if we're on a special page
  $: isLandingPage = specialNavbarRoutes.includes($page.url.pathname);
  $: shouldShowNavbar = !noNavbarRoutes.includes($page.url.pathname);
  
  // Get the current route for active page highlighting
  $: activePage = $page.url.pathname.split('/')[1] || 'home';
</script>

<div class="app-container">
  {#if shouldShowNavbar}
    <Navbar {activePage} {isLandingPage} />
  {/if}
  
  <main>
    <slot />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    overflow-x: hidden;
  }
  
  .app-container {
    position: relative;
    min-height: 100vh;
    width: 100%;
  }
  
  main {
    min-height: 100vh;
  }
</style> 