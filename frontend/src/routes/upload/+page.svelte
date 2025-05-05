<script lang="ts">
  let selectedImages: string[] = [];
  let productName = '';
  let category = '';
  let price = '';
  let brand = '';
  let location = '';
  let description = '';
  let isAuction = false;
  
  // Auction specific fields
  let startingBid = '';
  let auctionDuration = '7'; // Default 7 days
  let reservePrice = '';
  let endDate = '';

  function handleImageUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    if (files.length + selectedImages.length > 20) {
      alert('Maximum 20 images allowed');
      return;
    }
    
    files.forEach(file => {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert('Only JPG and PNG files are supported');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = (e.target?.result as string) || '';
        selectedImages = [...selectedImages, result];
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    selectedImages = selectedImages.filter((_, i) => i !== index);
  }

  function handleSubmit() {
    if (selectedImages.length < 5) {
      alert('Please upload at least 5 images');
      return;
    }
    // Handle form submission
  }

  // Calculate minimum end date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minEndDate = tomorrow.toISOString().split('T')[0];
</script>

<div class="upload-content">
  <div class="upload-header">
    <h1>Upload Product</h1>
    <button class="preview-btn">Preview</button>
  </div>

  <div class="upload-form">
    <div class="image-upload-section">
      <h2>Add Image</h2>
      <p class="upload-hint">Add minimum of 5 images and maximum of 20</p>
      
      <div class="image-grid">
        <label class="image-upload-box" for="image-input">
          <input
            type="file"
            id="image-input"
            accept="image/jpeg,image/png"
            multiple
            on:change={handleImageUpload}
            style="display: none;"
          />
          <div class="upload-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
        </label>

        {#each selectedImages as image, i}
          <div class="image-preview">
            <img src={image} alt="Product preview" />
            <button class="remove-image" on:click={() => removeImage(i)}>×</button>
          </div>
        {/each}
      </div>
      
      <p class="format-hint">Supported format is jpg and png</p>
    </div>

    <div class="product-details">
      <div class="form-group">
        <input type="text" bind:value={productName} placeholder="Product Name" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <select bind:value={category}>
            <option value="" disabled selected>Category</option>
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="home">Home</option>
          </select>
        </div>
        <div class="form-group">
          <input type="number" bind:value={price} placeholder="Price" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <input type="text" bind:value={brand} placeholder="Brand" />
        </div>
        <div class="form-group">
          <select bind:value={location}>
            <option value="" disabled selected>Location</option>
            <option value="lagos">Lagos</option>
            <option value="abuja">Abuja</option>
            <option value="port-harcourt">Port Harcourt</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <textarea
          bind:value={description}
          placeholder="Description"
          rows="4"
        ></textarea>
      </div>

      <div class="form-group auction-toggle">
        <label>
          <input type="checkbox" bind:checked={isAuction} />
          Convert to Auction
        </label>
      </div>

      {#if isAuction}
        <div class="auction-details">
          <h3>Auction Details</h3>
          
          <div class="form-row">
            <div class="form-group">
              <input 
                type="number" 
                bind:value={startingBid} 
                placeholder="Starting Bid Price" 
                min="0"
              />
            </div>
            <div class="form-group">
              <input 
                type="number" 
                bind:value={reservePrice} 
                placeholder="Reserve Price (Optional)" 
                min="0"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <select bind:value={auctionDuration}>
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
                <option value="10">10 Days</option>
                <option value="14">14 Days</option>
              </select>
            </div>
            <div class="form-group">
              <input 
                type="date" 
                bind:value={endDate} 
                min={minEndDate}
                placeholder="End Date"
              />
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .upload-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-bottom: 6rem;
  }

  .upload-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 2rem 1.5rem 2rem;
    background-color: #FAF9F6;
  }

  .upload-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.025em;
  }

  .preview-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.75rem;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    background: white;
    color: #4A5568;
    border: 2px solid #E2E8F0;
  }

  .preview-btn:hover {
    background: #F7FAFC;
    border-color: #CBD5E0;
    transform: translateY(-1px);
  }

  .preview-btn svg {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.2s ease;
  }

  .preview-btn:hover svg {
    transform: scale(1.1);
  }

  .upload-form {
    flex: 1;
    overflow-y: auto;
    background: white;
    border-radius: 1.5rem 1.5rem 0 0;
    padding: 2.5rem;
    margin: 0 2rem 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  /* Custom Scrollbar Styling */
  .upload-form::-webkit-scrollbar {
    width: 8px;
  }

  .upload-form::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .upload-form::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 4px;
  }

  .upload-form::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }

  /* Firefox */
  .upload-form {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f1f1;
  }

  .image-upload-section {
    margin-bottom: 3rem;
  }

  .image-upload-section h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: #2D3748;
  }

  .upload-hint {
    color: #718096;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .image-upload-box {
    aspect-ratio: 1;
    background: #F7FAFC;
    border: 2px dashed #CBD5E0;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    overflow: hidden;
  }

  .image-upload-box:hover {
    border-color: #6366F1;
    background: #EDF2F7;
    transform: translateY(-2px);
  }

  .upload-placeholder svg {
    width: 2.5rem;
    height: 2.5rem;
    color: #A0AEC0;
    transition: all 0.2s ease-in-out;
  }

  .image-upload-box:hover .upload-placeholder svg {
    color: #6366F1;
    transform: scale(1.1);
  }

  .image-preview {
    position: relative;
    aspect-ratio: 1;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease-in-out;
  }

  .image-preview:hover {
    transform: translateY(-2px);
  }

  .image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .image-preview:hover img {
    transform: scale(1.05);
  }

  .remove-image {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 2rem;
    height: 2rem;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
  }

  .remove-image:hover {
    background: rgba(239, 68, 68, 0.9);
    transform: scale(1.1);
  }

  .format-hint {
    color: #718096;
    font-size: 0.875rem;
    margin-top: 1rem;
  }

  .product-details {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.875rem 1.25rem;
    border: 2px solid #E2E8F0;
    border-radius: 0.75rem;
    background: #F8FAFC;
    color: #2D3748;
    font-size: 1rem;
    transition: all 0.2s ease-in-out;
  }

  .form-group input:hover,
  .form-group select:hover,
  .form-group textarea:hover {
    border-color: #CBD5E0;
    background: #F1F5F9;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #6366F1;
    background: white;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .form-group textarea {
    resize: vertical;
    min-height: 120px;
  }

  .auction-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }

  .auction-toggle label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #4A5568;
    cursor: pointer;
    font-weight: 500;
    user-select: none;
  }

  .auction-toggle input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 0.375rem;
    border: 2px solid #CBD5E0;
    transition: all 0.2s ease;
  }

  .auction-toggle input[type="checkbox"]:checked {
    background-color: #6366F1;
    border-color: #6366F1;
  }

  .auction-details {
    border-top: 2px solid #E2E8F0;
    padding-top: 2rem;
    margin-top: 0.5rem;
    animation: slideDown 0.3s ease-out;
  }

  .auction-details h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: #2D3748;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .upload-content {
      height: 100%;
      padding: 1rem;
    }

    .upload-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 1rem;
    }

    .upload-form {
      margin: 0;
      padding: 1.5rem;
      border-radius: 1rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .image-grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
    }
  }
</style> 