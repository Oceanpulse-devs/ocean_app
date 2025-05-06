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

<div class="page-container">
  <main class="main-container">
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
  </main>
</div>

<style>
  .page-container {
    width: 100%;
    height: calc(100vh - 65px);
    overflow-y: auto;
  }

  .main-container {
    width: 100%;
    background-color: #faf9f6;
    padding: 2rem 2rem 12rem 2rem;
  }

  @media (max-width: 768px) {
    .main-container {
      padding: 0;
      background-color: white;
    }

    .upload-content {
      max-width: none;
      margin: 0 1rem;
    }

    .upload-header {
      padding: 1rem;
      margin-bottom: 1rem;
      background-color: #faf9f6;
      border-radius: 0.5rem;
      margin-top: 1rem;
    }

    .upload-form {
      border-radius: 1rem;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      background-color: #faf9f6;
    }

    .form-row {
      flex-direction: column;
      gap: 1rem;
    }

    .form-row .form-group {
      width: 100%;
    }

    .image-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .image-preview {
      aspect-ratio: 1;
    }

    .auction-details {
      padding: 1rem;
      margin: 1rem -0.25rem;
      background-color: white;
      border-radius: 0.75rem;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      font-size: 1rem;
      padding: 0.875rem;
    }
  }

  .upload-content {
    max-width: 800px;
    margin: 0 auto;
  }

  .upload-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .upload-header h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2D3748;
  }

  .preview-btn {
    padding: 0.5rem 1rem;
    background: #6366F1;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .preview-btn:hover {
    background: #4F46E5;
  }

  .upload-form {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .image-upload-section {
    margin-bottom: 2.5rem;
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
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); /* Reduced size */
    gap: 1rem;
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
    margin-bottom: 2.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-row {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .form-row .form-group {
    flex: 1;
    min-width: 200px; /* Reduced from 250px */
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem 1rem; /* Reduced padding */
    border: 1px solid #E2E8F0;
    border-radius: 0.5rem;
    background: #F8FAFC;
    color: #2D3748;
    font-size: 0.875rem; /* Slightly smaller font */
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
    min-height: 100px; /* Reduced from 120px */
    max-height: 200px;
  }

  .auction-toggle {
    margin: 2rem 0;
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
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #E2E8F0;
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
</style> 