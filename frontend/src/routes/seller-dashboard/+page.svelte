<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let seller: any = null;
  let products: any[] = [];
  let orders: any[] = [];
  let stats: any = {};
  let isLoading = true;
  let activeTab = 'overview';
  
  onMount(async () => {
    await loadSellerData();
  });
  
  async function loadSellerData() {
    try {
      const [sellerRes, productsRes, ordersRes, statsRes] = await Promise.all([
        fetch('/api/seller/profile'),
        fetch('/api/seller/products'),
        fetch('/api/seller/orders'),
        fetch('/api/seller/stats')
      ]);
      
      if (sellerRes.ok) seller = await sellerRes.json();
      if (productsRes.ok) products = await productsRes.json();
      if (ordersRes.ok) orders = await ordersRes.json();
      if (statsRes.ok) stats = await statsRes.json();
    } catch (error) {
      console.error('Failed to load seller data:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Seller Dashboard - Ocean App</title>
</svelte:head>

<div class="seller-dashboard">
  <div class="container">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Seller Dashboard</h1>
        <p>Welcome back, {seller?.businessName || 'Seller'}!</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" on:click={() => goto('/products/create')}>
          + Add Product
        </button>
        <button class="btn btn-secondary" on:click={() => goto('/seller-registration')}>
          Update Profile
        </button>
      </div>
    </header>
    
    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <h3>Total Products</h3>
          <p class="stat-value">{stats.totalProducts || 0}</p>
          <span class="stat-change">+{stats.newProductsThisMonth || 0} this month</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🛒</div>
        <div class="stat-content">
          <h3>Total Orders</h3>
          <p class="stat-value">{stats.totalOrders || 0}</p>
          <span class="stat-change">+{stats.newOrdersThisMonth || 0} this month</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <h3>Revenue</h3>
          <p class="stat-value">{formatCurrency(stats.totalRevenue || 0)}</p>
          <span class="stat-change">+{formatCurrency(stats.revenueThisMonth || 0)} this month</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-content">
          <h3>Rating</h3>
          <p class="stat-value">{stats.averageRating || 'N/A'}</p>
          <span class="stat-change">{stats.totalReviews || 0} reviews</span>
        </div>
      </div>
    </div>
    
    <!-- Tabs -->
    <div class="dashboard-tabs">
      <button 
        class="tab-btn {activeTab === 'overview' ? 'active' : ''}"
        on:click={() => activeTab = 'overview'}
      >
        Overview
      </button>
      <button 
        class="tab-btn {activeTab === 'products' ? 'active' : ''}"
        on:click={() => activeTab = 'products'}
      >
        Products ({products.length})
      </button>
      <button 
        class="tab-btn {activeTab === 'orders' ? 'active' : ''}"
        on:click={() => activeTab = 'orders'}
      >
        Orders ({orders.length})
      </button>
      <button 
        class="tab-btn {activeTab === 'analytics' ? 'active' : ''}"
        on:click={() => activeTab = 'analytics'}
      >
        Analytics
      </button>
    </div>
    
    <!-- Tab Content -->
    <div class="tab-content">
      {#if activeTab === 'overview'}
        <div class="overview-tab">
          <div class="overview-grid">
            <div class="overview-card">
              <h3>Recent Orders</h3>
              <div class="recent-orders">
                {#each orders.slice(0, 5) as order}
                  <div class="order-item">
                    <div class="order-info">
                      <p class="order-id">#{order.id}</p>
                      <p class="order-customer">{order.customerName}</p>
                    </div>
                    <div class="order-status">
                      <span class="status-badge {order.status}">{order.status}</span>
                      <p class="order-date">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
            
            <div class="overview-card">
              <h3>Top Products</h3>
              <div class="top-products">
                {#each products.slice(0, 5) as product}
                  <div class="product-item">
                    <img src={product.images?.[0] || '/default-product.png'} alt={product.title} />
                    <div class="product-info">
                      <h4>{product.title}</h4>
                      <p class="product-price">{formatCurrency(product.price)}</p>
                      <p class="product-sales">{product.sales || 0} sold</p>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      {#if activeTab === 'products'}
        <div class="products-tab">
          <div class="products-header">
            <h3>Your Products</h3>
            <button class="btn btn-primary" on:click={() => goto('/products/create')}>
              + Add New Product
            </button>
          </div>
          
          <div class="products-grid">
            {#each products as product}
              <div class="product-card">
                <img src={product.images?.[0] || '/default-product.png'} alt={product.title} />
                <div class="product-content">
                  <h4>{product.title}</h4>
                  <p class="product-price">{formatCurrency(product.price)}</p>
                  <p class="product-status {product.status}">{product.status}</p>
                  <div class="product-actions">
                    <button class="btn btn-small" on:click={() => goto(`/products/${product.id}/edit`)}>
                      Edit
                    </button>
                    <button class="btn btn-small btn-danger">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      {#if activeTab === 'orders'}
        <div class="orders-tab">
          <div class="orders-header">
            <h3>Recent Orders</h3>
            <div class="order-filters">
              <select>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div class="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each orders as order}
                  <tr>
                    <td>#{order.id}</td>
                    <td>{order.customerName}</td>
                    <td>{order.items?.length || 0} items</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <span class="status-badge {order.status}">{order.status}</span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <button class="btn btn-small">View</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
      
      {#if activeTab === 'analytics'}
        <div class="analytics-tab">
          <div class="analytics-grid">
            <div class="analytics-card">
              <h3>Sales Overview</h3>
              <div class="chart-placeholder">
                <p>Sales chart will be displayed here</p>
              </div>
            </div>
            
            <div class="analytics-card">
              <h3>Top Categories</h3>
              <div class="chart-placeholder">
                <p>Category performance chart will be displayed here</p>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .seller-dashboard {
    min-height: 100vh;
    background: #f8fafc;
    padding: 2rem 0;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .header-content h1 {
    font-size: 2rem;
    color: #1e293b;
    margin-bottom: 0.5rem;
    font-weight: 700;
  }
  
  .header-content p {
    color: #64748b;
    margin: 0;
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
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
  
  .btn-small {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }
  
  .btn-danger {
    background: #ef4444;
    color: white;
  }
  
  .btn-danger:hover {
    background: #dc2626;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .stat-icon {
    font-size: 2rem;
    width: 60px;
    height: 60px;
    background: #f1f5f9;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .stat-content h3 {
    margin: 0 0 0.5rem 0;
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .stat-value {
    margin: 0 0 0.25rem 0;
    color: #1e293b;
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .stat-change {
    color: #10b981;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .dashboard-tabs {
    display: flex;
    background: white;
    border-radius: 12px;
    padding: 0.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
  }
  
  .tab-btn {
    background: none;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    color: #64748b;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .tab-btn.active {
    background: #667eea;
    color: white;
  }
  
  .tab-btn:hover:not(.active) {
    background: #f1f5f9;
  }
  
  .tab-content {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .overview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  
  .overview-card h3 {
    margin: 0 0 1.5rem 0;
    color: #1e293b;
    font-size: 1.25rem;
  }
  
  .order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .order-item:last-child {
    border-bottom: none;
  }
  
  .order-id {
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.25rem 0;
  }
  
  .order-customer {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }
  
  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
  }
  
  .status-badge.pending {
    background: #fef3c7;
    color: #d97706;
  }
  
  .status-badge.processing {
    background: #dbeafe;
    color: #2563eb;
  }
  
  .status-badge.shipped {
    background: #d1fae5;
    color: #059669;
  }
  
  .status-badge.delivered {
    background: #dcfce7;
    color: #16a34a;
  }
  
  .status-badge.cancelled {
    background: #fee2e2;
    color: #dc2626;
  }
  
  .order-date {
    color: #64748b;
    font-size: 0.75rem;
    margin: 0.25rem 0 0 0;
  }
  
  .product-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .product-item:last-child {
    border-bottom: none;
  }
  
  .product-item img {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    object-fit: cover;
  }
  
  .product-info h4 {
    margin: 0 0 0.25rem 0;
    color: #1e293b;
    font-size: 0.875rem;
  }
  
  .product-price {
    margin: 0 0 0.25rem 0;
    color: #667eea;
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .product-sales {
    margin: 0;
    color: #64748b;
    font-size: 0.75rem;
  }
  
  .products-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .products-header h3 {
    margin: 0;
    color: #1e293b;
    font-size: 1.5rem;
  }
  
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .product-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .product-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  .product-content {
    padding: 1rem;
  }
  
  .product-content h4 {
    margin: 0 0 0.5rem 0;
    color: #1e293b;
    font-size: 1rem;
  }
  
  .product-price {
    margin: 0 0 0.5rem 0;
    color: #667eea;
    font-weight: 600;
    font-size: 1.125rem;
  }
  
  .product-status {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  .product-status.active {
    color: #10b981;
  }
  
  .product-status.inactive {
    color: #ef4444;
  }
  
  .product-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .orders-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .orders-header h3 {
    margin: 0;
    color: #1e293b;
    font-size: 1.5rem;
  }
  
  .order-filters select {
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: white;
  }
  
  .orders-table {
    overflow-x: auto;
  }
  
  .orders-table table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .orders-table th,
  .orders-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .orders-table th {
    background: #f8fafc;
    font-weight: 600;
    color: #475569;
  }
  
  .analytics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  
  .analytics-card h3 {
    margin: 0 0 1.5rem 0;
    color: #1e293b;
    font-size: 1.25rem;
  }
  
  .chart-placeholder {
    background: #f8fafc;
    border: 2px dashed #e2e8f0;
    border-radius: 8px;
    padding: 3rem;
    text-align: center;
    color: #64748b;
  }
  
  @media (max-width: 768px) {
    .dashboard-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    
    .header-actions {
      flex-direction: column;
      width: 100%;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .overview-grid {
      grid-template-columns: 1fr;
    }
    
    .analytics-grid {
      grid-template-columns: 1fr;
    }
    
    .dashboard-tabs {
      flex-wrap: wrap;
    }
    
    .products-grid {
      grid-template-columns: 1fr;
    }
    
    .orders-table {
      font-size: 0.875rem;
    }
  }
</style>

