<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { isAuthenticated, getProfile } from '$lib/api/auth';
  import AddFeed from '$lib/components/AddFeed.svelte';

  let authState: any = null;
  let apiTestResult = '';
  let profileTestResult = '';
  let showAddFeed = false;
  let showEditFeed = false;
  let testPost = {
    id: 'test-123',
    postType: 'product',
    content: 'This is a test post for editing',
    productName: 'Test Product',
    brand: 'Test Brand',
    price: 99.99,
    location: 'Test Location',
    tags: ['test', 'demo'],
    media: []
  };

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

  function handleFeedSubmit(event: CustomEvent) {
    const { post, isEditing, action } = event.detail;
    console.log('Feed action:', action, post);
    alert(`${action} post: ${JSON.stringify(post, null, 2)}`);
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

  <div class="debug-section">
    <h2>AddFeed Component Test</h2>
    <div class="button-group">
      <button on:click={() => showAddFeed = true}>Test Create Post</button>
      <button on:click={() => showEditFeed = true}>Test Edit Post</button>
    </div>
    
    <p>Use these buttons to test the AddFeed component functionality:</p>
    <ul>
      <li><strong>Create Post:</strong> Opens the form to create a new post</li>
      <li><strong>Edit Post:</strong> Opens the form to edit an existing post (with delete option)</li>
    </ul>
  </div>
</div>

<!-- AddFeed Component Modals -->
<AddFeed 
  isOpen={showAddFeed} 
  onClose={() => showAddFeed = false}
  on:submit={handleFeedSubmit}
/>

<AddFeed 
  post={testPost}
  isOpen={showEditFeed} 
  onClose={() => showEditFeed = false}
  on:submit={handleFeedSubmit}
/>

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

  .button-group {
    margin-bottom: 1rem;
  }

  .button-group button {
    margin-bottom: 0.5rem;
  }

  ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  li {
    margin-bottom: 0.5rem;
  }
</style>
