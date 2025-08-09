<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';

  export let redirectTo = '/login';

  let isChecking = true;

  onMount(() => {
    // Subscribe to auth store changes
    const unsubscribe = authStore.subscribe((state) => {
      if (!state.isLoading) {
        isChecking = false;
        
        if (!state.isAuthenticated) {
          // Redirect to login if not authenticated
          goto(redirectTo);
        }
      }
    });

    // Only check auth if we don't already have user data
    if (!$authStore.user) {
      authStore.checkAuth();
    } else {
      isChecking = false;
    }

    return unsubscribe;
  });
</script>

{#if isChecking}
  <div class="loading">
    <div class="spinner"></div>
    <p>Checking authentication...</p>
  </div>
{:else if $authStore.isAuthenticated}
  <slot />
{:else}
  <div class="redirecting">
    <p>Redirecting to login...</p>
  </div>
{/if}

<style>
  .loading, .redirecting {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  p {
    color: #666;
    margin: 0;
  }
</style> 