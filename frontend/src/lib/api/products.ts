// Products API functions
import { apiRequest } from './base';

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  brand?: string;
  category: string;
  subcategory?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  location: string;
  images: string[];
  views: number;
  saves: number;
  isAvailable: boolean;
  status: 'active' | 'inactive' | 'sold';
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: string;
    businessName: string;
    businessDescription?: string;
    verificationStatus: string;
  };
  isSaved?: boolean;
  isFollowingSeller?: boolean;
}

export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  currency: string;
  brand?: string;
  category: string;
  subcategory?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  location: string;
  images?: File[];
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  subcategories?: ProductCategory[];
}

// Get products with filtering and pagination
export async function getProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  brand?: string;
  location?: string;
  sortBy?: 'price' | 'createdAt' | 'views' | 'saves';
  sortOrder?: 'ASC' | 'DESC';
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/products?${searchParams.toString()}`);
}

// Get a specific product
export async function getProduct(productId: string) {
  return apiRequest(`/product/${productId}`);
}

// Create a new product (seller only)
export async function createProduct(productData: CreateProductData) {
  const formData = new FormData();
  
  // Add text fields
  Object.entries(productData).forEach(([key, value]) => {
    if (key !== 'images' && value !== undefined) {
      formData.append(key, value.toString());
    }
  });
  
  // Add image files
  if (productData.images) {
    productData.images.forEach((file) => {
      formData.append('images', file);
    });
  }
  
  return apiRequest('/products', {
    method: 'POST',
    body: formData,
    headers: {
      // Remove Content-Type to let browser set it with boundary for FormData
    },
  });
}

// Update a product (seller only)
export async function updateProduct(productId: string, productData: Partial<CreateProductData>) {
  const formData = new FormData();
  
  // Add text fields
  Object.entries(productData).forEach(([key, value]) => {
    if (key !== 'images' && value !== undefined) {
      formData.append(key, value.toString());
    }
  });
  
  // Add image files
  if (productData.images) {
    productData.images.forEach((file) => {
      formData.append('images', file);
    });
  }
  
  return apiRequest(`/products/${productId}`, {
    method: 'PUT',
    body: formData,
    headers: {
      // Remove Content-Type to let browser set it with boundary for FormData
    },
  });
}

// Delete a product (soft delete, seller only)
export async function deleteProduct(productId: string) {
  return apiRequest(`/products/${productId}`, {
    method: 'DELETE',
  });
}

// Toggle save on a product
export async function toggleSaveProduct(productId: string) {
  return apiRequest(`/products/${productId}/save`, {
    method: 'POST',
  });
}

// Get saved products
export async function getSavedProducts(params?: {
  page?: number;
  limit?: number;
  collectionName?: string;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/saved-products?${searchParams.toString()}`);
}

// Get product categories
export async function getCategories() {
  return apiRequest('/categories');
}

// Get seller's products
export async function getSellerProducts(sellerId: string, params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/products/seller/${sellerId}?${searchParams.toString()}`);
} 