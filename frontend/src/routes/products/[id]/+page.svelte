<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  // Static product data
  const product = {
    name: "Vintage Rolex Submariner",
    price: 8500,
    condition: "Excellent",
    location: "New York, NY",
    postedDate: "2 days ago",
    description: "A beautiful vintage Rolex Submariner from 1965. This timepiece features a black dial, stainless steel case, and original bracelet. The watch is in excellent condition with minimal signs of wear. The movement has been recently serviced and is keeping excellent time.",
    images: [
      "/test.jpg.jpg",
      "/test.jpg.jpg",
      "/wrigglyLine2.png",
      "/test.jpg.jpg"
    ],
    seller: {
      name: "Luxury Timepieces",
      rating: 4.8,
      memberSince: "2018",
      responseRate: "98%",
      responseTime: "within 24 hours"
    },
    specifications: {
      brand: "Rolex",
      model: "Submariner",
      year: "1965",
      movement: "Automatic",
      caseMaterial: "Stainless Steel",
      braceletMaterial: "Stainless Steel",
      waterResistance: "200m"
    }
  };

  let currentUser = null;
  let selectedImage = product.images[0];
  let isSaved = false;

  const handleMessage = () => {
    if (!currentUser) {
      goto('/login');
      return;
    }
    // TODO: Implement messaging functionality
  };

  const toggleSave = () => {
    isSaved = !isSaved;
    // TODO: Implement save functionality
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
</script>

<div class="product-container">
  <div class="product-details">
    <div class="product-gallery">
      <div class="main-image">
        <img src={selectedImage} alt={product.name} />
      </div>
      <div class="thumbnail-grid">
        {#each product.images as image, i}
          <div class="thumbnail" on:click={() => selectedImage = image}>
            <img src={image} alt={`${product.name} - Image ${i + 1}`} />
          </div>
        {/each}
      </div>
    </div>

    <div class="product-info">
      <div class="header">
        <h1>{product.name}</h1>
        <button class="save-button" class:active={isSaved} on:click={toggleSave}>
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div class="price-section">
        <div class="price">
          <span class="label">Price:</span>
          <span class="amount">{formatCurrency(product.price)}</span>
        </div>
        <div class="condition">
          <span class="label">Condition:</span>
          <span class="value">{product.condition}</span>
        </div>
      </div>

      <div class="location-info">
        <span class="location">{product.location}</span>
        <span class="posted">Posted {product.postedDate}</span>
      </div>

      <div class="description">
        <h2>Description</h2>
        <p>{product.description}</p>
      </div>

      <div class="specifications">
        <h2>Specifications</h2>
        <div class="specs-grid">
          {#each Object.entries(product.specifications) as [key, value]}
            <div class="spec-item">
              <span class="label">{key}:</span>
              <span class="value">{value}</span>
            </div>
          {/each}
        </div>
      </div>

      <div class="seller-info">
        <h2>Seller Information</h2>
        <div class="seller-details">
          <div class="seller-header">
            <span class="name">{product.seller.name}</span>
            <span class="rating">Rating: {product.seller.rating}/5</span>
          </div>
          <div class="seller-stats">
            <div class="stat">
              <span class="label">Member since:</span>
              <span class="value">{product.seller.memberSince}</span>
            </div>
            <div class="stat">
              <span class="label">Response rate:</span>
              <span class="value">{product.seller.responseRate}</span>
            </div>
            <div class="stat">
              <span class="label">Response time:</span>
              <span class="value">{product.seller.responseTime}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="message-button" on:click={handleMessage}>
          Message Seller
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .product-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    margin-top: 64px; /* Add margin to account for fixed navbar */
  }

  .product-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .product-gallery {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .main-image {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 0.5rem;
    overflow: hidden;
    background: #f3f4f6;
  }

  .main-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumbnail-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .thumbnail {
    aspect-ratio: 1;
    border-radius: 0.25rem;
    overflow: hidden;
    cursor: pointer;
    background: #f3f4f6;
  }

  .thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumbnail:hover {
    opacity: 0.8;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .save-button {
    padding: 0.5rem 1rem;
    border: 1px solid #2563eb;
    border-radius: 0.5rem;
    background: white;
    color: #2563eb;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-button:hover {
    background: #f8fafc;
  }

  .save-button.active {
    background: #2563eb;
    color: white;
  }

  .price-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
  }

  .price, .condition {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .label {
    color: #4b5563;
  }

  .amount {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
  }

  .location-info {
    display: flex;
    justify-content: space-between;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .description {
    padding: 1rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
  }

  .description h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .specifications {
    padding: 1rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
  }

  .specifications h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .specs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .spec-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .spec-item .label {
    text-transform: capitalize;
    font-size: 0.875rem;
  }

  .spec-item .value {
    font-weight: 500;
    color: #1f2937;
  }

  .seller-info {
    padding: 1rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
  }

  .seller-info h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .seller-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .seller-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .seller-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat .label {
    font-size: 0.875rem;
  }

  .stat .value {
    font-weight: 500;
    color: #1f2937;
  }

  .actions {
    display: flex;
    gap: 1rem;
  }

  .message-button {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    background: #2563eb;
    color: white;
    border: none;
  }

  .message-button:hover {
    background: #1d4ed8;
  }

  @media (max-width: 768px) {
    .product-container {
      padding: 1rem;
      margin-top: 56px; /* Smaller margin for mobile navbar */
    }

    .product-details {
      grid-template-columns: 1fr;
    }

    .thumbnail-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .specs-grid {
      grid-template-columns: 1fr;
    }

    .seller-stats {
      grid-template-columns: 1fr;
    }
  }
</style> 