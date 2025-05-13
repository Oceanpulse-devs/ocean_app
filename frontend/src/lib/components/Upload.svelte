<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let showModal = false;
  let productData = {
    name: '',
    description: '',
    price: '',
    category: '',
    condition: 'new',
    images: [] as File[],
    uploadType: 'direct', // 'direct' or 'auction'
    startPrice: '', // For auction
    duration: '7', // Default auction duration in days
  };
  
  let categories = [
    { id: 'home', name: 'Home & Office' },
    { id: 'phones', name: 'Phones & Tablets' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'health', name: 'Health & Beauty' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'computing', name: 'Computing' },
    { id: 'grocery', name: 'Grocery' },
    { id: 'garden', name: 'Garden & Outdoors' },
    { id: 'automobile', name: 'Automobile' },
    { id: 'sports', name: 'Sporting Goods' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'baby', name: 'Baby Products' }
  ];

  let conditions = [
    { id: 'new', name: 'New' },
    { id: 'like-new', name: 'Like New' },
    { id: 'good', name: 'Good' },
    { id: 'fair', name: 'Fair' },
    { id: 'poor', name: 'Poor' }
  ];

  let auctionDurations = [
    { id: '1', name: '1 Day' },
    { id: '3', name: '3 Days' },
    { id: '7', name: '7 Days' },
    { id: '14', name: '14 Days' },
    { id: '30', name: '30 Days' }
  ];

  function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      productData.images = [...productData.images, ...Array.from(input.files)];
      input.value = '';
    }
  }

  function removeImage(index: number) {
    productData.images = productData.images.filter((_, i) => i !== index);
  }

  function handleSubmit() {
    dispatch('submit', productData);
    showModal = false;
  }

  function closeModal() {
    showModal = false;
  }
</script>

{#if showModal}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Upload New Product</h2>
        <button class="close-btn" on:click={closeModal}>×</button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="upload-form">
        <div class="form-group">
          <label for="name">Product Name</label>
          <input 
            type="text" 
            id="name" 
            bind:value={productData.name} 
            placeholder="Enter product name"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description" 
            bind:value={productData.description} 
            placeholder="Describe your product"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label>Upload Type</label>
          <div class="upload-type-toggle">
            <button 
              type="button"
              class="type-btn" 
              class:active={productData.uploadType === 'direct'}
              on:click={() => productData.uploadType = 'direct'}
            >
              Direct Sale
            </button>
            <button 
              type="button"
              class="type-btn" 
              class:active={productData.uploadType === 'auction'}
              on:click={() => productData.uploadType = 'auction'}
            >
              Auction
            </button>
          </div>
        </div>

        <div class="form-row">
          {#if productData.uploadType === 'direct'}
            <div class="form-group">
              <label for="price">Price (₦)</label>
              <input 
                type="number" 
                id="price" 
                bind:value={productData.price} 
                placeholder="0.00"
                required
              />
            </div>
          {:else}
            <div class="form-group">
              <label for="startPrice">Starting Price (₦)</label>
              <input 
                type="number" 
                id="startPrice" 
                bind:value={productData.startPrice} 
                placeholder="0.00"
                required
              />
            </div>
            <div class="form-group">
              <label for="duration">Auction Duration</label>
              <select id="duration" bind:value={productData.duration} required>
                {#each auctionDurations as duration}
                  <option value={duration.id}>{duration.name}</option>
                {/each}
              </select>
            </div>
          {/if}

          <div class="form-group">
            <label for="category">Category</label>
            <select id="category" bind:value={productData.category} required>
              <option value="">Select category</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="condition">Condition</label>
          <select id="condition" bind:value={productData.condition} required>
            {#each conditions as condition}
              <option value={condition.id}>{condition.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="images">Product Images</label>
          <div class="image-upload" on:click={() => document.getElementById('images')?.click()}>
            <input 
              type="file" 
              id="images" 
              accept="image/*" 
              multiple 
              on:change={handleImageUpload}
            />
            <div class="upload-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" class="upload-icon" viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              <span>Click to add images ({productData.images.length} selected)</span>
            </div>
          </div>
          {#if productData.images.length > 0}
            <div class="image-preview">
              {#each productData.images as image, index}
                <div class="preview-item">
                  <img src={URL.createObjectURL(image)} alt="Preview" />
                  <button 
                    type="button" 
                    class="remove-image" 
                    on:click={() => removeImage(index)}
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-btn" on:click={closeModal}>Cancel</button>
          <button type="submit" class="submit-btn">Upload Product</button>
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
  }

  .modal-content {
    background: white;
    border-radius: 1rem;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2rem;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }

  .upload-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  label {
    font-weight: 500;
    color: #333;
  }

  input, textarea, select {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 1rem;
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }

  .image-upload {
    border: 2px dashed #e2e8f0;
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
  }

  .image-upload input[type="file"] {
    display: none;
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: #666;
  }

  .upload-icon {
    width: 2rem;
    height: 2rem;
    fill: currentColor;
  }

  .image-preview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .preview-item {
    aspect-ratio: 1;
    border-radius: 0.5rem;
    overflow: hidden;
    position: relative;
  }

  .preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-image {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
  }

  .remove-image:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }

  .cancel-btn, .submit-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
  }

  .cancel-btn {
    background: none;
    border: 1px solid #e2e8f0;
    color: #666;
  }

  .submit-btn {
    background: #4299e1;
    border: none;
    color: white;
  }

  .upload-type-toggle {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .type-btn {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    background: white;
    color: #4a5568;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .type-btn.active {
    background: #4299e1;
    color: white;
    border-color: #4299e1;
  }

  .type-btn:hover:not(.active) {
    background: #f7fafc;
  }

  @media (max-width: 640px) {
    .modal-content {
      width: 95%;
      padding: 1.5rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .upload-type-toggle {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style> 