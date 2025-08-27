<script lang="ts">
  import { onMount } from 'svelte';
  import FileUpload from '../../lib/components/FileUpload.svelte';
  
  let distributors: any[] = [];
  let isLoading = true;
  let searchQuery = '';
  let selectedCategory = '';
  let selectedLocation = '';
  
  let categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Automotive',
    'Health & Beauty', 'Sports', 'Food & Beverages', 'Industrial'
  ];
  
  let locations = [
    'Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Kaduna',
    'Ondo', 'Oyo', 'Rivers', 'Delta', 'Imo'
  ];
  
  onMount(async () => {
    await loadDistributors();
  });
  
  async function loadDistributors() {
    try {
      const response = await fetch('/api/heavy-distributors');
      if (response.ok) {
        distributors = await response.json();
      }
    } catch (error) {
      console.error('Failed to load distributors:', error);
    } finally {
      isLoading = false;
    }
  }
  
  $: filteredDistributors = distributors.filter(distributor => {
    const matchesSearch = distributor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         distributor.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || distributor.category === selectedCategory;
    const matchesLocation = !selectedLocation || distributor.location === selectedLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });
</script>

<svelte:head>
  <title>Heavy Distributors - Ocean App</title>
</svelte:head>

<div class="heavy-distributor-page">
  <div class="container">
    <!-- Header -->
    <header class="page-header">
      <h1>Heavy Distributors</h1>
      <p>Connect with verified suppliers and distributors across Nigeria</p>
    </header>
    
    <!-- Search and Filters -->
    <div class="search-filters">
      <div class="search-box">
        <input
          type="text"
          placeholder="Search distributors, products, or services..."
          bind:value={searchQuery}
        />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      
      <div class="filters">
        <select bind:value={selectedCategory}>
          <option value="">All Categories</option>
          {#each categories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
        
        <select bind:value={selectedLocation}>
          <option value="">All Locations</option>
          {#each locations as location}
            <option value={location}>{location}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <!-- Distributors Grid -->
    <div class="distributors-section">
      {#if isLoading}
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading distributors...</p>
        </div>
      {:else if filteredDistributors.length === 0}
        <div class="no-results">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <h3>No distributors found</h3>
          <p>Try adjusting your search criteria or check back later</p>
        </div>
      {:else}
        <div class="distributors-grid">
          {#each filteredDistributors as distributor}
            <div class="distributor-card">
              <div class="distributor-header">
                <img 
                  src={distributor.logo || '/default-distributor-logo.png'} 
                  alt={distributor.businessName}
                  class="distributor-logo"
                />
                <div class="distributor-info">
                  <h3>{distributor.businessName}</h3>
                  <p class="category">{distributor.category}</p>
                  <p class="location">{distributor.location}</p>
                </div>
                {#if distributor.isVerified}
                  <div class="verified-badge" title="Verified Distributor">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c-1 0-2-.4-2.7-1.1L12 3 5.7 10.9C5 11.6 4 12 3 12"/>
                    </svg>
                  </div>
                {/if}
              </div>
              
              <p class="description">{distributor.description}</p>
              
              <div class="distributor-stats">
                <div class="stat">
                  <span class="stat-value">{distributor.rating || 'N/A'}</span>
                  <span class="stat-label">Rating</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{distributor.totalOrders || 0}</span>
                  <span class="stat-label">Orders</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{distributor.responseTime || 'N/A'}</span>
                  <span class="stat-label">Response</span>
                </div>
              </div>
              
              <div class="distributor-actions">
                <button class="btn btn-primary" on:click={() => contactDistributor(distributor.id)}>
                  Contact Supplier
                </button>
                <button class="btn btn-secondary" on:click={() => viewProfile(distributor.id)}>
                  View Profile
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- Become a Distributor CTA -->
    <div class="become-distributor-cta">
      <div class="cta-content">
        <h2>Are you a supplier or distributor?</h2>
        <p>Join our network of verified heavy distributors and connect with buyers across Nigeria</p>
        <button class="btn btn-primary" on:click={() => goto('/heavy-distributor/register')}>
          Become a Distributor
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .heavy-distributor-page {
    min-height: 100vh;
    background: #f8fafc;
    padding: 2rem 0;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .page-header h1 {
    font-size: 2.5rem;
    color: #1e293b;
    margin-bottom: 1rem;
    font-weight: 700;
  }
  
  .page-header p {
    font-size: 1.125rem;
    color: #64748b;
  }
  
  .search-filters {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .search-box {
    flex: 1;
    min-width: 300px;
    position: relative;
  }
  
  .search-box input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  }
  
  .search-box input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .search-box svg {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
  }
  
  .filters {
    display: flex;
    gap: 1rem;
  }
  
  .filters select {
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
    min-width: 150px;
  }
  
  .distributors-section {
    margin-bottom: 3rem;
  }
  
  .loading {
    text-align: center;
    padding: 3rem;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .no-results {
    text-align: center;
    padding: 3rem;
    color: #64748b;
  }
  
  .no-results svg {
    margin-bottom: 1rem;
    color: #cbd5e1;
  }
  
  .no-results h3 {
    margin-bottom: 0.5rem;
    color: #475569;
  }
  
  .distributors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .distributor-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .distributor-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .distributor-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    position: relative;
  }
  
  .distributor-logo {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
    background: #f1f5f9;
  }
  
  .distributor-info h3 {
    margin: 0 0 0.25rem 0;
    color: #1e293b;
    font-size: 1.125rem;
  }
  
  .distributor-info .category {
    color: #667eea;
    font-weight: 600;
    font-size: 0.875rem;
    margin: 0 0 0.25rem 0;
  }
  
  .distributor-info .location {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }
  
  .verified-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: #10b981;
    color: white;
    padding: 0.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .description {
    color: #475569;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }
  
  .distributor-stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem 0;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .stat {
    text-align: center;
    flex: 1;
  }
  
  .stat-value {
    display: block;
    font-weight: 700;
    color: #1e293b;
    font-size: 1.125rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .distributor-actions {
    display: flex;
    gap: 0.75rem;
  }
  
  .btn {
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
  }
  
  .btn-primary {
    background: #667eea;
    color: white;
  }
  
  .btn-primary:hover {
    background: #5a67d8;
  }
  
  .btn-secondary {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
  
  .btn-secondary:hover {
    background: #e2e8f0;
  }
  
  .become-distributor-cta {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 3rem;
    text-align: center;
    color: white;
  }
  
  .cta-content h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    font-weight: 700;
  }
  
  .cta-content p {
    font-size: 1.125rem;
    margin-bottom: 2rem;
    opacity: 0.9;
  }
  
  .cta-content .btn {
    background: white;
    color: #667eea;
    font-size: 1rem;
    padding: 1rem 2rem;
    min-width: 200px;
  }
  
  .cta-content .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 768px) {
    .search-filters {
      flex-direction: column;
      align-items: stretch;
    }
    
    .search-box {
      min-width: auto;
    }
    
    .filters {
      justify-content: space-between;
    }
    
    .distributors-grid {
      grid-template-columns: 1fr;
    }
    
    .distributor-actions {
      flex-direction: column;
    }
    
    .become-distributor-cta {
      padding: 2rem 1.5rem;
    }
    
    .cta-content h2 {
      font-size: 1.5rem;
    }
  }
</style>

