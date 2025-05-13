<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let showModal = false;
  let postData = {
    content: '',
    images: [] as File[],
    visibility: 'public', // 'public' or 'private'
    tags: [] as string[],
    location: ''
  };
  
  let visibilityOptions = [
    { id: 'public', name: 'Public' },
    { id: 'private', name: 'Private' }
  ];

  function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      postData.images = [...postData.images, ...Array.from(input.files)];
      input.value = '';
    }
  }

  function handleSubmit() {
    dispatch('submit', postData);
    showModal = false;
  }

  function closeModal() {
    showModal = false;
  }

  function handleTagInput(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Enter' && input.value.trim()) {
      const tag = input.value.trim();
      if (!postData.tags.includes(tag)) {
        postData.tags = [...postData.tags, tag];
      }
      input.value = '';
    }
  }

  function removeTag(tag: string) {
    postData.tags = postData.tags.filter(t => t !== tag);
  }

  function removeImage(index: number) {
    postData.images = postData.images.filter((_, i) => i !== index);
  }
</script>

{#if showModal}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Create New Post</h2>
        <button class="close-btn" on:click={closeModal}>×</button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="post-form">
        <div class="form-group">
          <textarea 
            bind:value={postData.content} 
            placeholder="What's on your mind?"
            required
            rows="4"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="images">Add Images</label>
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
              <span>Click to add images ({postData.images.length} selected)</span>
            </div>
          </div>
          {#if postData.images.length > 0}
            <div class="image-preview">
              {#each postData.images as image, index}
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

        <div class="form-group">
          <label for="tags">Add Tags (Press Enter to add)</label>
          <input 
            type="text" 
            id="tags" 
            placeholder="Add tags..."
            on:keydown={handleTagInput}
          />
          {#if postData.tags.length > 0}
            <div class="tags-container">
              {#each postData.tags as tag}
                <span class="tag">
                  #{tag}
                  <button type="button" class="remove-tag" on:click={() => removeTag(tag)}>×</button>
                </span>
              {/each}
            </div>
          {/if}
        </div>

        <div class="form-group">
          <label for="location">Location (Optional)</label>
          <input 
            type="text" 
            id="location" 
            bind:value={postData.location} 
            placeholder="Add location"
          />
        </div>

        <div class="form-group">
          <label>Visibility</label>
          <div class="visibility-toggle">
            {#each visibilityOptions as option}
              <button 
                type="button"
                class="visibility-btn" 
                class:active={postData.visibility === option.id}
                on:click={() => postData.visibility = option.id}
              >
                {option.name}
              </button>
            {/each}
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-btn" on:click={closeModal}>Cancel</button>
          <button type="submit" class="submit-btn">Post</button>
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

  .post-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  textarea {
    width: 100%;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 1rem;
    resize: vertical;
    min-height: 100px;
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

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    background: #e2e8f0;
    border-radius: 1rem;
    font-size: 0.875rem;
    color: #4a5568;
  }

  .remove-tag {
    background: none;
    border: none;
    padding: 0;
    font-size: 1rem;
    color: #666;
    cursor: pointer;
    line-height: 1;
  }

  .visibility-toggle {
    display: flex;
    gap: 1rem;
  }

  .visibility-btn {
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

  .visibility-btn.active {
    background: #4299e1;
    color: white;
    border-color: #4299e1;
  }

  .visibility-btn:hover:not(.active) {
    background: #f7fafc;
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

  @media (max-width: 640px) {
    .modal-content {
      width: 95%;
      padding: 1.5rem;
    }

    .visibility-toggle {
      flex-direction: column;
    }
  }
</style> 