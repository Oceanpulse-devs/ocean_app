<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  
  export let multiple: boolean = false;
  export let accept: string = 'image/*,video/*';
  export let maxFiles: number = 10;
  export let maxSize: number = 10 * 1024 * 1024; // 10MB
  export let disabled: boolean = false;
  export let value: File[] = [];
  
  const dispatch = createEventDispatcher();
  
  let dragActive = false;
  let fileInput: HTMLInputElement;
  let dropZone: HTMLDivElement;
  let files: File[] = [];
  let previews: Array<{ file: File; url: string; type: string }> = [];
  let errors: string[] = [];
  
  // File validation
  function validateFile(file: File): string | null {
    if (file.size > maxSize) {
      return `File ${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`;
    }
    
    if (!file.type.match(accept.replace('*', '.*'))) {
      return `File ${file.name} is not a supported type`;
    }
    
    return null;
  }
  
  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Handle file selection
  function handleFiles(selectedFiles: FileList | File[]) {
    const fileArray = Array.from(selectedFiles);
    errors = [];
    
    // Check max files limit
    if (multiple && files.length + fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    // Validate and process files
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
        return;
      }
      
      // Create preview
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      
      if (multiple) {
        files.push(file);
        previews.push({ file, url, type });
      } else {
        files = [file];
        previews = [{ file, url, type }];
      }
    });
    
    // Update value and dispatch event
    value = [...files];
    dispatch('change', { files: value, errors });
  }
  
  // Handle drag events
  function handleDrag(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  function handleDragIn(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      dragActive = true;
    }
  }
  
  function handleDragOut(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragActive = false;
  }
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragActive = false;
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }
  
  // Remove file
  function removeFile(index: number) {
    const file = files[index];
    const preview = previews[index];
    
    files.splice(index, 1);
    previews.splice(index, 1);
    URL.revokeObjectURL(preview.url);
    
    value = [...files];
    dispatch('change', { files: value, errors });
  }
  
  // Clear all files
  function clearFiles() {
    previews.forEach(preview => URL.revokeObjectURL(preview.url));
    files = [];
    previews = [];
    value = [];
    errors = [];
    dispatch('change', { files: value, errors });
  }
  
  // Trigger file input
  function triggerFileInput() {
    if (!disabled) {
      fileInput?.click();
    }
  }
  
  // Cleanup on component destroy
  onMount(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  });
  
  // Watch for external value changes
  $: if (value && value.length === 0) {
    clearFiles();
  }
</script>

<div class="file-upload-container">
  <!-- Hidden file input -->
  <input
    bind:this={fileInput}
    type="file"
    {multiple}
    {accept}
    on:change={(e) => handleFiles(e.target.files)}
    style="display: none;"
  />
  
  <!-- Drop zone -->
  <div
    bind:this={dropZone}
    class="drop-zone"
    class:drag-active={dragActive}
    class:disabled={disabled}
    on:dragover={handleDrag}
    on:dragenter={handleDragIn}
    on:dragleave={handleDragOut}
    on:drop={handleDrop}
    on:click={triggerFileInput}
  >
    <div class="drop-zone-content">
      <div class="upload-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
      
      <h3 class="upload-title">
        {dragActive ? 'Drop files here' : 'Drag & drop files here'}
      </h3>
      
      <p class="upload-subtitle">
        or <span class="browse-link">browse files</span>
      </p>
      
      <div class="upload-info">
        <p>Supported formats: {accept}</p>
        <p>Max size: {formatFileSize(maxSize)}</p>
        {#if multiple}
          <p>Max files: {maxFiles}</p>
        {/if}
      </div>
    </div>
  </div>
  
  <!-- File previews -->
  {#if previews.length > 0}
    <div class="file-previews" in:fly={{ y: 20, duration: 300 }}>
      <div class="previews-header">
        <h4>Selected Files ({previews.length})</h4>
        <button 
          type="button" 
          class="clear-btn"
          on:click={clearFiles}
          disabled={disabled}
        >
          Clear All
        </button>
      </div>
      
      <div class="previews-grid">
        {#each previews as preview, index}
          <div class="file-preview" in:fade={{ duration: 200 }}>
            {#if preview.type === 'image'}
              <img src={preview.url} alt={preview.file.name} />
            {:else}
              <video src={preview.url} muted>
                <track kind="captions" />
              </video>
            {/if}
            
            <div class="file-info">
              <p class="file-name">{preview.file.name}</p>
              <p class="file-size">{formatFileSize(preview.file.size)}</p>
            </div>
            
            <button
              type="button"
              class="remove-btn"
              on:click={() => removeFile(index)}
              disabled={disabled}
              aria-label="Remove file"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Error messages -->
  {#if errors.length > 0}
    <div class="error-messages" in:fly={{ y: 20, duration: 300 }}>
      {#each errors as error}
        <div class="error-message" in:fade={{ duration: 200 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .file-upload-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .drop-zone {
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #f8fafc;
    position: relative;
    overflow: hidden;
  }
  
  .drop-zone:hover:not(.disabled) {
    border-color: #3b82f6;
    background: #eff6ff;
  }
  
  .drop-zone.drag-active {
    border-color: #3b82f6;
    background: #dbeafe;
    transform: scale(1.02);
  }
  
  .drop-zone.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .drop-zone-content {
    pointer-events: none;
  }
  
  .upload-icon {
    color: #64748b;
    margin-bottom: 1rem;
  }
  
  .upload-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }
  
  .upload-subtitle {
    color: #64748b;
    margin: 0 0 1rem 0;
  }
  
  .browse-link {
    color: #3b82f6;
    text-decoration: underline;
    cursor: pointer;
  }
  
  .upload-info {
    font-size: 0.875rem;
    color: #64748b;
  }
  
  .upload-info p {
    margin: 0.25rem 0;
  }
  
  .file-previews {
    margin-top: 1.5rem;
    background: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .previews-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .previews-header h4 {
    margin: 0;
    color: #1e293b;
    font-size: 1rem;
  }
  
  .clear-btn {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .clear-btn:hover:not(:disabled) {
    background: #dc2626;
  }
  
  .clear-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .previews-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
  }
  
  .file-preview {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }
  
  .file-preview img,
  .file-preview video {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
  }
  
  .file-info {
    padding: 0.5rem;
  }
  
  .file-name {
    font-size: 0.75rem;
    color: #1e293b;
    margin: 0 0 0.25rem 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .file-size {
    font-size: 0.75rem;
    color: #64748b;
    margin: 0;
  }
  
  .remove-btn {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
  }
  
  .remove-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.9);
  }
  
  .remove-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .error-messages {
    margin-top: 1rem;
  }
  
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid #fecaca;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
  
  .error-message svg {
    flex-shrink: 0;
  }
  
  @media (max-width: 640px) {
    .drop-zone {
      padding: 1.5rem;
    }
    
    .upload-title {
      font-size: 1.125rem;
    }
    
    .previews-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.75rem;
    }
    
    .file-preview img,
    .file-preview video {
      height: 100px;
    }
  }
</style>

