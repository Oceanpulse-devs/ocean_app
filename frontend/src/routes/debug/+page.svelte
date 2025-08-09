<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { isAuthenticated, getProfile } from '$lib/api/auth';

  let authState: any = null;
  let apiTestResult = '';
  let profileTestResult = '';

  onMount(() => {
    const unsubscribe = authStore.subscribe((state) => {
      authState = state;
    });

    return unsubscribe;
  });

  async function testAuth() {
    try {
      const result = await isAuthenticated();
      apiTestResult = `isAuthenticated() returned: ${result}`;
    } catch (error) {
      apiTestResult = `Error: ${error}`;
    }
  }

  async function testProfile() {
    try {
      const response = await getProfile();
      profileTestResult = `Profile API Status: ${response.status} ${response.statusText}`;
      
      if (response.ok) {
        const data = await response.json();
        profileTestResult += `\nData: ${JSON.stringify(data, null, 2)}`;
      }
    } catch (error) {
      profileTestResult = `Error: ${error}`;
    }
  }

  function checkCookies() {
    const cookies = document.cookie;
    return cookies || 'No cookies found';
  }
</script>

<div class="debug-page">
  <h1>Debug Page</h1>
  
  <div class="debug-section">
    <h2>Auth Store State</h2>
    <pre>{JSON.stringify(authState, null, 2)}</pre>
  </div>

  <div class="debug-section">
    <h2>Cookies</h2>
    <pre>{checkCookies()}</pre>
  </div>

  <div class="debug-section">
    <h2>API Tests</h2>
    <button on:click={testAuth}>Test isAuthenticated()</button>
    <button on:click={testProfile}>Test Profile API</button>
    
    {#if apiTestResult}
      <h3>Auth Test Result:</h3>
      <pre>{apiTestResult}</pre>
    {/if}
    
    {#if profileTestResult}
      <h3>Profile Test Result:</h3>
      <pre>{profileTestResult}</pre>
    {/if}
  </div>
</div>

<style>
  .debug-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .debug-section {
    margin-bottom: 2rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
  }

  pre {
    background: #f7fafc;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    white-space: pre-wrap;
  }

  button {
    margin-right: 1rem;
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  button:hover {
    background: #2563eb;
  }
</style>
