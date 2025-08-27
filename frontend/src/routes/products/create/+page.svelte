<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import FileUpload from '../../../lib/components/FileUpload.svelte';
  
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  
  let formData = {
    title: '',
    description: '',
    price: '',
    currency: 'NGN',
    brand: '',
    category: '',
    subcategory: '',
    condition: 'new',
    location: '',
    images: [] as File[]
  };
  
  let categories = [
    'Electronics & Technology',
    'Fashion & Apparel',
    'Home & Garden',
    'Automotive',
    'Health & Beauty',
    'Sports & Outdoors',
    'Books & Media',
    'Food & Beverages',
    'Jewelry & Accessories',
    'Toys & Games',
    'Industrial & Business',
    'Other'
  ];
  
  let conditions = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];
  
  let currencies = [
    { value: 'NGN', label: 'Nigerian Naira (₦)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' }
  ];
  
  let locations = [
    'Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Kaduna',
    'Ondo', 'Oyo', 'Rivers', 'Delta', 'Imo', 'Anambra',
    'Enugu', 'Ebonyi', 'Abia', 'Akwa Ibom', 'Cross River'
  ];
  
  function handleImageChange(event: CustomEvent<any>) {
    const { files } = event.detail;
    formData.images = files;
  }
  
  function validateForm() {
    if (!formData.title.trim()) {
      errorMessage = 'Product title is required';
      return false;
    }
    if (!formData.description.trim()) {
      errorMessage = 'Product description is required';
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errorMessage = 'Valid price is required';
      return false;
    }
    if (!formData.category) {
      errorMessage = 'Product category is required';
      return false;
    }
    if (!formData.location) {
      errorMessage = 'Location is required';
      return false;
    }
    if (formData.images.length === 0) {
      errorMessage = 'At least one product image is required';
      return false;
    }
    return true;
  }
  
  async function createProduct() {
    if (!validateForm()) return;
    
    isLoading = true;
    errorMessage = '';
    
    try {
      const submitData = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'images') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add images
      formData.images.forEach((image, index) => {
        submitData.append('images', image);
      });
      
      const response = await fetch('/api/products', {
        method: 'POST',
        body: submitData
      });
      
      if (response.ok) {
        const result = await response.json();
        successMessage = 'Product created successfully!';
        setTimeout(() => {
          goto(`/products/${result.data.id}`);
        }, 2000);
      } else {
        const error = await response.json();
        errorMessage = error.message || 'Failed to create product';
      }
    } catch (error) {
      errorMessage = 'Network error. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Create Product - Ocean App</title>
</svelte:head>

<div class="create-product-page">
  <div class="container">
    <header class="page-header">
      <h1>Create New Product</h1>
      <p>Add your product to start selling on Ocean</p>
    </header>
    
    <div class="form-container">
      {#if errorMessage}
        <div class="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {errorMessage}
        </div>
      {/if}
      
      {#if successMessage}
        <div class="success-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          {successMessage}
        </div>
      {/if}
      
      <form on:submit|preventDefault={createProduct}>
        <div class="form-grid">
          <div class="form-group">
            <label for="title">Product Title *</label>
            <input
              id="title"
              type="text"
              bind:value={formData.title}
              placeholder="Enter product title"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="brand">Brand</label>
            <input
              id="brand"
              type="text"
              bind:value={formData.brand}
              placeholder="Enter brand name"
            />
          </div>
          
          <div class="form-group">
            <label for="category">Category *</label>
            <select id="category" bind:value={formData.category} required>
              <option value="">Select category</option>
              {#each categories as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="subcategory">Subcategory</label>
            <input
              id="subcategory"
              type="text"
              bind:value={formData.subcategory}
              placeholder="Enter subcategory"
            />
          </div>
          
          <div class="form-group">
            <label for="price">Price *</label>
            <div class="price-input">
              <select bind:value={formData.currency}>
                {#each currencies as currency}
                  <option value={currency.value}>{currency.label}</option>
                {/each}
              </select>
              <input
                id="price"
                type="number"
                bind:value={formData.price}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="condition">Condition</label>
            <select id="condition" bind:value={formData.condition}>
              {#each conditions as condition}
                <option value={condition.value}>{condition.label}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="location">Location *</label>
            <select id="location" bind:value={formData.location} required>
              <option value="">Select location</option>
              {#each locations as location}
                <option value={location}>{location}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group full-width">
            <label for="description">Product Description *</label>
            <textarea
              id="description"
              bind:value={formData.description}
              placeholder="Describe your product in detail..."
              rows="6"
              required
            ></textarea>
          </div>
          
          <div class="form-group full-width">
            <label>Product Images *</label>
            <p class="help-text">Upload high-quality images of your product. First image will be the main display image.</p>
            <FileUpload
              multiple={true}
              accept="image/*"
              maxFiles={8}
              maxSize={15 * 1024 * 1024}
              on:change={handleImageChange}
              bind:value={formData.images}
            />
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" on:click={() => goto('/products')}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Creating Product...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  .create-product-page {
    min-height: 100vh;
    background: #f8fafc;
    padding: 2rem 0;
  }
  
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .page-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .page-header h1 {
    font-size: 2.5rem;
    color: #1e293b;
    margin-bottom: 0.5rem;
    font-weight: 700;
  }
  
  .page-header p {
    font-size: 1.125rem;
    color: #64748b;
  }
  
  .form-container {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .error-message,
  .success-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }
  
  .error-message {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  
  .success-message {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .form-group.full-width {
    grid-column: 1 / -1;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #1e293b;
    font-weight: 600;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .price-input {
    display: flex;
    gap: 0.5rem;
  }
  
  .price-input select {
    width: 120px;
    flex-shrink: 0;
  }
  
  .help-text {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 1rem;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;
  }
  
  .btn-primary {
    background: #667eea;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #5a67d8;
  }
  
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
  
  .btn-secondary:hover {
    background: #e2e8f0;
  }
  
  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .form-actions {
      flex-direction: column;
    }
    
    .btn {
      width: 100%;
    }
    
    .price-input {
      flex-direction: column;
    }
    
    .price-input select {
      width: 100%;
    }
  }
</style>

