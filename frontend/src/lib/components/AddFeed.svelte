<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { authStore } from '../stores/auth';
  
  export let post: any = null; // For editing existing posts
  export let isOpen = false;
  export let onClose: () => void = () => {};
  
  const dispatch = createEventDispatcher();
  
  // Form state
  let formData = {
    postType: 'product',
    content: '',
    productName: '',
    brand: '',
    price: '',
    currency: 'USD',
    location: '',
    tags: '',
    media: []
  };
  
  // UI state
  let isLoading = false;
  let error = '';
  let success = '';
  let isEditing = false;
  
  // Media handling
  let mediaFiles: File[] = [];
  let mediaUrls: string[] = [];
  let dragOver = false;
  
  // Validation
  let errors: Record<string, string> = {};
  
  // Post types
  const postTypes = [
    { value: 'product', label: 'Product Sale' },
    { value: 'buyer_request', label: 'Buyer Request' },
    { value: 'general', label: 'General Post' }
  ];
  
  // Currencies
  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'NGN', label: 'NGN (₦)' }
  ];
  
  onMount(() => {
    if (post) {
      isEditing = true;
      loadPostData();
    }
  });
  
  function loadPostData() {
    formData = {
      postType: post.postType || 'product',
      content: post.content || '',
      productName: post.productName || '',
      brand: post.brand || '',
      price: post.price ? post.price.toString() : '',
      currency: post.currency || 'USD',
      location: post.location || '',
      tags: post.tags ? (Array.isArray(post.tags) ? post.tags.join(', ') : post.tags) : '',
      media: post.media || []
    };
    
    // Load existing media URLs
    if (post.media && post.media.length > 0) {
      mediaUrls = post.media.map((m: any) => m.mediaUrl);
    }
  }
  
  function validateForm(): boolean {
    errors = {};
    
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }
    
    if (formData.postType === 'product') {
      if (!formData.productName.trim()) {
        errors.productName = 'Product name is required';
      }
      if (!formData.price.trim()) {
        errors.price = 'Price is required';
      }
      if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        errors.price = 'Price must be a valid positive number';
      }
    }
    
    if (formData.postType === 'buyer_request') {
      if (!formData.productName.trim()) {
        errors.productName = 'What you\'re looking for is required';
      }
    }
    
    return Object.keys(errors).length === 0;
  }
  
  async function handleSubmit() {
    if (!validateForm()) return;
    
    isLoading = true;
    error = '';
    success = '';
    
    try {
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : null,
        media: mediaUrls.map((url, index) => ({
          type: 'image',
          url,
          thumbnailUrl: url,
          mediaOrder: index,
          altText: `Media ${index + 1}`
        }))
      };
      
      // For now, just emit the data
      dispatch('submit', { post: payload, isEditing });
      success = isEditing ? 'Post updated successfully!' : 'Post created successfully!';
      
      // Reset form
      if (!isEditing) {
        resetForm();
      }
      
      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      error = err.message || 'An error occurred';
    } finally {
      isLoading = false;
    }
  }
  
  function resetForm() {
    formData = {
      postType: 'product',
      content: '',
      productName: '',
      brand: '',
      price: '',
      currency: 'USD',
      location: '',
      tags: '',
      media: []
    };
    mediaFiles = [];
    mediaUrls = [];
    errors = {};
  }
  
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const files = Array.from(target.files);
      handleFiles(files);
    }
  }
  
  function handleFiles(files: File[]) {
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            mediaUrls.push(result);
            mediaUrls = [...mediaUrls]; // Trigger reactivity
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    
    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files);
      handleFiles(files);
    }
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }
  
  function handleDragLeave() {
    dragOver = false;
  }
  
  function removeMedia(index: number) {
    mediaUrls.splice(index, 1);
    mediaUrls = [...mediaUrls];
  }
  
  function closeModal() {
    if (!isLoading) {
      onClose();
    }
  }
</script>

<!-- Modal Overlay -->
{#if isOpen}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      
      <!-- Header -->
      <div class="modal-header">
        <h2>{isEditing ? 'Edit Post' : 'Create New Post'}</h2>
        <button class="close-btn" on:click={closeModal} disabled={isLoading}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
      
      <!-- Error/Success Messages -->
      {#if error}
        <div class="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          {error}
        </div>
      {/if}
      
      {#if success}
        <div class="success-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {success}
        </div>
      {/if}
      
      <!-- Form -->
      <form class="feed-form" on:submit|preventDefault={handleSubmit}>
        
        <!-- Post Type Selection -->
        <div class="form-group">
          <label for="postType">Post Type *</label>
          <div class="post-type-selector">
            {#each postTypes as type}
              <label class="post-type-option">
                <input 
                  type="radio" 
                  bind:group={formData.postType} 
                  value={type.value}
                  name="postType"
                />
                <span class="radio-custom"></span>
                <span class="label-text">{type.label}</span>
              </label>
            {/each}
          </div>
        </div>
        
        <!-- Content -->
        <div class="form-group">
          <label for="content">Content *</label>
          <textarea
            id="content"
            bind:value={formData.content}
            placeholder="Share what's on your mind..."
            rows="4"
            class:error={errors.content}
          ></textarea>
          {#if errors.content}
            <span class="error-text">{errors.content}</span>
          {/if}
        </div>
        
        <!-- Product Fields (for product posts) -->
        {#if formData.postType === 'product'}
          <div class="product-fields">
            <div class="form-row">
              <div class="form-group">
                <label for="productName">Product Name *</label>
                <input
                  type="text"
                  id="productName"
                  bind:value={formData.productName}
                  placeholder="Enter product name"
                  class:error={errors.productName}
                />
                {#if errors.productName}
                  <span class="error-text">{errors.productName}</span>
                {/if}
              </div>
              
              <div class="form-group">
                <label for="brand">Brand</label>
                <input
                  type="text"
                  id="brand"
                  bind:value={formData.brand}
                  placeholder="Enter brand name"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="price">Price *</label>
                <div class="price-input">
                  <select bind:value={formData.currency}>
                    {#each currencies as currency}
                      <option value={currency.value}>{currency.label}</option>
                    {/each}
                  </select>
                  <input
                    type="number"
                    id="price"
                    bind:value={formData.price}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    class:error={errors.price}
                  />
                </div>
                {#if errors.price}
                  <span class="error-text">{errors.price}</span>
                {/if}
              </div>
              
              <div class="form-group">
                <label for="location">Location</label>
                <input
                  type="text"
                  id="location"
                  bind:value={formData.location}
                  placeholder="Enter location"
                />
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Buyer Request Fields -->
        {#if formData.postType === 'buyer_request'}
          <div class="form-group">
            <label for="productName">What are you looking for? *</label>
            <input
              type="text"
              id="productName"
              bind:value={formData.productName}
              placeholder="Describe what you're looking for..."
              class:error={errors.productName}
            />
            {#if errors.productName}
              <span class="error-text">{errors.productName}</span>
            {/if}
          </div>
        {/if}
        
        <!-- Tags -->
        <div class="form-group">
          <label for="tags">Tags (comma separated)</label>
          <input
            type="text"
            id="tags"
            bind:value={formData.tags}
            placeholder="e.g., electronics, gadgets, affordable"
          />
          <small>Add relevant tags to help others find your post</small>
        </div>
        
        <!-- Media Upload -->
        <div class="form-group">
          <label>Media</label>
          <div 
            class="media-upload-area"
            class:drag-over={dragOver}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={handleDrop}
          >
            <input
              type="file"
              id="media-upload"
              multiple
              accept="image/*"
              on:change={handleFileSelect}
              class="file-input"
            />
            <div class="upload-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <p>Drag & drop images here or click to browse</p>
              <small>Supports JPG, PNG, GIF (max 5 images)</small>
            </div>
          </div>
          
          <!-- Media Preview -->
          {#if mediaUrls.length > 0}
            <div class="media-preview">
              {#each mediaUrls as url, index}
                <div class="media-item">
                  <img src={url} alt="Media {index + 1}" />
                  <button 
                    type="button" 
                    class="remove-media" 
                    on:click={() => removeMedia(index)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6 6 18"/>
                      <path d="m6 6 12 12"/>
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Action Buttons -->
        <div class="form-actions">
          <div class="right-actions">
            <button type="button" class="btn btn-secondary" on:click={closeModal} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" disabled={isLoading}>
              {#if isLoading}
                <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                {isEditing ? 'Updating...' : 'Creating...'}
              {:else}
                {isEditing ? 'Update Post' : 'Create Post'}
              {/if}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal-content {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
  }
  
  .close-btn {
    background: none;
    border: none;
    padding: 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s;
  }
  
  .close-btn:hover:not(:disabled) {
    background: #f3f4f6;
    color: #374151;
  }
  
  .close-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .error-message,
  .success-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    margin: 0 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
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
  
  .feed-form {
    padding: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: all 0.2s;
    box-sizing: border-box;
  }
  
  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .form-group input.error,
  .form-group textarea.error {
    border-color: #dc2626;
  }
  
  .error-text {
    color: #dc2626;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    display: block;
  }
  
  .form-group small {
    color: #6b7280;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    display: block;
  }
  
  .post-type-selector {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .post-type-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }
  
  .post-type-option:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }
  
  .post-type-option input[type="radio"] {
    display: none;
  }
  
  .radio-custom {
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    position: relative;
    transition: all 0.2s;
  }
  
  .post-type-option input[type="radio"]:checked + .radio-custom {
    border-color: #3b82f6;
    background: #3b82f6;
  }
  
  .post-type-option input[type="radio"]:checked + .radio-custom::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
  }
  
  .label-text {
    font-weight: 500;
    color: #374151;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .price-input {
    display: flex;
    gap: 0.5rem;
  }
  
  .price-input select {
    width: auto;
    min-width: 80px;
  }
  
  .price-input input {
    flex: 1;
  }
  
  .media-upload-area {
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    transition: all 0.2s;
    cursor: pointer;
    position: relative;
  }
  
  .media-upload-area:hover,
  .media-upload-area.drag-over {
    border-color: #3b82f6;
    background: #f8fafc;
  }
  
  .file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  
  .upload-content {
    pointer-events: none;
  }
  
  .upload-content svg {
    color: #9ca3af;
    margin-bottom: 1rem;
  }
  
  .upload-content p {
    margin: 0 0 0.5rem;
    font-weight: 500;
    color: #374151;
  }
  
  .upload-content small {
    color: #6b7280;
  }
  
  .media-preview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
  }
  
  .media-item {
    position: relative;
    border-radius: 0.5rem;
    overflow: hidden;
    aspect-ratio: 1;
  }
  
  .media-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .remove-media {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    background: rgba(0, 0, 0, 0.7);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .remove-media:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
  
  .form-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .right-actions {
    display: flex;
    gap: 0.75rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
  }
  
  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }
  
  .btn-danger {
    background: #dc2626;
    color: white;
  }
  
  .btn-danger:hover:not(:disabled) {
    background: #b91c1c;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Responsive Design */
  @media (max-width: 640px) {
    .modal-content {
      margin: 0.5rem;
      max-height: 95vh;
    }
    
    .modal-header {
      padding: 1rem 1rem 0.75rem;
    }
    
    .feed-form {
      padding: 1rem;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .post-type-selector {
      flex-direction: column;
    }
    
    .form-actions {
      flex-direction: column;
      align-items: stretch;
    }
    
    .right-actions {
      justify-content: stretch;
    }
    
    .btn {
      justify-content: center;
    }
  }
</style>
