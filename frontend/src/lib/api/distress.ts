import { apiRequest } from './base';

export interface DistressSale {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number; // Temporarily optional
  discountPercentage?: number; // Temporarily optional
  urgencyLevel?: 'low' | 'medium' | 'high' | 'urgent'; // Temporarily optional
  distressReason?: string;
  distressExpiryDate?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  condition: string;
  location: string;
  images: string[];
  views: number;
  saves: number;
  isAvailable: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    fullName: string;
    location?: string;
    email: string;
    accountType: string;
    profilePicture?: string;
  };
}

export interface DistressSaleFilters {
  page?: number;
  limit?: number;
  urgencyLevel?: string;
  maxDiscount?: number;
  minDiscount?: number;
  category?: string;
  location?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface DistressSaleResponse {
  success: boolean;
  data: DistressSale[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface DistressSaleStats {
  success: boolean;
  data: {
    totalDistressSales: number;
    averageDiscount: number;
    totalViews: number;
    totalSaves: number;
    urgencyLevelDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
    locationDistribution: Record<string, number>;
  };
}

// Get all distress sales with optional filters
export async function getDistressSales(filters: DistressSaleFilters = {}): Promise<DistressSaleResponse> {
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const endpoint = `/distress-sales/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return apiRequest(endpoint);
}

// Get distress sale by ID
export async function getDistressSaleById(id: string): Promise<{ success: boolean; data: DistressSale }> {
  return apiRequest(`/distress-sales/${id}`);
}

// Get distress sale statistics
export async function getDistressSaleStats(): Promise<DistressSaleStats> {
  return apiRequest('/distress-sales/stats');
}

// Create a new distress sale (requires authentication)
export async function createDistressSale(data: FormData): Promise<{ success: boolean; data: DistressSale }> {
  return apiRequest('/distress-sales/create', {
    method: 'POST',
    body: data,
    headers: {
      // Don't set Content-Type for FormData, let the browser set it
    },
  });
}

// Update a distress sale (requires authentication)
export async function updateDistressSale(id: string, data: Partial<DistressSale>): Promise<{ success: boolean; data: DistressSale }> {
  return apiRequest(`/distress-sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Delete a distress sale (requires authentication)
export async function deleteDistressSale(id: string): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/distress-sales/${id}`, {
    method: 'DELETE',
  });
}

// Convert a regular product to distress sale (requires authentication)
export async function convertToDistressSale(id: string, data: {
  originalPrice: number;
  discountPercentage: number;
  urgencyLevel?: string;
  distressReason?: string;
  distressExpiryDate?: string;
}): Promise<{ success: boolean; data: DistressSale }> {
  return apiRequest(`/distress-sales/${id}/convert`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
