<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { authStore } from '../stores/auth';
  import { createPost, updatePost, deletePost } from '../api/feed';
  
  export let post: any = null; // For editing existing posts
  export let isOpen = false;
  export let onClose: () => void = () => {};
  
  const dispatch = createEventDispatcher();
  
  // Form state
  let formData = {
    postType: 'product' as 'product' | 'buyer_request' | 'general',
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
  let showDeleteConfirm = false;
  let showFeedbackScreen = false;
  
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
  
  // Handle feedback screen timing
  $: if (showFeedbackScreen) {
    // Close modal after delay
    setTimeout(() => {
      onClose();
    }, 3000);
    
    // Reset form and clear feedback after delay
    setTimeout(() => {
      if (!isEditing) {
        resetForm();
      }
      success = '';
      error = '';
      showFeedbackScreen = false;
    }, 2500);
  }
  
  // Clear feedback when modal opens
  $: if (isOpen) {
    if (!isEditing) {
      resetForm();
    }
    // Clear any previous messages and feedback
    error = '';
    success = '';
    showFeedbackScreen = false;
  }
  
  function loadPostData() {
    formData = {
      postType: post.postType || 'product',
      content: post.content || '',
      productName: post.productName || '',
      brand: post.brand || '',
      price: post.price ? post.price.toString() : '',
      currency: post.currency || 'USD',
      location: post.location || '',
      tags: post.tags ? post.tags.join(', ') : '',
      media: []
    };
    
    // Load existing media if any
    if (post.media && post.media.length > 0) {
      mediaUrls = post.media.map((m: any) => m.url || m);
    }
  }
  
  function handleMediaChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const newFiles = Array.from(target.files);
      mediaFiles = [...mediaFiles, ...newFiles];
      
      // Create preview URLs
      newFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        mediaUrls.push(url);
      });
    }
  }
  
  function removeMedia(index: number) {
    mediaFiles.splice(index, 1);
    mediaUrls.splice(index, 1);
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
  
  function validateForm(): boolean {
    errors = {};
    
    if (!formData.postType) {
      errors.postType = 'Post type is required';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }
    
    if (formData.postType === 'product') {
      if (!formData.productName.trim()) {
        errors.productName = 'Product name is required';
      }
      // Handle price validation safely - convert to string first if needed
      const priceStr = String(formData.price || '');
      if (!priceStr.trim()) {
        errors.price = 'Price is required';
      } else if (isNaN(Number(priceStr)) || Number(priceStr) <= 0) {
        errors.price = 'Price must be a valid positive number';
      }
    }
    
    return Object.keys(errors).length === 0;
  }
  
  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    isLoading = true;
    error = '';
    success = '';
    
    try {
      const formDataObj = new FormData(event.target as HTMLFormElement);
      const payload: any = {};
      
      // Extract form data
      for (const [key, value] of formDataObj.entries()) {
        if (key === 'media' && value instanceof File) {
          if (value.size > 0) {
            payload.media = [value];
          }
        } else if (key === 'media' && Array.isArray(value)) {
          payload.media = value.filter((file: File) => file.size > 0);
        } else {
          payload[key] = value;
        }
      }
      
      // Add user ID from the post if editing, or from auth store
      payload.userId = post?.userId || $authStore?.user?.id;
      
      console.log('Submitting payload:', payload);
      
      let response;
      if (isEditing && post?.id) {
        response = await updatePost(post.id, payload);
      } else {
        response = await createPost(payload);
      }
      
      // Since apiRequest now returns parsed data directly, response is already the data
      if (response && response.message) {
        console.log('Response received:', response);
        
        success = isEditing ? 'Post updated successfully!' : 'Post created successfully!';
        
        // Dispatch the updated/created post data
        dispatch('submit', { 
          post: response.data || { ...post, ...payload }, 
          isEditing,
          action: isEditing ? 'updated' : 'created'
        });
        
        // Show feedback screen instead of closing immediately
        showFeedbackScreen = true;
      } else {
        error = response?.message || 'Failed to save post';
        showFeedbackScreen = true;
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      error = err.message || 'An error occurred';
      showFeedbackScreen = true;
    } finally {
      isLoading = false;
    }
  }
  
  async function handleDelete() {
    if (!post?.id) return;
    
    isLoading = true;
    error = '';
    
    try {
      const response = await deletePost(post.id);
      
      if (response && response.message) {
        success = 'Post deleted successfully!';
        
        // Dispatch the delete event
        dispatch('submit', { 
          post: post, 
          isEditing: false,
          action: 'deleted'
        });
        
        // Show feedback screen
        showFeedbackScreen = true;
      } else {
        error = response?.message || 'Failed to delete post';
        showFeedbackScreen = true;
      }
    } catch (err: any) {
      error = err.message || 'An error occurred';
      showFeedbackScreen = true;
    } finally {
      isLoading = false;
      showDeleteConfirm = false;
    }
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
    <!-- Modal Content -->
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>{isEditing ? 'Edit Post' : 'Create New Post'}</h2>
        <button class="close-btn" on:click={onClose}>&times;</button>
      </div>

      <!-- Feedback Screen -->
      {#if showFeedbackScreen}
        <div class="feedback-screen">
          {#if success}
            <div class="success-feedback">
              <div class="success-icon-large">✓</div>
              <h3>Success!</h3>
              <p>{success}</p>
            </div>
          {:else if error}
            <div class="error-feedback">
              <div class="error-icon-large">✕</div>
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          {/if}
        </div>
      {:else}
        <!-- Form Content -->
        <form on:submit={handleSubmit} class="form">
          <!-- Post Type Selection -->
          <div class="form-group">
            <label for="postType">Post Type *</label>
            <select 
              id="postType" 
              name="postType" 
              bind:value={formData.postType}
              required
            >
              <option value="">Select post type</option>
              <option value="product">Product Sale</option>
              <option value="buyer_request">Buyer Request</option>
              <option value="general">General Post</option>
            </select>
          </div>

          <!-- Content -->
          <div class="form-group">
            <label for="content">Content *</label>
            <textarea 
              id="content" 
              name="content" 
              bind:value={formData.content}
              placeholder="What's on your mind?"
              rows="4"
              required
            ></textarea>
          </div>

          <!-- Product-specific fields -->
          {#if formData.postType === 'product'}
            <div class="form-group">
              <label for="productName">Product Name *</label>
              <input 
                type="text" 
                id="productName" 
                name="productName" 
                bind:value={formData.productName}
                placeholder="Enter product name"
                required
              />
            </div>

            <div class="form-group">
              <label for="brand">Brand</label>
              <input 
                type="text" 
                id="brand" 
                name="brand" 
                bind:value={formData.brand}
                placeholder="Enter brand (optional)"
              />
            </div>

            <div class="form-group">
              <label for="price">Price *</label>
              <input 
                type="number" 
                id="price" 
                name="price" 
                bind:value={formData.price}
                placeholder="Enter price"
                min="0"
                step="0.01"
                required
              />
            </div>
          {/if}

          <!-- Location -->
          <div class="form-group">
            <label for="location">Location</label>
            <input 
              type="text" 
              id="location" 
              name="location" 
              bind:value={formData.location}
              placeholder="Enter location (optional)"
            />
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label for="tags">Tags</label>
            <input 
              type="text" 
              id="tags" 
              name="tags" 
              bind:value={formData.tags}
              placeholder="Enter tags separated by commas (optional)"
            />
          </div>

          <!-- Media Upload -->
          <div class="form-group">
            <label for="media">Media (optional)</label>
            <input 
              type="file" 
              id="media" 
              name="media" 
              accept="image/*,video/*"
              multiple
              on:change={handleMediaChange}
            />
            {#if mediaFiles.length > 0}
              <div class="media-preview">
                {#each mediaFiles as file, index}
                  <div class="media-item">
                    <span>{file.name}</span>
                    <button type="button" on:click={() => removeMedia(index)}>&times;</button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            {#if isEditing}
              <button type="button" class="btn btn-secondary" on:click={onClose}>
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Post'}
              </button>
            {:else}
              <button type="button" class="btn btn-secondary" on:click={onClose}>
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Post'}
              </button>
            {/if}
          </div>

          <!-- Delete Button for Editing -->
          {#if isEditing && post?.id}
            <div class="delete-section">
              <button 
                type="button" 
                class="btn btn-danger" 
                on:click={() => showDeleteConfirm = true}
              >
                Delete Post
              </button>
            </div>
          {/if}
        </form>
      {/if}

      <!-- Delete Confirmation Modal -->
      {#if showDeleteConfirm}
        <div class="delete-confirm">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete this post? This action cannot be undone.</p>
          <div class="delete-actions">
            <button 
              type="button" 
              class="btn btn-secondary" 
              on:click={() => showDeleteConfirm = false}
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              on:click={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Modal Structure */
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
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }
  
  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Feedback Screen */
  .feedback-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 2rem;
    text-align: center;
  }
  
  .success-feedback,
  .error-feedback {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    animation: fadeInScale 0.5s ease-out;
  }
  
  .success-icon-large {
    font-size: 4rem;
    color: #16a34a;
    animation: checkmarkLarge 0.8s ease-in-out;
    background: #f0fdf4;
    border-radius: 50%;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4px solid #16a34a;
  }
  
  .error-icon-large {
    font-size: 4rem;
    color: #dc2626;
    animation: errorIconLarge 0.8s ease-in-out;
    background: #fef2f2;
    border-radius: 50%;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4px solid #dc2626;
  }
  
  .success-feedback h3,
  .error-feedback h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }
  
  .success-feedback h3 {
    color: #16a34a;
  }
  
  .error-feedback h3 {
    color: #dc2626;
  }
  
  .success-feedback p,
  .error-feedback p {
    font-size: 1.1rem;
    margin: 0;
    color: #6b7280;
    max-width: 300px;
  }
  
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes checkmarkLarge {
    0% {
      transform: scale(0) rotate(-45deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.2) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }
  
  @keyframes errorIconLarge {
    0% {
      transform: scale(0) rotate(45deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.2) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }

  /* Form Styles */
  .form {
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
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }
  
  .media-preview {
    margin-top: 0.5rem;
  }
  
  .media-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background: #f9fafb;
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
  }
  
  .media-item button {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
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
  }
  
  .btn-secondary {
    background: #6b7280;
    color: white;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
  }
  
  .btn-danger {
    background: #ef4444;
    color: white;
  }
  
  .btn-danger:hover:not(:disabled) {
    background: #dc2626;
  }
  
  .delete-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
    text-align: center;
  }
  
  .delete-confirm {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-top: 1rem;
    text-align: center;
  }
  
  .delete-confirm h3 {
    color: #dc2626;
    margin: 0 0 1rem 0;
  }
  
  .delete-confirm p {
    color: #6b7280;
    margin: 0 0 1.5rem 0;
  }
  
  .delete-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
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
    
    .left-actions,
    .right-actions {
      justify-content: stretch;
    }
    
    .btn {
      justify-content: center;
    }
    
    .delete-confirm-actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
