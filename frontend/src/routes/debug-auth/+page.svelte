<script lang="ts">
  import { onMount } from 'svelte';
  import { getProfile, isAuthenticated } from '$lib/api/auth';
  
  let authStatus = 'Checking...';
  let profileResponse: any = null;
  let cookies = '';
  let error = '';

  async function checkAuth() {
    try {
      authStatus = 'Checking authentication...';
      
      // Check cookies first
      cookies = document.cookie;
      
      // Check if token exists in cookies
      const tokenExists = cookies.includes('token=');
      authStatus += `\nToken in cookies: ${tokenExists ? 'Yes' : 'No'}`;
      
      const isAuth = await isAuthenticated();
      authStatus += `\nIsAuthenticated API: ${isAuth ? 'Yes' : 'No'}`;
      
      // Try to get profile
      if (isAuth) {
        const response = await getProfile();
        profileResponse = {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        };
        
        if (response.ok) {
          const data = await response.json();
          profileResponse.data = data;
        } else {
          const errorText = await response.text();
          profileResponse.error = errorText;
        }
      }
    } catch (err: any) {
      error = err.message;
      console.error('Debug error:', err);
    }
  }

  onMount(() => {
    checkAuth();
  });
</script>

<div class="debug-container">
  <h1>Authentication Debug</h1>
  
  <button on:click={checkAuth}>Refresh Debug Info</button>
  
  <div class="debug-section">
    <h3>Authentication Status</h3>
    <p>{authStatus}</p>
  </div>
  
  <div class="debug-section">
    <h3>Cookies</h3>
    <pre>{cookies || 'No cookies found'}</pre>
  </div>
  
  {#if profileResponse}
    <div class="debug-section">
      <h3>Profile API Response</h3>
      <p>Status: {profileResponse.status} {profileResponse.statusText}</p>
      <p>OK: {profileResponse.ok}</p>
      {#if profileResponse.error}
        <p class="error">Error: {profileResponse.error}</p>
      {/if}
      {#if profileResponse.data}
        <h4>Profile Data:</h4>
        <pre>{JSON.stringify(profileResponse.data, null, 2)}</pre>
      {/if}
    </div>
  {/if}
  
  {#if error}
    <div class="debug-section error">
      <h3>Error</h3>
      <p>{error}</p>
    </div>
  {/if}
</div>

<style>
  .debug-container {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .debug-section {
    margin: 2rem 0;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    background: #f8fafc;
  }

  .debug-section h3 {
    margin: 0 0 1rem 0;
    color: #1a202c;
  }

  .debug-section.error {
    border-color: #f56565;
    background: #fed7d7;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  pre {
    background: #2d3748;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    white-space: pre-wrap;
    font-size: 0.875rem;
  }

  .error {
    color: #e53e3e;
    font-weight: 500;
  }
</style>
