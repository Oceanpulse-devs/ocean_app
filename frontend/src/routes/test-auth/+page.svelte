<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { login, signup } from '$lib/api/auth';

  let testEmail = 'test@example.com';
  let testPassword = 'TestPass123!';
  let testConfirmPassword = 'TestPass123!';
  let testFullName = 'Test User';
  let testResult = '';
  let isLoading = false;

  onMount(() => {
    // Check authentication status on page load
    authStore.checkAuth();
  });

  async function testSignup() {
    isLoading = true;
    testResult = '';
    
    try {
      const response = await signup({
        fullName: testFullName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testConfirmPassword,
        agreeTerms: true
      });
      
      testResult = `✅ Signup successful! Response: ${JSON.stringify(response, null, 2)}`;
    } catch (error: any) {
      testResult = `❌ Signup failed: ${error.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function testLogin() {
    isLoading = true;
    testResult = '';
    
    try {
      const response = await login({
        email: testEmail,
        password: testPassword
      });
      
      testResult = `✅ Login successful! Response: ${JSON.stringify(response, null, 2)}`;
    } catch (error: any) {
      testResult = `❌ Login failed: ${error.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function testBackendConnection() {
    isLoading = true;
    testResult = '';
    
    try {
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        testResult = `✅ Backend connected! Health check: ${JSON.stringify(data, null, 2)}`;
      } else {
        testResult = `❌ Backend health check failed: ${response.status} ${response.statusText}`;
      }
    } catch (error: any) {
      testResult = `❌ Backend connection failed: ${error.message}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="test-container">
  <h1>Authentication Test Page</h1>
  
  <div class="test-section">
    <h2>Backend Connection Test</h2>
    <button on:click={testBackendConnection} disabled={isLoading}>
      {isLoading ? 'Testing...' : 'Test Backend Connection'}
    </button>
  </div>

  <div class="test-section">
    <h2>Signup Test</h2>
    <div class="form-group">
      <label>Full Name:</label>
      <input type="text" bind:value={testFullName} />
    </div>
    <div class="form-group">
      <label>Email:</label>
      <input type="email" bind:value={testEmail} />
    </div>
    <div class="form-group">
      <label>Password:</label>
      <input type="password" bind:value={testPassword} />
    </div>
    <div class="form-group">
      <label>Confirm Password:</label>
      <input type="password" bind:value={testConfirmPassword} />
    </div>
    <button on:click={testSignup} disabled={isLoading}>
      {isLoading ? 'Signing up...' : 'Test Signup'}
    </button>
  </div>

  <div class="test-section">
    <h2>Login Test</h2>
    <button on:click={testLogin} disabled={isLoading}>
      {isLoading ? 'Logging in...' : 'Test Login'}
    </button>
  </div>

  <div class="test-section">
    <h2>Auth Store Status</h2>
    <pre>{JSON.stringify($authStore, null, 2)}</pre>
  </div>

  {#if testResult}
    <div class="test-section">
      <h2>Test Result</h2>
      <pre class="result">{testResult}</pre>
    </div>
  {/if}
</div>

<style>
  .test-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .test-section {
    margin-bottom: 2rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: #f9fafb;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .form-group input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-size: 1rem;
  }

  button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
  }

  button:hover:not(:disabled) {
    background: #2563eb;
  }

  button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .result {
    background: #1f2937;
    color: #f9fafb;
    padding: 1rem;
    border-radius: 0.25rem;
    overflow-x: auto;
    white-space: pre-wrap;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
  }

  pre {
    background: #f3f4f6;
    padding: 1rem;
    border-radius: 0.25rem;
    overflow-x: auto;
    font-size: 0.875rem;
  }
</style> 